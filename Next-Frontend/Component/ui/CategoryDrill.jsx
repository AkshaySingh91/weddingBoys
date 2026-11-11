'use client';

/**
 * CategoryDrill (phones) — two levels of categories in ONE fixed-height row.
 *
 *   parents   [Best films] [Destinations 10›] [Events 5›] …
 *   tap a parent with sub-categories:
 *   children  [← Destinations] | [9 Destination inspiration] [6 Beach & coast] …
 *
 * The row never grows or wraps, so nothing below it moves. The tapped parent
 * chip and the back chip are one shared element (layoutId) that travels to the
 * start; the back chip lives in a persistent leading slot outside the
 * AnimatePresence so its flight is never offset by a sliding ancestor. Lists
 * cross-fade (opacity only, which projection ignores); individual chips enter
 * from the direction of travel — in from the right, back from the left.
 * A parent with a single category selects directly.
 *
 * Keyboard: chips are buttons (aria-pressed); Escape in the sub-level goes back
 * and returns focus to the parent chip. One polite live region announces.
 *
 *   <CategoryDrill groups={[{ key, label, rows: [{ key, title, items }] }]}
 *       group="destinations" value="goa" onChange={(groupKey, rowKey) => …} />
 */
import { useId, useLayoutEffect, useRef, useState } from 'react';
import { AnimatePresence, LayoutGroup, motion, useReducedMotion } from 'framer-motion';
import { FiArrowLeft, FiChevronRight } from 'react-icons/fi';

const SPRING = { type: 'spring', bounce: 0.12, duration: 0.42 };
const EASE = [0.16, 1, 0.3, 1];
const ROUND = { borderRadius: 999 };   // scale-corrected radius for layoutId morphs

const CHIP = 'relative isolate inline-flex h-11 shrink-0 cursor-pointer items-center gap-2 whitespace-nowrap rounded-full text-[13.5px] font-semibold focus-ring motion-safe:active:scale-[0.96]';
const IDLE = 'bg-ground-raised text-ink-secondary ring-1 ring-ink/[0.08] hover:text-ink hover:ring-ink/20';

export function Pill({ id, reduce }) {
    return (
        <motion.span layoutId={id} aria-hidden="true" style={ROUND}
            className="absolute inset-0 -z-10 bg-ink shadow-[0_6px_14px_-8px_rgba(51,22,26,0.7)]"
            transition={reduce ? { duration: 0 } : { type: 'spring', bounce: 0.1, duration: 0.32 }} />
    );
}

const filmsLabel = (n) => `${n} film${n === 1 ? '' : 's'}`;

