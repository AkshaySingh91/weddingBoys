'use client';

/**
 * The team — "scale spine" + spotlight.
 *
 *   ┃ 01 Founders           two portrait cards, the largest on the page
 *   ┃ 02 Managing Director  a wine-black card with the full-length portrait inset
 *   ┃ 03 The crew           a compact rail of square headshots, names beneath
 *
 * Hierarchy reads by size along one gold thread (phones) or one row (desktop).
 * Every person is a button: the tapped photograph morphs out of its tile
 * (shared layoutId) into a spotlight — a bottom sheet on phones, a centred card
 * from sm — where you can swipe or step through all nine in hierarchy order,
 * with an avatar strip whose accent ring slides to the current person.
 *
 * Entrances: the page's RevealObserver (data-rise). Motion respects reduced
 * motion through MotionConfig; Escape closes, arrows step, focus returns.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import { AnimatePresence, LayoutGroup, MotionConfig, motion } from 'framer-motion';
import { FiArrowLeft, FiArrowRight, FiX } from 'react-icons/fi';
import { FOUNDERS, MANAGING_DIRECTOR, CREW } from '@/lib/team.js';
import { ArrowDot, CARD_DEEP } from './Chapter.jsx';

const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-');
const TIERS = { Founder: '01', 'Managing Director': '02' };
const PEOPLE = [...FOUNDERS, MANAGING_DIRECTOR, ...CREW].map((p) => ({
    ...p, id: slug(p.name), tier: TIERS[p.role] ? `${TIERS[p.role]} · ${p.role}` : '03 · Crew',
}));
const indexOf = (name) => PEOPLE.findIndex((p) => p.name === name);
const EASE = [0.16, 1, 0.3, 1];
const MORPH = { type: 'spring', bounce: 0.12, duration: 0.5 };

/**
 * Tier label. Phones: a pill sitting on its tray's top edge, where the ribbon
 * arrives (left, right, left — following the S). md+: a plain numbered label.
 */
function Tier({ n, side = 'left', children }) {
    return (
        <p data-rise="pop"
            className={`absolute -top-[15px] z-10 inline-flex items-center gap-2 rounded-full bg-ground-raised py-1 pl-1 pr-3 text-[11px] font-semibold
                        uppercase tracking-[0.14em] text-ink ring-1 ring-gold/40 shadow-[0_6px_16px_-10px_rgba(51,22,26,0.5)]
                        ${side === 'right' ? 'right-4' : 'left-4'}
                        md:static md:flex md:bg-transparent md:p-0 md:text-[11.5px] md:tracking-[0.16em] md:text-ink-muted md:shadow-none md:ring-0`}>
            <span className="grid h-[22px] w-[22px] place-items-center rounded-full bg-gold text-[10px] tabular-nums text-ground-deep md:h-auto md:w-auto md:bg-transparent md:text-[11.5px] md:text-gold-strong">
                {n}
            </span>
            {children}
        </p>
    );
}

/**
 * The ribbon between two trays (phones only): a peach band in the trays' own
 * colour that curves from one side to the other, with a dashed gold centre line,
 * so the three tiers read as one winding path.
 */
function Ribbon({ from = 'left' }) {
    const d = from === 'left' ? 'M 14 0 C 14 30, 86 18, 86 48' : 'M 86 0 C 86 30, 14 18, 14 48';
    return (
        <svg aria-hidden="true" viewBox="0 0 100 48" preserveAspectRatio="none" className="-my-px block h-11 w-full md:hidden">
            <path d={d} fill="none" stroke="rgb(var(--accent-tint-rgb))" strokeWidth="38" vectorEffect="non-scaling-stroke" />
            <path data-rise="draw" d={d} fill="none" stroke="rgb(var(--gold-strong-rgb))" strokeWidth="1.5" strokeDasharray="3 6"
                strokeLinecap="round" vectorEffect="non-scaling-stroke" />
        </svg>
    );
}

/** Phones: the peach tray a tier sits on. md+: no tray. */
const TRAY = 'relative rounded-[30px] bg-accent-tint p-2 pt-6 md:rounded-none md:bg-transparent md:p-0';

