/**
 * LAKNES Projects Directory View (Yochi-inspired Design System)
 * Searchable, filterable ecosystem project directory with paper/sumi editorial rhythm.
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
    { id: 'ALL', label: 'All Sectors' },
    { id: ProjectCategory.DEFI, label: 'DeFi' },
    { id: ProjectCategory.INFRASTRUCTURE, label: 'Infrastructure' },
    { id: ProjectCategory.GAMING, label: 'Gaming' },
    { id: ProjectCategory.SOCIAL, label: 'Social & Media' },
    { id: ProjectCategory.NFT_METAVERSE, label: 'NFT & Metaverse' },
    { id: ProjectCategory.TOOLING, label: 'Tooling & AI' },
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
    <div className="lp-page py-12">
      <div className="lp-shell">
        {/* Editorial Heading */}
        <div className="border-b-[1.5px] border-[var(--yo-ink)] pb-8 mb-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <span className="lp-eyebrow">01 / DISCOVER</span>
              <h1 className="yo-display text-3xl sm:text-5xl text-[var(--yo-ink)] mt-2">
                Verified Projects
              </h1>
              <p className="font-body text-base text-[var(--yo-muted)] mt-2 max-w-2xl leading-relaxed">
                Explore officially vetted protocols, decentralized applications, and high-performance infrastructure powering Web3.
              </p>
            </div>

            {/* Action Button */}
            <div className="shrink-0">
              {isProjectRepOrAdmin ? (
                <button
                  onClick={() => onNavigate('submit-project')}
                  className="lp-button lp-button-primary"
                  style={{ minHeight: '46px', padding: '10px 20px', fontSize: '11px' }}
                >
                  <span>REGISTER NEW PROJECT</span>
                  <span aria-hidden="true">+</span>
                </button>
              ) : !user ? (
                <button
                  onClick={() => (onOpenAuth ? onOpenAuth('register', 'project') : onNavigate('submit-project'))}
                  className="lp-button lp-button-primary"
                  style={{ minHeight: '46px', padding: '10px 20px', fontSize: '11px' }}
                >
                  <span>SUBMIT PROJECT</span>
                  <span aria-hidden="true">↗</span>
                </button>
              ) : isIndividualUserOnly ? (
                <div className="inline-flex items-center gap-2 px-3 py-1.5 border border-[var(--yo-line)] bg-[var(--yo-surface-1)] text-[11px] font-mono text-[var(--yo-muted)] font-bold uppercase">
                  <span className="material-symbols-outlined text-[15px] text-[var(--yo-accent)]">person</span>
                  <span>CONTRIBUTOR MODE</span>
                </div>
              ) : null}
            </div>
          </div>

          {/* Directory Stats Strip */}
          {projects.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-6 pt-6 border-t border-[var(--yo-line)]">
              <div className="p-3 bg-[var(--yo-surface-1)] border border-[var(--yo-line)]">
                <span className="block text-[10px] uppercase font-mono text-[var(--yo-muted)] font-bold">VERIFIED PROTOCOLS</span>
                <span className="text-2xl font-bold font-mono text-[var(--yo-accent-text)]">{projects.length}</span>
              </div>
              <div className="p-3 bg-[var(--yo-surface-1)] border border-[var(--yo-line)]">
                <span className="block text-[10px] uppercase font-mono text-[var(--yo-muted)] font-bold">ACTIVE SECTORS</span>
                <span className="text-2xl font-bold font-mono text-[var(--yo-ink)]">
                  {new Set(projects.map((p) => p.category)).size}
                </span>
              </div>
              <div className="p-3 bg-[var(--yo-surface-1)] border border-[var(--yo-line)]">
                <span className="block text-[10px] uppercase font-mono text-[var(--yo-muted)] font-bold">STATUS</span>
                <span className="text-2xl font-bold font-mono text-[var(--yo-good)]">OPEN &bull; ACTIVE</span>
              </div>
            </div>
          )}
        </div>

        {/* Filter & Search Bar */}
        <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center justify-between mb-8 p-3 bg-[var(--yo-surface-1)] border border-[var(--yo-line)]">
          {/* Categories */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-2 lg:pb-0 scrollbar-none">
            {categories.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelectedCategory(c.id)}
                className={`px-3 py-1.5 text-[10px] font-mono font-bold uppercase tracking-wider transition-colors whitespace-nowrap cursor-pointer ${
                  selectedCategory === c.id
                    ? 'bg-[var(--yo-ink)] text-[var(--yo-bg)]'
                    : 'text-[var(--yo-muted)] hover:text-[var(--yo-ink)] bg-transparent'
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>

          {/* Search & Sort */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1 sm:w-64">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="SEARCH PROJECTS..."
                className="w-full bg-[var(--yo-surface-2)] text-[var(--yo-ink)] placeholder:text-[var(--yo-muted)] pl-8 pr-3 py-1.5 text-[11px] font-mono border border-[var(--yo-line)] focus:outline-none focus:border-[var(--yo-ink)]"
              />
              <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-[14px] text-[var(--yo-muted)] pointer-events-none">
                search
              </span>
            </div>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-[var(--yo-surface-2)] text-[var(--yo-ink)] text-[11px] px-3 py-1.5 border border-[var(--yo-line)] focus:outline-none focus:border-[var(--yo-ink)] font-mono font-bold"
            >
              <option value="newest">NEWEST</option>
              <option value="name">ALPHABETICAL</option>
            </select>
          </div>
        </div>

        {/* Grid of Projects */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <div key={n} className="h-72 bg-[var(--yo-surface-1)] border border-[var(--yo-line)] animate-pulse"></div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-16 bg-[var(--yo-surface-1)] border border-[var(--yo-line)] text-center flex flex-col items-center justify-center">
            <span className="w-12 h-12 border border-[var(--yo-line)] flex items-center justify-center font-mono text-xl mb-3 text-[var(--yo-muted)]">
              &empty;
            </span>
            <h3 className="yo-display text-lg text-[var(--yo-ink)] mb-1">
              {projects.length === 0 ? 'No Verified Projects Listed Yet' : 'No Projects Match Filters'}
            </h3>
            <p className="font-body text-xs text-[var(--yo-muted)] max-w-md mb-6 leading-relaxed">
              {projects.length === 0
                ? 'All registered projects undergo review before appearing publicly in the ecosystem directory.'
                : 'Try adjusting your search query or selecting a different category.'}
            </p>
            {projects.length === 0 ? (
              <button
                onClick={() => onNavigate('submit-project')}
                className="lp-button lp-button-primary text-xs"
              >
                <span>REGISTER A PROJECT</span>
                <span aria-hidden="true">+</span>
              </button>
            ) : (
              <button
                onClick={() => {
                  setSelectedCategory('ALL');
                  setSearchQuery('');
                }}
                className="lp-button lp-button-secondary text-xs"
              >
                <span>RESET FILTERS</span>
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
    </div>
  );
}
