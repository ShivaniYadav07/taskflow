'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Circle, Clock, CheckCircle2, Check } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { TaskStatus } from '@/types';
import { STATUS_CONFIG, cn } from '@/lib/utils';

interface StatusPickerProps {
  current: TaskStatus;
  onChange: (status: TaskStatus) => void;
  isLoading?: boolean;
  onOpenChange?: (open: boolean) => void;
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

export function StatusPicker({ current, onChange, isLoading, onOpenChange }: StatusPickerProps) {
  const [open, setOpen] = useState(false);
  // Tracks the pixel position of the dropdown relative to the viewport
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleOpen = useCallback((next: boolean) => {
    if (next && triggerRef.current) {
      // Measure the trigger button's position in the viewport
      const rect = triggerRef.current.getBoundingClientRect();
      const dropdownHeight = 180; // approximate height of the dropdown
      const spaceBelow = window.innerHeight - rect.bottom;
      
      let topPos = rect.bottom + 6;
      // If it doesn't fit below, and there's more space above, open upwards
      if (spaceBelow < dropdownHeight && rect.top > dropdownHeight) {
        topPos = rect.top - dropdownHeight - 6;
      }
      
      setDropdownPos({
        top: topPos,
        left: rect.left,
      });
    }
    setOpen(next);
    onOpenChange?.(next);
  }, [onOpenChange]);

  useEffect(() => {
    if (!open) return;
    const onMouse = (e: MouseEvent) => {
      const target = e.target as Node;
      // Close if click is outside both trigger and dropdown
      if (!triggerRef.current?.contains(target) && !dropdownRef.current?.contains(target)) {
        handleOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleOpen(false);
    };
    // Reposition if the page scrolls while open
    const onScroll = () => handleOpen(false);
    document.addEventListener('mousedown', onMouse);
    document.addEventListener('keydown', onKey);
    window.addEventListener('scroll', onScroll, true);
    return () => {
      document.removeEventListener('mousedown', onMouse);
      document.removeEventListener('keydown', onKey);
      window.removeEventListener('scroll', onScroll, true);
    };
  }, [open, handleOpen]);

  const { label, className: badgeClass } = STATUS_CONFIG[current];

  return (
    <>
      {/* Badge trigger */}
      <button
        ref={triggerRef}
        onClick={() => handleOpen(!open)}
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

      {/* Dropdown rendered via Portal into document.body — escapes ALL stacking contexts */}
      {open && typeof document !== 'undefined' && createPortal(
        <div
          ref={dropdownRef}
          style={{ top: dropdownPos.top, left: dropdownPos.left }}
          className="fixed z-[9999] w-52 rounded-xl border border-slate-100 bg-white py-1.5 shadow-xl shadow-slate-200/60 animate-scale-in"
        >
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
                  handleOpen(false);
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
        </div>,
        document.body
      )}
    </>
  );
}
