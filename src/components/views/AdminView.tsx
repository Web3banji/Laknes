/**
 * LAKNES Administration & Master Verification Console
 * Private, unlisted management portal protected by Master Admin Password.
 * Handles:
 * - Project Submissions & Credentials Approval (Pending Review -> Verified)
 * - Quest Stacks & Community Task Publication Approvals
 * - Quest Completion Proof Verifications (Awarding Rewards)
 * - Community Moderation & Immutable Audit Trail
 */

import React, { useState, useEffect } from 'react';
import {
  Project,
  ReviewDecision,
  ContentReport,
  ContentReportStatus,
  AuditLog,
  User,
  UserRole,
  ProjectVerificationStatus,
  CreatorApplication,
  CreatorCampaign,
  CreatorCampaignSubmission,
  PartnershipRequest,
  PartnershipRequestStatus,
} from '../../types/contracts.ts';
import { laknesClient } from '../../client/api-client.ts';
import { StatusBadge } from '../common/StatusBadge.tsx';
import { BrandLogo } from '../common/BrandLogo.tsx';

interface AdminViewProps {
  user: User | null;
  onNavigate: (view: string) => void;
  onSelectProject: (project: Project) => void;
  onAdminAuthenticated?: (user: User, token?: string) => void;
}

export function AdminView({
  user,
  onNavigate,
  onSelectProject,
  onAdminAuthenticated,
}: AdminViewProps) {
  const [activeTab, setActiveTab] = useState<
    'projects' | 'quests' | 'creators' | 'campaigns' | 'partnerships' | 'moderation' | 'audit' | 'settings'
  >('projects');
  
  // Gatekeeper Password State (for when not signed in as admin)
  const [masterPasswordInput, setMasterPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [gatekeeperError, setGatekeeperError] = useState<string | null>(null);
  const [isUnlocking, setIsUnlocking] = useState(false);

  // Data States
  const [pendingProjects, setPendingProjects] = useState<Project[]>([]);
  const [allProjects, setAllProjects] = useState<Project[]>([]);
  const [projectSubTab, setProjectSubTab] = useState<'pending' | 'all'>('pending');
  const [projectStatusFilter, setProjectStatusFilter] = useState<string>('ALL');
  const [projectSearchQuery, setProjectSearchQuery] = useState('');
  const [pendingCompletions, setPendingCompletions] = useState<any[]>([]);
  const [allQuests, setAllQuests] = useState<any[]>([]);
  const [reports, setReports] = useState<ContentReport[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

  // Creator Studio & Partnerships Data States
  const [creatorApplications, setCreatorApplications] = useState<CreatorApplication[]>([]);
  const [creatorSubmissions, setCreatorSubmissions] = useState<CreatorCampaignSubmission[]>([]);
  const [adminCampaigns, setAdminCampaigns] = useState<CreatorCampaign[]>([]);
  const [adminPartnerships, setAdminPartnerships] = useState<PartnershipRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Review Dialog State (Projects)
  const [selectedReviewProject, setSelectedReviewProject] = useState<Project | null>(null);
  const [reviewDecision, setReviewDecision] = useState<ReviewDecision>(ReviewDecision.APPROVED);
  const [reviewNotes, setReviewNotes] = useState('Official verification awarded. Contracts and documentation confirmed.');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);
  const [copiedContract, setCopiedContract] = useState<string | null>(null);

  // Creator Applications Review Dialog State
  const [selectedCreatorApp, setSelectedCreatorApp] = useState<CreatorApplication | null>(null);
  const [creatorAppDecision, setCreatorAppDecision] = useState<'APPROVED' | 'REJECTED'>('APPROVED');
  const [creatorAppNotes, setCreatorAppNotes] = useState('Approved for Creator Studio access and campaign opportunities.');
  const [isReviewingApp, setIsReviewingApp] = useState(false);

  // Creator Submissions Review Dialog State
  const [selectedCreatorSubmission, setSelectedCreatorSubmission] = useState<CreatorCampaignSubmission | null>(null);
  const [creatorSubDecision, setCreatorSubDecision] = useState<'APPROVED' | 'REVISION_REQUESTED' | 'REJECTED'>('APPROVED');
  const [creatorSubNotes, setCreatorSubNotes] = useState('Content meets high editorial standards. Reward payout awarded.');
  const [isReviewingSub, setIsReviewingSub] = useState(false);

  // New Campaign Form State
  const [isCreateCampaignModalOpen, setIsCreateCampaignModalOpen] = useState(false);
  const [newCampaignTitle, setNewCampaignTitle] = useState('');
  const [newCampaignPartner, setNewCampaignPartner] = useState('');
  const [newCampaignBrief, setNewCampaignBrief] = useState('');
  const [newCampaignDeliverables, setNewCampaignDeliverables] = useState('');
  const [newCampaignPayout, setNewCampaignPayout] = useState('250');
  const [newCampaignRewardPool, setNewCampaignRewardPool] = useState('2,500');
  const [newCampaignAsset, setNewCampaignAsset] = useState('USDC');
  const [newCampaignDeadline, setNewCampaignDeadline] = useState('In 14 days');
  const [isCreatingCampaign, setIsCreatingCampaign] = useState(false);

  // Partnership Review State
  const [selectedPartnership, setSelectedPartnership] = useState<PartnershipRequest | null>(null);
  const [partnershipStatusChoice, setPartnershipStatusChoice] = useState<PartnershipRequestStatus>('CONTACTED');
  const [partnershipAdminNotes, setPartnershipAdminNotes] = useState('Proposal reviewed by LAKNES team.');
  const [isUpdatingPartnership, setIsUpdatingPartnership] = useState(false);

  // Quest Verification Dialog State
  const [selectedCompletion, setSelectedCompletion] = useState<any | null>(null);
  const [questVerifyDecision, setQuestVerifyDecision] = useState<'APPROVE' | 'REJECT'>('APPROVE');
  const [questVerifyNotes, setQuestVerifyNotes] = useState('Verified proof of completion.');
  const [isVerifyingQuest, setIsVerifyingQuest] = useState(false);

  // Settings State
  const [newAdminPassword, setNewAdminPassword] = useState('');
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [passwordUpdateMsg, setPasswordUpdateMsg] = useState<string | null>(null);

  const isAdmin = Boolean(user && user.roles.includes(UserRole.ADMIN));

  useEffect(() => {
    if (isAdmin) {
      loadAllAdminData();
    }
  }, [isAdmin]);

  const loadAllAdminData = async () => {
    setIsLoading(true);
    setActionFeedback(null);
    try {
      const [
        pendingReviews,
        registeredProjects,
        questCompletions,
        questList,
        reps,
        logs,
        creatorApps,
        creatorSubs,
        campaigns,
        partnerships,
      ] = await Promise.all([
        laknesClient.getPendingReviews().catch(() => []),
        laknesClient.getAdminProjects().catch(() => laknesClient.discoverProjects({ limit: 100 }).catch(() => [])),
        laknesClient.getAdminPendingCompletions().catch(() => []),
        laknesClient.getAdminAllQuests().catch(() => []),
        laknesClient.getContentReports(ContentReportStatus.PENDING).catch(() => []),
        laknesClient.getAuditLogs().catch(() => []),
        laknesClient.getAdminCreatorApplications().catch(() => []),
        laknesClient.getAdminCampaignSubmissions().catch(() => []),
        laknesClient.getAdminCampaigns().catch(() => []),
        laknesClient.getAdminPartnershipRequests().catch(() => []),
      ]);

      const projs: Project[] = (pendingReviews as any[])
        .map((r) => r.project || r)
        .filter((p) => Boolean(p && p.id && p.name));

      setPendingProjects(projs);
      setAllProjects(Array.isArray(registeredProjects) ? registeredProjects : []);
      setPendingCompletions(questCompletions || []);
      setAllQuests(questList || []);
      setReports(reps || []);
      setAuditLogs(logs || []);
      setCreatorApplications(Array.isArray(creatorApps) ? creatorApps : []);
      setCreatorSubmissions(Array.isArray(creatorSubs) ? creatorSubs : []);
      setAdminCampaigns(Array.isArray(campaigns) ? campaigns : []);
      setAdminPartnerships(Array.isArray(partnerships) ? partnerships : []);
    } catch (err) {
      console.error('Admin data load failed', err);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Unlock Admin Clearance via Master Password
   */
  const handleMasterPasswordUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!masterPasswordInput.trim()) {
      setGatekeeperError('Please enter the Admin Master Password.');
      return;
    }

    setIsUnlocking(true);
    setGatekeeperError(null);
    try {
      const res = await laknesClient.adminMasterLogin(masterPasswordInput.trim());
      if (res?.user) {
        if (onAdminAuthenticated) {
          onAdminAuthenticated(res.user, res.token);
        }
      }
    } catch (err: any) {
      setGatekeeperError(err?.message || 'Clearance Denied. Invalid Admin Master Password.');
    } finally {
      setIsUnlocking(false);
    }
  };

  /**
   * Execute Project Approval / Verification
   */
  const handleExecuteProjectReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReviewProject) return;

    setIsSubmittingReview(true);
    setActionFeedback(null);
    try {
      await laknesClient.reviewProject(selectedReviewProject.id, reviewDecision, reviewNotes.trim());
      setActionFeedback(`Decision recorded: ${selectedReviewProject.name} updated to ${reviewDecision}.`);
      setSelectedReviewProject(null);
      await loadAllAdminData();
    } catch (err: any) {
      setActionFeedback(`Review failed: ${err?.message}`);
    } finally {
      setIsSubmittingReview(false);
    }
  };

  /**
   * Execute Quest Completion Verification
   */
  const handleExecuteQuestVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCompletion) return;

    setIsVerifyingQuest(true);
    try {
      await laknesClient.verifyQuestParticipation(
        selectedCompletion.id,
        questVerifyDecision,
        questVerifyNotes.trim()
      );
      setActionFeedback(`Quest submission marked as ${questVerifyDecision}.`);
      setSelectedCompletion(null);
      await loadAllAdminData();
    } catch (err: any) {
      setActionFeedback(`Verification error: ${err?.message}`);
    } finally {
      setIsVerifyingQuest(false);
    }
  };

  /**
   * Update Quest Publication Status (Publish or Reject Quest Stack)
   */
  const handleUpdateQuestStatus = async (questId: string, status: string) => {
    try {
      await laknesClient.updateQuestPublicationStatus(questId, status);
      setActionFeedback(`Quest publication status updated to ${status}.`);
      await loadAllAdminData();
    } catch (err: any) {
      setActionFeedback(`Error updating quest status: ${err?.message}`);
    }
  };

  /**
   * Review Creator Application
   */
  const handleExecuteCreatorAppReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCreatorApp) return;

    setIsReviewingApp(true);
    try {
      await laknesClient.reviewCreatorApplication(selectedCreatorApp.id, creatorAppDecision, creatorAppNotes.trim());
      setActionFeedback(`Application for ${selectedCreatorApp.creatorName} updated to ${creatorAppDecision}.`);
      setSelectedCreatorApp(null);
      await loadAllAdminData();
    } catch (err: any) {
      setActionFeedback(`Error reviewing application: ${err?.message}`);
    } finally {
      setIsReviewingApp(false);
    }
  };

  /**
   * Review Creator Content Submission & Award Payout
   */
  const handleExecuteCreatorSubReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCreatorSubmission) return;

    setIsReviewingSub(true);
    try {
      await laknesClient.reviewCampaignSubmission(
        selectedCreatorSubmission.id,
        creatorSubDecision,
        creatorSubNotes.trim(),
        selectedCreatorSubmission.payoutAmount || '200 USDC'
      );
      setActionFeedback(
        `Submission marked as ${creatorSubDecision}. ${
          creatorSubDecision === 'APPROVED' ? `Payout awarded to creator.` : ''
        }`
      );
      setSelectedCreatorSubmission(null);
      await loadAllAdminData();
    } catch (err: any) {
      setActionFeedback(`Error reviewing submission: ${err?.message}`);
    } finally {
      setIsReviewingSub(false);
    }
  };

  /**
   * Create New Sponsored Creator Campaign
   */
  const handleExecuteCreateCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCampaignTitle.trim() || !newCampaignPartner.trim() || !newCampaignBrief.trim()) return;

    setIsCreatingCampaign(true);
    try {
      const parsedDeliverables = newCampaignDeliverables
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean);

      await laknesClient.createAdminCampaign({
        title: newCampaignTitle.trim(),
        brandProjectName: newCampaignPartner.trim(),
        objective: newCampaignBrief.trim(),
        deliverables: parsedDeliverables.join(' • ') || '1x in-depth review • 1x social post',
        targetNiches: ['DeFi', 'Infrastructure', 'Gaming', 'Tooling'],
        rewardPool: `${newCampaignRewardPool.trim()} ${newCampaignAsset.trim()}`,
        rewardPerCreator: `${newCampaignPayout} ${newCampaignAsset.trim()}`,
        briefGuidelines: newCampaignBrief.trim(),
        deadline: newCampaignDeadline.trim(),
      });

      setActionFeedback(`Campaign "${newCampaignTitle}" launched in Creator Studio!`);
      setIsCreateCampaignModalOpen(false);
      setNewCampaignTitle('');
      setNewCampaignPartner('');
      setNewCampaignBrief('');
      setNewCampaignDeliverables('');
      await loadAllAdminData();
    } catch (err: any) {
      setActionFeedback(`Error creating campaign: ${err?.message}`);
    } finally {
      setIsCreatingCampaign(false);
    }
  };

  /**
   * Update Project Partnership Request Status
   */
  const handleExecutePartnershipUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPartnership) return;

    setIsUpdatingPartnership(true);
    try {
      await laknesClient.updatePartnershipStatus(
        selectedPartnership.id,
        partnershipStatusChoice,
        partnershipAdminNotes.trim()
      );
      setActionFeedback(`Partnership request for ${selectedPartnership.projectName} marked as ${partnershipStatusChoice}.`);
      setSelectedPartnership(null);
      await loadAllAdminData();
    } catch (err: any) {
      setActionFeedback(`Error updating partnership: ${err?.message}`);
    } finally {
      setIsUpdatingPartnership(false);
    }
  };

  /**
   * Resolve Moderation Report
   */
  const handleResolveReport = async (reportId: string, status: ContentReportStatus) => {
    try {
      await laknesClient.resolveReport(reportId, status);
      await loadAllAdminData();
    } catch (err) {
      console.error('Resolve report error', err);
    }
  };

  /**
   * Update Admin Password
   */
  const handleUpdateAdminPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdminPassword || newAdminPassword.length < 8) {
      setPasswordUpdateMsg('Password must be at least 8 characters long.');
      return;
    }
    setIsUpdatingPassword(true);
    try {
      await laknesClient.changePassword('AdminElysium2026!', newAdminPassword);
      setPasswordUpdateMsg('Admin password updated successfully.');
      setNewAdminPassword('');
    } catch (err: any) {
      setPasswordUpdateMsg(`Update note: ${err?.message || 'Password updated in session.'}`);
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  // =========================================================================
  // GATEKEEPER VIEW: If not authenticated as Admin, show Restricted Password Gate
  // =========================================================================
  if (!isAdmin) {
    return (
      <div className="w-full min-h-[calc(100vh-140px)] flex flex-col items-center justify-center px-6 py-16 text-center bg-background text-on-surface">
        <div className="w-16 h-16 rounded-2xl bg-surface-container-high border border-outline-variant/30 flex items-center justify-center text-on-surface-variant mb-4">
          <span className="material-symbols-outlined text-[32px]">shield</span>
        </div>
        <h2 className="text-xl font-bold text-on-surface mb-2">Access Restricted</h2>
        <p className="text-sm text-on-surface-variant max-w-sm mb-6 leading-relaxed">
          The requested page is not accessible. Please return to the ecosystem explorer.
        </p>
        <button
          onClick={() => onNavigate('explore')}
          className="px-5 py-2.5 rounded-xl bg-primary-container text-on-primary-container text-xs font-bold hover:brightness-110 transition-all cursor-pointer shadow-md"
        >
          Return to Explore
        </button>
      </div>
    );
  }

  // =========================================================================
  // MAIN ADMIN CONSOLE (Authenticated)
  // =========================================================================
  return (
    <div className="w-full max-w-[1440px] mx-auto px-margin-mobile lg:px-margin py-space-xl">
      {/* Admin Top Header Bar */}
      <div className="p-6 rounded-3xl bg-[#0a1310] border border-amber-500/40 shadow-[0_0_50px_rgba(212,163,39,0.15)] mb-8 relative overflow-hidden">
        <div className="pointer-events-none absolute -right-20 -top-20 w-80 h-80 bg-primary-container/10 blur-[90px] rounded-full"></div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/15 border border-amber-500/40 flex items-center justify-center text-primary shadow-inner shrink-0">
              <BrandLogo size={36} showText={false} />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="font-mono text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-amber-500/15 text-primary border border-amber-500/30">
                  Master Protocol Administrator
                </span>
                <span className="font-mono text-[10px] text-emerald-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  Active Clearance
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                Elysium Foundation Administration Center
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => loadAllAdminData()}
              className="px-4 py-2 rounded-full bg-surface-container hover:bg-surface-container-high border border-slate-700 text-xs text-slate-300 font-mono flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">refresh</span>
              <span>Sync Telemetry</span>
            </button>
            <button
              onClick={() => onNavigate('explore')}
              className="px-4 py-2 rounded-full bg-slate-900 hover:bg-slate-800 text-xs text-slate-300 border border-slate-700 transition-colors cursor-pointer"
            >
              View Public Site
            </button>
          </div>
        </div>
      </div>

      {/* Action Feedback Banner */}
      {actionFeedback && (
        <div className="mb-6 p-4 rounded-2xl bg-emerald-950/40 border border-emerald-700/60 text-emerald-300 text-xs flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">verified</span>
            <span>{actionFeedback}</span>
          </div>
          <button
            onClick={() => setActionFeedback(null)}
            className="text-emerald-400 hover:text-white"
          >
            <span className="material-symbols-outlined text-[16px]">close</span>
          </button>
        </div>
      )}

      {/* Admin Navigation Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-6 border-b border-slate-800/80">
        <button
          onClick={() => setActiveTab('projects')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'projects'
              ? 'bg-primary-container text-on-primary-container shadow-md font-bold'
              : 'text-slate-400 hover:text-white hover:bg-surface-container'
          }`}
        >
          <span className="material-symbols-outlined text-[16px]">domain_verification</span>
          <span>Project Registrations</span>
          {pendingProjects.length > 0 && (
            <span className="px-1.5 py-0.2 rounded-full bg-amber-400 text-black text-[10px] font-mono font-bold">
              {pendingProjects.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('quests')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'quests'
              ? 'bg-primary-container text-on-primary-container shadow-md font-bold'
              : 'text-slate-400 hover:text-white hover:bg-surface-container'
          }`}
        >
          <span className="material-symbols-outlined text-[16px]">task_alt</span>
          <span>Quest Stacks & Approvals</span>
          {pendingCompletions.length > 0 && (
            <span className="px-1.5 py-0.2 rounded-full bg-emerald-400 text-black text-[10px] font-mono font-bold">
              {pendingCompletions.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('creators')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'creators'
              ? 'bg-primary-container text-on-primary-container shadow-md font-bold'
              : 'text-slate-400 hover:text-white hover:bg-surface-container'
          }`}
        >
          <span className="material-symbols-outlined text-[16px]">group</span>
          <span>Creator Network & Submissions</span>
          {creatorApplications.filter((a) => a.status === 'PENDING').length > 0 && (
            <span className="px-1.5 py-0.2 rounded-full bg-amber-400 text-black text-[10px] font-mono font-bold">
              {creatorApplications.filter((a) => a.status === 'PENDING').length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('campaigns')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'campaigns'
              ? 'bg-primary-container text-on-primary-container shadow-md font-bold'
              : 'text-slate-400 hover:text-white hover:bg-surface-container'
          }`}
        >
          <span className="material-symbols-outlined text-[16px]">campaign</span>
          <span>Sponsored Campaigns</span>
          <span className="px-1.5 py-0.2 rounded-full bg-surface-container-high text-primary text-[10px] font-mono">
            {adminCampaigns.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('partnerships')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'partnerships'
              ? 'bg-primary-container text-on-primary-container shadow-md font-bold'
              : 'text-slate-400 hover:text-white hover:bg-surface-container'
          }`}
        >
          <span className="material-symbols-outlined text-[16px]">handshake</span>
          <span>Project Partnerships</span>
          {adminPartnerships.filter((p) => p.status === 'PENDING').length > 0 && (
            <span className="px-1.5 py-0.2 rounded-full bg-cyan-400 text-black text-[10px] font-mono font-bold">
              {adminPartnerships.filter((p) => p.status === 'PENDING').length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('moderation')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'moderation'
              ? 'bg-primary-container text-on-primary-container shadow-md font-bold'
              : 'text-slate-400 hover:text-white hover:bg-surface-container'
          }`}
        >
          <span className="material-symbols-outlined text-[16px]">shield</span>
          <span>Reports ({reports.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('audit')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'audit'
              ? 'bg-primary-container text-on-primary-container shadow-md font-bold'
              : 'text-slate-400 hover:text-white hover:bg-surface-container'
          }`}
        >
          <span className="material-symbols-outlined text-[16px]">history</span>
          <span>Audit Log</span>
        </button>

        <button
          onClick={() => setActiveTab('settings')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'settings'
              ? 'bg-primary-container text-on-primary-container shadow-md font-bold'
              : 'text-slate-400 hover:text-white hover:bg-surface-container'
          }`}
        >
          <span className="material-symbols-outlined text-[16px]">key</span>
          <span>Credentials</span>
        </button>
      </div>

      {/* ===================================================================== */}
      {/* 1. PROJECT REGISTRATIONS & VERIFICATION TAB */}
      {/* ===================================================================== */}
      {activeTab === 'projects' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight">
                Project Verification & Review Queue
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Review submitted project credentials, cross-check onchain data, and approve legitimate ecosystem protocols.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 rounded-full bg-[#101c17] border border-amber-500/30 text-primary text-xs font-mono">
                {pendingProjects.length} Pending Review
              </span>
              <span className="px-3 py-1 rounded-full bg-[#101c17] border border-slate-800 text-slate-400 text-xs font-mono">
                {allProjects.length} Total Registered
              </span>
            </div>
          </div>

          {/* Sub-tabs & Search Controls */}
          <div className="p-4 rounded-2xl bg-[#0a1310] border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setProjectSubTab('pending')}
                className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                  projectSubTab === 'pending'
                    ? 'bg-primary-container text-on-primary-container font-bold shadow-md'
                    : 'text-slate-400 hover:text-white hover:bg-surface-container'
                }`}
              >
                <span className="material-symbols-outlined text-[15px]">pending_actions</span>
                <span>Pending Review ({pendingProjects.length})</span>
              </button>
              <button
                type="button"
                onClick={() => setProjectSubTab('all')}
                className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                  projectSubTab === 'all'
                    ? 'bg-primary-container text-on-primary-container font-bold shadow-md'
                    : 'text-slate-400 hover:text-white hover:bg-surface-container'
                }`}
              >
                <span className="material-symbols-outlined text-[15px]">dataset</span>
                <span>All Ecosystem Projects ({allProjects.length})</span>
              </button>
            </div>

            {/* Search Input */}
            <div className="flex items-center gap-2 flex-1 max-w-sm">
              <div className="relative w-full">
                <span className="material-symbols-outlined absolute left-3 top-2.5 text-slate-500 text-[16px]">
                  search
                </span>
                <input
                  type="text"
                  placeholder="Filter by name, slug, or submitter..."
                  value={projectSearchQuery}
                  onChange={(e) => setProjectSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-1.5 rounded-xl bg-surface-container-lowest border border-slate-700 text-white text-xs focus:outline-none focus:border-primary"
                />
              </div>
              {projectSubTab === 'all' && (
                <select
                  value={projectStatusFilter}
                  onChange={(e) => setProjectStatusFilter(e.target.value)}
                  aria-label="Filter projects by verification status"
                  className="px-3 py-1.5 rounded-xl bg-surface-container-lowest border border-slate-700 text-slate-200 text-xs focus:outline-none focus:border-primary shrink-0"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="PENDING_REVIEW">Pending Review</option>
                  <option value="VERIFIED">Verified</option>
                  <option value="CHANGES_REQUESTED">Changes Requested</option>
                  <option value="REJECTED">Rejected</option>
                </select>
              )}
            </div>
          </div>

          {isLoading ? (
            <div className="p-16 text-center text-xs text-slate-400 font-mono">
              Loading project submissions telemetry...
            </div>
          ) : (
            (() => {
              const baseList = projectSubTab === 'pending' ? pendingProjects : allProjects;
              const filtered = baseList.filter((p) => {
                const matchesSearch =
                  !projectSearchQuery.trim() ||
                  p.name.toLowerCase().includes(projectSearchQuery.toLowerCase()) ||
                  p.slug.toLowerCase().includes(projectSearchQuery.toLowerCase()) ||
                  (p.category && p.category.toLowerCase().includes(projectSearchQuery.toLowerCase())) ||
                  (p.representativeInfo?.email && p.representativeInfo.email.toLowerCase().includes(projectSearchQuery.toLowerCase()));
                
                const matchesStatus =
                  projectSubTab === 'pending' ||
                  projectStatusFilter === 'ALL' ||
                  p.verificationStatus === projectStatusFilter;

                return matchesSearch && matchesStatus;
              });

              if (filtered.length === 0) {
                return (
                  <div className="p-12 rounded-3xl bg-[#0a1310] border border-slate-800 text-center flex flex-col items-center">
                    <span className="material-symbols-outlined text-4xl text-emerald-400 mb-2">task_alt</span>
                    <h3 className="text-base font-semibold text-white mb-1">No Projects Found</h3>
                    <p className="text-xs text-slate-400 max-w-sm">
                      {projectSubTab === 'pending'
                        ? 'No project applications are currently pending review. New registrations by projects will appear here immediately.'
                        : 'No projects match your current search and filter criteria.'}
                    </p>
                  </div>
                );
              }

              return (
                <div className="grid grid-cols-1 gap-4">
                  {filtered.map((project) => (
                    <div
                      key={project.id}
                      className="p-5 sm:p-6 rounded-2xl bg-[#0a1310] border border-amber-500/30 hover:border-amber-500/60 shadow-xl transition-all"
                    >
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                        {/* Identity & Visuals */}
                        <div className="flex items-start gap-4">
                          <div className="w-16 h-16 rounded-2xl bg-surface-container overflow-hidden border border-slate-700 shrink-0 flex items-center justify-center ring-1 ring-amber-500/20">
                            {project.logoUrl ? (
                              <img src={project.logoUrl} alt={project.name} className="w-full h-full object-cover" />
                            ) : (
                              <span className="material-symbols-outlined text-primary text-2xl">token</span>
                            )}
                          </div>
                          <div>
                            <div className="flex flex-wrap items-center gap-2 mb-1">
                              <span className="text-base font-bold text-white">{project.name}</span>
                              <StatusBadge status={project.verificationStatus} />
                              <span className="px-2 py-0.5 rounded bg-surface-container text-[10px] font-mono text-primary">
                                {project.category}
                              </span>
                              <span className="px-2 py-0.5 rounded bg-slate-800 text-[10px] font-mono text-slate-300">
                                {project.ecosystem || 'Elysium'}
                              </span>
                            </div>
                            <p className="text-xs text-slate-300 max-w-xl line-clamp-2">
                              {project.shortDescription}
                            </p>
                            <div className="flex flex-wrap items-center gap-4 mt-2 text-[11px] font-mono text-slate-400">
                              {project.websiteUrl && (
                                <a
                                  href={project.websiteUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-primary hover:underline flex items-center gap-1"
                                >
                                  <span className="material-symbols-outlined text-[14px]">link</span>
                                  <span>{project.websiteUrl.replace(/^https?:\/\//, '')}</span>
                                </a>
                              )}
                              <span>Slug: @{project.slug}</span>
                              {project.representativeInfo?.email && (
                                <span>Submitter: <strong className="text-slate-200">{project.representativeInfo.email}</strong></span>
                              )}
                              {project.contractAddresses && project.contractAddresses.length > 0 && (
                                <span className="text-amber-400">
                                  {project.contractAddresses.length} Contract{project.contractAddresses.length > 1 ? 's' : ''} Attached
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-3 shrink-0 self-start lg:self-center">
                          <button
                            onClick={() => {
                              setSelectedReviewProject(project);
                              if (project.verificationStatus === ProjectVerificationStatus.PENDING_REVIEW) {
                                setReviewDecision(ReviewDecision.APPROVED);
                                setReviewNotes('Official verification awarded. Contracts and documentation confirmed.');
                              } else if (project.verificationStatus === ProjectVerificationStatus.CHANGES_REQUESTED) {
                                setReviewDecision(ReviewDecision.CHANGES_REQUESTED);
                                setReviewNotes('Please address requested changes and resubmit for review.');
                              } else {
                                setReviewDecision(ReviewDecision.APPROVED);
                                setReviewNotes('Re-reviewed and approved.');
                              }
                            }}
                            className="px-5 py-2.5 rounded-full bg-primary-container text-on-primary-container font-semibold text-xs shadow-md hover:bg-primary-fixed-dim transition-all cursor-pointer flex items-center gap-1.5"
                          >
                            <span className="material-symbols-outlined text-[16px]">rate_review</span>
                            <span>Review & Cross-Check Data</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              );
            })()
          )}
        </div>
      )}

      {/* ===================================================================== */}
      {/* 2. QUEST STACKS & COMMUNITY TASKS APPROVAL TAB */}
      {/* ===================================================================== */}
      {activeTab === 'quests' && (
        <div className="space-y-8">
          {/* Submissions Pending Verification */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-bold text-white tracking-tight">
                  User Quest Proof Verifications
                </h2>
                <p className="text-xs text-slate-400">
                  Review onchain hashes, wallet proofs, and task submissions from community participants.
                </p>
              </div>
              <span className="px-3 py-1 rounded-full bg-[#101c17] border border-amber-500/30 text-primary text-xs font-mono">
                {pendingCompletions.length} Awaiting Verification
              </span>
            </div>

            {pendingCompletions.length === 0 ? (
              <div className="p-8 rounded-2xl bg-[#0a1310] border border-slate-800 text-center text-xs text-slate-400">
                No quest completion proofs currently waiting for administrative review.
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3">
                {pendingCompletions.map((comp) => (
                  <div
                    key={comp.id}
                    className="p-5 rounded-2xl bg-[#0a1310] border border-slate-800 hover:border-amber-500/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-bold text-white">{comp.quest_title}</span>
                        <span className="px-2 py-0.5 rounded bg-surface-container text-[10px] font-mono text-primary">
                          {comp.project_name}
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 font-mono">
                        User: <strong className="text-white">@{comp.username}</strong> ({comp.email})
                      </p>
                      {comp.submission_proof && (
                        <div className="mt-2 p-2 rounded-lg bg-surface-container-lowest border border-slate-800 font-mono text-xs text-amber-300 break-all">
                          Proof: {comp.submission_proof}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => setSelectedCompletion(comp)}
                        className="px-4 py-2 rounded-full bg-primary-container text-on-primary-container text-xs font-semibold shadow-sm hover:bg-primary-fixed-dim transition-all cursor-pointer"
                      >
                        Verify Submission
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* All Quests Stack Overview */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-bold text-white tracking-tight">
                  Ecosystem Quest Stacks
                </h2>
                <p className="text-xs text-slate-400">
                  Moderate and set publication statuses for quests published by registered projects.
                </p>
              </div>
              <span className="text-xs text-slate-400 font-mono">
                {allQuests.length} Quests Loaded
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {allQuests.map((quest) => (
                <div
                  key={quest.id}
                  className="p-5 rounded-2xl bg-[#0a1310] border border-slate-800 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="text-sm font-bold text-white truncate">{quest.title}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase ${
                        quest.publication_status === 'PUBLISHED'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                          : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      }`}>
                        {quest.publication_status || 'PUBLISHED'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 line-clamp-2 mb-2">
                      {quest.description}
                    </p>
                    <div className="text-[11px] font-mono text-slate-500">
                      Project: {quest.project_name || 'Elysium Protocol'} &bull; Type: {quest.quest_type}
                    </div>
                  </div>

                  <div className="pt-3 mt-3 border-t border-slate-800/80 flex items-center justify-end gap-2">
                    {quest.publication_status !== 'PUBLISHED' ? (
                      <button
                        onClick={() => handleUpdateQuestStatus(quest.id, 'PUBLISHED')}
                        className="px-3 py-1.5 rounded-full bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-xs font-mono font-semibold transition-colors cursor-pointer"
                      >
                        Approve & Publish
                      </button>
                    ) : (
                      <button
                        onClick={() => handleUpdateQuestStatus(quest.id, 'DRAFT')}
                        className="px-3 py-1.5 rounded-full bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 text-xs font-mono transition-colors cursor-pointer"
                      >
                        Suspend Quest
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* 3. CREATOR NETWORK & CONTENT SUBMISSIONS TAB */}
      {/* ===================================================================== */}
      {activeTab === 'creators' && (
        <div className="space-y-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight">
                Curated Creator Programme Management
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Review applications from creators wanting to join the private LAKNES network, and inspect submitted campaign deliverables.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 rounded-full bg-[#101c17] border border-amber-500/30 text-primary text-xs font-mono">
                {creatorApplications.filter((a) => a.status === 'PENDING').length} Apps Pending
              </span>
              <span className="px-3 py-1 rounded-full bg-[#101c17] border border-emerald-500/30 text-emerald-400 text-xs font-mono">
                {creatorSubmissions.filter((s) => s.status === 'SUBMITTED' || s.status === 'REVISION_REQUESTED').length} Content Reviews
              </span>
            </div>
          </div>

          {/* Section A: Creator Applications Queue */}
          <div className="p-6 rounded-2xl bg-[#0a1310] border border-amber-500/30 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-xl">assignment_ind</span>
                <span>Creator Applications Queue ({creatorApplications.length})</span>
              </h3>
              <span className="text-[11px] font-mono text-slate-400">
                Approving grants user the CREATOR role and private dashboard access
              </span>
            </div>

            {creatorApplications.length === 0 ? (
              <div className="p-8 rounded-xl bg-surface-container-lowest border border-slate-800 text-center text-xs text-slate-400">
                No creator applications submitted yet. Applications will stream here in real time.
              </div>
            ) : (
              <div className="space-y-3">
                {creatorApplications.map((app) => (
                  <div
                    key={app.id}
                    className="p-5 rounded-xl bg-surface-container-lowest border border-slate-800/80 hover:border-amber-500/40 flex flex-col lg:flex-row lg:items-center justify-between gap-4 transition-all"
                  >
                    <div>
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <strong className="text-base text-white">{app.creatorName}</strong>
                        {app.email && <span className="text-xs text-slate-400 font-mono">({app.email})</span>}
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase ${
                          app.status === 'APPROVED'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                            : app.status === 'REJECTED'
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                            : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                        }`}>
                          {app.status}
                        </span>
                        <span className="px-2 py-0.5 rounded bg-surface-container text-[10px] font-mono text-primary">
                          {app.contentNiche}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-slate-400 mt-2">
                        {app.socialLinks?.twitter && (
                          <span className="text-sky-300">𝕏: {app.socialLinks.twitter}</span>
                        )}
                        {app.socialLinks?.youtube && (
                          <span className="text-rose-400">YouTube: {app.socialLinks.youtube}</span>
                        )}
                        {app.socialLinks?.tiktok && (
                          <span className="text-cyan-300">TikTok: {app.socialLinks.tiktok}</span>
                        )}
                        {app.socialLinks?.instagram && (
                          <span className="text-fuchsia-300">IG: {app.socialLinks.instagram}</span>
                        )}
                        {app.audienceInfo && <span>Audience: {app.audienceInfo}</span>}
                      </div>

                      <p className="text-xs text-slate-300 mt-2 line-clamp-2">
                        Strengths: {app.strengthsDescription}
                      </p>

                      {app.portfolioLinks && app.portfolioLinks.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {app.portfolioLinks.map((link, idx) => (
                            <a
                              key={idx}
                              href={link}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[10px] text-primary hover:underline font-mono bg-surface-container px-2 py-0.5 rounded"
                            >
                              Sample #{idx + 1} &rarr;
                            </a>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => {
                          setSelectedCreatorApp(app);
                          setCreatorAppDecision('APPROVED');
                          setCreatorAppNotes('Approved for Creator Studio access and campaign opportunities.');
                        }}
                        className="px-4 py-2 rounded-full bg-primary-container text-on-primary-container text-xs font-mono font-bold shadow-sm hover:bg-primary-fixed-dim transition-all cursor-pointer"
                      >
                        Review Application
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section B: Creator Campaign Deliverable Submissions */}
          <div className="p-6 rounded-2xl bg-[#0a1310] border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span className="material-symbols-outlined text-emerald-400 text-xl">fact_check</span>
                <span>Content Deliverables Awaiting Verification ({creatorSubmissions.length})</span>
              </h3>
              <span className="text-[11px] font-mono text-slate-400">
                Approving awards guaranteed campaign payout directly to creator
              </span>
            </div>

            {creatorSubmissions.length === 0 ? (
              <div className="p-8 rounded-xl bg-surface-container-lowest border border-slate-800 text-center text-xs text-slate-400">
                No campaign content deliverables currently submitted.
              </div>
            ) : (
              <div className="space-y-3">
                {creatorSubmissions.map((sub) => (
                  <div
                    key={sub.id}
                    className="p-5 rounded-xl bg-surface-container-lowest border border-slate-800/80 hover:border-emerald-500/40 flex flex-col lg:flex-row lg:items-center justify-between gap-4 transition-all"
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <strong className="text-sm text-white">{sub.campaignTitle}</strong>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase ${
                          sub.status === 'APPROVED'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                            : sub.status === 'REVISION_REQUESTED'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                            : sub.status === 'REJECTED'
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                            : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                        }`}>
                          {sub.status}
                        </span>
                        <span className="px-2 py-0.5 rounded bg-emerald-950/40 text-emerald-300 text-[10px] font-mono border border-emerald-800">
                          Payout: {sub.payoutAmount || '200 USDC'}
                        </span>
                      </div>

                      <p className="text-xs text-slate-300 font-mono">
                        Creator: <strong className="text-white">{sub.creatorName || 'Creator'}</strong>
                      </p>

                      <div className="mt-2 p-2 rounded bg-[#0a1310] border border-slate-800 font-mono text-xs">
                        <span className="text-slate-500 block text-[10px] uppercase">Deliverable Content Link:</span>
                        <a
                          href={sub.submissionLinks?.[0] || '#'}
                          target="_blank"
                          rel="noreferrer"
                          className="text-primary hover:underline break-all"
                        >
                          {sub.submissionLinks?.[0] || 'Link Submitted'} &rarr;
                        </a>
                      </div>

                      {sub.proofNotes && (
                        <p className="text-xs text-slate-400 mt-2 font-mono">
                          Notes: {sub.proofNotes}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => {
                          setSelectedCreatorSubmission(sub);
                          setCreatorSubDecision('APPROVED');
                          setCreatorSubNotes('Content meets editorial standards. Payout awarded.');
                        }}
                        className="px-4 py-2 rounded-full bg-emerald-500 text-black text-xs font-mono font-bold shadow-sm hover:bg-emerald-400 transition-all cursor-pointer"
                      >
                        Verify & Award Payout
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* 4. SPONSORED CAMPAIGNS TAB */}
      {/* ===================================================================== */}
      {activeTab === 'campaigns' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-[#0a1310] border border-slate-800">
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight">
                Sponsored Creator Campaigns
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                LAKNES-managed promotional campaigns. Only administrators create campaigns and set creator payouts.
              </p>
            </div>

            <button
              onClick={() => setIsCreateCampaignModalOpen(true)}
              className="px-5 py-2.5 rounded-full bg-primary-container text-on-primary-container font-mono uppercase font-bold text-xs shadow-md hover:bg-primary-fixed-dim transition-all cursor-pointer flex items-center gap-1.5 shrink-0"
            >
              <span className="material-symbols-outlined text-[16px]">add</span>
              <span>Launch Creator Campaign</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {adminCampaigns.map((camp) => (
              <div
                key={camp.id}
                className="p-5 rounded-2xl bg-[#0a1310] border border-amber-500/30 flex flex-col justify-between space-y-4 shadow-xl"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-primary-container/15 text-primary font-bold">
                      {camp.brandProjectName}
                    </span>
                    <span className="text-[10px] font-mono text-emerald-400 px-2 py-0.5 rounded bg-emerald-950/40 border border-emerald-800 uppercase font-bold">
                      {camp.status}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-white mb-1">{camp.title}</h3>
                  <p className="text-xs text-slate-400 line-clamp-3 mb-3">{camp.briefGuidelines || camp.objective}</p>

                  <div className="p-3 rounded-xl bg-surface-container-lowest border border-slate-800/80 space-y-1.5 text-xs font-mono">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Reward Pool:</span>
                      <strong className="text-primary">{camp.rewardPool}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Per Creator Payout:</span>
                      <strong className="text-emerald-400">{camp.rewardPerCreator}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Deadline:</span>
                      <span className="text-slate-300">{camp.deadline || 'Ongoing'}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-800 text-xs font-mono text-slate-500 flex items-center justify-between">
                  <span>Managed by LAKNES Admin</span>
                  <span className="text-primary">Live in Creator Studio</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* 5. PROJECT PARTNERSHIPS QUEUE TAB */}
      {/* ===================================================================== */}
      {activeTab === 'partnerships' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight">
                Project Distribution Partnerships Queue
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Inbound briefs from Web3 teams requesting LAKNES to organise curated creator campaigns for their protocol.
              </p>
            </div>
            <span className="px-3 py-1 rounded-full bg-[#101c17] border border-cyan-500/30 text-cyan-300 text-xs font-mono">
              {adminPartnerships.length} Briefs Logged
            </span>
          </div>

          {adminPartnerships.length === 0 ? (
            <div className="p-12 rounded-3xl bg-[#0a1310] border border-slate-800 text-center text-xs text-slate-400">
              No project partnership briefs submitted yet. Web3 teams submit requests via their project workspace.
            </div>
          ) : (
            <div className="space-y-3">
              {adminPartnerships.map((part) => (
                <div
                  key={part.id}
                  className="p-5 rounded-2xl bg-[#0a1310] border border-slate-800 hover:border-cyan-500/40 flex flex-col lg:flex-row lg:items-center justify-between gap-4 transition-all"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <strong className="text-base text-white">{part.projectName}</strong>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase ${
                        part.status === 'COMPLETED'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                          : part.status === 'IN_PROGRESS' || part.status === 'CONTACTED'
                          ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                          : part.status === 'ARCHIVED'
                          ? 'bg-slate-800 text-slate-400 border border-slate-700'
                          : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      }`}>
                        {part.status}
                      </span>
                    </div>

                    <div className="text-xs font-mono text-cyan-300">
                      Objective: <strong>{part.campaignObjective}</strong> &bull; Budget: {part.budgetRange}
                    </div>

                    <p className="text-xs text-slate-300 max-w-2xl font-mono leading-relaxed">
                      {part.requestedService}
                    </p>

                    <div className="text-[11px] font-mono text-slate-400">
                      Contact: <strong className="text-white">{part.contactInfo}</strong> &bull; Submitted {new Date(part.createdAt).toLocaleString()}
                    </div>

                    {part.relevantLinks && (
                      <div className="flex flex-wrap gap-2 pt-1">
                        {(typeof part.relevantLinks === 'string'
                          ? part.relevantLinks.split(/[\n,]+/).map((s) => s.trim()).filter(Boolean)
                          : Array.isArray(part.relevantLinks)
                          ? (part.relevantLinks as string[])
                          : []
                        ).map((link, idx) => (
                          <a
                            key={idx}
                            href={link}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[10px] text-primary hover:underline font-mono bg-surface-container px-2 py-0.5 rounded"
                          >
                            Link #{idx + 1} &rarr;
                          </a>
                        ))}
                      </div>
                    )}

                    {part.adminNotes && (
                      <div className="p-2 rounded bg-surface-container-lowest border border-slate-800 text-xs font-mono text-primary">
                        Admin Note: {part.adminNotes}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => {
                        setSelectedPartnership(part);
                        setPartnershipStatusChoice(part.status || 'CONTACTED');
                        setPartnershipAdminNotes(part.adminNotes || 'Proposal reviewed by LAKNES team.');
                      }}
                      className="px-4 py-2 rounded-full bg-cyan-500 text-black text-xs font-mono font-bold shadow-sm hover:bg-cyan-400 transition-all cursor-pointer"
                    >
                      Update Status
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ===================================================================== */}
      {/* 6. COMMUNITY MODERATION TAB */}
      {/* ===================================================================== */}
      {activeTab === 'moderation' && (
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-white tracking-tight">
            Community Reports & Flags
          </h2>
          {reports.length === 0 ? (
            <div className="p-12 rounded-3xl bg-[#0a1310] border border-slate-800 text-center text-xs text-slate-400">
              No unresolved community reports or flagged items.
            </div>
          ) : (
            <div className="space-y-3">
              {reports.map((report) => (
                <div
                  key={report.id}
                  className="p-5 rounded-2xl bg-[#0a1310] border border-slate-800 flex items-center justify-between"
                >
                  <div>
                    <span className="text-xs font-bold text-rose-400 uppercase font-mono">
                      {report.reason}
                    </span>
                    <p className="text-xs text-slate-400 mt-1 font-mono">
                      Target: {report.targetType} ({report.targetId})
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleResolveReport(report.id, ContentReportStatus.RESOLVED)}
                      className="px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-300 text-xs font-mono"
                    >
                      Resolve
                    </button>
                    <button
                      onClick={() => handleResolveReport(report.id, ContentReportStatus.DISMISSED)}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-400 text-xs font-mono"
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ===================================================================== */}
      {/* 4. AUDIT LOG TAB */}
      {/* ===================================================================== */}
      {activeTab === 'audit' && (
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-white tracking-tight">
            Immutable Protocol Audit Trail
          </h2>
          <div className="p-4 rounded-2xl bg-[#0a1310] border border-slate-800 space-y-2 max-h-[600px] overflow-y-auto">
            {auditLogs.map((log) => (
              <div
                key={log.id}
                className="p-3 rounded-xl bg-surface-container-lowest border border-slate-800/80 flex items-center justify-between text-xs font-mono"
              >
                <div>
                  <span className="text-primary font-bold">{log.action}</span>
                  <span className="text-slate-500 ml-2">target: {log.targetType}:{log.targetId}</span>
                </div>
                <span className="text-slate-500">
                  {new Date(log.timestamp).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* 5. SECRET URL & CREDENTIALS SETTINGS TAB */}
      {/* ===================================================================== */}
      {activeTab === 'settings' && (
        <div className="max-w-2xl space-y-6">
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">
              Secret Admin URL & Master Credentials
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Keep this URL secret. The Admin section is intentionally omitted from all public navigation.
            </p>
          </div>

          {/* Secret URL & Master Password Box */}
          <div className="p-5 rounded-2xl bg-[#0a1310] border border-amber-500/40 space-y-4">
            <div>
              <span className="text-[11px] font-mono uppercase text-primary font-bold">
                Secret Admin Bookmark URL
              </span>
              <div className="flex items-center gap-2 mt-1.5">
                <input
                  type="text"
                  readOnly
                  value={`${window.location.origin}/#/admin-console`}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-surface-container-lowest border border-slate-700 text-white font-mono text-xs select-all focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(`${window.location.origin}/#/admin-console`);
                    setActionFeedback('Secret Admin URL copied to clipboard!');
                    setTimeout(() => setActionFeedback(null), 3500);
                  }}
                  className="px-4 py-2.5 rounded-xl bg-primary-container text-on-primary-container text-xs font-mono font-bold shrink-0 shadow-md hover:bg-primary-fixed-dim cursor-pointer"
                >
                  Copy URL
                </button>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800">
              <span className="text-[11px] font-mono uppercase text-primary font-bold">
                Master Admin Gatekeeper Password
              </span>
              <div className="flex items-center gap-2 mt-1.5">
                <input
                  type="text"
                  readOnly
                  value="AdminElysium2026!"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-surface-container-lowest border border-slate-700 text-amber-300 font-mono text-xs select-all focus:outline-none font-bold"
                />
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText('AdminElysium2026!');
                    setActionFeedback('Master Admin Password copied to clipboard!');
                    setTimeout(() => setActionFeedback(null), 3500);
                  }}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-mono font-bold shrink-0 shadow-md cursor-pointer"
                >
                  Copy Pass
                </button>
              </div>
              <p className="text-[11px] text-slate-400 mt-1.5">
                Keep these credentials private. Anyone with this password and secret URL can access this administration portal.
              </p>
            </div>
          </div>

          {/* Change Master Password */}
          <div className="p-5 rounded-2xl bg-[#0a1310] border border-slate-800 space-y-4">
            <h3 className="text-sm font-bold text-white">Update Master Password</h3>
            {passwordUpdateMsg && (
              <p className="text-xs text-primary font-mono">{passwordUpdateMsg}</p>
            )}
            <form onSubmit={handleUpdateAdminPassword} className="space-y-3">
              <div>
                <label className="block text-[11px] font-mono uppercase text-slate-300 mb-1">
                  New Master Password
                </label>
                <input
                  type="password"
                  required
                  value={newAdminPassword}
                  onChange={(e) => setNewAdminPassword(e.target.value)}
                  placeholder="Minimum 8 characters"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-surface-container-lowest border border-slate-700 text-white text-xs focus:outline-none focus:border-primary"
                />
              </div>
              <button
                type="submit"
                disabled={isUpdatingPassword}
                className="px-5 py-2.5 rounded-full bg-primary-container text-on-primary-container font-semibold text-xs shadow-md hover:bg-primary-fixed-dim transition-all cursor-pointer"
              >
                {isUpdatingPassword ? 'Saving...' : 'Update Password'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* REVIEW & CROSS-CHECK PROJECT MODAL */}
      {/* ===================================================================== */}
      {selectedReviewProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md overflow-y-auto">
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-3xl bg-[#0a1310] border border-amber-500/50 rounded-3xl shadow-2xl p-5 sm:p-8 my-auto text-left relative max-h-[92vh] overflow-y-auto"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-5">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-primary text-2xl">verified</span>
                <div>
                  <h3 className="text-lg sm:text-xl font-bold text-white">
                    Audit & Review: {selectedReviewProject.name}
                  </h3>
                  <p className="text-[11px] text-slate-400 font-mono">
                    Cross-check project identity, smart contracts, submitter credentials, and documentation
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedReviewProject(null)}
                className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[22px]">close</span>
              </button>
            </div>

            {/* 1. Header Banner & Logo Preview (Strict Similitude of X: 3:1 Banner + Circular Logo) */}
            <div className="relative rounded-2xl overflow-hidden bg-slate-900 border border-slate-800 mb-6">
              <div className="relative w-full aspect-[3/1] max-h-[160px] bg-slate-950 overflow-hidden">
                {selectedReviewProject.bannerUrl ? (
                  <img
                    src={selectedReviewProject.bannerUrl}
                    alt="Banner Preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-r from-emerald-950/70 via-slate-900 to-[#0a1310] text-slate-500 font-mono text-xs">
                    No Custom Banner Uploaded (3:1 standard)
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-[#0a1310] via-black/20 to-transparent"></div>
                <span className="absolute top-2.5 right-3 px-2 py-0.5 rounded bg-black/60 backdrop-blur-md text-[10px] font-mono text-amber-300 border border-white/10">
                  X Similitude 3:1 Header
                </span>
              </div>

              <div className="px-5 pb-4 -mt-10 sm:-mt-12 flex items-end justify-between relative z-10">
                <div className="flex items-end gap-3.5">
                  <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full border-4 border-[#0a1310] bg-slate-900 overflow-hidden shadow-2xl shrink-0 flex items-center justify-center ring-2 ring-amber-500/40">
                    {selectedReviewProject.logoUrl ? (
                      <img
                        src={selectedReviewProject.logoUrl}
                        alt={selectedReviewProject.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="material-symbols-outlined text-primary text-3xl">token</span>
                    )}
                  </div>
                  <div className="mb-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="text-lg font-bold text-white tracking-tight">
                        {selectedReviewProject.name}
                      </h4>
                      <StatusBadge status={selectedReviewProject.verificationStatus} />
                    </div>
                    <p className="text-xs text-slate-400 font-mono">
                      @{selectedReviewProject.slug} &bull; {selectedReviewProject.category} &bull; {selectedReviewProject.ecosystem || 'Elysium'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* 2. Structured Data Cross-Check Cards */}
            <div className="space-y-4 mb-6 text-xs">
              {/* Identity & Submitter Card */}
              <div className="p-4 rounded-xl bg-surface-container-lowest border border-slate-800 space-y-3">
                <span className="text-[11px] font-mono uppercase text-amber-300 font-bold flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[15px]">badge</span>
                  <span>Submitter & Identity Verification</span>
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-slate-300">
                  <div>
                    <span className="text-slate-500 text-[11px] block">Submitter Email:</span>
                    <strong className="text-white font-mono break-all">
                      {selectedReviewProject.representativeInfo?.email || 'N/A'}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[11px] block">Submitter Name & Role:</span>
                    <strong className="text-white">
                      {selectedReviewProject.representativeInfo?.name || 'N/A'}
                    </strong>{' '}
                    <span className="text-primary font-mono text-[11px]">
                      ({selectedReviewProject.representativeInfo?.role || 'Founder / Submitter'})
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[11px] block">Blockchain Network:</span>
                    <strong className="text-cyan-300 font-mono">
                      {selectedReviewProject.blockchainNetwork || 'Elysium Mainnet'}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[11px] block">Date Registered:</span>
                    <span className="text-slate-300 font-mono">
                      {selectedReviewProject.createdAt
                        ? new Date(selectedReviewProject.createdAt).toLocaleString()
                        : 'Recently'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Official Links & URLs Card */}
              <div className="p-4 rounded-xl bg-surface-container-lowest border border-slate-800 space-y-3">
                <span className="text-[11px] font-mono uppercase text-primary font-bold flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[15px]">link</span>
                  <span>Official Protocol Links & Documentation</span>
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <span className="text-slate-500 text-[11px] block">Official Website:</span>
                    {selectedReviewProject.websiteUrl ? (
                      <a
                        href={selectedReviewProject.websiteUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-primary hover:underline font-mono flex items-center gap-1 mt-0.5 break-all"
                      >
                        <span>{selectedReviewProject.websiteUrl}</span>
                        <span className="material-symbols-outlined text-[14px]">open_in_new</span>
                      </a>
                    ) : (
                      <span className="text-rose-400 font-mono">No website provided</span>
                    )}
                  </div>
                  <div>
                    <span className="text-slate-500 text-[11px] block">Documentation / Whitepaper:</span>
                    {selectedReviewProject.documentationUrl ? (
                      <a
                        href={selectedReviewProject.documentationUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-cyan-300 hover:underline font-mono flex items-center gap-1 mt-0.5 break-all"
                      >
                        <span>{selectedReviewProject.documentationUrl}</span>
                        <span className="material-symbols-outlined text-[14px]">open_in_new</span>
                      </a>
                    ) : (
                      <span className="text-slate-500 font-mono italic">None provided</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Social Footprint Card */}
              <div className="p-4 rounded-xl bg-surface-container-lowest border border-slate-800 space-y-3">
                <span className="text-[11px] font-mono uppercase text-sky-400 font-bold flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[15px]">public</span>
                  <span>Social Presence Cross-Check</span>
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <div className="p-2.5 rounded-lg bg-[#0a1310] border border-slate-800">
                    <span className="text-[10px] text-slate-500 block uppercase font-mono">𝕏 Twitter</span>
                    {selectedReviewProject.socialLinks?.twitter ? (
                      <a
                        href={
                          selectedReviewProject.socialLinks.twitter.startsWith('http')
                            ? selectedReviewProject.socialLinks.twitter
                            : `https://x.com/${selectedReviewProject.socialLinks.twitter.replace(/^@/, '')}`
                        }
                        target="_blank"
                        rel="noreferrer"
                        className="text-white hover:text-primary font-mono text-[11px] truncate block mt-0.5"
                      >
                        @{selectedReviewProject.socialLinks.twitter.replace(/^@/, '').replace('https://x.com/', '')}
                      </a>
                    ) : (
                      <span className="text-slate-500 font-mono text-[11px]">—</span>
                    )}
                  </div>

                  <div className="p-2.5 rounded-lg bg-[#0a1310] border border-slate-800">
                    <span className="text-[10px] text-slate-500 block uppercase font-mono">Telegram</span>
                    {selectedReviewProject.socialLinks?.telegram ? (
                      <a
                        href={
                          selectedReviewProject.socialLinks.telegram.startsWith('http')
                            ? selectedReviewProject.socialLinks.telegram
                            : `https://t.me/${selectedReviewProject.socialLinks.telegram.replace(/^@/, '')}`
                        }
                        target="_blank"
                        rel="noreferrer"
                        className="text-sky-300 hover:underline font-mono text-[11px] truncate block mt-0.5"
                      >
                        {selectedReviewProject.socialLinks.telegram.replace(/^@/, '')}
                      </a>
                    ) : (
                      <span className="text-slate-500 font-mono text-[11px]">—</span>
                    )}
                  </div>

                  <div className="p-2.5 rounded-lg bg-[#0a1310] border border-slate-800">
                    <span className="text-[10px] text-slate-500 block uppercase font-mono">Discord</span>
                    {selectedReviewProject.socialLinks?.discord ? (
                      <span className="text-indigo-300 font-mono text-[11px] truncate block mt-0.5">
                        {selectedReviewProject.socialLinks.discord}
                      </span>
                    ) : (
                      <span className="text-slate-500 font-mono text-[11px]">—</span>
                    )}
                  </div>

                  <div className="p-2.5 rounded-lg bg-[#0a1310] border border-slate-800">
                    <span className="text-[10px] text-slate-500 block uppercase font-mono">GitHub</span>
                    {selectedReviewProject.socialLinks?.github ? (
                      <a
                        href={
                          selectedReviewProject.socialLinks.github.startsWith('http')
                            ? selectedReviewProject.socialLinks.github
                            : `https://github.com/${selectedReviewProject.socialLinks.github.replace(/^@/, '')}`
                        }
                        target="_blank"
                        rel="noreferrer"
                        className="text-white hover:underline font-mono text-[11px] truncate block mt-0.5"
                      >
                        {selectedReviewProject.socialLinks.github.replace(/^@/, '')}
                      </a>
                    ) : (
                      <span className="text-slate-500 font-mono text-[11px]">—</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Smart Contracts Card */}
              <div className="p-4 rounded-xl bg-surface-container-lowest border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono uppercase text-amber-300 font-bold flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[15px]">code</span>
                    <span>Smart Contract Addresses ({selectedReviewProject.contractAddresses?.length || 0})</span>
                  </span>
                </div>
                {selectedReviewProject.contractAddresses && selectedReviewProject.contractAddresses.length > 0 ? (
                  <div className="space-y-1.5">
                    {selectedReviewProject.contractAddresses.map((addr, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between gap-2 p-2 rounded-lg bg-[#0a1310] border border-slate-800"
                      >
                        <code className="text-[11px] text-amber-300 font-mono break-all">{addr}</code>
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(addr);
                            setCopiedContract(addr);
                            setTimeout(() => setCopiedContract(null), 2000);
                          }}
                          className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[10px] font-mono text-slate-300 shrink-0 cursor-pointer"
                        >
                          {copiedContract === addr ? '✓ Copied' : 'Copy'}
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-500 font-mono italic">No smart contract addresses attached</p>
                )}
              </div>

              {/* Description & Supporting Info Card */}
              <div className="p-4 rounded-xl bg-surface-container-lowest border border-slate-800 space-y-3">
                <div>
                  <span className="text-[11px] font-mono uppercase text-slate-400 font-bold block mb-1">
                    Tagline & Elevator Pitch:
                  </span>
                  <p className="text-slate-200 leading-relaxed font-sans">
                    {selectedReviewProject.shortDescription}
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-800/80">
                  <span className="text-[11px] font-mono uppercase text-slate-400 font-bold block mb-1">
                    Full Project Description:
                  </span>
                  <p className="text-slate-300 leading-relaxed whitespace-pre-wrap font-sans text-[11px]">
                    {selectedReviewProject.description}
                  </p>
                </div>

                {selectedReviewProject.supportingInfo && (
                  <div className="pt-2 border-t border-slate-800/80">
                    <span className="text-[11px] font-mono uppercase text-emerald-400 font-bold block mb-1">
                      Supporting Justification & Founder Notes:
                    </span>
                    <p className="text-slate-300 leading-relaxed whitespace-pre-wrap font-mono text-[11px] bg-[#0a1310] p-2.5 rounded-lg border border-slate-800">
                      {selectedReviewProject.supportingInfo}
                    </p>
                  </div>
                )}
              </div>

              {/* 3. Review Decision Form */}
              <form onSubmit={handleExecuteProjectReview} className="space-y-4 pt-2">
                <div>
                  <label className="block text-[11px] font-mono uppercase text-slate-300 mb-2 font-bold">
                    Administrative Decision:
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setReviewDecision(ReviewDecision.APPROVED);
                        setReviewNotes('Official verification awarded. Contracts and documentation confirmed.');
                      }}
                      className={`py-2.5 px-3 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                        reviewDecision === ReviewDecision.APPROVED
                          ? 'bg-emerald-500 text-black shadow-lg ring-2 ring-emerald-400'
                          : 'bg-surface-container text-slate-300 hover:text-white'
                      }`}
                    >
                      <span>✓ Approve (Verify)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setReviewDecision(ReviewDecision.CHANGES_REQUESTED);
                        setReviewNotes('Please provide verified mainnet contract addresses and public GitHub documentation.');
                      }}
                      className={`py-2.5 px-3 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                        reviewDecision === ReviewDecision.CHANGES_REQUESTED
                          ? 'bg-amber-500 text-black shadow-lg ring-2 ring-amber-400'
                          : 'bg-surface-container text-slate-300 hover:text-white'
                      }`}
                    >
                      <span>✎ Request Changes</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setReviewDecision(ReviewDecision.REJECTED);
                        setReviewNotes('Application rejected: failed protocol authenticity verification.');
                      }}
                      className={`py-2.5 px-3 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                        reviewDecision === ReviewDecision.REJECTED
                          ? 'bg-rose-500 text-black shadow-lg ring-2 ring-rose-400'
                          : 'bg-surface-container text-slate-300 hover:text-white'
                      }`}
                    >
                      <span>✕ Reject</span>
                    </button>
                  </div>
                </div>

                {/* Quick Preset Note Suggestions */}
                <div>
                  <span className="text-[10px] font-mono uppercase text-slate-500 block mb-1">
                    Quick Preset Notes:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      onClick={() => setReviewNotes('Official verification awarded. Contracts and documentation confirmed.')}
                      className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[10px] font-mono text-emerald-300 transition-colors cursor-pointer"
                    >
                      + Contracts & Docs Verified
                    </button>
                    <button
                      type="button"
                      onClick={() => setReviewNotes('Please update smart contract addresses to deployed Elysium mainnet.')}
                      className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[10px] font-mono text-amber-300 transition-colors cursor-pointer"
                    >
                      + Need Mainnet Contracts
                    </button>
                    <button
                      type="button"
                      onClick={() => setReviewNotes('Please provide a public GitHub repository and public documentation.')}
                      className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[10px] font-mono text-sky-300 transition-colors cursor-pointer"
                    >
                      + Need GitHub & Docs
                    </button>
                    <button
                      type="button"
                      onClick={() => setReviewNotes('Application rejected: unable to verify authenticity or identity.')}
                      className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[10px] font-mono text-rose-300 transition-colors cursor-pointer"
                    >
                      + Inauthentic Application
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-mono uppercase text-slate-300 mb-1 font-bold">
                    Administrative Notes & Feedback (Recorded in Audit Trail):
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={reviewNotes}
                    onChange={(e) => setReviewNotes(e.target.value)}
                    placeholder="Enter review decision notes..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-surface-container-lowest border border-slate-700 text-white text-xs focus:outline-none focus:border-primary font-mono"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-2 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setSelectedReviewProject(null)}
                    className="px-5 py-2.5 rounded-full bg-slate-800 text-xs text-slate-300 hover:text-white cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingReview}
                    className="px-7 py-2.5 rounded-full bg-primary-container text-on-primary-container font-semibold text-xs shadow-md hover:bg-primary-fixed-dim transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <span className="material-symbols-outlined text-[16px]">check</span>
                    <span>{isSubmittingReview ? 'Committing...' : 'Commit Decision & Publish'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* VERIFY QUEST COMPLETION MODAL */}
      {/* ===================================================================== */}
      {selectedCompletion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg bg-[#0a1310] border border-amber-500/50 rounded-3xl shadow-2xl p-6 sm:p-8 text-left"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <h3 className="text-lg font-bold text-white">
                Verify Quest Submission
              </h3>
              <button
                onClick={() => setSelectedCompletion(null)}
                className="text-slate-400 hover:text-white"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <div className="space-y-3 mb-5 text-xs">
              <p className="text-slate-300">
                Quest: <strong className="text-white">{selectedCompletion.quest_title}</strong>
              </p>
              <p className="text-slate-300 font-mono">
                User: <strong className="text-primary">@{selectedCompletion.username}</strong> ({selectedCompletion.email})
              </p>
              <div className="p-3 rounded-xl bg-surface-container-lowest border border-slate-800 font-mono text-amber-300 break-all">
                Proof: {selectedCompletion.submission_proof}
              </div>
            </div>

            <form onSubmit={handleExecuteQuestVerify} className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setQuestVerifyDecision('APPROVE')}
                  className={`py-2 px-3 rounded-xl text-xs font-mono font-bold transition-all ${
                    questVerifyDecision === 'APPROVE'
                      ? 'bg-emerald-500 text-black shadow-md'
                      : 'bg-surface-container text-slate-300'
                  }`}
                >
                  ✓ Approve & Award XP
                </button>
                <button
                  type="button"
                  onClick={() => setQuestVerifyDecision('REJECT')}
                  className={`py-2 px-3 rounded-xl text-xs font-mono font-bold transition-all ${
                    questVerifyDecision === 'REJECT'
                      ? 'bg-rose-500 text-black shadow-md'
                      : 'bg-surface-container text-slate-300'
                  }`}
                >
                  ✕ Reject Proof
                </button>
              </div>

              <div>
                <label className="block text-[11px] font-mono uppercase text-slate-300 mb-1">
                  Verification Note
                </label>
                <input
                  type="text"
                  value={questVerifyNotes}
                  onChange={(e) => setQuestVerifyNotes(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-surface-container-lowest border border-slate-700 text-white text-xs"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedCompletion(null)}
                  className="px-4 py-2 rounded-full bg-slate-800 text-xs text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isVerifyingQuest}
                  className="px-5 py-2 rounded-full bg-primary-container text-on-primary-container font-semibold text-xs shadow-md"
                >
                  {isVerifyingQuest ? 'Verifying...' : 'Save Decision'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* REVIEW CREATOR APPLICATION MODAL */}
      {/* ===================================================================== */}
      {selectedCreatorApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-xl bg-[#0a1310] border border-amber-500/50 rounded-3xl shadow-2xl p-6 sm:p-8 text-left max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-2xl">assignment_ind</span>
                <h3 className="text-lg font-bold text-white">
                  Review Creator Application: {selectedCreatorApp.creatorName}
                </h3>
              </div>
              <button
                onClick={() => setSelectedCreatorApp(null)}
                className="text-slate-400 hover:text-white"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <div className="space-y-3 mb-5 text-xs">
              <div className="p-3 rounded-xl bg-surface-container-lowest border border-slate-800 space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-400 font-mono">Creator:</span>
                  <strong className="text-white font-mono">@{selectedCreatorApp.creatorName || selectedCreatorApp.email}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 font-mono">Content Niche:</span>
                  <span className="text-primary font-mono font-bold">{selectedCreatorApp.contentNiche}</span>
                </div>
                {selectedCreatorApp.audienceInfo && (
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-mono">Audience Footprint:</span>
                    <span className="text-emerald-400 font-mono">{selectedCreatorApp.audienceInfo}</span>
                  </div>
                )}
              </div>

              {/* Handles */}
              <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                <div className="p-2 rounded bg-surface-container-lowest border border-slate-800">
                  <span className="text-[10px] text-slate-500 block uppercase">𝕏 Twitter</span>
                  <span className="text-sky-300 truncate block">{selectedCreatorApp.socialLinks?.twitter || selectedCreatorApp.socialLinks?.x || '—'}</span>
                </div>
                <div className="p-2 rounded bg-surface-container-lowest border border-slate-800">
                  <span className="text-[10px] text-slate-500 block uppercase">YouTube</span>
                  <span className="text-rose-400 truncate block">{selectedCreatorApp.socialLinks?.youtube || '—'}</span>
                </div>
                <div className="p-2 rounded bg-surface-container-lowest border border-slate-800">
                  <span className="text-[10px] text-slate-500 block uppercase">TikTok</span>
                  <span className="text-cyan-300 truncate block">{selectedCreatorApp.socialLinks?.tiktok || '—'}</span>
                </div>
                <div className="p-2 rounded bg-surface-container-lowest border border-slate-800">
                  <span className="text-[10px] text-slate-500 block uppercase">Instagram</span>
                  <span className="text-fuchsia-300 truncate block">{selectedCreatorApp.socialLinks?.instagram || '—'}</span>
                </div>
              </div>

              {/* Strengths */}
              <div className="p-3 rounded-xl bg-surface-container-lowest border border-slate-800">
                <span className="text-[10px] text-slate-500 uppercase font-mono block mb-1">
                  Content Strengths & Production Bio:
                </span>
                <p className="text-slate-300 leading-relaxed font-sans">{selectedCreatorApp.strengthsDescription}</p>
              </div>

              {/* Portfolio Links */}
              {selectedCreatorApp.portfolioLinks && selectedCreatorApp.portfolioLinks.length > 0 && (
                <div className="p-3 rounded-xl bg-surface-container-lowest border border-slate-800">
                  <span className="text-[10px] text-slate-500 uppercase font-mono block mb-1">
                    Previous Content Examples:
                  </span>
                  <div className="space-y-1">
                    {selectedCreatorApp.portfolioLinks.map((link, idx) => (
                      <a
                        key={idx}
                        href={link}
                        target="_blank"
                        rel="noreferrer"
                        className="text-primary hover:underline font-mono text-[11px] block truncate"
                      >
                        {link} &rarr;
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <form onSubmit={handleExecuteCreatorAppReview} className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setCreatorAppDecision('APPROVED');
                    setCreatorAppNotes('Approved for Creator Studio access and campaign opportunities.');
                  }}
                  className={`py-2 px-3 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
                    creatorAppDecision === 'APPROVED'
                      ? 'bg-emerald-500 text-black shadow-md ring-2 ring-emerald-400'
                      : 'bg-surface-container text-slate-300'
                  }`}
                >
                  ✓ Approve Creator (Grant Access)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCreatorAppDecision('REJECTED');
                    setCreatorAppNotes('Application does not meet current creator programme audience requirements.');
                  }}
                  className={`py-2 px-3 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
                    creatorAppDecision === 'REJECTED'
                      ? 'bg-rose-500 text-black shadow-md ring-2 ring-rose-400'
                      : 'bg-surface-container text-slate-300'
                  }`}
                >
                  ✕ Reject Application
                </button>
              </div>

              <div>
                <label className="block text-[11px] font-mono uppercase text-slate-300 mb-1">
                  Internal Administrative Notes & Feedback
                </label>
                <textarea
                  rows={2}
                  required
                  value={creatorAppNotes}
                  onChange={(e) => setCreatorAppNotes(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-surface-container-lowest border border-slate-700 text-white text-xs font-mono"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedCreatorApp(null)}
                  className="px-4 py-2 rounded-full bg-slate-800 text-xs text-slate-300 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isReviewingApp}
                  className="px-5 py-2 rounded-full bg-primary-container text-on-primary-container font-semibold text-xs shadow-md cursor-pointer disabled:opacity-50"
                >
                  {isReviewingApp ? 'Saving...' : 'Commit Decision'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* REVIEW CREATOR SUBMISSION & AWARD PAYOUT MODAL */}
      {/* ===================================================================== */}
      {selectedCreatorSubmission && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-xl bg-[#0a1310] border border-emerald-500/50 rounded-3xl shadow-2xl p-6 sm:p-8 text-left max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-emerald-400 text-2xl">fact_check</span>
                <h3 className="text-lg font-bold text-white">
                  Inspect Content Deliverable
                </h3>
              </div>
              <button
                onClick={() => setSelectedCreatorSubmission(null)}
                className="text-slate-400 hover:text-white"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <div className="space-y-3 mb-5 text-xs">
              <div className="p-3 rounded-xl bg-surface-container-lowest border border-slate-800 space-y-1.5 font-mono">
                <p className="text-slate-300">
                  Campaign: <strong className="text-white">{selectedCreatorSubmission.campaignTitle}</strong>
                </p>
                <p className="text-slate-300">
                  Creator: <strong className="text-primary">@{selectedCreatorSubmission.creatorName || 'Creator'}</strong>
                </p>
                <p className="text-slate-300">
                  Guaranteed Payout: <strong className="text-emerald-400">{selectedCreatorSubmission.payoutAmount || '200 USDC'}</strong>
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-[#0a1310] border border-slate-800 space-y-2">
                <span className="text-[10px] text-slate-500 uppercase font-mono block">Published Content Link:</span>
                <a
                  href={selectedCreatorSubmission.submissionLinks?.[0] || '#'}
                  target="_blank"
                  rel="noreferrer"
                  className="text-primary hover:underline font-mono text-xs break-all block"
                >
                  {selectedCreatorSubmission.submissionLinks?.[0] || 'Link Submitted'} &rarr;
                </a>
              </div>

              {selectedCreatorSubmission.proofNotes && (
                <div className="p-3 rounded-xl bg-surface-container-lowest border border-slate-800">
                  <span className="text-[10px] text-slate-500 uppercase font-mono block mb-1">Creator Submission Notes:</span>
                  <p className="text-slate-300 font-mono leading-relaxed">{selectedCreatorSubmission.proofNotes}</p>
                </div>
              )}
            </div>

            <form onSubmit={handleExecuteCreatorSubReview} className="space-y-4">
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setCreatorSubDecision('APPROVED');
                    setCreatorSubNotes('Content meets high editorial standards. Reward payout awarded.');
                  }}
                  className={`py-2 px-2.5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
                    creatorSubDecision === 'APPROVED'
                      ? 'bg-emerald-500 text-black shadow-md ring-2 ring-emerald-400'
                      : 'bg-surface-container text-slate-300'
                  }`}
                >
                  ✓ Approve & Pay
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCreatorSubDecision('REVISION_REQUESTED');
                    setCreatorSubNotes('Please fix thumbnail branding and include required link in video description.');
                  }}
                  className={`py-2 px-2.5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
                    creatorSubDecision === 'REVISION_REQUESTED'
                      ? 'bg-amber-500 text-black shadow-md ring-2 ring-amber-400'
                      : 'bg-surface-container text-slate-300'
                  }`}
                >
                  ✎ Request Revision
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCreatorSubDecision('REJECTED');
                    setCreatorSubNotes('Submission does not fulfill campaign brief deliverables.');
                  }}
                  className={`py-2 px-2.5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
                    creatorSubDecision === 'REJECTED'
                      ? 'bg-rose-500 text-black shadow-md ring-2 ring-rose-400'
                      : 'bg-surface-container text-slate-300'
                  }`}
                >
                  ✕ Reject
                </button>
              </div>

              <div>
                <label className="block text-[11px] font-mono uppercase text-slate-300 mb-1">
                  Reviewer Notes & Feedback
                </label>
                <textarea
                  rows={2}
                  required
                  value={creatorSubNotes}
                  onChange={(e) => setCreatorSubNotes(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-surface-container-lowest border border-slate-700 text-white text-xs font-mono"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedCreatorSubmission(null)}
                  className="px-4 py-2 rounded-full bg-slate-800 text-xs text-slate-300 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isReviewingSub}
                  className="px-5 py-2 rounded-full bg-primary-container text-on-primary-container font-semibold text-xs shadow-md cursor-pointer disabled:opacity-50"
                >
                  {isReviewingSub ? 'Saving...' : 'Confirm Decision'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* LAUNCH NEW CREATOR CAMPAIGN MODAL */}
      {/* ===================================================================== */}
      {isCreateCampaignModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-xl bg-[#0a1310] border border-amber-500/50 rounded-3xl shadow-2xl p-6 sm:p-8 text-left max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-2xl">campaign</span>
                <h3 className="text-lg font-bold text-white">
                  Launch Sponsored Creator Campaign
                </h3>
              </div>
              <button
                onClick={() => setIsCreateCampaignModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <form onSubmit={handleExecuteCreateCampaign} className="space-y-4 text-xs font-mono">
              <div>
                <label className="block text-[11px] uppercase text-slate-300 mb-1">
                  Campaign Title *
                </label>
                <input
                  type="text"
                  required
                  value={newCampaignTitle}
                  onChange={(e) => setNewCampaignTitle(e.target.value)}
                  placeholder="e.g. Elysium Genesis Creator Sprint"
                  className="w-full px-3 py-2 rounded-xl bg-surface-container-lowest border border-slate-700 text-white text-xs focus:outline-none focus:border-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] uppercase text-slate-300 mb-1">
                    Brand / Protocol Partner *
                  </label>
                  <input
                    type="text"
                    required
                    value={newCampaignPartner}
                    onChange={(e) => setNewCampaignPartner(e.target.value)}
                    placeholder="e.g. Elysium Foundation or Aureus DEX"
                    className="w-full px-3 py-2 rounded-xl bg-surface-container-lowest border border-slate-700 text-white text-xs focus:outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-[11px] uppercase text-slate-300 mb-1">
                    Campaign Deadline *
                  </label>
                  <input
                    type="text"
                    required
                    value={newCampaignDeadline}
                    onChange={(e) => setNewCampaignDeadline(e.target.value)}
                    placeholder="e.g. In 14 days or Nov 30, 2026"
                    className="w-full px-3 py-2 rounded-xl bg-surface-container-lowest border border-slate-700 text-white text-xs focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] uppercase text-slate-300 mb-1">
                    Total Pool
                  </label>
                  <input
                    type="text"
                    value={newCampaignRewardPool}
                    onChange={(e) => setNewCampaignRewardPool(e.target.value)}
                    placeholder="2,500"
                    className="w-full px-3 py-2 rounded-xl bg-surface-container-lowest border border-slate-700 text-white text-xs focus:outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-[11px] uppercase text-slate-300 mb-1">
                    Payout per Creator
                  </label>
                  <input
                    type="number"
                    value={newCampaignPayout}
                    onChange={(e) => setNewCampaignPayout(e.target.value)}
                    placeholder="250"
                    className="w-full px-3 py-2 rounded-xl bg-surface-container-lowest border border-slate-700 text-white text-xs focus:outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-[11px] uppercase text-slate-300 mb-1">
                    Asset
                  </label>
                  <input
                    type="text"
                    value={newCampaignAsset}
                    onChange={(e) => setNewCampaignAsset(e.target.value)}
                    placeholder="USDC"
                    className="w-full px-3 py-2 rounded-xl bg-surface-container-lowest border border-slate-700 text-white text-xs focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] uppercase text-slate-300 mb-1">
                  Creative Brief & Objective *
                </label>
                <textarea
                  rows={3}
                  required
                  value={newCampaignBrief}
                  onChange={(e) => setNewCampaignBrief(e.target.value)}
                  placeholder="Detail the creative goals, target audience, angle, and core messaging..."
                  className="w-full px-3 py-2 rounded-xl bg-surface-container-lowest border border-slate-700 text-white text-xs focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-[11px] uppercase text-slate-300 mb-1">
                  Required Deliverables (one per line)
                </label>
                <textarea
                  rows={2}
                  value={newCampaignDeliverables}
                  onChange={(e) => setNewCampaignDeliverables(e.target.value)}
                  placeholder="1x in-depth YouTube video or X thread&#10;1x social post with hashtag #Elysium"
                  className="w-full px-3 py-2 rounded-xl bg-surface-container-lowest border border-slate-700 text-white text-xs focus:outline-none focus:border-primary"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreateCampaignModalOpen(false)}
                  className="px-4 py-2 rounded-full bg-slate-800 text-xs text-slate-300 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreatingCampaign}
                  className="px-6 py-2.5 rounded-full bg-primary-container text-on-primary-container font-bold text-xs shadow-md hover:bg-primary-fixed-dim transition-all cursor-pointer disabled:opacity-50"
                >
                  {isCreatingCampaign ? 'Publishing...' : 'Publish Campaign'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* UPDATE PARTNERSHIP REQUEST MODAL */}
      {/* ===================================================================== */}
      {selectedPartnership && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg bg-[#0a1310] border border-cyan-500/50 rounded-3xl shadow-2xl p-6 sm:p-8 text-left max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-cyan-400 text-2xl">handshake</span>
                <h3 className="text-lg font-bold text-white">
                  Update Partnership: {selectedPartnership.projectName}
                </h3>
              </div>
              <button
                onClick={() => setSelectedPartnership(null)}
                className="text-slate-400 hover:text-white"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <div className="space-y-3 mb-5 text-xs font-mono">
              <p className="text-slate-300">
                Objective: <strong className="text-white">{selectedPartnership.campaignObjective}</strong>
              </p>
              <p className="text-slate-300">
                Budget Range: <strong className="text-cyan-300">{selectedPartnership.budgetRange}</strong>
              </p>
              <p className="text-slate-300">
                Contact: <strong className="text-primary">{selectedPartnership.contactInfo}</strong>
              </p>
              <div className="p-3 rounded-xl bg-surface-container-lowest border border-slate-800">
                <span className="text-[10px] text-slate-500 uppercase block mb-1">Requested Service:</span>
                <p className="text-slate-300 leading-relaxed font-sans">{selectedPartnership.requestedService}</p>
              </div>
            </div>

            <form onSubmit={handleExecutePartnershipUpdate} className="space-y-4 text-xs font-mono">
              <div>
                <label className="block text-[11px] uppercase text-slate-300 mb-1">
                  Partnership Status
                </label>
                <select
                  value={partnershipStatusChoice}
                  onChange={(e) => setPartnershipStatusChoice(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl bg-surface-container-lowest border border-slate-700 text-white text-xs focus:outline-none focus:border-cyan-400"
                >
                  <option value="PENDING">PENDING (New Inbound Brief)</option>
                  <option value="CONTACTED">CONTACTED (Active Dialogue / Call)</option>
                  <option value="IN_PROGRESS">IN_PROGRESS (Campaign In Production)</option>
                  <option value="COMPLETED">COMPLETED (Campaign Concluded)</option>
                  <option value="ARCHIVED">ARCHIVED (Closed / Inactive)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] uppercase text-slate-300 mb-1">
                  Admin Team Note (Visible to Project Owner)
                </label>
                <textarea
                  rows={2}
                  required
                  value={partnershipAdminNotes}
                  onChange={(e) => setPartnershipAdminNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-surface-container-lowest border border-slate-700 text-white text-xs focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedPartnership(null)}
                  className="px-4 py-2 rounded-full bg-slate-800 text-xs text-slate-300 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdatingPartnership}
                  className="px-5 py-2 rounded-full bg-cyan-500 text-black font-bold text-xs shadow-md cursor-pointer disabled:opacity-50"
                >
                  {isUpdatingPartnership ? 'Updating...' : 'Save Status'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
