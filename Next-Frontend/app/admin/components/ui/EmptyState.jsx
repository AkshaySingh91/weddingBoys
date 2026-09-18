'use client';

import { isValidElement } from 'react';
import { Tray } from '@phosphor-icons/react';
import { cn } from '@/lib/utils.js';

export function EmptyState({
  icon: Icon = Tray,
  title = 'No records found',
  description = 'Try adjusting your search or filters to find what you are looking for.',
  action,
  className,
}) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-[#E5DCD3] bg-white p-12 text-center flex flex-col items-center justify-center shadow-sm font-sans',
        className
      )}
    >
      <div className="w-12 h-12 rounded-2xl bg-[#FAF1E6] flex items-center justify-center text-[#A3603A] mb-3.5 border border-[#E5DCD3]">
        {isValidElement(Icon) ? Icon : <Icon size={22} weight="duotone" />}
      </div>
      <h3 className="font-serif text-base font-semibold text-[#1C1917] mb-1">
        {title}
      </h3>
      <p className="text-xs text-stone-500 max-w-sm leading-relaxed mb-4">
        {description}
      </p>
      {action && <div>{action}</div>}
    </div>
  );
}

export default EmptyState;
