import React from 'react';

export interface PageHeaderProps {
  title: string;
  description?: string;
  badge?: string;
  action?: React.ReactNode;
}

export function PageHeader({ title, description, badge, action }: PageHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
      <div className="space-y-1">
        {badge && (
          <span className="text-xs font-mono font-medium text-neutral-500 uppercase tracking-wider block">
            {badge}
          </span>
        )}
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-neutral-950">
          {title}
        </h1>
        {description && (
          <p className="text-sm text-neutral-500 max-w-xl leading-relaxed">
            {description}
          </p>
        )}
      </div>

      {action && <div className="self-start sm:self-auto shrink-0">{action}</div>}
    </div>
  );
}
