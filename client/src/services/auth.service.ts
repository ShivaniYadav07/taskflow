import api from '@/lib/api/axios';
import type { ApiResponse, User } from '@/types';

export interface AuthData {
  user: User;
}

export const authService = {
  register: (data: { name: string; email: string; password: string }) =>
    api.post<ApiResponse<AuthData>>('/auth/register', data),

  login: (data: { email: string; password: string }) =>
    api.post<ApiResponse<AuthData>>('/auth/login', data),

  // Tells the server to clear the httpOnly cookie
  logout: () =>
    api.post<ApiResponse<null>>('/auth/logout'),

  getMe: () =>
    api.get<ApiResponse<User>>('/auth/me'),
};
