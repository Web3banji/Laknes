import React from 'react';
import { SearchResult } from '../../data/types';
import { ArrowRight, ExternalLink } from 'lucide-react';
import { Badge } from '../ui/Badge';
import { Avatar } from '../ui/Avatar';
import { formatAddress } from '../../lib/formatters';

export interface SearchResultsProps {
  query: string;
  results: SearchResult[];
  selectedIndex?: number;
  onSelectResult: (result: SearchResult) => void;
}

export function SearchResults({
  query,
  results,
  selectedIndex = -1,
  onSelectResult,
}: SearchResultsProps) {
  if (!query.trim()) {
    return null;
  }

  if (results.length === 0) {
    // Context-sensitive empty message
    const isAddress = /^0x/i.test(query.trim());
    return (
      <div className="rounded-2xl border border-neutral-200 bg-white p-8 sm:p-10 text-center max-w-lg mx-auto">
        <h4 className="text-base font-semibold text-neutral-950">
          {isAddress ? 'No address found' : 'No results found'}
        </h4>
        <p className="mt-1 text-xs text-neutral-500 leading-relaxed">
          {isAddress
            ? 'Check the 42-character hex address format and try again.'
            : `No projects, tokens, or addresses matched “${query}”.`}
        </p>
      </div>
    );
  }

  const projectResults = results.filter((r) => r.type === 'project');
  const tokenResults = results.filter((r) => r.type === 'token');
  const hyperliquidResults = results.filter((r) => r.type === 'hyperliquid');
  const addressResults = results.filter((r) => r.type === 'address');

  let itemCounter = 0;

  return (
    <div className="space-y-6">
      {/* 1. Hyperliquid Markets Group */}
      {hyperliquidResults.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
              Hyperliquid Markets ({hyperliquidResults.length})
            </h3>
          </div>

          <div className="rounded-2xl border border-neutral-200 bg-white divide-y divide-neutral-100 overflow-hidden shadow-2xs">
            {hyperliquidResults.map((res) => {
              const currentIndex = itemCounter++;
              const isSelected = selectedIndex === currentIndex;

              return (
                <div
                  key={res.id}
                  onClick={() => onSelectResult(res)}
                  className={`p-4 flex items-center justify-between transition-colors cursor-pointer ${
                    isSelected ? 'bg-neutral-100/80' : 'hover:bg-neutral-50/70'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 font-mono text-xs font-bold border border-emerald-200/60">
                      HL
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-neutral-950 font-mono">
                          {res.title}
                        </span>
                        <Badge variant="success">Hyperliquid</Badge>
                      </div>
                      {res.subtitle && (
                        <p className="text-xs text-neutral-500 mt-0.5">
                          {res.subtitle}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1 text-xs font-semibold text-neutral-900 shrink-0">
                    <span>View Market</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* 2. Projects Group */}
      {projectResults.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
              Projects ({projectResults.length})
            </h3>
          </div>

          <div className="rounded-2xl border border-neutral-200 bg-white divide-y divide-neutral-100 overflow-hidden shadow-2xs">
            {projectResults.map((res) => {
              const currentIndex = itemCounter++;
              const isSelected = selectedIndex === currentIndex;

              return (
                <div
                  key={res.id}
                  onClick={() => onSelectResult(res)}
                  className={`p-4 flex items-center justify-between transition-colors cursor-pointer ${
                    isSelected ? 'bg-neutral-100/80' : 'hover:bg-neutral-50/70'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Avatar name={res.title} size="sm" />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-neutral-950">
                          {res.title}
                        </span>
                        <Badge variant="neutral">Project</Badge>
                      </div>
                      {res.subtitle && (
                        <p className="text-xs text-neutral-400 mt-0.5">
                          {res.subtitle}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1 text-xs font-semibold text-neutral-900 shrink-0">
                    <span>Explore</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* 2. Tokens / Markets Group */}
      {tokenResults.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
              Tokens ({tokenResults.length})
            </h3>
          </div>

          <div className="rounded-2xl border border-neutral-200 bg-white divide-y divide-neutral-100 overflow-hidden shadow-2xs">
            {tokenResults.map((res) => {
              const currentIndex = itemCounter++;
              const isSelected = selectedIndex === currentIndex;

              return (
                <div
                  key={res.id}
                  onClick={() => onSelectResult(res)}
                  className={`p-4 flex items-center justify-between transition-colors cursor-pointer ${
                    isSelected ? 'bg-neutral-100/80' : 'hover:bg-neutral-50/70'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Avatar name={res.title} symbol={res.title} size="sm" />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-neutral-950 font-mono">
                          {res.title}
                        </span>
                        <Badge variant="neutral">Token</Badge>
                      </div>
                      {res.subtitle && (
                        <p className="text-xs text-neutral-400 mt-0.5">
                          {res.subtitle}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1 text-xs font-semibold text-neutral-900 shrink-0">
                    <span>View Market</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* 3. Addresses Group */}
      {addressResults.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
              Addresses ({addressResults.length})
            </h3>
          </div>

          <div className="rounded-2xl border border-neutral-200 bg-white divide-y divide-neutral-100 overflow-hidden shadow-2xs">
            {addressResults.map((res) => {
              const currentIndex = itemCounter++;
              const isSelected = selectedIndex === currentIndex;

              return (
                <div
                  key={res.id}
                  onClick={() => onSelectResult(res)}
                  className={`p-4 flex items-center justify-between transition-colors cursor-pointer ${
                    isSelected ? 'bg-neutral-100/80' : 'hover:bg-neutral-50/70'
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-mono font-medium text-neutral-950">
                        {formatAddress(res.title, 10, 8)}
                      </span>
                      <Badge variant="success">Elysium Address</Badge>
                    </div>
                    <p className="text-xs text-neutral-400 mt-0.5">
                      Verified address lookup on Elysium Blockscout
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5 text-xs font-medium text-neutral-700 hover:text-neutral-950 shrink-0">
                    <span>Inspect</span>
                    <ExternalLink className="h-3.5 w-3.5 text-neutral-400" />
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
