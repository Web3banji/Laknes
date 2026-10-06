import React from 'react';
import { Project, MarketAsset, DiscoveryItem } from '../../data/types';
import { Badge } from '../ui/Badge';
import { Avatar } from '../ui/Avatar';
import { ProjectInsight } from './ProjectInsight';
import { ArrowLeft, ExternalLink, ArrowRight } from 'lucide-react';
import { formatCurrency, formatNumber } from '../../lib/formatters';

export interface ProjectDetailPageProps {
  project: Project;
  relatedMarket?: MarketAsset | null;
  recentUpdates?: DiscoveryItem[];
  onBack: () => void;
  onSelectMarket?: (market: MarketAsset) => void;
  backLabel?: string;
}

export function ProjectDetailPage({
  project,
  relatedMarket,
  recentUpdates = [],
  onBack,
  onSelectMarket,
  backLabel,
}: ProjectDetailPageProps) {
  return (
    <div className="space-y-8">
      {/* Back button */}
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-xs font-medium text-neutral-500 hover:text-neutral-900 transition-colors cursor-pointer"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        <span>{backLabel || 'Back to Projects'}</span>
      </button>

      {/* 1. Project Header */}
      <section className="rounded-2xl border border-neutral-200 bg-white p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <Avatar
              name={project.name}
              symbol={project.symbol}
              imageUrl={project.logoUrl}
              size="lg"
            />

            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-semibold text-neutral-950">
                  {project.name}
                </h1>
                {project.symbol && (
                  <span className="font-mono text-sm text-neutral-400">
                    ({project.symbol})
                  </span>
                )}
                {project.category && (
                  <Badge variant="neutral">{project.category}</Badge>
                )}
                {project.status && (
                  <Badge variant="success">{project.status}</Badge>
                )}
              </div>

              <div className="text-xs text-neutral-500 font-mono">
                Chain: {project.chain || 'Elysium Mainnet'}
              </div>
            </div>
          </div>

          {project.websiteUrl && (
            <a
              href={project.websiteUrl}
              target="_blank"
              rel="noreferrer noopener"
              className="self-start sm:self-auto shrink-0 inline-flex items-center gap-1.5 rounded-xl border border-neutral-200 bg-white px-4 py-2 text-xs font-semibold text-neutral-900 hover:bg-neutral-50 transition-colors"
            >
              <span>Visit Website</span>
              <ExternalLink className="h-3.5 w-3.5 text-neutral-400" />
            </a>
          )}
        </div>
      </section>

      {/* 2. Overview */}
      <section className="rounded-2xl border border-neutral-200 bg-white p-6 sm:p-8 space-y-3">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
          Overview
        </h2>
        <div className="space-y-2">
          <h3 className="text-base font-semibold text-neutral-950">
            What is this?
          </h3>
          <p className="text-sm text-neutral-700 leading-relaxed">
            {project.description}
          </p>
        </div>
      </section>

      {/* 3. Why it matters */}
      {project.insight && (
        <ProjectInsight
          title={project.insight.title}
          explanation={project.insight.explanation}
          source={project.insight.source}
        />
      )}

      {/* 4. What's happening (Recent Updates) */}
      <section className="rounded-2xl border border-neutral-200 bg-white p-6 sm:p-8 space-y-4">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
          What&apos;s happening
        </h2>

        {recentUpdates.length === 0 ? (
          <p className="text-sm text-neutral-500">
            No recent updates logged for this project yet.
          </p>
        ) : (
          <div className="divide-y divide-neutral-100">
            {recentUpdates.map((update) => (
              <div key={update.id} className="py-3 first:pt-0 last:pb-0 space-y-1">
                <div className="flex items-center justify-between text-xs text-neutral-500">
                  <span className="font-semibold text-neutral-900">{update.title}</span>
                  {update.timestamp && (
                    <span className="font-mono text-neutral-400">{update.timestamp}</span>
                  )}
                </div>
                {update.description && (
                  <p className="text-xs text-neutral-600 leading-relaxed">
                    {update.description}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 5. Market */}
      {relatedMarket && (
        <section className="rounded-2xl border border-neutral-200 bg-white p-6 sm:p-8 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
              Market
            </h2>
            {onSelectMarket && (
              <button
                type="button"
                onClick={() => onSelectMarket(relatedMarket)}
                className="text-xs font-semibold text-neutral-950 hover:text-neutral-700 inline-flex items-center gap-1 cursor-pointer"
              >
                <span>View market page</span>
                <ArrowRight className="h-3 w-3" />
              </button>
            )}
          </div>

          <div className="p-4 rounded-xl border border-neutral-100 bg-neutral-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-neutral-950">
                  {relatedMarket.pair || relatedMarket.name}
                </span>
                <Badge variant="neutral">Spot AMM</Badge>
              </div>
              <div className="text-xs text-neutral-500">
                Trading Venue: <span className="font-medium text-neutral-800">{relatedMarket.venue}</span>
              </div>
            </div>

            <div className="flex items-center gap-4 text-xs font-mono">
              <div>
                <span className="text-[10px] text-neutral-400 uppercase block">Price</span>
                <span className="text-neutral-900">
                  {relatedMarket.price !== undefined ? formatCurrency(relatedMarket.price) : '—'}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-neutral-400 uppercase block">Volume</span>
                <span className="text-neutral-900">
                  {relatedMarket.volume24h !== undefined ? formatNumber(relatedMarket.volume24h) : '—'}
                </span>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 6. Explore */}
      <section className="rounded-2xl border border-neutral-200 bg-white p-6 sm:p-8 space-y-4">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
          Explore
        </h2>

        <div className="flex flex-wrap gap-2.5">
          {project.officialLinks && project.officialLinks.length > 0 ? (
            project.officialLinks.map((link) => (
              <a
                key={link.url}
                href={link.url}
                target="_blank"
                rel="noreferrer noopener"
                className="inline-flex items-center gap-1.5 rounded-xl border border-neutral-200 bg-white px-3.5 py-2 text-xs font-medium text-neutral-800 hover:bg-neutral-50 hover:border-neutral-300 transition-colors"
              >
                <span>{link.label}</span>
                <ExternalLink className="h-3 w-3 text-neutral-400" />
              </a>
            ))
          ) : (
            <a
              href={project.websiteUrl}
              target="_blank"
              rel="noreferrer noopener"
              className="inline-flex items-center gap-1.5 rounded-xl border border-neutral-200 bg-white px-3.5 py-2 text-xs font-medium text-neutral-800 hover:bg-neutral-50 hover:border-neutral-300 transition-colors"
            >
              <span>Official Website</span>
              <ExternalLink className="h-3 w-3 text-neutral-400" />
            </a>
          )}
        </div>
      </section>
    </div>
  );
}
