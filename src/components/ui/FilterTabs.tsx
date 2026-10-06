import React from 'react';

export interface FilterTabsProps<T extends string> {
  tabs: readonly T[];
  activeTab: T;
  onChange: (tab: T) => void;
  ariaLabel?: string;
  className?: string;
}

export function FilterTabs<T extends string>({
  tabs,
  activeTab,
  onChange,
  ariaLabel = 'Filter options',
  className = '',
}: FilterTabsProps<T>) {
  return (
    <nav
      className={`flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1 ${className}`}
      aria-label={ariaLabel}
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab;
        return (
          <button
            key={tab}
            type="button"
            onClick={() => onChange(tab)}
            className={`whitespace-nowrap rounded-xl px-3.5 py-1.5 text-xs font-medium transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-neutral-200 ${
              isActive
                ? 'bg-neutral-950 text-white font-semibold shadow-2xs'
                : 'bg-white text-neutral-600 border border-neutral-200/80 hover:border-neutral-300 hover:text-neutral-950'
            }`}
            aria-pressed={isActive}
          >
            {tab}
          </button>
        );
      })}
    </nav>
  );
}
