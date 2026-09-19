/**
 * Route loading UI.
 *
 * The site had **zero** `loading.jsx` segments (R-40): navigating between pages
 * left the previous page on screen with no acknowledgement until the next was
 * ready. This is deliberately minimal — a quiet brass progress hairline, not a
 * full-page skeleton, because a page-shaped skeleton for an unknown page is a
 * guess that will be wrong.
 */
export default function SiteLoading() {
    return (
        <div className="fixed inset-x-0 top-0 z-toast h-px bg-edge-subtle" role="status" aria-live="polite">
            <span className="sr-only">Loading</span>
            <div className="h-full w-1/3 bg-gold motion-safe:animate-[wb-indeterminate_1.2s_var(--ease-standard)_infinite]" />
        </div>
    );
}
