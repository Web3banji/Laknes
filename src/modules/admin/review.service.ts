/**
 * LAKNES Administrative Project Review Service
 * Protected administrative reviews, decisions, change requests, and review history.
 */

import {
  type ProjectReview,
  type EntityId,
  ReviewDecision,
  ProjectVerificationStatus,
  AuditAction,
  type Project,
} from '../../types/contracts.ts';
import type { PaginationParams } from '../../types/api.ts';
import type { SecurityUserContext } from '../../types/auth.ts';
import { getRepositories } from '../../dal/index.ts';
import type { PaginatedResult } from '../../dal/repositories.ts';
import { assertAdmin } from '../auth/permissions.ts';
import { NotFoundError, ValidationError } from '../../core/errors.ts';
import { sanitizeString } from '../../shared/validation.ts';

export interface IProjectReviewService {
  getPendingReviews(
    admin: SecurityUserContext,
    pagination?: PaginationParams
  ): Promise<PaginatedResult<ProjectReview & { project?: Project }>>;
  reviewProject(
    admin: SecurityUserContext,
    projectId: EntityId,
    decision: ReviewDecision,
    reviewNotes: string
  ): Promise<ProjectReview>;
  getProjectReviewHistory(
    actingUser: SecurityUserContext,
    projectId: EntityId
  ): Promise<ProjectReview[]>;
}

export class ProjectReviewService implements IProjectReviewService {
  async getPendingReviews(
    admin: SecurityUserContext,
    pagination?: PaginationParams
  ): Promise<PaginatedResult<ProjectReview & { project?: Project }>> {
    assertAdmin(admin);
    const repos = getRepositories();
    return await repos.reviews.findPending(pagination);
  }

  async reviewProject(
    admin: SecurityUserContext,
    projectId: EntityId,
    decision: ReviewDecision,
    reviewNotes: string
  ): Promise<ProjectReview> {
    assertAdmin(admin);

    if (!reviewNotes || reviewNotes.trim() === '') {
      throw new ValidationError('Review notes and reasoning are required for administrative decisions.');
    }

    const repos = getRepositories();
    const project = await repos.projects.findById(projectId);
    if (!project) {
      throw new NotFoundError('Project', projectId);
    }

    // Determine target verification status
    let nextStatus: ProjectVerificationStatus;
    if (decision === ReviewDecision.APPROVED) {
      nextStatus = ProjectVerificationStatus.VERIFIED;
    } else if (decision === ReviewDecision.CHANGES_REQUESTED || decision === ('REQUEST_CHANGES' as any)) {
      nextStatus = ProjectVerificationStatus.CHANGES_REQUESTED;
    } else if (decision === ReviewDecision.REJECTED) {
      nextStatus = ProjectVerificationStatus.REJECTED;
    } else {
      throw new ValidationError(`Unsupported review decision: ${decision}`);
    }

    // Update project verification status in the database
    await repos.projects.update(projectId, {
      verificationStatus: nextStatus,
    });

    // Create persistent review record
    const review = await repos.reviews.create({
      projectId,
      reviewerId: admin.id,
      decision,
      reviewNotes: sanitizeString(reviewNotes),
    });

    // Record immutable audit event
    await repos.auditLogs.create({
      actorId: admin.id,
      action: AuditAction.PROJECT_REVIEWED,
      targetType: 'PROJECT',
      targetId: projectId,
      details: {
        reviewerId: admin.id,
        decision,
        nextStatus,
        notes: reviewNotes.trim(),
      },
    });

    return review;
  }

  async getProjectReviewHistory(
    actingUser: SecurityUserContext,
    projectId: EntityId
  ): Promise<ProjectReview[]> {
    const repos = getRepositories();

    // Representatives of the project or administrators can view review history
    const membership = await repos.memberships.findByUserAndProject(actingUser.id, projectId);
    const isAdmin = actingUser.roles.includes('ADMIN' as any);

    if (!membership && !isAdmin) {
      throw new ValidationError('You do not have access to view this project review history.');
    }

    return await repos.reviews.findByProject(projectId);
  }
}

export const projectReviewService = new ProjectReviewService();
