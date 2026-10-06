import React from 'react';
import { Search, X } from 'lucide-react';

export interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  onClear?: () => void;
  autoFocus?: boolean;
  className?: string;
  ariaLabel?: string;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
}

export function SearchInput({
  value,
  onChange,
  placeholder = 'Search projects, tokens, addresses...',
  onClear,
  autoFocus = false,
  className = '',
  ariaLabel = 'Search discovery',
  onKeyDown,
}: SearchInputProps) {
  return (
    <div className={`relative w-full ${className}`}>
      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-neutral-400">
        <Search className="h-4 w-4" />
      </div>

      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        autoFocus={autoFocus}
        className="
          h-11 w-full rounded-xl
          border border-neutral-200
          bg-white
          pl-10 pr-10
          text-sm text-neutral-950
          placeholder:text-neutral-400
          outline-none
          transition
          focus:border-neutral-400
          focus:ring-2 focus:ring-neutral-100
        "
        aria-label={ariaLabel}
      />

      {value && (
        <button
          type="button"
          onClick={() => {
            onChange('');
            onClear?.();
          }}
          className="absolute inset-y-0 right-0 flex items-center pr-3 text-neutral-400 hover:text-neutral-700 cursor-pointer focus:outline-none focus:ring-2 focus:ring-neutral-200 rounded"
          aria-label="Clear search input"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
