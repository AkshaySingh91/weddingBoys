'use client';

import { forwardRef, isValidElement } from 'react';
import { CircleNotch } from '@phosphor-icons/react';
import { cn } from '@/lib/utils.js';

const variantStyles = {
  primary:
    'bg-stone-900 text-white hover:bg-stone-800 shadow-sm active:scale-[0.99]',
  dark:
    'bg-stone-900 text-white hover:bg-stone-800 shadow-sm active:scale-[0.99]',
  terracotta:
    'bg-[#A3603A] text-white hover:bg-[#8C532B] shadow-sm active:scale-[0.99]',
  gold:
    'bg-[#B48448] text-white hover:bg-[#9F7236] shadow-sm active:scale-[0.99]',
  goldSoft:
    'bg-amber-50 text-amber-900 hover:bg-amber-100 border border-amber-200/80 shadow-2xs active:scale-[0.99]',
  secondary:
    'bg-white text-stone-800 hover:bg-stone-50 border border-stone-200 shadow-sm active:scale-[0.99]',
  outline:
    'border border-stone-300 bg-white text-stone-800 hover:bg-stone-50 active:scale-[0.99]',
  ghost:
    'text-stone-700 hover:text-stone-900 hover:bg-stone-100 active:scale-[0.99]',
  danger:
    'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 active:scale-[0.99]',
  dangerSolid:
    'bg-rose-600 text-white hover:bg-rose-700 shadow-sm active:scale-[0.99]',
};

const sizeStyles = {
  sm: 'h-8 px-3 text-xs rounded-lg gap-1.5',
  md: 'h-9 px-4 text-xs font-medium rounded-xl gap-2',
  lg: 'h-11 px-5 text-sm font-medium rounded-xl gap-2.5',
  icon: 'h-9 w-9 p-0 rounded-xl justify-center items-center',
  iconSm: 'h-7 w-7 p-0 rounded-lg justify-center items-center',
};

export const Button = forwardRef(function Button(
  {
    children,
    className,
    variant = 'primary',
    size = 'md',
    loading = false,
    disabled = false,
    icon: Icon,
    iconRight: IconRight,
    type = 'button',
    ...props
  },
  ref
) {
  const isButtonDisabled = disabled || loading;

  return (
    <button
      ref={ref}
      type={type}
      disabled={isButtonDisabled}
      className={cn(
        'inline-flex items-center justify-center font-sans font-medium transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-red-400/20 disabled:opacity-50 disabled:pointer-events-none cursor-pointer select-none whitespace-nowrap',
        variantStyles[variant] || variantStyles.primary,
        sizeStyles[size] || sizeStyles.md,
        className
      )}
      {...props}
    >
      {loading ? (
        <CircleNotch size={14} className="animate-spin shrink-0" />
      ) : isValidElement(Icon) ? (
        Icon
      ) : Icon ? (
        <Icon size={15} className="shrink-0" />
      ) : null}

      {children && <span>{children}</span>}

      {!loading && (
        isValidElement(IconRight) ? (
          IconRight
        ) : IconRight ? (
          <IconRight size={15} className="shrink-0" />
        ) : null
      )}
    </button>
  );
});

export default Button;
