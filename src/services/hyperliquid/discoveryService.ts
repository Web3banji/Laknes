/**
 * Hyperliquid Market Discovery Service
 *
 * Real-time background engine that:
 * 1. Synchronizes the complete market universe on startup.
 * 2. Continuously monitors for new token listings via WebSocket & REST reconciliation.
 * 3. Records first_seen_on_hyperliquid detection timestamps.
 * 4. Emits NEW_HYPERLIQUID_MARKET events for newly detected listings.
 * 5. Streams live price and orderbook updates with auto-reconnection and heartbeat.
 */

import {
  HyperliquidMarket,
  HyperliquidConnectionStatus,
  NewHyperliquidMarketEvent,
  HyperliquidOrderbook,
  RawSpotToken,
} from './types';
import { hyperliquidStorage } from './storage';
import { fetchSpotMetaAndAssetCtxs, fetchPerpMetaAndAssetCtxs, fetchL2Book } from './api';

const HL_WS_URL = 'wss://api.hyperliquid.xyz/ws';
const RECONCILIATION_INTERVAL_MS = 30000; // 30s periodic REST reconciliation
const HEARTBEAT_INTERVAL_MS = 30000; // 30s WebSocket ping
const RECONNECT_BASE_DELAY_MS = 1000;
const RECONNECT_MAX_DELAY_MS = 15000;

export class HyperliquidDiscoveryService {
  private ws: WebSocket | null = null;
  private status: HyperliquidConnectionStatus = 'disconnected';
  private reconnectAttempt = 0;
  private reconnectTimer: any = null;
  private heartbeatTimer: any = null;
  private reconciliationTimer: any = null;
  private isReconciling = false;

  // Active markets memory index
  private markets: Map<string, HyperliquidMarket> = new Map();

  // Active L2Book subscribers: coin -> Set of callbacks
  private l2Subscribers: Map<string, Set<(book: HyperliquidOrderbook) => void>> = new Map();

  // Event listeners
  private newListingListeners: Set<(event: NewHyperliquidMarketEvent) => void> = new Set();
  private marketsUpdatedListeners: Set<(markets: HyperliquidMarket[]) => void> = new Set();
  private statusListeners: Set<(status: HyperliquidConnectionStatus) => void> = new Set();

  constructor() {
    // Load previously known markets from persistent storage
    this.markets = hyperliquidStorage.loadKnownMarkets();
  }

  /**
   * Start the discovery service: startup sync + WebSocket + recurring reconciliation.
   */
  public async start(): Promise<void> {
    // 1. Initial startup synchronization
    await this.performReconciliation(true);

    // 2. Connect real-time WebSocket
    this.connectWebSocket();

    // 3. Start background reconciliation loop
    if (this.reconciliationTimer) {
      clearInterval(this.reconciliationTimer);
    }
    this.reconciliationTimer = setInterval(() => {
      this.performReconciliation(false);
    }, RECONCILIATION_INTERVAL_MS);
  }

  /**
   * Stop service cleanly
   */
  public stop(): void {
    if (this.reconciliationTimer) {
      clearInterval(this.reconciliationTimer);
      this.reconciliationTimer = null;
    }
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.setStatus('disconnected');
  }

  /**
   * Current connection status
   */
  public getStatus(): HyperliquidConnectionStatus {
    return this.status;
  }

  /**
   * Get all tracked markets
   */
  public getAllMarkets(): HyperliquidMarket[] {
    return Array.from(this.markets.values());
  }

  /**
   * Get newly discovered markets, sorted newest first
   */
  public getNewListings(): HyperliquidMarket[] {
    const all = Array.from(this.markets.values());
    // Filter non-historical or sort all by first_detected_at descending
    const genuineNew = all.filter((m) => !m.is_historical);
    if (genuineNew.length > 0) {
      return genuineNew.sort((a, b) => b.first_detected_at - a.first_detected_at);
    }

    // Baseline fallback: return newest known markets sorted by last detection
    return all.sort((a, b) => b.first_detected_at - a.first_detected_at);
  }

  /**
   * Get a specific market by id
   */
  public getMarket(id: string): HyperliquidMarket | undefined {
    return this.markets.get(id);
  }

