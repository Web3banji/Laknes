import React from 'react';
import { Card } from '../../design-system/primitives/Card';
import { QuestProgress } from '../quests/QuestProgress';
import { Button } from '../../design-system/primitives/Button';
import { ArrowRight, CheckCircle2 } from 'lucide-react';

export interface QuestStep {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  requiresWallet?: boolean;
}

export interface QuestData {
  id: string;
  title: string;
  track: 'Onboarding' | 'Ecosystem Exploration' | 'Liquidity Participation' | 'Developer' | string;
  description: string;
  steps: QuestStep[];
  status?: 'not_started' | 'in_progress' | 'completed';
  rewardInfo?: string;
  estimatedMinutes?: number;
  difficulty?: 'Beginner' | 'Intermediate' | 'Advanced';
  projectId?: string;
  projectName?: string;
}

export interface QuestCardProps {
  quest: QuestData | any;
  onSelect: (quest: any) => void;
  onAction?: (quest: any) => void;
}

export const QuestCard: React.FC<QuestCardProps> = ({ quest, onSelect, onAction }) => {
  const completedSteps = (quest.steps || []).filter((s: QuestStep) => s.completed).length;
  const totalSteps = (quest.steps || []).length;
  const progressPercent = totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0;
  const isCompleted = quest.status === 'completed' || (totalSteps > 0 && completedSteps === totalSteps);

  return (
    <Card
      clickable
      onClick={() => onSelect(quest)}
      className="group flex flex-col justify-between h-full bg-white hover:border-indigo-200/90 hover:shadow-2xs transition-all duration-150"
    >
      <div>
        {/* Track kicker & estimated time */}
        <div className="flex items-center justify-between text-xs text-neutral-500 mb-2">
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-indigo-500 to-sky-400 shrink-0" />
            <span className="font-semibold text-neutral-800 tracking-wide">{quest.track}</span>
            {quest.estimatedMinutes && (
              <>
                <span aria-hidden="true" className="text-neutral-300">·</span>
                <span className="tabular-nums">~{quest.estimatedMinutes} min</span>
              </>
            )}
          </div>
          {isCompleted && (
            <span className="inline-flex items-center gap-1 text-indigo-700 font-medium text-xs">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Complete
            </span>
          )}
        </div>

        {/* Title */}
        <h3 className="text-base font-semibold text-neutral-900 group-hover:text-indigo-600 transition-colors">
          {quest.title}
        </h3>

        {/* Description */}
        <p className="mt-1.5 text-sm text-neutral-600 line-clamp-2 leading-relaxed">
          {quest.description}
        </p>

        {/* Step Progress Bar */}
        <div className="mt-4 pt-3 border-t border-neutral-100">
          <QuestProgress completed={completedSteps} total={totalSteps} />
        </div>
      </div>

      {/* Primary Action Button */}
      <div className="mt-5 pt-3 border-t border-neutral-100 flex items-center justify-between">
        <span className="text-xs text-neutral-400">
          {quest.rewardInfo || 'Elysium Badge'}
        </span>
        <Button
          size="sm"
          variant={isCompleted ? 'outline' : 'primary'}
          onClick={(e) => {
            e.stopPropagation();
            onAction ? onAction(quest) : onSelect(quest);
          }}
          rightIcon={!isCompleted ? <ArrowRight className="w-3.5 h-3.5" /> : undefined}
        >
          {isCompleted ? 'Review Steps' : completedSteps > 0 ? 'Continue' : 'Start Quest'}
        </Button>
      </div>
    </Card>
  );
};
