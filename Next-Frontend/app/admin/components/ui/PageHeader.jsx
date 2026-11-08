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
  children,
  className,
}) {
  // Four pages pass their buttons as children; the slot used to render only
  // `actions`, so those buttons (Add media, Edit profile, Delete…) never appeared.
  const slot = actions ?? children;
  return (
    <div className={cn('space-y-2 border-b-[0.5px] border-edge-subtle pb-5 font-sans', className)}>
      {/* Optional Breadcrumb trail */}
      {breadcrumbs.length > 0 && (
        <nav aria-label="Breadcrumbs" className="flex items-center gap-1.5 text-xs text-ink-muted font-sans">
          {breadcrumbs.map((crumb, idx) => {
            const isLast = idx === breadcrumbs.length - 1;
            return (
              <div key={idx} className="flex items-center gap-1.5">
                {idx > 0 && <CaretRight size={11} className="text-ink-muted" />}
                {crumb.href && !isLast ? (
                  <Link
                    href={crumb.href}
                    className="hover:text-accent-ink transition-colors"
                  >
                    {crumb.label}
                  </Link>
                ) : (
                  <span className={cn(isLast ? 'text-ink font-medium' : '')}>
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
            <h1 className="font-sans text-2xl sm:text-3xl font-bold tracking-tight text-ink">
              {title}
            </h1>
            {badge && <div>{badge}</div>}
          </div>
          {subtitle && (
            <p className="text-xs sm:text-sm text-ink-secondary font-sans leading-relaxed max-w-3xl">
              {subtitle}
            </p>
          )}
        </div>

        {/* Action Buttons Slot */}
        {slot && (
          <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
            {slot}
          </div>
        )}
      </div>
    </div>
  );
}

export default PageHeader;