  /**
   * Manual force-refresh
   */
  public async refreshNow(): Promise<void> {
    await this.performReconciliation(false);
  }

  // ==========================================
  // EVENT SUBSCRIPTIONS
  // ==========================================

  public onNewListing(listener: (event: NewHyperliquidMarketEvent) => void): () => void {
    this.newListingListeners.add(listener);
    return () => this.newListingListeners.delete(listener);
  }

  public onMarketsUpdated(listener: (markets: HyperliquidMarket[]) => void): () => void {
    this.marketsUpdatedListeners.add(listener);
    return () => this.marketsUpdatedListeners.delete(listener);
  }

  public onStatusChange(listener: (status: HyperliquidConnectionStatus) => void): () => void {
    this.statusListeners.add(listener);
    listener(this.status);
    return () => this.statusListeners.delete(listener);
  }

  public subscribeL2Book(
    coin: string,
    callback: (book: HyperliquidOrderbook) => void
  ): () => void {
    if (!this.l2Subscribers.has(coin)) {
      this.l2Subscribers.set(coin, new Set());
      // Subscribe on WS if connected
      this.sendWsMessage({
        method: 'subscribe',
        subscription: { type: 'l2Book', coin },
      });
      // Initial REST fetch for instant display
      fetchL2Book(coin).then((book) => {
        if (book) callback(book);
      });
    }

    this.l2Subscribers.get(coin)!.add(callback);

    return () => {
      const set = this.l2Subscribers.get(coin);
      if (set) {
        set.delete(callback);
        if (set.size === 0) {
          this.l2Subscribers.delete(coin);
          this.sendWsMessage({
            method: 'unsubscribe',
            subscription: { type: 'l2Book', coin },
          });
        }
      }
    };
  }

  // ==========================================
  // WEBSOCKET MANAGEMENT
  // ==========================================

  private connectWebSocket(): void {
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }

    this.setStatus(this.reconnectAttempt > 0 ? 'reconnecting' : 'connecting');

