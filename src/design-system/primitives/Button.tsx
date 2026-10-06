import React, { forwardRef, ButtonHTMLAttributes } from 'react';

export type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'outline' // Aliased to secondary for backwards compatibility
  | 'ghost'
  | 'danger';

export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  isLoading?: boolean; // alias for loading
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      variant = 'primary',
      size = 'md',
      disabled = false,
      loading = false,
      isLoading = false,
      leftIcon,
      rightIcon,
      className = '',
      onClick,
      ...props
    },
    ref
  ) => {
    const isSpinnerActive = loading || isLoading;

    // Exact size configurations with h-10 rounded-xl baseline
    const sizeClasses: Record<ButtonSize, string> = {
      sm: 'h-8 px-3 text-xs rounded-lg gap-1.5',
      md: 'h-10 px-4 text-sm rounded-xl gap-2',
      lg: 'h-12 px-5 text-base rounded-xl gap-2.5',
    };

    const base =
      'inline-flex items-center justify-center font-medium transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-neutral-200 disabled:pointer-events-none disabled:opacity-45 select-none cursor-pointer';

    const normalizedVariant: 'primary' | 'secondary' | 'ghost' | 'danger' =
      variant === 'outline' ? 'secondary' : variant;

    const variants = {
      primary:
        'bg-neutral-950 text-white hover:bg-neutral-800 active:scale-[0.98]',
      secondary:
        'border border-neutral-200 bg-white text-neutral-900 hover:bg-neutral-50 active:scale-[0.98]',
      ghost:
        'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-950',
      danger:
        'bg-red-600 text-white hover:bg-red-700 active:scale-[0.98]',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isSpinnerActive}
        onClick={onClick}
        className={`${base} ${sizeClasses[size]} ${variants[normalizedVariant]} ${className}`}
        {...props}
      >
        {isSpinnerActive ? (
          <span
            className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent shrink-0"
            aria-hidden="true"
          />
        ) : (
          leftIcon && <span className="shrink-0 leading-none">{leftIcon}</span>
        )}

        <span className="truncate">{children}</span>

        {!isSpinnerActive && rightIcon && (
          <span className="shrink-0 leading-none">{rightIcon}</span>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';
