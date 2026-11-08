'use client';

import * as TooltipPrimitive from '@radix-ui/react-tooltip';
import { cn } from '@/lib/utils.js';

export const TooltipProvider = TooltipPrimitive.Provider;
export const Tooltip = TooltipPrimitive.Root;
export const TooltipTrigger = TooltipPrimitive.Trigger;

export function TooltipContent({ className, side = 'right', sideOffset = 8, children, ...props }) {
  return (
    <TooltipPrimitive.Portal>
      <TooltipPrimitive.Content
        side={side}
        sideOffset={sideOffset}
        className={cn(
          'z-50 overflow-hidden rounded-lg bg-ink px-3 py-1.5 text-xs font-medium text-amber-100 shadow-md animate-in fade-in-50 zoom-in-95 border border-ink select-none font-sans',
          className
        )}
        {...props}
      >
        {children}
        <TooltipPrimitive.Arrow className="fill-ink" />
      </TooltipPrimitive.Content>
    </TooltipPrimitive.Portal>
  );
}

export function QuickTooltip({ children, content, side = 'right', enabled = true }) {
  if (!enabled) return children;

  return (
    <Tooltip>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent side={side}>{content}</TooltipContent>
    </Tooltip>
  );
}
