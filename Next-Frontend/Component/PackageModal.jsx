'use client';

/**
 * PackageModal — the full detail of one package.
 *
 * Replaces in-card expansion. Four packages sat in a two-column grid and each
 * expanded in place, which made its **grid row** grow: open one and its
 * neighbour stretched to match, leaving a tall column of empty card beside the
 * content. Two cards would also open at once because each tracked its own
 * height against a shared row.
 *
 * A modal is the right container for this: the detail is long (up to 13
 * inclusions plus a team list), it is read once at decision time, and it should
 * not reflow the four cards a visitor is comparing.
 *
 * Built on the FilmLightbox pattern already in this codebase — entrance, focus
 * trap, focus restore, scroll lock, Escape, click-outside, 48px close target,
 * and full-bleed on a phone.
 */
import { useEffect, useRef, useState } from 'react';
import {
    FiX, FiCheckCircle, FiXCircle, FiUsers, FiPackage,
    FiMessageCircle, FiTag,
} from 'react-icons/fi';

export default function PackageModal({ pkg, whatsappHref, onClose }) {
    const panelRef = useRef(null);
    const restoreTo = useRef(null);
    const [shown, setShown] = useState(false);

    useEffect(() => {
        restoreTo.current = document.activeElement;
        const { overflow } = document.body.style;
        document.body.style.overflow = 'hidden';

        // Two frames: one to mount at the start state, one to transition from it.
        const raf = requestAnimationFrame(() => requestAnimationFrame(() => setShown(true)));

        const focusables = () => panelRef.current?.querySelectorAll(
            'a[href], button:not([disabled]), input, [tabindex]:not([tabindex="-1"])',
        ) ?? [];
        const focusRaf = requestAnimationFrame(() => focusables()[0]?.focus());

        const onKey = (e) => {
            if (e.key === 'Escape') { onClose(); return; }
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
            cancelAnimationFrame(focusRaf);
            document.removeEventListener('keydown', onKey);
            document.body.style.overflow = overflow;
            restoreTo.current?.focus?.();
        };
    }, [onClose]);

    if (!pkg) return null;

    const save = Math.ceil(((pkg.total - pkg.offer) / pkg.total) * 100);
    const included = pkg.includes.filter((i) => i.included);
    const excluded = pkg.includes.filter((i) => !i.included);

    return (
        <div
            className={`fixed inset-0 z-modal flex items-end justify-center sm:items-center
                        transition-opacity duration-entrance ease-standard
                        ${shown ? 'opacity-100' : 'opacity-0'}`}
            onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
        >
            {/* Warm ground with the jaali behind it, as the film lightbox does —
                a black void would not belong to this site. */}
            <div aria-hidden="true" className="absolute inset-0 bg-ground-deep/95" />
            <div aria-hidden="true" className="jaali pointer-events-none absolute inset-0 opacity-30" />

            <div
                ref={panelRef}
                role="dialog"
                aria-modal="true"
                aria-labelledby="package-modal-title"
                className={`relative flex max-h-[92svh] w-full flex-col overflow-hidden bg-ground
                            shadow-overlay transition-[opacity,transform] duration-entrance ease-entrance
                            sm:max-w-[640px] sm:rounded-media
                            rounded-t-media
                            ${shown ? 'translate-y-0 opacity-100 sm:scale-100' : 'translate-y-4 opacity-0 sm:scale-[0.96]'}`}
            >
                {/* ── Header: stays put while the body scrolls, so the price and
                       the close button are never scrolled away from. ── */}
                <div className="relative shrink-0 border-b border-gold/30 bg-accent-wash px-5 py-5 sm:px-7">
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Close package details"
                        className="absolute right-3 top-3 grid h-12 w-12 place-items-center rounded-pill
                                   border border-gold/40 bg-ground text-ink transition-colors
                                   duration-micro ease-standard hover:bg-ground-sunk focus-ring"
                    >
                        <FiX aria-hidden="true" className="h-5 w-5" />
                    </button>

                    {pkg.isPopular && (
                        <p className="mb-2 inline-flex items-center gap-1.5 rounded-pill bg-accent
                                      px-3 py-1 text-[11px] font-semibold text-white">
                            <FiTag aria-hidden="true" className="h-3 w-3" />
                            Popular choice
                        </p>
                    )}

                    <h2 id="package-modal-title" className="t-display-2 pr-14">{pkg.title}</h2>
                    <p className="t-body-sm mt-1">{pkg.tagline}</p>

                    <div className="mt-4 flex flex-wrap items-baseline gap-x-3 gap-y-1">
                        <span className="font-display text-[30px] font-semibold text-accent-ink">
                            ₹{Number(pkg.offer).toLocaleString('en-IN')}
                        </span>
                        <span className="t-body-sm text-ink-muted line-through">
                            ₹{Number(pkg.total).toLocaleString('en-IN')}
                        </span>
                        <span className="rounded-pill bg-accent-tint px-2.5 py-1 text-[12px] font-semibold text-accent-ink">
                            Save {save}%
                        </span>
                    </div>
                </div>

                {/* ── Body ── */}
                <div className="min-h-0 flex-1 overflow-y-auto px-5 py-6 sm:px-7">
                    <p className="t-body">{pkg.description}</p>

                    {pkg.recommendedFor && (
                        <p className="t-body-sm mt-3 rounded-panel border-l-2 border-gold-strong bg-ground-sunk px-3 py-2">
                            <span className="font-semibold text-ink">Best for:</span> {pkg.recommendedFor}
                        </p>
                    )}

                    <h3 className="t-heading-3 mt-7 flex items-center gap-2">
                        <FiUsers aria-hidden="true" className="h-4 w-4 text-accent-ink" />
                        Your team — {pkg.team.length} {pkg.team.length === 1 ? 'person' : 'people'}
                    </h3>
                    <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                        {pkg.team.map((member, i) => (
                            <li
                                key={`${member}-${i}`}
                                className="flex items-center gap-2 rounded-panel border border-gold/25
                                           bg-ground-raised px-3 py-2 text-[14px] text-ink-secondary"
                            >
                                <FiCheckCircle aria-hidden="true" className="h-4 w-4 shrink-0 text-accent-ink" />
                                {member}
                            </li>
                        ))}
                    </ul>

                    <h3 className="t-heading-3 mt-7 flex items-center gap-2">
                        <FiPackage aria-hidden="true" className="h-4 w-4 text-accent-ink" />
                        What&apos;s included
                    </h3>
                    <ul className="mt-3 grid gap-2">
                        {included.map((item, i) => (
                            <li key={`in-${i}`} className="flex items-start gap-2 text-[14px] text-ink-secondary">
                                <FiCheckCircle aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-accent-ink" />
                                {item.text}
                            </li>
                        ))}
                    </ul>

                    {/* Exclusions are separated rather than struck through in the
                        same list. A line-through item in a list of ticks reads as
                        "included, then cancelled" at a glance. */}
                    {excluded.length > 0 && (
                        <>
                            <h3 className="t-label mt-6">Not in this package</h3>
                            <ul className="mt-2 grid gap-2">
                                {excluded.map((item, i) => (
                                    <li key={`ex-${i}`} className="flex items-start gap-2 text-[14px] text-ink-muted">
                                        <FiXCircle aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
                                        {item.text}
                                    </li>
                                ))}
                            </ul>
                        </>
                    )}
                </div>

                {/* ── Footer: the action stays reachable without scrolling to the
                       bottom of thirteen inclusions. ── */}
                <div className="shrink-0 border-t border-gold/30 bg-ground-raised px-5 py-4 sm:px-7
                                pb-[max(1rem,env(safe-area-inset-bottom))]">
                    <a
                        href={whatsappHref}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex min-h-[52px] w-full items-center justify-center gap-2 rounded-pill
                                   bg-accent px-6 text-[15px] font-semibold text-white transition-colors
                                   duration-micro ease-standard hover:bg-accent-hover active:bg-accent-press
                                   focus-ring"
                    >
                        <FiMessageCircle aria-hidden="true" className="h-5 w-5" />
                        Enquire about this package
                    </a>
                    <p className="t-caption mt-2 text-center">
                        Opens WhatsApp with your package details filled in.
                    </p>
                </div>
            </div>
        </div>
    );
}
