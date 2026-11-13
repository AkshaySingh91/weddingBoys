'use client';

/**
 * Pricing plans — the cards, the phone switcher and the swipe rail.
 *
 * Visual language (from the studio's reference boards):
 *   - a folder-tab notch cut out of each card's top-right corner, holding the
 *     card's status ("Popular", "Save 20%")
 *   - the featured plan is the dark card, framed in a hatched gold band that
 *     shows through its notch
 *   - a large, light-weight price with its context stacked beside it
 *   - a dotted rule, then the whole list: included items with a filled check,
 *     excluded ones with a quiet cross, so plans compare at a glance
 *   - pill buttons, and a segmented switcher for choosing a plan on a phone
 *
 * The notch is drawn with three flat pieces of one colour (top-left block,
 * body, a concave corner filler) rather than a mask, so it renders the same in
 * every browser and the shadow follows the shape (drop-shadow on the group).
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { LayoutGroup, motion, useReducedMotion } from 'framer-motion';
import { FiArrowUpRight, FiCheck, FiX } from 'react-icons/fi';

const NOTCH = { w: 128, h: 46, r: 18 };
/** Rows shown on a card; the rest are counted and live in the detail modal. */
const MAX_ROWS = 9;
const HATCH = 'repeating-linear-gradient(-45deg, rgb(var(--gold-rgb)) 0 7px, rgb(var(--gold-strong-rgb) / 0.55) 7px 8px)';

export const inr = (n) => `₹${Number(n).toLocaleString('en-IN')}`;
/** ₹40K, ₹1.3L — for the switcher, where a full price does not fit. */
const compactInr = (n) => {
    const v = Number(n);
    if (v >= 100000) return `₹${(v / 100000).toFixed(1).replace(/\.0$/, '')}L`;
    if (v >= 1000) return `₹${(v / 1000).toFixed(1).replace(/\.0$/, '')}K`;
    return inr(v);
};
const savingOf = (pkg) => (pkg.total > pkg.offer ? Math.ceil(((pkg.total - pkg.offer) / pkg.total) * 100) : 0);
/** "Enchanted Pre-Wedding" -> "Enchanted": the word that tells the plans apart. */
const shortName = (title = '') => title.split(/\s+/)[0];

/** The card's background, with or without the top-right notch. */
function Surface({ notched, shadow }) {
    const fill = 'bg-[var(--card)]';
    return (
        <div aria-hidden="true" className="absolute inset-0 -z-10" style={{ filter: shadow }}>
            {notched ? (
                <>
                    <div className={`absolute left-0 top-0 rounded-tl-[28px] rounded-tr-[18px] ${fill}`}
                        style={{ right: NOTCH.w, height: NOTCH.h + 32 }} />
                    <div className={`absolute inset-x-0 bottom-0 rounded-b-[28px] rounded-tr-[28px] ${fill}`}
                        style={{ top: NOTCH.h }} />
                    <div className="absolute"
                        style={{
                            right: NOTCH.w - NOTCH.r, top: NOTCH.h - NOTCH.r, width: NOTCH.r, height: NOTCH.r,
                            background: `radial-gradient(circle at 100% 0, transparent ${NOTCH.r}px, var(--card) ${NOTCH.r + 0.5}px)`,
                        }} />
                </>
            ) : (
                <div className={`absolute inset-0 rounded-[28px] ${fill}`} />
            )}
        </div>
    );
}

