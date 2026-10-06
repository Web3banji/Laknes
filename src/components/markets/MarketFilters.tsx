import React from 'react';
import { marketFilters, MarketFilter } from '../../data/types';
import { FilterTabs } from '../ui/FilterTabs';

export interface MarketFiltersProps {
  activeFilter: MarketFilter;
  onFilterChange: (filter: MarketFilter) => void;
}

export function MarketFilters({ activeFilter, onFilterChange }: MarketFiltersProps) {
  return (
    <FilterTabs
      tabs={marketFilters}
      activeTab={activeFilter}
      onChange={onFilterChange}
      ariaLabel="Market filter tabs"
    />
  );
}
