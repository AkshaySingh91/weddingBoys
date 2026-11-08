'use client';

import { forwardRef, isValidElement } from 'react';
import { cn } from '@/lib/utils.js';

export const Input = forwardRef(function Input(
  {
    className,
    type = 'text',
    error,
    helperText,
    label,
    icon: Icon,
    iconRight: IconRight,
    id,
    disabled = false,
    required = false,
    ...props
  },
  ref
) {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className="w-full space-y-1.5 font-sans">
      {label && (
        <label
          htmlFor={inputId}
          className="block text-[11px] font-semibold tracking-wider uppercase text-ink-secondary font-sans"
        >
          {label}
          {required && <span className="text-accent-ink ml-1">*</span>}
        </label>
      )}

      <div className="relative flex items-center">
        {Icon && (
          <span className="absolute left-3.5 flex items-center justify-center text-ink-muted pointer-events-none">
            {isValidElement(Icon) ? Icon : <Icon size={16} />}
          </span>
        )}

        <input
          ref={ref}
          id={inputId}
          type={type}
          disabled={disabled}
          required={required}
          className={cn(
            'w-full rounded-xl border bg-white py-2.5 text-xs text-ink placeholder:text-ink-muted font-sans transition-all duration-150',
            'border-edge-subtle hover:border-edge-strong focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20',
            'disabled:bg-ground disabled:text-ink-muted disabled:cursor-not-allowed',
            Icon ? 'pl-10' : 'pl-3.5',
            IconRight ? 'pr-10' : 'pr-3.5',
            error && 'border-state-error focus:border-state-error focus:ring-accent/20',
            className
          )}
          {...props}
        />

        {IconRight && (
          <span className="absolute right-3.5 flex items-center justify-center text-ink-muted">
            {isValidElement(IconRight) ? IconRight : <IconRight size={16} />}
          </span>
        )}
      </div>

      {error ? (
        <p className="text-[11px] font-medium text-state-error font-sans">{error}</p>
      ) : helperText ? (
        <p className="text-[11px] text-ink-muted font-sans">{helperText}</p>
      ) : null}
    </div>
  );
});

export default Input;
