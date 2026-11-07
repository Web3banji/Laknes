/**
 * LAKNES User Profile & Dashboard View
 * Modeled with high-fidelity X-style layout:
 * - 3:1 Header Banner with camera/edit overlay & preset selector
 * - Overlapping circular Avatar (PFP) with camera/edit overlay & preset selector
 * - Display Name, Verified Badge, @username, and Role tags
 * - Multiline Bio with link detection
 * - Joined date & metric counters (Following, Quests, XP)
 * - Clickable social links: 𝕏 X (Twitter), Telegram, Instagram, Discord, GitHub, Website, and dynamic Custom Links
 * - Interactive X-style "Edit Profile" modal with live preview
 * - Comprehensive tabs: Overview, Quests History, Followed Protocols, Saved Bookmarks, Security
 */

import React, { useState, useEffect, useRef } from 'react';
import { User, Project, Quest, QuestParticipation, UserRole } from '../../types/contracts.ts';
import { laknesClient } from '../../client/api-client.ts';
import { ProjectCard } from '../common/ProjectCard.tsx';
import { QuestCard } from '../common/QuestCard.tsx';

interface ProfileViewProps {
  user: User | null;
  onNavigate: (view: string) => void;
  onOpenAuth: (mode?: 'login' | 'register') => void;
  onSelectProject: (project: Project) => void;
  onSelectQuest?: (quest: Quest) => void;
  onLogout: () => void;
  onUserUpdated: (updatedUser: User) => void;
  onOpenDashboard?: (projectId: string) => void;
  onSwitchToProjectWorkspace?: (projectId: string) => void;
}

const DEFAULT_BANNER = '/src/assets/images/elysium_profile_header_1792495690946.jpg';
const DEFAULT_AVATAR = '/src/assets/images/elysium_avatar_default_1792495691476.jpg';

