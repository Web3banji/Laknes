import React from 'react';
import { ProjectInsight as ProjectInsightModel } from '../../data/types';

export interface ProjectInsightProps {
  title?: string;
  explanation: string;
  source?: string;
}

export function ProjectInsight({
  title = 'Why it matters',
  explanation,
  source,
}: ProjectInsightProps) {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-neutral-50/70 p-6 sm:p-7 space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
          {title}
        </h3>
        {source && (
          <span className="text-[11px] font-mono text-neutral-400">
            Source: {source}
          </span>
        )}
      </div>

      <p className="text-sm text-neutral-800 leading-relaxed font-normal">
        {explanation}
      </p>
    </div>
  );
}
