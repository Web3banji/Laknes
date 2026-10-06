import React from 'react';
import { Button } from './Button';

export interface ErrorStateProps {
  title?: string;
  description?: string;
  action?: string;
  onRetry?: () => void;
}

export function ErrorState({
  title = 'Discovery data unavailable',
  description = "We couldn't load the latest ecosystem activity.",
  action = 'Retry',
  onRetry,
}: ErrorStateProps) {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-8 sm:p-10 text-center max-w-lg mx-auto space-y-4">
      <div className="space-y-1.5">
        <h3 className="text-base font-semibold text-neutral-950">{title}</h3>
        <p className="text-sm text-neutral-500 leading-relaxed">{description}</p>
      </div>

      {onRetry && (
        <div className="pt-2">
          <Button variant="secondary" size="sm" onClick={onRetry}>
            {action}
          </Button>
        </div>
      )}
    </div>
  );
}
