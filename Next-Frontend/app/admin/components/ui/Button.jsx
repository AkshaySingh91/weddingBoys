'use client';

import { forwardRef, isValidElement } from 'react';
import { CircleNotch } from '@phosphor-icons/react';
import { cn } from '@/lib/utils.js';

/*
  Four styles, one meaning each — the same contract as the public site's Button.
    primary   the screen's single main action (brand red)
    secondary everything else that is a button (white, hairline border)
    ghost     low-emphasis actions inside toolbars and rows
    danger    destructive actions; dangerSolid only inside a confirm dialog
  Older names are kept as aliases so existing call sites keep working; new code
  should use the four names above.
*/
const STYLES = {
  primary: 'bg-accent text-ink-onAccent hover:bg-accent-hover active:bg-accent-press',
  secondary: 'bg-ground-raised text-ink border border-edge-strong hover:bg-ground hover:border-ink-muted',
  ghost: 'text-ink-secondary hover:text-ink hover:bg-ground-sunk',
  danger: 'bg-ground-raised text-state-error border border-edge-strong hover:bg-accent-wash',
  dangerSolid: 'bg-state-error text-white hover:opacity-90',
};

const variantStyles = {
  ...STYLES,
  // Aliases for the variants this kit used to have.
  dark: STYLES.primary,
  terracotta: STYLES.primary,
  gold: STYLES.primary,
  luxury: STYLES.primary,
  goldSoft: STYLES.secondary,
  outline: STYLES.secondary,
};

const sizeStyles = {
  sm: 'h-8 px-3 text-xs gap-1.5',
  md: 'h-9 px-4 text-[13px] gap-2',
  lg: 'h-11 px-5 text-sm gap-2.5',
  icon: 'h-9 w-9 p-0 justify-center items-center',
  iconSm: 'h-7 w-7 p-0 justify-center items-center',
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
        'inline-flex items-center justify-center rounded-lg font-sans font-medium transition-colors duration-micro ease-standard focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-ground disabled:opacity-50 disabled:pointer-events-none cursor-pointer select-none whitespace-nowrap',
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
