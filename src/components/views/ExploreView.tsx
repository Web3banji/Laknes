/**
 * LAKNES Explore View & Public Platform Gateway
 * 
 * - Unauthenticated: Focused, professional landing page centered on the LAKNES logo,
 *   highlighting what LAKNES does:
 *   1. Explore Projects (discover Web3 projects & quests)
 *   2. Register a Project (project profile, verification & quest publishing)
 *   3. Creator Studio (campaign opportunities & distribution)
 * - Authenticated: Explore Projects directory showing officially verified projects
 *   with clearly visible Verified badges, category filters, and search.
 * - Strictly real database records only; clean professional empty states when empty.
 */

import React, { useState } from 'react';
import { Project, User } from '../../types/contracts.ts';
import { ProjectCard } from '../common/ProjectCard.tsx';

interface ExploreViewProps {
  projects: Project[];
  isLoading: boolean;
  onSelectProject: (project: Project) => void;
  onNavigate: (view: string) => void;
  onToggleSave?: (projectId: string, e: React.MouseEvent) => void;
  savedProjectIds?: Set<string>;
  user?: User | null;
}

export function ExploreView({
  projects,
  isLoading,
  onSelectProject,
  onNavigate,
  onToggleSave,
  savedProjectIds,
  user,
}: ExploreViewProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const categoryFilters = [
    { id: 'ALL', label: 'All Categories' },
    { id: 'DEFI', label: 'DeFi' },
    { id: 'INFRASTRUCTURE', label: 'Infrastructure' },
    { id: 'NFT', label: 'NFT' },
    { id: 'LAUNCHPAD', label: 'Launchpad' },
    { id: 'MEMECOIN', label: 'Memecoin' },
    { id: 'GAMING', label: 'Gaming' },
    { id: 'SOCIAL', label: 'Social' },
  ];

  const filteredProjects = projects.filter((p) => {
    const matchesCategory =
      selectedCategory === 'ALL' ||
      p.category === selectedCategory ||
      (selectedCategory === 'INFRASTRUCTURE' && (p.category === 'INFRASTRUCTURE' || p.category === 'TOOLING'));

    const matchesSearch =
      !searchQuery.trim() ||
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.shortDescription.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.slug.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesCategory && matchesSearch;
  });

  // ========================================================
  // A. AUTHENTICATED EXPLORE DIRECTORY (REAL DATA ONLY)
  // ========================================================
  if (user) {
    return (
      <div className="w-full min-h-[calc(100vh-80px)] flex flex-col font-body-md text-on-surface bg-background pb-16">
        <div className="relative z-10 flex-1 max-w-7xl mx-auto w-full px-6 lg:px-12 py-10 space-y-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-outline-variant/20 pb-6">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                  <span className="material-symbols-outlined text-[13px]">verified</span>
                  <span>Verified Registry</span>
                </span>
                <span className="text-outline text-xs">@{user.username}</span>
              </div>
              <h1 className="text-headline-lg font-headline-lg text-on-surface font-bold tracking-tight">
                Explore Projects
              </h1>
              <p className="text-body-sm text-on-surface-variant max-w-xl mt-1">
                Discover officially verified Web3 protocols, decentralized applications, and ecosystem infrastructure.
              </p>
            </div>

            <button
              onClick={() => onNavigate('submit-project')}
              className="self-start sm:self-center px-4 py-2.5 rounded-xl bg-primary-container text-on-primary-container font-label-md text-xs font-bold hover:brightness-110 transition-all flex items-center gap-2 cursor-pointer shadow-md"
            >
              <span className="material-symbols-outlined text-[18px]">add_circle</span>
              <span>Register Project</span>
            </button>
          </div>
 
          {/* Ecosystem Visual Spotlight */}
          <div className="relative w-full rounded-2xl overflow-hidden border border-outline-variant/30 bg-surface-container-low shadow-xl">
            <div className="h-44 sm:h-48 w-full relative">
              <img
                src="/assets/images/explore_ecosystem.jpg"
                alt="Ecosystem Registry"
                className="w-full h-full object-cover object-center"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-surface-container-lowest/95 via-surface-container-lowest/70 to-transparent"></div>
              <div className="absolute inset-0 flex flex-col justify-center px-6 sm:px-10 max-w-xl">
                <span className="text-[11px] font-mono uppercase tracking-wider text-primary font-semibold mb-1 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[14px]">travel_explore</span>
                  <span>Ecosystem Directory</span>
                </span>
                <h2 className="text-headline-md font-bold text-on-surface">
                  Verified Protocol Discovery
                </h2>
                <p className="text-xs sm:text-sm text-on-surface-variant mt-1.5 leading-relaxed">
                  Every listed project is verified and backed by genuine creators and protocols. Follow projects to track campaigns and updates.
                </p>
              </div>
            </div>
          </div>

          {/* Search & Category Filter Chips */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Category Filter Chips */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
              {categoryFilters.map((cat) => {
                const isActive = selectedCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all shrink-0 cursor-pointer ${
                      isActive
                        ? 'bg-primary-container text-on-primary-container font-semibold shadow-sm'
                        : 'bg-surface-container-low text-on-surface-variant hover:text-on-surface border border-outline-variant/30 hover:border-outline-variant/60'
                    }`}
                  >
                    {cat.label}
                  </button>
                );
              })}
            </div>

            {/* Search Input */}
            <div className="relative min-w-[240px]">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[16px]">
                search
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search verified projects..."
                className="w-full bg-surface-container-low text-on-surface placeholder:text-outline text-xs pl-9 pr-3.5 py-2 rounded-xl border border-outline-variant/30 focus:outline-none focus:border-primary-container"
              />
            </div>
          </div>

          {/* Projects Grid / Empty State */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-64 rounded-2xl bg-surface-container-low animate-pulse"></div>
              ))}
            </div>
          ) : filteredProjects.length === 0 ? (
            <div className="py-20 px-6 rounded-2xl bg-surface-container-low border border-dashed border-outline-variant/40 flex flex-col items-center text-center">
              <div className="w-14 h-14 rounded-2xl bg-surface-container-high border border-outline-variant/40 flex items-center justify-center text-outline mb-4">
                <span className="material-symbols-outlined text-[28px]">domain_verification</span>
              </div>
              <h3 className="text-headline-sm font-headline-sm text-on-surface font-semibold mb-1.5">
                No verified projects found
              </h3>
              <p className="text-body-sm text-on-surface-variant max-w-md mb-6 leading-relaxed">
                Only projects that have successfully completed administrator review appear in the public Explore directory with a Verified badge.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-3">
                <button
                  onClick={() => onNavigate('submit-project')}
                  className="px-5 py-2.5 rounded-xl bg-primary-container text-on-primary-container text-xs font-bold hover:brightness-110 transition-all cursor-pointer shadow-md"
                >
                  Register a Project for Review
                </button>
                {(searchQuery || selectedCategory !== 'ALL') && (
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setSelectedCategory('ALL');
                    }}
                    className="px-4 py-2.5 rounded-xl bg-surface-container text-xs text-on-surface hover:bg-surface-container-high transition-colors cursor-pointer border border-outline-variant/30"
                  >
                    Clear Filters
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProjects.map((p) => (
                <ProjectCard
                  key={p.id}
                  project={p}
                  onSelect={onSelectProject}
                  isSaved={savedProjectIds?.has(p.id)}
                  onToggleSave={onToggleSave}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ========================================================
  // B. CLEAN, LOGO-FOCUSED PUBLIC LANDING PAGE
  // ========================================================
  return (
    <div className="flex flex-col w-full font-body-md text-on-surface selection:bg-primary-container selection:text-on-primary-container">
      {/* 1. HERO SECTION: LOGO CENTERPIECE */}
      <section className="relative min-h-[70vh] flex flex-col items-center justify-center px-6 lg:px-12 py-16 overflow-hidden bg-surface-container-lowest text-center">
        {/* Ambient radial glow centered behind the logo */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[520px] h-[340px] bg-primary-container/15 blur-[130px] rounded-full pointer-events-none"></div>

        <div className="relative z-10 max-w-3xl mx-auto flex flex-col items-center">
          {/* Main Centerpiece Logo */}
          <div className="relative mb-6 group">
            <div className="absolute inset-0 bg-primary-container/30 blur-2xl rounded-3xl scale-110 pointer-events-none group-hover:bg-primary-container/45 transition-all"></div>
            <div className="relative w-28 h-28 sm:w-36 sm:h-36 rounded-2xl bg-surface-container-low border-2 border-primary-container/50 p-4 shadow-[0_0_36px_rgba(255,87,34,0.4)] flex items-center justify-center transition-transform hover:scale-105 duration-300">
              <img
                src="/laknes-brand-emblem.png"
                alt="LAKNES Logo"
                className="w-full h-full object-contain"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src =
                    'https://lh3.googleusercontent.com/aida-public/AB6AXuBbCx-Ngfnb-71P9gWXiRQl9QYfJXesChsUORwVa8lQAmx74wJCLYHmRCtrhvhOxkbempTZ0hlp3FvhidOnFAOYl1TcCMVFrdHxBcWgq6OhoWY4tb-8laDiOHFQztpVebLwdlgdRnT-N2_QtStLeD-PsP7BRsJ95I6u2EFNclu1zI9zBuYgjfDf2Lpg9HiT1vGR8EsiBz34GPWhUYyTotU9-H2vvchOMlDYiZFDr3x6RmkS9obxDnq6';
                }}
              />
            </div>
          </div>

          <h1 className="text-display-mobile md:text-display font-display text-on-surface tracking-tight font-bold leading-tight max-w-2xl">
            Discover, Participate, and Build Web3.
          </h1>

          <p className="text-body-md md:text-body-lg font-body-lg text-on-surface-variant max-w-lg mt-3 leading-relaxed">
            LAKNES connects verified ecosystem projects with active community members and creators through transparent participation and quests.
          </p>

          {/* Primary 3 Action Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-3 mt-8 w-full">
            <button
              onClick={() => onNavigate('explore')}
              className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-primary-container to-secondary-container text-surface-container-lowest font-headline-sm text-xs font-bold px-6 py-3 rounded-xl shadow-[0_0_24px_rgba(255,87,34,0.4)] hover:shadow-[0_0_32px_rgba(255,87,34,0.6)] active:scale-[0.98] transition-all cursor-pointer whitespace-nowrap"
            >
              <span>Explore Projects</span>
              <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
            </button>

            <button
              onClick={() => onNavigate('submit-project')}
              className="inline-flex items-center justify-center gap-2 bg-surface-container-low hover:bg-surface-container border border-primary-container/40 hover:border-primary-container text-on-surface font-headline-sm text-xs px-5 py-3 rounded-xl backdrop-blur-sm active:scale-[0.98] transition-all cursor-pointer font-medium whitespace-nowrap"
            >
              <span>Register a Project</span>
            </button>

            <button
              onClick={() => onNavigate('creator-studio')}
              className="inline-flex items-center justify-center gap-2 bg-surface-container-low hover:bg-surface-container border border-outline-variant/40 hover:border-primary-container text-on-surface font-headline-sm text-xs px-5 py-3 rounded-xl backdrop-blur-sm active:scale-[0.98] transition-all cursor-pointer font-medium whitespace-nowrap"
            >
              <span>Creator Studio</span>
            </button>
          </div>
        </div>
      </section>

      {/* 2. THE THREE CORE ENTRY POINTS WITH RICH VISUALS */}
      <section className="px-6 lg:px-12 py-16 max-w-6xl mx-auto w-full border-t border-outline-variant/20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Pillar 1: Explore Projects */}
          <div
            onClick={() => onNavigate('explore')}
            className="p-5 rounded-2xl bg-surface-container-low border border-outline-variant/30 hover:border-primary-container/60 transition-all cursor-pointer flex flex-col justify-between group shadow-xl overflow-hidden"
          >
            <div>
              <div className="relative w-full aspect-[16/10] rounded-xl overflow-hidden mb-5 bg-surface-container-lowest border border-outline-variant/30">
                <img
                  src="/assets/images/explore_ecosystem.jpg"
                  alt="Explore Ecosystem Projects"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-surface-container-low via-surface-container-low/20 to-transparent pointer-events-none"></div>
                <div className="absolute bottom-2.5 left-2.5 flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-surface-container-lowest/80 backdrop-blur-md text-[11px] font-mono text-primary font-semibold">
                  <span className="material-symbols-outlined text-[14px]">travel_explore</span>
                  <span>Ecosystem Directory</span>
                </div>
              </div>

              <h3 className="text-headline-sm font-headline-sm text-on-surface font-semibold mb-2 group-hover:text-primary transition-colors">
                Explore Projects
              </h3>
              <p className="text-body-sm font-body-sm text-on-surface-variant leading-relaxed">
                Discover verified blockchain protocols, follow project updates, and participate in ecosystem quests.
              </p>
            </div>
            <div className="pt-5 mt-5 border-t border-outline-variant/20 flex items-center justify-between text-xs text-primary font-semibold">
              <span>Discover Ecosystem</span>
              <span className="material-symbols-outlined text-[16px] group-hover:translate-x-1 transition-transform">
                arrow_forward
              </span>
            </div>
          </div>

          {/* Pillar 2: Register a Project */}
          <div
            onClick={() => onNavigate('submit-project')}
            className="p-5 rounded-2xl bg-surface-container-low border border-outline-variant/30 hover:border-primary-container/60 transition-all cursor-pointer flex flex-col justify-between group shadow-xl overflow-hidden"
          >
            <div>
              <div className="relative w-full aspect-[16/10] rounded-xl overflow-hidden mb-5 bg-surface-container-lowest border border-outline-variant/30">
                <img
                  src="/assets/images/project_registry.jpg"
                  alt="Register Web3 Project"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-surface-container-low via-surface-container-low/20 to-transparent pointer-events-none"></div>
                <div className="absolute bottom-2.5 left-2.5 flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-surface-container-lowest/80 backdrop-blur-md text-[11px] font-mono text-primary font-semibold">
                  <span className="material-symbols-outlined text-[14px]">verified_user</span>
                  <span>Verification Portal</span>
                </div>
              </div>

              <h3 className="text-headline-sm font-headline-sm text-on-surface font-semibold mb-2 group-hover:text-primary transition-colors">
                Register a Project
              </h3>
              <p className="text-body-sm font-body-sm text-on-surface-variant leading-relaxed">
                Create an official project profile, gain visibility in Explore, and publish community quests.
              </p>
            </div>
            <div className="pt-5 mt-5 border-t border-outline-variant/20 flex items-center justify-between text-xs text-primary font-semibold">
              <span>Register Protocol</span>
              <span className="material-symbols-outlined text-[16px] group-hover:translate-x-1 transition-transform">
                arrow_forward
              </span>
            </div>
          </div>

          {/* Pillar 3: Creator Studio */}
          <div
            onClick={() => onNavigate('creator-studio')}
            className="p-5 rounded-2xl bg-surface-container-low border border-outline-variant/30 hover:border-primary-container/60 transition-all cursor-pointer flex flex-col justify-between group shadow-xl overflow-hidden"
          >
            <div>
              <div className="relative w-full aspect-[16/10] rounded-xl overflow-hidden mb-5 bg-surface-container-lowest border border-outline-variant/30">
                <img
                  src="/assets/images/creator_campaigns.jpg"
                  alt="Creator Studio & Campaigns"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-surface-container-low via-surface-container-low/20 to-transparent pointer-events-none"></div>
                <div className="absolute bottom-2.5 left-2.5 flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-surface-container-lowest/80 backdrop-blur-md text-[11px] font-mono text-secondary font-semibold">
                  <span className="material-symbols-outlined text-[14px]">campaign</span>
                  <span>Creator Program</span>
                </div>
              </div>

              <h3 className="text-headline-sm font-headline-sm text-on-surface font-semibold mb-2 group-hover:text-primary transition-colors">
                Creator Studio
              </h3>
              <p className="text-body-sm font-body-sm text-on-surface-variant leading-relaxed">
                Participate in sponsored campaigns, publish content on social channels, submit post URLs, and earn rewards.
              </p>
            </div>
            <div className="pt-5 mt-5 border-t border-outline-variant/20 flex items-center justify-between text-xs text-secondary font-semibold">
              <span>Access Studio</span>
              <span className="material-symbols-outlined text-[16px] group-hover:translate-x-1 transition-transform">
                arrow_forward
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* 3. VERIFIED PROJECTS PREVIEW (REAL DATABASE DATA ONLY) */}
      {projects.length > 0 && (
        <section className="px-6 lg:px-12 py-12 max-w-6xl mx-auto w-full border-t border-outline-variant/20">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-headline-md font-headline-md text-on-surface font-bold">
                Verified Projects
              </h2>
              <p className="text-body-sm font-body-sm text-on-surface-variant mt-1">
                Protocols verified on the LAKNES network.
              </p>
            </div>
            <button
              onClick={() => onNavigate('explore')}
              className="inline-flex items-center gap-1 text-primary hover:text-on-surface text-xs font-semibold transition-colors cursor-pointer"
            >
              <span>View All ({projects.length})</span>
              <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.slice(0, 3).map((p) => (
              <ProjectCard
                key={p.id}
                project={p}
                onSelect={onSelectProject}
                isSaved={savedProjectIds?.has(p.id)}
                onToggleSave={onToggleSave}
              />
            ))}
          </div>
        </section>
      )}

      {/* 4. CALL TO ACTION */}
      <section className="px-6 lg:px-12 py-16 max-w-4xl mx-auto w-full text-center">
        <div className="p-8 rounded-2xl bg-surface-container-low border border-primary-container/30 shadow-xl space-y-4">
          <h3 className="text-headline-md font-headline-md font-bold text-on-surface">
            Get Started on LAKNES
          </h3>
          <p className="text-body-sm text-on-surface-variant max-w-md mx-auto">
            Sign in with Google to explore verified projects, participate in quests, submit content, or register your Web3 protocol.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              onClick={() => onNavigate('signin')}
              className="px-6 py-2.5 rounded-xl bg-primary-container text-on-primary-container font-label-md text-xs font-bold hover:brightness-110 transition-all shadow-md cursor-pointer"
            >
              Sign In with Google
            </button>
            <button
              onClick={() => onNavigate('explore')}
              className="px-5 py-2.5 rounded-xl bg-surface-container hover:bg-surface-container-high text-xs text-on-surface font-medium border border-outline-variant/30 transition-colors cursor-pointer"
            >
              Explore Projects
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
