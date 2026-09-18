'use client';

import * as TabsPrimitive from '@radix-ui/react-tabs';
import { cn } from '@/lib/utils.js';

export const Tabs = TabsPrimitive.Root;

export function TabsList({ className, ...props }) {
  return (
    <TabsPrimitive.List
      className={cn(
        'inline-flex h-11 items-center justify-center rounded-xl bg-[#FAF1E6]/80 p-1 text-stone-600 border border-[#E8D7C5]/60 backdrop-blur-sm',
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
        'text-[#74583E]/80 hover:text-[#74583E]',
        'data-[state=active]:bg-white data-[state=active]:text-stone-900 data-[state=active]:shadow-sm data-[state=active]:font-semibold',
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
        'mt-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/20',
        className
      )}
      {...props}
    />
  );
}
