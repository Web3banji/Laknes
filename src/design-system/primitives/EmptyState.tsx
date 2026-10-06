import React from 'react';
import { Button } from './Button';

export interface EmptyStateProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
  // Optional convenience helpers for backwards compatibility
  icon?: React.ReactNode;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export function EmptyState({
  title,
  description,
  action,
  icon,
  actionLabel,
  onAction,
  className = '',
}: EmptyStateProps) {
  // If action wasn't passed directly as a ReactNode, but actionLabel was passed
  const resolvedAction =
    action ||
    (actionLabel && onAction ? (
      <Button variant="secondary" onClick={onAction}>
        {actionLabel}
      </Button>
    ) : null);

  return (
    <div className={`flex min-h-[280px] flex-col items-center justify-center px-6 text-center ${className}`}>
      <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-neutral-200 bg-neutral-50 text-sm font-medium text-neutral-400">
        {icon || '—'}
      </div>

      <h3 className="mt-4 text-sm font-semibold text-neutral-950">
        {title}
      </h3>

      {description && (
        <p className="mt-2 max-w-sm text-sm leading-6 text-neutral-500">
          {description}
        </p>
      )}

      {resolvedAction && <div className="mt-5">{resolvedAction}</div>}
    </div>
  );
}
