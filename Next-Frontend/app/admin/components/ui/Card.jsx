'use client';

import { cn } from '@/lib/utils.js';

export function Card({ className, children, ...props }) {
  return (
    <div
      className={cn(
        'bg-ground-raised border border-edge-subtle shadow-panel rounded-xl transition-colors duration-ui font-sans',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ className, children, ...props }) {
  return (
    <div
      className={cn('flex flex-col space-y-1.5 p-5 sm:p-6 border-b-[0.5px] border-edge-subtle', className)}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardTitle({ className, children, ...props }) {
  return (
    <h3
      className={cn('text-base sm:text-lg font-bold tracking-tight text-ink font-sans', className)}
      {...props}
    >
      {children}
    </h3>
  );
}

export function CardDescription({ className, children, ...props }) {
  return (
    <p
      className={cn('text-xs text-ink-muted font-sans leading-relaxed', className)}
      {...props}
    >
      {children}
    </p>
  );
}

export function CardContent({ className, children, ...props }) {
  return (
    <div className={cn('p-5 sm:p-6', className)} {...props}>
      {children}
    </div>
  );
}

export function CardFooter({ className, children, ...props }) {
  return (
    <div
      className={cn('flex items-center justify-between p-4 sm:px-6 bg-ground border-t-[0.5px] border-edge-subtle rounded-b-xl', className)}
      {...props}
    >
      {children}
    </div>
  );
}

export default Card;
