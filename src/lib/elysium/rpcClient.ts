import { ELYSIUM_CONFIG, RPC_TIMEOUT_MS, RPC_MAX_RETRIES, CACHE_TTL_MS } from './constants';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const rpcCache = new Map<string, CacheEntry<any>>();

/**
 * Robust JSON-RPC Client for Elysium Mainnet.
 * Features:
 * - Exponential backoff retry handling
 * - AbortController timeout handling (10s)
 * - In-memory cache for read-only RPC responses
 * - Graceful error formatting
 */
export async function elysiumRpcRequest<T = any>(
  method: string,
  params: any[] = [],
  useCache = true
): Promise<T> {
  const cacheKey = `${method}:${JSON.stringify(params)}`;

  if (useCache) {
    const cached = rpcCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      return cached.data as T;
    }
  }

  let attempt = 0;
  let lastError: Error | null = null;

  while (attempt < RPC_MAX_RETRIES) {
    attempt++;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), RPC_TIMEOUT_MS);

    try {
      const response = await fetch(ELYSIUM_CONFIG.rpcUrls[0], {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: Date.now() + Math.floor(Math.random() * 1000),
          method,
          params,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Elysium RPC returned HTTP status ${response.status}`);
      }

      const json = await response.json();

      if (json.error) {
        throw new Error(json.error.message || `RPC Error code ${json.error.code}`);
      }

      const result = json.result;

      if (useCache) {
        rpcCache.set(cacheKey, { data: result, timestamp: Date.now() });
      }

      return result as T;
    } catch (err: any) {
      clearTimeout(timeoutId);
      const isAbort = err.name === 'AbortError';
      lastError = new Error(
        isAbort
          ? `Elysium RPC request timed out after ${RPC_TIMEOUT_MS / 1000}s`
          : err.message || 'Connection to Elysium network failed'
      );

      // Exponential backoff delay before retry
      if (attempt < RPC_MAX_RETRIES) {
        const delay = Math.pow(2, attempt) * 400;
        await new Promise((res) => setTimeout(res, delay));
      }
    }
  }

  throw lastError || new Error('RPC connection failed after multiple retries.');
}

/**
 * Get current block height on Elysium Mainnet
 */
export async function getLatestBlockNumber(): Promise<number> {
  const hex = await elysiumRpcRequest<string>('eth_blockNumber', [], true);
  return parseInt(hex, 16);
}

/**
 * Get native LAVA balance of an address formatted in standard units
 */
export async function getLavaBalance(address: string): Promise<string> {
  if (!address) return '0.0000';
  try {
    const hex = await elysiumRpcRequest<string>('eth_getBalance', [address, 'latest'], false);
    const wei = BigInt(hex || '0x0');
    const balance = Number(wei) / 1e18;
    return balance.toFixed(4);
  } catch {
    return '0.0000';
  }
}

/**
 * Verify whether an address contains deployed bytecode on Elysium Mainnet
 */
export async function isContractDeployed(address: string): Promise<boolean> {
  if (!address) return false;
  try {
    const code = await elysiumRpcRequest<string>('eth_getCode', [address, 'latest'], true);
    return Boolean(code && code !== '0x' && code !== '0x0');
  } catch {
    return false;
  }
}

/**
 * Query transaction receipt from Elysium consensus
 */
export async function getTxReceipt(txHash: string): Promise<any | null> {
  if (!txHash) return null;
  return await elysiumRpcRequest<any | null>('eth_getTransactionReceipt', [txHash], false);
}
