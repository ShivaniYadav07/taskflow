'use client';

import { Droppable } from '@hello-pangea/dnd';
import type { Task } from '@/types';
import { KanbanCard } from './KanbanCard';
import { cn } from '@/lib/utils';

const COLUMN_CONFIG = {
  'todo': { label: 'To Do', dotColor: 'bg-slate-400' },
  'in-progress': { label: 'In Progress', dotColor: 'bg-amber-400' },
  'done': { label: 'Done', dotColor: 'bg-green-400' },
} as const;

interface KanbanColumnProps {
  status: keyof typeof COLUMN_CONFIG;
  tasks: Task[];
  commentCounts: Record<string, number>;
  onCardClick: (task: Task) => void;
}

export function KanbanColumn({ status, tasks, commentCounts, onCardClick }: KanbanColumnProps) {
  const config = COLUMN_CONFIG[status];

  return (
    <div className="flex w-72 shrink-0 flex-col rounded-2xl border border-slate-200 bg-slate-50 h-full max-h-full overflow-hidden">
      {/* Column header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <span className={cn('h-2 w-2 rounded-full', config.dotColor)} />
          <h3 className="text-sm font-semibold text-slate-700">{config.label}</h3>
        </div>
        <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-slate-200 px-1.5 text-xs font-semibold text-slate-600">
          {tasks.length}
        </span>
      </div>

      {/* Droppable area */}
      <Droppable droppableId={status}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={cn(
              'flex flex-1 flex-col gap-2.5 p-3 min-h-[200px] overflow-y-auto transition-colors duration-150 custom-scrollbar',
              snapshot.isDraggingOver && 'bg-indigo-50/60'
            )}
          >
            {tasks.map((task, index) => (
              <KanbanCard
                key={task._id}
                task={task}
                index={index}
                commentCount={commentCounts[task._id] ?? 0}
                onClick={onCardClick}
              />
            ))}
            {provided.placeholder}

            {tasks.length === 0 && !snapshot.isDraggingOver && (
              <div className="flex flex-1 items-center justify-center rounded-lg border-2 border-dashed border-slate-200 py-8">
                <p className="text-xs text-slate-400">No tasks here</p>
              </div>
            )}
          </div>
        )}
      </Droppable>
    </div>
  );
}
