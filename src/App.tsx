/**
 * LAKNES — Elysium-first Crypto Discovery and Intelligence Product
 *
 * Scope: Discovery Layer (Discover → Understand → Explore)
 * Supporting surfaces: Markets, Projects, Global Search
 */

import React, { useState } from 'react';
import { WalletProvider } from './core/wallet/WalletContext';
import { ToastProvider } from './design-system/primitives/Toast';
import { AppShell } from './components/layout/AppShell';
import { ConnectWalletModal } from './components/wallet/ConnectWalletModal';

// Discovery Surfaces
import { DiscoverHeader } from './components/discovery/DiscoverHeader';
import { DiscoveryFilters } from './components/discovery/DiscoveryFilters';
import { DiscoveryFeed } from './components/discovery/DiscoveryFeed';
import { MarketsPage } from './components/markets/MarketsPage';
import { MarketDetailPage } from './components/markets/MarketDetailPage';
import { ProjectsPage } from './components/projects/ProjectsPage';
import { ProjectDetailPage } from './components/projects/ProjectDetailPage';
import { SearchPage } from './components/search/SearchPage';
import { PageContainer } from './components/layout/PageContainer';
import { NewOnHyperliquidFeed } from './components/hyperliquid/NewOnHyperliquidFeed';
import { HyperliquidMarketDetail } from './components/hyperliquid/HyperliquidMarketDetail';
import { HyperliquidMarket } from './services/hyperliquid/types';

// Data & Types
import {
  NavigationTab,
  DiscoveryFilter,
  Project,
  MarketAsset,
} from './data/types';
import {
  ELYSIUM_PROJECTS,
  ELYSIUM_MARKETS,
  getDiscoveryItems,
} from './lib/data';

