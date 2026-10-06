import React from 'react';
import { NavigationTab } from '../../data/types';
import { TopNav } from './TopNav';
import { MobileNav } from './MobileNav';

export interface AppShellProps {
  currentTab: NavigationTab;
  onNavigate: (tab: NavigationTab) => void;
  children: React.ReactNode;
}

export function AppShell({ currentTab, onNavigate, children }: AppShellProps) {
  return (
    <div className="min-h-screen bg-white text-neutral-950 flex flex-col font-sans selection:bg-neutral-950 selection:text-white">
      {/* Sticky Compact Header */}
      <TopNav currentTab={currentTab} onNavigate={onNavigate} />

      {/* Main Viewport Container */}
      <main className="flex-1 pb-16 sm:pb-8">
        {children}
      </main>

      {/* Mobile Bottom Navigation */}
      <MobileNav currentTab={currentTab} onNavigate={onNavigate} />
    </div>
  );
}
