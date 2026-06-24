'use client';

import { useEffect } from 'react';
import { AlertTriangle, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface ConfirmDialogProps {
  isOpen: boolean;
  title?: string;
  description: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function ConfirmDialog({
  isOpen,
  title = 'Are you sure?',
  description,
  confirmLabel = 'Delete',
  onConfirm,
  onCancel,
  isLoading,
}: ConfirmDialogProps) {
  useEffect(() => {
    if (!isOpen) return;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onCancel(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/45 backdrop-blur-sm"
        onClick={onCancel}
      />

      {/* Dialog */}
      <div className="relative w-full max-w-sm rounded-2xl bg-white shadow-2xl shadow-black/20 animate-scale-in">
        {/* Top accent */}
        <div className="h-1 w-full rounded-t-2xl bg-gradient-to-r from-red-400 to-red-600" />

        <div className="p-6">
          {/* Icon */}
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 ring-4 ring-red-50">
            <AlertTriangle className="h-6 w-6 text-red-500" strokeWidth={2} />
          </div>

          {/* Copy */}
          <h3 className="text-base font-semibold text-slate-900">{title}</h3>
          <p className="mt-2 text-sm leading-relaxed text-slate-500">{description}</p>

          {/* Actions */}
          <div className="mt-6 flex gap-2.5">
            <Button
              variant="secondary"
              onClick={onCancel}
              disabled={isLoading}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={onConfirm}
              isLoading={isLoading}
              className={cn(
                'flex-1 bg-red-600 hover:bg-red-700',
                'focus-visible:ring-red-500 shadow-sm shadow-red-200'
              )}
            >
              {!isLoading && <Trash2 className="h-3.5 w-3.5" />}
              {confirmLabel}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
