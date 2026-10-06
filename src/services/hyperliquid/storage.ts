/**
 * Hyperliquid Market Persistent Storage
 *
 * Implements persistent database for hyperliquid_markets with
 * deduplication, corruption protection, and historical baseline flags.
 */

import { HyperliquidMarket } from './types';

const STORAGE_KEY_MARKETS = 'hyperliquid_markets_v1';
const STORAGE_KEY_INITIAL_SYNC = 'hyperliquid_initial_sync_v1';

export class HyperliquidStorage {
  private cache: Map<string, HyperliquidMarket> = new Map();
  private isLoaded = false;

  /**
   * Load all previously known Hyperliquid markets from persistent store.
   */
  public loadKnownMarkets(): Map<string, HyperliquidMarket> {
    if (this.isLoaded) {
      return this.cache;
    }

    try {
      const raw = localStorage.getItem(STORAGE_KEY_MARKETS);
      if (raw) {
        const parsed: HyperliquidMarket[] = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          this.cache.clear();
          for (const m of parsed) {
            if (m && m.id) {
              this.cache.set(m.id, m);
            }
          }
        }
      }
    } catch (err) {
      console.warn('[HyperliquidStorage] Failed to read stored markets:', err);
    }

    this.isLoaded = true;
    return this.cache;
  }

  /**
   * Check if the product has already performed its initial startup synchronization.
   */
  public hasInitialSyncCompleted(): boolean {
    try {
      return localStorage.getItem(STORAGE_KEY_INITIAL_SYNC) === 'true';
    } catch {
      return false;
    }
  }

  /**
   * Mark initial startup sync as completed.
   */
  public setInitialSyncCompleted(): void {
    try {
      localStorage.setItem(STORAGE_KEY_INITIAL_SYNC, 'true');
    } catch (err) {
      console.warn('[HyperliquidStorage] Failed to save sync flag:', err);
    }
  }

  /**
   * Save or update a single market in memory and persistent storage.
   */
  public saveMarket(market: HyperliquidMarket): void {
    this.loadKnownMarkets();
    this.cache.set(market.id, market);
    this.persistToDisk();
  }

  /**
   * Batch save or update markets in memory and persistent storage.
   */
  public saveMarkets(markets: HyperliquidMarket[]): void {
    this.loadKnownMarkets();
    for (const m of markets) {
      this.cache.set(m.id, m);
    }
    this.persistToDisk();
  }

  /**
   * Retrieve a specific market by its unique ID.
   */
  public getMarket(id: string): HyperliquidMarket | undefined {
    this.loadKnownMarkets();
    return this.cache.get(id);
  }

  /**
   * Get all cached markets as an array.
   */
  public getAllMarkets(): HyperliquidMarket[] {
    this.loadKnownMarkets();
    return Array.from(this.cache.values());
  }

  /**
   * Persist in-memory cache to disk.
   */
  private persistToDisk(): void {
    try {
      const arr = Array.from(this.cache.values());
      localStorage.setItem(STORAGE_KEY_MARKETS, JSON.stringify(arr));
    } catch (err) {
      console.warn('[HyperliquidStorage] Failed to persist markets:', err);
    }
  }

  /**
   * Clear storage for debugging / fresh test runs.
   */
  public clearStorage(): void {
    this.cache.clear();
    try {
      localStorage.removeItem(STORAGE_KEY_MARKETS);
      localStorage.removeItem(STORAGE_KEY_INITIAL_SYNC);
    } catch {}
  }
}

export const hyperliquidStorage = new HyperliquidStorage();
