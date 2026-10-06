import React from 'react';
import { Project } from '../../data/types';
import { Badge } from '../ui/Badge';
import { Avatar } from '../ui/Avatar';
import { ArrowRight } from 'lucide-react';

export interface ProjectCardProps {
  project: Project;
  onSelect?: (project: Project) => void;
}

export function ProjectCard({ project, onSelect }: ProjectCardProps) {
  return (
    <article
      onClick={() => onSelect?.(project)}
      className="group rounded-2xl border border-neutral-200 bg-white p-5 sm:p-6 transition-all duration-200 hover:border-neutral-300 hover:shadow-[0_4px_20px_rgba(0,0,0,0.03)] cursor-pointer flex flex-col justify-between"
    >
      <div>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <Avatar
              name={project.name}
              symbol={project.symbol}
              imageUrl={project.logoUrl}
              size="md"
            />
            <div>
              <h3 className="text-base font-semibold text-neutral-950 group-hover:text-neutral-800 transition-colors">
                {project.name}
              </h3>
              <div className="flex items-center gap-2 text-xs text-neutral-500 mt-0.5">
                {project.symbol && <span className="font-mono">{project.symbol}</span>}
                {project.category && <span>· {project.category}</span>}
              </div>
            </div>
          </div>

          {project.status && (
            <Badge variant="neutral">{project.status}</Badge>
          )}
        </div>

        <p className="mt-4 text-xs sm:text-sm text-neutral-600 line-clamp-2 leading-relaxed">
          {project.description}
        </p>
      </div>

      <div className="mt-5 pt-3.5 border-t border-neutral-100 flex items-center justify-between">
        <span className="text-xs font-mono text-neutral-400">
          Chain: {project.chain || 'Elysium'}
        </span>

        <span className="text-xs font-semibold text-neutral-950 inline-flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
          <span>Explore</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </span>
      </div>
    </article>
  );
}
