import React from 'react';
import { BrandLogo } from '../brand/BrandLogo';
import { ACTIVE_NETWORK } from '../../core/network/config';
import { ExternalLink } from 'lucide-react';

export interface FooterProps {
  onNavigate?: (tab: 'discover' | 'quests' | 'projects' | 'for-projects') => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  return (
    <footer className="mt-16 border-t border-neutral-200/80 bg-white">
      <div className="max-w-7xl mx-auto px-5 sm:px-6 py-10">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <BrandLogo size="sm" />
            <p className="text-xs text-neutral-500 max-w-sm">
              The Elysium-native ecosystem platform for discovery, onboarding quests, and liquidity migration.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-x-8 gap-y-3 text-xs text-neutral-500">
            <button
              type="button"
              onClick={() => onNavigate?.('discover')}
              className="hover:text-neutral-900 transition-colors cursor-pointer"
            >
              Discover
            </button>
            <button
              type="button"
              onClick={() => onNavigate?.('quests')}
              className="hover:text-neutral-900 transition-colors cursor-pointer"
            >
              Quests
            </button>
            <button
              type="button"
              onClick={() => onNavigate?.('projects')}
              className="hover:text-neutral-900 transition-colors cursor-pointer"
            >
              Projects
            </button>
            <button
              type="button"
              onClick={() => onNavigate?.('for-projects')}
              className="hover:text-neutral-900 transition-colors cursor-pointer"
            >
              For Projects
            </button>
            <a
              href={ACTIVE_NETWORK.blockExplorerUrls[0]}
              target="_blank"
              rel="noreferrer noopener"
              className="inline-flex items-center gap-1 hover:text-neutral-900 transition-colors"
            >
              <span>Elysium Explorer</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-neutral-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-neutral-400">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
            <span>Connected to Elysium Mainnet</span>
          </div>
          <div>
            © {new Date().getFullYear()} LAKNES. All rights reserved.
          </div>
        </div>
      </div>
    </footer>
  );
};
