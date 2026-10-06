/**
 * Elysium Blockchain Service Abstraction
 * 
 * Strictly uses verified Elysium Mainnet specifications:
 * - Chain ID: 1339 (Hex: 0x53b)
 * - RPC Endpoint: https://rpc.elysiumchain.tech
 * - Native Currency: LAVA (18 decimals)
 * - Block Explorer: https://explorer.elysiumchain.tech
 * 
 * Never stores or requests seed phrases or private keys.
 * Accurately tracks transaction lifecycle without fake confirmations.
 */

export const ELYSIUM_MAINNET_PARAMS = {
  chainId: '0x53b', // 1339 in hex
  chainIdDecimal: 1339,
  chainName: 'Elysium Mainnet',
  nativeCurrency: {
    name: 'LAVA',
    symbol: 'LAVA',
    decimals: 18,
  },
  rpcUrls: ['https://rpc.elysiumchain.tech'],
  blockExplorerUrls: ['https://explorer.elysiumchain.tech'],
};

export type TransactionLifecycleState =
  | 'idle'
  | 'wallet_request'
  | 'wallet_confirmed'
  | 'submitted'
  | 'confirming'
  | 'confirmed';

export type BlockchainFailureState =
  | 'wallet_rejected'
  | 'network_error'
  | 'transaction_failed'
  | 'verification_failed'
  | null;

export interface TransactionReceipt {
  transactionHash: string;
  blockNumber: number;
  status: boolean; // true = success (1), false = revert (0)
  from: string;
  to: string;
  gasUsed?: string;
}

export interface VerificationResult {
  verified: boolean;
  reason?: string;
  receipt?: TransactionReceipt;
}

class ElysiumProviderService {
  private get ethereum(): any {
    if (typeof window !== 'undefined' && (window as any).ethereum) {
      return (window as any).ethereum;
    }
    return null;
  }

  /**
   * Check if an injected EVM provider is available
   */
  public isProviderAvailable(): boolean {
    return Boolean(this.ethereum);
  }

  /**
   * Connect to user's wallet via standard EIP-1102 / EIP-1193
   */
  public async connectWallet(): Promise<{ address: string; chainId: number }> {
    if (!this.ethereum) {
      throw new Error('No EVM wallet detected. Please install an Elysium-compatible browser wallet (e.g. MetaMask, Rabby).');
    }

    try {
      const accounts: string[] = await this.ethereum.request({
        method: 'eth_requestAccounts',
      });

      if (!accounts || accounts.length === 0) {
        throw new Error('No accounts authorized.');
      }

      const chainIdHex: string = await this.ethereum.request({
        method: 'eth_chainId',
      });
      const chainId = parseInt(chainIdHex, 16);

      return {
        address: accounts[0],
        chainId,
      };
    } catch (err: any) {
      if (err.code === 4001) {
        throw new Error('User rejected the connection request.');
      }
      throw new Error(err.message || 'Failed to connect wallet.');
    }
  }

  /**
   * Retrieve active authorized address
   */
  public async getAddress(): Promise<string | null> {
    if (!this.ethereum) return null;
    try {
      const accounts: string[] = await this.ethereum.request({
        method: 'eth_accounts',
      });
      return accounts && accounts.length > 0 ? accounts[0] : null;
    } catch {
      return null;
    }
  }

  /**
   * Retrieve active connected chain ID
   */
  public async getChain(): Promise<number | null> {
    if (!this.ethereum) return null;
    try {
      const chainIdHex: string = await this.ethereum.request({
        method: 'eth_chainId',
      });
      return parseInt(chainIdHex, 16);
    } catch {
      return null;
    }
  }

