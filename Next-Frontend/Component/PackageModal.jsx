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
    FiMessageCircle, FiStar,
} from 'react-icons/fi';

/** One titled group. Every group in the panel is built from this, so they
 *  cannot drift apart in size or spacing the way hand-rolled ones did. */
function Detail({ icon: Icon, title, muted = false, children }) {
    return (
        <section className="mt-7">
            <h3 className={`flex items-center gap-2 text-[15px] font-semibold
                            ${muted ? 'text-ink-muted' : 'text-ink'}`}>
                <Icon aria-hidden="true" className={`h-4 w-4 ${muted ? 'text-ink-muted' : 'text-accent-ink'}`} />
                {title}
            </h3>
            <ul className="mt-3 space-y-2.5">{children}</ul>
        </section>
    );
}

/** One line item. */
function Row({ tone, children }) {
    const on = tone === 'on';
    return (
        <li className={`flex items-start gap-2.5 text-[15px] leading-snug
                        ${on ? 'text-ink-secondary' : 'text-ink-muted'}`}>
            {on
                ? <FiCheckCircle aria-hidden="true" className="mt-[3px] h-4 w-4 shrink-0 text-accent-ink" />
                : <FiXCircle aria-hidden="true" className="mt-[3px] h-4 w-4 shrink-0" />}
            {children}
        </li>
    );
}

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
                {/* ── Header. Stays put while the body scrolls, so the price
                       and the close control are never scrolled away from. ── */}
                <div className="relative shrink-0 border-b border-gold/30 bg-accent-wash px-6 py-6 sm:px-8">
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Close package details"
                        className="absolute right-4 top-4 grid h-11 w-11 place-items-center rounded-pill
                                   text-ink-secondary transition-colors duration-micro ease-standard
                                   hover:bg-ground hover:text-ink focus-ring"
                    >
                        <FiX aria-hidden="true" className="h-5 w-5" />
                    </button>

                    {pkg.isPopular && (
                        <p className="mb-2.5 inline-flex items-center gap-1.5 rounded-pill bg-accent
                                      px-2.5 py-1 text-[11px] font-semibold tracking-[0.02em] text-white">
                            <FiStar aria-hidden="true" className="h-3 w-3" />
                            Popular choice
                        </p>
                    )}

                    <h2 id="package-modal-title" className="t-display-2 max-w-none pr-12">{pkg.title}</h2>
                    <p className="t-body-sm mt-1.5 text-ink-muted">{pkg.tagline}</p>

                    <div className="mt-5 flex flex-wrap items-baseline gap-x-3 gap-y-1">
                        <span className="font-display text-[34px] font-semibold leading-none text-accent-ink">
                            ₹{Number(pkg.offer).toLocaleString('en-IN')}
                        </span>
                        <span className="text-[15px] text-ink-muted line-through">
                            ₹{Number(pkg.total).toLocaleString('en-IN')}
                        </span>
                        <span className="rounded-pill bg-accent-tint px-2.5 py-1 text-[12px] font-semibold text-accent-ink">
                            Save {save}%
                        </span>
                    </div>
                </div>

                {/* ── Body. One ground, one type ladder: 19px lead, 15px section
                       headings, 15px items. The first pass mixed a bordered
                       callout, boxed team chips and 14px list text, which read
                       as three different components in one panel. ── */}
                <div className="min-h-0 flex-1 overflow-y-auto bg-ground px-6 py-6 sm:px-8">
                    <p className="text-[17px] leading-relaxed text-ink-secondary">{pkg.description}</p>

                    {pkg.recommendedFor && (
                        <p className="mt-4 text-[15px] text-ink-secondary">
                            <span className="font-semibold text-ink">Best for</span>
                            <span className="mx-2 text-gold-strong" aria-hidden="true">·</span>
                            {pkg.recommendedFor}
                        </p>
                    )}

                    <Detail
                        icon={FiUsers}
                        title={`Your team — ${pkg.team.length} ${pkg.team.length === 1 ? 'person' : 'people'}`}
                    >
                        {pkg.team.map((member, i) => (
                            <Row key={`${member}-${i}`} tone="on">{member}</Row>
                        ))}
                    </Detail>

                    <Detail icon={FiPackage} title="What's included">
                        {included.map((item, i) => <Row key={`in-${i}`} tone="on">{item.text}</Row>)}
                    </Detail>

                    {/* Exclusions are separated rather than struck through inside
                        the tick list, where they read as "included, then
                        cancelled" at a glance. */}
                    {excluded.length > 0 && (
                        <Detail icon={FiXCircle} title="Not in this package" muted>
                            {excluded.map((item, i) => <Row key={`ex-${i}`} tone="off">{item.text}</Row>)}
                        </Detail>
                    )}
                </div>

                {/* ── Footer. The action stays reachable without scrolling past
                       thirteen inclusions. ── */}
                <div className="shrink-0 border-t border-gold/30 bg-ground-raised px-6 py-4 sm:px-8
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
                    <p className="mt-2 text-center text-[13px] text-ink-muted">
                        Opens WhatsApp with your package details filled in.
                    </p>
                </div>
            </div>
        </div>
    );
}
