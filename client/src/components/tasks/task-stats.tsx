import { CheckCircle2, Circle, Clock, LayoutList } from 'lucide-react';
import type { Task } from '@/types';
import { cn } from '@/lib/utils';

interface TaskStatsProps {
  tasks: Task[];
}

export function TaskStats({ tasks }: TaskStatsProps) {
  const total = tasks.length;
  const todo = tasks.filter((t) => t.status === 'todo').length;
  const inProgress = tasks.filter((t) => t.status === 'in-progress').length;
  const done = tasks.filter((t) => t.status === 'done').length;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;

  const stats = [
    {
      label: 'Total',
      value: total,
      sub: `${pct}% complete`,
      Icon: LayoutList,
      iconBg: 'bg-slate-100',
      iconColor: 'text-slate-500',
      valueColor: 'text-slate-900',
      subColor: 'text-slate-400',
      bar: null,
    },
    {
      label: 'Todo',
      value: todo,
      sub: total > 0 ? `${Math.round((todo / total) * 100)}% of all` : 'no tasks',
      Icon: Circle,
      iconBg: 'bg-slate-100',
      iconColor: 'text-slate-400',
      valueColor: 'text-slate-900',
      subColor: 'text-slate-400',
      bar: { pct: total > 0 ? (todo / total) * 100 : 0, color: 'bg-slate-300' },
    },
    {
      label: 'In Progress',
      value: inProgress,
      sub: total > 0 ? `${Math.round((inProgress / total) * 100)}% of all` : 'no tasks',
      Icon: Clock,
      iconBg: 'bg-amber-50',
      iconColor: 'text-amber-500',
      valueColor: 'text-amber-700',
      subColor: 'text-amber-400',
      bar: { pct: total > 0 ? (inProgress / total) * 100 : 0, color: 'bg-amber-400' },
    },
    {
      label: 'Completed',
      value: done,
      sub: `${pct}% of all`,
      Icon: CheckCircle2,
      iconBg: 'bg-green-50',
      iconColor: 'text-green-500',
      valueColor: 'text-green-700',
      subColor: 'text-green-500',
      bar: { pct, color: 'bg-green-400' },
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {stats.map(({ label, value, sub, Icon, iconBg, iconColor, valueColor, subColor, bar }) => (
        <div
          key={label}
          className="group rounded-xl border border-slate-100 bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
        >
          <div className="mb-3 flex items-center justify-between">
            <div className={cn('inline-flex rounded-lg p-2', iconBg)}>
              <Icon className={cn('h-4 w-4', iconColor)} />
            </div>
          </div>

          <p className={cn('text-2xl font-bold tabular-nums', valueColor)}>{value}</p>
          <p className="mt-0.5 text-xs font-medium text-slate-600">{label}</p>
          <p className={cn('mt-0.5 text-xs', subColor)}>{sub}</p>

          {bar && (
            <div className="mt-3 h-1 w-full rounded-full bg-slate-100">
              <div
                className={cn('h-1 rounded-full transition-all duration-500', bar.color)}
                style={{ width: `${Math.min(bar.pct, 100)}%` }}
              />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
