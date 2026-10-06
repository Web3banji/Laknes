import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Project,
  Asset,
  Market,
  MarketType,
  Activity,
  ActivityCategory,
  Quest,
} from '../../core/ecosystem/types';
import { ecosystemService, ELYSIUM_CHAIN } from '../../core/ecosystem/ecosystemService';
import { DiscoverSearch } from './DiscoverSearch';
import { ProjectCard } from '../cards/ProjectCard';
import { ProjectCardSkeleton, ActivitySkeleton } from '../../design-system/primitives/Skeleton';
import { EmptyState } from '../../design-system/primitives/EmptyState';
import { ErrorState } from '../../design-system/primitives/ErrorState';
import { Button } from '../../design-system/primitives/Button';
import { useToast } from '../../design-system/primitives/Toast';
import {
  ChevronDown,
  SlidersHorizontal,
  Check,
  ExternalLink,
  Copy,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { formatAddress } from '../../core/network/config';

export interface DiscoverViewProps {
  onSelectProject: (project: Project) => void;
  onSelectQuest?: (quest: Quest) => void;
  onNavigateToProjects?: () => void;
  onNavigateToQuests?: () => void;
  onNavigateToForProjects?: () => void;
  isLoading?: boolean;
}

export type DiscoverViewTab = 'Projects' | 'Markets' | 'Activity';
export type ProjectFilterType = 'all' | 'trending' | 'new' | 'verified';
export type MarketFilterType = 'spot' | 'perpetuals' | 'assets';
export type ActivityFilterType = 'all' | 'projects' | 'markets' | 'ecosystem';

const CATEGORIES = ['All', 'DeFi', 'Gaming', 'Infrastructure', 'Tooling', 'Community'] as const;

export function DiscoverView({
  onSelectProject,
  onSelectQuest,
  onNavigateToProjects,
  onNavigateToQuests,
  onNavigateToForProjects,
}: DiscoverViewProps) {
  const { addressCopied, showToast } = useToast();

  // Primary view tabs: Projects | Markets | Activity
  const [activeTab, setActiveTab] = useState<DiscoverViewTab>('Projects');

  // Search input value
  const [searchQuery, setSearchQuery] = useState('');

  // Filter sheet / popover open state
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isChainPopoverOpen, setIsChainPopoverOpen] = useState(false);

  // Sub-filters for Projects
  const [projectSubFilter, setProjectSubFilter] = useState<ProjectFilterType>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  // Sub-filters for Markets
  const [marketSubFilter, setMarketSubFilter] = useState<MarketFilterType>('spot');

  // Sub-filters for Activity
  const [activitySubFilter, setActivitySubFilter] = useState<ActivityFilterType>('all');

  // Data states
  const [projects, setProjects] = useState<Project[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [markets, setMarkets] = useState<Market[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const chainRef = useRef<HTMLDivElement>(null);

  // Close chain popover on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (chainRef.current && !chainRef.current.contains(event.target as Node)) {
        setIsChainPopoverOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadDiscoveryData = async () => {
    setIsLoading(true);
    setHasError(false);
    try {
      const [fetchedProjects, fetchedAssets, fetchedMarkets, fetchedActivities] =
        await Promise.all([
          ecosystemService.getProjects(),
          ecosystemService.getAssets(),
          ecosystemService.getMarkets(),
          ecosystemService.getActivities(),
        ]);
      setProjects(fetchedProjects);
      setAssets(fetchedAssets);
      setMarkets(fetchedMarkets);
      setActivities(fetchedActivities);
    } catch {
      setHasError(true);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDiscoveryData();
  }, []);

  // Filtered projects
  const filteredProjects = useMemo(() => {
    return projects.filter((p) => {
      if (projectSubFilter === 'trending' && !p.isTrending) return false;
      if (projectSubFilter === 'new' && !p.isNew) return false;
      if (projectSubFilter === 'verified' && !p.isVerified && p.verificationStatus !== 'verified')
        return false;

      if (selectedCategory !== 'All' && p.category.toLowerCase() !== selectedCategory.toLowerCase()) {
        return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = p.name.toLowerCase().includes(q);
        const matchesDesc = (p.description || '').toLowerCase().includes(q);
        const matchesCategory = p.category.toLowerCase().includes(q);
        return matchesName || matchesDesc || matchesCategory;
      }

      return true;
    });
  }, [projects, projectSubFilter, selectedCategory, searchQuery]);

  // Filtered markets
  const filteredMarkets = useMemo(() => {
    return markets.filter((m) => {
      if (marketSubFilter === 'spot' && m.marketType !== 'spot') return false;
      if (marketSubFilter === 'perpetuals' && m.marketType !== 'perpetual') return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          m.pair.toLowerCase().includes(q) ||
          m.venue.toLowerCase().includes(q) ||
          m.asset.toLowerCase().includes(q)
        );
      }

      return true;
    });
  }, [markets, marketSubFilter, searchQuery]);

  // Filtered assets
  const filteredAssets = useMemo(() => {
    return assets.filter((a) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          a.symbol.toLowerCase().includes(q) ||
          a.name.toLowerCase().includes(q) ||
          (a.contractAddress && a.contractAddress.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [assets, searchQuery]);

  // Filtered activities
  const filteredActivities = useMemo(() => {
    return activities.filter((act) => {
      if (activitySubFilter === 'projects' && act.category !== 'project') return false;
      if (activitySubFilter === 'markets' && act.category !== 'market') return false;
      if (activitySubFilter === 'ecosystem' && act.category !== 'ecosystem' && act.category !== 'on_chain')
        return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          act.title.toLowerCase().includes(q) ||
          act.description.toLowerCase().includes(q) ||
          act.type.toLowerCase().includes(q) ||
          (act.projectName && act.projectName.toLowerCase().includes(q))
        );
      }

      return true;
    });
  }, [activities, activitySubFilter, searchQuery]);

  const hasActiveFilters = useMemo(() => {
    if (activeTab === 'Projects') {
      return projectSubFilter !== 'all' || selectedCategory !== 'All';
    }
    if (activeTab === 'Markets') {
      return marketSubFilter !== 'spot';
    }
    if (activeTab === 'Activity') {
      return activitySubFilter !== 'all';
    }
    return false;
  }, [activeTab, projectSubFilter, selectedCategory, marketSubFilter, activitySubFilter]);

  const handleResetFilters = () => {
    setProjectSubFilter('all');
    setSelectedCategory('All');
    setMarketSubFilter('spot');
    setActivitySubFilter('all');
    setSearchQuery('');
  };

  const handleCopyAddress = (addr: string) => {
    navigator.clipboard.writeText(addr);
    addressCopied(addr);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-6">
      {/* DISCOVER HEADER AREA */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-neutral-950">
            Discover
          </h1>
          <p className="mt-1 text-sm text-neutral-500 max-w-xl leading-relaxed">
            Explore projects, markets and activity across Elysium.
          </p>
        </div>

        {/* Chain selector control: Chain: Elysium ▾ */}
        <div className="relative self-start sm:self-auto shrink-0" ref={chainRef}>
          <button
            type="button"
            onClick={() => setIsChainPopoverOpen(!isChainPopoverOpen)}
            className="inline-flex h-9 items-center gap-2 rounded-xl border border-neutral-200 bg-white px-3 text-xs font-medium text-neutral-800 transition-colors hover:bg-neutral-50 hover:border-neutral-300 focus:outline-none focus:ring-2 focus:ring-neutral-100 cursor-pointer"
            aria-expanded={isChainPopoverOpen}
            aria-haspopup="true"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            <span className="text-neutral-500 font-normal">Chain:</span>
            <span className="font-semibold text-neutral-900">{ELYSIUM_CHAIN.name}</span>
            <ChevronDown className={`h-3.5 w-3.5 text-neutral-400 transition-transform duration-150 ${isChainPopoverOpen ? 'rotate-180' : ''}`} />
          </button>

          {/* Chain Popover */}
          {isChainPopoverOpen && (
            <div className="absolute right-0 mt-1.5 w-64 rounded-xl border border-neutral-200 bg-white p-3 shadow-lg z-20 animate-in fade-in-50 duration-100">
              <div className="flex items-center justify-between pb-2 border-b border-neutral-100">
                <div className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  <span className="text-xs font-semibold text-neutral-950">{ELYSIUM_CHAIN.networkName}</span>
                </div>
                <span className="rounded bg-neutral-100 px-1.5 py-0.5 text-[10px] font-mono text-neutral-600">
                  ID: {ELYSIUM_CHAIN.chainId}
                </span>
              </div>

              <div className="mt-2 space-y-1.5 text-[11px] text-neutral-500">
                <div className="flex justify-between">
                  <span>Native Gas:</span>
                  <span className="font-mono text-neutral-900 font-medium">{ELYSIUM_CHAIN.nativeAsset.symbol} (18 dec)</span>
                </div>
                <div className="flex justify-between">
                  <span>Consensus:</span>
                  <span className="text-emerald-700 font-medium">Synchronized</span>
                </div>
              </div>

              <div className="mt-3 pt-2 border-t border-neutral-100">
                <a
                  href={ELYSIUM_CHAIN.explorerUrl}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="flex items-center justify-between text-xs text-neutral-600 hover:text-neutral-950 font-medium"
                >
                  <span>Open Blockscout Explorer</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* PRIMARY TABS: Projects | Markets | Activity */}
      <div className="flex items-center gap-6 border-b border-neutral-200">
        {(['Projects', 'Markets', 'Activity'] as DiscoverViewTab[]).map((tab) => {
          const isActive = activeTab === tab;
          return (
            <button
              key={tab}
              type="button"
              onClick={() => {
                setActiveTab(tab);
                setSearchQuery('');
              }}
              className={`pb-3 text-sm font-medium transition-colors border-b-2 cursor-pointer ${
                isActive
                  ? 'border-neutral-950 text-neutral-950 font-semibold'
                  : 'border-transparent text-neutral-500 hover:text-neutral-900'
              }`}
            >
              {tab}
            </button>
          );
        })}
      </div>

      {/* SEARCH & FILTER CONTROLS: [ Search .................... ] [Filter] */}
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <DiscoverSearch
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder={
                activeTab === 'Projects'
                  ? 'Search projects by name, category or description...'
                  : activeTab === 'Markets'
                  ? 'Search spot pairs, venues or assets...'
                  : 'Search activity events and milestones...'
              }
            />
          </div>

          {/* Filter toggle button */}
          <button
            type="button"
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            className={`inline-flex h-11 shrink-0 items-center gap-2 rounded-xl border px-4 text-sm font-medium transition-colors cursor-pointer ${
              isFilterOpen || hasActiveFilters
                ? 'border-neutral-950 bg-neutral-950 text-white'
                : 'border-neutral-200 bg-white text-neutral-800 hover:bg-neutral-50 hover:border-neutral-300'
            }`}
            aria-expanded={isFilterOpen}
            aria-label="Filter options"
          >
            <SlidersHorizontal className="h-4 w-4" />
            <span>Filter</span>
            {hasActiveFilters && (
              <span className="h-1.5 w-1.5 rounded-full bg-white ml-0.5" />
            )}
          </button>
        </div>

        {/* Compact Filter Popover / Sheet */}
        {isFilterOpen && (
          <div className="rounded-xl border border-neutral-200 bg-neutral-50/70 p-4 transition-all animate-in fade-in-50 duration-150 space-y-3">
            {/* Contextual filter content based on current active tab */}
            {activeTab === 'Projects' && (
              <div className="space-y-3">
                {/* Project Status / View: All | Trending | New | Verified */}
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-medium text-neutral-500 mr-1">Status:</span>
                  {(
                    [
                      { id: 'all', label: 'All' },
                      { id: 'trending', label: 'Trending' },
                      { id: 'new', label: 'New' },
                      { id: 'verified', label: 'Verified' },
                    ] as const
                  ).map((sub) => {
                    const isSelected = projectSubFilter === sub.id;
                    return (
                      <button
                        key={sub.id}
                        type="button"
                        onClick={() => setProjectSubFilter(sub.id)}
                        className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer ${
                          isSelected
                            ? 'bg-neutral-900 text-white font-semibold'
                            : 'bg-white text-neutral-600 border border-neutral-200 hover:border-neutral-300'
                        }`}
                      >
                        {sub.label}
                      </button>
                    );
                  })}
                </div>

                {/* Project Category: All | DeFi | Gaming | Infrastructure | Tooling | Community */}
                <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-neutral-200/60">
                  <span className="text-xs font-medium text-neutral-500 mr-1">Category:</span>
                  {CATEGORIES.map((cat) => {
                    const isSelected = selectedCategory === cat;
                    return (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setSelectedCategory(cat)}
                        className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer ${
                          isSelected
                            ? 'bg-neutral-900 text-white font-semibold'
                            : 'bg-white text-neutral-600 border border-neutral-200 hover:border-neutral-300'
                        }`}
                      >
                        {cat}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {activeTab === 'Markets' && (
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-medium text-neutral-500 mr-1">Market Type:</span>
                {(
                  [
                    { id: 'spot', label: 'Spot' },
                    { id: 'perpetuals', label: 'Perpetuals' },
                    { id: 'assets', label: 'Asset' },
                  ] as const
                ).map((sub) => {
                  const isSelected = marketSubFilter === sub.id;
                  return (
                    <button
                      key={sub.id}
                      type="button"
                      onClick={() => setMarketSubFilter(sub.id)}
                      className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-neutral-900 text-white font-semibold'
                          : 'bg-white text-neutral-600 border border-neutral-200 hover:border-neutral-300'
                      }`}
                    >
                      {sub.label}
                    </button>
                  );
                })}
              </div>
            )}

            {activeTab === 'Activity' && (
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-medium text-neutral-500 mr-1">Category:</span>
                {(
                  [
                    { id: 'all', label: 'All' },
                    { id: 'projects', label: 'Projects' },
                    { id: 'markets', label: 'Markets' },
                    { id: 'ecosystem', label: 'Ecosystem' },
                  ] as const
                ).map((sub) => {
                  const isSelected = activitySubFilter === sub.id;
                  return (
                    <button
                      key={sub.id}
                      type="button"
                      onClick={() => setActivitySubFilter(sub.id)}
                      className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-neutral-900 text-white font-semibold'
                          : 'bg-white text-neutral-600 border border-neutral-200 hover:border-neutral-300'
                      }`}
                    >
                      {sub.label}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Reset / Actions bar */}
            {hasActiveFilters && (
              <div className="pt-2 border-t border-neutral-200/60 flex items-center justify-between">
                <span className="text-xs text-neutral-400 font-mono">Filters active</span>
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="text-xs text-neutral-600 hover:text-neutral-950 font-medium cursor-pointer underline flex items-center gap-1"
                >
                  <RotateCcw className="h-3 w-3" />
                  <span>Reset to default</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ERROR STATE */}
      {hasError && !isLoading && (
        <ErrorState
          type="data-loading"
          onRetry={loadDiscoveryData}
        />
      )}

      {/* LOADING STATE */}
      {isLoading && (
        <div className="pt-2">
          {activeTab === 'Activity' ? (
            <ActivitySkeleton />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <ProjectCardSkeleton key={i} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 1: PROJECTS */}
      {!isLoading && !hasError && activeTab === 'Projects' && (
        <div className="space-y-4">
          {filteredProjects.length === 0 ? (
            <EmptyState
              title="No projects yet"
              description="Projects indexed on Elysium will appear here."
              action={
                searchQuery || hasActiveFilters ? (
                  <Button variant="secondary" onClick={handleResetFilters}>
                    Clear Filters
                  </Button>
                ) : onNavigateToForProjects ? (
                  <Button variant="primary" onClick={onNavigateToForProjects}>
                    Submit Project
                  </Button>
                ) : undefined
              }
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredProjects.map((project) => (
                <ProjectCard
                  key={project.id}
                  name={project.name}
                  description={project.description}
                  category={project.category}
                  status={project.statusLabel || (typeof project.status === 'string' ? project.status : undefined)}
                  logo={project.logo}
                  isVerified={project.isVerified || project.verificationStatus === 'verified'}
                  assets={project.assets}
                  marketsCount={project.markets?.length}
                  onClick={() => onSelectProject(project)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: MARKETS */}
      {!isLoading && !hasError && activeTab === 'Markets' && (
        <div className="space-y-4">
          {marketSubFilter === 'spot' && (
            <div>
              {filteredMarkets.length === 0 ? (
                <EmptyState
                  title="No markets yet"
                  description="Trading pairs and liquidity pools indexed on Elysium will appear here."
                />
              ) : (
                <div className="rounded-2xl border border-neutral-200 bg-white overflow-hidden divide-y divide-neutral-100">
                  {filteredMarkets.map((mkt) => (
                    <div
                      key={mkt.id}
                      className="p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-neutral-50/50 transition-colors"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-base font-semibold text-neutral-950">
                            {mkt.pair}
                          </span>
                          <span className="rounded-md bg-neutral-100 border border-neutral-200 px-2 py-0.5 text-[11px] font-medium text-neutral-700">
                            Spot AMM
                          </span>
                          <span className="rounded-md bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 text-[11px] font-medium text-emerald-800">
                            Active
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-3 text-xs text-neutral-500">
                          <span>Venue: <span className="font-medium text-neutral-800">{mkt.venue}</span></span>
                          <span>·</span>
                          <span>Source: <span className="font-mono text-neutral-700">{mkt.dataSource}</span></span>
                        </div>
                      </div>

                      {mkt.venueUrl && (
                        <a
                          href={mkt.venueUrl}
                          target="_blank"
                          rel="noreferrer noopener"
                          className="self-start sm:self-center shrink-0 inline-flex items-center gap-1.5 rounded-xl border border-neutral-200 bg-white px-3.5 py-2 text-xs font-medium text-neutral-900 hover:bg-neutral-50 transition-colors"
                        >
                          <span>Open on DEX</span>
                          <ExternalLink className="w-3.5 h-3.5 text-neutral-400" />
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {marketSubFilter === 'perpetuals' && (
            <EmptyState
              title="No perpetual markets yet"
              description="Perpetual futures contracts are not currently deployed on Elysium Mainnet. Spot AMM routing is active."
              action={
                <Button variant="secondary" onClick={() => setMarketSubFilter('spot')}>
                  View Spot Markets
                </Button>
              }
            />
          )}

          {marketSubFilter === 'assets' && (
            <div>
              {filteredAssets.length === 0 ? (
                <EmptyState
                  title="No assets yet"
                  description="Canonical tokens indexed on Elysium will appear here."
                />
              ) : (
                <div className="rounded-2xl border border-neutral-200 bg-white overflow-hidden divide-y divide-neutral-100">
                  {filteredAssets.map((asset) => (
                    <div
                      key={asset.id}
                      className="p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-neutral-50/50 transition-colors"
                    >
                      <div className="flex items-start gap-3.5">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-neutral-100 font-mono text-xs font-bold text-neutral-900">
                          {asset.symbol.slice(0, 3)}
                        </div>

                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-base font-semibold text-neutral-950">
                              {asset.name}
                            </span>
                            <span className="font-mono text-xs font-semibold text-neutral-500">
                              ({asset.symbol})
                            </span>
                            {asset.isNative ? (
                              <span className="rounded-md bg-neutral-950 text-white px-2 py-0.5 text-[11px] font-medium">
                                Native Gas
                              </span>
                            ) : (
                              <span className="rounded-md bg-neutral-100 px-2 py-0.5 text-[11px] font-medium text-neutral-700">
                                ERC-20
                              </span>
                            )}
                          </div>

                          <div className="flex flex-wrap items-center gap-2 text-xs text-neutral-500">
                            {asset.projectName && (
                              <span>Project: <span className="font-medium text-neutral-800">{asset.projectName}</span></span>
                            )}
                            {asset.markets && asset.markets.length > 0 && (
                              <>
                                <span>·</span>
                                <span>Paired on {asset.markets.length} {asset.markets.length === 1 ? 'market' : 'markets'}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
                        {asset.contractAddress ? (
                          <div className="flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-neutral-50 px-2.5 py-1 text-xs font-mono text-neutral-700">
                            <span>{formatAddress(asset.contractAddress, 6, 4)}</span>
                            <button
                              type="button"
                              onClick={() => handleCopyAddress(asset.contractAddress!)}
                              className="p-0.5 text-neutral-400 hover:text-neutral-700 cursor-pointer"
                              aria-label={`Copy ${asset.symbol} address`}
                            >
                              <Copy className="w-3 h-3" />
                            </button>
                            <a
                              href={`https://explorer.elysiumchain.tech/address/${asset.contractAddress}`}
                              target="_blank"
                              rel="noreferrer noopener"
                              className="p-0.5 text-neutral-400 hover:text-neutral-700"
                              aria-label={`Inspect ${asset.symbol} on Blockscout`}
                            >
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          </div>
                        ) : (
                          <span className="text-xs font-mono text-neutral-400">
                            Core Network Asset
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: ACTIVITY */}
      {!isLoading && !hasError && activeTab === 'Activity' && (
        <div className="space-y-4">
          {filteredActivities.length === 0 ? (
            <EmptyState
              title="No activity yet"
              description="Ecosystem events, project updates, and on-chain milestones on Elysium will appear here."
            />
          ) : (
            <div className="rounded-2xl border border-neutral-200 bg-white overflow-hidden divide-y divide-neutral-100">
              {filteredActivities.map((act) => (
                <div
                  key={act.id}
                  className="p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-neutral-50/50 transition-colors"
                >
                  <div className="space-y-1.5 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-md bg-neutral-100 px-2 py-0.5 text-[11px] font-medium text-neutral-700">
                        {act.type}
                      </span>

                      {act.projectName && (
                        <span className="text-xs font-semibold text-neutral-900">
                          {act.projectName}
                        </span>
                      )}

                      <span className="text-xs text-neutral-400 font-mono">
                        · {act.timestamp}
                      </span>
                    </div>

                    <h3 className="text-sm font-semibold text-neutral-950">
                      {act.title}
                    </h3>

                    <p className="text-xs text-neutral-500 leading-relaxed max-w-2xl">
                      {act.description}
                    </p>
                  </div>

                  {act.metadata?.explorerUrl && (
                    <a
                      href={act.metadata.explorerUrl}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="self-start sm:self-center shrink-0 inline-flex items-center gap-1.5 text-xs font-medium text-neutral-700 hover:text-neutral-950 underline"
                    >
                      <span>Inspect on Blockscout</span>
                      <ExternalLink className="w-3.5 h-3.5 text-neutral-400" />
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export const DiscoverPage = DiscoverView;