  /**
   * Switch connected wallet network to Elysium Mainnet (Chain ID 1339).
   * Automatically adds the chain if it is not yet registered in user wallet.
   */
  public async switchNetwork(): Promise<boolean> {
    if (!this.ethereum) {
      throw new Error('Wallet not available.');
    }

    try {
      await this.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: ELYSIUM_MAINNET_PARAMS.chainId }],
      });
      return true;
    } catch (switchError: any) {
      // 4902 indicates that the chain has not been added to wallet
      if (switchError.code === 4902 || switchError.data?.originalError?.code === 4902) {
        try {
          await this.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [ELYSIUM_MAINNET_PARAMS],
          });
          return true;
        } catch (addError: any) {
          throw new Error('User declined adding Elysium network to wallet.');
        }
      }
      throw switchError;
    }
  }

  /**
   * Read state from an Elysium contract via eth_call
   */
  public async readContract(contractAddress: string, data: string): Promise<string> {
    if (!this.ethereum) {
      // Fallback directly to public JSON-RPC endpoint
      const response = await fetch(ELYSIUM_MAINNET_PARAMS.rpcUrls[0], {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'eth_call',
          params: [{ to: contractAddress, data }, 'latest'],
        }),
      });
      const result = await response.json();
      if (result.error) {
        throw new Error(result.error.message || 'RPC call failed.');
      }
      return result.result;
    }

    return await this.ethereum.request({
      method: 'eth_call',
      params: [{ to: contractAddress, data }, 'latest'],
    });
  }

  /**
   * Query native LAVA balance of an account
   */
  public async getLAVABalance(address: string): Promise<string> {
    const response = await fetch(ELYSIUM_MAINNET_PARAMS.rpcUrls[0], {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'eth_getBalance',
        params: [address, 'latest'],
      }),
    });
    const result = await response.json();
    if (result.result) {
      const balanceWei = BigInt(result.result);
      const balanceEth = Number(balanceWei) / 1e18;
      return balanceEth.toFixed(4);
    }
    return '0.0000';
  }

  /**
   * Send transaction through user wallet with tracked state transitions
   */
  public async sendTransaction(
    tx: { to: string; value?: string; data?: string },
    onStateChange?: (state: TransactionLifecycleState) => void
  ): Promise<string> {
    if (!this.ethereum) {
      throw new Error('No wallet connected.');
    }

    const currentChain = await this.getChain();
    if (currentChain !== ELYSIUM_MAINNET_PARAMS.chainIdDecimal) {
      await this.switchNetwork();
    }

    const from = await this.getAddress();
    if (!from) {
      throw new Error('Account address not found.');
    }

    onStateChange?.('wallet_request');

    try {
      const txHash: string = await this.ethereum.request({
        method: 'eth_sendTransaction',
        params: [
          {
            from,
            to: tx.to,
            value: tx.value || '0x0',
            data: tx.data || '0x',
          },
        ],
      });

      onStateChange?.('wallet_confirmed');
      onStateChange?.('submitted');

      return txHash;
    } catch (err: any) {
      if (err.code === 4001) {
        throw new Error('wallet_rejected');
      }
      throw new Error(err.message || 'transaction_failed');
    }
  }

  /**
   * Verify an on-chain transaction by polling the official Elysium RPC for confirmation
   */
  public async verifyTransaction(
    txHash: string,
    onStateChange?: (state: TransactionLifecycleState) => void,
    maxAttempts = 15,
    intervalMs = 2500
  ): Promise<VerificationResult> {
    onStateChange?.('confirming');

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        const response = await fetch(ELYSIUM_MAINNET_PARAMS.rpcUrls[0], {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jsonrpc: '2.0',
            id: 1,
            method: 'eth_getTransactionReceipt',
            params: [txHash],
          }),
        });

        const data = await response.json();
        const receipt = data.result;

        if (receipt) {
          const isSuccess = receipt.status === '0x1' || receipt.status === 1;
          if (isSuccess) {
            onStateChange?.('confirmed');
            return {
              verified: true,
              receipt: {
                transactionHash: receipt.transactionHash,
                blockNumber: parseInt(receipt.blockNumber, 16),
                status: true,
                from: receipt.from,
                to: receipt.to,
                gasUsed: receipt.gasUsed,
              },
            };
          } else {
            return {
              verified: false,
              reason: 'Transaction reverted on Elysium Mainnet.',
              receipt: {
                transactionHash: receipt.transactionHash,
                blockNumber: parseInt(receipt.blockNumber, 16),
                status: false,
                from: receipt.from,
                to: receipt.to,
              },
            };
          }
        }
      } catch (err: any) {
        // Network polling error; continue trying until timeout
      }

      await new Promise((resolve) => setTimeout(resolve, intervalMs));
    }

    return {
      verified: false,
      reason: 'Transaction confirmation timed out. Check explorer for status.',
    };
  }
}

export const ElysiumProvider = new ElysiumProviderService();
