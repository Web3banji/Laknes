/**
 * LAKNES Centralized API Client
 * Type-safe HTTP client providing access to all backend operations for future UI integration.
 */

import { ApiResponse } from '../types/api.ts';
import {
  Project,
  ProjectMembership,
  ProjectMemberWithUser,
  ProjectUpdate,
  Quest,
  QuestParticipation,
  User,
  PublicUserProfile,
  ProjectReview,
  ContentReport,
  AuditLog,
  ProjectAnalytics,
  ProjectDashboardData,
  UserRole,
  MembershipRole,
  PublicationStatus,
  ContentReportStatus,
  CreatorApplication,
  PartnershipRequest,
  CreatorCampaign,
  CreatorCampaignSubmission,
  CreatorCampaignLeaderboardResponse,
} from '../types/contracts.ts';
import {
  SubmitProjectRequest,
  UpdateProjectRequest,
  SubmitProjectCorrectionsRequest,
  CreateProjectUpdateRequest,
  UpdateProjectUpdateRequest,
  CreateQuestRequest,
  SubmitContentReportRequest,
  ProjectSearchFilters,
  SystemStatusResponse,
} from '../types/api.ts';
import { AppError } from '../core/errors.ts';

export class LaknesApiClient {
  private baseUrl: string;
  private token: string | null = null;

  constructor(baseUrl = '') {
    this.baseUrl = baseUrl;
  }

  setToken(token: string | null) {
    this.token = token;
  }

