/**
 * LAKNES Project Builder Portal | Registration & Verification
 * 
 * Implements simple, intuitive project registration for authenticated users:
 * - Project Name
 * - Logo URL
 * - Short & Full Description
 * - Website URL
 * - Social Links (X, Telegram, Discord, GitHub)
 * - Category (DeFi, Infrastructure, NFT, Launchpad, Memecoin, Gaming, Social, Custom)
 * - Ecosystem (Elysium, Ethereum, Solana, Arbitrum, Base, Other)
 * 
 * Enforces:
 * - Every submitted project enters a Pending Review state in LAKNES database.
 * - Only administrators can approve or reject projects.
 * - Only approved projects appear in public Explore with a Verified badge.
 */

import React, { useState } from 'react';
import { User, ProjectCategory } from '../../types/contracts.ts';
import { laknesClient } from '../../client/api-client.ts';

interface SubmitProjectViewProps {
  user: User | null;
  onNavigate: (view: string) => void;
  onOpenAuth: (mode?: 'login' | 'register', accountType?: 'user' | 'project') => void;
  onProjectSubmitted: (projectId: string) => void;
}

const PRESET_CATEGORIES = [
  { id: 'DEFI', label: 'DeFi (Decentralized Finance)' },
  { id: 'INFRASTRUCTURE', label: 'Infrastructure & Protocols' },
  { id: 'NFT', label: 'NFT & Digital Assets' },
  { id: 'LAUNCHPAD', label: 'Launchpad & Token Sales' },
  { id: 'MEMECOIN', label: 'Memecoin & Community' },
  { id: 'GAMING', label: 'Gaming & Metaverse' },
  { id: 'SOCIAL', label: 'Social & Identity' },
  { id: 'CUSTOM', label: '+ Custom / Other Category' },
];

const PRESET_ECOSYSTEMS = [
  'Elysium',
  'Ethereum',
  'Solana',
  'Arbitrum',
  'Base',
  'Polygon',
  'Optimism',
  'BNB Chain',
  'Multi-Chain',
];

