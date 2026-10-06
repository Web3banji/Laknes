import React, { useState } from 'react';
import { useMigrationLifecycle } from '../../hooks/useMigrationLifecycle';
import { MigrationChecklistItem, MigrationItemStatus } from '../../services/migrationService';
import { Button } from '../../design-system/primitives/Button';
import { Modal } from '../../design-system/primitives/Modal';
import { useToast } from '../../design-system/primitives/Toast';
import {
  CheckCircle2,
  Clock,
  AlertCircle,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  ArrowRight,
  Sparkles,
  Layers,
  FileCheck,
  HelpCircle,
  Play,
  RotateCcw,
} from 'lucide-react';
import { ELYSIUM_CONFIG } from '../../lib/elysium/constants';
import { isValidElysiumAddress } from '../../lib/elysium/validation';

export interface ForProjectsViewProps {
  onRequestSubmit?: () => void;
}

export const ForProjectsView: React.FC<ForProjectsViewProps> = ({ onRequestSubmit }) => {
  const { showToast } = useToast();
  const {
    stages,
    currentStage,
    completedCount,
    totalCount,
    progressPercent,
    nextRequiredAction,
    updateItemStatus,
    verifyContractDeployment,
  } = useMigrationLifecycle('primary-project');

  // Active expanded stages
  const [expandedStages, setExpandedStages] = useState<Record<number, boolean>>({
    1: true,
    2: true,
  });

  // Verification modal state for contract checking
  const [activeVerificationItem, setActiveVerificationItem] = useState<MigrationChecklistItem | null>(null);
  const [contractAddressInput, setContractAddressInput] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationFeedback, setVerificationFeedback] = useState<{ success?: boolean; message?: string } | null>(null);

  // Confirmation modal for manual attestation
  const [confirmAttestItem, setConfirmAttestItem] = useState<MigrationChecklistItem | null>(null);

  const toggleStage = (stageNum: number) => {
    setExpandedStages((prev) => ({ ...prev, [stageNum]: !prev[stageNum] }));
  };

  const handleActionClick = (item: MigrationChecklistItem) => {
    if (item.actionType === 'verify_contract') {
      setActiveVerificationItem(item);
      setContractAddressInput('');
      setVerificationFeedback(null);
    } else if (item.actionType === 'external_doc' || item.actionType === 'external_app') {
      window.open(item.targetUrl || item.documentationUrl, '_blank', 'noreferrer,noopener');
    } else if (item.actionType === 'manual_attest') {
      setConfirmAttestItem(item);
    }
  };

  const handleExecuteContractVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeVerificationItem) return;

    if (!isValidElysiumAddress(contractAddressInput)) {
      setVerificationFeedback({
        success: false,
        message: 'Invalid EVM address format. Must be a 42-character hex address (0x...).',
      });
      return;
    }

    setIsVerifying(true);
    setVerificationFeedback(null);

    const result = await verifyContractDeployment(activeVerificationItem.id, contractAddressInput);
    setIsVerifying(false);
    setVerificationFeedback(result);

    if (result.success) {
      showToast({
        type: 'success',
        title: 'Requirement Verified on Elysium',
        message: result.message,
      });
      setTimeout(() => {
        setActiveVerificationItem(null);
      }, 1500);
    }
  };

  const handleConfirmAttest = () => {
    if (!confirmAttestItem) return;
    updateItemStatus(confirmAttestItem.id, 'Completed', {
      attestedAt: new Date().toISOString(),
      manualAttestation: true,
    });
    showToast({
      type: 'success',
      title: 'Status Updated',
      message: `Attested "${confirmAttestItem.title}" as completed.`,
    });
    setConfirmAttestItem(null);
  };

  const getStatusBadge = (status: MigrationItemStatus) => {
    switch (status) {
      case 'Completed':
        return (
          <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 text-xs font-semibold text-emerald-800">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Completed
          </span>
        );
      case 'In progress':
        return (
          <span className="inline-flex items-center gap-1 rounded-md bg-neutral-900 border border-neutral-900 px-2 py-0.5 text-xs font-semibold text-white">
            In progress
          </span>
        );
      case 'Waiting':
        return (
          <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 border border-amber-200 px-2 py-0.5 text-xs font-semibold text-amber-800">
            <Clock className="w-3.5 h-3.5" />
            Waiting
          </span>
        );
      case 'Blocked':
        return (
          <span className="inline-flex items-center gap-1 rounded-md bg-red-50 border border-red-200 px-2 py-0.5 text-xs font-semibold text-red-800">
            <AlertCircle className="w-3.5 h-3.5" />
            Blocked
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center rounded-md bg-neutral-100 border border-neutral-200 px-2 py-0.5 text-xs font-medium text-neutral-600">
            Not started
          </span>
        );
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-10">
      {/* Editorial Header */}
      <header className="rounded-2xl border border-neutral-200 bg-white p-6 sm:p-8 space-y-6">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
                Elysium Project Lifecycle
              </span>
              <span className="rounded-md bg-neutral-100 px-2 py-0.5 text-xs font-mono font-medium text-neutral-700">
                Chain ID {ELYSIUM_CONFIG.chainIdDecimal}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-neutral-950">
              Liquidity Migration & Lifecycle Roadmap
            </h1>

            <p className="text-sm text-neutral-500 max-w-2xl leading-relaxed">
              A structured, 6-stage lifecycle for migrating liquidity, deploying contracts, and integrating with Elysium consensus safeguards.
            </p>
          </div>

          {onRequestSubmit && (
            <div className="self-start md:self-auto shrink-0">
              <Button variant="secondary" size="md" onClick={onRequestSubmit}>
                Submit Project
              </Button>
            </div>
          )}
        </div>

        {/* Global Progress Track */}
        <div className="pt-4 border-t border-neutral-100 space-y-2">
          <div className="flex items-center justify-between text-xs font-medium text-neutral-600">
            <span>Overall Migration Progress</span>
            <span className="font-mono tabular-nums text-neutral-900 font-semibold">
              {completedCount} of {totalCount} requirements ({progressPercent}%)
            </span>
          </div>

          <div className="h-2 w-full overflow-hidden rounded-full bg-neutral-100">
            <div
              className="h-full rounded-full bg-neutral-950 transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </header>

      {/* Primary Section: Current Stage & Next Required Action */}
      <section className="rounded-2xl border border-neutral-950 bg-neutral-950 text-white p-6 sm:p-8 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
              Current Active Stage
            </span>
          </div>

          <span className="rounded-lg bg-neutral-800 px-3 py-1 text-xs font-mono text-neutral-300">
            Stage {currentStage.stageNumber} of 6
          </span>
        </div>

        <div className="space-y-1">
          <h2 className="text-xl sm:text-2xl font-semibold">
            {currentStage.name}
          </h2>
          <p className="text-sm text-neutral-400 leading-relaxed max-w-2xl">
            {currentStage.description}
          </p>
        </div>

        {/* Next Required Action Box */}
        {nextRequiredAction && (
          <div className="rounded-xl border border-neutral-800 bg-neutral-900/90 p-5 space-y-3">
            <div className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
              Next Required Action
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <h3 className="text-base font-semibold text-white">
                  {nextRequiredAction.title}
                </h3>
                <p className="text-xs text-neutral-400 max-w-xl leading-relaxed">
                  {nextRequiredAction.requirement}
                </p>
              </div>

              <div className="shrink-0">
                <Button
                  variant="primary"
                  size="md"
                  onClick={() => handleActionClick(nextRequiredAction)}
                  rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                  className="bg-white text-neutral-950 hover:bg-neutral-100"
                >
                  {nextRequiredAction.actionLabel}
                </Button>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Structured 6-Stage Checklist */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-neutral-950">
            Structured Lifecycle Stages
          </h2>
          <span className="text-xs text-neutral-500">
            Documented Elysium Protocol Requirements
          </span>
        </div>

        <div className="space-y-4">
          {stages.map((stage) => {
            const isExpanded = expandedStages[stage.stageNumber] ?? false;
            const stageCompleted = stage.items.filter((i) => i.status === 'Completed').length;
            const stageTotal = stage.items.length;
            const isFullyDone = stageCompleted === stageTotal && stageTotal > 0;

            return (
              <div
                key={stage.stageNumber}
                className="rounded-2xl border border-neutral-200 bg-white overflow-hidden transition-all shadow-2xs"
              >
                {/* Stage Header Toggle */}
                <button
                  type="button"
                  onClick={() => toggleStage(stage.stageNumber)}
                  className="w-full p-5 sm:p-6 flex items-center justify-between text-left hover:bg-neutral-50/50 transition-colors cursor-pointer select-none"
                >
                  <div className="flex items-center gap-3.5">
                    <span
                      className={`flex h-8 w-8 items-center justify-center rounded-xl text-xs font-semibold ${
                        isFullyDone
                          ? 'bg-emerald-600 text-white'
                          : 'bg-neutral-100 text-neutral-800'
                      }`}
                    >
                      {isFullyDone ? <CheckCircle2 className="w-4 h-4" /> : stage.stageNumber}
                    </span>

                    <div>
                      <h3 className="text-base font-semibold text-neutral-950">
                        {stage.name}
                      </h3>
                      <p className="text-xs text-neutral-500 mt-0.5 line-clamp-1">
                        {stage.description}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <span className="text-xs font-mono text-neutral-500 tabular-nums">
                      {stageCompleted}/{stageTotal} Done
                    </span>
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-neutral-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-neutral-400" />
                    )}
                  </div>
                </button>

                {/* Stage Items Accordion Body */}
                {isExpanded && (
                  <div className="border-t border-neutral-100 divide-y divide-neutral-100 bg-neutral-50/20">
                    {stage.items.map((item) => (
                      <div key={item.id} className="p-5 sm:p-6 space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                          <div className="space-y-1.5 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <h4 className="text-sm font-semibold text-neutral-950">
                                {item.title}
                              </h4>
                              {getStatusBadge(item.status)}
                            </div>

                            <p className="text-xs text-neutral-600 leading-relaxed max-w-2xl">
                              <span className="font-semibold text-neutral-800">Purpose: </span>
                              {item.purpose}
                            </p>

                            <p className="text-xs text-neutral-600 leading-relaxed max-w-2xl">
                              <span className="font-semibold text-neutral-800">Requirement: </span>
                              {item.requirement}
                            </p>
                          </div>

                          {/* Action Button & Status Control */}
                          <div className="flex flex-col items-start sm:items-end gap-2 shrink-0">
                            {item.status !== 'Completed' ? (
                              <Button
                                size="sm"
                                variant="primary"
                                onClick={() => handleActionClick(item)}
                              >
                                {item.actionLabel}
                              </Button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => updateItemStatus(item.id, 'In progress')}
                                className="text-xs text-neutral-400 hover:text-neutral-700 flex items-center gap-1 cursor-pointer"
                              >
                                <RotateCcw className="w-3 h-3" />
                                <span>Reset item</span>
                              </button>
                            )}

                            {/* Status Selector Override */}
                            <select
                              value={item.status}
                              onChange={(e) =>
                                updateItemStatus(item.id, e.target.value as MigrationItemStatus)
                              }
                              className="h-7 rounded-lg border border-neutral-200 bg-white px-2 text-[11px] text-neutral-600 outline-none cursor-pointer"
                            >
                              <option value="Not started">Not started</option>
                              <option value="In progress">In progress</option>
                              <option value="Waiting">Waiting</option>
                              <option value="Completed">Completed</option>
                              <option value="Blocked">Blocked</option>
                            </select>
                          </div>
                        </div>

                        {/* Optional Technical Details & Verification Method */}
                        <div className="rounded-xl border border-neutral-200/70 bg-white p-3.5 space-y-2 text-xs">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-neutral-500">
                            <span>
                              <span className="font-semibold text-neutral-700">Verification: </span>
                              {item.verificationMethod}
                            </span>

                            <a
                              href={item.documentationUrl}
                              target="_blank"
                              rel="noreferrer noopener"
                              className="inline-flex items-center gap-1 text-neutral-800 hover:text-neutral-950 font-medium underline shrink-0"
                            >
                              <span>Official Elysium Reference</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          </div>

                          {item.technicalDetails && (
                            <p className="text-neutral-500 font-mono text-[11px] pt-1 border-t border-neutral-100">
                              {item.technicalDetails}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Contract Verification Modal */}
      <Modal
        isOpen={Boolean(activeVerificationItem)}
        onClose={() => setActiveVerificationItem(null)}
        title="Verify On-Chain Deployment"
        description="LAKNES performs an eth_getCode query on Elysium Mainnet consensus to verify deployed bytecode without assumptions."
        size="md"
      >
        <form onSubmit={handleExecuteContractVerification} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-neutral-900">
              Elysium Smart Contract Address
            </label>
            <input
              type="text"
              required
              value={contractAddressInput}
              onChange={(e) => setContractAddressInput(e.target.value)}
              placeholder="0x..."
              className="h-10 w-full rounded-xl border border-neutral-200 px-3.5 text-sm font-mono outline-none focus:ring-2 focus:ring-neutral-200"
            />
            <p className="text-[11px] text-neutral-400">
              Target network: Elysium Mainnet (Chain ID 1339). RPC: {ELYSIUM_CONFIG.rpcUrls[0]}.
            </p>
          </div>

          {verificationFeedback && (
            <div
              className={`rounded-xl p-3 text-xs border ${
                verificationFeedback.success
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : 'bg-red-50 border-red-200 text-red-800'
              }`}
            >
              {verificationFeedback.message}
            </div>
          )}

          <div className="pt-4 border-t border-neutral-100 flex items-center justify-end gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setActiveVerificationItem(null)}
              disabled={isVerifying}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              type="submit"
              loading={isVerifying}
            >
              Verify on Chain
            </Button>
          </div>
        </form>
      </Modal>

      {/* Manual Attestation Confirmation Modal */}
      <Modal
        isOpen={Boolean(confirmAttestItem)}
        onClose={() => setConfirmAttestItem(null)}
        title="Confirm Requirement Attestation"
        description="Verify that this protocol requirement has been satisfied in accordance with Elysium documentation."
        size="sm"
      >
        <div className="space-y-4">
          <div className="rounded-xl bg-neutral-50 p-4 border border-neutral-200/80 space-y-1.5">
            <h4 className="text-sm font-semibold text-neutral-900">
              {confirmAttestItem?.title}
            </h4>
            <p className="text-xs text-neutral-600 leading-relaxed">
              {confirmAttestItem?.requirement}
            </p>
          </div>

          <p className="text-xs text-neutral-500 leading-relaxed">
            By confirming, you record this state in your project's lifecycle audit trail.
          </p>

          <div className="pt-2 flex items-center justify-end gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setConfirmAttestItem(null)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleConfirmAttest}
            >
              Confirm Attestation
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
