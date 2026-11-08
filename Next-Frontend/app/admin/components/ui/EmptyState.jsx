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
        'rounded-xl border border-edge-subtle bg-white p-12 text-center flex flex-col items-center justify-center shadow-sm font-sans',
        className
      )}
    >
      <div className="w-12 h-12 rounded-xl bg-ground-sunk flex items-center justify-center text-accent-ink mb-3.5 border border-edge-subtle">
        {isValidElement(Icon) ? Icon : <Icon size={22} weight="duotone" />}
      </div>
      <h3 className="font-sans text-base font-semibold text-ink mb-1">
        {title}
      </h3>
      <p className="text-xs text-ink-muted max-w-sm leading-relaxed mb-4">
        {description}
      </p>
      {action && <div>{action}</div>}
    </div>
  );
}

export default EmptyState;
