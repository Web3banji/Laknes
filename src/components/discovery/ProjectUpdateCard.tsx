import React from 'react';
import { Project } from '../../data/types';
import { ArrowRight } from 'lucide-react';

export interface ProjectUpdateCardProps {
  project: Project;
  title: string;
  updateText: string;
  reason?: string;
  timestamp?: string;
  onSelect?: () => void;
}

export function ProjectUpdateCard({
  project,
  title,
  updateText,
  reason,
  timestamp,
  onSelect,
}: ProjectUpdateCardProps) {
  return (
    <article className="rounded-2xl border border-neutral-200 bg-white p-5 space-y-3">
      <div className="flex items-center justify-between text-xs text-neutral-500">
        <span className="font-semibold text-neutral-900">{project.name}</span>
        {timestamp && <span className="font-mono text-neutral-400">{timestamp}</span>}
      </div>

      <h4 className="text-sm font-semibold text-neutral-950">{title}</h4>
      <p className="text-xs text-neutral-600 leading-relaxed">{updateText}</p>

      {reason && (
        <div className="rounded-lg bg-neutral-50 p-3 border border-neutral-100 text-xs text-neutral-700">
          <span className="font-semibold text-neutral-900 block mb-0.5">Why it matters</span>
          {reason}
        </div>
      )}

      {onSelect && (
        <button
          type="button"
          onClick={onSelect}
          className="text-xs font-semibold text-neutral-950 hover:text-neutral-700 inline-flex items-center gap-1 cursor-pointer pt-1"
        >
          <span>Explore project</span>
          <ArrowRight className="h-3 w-3" />
        </button>
      )}
    </article>
  );
}
