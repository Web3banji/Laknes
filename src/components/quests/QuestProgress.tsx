import React from 'react';

export interface QuestProgressProps {
  completed: number;
  total: number;
  className?: string;
}

export function QuestProgress({
  completed,
  total,
  className = '',
}: QuestProgressProps) {
  const percentage =
    total === 0 ? 0 : Math.min(100, (completed / total) * 100);

  return (
    <div className={className}>
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs font-medium text-neutral-500">
          Progress
        </span>

        <span className="text-xs font-medium text-neutral-900 font-mono tabular-nums">
          {completed}/{total}
        </span>
      </div>

      <div className="h-1.5 overflow-hidden rounded-full bg-neutral-100">
        <div
          className="h-full rounded-full bg-neutral-950 transition-[width] duration-300"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
