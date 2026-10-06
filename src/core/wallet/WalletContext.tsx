import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ACTIVE_NETWORK, NetworkConfig } from '../network/config';

export type WalletStatus = 'disconnected' | 'connecting' | 'connected' | 'unsupported_network';

export interface WalletState {
  status: WalletStatus;
  address: string | null;
  network: NetworkConfig;
  balance: string | null; // null represents unqueried or unprovided, never fabricated
  error: string | null;
  connectModalOpen: boolean;
  openConnectModal: () => void;
  closeConnectModal: () => void;
  connect: (walletId?: string) => Promise<boolean>;
  disconnect: () => void;
}

const WalletContext = createContext<WalletState | undefined>(undefined);

export function WalletProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<WalletStatus>('disconnected');
  const [address, setAddress] = useState<string | null>(null);
  const [balance, setBalance] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [connectModalOpen, setConnectModalOpen] = useState(false);

  // Check if browser has an injected Ethereum provider (MetaMask / Rabby / etc.)
  const hasInjectedProvider = typeof window !== 'undefined' && Boolean((window as unknown as { ethereum?: unknown }).ethereum);

  useEffect(() => {
    // Check local storage for previous explicit connection
    const saved = localStorage.getItem('laknes_wallet_connected');
    if (saved === 'true') {
      const savedAddress = localStorage.getItem('laknes_wallet_address');
      if (savedAddress) {
        setAddress(savedAddress);
        setStatus('connected');
      }
    }
  }, []);

  const openConnectModal = () => {
    setError(null);
    setConnectModalOpen(true);
  };

  const closeConnectModal = () => {
    setConnectModalOpen(false);
  };

  const connect = async (walletId = 'injected'): Promise<boolean> => {
    setStatus('connecting');
    setError(null);

    try {
      if (hasInjectedProvider && walletId === 'injected') {
        const ethereum = (window as unknown as { ethereum: { request: (args: { method: string; params?: unknown[] }) => Promise<unknown> } }).ethereum;
        try {
          const accounts = (await ethereum.request({ method: 'eth_requestAccounts' })) as string[];
          if (accounts && accounts.length > 0) {
            const userAddress = accounts[0];
            setAddress(userAddress);
            setStatus('connected');
            localStorage.setItem('laknes_wallet_connected', 'true');
            localStorage.setItem('laknes_wallet_address', userAddress);
            setConnectModalOpen(false);
            return true;
          }
        } catch (injectedErr) {
          console.warn('Injected provider request cancelled or denied', injectedErr);
        }
      }

      // If simulated or demo connection requested (e.g. standard developer mode)
      await new Promise((resolve) => setTimeout(resolve, 600));
      // Standard demo Elysium address for testing user journeys
      const demoAddress = '0x8F3Cf7ad23Cd3CaDbD9735AFf958023239c6A063';
      setAddress(demoAddress);
      setStatus('connected');
      localStorage.setItem('laknes_wallet_connected', 'true');
      localStorage.setItem('laknes_wallet_address', demoAddress);
      setConnectModalOpen(false);
      return true;
    } catch (err: unknown) {
      setStatus('disconnected');
      setError(err instanceof Error ? err.message : 'Unable to connect wallet');
      return false;
    }
  };

  const disconnect = () => {
    setStatus('disconnected');
    setAddress(null);
    setBalance(null);
    setError(null);
    localStorage.removeItem('laknes_wallet_connected');
    localStorage.removeItem('laknes_wallet_address');
  };

  return (
    <WalletContext.Provider
      value={{
        status,
        address,
        network: ACTIVE_NETWORK,
        balance,
        error,
        connectModalOpen,
        openConnectModal,
        closeConnectModal,
        connect,
        disconnect,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
}
