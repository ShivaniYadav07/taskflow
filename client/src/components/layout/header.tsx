'use client';

import { useEffect, useRef, useState } from 'react';
import { LogOut, CheckSquare, Mail, CalendarDays, ChevronDown, LayoutList, Kanban } from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/use-auth';
import { cn } from '@/lib/utils';
import { ProjectSelector } from './ProjectSelector';

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

function formatMemberSince(iso?: string): string {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

export function Header() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click or Escape
  useEffect(() => {
    if (!open) return;
    const onMouse = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onMouse);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onMouse);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const handleLogout = () => {
    setOpen(false);
    logout();
    toast.success('Signed out successfully');
    router.push('/login');
  };

  if (!user) return null;

  const initials = getInitials(user.name);
  const memberSince = formatMemberSince(user.createdAt);

  return (
    <header className="sticky top-0 z-40 border-b border-slate-100 bg-white/90 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4 sm:px-6">
        {/* Brand & View Toggle & Project Selector */}
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600">
            <CheckSquare className="h-4 w-4 text-white" />
          </div>
          <span className="text-sm font-semibold text-slate-900">TaskFlow</span>

          {/* Board / List toggle — only show on dashboard routes */}
          {(pathname?.startsWith('/dashboard')) && (
            <div className="ml-3 flex items-center rounded-lg border border-slate-200 bg-slate-100 p-0.5">
              <button
                onClick={() => router.push('/dashboard')}
                className={cn(
                  'flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-all',
                  pathname === '/dashboard'
                    ? 'bg-white text-slate-800 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                )}
              >
                <LayoutList className="h-3.5 w-3.5" />
                List
              </button>
              <button
                onClick={() => router.push('/dashboard/board')}
                className={cn(
                  'flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-all',
                  pathname === '/dashboard/board'
                    ? 'bg-white text-slate-800 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                )}
              >
                <Kanban className="h-3.5 w-3.5" />
                Board
              </button>
            </div>
          )}

          <ProjectSelector />
        </div>

        {/* Profile trigger */}
        <div ref={ref} className="relative">
          <button
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-haspopup="true"
            className={cn(
              'flex items-center gap-2 rounded-xl px-2 py-1.5 outline-none',
              'transition-colors duration-150 hover:bg-slate-100',
              'focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-1',
              open && 'bg-slate-100'
            )}
          >
            {/* Name + email on desktop */}
            <div className="hidden flex-col items-end leading-tight sm:flex">
              <span className="text-sm font-medium text-slate-800">{user.name}</span>
              <span className="text-xs text-slate-400">{user.email}</span>
            </div>

            {/* Avatar */}
            <div className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 text-xs font-bold text-white shadow-sm ring-2 ring-white">
              {initials}
              {/* Online dot */}
              <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-white bg-green-400" />
            </div>

            <ChevronDown
              className={cn(
                'hidden h-3.5 w-3.5 text-slate-400 transition-transform duration-200 sm:block',
                open && 'rotate-180'
              )}
            />
          </button>

          {/* Dropdown */}
          {open && (
            <div className="absolute right-0 top-full mt-2 w-72 overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-xl shadow-slate-200/80 animate-scale-in">

              {/* Gradient profile header */}
              <div className="relative bg-gradient-to-br from-indigo-500 via-indigo-600 to-violet-700 px-5 py-5">
                {/* Decorative orb */}
                <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/10 blur-2xl" />

                <div className="flex items-center gap-3.5">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/20 text-base font-bold text-white ring-2 ring-white/30 backdrop-blur-sm">
                    {initials}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-white">{user.name}</p>
                    <p className="mt-0.5 truncate text-xs text-indigo-200">{user.email}</p>
                  </div>
                </div>
              </div>

              {/* Info rows */}
              <div className="px-4 py-3.5 flex flex-col gap-3">
                <div className="flex items-center gap-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-100">
                    <Mail className="h-3.5 w-3.5 text-slate-500" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-slate-500">Email address</p>
                    <p className="truncate text-xs font-semibold text-slate-800">{user.email}</p>
                  </div>
                </div>

                {memberSince && (
                  <div className="flex items-center gap-3">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-100">
                      <CalendarDays className="h-3.5 w-3.5 text-slate-500" />
                    </span>
                    <div>
                      <p className="text-xs font-medium text-slate-500">Member since</p>
                      <p className="text-xs font-semibold text-slate-800">{memberSince}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Sign out */}
              <div className="border-t border-slate-100 px-3 pb-3">
                <button
                  onClick={handleLogout}
                  className={cn(
                    'flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium',
                    'text-red-600 transition-colors duration-150 hover:bg-red-50'
                  )}
                >
                  <LogOut className="h-4 w-4" />
                  Sign out of TaskFlow
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
