import { db } from './index.ts';
import {
  projects,
  projectMembers,
  quests,
  questParticipations,
  projectFollows,
  savedProjects,
  savedQuests,
  contentReports,
  auditLogs,
} from './schema.ts';
import { eq, and, desc } from 'drizzle-orm';
import crypto from 'node:crypto';

export async function createProjectInDb(data: {
  id?: string;
  name: string;
  slug: string;
  category: string;
  shortDescription: string;
  description: string;
  websiteUrl: string;
  documentationUrl?: string;
  logoUrl?: string;
  bannerUrl?: string;
  socialLinks?: Record<string, string>;
  contractAddresses?: string[];
  supportingInfo?: string;
  ecosystem?: string;
  verificationStatus?: string;
  ownerUserId: string;
}) {
  const projectId = data.id || `proj_${crypto.randomUUID()}`;
  try {
    const [newProj] = await db
      .insert(projects)
      .values({
        id: projectId,
        name: data.name,
        slug: data.slug,
        category: data.category,
        shortDescription: data.shortDescription,
        description: data.description,
        websiteUrl: data.websiteUrl,
        documentationUrl: data.documentationUrl || null,
        logoUrl: data.logoUrl || null,
        bannerUrl: data.bannerUrl || null,
        socialLinks: data.socialLinks ? JSON.stringify(data.socialLinks) : null,
        contractAddresses: data.contractAddresses ? JSON.stringify(data.contractAddresses) : null,
        supportingInfo: data.supportingInfo || null,
        ecosystem: data.ecosystem || 'Elysium',
        verificationStatus: data.verificationStatus || 'PENDING_REVIEW',
      })
      .returning();

    // Add owner membership
    await db.insert(projectMembers).values({
      id: `pm_${crypto.randomUUID()}`,
      projectId,
      userId: data.ownerUserId,
      role: 'OWNER',
    });

    return newProj;
  } catch (error) {
    console.error('Failed to create project in Cloud SQL:', error);
    throw new Error('Failed to create project in database.', { cause: error });
  }
}

export async function getAllProjectsFromDb(onlyVerified = true) {
  try {
    let rows;
    if (onlyVerified) {
      rows = await db.select().from(projects).where(eq(projects.verificationStatus, 'VERIFIED')).orderBy(desc(projects.createdAt));
    } else {
      rows = await db.select().from(projects).orderBy(desc(projects.createdAt));
    }
    return rows.map(formatProjectRow);
  } catch (error) {
    console.error('Failed to query projects from Cloud SQL:', error);
    return [];
  }
}

export async function getProjectByIdFromDb(id: string) {
  try {
    const rows = await db.select().from(projects).where(eq(projects.id, id)).limit(1);
    return rows[0] ? formatProjectRow(rows[0]) : null;
  } catch (error) {
    console.error('Failed to query project by id:', error);
    return null;
  }
}

export async function getUserProjectsFromDb(userId: string) {
  try {
    const memberships = await db
      .select()
      .from(projectMembers)
      .where(eq(projectMembers.userId, userId));

    if (memberships.length === 0) return [];

    const projectIds = memberships.map((m) => m.projectId);
    const results = [];
    for (const pid of projectIds) {
      const p = await getProjectByIdFromDb(pid);
      if (p) {
        const membership = memberships.find((m) => m.projectId === pid);
        results.push({ ...p, myMembershipRole: membership?.role || 'MEMBER' });
      }
    }
    return results;
  } catch (error) {
    console.error('Failed to query user projects:', error);
    return [];
  }
}

export async function updateProjectStatusInDb(id: string, status: string) {
  try {
    const [updated] = await db
      .update(projects)
      .set({ verificationStatus: status, updatedAt: new Date() })
      .where(eq(projects.id, id))
      .returning();
    return updated ? formatProjectRow(updated) : null;
  } catch (error) {
    console.error('Failed to update project status:', error);
    throw new Error('Failed to update project status in Cloud SQL.', { cause: error });
  }
}

function formatProjectRow(row: any) {
  return {
    ...row,
    socialLinks: row.socialLinks ? safeParseJson(row.socialLinks) : {},
    contractAddresses: row.contractAddresses ? safeParseJson(row.contractAddresses) : [],
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
