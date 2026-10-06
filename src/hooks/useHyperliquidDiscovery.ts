import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  HyperliquidMarket,
  HyperliquidConnectionStatus,
  NewHyperliquidMarketEvent,
  HyperliquidOrderbook,
} from '../services/hyperliquid/types';
import { hyperliquidDiscoveryService } from '../services/hyperliquid/discoveryService';

let isServiceStarted = false;

export function useHyperliquidDiscovery() {
  const [markets, setMarkets] = useState<HyperliquidMarket[]>(() =>
    hyperliquidDiscoveryService.getAllMarkets()
  );
  const [status, setStatus] = useState<HyperliquidConnectionStatus>(() =>
    hyperliquidDiscoveryService.getStatus()
  );
  const [recentAlerts, setRecentAlerts] = useState<NewHyperliquidMarketEvent[]>([]);

  useEffect(() => {
    // Start discovery engine on first mount
    if (!isServiceStarted) {
      isServiceStarted = true;
      hyperliquidDiscoveryService.start();
    }

    // Subscribe to updates
    const unsubMarkets = hyperliquidDiscoveryService.onMarketsUpdated((updated) => {
      setMarkets([...updated]);
    });

    const unsubStatus = hyperliquidDiscoveryService.onStatusChange((newStatus) => {
      setStatus(newStatus);
    });

    const unsubNewListing = hyperliquidDiscoveryService.onNewListing((event) => {
      setRecentAlerts((prev) => [event, ...prev.slice(0, 9)]);
    });

    return () => {
      unsubMarkets();
      unsubStatus();
      unsubNewListing();
    };
  }, []);

  const dismissAlert = useCallback((marketId: string) => {
    setRecentAlerts((prev) => prev.filter((a) => a.market_id !== marketId));
  }, []);

  const refresh = useCallback(async () => {
    await hyperliquidDiscoveryService.refreshNow();
    setMarkets(hyperliquidDiscoveryService.getAllMarkets());
  }, []);

  // Filter & sort
  const spotMarkets = useMemo(
    () => markets.filter((m) => m.market_type === 'spot'),
    [markets]
  );

  const perpMarkets = useMemo(
    () => markets.filter((m) => m.market_type === 'perp'),
    [markets]
  );

  // New listings: genuine new (is_historical === false) sorted newest first,
  // or top verified listings ordered by first_detected_at
  const newListings = useMemo(() => {
    const genuine = markets.filter((m) => !m.is_historical);
    if (genuine.length > 0) {
      return genuine.sort((a, b) => b.first_detected_at - a.first_detected_at);
    }
    // Baseline: return markets sorted by first_detected_at
    return [...markets].sort((a, b) => b.first_detected_at - a.first_detected_at);
  }, [markets]);

  return {
    markets,
    spotMarkets,
    perpMarkets,
    newListings,
    status,
    recentAlerts,
    dismissAlert,
    refresh,
  };
}

/**
 * Hook to subscribe to live orderbook for a specific market
 */
export function useHyperliquidOrderbook(coin: string | undefined) {
  const [orderbook, setOrderbook] = useState<HyperliquidOrderbook | null>(null);

  useEffect(() => {
    if (!coin) {
      setOrderbook(null);
      return;
    }

    const unsubscribe = hyperliquidDiscoveryService.subscribeL2Book(coin, (book) => {
      setOrderbook(book);
    });

    return () => {
      unsubscribe();
    };
  }, [coin]);

  return orderbook;
}
