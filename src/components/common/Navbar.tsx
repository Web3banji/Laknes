/**
 * LAKNES Navigation Bar (Yochi-inspired Design System)
 * Paper/Sumi editorial navigation:
 * - Editorial brand mark + wordmark
 * - JetBrains Mono caps navigation links with tracking
 * - Bordered primary CTA button with offset shadow
 * - Seamless role-aware workspace switching and authenticated user actions
 */

import React, { useState } from 'react';
import { User, Project, UserRole } from '../../types/contracts.ts';
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

  const navTabs = [
    { id: 'explore', label: 'THE ECOSYSTEM' },
    { id: 'projects', label: 'PROJECTS' },
    { id: 'quests', label: 'QUESTS & CAMPAIGNS' },
    { id: 'creator-studio', label: 'CREATOR STUDIO' },
    { id: 'submit-project', label: 'REGISTER' },
  ];

  return (
    <header className="sticky top-0 left-0 w-full z-50 bg-[var(--yo-bg)] border-b-[1.5px] border-[var(--yo-line)] shadow-sm">
      <div className="lp-shell">
        <div className="lp-header">
          {/* Brand Mark + Wordmark */}
          <div className="flex items-center gap-8 shrink-0">
            <button
              onClick={() => onNavigate('explore')}
              className="lp-brand cursor-pointer"
              aria-label="Laknes Home"
            >
              <BrandLogo size={32} showText={true} />
            </button>

            {/* Desktop Navigation Links */}
            <nav className="lp-desktop-nav" aria-label="Main Navigation">
              {navTabs.map((tab) => {
                const isActive =
                  currentView === tab.id ||
                  (tab.id === 'creator-studio' && (currentView === 'creators' || currentView === 'creator-studio')) ||
                  (tab.id === 'submit-project' && (currentView === 'submit-project' || currentView === 'register-project')) ||
                  (tab.id === 'explore' && currentView === '');
                return (
                  <button
                    key={tab.id}
                    onClick={() => onNavigate(tab.id)}
                    className={isActive ? 'active' : ''}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Quick Search */}
          <div className="hidden lg:flex items-center flex-1 max-w-xs mx-4">
            <div className="relative w-full">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    onNavigate('projects');
                  }
                }}
                placeholder="SEARCH REGISTRY..."
                className="w-full h-9 pl-8 pr-3 text-[11px] font-mono tracking-wider bg-[var(--yo-surface-1)] border border-[var(--yo-line)] text-[var(--yo-ink)] placeholder:text-[var(--yo-muted)] focus:outline-none focus:border-[var(--yo-ink)] transition-colors"
              />
              <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-[14px] text-[var(--yo-muted)] pointer-events-none">
                search
              </span>
            </div>
          </div>

          {/* Header Actions */}
          <div className="lp-header-actions">
            {user ? (
              <>
                {/* Bookmarks / Saved */}
                <button
                  onClick={() => onNavigate('following')}
                  className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 border border-[var(--yo-line)] text-[10px] font-mono font-bold tracking-wider uppercase text-[var(--yo-ink)] hover:border-[var(--yo-ink)] transition-colors cursor-pointer"
                  title="View Saved Protocols & Quests"
                >
                  <span className="material-symbols-outlined text-[15px]">bookmark</span>
                  <span>SAVED</span>
                </button>

                {/* Architecture test suite */}
                {onOpenArchitecture && (
                  <button
                    onClick={onOpenArchitecture}
                    className="hidden xl:inline-flex items-center gap-1.5 px-2.5 py-1 border border-[var(--yo-line)] text-[10px] font-mono font-bold text-[var(--yo-good)] hover:border-[var(--yo-good)] transition-colors cursor-pointer"
                    title="Diagnostics & Verification"
                  >
                    <span className="w-1.5 h-1.5 bg-[var(--yo-good)] rounded-full"></span>
                    <span>TESTS</span>
                  </button>
                )}

                {/* Profile Pill & Menu */}
                <div className="relative">
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="flex items-center gap-2 px-3 py-1.5 border-[1.5px] border-[var(--yo-ink)] bg-[var(--yo-surface-1)] cursor-pointer text-left"
                  >
                    <div className="w-6 h-6 border border-[var(--yo-ink)] bg-[var(--yo-surface-2)] flex items-center justify-center font-mono font-bold text-[11px] text-[var(--yo-ink)]">
                      {user.username ? user.username.slice(0, 2).toUpperCase() : 'US'}
                    </div>
                    <span className="hidden sm:inline text-[11px] font-mono font-bold tracking-wider text-[var(--yo-ink)]">
                      @{user.username}
                    </span>
                    <span className="material-symbols-outlined text-[16px] text-[var(--yo-muted)]">
                      expand_more
                    </span>
                  </button>

                  {userMenuOpen && (
                    <div
                      onMouseLeave={() => setUserMenuOpen(false)}
                      className="absolute right-0 mt-2 w-64 bg-[var(--yo-surface-1)] border-[1.5px] border-[var(--yo-ink)] shadow-[6px_6px_0_var(--yo-ink)] p-2 z-50 flex flex-col gap-1 text-xs"
                    >
                      <div className="px-3 py-2 border-b border-[var(--yo-line)]">
                        <div className="font-bold text-[var(--yo-ink)] text-sm">@{user.username}</div>
                        <div className="text-[var(--yo-muted)] font-mono text-[10px] truncate">{user.email}</div>
                      </div>

                      <button
                        onClick={() => {
                          setUserMenuOpen(false);
                          onNavigate('user-dashboard');
                        }}
                        className="w-full p-2 text-left hover:bg-[var(--yo-surface-2)] flex items-center gap-2 text-[var(--yo-ink)] font-bold font-mono text-[11px] cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[16px] text-[var(--yo-accent)]">person</span>
                        <span>PROFILE &amp; RECORD</span>
                      </button>

                      <button
                        onClick={() => {
                          setUserMenuOpen(false);
                          onNavigate('creator-studio');
                        }}
                        className="w-full p-2 text-left hover:bg-[var(--yo-surface-2)] flex items-center gap-2 text-[var(--yo-ink)] font-bold font-mono text-[11px] cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[16px] text-[var(--yo-accent)]">campaign</span>
                        <span>CREATOR STUDIO</span>
                      </button>

                      <button
                        onClick={() => {
                          setUserMenuOpen(false);
                          onNavigate('submit-project');
                        }}
                        className="w-full p-2 text-left hover:bg-[var(--yo-surface-2)] flex items-center gap-2 text-[var(--yo-ink)] font-bold font-mono text-[11px] cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[16px] text-[var(--yo-accent)]">rocket_launch</span>
                        <span>REGISTER PROJECT</span>
                      </button>

                      {isAdmin && (
                        <button
                          onClick={() => {
                            setUserMenuOpen(false);
                            onNavigate('admin-console');
                          }}
                          className="w-full p-2 text-left hover:bg-[var(--yo-surface-2)] flex items-center gap-2 text-[var(--yo-accent)] border-t border-[var(--yo-line)] mt-1 font-bold font-mono text-[11px] cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-[16px]">admin_panel_settings</span>
                          <span>ADMIN CONSOLE</span>
                        </button>
                      )}

                      <div className="pt-1 border-t border-[var(--yo-line)] mt-1">
                        <button
                          onClick={() => {
                            setUserMenuOpen(false);
                            onLogout();
                          }}
                          className="w-full p-2 text-left hover:bg-[var(--yo-surface-2)] text-[var(--yo-bad)] flex items-center gap-2 font-bold font-mono text-[11px] cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-[16px]">logout</span>
                          <span>SIGN OUT</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center gap-3">
                <button
                  onClick={() => onNavigate('signin')}
                  className="lp-button lp-button-primary"
                  style={{ minHeight: '38px', padding: '6px 16px', fontSize: '11px' }}
                >
                  <span>SIGN IN</span>
                  <span aria-hidden="true" style={{ fontSize: '13px' }}>↗</span>
                </button>
              </div>
            )}

            {/* Mobile Hamburger Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 border border-[var(--yo-ink)] text-[var(--yo-ink)] bg-[var(--yo-surface-1)] cursor-pointer"
              aria-label="Toggle navigation menu"
            >
              <span className="material-symbols-outlined text-[20px]">
                {mobileMenuOpen ? 'close' : 'menu'}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t-[1.5px] border-[var(--yo-ink)] bg-[var(--yo-bg)] px-6 py-5 flex flex-col gap-3">
          {navTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                onNavigate(tab.id);
                setMobileMenuOpen(false);
              }}
              className={`text-left py-2 font-mono text-xs font-bold tracking-wider uppercase ${
                currentView === tab.id ? 'text-[var(--yo-accent)] underline' : 'text-[var(--yo-muted)]'
              }`}
            >
              {tab.label}
            </button>
          ))}

          <div className="pt-3 border-t border-[var(--yo-line)] flex flex-col gap-2">
            {user ? (
              <>
                <button
                  onClick={() => {
                    onNavigate('user-dashboard');
                    setMobileMenuOpen(false);
                  }}
                  className="text-left py-2 font-mono text-xs font-bold text-[var(--yo-ink)] flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-[16px]">person</span>
                  <span>MY PROFILE (@{user.username})</span>
                </button>
                <button
                  onClick={() => {
                    onNavigate('following');
                    setMobileMenuOpen(false);
                  }}
                  className="text-left py-2 font-mono text-xs font-bold text-[var(--yo-ink)] flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-[16px]">bookmark</span>
                  <span>SAVED DIRECTORY</span>
                </button>
                <button
                  onClick={() => {
                    onLogout();
                    setMobileMenuOpen(false);
                  }}
                  className="text-left py-2 font-mono text-xs font-bold text-[var(--yo-bad)]"
                >
                  SIGN OUT
                </button>
              </>
            ) : (
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => {
                    onNavigate('signin');
                    setMobileMenuOpen(false);
                  }}
                  className="flex-1 py-2.5 border border-[var(--yo-ink)] font-mono text-xs font-bold text-center"
                >
                  SIGN IN
                </button>
                <button
                  onClick={() => {
                    onNavigate('signin');
                    setMobileMenuOpen(false);
                  }}
                  className="flex-1 py-2.5 bg-[var(--yo-cta)] text-[var(--yo-on-cta)] border border-[var(--yo-ink)] font-mono text-xs font-bold text-center shadow-[2px_2px_0_var(--yo-ink)]"
                >
                  ENTER LAKNES ↗
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