const BANNER_PRESETS = [
  { name: 'Laser Grid', url: '/src/assets/images/elysium_profile_header_1792495690946.jpg' },
  { name: 'Deep Space', url: 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?auto=format&fit=crop&w=1200&q=80' },
  { name: 'Cyber Wave', url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80' },
  { name: 'Minimal Tech', url: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=1200&q=80' },
];

const AVATAR_PRESETS = [
  { name: 'Cyber Scout', url: '/src/assets/images/elysium_avatar_default_1792495691476.jpg' },
  { name: 'Architect', url: 'https://api.dicebear.com/7.x/bottts/svg?seed=ElysiumArchitect' },
  { name: 'Cyberpunk', url: 'https://api.dicebear.com/7.x/bottts/svg?seed=CyberPunk99' },
  { name: 'Operator', url: 'https://api.dicebear.com/7.x/bottts/svg?seed=NodeOperator' },
];

const AVAILABLE_INTERESTS = [
  'DeFi & Yield',
  'Infrastructure & Nodes',
  'Gaming & Metaverse',
  'AI & Tooling',
  'Social & Media',
  'NFTs & Collectibles',
  'Governance & DAOs',
  'Security & Auditing',
];

export function ProfileView({
  user,
  onNavigate,
  onOpenAuth,
  onSelectProject,
  onSelectQuest,
  onLogout,
  onUserUpdated,
  onSwitchToProjectWorkspace,
}: ProfileViewProps) {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'quests' | 'saved' | 'follows' | 'security'>('dashboard');
  const [savedSubTab, setSavedSubTab] = useState<'quests' | 'projects'>('quests');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Profile Edit State
  const [usernameInput, setUsernameInput] = useState(user?.username || '');
  const [nameInput, setNameInput] = useState(user?.name || '');
  const [bioInput, setBioInput] = useState(user?.bio || '');
  const [imageInput, setImageInput] = useState(user?.profileImage || '');
  const [headerInput, setHeaderInput] = useState(user?.headerImage || '');
  const [selectedInterests, setSelectedInterests] = useState<string[]>(user?.interests || []);
  const [twitterInput, setTwitterInput] = useState(user?.socialLinks?.twitter || user?.xAccount || '');
  const [telegramInput, setTelegramInput] = useState(user?.socialLinks?.telegram || '');
  const [instagramInput, setInstagramInput] = useState(user?.socialLinks?.instagram || '');
  const [discordInput, setDiscordInput] = useState(user?.socialLinks?.discord || '');
  const [githubInput, setGithubInput] = useState(user?.socialLinks?.github || '');
  const [websiteInput, setWebsiteInput] = useState(user?.socialLinks?.website || '');
  const [customLinks, setCustomLinks] = useState<Array<{ label: string; url: string }>>(
    user?.socialLinks?.customLinks || []
  );

  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileMessage, setProfileMessage] = useState<{ text: string; isError: boolean } | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [quickUpdateToast, setQuickUpdateToast] = useState<{ text: string; isError: boolean } | null>(null);

  // Synchronize edit inputs whenever user prop changes
  useEffect(() => {
    if (user) {
      setUsernameInput(user.username || '');
      setNameInput(user.name || '');
      setBioInput(user.bio || '');
      setImageInput(user.profileImage || '');
      setHeaderInput(user.headerImage || '');
      setSelectedInterests(user.interests || []);
      setTwitterInput(user.socialLinks?.twitter || user.xAccount || '');
      setTelegramInput(user.socialLinks?.telegram || '');
      setInstagramInput(user.socialLinks?.instagram || '');
      setDiscordInput(user.socialLinks?.discord || '');
      setGithubInput(user.socialLinks?.github || '');
      setWebsiteInput(user.socialLinks?.website || '');
      setCustomLinks(user.socialLinks?.customLinks || []);
    }
  }, [user]);

  // Hidden File Inputs for Device Gallery Picture Picking
  const directAvatarInputRef = useRef<HTMLInputElement | null>(null);
  const directHeaderInputRef = useRef<HTMLInputElement | null>(null);
  const modalAvatarInputRef = useRef<HTMLInputElement | null>(null);
  const modalHeaderInputRef = useRef<HTMLInputElement | null>(null);

  /**
   * Handle image picked from device gallery / local storage
   */
  const handleImageFileChange = (
    file: File | undefined,
    target: 'avatar' | 'header',
    immediateSave = false
  ) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file (PNG, JPG, WEBP, etc.) from your device.');
      return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
      const dataUrl = e.target?.result as string;
      if (!dataUrl) return;

      if (target === 'avatar') {
        setImageInput(dataUrl);
        if (immediateSave && user) {
          try {
            setIsUploadingImage(true);
            const updated = await laknesClient.updateUserProfile(user.id, {
              profileImage: dataUrl,
            });
            onUserUpdated(updated);
            setQuickUpdateToast({ text: 'Profile picture updated successfully!', isError: false });
            setTimeout(() => setQuickUpdateToast(null), 3500);
          } catch (err: any) {
            console.error('Failed to update avatar image', err);
            setQuickUpdateToast({ text: err?.message || 'Failed to update avatar.', isError: true });
            setTimeout(() => setQuickUpdateToast(null), 3500);
          } finally {
            setIsUploadingImage(false);
          }
        }
      } else {
        setHeaderInput(dataUrl);
        if (immediateSave && user) {
          try {
            setIsUploadingImage(true);
            const updated = await laknesClient.updateUserProfile(user.id, {
              headerImage: dataUrl,
            });
            onUserUpdated(updated);
            setQuickUpdateToast({ text: 'Header banner updated successfully!', isError: false });
            setTimeout(() => setQuickUpdateToast(null), 3500);
          } catch (err: any) {
            console.error('Failed to update header image', err);
            setQuickUpdateToast({ text: err?.message || 'Failed to update header banner.', isError: true });
            setTimeout(() => setQuickUpdateToast(null), 3500);
          } finally {
            setIsUploadingImage(false);
          }
        }
      }
    };
    reader.readAsDataURL(file);
  };

  // Security password fields
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<{ text: string; isError: boolean } | null>(null);

  // Lists Data
  const [followedProjects, setFollowedProjects] = useState<Project[]>([]);
  const [savedProjects, setSavedProjects] = useState<Project[]>([]);
  const [savedQuests, setSavedQuests] = useState<Quest[]>([]);
  const [participations, setParticipations] = useState<QuestParticipation[]>([]);
  const [allQuestsMap, setAllQuestsMap] = useState<Record<string, Quest>>({});
  const [myProjects, setMyProjects] = useState<Array<Project & { myMembershipRole?: string }>>([]);
  const [isLoadingLists, setIsLoadingLists] = useState(false);

  useEffect(() => {
    if (user) {
      setUsernameInput(user.username || '');
      setNameInput(user.name || '');
      setBioInput(user.bio || '');
      setImageInput(user.profileImage || '');
      setHeaderInput(user.headerImage || '');
      setSelectedInterests(user.interests || []);
      setTwitterInput(user.socialLinks?.twitter || user.xAccount || '');
      setTelegramInput(user.socialLinks?.telegram || '');
      setInstagramInput(user.socialLinks?.instagram || '');
      setDiscordInput(user.socialLinks?.discord || '');
      setGithubInput(user.socialLinks?.github || '');
      setWebsiteInput(user.socialLinks?.website || '');
      setCustomLinks(user.socialLinks?.customLinks || []);
      loadUserData();
    }
  }, [user]);

  const loadUserData = async () => {
    if (!user) return;
    setIsLoadingLists(true);
    try {
      const [follows, savedP, savedQ, questsHistory, projs, allQ] = await Promise.all([
        laknesClient.getUserFollows(user.id).catch(() => []),
        laknesClient.getUserSavedProjects(user.id).catch(() => []),
        laknesClient.getUserSavedQuests(user.id).catch(() => []),
        laknesClient.getUserQuests(user.id).catch(() => []),
        laknesClient.getUserProjects(user.id).catch(() => []),
        laknesClient.getActiveQuests().catch(() => []),
      ]);

      const qMap: Record<string, Quest> = {};
      for (const q of allQ) {
        qMap[q.id] = q;
      }

      setFollowedProjects(follows);
      setSavedProjects(savedP);
      setSavedQuests(savedQ);
      setParticipations(questsHistory);
      setMyProjects(projs);
      setAllQuestsMap(qMap);
    } catch (err) {
      console.error('Error loading user data', err);
    } finally {
      setIsLoadingLists(false);
    }
  };

  const toggleInterest = (interest: string) => {
    setSelectedInterests((prev) =>
      prev.includes(interest) ? prev.filter((i) => i !== interest) : [...prev, interest]
    );
  };

  const handleAddCustomLink = () => {
    setCustomLinks((prev) => [...prev, { label: '', url: '' }]);
  };

  const handleUpdateCustomLink = (index: number, field: 'label' | 'url', value: string) => {
    setCustomLinks((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const handleRemoveCustomLink = (index: number) => {
    setCustomLinks((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (usernameInput.trim().length < 3) {
      setProfileMessage({ text: 'Display name / username must be at least 3 characters.', isError: true });
      return;
    }

    setIsSavingProfile(true);
    setProfileMessage(null);
    try {
      const validCustomLinks = customLinks
        .map((l) => ({ label: l.label.trim(), url: l.url.trim() }))
        .filter((l) => l.url.length > 0);

      const socialLinks = {
        twitter: twitterInput.trim() || undefined,
        telegram: telegramInput.trim() || undefined,
        instagram: instagramInput.trim() || undefined,
        discord: discordInput.trim() || undefined,
        github: githubInput.trim() || undefined,
        website: websiteInput.trim() || undefined,
        customLinks: validCustomLinks.length > 0 ? validCustomLinks : undefined,
      };

      const updated = await laknesClient.updateUserProfile(user.id, {
        username: usernameInput.trim(),
        name: nameInput.trim() || undefined,
        bio: bioInput.trim() || undefined,
        profileImage: imageInput.trim() || undefined,
        headerImage: headerInput.trim() || undefined,
        interests: selectedInterests,
        xAccount: twitterInput.trim() || undefined,
        socialLinks,
      });

      onUserUpdated(updated);
      setProfileMessage({ text: 'Profile changes saved successfully!', isError: false });
      setTimeout(() => {
        setProfileMessage(null);
        setIsEditModalOpen(false);
      }, 1200);
    } catch (err: any) {
      setProfileMessage({ text: err?.message || 'Error updating profile.', isError: true });
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMessage(null);

    if (!currentPassword) {
      setPasswordMessage({ text: 'Please enter your current password.', isError: true });
      return;
    }
    if (newPassword.length < 8) {
      setPasswordMessage({ text: 'New password must be at least 8 characters long.', isError: true });
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setPasswordMessage({ text: 'New passwords do not match.', isError: true });
      return;
    }

    setIsSavingPassword(true);
    try {
      await laknesClient.changePassword(currentPassword, newPassword);
      setPasswordMessage({ text: 'Password changed successfully!', isError: false });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
      setTimeout(() => setPasswordMessage(null), 3500);
    } catch (err: any) {
      setPasswordMessage({ text: err?.message || 'Failed to update password.', isError: true });
    } finally {
      setIsSavingPassword(false);
    }
  };

  const handleUnfollowProject = async (projectId: string) => {
    try {
      await laknesClient.unfollowProject(projectId);
      setFollowedProjects((prev) => prev.filter((p) => p.id !== projectId));
    } catch (err) {
      console.error('Failed to unfollow', err);
    }
  };

  const handleUnsaveProject = async (projectId: string) => {
    try {
      await laknesClient.unsaveProject(projectId);
      setSavedProjects((prev) => prev.filter((p) => p.id !== projectId));
    } catch (err) {
      console.error('Failed to unsave project', err);
    }
  };

  const handleUnsaveQuest = async (questId: string) => {
    try {
      await laknesClient.unsaveQuest(questId);
      setSavedQuests((prev) => prev.filter((q) => q.id !== questId));
    } catch (err) {
      console.error('Failed to unsave quest', err);
    }
  };

  if (!user) {
    return (
      <div className="lp-shell py-24 text-center">
        <div className="max-w-xl mx-auto p-10 rounded-[2px] bg-[var(--yo-surface-1)] border-[1.5px] border-[var(--yo-ink)] flex flex-col items-center shadow-[4px_4px_0_var(--yo-ink)]">
          <span className="material-symbols-outlined text-5xl text-[var(--yo-accent)] mb-3">account_circle</span>
          <h2 className="text-xl font-bold text-[var(--yo-ink)] mb-2 yo-display">Sign In to View Your Dashboard</h2>
          <p className="text-xs text-[var(--yo-muted)] max-w-md mb-6 leading-relaxed">
            Access your personalized ecosystem dashboard, track followed protocols, inspect saved quests, and update your profile settings.
          </p>
          <button
            onClick={() => onOpenAuth('login')}
            className="lp-button lp-button-primary text-xs cursor-pointer"
          >
            Sign In / Register
          </button>
        </div>
      </div>
    );
  }

  const formattedJoinedDate = user.createdAt
    ? new Date(user.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long' })
    : 'October 2026';

  const completedQuestsCount = participations.filter((p) => p.completionStatus === 'VERIFIED').length;
  const currentBanner = user.headerImage || DEFAULT_BANNER;
  const currentAvatar = user.profileImage || DEFAULT_AVATAR;

  // Clean social links normalization
  const xLink = user.socialLinks?.twitter || user.xAccount;
  const telegramLink = user.socialLinks?.telegram;
  const instagramLink = user.socialLinks?.instagram;
  const discordHandle = user.socialLinks?.discord;
  const githubHandle = user.socialLinks?.github;
  const websiteUrl = user.socialLinks?.website;
  const customLinksList = user.socialLinks?.customLinks || [];

  return (
    <div className="lp-shell py-8">
      {/* ========================================================= */}
      {/* X-STYLE PROFILE HEADER CARD */}
      {/* ========================================================= */}
      <div className="relative rounded-[2px] overflow-hidden bg-[var(--yo-surface-1)] border-[1.5px] border-[var(--yo-ink)] shadow-[4px_4px_0_var(--yo-ink)] mb-8">
        {/* Hidden File Inputs for Device Gallery Picture Picking */}
        <input
          type="file"
          ref={directHeaderInputRef}
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleImageFileChange(file, 'header', true);
            e.target.value = '';
          }}
        />
        <input
          type="file"
          ref={directAvatarInputRef}
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleImageFileChange(file, 'avatar', true);
            e.target.value = '';
          }}
        />
        <input
          type="file"
          ref={modalHeaderInputRef}
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleImageFileChange(file, 'header', false);
            e.target.value = '';
          }}
        />
        <input
          type="file"
          ref={modalAvatarInputRef}
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleImageFileChange(file, 'avatar', false);
            e.target.value = '';
          }}
        />

        {/* Quick Picture Update Toast Notification */}
        {quickUpdateToast && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-40 px-4 py-2 rounded-[2px] bg-emerald-50 border border-[var(--yo-good)] text-[var(--yo-good)] text-xs font-medium shadow-md flex items-center gap-2 animate-fade-in yo-mono">
            <span className="material-symbols-outlined text-[16px]">check_circle</span>
            <span>{quickUpdateToast.text}</span>
          </div>
        )}

        {isUploadingImage && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-40 px-4 py-2 rounded-[2px] bg-[var(--yo-surface-1)] border border-[var(--yo-accent)] text-[var(--yo-accent)] text-xs font-medium shadow-md flex items-center gap-2 yo-mono">
            <span className="material-symbols-outlined text-[16px] animate-spin">progress_activity</span>
            <span>Updating picture across LAKNES...</span>
          </div>
        )}

        {/* 1. Header Banner (Strict 3:1 Aspect Ratio: 1500×500px standard) */}
        <div className="relative w-full aspect-[3/1] max-h-[380px] bg-[var(--yo-surface-2)] overflow-hidden group border-b-[1.5px] border-[var(--yo-line)]">
          <img
            src={currentBanner}
            alt="Profile Banner (1500x500 3:1 ratio)"
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            onError={(e) => {
              (e.target as HTMLImageElement).src = DEFAULT_BANNER;
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[var(--yo-surface-1)] via-transparent to-transparent"></div>

          {/* Banner Direct Gallery & Options Triggers */}
          <div className="absolute top-4 right-4 flex items-center gap-2">
            <button
              type="button"
              onClick={() => directHeaderInputRef.current?.click()}
              className="lp-button lp-button-primary text-xs py-1 px-3 flex items-center gap-1.5 cursor-pointer"
              title="Pick header banner from your device gallery"
            >
              <span className="material-symbols-outlined text-[15px]">add_photo_alternate</span>
              <span>Upload Header</span>
            </button>
            <button
              type="button"
              onClick={() => setIsEditModalOpen(true)}
              className="lp-button lp-button-secondary text-xs py-1 px-3 flex items-center gap-1.5 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[15px]">edit</span>
              <span>Edit</span>
            </button>
          </div>

          <div className="absolute bottom-3 right-4 px-2.5 py-0.5 rounded-[2px] bg-[var(--yo-surface-1)]/90 border border-[var(--yo-line)] text-[10px] yo-mono text-[var(--yo-muted)] opacity-0 group-hover:opacity-100 transition-opacity">
            X Header Ratio 3:1 (1500×500px)
          </div>
        </div>

        {/* 2. Overlapping Avatar & Action Bar Row */}
        <div className="px-6 sm:px-8 pb-6 sm:pb-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 -mt-16 sm:-mt-20 md:-mt-24 mb-4">
            {/* Avatar */}
            <div className="relative w-32 h-32 sm:w-36 sm:h-36 md:w-40 md:h-40 rounded-full border-4 border-[var(--yo-surface-1)] bg-[var(--yo-surface-2)] shadow-[3px_3px_0_var(--yo-ink)] overflow-hidden group shrink-0 ring-1 ring-[var(--yo-line)]">
              <img
                src={currentAvatar}
                alt={user.name || user.username}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = DEFAULT_AVATAR;
                }}
              />
              <button
                type="button"
                onClick={() => directAvatarInputRef.current?.click()}
                className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white cursor-pointer"
                title="Change profile picture from device gallery"
              >
                <span className="material-symbols-outlined text-3xl text-[var(--yo-accent)]">add_a_photo</span>
                <span className="text-[11px] yo-mono mt-1 font-bold text-white">Pick from Gallery</span>
                <span className="text-[9px] yo-mono text-stone-300">400×400 PFP</span>
              </button>
            </div>

            {/* Actions: Edit Profile Button & Sign Out */}
            <div className="flex items-center gap-2.5 self-start sm:self-auto pt-2 sm:pt-0">
              <button
                type="button"
                onClick={() => setIsEditModalOpen(true)}
                className="lp-button lp-button-secondary text-xs sm:text-sm flex items-center gap-2 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">edit</span>
                <span>Edit profile</span>
              </button>

              <button
                type="button"
                onClick={onLogout}
                className="p-2.5 rounded-[2px] border border-[var(--yo-line)] bg-[var(--yo-surface-2)] text-[var(--yo-muted)] hover:text-rose-600 hover:border-rose-400 transition-colors cursor-pointer shadow-[2px_2px_0_var(--yo-ink)]"
                title="Sign Out"
              >
                <span className="material-symbols-outlined text-[18px]">logout</span>
              </button>
            </div>
          </div>

          {/* 3. User Identity Block */}
          <div className="space-y-3">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl sm:text-3xl font-bold text-[var(--yo-ink)] tracking-tight yo-display">
                  {user.name || user.username}
                </h1>
                <span className="material-symbols-outlined text-[20px] text-[var(--yo-accent)]" title="Verified Member">
                  verified
                </span>
                {user.roles.map((r) => (
                  <span
                    key={r}
                    className={`ml-1 px-2.5 py-0.5 rounded-[2px] text-[10px] yo-mono uppercase font-bold border ${
                      r === UserRole.ADMIN
                        ? 'bg-amber-100 text-amber-900 border-amber-300'
                        : 'bg-[var(--yo-surface-2)] text-[var(--yo-ink)] border-[var(--yo-line)]'
                    }`}
                  >
                    {r}
                  </span>
                ))}
              </div>
              <p className="text-sm text-[var(--yo-muted)] yo-mono mt-0.5">@{user.username}</p>
            </div>

            {/* Bio with line breaks */}
            {user.bio ? (
              <p className="text-sm text-[var(--yo-ink)] leading-relaxed max-w-2xl whitespace-pre-wrap">
                {user.bio}
              </p>
            ) : (
              <p className="text-sm text-[var(--yo-muted)] italic">
                No bio added yet. Click &quot;Edit profile&quot; to customize your story, add your PFP, header, and social links.
              </p>
            )}

            {/* Interests Chips */}
            {user.interests && user.interests.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                {user.interests.map((interest) => (
                  <span
                    key={interest}
                    className="px-2.5 py-0.5 rounded-[2px] bg-[var(--yo-surface-2)] text-[var(--yo-ink)] text-[11px] font-semibold border border-[var(--yo-line)] yo-mono"
                  >
                    {interest}
                  </span>
                ))}
              </div>
            )}

            {/* Metadata (Joined date & metrics) */}
            <div className="flex flex-wrap items-center gap-4 text-xs text-[var(--yo-muted)] pt-1 yo-mono">
              <span className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px]">calendar_month</span>
                <span>Joined {formattedJoinedDate}</span>
              </span>
              <span>&bull;</span>
              <span className="flex items-center gap-1">
                <strong className="text-[var(--yo-ink)] font-bold">{followedProjects.length}</strong>
                <span>Following</span>
              </span>
              <span>&bull;</span>
              <span className="flex items-center gap-1">
                <strong className="text-[var(--yo-good)] font-bold">{completedQuestsCount}</strong>
                <span>Quests Verified</span>
              </span>
            </div>

            {/* 4. Rich Social Links Strip */}
            <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-[var(--yo-line)]">
              {xLink && (
                <a
                  href={xLink.startsWith('http') ? xLink : `https://x.com/${xLink.replace(/^@/, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[2px] bg-[var(--yo-surface-2)] hover:bg-[var(--yo-surface-1)] border border-[var(--yo-line)] text-xs text-[var(--yo-ink)] hover:border-[var(--yo-ink)] transition-all shadow-[2px_2px_0_var(--yo-ink)] yo-mono"
                >
                  <span className="font-bold text-[13px]">𝕏</span>
                  <span>@{xLink.replace(/^@/, '').replace('https://x.com/', '').replace('https://twitter.com/', '')}</span>
                </a>
              )}

              {telegramLink && (
                <a
                  href={telegramLink.startsWith('http') ? telegramLink : `https://t.me/${telegramLink.replace(/^@/, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[2px] bg-[var(--yo-surface-2)] hover:bg-[var(--yo-surface-1)] border border-[var(--yo-line)] text-xs text-[var(--yo-ink)] hover:border-[var(--yo-ink)] transition-all shadow-[2px_2px_0_var(--yo-ink)] yo-mono"
                >
                  <span className="material-symbols-outlined text-[15px]">send</span>
                  <span>t.me/{telegramLink.replace(/^@/, '').replace('https://t.me/', '')}</span>
                </a>
              )}

              {instagramLink && (
                <a
                  href={instagramLink.startsWith('http') ? instagramLink : `https://instagram.com/${instagramLink.replace(/^@/, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[2px] bg-[var(--yo-surface-2)] hover:bg-[var(--yo-surface-1)] border border-[var(--yo-line)] text-xs text-[var(--yo-ink)] hover:border-[var(--yo-ink)] transition-all shadow-[2px_2px_0_var(--yo-ink)] yo-mono"
                >
                  <span className="material-symbols-outlined text-[15px]">photo_camera</span>
                  <span>@{instagramLink.replace(/^@/, '').replace('https://instagram.com/', '')}</span>
                </a>
              )}

              {discordHandle && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[2px] bg-[var(--yo-surface-2)] border border-[var(--yo-line)] text-xs text-[var(--yo-ink)] shadow-[2px_2px_0_var(--yo-ink)] yo-mono">
                  <span className="material-symbols-outlined text-[15px]">chat</span>
                  <span>{discordHandle}</span>
                </span>
              )}

              {githubHandle && (
                <a
                  href={githubHandle.startsWith('http') ? githubHandle : `https://github.com/${githubHandle.replace(/^@/, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[2px] bg-[var(--yo-surface-2)] hover:bg-[var(--yo-surface-1)] border border-[var(--yo-line)] text-xs text-[var(--yo-ink)] hover:border-[var(--yo-ink)] transition-all shadow-[2px_2px_0_var(--yo-ink)] yo-mono"
                >
                  <span className="material-symbols-outlined text-[15px]">code</span>
                  <span>github/{githubHandle.replace(/^@/, '').replace('https://github.com/', '')}</span>
                </a>
              )}

              {websiteUrl && (
                <a
                  href={websiteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[2px] bg-[var(--yo-surface-2)] hover:bg-[var(--yo-surface-1)] border border-[var(--yo-line)] text-xs text-[var(--yo-ink)] hover:border-[var(--yo-ink)] transition-all shadow-[2px_2px_0_var(--yo-ink)] yo-mono"
                >
                  <span className="material-symbols-outlined text-[15px]">language</span>
                  <span>{websiteUrl.replace(/^https?:\/\//, '').replace(/\/$/, '')}</span>
                </a>
              )}

              {customLinksList.map((link, idx) => (
                <a
                  key={idx}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[2px] bg-[var(--yo-surface-2)] hover:bg-[var(--yo-surface-1)] border border-[var(--yo-line)] text-xs text-[var(--yo-accent)] hover:border-[var(--yo-ink)] transition-all shadow-[2px_2px_0_var(--yo-ink)] yo-mono"
                >
                  <span className="material-symbols-outlined text-[15px]">link</span>
                  <span>{link.label || 'Link'}</span>
                </a>
              ))}

              {!xLink && !telegramLink && !instagramLink && !discordHandle && !githubHandle && !websiteUrl && customLinksList.length === 0 && (
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(true)}
                  className="text-xs text-[var(--yo-accent)] hover:underline flex items-center gap-1 py-1 yo-mono"
                >
                  <span className="material-symbols-outlined text-[15px]">add_link</span>
                  <span>Add your social links (X, Telegram, Instagram, Portfolio)</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* AUTHORIZED PROJECT BANNER (if user manages a protocol) */}
      {/* ========================================================= */}
      {myProjects.length > 0 && onSwitchToProjectWorkspace && (
        <div className="mb-6 p-5 rounded-[2px] bg-[var(--yo-surface-1)] border-[1.5px] border-[var(--yo-ink)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-[4px_4px_0_var(--yo-ink)]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-[2px] bg-[var(--yo-surface-2)] border border-[var(--yo-line)] flex items-center justify-center text-[var(--yo-accent)] shrink-0 shadow-[2px_2px_0_var(--yo-ink)]">
              <span className="material-symbols-outlined text-[24px]">token</span>
            </div>
            <div>
              <span className="text-xs font-bold text-[var(--yo-ink)] block yo-display">
                Authorized Representative of {myProjects[0].name}
              </span>
              <span className="text-[11px] text-[var(--yo-muted)]">
                You hold verified management access for {myProjects.length} project workspace{myProjects.length > 1 ? 's' : ''}. Switch anytime without signing in again.
              </span>
            </div>
          </div>
          <button
            onClick={() => onSwitchToProjectWorkspace(myProjects[0].id)}
            className="lp-button lp-button-primary text-xs shrink-0 cursor-pointer flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-[16px]">token</span>
            <span>Switch to Project Workspace</span>
          </button>
        </div>
      )}
      {/* ========================================================= */}
      {/* TABS NAVIGATION */}
      {/* ========================================================= */}
      <div className="flex border-b border-[var(--yo-line)] gap-4 sm:gap-6 mb-6 overflow-x-auto pb-1 scrollbar-none yo-mono">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`pb-3 text-xs uppercase font-bold border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
            activeTab === 'dashboard'
              ? 'border-[var(--yo-accent)] text-[var(--yo-accent)]'
              : 'border-transparent text-[var(--yo-muted)] hover:text-[var(--yo-ink)]'
          }`}
        >
          <span className="material-symbols-outlined text-[16px]">dashboard</span>
          Overview
        </button>

        <button
          onClick={() => setActiveTab('quests')}
          className={`pb-3 text-xs uppercase font-bold border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
            activeTab === 'quests'
              ? 'border-[var(--yo-accent)] text-[var(--yo-accent)]'
              : 'border-transparent text-[var(--yo-muted)] hover:text-[var(--yo-ink)]'
          }`}
        >
          <span className="material-symbols-outlined text-[16px]">military_tech</span>
          Quests History ({participations.length})
        </button>

        <button
          onClick={() => setActiveTab('follows')}
          className={`pb-3 text-xs uppercase font-bold border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
            activeTab === 'follows'
              ? 'border-[var(--yo-accent)] text-[var(--yo-accent)]'
              : 'border-transparent text-[var(--yo-muted)] hover:text-[var(--yo-ink)]'
          }`}
        >
          <span className="material-symbols-outlined text-[16px]">bookmark_manager</span>
          Followed Projects ({followedProjects.length})
        </button>

        <button
          onClick={() => setActiveTab('saved')}
          className={`pb-3 text-xs uppercase font-bold border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
            activeTab === 'saved'
              ? 'border-[var(--yo-accent)] text-[var(--yo-accent)]'
              : 'border-transparent text-[var(--yo-muted)] hover:text-[var(--yo-ink)]'
          }`}
        >
          <span className="material-symbols-outlined text-[16px]">bookmarks</span>
          Saved Bookmarks ({savedQuests.length + savedProjects.length})
        </button>

        <button
          onClick={() => setActiveTab('security')}
          className={`pb-3 text-xs uppercase font-bold border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
            activeTab === 'security'
              ? 'border-[var(--yo-accent)] text-[var(--yo-accent)]'
              : 'border-transparent text-[var(--yo-muted)] hover:text-[var(--yo-ink)]'
          }`}
        >
          <span className="material-symbols-outlined text-[16px]">lock</span>
          Security
        </button>
      </div>

      {/* ========================================================= */}
      {/* TAB CONTENT */}
      {/* ========================================================= */}

      {/* 1. OVERVIEW TAB */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-[2px] bg-[var(--yo-surface-1)] border-[1.5px] border-[var(--yo-ink)] shadow-[3px_3px_0_var(--yo-ink)]">
              <span className="text-xs text-[var(--yo-muted)] uppercase yo-mono block font-semibold">Followed</span>
              <span className="text-2xl font-bold text-[var(--yo-accent)] mt-1 block yo-display">{followedProjects.length}</span>
              <span className="text-[11px] text-[var(--yo-muted)]">Active broadcasts</span>
            </div>
            <div className="p-4 rounded-[2px] bg-[var(--yo-surface-1)] border-[1.5px] border-[var(--yo-ink)] shadow-[3px_3px_0_var(--yo-ink)]">
              <span className="text-xs text-[var(--yo-muted)] uppercase yo-mono block font-semibold">Quests Joined</span>
              <span className="text-2xl font-bold text-[var(--yo-ink)] mt-1 block yo-display">{participations.length}</span>
              <span className="text-[11px] text-[var(--yo-muted)]">Participation records</span>
            </div>
            <div className="p-4 rounded-[2px] bg-[var(--yo-surface-1)] border-[1.5px] border-[var(--yo-ink)] shadow-[3px_3px_0_var(--yo-ink)]">
              <span className="text-xs text-[var(--yo-muted)] uppercase yo-mono block font-semibold">Verified Done</span>
              <span className="text-2xl font-bold text-[var(--yo-good)] mt-1 block yo-display">{completedQuestsCount}</span>
              <span className="text-[11px] text-[var(--yo-muted)]">Earned achievements</span>
            </div>
            <div className="p-4 rounded-[2px] bg-[var(--yo-surface-1)] border-[1.5px] border-[var(--yo-ink)] shadow-[3px_3px_0_var(--yo-ink)]">
              <span className="text-xs text-[var(--yo-muted)] uppercase yo-mono block font-semibold">Bookmarks</span>
              <span className="text-2xl font-bold text-[var(--yo-ink)] mt-1 block yo-display">{savedQuests.length + savedProjects.length}</span>
              <span className="text-[11px] text-[var(--yo-muted)]">Saved items</span>
            </div>
          </div>

          {/* Recent Quests Progress */}
          <div className="p-6 rounded-[2px] bg-[var(--yo-surface-1)] border-[1.5px] border-[var(--yo-ink)] shadow-[4px_4px_0_var(--yo-ink)]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-[var(--yo-ink)] uppercase yo-display">Active Quests Progress</h3>
              <button
                onClick={() => setActiveTab('quests')}
                className="text-xs text-[var(--yo-accent)] hover:underline cursor-pointer yo-mono font-semibold"
              >
                View all ({participations.length})
              </button>
            </div>

            {participations.length === 0 ? (
              <div className="text-center py-8 text-[var(--yo-muted)]">
                <span className="material-symbols-outlined text-4xl text-[var(--yo-muted)] mb-2">military_tech</span>
                <p className="text-xs">You haven&apos;t joined any quests yet.</p>
                <button
                  onClick={() => onNavigate('quests')}
                  className="mt-3 lp-button lp-button-primary text-xs cursor-pointer"
                >
                  Explore Quests
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {participations.slice(0, 3).map((p) => {
                  const quest = allQuestsMap[p.questId];
                  return (
                    <div
                      key={p.id}
                      onClick={() => quest && onSelectQuest && onSelectQuest(quest)}
                      className="p-3.5 rounded-[2px] bg-[var(--yo-surface-2)] border border-[var(--yo-line)] hover:border-[var(--yo-ink)] flex items-center justify-between gap-4 cursor-pointer transition-colors shadow-[2px_2px_0_var(--yo-ink)]"
                    >
                      <div className="min-w-0">
                        <span className="text-xs font-semibold text-[var(--yo-ink)] truncate block yo-display">
                          {quest?.title || `Quest ID: ${p.questId}`}
                        </span>
                        <span className="text-[11px] text-[var(--yo-muted)] block mt-0.5 yo-mono">
                          Enrolled: {new Date(p.startedAt).toLocaleDateString()}
                        </span>
                      </div>
                      <span
                        className={`px-2.5 py-0.5 rounded-[2px] text-[10px] yo-mono font-bold shrink-0 border ${
                          p.completionStatus === 'VERIFIED'
                            ? 'bg-emerald-100 text-emerald-900 border-emerald-400'
                            : p.completionStatus === 'PENDING_VERIFICATION'
                            ? 'bg-amber-100 text-amber-900 border-amber-400'
                            : 'bg-[var(--yo-surface-1)] text-[var(--yo-ink)] border-[var(--yo-line)]'
                        }`}
                      >
                        {p.completionStatus}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 2. QUESTS TAB */}
      {activeTab === 'quests' && (
        <div className="space-y-4">
          {participations.length === 0 ? (
            <div className="p-12 text-center rounded-[2px] bg-[var(--yo-surface-1)] border-[1.5px] border-[var(--yo-ink)] shadow-[4px_4px_0_var(--yo-ink)]">
              <span className="material-symbols-outlined text-5xl text-[var(--yo-muted)] mb-2">military_tech</span>
              <h3 className="text-base font-bold text-[var(--yo-ink)] mb-1 yo-display">No Quest History Yet</h3>
              <p className="text-xs text-[var(--yo-muted)] max-w-sm mx-auto mb-4">
                Join community bounties, explore websites, submit feedback, and earn ecosystem reputation.
              </p>
              <button
                onClick={() => onNavigate('quests')}
                className="lp-button lp-button-primary text-xs"
              >
                Find Quests to Join
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {participations.map((p) => {
                const quest = allQuestsMap[p.questId];
                return (
                  <div
                    key={p.id}
                    className="p-5 rounded-[2px] bg-[var(--yo-surface-1)] border-[1.5px] border-[var(--yo-ink)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-[3px_3px_0_var(--yo-ink)]"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-xs font-bold text-[var(--yo-ink)] yo-display">
                          {quest?.title || `Quest ${p.questId}`}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-[2px] text-[10px] yo-mono font-bold border ${
                            p.completionStatus === 'VERIFIED'
                              ? 'bg-emerald-100 text-emerald-900 border-emerald-400'
                              : p.completionStatus === 'PENDING_VERIFICATION'
                              ? 'bg-amber-100 text-amber-900 border-amber-400'
                              : 'bg-[var(--yo-surface-2)] text-[var(--yo-ink)] border-[var(--yo-line)]'
                          }`}
                        >
                          {p.completionStatus}
                        </span>
                      </div>
                      <p className="text-xs text-[var(--yo-muted)] line-clamp-2">
                        {quest?.description || 'Community quest participation record.'}
                      </p>
                      {p.submissionProof && (
                        <p className="text-[11px] text-[var(--yo-accent)] mt-2 yo-mono truncate">
                          Proof: {p.submissionProof}
                        </p>
                      )}
                    </div>

                    {quest && onSelectQuest && (
                      <button
                        onClick={() => onSelectQuest(quest)}
                        className="lp-button lp-button-secondary text-xs shrink-0"
                      >
                        Inspect Quest
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 3. FOLLOWED PROJECTS TAB */}
      {activeTab === 'follows' && (
        <div>
          {followedProjects.length === 0 ? (
            <div className="p-12 text-center rounded-[2px] bg-[var(--yo-surface-1)] border-[1.5px] border-[var(--yo-ink)] shadow-[4px_4px_0_var(--yo-ink)]">
              <span className="material-symbols-outlined text-5xl text-[var(--yo-muted)] mb-2">folder_special</span>
              <h3 className="text-base font-bold text-[var(--yo-ink)] mb-1 yo-display">No Followed Protocols</h3>
              <p className="text-xs text-[var(--yo-muted)] max-w-sm mx-auto mb-4">
                Follow verified protocols in the directory to receive updates directly in your Following feed.
              </p>
              <button
                onClick={() => onNavigate('projects')}
                className="lp-button lp-button-primary text-xs"
              >
                Browse Projects
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {followedProjects.map((project) => (
                <div key={project.id} className="relative group">
                  <ProjectCard
                    project={project}
                    onSelect={onSelectProject}
                    onToggleSave={() => {}}
                    isSaved={false}
                  />
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleUnfollowProject(project.id);
                    }}
                    className="absolute top-3 right-3 px-2.5 py-1 rounded-[2px] bg-[var(--yo-surface-1)] hover:bg-rose-50 text-[var(--yo-ink)] hover:text-rose-700 border border-[var(--yo-line)] hover:border-rose-400 text-[10px] yo-mono z-10 transition-colors shadow-[2px_2px_0_var(--yo-ink)]"
                  >
                    Unfollow
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 4. SAVED BOOKMARKS TAB */}
      {activeTab === 'saved' && (
        <div className="space-y-4">
          <div className="flex gap-2 p-1 rounded-[2px] bg-[var(--yo-surface-2)] w-fit border border-[var(--yo-line)] text-xs yo-mono">
            <button
              onClick={() => setSavedSubTab('quests')}
              className={`px-3 py-1.5 rounded-[2px] font-bold transition-colors ${
                savedSubTab === 'quests' ? 'bg-[var(--yo-accent)] text-white shadow-sm' : 'text-[var(--yo-muted)] hover:text-[var(--yo-ink)]'
              }`}
            >
              Saved Quests ({savedQuests.length})
            </button>
            <button
              onClick={() => setSavedSubTab('projects')}
              className={`px-3 py-1.5 rounded-[2px] font-bold transition-colors ${
                savedSubTab === 'projects' ? 'bg-[var(--yo-accent)] text-white shadow-sm' : 'text-[var(--yo-muted)] hover:text-[var(--yo-ink)]'
              }`}
            >
              Saved Projects ({savedProjects.length})
            </button>
          </div>

          {savedSubTab === 'quests' && (
            <div>
              {savedQuests.length === 0 ? (
                <div className="p-8 text-center text-xs text-[var(--yo-muted)] rounded-[2px] bg-[var(--yo-surface-1)] border-[1.5px] border-[var(--yo-ink)] shadow-[4px_4px_0_var(--yo-ink)]">
                  No saved quests. Bookmark quests from the Quests directory to save them for later.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {savedQuests.map((quest) => (
                    <div key={quest.id} className="relative">
                      <QuestCard
                        quest={quest}
                        onSelect={onSelectQuest || (() => {})}
                        isParticipating={participations.some((p) => p.questId === quest.id)}
                        isSaved={true}
                        onToggleSave={(_id, e) => {
                          e?.stopPropagation?.();
                          handleUnsaveQuest(quest.id);
                        }}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {savedSubTab === 'projects' && (
            <div>
              {savedProjects.length === 0 ? (
                <div className="p-8 text-center text-xs text-[var(--yo-muted)] rounded-[2px] bg-[var(--yo-surface-1)] border-[1.5px] border-[var(--yo-ink)] shadow-[4px_4px_0_var(--yo-ink)]">
                  No saved projects. Bookmark protocols from the directory to review them later.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {savedProjects.map((project) => (
                    <div key={project.id} className="relative group">
                      <ProjectCard
                        project={project}
                        onSelect={onSelectProject}
                        onToggleSave={(_id, e) => {
                          e?.stopPropagation?.();
                          handleUnsaveProject(project.id);
                        }}
                        isSaved={true}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* 5. SECURITY TAB */}
      {activeTab === 'security' && (
        <div className="max-w-xl p-6 rounded-[2px] bg-[var(--yo-surface-1)] border-[1.5px] border-[var(--yo-ink)] shadow-[4px_4px_0_var(--yo-ink)]">
          <h3 className="text-base font-bold text-[var(--yo-ink)] mb-1 yo-display">Account Security</h3>
          <p className="text-xs text-[var(--yo-muted)] mb-6">
            Update your account password. Sessions are securely hashed and authenticated with salt tokens.
          </p>

          {passwordMessage && (
            <div
              className={`p-3 rounded-[2px] text-xs mb-4 flex items-center gap-2 yo-mono ${
                passwordMessage.isError
                  ? 'bg-rose-50 border border-rose-300 text-rose-700'
                  : 'bg-emerald-50 border border-emerald-300 text-emerald-700'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">
                {passwordMessage.isError ? 'error' : 'check_circle'}
              </span>
              <span>{passwordMessage.text}</span>
            </div>
          )}

          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[var(--yo-ink)] mb-1 yo-mono">Current Password</label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full px-3.5 py-2 lp-input text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[var(--yo-ink)] mb-1 yo-mono">New Password (min 8 chars)</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-3.5 py-2 lp-input text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[var(--yo-ink)] mb-1 yo-mono">Confirm New Password</label>
              <input
                type="password"
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
                className="w-full px-3.5 py-2 lp-input text-xs"
              />
            </div>
            <button
              type="submit"
              disabled={isSavingPassword}
              className="lp-button lp-button-primary text-xs disabled:opacity-50 cursor-pointer"
            >
              {isSavingPassword ? 'Updating...' : 'Update Password'}
            </button>
          </form>
        </div>
      )}

      {/* ========================================================= */}
      {/* "EDIT PROFILE" MODAL WITH LIVE PREVIEW */}
      {/* ========================================================= */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-sm overflow-y-auto">
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-2xl lp-modal-box overflow-hidden flex flex-col my-auto max-h-[92vh]"
          >
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-[var(--yo-line)] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="p-1 rounded text-[var(--yo-muted)] hover:text-[var(--yo-ink)] transition-colors"
                >
                  <span className="material-symbols-outlined text-[20px]">close</span>
                </button>
                <h2 className="text-base sm:text-lg font-bold text-[var(--yo-ink)] yo-display">Edit Profile</h2>
              </div>

              <button
                type="button"
                onClick={handleUpdateProfile}
                disabled={isSavingProfile}
                className="lp-button lp-button-primary text-xs py-1.5 px-4 disabled:opacity-50 cursor-pointer"
              >
                {isSavingProfile ? 'Saving...' : 'Save'}
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 sm:p-6 overflow-y-auto space-y-6 text-xs">
              {profileMessage && (
                <div
                  className={`p-3 rounded-[2px] flex items-center gap-2 yo-mono ${
                    profileMessage.isError
                      ? 'bg-rose-50 border border-rose-300 text-rose-700'
                      : 'bg-emerald-50 border border-emerald-300 text-emerald-700'
                  }`}
                >
                  <span className="material-symbols-outlined text-[16px]">
                    {profileMessage.isError ? 'error' : 'check_circle'}
                  </span>
                  <span>{profileMessage.text}</span>
                </div>
              )}

              {/* Live Preview: Header & Avatar */}
              <div className="space-y-2">
                <span className="font-semibold text-[var(--yo-muted)] uppercase yo-mono text-[11px] block">
                  Header & Avatar Preview
                </span>
                <div className="relative rounded-[2px] overflow-hidden bg-[var(--yo-surface-2)] border border-[var(--yo-line)] shadow-[3px_3px_0_var(--yo-ink)]">
                  <div className="relative w-full aspect-[3/1] max-h-[190px] overflow-hidden">
                    <img
                      src={headerInput || DEFAULT_BANNER}
                      alt="Banner Preview (3:1)"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = DEFAULT_BANNER;
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[var(--yo-surface-1)] via-transparent to-transparent"></div>
                    <span className="absolute top-2 right-2 px-2 py-0.5 rounded-[2px] text-[9px] yo-mono bg-[var(--yo-surface-1)]/90 text-[var(--yo-ink)] border border-[var(--yo-line)]">
                      3:1 Ratio
                    </span>
                  </div>

                  <div className="px-4 pb-3 -mt-10 sm:-mt-12 flex items-end justify-between">
                    <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full border-4 border-[var(--yo-surface-1)] bg-[var(--yo-surface-2)] overflow-hidden shadow-[2px_2px_0_var(--yo-ink)] ring-1 ring-[var(--yo-line)] shrink-0">
                      <img
                        src={imageInput || DEFAULT_AVATAR}
                        alt="Avatar Preview (1:1)"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = DEFAULT_AVATAR;
                        }}
                      />
                    </div>
                    <span className="text-[10px] yo-mono text-[var(--yo-muted)]">
                      Circular 1:1 PFP
                    </span>
                  </div>
                </div>
              </div>

              {/* Header Image Gallery Upload & Presets */}
              <div className="space-y-2 p-3.5 rounded-[2px] bg-[var(--yo-surface-2)] border border-[var(--yo-line)]">
                <div className="flex items-center justify-between">
                  <label className="block text-[var(--yo-ink)] font-semibold text-xs yo-mono">Header Banner</label>
                  <button
                    type="button"
                    onClick={() => modalHeaderInputRef.current?.click()}
                    className="lp-button lp-button-secondary text-[11px] py-1 px-2.5 flex items-center gap-1.5 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[15px]">add_photo_alternate</span>
                    <span>Pick from Gallery</span>
                  </button>
                </div>
                <input
                  type="text"
                  value={headerInput}
                  onChange={(e) => setHeaderInput(e.target.value)}
                  placeholder="Paste URL or click Pick from Gallery above"
                  className="w-full px-3.5 py-2 lp-input text-xs"
                />
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="text-[10px] text-[var(--yo-muted)] uppercase yo-mono mr-1">Presets:</span>
                  {BANNER_PRESETS.map((p) => (
                    <button
                      key={p.name}
                      type="button"
                      onClick={() => setHeaderInput(p.url)}
                      className={`px-2.5 py-1 rounded-[2px] text-[10px] font-semibold yo-mono transition-colors border ${
                        headerInput === p.url
                          ? 'bg-[var(--yo-accent)] text-white border-[var(--yo-ink)] shadow-[2px_2px_0_var(--yo-ink)]'
                          : 'bg-[var(--yo-surface-1)] hover:bg-[var(--yo-surface-2)] text-[var(--yo-ink)] border-[var(--yo-line)]'
                      }`}
                    >
                      {p.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Avatar / PFP Gallery Upload & Presets */}
              <div className="space-y-2 p-3.5 rounded-[2px] bg-[var(--yo-surface-2)] border border-[var(--yo-line)]">
                <div className="flex items-center justify-between">
                  <label className="block text-[var(--yo-ink)] font-semibold text-xs yo-mono">Profile Picture (PFP)</label>
                  <button
                    type="button"
                    onClick={() => modalAvatarInputRef.current?.click()}
                    className="lp-button lp-button-secondary text-[11px] py-1 px-2.5 flex items-center gap-1.5 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[15px]">add_a_photo</span>
                    <span>Pick from Gallery</span>
                  </button>
                </div>
                <input
                  type="text"
                  value={imageInput}
                  onChange={(e) => setImageInput(e.target.value)}
                  placeholder="Paste URL or click Pick from Gallery above"
                  className="w-full px-3.5 py-2 lp-input text-xs"
                />
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="text-[10px] text-[var(--yo-muted)] uppercase yo-mono mr-1">Presets:</span>
                  {AVATAR_PRESETS.map((p) => (
                    <button
                      key={p.name}
                      type="button"
                      onClick={() => setImageInput(p.url)}
                      className={`px-2.5 py-1 rounded-[2px] text-[10px] font-semibold yo-mono transition-colors border ${
                        imageInput === p.url
                          ? 'bg-[var(--yo-accent)] text-white border-[var(--yo-ink)] shadow-[2px_2px_0_var(--yo-ink)]'
                          : 'bg-[var(--yo-surface-1)] hover:bg-[var(--yo-surface-2)] text-[var(--yo-ink)] border-[var(--yo-line)]'
                      }`}
                    >
                      {p.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Display Name & Username */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[var(--yo-ink)] font-semibold text-xs mb-1 yo-mono">Display Name</label>
                  <input
                    type="text"
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    placeholder="Your Name"
                    className="w-full px-3.5 py-2 lp-input text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[var(--yo-ink)] font-semibold text-xs mb-1 yo-mono">Username / Handle</label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-2 text-[var(--yo-muted)] yo-mono">@</span>
                    <input
                      type="text"
                      value={usernameInput}
                      onChange={(e) => setUsernameInput(e.target.value.replace(/[^a-zA-Z0-9_]/g, ''))}
                      placeholder="username"
                      className="w-full pl-8 pr-3.5 py-2 lp-input text-xs yo-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Bio (multiline textarea with counter) */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-[var(--yo-ink)] font-semibold text-xs yo-mono">Bio</label>
                  <span className="text-[10px] text-[var(--yo-muted)] yo-mono">{bioInput.length} / 500</span>
                </div>
                <textarea
                  value={bioInput}
                  onChange={(e) => setBioInput(e.target.value.slice(0, 500))}
                  placeholder="Tell the Elysium ecosystem about yourself, your protocol interests, or developer goals..."
                  rows={3}
                  className="w-full px-3.5 py-2 lp-input text-xs leading-relaxed"
                />
              </div>

              {/* Interests Multi-Select */}
              <div>
                <label className="block text-[var(--yo-ink)] font-semibold text-xs mb-1.5 yo-mono">Ecosystem Interests</label>
                <div className="flex flex-wrap gap-1.5">
                  {AVAILABLE_INTERESTS.map((interest) => {
                    const isSelected = selectedInterests.includes(interest);
                    return (
                      <button
                        key={interest}
                        type="button"
                        onClick={() => toggleInterest(interest)}
                        className={`px-3 py-1 rounded-[2px] text-xs font-semibold yo-mono transition-colors border ${
                          isSelected
                            ? 'bg-[var(--yo-accent)] text-white border-[var(--yo-ink)] shadow-[2px_2px_0_var(--yo-ink)]'
                            : 'bg-[var(--yo-surface-2)] text-[var(--yo-muted)] hover:text-[var(--yo-ink)] border-[var(--yo-line)]'
                        }`}
                      >
                        {isSelected ? '✓ ' : '+ '}
                        {interest}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Social Links Form (X, Telegram, Instagram, Discord, GitHub, Website) */}
              <div className="space-y-3 pt-3 border-t border-[var(--yo-line)]">
                <h3 className="font-bold text-[var(--yo-ink)] uppercase yo-display text-[12px]">
                  Social Handles & Links
                </h3>

                {/* X (Twitter) */}
                <div>
                  <label className="block text-[var(--yo-ink)] text-xs mb-1 flex items-center gap-1.5 yo-mono font-semibold">
                    <span className="font-bold">𝕏</span>
                    <span>X (Twitter) Profile</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-2 text-[var(--yo-muted)] yo-mono">@</span>
                    <input
                      type="text"
                      value={twitterInput}
                      onChange={(e) => setTwitterInput(e.target.value.replace(/^@/, ''))}
                      placeholder="username or x.com/username"
                      className="w-full pl-8 pr-3.5 py-2 lp-input text-xs yo-mono"
                    />
                  </div>
                </div>

                {/* Telegram */}
                <div>
                  <label className="block text-[var(--yo-ink)] text-xs mb-1 flex items-center gap-1.5 yo-mono font-semibold">
                    <span className="material-symbols-outlined text-[15px]">send</span>
                    <span>Telegram Link or Handle</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-2 text-[var(--yo-muted)] yo-mono">t.me/</span>
                    <input
                      type="text"
                      value={telegramInput}
                      onChange={(e) => setTelegramInput(e.target.value.replace(/^@/, '').replace('https://t.me/', ''))}
                      placeholder="username"
                      className="w-full pl-14 pr-3.5 py-2 lp-input text-xs yo-mono"
                    />
                  </div>
                </div>

                {/* Instagram */}
                <div>
                  <label className="block text-[var(--yo-ink)] text-xs mb-1 flex items-center gap-1.5 yo-mono font-semibold">
                    <span className="material-symbols-outlined text-[15px]">photo_camera</span>
                    <span>Instagram Handle or Link</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-2 text-[var(--yo-muted)] yo-mono">@</span>
                    <input
                      type="text"
                      value={instagramInput}
                      onChange={(e) => setInstagramInput(e.target.value.replace(/^@/, '').replace('https://instagram.com/', ''))}
                      placeholder="username"
                      className="w-full pl-8 pr-3.5 py-2 lp-input text-xs yo-mono"
                    />
                  </div>
                </div>

                {/* Discord & GitHub Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[var(--yo-ink)] text-xs mb-1 yo-mono font-semibold">Discord Tag</label>
                    <input
                      type="text"
                      value={discordInput}
                      onChange={(e) => setDiscordInput(e.target.value)}
                      placeholder="username#0000 or username"
                      className="w-full px-3.5 py-2 lp-input text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[var(--yo-ink)] text-xs mb-1 yo-mono font-semibold">GitHub Username</label>
                    <input
                      type="text"
                      value={githubInput}
                      onChange={(e) => setGithubInput(e.target.value.replace(/^@/, '').replace('https://github.com/', ''))}
                      placeholder="github-handle"
                      className="w-full px-3.5 py-2 lp-input text-xs yo-mono"
                    />
                  </div>
                </div>

                {/* Website / Portfolio */}
                <div>
                  <label className="block text-[var(--yo-ink)] text-xs mb-1 yo-mono font-semibold">Website / Portfolio URL</label>
                  <input
                    type="url"
                    value={websiteInput}
                    onChange={(e) => setWebsiteInput(e.target.value)}
                    placeholder="https://yourportfolio.xyz"
                    className="w-full px-3.5 py-2 lp-input text-xs"
                  />
                </div>

                {/* Dynamic Custom Links List */}
                <div className="space-y-2 pt-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[var(--yo-ink)] text-xs font-semibold yo-mono">
                      Custom Links (Substack, Mirror, Lens, etc.)
                    </label>
                    <button
                      type="button"
                      onClick={handleAddCustomLink}
                      className="text-xs text-[var(--yo-accent)] hover:underline flex items-center gap-1 yo-mono font-semibold"
                    >
                      <span className="material-symbols-outlined text-[15px]">add</span>
                      <span>Add Link</span>
                    </button>
                  </div>

                  {customLinks.map((link, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={link.label}
                        onChange={(e) => handleUpdateCustomLink(idx, 'label', e.target.value)}
                        placeholder="Label (e.g. Substack)"
                        className="w-1/3 px-3 py-1.5 lp-input text-xs"
                      />
                      <input
                        type="url"
                        value={link.url}
                        onChange={(e) => handleUpdateCustomLink(idx, 'url', e.target.value)}
                        placeholder="https://..."
                        className="flex-1 px-3 py-1.5 lp-input text-xs"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveCustomLink(idx)}
                        className="p-1 text-[var(--yo-muted)] hover:text-rose-600 transition-colors"
                        title="Remove link"
                      >
                        <span className="material-symbols-outlined text-[18px]">delete</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-[var(--yo-line)] flex justify-end gap-2 bg-[var(--yo-surface-2)]">
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="lp-button lp-button-secondary text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleUpdateProfile}
                disabled={isSavingProfile}
                className="lp-button lp-button-primary text-xs disabled:opacity-50 cursor-pointer"
              >
                {isSavingProfile ? 'Saving...' : 'Save Profile'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
