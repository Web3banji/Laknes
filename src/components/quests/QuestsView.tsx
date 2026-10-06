import React, { useState } from 'react';
import { Quest } from '../../core/ecosystem/types';
import { QuestCard } from '../cards/QuestCard';
import { Tabs } from '../../design-system/primitives/Tabs';
import { Button } from '../../design-system/primitives/Button';
import { QuestCardSkeleton } from '../../design-system/primitives/Skeleton';
import { EmptyState } from '../../design-system/primitives/EmptyState';
import { useWallet } from '../../core/wallet/WalletContext';
import { Compass, Sparkles, Filter, Plus } from 'lucide-react';

export interface QuestsViewProps {
  quests: Quest[];
  isLoading?: boolean;
  onSelectQuest: (quest: Quest) => void;
  onNavigateToDashboard?: () => void;
}

export type QuestFilterTab = 'recommended' | 'beginner' | 'active' | 'completed';

export const QuestsView: React.FC<QuestsViewProps> = ({
  quests,
  isLoading = false,
  onSelectQuest,
  onNavigateToDashboard,
}) => {
  const { status, openConnectModal } = useWallet();
  const [selectedTab, setSelectedTab] = useState<QuestFilterTab>('recommended');

  const filteredQuests = quests.filter((quest) => {
    const completedSteps = (quest.steps || []).filter((s) => s.completed).length;
    const totalSteps = (quest.steps || []).length;
    const isCompleted = quest.status === 'completed' || (totalSteps > 0 && completedSteps === totalSteps);
    const isInProgress = completedSteps > 0 && !isCompleted;

    if (selectedTab === 'completed') {
      return isCompleted;
    }
    if (selectedTab === 'active') {
      return isInProgress || (!isCompleted && totalSteps > 0);
    }
    if (selectedTab === 'beginner') {
      return quest.difficulty === 'Beginner' || quest.track === 'Onboarding';
    }
    // recommended: returns all active non-completed or onboarding quests
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
      {/* Editorial Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
            Elysium Onboarding
          </span>
          <h1 className="mt-1 text-2xl sm:text-3xl font-semibold tracking-tight text-neutral-950">
            Interactive Ecosystem Quests
          </h1>
          <p className="mt-2 text-sm text-neutral-500 max-w-xl leading-relaxed">
            Follow verified step-by-step tracks to interact with smart contracts, verify state, and explore Elysium Mainnet.
          </p>
        </div>

        {onNavigateToDashboard && (
          <Button
            variant="secondary"
            size="md"
            onClick={onNavigateToDashboard}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Create Quest
          </Button>
        )}
      </div>

      {/* Quest Filter Tabs */}
      <div className="flex items-center justify-between gap-4 overflow-x-auto no-scrollbar pb-1 border-b border-neutral-200">
        <div className="flex items-center gap-1">
          {(
            [
              { id: 'recommended', label: 'Recommended' },
              { id: 'beginner', label: 'Beginner' },
              { id: 'active', label: 'Active' },
              { id: 'completed', label: 'Completed' },
            ] as const
          ).map((tab) => {
            const isActive = selectedTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSelectedTab(tab.id)}
                className={`whitespace-nowrap px-3.5 pb-3 text-sm font-medium transition-colors border-b-2 cursor-pointer ${
                  isActive
                    ? 'border-neutral-950 text-neutral-950 font-semibold'
                    : 'border-transparent text-neutral-500 hover:text-neutral-900'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="text-xs text-neutral-400 font-mono tabular-nums shrink-0 pb-3">
          {filteredQuests.length} {filteredQuests.length === 1 ? 'quest' : 'quests'}
        </div>
      </div>

      {/* Quests Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <QuestCardSkeleton />
          <QuestCardSkeleton />
        </div>
      ) : filteredQuests.length === 0 ? (
        <EmptyState
          title={
            selectedTab === 'completed'
              ? 'No completed quests yet'
              : 'No quests currently available in this category'
          }
          description="Quests are published by project teams and administrators. When new onboarding tracks are registered in the dashboard, they will appear here."
          action={
            onNavigateToDashboard ? (
              <Button variant="secondary" onClick={onNavigateToDashboard}>
                Open Project Dashboard
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredQuests.map((quest) => (
            <QuestCard
              key={quest.id}
              quest={quest}
              onSelect={onSelectQuest}
            />
          ))}
        </div>
      )}
    </div>
  );
};
