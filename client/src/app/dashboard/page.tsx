'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, ChevronDown, Briefcase, UserPlus } from 'lucide-react';

import { useAuth } from '@/hooks/use-auth';
import { useTasks } from '@/hooks/use-tasks';
import type { Task, TaskStatus } from '@/types';
import { Header } from '@/components/layout/header';
import { TaskStats } from '@/components/tasks/task-stats';
import { TaskList } from '@/components/tasks/task-list';
import { CreateTaskModal, EditTaskModal } from '@/components/tasks/task-modals';
import { Button } from '@/components/ui/button';
import { cn, getGreeting } from '@/lib/utils';
import { useProjectContext } from '@/providers/project-provider';
import { ProjectForm } from '@/components/forms/ProjectForm';
import { MemberForm } from '@/components/forms/MemberForm';

type PriorityFilter = '' | 'low' | 'medium' | 'high';

const STATUS_TABS: { value: TaskStatus | ''; label: string }[] = [
  { value: '', label: 'All' },
  { value: 'todo', label: 'Todo' },
  { value: 'in-progress', label: 'In Progress' },
  { value: 'done', label: 'Done' },
];

const PRIORITY_OPTIONS: { value: PriorityFilter; label: string }[] = [
  { value: '', label: 'All priorities' },
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
];

export default function DashboardPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { activeProject, isLoading: projectsLoading } = useProjectContext();
  const router = useRouter();

  const [statusFilter, setStatusFilter] = useState<TaskStatus | ''>('');
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isProjectFormOpen, setIsProjectFormOpen] = useState(false);
  const [isMemberFormOpen, setIsMemberFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) router.replace('/login');
  }, [authLoading, isAuthenticated, router]);

  // Reset filters when project changes
  useEffect(() => {
    setStatusFilter('');
    setPriorityFilter('');
  }, [activeProject?._id]);

  const { data, isLoading: tasksLoading } = useTasks(
    { projectId: activeProject?._id, limit: 100 },
    { enabled: isAuthenticated && !!activeProject }
  );

  const allTasks = data?.tasks ?? [];

  const counts = useMemo(
    () => ({
      '': allTasks.length,
      todo: allTasks.filter((t) => t.status === 'todo').length,
      'in-progress': allTasks.filter((t) => t.status === 'in-progress').length,
      done: allTasks.filter((t) => t.status === 'done').length,
    }),
    [allTasks]
  );

  const displayedTasks = useMemo(
    () =>
      allTasks.filter((t) => {
        if (statusFilter && t.status !== statusFilter) return false;
        if (priorityFilter && t.priority !== priorityFilter) return false;
        return true;
      }),
    [allTasks, statusFilter, priorityFilter]
  );

  if (authLoading && !isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <span className="h-6 w-6 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) return null;

  const greeting = getGreeting();
  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  // ─── Empty State: No projects at all ────────────────────────────────────────
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
            <p className="mt-2 text-sm text-slate-500">
              Create your first project to start organising tasks as a team.
            </p>
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

      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 animate-fade-in">
        {/* Greeting + Actions */}
        <div className="mb-7 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold text-slate-900">
              {greeting}, {user?.name?.split(' ')[0]} 👋
            </h1>
            <p className="mt-0.5 text-sm text-slate-400">{today}</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {/* Invite member button — only shows when a project is active */}
            {activeProject && (
              <Button
                variant="secondary"
                onClick={() => setIsMemberFormOpen(true)}
                className="gap-2"
              >
                <UserPlus className="h-4 w-4" />
                <span className="hidden sm:inline">Invite</span>
              </Button>
            )}
            <Button
              onClick={() => setIsCreateOpen(true)}
              disabled={!activeProject}
              className="shadow-sm shadow-indigo-200"
            >
              <Plus className="h-4 w-4" />
              <span>New task</span>
            </Button>
          </div>
        </div>

        {/* Active project context badge */}
        {activeProject && (
          <div className="mb-6 flex items-center gap-2 rounded-xl border border-indigo-100 bg-indigo-50 px-4 py-2.5">
            <span className="inline-flex items-center rounded-md bg-indigo-600 px-2 py-0.5 text-xs font-bold text-white tracking-wide">
              {activeProject.key}
            </span>
            <span className="text-sm font-medium text-indigo-800">{activeProject.name}</span>
            {activeProject.description && (
              <span className="text-xs text-indigo-400 hidden sm:inline">
                — {activeProject.description}
              </span>
            )}
          </div>
        )}

        {/* Stats */}
        <div className="mb-7">
          <TaskStats tasks={allTasks} />
        </div>

        {/* Filter bar */}
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          {/* Status tabs — segmented control */}
          <div className="flex rounded-xl border border-slate-200 bg-slate-100 p-1 gap-0.5">
            {STATUS_TABS.map((tab) => {
              const active = statusFilter === tab.value;
              return (
                <button
                  key={tab.value}
                  onClick={() => setStatusFilter(tab.value)}
                  className={cn(
                    'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-all duration-150',
                    active
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-500 hover:text-slate-700'
                  )}
                >
                  {tab.label}
                  <span
                    className={cn(
                      'rounded-full px-1.5 py-0.5 text-xs font-semibold tabular-nums transition-colors',
                      active ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-200 text-slate-500'
                    )}
                  >
                    {counts[tab.value]}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Priority filter */}
          <div className="relative">
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value as PriorityFilter)}
              className={cn(
                'h-9 appearance-none rounded-lg border border-slate-200 bg-white pl-3 pr-8 text-sm',
                'text-slate-600 outline-none cursor-pointer transition-colors',
                'focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100',
                priorityFilter && 'border-indigo-300 text-indigo-700 bg-indigo-50 font-medium'
              )}
            >
              {PRIORITY_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
          </div>
        </div>

        {/* Filtered result summary */}
        {(statusFilter || priorityFilter) && !tasksLoading && (
          <div className="mb-4 flex items-center justify-between">
            <p className="text-xs text-slate-400">
              Showing <span className="font-semibold text-slate-600">{displayedTasks.length}</span>{' '}
              of <span className="font-semibold text-slate-600">{allTasks.length}</span> tasks
            </p>
            <button
              onClick={() => { setStatusFilter(''); setPriorityFilter(''); }}
              className="text-xs font-medium text-indigo-600 hover:text-indigo-500 transition-colors"
            >
              Clear filters
            </button>
          </div>
        )}

        {/* Task list or skeleton */}
        {tasksLoading ? (
          <div className="flex flex-col gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="h-20 animate-pulse rounded-xl bg-slate-100"
                style={{ animationDelay: `${i * 80}ms` }}
              />
            ))}
          </div>
        ) : (
          <div className="animate-slide-up">
            <TaskList tasks={displayedTasks} onEdit={setEditingTask} />
          </div>
        )}
      </main>

      {isCreateOpen && activeProject && (
        <CreateTaskModal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} />
      )}
      <EditTaskModal task={editingTask} onClose={() => setEditingTask(null)} />
      {isMemberFormOpen && <MemberForm onClose={() => setIsMemberFormOpen(false)} />}
    </>
  );
}
