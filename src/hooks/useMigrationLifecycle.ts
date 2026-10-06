import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  migrationService,
  MigrationStage,
  MigrationChecklistItem,
  MigrationItemStatus,
} from '../services/migrationService';

export interface UseMigrationLifecycleResult {
  stages: MigrationStage[];
  currentStage: MigrationStage;
  completedCount: number;
  totalCount: number;
  progressPercent: number;
  nextRequiredAction: MigrationChecklistItem | null;
  updateItemStatus: (itemId: string, status: MigrationItemStatus, data?: any) => void;
  verifyContractDeployment: (itemId: string, address: string) => Promise<{ success: boolean; message: string }>;
  refresh: () => void;
}

export function useMigrationLifecycle(projectId = 'default-project'): UseMigrationLifecycleResult {
  const [stages, setStages] = useState<MigrationStage[]>(() =>
    migrationService.getProjectStages(projectId)
  );

  const refresh = useCallback(() => {
    setStages(migrationService.getProjectStages(projectId));
  }, [projectId]);

  useEffect(() => {
    refresh();
  }, [projectId, refresh]);

  // Compute completed count and total items
  const { completedCount, totalCount, nextRequiredAction, currentStage } = useMemo(() => {
    let completed = 0;
    let total = 0;
    let firstIncomplete: MigrationChecklistItem | null = null;
    let activeStage: MigrationStage = stages[0];

    for (const stage of stages) {
      let stageIncomplete = false;
      for (const item of stage.items) {
        total++;
        if (item.status === 'Completed') {
          completed++;
        } else {
          stageIncomplete = true;
          if (!firstIncomplete) {
            firstIncomplete = item;
          }
        }
      }
      if (stageIncomplete && activeStage === stages[0]) {
        activeStage = stage;
      }
    }

    // If all stages complete, activeStage is last stage
    if (!firstIncomplete && stages.length > 0) {
      activeStage = stages[stages.length - 1];
    }

    return {
      completedCount: completed,
      totalCount: total,
      nextRequiredAction: firstIncomplete,
      currentStage: activeStage,
    };
  }, [stages]);

  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const updateItemStatus = (itemId: string, status: MigrationItemStatus, data?: any) => {
    const updated = migrationService.updateItemStatus(projectId, itemId, status, data);
    setStages(updated);
  };

  const verifyContractDeployment = async (
    itemId: string,
    contractAddress: string
  ): Promise<{ success: boolean; message: string }> => {
    const result = await migrationService.verifyContractDeployment(projectId, itemId, contractAddress);
    if (result.success) {
      refresh();
    }
    return result;
  };

  return {
    stages,
    currentStage,
    completedCount,
    totalCount,
    progressPercent,
    nextRequiredAction,
    updateItemStatus,
    verifyContractDeployment,
    refresh,
  };
}
