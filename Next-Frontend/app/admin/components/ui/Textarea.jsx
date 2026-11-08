'use client';

import { forwardRef } from 'react';
import { cn } from '@/lib/utils.js';

export const Textarea = forwardRef(function Textarea(
  {
    className,
    error,
    helperText,
    label,
    id,
    disabled = false,
    required = false,
    rows = 4,
    maxLength,
    value,
    ...props
  },
  ref
) {
  const textareaId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);
  const currentLength = typeof value === 'string' ? value.length : 0;

  return (
    <div className="w-full space-y-1.5 font-sans">
      <div className="flex items-center justify-between">
        {label && (
          <label
            htmlFor={textareaId}
            className="block text-[11px] font-semibold tracking-wider uppercase text-ink-secondary font-sans"
          >
            {label}
            {required && <span className="text-accent-ink ml-1">*</span>}
          </label>
        )}

        {maxLength && (
          <span className="text-[10px] text-ink-muted font-mono">
            {currentLength}/{maxLength}
          </span>
        )}
      </div>

      <textarea
        ref={ref}
        id={textareaId}
        rows={rows}
        maxLength={maxLength}
        value={value}
        disabled={disabled}
        required={required}
        className={cn(
          'w-full rounded-xl border bg-white p-3 text-xs text-ink placeholder:text-ink-muted font-sans transition-all duration-150 leading-relaxed resize-y',
          'border-edge-subtle hover:border-edge-strong focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20',
          'disabled:bg-ground disabled:text-ink-muted disabled:cursor-not-allowed',
          error && 'border-state-error focus:border-state-error focus:ring-accent/20',
          className
        )}
        {...props}
      />

      {error ? (
        <p className="text-[11px] font-medium text-state-error font-sans">{error}</p>
      ) : helperText ? (
        <p className="text-[11px] text-ink-muted font-sans">{helperText}</p>
      ) : null}
    </div>
  );
});

export default Textarea;
