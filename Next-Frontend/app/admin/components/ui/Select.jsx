'use client';

import { forwardRef } from 'react';
import { CaretDown } from '@phosphor-icons/react';
import { cn } from '@/lib/utils.js';

export const Select = forwardRef(function Select(
  {
    className,
    error,
    helperText,
    label,
    id,
    disabled = false,
    required = false,
    options = [],
    children,
    ...props
  },
  ref
) {
  const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className="w-full space-y-1.5 font-sans">
      {label && (
        <label
          htmlFor={selectId}
          className="block text-[11px] font-semibold tracking-wider uppercase text-ink-secondary font-sans"
        >
          {label}
          {required && <span className="text-accent-ink ml-1">*</span>}
        </label>
      )}

      <div className="relative flex items-center">
        <select
          ref={ref}
          id={selectId}
          disabled={disabled}
          required={required}
          className={cn(
            'w-full appearance-none rounded-xl border bg-white py-2.5 pl-3.5 pr-9 text-xs text-ink font-sans transition-all duration-150 cursor-pointer',
            'border-edge-subtle hover:border-edge-strong focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20',
            'disabled:bg-ground-sunk/80 disabled:text-ink-muted disabled:cursor-not-allowed',
            error && 'border-state-error focus:border-state-error focus:ring-accent/20',
            className
          )}
          {...props}
        >
          {options.length > 0
            ? options.map((opt) => (
                <option key={opt.value ?? opt} value={opt.value ?? opt}>
                  {opt.label ?? opt}
                </option>
              ))
            : children}
        </select>

        <span className="absolute right-3 pointer-events-none text-ink-muted">
          <CaretDown size={14} weight="bold" />
        </span>
      </div>

      {error ? (
        <p className="text-[11px] font-medium text-state-error font-sans">{error}</p>
      ) : helperText ? (
        <p className="text-[11px] text-ink-muted font-sans">{helperText}</p>
      ) : null}
    </div>
  );
});

export default Select;
