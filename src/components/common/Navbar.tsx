/**
 * LAKNES Navigation Bar
 * Role-aware workspace navigation system:
 * - USER WORKSPACE: Explore, Projects, Quests, Following, My Dashboard
 * - PROJECT WORKSPACE: Overview, My Project, Quests, Audience, Creator Studio, Settings
 * - Seamless Workspace Switcher without re-authentication.
 */

import React, { useState } from 'react';
import { User, Project, UserRole, ProjectVerificationStatus } from '../../types/contracts.ts';
import { BrandLogo } from './BrandLogo.tsx';

interface NavbarProps {
  currentView: string;
  onNavigate: (view: string) => void;
  user: User | null;
  workspace: 'user' | 'project';
  activeProject: Project | null;
  userProjects: Array<Project & { myMembershipRole?: string }>;
  onSwitchWorkspace: (targetWorkspace: 'user' | 'project', targetProjectId?: string) => void;
  onOpenAuth: (initialMode?: 'login' | 'register', accountType?: 'user' | 'project') => void;
  onLogout: () => void;
  onOpenArchitecture?: () => void;
}

export function Navbar({
  currentView,
  onNavigate,
  user,
  workspace,
  activeProject,
  userProjects,
  onSwitchWorkspace,
  onOpenAuth,
  onLogout,
  onOpenArchitecture,
}: NavbarProps) {
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const isAdmin = user?.roles?.includes(UserRole.ADMIN);

  // Four clear top-level destinations as requested: Explore, Creator Studio, Register Project, Profile
  const navTabs = [
    { id: 'explore', label: 'Explore' },
    { id: 'creator-studio', label: 'Creator Studio' },
    { id: 'submit-project', label: 'Register Project' },
    { id: 'profile', label: 'Profile' },
  ];

  return (
    <header className="fixed top-0 left-0 w-full z-50 bg-surface/85 backdrop-blur-md border-b border-outline-variant/30 shadow-[0_4px_24px_rgba(0,0,0,0.6)]">
      <div className="max-w-7xl mx-auto h-20 px-6 lg:px-12 flex items-center justify-between gap-6">
        {/* Brand Anchor with Official Logo */}
        <div className="flex items-center gap-8 shrink-0">
          <button
            onClick={() => onNavigate('explore')}
            className="flex items-center gap-3 group active:scale-[0.98] transition-transform text-left cursor-pointer"
          >
            <BrandLogo size={38} />
            <span className="text-headline-sm font-headline-sm font-bold tracking-tight text-on-surface group-hover:text-primary transition-colors">
              LAKNES
            </span>
          </button>

          {/* Top-Level Destination Tabs */}
          <nav className="hidden md:flex items-center gap-6">
            {navTabs.map((tab) => {
              const isActive =
                currentView === tab.id ||
                (tab.id === 'creator-studio' && (currentView === 'creators' || currentView === 'creator-studio')) ||
                (tab.id === 'submit-project' && (currentView === 'submit-project' || currentView === 'register-project')) ||
                (tab.id === 'profile' && (currentView === 'user-dashboard' || currentView === 'profile'));
              return (
                <button
                  key={tab.id}
                  onClick={() => onNavigate(tab.id)}
                  className={`pb-1 text-label-md font-label-md transition-all active:scale-[0.98] cursor-pointer whitespace-nowrap ${
                    isActive
                      ? 'text-primary-container font-semibold border-b-2 border-primary-container'
                      : 'text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Center Search for Verified Registries (Authenticated Experience) */}
        {user ? (
          <div className="flex-1 max-w-md hidden lg:block">
            <div className="relative flex items-center">
              <span className="material-symbols-outlined absolute left-3.5 text-outline text-[18px]">
                search
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    onNavigate('projects');
                  }
                }}
                placeholder="Search verified registries, protocols, and documentation..."
                className="w-full h-10 pl-10 pr-12 bg-surface-container-low rounded-lg border border-outline-variant/40 text-body-sm font-body-sm text-on-surface placeholder:text-outline focus:outline-none focus:border-primary-container focus:ring-1 focus:ring-primary-container transition-all"
              />
              <span className="absolute right-3 text-[11px] font-label-sm text-outline border border-outline-variant/50 px-1.5 py-0.5 rounded">
                ⌘K
              </span>
            </div>
          </div>
        ) : (
          <div className="flex-1"></div>
        )}

        {/* Trailing Actions */}
        <div className="flex items-center gap-4 shrink-0">
          {user ? (
            <>
              {/* Architecture Suite shortcut for diagnostics */}
              {onOpenArchitecture && (
                <button
                  onClick={onOpenArchitecture}
                  className="hidden xl:flex items-center gap-1.5 px-2.5 py-1 rounded bg-surface-container border border-outline-variant/40 text-emerald-400 hover:border-emerald-500/50 text-[11px] font-mono transition-colors cursor-pointer"
                  title="Open Architectural Verification & Test Suite"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span>Test Suite</span>
                </button>
              )}

              {/* Saved / Bookmarks button */}
              <button
                onClick={() => onNavigate('following')}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-outline-variant/30 hover:border-primary-container/40 text-on-surface-variant hover:text-on-surface text-label-md font-label-md transition-all cursor-pointer"
                title="View Bookmarked Protocols & Quests"
              >
                <span className="material-symbols-outlined text-[18px]">bookmark</span>
                <span>Saved</span>
              </button>

              {/* User Profile Pill & Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-3 pl-2 sm:border-l sm:border-outline-variant/30 text-left focus:outline-none cursor-pointer"
                >
                  <div className="relative">
                    <div className="w-9 h-9 rounded-lg bg-surface-container-high border border-primary-container/40 flex items-center justify-center text-primary-container font-headline-sm font-bold text-sm">
                      {user.username ? user.username.slice(0, 2).toUpperCase() : 'US'}
                    </div>
                    <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-primary-container rounded-full border-2 border-surface"></span>
                  </div>

                  <div className="hidden sm:flex flex-col text-left">
                    <div className="flex items-center gap-1.5">
                      <span className="text-body-sm font-body-sm font-medium text-on-surface">
                        @{user.username}
                      </span>
                      <span className="text-label-sm font-label-sm px-1.5 py-0.2 bg-primary-container/15 text-primary border border-primary-container/30 rounded">
                        Member
                      </span>
                    </div>
                    <span className="text-[11px] font-body-sm text-outline">
                      {workspace === 'project' ? 'Project Representative' : 'Verified Participant'}
                    </span>
                  </div>

                  <span className="material-symbols-outlined text-[18px] text-on-surface-variant hover:text-on-surface">
                    expand_more
                  </span>
                </button>

                {/* Dropdown Menu */}
                {userMenuOpen && (
                  <div
                    onMouseLeave={() => setUserMenuOpen(false)}
                    className="absolute right-0 mt-3 w-64 bg-surface-container-low border border-outline-variant/40 rounded-xl shadow-2xl p-2 z-50 flex flex-col gap-1 text-xs"
                  >
                    <div className="px-3 py-2 border-b border-outline-variant/20">
                      <div className="font-semibold text-on-surface text-sm">@{user.username}</div>
                      <div className="text-outline text-[11px] truncate">{user.email}</div>
                    </div>

                    <button
                      onClick={() => {
                        setUserMenuOpen(false);
                        onNavigate('user-dashboard');
                      }}
                      className="w-full p-2.5 rounded-lg text-left hover:bg-surface-container flex items-center gap-2.5 text-on-surface font-medium cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[18px] text-primary">person</span>
                      <span>My Profile & Dashboard</span>
                    </button>

                    <button
                      onClick={() => {
                        setUserMenuOpen(false);
                        onNavigate('submit-project');
                      }}
                      className="w-full p-2.5 rounded-lg text-left hover:bg-surface-container flex items-center gap-2.5 text-on-surface font-medium cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[18px] text-primary-container">rocket_launch</span>
                      <span>Register Project Portal</span>
                    </button>

                    <button
                      onClick={() => {
                        setUserMenuOpen(false);
                        onNavigate('creator-studio');
                      }}
                      className="w-full p-2.5 rounded-lg text-left hover:bg-surface-container flex items-center gap-2.5 text-on-surface font-medium cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[18px] text-secondary">campaign</span>
                      <span>Creator Studio Application</span>
                    </button>

                    {isAdmin && (
                      <button
                        onClick={() => {
                          setUserMenuOpen(false);
                          onNavigate('admin-console');
                        }}
                        className="w-full p-2.5 rounded-lg text-left hover:bg-surface-container flex items-center gap-2.5 text-primary border-t border-outline-variant/20 mt-1 cursor-pointer font-semibold"
                      >
                        <span className="material-symbols-outlined text-[18px]">admin_panel_settings</span>
                        <span>Admin Verification Console</span>
                      </button>
                    )}

                    <div className="pt-1 border-t border-outline-variant/20 mt-1">
                      <button
                        onClick={() => {
                          setUserMenuOpen(false);
                          onLogout();
                        }}
                        className="w-full p-2.5 rounded-lg text-left hover:bg-rose-950/30 text-rose-300 flex items-center gap-2.5 font-medium cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[18px]">logout</span>
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex items-center gap-4">
              <button
                onClick={() => onNavigate('signin')}
                className="hidden sm:inline-flex text-on-surface-variant hover:text-on-surface font-label-md text-label-md transition-colors px-3 py-2 active:scale-[0.98] cursor-pointer"
              >
                Sign In
              </button>
              <button
                onClick={() => onNavigate('signin')}
                className="inline-flex items-center justify-center bg-primary-container text-on-primary-container font-label-md text-label-md font-semibold px-5 py-2.5 rounded-lg shadow-[0_0_20px_rgba(255,87,34,0.4)] hover:shadow-[0_0_26px_rgba(255,87,34,0.65)] hover:brightness-110 active:scale-[0.98] transition-all cursor-pointer whitespace-nowrap"
              >
                Get Started
              </button>
            </div>
          )}

          {/* Mobile Menu Hamburger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container"
            aria-label="Toggle navigation menu"
          >
            <span className="material-symbols-outlined text-[24px]">
              {mobileMenuOpen ? 'close' : 'menu'}
            </span>
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-outline-variant/30 bg-surface px-6 py-5 flex flex-col gap-3">
          {navTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                onNavigate(tab.id);
                setMobileMenuOpen(false);
              }}
              className={`text-left py-2 text-sm font-medium ${
                currentView === tab.id ? 'text-primary-container font-bold' : 'text-on-surface-variant'
              }`}
            >
              {tab.label}
            </button>
          ))}

          <div className="pt-3 border-t border-outline-variant/30 flex flex-col gap-2">
            {user ? (
              <>
                <button
                  onClick={() => {
                    onNavigate('user-dashboard');
                    setMobileMenuOpen(false);
                  }}
                  className="text-left py-2 text-sm text-on-surface flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-[18px]">person</span>
                  <span>My Profile (@{user.username})</span>
                </button>
                <button
                  onClick={() => {
                    onLogout();
                    setMobileMenuOpen(false);
                  }}
                  className="text-left py-2 text-sm text-rose-400 font-semibold"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => {
                    onNavigate('signin');
                    setMobileMenuOpen(false);
                  }}
                  className="flex-1 py-2.5 rounded-lg bg-surface-container text-xs text-center font-medium"
                >
                  Sign In
                </button>
                <button
                  onClick={() => {
                    onNavigate('signin');
                    setMobileMenuOpen(false);
                  }}
                  className="flex-1 py-2.5 rounded-lg bg-primary-container text-on-primary-container text-xs text-center font-semibold"
                >
                  Get Started
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