export default function CategoryDrill({ groups = [], group, value, onChange, label = 'Choose a category', className = '' }) {
    const uid = useId();
    const reduce = useReducedMotion();
    const railRef = useRef(null);
    const parentRefs = useRef({});
    const [open, setOpen] = useState(null);      // the group whose sub-categories are showing
    const [dir, setDir] = useState(1);           // 1 = drilling in, -1 = going back
    const [said, setSaid] = useState('');
    const current = groups.find((g) => g.key === open);

    const drill = (g) => {
        if (g.rows.length <= 1) {
            onChange(g.key, g.rows[0]?.key);
            setSaid(`${g.label}. ${filmsLabel(g.rows[0]?.items?.length ?? 0)}`);
            return;
        }
        setDir(1);
        setOpen(g.key);
        // Keep the current sub-category if it belongs to this group, else take the first.
        const keep = group === g.key && g.rows.find((r) => r.key === value);
        const row = keep || g.rows[0];
        if (!keep) onChange(g.key, row.key);
        setSaid(`${g.label}, ${g.rows.length} categories. ${row.title}, ${filmsLabel(row.items.length)}`);
    };
    const back = () => {
        const was = open;
        setDir(-1);
        setOpen(null);
        setSaid('All categories');
        requestAnimationFrame(() => parentRefs.current[was]?.focus({ preventScroll: true }));
    };

    // A new level starts at the beginning of the row — instantly, before paint,
    // so the chip's flight is the only motion.
    useLayoutEffect(() => { if (railRef.current) railRef.current.scrollLeft = 0; }, [open]);

    const fade = reduce
        ? { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 }, transition: { duration: 0.12 } }
        : { initial: { opacity: 0 }, animate: { opacity: 1, transition: { duration: 0.22 } }, exit: { opacity: 0, transition: { duration: 0.14 } } };
    const chipIn = (i) => (reduce ? {} : {
        initial: { opacity: 0, x: 16 * dir },
        animate: { opacity: 1, x: 0, transition: { duration: 0.28, ease: EASE, delay: 0.06 + Math.min(i, 6) * 0.03 } },
    });

    return (
        <LayoutGroup id={uid}>
            <div className={`relative h-14 ${className}`}>
                <motion.div ref={railRef} layoutScroll role="group" aria-label={label}
                    onKeyDown={(e) => { if (e.key === 'Escape' && open) { e.preventDefault(); back(); } }}
                    className="-mx-5 flex h-full items-center overflow-x-auto overflow-y-hidden px-5 scrollbar-none sm:mx-0 sm:px-0
                               [mask-image:linear-gradient(to_right,transparent,#000_20px,#000_calc(100%-28px),transparent)] sm:[mask-image:linear-gradient(to_right,#000_calc(100%-40px),transparent)]">
                    {/* persistent leading slot: the way back */}
                    {current && (
                        <span className="flex shrink-0 items-center gap-2 pr-2">
                            <motion.button type="button" layoutId={`${uid}-g-${current.key}`} transition={SPRING} style={ROUND}
                                onClick={back} aria-label={`Back to all categories (now in ${current.label})`}
                                className={`${CHIP} gap-1.5 bg-ink pl-2 pr-4 text-ground shadow-[0_6px_14px_-8px_rgba(51,22,26,0.7)]`}>
                                <span className="grid h-7 w-7 place-items-center rounded-full bg-ground/15"><FiArrowLeft aria-hidden="true" className="h-4 w-4" /></span>
                                <motion.span layout="position">{current.label}</motion.span>
                            </motion.button>
                            <span aria-hidden="true" className="h-6 w-px bg-ink/15" />
                        </span>
                    )}
                    <AnimatePresence mode="popLayout" initial={false}>
                        {!current ? (
                            <motion.div key="parents" {...fade} className="flex w-max items-center gap-2 py-1.5">
                                {groups.map((g, i) => {
                                    const on = group === g.key;
                                    const many = g.rows.length > 1;
                                    const sub = on && many ? g.rows.find((r) => r.key === value)?.title : null;
                                    return (
                                        <motion.button key={g.key} ref={(el) => { parentRefs.current[g.key] = el; }} type="button"
                                            layoutId={`${uid}-g-${g.key}`} transition={SPRING} style={ROUND} {...(dir < 0 ? chipIn(i) : {})}
                                            aria-pressed={on} aria-expanded={many ? false : undefined}
                                            onClick={() => drill(g)}
                                            className={`${CHIP} pl-4 ${many ? 'pr-2' : 'pr-4'} ${on ? 'text-ground' : IDLE}`}>
                                            {on && <Pill id={`${uid}-pill`} reduce={reduce} />}
                                            <motion.span layout="position">{g.label}</motion.span>
                                            {sub && <span className="max-w-[9rem] truncate font-medium text-ground/70">· {sub}</span>}
                                            {many && (
                                                <span className={`inline-flex h-7 items-center gap-0.5 rounded-full pl-2 pr-1 text-[11.5px] tabular-nums
                                                                  ${on ? 'bg-ground/15 text-ground' : 'bg-ink/[0.05] text-ink-muted'}`}>
                                                    {g.rows.length}<FiChevronRight aria-hidden="true" className="h-3.5 w-3.5" />
                                                </span>
                                            )}
                                        </motion.button>
                                    );
                                })}
                            </motion.div>
                        ) : (
                            <motion.div key={`children-${current.key}`} {...fade} className="flex w-max items-center gap-2 py-1.5">
                                {current.rows.map((r, i) => {
                                    const on = value === r.key;
                                    return (
                                        <motion.button key={r.key} type="button" {...chipIn(i)} aria-pressed={on}
                                            onClick={() => { onChange(current.key, r.key); setSaid(`${r.title}, ${filmsLabel(r.items.length)}`); }}
                                            className={`${CHIP} pl-1.5 pr-4 ${on ? 'text-ground' : IDLE}`}>
                                            {on && <Pill id={`${uid}-sub`} reduce={reduce} />}
                                            <span className={`grid h-8 min-w-8 place-items-center rounded-full px-2 text-[12px] tabular-nums ${on ? 'bg-ground text-ink' : 'bg-ink/[0.05] text-ink'}`}>
                                                {r.items.length}
                                            </span>
                                            {r.title}
                                        </motion.button>
                                    );
                                })}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>
                <p className="sr-only" aria-live="polite">{said}</p>
            </div>
        </LayoutGroup>
    );
}
