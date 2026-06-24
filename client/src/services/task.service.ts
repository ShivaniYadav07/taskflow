import api from '@/lib/api/axios';
import type { ApiResponse, Task, TasksResponse } from '@/types';

export interface TaskFilters {
  status?: string;
  priority?: string;
  page?: number;
  limit?: number;
}

export interface TaskPayload {
  title: string;
  description?: string;
  status?: string;
  priority?: string;
  dueDate?: string;
}

export const taskService = {
  getAll: (filters?: TaskFilters) =>
    api.get<ApiResponse<TasksResponse>>('/tasks', { params: filters }),

  getById: (id: string) =>
    api.get<ApiResponse<{ task: Task }>>(`/tasks/${id}`),

  create: (data: TaskPayload) =>
    api.post<ApiResponse<{ task: Task }>>('/tasks', data),

  update: (id: string, data: Partial<TaskPayload>) =>
    api.patch<ApiResponse<{ task: Task }>>(`/tasks/${id}`, data),

  remove: (id: string) =>
    api.delete<ApiResponse<null>>(`/tasks/${id}`),
};
