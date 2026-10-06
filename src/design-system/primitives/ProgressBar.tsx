import React from 'react';

export interface ProgressBarProps {
  value: number; // 0 to 100
  max?: number;
  label?: string;
  showValue?: boolean;
  size?: 'sm' | 'md';
  variant?: 'brand' | 'neutral';
  indeterminate?: boolean;
  className?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  max = 100,
  label,
  showValue = false,
  size = 'md',
  variant = 'brand',
  indeterminate = false,
  className = '',
}) => {
  const percentage = Math.min(100, Math.max(0, Math.round((value / max) * 100)));
  const heightClass = size === 'sm' ? 'h-1' : 'h-1.5';
  const fillGradient =
    variant === 'brand'
      ? 'bg-gradient-to-r from-indigo-600 via-violet-600 to-sky-400'
      : 'bg-neutral-950';

  return (
    <div className={`w-full space-y-1.5 ${className}`}>
      {(label || showValue) && (
        <div className="flex items-center justify-between text-xs text-neutral-600">
          {label && <span className="font-medium text-neutral-800">{label}</span>}
          {showValue && (
            <span className="font-mono tabular-nums text-neutral-500">
              {percentage}%
            </span>
          )}
        </div>
      )}

      <div
        role="progressbar"
        aria-valuenow={indeterminate ? undefined : percentage}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label || 'Progress'}
        className={`w-full overflow-hidden rounded-full bg-neutral-100 ${heightClass}`}
      >
        {indeterminate ? (
          <div className="h-full w-1/3 bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full animate-pulse" />
        ) : (
          <div
            className={`h-full ${fillGradient} rounded-full transition-all duration-300 ease-out`}
            style={{ width: `${percentage}%` }}
          />
        )}
      </div>
    </div>
  );
};
