import { db } from './index.ts';
import { quests, questParticipations } from './schema.ts';
import { eq, and, desc } from 'drizzle-orm';
import crypto from 'node:crypto';

export async function createQuestInDb(data: {
  id?: string;
  projectId: string;
  title: string;
  description: string;
  instructions?: string;
  questType?: string;
  rewardConfiguration?: any;
  publicationStatus?: string;
}) {
  const questId = data.id || `quest_${crypto.randomUUID()}`;
  try {
    const [row] = await db
      .insert(quests)
      .values({
        id: questId,
        projectId: data.projectId,
        title: data.title,
        description: data.description,
        instructions: data.instructions || null,
        questType: data.questType || 'COMMUNITY',
        rewardConfiguration: data.rewardConfiguration ? JSON.stringify(data.rewardConfiguration) : null,
        publicationStatus: data.publicationStatus || 'PUBLISHED',
      })
      .returning();
    return formatQuestRow(row);
  } catch (error) {
    console.error('Failed to create quest in Cloud SQL:', error);
    throw new Error('Failed to create quest.', { cause: error });
  }
}

export async function getAllQuestsFromDb(onlyPublished = true) {
  try {
    let rows;
    if (onlyPublished) {
      rows = await db.select().from(quests).where(eq(quests.publicationStatus, 'PUBLISHED')).orderBy(desc(quests.createdAt));
    } else {
      rows = await db.select().from(quests).orderBy(desc(quests.createdAt));
    }
    return rows.map(formatQuestRow);
  } catch (error) {
    console.error('Failed to query quests from Cloud SQL:', error);
    return [];
  }
}

export async function getQuestsByProjectFromDb(projectId: string) {
  try {
    const rows = await db.select().from(quests).where(eq(quests.projectId, projectId)).orderBy(desc(quests.createdAt));
    return rows.map(formatQuestRow);
  } catch (error) {
    console.error('Failed to query quests by project:', error);
    return [];
  }
}

export async function updateQuestStatusInDb(id: string, publicationStatus: string) {
  try {
    const [row] = await db
      .update(quests)
      .set({ publicationStatus, updatedAt: new Date() })
      .where(eq(quests.id, id))
      .returning();
    return row ? formatQuestRow(row) : null;
  } catch (error) {
    console.error('Failed to update quest status in Cloud SQL:', error);
    throw new Error('Failed to update quest status.', { cause: error });
  }
}

export async function participateInQuestInDb(questId: string, userId: string, proof?: string) {
  try {
    const existing = await db
      .select()
      .from(questParticipations)
      .where(and(eq(questParticipations.questId, questId), eq(questParticipations.userId, userId)))
      .limit(1);

    if (existing.length > 0) {
      const [updated] = await db
        .update(questParticipations)
        .set({
          submissionProof: proof || existing[0].submissionProof,
          completionStatus: proof ? 'PENDING_VERIFICATION' : existing[0].completionStatus,
        })
        .where(eq(questParticipations.id, existing[0].id))
        .returning();
      return updated;
    }

    const [created] = await db
      .insert(questParticipations)
      .values({
        id: `qp_${crypto.randomUUID()}`,
        questId,
        userId,
        participationStatus: 'IN_PROGRESS',
        completionStatus: proof ? 'PENDING_VERIFICATION' : 'NOT_STARTED',
        submissionProof: proof || null,
      })
      .returning();
    return created;
  } catch (error) {
    console.error('Failed to participate in quest:', error);
    throw new Error('Failed to record quest participation.', { cause: error });
  }
}

export async function getUserQuestsFromDb(userId: string) {
  try {
    const rows = await db
      .select()
      .from(questParticipations)
      .where(eq(questParticipations.userId, userId));
    return rows;
  } catch (error) {
    console.error('Failed to query user quests:', error);
    return [];
  }
}

function formatQuestRow(row: any) {
  return {
    ...row,
    rewardConfiguration: row.rewardConfiguration ? safeParseJson(row.rewardConfiguration) : { points: 100, xp: 50 },
    createdAt: row.createdAt ? new Date(row.createdAt).toISOString() : new Date().toISOString(),
    updatedAt: row.updatedAt ? new Date(row.updatedAt).toISOString() : new Date().toISOString(),
  };
}

function safeParseJson(str: string) {
  try {
    return JSON.parse(str);
  } catch {
    return str;
  }
}
