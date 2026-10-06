import React from 'react';
import { MarketAsset } from '../../data/types';
import { MarketRow } from './MarketRow';
import { EmptyState } from '../ui/EmptyState';

export interface MarketTableProps {
  markets: MarketAsset[];
  onSelectMarket?: (asset: MarketAsset) => void;
}

export function MarketTable({ markets, onSelectMarket }: MarketTableProps) {
  if (markets.length === 0) {
    return (
      <EmptyState
        title="No market data available"
        description="Market information hasn't been connected yet."
      />
    );
  }

  return (
    <div className="rounded-2xl border border-neutral-200 bg-white overflow-hidden shadow-2xs">
      <div className="w-full">
        <table className="w-full text-left border-collapse">
          {/* Desktop Table Header (hidden on mobile) */}
          <thead className="hidden sm:table-header-group">
            <tr className="border-b border-neutral-200/80 bg-neutral-50/50 text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
              <th className="py-3 px-4 sm:px-6">Asset</th>
              <th className="py-3 px-4 text-right">Price</th>
              <th className="py-3 px-4 text-right">24h</th>
              <th className="py-3 px-4 text-right">Volume</th>
              <th className="py-3 px-4 sm:px-6 text-right">Market Cap</th>
            </tr>
          </thead>
          <tbody>
            {markets.map((asset) => (
              <MarketRow
                key={asset.id}
                asset={asset}
                onSelect={onSelectMarket}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
