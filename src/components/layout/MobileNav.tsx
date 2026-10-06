import React from 'react';
import { NavigationTab } from '../../data/types';
import { Compass, BarChart2, Zap, Folder, Search } from 'lucide-react';

export interface MobileNavProps {
  currentTab: NavigationTab;
  onNavigate: (tab: NavigationTab) => void;
}

export function MobileNav({ currentTab, onNavigate }: MobileNavProps) {
  const items: { id: NavigationTab; label: string; icon: React.ReactNode }[] = [
    { id: 'discover', label: 'Discover', icon: <Compass className="h-4 w-4" /> },
    { id: 'markets', label: 'Markets', icon: <BarChart2 className="h-4 w-4" /> },
    { id: 'hyperliquid', label: 'Hyperliquid', icon: <Zap className="h-4 w-4" /> },
    { id: 'projects', label: 'Projects', icon: <Folder className="h-4 w-4" /> },
    { id: 'search', label: 'Search', icon: <Search className="h-4 w-4" /> },
  ];

  return (
    <nav
      className="sm:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-neutral-200/80 bg-white/95 backdrop-blur px-2 py-1.5 flex items-center justify-around"
      aria-label="Mobile Navigation"
    >
      {items.map((item) => {
        const isActive = currentTab === item.id;
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onNavigate(item.id)}
            className={`flex flex-col items-center gap-1 py-1 px-3 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
              isActive ? 'text-neutral-950 font-semibold' : 'text-neutral-500 hover:text-neutral-900'
            }`}
          >
            {item.icon}
            <span>{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
