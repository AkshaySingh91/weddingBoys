'use client';

import Link from 'next/link';
import { CaretRight } from '@phosphor-icons/react';
import { cn } from '@/lib/utils.js';

export function PageHeader({
  title,
  subtitle,
  breadcrumbs = [],
  badge,
  actions,
  className,
}) {
  return (
    <div className={cn('space-y-2 border-b-[0.5px] border-stone-200 pb-5 font-sans', className)}>
      {/* Optional Breadcrumb trail */}
      {breadcrumbs.length > 0 && (
        <nav aria-label="Breadcrumbs" className="flex items-center gap-1.5 text-xs text-stone-500 font-sans">
          {breadcrumbs.map((crumb, idx) => {
            const isLast = idx === breadcrumbs.length - 1;
            return (
              <div key={idx} className="flex items-center gap-1.5">
                {idx > 0 && <CaretRight size={11} className="text-stone-400" />}
                {crumb.href && !isLast ? (
                  <Link
                    href={crumb.href}
                    className="hover:text-red-500 transition-colors"
                  >
                    {crumb.label}
                  </Link>
                ) : (
                  <span className={cn(isLast ? 'text-stone-800 font-medium' : '')}>
                    {crumb.label}
                  </span>
                )}
              </div>
            );
          })}
        </nav>
      )}

      {/* Main Header Content */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1 min-w-0">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="font-sans text-2xl sm:text-3xl font-bold tracking-tight text-[#2F2F2F]">
              {title}
            </h1>
            {badge && <div>{badge}</div>}
          </div>
          {subtitle && (
            <p className="text-xs sm:text-sm text-stone-600 font-sans leading-relaxed max-w-3xl">
              {subtitle}
            </p>
          )}
        </div>

        {/* Action Buttons Slot */}
        {actions && (
          <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}

export default PageHeader;
