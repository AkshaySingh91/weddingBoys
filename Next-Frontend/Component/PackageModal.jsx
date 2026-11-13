'use client';

/**
 * PackageModal — the full detail of one package.
 *
 * Same visual language as the pricing cards (app/(site)/_home/PricingPlans.jsx):
 * a light-weight price, gold filled checks for what is included, a quiet cross
 * for what is not, pill actions; the featured plan's header is the dark card.
 *
 * Layout decisions:
 *   - Only the close button and the action bar are pinned. The header scrolls
 *     with the body — pinned, it took ~230px of a phone screen and left the 13
 *     inclusions a 430px window.
 *   - The team is its own group of role tiles, not tick rows: "1 Drone Pilot"
 *     is who comes, not a deliverable.
 *   - Inclusions run two columns from `sm`, so the desktop sheet is shorter.
 *   - Two actions: WhatsApp (pre-filled) and a call.
 *
 * Behaviour kept from the FilmLightbox pattern: entrance, focus trap, focus
 * restore, scroll lock, Escape, click-outside, full-width sheet on a phone.
 */
import { useEffect, useRef, useState } from 'react';
import { FiX, FiCheck, FiPhone, FiMessageCircle, FiUser } from 'react-icons/fi';

const inr = (n) => `₹${Number(n).toLocaleString('en-IN')}`;

function Group({ title, count, children }) {
    return (
        <section className="mt-8">
            <h3 className="flex items-baseline gap-2 text-[13px] font-semibold uppercase tracking-[0.14em] text-ink-muted">
                {title}
                {count != null && <span className="text-ink-muted/70 tabular-nums">{count}</span>}
            </h3>
            {children}
        </section>
    );
}

