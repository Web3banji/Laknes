/**
 * LAKNES Projects Directory View
 * Searchable, filterable ecosystem project directory adhering to Elysium Stitch design system.
 */

import React, { useState } from 'react';
import { Project, ProjectCategory, User, UserRole } from '../../types/contracts.ts';
import { ProjectCard } from '../common/ProjectCard.tsx';

interface ProjectsViewProps {
  projects: Project[];
  isLoading: boolean;
  onSelectProject: (project: Project) => void;
  onNavigate: (view: string) => void;
  onToggleSave?: (projectId: string, e: React.MouseEvent) => void;
  savedProjectIds?: Set<string>;
  user?: User | null;
  onOpenAuth?: (mode?: 'login' | 'register', accountType?: 'user' | 'project') => void;
}

export function ProjectsView({
  projects,
  isLoading,
  onSelectProject,
  onNavigate,
  onToggleSave,
  savedProjectIds,
  user,
  onOpenAuth,
}: ProjectsViewProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<'newest' | 'name'>('newest');

  const isProjectRepOrAdmin =
    user?.roles?.includes(UserRole.PROJECT_REPRESENTATIVE) ||
    user?.roles?.includes(UserRole.ADMIN);
  const isIndividualUserOnly = user && !isProjectRepOrAdmin;

  const categories = [
    { id: 'ALL', label: 'All', icon: 'apps' },
    { id: ProjectCategory.DEFI, label: 'DeFi', icon: 'currency_exchange' },
    { id: ProjectCategory.INFRASTRUCTURE, label: 'Infrastructure', icon: 'dns' },
    { id: ProjectCategory.GAMING, label: 'Gaming', icon: 'sports_esports' },
    { id: ProjectCategory.SOCIAL, label: 'Social & Media', icon: 'palette' },
    { id: ProjectCategory.NFT_METAVERSE, label: 'NFT & Metaverse', icon: 'token' },
    { id: ProjectCategory.TOOLING, label: 'Tooling & AI', icon: 'smart_toy' },
  ];

  let filtered = projects.filter((p) => {
    const matchCat = selectedCategory === 'ALL' || p.category === selectedCategory;
    const matchQuery =
      !searchQuery.trim() ||
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.shortDescription.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.slug.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchQuery;
  });

  if (sortBy === 'name') {
    filtered = [...filtered].sort((a, b) => a.name.localeCompare(b.name));
  } else {
    filtered = [...filtered].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  return (
    <div className="w-full max-w-[1440px] mx-auto px-margin-mobile lg:px-margin py-space-xl">
      {/* Page Header with Brand Glow */}
      <div className="relative mb-space-xl pb-space-lg border-b border-slate-800 overflow-hidden">
        {/* Glow */}
        <div className="pointer-events-none absolute -top-24 right-1/4 w-96 h-96 bg-primary-container/10 blur-[100px] rounded-full"></div>

        <div className="flex flex-col md:flex-row md:items-end justify-between gap-space-lg relative z-10">
          <div>
            <div className="inline-flex items-center gap-space-xs px-space-sm py-1 rounded bg-surface-container-high w-fit mb-2 border border-slate-700/50">
              <span className="w-1.5 h-1.5 rounded-full bg-primary-container animate-pulse"></span>
              <span className="font-label-caps text-label-caps uppercase text-primary tracking-wider text-[11px]">
                Ecosystem Directory &bull; Elysium Genesis
              </span>
            </div>
            <h1 className="font-headline-xl text-3xl sm:text-4xl text-on-surface font-bold tracking-tight">
              Verified Ecosystem Projects
            </h1>
            <p className="font-body-md text-on-surface-variant text-sm mt-1 max-w-2xl leading-relaxed">
              Explore officially vetted protocols, decentralized applications, and high-performance infrastructure powering Elysium.
            </p>
          </div>

          {/* Action Button: Strictly conditioned on user role */}
          {isProjectRepOrAdmin ? (
            <button
              onClick={() => onNavigate('submit-project')}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary-container text-on-primary-container font-label-caps text-label-caps uppercase text-xs font-semibold shadow-[0_0_24px_rgba(212,163,39,0.3)] hover:bg-primary-fixed-dim transition-all shrink-0 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">add</span>
              <span>Register New Project</span>
            </button>
          ) : !user ? (
            <button
              onClick={() => (onOpenAuth ? onOpenAuth('register', 'project') : onNavigate('submit-project'))}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-surface-container-high hover:bg-surface-container-highest border border-primary-container/40 text-primary font-label-caps text-label-caps uppercase text-xs font-semibold shadow-md transition-all shrink-0 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">domain</span>
              <span>Submit Project (Gmail Required)</span>
            </button>
          ) : isIndividualUserOnly ? (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-[11px] text-slate-400 font-mono">
              <span className="material-symbols-outlined text-[15px] text-primary">person</span>
              <span>Individual User Mode</span>
            </div>
          ) : null}
        </div>

        {/* Directory Metrics - Only Shown From Real Database Records */}
        {projects.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-6 pt-5 border-t border-slate-800/60">
            <div className="p-3 rounded-xl bg-surface-container-low/60 border border-slate-800/80">
              <span className="block text-[10px] uppercase font-mono text-slate-400">Verified Protocols</span>
              <span className="text-xl font-bold font-mono text-primary">{projects.length}</span>
            </div>
            <div className="p-3 rounded-xl bg-surface-container-low/60 border border-slate-800/80">
              <span className="block text-[10px] uppercase font-mono text-slate-400">Active Sectors</span>
              <span className="text-xl font-bold font-mono text-white">
                {new Set(projects.map((p) => p.category)).size}
              </span>
            </div>
            <div className="p-3 rounded-xl bg-surface-container-low/60 border border-slate-800/80">
              <span className="block text-[10px] uppercase font-mono text-slate-400">Ecosystem</span>
              <span className="text-xl font-bold font-mono text-primary-container">Elysium Network</span>
            </div>
          </div>
        )}
      </div>

      {/* Control Bar: Categories & Search */}
      <div className="flex flex-col lg:flex-row gap-space-md items-stretch lg:items-center justify-between mb-space-xl p-space-md bg-surface-container-low rounded-2xl border border-slate-800/90 shadow-lg">
        {/* Categories */}
        <div className="flex items-center gap-space-xs overflow-x-auto pb-2 lg:pb-0 scrollbar-none">
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedCategory(c.id)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-label-caps uppercase transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                selectedCategory === c.id
                  ? 'bg-primary-container text-on-primary-container font-semibold shadow-[0_0_16px_rgba(212,163,39,0.35)]'
                  : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high'
              }`}
            >
              <span className="material-symbols-outlined text-[14px]">{c.icon}</span>
              <span>{c.label}</span>
            </button>
          ))}
        </div>

        {/* Search & Sort */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1 sm:w-64">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">
              search
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search projects..."
              className="w-full bg-surface-container-lowest text-on-surface placeholder:text-outline pl-9 pr-3 py-1.5 rounded-xl text-xs border border-slate-800 focus:outline-none focus:border-primary-container"
            />
          </div>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="bg-surface-container-lowest text-on-surface text-xs rounded-xl px-3 py-1.5 border border-slate-800 focus:outline-none focus:border-primary-container font-mono"
          >
            <option value="newest">Newest</option>
            <option value="name">Alphabetical</option>
          </select>
        </div>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-space-lg">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div key={n} className="h-80 rounded-2xl bg-surface-container-low animate-pulse border border-slate-800"></div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="p-16 rounded-2xl bg-surface-container-low border border-slate-800 text-center flex flex-col items-center justify-center shadow-xl">
          <div className="w-14 h-14 rounded-2xl bg-surface-container flex items-center justify-center text-on-surface-variant mb-3">
            <span className="material-symbols-outlined text-3xl">
              {projects.length === 0 ? 'domain_disabled' : 'search_off'}
            </span>
          </div>
          <h3 className="text-base font-semibold text-on-surface mb-1">
            {projects.length === 0 ? 'No Verified Projects Listed Yet' : 'No Projects Match Criteria'}
          </h3>
          <p className="text-xs text-on-surface-variant max-w-md mb-5 leading-relaxed">
            {projects.length === 0
              ? 'All registered projects undergo administrative review before appearing publicly in the ecosystem directory.'
              : 'Try adjusting your search query or selecting a different category.'}
          </p>
          {projects.length === 0 ? (
            <button
              onClick={() => onNavigate('submit-project')}
              className="px-6 py-2.5 rounded-full bg-primary-container text-on-primary-container font-label-caps uppercase font-bold text-xs shadow-md hover:bg-primary-fixed-dim transition-all cursor-pointer"
            >
              Register a Project Account
            </button>
          ) : (
            <button
              onClick={() => {
                setSelectedCategory('ALL');
                setSearchQuery('');
              }}
              className="px-5 py-2 rounded-full bg-surface-container-high hover:bg-surface-container-highest text-xs text-on-surface transition-colors cursor-pointer"
            >
              Reset Filters
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-space-lg">
          {filtered.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              onSelect={onSelectProject}
              isSaved={savedProjectIds?.has(project.id)}
              onToggleSave={onToggleSave}
            />
          ))}
        </div>
      )}
    </div>
  );
}
