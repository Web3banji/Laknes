import React, { useState, useRef, useEffect } from 'react';
import { ArrowRight, ExternalLink } from 'lucide-react';
import { SearchResult, Project, MarketAsset } from '../../data/types';
import { HyperliquidMarket } from '../../services/hyperliquid/types';
import { hyperliquidDiscoveryService } from '../../services/hyperliquid/discoveryService';
import { searchEcosystem, ELYSIUM_PROJECTS, ELYSIUM_MARKETS } from '../../lib/data';
import { formatAddress } from '../../lib/formatters';
import { SearchInput } from '../ui/SearchInput';
import { Badge } from '../ui/Badge';

export interface DiscoverHeaderProps {
  onSelectProject?: (project: Project) => void;
  onSelectMarket?: (market: MarketAsset) => void;
  onSelectHyperliquidMarket?: (market: HyperliquidMarket) => void;
  onNavigateToSearch?: (query: string) => void;
}

export function DiscoverHeader({
  onSelectProject,
  onSelectMarket,
  onSelectHyperliquidMarket,
  onNavigateToSearch,
}: DiscoverHeaderProps) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const results: SearchResult[] = searchEcosystem(query);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (results.length === 1) {
        handleSelectResult(results[0]);
      } else if (onNavigateToSearch && query.trim()) {
        setIsOpen(false);
        onNavigateToSearch(query.trim());
      }
    }
  };

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectResult = (res: SearchResult) => {
    setIsOpen(false);
    setQuery('');

    if (res.type === 'address' && res.address) {
      window.open(
        `https://explorer.elysiumchain.tech/address/${res.address}`,
        '_blank',
        'noreferrer,noopener'
      );
      return;
    }

    if (res.type === 'project' && res.projectId) {
      const proj = ELYSIUM_PROJECTS.find((p) => p.id === res.projectId);
      if (proj && onSelectProject) {
        onSelectProject(proj);
      }
      return;
    }

    if (res.type === 'token' && res.marketId) {
      const mkt = ELYSIUM_MARKETS.find((m) => m.id === res.marketId);
      if (mkt && onSelectMarket) {
        onSelectMarket(mkt);
      }
      return;
    }

    if (res.type === 'hyperliquid' && res.hyperliquidMarketId) {
      const hlMarket = hyperliquidDiscoveryService.getMarket(res.hyperliquidMarketId);
      if (hlMarket && onSelectHyperliquidMarket) {
        onSelectHyperliquidMarket(hlMarket);
      }
    }
  };

  return (
    <div className="space-y-4 pt-2">
      {/* Title & Concise Subtitle */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-neutral-950 sm:text-3xl">
          Discover
        </h1>
        <p className="mt-1 text-sm text-neutral-500">
          What&apos;s happening across Elysium
        </p>
      </div>

      {/* Shared SearchInput Primitive */}
      <div className="relative w-full" ref={containerRef}>
        <SearchInput
          value={query}
          onChange={(val) => {
            setQuery(val);
            setIsOpen(Boolean(val.trim()));
          }}
          onKeyDown={handleKeyDown}
          onClear={() => setIsOpen(false)}
          placeholder="Search projects, tokens, addresses..."
        />

        {/* Live Search Results Dropdown */}
        {isOpen && query.trim() && (
          <div className="absolute left-0 right-0 top-full mt-1.5 z-30 rounded-xl border border-neutral-200 bg-white p-2 shadow-lg max-h-80 overflow-y-auto">
            {results.length === 0 ? (
              <div className="py-4 text-center text-xs text-neutral-500">
                No matching projects, tokens, or addresses found.
              </div>
            ) : (
              <>
                <ul className="divide-y divide-neutral-100" role="listbox">
                  {results.map((res) => (
                    <li key={res.id}>
                      <button
                        type="button"
                        onClick={() => handleSelectResult(res)}
                        className="w-full text-left p-2.5 rounded-lg hover:bg-neutral-50 flex items-center justify-between gap-3 transition-colors cursor-pointer group focus:outline-none focus:bg-neutral-50"
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-neutral-950 truncate">
                              {res.type === 'address' ? formatAddress(res.title, 8, 6) : res.title}
                            </span>
                            <Badge variant="neutral" size="sm">
                              {res.type}
                            </Badge>
                          </div>
                          {res.subtitle && (
                            <div className="text-xs text-neutral-400 truncate mt-0.5">
                              {res.subtitle}
                            </div>
                          )}
                        </div>

                        <div className="shrink-0 text-neutral-400 group-hover:text-neutral-950 transition-colors">
                          {res.type === 'address' ? (
                            <ExternalLink className="h-3.5 w-3.5" />
                          ) : (
                            <ArrowRight className="h-3.5 w-3.5" />
                          )}
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>

                {onNavigateToSearch && (
                  <div className="pt-2 mt-2 border-t border-neutral-100">
                    <button
                      type="button"
                      onClick={() => {
                        setIsOpen(false);
                        onNavigateToSearch(query.trim());
                      }}
                      className="w-full text-center py-2 px-3 text-xs font-semibold text-neutral-700 hover:text-neutral-950 hover:bg-neutral-50 rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <span>Explore all matching in Search</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