export function SubmitProjectView({
  user,
  onNavigate,
  onOpenAuth,
  onProjectSubmitted,
}: SubmitProjectViewProps) {
  // Form State
  const [name, setName] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [shortDescription, setShortDescription] = useState('');
  const [description, setDescription] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [ecosystem, setEcosystem] = useState('Elysium');
  const [customEcosystem, setCustomEcosystem] = useState('');
  const [categoryChoice, setCategoryChoice] = useState('DEFI');
  const [customCategory, setCustomCategory] = useState('');

  // Socials
  const [twitter, setTwitter] = useState('');
  const [telegram, setTelegram] = useState('');
  const [discord, setDiscord] = useState('');
  const [github, setGithub] = useState('');

  // Status
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submittedProjectInfo, setSubmittedProjectInfo] = useState<{ id: string; name: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setError('Please sign in with Google to register your project.');
      onOpenAuth('login', 'project');
      return;
    }

    if (!name.trim()) {
      setError('Please provide a project name.');
      return;
    }
    if (!websiteUrl.trim()) {
      setError('Please provide a valid website URL.');
      return;
    }
    if (!shortDescription.trim() || !description.trim()) {
      setError('Please provide both a short summary and full description.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const derivedSlug = name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '') || `proj-${Date.now()}`;

    const resolvedCategory =
      categoryChoice === 'CUSTOM'
        ? (customCategory.trim() || 'OTHER')
        : (categoryChoice as ProjectCategory);

    const resolvedEcosystem =
      ecosystem === 'Other' && customEcosystem.trim()
        ? customEcosystem.trim()
        : ecosystem;

    const resolvedLogo = logoUrl.trim() || '/laknes-brand-emblem.png';

    try {
      const newProj = await laknesClient.submitProject({
        name: name.trim(),
        slug: derivedSlug,
        category: resolvedCategory,
        shortDescription: shortDescription.trim(),
        description: description.trim(),
        websiteUrl: websiteUrl.trim(),
        logoUrl: resolvedLogo,
        bannerUrl: 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?auto=format&fit=crop&w=1200&q=80',
        ecosystem: resolvedEcosystem,
        socialLinks: {
          twitter: twitter.trim(),
          telegram: telegram.trim(),
          discord: discord.trim(),
          github: github.trim(),
        },
        contractAddresses: [],
        supportingInfo: `Submitted by ${user.username} (${user.email}).`,
      });

      setSubmittedProjectInfo({ id: newProj.id, name: newProj.name });
      onProjectSubmitted(newProj.id);
    } catch (err: any) {
      console.error('Project submission failed', err);
      setError(err?.message || 'Failed to submit project. Please verify inputs.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // If unauthenticated, show sign-in gate
  if (!user) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center px-6 py-16 text-center bg-background text-on-surface">
        <div className="w-16 h-16 rounded-2xl bg-surface-container-high border border-primary-container/40 flex items-center justify-center text-primary-container mb-6 shadow-[0_0_30px_rgba(255,87,34,0.25)]">
          <span className="material-symbols-outlined text-[32px]">rocket_launch</span>
        </div>
        <h1 className="text-headline-lg font-headline-lg font-bold tracking-tight text-on-surface mb-3">
          Register a Project
        </h1>
        <p className="text-body-md font-body-md text-on-surface-variant max-w-md mb-8 leading-relaxed">
          Sign in with Google to submit your Web3 project profile. All projects enter an administrator review queue before appearing in Explore with a Verified badge.
        </p>
        <button
          onClick={() => onOpenAuth('login', 'project')}
          className="inline-flex items-center gap-2.5 px-6 py-3 rounded-xl bg-primary-container text-on-primary-container hover:brightness-110 font-label-md text-label-md font-bold transition-all shadow-lg shadow-primary-container/20 cursor-pointer"
        >
          <span className="material-symbols-outlined text-[20px]">login</span>
          <span>Sign In with Google to Register</span>
        </button>
      </div>
    );
  }

  // If submitted successfully, show Confirmation Screen
  if (submittedProjectInfo) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center px-6 py-16 text-center bg-background text-on-surface">
        <div className="w-16 h-16 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-6 shadow-xl">
          <span className="material-symbols-outlined text-[32px]">hourglass_top</span>
        </div>
        <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-500/15 text-amber-400 border border-amber-500/30 mb-3">
          Pending Admin Review
        </span>
        <h1 className="text-headline-md sm:text-headline-lg font-headline-lg font-bold text-on-surface mb-3">
          {submittedProjectInfo.name} Submitted
        </h1>
        <p className="text-body-md text-on-surface-variant max-w-lg mb-8 leading-relaxed">
          Your project profile has been stored in the LAKNES registry and is currently awaiting administrator review. Once verified and approved, it will automatically appear in Explore with a Verified badge.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <button
            onClick={() => {
              setSubmittedProjectInfo(null);
              setName('');
              setShortDescription('');
              setDescription('');
              setWebsiteUrl('');
            }}
            className="px-5 py-2.5 rounded-xl bg-surface-container hover:bg-surface-container-high text-xs text-on-surface font-semibold transition-colors cursor-pointer"
          >
            Register Another Project
          </button>
          <button
            onClick={() => onNavigate('explore')}
            className="px-5 py-2.5 rounded-xl bg-primary-container text-on-primary-container text-xs font-bold hover:brightness-110 transition-all cursor-pointer shadow-md"
          >
            Return to Explore
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-[calc(100vh-80px)] bg-background text-on-surface flex flex-col font-body-md relative pb-16">
      {/* Ambient Backdrop */}
      <div className="fixed inset-0 pointer-events-none radial-ambient z-0 opacity-40"></div>

      {/* Header Banner */}
      <div className="w-full bg-surface-container-lowest/80 backdrop-blur-md border-b border-outline-variant/30 py-8 px-6 lg:px-12 z-10">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary-container/15 text-primary border border-primary-container/30">
                Project Registration
              </span>
              <span className="text-outline text-xs">
                Submitter: @{user.username}
              </span>
            </div>
            <h1 className="text-headline-md sm:text-headline-lg font-headline-lg font-bold text-on-surface tracking-tight">
              Register a Web3 Project
            </h1>
            <p className="text-body-sm text-on-surface-variant mt-1">
              Submit your project profile. All projects enter an administrator review queue before appearing in Explore with a Verified badge.
            </p>
          </div>

          <button
            onClick={() => onNavigate('explore')}
            className="self-start sm:self-center px-3.5 py-2 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface text-xs font-medium border border-outline-variant/30 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px]">arrow_back</span>
            <span>Explore</span>
          </button>
        </div>
      </div>

      {/* Form Container */}
      <div className="relative z-10 max-w-4xl w-full mx-auto px-6 py-8">
        {/* Verification Portal Visual Banner */}
        <div className="relative w-full rounded-2xl overflow-hidden border border-outline-variant/30 bg-surface-container-low shadow-xl mb-6">
          <div className="h-40 sm:h-44 w-full relative">
            <img
              src="/assets/images/project_registry.jpg"
              alt="Project Registry & Verification"
              className="w-full h-full object-cover object-center"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-surface-container-lowest/95 via-surface-container-lowest/70 to-transparent"></div>
            <div className="absolute inset-0 flex flex-col justify-center px-6 sm:px-10 max-w-xl">
              <span className="text-[11px] font-mono uppercase tracking-wider text-primary font-semibold mb-1 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[14px]">verified_user</span>
                <span>Ecosystem Protocol Verification</span>
              </span>
              <h2 className="text-headline-md font-bold text-on-surface">
                Join the Verified Directory
              </h2>
              <p className="text-xs sm:text-sm text-on-surface-variant mt-1 leading-relaxed">
                Registered projects undergo administrator review before earning a Verified badge in the Explore directory.
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-8 rounded-2xl bg-surface-container-low border border-outline-variant/30 shadow-xl space-y-8">
          {error && (
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-medium flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">error</span>
              <span>{error}</span>
            </div>
          )}

          {/* Section 1: Basic Information */}
          <div className="space-y-4">
            <div className="border-b border-outline-variant/20 pb-2">
              <h3 className="text-headline-sm font-headline-sm font-bold text-on-surface">
                1. Project Identity
              </h3>
              <p className="text-body-sm text-on-surface-variant">
                Core identity details displayed on your project card and ecosystem profile.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-on-surface mb-1">
                  Project Name *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Elysium Dex, Horizon Oracle"
                  className="w-full bg-surface-container-lowest text-on-surface text-xs rounded-xl px-3.5 py-2.5 border border-outline-variant/40 focus:outline-none focus:border-primary-container"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-on-surface mb-1">
                  Logo Image URL (Optional)
                </label>
                <input
                  type="url"
                  value={logoUrl}
                  onChange={(e) => setLogoUrl(e.target.value)}
                  placeholder="https://.../logo.png (defaults to LAKNES emblem)"
                  className="w-full bg-surface-container-lowest text-on-surface text-xs rounded-xl px-3.5 py-2.5 border border-outline-variant/40 focus:outline-none focus:border-primary-container"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-on-surface mb-1">
                  Official Website URL *
                </label>
                <input
                  type="url"
                  required
                  value={websiteUrl}
                  onChange={(e) => setWebsiteUrl(e.target.value)}
                  placeholder="https://yourproject.io"
                  className="w-full bg-surface-container-lowest text-on-surface text-xs rounded-xl px-3.5 py-2.5 border border-outline-variant/40 focus:outline-none focus:border-primary-container"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-on-surface mb-1">
                  Ecosystem / Primary Network *
                </label>
                <select
                  value={ecosystem}
                  onChange={(e) => setEcosystem(e.target.value)}
                  className="w-full bg-surface-container-lowest text-on-surface text-xs rounded-xl px-3.5 py-2.5 border border-outline-variant/40 focus:outline-none focus:border-primary-container"
                >
                  {PRESET_ECOSYSTEMS.map((eco) => (
                    <option key={eco} value={eco}>{eco}</option>
                  ))}
                  <option value="Other">Other / Custom Network</option>
                </select>
                {ecosystem === 'Other' && (
                  <input
                    type="text"
                    value={customEcosystem}
                    onChange={(e) => setCustomEcosystem(e.target.value)}
                    placeholder="Enter custom ecosystem name"
                    className="w-full mt-2 bg-surface-container-lowest text-on-surface text-xs rounded-xl px-3.5 py-2 border border-outline-variant/40 focus:outline-none focus:border-primary-container"
                  />
                )}
              </div>
            </div>
          </div>

          {/* Section 2: Category */}
          <div className="space-y-4">
            <div className="border-b border-outline-variant/20 pb-2">
              <h3 className="text-headline-sm font-headline-sm font-bold text-on-surface">
                2. Category
              </h3>
              <p className="text-body-sm text-on-surface-variant">
                Select from standard Web3 sectors or create a custom category.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {PRESET_CATEGORIES.map((cat) => {
                const isSelected = categoryChoice === cat.id;
                return (
                  <button
                    type="button"
                    key={cat.id}
                    onClick={() => setCategoryChoice(cat.id)}
                    className={`p-3 rounded-xl text-left border transition-all text-xs cursor-pointer ${
                      isSelected
                        ? 'bg-primary-container/15 border-primary-container text-primary font-bold shadow-sm'
                        : 'bg-surface-container-lowest border-outline-variant/30 text-on-surface-variant hover:border-outline-variant/60'
                    }`}
                  >
                    {cat.label}
                  </button>
                );
              })}
            </div>

            {categoryChoice === 'CUSTOM' && (
              <div>
                <label className="block text-xs font-semibold text-on-surface mb-1">
                  Specify Custom Category Name *
                </label>
                <input
                  type="text"
                  required
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value)}
                  placeholder="e.g. AI Agents, DePIN, RWA"
                  className="w-full bg-surface-container-lowest text-on-surface text-xs rounded-xl px-3.5 py-2.5 border border-outline-variant/40 focus:outline-none focus:border-primary-container"
                />
              </div>
            )}
          </div>

          {/* Section 3: Description */}
          <div className="space-y-4">
            <div className="border-b border-outline-variant/20 pb-2">
              <h3 className="text-headline-sm font-headline-sm font-bold text-on-surface">
                3. Project Description
              </h3>
              <p className="text-body-sm text-on-surface-variant">
                Help users, curators, and administrators understand your mission and architecture.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-on-surface mb-1">
                Short One-Line Summary *
              </label>
              <input
                type="text"
                required
                maxLength={160}
                value={shortDescription}
                onChange={(e) => setShortDescription(e.target.value)}
                placeholder="A concise summary of what your protocol delivers (under 160 characters)"
                className="w-full bg-surface-container-lowest text-on-surface text-xs rounded-xl px-3.5 py-2.5 border border-outline-variant/40 focus:outline-none focus:border-primary-container"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-on-surface mb-1">
                Full Description & Architecture *
              </label>
              <textarea
                rows={4}
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Detailed overview of protocol features, tokenomics, smart contracts, roadmap, or technical highlights..."
                className="w-full bg-surface-container-lowest text-on-surface text-xs rounded-xl p-3 border border-outline-variant/40 focus:outline-none focus:border-primary-container"
              />
            </div>
          </div>

          {/* Section 4: Social Channels */}
          <div className="space-y-4">
            <div className="border-b border-outline-variant/20 pb-2">
              <h3 className="text-headline-sm font-headline-sm font-bold text-on-surface">
                4. Social & Community Links
              </h3>
              <p className="text-body-sm text-on-surface-variant">
                Official project links used for verification and community discovery.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-on-surface mb-1">
                  X / Twitter Handle or URL
                </label>
                <input
                  type="text"
                  value={twitter}
                  onChange={(e) => setTwitter(e.target.value)}
                  placeholder="@handle or https://x.com/..."
                  className="w-full bg-surface-container-lowest text-on-surface text-xs rounded-xl px-3.5 py-2.5 border border-outline-variant/40 focus:outline-none focus:border-primary-container"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-on-surface mb-1">
                  Telegram Group or Channel
                </label>
                <input
                  type="text"
                  value={telegram}
                  onChange={(e) => setTelegram(e.target.value)}
                  placeholder="https://t.me/..."
                  className="w-full bg-surface-container-lowest text-on-surface text-xs rounded-xl px-3.5 py-2.5 border border-outline-variant/40 focus:outline-none focus:border-primary-container"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-on-surface mb-1">
                  Discord Server Invite
                </label>
                <input
                  type="text"
                  value={discord}
                  onChange={(e) => setDiscord(e.target.value)}
                  placeholder="https://discord.gg/..."
                  className="w-full bg-surface-container-lowest text-on-surface text-xs rounded-xl px-3.5 py-2.5 border border-outline-variant/40 focus:outline-none focus:border-primary-container"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-on-surface mb-1">
                  GitHub Organization or Repository
                </label>
                <input
                  type="text"
                  value={github}
                  onChange={(e) => setGithub(e.target.value)}
                  placeholder="https://github.com/..."
                  className="w-full bg-surface-container-lowest text-on-surface text-xs rounded-xl px-3.5 py-2.5 border border-outline-variant/40 focus:outline-none focus:border-primary-container"
                />
              </div>
            </div>
          </div>

          {/* Review Notice & Submit */}
          <div className="p-4 rounded-xl bg-surface-container-lowest border border-outline-variant/20 flex items-start gap-3 text-xs text-on-surface-variant">
            <span className="material-symbols-outlined text-primary text-[20px] shrink-0 mt-0.5">verified_user</span>
            <div>
              <span className="font-semibold text-on-surface block">Verification Process Notice</span>
              Every submitted project enters a <strong className="text-amber-400">Pending Review</strong> state. Administrators manually verify contracts and documentation before approval. Only approved projects appear publicly in Explore with a Verified badge.
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-outline-variant/20">
            <button
              type="button"
              onClick={() => onNavigate('explore')}
              className="px-5 py-2.5 rounded-xl text-xs text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-3 rounded-xl bg-primary-container text-on-primary-container font-label-md text-xs font-bold hover:brightness-110 transition-all disabled:opacity-50 cursor-pointer shadow-md"
            >
              {isSubmitting ? 'Registering Project...' : 'Register Project for Review'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
