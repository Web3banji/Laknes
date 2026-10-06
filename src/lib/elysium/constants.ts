/**
 * Elysium Network Verified Technical Specifications
 * 
 * Sources verified against official Elysium documentation:
 * - Chain Name: Elysium Mainnet
 * - Chain ID: 1339 (0x53b)
 * - Native Currency: LAVA (18 decimals)
 * - Official RPC: https://rpc.elysiumchain.tech
 * - Official Blockscout Explorer: https://explorer.elysiumchain.tech
 * - Official Bridge: https://bridge.elysiumchain.tech
 * - Official Docs: https://docs.elysiumchain.tech
 */

export const ELYSIUM_CONFIG = {
  chainIdHex: '0x53b',
  chainIdDecimal: 1339,
  chainName: 'Elysium Mainnet',
  nativeCurrency: {
    name: 'LAVA',
    symbol: 'LAVA',
    decimals: 18,
  },
  rpcUrls: [
    'https://rpc.elysiumchain.tech',
  ],
  blockExplorerUrls: [
    'https://explorer.elysiumchain.tech',
  ],
  documentationUrl: 'https://docs.elysiumchain.tech',
  bridgeUrl: 'https://bridge.elysiumchain.tech',
  contracts: {
    // Official Elysium WETH / Bridge router interfaces can be queried on-chain
  },
} as const;

export const RPC_TIMEOUT_MS = 10000;
export const RPC_MAX_RETRIES = 3;
export const CACHE_TTL_MS = 15000; // 15 seconds cache for read-only RPC calls
