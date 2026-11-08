'use client';

import { cn } from '@/lib/utils.js';

const variantStyles = {
  // Brand: gold is ornament, accent is "needs attention". Status colours below
  // carry meaning (success / warning / danger) and stay distinct from the brand.
  gold: 'bg-gold-soft text-ink border border-gold/40',
  terracotta: 'bg-accent-wash text-accent-ink border border-accent/25',
  success: 'bg-emerald-50 text-emerald-700 border border-emerald-200/80',
  warning: 'bg-amber-50 text-amber-700 border border-amber-200/80',
  danger: 'bg-rose-50 text-rose-700 border border-rose-200/80',
  neutral: 'bg-ground-sunk text-ink-secondary border border-edge-subtle',
  outline: 'bg-ground-raised text-ink-secondary border border-edge-subtle',
  luxury: 'bg-accent text-ink-onAccent border border-accent',
};

const sizeStyles = {
  sm: 'px-2 py-0.5 text-[11px]',
  md: 'px-2.5 py-1 text-xs',
  lg: 'px-3 py-1.5 text-sm',
};

export function Badge({
  children,
  className,
  variant = 'neutral',
  size = 'md',
  dot = false,
  dotColor,
  ...props
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 font-sans font-medium rounded-full transition-colors select-none whitespace-nowrap',
        variantStyles[variant] || variantStyles.neutral,
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
