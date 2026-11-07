/**
 * LAKNES Project Detail Modal (Yochi Editorial Design System)
 * Full public profile, announcements, quests, and engagement triggers in paper/sumi aesthetic.
 */

import React, { useState, useEffect } from 'react';
import { Project, ProjectUpdate, Quest, ContentReportTargetType } from '../../types/contracts.ts';
import { StatusBadge } from '../common/StatusBadge.tsx';
import { laknesClient } from '../../client/api-client.ts';

interface ProjectDetailModalProps {
  project: Project | null;
  onClose: () => void;
  isFollowing?: boolean;
  isSaved?: boolean;
  onToggleFollow?: (projectId: string) => void;
  onToggleSave?: (projectId: string) => void;
  onOpenReport?: (type: ContentReportTargetType, id: string, name: string) => void;
  onOpenDashboard?: (projectId: string) => void;
  isRepresentative?: boolean;
}

export function ProjectDetailModal({
  project,
  onClose,
  isFollowing,
  isSaved,
  onToggleFollow,
  onToggleSave,
  onOpenReport,
  onOpenDashboard,
  isRepresentative,
}: ProjectDetailModalProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'updates' | 'quests'>('overview');
  const [updates, setUpdates] = useState<ProjectUpdate[]>([]);
  const [quests, setQuests] = useState<Quest[]>([]);
  const [loadingExtras, setLoadingExtras] = useState(false);

  useEffect(() => {
    if (!project) return;
    let cancelled = false;

    const loadData = async () => {
      setLoadingExtras(true);
      try {
        const [upd, qst] = await Promise.all([
          laknesClient.getProjectUpdates(project.id).catch(() => []),
          laknesClient.getProjectQuests(project.id).catch(() => []),
        ]);
        if (!cancelled) {
          setUpdates(upd);
          setQuests(qst);
        }
      } finally {
        if (!cancelled) setLoadingExtras(false);
      }
    };

    loadData();
    return () => {
      cancelled = true;
    };
  }, [project]);

  if (!project) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-sm overflow-y-auto">
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-3xl lp-modal-box relative overflow-hidden flex flex-col my-auto max-h-[92vh]"
      >
        {/* Banner Area */}
        <div className="relative w-full h-44 sm:h-56 bg-[var(--yo-surface-2)] border-b-[1.5px] border-[var(--yo-line)] shrink-0">
          {project.bannerUrl ? (
            <img src={project.bannerUrl} alt={project.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-[var(--yo-surface-2)] flex items-center justify-center">
              <span className="material-symbols-outlined text-4xl text-[var(--yo-muted)]">token</span>
            </div>
          )}

          <div className="absolute inset-0 bg-gradient-to-t from-[var(--yo-surface-1)] via-transparent to-transparent pointer-events-none"></div>

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 border border-[var(--yo-ink)] bg-[var(--yo-surface-1)] text-[var(--yo-ink)] hover:bg-[var(--yo-ink)] hover:text-[var(--yo-bg)] transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>

          {/* Logo & Category */}
          <div className="absolute bottom-4 left-6 flex items-end gap-3">
            <div className="w-16 h-16 border-2 border-[var(--yo-ink)] bg-[var(--yo-surface-1)] overflow-hidden shadow-[2px_2px_0_var(--yo-ink)] flex items-center justify-center shrink-0">
              {project.logoUrl ? (
                <img src={project.logoUrl} alt={project.name} className="w-full h-full object-cover" />
              ) : (
                <span className="material-symbols-outlined text-primary text-2xl">rocket_launch</span>
              )}
            </div>

            <div className="mb-1">
              <span className="lp-chip font-bold mb-1">
                {project.category}
              </span>
              <div className="flex items-center gap-2">
                <h2 className="yo-display text-2xl text-[var(--yo-ink)] leading-tight">{project.name}</h2>
                {project.verificationStatus === 'VERIFIED' && (
                  <span
                    className="material-symbols-outlined text-2xl text-[var(--yo-good)]"
                    title="Verified Checkmark"
                  >
                    verified
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 flex flex-col gap-6 overflow-y-auto font-body">
          {/* Pending Verification Notice */}
          {project.verificationStatus === 'PENDING_REVIEW' && (
            <div className="p-3 border border-[var(--yo-gold)] bg-[var(--yo-surface-2)] flex items-start gap-2.5 text-xs font-mono text-[var(--yo-muted)]">
              <span className="material-symbols-outlined text-[18px] text-[var(--yo-gold)] shrink-0">hourglass_top</span>
              <div>
                <p className="font-bold text-[var(--yo-ink)] uppercase mb-0.5">Awaiting Administrator Review</p>
                <p className="leading-relaxed text-[11px]">
                  This project has been submitted and is queued for verification. The official Verified badge will be awarded following review.
                </p>
              </div>
            </div>
          )}

          {/* Action Row & Links */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-[var(--yo-line)]">
            <div className="flex items-center gap-2">
              <StatusBadge status={project.verificationStatus} size="md" />
              {project.ecosystem && (
                <span className="text-[10px] font-mono font-bold uppercase text-[var(--yo-muted)] px-2 py-0.5 border border-[var(--yo-line)] bg-[var(--yo-surface-2)]">
                  {project.ecosystem}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {isRepresentative && onOpenDashboard && (
                <button
                  onClick={() => {
                    onClose();
                    onOpenDashboard(project.id);
                  }}
                  className="lp-button lp-button-secondary text-xs"
                  style={{ minHeight: '34px', padding: '6px 12px' }}
                >
                  <span className="material-symbols-outlined text-[14px]">dashboard</span>
                  <span>DASHBOARD</span>
                </button>
              )}

              {onToggleFollow && (
                <button
                  onClick={() => onToggleFollow(project.id)}
                  className={`px-3 py-1.5 font-mono text-xs font-bold uppercase border transition-colors cursor-pointer ${
                    isFollowing
                      ? 'border-[var(--yo-good)] text-[var(--yo-good)] bg-[var(--yo-surface-2)]'
                      : 'border-[var(--yo-line)] text-[var(--yo-ink)] hover:border-[var(--yo-ink)]'
                  }`}
                >
                  {isFollowing ? '✓ FOLLOWING' : '+ FOLLOW'}
                </button>
              )}

              {onToggleSave && (
                <button
                  onClick={() => onToggleSave(project.id)}
                  className="p-1.5 border border-[var(--yo-line)] hover:border-[var(--yo-ink)] text-[var(--yo-ink)] bg-[var(--yo-surface-2)] transition-colors cursor-pointer"
                  title={isSaved ? 'Saved' : 'Save'}
                >
                  <span className="material-symbols-outlined text-[16px]">
                    {isSaved ? 'bookmark_added' : 'bookmark'}
                  </span>
                </button>
              )}

              {onOpenReport && (
                <button
                  onClick={() => onOpenReport(ContentReportTargetType.PROJECT, project.id, project.name)}
                  className="p-1.5 border border-[var(--yo-line)] hover:border-[var(--yo-bad)] text-[var(--yo-muted)] hover:text-[var(--yo-bad)] transition-colors cursor-pointer"
                  title="Report project"
                >
                  <span className="material-symbols-outlined text-[16px]">flag</span>
                </button>
              )}

              {project.websiteUrl && (
                <a
                  href={project.websiteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="lp-button lp-button-primary text-xs"
                  style={{ minHeight: '34px', padding: '6px 14px' }}
                >
                  <span>WEBSITE</span>
                  <span aria-hidden="true">↗</span>
                </a>
              )}
            </div>
          </div>

          {/* Social Links Row */}
          {(project.websiteUrl || project.documentationUrl || project.socialLinks) && (
            <div className="flex flex-wrap items-center gap-2 text-xs font-mono font-bold uppercase">
              {project.documentationUrl && (
                <a
                  href={project.documentationUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-2.5 py-1 border border-[var(--yo-line)] bg-[var(--yo-surface-2)] hover:border-[var(--yo-ink)] transition-colors flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-[13px]">menu_book</span>
                  <span>DOCS ↗</span>
                </a>
              )}
              {project.socialLinks?.twitter && (
                <a
                  href={project.socialLinks.twitter}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-2.5 py-1 border border-[var(--yo-line)] bg-[var(--yo-surface-2)] hover:border-[var(--yo-ink)] transition-colors"
                >
                  X (TWITTER) ↗
                </a>
              )}
              {project.socialLinks?.discord && (
                <a
                  href={project.socialLinks.discord}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-2.5 py-1 border border-[var(--yo-line)] bg-[var(--yo-surface-2)] hover:border-[var(--yo-ink)] transition-colors"
                >
                  DISCORD ↗
                </a>
              )}
              {project.socialLinks?.telegram && (
                <a
                  href={project.socialLinks.telegram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-2.5 py-1 border border-[var(--yo-line)] bg-[var(--yo-surface-2)] hover:border-[var(--yo-ink)] transition-colors"
                >
                  TELEGRAM ↗
                </a>
              )}
              {project.socialLinks?.github && (
                <a
                  href={project.socialLinks.github}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-2.5 py-1 border border-[var(--yo-line)] bg-[var(--yo-surface-2)] hover:border-[var(--yo-ink)] transition-colors"
                >
                  GITHUB ↗
                </a>
              )}
            </div>
          )}

          {/* Tabs */}
          <div className="flex border-b border-[var(--yo-line)] gap-4">
            <button
              onClick={() => setActiveTab('overview')}
              className={`pb-2 text-xs font-mono font-bold uppercase tracking-wider border-b-2 transition-colors cursor-pointer ${
                activeTab === 'overview' ? 'border-[var(--yo-ink)] text-[var(--yo-ink)]' : 'border-transparent text-[var(--yo-muted)]'
              }`}
            >
              OVERVIEW
            </button>
            <button
              onClick={() => setActiveTab('updates')}
              className={`pb-2 text-xs font-mono font-bold uppercase tracking-wider border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'updates' ? 'border-[var(--yo-ink)] text-[var(--yo-ink)]' : 'border-transparent text-[var(--yo-muted)]'
              }`}
            >
              ANNOUNCEMENTS
              {updates.length > 0 && (
                <span className="px-1.5 py-0.2 bg-[var(--yo-surface-2)] text-[10px]">{updates.length}</span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('quests')}
              className={`pb-2 text-xs font-mono font-bold uppercase tracking-wider border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'quests' ? 'border-[var(--yo-ink)] text-[var(--yo-ink)]' : 'border-transparent text-[var(--yo-muted)]'
              }`}
            >
              QUESTS
              {quests.length > 0 && (
                <span className="px-1.5 py-0.2 bg-[var(--yo-surface-2)] text-[10px]">{quests.length}</span>
              )}
            </button>
          </div>

          {/* Tab 1: Overview */}
          {activeTab === 'overview' && (
            <div className="space-y-4 text-xs">
              <div>
                <span className="lp-eyebrow mb-1">DESCRIPTION</span>
                <p className="text-[var(--yo-muted)] leading-relaxed text-sm whitespace-pre-wrap">{project.description}</p>
              </div>

              {project.contractAddresses && project.contractAddresses.length > 0 && (
                <div>
                  <span className="lp-eyebrow mb-1">VERIFIED SMART CONTRACTS</span>
                  <div className="space-y-1.5 font-mono">
                    {project.contractAddresses.map((addr, idx) => (
                      <div key={idx} className="p-2 border border-[var(--yo-line)] bg-[var(--yo-surface-2)] text-[11px] text-[var(--yo-ink)] break-all select-all">
                        {addr}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Tab 2: Updates */}
          {activeTab === 'updates' && (
            <div className="space-y-3">
              {loadingExtras ? (
                <div className="text-xs font-mono text-[var(--yo-muted)]">Loading announcements...</div>
              ) : updates.length === 0 ? (
                <div className="p-8 text-center text-xs text-[var(--yo-muted)] bg-[var(--yo-surface-2)] border border-[var(--yo-line)]">
                  No public announcements posted yet by project maintainers.
                </div>
              ) : (
                updates.map((upd) => (
                  <div key={upd.id} className="p-4 bg-[var(--yo-surface-2)] border border-[var(--yo-line)]">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <h4 className="yo-display text-sm text-[var(--yo-ink)]">{upd.title}</h4>
                      <span className="text-[10px] text-[var(--yo-muted)] font-mono">
                        {upd.publishedAt ? new Date(upd.publishedAt).toLocaleDateString() : 'Recent'}
                      </span>
                    </div>
                    <p className="text-xs text-[var(--yo-muted)] leading-relaxed mt-2 whitespace-pre-wrap">
                      {upd.content}
                    </p>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Tab 3: Quests */}
          {activeTab === 'quests' && (
            <div className="space-y-3">
              {loadingExtras ? (
                <div className="text-xs font-mono text-[var(--yo-muted)]">Loading quests...</div>
              ) : quests.length === 0 ? (
                <div className="p-8 text-center text-xs text-[var(--yo-muted)] bg-[var(--yo-surface-2)] border border-[var(--yo-line)]">
                  No active community quests for this project right now.
                </div>
              ) : (
                quests.map((q) => (
                  <div key={q.id} className="p-4 bg-[var(--yo-surface-2)] border border-[var(--yo-line)] flex flex-col justify-between gap-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="lp-chip font-bold">
                        {q.questType}
                      </span>
                      {q.rewardConfiguration && (
                        <span className="font-mono text-[10px] font-bold text-[var(--yo-accent-text)]">
                          {q.rewardConfiguration.amount} {q.rewardConfiguration.rewardType}
                        </span>
                      )}
                    </div>
                    <h4 className="yo-display text-base text-[var(--yo-ink)] mt-1">{q.title}</h4>
                    <p className="text-xs text-[var(--yo-muted)] line-clamp-2">{q.description}</p>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
