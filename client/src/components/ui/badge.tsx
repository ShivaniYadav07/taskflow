import { cn, STATUS_CONFIG, PRIORITY_CONFIG } from '@/lib/utils';
import type { TaskStatus, TaskPriority } from '@/types';

interface StatusBadgeProps {
  status: TaskStatus;
  className?: string;
}

interface PriorityBadgeProps {
  priority: TaskPriority;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const { label, className: colorClass } = STATUS_CONFIG[status];
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        colorClass,
        className
      )}
    >
      {label}
    </span>
  );
}

export function PriorityBadge({ priority, className }: PriorityBadgeProps) {
  const { label, textClass, dotClass } = PRIORITY_CONFIG[priority];
  return (
    <span className={cn('inline-flex items-center gap-1.5 text-xs font-medium', textClass, className)}>
      <span className={cn('h-1.5 w-1.5 rounded-full', dotClass)} />
      {label}
    </span>
  );
}
