'use client';

import { useState, useCallback } from 'react';
import { DragDropContext, type DropResult } from '@hello-pangea/dnd';
import type { Task, TaskStatus } from '@/types';
import { KanbanColumn } from './KanbanColumn';
import { useUpdateTask } from '@/hooks/use-tasks';
import { toast } from 'sonner';

const COLUMNS: TaskStatus[] = ['todo', 'in-progress', 'done'];

interface KanbanBoardProps {
  tasks: Task[];
  onCardClick: (task: Task) => void;
}

export function KanbanBoard({ tasks, onCardClick }: KanbanBoardProps) {
  const { mutateAsync: updateTask } = useUpdateTask();
  // Optimistic local state: task overrides keyed by task ID
  const [optimisticUpdates, setOptimisticUpdates] = useState<Record<string, TaskStatus>>({});

  const getTaskStatus = useCallback(
    (task: Task): TaskStatus => optimisticUpdates[task._id] ?? task.status,
    [optimisticUpdates]
  );

  const onDragEnd = useCallback(
    async (result: DropResult) => {
      const { draggableId, destination, source } = result;
      if (!destination) return;
      if (destination.droppableId === source.droppableId) return;

      const newStatus = destination.droppableId as TaskStatus;

      // Optimistic update: immediately reflect in UI
      setOptimisticUpdates((prev) => ({ ...prev, [draggableId]: newStatus }));

      try {
        await updateTask({ id: draggableId, data: { status: newStatus } });
      } catch {
        // Revert on failure
        setOptimisticUpdates((prev) => {
          const next = { ...prev };
          delete next[draggableId];
          return next;
        });
        toast.error('Failed to update task status');
      }
    },
    [updateTask]
  );

  const columnTasks = COLUMNS.reduce((acc, status) => {
    acc[status] = tasks.filter((t) => getTaskStatus(t) === status);
    return acc;
  }, {} as Record<TaskStatus, Task[]>);

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="flex gap-4 h-full overflow-x-auto pb-4">
        {COLUMNS.map((status) => (
          <KanbanColumn
            key={status}
            status={status}
            tasks={columnTasks[status]}
            commentCounts={{}} // comment counts fetched per-task in TaskDetailPanel
            onCardClick={onCardClick}
          />
        ))}
      </div>
    </DragDropContext>
  );
}