/** The photograph a tile and the spotlight share (same layoutId = the morph). */
function Photo({ person, layoutId, sizes, className = '', imgClass = '' }) {
    return (
        <motion.div layoutId={layoutId} transition={MORPH} className={`relative overflow-hidden bg-ground-deep ${className}`}>
            <Image src={person.image} alt="" fill placeholder="blur" sizes={sizes} className={`object-cover ${imgClass}`} />
        </motion.div>
    );
}

const TILE_BTN = 'group relative block w-full cursor-pointer text-left focus-ring transition-transform duration-micro ease-standard motion-safe:active:scale-[0.97]';

function Spotlight({ index, originId, onClose, onGo }) {
    const p = PEOPLE[index];
    const closeRef = useRef(null);
    const stripRef = useRef(null);
    const [dir, setDir] = useState(1);
    const step = useCallback((d) => { setDir(d); onGo((index + d + PEOPLE.length) % PEOPLE.length); }, [index, onGo]);

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
                                <Photo person={p} layoutId={p.id === originId ? `person-${p.id}` : undefined}
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
                            {PEOPLE.map((m, k) => (
                                <button key={m.id} type="button" onClick={() => { setDir(k > index ? 1 : -1); onGo(k); }}
                                    aria-label={m.name} aria-current={k === index ? 'true' : undefined}
                                    className="relative isolate shrink-0 cursor-pointer rounded-full p-[2px] focus-ring">
                                    {k === index && <motion.span layoutId="spot-ring" aria-hidden="true" className="absolute inset-0 -z-10 rounded-full bg-accent"
                                        transition={{ type: 'spring', bounce: 0.1, duration: 0.32 }} />}
                                    <span className={`relative block h-10 w-10 overflow-hidden rounded-full ring-2 ring-ground-raised transition-opacity ${k === index ? '' : 'opacity-60'}`}>
                                        <Image src={m.image} alt="" fill sizes="40px" className="object-cover object-[50%_22%]" />
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

export default function StudioTeam() {
    const md = MANAGING_DIRECTOR;
    const [open, setOpen] = useState(null);       // index in PEOPLE, or null
    const [originId, setOriginId] = useState(null); // the tile the spotlight grew from
    const lastTrigger = useRef(null);
    // Portal target exists only in the browser; arm on first open (no effect needed).
    const [mounted, setMounted] = useState(false);
    if (open !== null && !mounted) setMounted(true);

    const openPerson = (name, e) => {
        lastTrigger.current = e.currentTarget;
        const i = indexOf(name);
        setOriginId(PEOPLE[i].id);
        setOpen(i);
    };
    const close = useCallback(() => {
        setOpen(null);
        requestAnimationFrame(() => lastTrigger.current?.focus({ preventScroll: true }));
    }, []);
    // The morph only runs back to the tile the spotlight was opened from.
    const tileId = (name) => {
        const id = slug(name);
        return open !== null && PEOPLE[open].id === id && id === originId ? undefined : `person-${id}`;
    };

    return (
        <MotionConfig reducedMotion="user">
            <LayoutGroup id="studio-team">
                <div className="relative mt-10 sm:mt-12">

                    <div className="lg:grid lg:grid-cols-12 lg:items-stretch lg:gap-5">
                        <div className="md:grid md:grid-cols-[1fr_1fr_0.9fr] md:gap-4 lg:col-span-9">
                            <div className={`${TRAY} md:col-span-2`}>
                                <Tier n="01">Founders</Tier>
                                <div className="grid grid-cols-2 gap-2 md:mt-3 md:gap-4">
                                    {FOUNDERS.map((f, k) => (
                                        <button key={f.name} type="button" onClick={(e) => openPerson(f.name, e)} aria-label={`${f.name}, ${f.role} — open`}
                                            data-rise="" style={{ '--d': k }} className={TILE_BTN}>
                                            <Photo person={f} layoutId={tileId(f.name)} sizes="(max-width: 768px) 45vw, 360px"
                                                className="aspect-[4/5] rounded-[24px] shadow-[0_18px_36px_-22px_rgba(51,22,26,0.6)] md:aspect-[3/4] md:rounded-[28px]"
                                                imgClass="object-[50%_26%]" />
                                            <span className="absolute right-2 top-2"><ArrowDot tone="glass" size="sm" /></span>
                                            <span className="absolute inset-x-1.5 bottom-1.5 rounded-[18px] bg-white/80 px-2.5 py-2 backdrop-blur-md md:inset-x-2 md:bottom-2 md:px-4 md:py-3">
                                                <span className="block truncate text-[13.5px] font-semibold leading-tight text-ink md:text-[18px]">{f.name}</span>
                                                <span className="block truncate text-[11px] text-ink-muted md:text-[13px]">{f.role}<span className="hidden md:inline"> · on set since 2015</span></span>
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <Ribbon from="left" />
                            <div className={`${TRAY} flex flex-col`}>
                                <Tier n="02" side="right">Managing Director</Tier>
                                <button type="button" onClick={(e) => openPerson(md.name, e)} aria-label={`${md.name}, ${md.role} — open`}
                                    data-rise="" style={{ '--d': 2 }}
                                    className={`${TILE_BTN} grid flex-1 grid-cols-[84px_1fr] items-center gap-4 p-2 md:mt-3 md:grid-cols-1 md:items-stretch md:gap-0 ${CARD_DEEP}`}>
                                    <Photo person={md} layoutId={tileId(md.name)} sizes="(max-width: 768px) 84px, 300px"
                                        className="aspect-[9/16] rounded-[18px] md:aspect-auto md:min-h-[260px] md:flex-1 md:rounded-[22px]" imgClass="object-top" />
                                    {/* One text column, left-aligned on a single edge: pill, name, line. */}
                                    <span className="flex min-w-0 flex-col items-start py-2 pr-11 md:px-4 md:pb-4 md:pt-4">
                                        <span className="rounded-full bg-gold px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.08em] text-ground-deep">{md.role}</span>
                                        <span className="mt-2.5 text-[26px] font-semibold leading-none tracking-[-0.02em] md:text-[30px]">{md.name}</span>
                                        <span className="mt-2 text-[13px] leading-snug text-ink-onDeep/70 md:text-[14px]">{md.line}</span>
                                    </span>
                                    <span className="absolute right-3 top-3"><ArrowDot tone="glass" size="sm" /></span>
                                </button>
                            </div>
                        </div>

                        <Ribbon from="right" />
                        <div className={`${TRAY} md:mt-8 lg:col-span-3 lg:mt-0`}>
                            <Tier n="03">The crew</Tier>
                            <ul className="flex snap-x snap-mandatory gap-2.5 overflow-x-auto rounded-[22px] scroll-px-1 px-1 pb-1.5 scrollbar-none
                                           md:mt-3 md:grid md:grid-cols-6 md:gap-4 md:overflow-visible md:px-0 lg:grid-cols-3 lg:gap-x-3 lg:gap-y-4">
                                {CREW.map((c, k) => (
                                    <li key={c.name} data-rise="" style={{ '--d': (k % 3) + 1 }} className="w-[92px] shrink-0 snap-start md:w-auto">
                                        <button type="button" onClick={(e) => openPerson(c.name, e)} aria-label={`${c.name}, ${c.role} — open`} className={TILE_BTN}>
                                            <Photo person={c} layoutId={tileId(c.name)} sizes="(max-width: 768px) 88px, 200px"
                                                className="aspect-square rounded-[18px] md:rounded-[22px]" imgClass="object-[50%_22%] transition-transform duration-media ease-entrance group-hover:scale-[1.05]" />
                                            <span className="mt-1.5 block truncate text-[12.5px] font-semibold leading-tight text-ink md:mt-2 md:text-[14px] lg:text-[12.5px]">{c.name}</span>
                                            <span className="block truncate text-[11px] text-ink-muted md:text-[12.5px] lg:text-[11px]">{c.role}</span>
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>

                {/* Portalled to <body>: the chapter is an isolated stacking context, which
                    would otherwise trap the overlay beneath the header and later sections. */}
                {mounted && createPortal(
                    <AnimatePresence>
                        {open !== null && <Spotlight index={open} originId={originId} onClose={close} onGo={setOpen} />}
                    </AnimatePresence>,
                    document.body,
                )}
            </LayoutGroup>
        </MotionConfig>
    );
}
