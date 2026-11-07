/**
 * LAKNES Explore View & Public Platform Gateway (Yochi-inspired Design System)
 * 
 * Implements the Yochi paper/sumi editorial layout:
 * - 1280px shell (`lp-shell`), 1.5px ink borders, hard editorial corners, generous whitespace.
 * - Bold display typography (`Dela Gothic One`), clean grotesk body (`Zen Kaku Gothic New`), mono caps stats/labels (`JetBrains Mono`).
 * - 1.2fr copy / 1fr interactive demo grid (`#practice`) with contribution path selection.
 * - Ecosystem 3-card grid (Discover, Participate, Build) with lead card spanning two rows.
 * - 3-step editorial process ("Every contribution goes somewhere").
 * - Dark record & proof section (`yochi-sumi`) with collaboration record card, stamp, and reputation columns.
 * - Editorial FAQ accordion with rotate indicator.
 * - Verified Projects directory with search & category filters using real database records.
 */

import React, { useState, useMemo } from 'react';
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

  return (
    <div className="lp-page">
      {/* 1. HERO SECTION */}
      <div className="lp-shell">
        <section className="lp-hero" aria-labelledby="landing-title">
          <div className="lp-hero-copy">
            <span className="lp-eyebrow lp-hero-eyebrow">
              <span className="lp-dot" /> WEB3 ECOSYSTEM PLATFORM
            </span>
            <h1 id="landing-title" className="yo-display">
              Find the right.<br />Build your record.
            </h1>
            <p className="lp-hero-pitch">Discover projects. Contribute real work.</p>
            <p className="lp-hero-description">
              Discover verified Web3 projects, join quests and campaigns, submit real work, and grow with the ecosystems shaping Web3.
            </p>
            <div className="lp-actions">
              <button
                type="button"
                onClick={() => onNavigate('projects')}
                className="lp-button lp-button-primary"
              >
                <span>EXPLORE OPPORTUNITIES</span>
                <span aria-hidden="true">↗</span>
              </button>
              <button
                type="button"
                onClick={() => onNavigate('quests')}
                className="lp-button lp-button-secondary"
              >
                <span>VIEW QUESTS</span>
                <span aria-hidden="true">↗</span>
              </button>
            </div>
            <div className="lp-hero-facts">
              <span><strong>VERIFIED</strong> PROJECTS</span>
              <span><strong>LIVE</strong> QUESTS &amp; CAMPAIGNS</span>
              <span><strong>OPEN</strong> TO CREATORS</span>
            </div>
          </div>

          {/* Real Platform Ecosystem Core Showcase */}
          <div className="lp-practice">
            <div className="lp-practice-intro">
              <span className="lp-eyebrow">WEB3 ECOSYSTEM DIRECTORY</span>
              <span className="lp-practice-arrow" aria-hidden="true">↙</span>
            </div>
            <section aria-label="Laknes Platform Core" className="yochi-sumi">
              <div className="lp-practice-head">
                <span>LAKNES PLATFORM &middot; REAL DIRECTORY</span>
                <span className="live">LIVE ECOSYSTEM</span>
              </div>
              <div className="lp-practice-body">
                <div className="lp-op">
                  <div className="lp-op-top">
                    <span><strong>Laknes Network</strong></span>
                    <span className="reward">ECOSYSTEM</span>
                  </div>
                  <h3>Direct Web3 Connection</h3>
                  <p>
                    Connecting verified Web3 projects with active contributors and creators. Discover registries, launch opportunities, and track verified contribution records.
                  </p>
                  <div className="lp-meta">
                    <span className="lp-chip">VERIFIED DIRECTORY</span>
                    <span className="lp-chip">ACTIVE CAMPAIGNS</span>
                    <span className="lp-chip">CONTRIBUTION RECORDS</span>
                  </div>
                  <div className="mt-4 pt-3 border-t border-[var(--yo-line)] space-y-2">
                    <button
                      type="button"
                      onClick={() => onNavigate('submit-project')}
                      className="w-full p-2.5 bg-[var(--yo-surface-2)] border border-[var(--yo-line)] hover:border-[var(--yo-ink)] text-xs flex items-center justify-between text-left transition-colors cursor-pointer"
                    >
                      <div>
                        <strong className="block text-[var(--yo-ink)] font-mono text-xs">REGISTER A PROJECT</strong>
                        <span className="text-[10px] text-[var(--yo-muted)] font-mono uppercase">Submit your ecosystem to the verified registry</span>
                      </div>
                      <span className="font-mono text-xs font-bold text-[var(--yo-accent-text)]">APPLY ↗</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onNavigate('creator-studio')}
                      className="w-full p-2.5 bg-[var(--yo-surface-2)] border border-[var(--yo-line)] hover:border-[var(--yo-ink)] text-xs flex items-center justify-between text-left transition-colors cursor-pointer"
                    >
                      <div>
                        <strong className="block text-[var(--yo-ink)] font-mono text-xs">OPEN CREATOR STUDIO</strong>
                        <span className="text-[10px] text-[var(--yo-muted)] font-mono uppercase">Manage briefs, submissions, and portfolio</span>
                      </div>
                      <span className="font-mono text-xs font-bold text-[var(--yo-accent-text)]">ENTER ↗</span>
                    </button>
                  </div>
                </div>
              </div>
            </section>
            <p className="lp-practice-caption">
              Discover verified Web3 ecosystems &middot; Real campaigns &middot; Built on proof of contribution.
            </p>
          </div>
        </section>

        {/* 2. THE ECOSYSTEM: THREE WAYS TO BUILD */}
        <section id="ecosystem" className="lp-games lp-section" aria-labelledby="games-title">
          <div className="lp-section-heading">
            <div>
              <span className="lp-eyebrow">THE ECOSYSTEM</span>
              <h2 id="games-title" className="yo-display">One platform, three ways to build.</h2>
            </div>
            <p>
              Discover projects, take on real opportunities, and grow through the work you contribute.<br />
              Discovery is the easiest place to start.
            </p>
          </div>

          <div className="lp-game-grid">
            {/* 01: Discover Projects */}
            <div
              onClick={() => onNavigate('projects')}
              className="lp-game lp-game-ffa"
              role="button"
              tabIndex={0}
              aria-label="Explore Project Discovery"
            >
              <div className="lp-game-top">
                <span className="lp-eyebrow">01 / DISCOVER</span>
                <span className="lp-example-label">PROJECTS</span>
              </div>
              <div className="lp-game-main">
                <span className="lp-eyebrow">THE ONE TO START WITH</span>
                <h3>Project Discovery</h3>
                <p className="lp-game-tagline">Verified projects and ecosystems.</p>
                <p>
                  Explore Web3 projects, registries, and active opportunities worth your time. Find the ecosystems where your contribution fits.
                </p>
              </div>
              <div className="lp-pool-preview" aria-label="Ecosystem directory state">
                <div className="lp-preview-top">
                  <span>DIRECTORY STATUS</span>
                  <span>VERIFIED <span aria-hidden="true">&#9635;</span></span>
                </div>
                <div className="lp-pool-picks">
                  <div>
                    <span>REGISTRY</span>
                    <strong>ECOSYSTEM<span> DIRECTORY</span></strong>
                  </div>
                  <span className="lp-pool-versus">+</span>
                  <div>
                    <span>OPPORTUNITIES</span>
                    <strong>LIVE<span> CAMPAIGNS</span></strong>
                  </div>
                </div>
                <div className="lp-pool-bar" aria-hidden="true">
                  <span />
                  <span />
                </div>
                <div className="lp-pool-total">
                  <span>ECOSYSTEM STATUS</span>
                  <strong>OPEN FOR REGISTRATION</strong>
                </div>
              </div>
              <div className="lp-game-bottom">
                <span>VERIFIED PROJECTS &middot; LIVE OPPORTUNITIES</span>
                <span>EXPLORE PROJECTS ↗</span>
              </div>
            </div>

            {/* 02: Participate in Quests & Campaigns */}
            <div
              onClick={() => onNavigate('quests')}
              className="lp-game lp-game-duels"
              role="button"
              tabIndex={0}
              aria-label="Open Quests and Campaigns"
            >
              <div className="lp-game-top">
                <span className="lp-eyebrow">02 / PARTICIPATE</span>
                <span className="lp-example-label">OPPORTUNITIES</span>
              </div>
              <div className="lp-game-main">
                <h3>Quests &amp; Campaigns</h3>
                <p>
                  Join community initiatives, campaigns, and quests &mdash; then submit proof, content, or feedback to the right project.
                </p>
              </div>
              <div className="lp-duel-preview">
                <div className="lp-mini-list">
                  <div className="lp-mini-row">
                    <span>Initiative</span>
                    <strong>Ecosystem Content &amp; Growth</strong>
                  </div>
                  <div className="lp-mini-row">
                    <span>Category</span>
                    <strong>Creator &amp; Community</strong>
                  </div>
                  <div className="lp-mini-row">
                    <span>Submissions</span>
                    <strong>Open to verified contributors</strong>
                  </div>
                </div>
              </div>
              <div className="lp-game-bottom">
                <span>SUBMIT WORK &middot; EARN CREDIT</span>
                <span>VIEW OPPORTUNITIES ↗</span>
              </div>
            </div>

            {/* 03: Creator Studio & Registry */}
            <div
              onClick={() => onNavigate('creator-studio')}
              className="lp-game lp-game-royale"
              role="button"
              tabIndex={0}
              aria-label="Open Creator Studio"
            >
              <div className="lp-game-top">
                <span className="lp-eyebrow">03 / BUILD</span>
                <span className="lp-example-label">STUDIO</span>
              </div>
              <div className="lp-game-main">
                <h3>Creator Studio</h3>
                <p>
                  Build your creator profile, manage submissions, collaborate with projects, and register ecosystems on Laknes.
                </p>
              </div>
              <div className="lp-royale-preview">
                <div className="lp-mini-list">
                  <div className="lp-mini-row">
                    <span>Profile</span>
                    <strong>Creator record</strong>
                  </div>
                  <div className="lp-mini-row">
                    <span>Work</span>
                    <strong>Submissions tracked</strong>
                  </div>
                  <div className="lp-mini-row">
                    <span>Projects</span>
                    <strong>Register &amp; launch</strong>
                  </div>
                </div>
              </div>
              <div className="lp-game-bottom">
                <span>FOR CREATORS &middot; FOR PROJECTS</span>
                <span>OPEN CREATOR STUDIO ↗</span>
              </div>
            </div>
          </div>
        </section>

        {/* 3. HOW IT WORKS */}
        <section id="how" className="lp-how lp-section" aria-labelledby="how-title">
          <div className="lp-how-heading">
            <span className="lp-eyebrow">THE PATH IS ONLY THE BEGINNING</span>
            <h2 id="how-title" className="yo-display">
              Every contribution<br />goes somewhere.
            </h2>
          </div>
          <ol className="lp-steps">
            <li>
              <span className="lp-step-number">01</span>
              <h3 className="yo-display">Discover the opportunity.</h3>
              <p>
                Find verified projects, quests, campaigns, and community initiatives that match how you want to contribute.
              </p>
            </li>
            <li>
              <span className="lp-step-number">02</span>
              <h3 className="yo-display">Participate and submit.</h3>
              <p>
                Create content, join a campaign, complete a quest, or share feedback. Submit your work to the right project.
              </p>
            </li>
            <li>
              <span className="lp-step-number">03</span>
              <h3 className="yo-display">Grow your record.</h3>
              <p>
                Build visibility, trust, and relationships across ecosystems. One contribution is a start; a track record opens doors.
              </p>
            </li>
          </ol>
        </section>
      </div>

      {/* 4. RECORD / PROOF SECTION (Yochi Sumi Dark Edition) */}
      <section id="record" className="yochi-sumi lp-personal" aria-labelledby="personal-title">
        <div className="lp-shell">
          <div className="lp-personal-main">
            <div className="lp-personal-copy">
              <span className="lp-eyebrow">IT GETS REAL</span>
              <h2 id="personal-title" className="yo-display">
                The work ends.<br />The record doesn’t.
              </h2>
              <p>
                Laknes is about meaningful participation. Contributions, submissions, and collaborations can build a record that follows you across projects.
              </p>
              <button
                type="button"
                onClick={() => onNavigate(user ? 'user-dashboard' : 'signin')}
                className="lp-text-link"
              >
                <span>Build your profile</span>
                <span aria-hidden="true">↗</span>
              </button>
            </div>

            <div className="lp-rivalry-record" aria-label="Example collaboration record">
              <div className="lp-record-header">
                <span className="lp-eyebrow">COLLABORATION RECORD</span>
                <span className="lp-example-label">EXAMPLE</span>
              </div>
              <div className="lp-rivalry-players">
                <div className="lp-player">
                  <div className="lp-avatar">CR</div>
                  <strong className="yo-display">@creator</strong>
                  <span>CONTRIBUTOR PROFILE</span>
                </div>
                <div className="lp-record-score">
                  <span className="lp-eyebrow">CONTRIBUTIONS</span>
                  <strong className="yo-display">12</strong>
                  <span>ACROSS 5 PROJECTS</span>
                </div>
                <div className="lp-player">
                  <div className="lp-avatar">PR</div>
                  <strong className="yo-display">Projects</strong>
                  <span>ECOSYSTEMS JOINED</span>
                </div>
              </div>
              <div className="lp-record-history">
                <span className="lp-eyebrow">RECENT WORK</span>
                <span className="lp-history-marks" aria-hidden="true">
                  <span className="lp-mark on">&#10003;</span>
                  <span className="lp-mark on">&#10003;</span>
                  <span className="lp-mark">&middot;</span>
                  <span className="lp-mark on">&#10003;</span>
                  <span className="lp-mark on">&#10003;</span>
                </span>
              </div>
              <div className="lp-record-result">
                <span>
                  <span className="lp-eyebrow">LATEST SUBMISSION &middot; VERIFIED</span>
                  <strong>Campaign <span>COMPLETED</span></strong>
                </span>
                <span className="lp-stamp" aria-hidden="true">
                  ON<br />RECORD
                </span>
              </div>
            </div>
          </div>

          <div className="lp-reputation">
            <div>
              <span className="lp-eyebrow">01 / EARN IT</span>
              <h3 className="yo-display">A record built on real work.</h3>
              <p>
                Quests, campaigns, feedback, and collaborations add up to visible participation &mdash; not empty activity.
              </p>
            </div>
            <div>
              <span className="lp-eyebrow">02 / SHOW IT</span>
              <h3 className="yo-display">Proof you can point to.</h3>
              <p>
                Profiles, submissions, and project registrations make it easier for ecosystems to understand what you’ve done.
              </p>
            </div>
            <div>
              <span className="lp-eyebrow">03 / BUILD IT</span>
              <h3 className="yo-display">Turn attention into contribution.</h3>
              <p>
                Communities and campaigns become places to participate, connect, and grow with projects over time.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. VERIFIED ECOSYSTEM DIRECTORY (LIVE DATABASE RECORDS) */}
      <div className="lp-shell">
        <section id="directory" className="lp-section border-t-[1.5px] border-[var(--yo-ink)]">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
            <div>
              <span className="lp-eyebrow">OFFICIAL DIRECTORY</span>
              <h2 className="yo-display text-3xl sm:text-4xl mt-2">
                Verified Projects
              </h2>
              <p className="text-sm text-[var(--yo-muted)] mt-1.5 max-w-xl leading-relaxed">
                Explore officially vetted Web3 protocols and ecosystems listed on Laknes.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => onNavigate('projects')}
                className="lp-button lp-button-secondary text-xs"
                style={{ minHeight: '44px', padding: '10px 18px' }}
              >
                <span>VIEW ALL ({projects.length})</span>
                <span aria-hidden="true">↗</span>
              </button>
              <button
                type="button"
                onClick={() => onNavigate('submit-project')}
                className="lp-button lp-button-primary text-xs"
                style={{ minHeight: '44px', padding: '10px 18px' }}
              >
                <span>REGISTER PROTOCOL</span>
                <span aria-hidden="true">+</span>
              </button>
            </div>
          </div>

          {/* Filters & Search */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 p-3 bg-[var(--yo-surface-1)] border border-[var(--yo-line)] mb-8">
            <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
              {categoryFilters.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-wider transition-colors whitespace-nowrap cursor-pointer ${
                    selectedCategory === cat.id
                      ? 'bg-[var(--yo-ink)] text-[var(--yo-bg)]'
                      : 'text-[var(--yo-muted)] hover:text-[var(--yo-ink)]'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            <div className="relative min-w-[220px]">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="SEARCH PROJECTS..."
                className="w-full h-8 pl-8 pr-3 text-[11px] font-mono tracking-wider bg-[var(--yo-surface-2)] border border-[var(--yo-line)] text-[var(--yo-ink)] placeholder:text-[var(--yo-muted)] focus:outline-none focus:border-[var(--yo-ink)]"
              />
              <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-[14px] text-[var(--yo-muted)] pointer-events-none">
                search
              </span>
            </div>
          </div>

          {/* Projects Grid / Empty State */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-64 bg-[var(--yo-surface-1)] border border-[var(--yo-line)] animate-pulse"></div>
              ))}
            </div>
          ) : filteredProjects.length === 0 ? (
            <div className="py-16 px-6 bg-[var(--yo-surface-1)] border border-[var(--yo-line)] text-center flex flex-col items-center">
              <span className="w-12 h-12 border border-[var(--yo-line)] flex items-center justify-center font-mono text-xl mb-3 text-[var(--yo-muted)]">
                &empty;
              </span>
              <h3 className="yo-display text-base text-[var(--yo-ink)] mb-1">
                No matching verified projects found
              </h3>
              <p className="font-body text-xs text-[var(--yo-muted)] max-w-md mb-6 leading-relaxed">
                Only projects that have successfully completed verification appear in the public registry.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => onNavigate('submit-project')}
                  className="lp-button lp-button-primary text-xs"
                  style={{ minHeight: '40px', padding: '8px 16px' }}
                >
                  <span>REGISTER PROJECT</span>
                  <span aria-hidden="true">↗</span>
                </button>
                {(searchQuery || selectedCategory !== 'ALL') && (
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setSelectedCategory('ALL');
                    }}
                    className="lp-button lp-button-secondary text-xs"
                    style={{ minHeight: '40px', padding: '8px 16px' }}
                  >
                    <span>RESET FILTERS</span>
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProjects.slice(0, 6).map((p) => (
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
        </section>

        {/* 6. FAQ ACCORDION */}
        <section id="faq" className="lp-faq" aria-labelledby="faq-title">
          <div className="lp-faq-heading">
            <span className="lp-eyebrow">BEFORE YOU JOIN</span>
            <h2 id="faq-title" className="yo-display">Clear answers.</h2>
            <p>Everything worth knowing before your first contribution.</p>
            <button
              type="button"
              onClick={() => onNavigate('projects')}
              className="lp-text-link mt-4"
            >
              <span>Explore the directory</span>
              <span aria-hidden="true">↗</span>
            </button>
          </div>
          <div className="lp-faq-list">
            <details open>
              <summary>
                <span>What is Laknes?</span>
                <span className="lp-faq-plus" aria-hidden="true">+</span>
              </summary>
              <p>
                Laknes is a Web3 ecosystem platform where people discover projects, join quests and campaigns, submit contributions, and build relationships with the ecosystems they care about.
              </p>
            </details>
            <details>
              <summary>
                <span>Who is Laknes for?</span>
                <span className="lp-faq-plus" aria-hidden="true">+</span>
              </summary>
              <p>
                Creators, contributors, community members, and Web3 projects. Creators and users can find opportunities and build a record; projects can register, launch initiatives, and connect with participants.
              </p>
            </details>
            <details>
              <summary>
                <span>Do I need a wallet to explore?</span>
                <span className="lp-faq-plus" aria-hidden="true">+</span>
              </summary>
              <p>
                You can explore the platform and understand opportunities before taking wallet-specific actions. Some quests, campaigns, or verification flows may require an account or wallet depending on how the project runs them.
              </p>
            </details>
            <details>
              <summary>
                <span>How do quests, campaigns, and submissions work?</span>
                <span className="lp-faq-plus" aria-hidden="true">+</span>
              </summary>
              <p>
                Projects and initiatives publish opportunities with requirements. Participants complete the work &mdash; content, community, on-chain, developer, or feedback tasks &mdash; and submit proof or deliverables through Laknes where supported.
              </p>
            </details>
            <details>
              <summary>
                <span>What does &ldquo;verified project&rdquo; mean?</span>
                <span className="lp-faq-plus" aria-hidden="true">+</span>
              </summary>
              <p>
                Laknes surfaces project information and verification status to help users evaluate ecosystems. Always review project details, requirements, and external links before participating.
              </p>
            </details>
            <details>
              <summary>
                <span>How can a project launch on Laknes?</span>
                <span className="lp-faq-plus" aria-hidden="true">+</span>
              </summary>
              <p>
                Projects can register through the project portal, provide ecosystem details, and use Laknes to publish updates, quests, campaigns, and opportunities for the community.
              </p>
            </details>
          </div>
        </section>

        {/* 7. CLOSER CTA BAND */}
        <section className="lp-closer" aria-labelledby="closer-title">
          <div>
            <span className="lp-eyebrow">YOU ALREADY HAVE SOMETHING TO CONTRIBUTE.</span>
            <h2 id="closer-title" className="yo-display">Find where it belongs.</h2>
          </div>
          <div className="lp-closer-actions">
            <button
              type="button"
              onClick={() => onNavigate('projects')}
              className="lp-button lp-button-primary"
            >
              <span>EXPLORE OPPORTUNITIES</span>
              <span aria-hidden="true">↗</span>
            </button>
            <button
              type="button"
              onClick={() => onNavigate('submit-project')}
              className="lp-text-link"
            >
              <span>Register your project</span>
              <span aria-hidden="true">↗</span>
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
