'use client';

import type { Task } from '@/types';
import type { TaskFormData } from '@/lib/validations/task';
import { Modal } from '@/components/ui/modal';
import { TaskForm } from '@/components/forms/task-form';
import { useCreateTask, useUpdateTask } from '@/hooks/use-tasks';
import { useProjectContext } from '@/providers/project-provider';

interface CreateTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CreateTaskModal({ isOpen, onClose }: CreateTaskModalProps) {
  const { mutateAsync: createTask, isPending } = useCreateTask();
  const { activeProject } = useProjectContext();

  const handleSubmit = async (data: TaskFormData) => {
    if (!activeProject) return;
    // Inject the active projectId before sending to the API
    await createTask({ ...data, projectId: activeProject._id });
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="New task">
      <TaskForm
        onSubmit={handleSubmit}
        onCancel={onClose}
        isLoading={isPending}
        submitLabel="Create task"
      />
    </Modal>
  );
}

interface EditTaskModalProps {
  task: Task | null;
  onClose: () => void;
}

export function EditTaskModal({ task, onClose }: EditTaskModalProps) {
  const { mutateAsync: updateTask, isPending } = useUpdateTask();

  const handleSubmit = async (data: TaskFormData) => {
    if (!task) return;
    await updateTask({ id: task._id, data });
    onClose();
  };

  return (
    <Modal isOpen={!!task} onClose={onClose} title="Edit task">
      {task && (
        <TaskForm
          defaultValues={task}
          onSubmit={handleSubmit}
          onCancel={onClose}
          isLoading={isPending}
          submitLabel="Save changes"
        />
      )}
    </Modal>
  );
}
