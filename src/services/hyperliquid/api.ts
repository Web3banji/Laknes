/**
 * Hyperliquid Public API Client
 *
 * REST Endpoint: https://api.hyperliquid.xyz/info
 * WebSocket Endpoint: wss://api.hyperliquid.xyz/ws
 */

import {
  RawSpotMeta,
  RawSpotAssetCtx,
  RawPerpMeta,
  RawPerpAssetCtx,
  HyperliquidOrderbook,
} from './types';

const HL_INFO_URL = 'https://api.hyperliquid.xyz/info';
const REQUEST_TIMEOUT_MS = 10000;
const MAX_RETRIES = 2;

async function postInfo<T>(body: Record<string, any>, retries = MAX_RETRIES): Promise<T> {
  let attempt = 0;
  while (attempt <= retries) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      const response = await fetch(HL_INFO_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!response.ok) {
        throw new Error(`Hyperliquid HTTP error ${response.status}: ${response.statusText}`);
      }

      const data = (await response.json()) as T;
      return data;
    } catch (err: any) {
      clearTimeout(timeout);
      attempt++;
      if (attempt > retries) {
        throw new Error(
          `Hyperliquid API request failed (${body.type || 'unknown'}): ${
            err.name === 'AbortError' ? 'Timeout' : err.message
          }`
        );
      }
      // Exponential backoff
      await new Promise((res) => setTimeout(res, 500 * Math.pow(2, attempt - 1)));
    }
  }
  throw new Error('Hyperliquid API request failed after retries');
}

/**
 * Fetch Spot metadata and current asset context (prices, volumes).
 */
export async function fetchSpotMetaAndAssetCtxs(): Promise<[RawSpotMeta, RawSpotAssetCtx[]]> {
  return postInfo<[RawSpotMeta, RawSpotAssetCtx[]]>({ type: 'spotMetaAndAssetCtxs' });
}

/**
 * Fetch Perpetual metadata and asset contexts (OI, funding, oracle, prices).
 */
export async function fetchPerpMetaAndAssetCtxs(): Promise<[RawPerpMeta, RawPerpAssetCtx[]]> {
  return postInfo<[RawPerpMeta, RawPerpAssetCtx[]]>({ type: 'metaAndAssetCtxs' });
}

/**
 * Fetch L2 Orderbook for a given market/coin.
 */
export async function fetchL2Book(coin: string): Promise<HyperliquidOrderbook | null> {
  try {
    const res = await postInfo<any>({ type: 'l2Book', coin });
    if (!res || !res.levels) {
      return null;
    }

    const bids = (res.levels[0] || []).map((lvl: any) => ({
      px: parseFloat(lvl.px),
      sz: parseFloat(lvl.sz),
      n: lvl.n || 1,
    }));

    const asks = (res.levels[1] || []).map((lvl: any) => ({
      px: parseFloat(lvl.px),
      sz: parseFloat(lvl.sz),
      n: lvl.n || 1,
    }));

    return {
      coin: res.coin || coin,
      bids,
      asks,
      time: res.time || Date.now(),
    };
  } catch (err) {
    console.warn(`[HyperliquidAPI] Failed to fetch L2Book for ${coin}:`, err);
    return null;
  }
}
