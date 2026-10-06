import React from 'react';
import { NavigationTab } from '../../data/types';
import { useWallet } from '../../core/wallet/WalletContext';
import { formatAddress } from '../../lib/formatters';

export interface TopNavProps {
  currentTab: NavigationTab;
  onNavigate: (tab: NavigationTab) => void;
}

export function TopNav({ currentTab, onNavigate }: TopNavProps) {
  const { status, address, openConnectModal } = useWallet();
  const isConnected = status === 'connected' && Boolean(address);

  const navItems: { id: NavigationTab; label: string }[] = [
    { id: 'discover', label: 'Discover' },
    { id: 'markets', label: 'Markets' },
    { id: 'hyperliquid', label: 'New on Hyperliquid' },
    { id: 'projects', label: 'Projects' },
    { id: 'search', label: 'Search' },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-neutral-200/80 bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo and Primary Nav Links */}
        <div className="flex items-center gap-8">
          <button
            type="button"
            onClick={() => onNavigate('discover')}
            className="flex items-center gap-2 group cursor-pointer focus:outline-none"
            aria-label="LAKNES home"
          >
            <img
              src="/logo.svg"
              alt="LAKNES"
              className="h-7 w-auto object-contain transition-transform group-hover:scale-[1.02]"
            />
          </button>

          {/* Desktop Navigation Links */}
          <nav className="hidden sm:flex items-center gap-1" aria-label="Main Navigation">
            {navItems.map((item) => {
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onNavigate(item.id)}
                  className={`rounded-xl px-3.5 py-2 text-sm font-medium transition-colors cursor-pointer ${
                    isActive
                      ? 'bg-neutral-100 text-neutral-950 font-semibold'
                      : 'text-neutral-600 hover:bg-neutral-50 hover:text-neutral-950'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Action Zone: Connect Wallet */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={openConnectModal}
            className={`rounded-xl border border-neutral-200 px-3.5 py-2 text-sm font-medium text-neutral-900 transition-colors hover:bg-neutral-50 hover:border-neutral-300 cursor-pointer flex items-center gap-2 ${
              isConnected ? 'bg-neutral-50 font-mono text-xs' : ''
            }`}
          >
            {isConnected ? (
              <>
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>{formatAddress(address || '', 6, 4)}</span>
              </>
            ) : (
              'Connect'
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
