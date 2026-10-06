import React from 'react';

export interface TabItem<T extends string = string> {
  id: T;
  label: string;
  count?: number;
  icon?: React.ReactNode;
}

export interface TabsProps<T extends string = string> {
  tabs: TabItem<T>[];
  activeTab: T;
  onChange: (id: T) => void;
  variant?: 'segmented' | 'underline';
  size?: 'sm' | 'md';
  className?: string;
}

export function Tabs<T extends string = string>({
  tabs,
  activeTab,
  onChange,
  variant = 'segmented',
  size = 'md',
  className = '',
}: TabsProps<T>) {
  if (variant === 'underline') {
    return (
      <div
        role="tablist"
        className={`flex items-center gap-6 border-b border-neutral-200 overflow-x-auto no-scrollbar ${className}`}
      >
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              role="tab"
              aria-selected={isActive}
              onClick={() => onChange(tab.id)}
              className={`group inline-flex items-center gap-2 pb-3 pt-1 text-sm font-medium whitespace-nowrap border-b-2 transition-colors cursor-pointer select-none ${
                isActive
                  ? 'border-neutral-950 text-neutral-950'
                  : 'border-transparent text-neutral-500 hover:text-neutral-900 hover:border-neutral-300'
              }`}
            >
              {tab.icon && <span className="shrink-0">{tab.icon}</span>}
              <span>{tab.label}</span>
              {typeof tab.count === 'number' && (
                <span
                  className={`text-xs font-mono tabular-nums ${
                    isActive ? 'text-neutral-900 font-semibold' : 'text-neutral-400'
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    );
  }

  // Segmented control style (Linear / macOS native style)
  const sizeStyles = {
    sm: 'p-0.5 text-xs',
    md: 'p-1 text-sm',
  };

  const itemSizeStyles = {
    sm: 'px-2.5 py-1',
    md: 'px-3 py-1.5',
  };

  return (
    <div
      role="tablist"
      className={`inline-flex items-center bg-neutral-100/90 rounded-lg p-1 border border-neutral-200/50 max-w-full overflow-x-auto no-scrollbar ${sizeStyles[size]} ${className}`}
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(tab.id)}
            className={`inline-flex items-center gap-1.5 font-medium rounded-md whitespace-nowrap shrink-0 transition-all duration-150 cursor-pointer select-none ${itemSizeStyles[size]} ${
              isActive
                ? 'bg-white text-neutral-950 shadow-2xs font-semibold'
                : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-200/50'
            }`}
          >
            {tab.icon && <span className="shrink-0">{tab.icon}</span>}
            <span>{tab.label}</span>
            {typeof tab.count === 'number' && (
              <span
                className={`text-[11px] font-mono tabular-nums px-1.5 py-0.2 rounded ${
                  isActive
                    ? 'bg-neutral-100 text-neutral-900 font-medium'
                    : 'text-neutral-500'
                }`}
              >
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
