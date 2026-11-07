/**
 * LAKNES Standardized Project Card (Yochi Editorial Design System)
 * 1.5px ink/line border, warm paper background, crisp editorial corners, and mono metadata.
 */

import React, { useState } from 'react';
import { Project, ProjectVerificationStatus } from '../../types/contracts.ts';
import { StatusBadge } from './StatusBadge.tsx';

interface ProjectCardProps {
  project: Project;
  onSelect: (project: Project) => void;
  isSaved?: boolean;
  onToggleSave?: (projectId: string, e: React.MouseEvent) => void;
}

export function ProjectCard({ project, onSelect, isSaved, onToggleSave }: ProjectCardProps) {
  const [imgError, setImgError] = useState(false);

  return (
    <div
      onClick={() => onSelect(project)}
      className="group flex flex-col bg-[var(--yo-surface-1)] border-[1.5px] border-[var(--yo-line)] hover:border-[var(--yo-ink)] transition-all duration-150 hover:-translate-y-0.5 hover:shadow-[4px_4px_0_var(--yo-ink)] cursor-pointer overflow-hidden rounded-[2px]"
    >
      {/* Visual Frame */}
      <div className="relative w-full aspect-[16/10] overflow-hidden bg-[var(--yo-surface-2)] border-b border-[var(--yo-line)]">
        {project.bannerUrl && !imgError ? (
          <img
            src={project.bannerUrl}
            alt={project.name}
            onError={() => setImgError(true)}
            className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center bg-[var(--yo-surface-2)]">
            <span className="w-10 h-10 border border-[var(--yo-line)] bg-[var(--yo-surface-1)] flex items-center justify-center mb-2 font-mono font-bold text-base text-[var(--yo-ink)]">
              {project.name.slice(0, 1).toUpperCase()}
            </span>
            <span className="yo-display text-sm text-[var(--yo-ink)] font-normal">{project.name}</span>
          </div>
        )}

        {/* Top Badges */}
        <div className="absolute top-3 left-3">
          <span className="lp-chip font-bold">
            {project.category}
          </span>
        </div>

        <div className="absolute top-3 right-3 flex items-center gap-1.5">
          {onToggleSave && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleSave(project.id, e);
              }}
              className="p-1 border border-[var(--yo-line)] bg-[var(--yo-surface-1)] text-[var(--yo-ink)] hover:border-[var(--yo-ink)] transition-colors cursor-pointer"
              title={isSaved ? 'Remove from saved' : 'Save project'}
            >
              <span className="material-symbols-outlined text-[14px]">
                {isSaved ? 'bookmark_added' : 'bookmark'}
              </span>
            </button>
          )}
          <StatusBadge status={project.verificationStatus} />
        </div>
      </div>

      {/* Card Body */}
      <div className="p-5 flex flex-col flex-grow justify-between gap-4">
        <div>
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-1.5 min-w-0">
              <h3 className="yo-display text-lg text-[var(--yo-ink)] group-hover:text-[var(--yo-accent-text)] transition-colors truncate">
                {project.name}
              </h3>
              {project.verificationStatus === ProjectVerificationStatus.VERIFIED && (
                <span
                  className="material-symbols-outlined text-[16px] text-[var(--yo-good)] shrink-0"
                  title="Verified Project"
                >
                  verified
                </span>
              )}
            </div>
            {project.ecosystem && (
              <span className="font-mono text-[10px] font-bold text-[var(--yo-muted)] uppercase tracking-wider shrink-0">
                {project.ecosystem}
              </span>
            )}
          </div>

          <p className="font-body text-xs text-[var(--yo-muted)] mt-2 line-clamp-2 leading-relaxed">
            {project.shortDescription}
          </p>
        </div>

        <div className="pt-3 flex items-center justify-between border-t border-[var(--yo-line)] font-mono text-[10px]">
          <span className="text-[var(--yo-muted)] font-bold tracking-wider uppercase">
            {project.verificationStatus === ProjectVerificationStatus.VERIFIED ? 'VERIFIED DIRECTORY' : 'PENDING REVIEW'}
          </span>

          <span className="inline-flex items-center gap-1 font-bold text-[var(--yo-ink)] group-hover:underline">
            <span>VIEW</span>
            <span aria-hidden="true">↗</span>
          </span>
        </div>
      </div>
    </div>
  );
}
