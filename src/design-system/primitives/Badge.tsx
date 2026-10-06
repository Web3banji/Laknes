import React from 'react';

export type BadgeVariant = 'neutral' | 'subtle' | 'outline' | 'success' | 'warning';

export interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

/**
 * Clean, restrained metadata tag.
 * Adheres to anti-slop rules: avoids round-full candy pills, uses subtle borders and neutral tones.
 */
export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'neutral',
  className = '',
}) => {
  const variantStyles: Record<BadgeVariant, string> = {
    neutral: 'bg-neutral-100 text-neutral-800 border-transparent',
    subtle: 'bg-neutral-50 text-neutral-600 border-neutral-200/80',
    outline: 'bg-white text-neutral-700 border-neutral-200',
    success: 'bg-emerald-50 text-emerald-800 border-emerald-200/60',
    warning: 'bg-amber-50 text-amber-800 border-amber-200/60',
  };

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium border tabular-nums select-none ${variantStyles[variant]} ${className}`}
    >
      {children}
    </span>
  );
};
