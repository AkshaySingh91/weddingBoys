'use client';

import { cn } from '@/lib/utils.js';

const variantStyles = {
  gold: 'bg-orange-50 text-orange-600 border border-orange-200/50 shadow-sm',
  terracotta: 'bg-red-50 text-red-600 border border-red-200/50',
  success: 'bg-emerald-50 text-emerald-700 border border-emerald-200/80',
  warning: 'bg-amber-50 text-amber-700 border border-amber-200/80',
  danger: 'bg-rose-50 text-rose-700 border border-rose-200/80',
  neutral: 'bg-stone-100 text-stone-700 border border-stone-200/80',
  outline: 'bg-white/70 text-stone-700 border border-stone-200 backdrop-blur-sm',
  luxury: 'bg-gradient-to-r from-red-500 to-rose-500 text-white shadow-sm shadow-red-900/10 border-none',
};

const sizeStyles = {
  sm: 'px-2 py-0.5 text-[11px]',
  md: 'px-2.5 py-1 text-xs',
  lg: 'px-3 py-1.5 text-sm',
};

export function Badge({
  children,
  className,
  variant = 'terracotta',
  size = 'md',
  dot = false,
  dotColor,
  ...props
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 font-sans font-medium rounded-full transition-colors select-none whitespace-nowrap',
        variantStyles[variant] || variantStyles.terracotta,
        sizeStyles[size] || sizeStyles.md,
        className
      )}
      {...props}
    >
      {dot && (
        <span
          className={cn(
            'w-1.5 h-1.5 rounded-full',
            dotColor || 'bg-current opacity-80'
          )}
        />
      )}
      {children}
    </span>
  );
}

export default Badge;
