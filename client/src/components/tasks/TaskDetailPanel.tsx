'use client';

import { useState, useRef, useEffect } from 'react';
import { X, MessageSquare, Trash2, Send, Loader2, User2, Tag, ArrowRight } from 'lucide-react';
import type { Task, User } from '@/types';
import { useComments, useAddComment, useDeleteComment } from '@/hooks/use-comments';
import { useAuthContext } from '@/providers/auth-provider';
import { cn } from '@/lib/utils';

const STATUS_LABEL: Record<string, { label: string; className: string }> = {
  'todo': { label: 'To Do', className: 'bg-slate-100 text-slate-600' },
  'in-progress': { label: 'In Progress', className: 'bg-amber-100 text-amber-700' },
  'done': { label: 'Done', className: 'bg-green-100 text-green-700' },
};

const PRIORITY_LABEL: Record<string, { label: string; className: string }> = {
  'high': { label: 'High', className: 'bg-red-100 text-red-700' },
  'medium': { label: 'Medium', className: 'bg-amber-100 text-amber-700' },
  'low': { label: 'Low', className: 'bg-sky-100 text-sky-700' },
};

function getInitials(name: string) {
  return name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

interface TaskDetailPanelProps {
  task: Task | null;
  onClose: () => void;
}

export function TaskDetailPanel({ task, onClose }: TaskDetailPanelProps) {
  const { user } = useAuthContext();
  const [comment, setComment] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const { data: comments = [], isLoading: commentsLoading } = useComments(task?._id ?? null);
  const { mutateAsync: addComment, isPending: submitting } = useAddComment(task?._id ?? '');
  const { mutate: deleteComment } = useDeleteComment(task?._id ?? '');

  useEffect(() => {
    setComment('');
  }, [task?._id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim() || !task) return;
    await addComment(comment.trim());
    setComment('');
    textareaRef.current?.focus();
  };

  if (!task) return null;

  const assignee = task.assignedTo as User | undefined;
  const createdBy = task.createdBy as User | undefined;
  const statusCfg = STATUS_LABEL[task.status];
  const priorityCfg = PRIORITY_LABEL[task.priority];

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-slate-900/30 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Slide-over panel */}
      <div className="fixed inset-y-0 right-0 z-50 flex w-full max-w-lg flex-col bg-white shadow-2xl animate-in slide-in-from-right">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-6 py-4">
          <div className="min-w-0">
            <h2 className="text-base font-semibold text-slate-800 leading-snug">{task.title}</h2>
          </div>
          <button
            onClick={onClose}
            className="shrink-0 rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex flex-1 flex-col gap-6 overflow-y-auto px-6 py-5">
          {/* Meta badges */}
          <div className="flex flex-wrap gap-2">
            <span className={cn('rounded-lg px-2.5 py-1 text-xs font-medium', statusCfg.className)}>
              {statusCfg.label}
            </span>
            <span className={cn('rounded-lg px-2.5 py-1 text-xs font-medium', priorityCfg.className)}>
              {priorityCfg.label} Priority
            </span>
          </div>

          {/* Description */}
          {task.description ? (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Description</p>
              <p className="text-sm text-slate-600 whitespace-pre-wrap leading-relaxed">{task.description}</p>
            </div>
          ) : (
            <p className="text-sm text-slate-400 italic">No description provided.</p>
          )}

          {/* Assignee / Creator */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Assignee</p>
              {assignee ? (
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-indigo-400 to-violet-500 text-[10px] font-bold text-white">
                    {getInitials(assignee.name)}
                  </div>
                  <span className="text-sm text-slate-700">{assignee.name}</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 text-slate-400">
                  <User2 className="h-4 w-4" />
                  <span className="text-sm">Unassigned</span>
                </div>
              )}
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Created by</p>
              {createdBy && (
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-200 text-[10px] font-bold text-slate-600">
                    {getInitials(createdBy.name)}
                  </div>
                  <span className="text-sm text-slate-700">{createdBy.name}</span>
                </div>
              )}
            </div>
          </div>

          {/* Comments section */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <MessageSquare className="h-4 w-4 text-slate-500" />
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Comments ({comments.length})
              </p>
            </div>

            {commentsLoading ? (
              <div className="flex justify-center py-4">
                <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
              </div>
            ) : comments.length === 0 ? (
              <p className="py-3 text-center text-sm text-slate-400">No comments yet. Be the first!</p>
            ) : (
              <div className="flex flex-col gap-4">
                {comments.map((c) => {
                  const isOwn = c.authorId._id === user?._id || c.authorId._id === user?.id;
                  return (
                    <div key={c._id} className="flex gap-3">
                      <div className="shrink-0 flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-indigo-400 to-violet-500 text-[10px] font-bold text-white">
                        {getInitials(c.authorId.name)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-semibold text-slate-700">{c.authorId.name}</span>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-xs text-slate-400">{timeAgo(c.createdAt)}</span>
                            {isOwn && (
                              <button
                                onClick={() => deleteComment(c._id)}
                                className="text-slate-300 hover:text-red-500 transition-colors"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                        <p className="mt-0.5 text-sm text-slate-600 whitespace-pre-wrap">{c.body}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Comment input — sticky at bottom */}
        <div className="border-t border-slate-100 px-6 py-4">
          <form onSubmit={handleSubmit} className="flex gap-2.5">
            <textarea
              ref={textareaRef}
              rows={1}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
              placeholder="Add a comment… (Enter to send)"
              className="flex-1 resize-none rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none transition-colors focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400"
            />
            <button
              type="submit"
              disabled={submitting || !comment.trim()}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white transition-colors hover:bg-indigo-700 disabled:opacity-50"
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
