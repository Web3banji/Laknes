/**
 * LAKNES Creator Studio View
 * Open Web3 campaign participation and creator-distribution platform.
 * 
 * Features:
 * 1. Open Access: Every authenticated user has instant access (no application gating).
 * 2. Active Campaigns: Real database campaigns with project details, duration, rules, posting guidelines, rewards.
 * 3. Submission Modal: Submit social post URL with 1-per-day recommendation, status: Pending/Approved/Rejected.
 * 4. Campaign Leaderboard: Ranked by approved submissions, highlighting winners on campaign conclusion.
 * 5. My Submissions: Full participant history, timestamps, statuses, and admin feedback.
 */

import React, { useState, useEffect } from 'react';
import {
  User,
  CreatorCampaign,
  CreatorCampaignSubmission,
  CreatorCampaignLeaderboardEntry,
} from '../../types/contracts.ts';
import { laknesClient } from '../../client/api-client.ts';

interface CreatorStudioViewProps {
  user: User | null;
  onNavigate: (view: string) => void;
  onOpenAuth: (mode?: 'login' | 'register') => void;
}

export function CreatorStudioView({ user, onNavigate, onOpenAuth }: CreatorStudioViewProps) {
  const [activeTab, setActiveTab] = useState<'campaigns' | 'leaderboard' | 'submissions' | 'partnerships'>('campaigns');

  // Campaigns & Submissions State
  const [campaigns, setCampaigns] = useState<CreatorCampaign[]>([]);
  const [isLoadingCampaigns, setIsLoadingCampaigns] = useState(false);
  const [campaignError, setCampaignError] = useState<string | null>(null);

  // Selected Campaign for Submission
  const [selectedCampaignForSubmit, setSelectedCampaignForSubmit] = useState<CreatorCampaign | null>(null);
  const [postUrlInput, setPostUrlInput] = useState('');
  const [proofNotesInput, setProofNotesInput] = useState('');
  const [isSubmittingContent, setIsSubmittingContent] = useState(false);
  const [submitSuccessMsg, setSubmitSuccessMsg] = useState<string | null>(null);
  const [submitErrorMsg, setSubmitErrorMsg] = useState<string | null>(null);

  // User Submissions History
  const [mySubmissions, setMySubmissions] = useState<CreatorCampaignSubmission[]>([]);
  const [isLoadingSubmissions, setIsLoadingSubmissions] = useState(false);

  // Leaderboard State
  const [selectedLeaderboardCampaignId, setSelectedLeaderboardCampaignId] = useState<string>('');
  const [leaderboardData, setLeaderboardData] = useState<CreatorCampaignLeaderboardEntry[]>([]);
  const [isCampaignEnded, setIsCampaignEnded] = useState(false);
  const [isLoadingLeaderboard, setIsLoadingLeaderboard] = useState(false);

  // Partnership Request Form State
  const [partnershipForm, setPartnershipForm] = useState({
    projectName: '',
    contactInfo: '',
    campaignObjective: '',
    requestedService: 'Creator Distribution & Content Campaign',
    budgetRange: 'Flexible / To Be Discussed',
    relevantLinks: '',
  });
  const [isSubmittingPartnership, setIsSubmittingPartnership] = useState(false);
  const [partnershipFeedback, setPartnershipFeedback] = useState<{ text: string; isError: boolean } | null>(null);

  // Load campaigns on mount / user change
  useEffect(() => {
    if (user) {
      loadCampaigns();
      loadMySubmissions();
    }
  }, [user]);

  // Load leaderboard when campaign selection changes
  useEffect(() => {
    if (selectedLeaderboardCampaignId && user) {
      loadLeaderboard(selectedLeaderboardCampaignId);
    }
  }, [selectedLeaderboardCampaignId, user]);

  const loadCampaigns = async () => {
    setIsLoadingCampaigns(true);
    setCampaignError(null);
    try {
      const data = await laknesClient.getCreatorCampaigns();
      setCampaigns(data);
      if (data.length > 0 && !selectedLeaderboardCampaignId) {
        setSelectedLeaderboardCampaignId(data[0].id);
      }
    } catch (err: any) {
      console.error('Failed to load campaigns', err);
      setCampaignError(err?.message || 'Failed to load campaigns.');
    } finally {
      setIsLoadingCampaigns(false);
    }
  };

  const loadMySubmissions = async () => {
    setIsLoadingSubmissions(true);
    try {
      const subs = await laknesClient.getMyCampaignSubmissions();
      setMySubmissions(subs);
    } catch (err) {
      console.error('Failed to load submissions', err);
    } finally {
      setIsLoadingSubmissions(false);
    }
  };

  const loadLeaderboard = async (campaignId: string) => {
    setIsLoadingLeaderboard(true);
    try {
      const res = await laknesClient.getCampaignLeaderboard(campaignId);
      setLeaderboardData(res.leaderboard || []);
      setIsCampaignEnded(Boolean(res.isEnded));
    } catch (err) {
      console.error('Failed to load leaderboard', err);
      setLeaderboardData([]);
    } finally {
      setIsLoadingLeaderboard(false);
    }
  };

  const handleOpenSubmitModal = (camp: CreatorCampaign) => {
    setSelectedCampaignForSubmit(camp);
    setPostUrlInput('');
    setProofNotesInput('');
    setSubmitSuccessMsg(null);
    setSubmitErrorMsg(null);
  };

  const handleContentSubmission = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCampaignForSubmit) return;
    if (!postUrlInput.trim()) {
      setSubmitErrorMsg('Please provide your published content post URL.');
      return;
    }

    setIsSubmittingContent(true);
    setSubmitErrorMsg(null);
    setSubmitSuccessMsg(null);

    try {
      const res = await laknesClient.submitCampaignContent(selectedCampaignForSubmit.id, {
        postUrl: postUrlInput.trim(),
        proofNotes: proofNotesInput.trim() || undefined,
      });

      setSubmitSuccessMsg(
        res.dailyNotice ||
          'Content post submitted successfully! Status: Pending administrator review.'
      );
      setPostUrlInput('');
      setProofNotesInput('');
      await loadMySubmissions();
      // Reload leaderboard if active
      if (selectedLeaderboardCampaignId === selectedCampaignForSubmit.id) {
        await loadLeaderboard(selectedCampaignForSubmit.id);
      }
    } catch (err: any) {
      setSubmitErrorMsg(err?.message || 'Failed to submit post URL. Please verify the URL.');
    } finally {
      setIsSubmittingContent(false);
    }
  };

  const handlePartnershipSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!partnershipForm.projectName.trim() || !partnershipForm.contactInfo.trim() || !partnershipForm.campaignObjective.trim()) {
      setPartnershipFeedback({ text: 'Please fill in all required fields.', isError: true });
      return;
    }

    setIsSubmittingPartnership(true);
    setPartnershipFeedback(null);
    try {
      await laknesClient.submitPartnershipRequest(partnershipForm);
      setPartnershipFeedback({
        text: 'Partnership request submitted successfully. The LAKNES creator operations team will review your project and get in touch.',
        isError: false,
      });
      setPartnershipForm({
        projectName: '',
        contactInfo: '',
        campaignObjective: '',
        requestedService: 'Creator Distribution & Content Campaign',
        budgetRange: 'Flexible / To Be Discussed',
        relevantLinks: '',
      });
    } catch (err: any) {
      setPartnershipFeedback({
        text: err?.message || 'Failed to submit partnership request.',
        isError: true,
      });
    } finally {
      setIsSubmittingPartnership(false);
    }
  };

  // If unauthenticated, display authentication prompt
  if (!user) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center px-6 py-16 text-center bg-background text-on-surface">
        <div className="w-16 h-16 rounded-2xl bg-surface-container-high border border-primary-container/40 flex items-center justify-center text-primary-container mb-6 shadow-[0_0_30px_rgba(255,87,34,0.25)]">
          <span className="material-symbols-outlined text-[32px]">campaign</span>
        </div>
        <h1 className="text-headline-lg font-headline-lg font-bold tracking-tight text-on-surface mb-3">
          LAKNES Creator Studio
        </h1>
        <p className="text-body-md font-body-md text-on-surface-variant max-w-md mb-8 leading-relaxed">
          Open campaign participation for creators and community members. Publish content, submit post URLs, and earn rewards across Web3 ecosystems.
        </p>
        <button
          onClick={() => onOpenAuth('login')}
          className="inline-flex items-center gap-2.5 px-6 py-3 rounded-xl bg-primary-container text-on-primary-container hover:brightness-110 font-label-md text-label-md font-bold transition-all shadow-lg shadow-primary-container/20 cursor-pointer"
        >
          <span className="material-symbols-outlined text-[20px]">login</span>
          <span>Sign In with Google to Enter</span>
        </button>
      </div>
    );
  }

  return (
    <div className="w-full min-h-[calc(100vh-80px)] bg-background text-on-surface flex flex-col font-body-md relative pb-16">
      {/* Ambient Backdrop */}
      <div className="fixed inset-0 pointer-events-none radial-ambient z-0 opacity-40"></div>

      {/* Header Banner */}
      <div className="w-full bg-surface-container-lowest/80 backdrop-blur-md border-b border-outline-variant/30 py-8 px-6 lg:px-12 z-10">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2.5">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary-container/15 text-primary border border-primary-container/30">
                Open Campaign Participation
              </span>
              <span className="text-outline text-xs">
                @{user.username}
              </span>
            </div>
            <h1 className="text-headline-md sm:text-headline-lg font-headline-lg font-bold text-on-surface tracking-tight">
              Creator Studio
            </h1>
            <p className="text-body-sm text-on-surface-variant max-w-2xl">
              Publish authentic content across social platforms, submit your post URLs, and climb the campaign leaderboards.
            </p>
          </div>

          {/* Tab Navigation */}
          <div className="flex items-center gap-1.5 p-1 bg-surface-container-low rounded-xl border border-outline-variant/40 shrink-0 self-start md:self-center overflow-x-auto">
            <button
              onClick={() => setActiveTab('campaigns')}
              className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
                activeTab === 'campaigns'
                  ? 'bg-primary-container text-on-primary-container shadow-md'
                  : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">campaign</span>
              <span>Active Campaigns</span>
            </button>
            <button
              onClick={() => {
                setActiveTab('leaderboard');
                if (campaigns.length > 0 && !selectedLeaderboardCampaignId) {
                  setSelectedLeaderboardCampaignId(campaigns[0].id);
                }
              }}
              className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
                activeTab === 'leaderboard'
                  ? 'bg-primary-container text-on-primary-container shadow-md'
                  : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">leaderboard</span>
              <span>Leaderboard</span>
            </button>
            <button
              onClick={() => setActiveTab('submissions')}
              className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
                activeTab === 'submissions'
                  ? 'bg-primary-container text-on-primary-container shadow-md'
                  : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">history</span>
              <span>My Submissions ({mySubmissions.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('partnerships')}
              className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
                activeTab === 'partnerships'
                  ? 'bg-primary-container text-on-primary-container shadow-md'
                  : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">handshake</span>
              <span>Partner With Us</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="relative z-10 flex-1 max-w-7xl mx-auto w-full px-6 lg:px-12 py-8">
        {/* ========================================================= */}
        {/* TAB 1: ACTIVE CAMPAIGNS                                    */}
        {/* ========================================================= */}
        {activeTab === 'campaigns' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-headline-sm font-headline-sm font-bold text-on-surface">
                  Active Distribution Campaigns
                </h2>
                <p className="text-body-sm text-on-surface-variant">
                  Select a campaign, review the posting rules and deliverables, then publish and submit your post URL.
                </p>
              </div>
              <span className="text-xs font-mono text-outline self-start sm:self-auto">
                {campaigns.length} CAMPAIGN{campaigns.length === 1 ? '' : 'S'} RUNNING
              </span>
            </div>

            {/* Visual Showcase Banner */}
            <div className="relative w-full rounded-2xl overflow-hidden border border-outline-variant/30 bg-surface-container-low shadow-xl">
              <div className="h-44 sm:h-48 w-full relative">
                <img
                  src="/assets/images/creator_campaigns.jpg"
                  alt="Creator Studio & Campaigns"
                  className="w-full h-full object-cover object-center"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-surface-container-lowest/95 via-surface-container-lowest/70 to-transparent"></div>
                <div className="absolute inset-0 flex flex-col justify-center px-6 sm:px-10 max-w-xl">
                  <span className="text-[11px] font-mono uppercase tracking-wider text-secondary font-semibold mb-1 flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[14px]">campaign</span>
                    <span>Creator Campaign Network</span>
                  </span>
                  <h3 className="text-headline-md font-bold text-on-surface">
                    Publish, Submit, and Earn
                  </h3>
                  <p className="text-xs sm:text-sm text-on-surface-variant mt-1.5 leading-relaxed">
                    Participate in verified campaigns by creating authentic social content and submitting your publication proof for review.
                  </p>
                </div>
              </div>
            </div>

            {isLoadingCampaigns ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-64 rounded-2xl bg-surface-container-low animate-pulse"></div>
                ))}
              </div>
            ) : campaignError ? (
              <div className="p-6 rounded-2xl bg-surface-container-low border border-outline-variant/30 text-center">
                <p className="text-rose-400 text-sm mb-3">{campaignError}</p>
                <button
                  onClick={loadCampaigns}
                  className="px-4 py-2 rounded-lg bg-surface-container text-xs text-on-surface hover:bg-surface-container-high transition-colors"
                >
                  Retry Loading
                </button>
              </div>
            ) : campaigns.length === 0 ? (
              <div className="py-20 px-6 rounded-2xl bg-surface-container-low border border-dashed border-outline-variant/40 text-center flex flex-col items-center">
                <div className="w-14 h-14 rounded-2xl bg-surface-container-high border border-outline-variant/40 flex items-center justify-center text-outline mb-4">
                  <span className="material-symbols-outlined text-[28px]">campaign</span>
                </div>
                <h3 className="text-headline-sm font-headline-sm font-semibold text-on-surface mb-2">
                  No active creator campaigns at the moment
                </h3>
                <p className="text-body-sm text-on-surface-variant max-w-md mb-6 leading-relaxed">
                  Campaigns are launched regularly as verified Web3 protocols sponsor distribution. Check back shortly or submit a partnership request for your project.
                </p>
                <button
                  onClick={() => setActiveTab('partnerships')}
                  className="px-5 py-2.5 rounded-xl bg-primary-container text-on-primary-container font-label-md text-xs font-bold hover:brightness-110 transition-all cursor-pointer"
                >
                  Request Campaign for Your Project
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {campaigns.map((camp) => (
                  <div
                    key={camp.id}
                    className="flex flex-col justify-between p-6 rounded-2xl bg-surface-container-low border border-outline-variant/30 hover:border-primary-container/40 transition-all shadow-md group"
                  >
                    <div className="space-y-4">
                      {/* Top Badges */}
                      <div className="flex items-center justify-between gap-2">
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          {camp.status}
                        </span>
                        {camp.deadline && (
                          <span className="text-[11px] font-mono text-outline flex items-center gap-1">
                            <span className="material-symbols-outlined text-[13px]">schedule</span>
                            <span>{camp.deadline}</span>
                          </span>
                        )}
                      </div>

                      {/* Title & Brand */}
                      <div>
                        <div className="text-xs font-semibold text-primary uppercase tracking-wider mb-1">
                          {camp.brandProjectName}
                        </div>
                        <h3 className="text-headline-sm font-headline-sm font-bold text-on-surface group-hover:text-primary transition-colors">
                          {camp.title}
                        </h3>
                        <p className="text-body-sm text-on-surface-variant mt-2 line-clamp-3 leading-relaxed">
                          {camp.objective}
                        </p>
                      </div>

                      {/* Deliverables / Guidelines */}
                      <div className="p-3 rounded-xl bg-surface-container-lowest/80 border border-outline-variant/20 space-y-1.5 text-xs">
                        <div className="flex items-center gap-1.5 text-on-surface font-medium">
                          <span className="material-symbols-outlined text-[15px] text-primary">rule</span>
                          <span>Posting Guidelines & Deliverables:</span>
                        </div>
                        <p className="text-on-surface-variant pl-5 text-[12px] leading-relaxed">
                          {camp.deliverables || camp.briefGuidelines}
                        </p>
                      </div>

                      {/* Reward Info */}
                      <div className="flex items-center justify-between pt-2 border-t border-outline-variant/20 text-xs">
                        <div>
                          <span className="text-outline text-[11px] block">Reward per Approved Post</span>
                          <span className="text-primary font-bold font-mono text-sm">{camp.rewardPerCreator || 'N/A'}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-outline text-[11px] block">Total Reward Pool</span>
                          <span className="text-on-surface font-semibold font-mono text-sm">{camp.rewardPool || 'N/A'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="pt-5 mt-4 border-t border-outline-variant/20 flex items-center gap-3">
                      <button
                        onClick={() => handleOpenSubmitModal(camp)}
                        className="flex-1 py-2.5 px-4 rounded-xl bg-primary-container text-on-primary-container hover:brightness-110 font-label-md text-xs font-bold transition-all text-center flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                      >
                        <span className="material-symbols-outlined text-[16px]">send</span>
                        <span>Submit Post URL</span>
                      </button>
                      <button
                        onClick={() => {
                          setSelectedLeaderboardCampaignId(camp.id);
                          setActiveTab('leaderboard');
                        }}
                        className="p-2.5 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer border border-outline-variant/30"
                        title="View Campaign Leaderboard"
                      >
                        <span className="material-symbols-outlined text-[18px]">leaderboard</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 2: LEADERBOARD                                        */}
        {/* ========================================================= */}
        {activeTab === 'leaderboard' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-headline-sm font-headline-sm font-bold text-on-surface">
                  Campaign Leaderboard & Rankings
                </h2>
                <p className="text-body-sm text-on-surface-variant">
                  Rankings determined by total verified approved content submissions. Final winners highlighted upon campaign completion.
                </p>
              </div>

              {/* Campaign Picker */}
              {campaigns.length > 0 && (
                <div className="flex items-center gap-2">
                  <label htmlFor="campSelect" className="text-xs text-outline font-medium">Campaign:</label>
                  <select
                    id="campSelect"
                    value={selectedLeaderboardCampaignId}
                    onChange={(e) => setSelectedLeaderboardCampaignId(e.target.value)}
                    className="bg-surface-container-low text-on-surface text-xs font-medium border border-outline-variant/40 rounded-xl px-3 py-2 focus:outline-none focus:border-primary-container"
                  >
                    {campaigns.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.brandProjectName} — {c.title}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Campaign Status Banner */}
            {isCampaignEnded && (
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-3 text-emerald-400 text-xs">
                <span className="material-symbols-outlined text-[20px]">emoji_events</span>
                <div>
                  <span className="font-bold">Campaign Concluded!</span> Final rankings and top creator winners are officially locked below.
                </div>
              </div>
            )}

            {/* Leaderboard Table / Cards */}
            {isLoadingLeaderboard ? (
              <div className="h-64 rounded-2xl bg-surface-container-low animate-pulse"></div>
            ) : leaderboardData.length === 0 ? (
              <div className="py-16 px-6 rounded-2xl bg-surface-container-low border border-dashed border-outline-variant/40 text-center flex flex-col items-center">
                <div className="w-12 h-12 rounded-xl bg-surface-container-high border border-outline-variant/40 flex items-center justify-center text-outline mb-3">
                  <span className="material-symbols-outlined text-[24px]">leaderboard</span>
                </div>
                <h4 className="text-headline-sm font-headline-sm font-medium text-on-surface mb-1">
                  No approved submissions yet
                </h4>
                <p className="text-body-sm text-on-surface-variant max-w-sm mb-4">
                  Be the first to publish content and submit your post URL to claim Rank #1!
                </p>
                <button
                  onClick={() => setActiveTab('campaigns')}
                  className="px-4 py-2 rounded-xl bg-primary-container text-on-primary-container text-xs font-bold"
                >
                  View Campaigns & Submit
                </button>
              </div>
            ) : (
              <div className="rounded-2xl bg-surface-container-low border border-outline-variant/30 overflow-hidden shadow-lg">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-surface-container-lowest/80 border-b border-outline-variant/30 text-outline uppercase font-mono">
                      <tr>
                        <th className="py-3.5 px-6">Rank</th>
                        <th className="py-3.5 px-6">Creator</th>
                        <th className="py-3.5 px-6 text-center">Approved Submissions</th>
                        <th className="py-3.5 px-6 text-right">Standing</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-outline-variant/20">
                      {leaderboardData.map((entry) => (
                        <tr
                          key={entry.userId}
                          className={`hover:bg-surface-container transition-colors ${
                            entry.isWinner ? 'bg-primary-container/5' : ''
                          }`}
                        >
                          <td className="py-4 px-6 font-mono font-bold">
                            {entry.rank === 1 ? (
                              <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-amber-400 text-stone-950 font-bold">
                                1
                              </span>
                            ) : entry.rank === 2 ? (
                              <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-slate-300 text-stone-950 font-bold">
                                2
                              </span>
                            ) : entry.rank === 3 ? (
                              <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-amber-700 text-white font-bold">
                                3
                              </span>
                            ) : (
                              <span className="text-outline pl-2">#{entry.rank}</span>
                            )}
                          </td>
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-surface-container-high border border-primary-container/40 flex items-center justify-center text-primary font-bold">
                                {entry.username.slice(0, 2).toUpperCase()}
                              </div>
                              <div>
                                <span className="font-semibold text-on-surface block text-sm">
                                  @{entry.username}
                                </span>
                                {entry.userId === user.id && (
                                  <span className="text-[10px] text-primary font-medium">That's you!</span>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-6 text-center font-mono font-bold text-sm text-primary">
                            {entry.approvedCount}
                          </td>
                          <td className="py-4 px-6 text-right">
                            {entry.isWinner ? (
                              <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-amber-400/15 text-amber-300 border border-amber-400/30 inline-flex items-center gap-1">
                                <span className="material-symbols-outlined text-[13px]">emoji_events</span>
                                <span>Winner</span>
                              </span>
                            ) : entry.rank <= 3 ? (
                              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-primary-container/15 text-primary border border-primary-container/30">
                                Top Tier
                              </span>
                            ) : (
                              <span className="text-outline text-[11px]">Participant</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 3: MY SUBMISSIONS                                     */}
        {/* ========================================================= */}
        {activeTab === 'submissions' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-headline-sm font-headline-sm font-bold text-on-surface">
                  My Submission History
                </h2>
                <p className="text-body-sm text-on-surface-variant">
                  Track the verification status of your submitted content links, reviewer feedback, and awarded rewards.
                </p>
              </div>
              <button
                onClick={loadMySubmissions}
                className="p-2 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface text-xs flex items-center gap-1.5 transition-colors"
              >
                <span className="material-symbols-outlined text-[16px]">refresh</span>
                <span>Refresh</span>
              </button>
            </div>

            {isLoadingSubmissions ? (
              <div className="space-y-4">
                {[1, 2].map((i) => (
                  <div key={i} className="h-28 rounded-2xl bg-surface-container-low animate-pulse"></div>
                ))}
              </div>
            ) : mySubmissions.length === 0 ? (
              <div className="py-16 px-6 rounded-2xl bg-surface-container-low border border-dashed border-outline-variant/40 text-center flex flex-col items-center">
                <div className="w-12 h-12 rounded-xl bg-surface-container-high border border-outline-variant/40 flex items-center justify-center text-outline mb-3">
                  <span className="material-symbols-outlined text-[24px]">send</span>
                </div>
                <h4 className="text-headline-sm font-headline-sm font-medium text-on-surface mb-1">
                  No submissions recorded yet
                </h4>
                <p className="text-body-sm text-on-surface-variant max-w-sm mb-4">
                  Check out the active campaigns, publish content on X or your platforms, and submit your post URL.
                </p>
                <button
                  onClick={() => setActiveTab('campaigns')}
                  className="px-4 py-2 rounded-xl bg-primary-container text-on-primary-container text-xs font-bold"
                >
                  Browse Active Campaigns
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {mySubmissions.map((sub) => {
                  const statusUpper = (sub.status || '').toUpperCase();
                  const isApproved = statusUpper === 'APPROVED';
                  const isRejected = statusUpper === 'REJECTED';
                  const isPending = statusUpper === 'PENDING' || statusUpper === 'SUBMITTED';

                  return (
                    <div
                      key={sub.id}
                      className="p-5 rounded-2xl bg-surface-container-low border border-outline-variant/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center gap-2.5">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                              isApproved
                                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                                : isRejected
                                ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                                : 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                            }`}
                          >
                            {isApproved ? 'Approved' : isRejected ? 'Rejected' : 'Pending Review'}
                          </span>
                          <span className="text-xs text-outline">
                            Submitted: {sub.submittedAt ? new Date(sub.submittedAt).toLocaleDateString() : 'Recent'}
                          </span>
                        </div>

                        <div>
                          <h4 className="font-semibold text-on-surface text-sm">
                            {sub.campaignTitle || 'Campaign Submission'}
                          </h4>
                          {sub.brandProjectName && (
                            <span className="text-xs text-primary font-medium">{sub.brandProjectName}</span>
                          )}
                        </div>

                        {/* Submission Link */}
                        <div className="flex flex-wrap items-center gap-2 pt-1">
                          {sub.submissionLinks && sub.submissionLinks.length > 0 ? (
                            sub.submissionLinks.map((link, idx) => (
                              <a
                                key={idx}
                                href={link}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-surface-container text-xs text-primary hover:text-primary-container border border-outline-variant/30 transition-colors"
                              >
                                <span className="material-symbols-outlined text-[14px]">link</span>
                                <span className="truncate max-w-[280px]">{link}</span>
                              </a>
                            ))
                          ) : (
                            <span className="text-xs text-outline">URL recorded</span>
                          )}
                        </div>

                        {/* Feedback / Admin Notes */}
                        {sub.revisionFeedback && (
                          <div className="text-xs text-on-surface-variant bg-surface-container-lowest p-2.5 rounded-lg border border-outline-variant/20 mt-1">
                            <span className="font-semibold text-on-surface">Reviewer Note: </span>
                            {sub.revisionFeedback}
                          </div>
                        )}
                      </div>

                      {/* Reward Status */}
                      <div className="text-left sm:text-right shrink-0 border-t sm:border-t-0 pt-3 sm:pt-0 border-outline-variant/20">
                        <span className="text-[11px] text-outline block">Reward Amount</span>
                        <span className="font-mono font-bold text-sm text-primary">
                          {sub.payoutAmount || 'Pending Review'}
                        </span>
                        <span className="text-[10px] text-outline block mt-0.5">
                          Payout: {sub.payoutStatus === 'AWARDED' ? 'Awarded' : 'Pending Approval'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 4: PARTNER WITH US                                     */}
        {/* ========================================================= */}
        {activeTab === 'partnerships' && (
          <div className="max-w-2xl mx-auto space-y-6">
            <div>
              <h2 className="text-headline-sm font-headline-sm font-bold text-on-surface">
                Sponsor a Creator Distribution Campaign
              </h2>
              <p className="text-body-sm text-on-surface-variant">
                Web3 teams can partner with LAKNES to launch verified creator campaigns and access coordinated multi-platform distribution.
              </p>
            </div>

            {partnershipFeedback && (
              <div
                className={`p-4 rounded-xl text-xs font-medium ${
                  partnershipFeedback.isError
                    ? 'bg-rose-500/10 border border-rose-500/30 text-rose-400'
                    : 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
                }`}
              >
                {partnershipFeedback.text}
              </div>
            )}

            <form onSubmit={handlePartnershipSubmit} className="space-y-4 p-6 rounded-2xl bg-surface-container-low border border-outline-variant/30 shadow-lg">
              <div>
                <label className="block text-xs font-semibold text-on-surface mb-1">
                  Project / Protocol Name *
                </label>
                <input
                  type="text"
                  required
                  value={partnershipForm.projectName}
                  onChange={(e) => setPartnershipForm({ ...partnershipForm, projectName: e.target.value })}
                  placeholder="e.g. Apex Swap, Nexus L2"
                  className="w-full bg-surface-container-lowest text-on-surface text-xs rounded-xl px-3.5 py-2.5 border border-outline-variant/40 focus:outline-none focus:border-primary-container"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-on-surface mb-1">
                  Contact Information (Telegram or Email) *
                </label>
                <input
                  type="text"
                  required
                  value={partnershipForm.contactInfo}
                  onChange={(e) => setPartnershipForm({ ...partnershipForm, contactInfo: e.target.value })}
                  placeholder="e.g. @telegram_handle or team@project.org"
                  className="w-full bg-surface-container-lowest text-on-surface text-xs rounded-xl px-3.5 py-2.5 border border-outline-variant/40 focus:outline-none focus:border-primary-container"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-on-surface mb-1">
                  Campaign Objective & Desired Deliverables *
                </label>
                <textarea
                  rows={3}
                  required
                  value={partnershipForm.campaignObjective}
                  onChange={(e) => setPartnershipForm({ ...partnershipForm, campaignObjective: e.target.value })}
                  placeholder="Describe what you want creators to highlight: mainnet launch, testnet quests, protocol architecture..."
                  className="w-full bg-surface-container-lowest text-on-surface text-xs rounded-xl p-3 border border-outline-variant/40 focus:outline-none focus:border-primary-container"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-on-surface mb-1">
                  Budget & Reward Pool (Optional)
                </label>
                <input
                  type="text"
                  value={partnershipForm.budgetRange}
                  onChange={(e) => setPartnershipForm({ ...partnershipForm, budgetRange: e.target.value })}
                  placeholder="e.g. $5,000 USDC or Native Tokens"
                  className="w-full bg-surface-container-lowest text-on-surface text-xs rounded-xl px-3.5 py-2.5 border border-outline-variant/40 focus:outline-none focus:border-primary-container"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-on-surface mb-1">
                  Website or Documentation URL
                </label>
                <input
                  type="url"
                  value={partnershipForm.relevantLinks}
                  onChange={(e) => setPartnershipForm({ ...partnershipForm, relevantLinks: e.target.value })}
                  placeholder="https://yourproject.io"
                  className="w-full bg-surface-container-lowest text-on-surface text-xs rounded-xl px-3.5 py-2.5 border border-outline-variant/40 focus:outline-none focus:border-primary-container"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmittingPartnership}
                className="w-full py-3 rounded-xl bg-primary-container text-on-primary-container font-label-md text-xs font-bold hover:brightness-110 transition-all disabled:opacity-50 cursor-pointer shadow-md"
              >
                {isSubmittingPartnership ? 'Submitting Proposal...' : 'Submit Partnership Request'}
              </button>
            </form>
          </div>
        )}
      </div>

      {/* ========================================================= */}
      {/* CONTENT SUBMISSION MODAL                                  */}
      {/* ========================================================= */}
      {selectedCampaignForSubmit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl bg-surface-container-low border border-outline-variant/40 p-6 shadow-2xl space-y-5 text-on-surface animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-4">
              <div>
                <span className="text-[11px] font-semibold text-primary uppercase tracking-wider block">
                  {selectedCampaignForSubmit.brandProjectName}
                </span>
                <h3 className="text-headline-sm font-headline-sm font-bold text-on-surface">
                  Submit Content Post URL
                </h3>
                <p className="text-body-sm text-on-surface-variant mt-0.5">
                  {selectedCampaignForSubmit.title}
                </p>
              </div>
              <button
                onClick={() => setSelectedCampaignForSubmit(null)}
                className="p-1 rounded-lg text-outline hover:text-on-surface transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            {/* Campaign Rules & Reward Callout */}
            <div className="p-3.5 rounded-xl bg-surface-container-lowest border border-outline-variant/20 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-outline">Reward on Approval:</span>
                <span className="text-primary font-bold font-mono text-sm">{selectedCampaignForSubmit.rewardPerCreator || 'N/A'}</span>
              </div>
              <div className="text-on-surface-variant leading-relaxed">
                <strong className="text-on-surface">Posting Guidelines: </strong>
                {selectedCampaignForSubmit.deliverables || selectedCampaignForSubmit.briefGuidelines}
              </div>
            </div>

            {/* Daily Submission Recommendation Notice */}
            <div className="p-3 rounded-xl bg-primary-container/10 border border-primary-container/20 flex items-start gap-2.5 text-xs text-primary">
              <span className="material-symbols-outlined text-[18px] shrink-0 mt-0.5">info</span>
              <div>
                <span className="font-semibold block">Quality Recommendation:</span>
                LAKNES recommends 1 submission per user per day per campaign to foster thoughtful, high-engagement content.
              </div>
            </div>

            {/* Error or Success feedback */}
            {submitErrorMsg && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
                {submitErrorMsg}
              </div>
            )}
            {submitSuccessMsg && (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-medium">
                {submitSuccessMsg}
              </div>
            )}

            {/* Submission Form */}
            <form onSubmit={handleContentSubmission} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-on-surface mb-1">
                  Published Post URL *
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[16px]">
                    link
                  </span>
                  <input
                    type="url"
                    required
                    value={postUrlInput}
                    onChange={(e) => setPostUrlInput(e.target.value)}
                    placeholder="https://x.com/username/status/... or YouTube/article link"
                    className="w-full bg-surface-container-lowest text-on-surface text-xs rounded-xl pl-9 pr-3.5 py-2.5 border border-outline-variant/40 focus:outline-none focus:border-primary-container"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-on-surface mb-1">
                  Notes or Context (Optional)
                </label>
                <textarea
                  rows={2}
                  value={proofNotesInput}
                  onChange={(e) => setProofNotesInput(e.target.value)}
                  placeholder="Optional brief comment about your post, impressions, or angle..."
                  className="w-full bg-surface-container-lowest text-on-surface text-xs rounded-xl p-3 border border-outline-variant/40 focus:outline-none focus:border-primary-container"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedCampaignForSubmit(null)}
                  className="px-4 py-2 rounded-xl text-xs text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer"
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingContent}
                  className="px-5 py-2.5 rounded-xl bg-primary-container text-on-primary-container font-label-md text-xs font-bold hover:brightness-110 transition-all disabled:opacity-50 cursor-pointer shadow-md"
                >
                  {isSubmittingContent ? 'Submitting Proof...' : 'Submit Post URL'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
