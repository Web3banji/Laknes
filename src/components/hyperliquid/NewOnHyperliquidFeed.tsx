import React, { useState, useMemo } from 'react';
import { HyperliquidMarket } from '../../services/hyperliquid/types';
import { useHyperliquidDiscovery } from '../../hooks/useHyperliquidDiscovery';
import { HyperliquidMarketCard } from './HyperliquidMarketCard';
import { FilterTabs } from '../ui/FilterTabs';
import { SearchInput } from '../ui/SearchInput';
import { EmptyState } from '../ui/EmptyState';
import { RotateCw, Zap, Bell, ArrowRight } from 'lucide-react';

export interface NewOnHyperliquidFeedProps {
  onSelectMarket: (market: HyperliquidMarket) => void;
}

const filterOptions = [
  'All',
  'Spot',
  'Perpetuals',
  'Newest First',
  'Highest Volume',
] as const;

type FilterOption = (typeof filterOptions)[number];

export function NewOnHyperliquidFeed({ onSelectMarket }: NewOnHyperliquidFeedProps) {
  const {
    markets,
    spotMarkets,
    perpMarkets,
    newListings,
    status,
    recentAlerts,
    dismissAlert,
    refresh,
  } = useHyperliquidDiscovery();

  const [activeFilter, setActiveFilter] = useState<FilterOption>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refresh();
    } finally {
      setTimeout(() => setIsRefreshing(false), 500);
    }
  };

  // Filter & Search
  const filteredMarkets = useMemo(() => {
    let list: HyperliquidMarket[] = [];

    switch (activeFilter) {
      case 'All':
        list = newListings;
        break;
      case 'Spot':
        list = spotMarkets.sort((a, b) => b.first_detected_at - a.first_detected_at);
        break;
      case 'Perpetuals':
        list = perpMarkets.sort((a, b) => b.first_detected_at - a.first_detected_at);
        break;
      case 'Newest First':
        list = [...markets].sort((a, b) => b.first_detected_at - a.first_detected_at);
        break;
      case 'Highest Volume':
        list = [...markets].sort((a, b) => (b.volume24h ?? 0) - (a.volume24h ?? 0));
        break;
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (m) =>
          m.symbol.toLowerCase().includes(q) ||
          m.baseToken.toLowerCase().includes(q) ||
          (m.contractAddress && m.contractAddress.toLowerCase().includes(q))
      );
    }

    return list;
  }, [activeFilter, searchQuery, newListings, spotMarkets, perpMarkets, markets]);

  const genuineNewCount = useMemo(
    () => markets.filter((m) => !m.is_historical).length,
    [markets]
  );

  return (
    <div className="space-y-6">
      {/* 1. Header with Live Status & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight text-neutral-950 sm:text-3xl">
              New on Hyperliquid
            </h1>
            {genuineNewCount > 0 && (
              <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">
                {genuineNewCount} new detected
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-neutral-500">
            Real-time token and market discovery across Hyperliquid Spot and Perpetuals.
          </p>
        </div>

        {/* Live Status indicator & Manual Refresh */}
        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <div className="flex items-center gap-1.5 rounded-xl border border-neutral-200 bg-white px-3 py-1.5 text-xs font-mono">
            {status === 'connected' ? (
              <>
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-neutral-700 font-medium">WS Live</span>
              </>
            ) : status === 'connecting' || status === 'reconnecting' ? (
              <>
                <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
                <span className="text-neutral-700">Connecting...</span>
              </>
            ) : (
              <>
                <span className="h-2 w-2 rounded-full bg-neutral-400" />
                <span className="text-neutral-500">REST Fallback</span>
              </>
            )}
            <span className="text-neutral-300">·</span>
            <span className="text-neutral-500">{markets.length} pairs</span>
          </div>

          <button
            type="button"
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            className="p-2 rounded-xl border border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-600 transition-colors cursor-pointer disabled:opacity-50"
            title="Reconcile metadata"
          >
            <RotateCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* 2. Live New Listing Event Alerts Banner */}
      {recentAlerts.length > 0 && (
        <div className="rounded-2xl border border-emerald-200/90 bg-emerald-50/60 p-4 space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-emerald-900">
            <span className="flex items-center gap-1.5">
              <Zap className="h-4 w-4 text-emerald-600 animate-bounce" />
              <span>Newly Detected Hyperliquid Listings</span>
            </span>
            <span className="text-[11px] font-normal text-emerald-700">
              Discovered in current session
            </span>
          </div>

          <div className="divide-y divide-emerald-100">
            {recentAlerts.slice(0, 3).map((alert) => {
              const m = markets.find((item) => String(item.market_id) === alert.market_id);
              return (
                <div
                  key={alert.market_id}
                  className="py-2 first:pt-1 last:pb-0 flex items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-neutral-950 font-mono">
                      {alert.token_symbol}
                    </span>
                    <span className="uppercase text-[10px] font-semibold text-emerald-800 bg-emerald-100/80 px-1.5 py-0.5 rounded">
                      {alert.market_type}
                    </span>
                    <span className="text-neutral-500">
                      Detected {new Date(alert.detection_timestamp).toLocaleTimeString()}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {m && (
                      <button
                        type="button"
                        onClick={() => onSelectMarket(m)}
                        className="font-semibold text-emerald-800 hover:text-emerald-950 inline-flex items-center gap-1 cursor-pointer"
                      >
                        <span>View</span>
                        <ArrowRight className="h-3 w-3" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => dismissAlert(alert.market_id)}
                      className="text-neutral-400 hover:text-neutral-600 text-xs px-1"
                    >
                      ×
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. Search & Filter Bar */}
      <div className="space-y-3">
        <SearchInput
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Search Hyperliquid tokens by symbol or address..."
        />

        <FilterTabs
          tabs={filterOptions}
          activeTab={activeFilter}
          onChange={setActiveFilter}
          ariaLabel="Hyperliquid market filter tabs"
        />
      </div>

      {/* 4. Listings Grid */}
      {filteredMarkets.length === 0 ? (
        <EmptyState
          title="No Hyperliquid markets match your filter"
          description="Try selecting a different filter or clearing your search query."
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredMarkets.map((market) => (
            <HyperliquidMarketCard
              key={market.id}
              market={market}
              onSelect={onSelectMarket}
            />
          ))}
        </div>
      )}
    </div>
  );
}
