/**
 * Hyperliquid Discovery Service — Types & Interfaces
 *
 * Source of truth: Official Hyperliquid public API
 * REST: https://api.hyperliquid.xyz/info
 * WebSocket: wss://api.hyperliquid.xyz/ws
 */

export type HyperliquidMarketType = 'spot' | 'perp';

export type HyperliquidConnectionStatus =
  | 'connecting'
  | 'connected'
  | 'reconnecting'
  | 'disconnected'
  | 'error';

/**
 * Persistent and unified Hyperliquid market model
 */
export interface HyperliquidMarket {
  /** Unique composite ID, e.g. 'hl-spot-PURR/USDC' or 'hl-perp-BTC' */
  id: string;

  /** Display symbol, e.g. 'PURR/USDC' or 'BTC' */
  symbol: string;

  /** Base token symbol, e.g. 'PURR' or 'BTC' */
  baseToken: string;

  /** Quote token symbol, e.g. 'USDC' (for perps, collateral is USDC) */
  quoteToken: string;

  /** Raw Hyperliquid market identifier / index */
  market_id: string | number;

  /** Market type: Spot or Perpetual */
  market_type: HyperliquidMarketType;

  /**
   * ISO timestamp of when our discovery service first detected the market.
   * Note: This represents first detection time by our system, not token creation time.
   */
  first_seen_on_hyperliquid: string;

  /** Milliseconds timestamp of first detection */
  first_detected_at: number;

  /** Milliseconds timestamp of last detection/update */
  last_seen_at: number;

  /** True if market existed before database initialization (historical baseline) */
  is_historical: boolean;

  /** Current mid/mark price in USD where available */
  current_price?: number;

  /** 24h notional trading volume in USD where available */
  volume_24h?: number;

  /** 24h percentage price change where available */
  price_change_24h?: number;

  /** Open interest (for perps) where available */
  open_interest?: number;

  /** Funding rate per hour (for perps) where available */
  funding_rate?: number;

  /** Oracle price (for perps) where available */
  oracle_price?: number;

  /** Previous day close price where available */
  prev_day_price?: number;

  /** Status, e.g. 'active', 'delisted', 'close_only' */
  status: string;

  /** Size decimals */
  szDecimals?: number;

  /** Max leverage (for perps) */
  maxLeverage?: number;

  /** Token ID or EVM contract address (for spot) */
  tokenId?: string;
  contractAddress?: string;

  /** Raw metadata from Hyperliquid API */
  raw_metadata?: Record<string, any>;
}

/**
 * Event emitted when a new Hyperliquid market is detected
 */
export interface NewHyperliquidMarketEvent {
  market_id: string;
  token_symbol: string;
  market_type: HyperliquidMarketType;
  first_seen_on_hyperliquid: string;
  detection_timestamp: number;
  initial_market_data: Partial<HyperliquidMarket>;
}

/**
 * Orderbook level
 */
export interface OrderbookLevel {
  px: number;
  sz: number;
  n: number;
}

/**
 * Orderbook snapshot
 */
export interface HyperliquidOrderbook {
  coin: string;
  bids: OrderbookLevel[];
  asks: OrderbookLevel[];
  time: number;
}

/**
 * Raw Hyperliquid API Responses
 */
export interface RawSpotToken {
  name: string;
  szDecimals: number;
  weiDecimals: number;
  index: number;
  tokenId: string;
  isCanonical: boolean;
  evmContract?: {
    address: string;
    evm_extra_wei_decimals: number;
  } | null;
  fullName?: string | null;
}

export interface RawSpotUniverseItem {
  tokens: [number, number];
  name: string;
  index: number;
  isCanonical: boolean;
}

export interface RawSpotAssetCtx {
  prevDayPx: string;
  dayNtlVlm: string;
  markPx: string;
  midPx?: string;
  circulatingSupply?: string;
  coin: string;
  totalSupply?: string;
  dayBaseVlm?: string;
}

export interface RawSpotMeta {
  tokens: RawSpotToken[];
  universe: RawSpotUniverseItem[];
}

export interface RawPerpUniverseItem {
  szDecimals: number;
  name: string;
  maxLeverage: number;
  marginTableId?: number;
  onlyIsolated?: boolean;
  isCloseOnly?: boolean;
}

export interface RawPerpAssetCtx {
  funding: string;
  openInterest: string;
  prevDayPx: string;
  dayNtlVlm: string;
  premium?: string;
  oraclePx: string;
  markPx: string;
  midPx?: string;
  impactPxs?: [string, string];
  dayBaseVlm?: string;
}

export interface RawPerpMeta {
  universe: RawPerpUniverseItem[];
  marginTables?: any[];
  collateralToken?: number;
}
