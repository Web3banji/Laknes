import React from 'react';
import { QuestData } from '../cards/QuestCard';
import { Modal } from '../../design-system/primitives/Modal';
import { Button } from '../../design-system/primitives/Button';
import { QuestProgress } from './QuestProgress';
import { useWallet } from '../../core/wallet/WalletContext';
import { useToast } from '../../design-system/primitives/Toast';
import { Check, Wallet } from 'lucide-react';

export interface QuestDetailModalProps {
  quest: QuestData | null;
  onClose: () => void;
  onToggleStep: (questId: string, stepId: string) => void;
}

export const QuestDetailModal: React.FC<QuestDetailModalProps> = ({
  quest,
  onClose,
  onToggleStep,
}) => {
  const { status, openConnectModal } = useWallet();
  const { showToast, questCompleted } = useToast();

  if (!quest) return null;

  const completedCount = quest.steps.filter((s) => s.completed).length;
  const totalCount = quest.steps.length;
  const isAllComplete = completedCount === totalCount && totalCount > 0;

  const handleStepAction = (stepId: string, requiresWallet?: boolean, alreadyCompleted?: boolean) => {
    if (requiresWallet && status !== 'connected') {
      showToast({
        type: 'info',
        title: 'Wallet required',
        message: 'Connect your wallet to verify this on-chain step.',
      });
      openConnectModal();
      return;
    }

    onToggleStep(quest.id, stepId);

    if (!alreadyCompleted) {
      const willBeComplete = completedCount + 1 >= totalCount;
      if (willBeComplete) {
        questCompleted(quest.title);
      } else {
        showToast({
          type: 'success',
          title: 'Step completed',
          message: 'Progress recorded on Elysium.',
        });
      }
    } else {
      showToast({
        type: 'info',
        title: 'Step reset',
        message: 'Step marked as pending.',
      });
    }
  };

  return (
    <Modal
      isOpen={Boolean(quest)}
      onClose={onClose}
      title={quest.title}
      description={`${quest.track} · ${quest.estimatedMinutes ? `~${quest.estimatedMinutes} min` : 'Self-paced'}`}
      size="md"
      footer={
        <div className="flex items-center justify-between w-full">
          <div className="text-xs text-neutral-500">
            {completedCount} of {totalCount} completed
          </div>
          <Button variant="primary" size="sm" onClick={onClose}>
            {isAllComplete ? 'Finish' : 'Save & Exit'}
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        <p className="text-sm text-neutral-600 leading-relaxed">
          {quest.description}
        </p>

        {/* Progress summary using QuestProgress */}
        <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-200/80">
          <QuestProgress completed={completedCount} total={totalCount} />
        </div>

        {/* Step list */}
        <div className="space-y-3">
          <h4 className="text-xs font-semibold text-neutral-900 uppercase tracking-wider">
            Required Steps
          </h4>
          <div className="space-y-2">
            {quest.steps.map((step, index) => {
              const needsWallet = step.requiresWallet && status !== 'connected';

              return (
                <div
                  key={step.id}
                  className={`p-3.5 rounded-lg border transition-all text-left flex items-start justify-between gap-3 ${
                    step.completed
                      ? 'bg-neutral-50/60 border-neutral-200/60'
                      : 'bg-white border-neutral-200 hover:border-neutral-300'
                  }`}
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <button
                      type="button"
                      onClick={() => handleStepAction(step.id, step.requiresWallet, step.completed)}
                      className={`mt-0.5 w-5 h-5 rounded flex items-center justify-center border transition-colors cursor-pointer shrink-0 ${
                        step.completed
                          ? 'bg-neutral-950 border-neutral-950 text-white'
                          : 'bg-white border-neutral-300 hover:border-neutral-900'
                      }`}
                      aria-label={`Toggle step ${index + 1}`}
                    >
                      {step.completed && <Check className="w-3.5 h-3.5 stroke-[2.5]" />}
                    </button>
                    <div>
                      <div
                        className={`text-sm font-medium ${
                          step.completed
                            ? 'line-through text-neutral-400'
                            : 'text-neutral-900'
                        }`}
                      >
                        {index + 1}. {step.title}
                      </div>
                      <p className="text-xs text-neutral-500 mt-0.5 leading-normal">
                        {step.description}
                      </p>
                      {step.requiresWallet && (
                        <div className="mt-1 flex items-center gap-1 text-[11px] text-neutral-400">
                          <Wallet className="w-3 h-3" />
                          <span>Requires on-chain wallet verification</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="shrink-0">
                    {needsWallet ? (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openConnectModal()}
                        className="text-xs"
                      >
                        Connect
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant={step.completed ? 'ghost' : 'outline'}
                        onClick={() =>
                          handleStepAction(step.id, step.requiresWallet, step.completed)
                        }
                        className="text-xs"
                      >
                        {step.completed ? 'Undo' : 'Verify'}
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </Modal>
  );
};
