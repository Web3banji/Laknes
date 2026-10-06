import React, { useState, useEffect, useMemo } from 'react';
import { PageContainer } from '../layout/PageContainer';
import { PageHeader } from '../layout/PageHeader';
import { GlobalSearch } from './GlobalSearch';
import { SearchResults } from './SearchResults';
import { SearchResult, Project, MarketAsset } from '../../data/types';
import { HyperliquidMarket } from '../../services/hyperliquid/types';
import { hyperliquidDiscoveryService } from '../../services/hyperliquid/discoveryService';
import { searchEcosystem, ELYSIUM_PROJECTS, ELYSIUM_MARKETS } from '../../lib/data';

export interface SearchPageProps {
  onSelectProject: (project: Project) => void;
  onSelectMarket: (market: MarketAsset) => void;
  onSelectHyperliquidMarket?: (market: HyperliquidMarket) => void;
  initialQuery?: string;
}

export function SearchPage({
  onSelectProject,
  onSelectMarket,
  onSelectHyperliquidMarket,
  initialQuery = '',
}: SearchPageProps) {
  const [query, setQuery] = useState(initialQuery);
  const [debouncedQuery, setDebouncedQuery] = useState(initialQuery);
  const [selectedIndex, setSelectedIndex] = useState(-1);

  // Sync initialQuery when passed from parent
  useEffect(() => {
    if (initialQuery) {
      setQuery(initialQuery);
      setDebouncedQuery(initialQuery);
    }
  }, [initialQuery]);

  // Debounce search query (150ms)
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(query);
      setSelectedIndex(-1);
    }, 150);

    return () => clearTimeout(handler);
  }, [query]);

  const results: SearchResult[] = useMemo(() => {
    return searchEcosystem(debouncedQuery);
  }, [debouncedQuery]);

  const handleSelectResult = (res: SearchResult) => {
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
      if (proj) onSelectProject(proj);
      return;
    }

    if (res.type === 'token' && res.marketId) {
      const mkt = ELYSIUM_MARKETS.find((m) => m.id === res.marketId);
      if (mkt) onSelectMarket(mkt);
      return;
    }

    if (res.type === 'hyperliquid' && res.hyperliquidMarketId) {
      const hlMarket = hyperliquidDiscoveryService.getMarket(res.hyperliquidMarketId);
      if (hlMarket && onSelectHyperliquidMarket) {
        onSelectHyperliquidMarket(hlMarket);
      }
    }
  };

  // Keyboard navigation handler (ArrowUp, ArrowDown, Enter)
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (results.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < results.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : results.length - 1));
    } else if (e.key === 'Enter' && selectedIndex >= 0 && selectedIndex < results.length) {
      e.preventDefault();
      handleSelectResult(results[selectedIndex]);
    }
  };

  return (
    <PageContainer className="max-w-3xl">
      <PageHeader
        title="Search"
        description="Search projects, tokens, or paste an Elysium address."
        badge="Global Ecosystem Discovery"
      />

      <div onKeyDown={handleKeyDown}>
        <GlobalSearch
          value={query}
          onChange={setQuery}
          autoFocus
          placeholder="Search projects, tokens, addresses..."
        />
      </div>

      <div className="pt-2">
        <SearchResults
          query={debouncedQuery}
          results={results}
          selectedIndex={selectedIndex}
          onSelectResult={handleSelectResult}
        />
      </div>
    </PageContainer>
  );
}
