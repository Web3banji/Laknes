import React from 'react';
import { Project } from '../../data/types';
import { Badge } from '../ui/Badge';
import { ExternalLink, ArrowLeft } from 'lucide-react';
import { Button } from '../ui/Button';

export interface ProjectHeaderProps {
  project: Project;
  onBack?: () => void;
}

export function ProjectHeader({ project, onBack }: ProjectHeaderProps) {
  return (
    <div className="space-y-4">
      {onBack && (
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-neutral-500 hover:text-neutral-900 transition-colors cursor-pointer"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Discovery</span>
        </button>
      )}

      <div className="rounded-2xl border border-neutral-200 bg-white p-6 sm:p-8 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-neutral-100 font-mono text-base font-bold text-neutral-800">
              {project.symbol || project.name.slice(0, 2).toUpperCase()}
            </div>

            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-semibold text-neutral-950">
                  {project.name}
                </h1>
                {project.symbol && (
                  <span className="font-mono text-sm text-neutral-400">({project.symbol})</span>
                )}
                {project.category && <Badge variant="neutral">{project.category}</Badge>}
                {project.status && <Badge variant="success">{project.status}</Badge>}
              </div>

              <p className="text-sm text-neutral-600 max-w-2xl leading-relaxed">
                {project.description}
              </p>
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

        <div className="pt-4 border-t border-neutral-100 flex flex-wrap items-center gap-6 text-xs text-neutral-500">
          <div>
            <span>Chain: </span>
            <span className="font-medium text-neutral-900">{project.chain || 'Elysium'}</span>
          </div>
          <div>
            <span>Verified Contracts: </span>
            <span className="font-medium text-neutral-900">{project.contractsCount || 0}</span>
          </div>
          <div>
            <span>Paired Markets: </span>
            <span className="font-medium text-neutral-900">{project.marketsCount || 0}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
