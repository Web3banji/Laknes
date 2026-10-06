import React from 'react';

export function Skeleton({
  className = '',
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`animate-pulse rounded-lg bg-neutral-100 ${className}`}
      {...props}
    />
  );
}

export function DiscoveryFeedSkeleton() {
  return (
    <div className="divide-y divide-neutral-200">
      {[1, 2, 3, 4].map((i) => (
        <article key={i} className="py-6">
          <div className="flex items-start gap-3.5">
            {/* Timeline Avatar Skeleton */}
            <Skeleton className="h-10 w-10 rounded-xl shrink-0" />

            {/* Timeline Body Skeleton */}
            <div className="min-w-0 flex-1 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-3 w-16" />
                </div>
                <Skeleton className="h-3 w-12" />
              </div>

              <div className="space-y-1.5">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3.5 w-full" />
                <Skeleton className="h-3.5 w-2/3" />
              </div>

              {/* "Why it matters" box skeleton */}
              <Skeleton className="h-14 w-full rounded-xl" />

              <div className="pt-1">
                <Skeleton className="h-4 w-24" />
              </div>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}
