import React from 'react';

export interface BadgeProps {
  children: React.ReactNode;
  variant?: 'neutral' | 'success' | 'warning' | 'outline';
  size?: 'sm' | 'md';
  className?: string;
}

export function Badge({
  children,
  variant = 'neutral',
  size = 'sm',
  className = '',
}: BadgeProps) {
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-[11px]',
    md: 'px-2.5 py-1 text-xs',
  };

  const variantClasses = {
    neutral: 'bg-neutral-100 text-neutral-700 border border-neutral-200/60',
    success: 'bg-emerald-50 text-emerald-800 border border-emerald-200/70',
    warning: 'bg-amber-50 text-amber-800 border border-amber-200/70',
    outline: 'bg-white text-neutral-600 border border-neutral-200',
  };

  return (
    <span
      className={`inline-flex items-center gap-1 font-medium rounded-md tracking-tight ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
    >
      {children}
    </span>
  );
}
