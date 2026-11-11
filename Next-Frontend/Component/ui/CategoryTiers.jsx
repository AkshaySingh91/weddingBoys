'use client';

/**
 * CategoryTiers (desktop) — both levels visible, fixed height.
 *
 *   row 1  Best films   Destinations 10   Events 5   Themes 14 …   (one sliding underline)
 *   row 2  [9 Destination inspiration] [6 Beach & coast] [3 Goa] …   ‹ ›
 *
 * Row 2 is a reserved 56px slot: it holds the chosen lens's sub-categories, or a
 * one-line note when the lens has a single category — so changing anything
 * never moves the page. Changing lens slides row 2 along a shared horizontal
 * axis: a lens further right brings its chips in from the right. Arrows page
 * through long rails (Themes has 14) and hide at either end.
 *
 * Row 1 is a tablist (arrow keys, Home/End); row 2 chips are buttons with
 * aria-pressed. One polite live region announces.
 */
import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { AnimatePresence, LayoutGroup, motion, useReducedMotion } from 'framer-motion';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { Pill } from './CategoryDrill.jsx';

const EASE = [0.16, 1, 0.3, 1];
const filmsLabel = (n) => `${n} film${n === 1 ? '' : 's'}`;

export default function CategoryTiers({ groups = [], group, value, onChange, label = 'Choose a category', className = '' }) {
    const uid = useId();
    const reduce = useReducedMotion();
    const railRef = useRef(null);
    const tabRefs = useRef([]);
    const [dir, setDir] = useState(1);
    const [said, setSaid] = useState('');
    const [ends, setEnds] = useState({ start: true, end: true });
    const gi = Math.max(0, groups.findIndex((g) => g.key === group));
    const current = groups[gi];

    const pickGroup = (i) => {
        const g = groups[i];
        if (!g || g.key === group) return;
        setDir(i > gi ? 1 : -1);
        const row = g.rows[0];
        onChange(g.key, row?.key);
        setSaid(g.rows.length > 1 ? `${g.label}, ${g.rows.length} categories. ${row.title}, ${filmsLabel(row.items.length)}` : `${g.label}. ${filmsLabel(row?.items?.length ?? 0)}`);
    };
    const onTabKey = (e, i) => {
        const to = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: groups.length - 1 }[e.key];
        if (to == null) return;
        e.preventDefault();
        const n = (to + groups.length) % groups.length;
        pickGroup(n);
        tabRefs.current[n]?.focus();
    };

    useLayoutEffect(() => { if (railRef.current) railRef.current.scrollLeft = 0; }, [group]);
    // Which ends of row 2 are reachable — drives the arrows.
    useEffect(() => {
        const rail = railRef.current;
        if (!rail) return undefined;
        const sync = () => setEnds({ start: rail.scrollLeft < 4, end: rail.scrollLeft + rail.clientWidth > rail.scrollWidth - 4 });
        sync();
        rail.addEventListener('scroll', sync, { passive: true });
        const ro = new ResizeObserver(sync); ro.observe(rail);
        return () => { rail.removeEventListener('scroll', sync); ro.disconnect(); };
    }, [group]);
    const page = (d) => railRef.current?.scrollBy({ left: d * railRef.current.clientWidth * 0.8, behavior: reduce ? 'auto' : 'smooth' });

    const slide = reduce
        ? { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 }, transition: { duration: 0.12 } }
        : {
            initial: { opacity: 0, x: 28 * dir },
            animate: { opacity: 1, x: 0, transition: { duration: 0.26, ease: EASE } },
            exit: { opacity: 0, x: -20 * dir, transition: { duration: 0.16, ease: 'easeIn' } },
        };

    return (
        <LayoutGroup id={uid}>
            <div className={className}>
                {/* row 1: the lenses */}
                <div role="tablist" aria-label={label} className="flex items-end gap-7 border-b border-ink/10">
                    {groups.map((g, i) => {
                        const on = i === gi;
                        return (
                            <button key={g.key} ref={(el) => { tabRefs.current[i] = el; }} type="button" role="tab"
                                aria-selected={on} tabIndex={on ? 0 : -1} onClick={() => pickGroup(i)} onKeyDown={(e) => onTabKey(e, i)}
                                className={`relative -mb-px flex cursor-pointer items-baseline gap-1.5 pb-3 pt-1 text-[15px] font-semibold transition-colors duration-ui focus-ring
                                            ${on ? 'text-ink' : 'text-ink-muted hover:text-ink'}`}>
                                {g.label}
                                {g.rows.length > 1 && <span className="text-[12px] font-medium tabular-nums text-ink-muted">{g.rows.length}</span>}
                                {on && <motion.span layoutId={`${uid}-line`} aria-hidden="true" className="absolute inset-x-0 bottom-0 h-[2px] rounded-full bg-ink"
                                    transition={reduce ? { duration: 0 } : { type: 'spring', bounce: 0.1, duration: 0.32 }} />}
                            </button>
                        );
                    })}
                </div>

                {/* row 2: the takes — a reserved slot */}
                <div className="relative mt-3 h-14 overflow-hidden">
                    <div ref={railRef} className="h-full overflow-x-auto overflow-y-hidden scrollbar-none [mask-image:linear-gradient(to_right,#000_calc(100%-56px),transparent)]">
                        <AnimatePresence mode="popLayout" initial={false}>
                            <motion.div key={current?.key} {...slide} className="flex h-full w-max items-center gap-2 py-1.5 pr-14">
                                {current && current.rows.length > 1 ? current.rows.map((r) => {
                                    const on = value === r.key;
                                    return (
                                        <button key={r.key} type="button" aria-pressed={on}
                                            onClick={() => { onChange(current.key, r.key); setSaid(`${r.title}, ${filmsLabel(r.items.length)}`); }}
                                            className={`relative isolate inline-flex h-11 shrink-0 cursor-pointer items-center gap-2 whitespace-nowrap rounded-full pl-1.5 pr-4 text-[13.5px] font-semibold
                                                        focus-ring motion-safe:active:scale-[0.96]
                                                        ${on ? 'text-ground' : 'bg-ground-raised text-ink-secondary ring-1 ring-ink/[0.08] hover:text-ink hover:ring-ink/20'}`}>
                                            {on && <Pill id={`${uid}-sub`} reduce={reduce} />}
                                            <span className={`grid h-8 min-w-8 place-items-center rounded-full px-2 text-[12px] tabular-nums ${on ? 'bg-ground text-ink' : 'bg-ink/[0.05] text-ink'}`}>{r.items.length}</span>
                                            {r.title}
                                        </button>
                                    );
                                }) : (
                                    <p className="text-[14px] text-ink-muted">
                                        {current?.rows[0]?.title || current?.label} · {filmsLabel(current?.rows[0]?.items?.length ?? 0)}, favourites first
                                    </p>
                                )}
                            </motion.div>
                        </AnimatePresence>
                    </div>
                    {!ends.start && (
                        <button type="button" onClick={() => page(-1)} aria-label="Scroll categories left"
                            className="absolute left-0 top-1/2 grid h-10 w-10 -translate-y-1/2 cursor-pointer place-items-center rounded-full bg-ground-raised text-ink shadow-[0_6px_16px_-8px_rgba(51,22,26,0.5)] ring-1 ring-ink/10 hover:bg-ground focus-ring">
                            <FiChevronLeft aria-hidden="true" className="h-4 w-4" />
                        </button>
                    )}
                    {!ends.end && (
                        <button type="button" onClick={() => page(1)} aria-label="Scroll categories right"
                            className="absolute right-0 top-1/2 grid h-10 w-10 -translate-y-1/2 cursor-pointer place-items-center rounded-full bg-ground-raised text-ink shadow-[0_6px_16px_-8px_rgba(51,22,26,0.5)] ring-1 ring-ink/10 hover:bg-ground focus-ring">
                            <FiChevronRight aria-hidden="true" className="h-4 w-4" />
                        </button>
                    )}
                </div>
                <p className="sr-only" aria-live="polite">{said}</p>
            </div>
        </LayoutGroup>
    );
}
