import React, { InputHTMLAttributes, forwardRef } from 'react';
import { Search, X } from 'lucide-react';

export interface SearchInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  value: string;
  onChange: (value: string) => void;
  onClear?: () => void;
  shortcutHint?: string;
}

export const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(
  ({ value, onChange, onClear, shortcutHint = '⌘K', placeholder = 'Search…', className = '', ...props }, ref) => {
    return (
      <div className={`relative flex items-center w-full ${className}`}>
        <Search className="absolute left-3 w-4 h-4 text-neutral-400 pointer-events-none shrink-0" />
        <input
          ref={ref}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full h-9 pl-9 pr-12 rounded-md bg-white border border-neutral-200 text-sm text-neutral-900 placeholder:text-neutral-400 transition-colors hover:border-neutral-300 focus:outline-none focus:ring-1 focus:ring-neutral-900 focus:border-neutral-900"
          {...props}
        />
        <div className="absolute right-2.5 flex items-center gap-1">
          {value ? (
            <button
              type="button"
              onClick={() => {
                onChange('');
                onClear?.();
              }}
              className="p-1 text-neutral-400 hover:text-neutral-600 rounded transition-colors"
              aria-label="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          ) : shortcutHint ? (
            <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 text-[10px] font-mono text-neutral-400 bg-neutral-100 border border-neutral-200 rounded">
              {shortcutHint}
            </kbd>
          ) : null}
        </div>
      </div>
    );
  }
);

SearchInput.displayName = 'SearchInput';
