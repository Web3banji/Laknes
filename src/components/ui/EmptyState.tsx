import React from 'react';

export interface EmptyStateProps {
  title: string;
  description: string;
  action?: React.ReactNode;
}

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-8 sm:p-12 text-center max-w-lg mx-auto">
      <h3 className="text-base font-semibold text-neutral-950">{title}</h3>
      <p className="mt-2 text-sm text-neutral-500 leading-relaxed">{description}</p>
      {action && <div className="mt-6 flex justify-center">{action}</div>}
    </div>
  );
}
