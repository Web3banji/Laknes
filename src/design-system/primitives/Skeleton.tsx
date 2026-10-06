import React from 'react';

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'text' | 'rectangular' | 'circular';
  width?: string | number;
  height?: string | number;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  variant = 'rectangular',
  width,
  height,
  className = '',
  style,
  ...props
}) => {
  const variantStyles = {
    text: 'h-4 rounded',
    rectangular: 'rounded-xl',
    circular: 'rounded-full',
  };

  const customStyle: React.CSSProperties = {
    width,
    height,
    ...style,
  };

  return (
    <div
      aria-hidden="true"
      className={`bg-neutral-100 animate-pulse ${variantStyles[variant]} ${className}`}
      style={customStyle}
      {...props}
    />
  );
};

/**
 * 1. Project Card Skeleton (exact reference implementation)
 */
export function ProjectCardSkeleton() {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-5">
      <div className="h-10 w-10 animate-pulse rounded-xl bg-neutral-100" />

      <div className="mt-5 space-y-3">
        <div className="h-4 w-32 animate-pulse rounded bg-neutral-100" />
        <div className="h-3 w-full animate-pulse rounded bg-neutral-100" />
        <div className="h-3 w-4/5 animate-pulse rounded bg-neutral-100" />
      </div>

      <div className="mt-5 border-t border-neutral-100 pt-4">
        <div className="h-3 w-20 animate-pulse rounded bg-neutral-100" />
      </div>
    </div>
  );
}

// Backwards compatibility alias
export const CardSkeleton = ProjectCardSkeleton;

/**
 * 2. Project Profile Skeleton (for details & profile modal views)
 */
export function ProjectProfileSkeleton() {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-6 sm:p-8 space-y-6">
      <div className="flex items-start gap-4">
        <div className="h-14 w-14 animate-pulse rounded-2xl bg-neutral-100 shrink-0" />
        <div className="space-y-2 flex-1">
          <div className="h-6 w-48 animate-pulse rounded bg-neutral-100" />
          <div className="h-4 w-28 animate-pulse rounded bg-neutral-100" />
        </div>
      </div>

      <div className="space-y-2 pt-2">
        <div className="h-4 w-full animate-pulse rounded bg-neutral-100" />
        <div className="h-4 w-5/6 animate-pulse rounded bg-neutral-100" />
        <div className="h-4 w-2/3 animate-pulse rounded bg-neutral-100" />
      </div>

      <div className="rounded-xl border border-neutral-100 divide-y divide-neutral-100 p-4 space-y-3">
        <div className="flex justify-between items-center pt-2">
          <div className="h-3.5 w-24 animate-pulse rounded bg-neutral-100" />
          <div className="h-3.5 w-32 animate-pulse rounded bg-neutral-100" />
        </div>
        <div className="flex justify-between items-center pt-3">
          <div className="h-3.5 w-28 animate-pulse rounded bg-neutral-100" />
          <div className="h-3.5 w-20 animate-pulse rounded bg-neutral-100" />
        </div>
        <div className="flex justify-between items-center pt-3">
          <div className="h-3.5 w-32 animate-pulse rounded bg-neutral-100" />
          <div className="h-3.5 w-24 animate-pulse rounded bg-neutral-100" />
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-neutral-100">
        <div className="h-10 w-24 animate-pulse rounded-xl bg-neutral-100" />
        <div className="h-10 w-32 animate-pulse rounded-xl bg-neutral-100" />
      </div>
    </div>
  );
}

/**
 * 3. Quest Skeleton (for quest cards and progression tracks)
 */
export function QuestCardSkeleton() {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="h-3.5 w-24 animate-pulse rounded bg-neutral-100" />
        <div className="h-3.5 w-16 animate-pulse rounded bg-neutral-100" />
      </div>

      <div className="space-y-2">
        <div className="h-5 w-48 animate-pulse rounded bg-neutral-100" />
        <div className="h-3.5 w-full animate-pulse rounded bg-neutral-100" />
        <div className="h-3.5 w-3/4 animate-pulse rounded bg-neutral-100" />
      </div>

      <div className="pt-2 space-y-2">
        <div className="flex justify-between">
          <div className="h-3 w-32 animate-pulse rounded bg-neutral-100" />
          <div className="h-3 w-10 animate-pulse rounded bg-neutral-100" />
        </div>
        <div className="h-2 w-full animate-pulse rounded-full bg-neutral-100" />
      </div>

      <div className="mt-5 border-t border-neutral-100 pt-4 flex items-center justify-between">
        <div className="h-3 w-24 animate-pulse rounded bg-neutral-100" />
        <div className="h-8 w-24 animate-pulse rounded-lg bg-neutral-100" />
      </div>
    </div>
  );
}

/**
 * 4. Dashboard Skeleton (multi-card metrics and overview viewport)
 */
export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* Top metrics row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-2xl border border-neutral-200 bg-white p-5 space-y-3">
            <div className="h-3.5 w-24 animate-pulse rounded bg-neutral-100" />
            <div className="h-7 w-32 animate-pulse rounded bg-neutral-100" />
            <div className="h-3 w-20 animate-pulse rounded bg-neutral-100" />
          </div>
        ))}
      </div>

      {/* Main dashboard content area */}
      <div className="rounded-2xl border border-neutral-200 bg-white p-6 space-y-4">
        <div className="h-5 w-40 animate-pulse rounded bg-neutral-100" />
        <div className="h-40 w-full animate-pulse rounded-xl bg-neutral-50 border border-neutral-100" />
      </div>
    </div>
  );
}

/**
 * 5. Checklist Skeleton (for migration readiness & verification steps)
 */
export function ChecklistSkeleton() {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-6 space-y-4">
      <div className="flex justify-between items-center mb-4">
        <div className="space-y-1.5">
          <div className="h-5 w-48 animate-pulse rounded bg-neutral-100" />
          <div className="h-3.5 w-64 animate-pulse rounded bg-neutral-100" />
        </div>
        <div className="h-4 w-20 animate-pulse rounded bg-neutral-100" />
      </div>

      <div className="h-2 w-full animate-pulse rounded-full bg-neutral-100 mb-6" />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className="p-3.5 rounded-xl border border-neutral-200 bg-white flex items-start gap-3"
          >
            <div className="h-4 w-4 animate-pulse rounded bg-neutral-100 shrink-0 mt-0.5" />
            <div className="space-y-1.5 flex-1">
              <div className="h-4 w-36 animate-pulse rounded bg-neutral-100" />
              <div className="h-3 w-full animate-pulse rounded bg-neutral-100" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * 6. Activity Skeleton (for live activity stream feed)
 */
export function ActivitySkeleton() {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white divide-y divide-neutral-100 overflow-hidden">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="p-4 sm:p-5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 animate-pulse rounded-xl bg-neutral-100 shrink-0" />
            <div className="space-y-1.5">
              <div className="h-4 w-44 animate-pulse rounded bg-neutral-100" />
              <div className="h-3 w-32 animate-pulse rounded bg-neutral-100" />
            </div>
          </div>

          <div className="h-3 w-16 animate-pulse rounded bg-neutral-100 shrink-0" />
        </div>
      ))}
    </div>
  );
}
