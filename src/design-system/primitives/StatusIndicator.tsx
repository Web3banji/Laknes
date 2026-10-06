import React from 'react';

export type StatusType = 'active' | 'live' | 'pending' | 'draft' | 'completed' | 'verified' | 'offline';

export interface StatusIndicatorProps {
  status: StatusType;
  label?: string;
  className?: string;
}

const STATUS_CONFIG: Record<
  StatusType,
  { dotColor: string; defaultLabel: string; pulse?: boolean }
> = {
  active: {
    dotColor: 'bg-emerald-600',
    defaultLabel: 'Active',
    pulse: true,
  },
  live: {
    dotColor: 'bg-emerald-600',
    defaultLabel: 'Live',
    pulse: true,
  },
  verified: {
    dotColor: 'bg-neutral-900',
    defaultLabel: 'Verified',
  },
  pending: {
    dotColor: 'bg-amber-600',
    defaultLabel: 'Pending',
  },
  draft: {
    dotColor: 'bg-neutral-400',
    defaultLabel: 'Draft',
  },
  completed: {
    dotColor: 'bg-emerald-700',
    defaultLabel: 'Completed',
  },
  offline: {
    dotColor: 'bg-neutral-300',
    defaultLabel: 'Inactive',
  },
};

/**
 * Accessible status indicator combining a subtle geometric dot with explicit textual label.
 * Avoids garish candy pills while maintaining crisp situational awareness.
 */
export const StatusIndicator: React.FC<StatusIndicatorProps> = ({
  status,
  label,
  className = '',
}) => {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.active;
  const displayLabel = label || config.defaultLabel;

  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-medium text-neutral-700 ${className}`}>
      <span className="relative flex h-2 w-2 items-center justify-center">
        {config.pulse && (
          <span
            className={`absolute inline-flex h-full w-full rounded-full opacity-60 animate-ping ${config.dotColor}`}
          />
        )}
        <span className={`relative inline-flex h-1.5 w-1.5 rounded-full ${config.dotColor}`} />
      </span>
      <span>{displayLabel}</span>
    </span>
  );
};
