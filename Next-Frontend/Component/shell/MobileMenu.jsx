'use client';

/**
 * MobileMenu — the single navigation pattern below 1024px.
 *
 * Reads the same `lib/navigation.js` as the header and footer, so the three
 * surfaces cannot disagree (R-39).
 *
 * Focus is trapped while open and returned to the trigger on close; the page
 * behind is locked. None of that existed before — the previous menu was a
 * div that appeared beside an already-visible desktop nav.
 */
import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { PRIMARY_NAV, PRIMARY_CTA } from '@/lib/navigation.js';
import Button from '@/Component/ui/Button.jsx';

export default function MobileMenu({ open, onClose }) {
    const panelRef = useRef(null);
    const restoreTo = useRef(null);

    useEffect(() => {
        if (!open) return undefined;

        restoreTo.current = document.activeElement;
        const { overflow } = document.body.style;
        document.body.style.overflow = 'hidden';

        const panel = panelRef.current;
        const focusables = () => panel?.querySelectorAll(
            'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ) ?? [];

        // Move focus into the panel on the next frame, once it is painted.
        const raf = requestAnimationFrame(() => focusables()[0]?.focus());

        const onKey = (e) => {
            if (e.key !== 'Tab') return;
            const items = [...focusables()];
            if (!items.length) return;
            const first = items[0];
            const last = items[items.length - 1];
            if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
            else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
        };
        document.addEventListener('keydown', onKey);

        return () => {
            cancelAnimationFrame(raf);
            document.removeEventListener('keydown', onKey);
            document.body.style.overflow = overflow;
            restoreTo.current?.focus?.();
        };
    }, [open]);

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-modal lg:hidden">
            <button
                type="button"
                aria-label="Close menu"
                onClick={onClose}
                className="absolute inset-0 h-full w-full bg-ink/45 backdrop-blur-sm"
            />

            <div
                ref={panelRef}
                role="dialog"
                aria-modal="true"
                aria-label="Menu"
                /* Full width on a phone. A 380px panel on a 390px screen left a 10px
                   sliver of the page showing, which reads as a rendering fault rather
                   than a deliberate reveal. */
                className="absolute inset-y-0 right-0 flex w-full flex-col border-l
                           border-edge-subtle bg-ground sm:max-w-[400px]"
            >
                <div className="flex items-center justify-between border-b border-edge-subtle px-5 py-4">
                    <span className="t-label">Menu</span>
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Close menu"
                        className="grid h-11 w-11 place-items-center rounded-control text-ink
                                   transition-colors duration-micro ease-standard hover:bg-ground-sunk"
                    >
                        <span aria-hidden="true" className="relative block h-4 w-4">
                            <span className="absolute left-0 top-1/2 h-px w-full rotate-45 bg-current" />
                            <span className="absolute left-0 top-1/2 h-px w-full -rotate-45 bg-current" />
                        </span>
                    </button>
                </div>

                <nav aria-label="Mobile" className="flex-1 overflow-y-auto px-2 py-3">
                    {PRIMARY_NAV.map((item) => (
                        <div key={item.label}>
                            <Link
                                href={item.href}
                                onClick={onClose}
                                className="flex min-h-[52px] items-center rounded-control px-3 text-[17px]
                                           text-ink transition-colors duration-micro ease-standard
                                           hover:bg-ground-sunk"
                            >
                                {item.label}
                            </Link>
                            {/* Sub-destinations are listed, never hidden behind a second tap —
                                there are at most four and the space exists. */}
                            {item.panel && (
                                <div className="mb-1 ml-3 border-l border-edge-subtle pl-3">
                                    {item.panel.map((sub) => (
                                        <Link
                                            key={sub.href}
                                            href={sub.href}
                                            onClick={onClose}
                                            className="flex min-h-[44px] items-center rounded-control px-3
                                                       text-[15px] text-ink-secondary transition-colors
                                                       duration-micro ease-standard hover:bg-ground-sunk hover:text-ink"
                                        >
                                            {sub.label}
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}
                </nav>

                <div className="border-t border-edge-subtle p-5">
                    <Button href={PRIMARY_CTA.href} variant="primary" size="lg" className="w-full" onClick={onClose}>
                        {PRIMARY_CTA.label}
                    </Button>
                </div>
            </div>
        </div>
    );
}
