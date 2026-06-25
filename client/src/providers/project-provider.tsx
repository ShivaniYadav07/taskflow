'use client';

import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { Project } from '@/types';
import { projectService } from '@/services/project.service';
import { useAuthContext } from './auth-provider';

interface ProjectContextType {
  projects: Project[];
  activeProject: Project | null;
  setActiveProject: (project: Project | null) => void;
  isLoading: boolean;
  refetchProjects: () => void;
}

const ProjectContext = createContext<ProjectContextType | null>(null);

export function ProjectProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuthContext();
  const [activeProject, setActiveProjectState] = useState<Project | null>(null);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const res = await projectService.getAll();
      return res.data.data;
    },
    enabled: isAuthenticated,
  });

  const projects = data || [];

  // Load last active project from localStorage or default to first project
  useEffect(() => {
    if (!projects.length) {
      setActiveProjectState(null);
      return;
    }

    const storedId = localStorage.getItem('activeProjectId');
    if (storedId) {
      const found = projects.find(p => p._id === storedId);
      if (found) {
        setActiveProjectState(found);
        return;
      }
    }

    // Default to first project if none selected
    setActiveProjectState(projects[0]);
  }, [projects]);

  const setActiveProject = (project: Project | null) => {
    setActiveProjectState(project);
    if (project) {
      localStorage.setItem('activeProjectId', project._id);
    } else {
      localStorage.removeItem('activeProjectId');
    }
  };

  return (
    <ProjectContext.Provider 
      value={{ 
        projects, 
        activeProject, 
        setActiveProject, 
        isLoading, 
        refetchProjects: refetch 
      }}
    >
      {children}
    </ProjectContext.Provider>
  );
}

export function useProjectContext() {
  const ctx = useContext(ProjectContext);
  if (!ctx) throw new Error('useProjectContext must be used within ProjectProvider');
  return ctx;
}
