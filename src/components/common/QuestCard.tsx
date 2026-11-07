/**
 * LAKNES Standardized Quest Card (Yochi Editorial Design System)
 * Editorial opportunity card with mono rewards, deadlines, task types, and action triggers.
 */

import React from 'react';
import { Quest } from '../../types/contracts.ts';

interface QuestCardProps {
  quest: Quest;
  projectName?: string;
  projectLogo?: string;
  onSelect: (quest: Quest) => void;
  isParticipating?: boolean;
  participationStatus?: string;
  isSaved?: boolean;
  onToggleSave?: (questId: string, e: React.MouseEvent) => void;
}

export function QuestCard({
  quest,
  projectName,
  projectLogo,
  onSelect,
  isParticipating,
  participationStatus,
  isSaved,
  onToggleSave,
}: QuestCardProps) {
  const isExpired = Boolean(quest.deadline && new Date(quest.deadline).getTime() < Date.now());

  return (
    <div
      onClick={() => onSelect(quest)}
      className="group flex flex-col justify-between bg-[var(--yo-surface-1)] border-[1.5px] border-[var(--yo-line)] hover:border-[var(--yo-ink)] p-5 transition-all duration-150 hover:-translate-y-0.5 hover:shadow-[4px_4px_0_var(--yo-ink)] cursor-pointer rounded-[2px]"
    >
      <div>
        {/* Top Meta Line: Project Info, Quest Type & Reward */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex items-center gap-2.5 min-w-0">
            {projectLogo ? (
              <img
                src={projectLogo}
                alt={projectName || 'Project'}
                className="w-6 h-6 rounded-[2px] object-cover border border-[var(--yo-line)] shrink-0 bg-[var(--yo-surface-2)]"
              />
            ) : (
              <div className="w-6 h-6 border border-[var(--yo-line)] bg-[var(--yo-surface-2)] flex items-center justify-center shrink-0 font-mono text-[10px] font-bold text-[var(--yo-ink)]">
                {projectName ? projectName.slice(0, 1).toUpperCase() : 'Q'}
              </div>
            )}
            <div className="min-w-0">
              {projectName && (
                <span className="text-xs font-bold text-[var(--yo-ink)] truncate block font-body">
                  {projectName}
                </span>
              )}
              <span className="font-mono text-[9px] uppercase tracking-wider text-[var(--yo-muted)] font-bold">
                {quest.questType}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {quest.rewardConfiguration && (
              <span className="font-mono text-[10px] font-bold px-2 py-0.5 border border-[var(--yo-line)] bg-[var(--yo-surface-2)] text-[var(--yo-accent-text)]">
                {quest.rewardConfiguration.amount ? `${quest.rewardConfiguration.amount} ` : ''}
                {quest.rewardConfiguration.rewardType}
              </span>
            )}

            {onToggleSave && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleSave(quest.id, e);
                }}
                className="p-1 border border-[var(--yo-line)] bg-[var(--yo-surface-1)] text-[var(--yo-ink)] hover:border-[var(--yo-ink)] transition-colors cursor-pointer"
                title={isSaved ? 'Remove from Saved Quests' : 'Save Quest'}
              >
                <span className="material-symbols-outlined text-[14px]">
                  {isSaved ? 'bookmark' : 'bookmark_border'}
                </span>
              </button>
            )}
          </div>
        </div>

        {/* Quest Title */}
        <h3 className="yo-display text-base text-[var(--yo-ink)] group-hover:text-[var(--yo-accent-text)] transition-colors mb-2 leading-snug">
          {quest.title}
        </h3>

        {/* Description */}
        <p className="font-body text-xs text-[var(--yo-muted)] line-clamp-3 mb-4 leading-relaxed">
          {quest.description}
        </p>

        {/* Eligibility Rule Tag if present */}
        {quest.eligibilityRules?.ecosystemSpecificCondition && (
          <div className="mb-3 px-2.5 py-1 bg-[var(--yo-surface-2)] border border-[var(--yo-line)] text-[10px] text-[var(--yo-muted)] font-mono flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[12px] text-[var(--yo-accent)]">rule</span>
            <span className="truncate">{quest.eligibilityRules.ecosystemSpecificCondition}</span>
          </div>
        )}
      </div>

      {/* Bottom Action Footer */}
      <div className="pt-3 border-t border-[var(--yo-line)] flex items-center justify-between font-mono text-[10px]">
        <div className="flex items-center gap-1 text-[var(--yo-muted)]">
          <span className="material-symbols-outlined text-[13px]">schedule</span>
          <span>{quest.deadline ? `DUE ${new Date(quest.deadline).toLocaleDateString()}` : 'CONTINUOUS'}</span>
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onSelect(quest);
          }}
          disabled={isExpired}
          className={`inline-flex items-center gap-1.5 px-3 py-1 font-mono font-bold uppercase tracking-wider text-[10px] transition-all cursor-pointer ${
            participationStatus === 'VERIFIED'
              ? 'bg-[var(--yo-good)] text-white border border-[var(--yo-good)]'
              : participationStatus === 'PENDING_VERIFICATION'
              ? 'bg-[var(--yo-gold)] text-white border border-[var(--yo-gold)]'
              : isParticipating
              ? 'border-[1.5px] border-[var(--yo-ink)] bg-[var(--yo-ink)] text-[var(--yo-bg)]'
              : isExpired
              ? 'border border-[var(--yo-line)] text-[var(--yo-muted)] cursor-not-allowed'
              : 'border-[1.5px] border-[var(--yo-ink)] bg-[var(--yo-cta)] text-[var(--yo-on-cta)] shadow-[2px_2px_0_var(--yo-ink)] hover:translate-x-[-1px] hover:translate-y-[-1px]'
          }`}
        >
          <span>
            {participationStatus === 'VERIFIED'
              ? 'VERIFIED'
              : participationStatus === 'PENDING_VERIFICATION'
              ? 'IN REVIEW'
              : isParticipating
              ? 'IN PROGRESS'
              : isExpired
              ? 'EXPIRED'
              : 'PARTICIPATE'}
          </span>
          <span aria-hidden="true">↗</span>
        </button>
      </div>
    </div>
  );
}
