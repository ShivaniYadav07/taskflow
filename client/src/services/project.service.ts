import api from '@/lib/api/axios';
import type { ApiResponse, Project, User } from '@/types';

export interface ProjectPayload {
  name: string;
  key: string;
  description?: string;
}

export const projectService = {
  getAll: () =>
    api.get<ApiResponse<Project[]> & { count?: number }>('/projects'),

  getById: (id: string) =>
    api.get<ApiResponse<Project>>(`/projects/${id}`),

  create: (data: ProjectPayload) =>
    api.post<ApiResponse<Project>>('/projects', data),

  update: (id: string, data: Partial<ProjectPayload>) =>
    api.put<ApiResponse<Project>>(`/projects/${id}`, data),

  remove: (id: string) =>
    api.delete<ApiResponse<null>>(`/projects/${id}`),

  addMember: (id: string, email: string) =>
    api.post<ApiResponse<{ message: string }>>(`/projects/${id}/members`, { email }),

  removeMember: (projectId: string, userId: string) =>
    api.delete<ApiResponse<{ message: string }>>(`/projects/${projectId}/members/${userId}`),
};