  getToken(): string | null {
    return this.token;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers,
    });

    const body: ApiResponse<T> = await response.json().catch(() => ({
      success: false,
      error: { code: 'NETWORK_ERROR', message: `HTTP status ${response.status}` },
      meta: { timestamp: new Date().toISOString() },
    }));

    if (!response.ok || !body.success) {
      const err = body.error || { code: 'UNKNOWN_ERROR', message: 'Request failed.' };
      throw new AppError(err.message, response.status, err.code, err.details);
    }

    return body.data as T;
  }

  // System
  async getSystemStatus(): Promise<SystemStatusResponse> {
    return this.request<SystemStatusResponse>('/api/system/status');
  }

  async getHealth(): Promise<{ status: string; database: string }> {
    return this.request<{ status: string; database: string }>('/api/system/health');
  }

  // Authentication
  async register(payload: { username: string; email: string; password?: string; bio?: string; accountType?: 'user' | 'project' }) {
    return this.request<{ token: string; user: User }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async login(credentials: { email: string; password?: string }) {
    return this.request<{ token: string; user: User }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  }

  async getCurrentUser(): Promise<User> {
    return this.request<User>('/api/auth/me');
  }

  async logout(): Promise<void> {
    await this.request<void>('/api/auth/logout', { method: 'POST' });
    this.token = null;
  }

  async requestPasswordReset(email: string) {
    return this.request<{ resetToken: string; message: string }>('/api/auth/password-reset/request', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  async confirmPasswordReset(resetToken: string, newPassword: string) {
    return this.request<{ message: string }>('/api/auth/password-reset/confirm', {
      method: 'POST',
      body: JSON.stringify({ resetToken, newPassword }),
    });
  }

  async changePassword(currentPassword: string, newPassword: string) {
    return this.request<{ message: string }>('/api/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword }),
    });
  }

  async authenticateWithGoogle(payload: {
    credential?: string;
    email?: string;
    name?: string;
    picture?: string;
    accountType?: 'user' | 'project';
  }) {
    return this.request<{ token: string; user: User }>('/api/auth/google', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async getGoogleConfig() {
    return this.request<{ clientId: string; isConfigured: boolean }>('/api/auth/google/config');
  }

  async grantRole(targetUserId: string, role: UserRole) {
    return this.request<User>('/api/auth/grant-role', {
      method: 'POST',
      body: JSON.stringify({ targetUserId, role }),
    });
  }

  // Users
  async getPublicProfile(id: string): Promise<PublicUserProfile> {
    return this.request<PublicUserProfile>(`/api/users/${id}/public`);
  }

  async getUserProfile(id: string): Promise<User> {
    return this.request<User>(`/api/users/${id}`);
  }

  async updateUserProfile(id: string, updates: Partial<User>): Promise<User> {
    return this.request<User>(`/api/users/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  }

  async getUserFollows(id: string): Promise<Project[]> {
    return this.request<Project[]>(`/api/users/${id}/follows`);
  }

  async getUserProjects(id: string): Promise<Array<Project & { myMembershipRole?: string }>> {
    return this.request<Array<Project & { myMembershipRole?: string }>>(`/api/users/${id}/projects`);
  }

  async getUserSavedProjects(id: string): Promise<Project[]> {
    return this.request<Project[]>(`/api/users/${id}/saved`);
  }

  async getFollowingFeed(id: string): Promise<Array<ProjectUpdate & { project: Partial<Project> }>> {
    return this.request<Array<ProjectUpdate & { project: Partial<Project> }>>(`/api/users/${id}/following-feed`);
  }

  // Projects
  async discoverProjects(filters: ProjectSearchFilters = {}): Promise<Project[]> {
    const params = new URLSearchParams();
    if (filters.query) params.set('query', filters.query);
    if (filters.category) params.set('category', filters.category);
    if (filters.ecosystem) params.set('ecosystem', filters.ecosystem);
    if (filters.verificationStatus) params.set('verificationStatus', filters.verificationStatus);
    if (filters.page) params.set('page', String(filters.page));
    if (filters.limit) params.set('limit', String(filters.limit));

    const qs = params.toString();
    return this.request<Project[]>(`/api/projects/discover${qs ? `?${qs}` : ''}`);
  }

  async getProjectById(id: string): Promise<Project> {
    return this.request<Project>(`/api/projects/${id}`);
  }

  async getProjectBySlug(slug: string): Promise<Project> {
    return this.request<Project>(`/api/projects/slug/${slug}`);
  }

  async submitProject(request: SubmitProjectRequest): Promise<Project> {
    return this.request<Project>('/api/projects/submit', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async updateProject(id: string, request: UpdateProjectRequest): Promise<Project> {
    return this.request<Project>(`/api/projects/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(request),
    });
  }

  async submitCorrections(id: string, correctionsNotes: string, updatedFields?: UpdateProjectRequest): Promise<Project> {
    return this.request<Project>(`/api/projects/${id}/corrections`, {
      method: 'POST',
      body: JSON.stringify({ correctionsNotes, updatedFields }),
    });
  }

  async getProjectDashboard(id: string): Promise<ProjectDashboardData> {
    return this.request<ProjectDashboardData>(`/api/projects/${id}/dashboard`);
  }

  async getProjectMembers(id: string): Promise<ProjectMemberWithUser[]> {
    return this.request<ProjectMemberWithUser[]>(`/api/projects/${id}/members`);
  }

  async inviteMember(id: string, userEmailOrUsername: string, role: MembershipRole): Promise<ProjectMembership> {
    return this.request<ProjectMembership>(`/api/projects/${id}/members/invite`, {
      method: 'POST',
      body: JSON.stringify({ userEmailOrUsername, role }),
    });
  }

  async removeMember(id: string, userId: string): Promise<{ removed: boolean }> {
    return this.request<{ removed: boolean }>(`/api/projects/${id}/members/${userId}`, {
      method: 'DELETE',
    });
  }

  async getProjectAnalytics(id: string): Promise<ProjectAnalytics> {
    return this.request<ProjectAnalytics>(`/api/projects/${id}/analytics`);
  }

  async followProject(id: string): Promise<{ following: boolean }> {
    return this.request<{ following: boolean }>(`/api/projects/${id}/follow`, { method: 'POST' });
  }

  async unfollowProject(id: string): Promise<{ following: boolean }> {
    return this.request<{ following: boolean }>(`/api/projects/${id}/follow`, { method: 'DELETE' });
  }

  async saveProject(id: string): Promise<{ saved: boolean }> {
    return this.request<{ saved: boolean }>(`/api/projects/${id}/save`, { method: 'POST' });
  }

  async unsaveProject(id: string): Promise<{ saved: boolean }> {
    return this.request<{ saved: boolean }>(`/api/projects/${id}/save`, { method: 'DELETE' });
  }

  // Updates
  async getProjectUpdates(projectId: string): Promise<ProjectUpdate[]> {
    return this.request<ProjectUpdate[]>(`/api/projects/${projectId}/updates`);
  }

  async createProjectUpdate(projectId: string, request: CreateProjectUpdateRequest): Promise<ProjectUpdate> {
    return this.request<ProjectUpdate>(`/api/projects/${projectId}/updates`, {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async editProjectUpdate(
    projectId: string,
    updateId: string,
    request: UpdateProjectUpdateRequest
  ): Promise<ProjectUpdate> {
    return this.request<ProjectUpdate>(`/api/projects/${projectId}/updates/${updateId}`, {
      method: 'PATCH',
      body: JSON.stringify(request),
    });
  }

  async publishProjectUpdate(
    projectId: string,
    updateId: string,
    publicationStatus: PublicationStatus = PublicationStatus.PUBLISHED
  ): Promise<ProjectUpdate> {
    return this.request<ProjectUpdate>(`/api/projects/${projectId}/updates/${updateId}/publish`, {
      method: 'POST',
      body: JSON.stringify({ publicationStatus }),
    });
  }

  // Quests
  async getActiveQuests(): Promise<Quest[]> {
    return this.request<Quest[]>('/api/quests');
  }

  async getQuestById(id: string): Promise<Quest> {
    return this.request<Quest>(`/api/quests/${id}`);
  }

  async getProjectQuests(projectId: string): Promise<Quest[]> {
    return this.request<Quest[]>(`/api/projects/${projectId}/quests`);
  }

  async createQuest(projectId: string, request: CreateQuestRequest): Promise<Quest> {
    return this.request<Quest>(`/api/projects/${projectId}/quests`, {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async joinQuest(questId: string): Promise<QuestParticipation> {
    return this.request<QuestParticipation>(`/api/quests/${questId}/join`, { method: 'POST' });
  }

  async submitQuestProof(questId: string, proof: string): Promise<QuestParticipation> {
    return this.request<QuestParticipation>(`/api/quests/${questId}/submit`, {
      method: 'POST',
      body: JSON.stringify({ submissionProof: proof }),
    });
  }

  async verifyQuest(
    questId: string,
    decision: 'APPROVE' | 'REJECT',
    verificationNotes?: string
  ): Promise<QuestParticipation> {
    return this.request<QuestParticipation>(`/api/quests/${questId}/verify`, {
      method: 'POST',
      body: JSON.stringify({ decision, verificationNotes }),
    });
  }

  async saveQuest(questId: string): Promise<{ saved: boolean }> {
    return this.request<{ saved: boolean }>(`/api/quests/${questId}/save`, { method: 'POST' });
  }

  async unsaveQuest(questId: string): Promise<{ saved: boolean }> {
    return this.request<{ saved: boolean }>(`/api/quests/${questId}/save`, { method: 'DELETE' });
  }

  async getUserSavedQuests(userId: string): Promise<Quest[]> {
    return this.request<Quest[]>(`/api/users/${userId}/saved-quests`);
  }

  async getFollowingQuests(userId: string): Promise<Quest[]> {
    return this.request<Quest[]>(`/api/users/${userId}/following-quests`);
  }

  // Admin Reviews
  async getPendingReviews(): Promise<ProjectReview[]> {
    return this.request<ProjectReview[]>('/api/reviews/pending');
  }

  async reviewProject(projectId: string, decision: string, reviewNotes: string): Promise<ProjectReview> {
    return this.request<ProjectReview>(`/api/reviews/project/${projectId}`, {
      method: 'POST',
      body: JSON.stringify({ decision, reviewNotes }),
    });
  }

  async getUserQuests(id: string): Promise<QuestParticipation[]> {
    return this.request<QuestParticipation[]>(`/api/users/${id}/quests`);
  }

  async updateProfile(id: string, updates: Partial<User>): Promise<User> {
    return this.updateUserProfile(id, updates);
  }

  async createProjectQuest(projectId: string, request: CreateQuestRequest): Promise<Quest> {
    return this.createQuest(projectId, request);
  }

  async resubmitProjectCorrections(id: string, request: { correctionsSummary: string }): Promise<Project> {
    return this.submitCorrections(id, request.correctionsSummary);
  }

  // Reports & Moderation
  async getContentReports(status?: ContentReportStatus): Promise<ContentReport[]> {
    const qs = status ? `?status=${status}` : '';
    return this.request<ContentReport[]>(`/api/admin/moderation${qs}`);
  }

  async resolveReport(reportId: string, status: ContentReportStatus): Promise<ContentReport> {
    return this.request<ContentReport>(`/api/admin/reports/${reportId}/resolve`, {
      method: 'POST',
      body: JSON.stringify({ status }),
    });
  }

  async submitReport(request: SubmitContentReportRequest): Promise<ContentReport> {
    return this.request<ContentReport>('/api/reports', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async getAuditLogs(): Promise<AuditLog[]> {
    return this.request<AuditLog[]>('/api/admin/audit-logs');
  }

  // Master Admin Clearance
  async adminMasterLogin(password: string): Promise<{ token: string; user: User }> {
    const res = await this.request<{ token: string; user: User }>('/api/auth/admin-master-login', {
      method: 'POST',
      body: JSON.stringify({ password }),
    });
    if (res.token) {
      this.setToken(res.token);
    }
    return res;
  }

  // Admin Quest Management & Submissions
  async getAdminPendingCompletions(): Promise<any[]> {
    return this.request<any[]>('/api/quests/admin/pending-completions');
  }

  async getAdminAllQuests(): Promise<any[]> {
    return this.request<any[]>('/api/quests/admin/all');
  }

  async updateQuestPublicationStatus(questId: string, publicationStatus: string): Promise<any> {
    return this.request<any>(`/api/quests/admin/${questId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ publicationStatus }),
    });
  }

  async verifyQuestParticipation(participationId: string, decision: 'APPROVE' | 'REJECT', notes?: string): Promise<any> {
    return this.request<any>(`/api/quests/${participationId}/verify`, {
      method: 'POST',
      body: JSON.stringify({ decision, verificationNotes: notes }),
    });
  }

  async getAdminProjects(status?: string): Promise<Project[]> {
    const qs = status ? `?status=${encodeURIComponent(status)}` : '';
    return this.request<Project[]>(`/api/admin/projects${qs}`);
  }

  // Creator Studio & Partnerships
  async getMyCreatorApplication(): Promise<CreatorApplication | { status: 'NOT_APPLIED' }> {
    return this.request<CreatorApplication | { status: 'NOT_APPLIED' }>('/api/creators/me/application');
  }

  async applyForCreatorStudio(payload: {
    creatorName: string;
    socialLinks: Record<string, string>;
    contentNiche: string;
    audienceInfo?: string;
    portfolioLinks: string[];
    strengthsDescription: string;
  }): Promise<CreatorApplication> {
    return this.request<CreatorApplication>('/api/creators/apply', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async getCreatorCampaigns(): Promise<CreatorCampaign[]> {
    return this.request<CreatorCampaign[]>('/api/creators/campaigns');
  }

  async getCampaignLeaderboard(campaignId: string): Promise<CreatorCampaignLeaderboardResponse> {
    return this.request<CreatorCampaignLeaderboardResponse>(`/api/creators/campaigns/${campaignId}/leaderboard`);
  }

  async submitCampaignContent(
    campaignId: string,
    payload: { postUrl?: string; submissionLinks?: string[]; proofNotes?: string }
  ): Promise<CreatorCampaignSubmission & { dailyNotice?: string }> {
    return this.request<CreatorCampaignSubmission & { dailyNotice?: string }>(`/api/creators/campaigns/${campaignId}/submit`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async getMyCampaignSubmissions(): Promise<CreatorCampaignSubmission[]> {
    return this.request<CreatorCampaignSubmission[]>('/api/creators/me/submissions');
  }

  async submitPartnershipRequest(payload: {
    projectName: string;
    contactInfo: string;
    campaignObjective: string;
    requestedService: string;
    budgetRange: string;
    relevantLinks?: string;
  }): Promise<PartnershipRequest> {
    return this.request<PartnershipRequest>('/api/creators/partnerships', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async getMyPartnershipRequests(): Promise<PartnershipRequest[]> {
    return this.request<PartnershipRequest[]>('/api/creators/partnerships/my');
  }

  // Admin Creator Studio Management
  async getAdminCreatorApplications(status?: string): Promise<any[]> {
    const qs = status ? `?status=${encodeURIComponent(status)}` : '';
    return this.request<any[]>(`/api/creators/admin/applications${qs}`);
  }

  async reviewCreatorApplication(id: string, decision: 'APPROVED' | 'REJECTED', adminNotes?: string): Promise<any> {
    return this.request<any>(`/api/creators/admin/applications/${id}/review`, {
      method: 'POST',
      body: JSON.stringify({ decision, adminNotes }),
    });
  }

  async getAdminCampaigns(): Promise<CreatorCampaign[]> {
    return this.request<CreatorCampaign[]>('/api/creators/admin/campaigns');
  }

  async createAdminCampaign(payload: {
    title: string;
    brandProjectName: string;
    objective: string;
    deliverables: string;
    targetNiches: string[];
    rewardPool: string;
    rewardPerCreator: string;
    briefGuidelines: string;
    deadline?: string;
  }): Promise<CreatorCampaign> {
    return this.request<CreatorCampaign>('/api/creators/admin/campaigns', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async updateCampaignStatus(campaignId: string, status: string): Promise<any> {
    return this.request<any>(`/api/creators/admin/campaigns/${campaignId}`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  }

  async getAdminCampaignSubmissions(): Promise<any[]> {
    return this.request<any[]>('/api/creators/admin/submissions');
  }

  async reviewCampaignSubmission(
    submissionId: string,
    decision: 'APPROVED' | 'REVISION_REQUESTED' | 'REJECTED',
    feedback?: string,
    payoutAmount?: string
  ): Promise<any> {
    return this.request<any>(`/api/creators/admin/submissions/${submissionId}/review`, {
      method: 'POST',
      body: JSON.stringify({ decision, feedback, payoutAmount }),
    });
  }

  async getAdminPartnershipRequests(): Promise<PartnershipRequest[]> {
    return this.request<PartnershipRequest[]>('/api/creators/admin/partnerships');
  }

  async updatePartnershipStatus(id: string, status?: string, adminNotes?: string): Promise<any> {
    return this.request<any>(`/api/creators/admin/partnerships/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status, adminNotes }),
    });
  }
}

export const laknesClient = new LaknesApiClient();
