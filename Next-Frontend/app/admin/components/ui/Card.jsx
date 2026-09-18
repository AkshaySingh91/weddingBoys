'use client';

import { cn } from '@/lib/utils.js';

export function Card({ className, children, ...props }) {
  return (
    <div
      className={cn(
        'bg-white border-[0.5px] border-stone-200 shadow-sm shadow-red-900/5 rounded-2xl transition-all duration-200 font-sans',
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
      className={cn('flex flex-col space-y-1.5 p-5 sm:p-6 border-b-[0.5px] border-stone-100', className)}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardTitle({ className, children, ...props }) {
  return (
    <h3
      className={cn('text-base sm:text-lg font-bold tracking-tight text-[#2F2F2F] font-sans', className)}
      {...props}
    >
      {children}
    </h3>
  );
}

export function CardDescription({ className, children, ...props }) {
  return (
    <p
      className={cn('text-xs text-stone-500 font-sans leading-relaxed', className)}
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
      className={cn('flex items-center justify-between p-4 sm:px-6 bg-[#FFFDFB] border-t-[0.5px] border-stone-100 rounded-b-2xl', className)}
      {...props}
    >
      {children}
    </div>
  );
}

export default Card;
