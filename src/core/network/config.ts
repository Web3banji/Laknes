/**
 * Network configuration module.
 * 
 * LAKNES is Elysium-native. This configuration is built with internal extensibility
 * so parameters or sub-components can adapt cleanly, while strictly preserving
 * an Elysium-first identity throughout the interface.
 */

export interface NetworkConfig {
  id: string;
  name: string;
  chainId: number;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
  rpcUrls: readonly string[];
  blockExplorerUrls: readonly string[];
  isTestnet?: boolean;
}

export const ELYSIUM_MAINNET: NetworkConfig = {
  id: 'elysium-mainnet',
  name: 'Elysium',
  chainId: 1339,
  nativeCurrency: {
    name: 'LAVA',
    symbol: 'LAVA',
    decimals: 18,
  },
  rpcUrls: ['https://rpc.elysiumchain.tech'],
  blockExplorerUrls: ['https://explorer.elysiumchain.tech'],
  isTestnet: false,
};

export const ELYSIUM_TESTNET: NetworkConfig = {
  id: 'elysium-testnet',
  name: 'Elysium Testnet',
  chainId: 1338,
  nativeCurrency: {
    name: 'tLAVA',
    symbol: 'tLAVA',
    decimals: 18,
  },
  rpcUrls: ['https://rpc.testnet.elysiumchain.tech'],
  blockExplorerUrls: ['https://explorer.testnet.elysiumchain.tech'],
  isTestnet: true,
};

/**
 * Active network for the platform.
 * Default is Elysium Mainnet.
 */
export const ACTIVE_NETWORK: NetworkConfig = ELYSIUM_MAINNET;

/**
 * Format address safely with standard truncation
 */
export function formatAddress(address: string, leadingChars = 6, trailingChars = 4): string {
  if (!address) return '';
  if (address.length <= leadingChars + trailingChars) return address;
  return `${address.slice(0, leadingChars)}…${address.slice(-trailingChars)}`;
}
