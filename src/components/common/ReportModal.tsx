/**
 * LAKNES Content Report Modal
 * Standardized reporting dialog for community moderation.
 */

import React, { useState } from 'react';
import { ContentReportTargetType } from '../../types/contracts.ts';

interface ReportModalProps {
  isOpen: boolean;
  targetType: ContentReportTargetType;
  targetId: string;
  targetName: string;
  onClose: () => void;
  onSubmitReport: (targetType: ContentReportTargetType, targetId: string, reason: string) => Promise<unknown>;
}

export function ReportModal({
  isOpen,
  targetType,
  targetId,
  targetName,
  onClose,
  onSubmitReport,
}: ReportModalProps) {
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) return;

    setError(null);
    setIsSubmitting(true);
    try {
      await onSubmitReport(targetType, targetId, reason.trim());
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setReason('');
        onClose();
      }, 1500);
    } catch (err: any) {
      setError(err?.message || 'Failed to submit report.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md lp-modal-box p-6 relative"
      >
        <div className="flex items-center justify-between pb-3 border-b border-[var(--yo-line)] mb-4">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[var(--yo-accent)] text-[20px]">flag</span>
            <span className="yo-display text-sm text-[var(--yo-ink)] font-semibold tracking-wide">Report Content</span>
          </div>
          <button onClick={onClose} className="p-1 rounded text-[var(--yo-muted)] hover:text-[var(--yo-ink)] transition-colors">
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        <p className="text-xs text-[var(--yo-muted)] mb-4 leading-relaxed">
          Reporting <span className="text-[var(--yo-ink)] font-bold">{targetName}</span> ({targetType}). Reports are submitted directly to platform administrators.
        </p>

        {success ? (
          <div className="p-4 rounded-[2px] bg-emerald-50 border border-[var(--yo-good)] text-[var(--yo-good)] text-xs text-center font-medium">
            Thank you. Your report has been submitted for review.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 rounded-[2px] bg-rose-50 border border-rose-300 text-rose-700 text-xs">
                {error}
              </div>
            )}

            <div>
              <label className="block text-[11px] yo-mono uppercase text-[var(--yo-muted)] mb-1 font-semibold">
                Reason for report
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Explain why this content violates community guidelines, provides deceptive information, or violates standards..."
                rows={4}
                required
                className="w-full px-3 py-2 lp-input text-xs"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="lp-button lp-button-secondary text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !reason.trim()}
                className="lp-button lp-button-primary text-xs disabled:opacity-50"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Report'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
