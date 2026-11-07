/**
 * LAKNES Quest Detail Modal (Yochi Editorial Design System)
 * Full quest view with interactive task fulfillment, non-wallet actions,
 * eligibility criteria, rewards breakdown, and verification proof submission.
 */

import React, { useState, useEffect } from 'react';
import { Quest, QuestParticipation, QuestCompletionStatus, User } from '../../types/contracts.ts';
import { laknesClient } from '../../client/api-client.ts';

interface QuestDetailModalProps {
  quest: Quest | null;
  user: User | null;
  onClose: () => void;
  onOpenAuth: (mode?: 'login' | 'register') => void;
  onParticipationUpdated?: () => void;
  isSaved?: boolean;
  onToggleSave?: (questId: string) => void;
}

export function QuestDetailModal({
  quest,
  user,
  onClose,
  onOpenAuth,
  onParticipationUpdated,
  isSaved,
  onToggleSave,
}: QuestDetailModalProps) {
  const [participation, setParticipation] = useState<QuestParticipation | null>(null);
  const [proofText, setProofText] = useState('');
  const [formResponseText, setFormResponseText] = useState('');
  const [socialHandleText, setSocialHandleText] = useState('');
  const [hasVisitedLink, setHasVisitedLink] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (!quest || !user) {
      setParticipation(null);
      return;
    }

    let cancelled = false;
    const checkParticipation = async () => {
      try {
        const participations = await laknesClient.getUserQuests(user.id);
        const match = participations.find((p) => p.questId === quest.id);
        if (!cancelled && match) {
          setParticipation(match);
          if (match.submissionProof) {
            setProofText(match.submissionProof);
          }
        }
      } catch (err) {
        console.error('Error fetching user participations', err);
      }
    };

    checkParticipation();
    return () => {
      cancelled = true;
    };
  }, [quest, user]);

  if (!quest) return null;

  const isExpired = Boolean(quest.deadline && new Date(quest.deadline).getTime() < Date.now());

  const isWebsiteVisitTask =
    quest.questType === 'COMMUNITY' ||
    quest.instructions.toLowerCase().includes('visit') ||
    quest.instructions.toLowerCase().includes('explore') ||
    quest.instructions.toLowerCase().includes('read') ||
    quest.instructions.toLowerCase().includes('documentation');

  const isFormTask =
    quest.questType === 'FEEDBACK' ||
    quest.instructions.toLowerCase().includes('form') ||
    quest.instructions.toLowerCase().includes('survey') ||
    quest.instructions.toLowerCase().includes('feedback');

  const isSocialTask =
    quest.questType === 'SOCIAL' ||
    quest.instructions.toLowerCase().includes('follow') ||
    quest.instructions.toLowerCase().includes('twitter') ||
    quest.instructions.toLowerCase().includes('discord');

  const handleJoinQuest = async () => {
    if (!user) {
      onOpenAuth('login');
      return;
    }

    setIsSubmitting(true);
    setActionError(null);
    try {
      const p = await laknesClient.joinQuest(quest.id);
      setParticipation(p);
      setActionSuccess('Enrolled in quest! Complete the task steps and submit your proof below.');
      if (onParticipationUpdated) onParticipationUpdated();
    } catch (err: any) {
      setActionError(err?.message || 'Failed to enroll in quest.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitProof = async (e: React.FormEvent) => {
    e.preventDefault();
    let finalProof = proofText.trim();

    if (isFormTask && formResponseText.trim()) {
      finalProof = `[Form Response]: ${formResponseText.trim()}${finalProof ? ` | Details: ${finalProof}` : ''}`;
    } else if (isSocialTask && socialHandleText.trim()) {
      finalProof = `[Social Handle / Verification]: ${socialHandleText.trim()}${finalProof ? ` | Proof Link: ${finalProof}` : ''}`;
    } else if (isWebsiteVisitTask && hasVisitedLink) {
      finalProof = `[Website Visit Confirmed]: ${finalProof || 'Completed portal exploration.'}`;
    }

    if (!finalProof) {
      setActionError('Please provide submission details or complete the required action.');
      return;
    }

    setIsSubmitting(true);
    setActionError(null);
    try {
      const p = await laknesClient.submitQuestProof(quest.id, finalProof);
      setParticipation(p);
      setActionSuccess('Proof of completion submitted! Maintainers will review and verify your submission.');
      if (onParticipationUpdated) onParticipationUpdated();
    } catch (err: any) {
      setActionError(err?.message || 'Failed to submit proof.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-sm overflow-y-auto">
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl lp-modal-box relative overflow-hidden flex flex-col my-auto max-h-[92vh]"
      >
        {/* Header */}
        <div className="p-6 border-b border-[var(--yo-line)] flex items-start justify-between gap-4 bg-[var(--yo-surface-2)]">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="lp-chip font-bold">
                {quest.questType}
              </span>
              {quest.rewardConfiguration && (
                <span className="font-mono text-[10px] font-bold px-2 py-0.5 border border-[var(--yo-line)] bg-[var(--yo-surface-1)] text-[var(--yo-accent-text)]">
                  {quest.rewardConfiguration.amount ? `${quest.rewardConfiguration.amount} ` : ''}
                  {quest.rewardConfiguration.rewardType}
                </span>
              )}
            </div>
            <h2 className="yo-display text-2xl text-[var(--yo-ink)] leading-tight">{quest.title}</h2>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {onToggleSave && (
              <button
                type="button"
                onClick={() => onToggleSave(quest.id)}
                className={`p-1.5 border border-[var(--yo-line)] transition-colors cursor-pointer ${
                  isSaved
                    ? 'bg-[var(--yo-ink)] text-[var(--yo-bg)]'
                    : 'bg-[var(--yo-surface-1)] text-[var(--yo-ink)] hover:border-[var(--yo-ink)]'
                }`}
                title={isSaved ? 'Saved to bookmarks' : 'Save quest'}
              >
                <span className="material-symbols-outlined text-[16px]">
                  {isSaved ? 'bookmark' : 'bookmark_border'}
                </span>
              </button>
            )}

            <button
              onClick={onClose}
              className="p-1.5 border border-[var(--yo-line)] bg-[var(--yo-surface-1)] text-[var(--yo-ink)] hover:border-[var(--yo-ink)] transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 flex flex-col gap-6 overflow-y-auto text-xs font-body">
          {actionSuccess && (
            <div className="p-3 border border-[var(--yo-good)] text-[var(--yo-good)] font-mono font-bold flex items-center gap-2">
              <span className="material-symbols-outlined text-[16px]">check_circle</span>
              <span>{actionSuccess}</span>
            </div>
          )}

          {actionError && (
            <div className="p-3 border border-[var(--yo-bad)] text-[var(--yo-bad)] font-mono flex items-center gap-2">
              <span className="material-symbols-outlined text-[16px]">error</span>
              <span>{actionError}</span>
            </div>
          )}

          {/* Overview */}
          <div>
            <span className="lp-eyebrow mb-1">OVERVIEW</span>
            <p className="text-[var(--yo-muted)] leading-relaxed text-sm whitespace-pre-wrap">{quest.description}</p>
          </div>

          {/* Instructions */}
          {quest.instructions && (
            <div className="p-4 bg-[var(--yo-surface-2)] border border-[var(--yo-line)]">
              <span className="lp-eyebrow text-[var(--yo-accent-text)] mb-2 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[14px]">list_alt</span>
                INSTRUCTIONS
              </span>
              <p className="text-[var(--yo-ink)] leading-relaxed whitespace-pre-wrap">{quest.instructions}</p>
            </div>
          )}

          {/* Non-Wallet Interactive Task Assist Box */}
          <div className="p-4 bg-[var(--yo-surface-2)] border border-[var(--yo-line)] space-y-3">
            <span className="lp-eyebrow flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[14px] text-[var(--yo-accent-text)]">task_alt</span>
              TASK ACTIONS &middot; NO WALLET REQUIRED
            </span>

            {isWebsiteVisitTask && (
              <div className="p-3 bg-[var(--yo-surface-1)] border border-[var(--yo-line)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <span className="font-bold text-[var(--yo-ink)] block">1. Explore Official Resource</span>
                  <span className="text-[11px] text-[var(--yo-muted)] font-mono">Open documentation or protocol portal.</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setHasVisitedLink(true);
                    window.open('https://docs.elysium.org', '_blank', 'noopener,noreferrer');
                  }}
                  className={`px-3 py-1.5 font-mono text-[10px] font-bold uppercase border transition-colors cursor-pointer ${
                    hasVisitedLink
                      ? 'border-[var(--yo-good)] text-[var(--yo-good)] bg-[var(--yo-surface-2)]'
                      : 'border-[var(--yo-ink)] bg-[var(--yo-cta)] text-[var(--yo-on-cta)] shadow-[2px_2px_0_var(--yo-ink)]'
                  }`}
                >
                  <span>{hasVisitedLink ? '✓ RESOURCE VISITED' : 'OPEN RESOURCE ↗'}</span>
                </button>
              </div>
            )}

            {isFormTask && (
              <div className="p-3 bg-[var(--yo-surface-1)] border border-[var(--yo-line)] space-y-2">
                <span className="font-bold text-[var(--yo-ink)] block">Complete Community Feedback</span>
                <textarea
                  value={formResponseText}
                  onChange={(e) => setFormResponseText(e.target.value)}
                  placeholder="Share your experience, feature ideas, or protocol feedback..."
                  rows={2}
                  className="lp-input"
                />
              </div>
            )}

            {isSocialTask && (
              <div className="p-3 bg-[var(--yo-surface-1)] border border-[var(--yo-line)] space-y-2">
                <span className="font-bold text-[var(--yo-ink)] block">Social Engagement</span>
                <input
                  type="text"
                  value={socialHandleText}
                  onChange={(e) => setSocialHandleText(e.target.value)}
                  placeholder="Your Twitter/X or Discord handle (e.g. @username)"
                  className="lp-input font-mono"
                />
              </div>
            )}
          </div>

          {/* Criteria & Eligibility */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 bg-[var(--yo-surface-2)] border border-[var(--yo-line)]">
              <span className="lp-eyebrow mb-1">CRITERIA</span>
              <p className="text-[var(--yo-muted)] leading-relaxed">
                {quest.completionCriteria?.requiresProof
                  ? `Requires proof submission (${quest.completionCriteria.proofType || 'Text/URL'}) with ${
                      quest.completionCriteria.verificationMethod === 'AUTOMATED_API'
                        ? 'automated rule check'
                        : 'maintainer review'
                    }.`
                  : 'Action verification recorded upon submission.'}
              </p>
            </div>

            <div className="p-4 bg-[var(--yo-surface-2)] border border-[var(--yo-line)]">
              <span className="lp-eyebrow mb-1">ELIGIBILITY</span>
              <p className="text-[var(--yo-muted)] leading-relaxed">
                {quest.eligibilityRules?.ecosystemSpecificCondition ||
                  (quest.eligibilityRules?.requiredRoles?.length
                    ? `Requires role: ${quest.eligibilityRules.requiredRoles.join(', ')}`
                    : 'Open to all authenticated community members.')}
              </p>
            </div>
          </div>

          {/* Timeline & Meta */}
          <div className="flex flex-wrap items-center justify-between gap-4 py-3 border-y border-[var(--yo-line)] font-mono text-[10px] text-[var(--yo-muted)] font-bold uppercase">
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[14px]">calendar_today</span>
              <span>STARTED: {new Date(quest.startAt).toLocaleDateString()}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[14px]">timer</span>
              <span>DEADLINE: {quest.deadline ? new Date(quest.deadline).toLocaleDateString() : 'CONTINUOUS'}</span>
            </div>
          </div>

          {/* Participation / Submission Zone */}
          <div className="pt-2">
            {!user ? (
              <div className="p-6 bg-[var(--yo-surface-2)] border border-[var(--yo-line)] text-center flex flex-col items-center">
                <span className="lp-eyebrow mb-1">PARTICIPATION</span>
                <p className="font-bold text-[var(--yo-ink)] text-sm mb-1">Sign in to participate</p>
                <p className="text-[var(--yo-muted)] text-xs mb-4">
                  Log in to join this quest, submit work, and build your record.
                </p>
                <button
                  onClick={() => onOpenAuth('login')}
                  className="lp-button lp-button-primary text-xs"
                >
                  <span>SIGN IN TO JOIN</span>
                  <span aria-hidden="true">↗</span>
                </button>
              </div>
            ) : !participation ? (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-[var(--yo-surface-2)] border border-[var(--yo-line)]">
                <div>
                  <h4 className="yo-display text-sm text-[var(--yo-ink)]">Ready to begin?</h4>
                  <p className="text-[var(--yo-muted)] text-xs mt-0.5">
                    Enroll now to start tracking your progress towards this quest.
                  </p>
                </div>

                <button
                  onClick={handleJoinQuest}
                  disabled={isSubmitting || Boolean(isExpired)}
                  className="lp-button lp-button-primary text-xs shrink-0"
                >
                  <span>{isSubmitting ? 'JOINING...' : isExpired ? 'QUEST EXPIRED' : 'JOIN QUEST'}</span>
                  <span aria-hidden="true">↗</span>
                </button>
              </div>
            ) : (
              <div className="p-5 bg-[var(--yo-surface-2)] border border-[var(--yo-line)] space-y-4">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-2 h-2 ${
                        participation.completionStatus === 'VERIFIED'
                          ? 'bg-[var(--yo-good)]'
                          : 'bg-[var(--yo-accent)]'
                      }`}
                    ></span>
                    <span className="font-bold text-[var(--yo-ink)] text-sm font-mono uppercase">
                      {participation.completionStatus === 'VERIFIED'
                        ? 'QUEST COMPLETED & VERIFIED'
                        : participation.completionStatus === 'PENDING_VERIFICATION'
                        ? 'PROOF SUBMITTED (UNDER REVIEW)'
                        : 'ENROLLED IN QUEST'}
                    </span>
                  </div>
                  <span className="lp-chip font-bold">
                    STATUS: {participation.completionStatus}
                  </span>
                </div>

                {participation.completionStatus === 'VERIFIED' ? (
                  <div className="p-3 border border-[var(--yo-good)] text-[var(--yo-good)] font-mono text-xs">
                    <strong className="block uppercase mb-1">TASK VERIFIED ON RECORD</strong>
                    <p className="text-[11px] leading-relaxed">
                      Your completion has been officially validated. Proof recorded into your contributor profile.
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleSubmitProof} className="space-y-3">
                    <label className="block text-[10px] font-mono font-bold uppercase text-[var(--yo-ink)]">
                      PROOF OF COMPLETION / ADDITIONAL DELIVERABLE URLS
                    </label>
                    <textarea
                      value={proofText}
                      onChange={(e) => setProofText(e.target.value)}
                      placeholder="e.g. Transaction hash, tweet URL, PR link, or summary of completed task..."
                      rows={2}
                      className="lp-input font-mono"
                    />

                    <div className="flex justify-end gap-2">
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="lp-button lp-button-primary text-xs"
                      >
                        <span>
                          {isSubmitting
                            ? 'SUBMITTING...'
                            : participation.completionStatus === 'PENDING_VERIFICATION'
                            ? 'UPDATE SUBMITTED PROOF'
                            : 'SUBMIT PROOF OF WORK'}
                        </span>
                        <span aria-hidden="true">↗</span>
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