function DiscoveryApp() {
  // Navigation: Discover | Markets | Hyperliquid | Projects | Search
  const [currentNavTab, setCurrentNavTab] = useState<NavigationTab>('discover');

  // Discover feed filter: 'For You' | 'Hot' | 'Projects' | 'Markets' | 'New'
  const [activeDiscoverFilter, setActiveDiscoverFilter] = useState<DiscoveryFilter>('For You');

  // Entity selection states for detail routing (/projects/:id, /markets/:id, /hyperliquid/:id)
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [selectedMarket, setSelectedMarket] = useState<MarketAsset | null>(null);
  const [selectedHyperliquidMarket, setSelectedHyperliquidMarket] = useState<HyperliquidMarket | null>(null);

  // Search query state for cross-surface handover
  const [searchQuery, setSearchQuery] = useState('');

  // Navigation tab switcher
  const handleNavigate = (tab: NavigationTab) => {
    setCurrentNavTab(tab);
    setSelectedProject(null);
    setSelectedMarket(null);
    setSelectedHyperliquidMarket(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Handover from Discover search bar to Search page
  const handleNavigateToSearch = (query: string) => {
    setSearchQuery(query);
    setCurrentNavTab('search');
    setSelectedProject(null);
    setSelectedMarket(null);
    setSelectedHyperliquidMarket(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Select project to open /projects/:projectId detail
  const handleSelectProject = (project: Project | null) => {
    setSelectedProject(project);
    setSelectedMarket(null);
    setSelectedHyperliquidMarket(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Select market to open /markets/:assetId detail
  const handleSelectMarket = (market: MarketAsset | null) => {
    setSelectedMarket(market);
    setSelectedProject(null);
    setSelectedHyperliquidMarket(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Select Hyperliquid market to open live detail view
  const handleSelectHyperliquidMarket = (market: HyperliquidMarket | null) => {
    setSelectedHyperliquidMarket(market);
    setSelectedProject(null);
    setSelectedMarket(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Associated relationships
  const relatedMarketForProject = selectedProject
    ? ELYSIUM_MARKETS.find(
        (m) =>
          m.projectId === selectedProject.id ||
          (selectedProject.marketAssetId && m.id === selectedProject.marketAssetId)
      ) || null
    : null;

  const relatedProjectForMarket = selectedMarket
    ? ELYSIUM_PROJECTS.find((p) => p.id === selectedMarket.projectId) || null
    : null;

  const recentUpdatesForProject = selectedProject
    ? getDiscoveryItems('For You').filter(
        (item) => item.project?.id === selectedProject.id
      )
    : [];

  const discoverFeedItems = getDiscoveryItems(activeDiscoverFilter);

  return (
    <AppShell currentTab={currentNavTab} onNavigate={handleNavigate}>
      {/* 1. DISCOVER VIEW */}
      {currentNavTab === 'discover' && (
        <main className="mx-auto w-full max-w-3xl px-4 sm:px-6 py-6 sm:py-8 space-y-6">
          {selectedHyperliquidMarket ? (
            <HyperliquidMarketDetail
              market={selectedHyperliquidMarket}
              backLabel="Back to Discover"
              onBack={() => setSelectedHyperliquidMarket(null)}
            />
          ) : selectedProject ? (
            <ProjectDetailPage
              project={selectedProject}
              relatedMarket={relatedMarketForProject}
              recentUpdates={recentUpdatesForProject}
              backLabel="Back to Discover"
              onBack={() => setSelectedProject(null)}
              onSelectMarket={handleSelectMarket}
            />
          ) : selectedMarket ? (
            <MarketDetailPage
              asset={selectedMarket}
              relatedProject={relatedProjectForMarket}
              backLabel="Back to Discover"
              onBack={() => setSelectedMarket(null)}
              onSelectProject={handleSelectProject}
            />
          ) : (
            <>
              <DiscoverHeader
                onSelectProject={handleSelectProject}
                onSelectMarket={handleSelectMarket}
                onSelectHyperliquidMarket={handleSelectHyperliquidMarket}
                onNavigateToSearch={handleNavigateToSearch}
              />

              {/* Spotlight Banner: Live Hyperliquid Discovery */}
              <div className="rounded-2xl border border-neutral-200/90 bg-neutral-50/70 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-500 text-white font-mono text-xs font-bold">
                    HL
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-neutral-950 flex items-center gap-2">
                      <span>New on Hyperliquid</span>
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    </div>
                    <div className="text-[11px] text-neutral-500">
                      Real-time token discovery, Spot & Perpetuals with live orderbooks.
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleNavigate('hyperliquid')}
                  className="self-start sm:self-auto text-xs font-semibold text-neutral-900 hover:text-neutral-950 inline-flex items-center gap-1.5 bg-white border border-neutral-200 px-3 py-1.5 rounded-xl hover:bg-neutral-50 transition-colors cursor-pointer"
                >
                  <span>Explore listings</span>
                  <span className="font-mono text-xs">→</span>
                </button>
              </div>

              <div className="pt-2 border-t border-neutral-100">
                <DiscoveryFilters
                  activeFilter={activeDiscoverFilter}
                  onFilterChange={setActiveDiscoverFilter}
                />
              </div>

              <div className="pt-1">
                <DiscoveryFeed
                  items={discoverFeedItems}
                  onSelectProject={handleSelectProject}
                  onSelectMarket={handleSelectMarket}
                />
              </div>
            </>
          )}
        </main>
      )}

      {/* 2. HYPERLIQUID VIEW */}
      {currentNavTab === 'hyperliquid' && (
        <div className="w-full">
          {selectedHyperliquidMarket ? (
            <main className="mx-auto w-full max-w-4xl px-4 sm:px-6 py-6 sm:py-8">
              <HyperliquidMarketDetail
                market={selectedHyperliquidMarket}
                onBack={() => setSelectedHyperliquidMarket(null)}
                backLabel="Back to New on Hyperliquid"
              />
            </main>
          ) : (
            <PageContainer className="max-w-6xl">
              <NewOnHyperliquidFeed onSelectMarket={handleSelectHyperliquidMarket} />
            </PageContainer>
          )}
        </div>
      )}

      {/* 3. MARKETS VIEW */}
      {currentNavTab === 'markets' && (
        <div className="w-full">
          {selectedMarket ? (
            <main className="mx-auto w-full max-w-3xl px-4 sm:px-6 py-6 sm:py-8">
              <MarketDetailPage
                asset={selectedMarket}
                relatedProject={relatedProjectForMarket}
                backLabel="Back to Markets"
                onBack={() => setSelectedMarket(null)}
                onSelectProject={handleSelectProject}
              />
            </main>
          ) : selectedProject ? (
            <main className="mx-auto w-full max-w-3xl px-4 sm:px-6 py-6 sm:py-8">
              <ProjectDetailPage
                project={selectedProject}
                relatedMarket={relatedMarketForProject}
                recentUpdates={recentUpdatesForProject}
                backLabel="Back to Markets"
                onBack={() => setSelectedProject(null)}
                onSelectMarket={handleSelectMarket}
              />
            </main>
          ) : (
            <MarketsPage onSelectMarket={handleSelectMarket} />
          )}
        </div>
      )}

      {/* 4. PROJECTS VIEW */}
      {currentNavTab === 'projects' && (
        <div className="w-full">
          {selectedProject ? (
            <main className="mx-auto w-full max-w-3xl px-4 sm:px-6 py-6 sm:py-8">
              <ProjectDetailPage
                project={selectedProject}
                relatedMarket={relatedMarketForProject}
                recentUpdates={recentUpdatesForProject}
                backLabel="Back to Projects"
                onBack={() => setSelectedProject(null)}
                onSelectMarket={handleSelectMarket}
              />
            </main>
          ) : selectedMarket ? (
            <main className="mx-auto w-full max-w-3xl px-4 sm:px-6 py-6 sm:py-8">
              <MarketDetailPage
                asset={selectedMarket}
                relatedProject={relatedProjectForMarket}
                backLabel="Back to Projects"
                onBack={() => setSelectedMarket(null)}
                onSelectProject={handleSelectProject}
              />
            </main>
          ) : (
            <ProjectsPage onSelectProject={handleSelectProject} />
          )}
        </div>
      )}

      {/* 5. SEARCH VIEW */}
      {currentNavTab === 'search' && (
        <div className="w-full">
          {selectedHyperliquidMarket ? (
            <main className="mx-auto w-full max-w-4xl px-4 sm:px-6 py-6 sm:py-8">
              <HyperliquidMarketDetail
                market={selectedHyperliquidMarket}
                backLabel="Back to Search"
                onBack={() => setSelectedHyperliquidMarket(null)}
              />
            </main>
          ) : selectedProject ? (
            <main className="mx-auto w-full max-w-3xl px-4 sm:px-6 py-6 sm:py-8">
              <ProjectDetailPage
                project={selectedProject}
                relatedMarket={relatedMarketForProject}
                recentUpdates={recentUpdatesForProject}
                backLabel="Back to Search"
                onBack={() => setSelectedProject(null)}
                onSelectMarket={handleSelectMarket}
              />
            </main>
          ) : selectedMarket ? (
            <main className="mx-auto w-full max-w-3xl px-4 sm:px-6 py-6 sm:py-8">
              <MarketDetailPage
                asset={selectedMarket}
                relatedProject={relatedProjectForMarket}
                backLabel="Back to Search"
                onBack={() => setSelectedMarket(null)}
                onSelectProject={handleSelectProject}
              />
            </main>
          ) : (
            <SearchPage
              initialQuery={searchQuery}
              onSelectProject={handleSelectProject}
              onSelectMarket={handleSelectMarket}
              onSelectHyperliquidMarket={handleSelectHyperliquidMarket}
            />
          )}
        </div>
      )}

      {/* Global Connect Wallet Modal */}
      <ConnectWalletModal />
    </AppShell>
  );
}

export default function App() {
  return (
    <WalletProvider>
      <ToastProvider>
        <DiscoveryApp />
      </ToastProvider>
    </WalletProvider>
  );
}
