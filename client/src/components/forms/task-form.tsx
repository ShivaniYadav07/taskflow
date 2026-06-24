'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { taskSchema, type TaskFormData } from '@/lib/validations/task';
import type { Task } from '@/types';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';

interface TaskFormProps {
  defaultValues?: Partial<Task>;
  onSubmit: (data: TaskFormData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
  submitLabel?: string;
}

export function TaskForm({
  defaultValues,
  onSubmit,
  onCancel,
  isLoading,
  submitLabel = 'Save',
}: TaskFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<TaskFormData>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      title: defaultValues?.title ?? '',
      description: defaultValues?.description ?? '',
      status: defaultValues?.status ?? 'todo',
      priority: defaultValues?.priority ?? 'medium',
      dueDate: defaultValues?.dueDate
        ? new Date(defaultValues.dueDate).toISOString().split('T')[0]
        : '',
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <Input
        {...register('title')}
        id="title"
        label="Title"
        placeholder="What needs to be done?"
        error={errors.title?.message}
      />
      <Textarea
        {...register('description')}
        id="description"
        label="Description"
        placeholder="Add more details (optional)"
        rows={3}
        error={errors.description?.message}
      />
      <div className="grid grid-cols-2 gap-3">
        <Select {...register('status')} id="status" label="Status" error={errors.status?.message}>
          <option value="todo">Todo</option>
          <option value="in-progress">In Progress</option>
          <option value="done">Done</option>
        </Select>
        <Select
          {...register('priority')}
          id="priority"
          label="Priority"
          error={errors.priority?.message}
        >
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </Select>
      </div>
      <Input
        {...register('dueDate')}
        id="dueDate"
        type="date"
        label="Due date"
        error={errors.dueDate?.message}
      />
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" isLoading={isLoading}>
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
