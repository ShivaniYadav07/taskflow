import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { taskService, type TaskFilters, type TaskPayload } from '@/services/task.service';

export function useTasks(filters?: TaskFilters, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ['tasks', filters],
    queryFn: () => taskService.getAll(filters).then((r) => r.data.data),
    // Never run while not authenticated — prevents serving a previous user's cache
    enabled: options?.enabled ?? true,
  });
}

export function useCreateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: TaskPayload) =>
      taskService.create(data).then((r) => r.data.data.task),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tasks'] });
      toast.success('Task created');
    },
    onError: () => toast.error('Failed to create task'),
  });
}

export function useUpdateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<TaskPayload> }) =>
      taskService.update(id, data).then((r) => r.data.data.task),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tasks'] });
      toast.success('Task updated');
    },
    onError: () => toast.error('Failed to update task'),
  });
}

export function useDeleteTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => taskService.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tasks'] });
      toast.success('Task deleted');
    },
    onError: () => toast.error('Failed to delete task'),
  });
}
