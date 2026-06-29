export interface User {
  _id?: string;
  id?: string;
  name: string;
  email: string;
  createdAt?: string;
}

export interface Project {
  _id: string;
  name: string;
  key: string;
  description?: string;
  owner: string | User;
  members: (string | User)[];
  createdAt: string;
  updatedAt: string;
}

export type TaskStatus = 'todo' | 'in-progress' | 'done';
export type TaskPriority = 'low' | 'medium' | 'high';

export interface Task {
  _id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate?: string;
  projectId: string | Project;
  assignedTo?: string | User;
  createdBy: string | User;
  createdAt: string;
  updatedAt: string;
}

export interface TasksResponse {
  count: number;
  total: number;
  page: number;
  totalPages: number;
  tasks: Task[];
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (user: User) => void;
  logout: () => void;
}

export interface Comment {
  _id: string;
  taskId: string;
  authorId: User;
  body: string;
  createdAt: string;
  updatedAt: string;
}
