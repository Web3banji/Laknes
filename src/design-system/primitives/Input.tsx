import React, { InputHTMLAttributes, forwardRef, useId } from 'react';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helperText?: string;
  error?: string;
  leftAddon?: React.ReactNode;
  rightAddon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, helperText, error, leftAddon, rightAddon, className = '', id, ...props }, ref) => {
    const generatedId = useId();
    const inputId = id || generatedId;

    return (
      <div className="w-full text-left space-y-1.5">
        {label && (
          <label htmlFor={inputId} className="block text-xs font-medium text-neutral-800">
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {leftAddon && (
            <div className="absolute left-3 flex items-center pointer-events-none text-neutral-400">
              {leftAddon}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            className={`w-full h-9 rounded-md bg-white border px-3 text-sm text-neutral-900 placeholder:text-neutral-400 transition-colors focus:outline-none focus:ring-1 focus:ring-neutral-900 focus:border-neutral-900 disabled:bg-neutral-50 disabled:text-neutral-400 disabled:cursor-not-allowed ${
              leftAddon ? 'pl-9' : ''
            } ${rightAddon ? 'pr-9' : ''} ${
              error
                ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
                : 'border-neutral-200 hover:border-neutral-300'
            } ${className}`}
            {...props}
          />
          {rightAddon && (
            <div className="absolute right-3 flex items-center text-neutral-400">
              {rightAddon}
            </div>
          )}
        </div>
        {error ? (
          <p className="text-xs text-red-600 font-normal">{error}</p>
        ) : helperText ? (
          <p className="text-xs text-neutral-500">{helperText}</p>
        ) : null}
      </div>
    );
  }
);

Input.displayName = 'Input';
