'use client';

import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X } from '@phosphor-icons/react';
import { cn } from '@/lib/utils.js';

export const Drawer = DialogPrimitive.Root;
export const DrawerTrigger = DialogPrimitive.Trigger;
export const DrawerPortal = DialogPrimitive.Portal;
export const DrawerClose = DialogPrimitive.Close;

export function DrawerOverlay({ className, ...props }) {
  return (
    <DialogPrimitive.Overlay
      className={cn(
        'fixed inset-0 z-50 bg-stone-950/40 backdrop-blur-sm transition-opacity duration-300 animate-in fade-in',
        className
      )}
      {...props}
    />
  );
}

export function DrawerContent({ className, children, side = 'right', ...props }) {
  const sideClasses = {
    right: 'inset-y-0 right-0 w-full max-w-lg animate-in slide-in-from-right duration-300 border-l',
    left: 'inset-y-0 left-0 w-full max-w-lg animate-in slide-in-from-left duration-300 border-r',
    bottom: 'inset-x-0 bottom-0 max-h-[85vh] animate-in slide-in-from-bottom duration-300 border-t rounded-t-3xl',
  };

  return (
    <DrawerPortal>
      <DrawerOverlay />
      <DialogPrimitive.Content
        className={cn(
          'fixed z-50 flex flex-col bg-[#FFFFFF] shadow-2xl border-[#E5DCD3] focus:outline-none',
          'overflow-y-auto scrollbar-thin scrollbar-thumb-stone-200',
          sideClasses[side] || sideClasses.right,
          className
        )}
        {...props}
      >
        {children}
        <DialogPrimitive.Close className="absolute right-4 top-4 rounded-xl p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors focus:outline-none cursor-pointer">
          <X size={18} />
          <span className="sr-only">Close</span>
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </DrawerPortal>
  );
}

export function DrawerHeader({ className, ...props }) {
  return (
    <div
      className={cn('flex flex-col space-y-1.5 text-left border-b border-[#E5DCD3] p-6 pb-4', className)}
      {...props}
    />
  );
}

export function DrawerTitle({ className, ...props }) {
  return (
    <DialogPrimitive.Title
      className={cn('text-xl font-serif text-[#1C1917] tracking-tight', className)}
      {...props}
    />
  );
}

export function DrawerDescription({ className, ...props }) {
  return (
    <DialogPrimitive.Description
      className={cn('text-xs text-stone-500 font-sans leading-relaxed', className)}
      {...props}
    />
  );
}

export function DrawerFooter({ className, ...props }) {
  return (
    <div
      className={cn('flex items-center justify-end gap-3 p-6 pt-4 border-t border-[#E5DCD3] mt-auto bg-[#FCFAF7]', className)}
      {...props}
    />
  );
}
