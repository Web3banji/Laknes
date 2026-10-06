import { useState, useEffect, useCallback } from 'react';
import { ElysiumProvider } from '../core/blockchain/ElysiumProvider';
import { getLatestBlockNumber } from '../lib/elysium/rpcClient';
import { ELYSIUM_CONFIG } from '../lib/elysium/constants';

export interface ElysiumNetworkState {
  isCorrectNetwork: boolean;
  chainId: number | null;
  latestBlock: number | null;
  isRpcHealthy: boolean;
  isChecking: boolean;
  error: string | null;
  switchNetwork: () => Promise<boolean>;
  refresh: () => Promise<void>;
}

export function useElysiumNetwork(): ElysiumNetworkState {
  const [chainId, setChainId] = useState<number | null>(null);
  const [latestBlock, setLatestBlock] = useState<number | null>(null);
  const [isRpcHealthy, setIsRpcHealthy] = useState<boolean>(true);
  const [isChecking, setIsChecking] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const checkNetwork = useCallback(async () => {
    setIsChecking(true);
    setError(null);
    try {
      const [detectedChain, block] = await Promise.all([
        ElysiumProvider.getChain(),
        getLatestBlockNumber().catch(() => null),
      ]);

      setChainId(detectedChain);
      if (block !== null) {
        setLatestBlock(block);
        setIsRpcHealthy(true);
      } else {
        setIsRpcHealthy(false);
      }
    } catch (err: any) {
      setError(err.message || 'Network detection failed');
      setIsRpcHealthy(false);
    } finally {
      setIsChecking(false);
    }
  }, []);

  useEffect(() => {
    checkNetwork();

    // Listen to chain changes if window.ethereum is available
    if (typeof window !== 'undefined' && (window as any).ethereum) {
      const handleChainChanged = (hexChain: string) => {
        setChainId(parseInt(hexChain, 16));
      };
      (window as any).ethereum.on?.('chainChanged', handleChainChanged);
      return () => {
        (window as any).ethereum.removeListener?.('chainChanged', handleChainChanged);
      };
    }
  }, [checkNetwork]);

  const switchNetwork = async (): Promise<boolean> => {
    try {
      const success = await ElysiumProvider.switchNetwork();
      await checkNetwork();
      return success;
    } catch (err: any) {
      setError(err.message || 'Failed to switch network');
      return false;
    }
  };

  const isCorrectNetwork = chainId === ELYSIUM_CONFIG.chainIdDecimal;

  return {
    isCorrectNetwork,
    chainId,
    latestBlock,
    isRpcHealthy,
    isChecking,
    error,
    switchNetwork,
    refresh: checkNetwork,
  };
}
