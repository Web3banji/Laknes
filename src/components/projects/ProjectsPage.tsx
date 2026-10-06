import React, { useState, useMemo } from 'react';
import { PageContainer } from '../layout/PageContainer';
import { PageHeader } from '../layout/PageHeader';
import { ProjectCard } from './ProjectCard';
import { FilterTabs } from '../ui/FilterTabs';
import { EmptyState } from '../ui/EmptyState';
import { projectCategories, ProjectCategory, Project } from '../../data/types';
import { ELYSIUM_PROJECTS } from '../../lib/data';

export interface ProjectsPageProps {
  onSelectProject: (project: Project) => void;
}

export function ProjectsPage({ onSelectProject }: ProjectsPageProps) {
  const [activeCategory, setActiveCategory] = useState<ProjectCategory>('All');

  const filteredProjects = useMemo(() => {
    if (activeCategory === 'All') {
      return ELYSIUM_PROJECTS;
    }
    return ELYSIUM_PROJECTS.filter(
      (p) => p.category?.toLowerCase() === activeCategory.toLowerCase()
    );
  }, [activeCategory]);

  return (
    <PageContainer className="max-w-5xl">
      <PageHeader
        title="Projects"
        description="Discover decentralized gaming studios, DeFi protocols, and infrastructure deployed on Elysium."
        badge="Verified Registry"
      />

      {/* Shared Filter Tabs */}
      <FilterTabs
        tabs={projectCategories}
        activeTab={activeCategory}
        onChange={setActiveCategory}
        ariaLabel="Project categories"
      />

      {/* Project Grid */}
      {filteredProjects.length === 0 ? (
        <EmptyState
          title="No projects found"
          description="Try selecting another category or check back as new protocols launch."
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredProjects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              onSelect={onSelectProject}
            />
          ))}
        </div>
      )}
    </PageContainer>
  );
}
