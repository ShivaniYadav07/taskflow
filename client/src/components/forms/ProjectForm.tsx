'use client';

import { useState } from 'react';
import { X, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { projectService } from '@/services/project.service';
import { useProjectContext } from '@/providers/project-provider';

export function ProjectForm({ onClose }: { onClose: () => void }) {
  const { refetchProjects, setActiveProject } = useProjectContext();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({ name: '', key: '', description: '' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.key) {
      toast.error('Name and Key are required');
      return;
    }
    
    setIsLoading(true);
    try {
      const res = await projectService.create(formData);
      toast.success('Project created successfully!');
      await refetchProjects(); // Reload the list
      setActiveProject(res.data.data); // Switch to the new project
      onClose();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to create project');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl animate-in zoom-in-95 fade-in">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-semibold text-slate-800">Create New Project</h2>
          <button onClick={onClose} className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Project Name</label>
            <input
              autoFocus
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none transition-colors focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              placeholder="e.g. Frontend Redesign"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Project Key</label>
            <input
              type="text"
              value={formData.key}
              onChange={(e) => setFormData({ ...formData, key: e.target.value.toUpperCase() })}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none transition-colors focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 uppercase"
              placeholder="e.g. FRONT"
              maxLength={10}
            />
            <p className="mt-1 text-xs text-slate-500">A short identifier used to prefix tasks.</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Description (Optional)</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none transition-colors focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 resize-none h-24"
              placeholder="What is this project about?"
            />
          </div>

          <div className="pt-2 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition-colors disabled:opacity-70"
            >
              {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
              Create Project
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
