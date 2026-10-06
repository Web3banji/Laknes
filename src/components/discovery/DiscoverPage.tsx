import React, { useState, useMemo } from 'react';
import { AppShell } from '../layout/AppShell';
import { DiscoverHeader } from './DiscoverHeader';
import { DiscoveryFilters } from './DiscoveryFilters';
import { DiscoveryFeed } from './DiscoveryFeed';
import { ProjectHeader } from '../projects/ProjectHeader';
import {
  discoveryFilters,
  DiscoveryFilter,
  NavigationTab,
  Project,
  MarketAsset,
} from '../../data/types';
import { getDiscoveryItems } from '../../lib/data';

export interface DiscoverPageProps {
  currentNavTab: NavigationTab;
  onNavigate: (tab: NavigationTab) => void;
  selectedProject: Project | null;
  onSelectProject: (project: Project | null) => void;
  selectedMarket: MarketAsset | null;
  onSelectMarket: (market: MarketAsset | null) => void;
}

export function DiscoverPage({
  currentNavTab,
  onNavigate,
  selectedProject,
  onSelectProject,
  selectedMarket,
  onSelectMarket,
}: DiscoverPageProps) {
  const [activeFilter, setActiveFilter] = useState<(typeof discoveryFilters)[number]>('For You');

  const items = useMemo(() => {
    if (selectedProject) {
      return getDiscoveryItems('For You').filter(
        (item) => item.project?.id === selectedProject.id
      );
    }
    return getDiscoveryItems(activeFilter);
  }, [activeFilter, selectedProject]);

  return (
    <AppShell currentTab={currentNavTab} onNavigate={onNavigate}>
      <main className="mx-auto w-full max-w-3xl px-4 sm:px-6 py-6 sm:py-8 space-y-6">
        {selectedProject ? (
          <div className="space-y-6">
            <ProjectHeader
              project={selectedProject}
              onBack={() => onSelectProject(null)}
            />

            <div className="space-y-3 pt-2">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
                Verified Updates & Signals for {selectedProject.name}
              </h3>
              <DiscoveryFeed
                items={items}
                onSelectProject={onSelectProject}
                onSelectMarket={onSelectMarket}
              />
            </div>
          </div>
        ) : (
          <>
            <DiscoverHeader
              onSelectProject={onSelectProject}
              onSelectMarket={onSelectMarket}
            />

            <div className="pt-2 border-t border-neutral-100">
              <DiscoveryFilters
                activeFilter={activeFilter}
                onFilterChange={setActiveFilter}
              />
            </div>

            <div className="pt-1">
              <DiscoveryFeed
                items={items}
                onSelectProject={onSelectProject}
                onSelectMarket={onSelectMarket}
              />
            </div>
          </>
        )}
      </main>
    </AppShell>
  );
}