export function PlanCard({ pkg, onOpen, lift = false, className = '' }) {
    const featured = Boolean(pkg.isPopular);
    const save = savingOf(pkg);
    const label = featured ? 'Popular' : save > 0 ? `Save ${save}%` : null;
    const included = pkg.includes.filter((i) => i.included).length;
    const rows = pkg.includes.slice(0, MAX_ROWS);
    const hidden = pkg.includes.length - rows.length;

    const card = (
        <article
            className={`relative isolate flex h-full flex-col p-6 ${featured ? 'text-ink-onDeep' : 'text-ink'}`}
            style={{ '--card': featured ? 'rgb(var(--ground-deep-rgb))' : 'rgb(var(--ground-raised-rgb))' }}
        >
            <Surface notched={Boolean(label)}
                shadow={featured ? 'drop-shadow(0 22px 30px rgba(42,27,18,0.28))' : 'drop-shadow(0 10px 24px rgba(42,27,18,0.10))'} />

            {label && (
                <p className={`absolute right-0 top-0 flex items-center justify-center gap-1.5 text-[12.5px] font-semibold
                               ${featured ? 'text-ink' : 'text-ink-secondary'}`}
                    style={{ width: NOTCH.w, height: NOTCH.h }}>
                    {label}
                    <span aria-hidden="true" className={`h-1.5 w-1.5 rounded-full ${featured ? 'bg-ink' : 'bg-accent'}`} />
                </p>
            )}

            <h3 className={`min-h-[2.6em] text-[19px] font-semibold leading-[1.3] tracking-[-0.01em] ${label ? 'pr-[112px]' : ''}`}>
                {pkg.title}
            </h3>

            <div className="mt-4 flex flex-wrap items-end gap-x-3 gap-y-1">
                <p className={`text-[38px] font-light leading-none tracking-[-0.035em] tabular-nums sm:text-[42px] ${featured ? 'text-gold' : ''}`}>
                    {inr(pkg.offer)}
                </p>
                <p className={`pb-0.5 text-[12.5px] leading-snug ${featured ? 'text-ink-onDeep/60' : 'text-ink-muted'}`}>
                    {save > 0 && <s className="block tabular-nums">{inr(pkg.total)}</s>}
                    <span className="block">per package</span>
                </p>
            </div>
            <p className={`mt-2 text-[12.5px] font-medium ${featured ? 'text-gold' : 'text-accent-ink'}`}>
                Team of {pkg.team.length}, {included} deliverables
            </p>

            <p className={`mt-4 text-[14px] leading-relaxed lg:min-h-[4.9em] ${featured ? 'text-ink-onDeep/75' : 'text-ink-secondary'}`}>
                {pkg.tagline}
            </p>

            <div aria-hidden="true" className={`my-5 border-t-2 border-dotted ${featured ? 'border-ink-onDeep/15' : 'border-ink/15'}`} />

            <ul className="flex-1 space-y-3">
                {rows.map((item, i) => (
                    <li key={i} className={`flex items-start gap-3 text-[14px] leading-snug
                        ${item.included ? '' : featured ? 'text-ink-onDeep/45' : 'text-ink-muted/80'}`}>
                        {item.included ? (
                            <span aria-hidden="true" className="mt-px grid h-5 w-5 shrink-0 place-items-center rounded-full bg-gold text-ink">
                                <FiCheck className="h-3 w-3" strokeWidth={3} />
                            </span>
                        ) : (
                            <FiX aria-hidden="true" className="mt-px h-5 w-5 shrink-0 p-0.5" strokeWidth={1.5} />
                        )}
                        <span>
                            {item.text}
                            {!item.included && <span className="sr-only"> (not included)</span>}
                        </span>
                    </li>
                ))}
                {hidden > 0 && (
                    <li className={`pl-8 text-[13px] font-medium ${featured ? 'text-ink-onDeep/60' : 'text-ink-muted'}`}>
                        +{hidden} more in details
                    </li>
                )}
            </ul>

            <button
                type="button"
                onClick={() => onOpen(pkg)}
                className={`group/btn mt-7 inline-flex h-12 w-full items-center justify-center gap-2 rounded-full text-[14.5px] font-semibold
                            transition-[background-color,transform] duration-micro ease-standard focus-ring motion-safe:active:scale-[0.98]
                            ${featured ? 'bg-accent text-ink-onAccent hover:bg-accent-hover' : 'border border-ink/15 text-ink hover:border-ink/30 hover:bg-ink/[0.03]'}`}
            >
                View full details
                <FiArrowUpRight aria-hidden="true"
                    className="h-4 w-4 transition-transform duration-ui ease-standard motion-safe:group-hover/btn:-translate-y-0.5 motion-safe:group-hover/btn:translate-x-0.5" />
            </button>
        </article>
    );

    // The featured card sits in a hatched gold frame; its notch shows the hatch.
    // `lift` (desktop grid only): a 4px rise on hover/focus. Transform on the
    // wrapper, never on the drop-shadowed surface, so the shadow is not repainted.
    const lifts = lift ? 'transition-transform duration-ui ease-standard [@media(hover:hover)]:motion-safe:hover:-translate-y-1 motion-safe:focus-within:-translate-y-1' : '';
    return featured ? (
        <div className={`rounded-[31px] p-[3px] ${lifts} ${className}`} style={{ background: HATCH }}>{card}</div>
    ) : (
        <div className={`${lifts} ${className}`}>{card}</div>
    );
}

/** The plan a phone shows first: the popular one. */
export const firstPlan = (list) => Math.max(0, list.findIndex((p) => p.isPopular));

/**
 * Phones: segmented switcher over a swipe rail, kept in sync both ways.
 * `active` is owned by the parent so the header's dash indicator can follow it.
 */