    try {
      this.ws = new WebSocket(HL_WS_URL);

      this.ws.onopen = () => {
        this.setStatus('connected');
        this.reconnectAttempt = 0;

        // Subscribe to all mids for real-time prices
        this.sendWsMessage({
          method: 'subscribe',
          subscription: { type: 'allMids' },
        });

        // Re-subscribe any active L2 book subscribers
        for (const coin of this.l2Subscribers.keys()) {
          this.sendWsMessage({
            method: 'subscribe',
            subscription: { type: 'l2Book', coin },
          });
        }

        // Start heartbeat
        this.startHeartbeat();
      };

      this.ws.onmessage = (event: MessageEvent) => {
        this.handleWsMessage(event.data);
      };

      this.ws.onerror = (err) => {
        console.warn('[HyperliquidWS] WebSocket error:', err);
      };

      this.ws.onclose = () => {
        this.stopHeartbeat();
        this.setStatus('disconnected');
        this.scheduleReconnect();
      };
    } catch (err) {
      console.warn('[HyperliquidWS] Connection initiation failed:', err);
      this.scheduleReconnect();
    }
  }

  private handleWsMessage(raw: any): void {
    try {
      const msg = JSON.parse(raw);
      if (!msg) return;

      // Handle allMids
      if (msg.channel === 'allMids' && msg.data?.mids) {
        this.applyAllMidsUpdate(msg.data.mids);
      }

      // Handle l2Book
      if (msg.channel === 'l2Book' && msg.data) {
        this.applyL2BookUpdate(msg.data);
      }
    } catch {}
  }

  private applyAllMidsUpdate(mids: Record<string, string>): void {
    let hasChanges = false;
    const now = Date.now();

    for (const [coin, pxStr] of Object.entries(mids)) {
      const px = parseFloat(pxStr);
      if (isNaN(px)) continue;

      // Check perps
      const perpId = `hl-perp-${coin}`;
      const perp = this.markets.get(perpId);
      if (perp && perp.current_price !== px) {
        perp.current_price = px;
        perp.last_seen_at = now;
        if (perp.prev_day_price && perp.prev_day_price > 0) {
          perp.price_change_24h = ((px - perp.prev_day_price) / perp.prev_day_price) * 100;
        }
        hasChanges = true;
      }

      // Check spot (some coins are keyed by index like '@1' or token name)
      for (const m of this.markets.values()) {
        if (m.market_type === 'spot' && (m.baseToken === coin || m.market_id === coin || m.symbol === coin)) {
          if (m.current_price !== px) {
            m.current_price = px;
            m.last_seen_at = now;
            if (m.prev_day_price && m.prev_day_price > 0) {
              m.price_change_24h = ((px - m.prev_day_price) / m.prev_day_price) * 100;
            }
            hasChanges = true;
          }
        }
      }
    }

    if (hasChanges) {
      this.notifyMarketsUpdated();
    }
  }

  private applyL2BookUpdate(data: any): void {
    const coin = data.coin;
    const callbacks = this.l2Subscribers.get(coin);
    if (!callbacks || callbacks.size === 0) return;

    const bids = (data.levels?.[0] || []).map((lvl: any) => ({
      px: parseFloat(lvl.px),
      sz: parseFloat(lvl.sz),
      n: lvl.n || 1,
    }));

    const asks = (data.levels?.[1] || []).map((lvl: any) => ({
      px: parseFloat(lvl.px),
      sz: parseFloat(lvl.sz),
      n: lvl.n || 1,
    }));

    const book: HyperliquidOrderbook = {
      coin,
      bids,
      asks,
      time: data.time || Date.now(),
    };

    callbacks.forEach((cb) => cb(book));
  }

  private sendWsMessage(msg: Record<string, any>): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      try {
        this.ws.send(JSON.stringify(msg));
      } catch (err) {
        console.warn('[HyperliquidWS] Failed to send WS message:', err);
      }
    }
  }

  private startHeartbeat(): void {
    this.stopHeartbeat();
    this.heartbeatTimer = setInterval(() => {
      this.sendWsMessage({ method: 'ping' });
    }, HEARTBEAT_INTERVAL_MS);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimer) return;

    this.reconnectAttempt++;
    const delay = Math.min(
      RECONNECT_BASE_DELAY_MS * Math.pow(1.5, this.reconnectAttempt - 1),
      RECONNECT_MAX_DELAY_MS
    );

    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connectWebSocket();
    }, delay);
  }

  private setStatus(status: HyperliquidConnectionStatus): void {
    if (this.status !== status) {
      this.status = status;
      this.statusListeners.forEach((l) => l(status));
    }
  }

  // ==========================================
  // REST RECONCILIATION & MARKET DETECTION
  // ==========================================

  private async performReconciliation(isInitialStartup = false): Promise<void> {
    if (this.isReconciling) return;
    this.isReconciling = true;

    try {
      const isInitialSyncDone = hyperliquidStorage.hasInitialSyncCompleted();
      const detectedAtNow = Date.now();
      const detectedIsoNow = new Date(detectedAtNow).toISOString();

      // Parallel fetch spot & perp market universe
      const [spotResult, perpResult] = await Promise.allSettled([
        fetchSpotMetaAndAssetCtxs(),
        fetchPerpMetaAndAssetCtxs(),
      ]);

      const newlyDiscoveredMarkets: HyperliquidMarket[] = [];
      const updatedMarkets: HyperliquidMarket[] = [];

      // 1. Process Spot Markets
      if (spotResult.status === 'fulfilled') {
        const [spotMeta, spotCtxs] = spotResult.value;
        const tokensMap = new Map<number, RawSpotToken>();
        for (const t of spotMeta.tokens) {
          tokensMap.set(t.index, t);
        }

        // Map asset context by universe item index / name
        const ctxMap = new Map<string, any>();
        for (const ctx of spotCtxs) {
          if (ctx.coin) {
            ctxMap.set(ctx.coin, ctx);
          }
        }

        for (let idx = 0; idx < spotMeta.universe.length; idx++) {
          const u = spotMeta.universe[idx];
          const baseToken = tokensMap.get(u.tokens[0]);
          const quoteToken = tokensMap.get(u.tokens[1]);

          const baseName = baseToken?.name || `TOKEN_${u.tokens[0]}`;
          const quoteName = quoteToken?.name || 'USDC';
          const displaySymbol = `${baseName}/${quoteName}`;
          const id = `hl-spot-${baseName}`;

          const ctx = ctxMap.get(u.name) || spotCtxs[idx];
          const markPx = ctx?.markPx ? parseFloat(ctx.markPx) : undefined;
          const midPx = ctx?.midPx ? parseFloat(ctx.midPx) : markPx;
          const prevDayPx = ctx?.prevDayPx ? parseFloat(ctx.prevDayPx) : undefined;
          const volume24h = ctx?.dayNtlVlm ? parseFloat(ctx.dayNtlVlm) : undefined;

          let priceChange24h: number | undefined;
          if (midPx !== undefined && prevDayPx !== undefined && prevDayPx > 0) {
            priceChange24h = ((midPx - prevDayPx) / prevDayPx) * 100;
          }

          const existing = this.markets.get(id);

          if (!existing) {
            // MARKET NOT PREVIOUSLY KNOWN
            const isHistorical = !isInitialSyncDone;

            const newMarket: HyperliquidMarket = {
              id,
              symbol: displaySymbol,
              baseToken: baseName,
              quoteToken: quoteName,
              market_id: u.index,
              market_type: 'spot',
              first_seen_on_hyperliquid: detectedIsoNow,
              first_detected_at: detectedAtNow,
              last_seen_at: detectedAtNow,
              is_historical: isHistorical,
              current_price: midPx,
              volume_24h: volume24h,
              price_change_24h: priceChange24h,
              prev_day_price: prevDayPx,
              status: 'active',
              szDecimals: baseToken?.szDecimals,
              tokenId: baseToken?.tokenId,
              contractAddress: baseToken?.evmContract?.address,
              raw_metadata: { universe: u, token: baseToken },
            };

            this.markets.set(id, newMarket);
            newlyDiscoveredMarkets.push(newMarket);

            // If system was already initialized, this is a genuine live NEW LISTING!
            if (isInitialSyncDone) {
              this.emitNewListingEvent(newMarket);
            }
          } else {
            // Update live metrics on existing market
            let changed = false;
            if (midPx !== undefined && existing.current_price !== midPx) {
              existing.current_price = midPx;
              changed = true;
            }
            if (volume24h !== undefined && existing.volume_24h !== volume24h) {
              existing.volume_24h = volume24h;
              changed = true;
            }
            if (priceChange24h !== undefined && existing.price_change_24h !== priceChange24h) {
              existing.price_change_24h = priceChange24h;
              changed = true;
            }
            existing.last_seen_at = detectedAtNow;
            if (changed) {
              updatedMarkets.push(existing);
            }
          }
        }
      }

      // 2. Process Perpetual Markets
      if (perpResult.status === 'fulfilled') {
        const [perpMeta, perpCtxs] = perpResult.value;

        for (let idx = 0; idx < perpMeta.universe.length; idx++) {
          const u = perpMeta.universe[idx];
          const ctx = perpCtxs[idx];

          const coin = u.name;
          const id = `hl-perp-${coin}`;

          const markPx = ctx?.markPx ? parseFloat(ctx.markPx) : undefined;
          const midPx = ctx?.midPx ? parseFloat(ctx.midPx) : markPx;
          const prevDayPx = ctx?.prevDayPx ? parseFloat(ctx.prevDayPx) : undefined;
          const volume24h = ctx?.dayNtlVlm ? parseFloat(ctx.dayNtlVlm) : undefined;
          const fundingRate = ctx?.funding ? parseFloat(ctx.funding) : undefined;
          const oraclePrice = ctx?.oraclePx ? parseFloat(ctx.oraclePx) : undefined;

          // Open interest in USD = base OI * price
          let openInterest: number | undefined;
          if (ctx?.openInterest && midPx) {
            openInterest = parseFloat(ctx.openInterest) * midPx;
          }

          let priceChange24h: number | undefined;
          if (midPx !== undefined && prevDayPx !== undefined && prevDayPx > 0) {
            priceChange24h = ((midPx - prevDayPx) / prevDayPx) * 100;
          }

          const existing = this.markets.get(id);

          if (!existing) {
            // MARKET NOT PREVIOUSLY KNOWN
            const isHistorical = !isInitialSyncDone;

            const newMarket: HyperliquidMarket = {
              id,
              symbol: coin,
              baseToken: coin,
              quoteToken: 'USDC',
              market_id: idx,
              market_type: 'perp',
              first_seen_on_hyperliquid: detectedIsoNow,
              first_detected_at: detectedAtNow,
              last_seen_at: detectedAtNow,
              is_historical: isHistorical,
              current_price: midPx,
              volume_24h: volume24h,
              price_change_24h: priceChange24h,
              prev_day_price: prevDayPx,
              open_interest: openInterest,
              funding_rate: fundingRate,
              oracle_price: oraclePrice,
              status: u.isCloseOnly ? 'close_only' : 'active',
              szDecimals: u.szDecimals,
              maxLeverage: u.maxLeverage,
              raw_metadata: { universe: u },
            };

            this.markets.set(id, newMarket);
            newlyDiscoveredMarkets.push(newMarket);

            // If system was already initialized, this is a genuine live NEW LISTING!
            if (isInitialSyncDone) {
              this.emitNewListingEvent(newMarket);
            }
          } else {
            // Update live metrics on existing market
            let changed = false;
            if (midPx !== undefined && existing.current_price !== midPx) {
              existing.current_price = midPx;
              changed = true;
            }
            if (volume24h !== undefined && existing.volume_24h !== volume24h) {
              existing.volume_24h = volume24h;
              changed = true;
            }
            if (priceChange24h !== undefined && existing.price_change_24h !== priceChange24h) {
              existing.price_change_24h = priceChange24h;
              changed = true;
            }
            if (openInterest !== undefined && existing.open_interest !== openInterest) {
              existing.open_interest = openInterest;
              changed = true;
            }
            if (fundingRate !== undefined && existing.funding_rate !== fundingRate) {
              existing.funding_rate = fundingRate;
              changed = true;
            }
            if (oraclePrice !== undefined && existing.oracle_price !== oraclePrice) {
              existing.oracle_price = oraclePrice;
              changed = true;
            }
            existing.last_seen_at = detectedAtNow;
            if (changed) {
              updatedMarkets.push(existing);
            }
          }
        }
      }

      // Mark initial startup sync as completed if first run
      if (!isInitialSyncDone) {
        hyperliquidStorage.setInitialSyncCompleted();
      }

      // Persist changes
      if (newlyDiscoveredMarkets.length > 0 || updatedMarkets.length > 0) {
        hyperliquidStorage.saveMarkets(Array.from(this.markets.values()));
        this.notifyMarketsUpdated();
      }
    } catch (err) {
      console.warn('[HyperliquidDiscovery] Reconciliation error:', err);
    } finally {
      this.isReconciling = false;
    }
  }

  private emitNewListingEvent(market: HyperliquidMarket): void {
    const event: NewHyperliquidMarketEvent = {
      market_id: String(market.market_id),
      token_symbol: market.symbol,
      market_type: market.market_type,
      first_seen_on_hyperliquid: market.first_seen_on_hyperliquid,
      detection_timestamp: market.first_detected_at,
      initial_market_data: { ...market },
    };

    console.info(
      `[HyperliquidDiscovery] NEW_HYPERLIQUID_MARKET detected: ${market.symbol} (${market.market_type}) at ${market.first_seen_on_hyperliquid}`
    );

    this.newListingListeners.forEach((listener) => {
      try {
        listener(event);
      } catch (err) {
        console.error('[HyperliquidDiscovery] Error in newListingListener:', err);
      }
    });
  }

  private notifyMarketsUpdated(): void {
    const all = Array.from(this.markets.values());
    this.marketsUpdatedListeners.forEach((listener) => {
      try {
        listener(all);
      } catch (err) {
        console.error('[HyperliquidDiscovery] Error in marketsUpdatedListener:', err);
      }
    });
  }
}

// Global service singleton
export const hyperliquidDiscoveryService = new HyperliquidDiscoveryService();
