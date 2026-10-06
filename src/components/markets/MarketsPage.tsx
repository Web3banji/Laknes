import React, { useState, useMemo } from 'react';
import { PageContainer } from '../layout/PageContainer';
import { PageHeader } from '../layout/PageHeader';
import { MarketFilters } from './MarketFilters';
import { MarketTable } from './MarketTable';
import { MarketFilter, MarketAsset } from '../../data/types';
import { ELYSIUM_MARKETS } from '../../lib/data';

export interface MarketsPageProps {
  onSelectMarket: (asset: MarketAsset) => void;
}

export function MarketsPage({ onSelectMarket }: MarketsPageProps) {
  const [activeFilter, setActiveFilter] = useState<MarketFilter>('Trending');

  const filteredMarkets = useMemo(() => {
    const list = [...ELYSIUM_MARKETS];
    switch (activeFilter) {
      case 'Trending':
        return list;
      case 'Gainers':
        return list.sort((a, b) => (b.change24h ?? -999999) - (a.change24h ?? -999999));
      case 'New':
        return [...list].reverse();
      case 'Volume':
        return list.sort((a, b) => (b.volume24h ?? -999999) - (a.volume24h ?? -999999));
      default:
        return list;
    }
  }, [activeFilter]);

  return (
    <PageContainer className="max-w-4xl">
      <PageHeader
        title="Markets"
        description="Discover assets and market activity across Elysium."
        badge="Elysium Liquidity Venues"
      />

      {/* Shared Filter Bar */}
      <MarketFilters
        activeFilter={activeFilter}
        onFilterChange={setActiveFilter}
      />

      {/* Clean Market Table */}
      <MarketTable
        markets={filteredMarkets}
        onSelectMarket={onSelectMarket}
      />
    </PageContainer>
  );
}
