import { forwardRef, type InputHTMLAttributes, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  suffix?: ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, id, suffix, ...props }, ref) => (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={id} className="text-sm font-medium text-slate-700">
          {label}
        </label>
      )}
      <div className="relative">
        <input
          ref={ref}
          id={id}
          className={cn(
            'h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900',
            'placeholder:text-slate-400 outline-none',
            'focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100',
            'disabled:bg-slate-50 disabled:cursor-not-allowed',
            'transition-colors duration-150',
            suffix && 'pr-10',
            error && 'border-red-400 focus:border-red-400 focus:ring-red-100',
            className
          )}
          {...props}
        />
        {suffix && (
          <div className="absolute right-0 top-0 flex h-full items-center pr-3">
            {suffix}
          </div>
        )}
      </div>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
);

Input.displayName = 'Input';
