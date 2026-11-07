/**
 * LAKNES Quests & Campaigns View (Yochi-inspired Design System)
 * Ecosystem-wide community quest and campaign discovery with editorial layout.
 */

import React, { useState, useEffect } from 'react';
import { Quest, QuestType, Project } from '../../types/contracts.ts';
import { QuestCard } from '../common/QuestCard.tsx';
import { laknesClient } from '../../client/api-client.ts';

interface QuestsViewProps {
  onSelectQuest: (quest: Quest) => void;
  onNavigate: (view: string) => void;
  participatingQuestIds: Set<string>;
  savedQuestIds?: Set<string>;
  onToggleSaveQuest?: (questId: string, e: React.MouseEvent) => void;
}

export function QuestsView({
  onSelectQuest,
  onNavigate,
  participatingQuestIds,
  savedQuestIds,
  onToggleSaveQuest,
}: QuestsViewProps) {
  const [quests, setQuests] = useState<Quest[]>([]);
  const [projectsMap, setProjectsMap] = useState<Record<string, Project>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [participationFilter, setParticipationFilter] = useState<'ALL' | 'ENROLLED' | 'AVAILABLE'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    let cancelled = false;

    const loadQuests = async () => {
      setIsLoading(true);
      try {
        const projects = await laknesClient.discoverProjects({ limit: 100 });
        const pMap: Record<string, Project> = {};
        for (const p of projects) {
          pMap[p.id] = p;
        }

        const questPromises = projects.map((p) =>
          laknesClient.getProjectQuests(p.id).catch(() => [] as Quest[])
        );
        const questArrays = await Promise.all(questPromises);
        const allQuests = questArrays.flat();

        if (!cancelled) {
          setProjectsMap(pMap);
          setQuests(allQuests);
        }
      } catch (err) {
        console.error('Failed to load quests', err);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    loadQuests();
    return () => {
      cancelled = true;
    };
  }, []);

  const questTypes = [
    { id: 'ALL', label: 'All Types' },
    { id: QuestType.COMMUNITY, label: 'Community' },
    { id: QuestType.FEEDBACK, label: 'Feedback' },
    { id: QuestType.SOCIAL, label: 'Social & Media' },
    { id: QuestType.DEVELOPER, label: 'Developer & Technical' },
    { id: QuestType.ONCHAIN, label: 'On-Chain' },
  ];

  const filteredQuests = quests.filter((q) => {
    const matchType = selectedType === 'ALL' || q.questType === selectedType;
    const isEnrolled = participatingQuestIds.has(q.id);
    const matchParticipation =
      participationFilter === 'ALL' ||
      (participationFilter === 'ENROLLED' && isEnrolled) ||
      (participationFilter === 'AVAILABLE' && !isEnrolled);

    const projectName = projectsMap[q.projectId]?.name || '';
    const matchSearch =
      !searchQuery.trim() ||
      q.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      projectName.toLowerCase().includes(searchQuery.toLowerCase());

    return matchType && matchParticipation && matchSearch;
  });

  return (
    <div className="lp-page py-12">
      <div className="lp-shell">
        {/* Editorial Heading */}
        <div className="border-b-[1.5px] border-[var(--yo-ink)] pb-8 mb-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <span className="lp-eyebrow">02 / PARTICIPATE</span>
              <h1 className="yo-display text-3xl sm:text-5xl text-[var(--yo-ink)] mt-2">
                Quests &amp; Campaigns
              </h1>
              <p className="font-body text-base text-[var(--yo-muted)] mt-2 max-w-2xl leading-relaxed">
                Take on real initiatives, contribute technical work, publish creative content, provide product feedback, and build a lasting contribution record.
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <button
                onClick={() => onNavigate('projects')}
                className="lp-button lp-button-secondary text-xs"
                style={{ minHeight: '44px', padding: '10px 18px' }}
              >
                <span>EXPLORE PROJECTS</span>
                <span aria-hidden="true">↗</span>
              </button>
            </div>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center justify-between mb-8 p-3 bg-[var(--yo-surface-1)] border border-[var(--yo-line)]">
          {/* Type Filters */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-2 lg:pb-0 scrollbar-none">
            {questTypes.map((t) => (
              <button
                key={t.id}
                onClick={() => setSelectedType(t.id)}
                className={`px-3 py-1.5 text-[10px] font-mono font-bold uppercase tracking-wider transition-colors whitespace-nowrap cursor-pointer ${
                  selectedType === t.id
                    ? 'bg-[var(--yo-ink)] text-[var(--yo-bg)]'
                    : 'text-[var(--yo-muted)] hover:text-[var(--yo-ink)] bg-transparent'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {/* Enrolled vs All Toggle */}
            <div className="flex border border-[var(--yo-line)] bg-[var(--yo-surface-2)] p-0.5 text-[10px] font-mono font-bold uppercase">
              <button
                type="button"
                onClick={() => setParticipationFilter('ALL')}
                className={`px-2.5 py-1 transition-colors cursor-pointer ${
                  participationFilter === 'ALL'
                    ? 'bg-[var(--yo-ink)] text-[var(--yo-bg)]'
                    : 'text-[var(--yo-muted)] hover:text-[var(--yo-ink)]'
                }`}
              >
                ALL ({quests.length})
              </button>
              <button
                type="button"
                onClick={() => setParticipationFilter('ENROLLED')}
                className={`px-2.5 py-1 transition-colors cursor-pointer ${
                  participationFilter === 'ENROLLED'
                    ? 'bg-[var(--yo-ink)] text-[var(--yo-bg)]'
                    : 'text-[var(--yo-muted)] hover:text-[var(--yo-ink)]'
                }`}
              >
                ENROLLED ({quests.filter((q) => participatingQuestIds.has(q.id)).length})
              </button>
            </div>

            {/* Search Input */}
            <div className="relative min-w-[220px]">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="SEARCH OPPORTUNITIES..."
                className="w-full bg-[var(--yo-surface-2)] text-[var(--yo-ink)] placeholder:text-[var(--yo-muted)] pl-8 pr-3 py-1.5 text-[11px] font-mono border border-[var(--yo-line)] focus:outline-none focus:border-[var(--yo-ink)]"
              />
              <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-[14px] text-[var(--yo-muted)] pointer-events-none">
                search
              </span>
            </div>
          </div>
        </div>

        {/* Quests Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-64 bg-[var(--yo-surface-1)] border border-[var(--yo-line)] animate-pulse"></div>
            ))}
          </div>
        ) : filteredQuests.length === 0 ? (
          <div className="p-16 bg-[var(--yo-surface-1)] border border-[var(--yo-line)] text-center flex flex-col items-center justify-center">
            <span className="w-12 h-12 border border-[var(--yo-line)] flex items-center justify-center font-mono text-xl mb-3 text-[var(--yo-muted)]">
              &empty;
            </span>
            <h3 className="yo-display text-lg text-[var(--yo-ink)] mb-1">
              {quests.length === 0 ? 'No Quests Published Yet' : 'No Quests Match Filters'}
            </h3>
            <p className="font-body text-xs text-[var(--yo-muted)] max-w-md mb-6 leading-relaxed">
              {quests.length === 0
                ? 'Verified ecosystem projects publish community campaigns, feedback forms, and activities here. Check back soon or explore verified projects.'
                : 'Try adjusting your search query or selecting a different opportunity type.'}
            </p>
            {quests.length === 0 ? (
              <button
                onClick={() => onNavigate('projects')}
                className="lp-button lp-button-primary text-xs"
              >
                <span>EXPLORE PROJECTS</span>
                <span aria-hidden="true">↗</span>
              </button>
            ) : (
              <button
                onClick={() => {
                  setSelectedType('ALL');
                  setParticipationFilter('ALL');
                  setSearchQuery('');
                }}
                className="lp-button lp-button-secondary text-xs"
              >
                <span>CLEAR FILTERS</span>
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredQuests.map((quest) => (
              <QuestCard
                key={quest.id}
                quest={quest}
                projectName={projectsMap[quest.projectId]?.name}
                projectLogo={projectsMap[quest.projectId]?.logoUrl}
                onSelect={onSelectQuest}
                isParticipating={participatingQuestIds.has(quest.id)}
                isSaved={savedQuestIds?.has(quest.id)}
                onToggleSave={onToggleSaveQuest}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
