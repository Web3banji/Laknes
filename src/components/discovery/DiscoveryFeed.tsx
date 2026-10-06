import React from 'react';
import { DiscoveryItem as DiscoveryItemModel, Project, MarketAsset } from '../../data/types';
import { DiscoveryItem } from './DiscoveryItem';
import { DiscoveryFeedSkeleton } from '../ui/Skeleton';
import { EmptyState } from '../ui/EmptyState';
import { ErrorState } from '../ui/ErrorState';

export interface DiscoveryFeedProps {
  items: DiscoveryItemModel[];
  isLoading?: boolean;
  hasError?: boolean;
  onRetry?: () => void;
  onSelectProject?: (project: Project) => void;
  onSelectMarket?: (market: MarketAsset) => void;
}

export function DiscoveryFeed({
  items,
  isLoading = false,
  hasError = false,
  onRetry,
  onSelectProject,
  onSelectMarket,
}: DiscoveryFeedProps) {
  if (hasError) {
    return (
      <ErrorState
        title="Discovery data unavailable"
        description="We couldn't load the latest ecosystem activity."
        action="Retry"
        onRetry={onRetry}
      />
    );
  }

  if (isLoading) {
    return <DiscoveryFeedSkeleton />;
  }

  if (items.length === 0) {
    return (
      <EmptyState
        title="Nothing to discover yet"
        description="New Elysium activity will appear here."
      />
    );
  }

  return (
    <div className="divide-y divide-neutral-200">
      {items.map((item) => (
        <DiscoveryItem
          key={item.id}
          item={item}
          onSelectProject={onSelectProject}
          onSelectMarket={onSelectMarket}
        />
      ))}
    </div>
  );
}
