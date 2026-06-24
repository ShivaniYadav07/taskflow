'use client';

import { useState } from 'react';
import { Inbox } from 'lucide-react';
import type { Task } from '@/types';
import { TaskCard } from './task-card';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { useDeleteTask } from '@/hooks/use-tasks';

interface TaskListProps {
  tasks: Task[];
  onEdit: (task: Task) => void;
}

export function TaskList({ tasks, onEdit }: TaskListProps) {
  // ID of the task waiting for the user to confirm deletion
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  // ID of the task whose delete is currently in-flight (shows spinner)
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const { mutate: deleteTask } = useDeleteTask();

  const handleDeleteRequest = (id: string) => {
    setPendingDeleteId(id);
  };

  const handleConfirmDelete = () => {
    if (!pendingDeleteId) return;
    const id = pendingDeleteId;
    setDeletingId(id);
    deleteTask(id, {
      onSettled: () => {
        setDeletingId(null);
        setPendingDeleteId(null);
      },
    });
  };

  const handleCancelDelete = () => {
    if (deletingId) return; // don't cancel while the request is in-flight
    setPendingDeleteId(null);
  };

  const pendingTask = tasks.find((t) => t._id === pendingDeleteId);

  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 py-20 text-center">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100">
          <Inbox className="h-6 w-6 text-slate-400" />
        </div>
        <p className="text-sm font-semibold text-slate-600">No tasks here</p>
        <p className="mt-1.5 max-w-xs text-xs leading-relaxed text-slate-400">
          Hit <span className="font-medium text-indigo-500">New task</span> to add your first one, or try adjusting your filters.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col gap-2.5">
        {tasks.map((task, i) => (
          <div
            key={task._id}
            className="animate-slide-up"
            style={{ animationDelay: `${i * 40}ms` }}
          >
            <TaskCard
              task={task}
              onEdit={onEdit}
              onDelete={handleDeleteRequest}
              isDeleting={deletingId === task._id}
            />
          </div>
        ))}
      </div>

      <ConfirmDialog
        isOpen={!!pendingDeleteId}
        title="Delete this task?"
        description={
          pendingTask
            ? `"${pendingTask.title}" will be permanently deleted and cannot be recovered.`
            : 'This task will be permanently deleted.'
        }
        confirmLabel="Delete task"
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
        isLoading={!!deletingId}
      />
    </>
  );
}