export function PlanRail({ list, onOpen, active, onActiveChange: setActive }) {
    const reduceMotion = useReducedMotion();
    const railRef = useRef(null);
    const [initial] = useState(active);
    // While a tap-driven smooth scroll runs, the listener would report every
    // slide it passes and the pill would jump to the target, spring back, then
    // crawl forward. Ignore it until the target is reached (or 600ms).
    const lock = useRef(null);
    const lockTimer = useRef(0);
    const goTo = useCallback((i, smooth = true) => {
        const rail = railRef.current;
        const slide = rail?.children[i];
        if (!rail || !slide) return;
        lock.current = i;
        clearTimeout(lockTimer.current);
        lockTimer.current = setTimeout(() => { lock.current = null; }, 600);
        rail.scrollTo({ left: slide.offsetLeft - rail.children[0].offsetLeft, behavior: smooth && !reduceMotion ? 'smooth' : 'auto' });
    }, [reduceMotion]);

    useEffect(() => { goTo(initial, false); }, [goTo, initial]);

    // Which card is centred — read on scroll, one frame at a time.
    useEffect(() => {
        const rail = railRef.current;
        if (!rail) return undefined;
        let frame = 0;
        const onScroll = () => {
            cancelAnimationFrame(frame);
            frame = requestAnimationFrame(() => {
                const first = rail.children[0];
                const step = (rail.children[1]?.offsetLeft ?? 0) - first.offsetLeft || first.offsetWidth;
                const i = Math.round(rail.scrollLeft / step);
                if (lock.current != null) {
                    if (i !== lock.current) return;
                    lock.current = null;
                }
                setActive(Math.min(list.length - 1, Math.max(0, i)));
            });
        };
        const release = () => { lock.current = null; };
        rail.addEventListener('scroll', onScroll, { passive: true });
        rail.addEventListener('scrollend', release);
        return () => {
            rail.removeEventListener('scroll', onScroll);
            rail.removeEventListener('scrollend', release);
            cancelAnimationFrame(frame);
            clearTimeout(lockTimer.current);
        };
    }, [list.length, setActive]);

    return (
        <LayoutGroup id="pricing-switch">
            <div role="group" aria-label="Choose a package"
                className="grid rounded-full bg-ink/[0.06] p-1 ring-1 ring-ink/[0.05]"
                style={{ gridTemplateColumns: `repeat(${list.length}, minmax(0, 1fr))` }}>
                {list.map((pkg, i) => {
                    const on = i === active;
                    return (
                        <button key={pkg.id ?? pkg.title} type="button" onClick={() => { setActive(i); goTo(i); }}
                            aria-current={on ? 'true' : undefined}
                            aria-label={`${pkg.title}, ${inr(pkg.offer)}`}
                            className={`relative flex min-h-[48px] flex-col items-center justify-center rounded-full px-1 py-1.5
                                        transition-[color,transform] duration-ui ease-standard focus-ring motion-safe:active:scale-[0.96]
                                        ${on ? 'text-ground' : 'text-ink-secondary hover:text-ink'}`}>
                            {on && (
                                <motion.span layoutId="plan-switch-pill" aria-hidden="true"
                                    className="absolute inset-0 rounded-full bg-ink shadow-[0_6px_14px_-6px_rgba(42,27,18,0.6)]"
                                    transition={reduceMotion ? { duration: 0 } : { type: 'spring', bounce: 0.1, duration: 0.32 }} />
                            )}
                            <span className="relative truncate text-[12.5px] font-semibold leading-tight">{shortName(pkg.title)}</span>
                            <span className={`relative text-[11px] leading-tight tabular-nums ${on ? 'text-ground/70' : 'text-ink-muted'}`}>
                                {compactInr(pkg.offer)}
                            </span>
                        </button>
                    );
                })}
            </div>

            <div ref={railRef} aria-roledescription="carousel" aria-label="Packages"
                className="-mx-5 -mb-6 mt-5 flex snap-x snap-mandatory items-start gap-3 overflow-x-auto scroll-px-5 px-5 pb-12 pt-1 scrollbar-none">
                {list.map((pkg, i) => (
                    <div key={pkg.id ?? pkg.title} role="group" aria-roledescription="slide" aria-label={`${i + 1} of ${list.length}`}
                        className={`w-[calc(100%-28px)] shrink-0 snap-start transition-opacity duration-ui ease-standard
                                    ${i === active ? '' : 'opacity-50'}`}>
                        <PlanCard pkg={pkg} onOpen={onOpen} />
                    </div>
                ))}
            </div>
        </LayoutGroup>
    );
}

/** The dash indicator from the reference: which plan of how many. */
export function PlanDashes({ count, active }) {
    return (
        <span aria-hidden="true" className="flex items-center gap-1.5">
            {Array.from({ length: count }, (_, i) => (
                <span key={i} className={`h-[3px] rounded-full transition-[width,background-color] duration-ui ease-standard
                    ${i === active ? 'w-6 bg-gold' : 'w-3.5 bg-ink/20'}`} />
            ))}
        </span>
    );
}
