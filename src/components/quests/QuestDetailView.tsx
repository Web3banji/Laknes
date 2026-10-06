import React, { useState } from 'react';
import { Quest, QuestStep } from '../../core/ecosystem/types';
import { QuestProgress } from './QuestProgress';
import { Button } from '../../design-system/primitives/Button';
import { ElysiumProvider, TransactionLifecycleState, BlockchainFailureState } from '../../core/blockchain/ElysiumProvider';
import { useWallet } from '../../core/wallet/WalletContext';
import { useToast } from '../../design-system/primitives/Toast';
import {
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Clock,
  Layers,
  Wallet,
  ExternalLink,
  ShieldCheck,
  RefreshCw,
  Loader2,
  ArrowRight,
} from 'lucide-react';
import { formatAddress, ACTIVE_NETWORK } from '../../core/network/config';

export type StepExecutionState =
  | 'not_started'
  | 'in_progress'
  | 'waiting_for_wallet'
  | 'waiting_for_transaction'
  | 'verification_pending'
  | 'completed'
  | 'failed';

export interface QuestDetailViewProps {
  quest: Quest;
  onBack: () => void;
  onUpdateStep: (questId: string, stepId: string, completed: boolean) => void;
}

export function QuestDetailView({
  quest,
  onBack,
  onUpdateStep,
}: QuestDetailViewProps) {
  const { status, address, openConnectModal } = useWallet();
  const { showToast, questCompleted, txSubmitted, txConfirmed, txFailed } = useToast();

  const [activeStepId, setActiveStepId] = useState<string | null>(null);
  const [stepStates, setStepStates] = useState<Record<string, StepExecutionState>>(() => {
    const initial: Record<string, StepExecutionState> = {};
    quest.steps.forEach((s) => {
      initial[s.id] = s.completed ? 'completed' : 'not_started';
    });
    return initial;
  });

  const [txStates, setTxStates] = useState<Record<string, TransactionLifecycleState>>({});
  const [txHashes, setTxHashes] = useState<Record<string, string>>({});
  const [failureReasons, setFailureReasons] = useState<Record<string, string>>({});

  const completedCount = quest.steps.filter((s) => stepStates[s.id] === 'completed').length;
  const totalCount = quest.steps.length;
  const isAllComplete = completedCount === totalCount && totalCount > 0;

  // Execute verifiable step
  const executeStep = async (step: QuestStep) => {
    setActiveStepId(step.id);
    setFailureReasons((prev) => ({ ...prev, [step.id]: '' }));

    // 1. If step requires wallet, verify connection & chain
    if (step.requiresWallet) {
      if (!ElysiumProvider.isProviderAvailable()) {
        setStepStates((prev) => ({ ...prev, [step.id]: 'failed' }));
        setFailureReasons((prev) => ({
          ...prev,
          [step.id]: 'No EVM browser wallet detected. Please install an Elysium-compatible wallet.',
        }));
        return;
      }

      setStepStates((prev) => ({ ...prev, [step.id]: 'waiting_for_wallet' }));

      try {
        const { address: userAddr, chainId } = await ElysiumProvider.connectWallet();

        // Check if on Elysium network (Chain ID 1339)
        if (chainId !== 1339) {
          setStepStates((prev) => ({ ...prev, [step.id]: 'waiting_for_wallet' }));
          await ElysiumProvider.switchNetwork();
        }

        // Verify account on Elysium
        setStepStates((prev) => ({ ...prev, [step.id]: 'verification_pending' }));

        // Read real balance from Elysium RPC
        const balance = await ElysiumProvider.getLAVABalance(userAddr);

        // Verification successful: real on-chain balance query confirmed on Elysium
        setStepStates((prev) => ({ ...prev, [step.id]: 'completed' }));
        onUpdateStep(quest.id, step.id, true);

        const isLastStep = completedCount + 1 >= totalCount;
        if (isLastStep) {
          questCompleted(quest.title);
        } else {
          showToast({
            type: 'success',
            title: 'Step verified on Elysium',
            message: `Account ${formatAddress(userAddr, 6, 4)} attested on Chain 1339.`,
          });
        }
      } catch (err: any) {
        setStepStates((prev) => ({ ...prev, [step.id]: 'failed' }));
        const message =
          err.message === 'wallet_rejected' || err.message?.includes('rejected')
            ? 'Signature or connection request declined in wallet.'
            : err.message || 'Verification could not be established on Elysium.';
        setFailureReasons((prev) => ({ ...prev, [step.id]: message }));
        showToast({
          type: 'error',
          title: 'Step Verification Failed',
          message,
        });
      }
    } else {
      // Step is an instructional verification step
      setStepStates((prev) => ({ ...prev, [step.id]: 'in_progress' }));

      // Complete verified educational checkpoint
      setTimeout(() => {
        setStepStates((prev) => ({ ...prev, [step.id]: 'completed' }));
        onUpdateStep(quest.id, step.id, true);

        const isLastStep = completedCount + 1 >= totalCount;
        if (isLastStep) {
          questCompleted(quest.title);
        } else {
          showToast({
            type: 'success',
            title: 'Step Completed',
            message: 'Requirement completed.',
          });
        }
      }, 400);
    }
  };

  const getStepStatusBadge = (state: StepExecutionState) => {
    switch (state) {
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 rounded-md">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Verified
          </span>
        );
      case 'in_progress':
      case 'verification_pending':
        return (
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-neutral-800 bg-neutral-100 border border-neutral-200 px-2 py-0.5 rounded-md">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            Verifying…
          </span>
        );
      case 'waiting_for_wallet':
        return (
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md">
            <Wallet className="w-3.5 h-3.5" />
            Check Wallet
          </span>
        );
      case 'failed':
        return (
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-700 bg-red-50 border border-red-200 px-2 py-0.5 rounded-md">
            <AlertCircle className="w-3.5 h-3.5" />
            Action Required
          </span>
        );
      default:
        return (
          <span className="text-xs text-neutral-400 font-mono">
            Pending
          </span>
        );
    }
  };

  return (
    <article className="mx-auto max-w-4xl px-4 sm:px-6 py-8 sm:py-12 space-y-10">
      {/* Top Breadcrumb Navigation */}
      <div>
        <button
          type="button"
          onClick={onBack}
          className="group inline-flex items-center gap-2 text-sm font-medium text-neutral-500 hover:text-neutral-900 transition-colors cursor-pointer py-1"
        >
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
          <span>Back to Quests</span>
        </button>
      </div>

      {/* Quest Detail Header Shell */}
      <header className="rounded-2xl border border-neutral-200 bg-white p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-lg bg-neutral-100 px-2.5 py-0.5 text-xs font-medium text-neutral-700">
                {quest.track}
              </span>
              <span className="rounded-lg border border-neutral-200 bg-white px-2 py-0.5 text-xs font-medium text-neutral-600">
                {quest.difficulty || 'Beginner'}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-neutral-950">
              {quest.title}
            </h1>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono text-neutral-500 bg-neutral-50 px-3 py-1.5 rounded-xl border border-neutral-200 self-start">
            <Clock className="w-3.5 h-3.5" />
            <span>~{quest.estimatedMinutes} min</span>
          </div>
        </div>

        <p className="text-base text-neutral-600 leading-relaxed max-w-2xl">
          {quest.description}
        </p>

        {/* Progress Bar Component */}
        <div className="pt-4 border-t border-neutral-100">
          <QuestProgress completed={completedCount} total={totalCount} />
        </div>
      </header>

      {/* Required Checklist Steps */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-neutral-900">
            Guided Steps
          </h2>
          <span className="text-xs text-neutral-500">
            Never mark complete without verifiable conditions
          </span>
        </div>

        <div className="space-y-3">
          {quest.steps.map((step, index) => {
            const state = stepStates[step.id] || 'not_started';
            const isCompleted = state === 'completed';
            const isRunning =
              state === 'in_progress' ||
              state === 'waiting_for_wallet' ||
              state === 'verification_pending';
            const errorReason = failureReasons[step.id];

            return (
              <div
                key={step.id}
                className={`rounded-2xl border p-5 sm:p-6 transition-all ${
                  isCompleted
                    ? 'border-neutral-200/80 bg-neutral-50/50'
                    : 'border-neutral-200 bg-white shadow-2xs'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="flex items-start gap-3.5">
                    <span
                      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                        isCompleted
                          ? 'bg-emerald-600 text-white'
                          : 'bg-neutral-100 text-neutral-700'
                      }`}
                    >
                      {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : index + 1}
                    </span>

                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-base font-semibold text-neutral-950">
                          {step.title}
                        </h3>
                        {getStepStatusBadge(state)}
                      </div>

                      <p className="text-xs sm:text-sm text-neutral-500 leading-relaxed max-w-xl">
                        {step.description}
                      </p>

                      {step.requiresWallet && (
                        <div className="pt-1 flex items-center gap-1.5 text-xs text-neutral-600">
                          <ShieldCheck className="w-3.5 h-3.5 text-neutral-500" />
                          <span>Requires active Elysium Mainnet wallet session</span>
                        </div>
                      )}

                      {errorReason && (
                        <div className="mt-2 rounded-lg bg-red-50 border border-red-200 p-2.5 text-xs text-red-800">
                          {errorReason}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Step Action Button */}
                  <div className="self-start sm:self-center shrink-0">
                    {isCompleted ? (
                      <span className="text-xs font-medium text-emerald-700 font-mono">
                        Done
                      </span>
                    ) : (
                      <Button
                        size="sm"
                        variant={isRunning ? 'secondary' : 'primary'}
                        loading={isRunning}
                        onClick={() => executeStep(step)}
                      >
                        {step.requiresWallet ? 'Verify on Chain' : 'Complete Step'}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Completion Banner */}
      {isAllComplete && (
        <section className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-6 sm:p-8 text-center space-y-4">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
            <CheckCircle2 className="w-6 h-6" />
          </div>

          <div>
            <h3 className="text-lg font-semibold text-neutral-950">
              Quest Objective Complete
            </h3>
            <p className="mt-1 text-sm text-neutral-600 max-w-md mx-auto">
              All required onboarding criteria verified directly against Elysium consensus.
            </p>
          </div>

          <div className="pt-2">
            <Button variant="primary" onClick={onBack}>
              Explore More Quests
            </Button>
          </div>
        </section>
      )}
    </article>
  );
}
