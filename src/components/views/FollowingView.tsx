/**
 * LAKNES Following & Broadcast View (Yochi-inspired Design System)
 * Curated feed of announcements, published quests, and followed protocols in paper/sumi aesthetic.
 */

import React, { useState, useEffect } from 'react';
import { Project, ProjectUpdate, Quest, User } from '../../types/contracts.ts';
import { laknesClient } from '../../client/api-client.ts';
import { QuestCard } from '../common/QuestCard.tsx';

interface FollowingViewProps {
  user: User | null;
  onNavigate: (view: string) => void;
  onOpenAuth: (mode?: 'login' | 'register') => void;
  onSelectProject: (project: Project) => void;
  onSelectQuest?: (quest: Quest) => void;
  onToggleFollow: (projectId: string) => void;
  followedProjectIds: Set<string>;
  savedProjectIds?: Set<string>;
  savedQuestIds?: Set<string>;
  onToggleSave?: (projectId: string, e: React.MouseEvent) => void;
  onToggleSaveQuest?: (questId: string, e: React.MouseEvent) => void;
}

interface FeedItem extends ProjectUpdate {
  project?: Partial<Project>;
}

export function FollowingView({
  user,
  onNavigate,
  onOpenAuth,
  onSelectProject,
  onSelectQuest,
  onToggleFollow,
  followedProjectIds,
  savedProjectIds,
  savedQuestIds,
  onToggleSave,
  onToggleSaveQuest,
}: FollowingViewProps) {
  const [activeTab, setActiveTab] = useState<'feed' | 'quests' | 'protocols'>('feed');
  const [followedProjects, setFollowedProjects] = useState<Project[]>([]);
  const [recommendedProjects, setRecommendedProjects] = useState<Project[]>([]);
  const [feedItems, setFeedItems] = useState<FeedItem[]>([]);
  const [followingQuests, setFollowingQuests] = useState<Array<Quest & { project?: Partial<Project> }>>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    let isCancelled = false;

    const loadData = async () => {
      setIsLoading(true);
      try {
        const [follows, feed, allProjects, fQuests] = await Promise.all([
          laknesClient.getUserFollows(user.id).catch(() => []),
          laknesClient.getFollowingFeed(user.id).catch(() => []),
          laknesClient.discoverProjects({ limit: 12 }).catch(() => []),
          laknesClient.getFollowingQuests(user.id).catch(() => []),
        ]);

        if (!isCancelled) {
          setFollowedProjects(follows);
          setFeedItems(feed);
          setFollowingQuests(fQuests);
          const unmanaged = allProjects.filter((p) => !followedProjectIds.has(p.id));
          setRecommendedProjects(unmanaged.slice(0, 6));
        }
      } catch (err) {
        console.error('Failed to load following data', err);
      } finally {
        if (!isCancelled) setIsLoading(false);
      }
    };

    loadData();

    return () => {
      isCancelled = true;
    };
  }, [user, followedProjectIds]);

  if (!user) {
    return (
      <div className="lp-page py-20">
        <div className="lp-shell max-w-xl text-center">
          <div className="p-10 bg-[var(--yo-surface-1)] border-[1.5px] border-[var(--yo-ink)] shadow-[6px_6px_0_var(--yo-ink)]">
            <span className="lp-eyebrow mb-2">BROADCAST FEED</span>
            <h2 className="yo-display text-2xl text-[var(--yo-ink)] mb-2">Sign in to Access Your Feed</h2>
            <p className="font-body text-xs text-[var(--yo-muted)] max-w-md mx-auto mb-6 leading-relaxed">
              Follow ecosystem projects to build your personal broadcast feed, receive real-time protocol updates, and never miss quest launches.
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => onOpenAuth('login')}
                className="lp-button lp-button-primary text-xs"
              >
                <span>SIGN IN</span>
                <span aria-hidden="true">↗</span>
              </button>
              <button
                onClick={() => onNavigate('projects')}
                className="lp-button lp-button-secondary text-xs"
              >
                <span>BROWSE PROJECTS</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="lp-page py-12">
      <div className="lp-shell">
        {/* Page Header */}
        <div className="border-b-[1.5px] border-[var(--yo-ink)] pb-8 mb-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <span className="lp-eyebrow">SAVED &amp; BROADCAST</span>
              <h1 className="yo-display text-3xl sm:text-5xl text-[var(--yo-ink)] mt-2">
                Following &amp; Updates
              </h1>
              <p className="font-body text-base text-[var(--yo-muted)] mt-2 max-w-xl leading-relaxed">
                Real-time announcements, published quests, and milestones from your followed protocols.
              </p>
            </div>

            {/* Quick Metrics */}
            <div className="flex items-center gap-4 bg-[var(--yo-surface-1)] p-3 border border-[var(--yo-line)] shrink-0 font-mono text-[10px]">
              <div>
                <span className="text-[var(--yo-muted)] uppercase block font-bold">FOLLOWED</span>
                <span className="text-sm font-bold text-[var(--yo-ink)]">{followedProjects.length} Protocols</span>
              </div>
              <div className="w-px h-6 bg-[var(--yo-line)]"></div>
              <div>
                <span className="text-[var(--yo-muted)] uppercase block font-bold">UPDATES</span>
                <span className="text-sm font-bold text-[var(--yo-accent-text)]">{feedItems.length} Posts</span>
              </div>
              <div className="w-px h-6 bg-[var(--yo-line)]"></div>
              <div>
                <span className="text-[var(--yo-muted)] uppercase block font-bold">QUESTS</span>
                <span className="text-sm font-bold text-[var(--yo-good)]">{followingQuests.length} Active</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-[var(--yo-line)] gap-6 mb-8 overflow-x-auto pb-1 scrollbar-none font-mono text-xs font-bold uppercase tracking-wider">
          <button
            onClick={() => setActiveTab('feed')}
            className={`pb-3 border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'feed'
                ? 'border-[var(--yo-ink)] text-[var(--yo-ink)]'
                : 'border-transparent text-[var(--yo-muted)] hover:text-[var(--yo-ink)]'
            }`}
          >
            PROTOCOL UPDATES ({feedItems.length})
          </button>

          <button
            onClick={() => setActiveTab('quests')}
            className={`pb-3 border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'quests'
                ? 'border-[var(--yo-ink)] text-[var(--yo-ink)]'
                : 'border-transparent text-[var(--yo-muted)] hover:text-[var(--yo-ink)]'
            }`}
          >
            ACTIVE QUESTS ({followingQuests.length})
          </button>

          <button
            onClick={() => setActiveTab('protocols')}
            className={`pb-3 border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'protocols'
                ? 'border-[var(--yo-ink)] text-[var(--yo-ink)]'
                : 'border-transparent text-[var(--yo-muted)] hover:text-[var(--yo-ink)]'
            }`}
          >
            FOLLOWED DIRECTORY ({followedProjects.length})
          </button>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="p-16 text-center text-xs font-mono text-[var(--yo-muted)]">
            Loading your personalized broadcast...
          </div>
        ) : activeTab === 'feed' ? (
          <div>
            {feedItems.length === 0 ? (
              <div className="p-12 sm:p-16 bg-[var(--yo-surface-1)] border border-[var(--yo-line)] text-center flex flex-col items-center">
                <span className="w-12 h-12 border border-[var(--yo-line)] flex items-center justify-center font-mono text-xl mb-3 text-[var(--yo-muted)]">
                  &empty;
                </span>
                <h3 className="yo-display text-base text-[var(--yo-ink)] mb-1">No Announcements Yet</h3>
                <p className="font-body text-xs text-[var(--yo-muted)] max-w-md mb-6 leading-relaxed">
                  {followedProjects.length === 0
                    ? "You aren't following any protocols yet. Explore the ecosystem directory and follow projects to receive announcements here."
                    : 'The protocols you follow have not published any announcements yet. Check back soon for updates!'}
                </p>

                {recommendedProjects.length > 0 && (
                  <div className="w-full max-w-4xl mt-4 pt-6 border-t border-[var(--yo-line)]">
                    <span className="lp-eyebrow text-left block mb-4">RECOMMENDED PROTOCOLS TO FOLLOW</span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                      {recommendedProjects.map((proj) => (
                        <div
                          key={proj.id}
                          className="p-4 bg-[var(--yo-surface-2)] border border-[var(--yo-line)] text-left flex flex-col justify-between"
                        >
                          <div>
                            <div className="flex items-center gap-2.5 mb-2">
                              <div className="w-8 h-8 border border-[var(--yo-line)] bg-[var(--yo-surface-1)] flex items-center justify-center font-mono font-bold text-xs shrink-0">
                                {proj.name.slice(0, 1).toUpperCase()}
                              </div>
                              <div className="min-w-0 flex-1">
                                <h5 className="yo-display text-xs text-[var(--yo-ink)] truncate">{proj.name}</h5>
                                <span className="text-[9px] font-mono font-bold text-[var(--yo-muted)] uppercase block">{proj.category}</span>
                              </div>
                            </div>
                            <p className="font-body text-[11px] text-[var(--yo-muted)] line-clamp-2 mb-3 leading-relaxed">{proj.shortDescription}</p>
                          </div>
                          <button
                            onClick={() => onToggleFollow(proj.id)}
                            className="lp-button lp-button-primary w-full text-xs justify-center"
                            style={{ minHeight: '34px', padding: '4px 10px' }}
                          >
                            <span>+ FOLLOW</span>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4 max-w-3xl">
                {feedItems.map((item) => (
                  <article
                    key={item.id}
                    className="p-6 bg-[var(--yo-surface-1)] border-[1.5px] border-[var(--yo-line)] hover:border-[var(--yo-ink)] transition-colors shadow-sm"
                  >
                    <div className="flex items-center justify-between gap-4 mb-4 pb-3 border-b border-[var(--yo-line)]">
                      <div
                        onClick={() => item.project && onSelectProject(item.project as Project)}
                        className="flex items-center gap-3 cursor-pointer group"
                      >
                        <div className="w-9 h-9 border border-[var(--yo-line)] bg-[var(--yo-surface-2)] shrink-0 flex items-center justify-center font-mono font-bold text-xs text-[var(--yo-ink)]">
                          {item.project?.name ? item.project.name.slice(0, 1).toUpperCase() : 'P'}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="yo-display text-sm text-[var(--yo-ink)] group-hover:text-[var(--yo-accent-text)] transition-colors">
                              {item.project?.name || 'Protocol Update'}
                            </span>
                            {item.project?.verificationStatus === 'VERIFIED' && (
                              <span className="material-symbols-outlined text-[14px] text-[var(--yo-good)]">verified</span>
                            )}
                          </div>
                          <span className="text-[10px] text-[var(--yo-muted)] font-mono block">
                            {new Date(item.publishedAt || item.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>

                      <span className="lp-chip font-bold">
                        {item.project?.category || 'ANNOUNCEMENT'}
                      </span>
                    </div>

                    <h3 className="yo-display text-lg text-[var(--yo-ink)] mb-2">{item.title}</h3>
                    <div className="font-body text-xs text-[var(--yo-muted)] leading-relaxed whitespace-pre-wrap mb-4">
                      {item.content}
                    </div>

                    {item.links && item.links.length > 0 && (
                      <div className="flex flex-wrap gap-2 pt-3 border-t border-[var(--yo-line)] font-mono text-[10px]">
                        {item.links.map((l: any, i) => {
                          const url = typeof l === 'string' ? l : l?.url || '#';
                          const title = typeof l === 'string' ? (l.length > 35 ? l.substring(0, 35) + '...' : l) : l?.title || 'Link';
                          return (
                            <a
                              key={i}
                              href={url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-[var(--yo-accent-text)] hover:underline"
                            >
                              <span>{title} ↗</span>
                            </a>
                          );
                        })}
                      </div>
                    )}
                  </article>
                ))}
              </div>
            )}
          </div>
        ) : activeTab === 'quests' ? (
          <div>
            {followingQuests.length === 0 ? (
              <div className="p-16 bg-[var(--yo-surface-1)] border border-[var(--yo-line)] text-center flex flex-col items-center">
                <span className="w-12 h-12 border border-[var(--yo-line)] flex items-center justify-center font-mono text-xl mb-3 text-[var(--yo-muted)]">
                  &empty;
                </span>
                <h3 className="yo-display text-base text-[var(--yo-ink)] mb-1">No Active Quests from Followed Protocols</h3>
                <p className="font-body text-xs text-[var(--yo-muted)] max-w-md mb-6 leading-relaxed">
                  The projects you follow have not posted new quests yet. Explore all ecosystem quests to find active tasks.
                </p>
                <button
                  onClick={() => onNavigate('quests')}
                  className="lp-button lp-button-primary text-xs"
                >
                  <span>BROWSE ALL QUESTS</span>
                  <span aria-hidden="true">↗</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {followingQuests.map((quest) => (
                  <QuestCard
                    key={quest.id}
                    quest={quest}
                    projectName={quest.project?.name}
                    projectLogo={quest.project?.logoUrl}
                    onSelect={onSelectQuest || (() => {})}
                    isSaved={savedQuestIds?.has(quest.id)}
                    onToggleSave={onToggleSaveQuest}
                  />
                ))}
              </div>
            )}
          </div>
        ) : (
          <div>
            {followedProjects.length === 0 ? (
              <div className="p-16 bg-[var(--yo-surface-1)] border border-[var(--yo-line)] text-center flex flex-col items-center">
                <span className="w-12 h-12 border border-[var(--yo-line)] flex items-center justify-center font-mono text-xl mb-3 text-[var(--yo-muted)]">
                  &empty;
                </span>
                <h3 className="yo-display text-base text-[var(--yo-ink)] mb-1">Not Following Any Protocols</h3>
                <p className="font-body text-xs text-[var(--yo-muted)] max-w-md mb-6 leading-relaxed">
                  You haven't followed any projects yet. Discover protocols building on Web3 and follow them to receive custom announcements.
                </p>
                <button
                  onClick={() => onNavigate('projects')}
                  className="lp-button lp-button-primary text-xs"
                >
                  <span>EXPLORE DIRECTORY</span>
                  <span aria-hidden="true">↗</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {followedProjects.map((p) => (
                  <div
                    key={p.id}
                    className="p-5 bg-[var(--yo-surface-1)] border-[1.5px] border-[var(--yo-line)] hover:border-[var(--yo-ink)] transition-all flex flex-col justify-between rounded-[2px]"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div
                          onClick={() => onSelectProject(p)}
                          className="flex items-center gap-3 cursor-pointer group min-w-0"
                        >
                          <div className="w-10 h-10 border border-[var(--yo-line)] bg-[var(--yo-surface-2)] shrink-0 flex items-center justify-center font-mono font-bold text-xs text-[var(--yo-ink)]">
                            {p.name.slice(0, 1).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <h4 className="yo-display text-base text-[var(--yo-ink)] group-hover:text-[var(--yo-accent-text)] transition-colors truncate">
                                {p.name}
                              </h4>
                              {p.verificationStatus === 'VERIFIED' && (
                                <span className="material-symbols-outlined text-[14px] text-[var(--yo-good)]">verified</span>
                              )}
                            </div>
                            <span className="text-[10px] text-[var(--yo-muted)] font-mono font-bold uppercase block">{p.category}</span>
                          </div>
                        </div>

                        {onToggleSave && (
                          <button
                            onClick={(e) => onToggleSave(p.id, e)}
                            className="p-1 border border-[var(--yo-line)] text-[var(--yo-ink)] hover:border-[var(--yo-ink)] transition-colors cursor-pointer"
                            title="Bookmark project"
                          >
                            <span className="material-symbols-outlined text-[16px]">
                              {savedProjectIds?.has(p.id) ? 'bookmark' : 'bookmark_border'}
                            </span>
                          </button>
                        )}
                      </div>

                      <p className="font-body text-xs text-[var(--yo-muted)] line-clamp-2 mb-4 leading-relaxed">
                        {p.shortDescription}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-[var(--yo-line)] flex items-center justify-between gap-2 font-mono text-[10px]">
                      <button
                        onClick={() => onSelectProject(p)}
                        className="font-bold text-[var(--yo-ink)] hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <span>VIEW ↗</span>
                      </button>

                      <button
                        onClick={() => onToggleFollow(p.id)}
                        className="px-2.5 py-1 border border-[var(--yo-line)] hover:border-[var(--yo-bad)] text-[var(--yo-muted)] hover:text-[var(--yo-bad)] font-bold uppercase transition-colors cursor-pointer"
                        title="Unfollow this protocol"
                      >
                        FOLLOWING
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
