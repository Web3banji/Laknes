import React from 'react';
import { Opportunity } from '../../core/ecosystem/types';
import { ArrowUpRight, ArrowRight, Sparkles, CheckCircle2 } from 'lucide-react';
import { Button } from '../../design-system/primitives/Button';

export interface OpportunityCardProps {
  opportunity: Opportunity;
  onAction: (opportunity: Opportunity) => void;
}

export function OpportunityCard({ opportunity, onAction }: OpportunityCardProps) {
  const categoryBadgeColors: Record<string, string> = {
    'Liquidity Migration': 'bg-indigo-50 text-indigo-700 border-indigo-100',
    'Ecosystem Test': 'bg-emerald-50 text-emerald-700 border-emerald-100',
    'Community Role': 'bg-neutral-100 text-neutral-800 border-neutral-200',
    Grant: 'bg-amber-50 text-amber-800 border-amber-200',
  };

  const badgeStyle =
    categoryBadgeColors[opportunity.category] ||
    'bg-neutral-100 text-neutral-700 border-neutral-200';

  return (
    <article className="group rounded-2xl border border-neutral-200 bg-white p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-neutral-300 hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] flex flex-col justify-between">
      <div>
        <div className="flex items-start justify-between gap-3">
          <span
            className={`inline-flex items-center rounded-lg border px-2.5 py-0.5 text-xs font-medium ${badgeStyle}`}
          >
            {opportunity.category}
          </span>

          {opportunity.projectName && (
            <span className="text-xs text-neutral-400 font-medium">
              {opportunity.projectName}
            </span>
          )}
        </div>

        <h3 className="mt-4 text-base font-semibold text-neutral-950 group-hover:text-neutral-800 transition-colors">
          {opportunity.title}
        </h3>

        <p className="mt-2 text-sm leading-6 text-neutral-500">
          {opportunity.description}
        </p>
      </div>

      <div className="mt-5 border-t border-neutral-100 pt-4 flex items-center justify-between">
        <span className="text-xs text-neutral-400">
          Elysium Ecosystem
        </span>

        <button
          type="button"
          onClick={() => onAction(opportunity)}
          className="inline-flex items-center gap-1 text-sm font-medium text-neutral-950 hover:text-neutral-700 transition-colors cursor-pointer group-hover:translate-x-0.5"
        >
          <span>{opportunity.actionLabel}</span>
          {opportunity.actionType === 'external_link' ? (
            <ArrowUpRight className="w-3.5 h-3.5" />
          ) : (
            <ArrowRight className="w-3.5 h-3.5" />
          )}
        </button>
      </div>
    </article>
  );
}
