import React from 'react';
import { MarketAsset, Project } from '../../data/types';
import { ArrowLeft, ArrowRight, ExternalLink } from 'lucide-react';
import { Badge } from '../ui/Badge';
import { Avatar } from '../ui/Avatar';
import { formatCurrency, formatPercentage, formatNumber } from '../../lib/formatters';

export interface MarketDetailPageProps {
  asset: MarketAsset;
  relatedProject?: Project | null;
  onBack: () => void;
  onSelectProject?: (project: Project) => void;
  backLabel?: string;
}

export function MarketDetailPage({
  asset,
  relatedProject,
  onBack,
  onSelectProject,
  backLabel,
}: MarketDetailPageProps) {
  const priceDisplay = asset.price !== undefined ? formatCurrency(asset.price) : '—';
  const changeInfo = asset.change24h !== undefined ? formatPercentage(asset.change24h) : null;
  const volumeDisplay = asset.volume24h !== undefined ? formatNumber(asset.volume24h) : '—';
  const marketCapDisplay = asset.marketCap !== undefined ? formatCurrency(asset.marketCap) : '—';

  return (
    <div className="space-y-6">
      {/* Back button */}
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-xs font-medium text-neutral-500 hover:text-neutral-900 transition-colors cursor-pointer"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        <span>{backLabel || 'Back to Markets'}</span>
      </button>

      {/* Header Container */}
      <div className="rounded-2xl border border-neutral-200 bg-white p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <Avatar
              name={asset.name}
              symbol={asset.symbol}
              imageUrl={asset.logoUrl}
              size="lg"
            />

            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-semibold text-neutral-950">
                  {asset.name}
                </h1>
                <span className="font-mono text-sm text-neutral-400">
                  {asset.symbol}
                </span>
                {asset.verified && (
                  <Badge variant="success">Verified Market</Badge>
                )}
              </div>

              <div className="text-xs text-neutral-500 flex items-center gap-2">
                <span>Elysium Mainnet (Chain ID 1339)</span>
                {asset.venue && <span>· Venue: {asset.venue}</span>}
              </div>
            </div>
          </div>

          {asset.venueUrl && (
            <a
              href={asset.venueUrl}
              target="_blank"
              rel="noreferrer noopener"
              className="self-start sm:self-auto shrink-0 inline-flex items-center gap-1.5 rounded-xl border border-neutral-200 bg-white px-4 py-2 text-xs font-semibold text-neutral-900 hover:bg-neutral-50 transition-colors"
            >
              <span>DEX Interface</span>
              <ExternalLink className="h-3.5 w-3.5 text-neutral-400" />
            </a>
          )}
        </div>

        {/* Clean Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-neutral-100">
          <div className="rounded-xl bg-neutral-50/70 p-3.5 space-y-1">
            <span className="text-[11px] font-medium text-neutral-400 uppercase tracking-wider block">
              Price
            </span>
            <span className="text-sm font-mono font-semibold text-neutral-950">
              {priceDisplay}
            </span>
          </div>

          <div className="rounded-xl bg-neutral-50/70 p-3.5 space-y-1">
            <span className="text-[11px] font-medium text-neutral-400 uppercase tracking-wider block">
              24h
            </span>
            <span className="text-sm font-mono font-semibold text-neutral-950">
              {changeInfo ? changeInfo.formatted : '—'}
            </span>
          </div>

          <div className="rounded-xl bg-neutral-50/70 p-3.5 space-y-1">
            <span className="text-[11px] font-medium text-neutral-400 uppercase tracking-wider block">
              Volume
            </span>
            <span className="text-sm font-mono font-semibold text-neutral-950">
              {volumeDisplay}
            </span>
          </div>

          <div className="rounded-xl bg-neutral-50/70 p-3.5 space-y-1">
            <span className="text-[11px] font-medium text-neutral-400 uppercase tracking-wider block">
              Market Cap
            </span>
            <span className="text-sm font-mono font-semibold text-neutral-950">
              {marketCapDisplay}
            </span>
          </div>
        </div>
      </div>

      {/* About Section */}
      <section className="rounded-2xl border border-neutral-200 bg-white p-6 sm:p-8 space-y-3">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
          About
        </h2>
        <p className="text-sm text-neutral-700 leading-relaxed">
          {asset.description ||
            `Official market pairing for ${asset.name} (${asset.symbol}) facilitating decentralized liquidity routing on Elysium.`}
        </p>
      </section>

      {/* Related Project Section */}
      {relatedProject && (
        <section className="rounded-2xl border border-neutral-200 bg-white p-6 sm:p-8 space-y-4">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
            Related Project
          </h2>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-neutral-100 bg-neutral-50/50">
            <div className="flex items-center gap-3">
              <Avatar
                name={relatedProject.name}
                symbol={relatedProject.symbol}
                imageUrl={relatedProject.logoUrl}
                size="md"
              />
              <div>
                <h3 className="text-sm font-semibold text-neutral-950">
                  {relatedProject.name}
                </h3>
                <div className="text-xs text-neutral-500">
                  {relatedProject.category || 'Ecosystem'} · Elysium
                </div>
              </div>
            </div>

            {onSelectProject && (
              <button
                type="button"
                onClick={() => onSelectProject(relatedProject)}
                className="self-start sm:self-auto inline-flex items-center gap-1.5 text-xs font-semibold text-neutral-950 hover:text-neutral-700 transition-colors cursor-pointer"
              >
                <span>Explore project</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
