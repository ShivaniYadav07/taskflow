import api from '@/lib/api/axios';
import type { ApiResponse, Comment } from '@/types';

export const commentService = {
  getAll: (taskId: string) =>
    api.get<ApiResponse<Comment[]> & { count: number }>(`/tasks/${taskId}/comments`),

  create: (taskId: string, body: string) =>
    api.post<ApiResponse<Comment>>(`/tasks/${taskId}/comments`, { body }),

  remove: (taskId: string, commentId: string) =>
    api.delete<ApiResponse<null>>(`/tasks/${taskId}/comments/${commentId}`),
};
