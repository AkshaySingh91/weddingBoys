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
import { useCallback, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, LayoutGroup, MotionConfig } from 'framer-motion';
import { FOUNDERS, MANAGING_DIRECTOR, CREW } from '@/lib/team.js';
import Photo from '@/Component/team/Portrait.jsx';
import PersonSpotlight from '@/Component/team/PersonSpotlight.jsx';
import { ArrowDot, CARD_DEEP } from './Chapter.jsx';

const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-');
const TIERS = { Founder: '01', 'Managing Director': '02' };
const PEOPLE = [...FOUNDERS, MANAGING_DIRECTOR, ...CREW].map((p) => ({
    ...p, id: slug(p.name), tier: TIERS[p.role] ? `${TIERS[p.role]} · ${p.role}` : '03 · Crew',
}));
const indexOf = (name) => PEOPLE.findIndex((p) => p.name === name);

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

const TILE_BTN = 'group relative block w-full cursor-pointer text-left focus-ring transition-transform duration-micro ease-standard motion-safe:active:scale-[0.97]';

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
                        {open !== null && <PersonSpotlight people={PEOPLE} index={open} originId={originId} onClose={close} onGo={setOpen} />}
                    </AnimatePresence>,
                    document.body,
                )}
            </LayoutGroup>
        </MotionConfig>
    );
}
