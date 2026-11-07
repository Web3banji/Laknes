/**
 * LAKNES Project Builder Portal | Registration & Verification (Yochi-inspired Design System)
 * 
 * Implements intuitive project registration in paper/sumi editorial layout:
 * - Project Name, Logo, Short & Full Description, Website, Social Links
 * - Category choice with custom category option
 * - Automatic Pending Review state with admin review notice
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
  { id: 'DEFI', label: 'DeFi' },
  { id: 'INFRASTRUCTURE', label: 'Infrastructure' },
  { id: 'NFT', label: 'NFT & Metaverse' },
  { id: 'LAUNCHPAD', label: 'Launchpad' },
  { id: 'MEMECOIN', label: 'Memecoin' },
  { id: 'GAMING', label: 'Gaming' },
  { id: 'SOCIAL', label: 'Social & Media' },
  { id: 'CUSTOM', label: '+ Custom' },
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
  const [name, setName] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [shortDescription, setShortDescription] = useState('');
  const [description, setDescription] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [ecosystem, setEcosystem] = useState('Elysium');
  const [customEcosystem, setCustomEcosystem] = useState('');
  const [categoryChoice, setCategoryChoice] = useState('DEFI');
  const [customCategory, setCustomCategory] = useState('');

  const [twitter, setTwitter] = useState('');
  const [telegram, setTelegram] = useState('');
  const [discord, setDiscord] = useState('');
  const [github, setGithub] = useState('');

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

    const resolvedLogo = logoUrl.trim() || '/assets/aistudio/Q67f93M1_400x400_24a7b710.jpg';

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

  if (!user) {
    return (
      <div className="lp-page py-20">
        <div className="lp-shell max-w-xl text-center">
          <div className="p-10 bg-[var(--yo-surface-1)] border-[1.5px] border-[var(--yo-ink)] shadow-[6px_6px_0_var(--yo-ink)]">
            <span className="lp-eyebrow mb-2">03 / BUILD</span>
            <h1 className="yo-display text-3xl text-[var(--yo-ink)] mb-3">
              Register a Project
            </h1>
            <p className="font-body text-sm text-[var(--yo-muted)] mb-6 leading-relaxed">
              Sign in with Google to submit your Web3 project profile. All projects enter an administrator review queue before appearing in Explore with a Verified badge.
            </p>
            <button
              onClick={() => onOpenAuth('login', 'project')}
              className="lp-button lp-button-primary mx-auto"
            >
              <span>SIGN IN TO REGISTER</span>
              <span aria-hidden="true">↗</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (submittedProjectInfo) {
    return (
      <div className="lp-page py-20">
        <div className="lp-shell max-w-xl text-center">
          <div className="p-10 bg-[var(--yo-surface-1)] border-[1.5px] border-[var(--yo-ink)] shadow-[8px_8px_0_var(--yo-ink)]">
            <span className="px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-wider border border-[var(--yo-gold)] text-[var(--yo-gold)] bg-[var(--yo-surface-2)] mb-3 inline-block">
              PENDING ADMIN REVIEW
            </span>
            <h1 className="yo-display text-2xl sm:text-3xl text-[var(--yo-ink)] mt-2 mb-3">
              {submittedProjectInfo.name} Submitted
            </h1>
            <p className="font-body text-sm text-[var(--yo-muted)] max-w-md mx-auto mb-6 leading-relaxed">
              Your project profile has been stored in the LAKNES registry and is currently awaiting administrator review. Once approved, it will automatically appear in Explore with a Verified badge.
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
                className="lp-button lp-button-secondary text-xs"
              >
                <span>REGISTER ANOTHER</span>
              </button>
              <button
                onClick={() => onNavigate('explore')}
                className="lp-button lp-button-primary text-xs"
              >
                <span>RETURN TO EXPLORE</span>
                <span aria-hidden="true">↗</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="lp-page py-12">
      <div className="lp-shell max-w-4xl">
        {/* Header */}
        <div className="border-b-[1.5px] border-[var(--yo-ink)] pb-8 mb-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="lp-eyebrow">REGISTRATION PORTAL</span>
                <span className="font-mono text-xs font-bold text-[var(--yo-muted)]">@{user.username}</span>
              </div>
              <h1 className="yo-display text-3xl sm:text-5xl text-[var(--yo-ink)]">
                Register a Web3 Project
              </h1>
              <p className="font-body text-sm text-[var(--yo-muted)] mt-2">
                Submit your project profile. All projects enter an administrator review queue before appearing in Explore with a Verified badge.
              </p>
            </div>

            <button
              onClick={() => onNavigate('explore')}
              className="lp-button lp-button-secondary text-xs shrink-0"
              style={{ minHeight: '38px', padding: '6px 14px' }}
            >
              <span>← EXPLORE</span>
            </button>
          </div>
        </div>

        {/* Form Box */}
        <form onSubmit={handleSubmit} className="p-8 bg-[var(--yo-surface-1)] border-[1.5px] border-[var(--yo-ink)] shadow-[6px_6px_0_var(--yo-ink)] space-y-8">
          {error && (
            <div className="p-3 border border-[var(--yo-bad)] text-[var(--yo-bad)] text-xs font-mono font-bold">
              {error}
            </div>
          )}

          {/* Section 1: Basic Information */}
          <div className="space-y-4">
            <div className="border-b border-[var(--yo-line)] pb-2">
              <span className="lp-eyebrow">STEP 01</span>
              <h3 className="yo-display text-xl text-[var(--yo-ink)] mt-0.5">
                Project Identity
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-mono font-bold uppercase text-[var(--yo-ink)] mb-1">
                  PROJECT NAME *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Elysium Dex, Horizon Oracle"
                  className="lp-input"
                />
              </div>

              <div>
                <label className="block text-xs font-mono font-bold uppercase text-[var(--yo-ink)] mb-1">
                  LOGO IMAGE URL (OPTIONAL)
                </label>
                <input
                  type="url"
                  value={logoUrl}
                  onChange={(e) => setLogoUrl(e.target.value)}
                  placeholder="https://.../logo.png"
                  className="lp-input font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-mono font-bold uppercase text-[var(--yo-ink)] mb-1">
                  OFFICIAL WEBSITE URL *
                </label>
                <input
                  type="url"
                  required
                  value={websiteUrl}
                  onChange={(e) => setWebsiteUrl(e.target.value)}
                  placeholder="https://yourproject.io"
                  className="lp-input font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-mono font-bold uppercase text-[var(--yo-ink)] mb-1">
                  PRIMARY ECOSYSTEM / NETWORK *
                </label>
                <select
                  value={ecosystem}
                  onChange={(e) => setEcosystem(e.target.value)}
                  className="lp-input font-mono font-bold"
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
                    className="lp-input font-mono mt-2"
                  />
                )}
              </div>
            </div>
          </div>

          {/* Section 2: Category */}
          <div className="space-y-4">
            <div className="border-b border-[var(--yo-line)] pb-2">
              <span className="lp-eyebrow">STEP 02</span>
              <h3 className="yo-display text-xl text-[var(--yo-ink)] mt-0.5">
                Sector &amp; Category
              </h3>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {PRESET_CATEGORIES.map((cat) => {
                const isSelected = categoryChoice === cat.id;
                return (
                  <button
                    type="button"
                    key={cat.id}
                    onClick={() => setCategoryChoice(cat.id)}
                    className={`p-2.5 text-left border transition-colors font-mono text-[10px] font-bold uppercase cursor-pointer ${
                      isSelected
                        ? 'bg-[var(--yo-ink)] text-[var(--yo-bg)] border-[var(--yo-ink)]'
                        : 'bg-[var(--yo-surface-2)] text-[var(--yo-muted)] border-[var(--yo-line)] hover:border-[var(--yo-ink)]'
                    }`}
                  >
                    {cat.label}
                  </button>
                );
              })}
            </div>

            {categoryChoice === 'CUSTOM' && (
              <div>
                <label className="block text-xs font-mono font-bold uppercase text-[var(--yo-ink)] mb-1">
                  SPECIFY CUSTOM CATEGORY *
                </label>
                <input
                  type="text"
                  required
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value)}
                  placeholder="e.g. AI Agents, DePIN, RWA"
                  className="lp-input font-mono"
                />
              </div>
            )}
          </div>

          {/* Section 3: Description */}
          <div className="space-y-4">
            <div className="border-b border-[var(--yo-line)] pb-2">
              <span className="lp-eyebrow">STEP 03</span>
              <h3 className="yo-display text-xl text-[var(--yo-ink)] mt-0.5">
                Description &amp; Architecture
              </h3>
            </div>

            <div>
              <label className="block text-xs font-mono font-bold uppercase text-[var(--yo-ink)] mb-1">
                SHORT ONE-LINE SUMMARY (UNDER 160 CHARACTERS) *
              </label>
              <input
                type="text"
                required
                maxLength={160}
                value={shortDescription}
                onChange={(e) => setShortDescription(e.target.value)}
                placeholder="A concise summary of what your protocol delivers"
                className="lp-input"
              />
            </div>

            <div>
              <label className="block text-xs font-mono font-bold uppercase text-[var(--yo-ink)] mb-1">
                FULL DESCRIPTION &amp; ARCHITECTURE *
              </label>
              <textarea
                rows={4}
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Detailed overview of protocol features, smart contracts, roadmap, or technical highlights..."
                className="lp-input"
              />
            </div>
          </div>

          {/* Section 4: Social Channels */}
          <div className="space-y-4">
            <div className="border-b border-[var(--yo-line)] pb-2">
              <span className="lp-eyebrow">STEP 04</span>
              <h3 className="yo-display text-xl text-[var(--yo-ink)] mt-0.5">
                Community Links
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-mono font-bold uppercase text-[var(--yo-ink)] mb-1">
                  X / TWITTER
                </label>
                <input
                  type="text"
                  value={twitter}
                  onChange={(e) => setTwitter(e.target.value)}
                  placeholder="@handle or https://x.com/..."
                  className="lp-input font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-mono font-bold uppercase text-[var(--yo-ink)] mb-1">
                  TELEGRAM
                </label>
                <input
                  type="text"
                  value={telegram}
                  onChange={(e) => setTelegram(e.target.value)}
                  placeholder="https://t.me/..."
                  className="lp-input font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-mono font-bold uppercase text-[var(--yo-ink)] mb-1">
                  DISCORD
                </label>
                <input
                  type="text"
                  value={discord}
                  onChange={(e) => setDiscord(e.target.value)}
                  placeholder="https://discord.gg/..."
                  className="lp-input font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-mono font-bold uppercase text-[var(--yo-ink)] mb-1">
                  GITHUB
                </label>
                <input
                  type="text"
                  value={github}
                  onChange={(e) => setGithub(e.target.value)}
                  placeholder="https://github.com/..."
                  className="lp-input font-mono"
                />
              </div>
            </div>
          </div>

          {/* Verification Notice */}
          <div className="p-3 bg-[var(--yo-surface-2)] border border-[var(--yo-line)] text-xs font-mono text-[var(--yo-muted)]">
            <strong className="text-[var(--yo-ink)] uppercase block mb-0.5">VERIFICATION NOTICE:</strong>
            Every submitted project enters a <strong className="text-[var(--yo-gold)]">Pending Review</strong> state. Administrators verify contracts and documentation before approval. Only approved projects appear in public Explore with a Verified badge.
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[var(--yo-line)]">
            <button
              type="button"
              onClick={() => onNavigate('explore')}
              className="lp-button lp-button-secondary text-xs"
            >
              <span>CANCEL</span>
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="lp-button lp-button-primary text-xs"
            >
              <span>{isSubmitting ? 'REGISTERING...' : 'REGISTER PROJECT FOR REVIEW'}</span>
              <span aria-hidden="true">↗</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
