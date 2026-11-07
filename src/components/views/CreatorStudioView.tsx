/**
 * LAKNES Creator Studio View (Yochi-inspired Design System)
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

  useEffect(() => {
    if (user) {
      loadCampaigns();
      loadMySubmissions();
    }
  }, [user]);

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

  if (!user) {
    return (
      <div className="lp-page py-20">
        <div className="lp-shell max-w-xl text-center">
          <div className="p-10 bg-[var(--yo-surface-1)] border-[1.5px] border-[var(--yo-ink)] shadow-[6px_6px_0_var(--yo-ink)]">
            <span className="lp-eyebrow mb-2">03 / BUILD</span>
            <h1 className="yo-display text-3xl text-[var(--yo-ink)] mb-3">
              Creator Studio
            </h1>
            <p className="font-body text-sm text-[var(--yo-muted)] mb-6 leading-relaxed">
              Open campaign participation for creators and community members. Publish content, submit post URLs, and earn rewards across Web3 ecosystems.
            </p>
            <button
              onClick={() => onOpenAuth('login')}
              className="lp-button lp-button-primary mx-auto"
            >
              <span>SIGN IN TO ENTER</span>
              <span aria-hidden="true">↗</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="lp-page py-12">
      <div className="lp-shell">
        {/* Header */}
        <div className="border-b-[1.5px] border-[var(--yo-ink)] pb-8 mb-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="lp-eyebrow">03 / BUILD</span>
                <span className="font-mono text-xs font-bold text-[var(--yo-muted)]">@{user.username}</span>
              </div>
              <h1 className="yo-display text-3xl sm:text-5xl text-[var(--yo-ink)]">
                Creator Studio
              </h1>
              <p className="font-body text-base text-[var(--yo-muted)] mt-2 max-w-2xl leading-relaxed">
                Publish authentic content across social platforms, submit your post URLs, and climb the campaign leaderboards.
              </p>
            </div>

            {/* Tab Navigation */}
            <div className="flex items-center gap-1 p-1 bg-[var(--yo-surface-1)] border border-[var(--yo-line)] overflow-x-auto shrink-0">
              <button
                onClick={() => setActiveTab('campaigns')}
                className={`px-3 py-1.5 font-mono text-[10px] font-bold uppercase tracking-wider transition-colors whitespace-nowrap cursor-pointer ${
                  activeTab === 'campaigns'
                    ? 'bg-[var(--yo-ink)] text-[var(--yo-bg)]'
                    : 'text-[var(--yo-muted)] hover:text-[var(--yo-ink)]'
                }`}
              >
                ACTIVE CAMPAIGNS
              </button>
              <button
                onClick={() => {
                  setActiveTab('leaderboard');
                  if (campaigns.length > 0 && !selectedLeaderboardCampaignId) {
                    setSelectedLeaderboardCampaignId(campaigns[0].id);
                  }
                }}
                className={`px-3 py-1.5 font-mono text-[10px] font-bold uppercase tracking-wider transition-colors whitespace-nowrap cursor-pointer ${
                  activeTab === 'leaderboard'
                    ? 'bg-[var(--yo-ink)] text-[var(--yo-bg)]'
                    : 'text-[var(--yo-muted)] hover:text-[var(--yo-ink)]'
                }`}
              >
                LEADERBOARD
              </button>
              <button
                onClick={() => setActiveTab('submissions')}
                className={`px-3 py-1.5 font-mono text-[10px] font-bold uppercase tracking-wider transition-colors whitespace-nowrap cursor-pointer ${
                  activeTab === 'submissions'
                    ? 'bg-[var(--yo-ink)] text-[var(--yo-bg)]'
                    : 'text-[var(--yo-muted)] hover:text-[var(--yo-ink)]'
                }`}
              >
                MY WORK ({mySubmissions.length})
              </button>
              <button
                onClick={() => setActiveTab('partnerships')}
                className={`px-3 py-1.5 font-mono text-[10px] font-bold uppercase tracking-wider transition-colors whitespace-nowrap cursor-pointer ${
                  activeTab === 'partnerships'
                    ? 'bg-[var(--yo-ink)] text-[var(--yo-bg)]'
                    : 'text-[var(--yo-muted)] hover:text-[var(--yo-ink)]'
                }`}
              >
                PARTNER
              </button>
            </div>
          </div>
        </div>

        {/* TAB 1: ACTIVE CAMPAIGNS */}
        {activeTab === 'campaigns' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <span className="lp-eyebrow">CAMPAIGN OPPORTUNITIES</span>
                <h2 className="yo-display text-2xl text-[var(--yo-ink)] mt-1">
                  Active Distribution Campaigns
                </h2>
              </div>
              <span className="font-mono text-[10px] font-bold text-[var(--yo-muted)] uppercase">
                {campaigns.length} CAMPAIGN{campaigns.length === 1 ? '' : 'S'} RUNNING
              </span>
            </div>

            {isLoadingCampaigns ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-64 bg-[var(--yo-surface-1)] border border-[var(--yo-line)] animate-pulse"></div>
                ))}
              </div>
            ) : campaignError ? (
              <div className="p-6 bg-[var(--yo-surface-1)] border border-[var(--yo-line)] text-center">
                <p className="text-[var(--yo-bad)] text-xs mb-3 font-mono">{campaignError}</p>
                <button
                  onClick={loadCampaigns}
                  className="lp-button lp-button-secondary text-xs"
                >
                  <span>RETRY LOADING</span>
                </button>
              </div>
            ) : campaigns.length === 0 ? (
              <div className="py-16 px-6 bg-[var(--yo-surface-1)] border border-[var(--yo-line)] text-center flex flex-col items-center">
                <span className="w-12 h-12 border border-[var(--yo-line)] flex items-center justify-center font-mono text-xl mb-3 text-[var(--yo-muted)]">
                  &empty;
                </span>
                <h3 className="yo-display text-lg text-[var(--yo-ink)] mb-1">
                  No active creator campaigns at the moment
                </h3>
                <p className="font-body text-xs text-[var(--yo-muted)] max-w-md mb-6 leading-relaxed">
                  Campaigns are launched regularly as verified Web3 protocols sponsor distribution.
                </p>
                <button
                  onClick={() => setActiveTab('partnerships')}
                  className="lp-button lp-button-primary text-xs"
                >
                  <span>REQUEST CAMPAIGN FOR YOUR PROJECT</span>
                  <span aria-hidden="true">+</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {campaigns.map((camp) => (
                  <div
                    key={camp.id}
                    className="flex flex-col justify-between p-6 bg-[var(--yo-surface-1)] border-[1.5px] border-[var(--yo-line)] hover:border-[var(--yo-ink)] transition-all hover:shadow-[4px_4px_0_var(--yo-ink)] group rounded-[2px]"
                  >
                    <div className="space-y-4">
                      <div className="flex items-center justify-between gap-2">
                        <span className="lp-tag text-[9px]">
                          {camp.status}
                        </span>
                        {camp.deadline && (
                          <span className="text-[10px] font-mono text-[var(--yo-muted)] font-bold flex items-center gap-1">
                            <span className="material-symbols-outlined text-[12px]">schedule</span>
                            <span>{camp.deadline}</span>
                          </span>
                        )}
                      </div>

                      <div>
                        <div className="text-[10px] font-mono font-bold text-[var(--yo-accent-text)] uppercase tracking-wider mb-1">
                          {camp.brandProjectName}
                        </div>
                        <h3 className="yo-display text-xl text-[var(--yo-ink)] group-hover:text-[var(--yo-accent-text)] transition-colors">
                          {camp.title}
                        </h3>
                        <p className="font-body text-xs text-[var(--yo-muted)] mt-2 line-clamp-3 leading-relaxed">
                          {camp.objective}
                        </p>
                      </div>

                      <div className="p-3 bg-[var(--yo-surface-2)] border border-[var(--yo-line)] space-y-1 text-xs">
                        <span className="font-mono text-[9px] font-bold text-[var(--yo-ink)] uppercase tracking-wider block">
                          POSTING GUIDELINES &amp; DELIVERABLES:
                        </span>
                        <p className="font-body text-[11px] text-[var(--yo-muted)] leading-relaxed">
                          {camp.deliverables || camp.briefGuidelines}
                        </p>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-[var(--yo-line)] text-xs font-mono">
                        <div>
                          <span className="text-[9px] text-[var(--yo-muted)] block uppercase font-bold">REWARD PER POST</span>
                          <span className="text-[var(--yo-accent-text)] font-bold text-sm">{camp.rewardPerCreator || 'N/A'}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-[9px] text-[var(--yo-muted)] block uppercase font-bold">REWARD POOL</span>
                          <span className="text-[var(--yo-ink)] font-bold text-sm">{camp.rewardPool || 'N/A'}</span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-4 mt-4 border-t border-[var(--yo-line)] flex items-center gap-3">
                      <button
                        onClick={() => handleOpenSubmitModal(camp)}
                        className="lp-button lp-button-primary flex-1 text-xs justify-center"
                        style={{ minHeight: '40px', padding: '8px 14px' }}
                      >
                        <span>SUBMIT POST URL</span>
                        <span aria-hidden="true">↗</span>
                      </button>
                      <button
                        onClick={() => {
                          setSelectedLeaderboardCampaignId(camp.id);
                          setActiveTab('leaderboard');
                        }}
                        className="p-2 border border-[var(--yo-line)] bg-[var(--yo-surface-2)] text-[var(--yo-ink)] hover:border-[var(--yo-ink)] transition-colors cursor-pointer"
                        title="View Campaign Leaderboard"
                      >
                        <span className="material-symbols-outlined text-[16px]">leaderboard</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: LEADERBOARD */}
        {activeTab === 'leaderboard' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="lp-eyebrow">STANDINGS</span>
                <h2 className="yo-display text-2xl text-[var(--yo-ink)] mt-1">
                  Campaign Leaderboard
                </h2>
              </div>

              {campaigns.length > 0 && (
                <div className="flex items-center gap-2">
                  <label htmlFor="campSelect" className="text-xs font-mono font-bold text-[var(--yo-muted)] uppercase">Campaign:</label>
                  <select
                    id="campSelect"
                    value={selectedLeaderboardCampaignId}
                    onChange={(e) => setSelectedLeaderboardCampaignId(e.target.value)}
                    className="bg-[var(--yo-surface-1)] text-[var(--yo-ink)] text-xs font-mono font-bold border border-[var(--yo-line)] px-3 py-1.5 focus:outline-none focus:border-[var(--yo-ink)]"
                  >
                    {campaigns.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.brandProjectName} &mdash; {c.title}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {isCampaignEnded && (
              <div className="p-3 bg-[var(--yo-surface-1)] border border-[var(--yo-good)] flex items-center gap-3 text-[var(--yo-good)] text-xs font-mono font-bold">
                <span className="material-symbols-outlined text-[18px]">emoji_events</span>
                <span>CAMPAIGN CONCLUDED &mdash; FINAL RANKINGS ARE LOCKED.</span>
              </div>
            )}

            {isLoadingLeaderboard ? (
              <div className="h-64 bg-[var(--yo-surface-1)] border border-[var(--yo-line)] animate-pulse"></div>
            ) : leaderboardData.length === 0 ? (
              <div className="py-16 px-6 bg-[var(--yo-surface-1)] border border-[var(--yo-line)] text-center flex flex-col items-center">
                <span className="w-12 h-12 border border-[var(--yo-line)] flex items-center justify-center font-mono text-xl mb-3 text-[var(--yo-muted)]">
                  &empty;
                </span>
                <h4 className="yo-display text-base text-[var(--yo-ink)] mb-1">
                  No approved submissions yet
                </h4>
                <p className="font-body text-xs text-[var(--yo-muted)] max-w-sm mb-4">
                  Be the first to publish content and submit your post URL to claim Rank #1!
                </p>
                <button
                  onClick={() => setActiveTab('campaigns')}
                  className="lp-button lp-button-primary text-xs"
                >
                  <span>VIEW CAMPAIGNS &amp; SUBMIT</span>
                  <span aria-hidden="true">↗</span>
                </button>
              </div>
            ) : (
              <div className="bg-[var(--yo-surface-1)] border-[1.5px] border-[var(--yo-ink)] shadow-[4px_4px_0_var(--yo-ink)] overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs font-mono">
                    <thead className="bg-[var(--yo-surface-2)] border-b border-[var(--yo-line)] text-[var(--yo-muted)] uppercase">
                      <tr>
                        <th className="py-3 px-6">Rank</th>
                        <th className="py-3 px-6">Creator</th>
                        <th className="py-3 px-6 text-center">Approved Submissions</th>
                        <th className="py-3 px-6 text-right">Standing</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--yo-line)]">
                      {leaderboardData.map((entry) => (
                        <tr key={entry.userId} className="hover:bg-[var(--yo-surface-2)] transition-colors">
                          <td className="py-3.5 px-6 font-bold">
                            {entry.rank === 1 ? (
                              <span className="inline-flex items-center justify-center w-6 h-6 bg-[var(--yo-ink)] text-[var(--yo-bg)] font-bold text-xs">
                                1
                              </span>
                            ) : (
                              <span>#{entry.rank}</span>
                            )}
                          </td>
                          <td className="py-3.5 px-6">
                            <div className="flex items-center gap-2.5">
                              <div className="w-6 h-6 border border-[var(--yo-line)] bg-[var(--yo-surface-2)] flex items-center justify-center font-bold text-[10px]">
                                {entry.username.slice(0, 2).toUpperCase()}
                              </div>
                              <span className="font-bold text-[var(--yo-ink)] text-sm">
                                @{entry.username}
                              </span>
                              {entry.userId === user.id && (
                                <span className="text-[10px] text-[var(--yo-accent-text)] font-bold uppercase">(YOU)</span>
                              )}
                            </div>
                          </td>
                          <td className="py-3.5 px-6 text-center font-bold text-sm text-[var(--yo-accent-text)]">
                            {entry.approvedCount}
                          </td>
                          <td className="py-3.5 px-6 text-right">
                            {entry.isWinner ? (
                              <span className="px-2 py-0.5 border border-[var(--yo-gold)] text-[var(--yo-gold)] font-bold text-[10px] uppercase">
                                WINNER
                              </span>
                            ) : entry.rank <= 3 ? (
                              <span className="px-2 py-0.5 border border-[var(--yo-ink)] text-[var(--yo-ink)] font-bold text-[10px] uppercase">
                                TOP TIER
                              </span>
                            ) : (
                              <span className="text-[var(--yo-muted)] text-[10px] uppercase">PARTICIPANT</span>
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

        {/* TAB 3: MY SUBMISSIONS */}
        {activeTab === 'submissions' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <span className="lp-eyebrow">YOUR RECORD</span>
                <h2 className="yo-display text-2xl text-[var(--yo-ink)] mt-1">
                  My Submission History
                </h2>
              </div>
              <button
                onClick={loadMySubmissions}
                className="lp-button lp-button-secondary text-xs"
                style={{ minHeight: '36px', padding: '6px 12px' }}
              >
                <span>REFRESH</span>
                <span className="material-symbols-outlined text-[14px]">refresh</span>
              </button>
            </div>

            {isLoadingSubmissions ? (
              <div className="space-y-4">
                {[1, 2].map((i) => (
                  <div key={i} className="h-24 bg-[var(--yo-surface-1)] border border-[var(--yo-line)] animate-pulse"></div>
                ))}
              </div>
            ) : mySubmissions.length === 0 ? (
              <div className="py-16 px-6 bg-[var(--yo-surface-1)] border border-[var(--yo-line)] text-center flex flex-col items-center">
                <span className="w-12 h-12 border border-[var(--yo-line)] flex items-center justify-center font-mono text-xl mb-3 text-[var(--yo-muted)]">
                  &empty;
                </span>
                <h4 className="yo-display text-base text-[var(--yo-ink)] mb-1">
                  No submissions recorded yet
                </h4>
                <p className="font-body text-xs text-[var(--yo-muted)] max-w-sm mb-4">
                  Check out the active campaigns, publish content on X or your platforms, and submit your post URL.
                </p>
                <button
                  onClick={() => setActiveTab('campaigns')}
                  className="lp-button lp-button-primary text-xs"
                >
                  <span>BROWSE ACTIVE CAMPAIGNS</span>
                  <span aria-hidden="true">↗</span>
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {mySubmissions.map((sub) => {
                  const statusUpper = (sub.status || '').toUpperCase();
                  const isApproved = statusUpper === 'APPROVED';
                  const isRejected = statusUpper === 'REJECTED';

                  return (
                    <div
                      key={sub.id}
                      className="p-4 bg-[var(--yo-surface-1)] border border-[var(--yo-line)] hover:border-[var(--yo-ink)] flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wider border ${
                              isApproved
                                ? 'border-[var(--yo-good)] text-[var(--yo-good)]'
                                : isRejected
                                ? 'border-[var(--yo-bad)] text-[var(--yo-bad)]'
                                : 'border-[var(--yo-gold)] text-[var(--yo-gold)]'
                            }`}
                          >
                            {isApproved ? 'APPROVED' : isRejected ? 'REJECTED' : 'PENDING REVIEW'}
                          </span>
                          <span className="text-xs font-mono text-[var(--yo-muted)]">
                            {sub.submittedAt ? new Date(sub.submittedAt).toLocaleDateString() : 'Recent'}
                          </span>
                        </div>

                        <div>
                          <h4 className="yo-display text-sm text-[var(--yo-ink)]">
                            {sub.campaignTitle || 'Campaign Submission'}
                          </h4>
                          {sub.brandProjectName && (
                            <span className="text-xs font-mono font-bold text-[var(--yo-accent-text)]">{sub.brandProjectName}</span>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-2 pt-1 font-mono text-xs">
                          {sub.submissionLinks && sub.submissionLinks.length > 0 ? (
                            sub.submissionLinks.map((link, idx) => (
                              <a
                                key={idx}
                                href={link}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 text-[var(--yo-accent-text)] hover:underline"
                              >
                                <span>LINK ↗</span>
                                <span className="text-[var(--yo-muted)] text-[10px] truncate max-w-[240px]">({link})</span>
                              </a>
                            ))
                          ) : (
                            <span className="text-xs text-[var(--yo-muted)] font-mono">URL RECORDED</span>
                          )}
                        </div>

                        {sub.revisionFeedback && (
                          <div className="text-xs text-[var(--yo-muted)] bg-[var(--yo-surface-2)] p-2 border border-[var(--yo-line)] font-mono">
                            <span className="font-bold text-[var(--yo-ink)]">NOTE: </span>
                            {sub.revisionFeedback}
                          </div>
                        )}
                      </div>

                      <div className="text-left sm:text-right shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0 border-[var(--yo-line)] font-mono">
                        <span className="text-[9px] text-[var(--yo-muted)] block uppercase font-bold">REWARD</span>
                        <span className="font-bold text-sm text-[var(--yo-accent-text)]">
                          {sub.payoutAmount || 'Pending Review'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 4: PARTNER WITH US */}
        {activeTab === 'partnerships' && (
          <div className="max-w-2xl mx-auto space-y-6">
            <div>
              <span className="lp-eyebrow">FOR PROTOCOLS</span>
              <h2 className="yo-display text-2xl text-[var(--yo-ink)] mt-1">
                Sponsor a Distribution Campaign
              </h2>
              <p className="font-body text-sm text-[var(--yo-muted)] mt-1">
                Web3 teams can partner with LAKNES to launch verified creator campaigns and access coordinated multi-platform distribution.
              </p>
            </div>

            {partnershipFeedback && (
              <div
                className={`p-3 font-mono text-xs font-bold ${
                  partnershipFeedback.isError
                    ? 'border border-[var(--yo-bad)] text-[var(--yo-bad)] bg-[var(--yo-surface-1)]'
                    : 'border border-[var(--yo-good)] text-[var(--yo-good)] bg-[var(--yo-surface-1)]'
                }`}
              >
                {partnershipFeedback.text}
              </div>
            )}

            <form onSubmit={handlePartnershipSubmit} className="space-y-4 p-6 bg-[var(--yo-surface-1)] border-[1.5px] border-[var(--yo-ink)] shadow-[4px_4px_0_var(--yo-ink)]">
              <div>
                <label className="block text-xs font-mono font-bold uppercase text-[var(--yo-ink)] mb-1">
                  PROJECT / PROTOCOL NAME *
                </label>
                <input
                  type="text"
                  required
                  value={partnershipForm.projectName}
                  onChange={(e) => setPartnershipForm({ ...partnershipForm, projectName: e.target.value })}
                  placeholder="e.g. Apex Swap, Nexus L2"
                  className="lp-input"
                />
              </div>

              <div>
                <label className="block text-xs font-mono font-bold uppercase text-[var(--yo-ink)] mb-1">
                  CONTACT INFORMATION (TELEGRAM OR EMAIL) *
                </label>
                <input
                  type="text"
                  required
                  value={partnershipForm.contactInfo}
                  onChange={(e) => setPartnershipForm({ ...partnershipForm, contactInfo: e.target.value })}
                  placeholder="e.g. @telegram_handle or team@project.org"
                  className="lp-input font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-mono font-bold uppercase text-[var(--yo-ink)] mb-1">
                  CAMPAIGN OBJECTIVE &amp; DESIRED DELIVERABLES *
                </label>
                <textarea
                  rows={3}
                  required
                  value={partnershipForm.campaignObjective}
                  onChange={(e) => setPartnershipForm({ ...partnershipForm, campaignObjective: e.target.value })}
                  placeholder="Describe what you want creators to highlight: ecosystem launch, protocol architecture, quests..."
                  className="lp-input"
                />
              </div>

              <div>
                <label className="block text-xs font-mono font-bold uppercase text-[var(--yo-ink)] mb-1">
                  BUDGET &amp; REWARD POOL (OPTIONAL)
                </label>
                <input
                  type="text"
                  value={partnershipForm.budgetRange}
                  onChange={(e) => setPartnershipForm({ ...partnershipForm, budgetRange: e.target.value })}
                  placeholder="e.g. $5,000 USDC or Native Tokens"
                  className="lp-input font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-mono font-bold uppercase text-[var(--yo-ink)] mb-1">
                  WEBSITE OR DOCUMENTATION URL
                </label>
                <input
                  type="url"
                  value={partnershipForm.relevantLinks}
                  onChange={(e) => setPartnershipForm({ ...partnershipForm, relevantLinks: e.target.value })}
                  placeholder="https://yourproject.io"
                  className="lp-input font-mono"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmittingPartnership}
                className="lp-button lp-button-primary w-full justify-center"
              >
                <span>{isSubmittingPartnership ? 'SUBMITTING PROPOSAL...' : 'SUBMIT PARTNERSHIP REQUEST'}</span>
                <span aria-hidden="true">↗</span>
              </button>
            </form>
          </div>
        )}
      </div>

      {/* SUBMISSION MODAL */}
      {selectedCampaignForSubmit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-lg lp-modal-box p-6 space-y-4">
            <div className="flex items-start justify-between gap-4 border-b border-[var(--yo-line)] pb-3">
              <div>
                <span className="font-mono text-[10px] font-bold text-[var(--yo-accent-text)] uppercase block">
                  {selectedCampaignForSubmit.brandProjectName}
                </span>
                <h3 className="yo-display text-xl text-[var(--yo-ink)] mt-0.5">
                  Submit Content Post URL
                </h3>
                <p className="font-body text-xs text-[var(--yo-muted)]">
                  {selectedCampaignForSubmit.title}
                </p>
              </div>
              <button
                onClick={() => setSelectedCampaignForSubmit(null)}
                className="p-1 border border-[var(--yo-line)] hover:border-[var(--yo-ink)] cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <div className="p-3 bg-[var(--yo-surface-2)] border border-[var(--yo-line)] space-y-1.5 text-xs font-mono">
              <div className="flex items-center justify-between">
                <span className="text-[var(--yo-muted)] font-bold uppercase">REWARD ON APPROVAL:</span>
                <span className="text-[var(--yo-accent-text)] font-bold text-sm">{selectedCampaignForSubmit.rewardPerCreator || 'N/A'}</span>
              </div>
              <div className="text-[var(--yo-muted)] leading-relaxed pt-1 font-body">
                <strong className="text-[var(--yo-ink)] font-mono text-[10px] uppercase block mb-0.5">GUIDELINES: </strong>
                {selectedCampaignForSubmit.deliverables || selectedCampaignForSubmit.briefGuidelines}
              </div>
            </div>

            <div className="p-2.5 border border-[var(--yo-line)] bg-[var(--yo-surface-1)] text-xs text-[var(--yo-muted)] font-mono">
              <strong className="text-[var(--yo-ink)] uppercase">RECOMMENDATION:</strong> 1 submission per creator per day to support high-quality deliverables.
            </div>

            {submitErrorMsg && (
              <div className="p-2.5 border border-[var(--yo-bad)] text-[var(--yo-bad)] text-xs font-mono">
                {submitErrorMsg}
              </div>
            )}
            {submitSuccessMsg && (
              <div className="p-2.5 border border-[var(--yo-good)] text-[var(--yo-good)] text-xs font-mono font-bold">
                {submitSuccessMsg}
              </div>
            )}

            <form onSubmit={handleContentSubmission} className="space-y-4">
              <div>
                <label className="block text-xs font-mono font-bold uppercase text-[var(--yo-ink)] mb-1">
                  PUBLISHED POST URL *
                </label>
                <input
                  type="url"
                  required
                  value={postUrlInput}
                  onChange={(e) => setPostUrlInput(e.target.value)}
                  placeholder="https://x.com/username/status/... or YouTube/article link"
                  className="lp-input font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-mono font-bold uppercase text-[var(--yo-ink)] mb-1">
                  NOTES OR CONTEXT (OPTIONAL)
                </label>
                <textarea
                  rows={2}
                  value={proofNotesInput}
                  onChange={(e) => setProofNotesInput(e.target.value)}
                  placeholder="Optional brief comment about your post, impressions, or angle..."
                  className="lp-input"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedCampaignForSubmit(null)}
                  className="lp-button lp-button-secondary text-xs"
                  style={{ minHeight: '38px', padding: '6px 14px' }}
                >
                  <span>CANCEL</span>
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingContent}
                  className="lp-button lp-button-primary text-xs"
                  style={{ minHeight: '38px', padding: '6px 16px' }}
                >
                  <span>{isSubmittingContent ? 'SUBMITTING...' : 'SUBMIT POST URL'}</span>
                  <span aria-hidden="true">↗</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
