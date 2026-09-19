/**
 * Skeleton — content-shaped, never a grey rectangle.
 *
 * The audit found loading placeholders drawn in Tailwind slate-400 (#94A3B8,
 * the single most-used background colour on the public site) on a warm page —
 * they read as broken rather than as loading (R-58). These are built from
 * --ink-raised and shimmer once per 1.6s, paused under reduced motion.
 *
 * The rule that matters: a skeleton must match the real content's box exactly,
 * so nothing moves when data arrives. Layout shift is the defect skeletons
 * exist to prevent, and /team currently measures CLS 1.59 (R-10).
 */
export function Skeleton({ className = '', rounded = 'panel' }) {
    return <div aria-hidden="true" className={`skeleton rounded-${rounded} ${className}`} />;
}

/** A block of text lines; the last is short, as real paragraphs are. */
export function SkeletonText({ lines = 3, className = '' }) {
    return (
        <div className={`flex flex-col gap-2 ${className}`} aria-hidden="true">
            {Array.from({ length: lines }).map((_, i) => (
                <div
                    key={i}
                    className="skeleton h-[0.9em] rounded-control"
                    style={{ width: i === lines - 1 ? '62%' : '100%' }}
                />
            ))}
        </div>
    );
}

/**
 * Wraps a loading region so screen readers are told something is happening —
 * a silent skeleton is invisible to assistive technology.
 */
export function SkeletonRegion({ label = 'Loading', children }) {
    return (
        <div role="status" aria-live="polite" aria-busy="true">
            <span className="sr-only">{label}</span>
            {children}
        </div>
    );
}
