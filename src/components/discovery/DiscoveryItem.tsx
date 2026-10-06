import React from 'react';
import { DiscoveryItem as DiscoveryItemModel, Project, MarketAsset, TrendSignal } from '../../data/types';
import { ArrowRight, ExternalLink, Compass } from 'lucide-react';
import { Badge } from '../ui/Badge';
import { Avatar } from '../ui/Avatar';
import { formatCurrency, formatPercentage, formatNumber } from '../../lib/formatters';

export interface DiscoveryCardProps {
  item: DiscoveryItemModel;
  onSelectProject?: (project: Project) => void;
  onSelectMarket?: (market: MarketAsset) => void;
}

export function DiscoveryItem({
  item,
  onSelectProject,
  onSelectMarket,
}: DiscoveryCardProps) {
  const { type, title, description, timestamp, project, market, reason, signals, actionLabel, actionUrl } = item;

  const handleActionClick = () => {
    if (project && onSelectProject) {
      onSelectProject(project);
      return;
    }
    if (market && onSelectMarket) {
      onSelectMarket(market);
      return;
    }
    if (actionUrl) {
      window.open(actionUrl, '_blank', 'noreferrer,noopener');
    }
  };

  // Reusable Avatar component
  const renderAvatar = () => {
    return (
      <button
        type="button"
        onClick={handleActionClick}
        className="shrink-0 cursor-pointer hover:opacity-85 transition-opacity focus:outline-none"
        aria-label="View details"
      >
        {project ? (
          <Avatar
            name={project.name}
            symbol={project.symbol}
            imageUrl={project.logoUrl}
            size="md"
          />
        ) : market ? (
          <Avatar
            name={market.name}
            symbol={market.symbol}
            imageUrl={market.logoUrl}
            size="md"
          />
        ) : (
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-neutral-100 text-neutral-600 border border-neutral-200/60">
            <Compass className="h-5 w-5" />
          </div>
        )}
      </button>
    );
  };

  // FORMAT A: Hot Project
  if (type === 'hot_project') {
    return (
      <article className="py-6 transition-colors hover:bg-neutral-50/40 -mx-4 px-4 sm:-mx-6 sm:px-6 rounded-xl">
        <div className="flex items-start gap-3.5">
          {renderAvatar()}

          <div className="min-w-0 flex-1 space-y-3">
            {/* Meta header */}
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-neutral-950">
                  {project?.name || 'Project'}
                </span>
                <span className="text-neutral-300">·</span>
                <span className="text-xs font-medium text-neutral-500">
                  {project?.category || 'DeFi'}
                </span>
                <span className="text-neutral-300">·</span>
                <span className="text-xs font-medium text-neutral-500">
                  Elysium
                </span>
                <Badge variant="warning" size="sm">
                  Hot
                </Badge>
              </div>

              {timestamp && (
                <span className="text-xs font-mono text-neutral-400">
                  {timestamp}
                </span>
              )}
            </div>

            {/* Headline & Description */}
            <div className="space-y-1">
              <h2
                onClick={handleActionClick}
                className="text-sm font-semibold text-neutral-950 leading-snug cursor-pointer hover:text-neutral-700 transition-colors"
              >
                {title}
              </h2>
              {description && (
                <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed">
                  {description}
                </p>
              )}
            </div>

            {/* Why it's getting attention & Signals */}
            <div className="rounded-xl border border-neutral-200/70 bg-neutral-50/80 p-3.5 space-y-2">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
                Why it matters
              </div>

              {reason && (
                <p className="text-xs text-neutral-700 leading-relaxed">
                  {reason}
                </p>
              )}

              {/* Signals list */}
              <div className="pt-1.5 border-t border-neutral-200/60 space-y-1">
                <span className="text-[11px] font-semibold text-neutral-600 block">
                  Why it&apos;s getting attention
                </span>
                {signals && signals.length > 0 ? (
                  <ul className="text-xs text-neutral-600 space-y-0.5 list-disc list-inside">
                    {signals.map((sig, idx) => (
                      <li key={idx}>
                        {typeof sig === 'string' ? sig : sig.label}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-neutral-500 italic">
                    More activity data is needed to establish a reliable trend signal.
                  </p>
                )}
              </div>
            </div>

            {/* Action */}
            <div className="pt-1">
              <button
                type="button"
                onClick={handleActionClick}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-neutral-950 hover:text-neutral-700 transition-colors cursor-pointer group"
              >
                <span>{actionLabel || 'Explore project'}</span>
                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
              </button>
            </div>
          </div>
        </div>
      </article>
    );
  }

  // FORMAT B: Project Update
  if (type === 'update') {
    return (
      <article className="py-6 transition-colors hover:bg-neutral-50/40 -mx-4 px-4 sm:-mx-6 sm:px-6 rounded-xl">
        <div className="flex items-start gap-3.5">
          {renderAvatar()}

          <div className="min-w-0 flex-1 space-y-2.5">
            {/* Meta */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-neutral-950">
                  {project?.name || 'Project Update'}
                </span>
                {timestamp && (
                  <>
                    <span className="text-neutral-300">·</span>
                    <span className="text-xs font-mono text-neutral-400">
                      {timestamp}
                    </span>
                  </>
                )}
              </div>

              <Badge variant="neutral" size="sm">
                Update
              </Badge>
            </div>

            {/* Content */}
            <div className="space-y-1">
              <h2
                onClick={handleActionClick}
                className="text-sm font-semibold text-neutral-950 leading-snug cursor-pointer hover:text-neutral-700 transition-colors"
              >
                {title}
              </h2>
              {description && (
                <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed">
                  {description}
                </p>
              )}
            </div>

            {/* Why it matters */}
            {reason && (
              <div className="rounded-xl border border-neutral-100 bg-neutral-50 p-3 space-y-0.5">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500 block">
                  Why it matters
                </span>
                <p className="text-xs text-neutral-700 leading-relaxed">
                  {reason}
                </p>
              </div>
            )}

            {/* Action */}
            <div className="pt-1">
              <button
                type="button"
                onClick={handleActionClick}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-neutral-950 hover:text-neutral-700 transition-colors cursor-pointer group"
              >
                <span>{actionLabel || 'View project'}</span>
                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
              </button>
            </div>
          </div>
        </div>
      </article>
    );
  }

  // FORMAT C: Market Discovery
  if (type === 'market' || type === 'market_discovery') {
    return (
      <article className="py-6 transition-colors hover:bg-neutral-50/40 -mx-4 px-4 sm:-mx-6 sm:px-6 rounded-xl">
        <div className="flex items-start gap-3.5">
          {renderAvatar()}

          <div className="min-w-0 flex-1 space-y-3">
            {/* Meta */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Market discovery
                </span>
                <span className="text-neutral-300">·</span>
                <span className="text-xs font-medium text-neutral-500">
                  Elysium
                </span>
              </div>

              {timestamp && (
                <span className="text-xs font-mono text-neutral-400">
                  {timestamp}
                </span>
              )}
            </div>

            {/* Token / Pair identifier */}
            <div>
              <h2
                onClick={handleActionClick}
                className="text-sm font-semibold text-neutral-950 cursor-pointer hover:text-neutral-700 transition-colors inline-block"
              >
                {market?.pair || market?.name || title}
              </h2>
              <div className="text-xs text-neutral-500 mt-0.5">
                Venue: <span className="font-medium text-neutral-800">{market?.venue || 'Elysium Swap'}</span>
              </div>
            </div>

            {description && (
              <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed">
                {description}
              </p>
            )}

            {/* Honest Market Metrics Box (Price —, 24h —, Volume — if not connected) */}
            <div className="rounded-xl border border-neutral-200 bg-white p-3.5 grid grid-cols-3 gap-2">
              <div>
                <span className="text-[11px] text-neutral-400 font-medium block">Price</span>
                <span className="text-xs font-mono font-medium text-neutral-900">
                  {market?.price !== undefined ? formatCurrency(market.price) : '—'}
                </span>
              </div>
              <div>
                <span className="text-[11px] text-neutral-400 font-medium block">24h</span>
                <span className="text-xs font-mono font-medium text-neutral-900">
                  {market?.change24h !== undefined ? formatPercentage(market.change24h).formatted : '—'}
                </span>
              </div>
              <div>
                <span className="text-[11px] text-neutral-400 font-medium block">Volume</span>
                <span className="text-xs font-mono font-medium text-neutral-900">
                  {market?.volume24h !== undefined ? formatNumber(market.volume24h) : '—'}
                </span>
              </div>
            </div>

            {/* Why it matters */}
            {reason && (
              <div className="rounded-xl border border-neutral-100 bg-neutral-50 p-3 space-y-0.5">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500 block">
                  Why it matters
                </span>
                <p className="text-xs text-neutral-700 leading-relaxed">
                  {reason}
                </p>
              </div>
            )}

            {/* Action */}
            <div className="pt-1 flex items-center justify-between">
              <button
                type="button"
                onClick={handleActionClick}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-neutral-950 hover:text-neutral-700 transition-colors cursor-pointer group"
              >
                <span>{actionLabel || 'View market'}</span>
                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
              </button>

              {market?.venueUrl && (
                <a
                  href={market.venueUrl}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="text-xs text-neutral-500 hover:text-neutral-950 inline-flex items-center gap-1"
                >
                  <span>DEX</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>
          </div>
        </div>
      </article>
    );
  }

  // FORMAT D: New Project / Ecosystem item
  return (
    <article className="py-6 transition-colors hover:bg-neutral-50/40 -mx-4 px-4 sm:-mx-6 sm:px-6 rounded-xl">
      <div className="flex items-start gap-3.5">
        {renderAvatar()}

        <div className="min-w-0 flex-1 space-y-2.5">
          {/* Meta */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-neutral-500 uppercase tracking-wider">
                {type === 'new_project' ? 'New on Elysium' : 'Ecosystem Event'}
              </span>
              {project && (
                <>
                  <span className="text-neutral-300">·</span>
                  <span className="text-xs font-medium text-neutral-700">
                    {project.category || 'Infrastructure'}
                  </span>
                </>
              )}
            </div>

            {timestamp && (
              <span className="text-xs font-mono text-neutral-400">
                {timestamp}
              </span>
            )}
          </div>

          {/* Project title */}
          <div>
            <h2
              onClick={handleActionClick}
              className="text-sm font-semibold text-neutral-950 cursor-pointer hover:text-neutral-700 transition-colors inline-block"
            >
              {project?.name || title}
            </h2>
          </div>

          <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed">
            {description}
          </p>

          {/* Why it matters */}
          {reason && (
            <div className="rounded-xl border border-neutral-100 bg-neutral-50 p-3 space-y-0.5">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500 block">
                Why it matters
              </span>
              <p className="text-xs text-neutral-700 leading-relaxed">
                {reason}
              </p>
            </div>
          )}

          {/* Action */}
          <div className="pt-1 flex items-center justify-between">
            <button
              type="button"
              onClick={handleActionClick}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-neutral-950 hover:text-neutral-700 transition-colors cursor-pointer group"
            >
              <span>{actionLabel || 'Explore'}</span>
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
            </button>

            {actionUrl && (
              <a
                href={actionUrl}
                target="_blank"
                rel="noreferrer noopener"
                className="text-neutral-400 hover:text-neutral-700 p-1"
                aria-label="External Link"
              >
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}
