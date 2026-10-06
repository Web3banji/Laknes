import React from 'react';
import { Project } from '../../data/types';
import { Badge } from '../ui/Badge';
import { ArrowRight } from 'lucide-react';

export interface HotProjectCardProps {
  project: Project;
  onSelect?: (project: Project) => void;
}

export function HotProjectCard({ project, onSelect }: HotProjectCardProps) {
  return (
    <div
      onClick={() => onSelect?.(project)}
      className="rounded-2xl border border-neutral-200 bg-white p-5 hover:border-neutral-300 hover:shadow-[0_4px_20px_rgba(0,0,0,0.03)] transition-all cursor-pointer space-y-3"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-neutral-100 font-mono text-xs font-bold text-neutral-800">
            {project.symbol || project.name.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <h4 className="text-sm font-semibold text-neutral-950">{project.name}</h4>
            <div className="flex items-center gap-2 text-xs text-neutral-500">
              {project.symbol && <span className="font-mono">{project.symbol}</span>}
              {project.category && <span>· {project.category}</span>}
            </div>
          </div>
        </div>

        {project.status && (
          <Badge variant="neutral">{project.status}</Badge>
        )}
      </div>

      <p className="text-xs text-neutral-600 line-clamp-2 leading-relaxed">
        {project.description}
      </p>

      <div className="pt-1 flex items-center justify-between text-xs border-t border-neutral-100">
        <span className="text-neutral-400 font-mono">Chain: {project.chain || 'Elysium'}</span>
        <span className="font-medium text-neutral-950 inline-flex items-center gap-1">
          Explore <ArrowRight className="h-3 w-3" />
        </span>
      </div>
    </div>
  );
}
