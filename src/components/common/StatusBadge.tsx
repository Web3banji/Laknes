/**
 * LAKNES Standardized Status Badge (Yochi Design System)
 * Crisp editorial badges with JetBrains Mono caps, tracking, and ink/accent borders.
 */

import React from 'react';
import { ProjectVerificationStatus, PublicationStatus, MembershipRole } from '../../types/contracts.ts';

interface StatusBadgeProps {
  status: ProjectVerificationStatus | PublicationStatus | MembershipRole | string;
  size?: 'sm' | 'md';
}

export function VerifiedCheckmarkBadge({
  size = 'sm',
  className = '',
  showLabel = true,
}: {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  showLabel?: boolean;
}) {
  const iconSize = size === 'sm' ? 'text-[12px]' : size === 'md' ? 'text-[14px]' : 'text-[16px]';
  const padding = size === 'sm' ? 'px-2 py-0.5 text-[9px]' : size === 'md' ? 'px-2.5 py-1 text-[10px]' : 'px-3 py-1.5 text-xs';

  return (
    <span
      className={`inline-flex items-center gap-1 font-mono uppercase tracking-wider font-bold ${padding} border border-[var(--yo-good)] text-[var(--yo-good)] bg-[var(--yo-surface-1)] select-none ${className}`}
      title="Verified Checkmark: Official seal awarded by Laknes maintainers"
    >
      <span className={`material-symbols-outlined ${iconSize} shrink-0`}>verified</span>
      {showLabel && <span>VERIFIED</span>}
    </span>
  );
}

export function PendingReviewBadge({
  size = 'sm',
  className = '',
  showLabel = true,
}: {
  size?: 'sm' | 'md';
  className?: string;
  showLabel?: boolean;
}) {
  const iconSize = size === 'sm' ? 'text-[12px]' : 'text-[14px]';
  const padding = size === 'sm' ? 'px-2 py-0.5 text-[9px]' : 'px-2.5 py-1 text-[10px]';

  return (
    <span
      className={`inline-flex items-center gap-1 font-mono uppercase tracking-wider font-bold ${padding} border border-[var(--yo-gold)] text-[var(--yo-gold)] bg-[var(--yo-surface-1)] select-none ${className}`}
      title="Awaiting Review: Under evaluation by Laknes verification team"
    >
      <span className={`material-symbols-outlined ${iconSize} shrink-0`}>hourglass_top</span>
      {showLabel && <span>AWAITING REVIEW</span>}
    </span>
  );
}

export function StatusBadge({ status, size = 'sm' }: StatusBadgeProps) {
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-[9px]' : 'px-2.5 py-1 text-[10px]';

  switch (status) {
    case ProjectVerificationStatus.VERIFIED:
      return <VerifiedCheckmarkBadge size={size} />;

    case ProjectVerificationStatus.PENDING_REVIEW:
      return <PendingReviewBadge size={size} />;

    case ProjectVerificationStatus.CHANGES_REQUESTED:
      return (
        <span className={`inline-flex items-center gap-1 font-mono uppercase tracking-wider font-bold ${sizeClasses} border border-[var(--yo-accent)] text-[var(--yo-accent-text)] bg-[var(--yo-surface-1)]`}>
          <span className="material-symbols-outlined text-[12px]">edit_note</span>
          CHANGES REQUESTED
        </span>
      );

    case ProjectVerificationStatus.REJECTED:
      return (
        <span className={`inline-flex items-center gap-1 font-mono uppercase tracking-wider font-bold ${sizeClasses} border border-[var(--yo-bad)] text-[var(--yo-bad)] bg-[var(--yo-surface-1)]`}>
          <span className="material-symbols-outlined text-[12px]">cancel</span>
          REJECTED
        </span>
      );

    case PublicationStatus.PUBLISHED:
      return (
        <span className={`inline-flex items-center gap-1 font-mono uppercase tracking-wider font-bold ${sizeClasses} border border-[var(--yo-good)] text-[var(--yo-good)] bg-[var(--yo-surface-1)]`}>
          <span className="material-symbols-outlined text-[12px]">check_circle</span>
          PUBLISHED
        </span>
      );

    case PublicationStatus.DRAFT:
      return (
        <span className={`inline-flex items-center gap-1 font-mono uppercase tracking-wider font-bold ${sizeClasses} border border-[var(--yo-line)] text-[var(--yo-muted)] bg-[var(--yo-surface-2)]`}>
          <span className="material-symbols-outlined text-[12px]">draft</span>
          DRAFT
        </span>
      );

    case MembershipRole.OWNER:
      return (
        <span className={`inline-flex items-center gap-1 font-mono uppercase tracking-wider font-bold ${sizeClasses} border border-[var(--yo-ink)] text-[var(--yo-ink)] bg-[var(--yo-surface-2)]`}>
          <span className="material-symbols-outlined text-[12px]">workspace_premium</span>
          OWNER
        </span>
      );

    case MembershipRole.MAINTAINER:
      return (
        <span className={`inline-flex items-center gap-1 font-mono uppercase tracking-wider font-bold ${sizeClasses} border border-[var(--yo-line)] text-[var(--yo-muted)] bg-[var(--yo-surface-2)]`}>
          <span className="material-symbols-outlined text-[12px]">shield</span>
          MAINTAINER
        </span>
      );

    default:
      return (
        <span className={`inline-flex items-center gap-1 font-mono uppercase tracking-wider font-bold ${sizeClasses} border border-[var(--yo-line)] text-[var(--yo-muted)] bg-[var(--yo-surface-2)]`}>
          {String(status).toUpperCase()}
        </span>
      );
  }
}
