import React, { useState } from 'react';
import { BrandLogo } from '../brand/BrandLogo';
import { Button } from '../../design-system/primitives/Button';
import { useWallet } from '../../core/wallet/WalletContext';
import { formatAddress } from '../../core/network/config';
import { Menu, X, Wallet, SlidersHorizontal } from 'lucide-react';

export type NavItemKey = 'discover' | 'quests' | 'projects' | 'for-projects' | 'design-system';

export interface TopBarProps {
  currentTab: NavItemKey;
  onNavigate: (tab: NavItemKey) => void;
  onToggleInspector?: () => void;
  isInspectorOpen?: boolean;
}

export const TopBar: React.FC<TopBarProps> = ({
  currentTab,
  onNavigate,
  onToggleInspector,
  isInspectorOpen = false,
}) => {
  const { status, address, openConnectModal } = useWallet();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks: { key: NavItemKey; label: string }[] = [
    { key: 'discover', label: 'Discover' },
    { key: 'quests', label: 'Quests' },
    { key: 'projects', label: 'Projects' },
    { key: 'for-projects', label: 'For Projects' },
  ];

  const handleNavClick = (key: NavItemKey) => {
    onNavigate(key);
    setMobileMenuOpen(false);
  };

  const isConnected = status === 'connected' && Boolean(address);

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-neutral-200/80 transition-colors">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-15 flex items-center justify-between">
        {/* Zone 1: Single Brand Element */}
        <div className="flex items-center">
          <button
            type="button"
            onClick={() => handleNavClick('discover')}
            className="flex items-center focus-visible:outline-none cursor-pointer"
            aria-label="LAKNES Home"
          >
            <BrandLogo size="md" />
          </button>
        </div>

        {/* Zone 2: Navigation Links (Text with subtle hover state) */}
        <nav
          className="hidden md:flex items-center gap-7 text-sm font-medium text-neutral-600"
          aria-label="Main Navigation"
        >
          {navLinks.map((item) => {
            const isActive = currentTab === item.key;
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => handleNavClick(item.key)}
                className={`relative py-1 transition-colors whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'text-neutral-950 font-semibold'
                    : 'hover:text-neutral-900'
                }`}
              >
                <span>{item.label}</span>
                {isActive && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-neutral-950 rounded-full" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: 1-2 Primary Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Design System Foundation Inspector toggle */}
          {onToggleInspector && (
            <button
              type="button"
              onClick={onToggleInspector}
              className={`p-2 rounded-md text-xs border transition-colors cursor-pointer flex items-center gap-1.5 ${
                isInspectorOpen
                  ? 'bg-neutral-100 text-neutral-900 border-neutral-300 font-medium'
                  : 'bg-white text-neutral-500 border-neutral-200 hover:text-neutral-900 hover:bg-neutral-50'
              }`}
              title="Design System & State Inspector"
              aria-label="Design System & State Inspector"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 shrink-0" />
              <span className="hidden xl:inline text-xs">Foundation</span>
            </button>
          )}

          {/* Wallet Action */}
          {isConnected ? (
            <Button
              variant="outline"
              size="sm"
              onClick={openConnectModal}
              className="font-mono text-xs tabular-nums"
              leftIcon={<span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />}
            >
              {formatAddress(address || '', 6, 4)}
            </Button>
          ) : (
            <Button
              variant="primary"
              size="sm"
              onClick={openConnectModal}
              leftIcon={<Wallet className="w-3.5 h-3.5" />}
            >
              Connect Wallet
            </Button>
          )}

          {/* Mobile hamburger button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-neutral-600 hover:text-neutral-900 rounded-md focus-visible:outline-none"
            aria-label="Toggle menu"
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Responsive Mobile Navigation (Respects 15% sticky height cap rule) */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-neutral-200 bg-white px-4 py-3 space-y-1 animate-in fade-in slide-in-from-top-1">
          {navLinks.map((item) => {
            const isActive = currentTab === item.key;
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => handleNavClick(item.key)}
                className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-neutral-100 text-neutral-950 font-semibold'
                    : 'text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      )}
    </header>
  );
};
