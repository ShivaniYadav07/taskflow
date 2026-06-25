'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Plus, Check, Briefcase } from 'lucide-react';
import { useProjectContext } from '@/providers/project-provider';
import { cn } from '@/lib/utils';
import { ProjectForm } from '../forms/ProjectForm';

export function ProjectSelector() {
  const { projects, activeProject, setActiveProject } = useProjectContext();
  const [open, setOpen] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onMouse = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onMouse);
    return () => document.removeEventListener('mousedown', onMouse);
  }, [open]);

  return (
    <div ref={ref} className="relative ml-6 border-l border-slate-200 pl-6">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 hover:text-slate-900"
      >
        <Briefcase className="h-4 w-4 text-indigo-500" />
        <span className="max-w-[120px] truncate">{activeProject ? activeProject.name : 'Select Project'}</span>
        <ChevronDown className={cn('h-4 w-4 text-slate-400 transition-transform', open && 'rotate-180')} />
      </button>

      {open && (
        <div className="absolute left-6 top-full mt-2 w-64 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg animate-in fade-in zoom-in-95">
          <div className="max-h-60 overflow-y-auto p-1">
            {projects.length === 0 ? (
              <div className="px-3 py-2 text-sm text-slate-500">No projects yet</div>
            ) : (
              projects.map((p) => (
                <button
                  key={p._id}
                  onClick={() => {
                    setActiveProject(p);
                    setOpen(false);
                  }}
                  className="flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm transition-colors hover:bg-slate-100"
                >
                  <span className="font-medium text-slate-700 truncate">{p.name}</span>
                  {activeProject?._id === p._id && <Check className="h-4 w-4 text-indigo-600" />}
                </button>
              ))
            )}
          </div>
          
          <div className="border-t border-slate-100 p-1">
            <button
              onClick={() => {
                setOpen(false);
                setShowForm(true);
              }}
              className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-indigo-600 transition-colors hover:bg-indigo-50"
            >
              <Plus className="h-4 w-4" />
              Create Project
            </button>
          </div>
        </div>
      )}

      {showForm && (
        <ProjectForm onClose={() => setShowForm(false)} />
      )}
    </div>
  );
}
