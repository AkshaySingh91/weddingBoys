'use client';

import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils.js';

export const Dialog = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;
export const DialogPortal = DialogPrimitive.Portal;
export const DialogClose = DialogPrimitive.Close;

export function DialogOverlay({ className, ...props }) {
  return (
    <DialogPrimitive.Overlay
      className={cn(
        'fixed inset-0 z-50 bg-ink/50 transition-opacity duration-200 animate-in fade-in',
        className
      )}
      {...props}
    />
  );
}

export function DialogContent({ className, children, hideCloseButton = false, ...props }) {
  return (
    <DialogPortal>
      <DialogOverlay />
      <DialogPrimitive.Content
        className={cn(
          'fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4',
          'bg-ground-raised p-6 shadow-overlay duration-200 sm:rounded-xl',
          'border border-edge-subtle animate-in fade-in zoom-in-95',
          'max-h-[90vh] overflow-y-auto scrollbar-thin scrollbar-thumb-stone-200',
          className
        )}
        {...props}
      >
        {children}
        {!hideCloseButton && (
          <DialogPrimitive.Close className="absolute right-4 top-4 rounded-xl p-1.5 text-ink-muted hover:text-accent-ink hover:bg-accent-wash transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent z-30">
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </DialogPrimitive.Close>
        )}
      </DialogPrimitive.Content>
    </DialogPortal>
  );
}

export function DialogHeader({ className, ...props }) {
  return (
    <div
      className={cn('flex flex-col space-y-1.5 text-left border-b border-edge-subtle pb-4', className)}
      {...props}
    />
  );
}

export function DialogTitle({ className, ...props }) {
  return (
    <DialogPrimitive.Title
      className={cn('text-xl font-semibold tracking-tight text-ink', className)}
      {...props}
    />
  );
}

export function DialogDescription({ className, ...props }) {
  return (
    <DialogPrimitive.Description
      className={cn('text-xs text-ink-muted leading-relaxed font-sans', className)}
      {...props}
    />
  );
}

export function DialogFooter({ className, ...props }) {
  return (
    <div
      className={cn('flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 pt-4 border-t border-edge-subtle', className)}
      {...props}
    />
  );
}
