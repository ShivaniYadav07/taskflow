'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, UserPlus } from 'lucide-react';

import { useAuth } from '@/hooks/use-auth';
import { useTasks } from '@/hooks/use-tasks';
import type { Task } from '@/types';
import { Header } from '@/components/layout/header';
import { Button } from '@/components/ui/button';
import { useProjectContext } from '@/providers/project-provider';
import { KanbanBoard } from '@/components/kanban/KanbanBoard';
import { TaskDetailPanel } from '@/components/tasks/TaskDetailPanel';
import { CreateTaskModal } from '@/components/tasks/task-modals';
import { MemberForm } from '@/components/forms/MemberForm';
import { ProjectForm } from '@/components/forms/ProjectForm';
import { Briefcase } from 'lucide-react';

export default function BoardPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { activeProject, isLoading: projectsLoading } = useProjectContext();
  const router = useRouter();

  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isMemberFormOpen, setIsMemberFormOpen] = useState(false);
  const [isProjectFormOpen, setIsProjectFormOpen] = useState(false);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) router.replace('/login');
  }, [authLoading, isAuthenticated, router]);

  const { data, isLoading: tasksLoading } = useTasks(
    { projectId: activeProject?._id, limit: 200 },
    { enabled: isAuthenticated && !!activeProject }
  );

  const allTasks = data?.tasks ?? [];

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <span className="h-6 w-6 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) return null;

  // Empty state: no project selected
  if (!projectsLoading && !activeProject) {
    return (
      <>
        <Header />
        <main className="mx-auto flex max-w-lg flex-col items-center justify-center gap-5 px-4 py-24 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50">
            <Briefcase className="h-8 w-8 text-indigo-500" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-slate-800">No projects yet</h2>
            <p className="mt-2 text-sm text-slate-500">Create a project to start using the board.</p>
          </div>
          <Button onClick={() => setIsProjectFormOpen(true)}>
            <Plus className="h-4 w-4" />
            Create Project
          </Button>
        </main>
        {isProjectFormOpen && <ProjectForm onClose={() => setIsProjectFormOpen(false)} />}
      </>
    );
  }

  return (
    <>
      <Header />

      <main className="mx-auto w-full max-w-5xl flex h-[calc(100vh-3.5rem)] flex-col px-4 py-8 sm:px-6 animate-fade-in overflow-hidden">
        {/* Board header */}
        <div className="mb-5 flex items-center justify-between gap-4">
          <div>
            {activeProject && (
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center rounded-md bg-indigo-600 px-2 py-0.5 text-xs font-bold text-white tracking-wide">
                  {activeProject.key}
                </span>
                <h1 className="text-xl font-semibold text-slate-900">{activeProject.name}</h1>
              </div>
            )}
            <p className="mt-0.5 text-sm text-slate-400">Drag cards between columns to update their status.</p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {activeProject && (
              <Button variant="secondary" onClick={() => setIsMemberFormOpen(true)}>
                <UserPlus className="h-4 w-4" />
                <span className="hidden sm:inline">Invite</span>
              </Button>
            )}
            <Button onClick={() => setIsCreateOpen(true)} disabled={!activeProject} className="shadow-sm shadow-indigo-200">
              <Plus className="h-4 w-4" />
              <span>New task</span>
            </Button>
          </div>
        </div>

        {/* Kanban board */}
        {tasksLoading ? (
          <div className="flex flex-1 gap-4 overflow-hidden">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-full w-72 animate-pulse rounded-2xl bg-slate-100 shrink-0" />
            ))}
          </div>
        ) : (
          <div className="flex-1 min-h-0">
            <KanbanBoard tasks={allTasks} onCardClick={setSelectedTask} />
          </div>
        )}
      </main>

      {/* Task Detail slide-over */}
      <TaskDetailPanel task={selectedTask} onClose={() => setSelectedTask(null)} />

      {isCreateOpen && activeProject && (
        <CreateTaskModal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} />
      )}
      {isMemberFormOpen && <MemberForm onClose={() => setIsMemberFormOpen(false)} />}
    </>
  );
}
