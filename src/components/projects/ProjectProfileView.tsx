import React, { useState, useEffect } from 'react';
import { Project, Quest, Activity, Asset, Market } from '../../core/ecosystem/types';
import { ecosystemService } from '../../core/ecosystem/ecosystemService';
import { Button } from '../../design-system/primitives/Button';
import { EmptyState } from '../../design-system/primitives/EmptyState';
import { QuestCard } from '../cards/QuestCard';
import { QuestProgress } from '../quests/QuestProgress';
import { useToast } from '../../design-system/primitives/Toast';
import {
  ArrowLeft,
  ExternalLink,
  CheckCircle2,
  Copy,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  Activity as ActivityIcon,
  Layers,
  ArrowRight,
  Sparkles,
  Coins,
} from 'lucide-react';
import { formatAddress, ACTIVE_NETWORK } from '../../core/network/config';

export interface ProjectProfileViewProps {
  project: Project;
  onBack: () => void;
  onSelectQuest: (quest: Quest) => void;
  onNavigateToForProjects: () => void;
}

export function ProjectProfileView({
  project,
  onBack,
  onSelectQuest,
  onNavigateToForProjects,
}: ProjectProfileViewProps) {
  const { addressCopied, showToast } = useToast();
  const [quests, setQuests] = useState<Quest[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [markets, setMarkets] = useState<Market[]>([]);
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      setIsLoading(true);
      const [projectQuests, projectActivities, allAssets, allMarkets] = await Promise.all([
        ecosystemService.getQuestsByProjectId(project.id),
        ecosystemService.getActivities({ projectId: project.id }),
        ecosystemService.getAssets({ projectId: project.id }),
        ecosystemService.getMarkets(),
      ]);
      if (isMounted) {
        setQuests(projectQuests);
        setActivities(projectActivities);
        setAssets(allAssets);
        // Find markets matching project assets or venue
        const relevantMarkets = allMarkets.filter(
          (m) =>
            allAssets.some((a) => a.symbol === m.asset || a.symbol === m.quoteAsset) ||
            m.venue.toLowerCase().includes(project.name.toLowerCase())
        );
        setMarkets(relevantMarkets);
        setIsLoading(false);
      }
    }
    loadData();
    return () => {
      isMounted = false;
    };
  }, [project.id, project.name]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    showToast({
      type: 'info',
      title: 'Link Copied',
      message: `Copied profile link for ${project.name}`,
    });
  };

  const handleCopyContract = (address: string) => {
    navigator.clipboard.writeText(address);
    addressCopied(address);
  };

  return (
    <article className="mx-auto max-w-5xl px-4 sm:px-6 py-8 sm:py-12 space-y-10">
      {/* Top Breadcrumb Navigation */}
      <div>
        <button
          type="button"
          onClick={onBack}
          className="group inline-flex items-center gap-2 text-sm font-medium text-neutral-500 hover:text-neutral-900 transition-colors cursor-pointer py-1"
        >
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
          <span>Back to Discover</span>
        </button>
      </div>

      {/* Header Shell */}
      <header className="rounded-2xl border border-neutral-200 bg-white p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-neutral-200 bg-neutral-50 text-neutral-400">
              {project.logo ? (
                <img src={project.logo} alt="" className="h-full w-full object-cover" />
              ) : (
                <span className="text-xl font-bold">{project.name.charAt(0)}</span>
              )}
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-neutral-950">
                  {project.name}
                </h1>
                {project.isVerified && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700 border border-emerald-100">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Verified
                  </span>
                )}
              </div>

              <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-neutral-500">
                <span className="font-medium text-neutral-700">{project.category}</span>
                <span>·</span>
                <span>Elysium Mainnet</span>
                {project.status && (
                  <>
                    <span>·</span>
                    <span className="rounded-md bg-neutral-100 px-2 py-0.5 font-medium text-neutral-700">
                      {project.statusLabel || project.status}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Primary & Secondary Actions */}
          <div className="flex items-center gap-2.5 self-start sm:self-auto shrink-0">
            <Button
              variant="secondary"
              size="md"
              onClick={handleCopyLink}
            >
              Share
            </Button>
            <a
              href={project.website || project.websiteUrl}
              target="_blank"
              rel="noreferrer noopener"
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-neutral-950 px-4 text-sm font-medium text-white hover:bg-neutral-800 transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-neutral-200 active:scale-[0.98]"
            >
              <span>Visit Website</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </header>

      {/* Section 1: Overview & Verified Links */}
      <section className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-neutral-900">
          About the Project
        </h2>
        <div className="rounded-2xl border border-neutral-200 bg-white p-6 sm:p-7 space-y-6">
          <p className="text-base text-neutral-700 leading-relaxed max-w-3xl">
            {project.description}
          </p>

          {/* Relevant Verified Links */}
          {project.links && project.links.length > 0 && (
            <div className="pt-5 border-t border-neutral-100 flex flex-wrap items-center gap-3">
              <span className="text-xs font-medium text-neutral-400 mr-1">
                Verified Resources:
              </span>
              {project.links.map((link) => (
                <a
                  key={link.url}
                  href={link.url}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-xs font-medium text-neutral-700 hover:border-neutral-300 hover:text-neutral-950 transition-colors"
                >
                  <span>{link.label}</span>
                  <ExternalLink className="w-3 h-3 text-neutral-400" />
                </a>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Section: Associated Assets & Markets */}
      {(assets.length > 0 || markets.length > 0) && (
        <section className="space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-neutral-900">
            Associated Assets & Markets
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Assets Card */}
            <div className="rounded-2xl border border-neutral-200 bg-white p-5 space-y-3">
              <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                Canonical Assets ({assets.length})
              </span>

              <div className="space-y-2">
                {assets.map((a) => (
                  <div
                    key={a.id}
                    className="flex items-center justify-between p-3 rounded-xl border border-neutral-100 bg-neutral-50/50"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-neutral-900 text-white font-mono text-xs font-bold">
                        {a.symbol.slice(0, 3)}
                      </span>
                      <div>
                        <div className="text-sm font-semibold text-neutral-950">{a.name}</div>
                        <div className="text-xs text-neutral-400 font-mono">{a.symbol} · {a.isNative ? 'Native' : 'ERC-20'}</div>
                      </div>
                    </div>

                    {a.contractAddress && (
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(a.contractAddress!);
                          addressCopied(a.contractAddress!);
                        }}
                        className="text-xs font-mono text-neutral-500 hover:text-neutral-950 flex items-center gap-1 cursor-pointer"
                        title="Copy contract address"
                      >
                        <span>{formatAddress(a.contractAddress, 4, 3)}</span>
                        <Copy className="w-3 h-3 text-neutral-400" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Markets Card */}
            <div className="rounded-2xl border border-neutral-200 bg-white p-5 space-y-3">
              <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                Paired Markets ({markets.length})
              </span>

              {markets.length === 0 ? (
                <p className="text-xs text-neutral-500 italic p-3">
                  No automated market maker pools active for this asset yet.
                </p>
              ) : (
                <div className="space-y-2">
                  {markets.map((m) => (
                    <div
                      key={m.id}
                      className="flex items-center justify-between p-3 rounded-xl border border-neutral-100 bg-neutral-50/50"
                    >
                      <div>
                        <div className="text-sm font-semibold text-neutral-950">{m.pair}</div>
                        <div className="text-xs text-neutral-400">{m.venue} · Spot AMM</div>
                      </div>

                      {m.venueUrl && (
                        <a
                          href={m.venueUrl}
                          target="_blank"
                          rel="noreferrer noopener"
                          className="text-xs font-medium text-neutral-700 hover:text-neutral-950 inline-flex items-center gap-1"
                        >
                          <span>Trade</span>
                          <ExternalLink className="w-3 h-3 text-neutral-400" />
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Section 2: Available Quests */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-neutral-900">
            Available Quests
          </h2>
          <span className="text-xs text-neutral-500 font-mono">
            {quests.length} {quests.length === 1 ? 'quest' : 'quests'}
          </span>
        </div>

        {quests.length === 0 ? (
          <EmptyState
            title="No active quests registered"
            description="There are currently no quests listed specifically for this project. Check back as new onboarding tracks deploy to Elysium."
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {quests.map((quest) => (
              <QuestCard
                key={quest.id}
                quest={quest}
                onSelect={(q) => onSelectQuest(q)}
              />
            ))}
          </div>
        )}
      </section>

      {/* Section 3: Project Activity (Only authentic real data, calm empty state otherwise) */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-neutral-900">
            Project Activity & Milestones
          </h2>
          <span className="text-xs text-neutral-500">
            Verified on Elysium Mainnet
          </span>
        </div>

        {activities.length === 0 ? (
          <EmptyState
            title="No recent on-chain events"
            description="No recent deployment milestones or contract verification logs are indexed for this project."
          />
        ) : (
          <div className="rounded-2xl border border-neutral-200 bg-white divide-y divide-neutral-100 overflow-hidden">
            {activities.map((act) => (
              <div
                key={act.id}
                className="p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors hover:bg-neutral-50/50"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="rounded-md bg-neutral-100 px-2 py-0.5 text-[11px] font-medium text-neutral-700">
                      {act.type}
                    </span>
                    <span className="text-xs text-neutral-400 font-mono">
                      {act.timestamp}
                    </span>
                  </div>
                  <h3 className="text-sm font-semibold text-neutral-950">
                    {act.title}
                  </h3>
                  <p className="text-xs text-neutral-500 leading-relaxed max-w-xl">
                    {act.description}
                  </p>
                </div>

                {act.metadata?.explorerUrl && (
                  <a
                    href={act.metadata.explorerUrl}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="self-start sm:self-center shrink-0 inline-flex items-center gap-1.5 text-xs font-medium text-neutral-700 hover:text-neutral-950 underline"
                  >
                    <span>Inspect</span>
                    <ExternalLink className="w-3 h-3 text-neutral-400" />
                  </a>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Section 4: For Projects (Lifecycle & Migration Information) */}
      <section className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-neutral-900">
          Liquidity Lifecycle Status
        </h2>
        <div className="rounded-2xl border border-neutral-200 bg-white p-6 sm:p-7 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-neutral-500">
                Ecosystem Migration Stage:
              </span>
              <span className="inline-flex items-center rounded-md bg-neutral-100 px-2.5 py-0.5 text-xs font-semibold text-neutral-900">
                {project.liquidityStage || 'Planning'}
              </span>
            </div>
            <p className="text-xs text-neutral-500 max-w-xl leading-relaxed">
              LAKNES provides transparent liquidity readiness evaluation, timelock verification, and router migration tooling for Elysium protocols.
            </p>
          </div>

          <Button
            variant="secondary"
            size="md"
            onClick={onNavigateToForProjects}
            rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
          >
            Review Readiness Checklist
          </Button>
        </div>
      </section>

      {/* Section 5: Progressive Disclosure of Technical Specifications */}
      {project.technicalDetails && (
        <section className="rounded-2xl border border-neutral-200 bg-white overflow-hidden">
          <button
            type="button"
            onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
            className="w-full flex items-center justify-between p-5 text-left hover:bg-neutral-50/50 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-2.5">
              <Layers className="w-4 h-4 text-neutral-500" />
              <span className="text-sm font-semibold text-neutral-900">
                Technical Specifications & EVM Verification
              </span>
            </div>
            {showTechnicalDetails ? (
              <ChevronUp className="w-4 h-4 text-neutral-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-neutral-400" />
            )}
          </button>

          {showTechnicalDetails && (
            <div className="border-t border-neutral-100 p-5 sm:p-6 bg-neutral-50/40 divide-y divide-neutral-200/60 text-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between py-2.5 gap-1">
                <span className="text-neutral-500">Target Network</span>
                <span className="font-mono text-neutral-900 font-medium">
                  Elysium Mainnet (Chain ID {ACTIVE_NETWORK.chainId})
                </span>
              </div>

              {project.technicalDetails.contractAddress && (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between py-2.5 gap-2">
                  <span className="text-neutral-500">Contract Address</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-neutral-900">
                      {project.technicalDetails.contractAddress}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        handleCopyContract(project.technicalDetails!.contractAddress!)
                      }
                      className="p-1 text-neutral-400 hover:text-neutral-700 cursor-pointer"
                      aria-label="Copy contract address"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}

              {project.technicalDetails.standard && (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between py-2.5 gap-1">
                  <span className="text-neutral-500">Implementation Standard</span>
                  <span className="font-mono text-neutral-900">
                    {project.technicalDetails.standard}
                  </span>
                </div>
              )}

              <div className="flex flex-col sm:flex-row sm:items-center justify-between py-2.5 gap-1">
                <span className="text-neutral-500">Source Code Status</span>
                <span className="flex items-center gap-1.5 text-emerald-700 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Verified on Elysium Blockscout
                </span>
              </div>
            </div>
          )}
        </section>
      )}
    </article>
  );
}
