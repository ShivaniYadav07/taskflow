'use client';

import { useState } from 'react';
import { GripVertical, MessageSquare, User2, AlertCircle } from 'lucide-react';
import { Draggable } from '@hello-pangea/dnd';
import type { Task, User } from '@/types';
import { cn } from '@/lib/utils';

const PRIORITY_CONFIG = {
  high: { label: 'High', className: 'bg-red-100 text-red-700 border-red-200' },
  medium: { label: 'Medium', className: 'bg-amber-100 text-amber-700 border-amber-200' },
  low: { label: 'Low', className: 'bg-sky-100 text-sky-700 border-sky-200' },
};

interface KanbanCardProps {
  task: Task;
  index: number;
  commentCount: number;
  onClick: (task: Task) => void;
}

function getInitials(name: string) {
  return name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();
}

export function KanbanCard({ task, index, commentCount, onClick }: KanbanCardProps) {
  const priority = PRIORITY_CONFIG[task.priority];
  const assignee = task.assignedTo as User | undefined;

  return (
    <Draggable draggableId={task._id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          onClick={() => onClick(task)}
          className={cn(
            'group relative rounded-xl border bg-white p-3.5 shadow-sm cursor-pointer',
            'transition-all duration-150 hover:shadow-md hover:border-indigo-200',
            snapshot.isDragging && 'shadow-xl border-indigo-300 rotate-1 scale-105'
          )}
        >
          {/* Drag handle */}
          <div
            {...provided.dragHandleProps}
            onClick={(e) => e.stopPropagation()}
            className="absolute right-2 top-2 rounded p-1 text-slate-300 opacity-0 group-hover:opacity-100 hover:bg-slate-100 hover:text-slate-500 transition-all"
          >
            <GripVertical className="h-4 w-4" />
          </div>

          {/* Priority badge */}
          <span className={cn('inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium mb-2', priority.className)}>
            <AlertCircle className="h-3 w-3" />
            {priority.label}
          </span>

          {/* Title */}
          <p className="text-sm font-medium text-slate-800 leading-snug pr-4 mb-3">
            {task.title}
          </p>

          {/* Footer: assignee + comment count */}
          <div className="flex items-center justify-between">
            {assignee ? (
              <div className="flex items-center gap-1.5">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-indigo-400 to-violet-500 text-[10px] font-bold text-white">
                  {getInitials(assignee.name)}
                </div>
                <span className="text-xs text-slate-400 truncate max-w-[80px]">{assignee.name}</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-slate-300">
                <User2 className="h-4 w-4" />
                <span className="text-xs">Unassigned</span>
              </div>
            )}

            {commentCount > 0 && (
              <div className="flex items-center gap-1 text-slate-400">
                <MessageSquare className="h-3.5 w-3.5" />
                <span className="text-xs">{commentCount}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </Draggable>
  );
}
