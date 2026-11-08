'use client';

import { forwardRef } from 'react';
import { cn } from '@/lib/utils.js';

export const Switch = forwardRef(function Switch(
  {
    checked = false,
    onChange,
    disabled = false,
    label,
    description,
    id,
    className,
    ...props
  },
  ref
) {
  const switchId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className={cn('flex items-start justify-between gap-3 font-sans', className)}>
      {(label || description) && (
        <div className="space-y-0.5">
          {label && (
            <label
              htmlFor={switchId}
              className={cn(
                'block text-xs font-semibold text-ink cursor-pointer select-none',
                disabled && 'opacity-50 cursor-not-allowed'
              )}
            >
              {label}
            </label>
          )}
          {description && (
            <p className="text-[11px] text-ink-muted leading-relaxed max-w-sm">
              {description}
            </p>
          )}
        </div>
      )}

      <button
        ref={ref}
        id={switchId}
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange?.(!checked)}
        className={cn(
          'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2',
          checked ? 'bg-accent' : 'bg-ink-muted/40',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
        {...props}
      >
        <span
          className={cn(
            'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out',
            checked ? 'translate-x-5' : 'translate-x-0'
          )}
        />
      </button>
    </div>
  );
});

export default Switch;
