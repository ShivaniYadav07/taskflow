'use client';

import { useEffect, useRef, useState } from 'react';
import { Circle, Clock, CheckCircle2, Check } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { TaskStatus } from '@/types';
import { STATUS_CONFIG, cn } from '@/lib/utils';

interface StatusPickerProps {
  current: TaskStatus;
  onChange: (status: TaskStatus) => void;
  isLoading?: boolean;
}

interface Option {
  value: TaskStatus;
  label: string;
  description: string;
  Icon: LucideIcon;
  iconClass: string;
  hoverClass: string;
  activeClass: string;
}

const OPTIONS: Option[] = [
  {
    value: 'todo',
    label: 'Todo',
    description: 'Not started yet',
    Icon: Circle,
    iconClass: 'text-slate-400',
    hoverClass: 'hover:bg-slate-50',
    activeClass: 'bg-slate-50',
  },
  {
    value: 'in-progress',
    label: 'In Progress',
    description: 'Currently working on it',
    Icon: Clock,
    iconClass: 'text-amber-500',
    hoverClass: 'hover:bg-amber-50',
    activeClass: 'bg-amber-50',
  },
  {
    value: 'done',
    label: 'Done',
    description: 'All finished!',
    Icon: CheckCircle2,
    iconClass: 'text-green-500',
    hoverClass: 'hover:bg-green-50',
    activeClass: 'bg-green-50',
  },
];

export function StatusPicker({ current, onChange, isLoading }: StatusPickerProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onMouse = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onMouse);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onMouse);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const { label, className: badgeClass } = STATUS_CONFIG[current];

  return (
    <div ref={ref} className="relative">
      {/* Badge trigger */}
      <button
        onClick={() => setOpen((v) => !v)}
        disabled={isLoading}
        title="Change status"
        className={cn(
          'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium',
          'cursor-pointer select-none transition-all duration-150',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1',
          'hover:ring-2 hover:ring-offset-1',
          current === 'todo' && 'hover:ring-slate-300 focus-visible:ring-slate-400',
          current === 'in-progress' && 'hover:ring-amber-300 focus-visible:ring-amber-400',
          current === 'done' && 'hover:ring-green-300 focus-visible:ring-green-400',
          isLoading && 'cursor-not-allowed opacity-50',
          badgeClass
        )}
      >
        {label}
        {/* Tiny chevron hinting it's interactive */}
        <svg
          className="h-2.5 w-2.5 opacity-60"
          viewBox="0 0 10 6"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M1 1l4 4 4-4" />
        </svg>
      </button>

      {/* Dropdown panel */}
      {open && (
        <div className="absolute left-0 top-full z-30 mt-1.5 w-52 rounded-xl border border-slate-100 bg-white py-1.5 shadow-xl shadow-slate-200/60 animate-scale-in">
          <p className="px-3 pb-1.5 pt-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
            Update status
          </p>
          {OPTIONS.map(({ value, label: optLabel, description, Icon, iconClass, hoverClass, activeClass }) => {
            const isCurrent = current === value;
            return (
              <button
                key={value}
                onClick={() => {
                  onChange(value);
                  setOpen(false);
                }}
                className={cn(
                  'flex w-full items-center gap-2.5 px-3 py-2 text-left transition-colors duration-100',
                  isCurrent ? activeClass : hoverClass
                )}
              >
                <Icon className={cn('h-4 w-4 shrink-0', iconClass)} />
                <div className="min-w-0 flex-1">
                  <p className={cn('text-xs font-semibold', isCurrent ? 'text-slate-900' : 'text-slate-700')}>
                    {optLabel}
                  </p>
                  <p className="text-[10px] leading-tight text-slate-400">{description}</p>
                </div>
                {isCurrent && (
                  <Check className="h-3.5 w-3.5 shrink-0 text-indigo-500" />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
