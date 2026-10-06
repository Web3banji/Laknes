import React, { useState } from 'react';
import { ProjectData, ProjectCard } from '../cards/ProjectCard';
import { SearchInput } from '../../design-system/primitives/SearchInput';
import { Tabs } from '../../design-system/primitives/Tabs';
import { Button } from '../../design-system/primitives/Button';
import { ProjectCardSkeleton } from '../../design-system/primitives/Skeleton';
import { EmptyState } from '../../design-system/primitives/EmptyState';
import { Plus, Compass, CheckCircle2 } from 'lucide-react';

export interface ProjectsDirectoryViewProps {
  projects: ProjectData[];
  onSelectProject: (project: ProjectData) => void;
  onRequestSubmit: () => void;
  isLoading?: boolean;
}

export const ProjectsDirectoryView: React.FC<ProjectsDirectoryViewProps> = ({
  projects,
  onSelectProject,
  onRequestSubmit,
  isLoading = false,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [verifiedOnly, setVerifiedOnly] = useState<boolean>(false);

  const filteredProjects = projects.filter((project) => {
    const matchesSearch =
      project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (project.description || project.summary || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      categoryFilter === 'all' || project.category === categoryFilter;
    const matchesVerified = !verifiedOnly || project.isVerified;

    return matchesSearch && matchesCategory && matchesVerified;
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="border-b border-neutral-200/80 pb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="max-w-2xl">
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-neutral-950">
            Elysium Projects Registry
          </h1>
          <p className="mt-2 text-sm text-neutral-600 leading-relaxed">
            A comprehensive, verified directory of smart contracts, decentralized applications, tooling, and protocols native to Elysium.
          </p>
        </div>

        <div className="shrink-0">
          <Button
            variant="primary"
            size="md"
            onClick={onRequestSubmit}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Submit Project
          </Button>
        </div>
      </div>

      {/* Search and Filters Toolbar */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="w-full sm:max-w-md">
            <SearchInput
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search by project name or description…"
            />
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setVerifiedOnly(!verifiedOnly)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium border transition-colors cursor-pointer ${
                verifiedOnly
                  ? 'bg-neutral-900 text-white border-neutral-900'
                  : 'bg-white text-neutral-600 border-neutral-200 hover:border-neutral-300'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Verified Only</span>
            </button>
          </div>
        </div>

        {/* Category Tabs */}
        <div className="flex items-center justify-between gap-4 overflow-x-auto no-scrollbar border-b border-neutral-100 pb-3">
          <Tabs
            variant="segmented"
            size="sm"
            activeTab={categoryFilter}
            onChange={setCategoryFilter}
            tabs={[
              { id: 'all', label: 'All Projects', count: projects.length },
              { id: 'DeFi', label: 'DeFi' },
              { id: 'Infrastructure', label: 'Infrastructure' },
              { id: 'Tooling', label: 'Tooling' },
              { id: 'Gaming', label: 'Gaming' },
              { id: 'Community', label: 'Community' },
            ]}
          />

          <span className="text-xs text-neutral-400 font-mono tabular-nums shrink-0">
            {filteredProjects.length} {filteredProjects.length === 1 ? 'project' : 'projects'}
          </span>
        </div>
      </div>

      {/* Projects Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <ProjectCardSkeleton key={i} />
          ))}
        </div>
      ) : filteredProjects.length === 0 ? (
        <EmptyState
          title="No projects match your filter"
          description={
            searchQuery || verifiedOnly
              ? 'Try modifying your search query or disabling the verified filter.'
              : 'There are no projects listed under this category yet.'
          }
          action={
            <div className="flex items-center justify-center gap-3">
              <Button
                variant="secondary"
                onClick={() => {
                  setSearchQuery('');
                  setCategoryFilter('all');
                  setVerifiedOnly(false);
                }}
              >
                Reset Filters
              </Button>
              <Button
                variant="primary"
                onClick={onRequestSubmit}
              >
                Submit a Project
              </Button>
            </div>
          }
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProjects.map((project) => (
            <ProjectCard
              key={project.id}
              name={project.name}
              description={project.description || project.summary || ''}
              category={project.category}
              status={project.status || (project.isVerified ? 'Verified' : undefined)}
              logo={project.logo}
              onClick={() => onSelectProject(project)}
            />
          ))}
        </div>
      )}
    </div>
  );
};
