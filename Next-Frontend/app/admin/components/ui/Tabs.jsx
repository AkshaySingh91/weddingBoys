'use client';

import * as TabsPrimitive from '@radix-ui/react-tabs';
import { cn } from '@/lib/utils.js';

export const Tabs = TabsPrimitive.Root;

export function TabsList({ className, ...props }) {
  return (
    <TabsPrimitive.List
      className={cn(
        'inline-flex h-11 items-center justify-center rounded-xl bg-ground-sunk/80 p-1 text-ink-secondary border border-edge-subtle',
        className
      )}
      {...props}
    />
  );
}

export function TabsTrigger({ className, ...props }) {
  return (
    <TabsPrimitive.Trigger
      className={cn(
        'inline-flex items-center justify-center whitespace-nowrap rounded-lg px-4 py-1.5 text-xs font-medium transition-all focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50',
        'text-accent-ink/80 hover:text-accent-ink',
        'data-[state=active]:bg-white data-[state=active]:text-ink data-[state=active]:shadow-sm data-[state=active]:font-semibold',
        className
      )}
      {...props}
    />
  );
}

export function TabsContent({ className, ...props }) {
  return (
    <TabsPrimitive.Content
      className={cn(
        'mt-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent',
        className
      )}
      {...props}
    />
  );
}
