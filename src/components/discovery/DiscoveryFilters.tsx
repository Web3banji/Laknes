import React from 'react';
import { discoveryFilters, DiscoveryFilter } from '../../data/types';
import { FilterTabs } from '../ui/FilterTabs';

export interface DiscoveryFiltersProps {
  activeFilter: DiscoveryFilter;
  onFilterChange: (filter: DiscoveryFilter) => void;
}

export function DiscoveryFilters({
  activeFilter,
  onFilterChange,
}: DiscoveryFiltersProps) {
  return (
    <FilterTabs
      tabs={discoveryFilters}
      activeTab={activeFilter}
      onChange={onFilterChange}
      ariaLabel="Feed filter tabs"
    />
  );
}
