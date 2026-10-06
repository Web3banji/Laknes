import React from 'react';
import { MarketAsset } from '../../data/types';
import { Badge } from '../ui/Badge';
import { ExternalLink, ArrowRight } from 'lucide-react';
import { formatCurrency, formatPercentage, formatNumber } from '../../lib/formatters';

export interface MarketRowProps {
  asset: MarketAsset;
  onSelect?: (asset: MarketAsset) => void;
}

export function MarketRow({ asset, onSelect }: MarketRowProps) {
  const priceDisplay = asset.price !== undefined ? formatCurrency(asset.price) : '—';
  const changeInfo = asset.change24h !== undefined ? formatPercentage(asset.change24h) : null;
  const volumeDisplay = asset.volume24h !== undefined ? formatNumber(asset.volume24h) : '—';
  const marketCapDisplay = asset.marketCap !== undefined ? formatCurrency(asset.marketCap) : '—';

  return (
    <>
      {/* Desktop Table Row (hidden on small screens) */}
      <tr
        onClick={() => onSelect?.(asset)}
        className="hidden sm:table-row border-b border-neutral-100 hover:bg-neutral-50/70 transition-colors cursor-pointer group"
      >
        {/* Asset */}
        <td className="py-4 px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-neutral-100 font-mono text-xs font-bold text-neutral-800 border border-neutral-200/60">
              {asset.symbol.slice(0, 3)}
            </div>
            <div>
              <div className="font-semibold text-sm text-neutral-950 group-hover:text-neutral-700 transition-colors">
                {asset.name}
              </div>
              <div className="text-xs text-neutral-400 font-mono flex items-center gap-1.5">
                <span>{asset.symbol}</span>
                {asset.venue && <span>· {asset.venue}</span>}
              </div>
            </div>
          </div>
        </td>

        {/* Price */}
        <td className="py-4 px-4 text-xs font-mono text-neutral-900 text-right">
          {priceDisplay === '—' ? <span className="text-neutral-400">—</span> : priceDisplay}
        </td>

        {/* 24h Change */}
        <td className="py-4 px-4 text-xs font-mono text-right">
          {changeInfo ? (
            <span
              className={
                changeInfo.isPositive
                  ? 'text-emerald-700 font-medium'
                  : changeInfo.isNegative
                  ? 'text-red-700 font-medium'
                  : 'text-neutral-400'
              }
            >
              {changeInfo.formatted}
            </span>
          ) : (
            <span className="text-neutral-400">—</span>
          )}
        </td>

        {/* Volume */}
        <td className="py-4 px-4 text-xs font-mono text-neutral-900 text-right">
          {volumeDisplay === '—' ? <span className="text-neutral-400">—</span> : volumeDisplay}
        </td>

        {/* Market Cap */}
        <td className="py-4 px-4 sm:px-6 text-xs font-mono text-neutral-900 text-right">
          {marketCapDisplay === '—' ? <span className="text-neutral-400">—</span> : marketCapDisplay}
        </td>
      </tr>

      {/* Mobile Card Layout (visible only on small screens) */}
      <tr className="sm:hidden border-b border-neutral-100">
        <td colSpan={5} className="p-4">
          <div
            onClick={() => onSelect?.(asset)}
            className="space-y-3 cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-neutral-100 font-mono text-xs font-bold text-neutral-800">
                  {asset.symbol.slice(0, 3)}
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-neutral-950">{asset.name}</h4>
                  <div className="text-xs text-neutral-400 font-mono">{asset.symbol}</div>
                </div>
              </div>

              <div className="text-xs font-semibold text-neutral-950 inline-flex items-center gap-1">
                <span>Explore</span>
                <ArrowRight className="h-3 w-3" />
              </div>
            </div>

            <div className="grid grid-cols-4 gap-2 pt-2 border-t border-neutral-100 text-center">
              <div>
                <span className="text-[10px] text-neutral-400 uppercase font-medium block">Price</span>
                <span className="text-xs font-mono text-neutral-900">
                  {priceDisplay === '—' ? '—' : priceDisplay}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-neutral-400 uppercase font-medium block">24h</span>
                <span className="text-xs font-mono text-neutral-900">
                  {changeInfo ? changeInfo.formatted : '—'}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-neutral-400 uppercase font-medium block">Volume</span>
                <span className="text-xs font-mono text-neutral-900">
                  {volumeDisplay}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-neutral-400 uppercase font-medium block">M. Cap</span>
                <span className="text-xs font-mono text-neutral-900">
                  {marketCapDisplay}
                </span>
              </div>
            </div>
          </div>
        </td>
      </tr>
    </>
  );
}
