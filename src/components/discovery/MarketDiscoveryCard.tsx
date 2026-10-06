import React from 'react';
import { MarketAsset } from '../../data/types';
import { ExternalLink, ArrowRight } from 'lucide-react';
import { Badge } from '../ui/Badge';

export interface MarketDiscoveryCardProps {
  market: MarketAsset;
  reason?: string;
  onSelect?: () => void;
}

export function MarketDiscoveryCard({
  market,
  reason,
  onSelect,
}: MarketDiscoveryCardProps) {
  return (
    <article className="rounded-2xl border border-neutral-200 bg-white p-5 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-neutral-950">{market.pair || market.name}</span>
          <Badge variant="neutral">Spot AMM</Badge>
        </div>
        <span className="text-xs text-neutral-400 font-mono">Elysium</span>
      </div>

      <div className="text-xs text-neutral-500">
        Trading Venue: <span className="font-medium text-neutral-800">{market.venue}</span>
      </div>

      {reason && (
        <div className="rounded-lg bg-neutral-50 p-3 border border-neutral-100 text-xs text-neutral-700">
          <span className="font-semibold text-neutral-900 block mb-0.5">Why it matters</span>
          {reason}
        </div>
      )}

      <div className="pt-1 flex items-center justify-between">
        {onSelect && (
          <button
            type="button"
            onClick={onSelect}
            className="text-xs font-semibold text-neutral-950 hover:text-neutral-700 inline-flex items-center gap-1 cursor-pointer"
          >
            <span>Inspect market</span>
            <ArrowRight className="h-3 w-3" />
          </button>
        )}

        {market.venueUrl && (
          <a
            href={market.venueUrl}
            target="_blank"
            rel="noreferrer noopener"
            className="inline-flex items-center gap-1 text-xs font-medium text-neutral-600 hover:text-neutral-950"
          >
            <span>DEX Interface</span>
            <ExternalLink className="h-3 w-3" />
          </a>
        )}
      </div>
    </article>
  );
}