export default function PackageModal({ pkg, whatsappHref, callHref, onClose }) {
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
        const focusRaf = requestAnimationFrame(() => focusables()[0]?.focus({ preventScroll: true }));

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
            restoreTo.current?.focus?.({ preventScroll: true });
        };
    }, [onClose]);

    if (!pkg) return null;

    const featured = Boolean(pkg.isPopular);
    const save = pkg.total > pkg.offer ? Math.ceil(((pkg.total - pkg.offer) / pkg.total) * 100) : 0;
    const included = pkg.includes.filter((i) => i.included);
    const excluded = pkg.includes.filter((i) => !i.included);
    const label = featured ? 'Popular' : save > 0 ? `Save ${save}%` : null;

    return (
        <div
            className={`fixed inset-0 z-modal flex items-end justify-center sm:items-center sm:p-6
                        transition-opacity duration-ui ease-standard ${shown ? 'opacity-100' : 'opacity-0'}`}
            onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
        >
            {/* Dimmed, not blacked out: the page stays recognisable behind. */}
            <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-ground-deep/60 backdrop-blur-[3px]" />

            <div
                ref={panelRef}
                role="dialog"
                aria-modal="true"
                aria-labelledby="package-modal-title"
                className={`relative flex max-h-[92svh] w-full flex-col overflow-hidden rounded-t-[28px] bg-ground-raised
                            shadow-overlay transition-[opacity,transform] duration-entrance ease-entrance
                            sm:max-h-[88svh] sm:max-w-[680px] sm:rounded-[28px]
                            ${shown ? 'translate-y-0 opacity-100 sm:scale-100' : 'translate-y-6 opacity-0 sm:translate-y-2 sm:scale-[0.97]'}`}
            >
                <button
                    type="button"
                    onClick={onClose}
                    aria-label="Close package details"
                    className={`absolute right-3 top-3 z-10 grid h-11 w-11 place-items-center rounded-full backdrop-blur
                                transition-colors duration-micro ease-standard focus-ring
                                ${featured ? 'bg-ground-deep/70 text-ink-onDeep ring-1 ring-ink-onDeep/15 hover:bg-ground-deep/85' : 'bg-ground-raised/90 text-ink ring-1 ring-ink/10 hover:bg-ground-raised'}`}
                >
                    <FiX aria-hidden="true" className="h-5 w-5" />
                </button>

                <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
                    {/* Header — the plan's own card treatment. The close button floats
                        above both header and body, so it carries its own backing. */}
                    <header className={`px-6 pb-7 pt-7 sm:px-9 sm:pt-9 ${featured ? 'bg-ground-deep text-ink-onDeep' : 'border-b border-ink/[0.07] bg-ground-raised text-ink'}`}>
                        {label && (
                            <p className={`mb-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[12px] font-semibold
                                           ${featured ? 'bg-gold text-ink' : 'bg-accent-wash text-accent-ink'}`}>
                                {label}
                                <span aria-hidden="true" className={`h-1.5 w-1.5 rounded-full ${featured ? 'bg-ink' : 'bg-accent'}`} />
                            </p>
                        )}
                        <h2 id="package-modal-title" className="pr-12 text-[24px] font-semibold leading-tight tracking-[-0.015em] sm:text-[28px]">
                            {pkg.title}
                        </h2>
                        <p className={`mt-1.5 text-[14.5px] ${featured ? 'text-ink-onDeep/70' : 'text-ink-muted'}`}>{pkg.tagline}</p>

                        <div className="mt-6 flex flex-wrap items-end gap-x-3 gap-y-1">
                            <p className={`text-[44px] font-light leading-none tracking-[-0.035em] tabular-nums ${featured ? 'text-gold' : ''}`}>
                                {inr(pkg.offer)}
                            </p>
                            <p className={`pb-1 text-[13px] leading-snug ${featured ? 'text-ink-onDeep/60' : 'text-ink-muted'}`}>
                                {save > 0 && <s className="block tabular-nums">{inr(pkg.total)}</s>}
                                <span className="block">per package</span>
                            </p>
                        </div>

                        {/* The card's glance line, as three stats. */}
                        <dl className={`mt-6 grid grid-cols-3 divide-x overflow-hidden rounded-2xl text-center
                                        ${featured ? 'divide-ink-onDeep/10 bg-ink-onDeep/[0.06]' : 'divide-ink/[0.07] bg-ink/[0.035]'}`}>
                            {[
                                ['Team', pkg.team.length],
                                ['Deliverables', included.length],
                                ['You save', save > 0 ? `${save}%` : 'None'],
                            ].map(([k, v]) => (
                                <div key={k} className="px-2 py-3">
                                    <dd className="text-[18px] font-semibold tabular-nums">{v}</dd>
                                    <dt className={`text-[11.5px] ${featured ? 'text-ink-onDeep/60' : 'text-ink-muted'}`}>{k}</dt>
                                </div>
                            ))}
                        </dl>
                    </header>

                    <div className="px-6 pb-8 pt-7 sm:px-9">
                        <p className="text-[16px] leading-relaxed text-ink-secondary">{pkg.description}</p>

                        {pkg.recommendedFor && (
                            <p className="mt-5 rounded-2xl border border-gold/30 bg-gold/10 px-4 py-3 text-[14px] leading-snug text-ink-secondary">
                                <span className="font-semibold text-ink">Best for: </span>{pkg.recommendedFor}
                            </p>
                        )}

                        <Group title="Your team" count={pkg.team.length}>
                            <ul className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                                {pkg.team.map((member, i) => (
                                    <li key={`${member}-${i}`} className="flex items-center gap-3 rounded-xl border border-ink/[0.07] px-3 py-2.5">
                                        <span aria-hidden="true" className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-ink/[0.05] text-ink-secondary">
                                            <FiUser className="h-4 w-4" />
                                        </span>
                                        <span className="text-[14px] font-medium text-ink">{member}</span>
                                    </li>
                                ))}
                            </ul>
                        </Group>

                        <Group title="What's included" count={included.length}>
                            <ul className="mt-3 grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
                                {included.map((item, i) => (
                                    <li key={`in-${i}`} className="flex items-start gap-3 text-[14.5px] leading-snug text-ink">
                                        <span aria-hidden="true" className="mt-px grid h-5 w-5 shrink-0 place-items-center rounded-full bg-gold text-ink">
                                            <FiCheck className="h-3 w-3" strokeWidth={3} />
                                        </span>
                                        {item.text}
                                    </li>
                                ))}
                            </ul>
                        </Group>

                        {excluded.length > 0 && (
                            <Group title="Not in this package" count={excluded.length}>
                                <ul className="mt-3 grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
                                    {excluded.map((item, i) => (
                                        <li key={`ex-${i}`} className="flex items-start gap-3 text-[14.5px] leading-snug text-ink-muted">
                                            <FiX aria-hidden="true" className="mt-px h-5 w-5 shrink-0 p-0.5" strokeWidth={1.5} />
                                            {item.text}
                                        </li>
                                    ))}
                                </ul>
                                <p className="mt-4 text-[13px] text-ink-muted">Any of these can be added. Ask when you enquire.</p>
                            </Group>
                        )}
                    </div>
                </div>

                {/* Action bar — always reachable. */}
                <div className="flex shrink-0 items-center gap-2 border-t border-ink/[0.07] bg-ground-raised/95 px-4 pt-3 backdrop-blur
                                pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-6 sm:pb-4 sm:pt-4">
                    <a
                        href={whatsappHref}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex h-12 flex-1 items-center justify-center gap-2 rounded-full bg-accent px-5 text-[15px] font-semibold
                                   text-ink-onAccent transition-colors duration-micro ease-standard hover:bg-accent-hover
                                   active:bg-accent-press focus-ring"
                    >
                        <FiMessageCircle aria-hidden="true" className="h-[18px] w-[18px]" />
                        Enquire on WhatsApp
                    </a>
                    {callHref && (
                        <a
                            href={callHref}
                            aria-label="Call the studio"
                            className="grid h-12 w-12 shrink-0 place-items-center rounded-full border border-ink/15 text-ink
                                       transition-colors duration-micro ease-standard hover:border-ink/30 hover:bg-ink/[0.03] focus-ring"
                        >
                            <FiPhone aria-hidden="true" className="h-[18px] w-[18px]" />
                        </a>
                    )}
                </div>
            </div>
        </div>
    );
}
