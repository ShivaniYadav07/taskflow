'use client';

import { Calendar, Check, Pencil, Trash2 } from 'lucide-react';
import type { Task, TaskStatus } from '@/types';
import { PriorityBadge } from '@/components/ui/badge';
import { StatusPicker } from '@/components/ui/status-picker';
import { Button } from '@/components/ui/button';
import { cn, formatDate, isOverdue } from '@/lib/utils';
import { useUpdateTask } from '@/hooks/use-tasks';

interface TaskCardProps {
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
  isDeleting?: boolean;
}

const PRIORITY_BORDER: Record<string, string> = {
  low: 'border-l-blue-300',
  medium: 'border-l-orange-300',
  high: 'border-l-red-400',
};

// Circle visual state per status
const TOGGLE_STYLE: Record<TaskStatus, string> = {
  todo: 'border-slate-300 bg-white hover:border-green-400 hover:bg-green-50',
  'in-progress': 'border-amber-400 bg-amber-50 hover:border-green-400 hover:bg-green-50',
  done: 'border-green-500 bg-green-500 hover:bg-green-600 hover:border-green-600',
};

export function TaskCard({ task, onEdit, onDelete, isDeleting }: TaskCardProps) {
  const overdue = task.status !== 'done' && isOverdue(task.dueDate);
  const { mutate: updateTask, isPending: isUpdating } = useUpdateTask();

  // Quick toggle: not-done → done, done → todo
  const handleToggleDone = () => {
    const next: TaskStatus = task.status === 'done' ? 'todo' : 'done';
    updateTask({ id: task._id, data: { status: next } });
  };

  const handleStatusChange = (status: TaskStatus) => {
    if (status === task.status) return;
    updateTask({ id: task._id, data: { status } });
  };

  return (
    <div
      className={cn(
        'group relative rounded-xl border border-slate-100 bg-white p-4 shadow-sm',
        'border-l-2 transition-all duration-200 hover:shadow-md hover:border-slate-200',
        PRIORITY_BORDER[task.priority],
        task.status === 'done' && 'opacity-60'
      )}
    >
      <div className="flex items-start gap-3">
        {/* Done / undo toggle circle */}
        <button
          onClick={handleToggleDone}
          disabled={isUpdating}
          title={task.status === 'done' ? 'Click to reopen' : 'Click to mark as done'}
          className={cn(
            'group/toggle mt-0.5 h-5 w-5 shrink-0 rounded-full border-2',
            'flex items-center justify-center',
            'transition-all duration-150 focus:outline-none',
            'focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-1',
            'disabled:cursor-not-allowed disabled:opacity-50',
            TOGGLE_STYLE[task.status]
          )}
        >
          {task.status === 'done' ? (
            <Check className="h-3 w-3 text-white" strokeWidth={3} />
          ) : (
            // Ghost checkmark appears on hover — clear affordance for "click to complete"
            <Check
              className="h-3 w-3 text-transparent transition-colors duration-150 group-hover/toggle:text-green-400"
              strokeWidth={3}
            />
          )}
        </button>

        <div className="min-w-0 flex-1">
          <p
            className={cn(
              'text-sm font-medium text-slate-900 leading-snug',
              task.status === 'done' && 'line-through text-slate-400'
            )}
          >
            {task.title}
          </p>
          {task.description && (
            <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-slate-500">
              {task.description}
            </p>
          )}

          <div className="mt-3 flex flex-wrap items-center gap-2">
            {/* Clickable status badge → opens status picker dropdown */}
            <StatusPicker
              current={task.status}
              onChange={handleStatusChange}
              isLoading={isUpdating}
            />
            <PriorityBadge priority={task.priority} />
            {task.dueDate && (
              <span
                className={cn(
                  'inline-flex items-center gap-1 text-xs',
                  overdue ? 'font-medium text-red-500' : 'text-slate-400'
                )}
              >
                <Calendar className="h-3 w-3" />
                {formatDate(task.dueDate)}
                {overdue && ' · Overdue'}
              </span>
            )}
          </div>
        </div>

        {/* Actions: always visible on mobile, hover-reveal on desktop */}
        <div className="flex shrink-0 items-center gap-0.5 sm:opacity-0 sm:transition-opacity sm:group-hover:opacity-100">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdit(task)}
            className="h-7 w-7 p-0 text-slate-400 hover:text-slate-700"
            title="Edit task"
          >
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(task._id)}
            isLoading={isDeleting}
            className="h-7 w-7 p-0 text-slate-400 hover:bg-red-50 hover:text-red-500"
            title="Delete task"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
