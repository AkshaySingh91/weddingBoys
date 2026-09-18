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
          className="block text-[11px] font-semibold tracking-wider uppercase text-stone-600 font-sans"
        >
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      <div className="relative flex items-center">
        {Icon && (
          <span className="absolute left-3.5 flex items-center justify-center text-stone-400 pointer-events-none">
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
            'w-full rounded-xl border bg-white py-2.5 text-xs text-[#2F2F2F] placeholder:text-stone-400 font-sans transition-all duration-150',
            'border-stone-200 hover:border-stone-400 focus:outline-none focus:border-red-400 focus:ring-2 focus:ring-red-400/20',
            'disabled:bg-stone-50 disabled:text-stone-400 disabled:cursor-not-allowed',
            Icon ? 'pl-10' : 'pl-3.5',
            IconRight ? 'pr-10' : 'pr-3.5',
            error && 'border-rose-400 focus:border-rose-500 focus:ring-rose-500/15',
            className
          )}
          {...props}
        />

        {IconRight && (
          <span className="absolute right-3.5 flex items-center justify-center text-stone-400">
            {isValidElement(IconRight) ? IconRight : <IconRight size={16} />}
          </span>
        )}
      </div>

      {error ? (
        <p className="text-[11px] font-medium text-rose-600 font-sans">{error}</p>
      ) : helperText ? (
        <p className="text-[11px] text-stone-500 font-sans">{helperText}</p>
      ) : null}
    </div>
  );
});

export default Input;
