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
            className="block text-[11px] font-semibold tracking-wider uppercase text-stone-600 font-sans"
          >
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}

        {maxLength && (
          <span className="text-[10px] text-stone-400 font-mono">
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
          'w-full rounded-xl border bg-white p-3 text-xs text-[#2F2F2F] placeholder:text-stone-400 font-sans transition-all duration-150 leading-relaxed resize-y',
          'border-stone-200 hover:border-stone-400 focus:outline-none focus:border-red-400 focus:ring-2 focus:ring-red-400/20',
          'disabled:bg-stone-50 disabled:text-stone-400 disabled:cursor-not-allowed',
          error && 'border-rose-400 focus:border-rose-500 focus:ring-rose-500/15',
          className
        )}
        {...props}
      />

      {error ? (
        <p className="text-[11px] font-medium text-rose-600 font-sans">{error}</p>
      ) : helperText ? (
        <p className="text-[11px] text-stone-500 font-sans">{helperText}</p>
      ) : null}
    </div>
  );
});

export default Textarea;
