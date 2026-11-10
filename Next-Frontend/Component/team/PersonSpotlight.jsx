'use client';

/**
 * The spotlight: a tapped portrait morphs out of its tile (shared layoutId
 * `person-<id>`) into a card — a bottom sheet on phones, centred from sm — where
 * you can swipe or step through everyone, with an avatar strip whose accent ring
 * slides to the current person. Shared by the home team section and /team.
 *
 * people: [{ id, name, role, tier (label), image | src+variants }]
 * Render inside a portal to <body> and an <AnimatePresence>.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, LayoutGroup, motion } from 'framer-motion';
import { FiArrowLeft, FiArrowRight, FiX } from 'react-icons/fi';
import Portrait, { PortraitImage } from './Portrait.jsx';

const EASE = [0.16, 1, 0.3, 1];

export default function PersonSpotlight({ people, index, originId, onClose, onGo }) {
    const p = people[index];
    const closeRef = useRef(null);
    const stripRef = useRef(null);
    const [dir, setDir] = useState(1);
    const step = useCallback((d) => { setDir(d); onGo((index + d + people.length) % people.length); }, [index, onGo, people.length]);

    useEffect(() => {
        const { overflow } = document.body.style;
        document.body.style.overflow = 'hidden';
        closeRef.current?.focus({ preventScroll: true });
        const onKey = (e) => {
            if (e.key === 'Escape') onClose();
            if (e.key === 'ArrowRight') step(1);
            if (e.key === 'ArrowLeft') step(-1);
        };
        document.addEventListener('keydown', onKey);
        return () => { document.body.style.overflow = overflow; document.removeEventListener('keydown', onKey); };
    }, [onClose, step]);

    // Keep the current avatar in view in the strip.
    useEffect(() => {
        const strip = stripRef.current; const el = strip?.children[index];
        if (strip && el) strip.scrollTo({ left: el.offsetLeft - strip.clientWidth / 2 + el.clientWidth / 2, behavior: 'smooth' });
    }, [index]);

    return (
        <div className="fixed inset-0 z-modal">
            <motion.button type="button" aria-label="Close" tabIndex={-1} onClick={onClose}
                className="absolute inset-0 h-full w-full cursor-default backdrop-blur-xl"
                style={{ background: 'radial-gradient(120% 70% at 50% 100%, rgb(var(--accent-tint-rgb) / 0.85), transparent 70%), rgb(var(--ground-rgb) / 0.62)' }}
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }} />
            <div className="pointer-events-none absolute inset-0 flex items-end justify-center p-3 sm:items-center">
                <motion.div role="dialog" aria-modal="true" aria-label={`${p.name}, ${p.role}`}
                    className="pointer-events-auto w-full max-w-[420px] rounded-[32px] bg-ground-raised p-2 ring-1 ring-ink/[0.06] shadow-[0_30px_70px_-24px_rgba(51,22,26,0.55)]"
                    initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 24 }} transition={{ duration: 0.32, ease: EASE }}>
                    <motion.div className="relative" drag="x" dragConstraints={{ left: 0, right: 0 }} dragElastic={0.18}
                        onDragEnd={(_, info) => { if (info.offset.x < -60 || info.velocity.x < -400) step(1); else if (info.offset.x > 60 || info.velocity.x > 400) step(-1); }}>
                        <AnimatePresence initial={false} mode="popLayout" custom={dir}>
                            <motion.div key={p.id} custom={dir}
                                initial={p.id === originId ? false : { opacity: 0, x: dir * 40 }}
                                animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: dir * -40 }} transition={{ duration: 0.3, ease: EASE }}>
                                <Portrait person={p} layoutId={p.id === originId ? `person-${p.id}` : undefined}
                                    sizes="420px" className="aspect-[4/5] rounded-[26px]" imgClass="object-[50%_22%]" />
                            </motion.div>
                        </AnimatePresence>
                        <span className="absolute left-3 top-3 rounded-full bg-white/80 px-3 py-1.5 text-[12px] font-semibold text-ink backdrop-blur-md">{p.tier}</span>
                        <button ref={closeRef} type="button" onClick={onClose} aria-label="Close"
                            className="absolute right-3 top-3 grid h-10 w-10 cursor-pointer place-items-center rounded-full bg-white/80 text-ink backdrop-blur-md focus-ring">
                            <FiX aria-hidden="true" className="h-5 w-5" />
                        </button>
                    </motion.div>

                    <div className="flex items-end justify-between gap-3 px-3 pb-2 pt-4">
                        <motion.div key={p.id} initial={{ opacity: 0, x: dir * 12 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.26, ease: EASE }} aria-live="polite">
                            <p className="text-[24px] font-semibold leading-tight tracking-[-0.02em] text-ink">{p.name}</p>
                            <p className="text-[14px] text-accent-ink">{p.role}</p>
                        </motion.div>
                        <span className="flex shrink-0 gap-2">
                            <button type="button" onClick={() => step(-1)} aria-label="Previous person"
                                className="grid h-11 w-11 cursor-pointer place-items-center rounded-full bg-ink/[0.05] text-ink hover:bg-ink/10 focus-ring">
                                <FiArrowLeft aria-hidden="true" className="h-4 w-4" />
                            </button>
                            <button type="button" onClick={() => step(1)} aria-label="Next person"
                                className="grid h-11 w-11 cursor-pointer place-items-center rounded-full bg-ink text-ground hover:bg-ink/90 focus-ring">
                                <FiArrowRight aria-hidden="true" className="h-4 w-4" />
                            </button>
                        </span>
                    </div>

                    <LayoutGroup id="spotlight-strip">
                        <div ref={stripRef} className="flex gap-2 overflow-x-auto px-2 pb-2 pt-1 scrollbar-none" role="group" aria-label="Everyone">
                            {people.map((m, k) => (
                                <button key={m.id} type="button" onClick={() => { setDir(k > index ? 1 : -1); onGo(k); }}
                                    aria-label={m.name} aria-current={k === index ? 'true' : undefined}
                                    className="relative isolate shrink-0 cursor-pointer rounded-full p-[2px] focus-ring">
                                    {k === index && <motion.span layoutId="spot-ring" aria-hidden="true" className="absolute inset-0 -z-10 rounded-full bg-accent"
                                        transition={{ type: 'spring', bounce: 0.1, duration: 0.32 }} />}
                                    <span className={`relative block h-10 w-10 overflow-hidden rounded-full ring-2 ring-ground-raised transition-opacity ${k === index ? '' : 'opacity-60'}`}>
                                        <PortraitImage person={m} sizes="40px" className="object-[50%_22%]" />
                                    </span>
                                </button>
                            ))}
                        </div>
                    </LayoutGroup>
                </motion.div>
            </div>
        </div>
    );
}
