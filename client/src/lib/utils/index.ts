import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { TaskStatus, TaskPriority } from '@/types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(dateString?: string): string {
  if (!dateString) return '—';
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function isOverdue(dueDate?: string): boolean {
  if (!dueDate) return false;
  return new Date(dueDate) < new Date();
}

/** Safely extracts the backend message from an Axios error. */
export function getAxiosError(err: unknown, fallback: string): string {
  if (err && typeof err === 'object' && 'response' in err) {
    const res = (err as { response?: { data?: { message?: string } } }).response;
    if (typeof res?.data?.message === 'string' && res.data.message) {
      return res.data.message;
    }
  }
  return fallback;
}

export function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

export const STATUS_CONFIG: Record<TaskStatus, { label: string; className: string }> = {
  todo: {
    label: 'Todo',
    className: 'bg-slate-100 text-slate-600',
  },
  'in-progress': {
    label: 'In Progress',
    className: 'bg-amber-50 text-amber-700 border border-amber-200',
  },
  done: {
    label: 'Done',
    className: 'bg-green-50 text-green-700 border border-green-200',
  },
};

export const PRIORITY_CONFIG: Record<TaskPriority, { label: string; textClass: string; dotClass: string }> = {
  low: { label: 'Low', textClass: 'text-blue-600', dotClass: 'bg-blue-400' },
  medium: { label: 'Medium', textClass: 'text-orange-500', dotClass: 'bg-orange-400' },
  high: { label: 'High', textClass: 'text-red-600', dotClass: 'bg-red-500' },
};
