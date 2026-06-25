import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { taskService, type TaskFilters, type TaskPayload } from '@/services/task.service';

export function useTasks(filters?: TaskFilters, options?: { enabled?: boolean }) {
  return useQuery({
    // Include projectId in the key so switching projects busts the cache
    queryKey: ['tasks', filters?.projectId, filters],
    queryFn: () => taskService.getAll(filters).then((r) => r.data.data),
    enabled: (options?.enabled ?? true) && !!filters?.projectId,
  });
}

export function useCreateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: TaskPayload) =>
      taskService.create(data).then((r) => r.data.data.task),
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ['tasks', variables.projectId] });
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
