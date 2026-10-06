import React from 'react';
import { Search, X } from 'lucide-react';

export type DiscoverSearchProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  onClear?: () => void;
};

export function DiscoverSearch({
  value,
  onChange,
  placeholder = 'Search projects, assets or markets',
  onClear,
}: DiscoverSearchProps) {
  return (
    <div className="relative w-full">
      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-neutral-400">
        <Search className="h-4 w-4" />
      </div>

      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        type="search"
        placeholder={placeholder}
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
        aria-label="Search discovery"
      />

      {value && (
        <button
          type="button"
          onClick={() => {
            onChange('');
            onClear?.();
          }}
          className="absolute inset-y-0 right-0 flex items-center pr-3 text-neutral-400 hover:text-neutral-700 cursor-pointer"
          aria-label="Clear search"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
