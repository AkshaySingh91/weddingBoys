'use client';

/**
 * Our Approach — a hand of cards.
 *
 * Three columns on desktop: the step list on the left, a fanned deck in the
 * middle, and the active step's detail on the right. Scrolling deals the next
 * card to the front, the way you'd thumb through cards held in your hand.
 *
 * ── Mechanics ───────────────────────────────────────────────────────────────
 * The section is pinned by CSS `sticky` (never `overflow-hidden` on an
 * ancestor — that silently kills sticky in every descendant). Scroll progress
 * over the section resolves to one integer `active` index; every card then
 * animates to a slot derived from `i - active`. Because the slot is a pure
 * function of that index, scrolling fast, slow or backwards always lands on
 * the same arrangement — and the springs make the re-deal feel like a hand of
 * cards rather than a slideshow.
 *
 * The list on the left and the arrows on the right drive the same scroll
 * position, so there is exactly one source of truth.
 *
 * ── Images ──────────────────────────────────────────────────────────────────
 * `/Asset/home/our-approch-step-<n>.png`. Steps whose image is not on disk yet
 * fall back to a warm panel carrying the step number, so a missing file never
 * breaks the deck.
 *
 * Below `lg`, and under `prefers-reduced-motion`, there is no pinning and no
 * deck: each step is an ordinary block with its image above its copy.
 */
import { useEffect, useRef, useState, useCallback } from 'react';
import { motion, useScroll, useMotionValueEvent, useReducedMotion } from 'framer-motion';
import { FiArrowLeft, FiArrowRight } from 'react-icons/fi';
import Section from '@/Component/ui/Section.jsx';

const STEPS = [
    {
        number: '01',
        title: 'Initial Consultation',
        label: 'Discover your story',
        copy: 'We begin by understanding your unique vision and dreams in an in-depth consultation. Your story sets the foundation for a cinematic masterpiece.',
    },
    {
        number: '02',
        title: 'Tailored Package Creation',
        label: 'Crafted for you',
        copy: 'Our team designs a bespoke package that perfectly balances creativity with practicality, ensuring every detail is covered.',
    },
    {
        number: '03',
        title: 'Pre-Wedding Planning',
        label: 'Plan every detail',
        copy: 'We conduct venue visits, craft detailed shot lists, and meticulously plan every moment to guarantee nothing is missed.',
    },
    {
        number: '04',
        title: 'Wedding Day Magic',
        label: 'Capture it all',
        copy: 'Our skilled team captures every heartfelt moment and candid smile with artistic precision and technical excellence.',
    },
    {
        number: '05',
        title: 'Post-Production Mastery',
        label: 'A timeless keepsake',
        copy: 'Finally, we curate and refine your visuals into a timeless cinematic piece that tells your unique love story.',
    },
];

const imageFor = (i) => `/Asset/home/our-approch-step-${i + 1}.png`;

/** How much scroll each step gets while the stage is pinned. */
const VH_PER_STEP = 70;

export default function OurApproach() {
    const reduceMotion = useReducedMotion();

    return (
        <Section width="wide" rhythm="tight" id="process" aria-labelledby="approach-heading">
            {/* overflow-x-clip, never overflow-hidden: `hidden` makes this a
                scroll container and silently breaks `position: sticky` in every
                descendant, which is the mechanism the deck runs on. */}
            <div className="relative overflow-x-clip rounded-3xl bg-gradient-to-b from-[#FFDCCC] to-[#FFF0E6]">
                {reduceMotion
                    ? <PlainSteps />
                    : (
                        <>
                            <div className="lg:hidden"><PlainSteps /></div>
                            <div className="hidden lg:block"><Deck /></div>
                        </>
                    )}
            </div>
        </Section>
    );
}

/* ── The deck ────────────────────────────────────────────────────────────── */

function Deck() {
    const trackRef = useRef(null);
    const [active, setActive] = useState(0);

    const { scrollYProgress } = useScroll({
        target: trackRef,
        offset: ['start start', 'end end'],
    });

    /* One integer index, derived from scroll. Every card slot, the detail panel
       and the progress bar read it, so they cannot disagree. */
    useMotionValueEvent(scrollYProgress, 'change', (p) => {
        const next = Math.min(STEPS.length - 1, Math.max(0, Math.round(p * (STEPS.length - 1))));
        setActive((prev) => (prev === next ? prev : next));
    });

    /* The list and the arrows move the page, rather than setting state
       directly — otherwise the deck and the scroll position would disagree the
       moment you touched the wheel again. */
    const goTo = useCallback((index) => {
        const el = trackRef.current;
        if (!el) return;
        const top = el.offsetTop;
        const range = el.offsetHeight - window.innerHeight;
        const clamped = Math.min(STEPS.length - 1, Math.max(0, index));
        window.scrollTo({
            top: top + (range * clamped) / (STEPS.length - 1),
            behavior: 'smooth',
        });
    }, []);

    const step = STEPS[active];

    return (
        <div ref={trackRef} style={{ height: `${STEPS.length * VH_PER_STEP + 40}vh` }} className="relative">
            <div className="sticky top-[var(--header-height)] flex h-[calc(100svh-var(--header-height))] min-h-[600px] items-center px-7 py-10 xl:px-10">
                <div className="grid w-full grid-cols-12 items-center gap-6 xl:gap-8">

                    {/* ── Left: heading and the step list ── */}
                    <div className="col-span-4">
                        <p className="t-label flex items-center gap-3">
                            Our approach
                            <span aria-hidden="true" className="h-px w-10 bg-accent" />
                        </p>
                        {/* Was an <h1> mid-page — the last of the four the home
                            page carried (audit R-42). */}
                        <h2 id="approach-heading" className="t-display-2 mt-3 max-w-[13ch]">
                            How We Craft Your Dream Wedding Story
                        </h2>
                        <p className="t-body-sm mt-4 max-w-[30ch]">
                            Our process combines artistic vision with meticulous planning — ensuring every
                            detail of your wedding is captured with passion and precision.
                        </p>

                        <ol className="mt-7">
                            {STEPS.map((s, i) => (
                                <li key={s.number}>
                                    <StepRow
                                        step={s}
                                        isActive={i === active}
                                        isLast={i === STEPS.length - 1}
                                        onSelect={() => goTo(i)}
                                    />
                                </li>
                            ))}
                        </ol>
                    </div>

                    {/* ── Middle: the hand ── */}
                    {/* Right-anchored: the fan opens leftward, so centring the
                        deck in its column pushed the deepest card 165px into the
                        left column's copy. */}
                    <div className="col-span-4 flex items-center justify-end pr-1">
                        <div className="relative aspect-[3/4] w-full max-w-[300px]">
                            {STEPS.map((s, i) => (
                                <Card key={s.number} step={s} index={i} active={active} />
                            ))}
                        </div>
                    </div>

                    {/* ── Right: the active step ── */}
                    <div className="col-span-4">
                        <p className="t-label flex items-center gap-3">
                            <span aria-hidden="true" className="h-px w-10 bg-accent" />
                            Step {step.number} / {String(STEPS.length).padStart(2, '0')}
                        </p>

                        {/* aria-live so the detail is announced when the deck
                            deals a new card; the list on the left is the real
                            navigation. */}
                        <div aria-live="polite" aria-atomic="true">
                            <motion.h3
                                key={`${step.number}-title`}
                                initial={{ opacity: 0, y: 14 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                                className="mt-4 font-display text-[38px] font-medium leading-[1.06] text-ink xl:text-[46px]"
                            >
                                {step.title}
                            </motion.h3>
                            <motion.p
                                key={`${step.number}-copy`}
                                initial={{ opacity: 0, y: 14 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.45, delay: 0.06, ease: [0.22, 1, 0.36, 1] }}
                                className="t-body mt-5 max-w-[42ch]"
                            >
                                {step.copy}
                            </motion.p>
                        </div>

                        <div className="mt-9 flex items-center gap-5 border-t border-gold/40 pt-6">
                            <div aria-hidden="true" className="flex flex-1 items-center gap-1.5">
                                {STEPS.map((s, i) => (
                                    <span
                                        key={s.number}
                                        className={`h-[3px] flex-1 rounded-pill transition-colors duration-ui ease-standard
                                                    ${i <= active ? 'bg-accent' : 'bg-gold/35'}`}
                                    />
                                ))}
                            </div>
                            <div className="flex shrink-0 gap-2">
                                <DeckButton label="Previous step" disabled={active === 0} onClick={() => goTo(active - 1)}>
                                    <FiArrowLeft aria-hidden="true" className="h-4 w-4" />
                                </DeckButton>
                                <DeckButton label="Next step" disabled={active === STEPS.length - 1} onClick={() => goTo(active + 1)}>
                                    <FiArrowRight aria-hidden="true" className="h-4 w-4" />
                                </DeckButton>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

/**
 * One card in the hand.
 *
 * The slot is a pure function of `index - active`: cards still to come fan back
 * and to the left, the active one sits square at the front, and cards already
 * dealt slide off to the right. Springs do the travel, so a fast scroll deals
 * several cards in one continuous motion instead of snapping.
 */
function Card({ step, index, active }) {
    const rel = index - active;
    const upcoming = rel > 0;

    const slot = rel < 0
        ? { x: 150, y: 0, rotate: 8, scale: 0.92, opacity: 0 }
        : {
            x: -rel * 32,
            y: -rel * 9,
            rotate: -rel * 3,
            scale: 1 - rel * 0.045,
            opacity: rel > 3 ? 0 : 1,
        };

    return (
        <motion.figure
            animate={slot}
            initial={false}
            transition={{ type: 'spring', stiffness: 140, damping: 22, mass: 0.7 }}
            style={{ zIndex: STEPS.length - Math.abs(rel) }}
            className="absolute inset-0 origin-bottom overflow-hidden rounded-2xl border border-gold/30 bg-ground-sunk shadow-overlay"
            aria-hidden={rel !== 0}
        >
            <StepImage index={index} title={step.title} dim={upcoming} />

            {/* The number rides the card, as in a dealt hand. */}
            <figcaption
                className={`absolute left-4 top-4 font-display text-[22px] font-semibold leading-none
                            text-white drop-shadow-[0_1px_6px_rgba(0,0,0,0.55)]
                            ${upcoming ? 'opacity-80' : 'opacity-100'}`}
            >
                {step.number}
            </figcaption>
        </motion.figure>
    );
}

/**
 * The step's photograph, or a warm panel if that file is not on disk yet.
 * Only `our-approch-step-1.png` exists at the moment; the rest follow the same
 * naming, and a missing one must not leave a hole in the deck.
 */
function StepImage({ index, title, dim }) {
    const [failed, setFailed] = useState(false);

    const shade = (
        <span
            aria-hidden="true"
            className={`pointer-events-none absolute inset-0 bg-ground-deep transition-opacity duration-ui ease-standard
                        ${dim ? 'opacity-20' : 'opacity-0'}`}
        />
    );

    if (failed) {
        return (
            <>
                <div className="grid h-full w-full place-items-center bg-gradient-to-br from-accent-tint to-accent-wash">
                    <span aria-hidden="true" className="font-display text-[64px] font-semibold text-accent-ink/30">
                        {String(index + 1).padStart(2, '0')}
                    </span>
                </div>
                {shade}
            </>
        );
    }

    return (
        <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
                src={imageFor(index)}
                alt={title}
                loading={index === 0 ? 'eager' : 'lazy'}
                decoding="async"
                onError={() => setFailed(true)}
                className="h-full w-full object-cover"
            />
            {/* Cards behind the front one sit back in the light, so the active
                card reads as the one in focus. */}
            {shade}
        </>
    );
}

function StepRow({ step, isActive, isLast, onSelect }) {
    return (
        <button
            type="button"
            onClick={onSelect}
            aria-current={isActive ? 'step' : undefined}
            className="group flex w-full items-start gap-4 py-2 text-left focus-ring rounded-panel"
        >
            <span className="relative flex flex-col items-center self-stretch">
                <span
                    className={`grid h-9 w-9 shrink-0 place-items-center rounded-pill border text-[13px] font-semibold
                                transition-colors duration-ui ease-standard
                                ${isActive
                                    ? 'border-accent bg-accent text-white'
                                    : 'border-gold/45 bg-transparent text-ink-muted group-hover:border-gold-strong'}`}
                >
                    {step.number}
                </span>
                {!isLast && <span aria-hidden="true" className="mt-1 w-px flex-1 bg-gold/40" />}
            </span>

            <span className="min-w-0 pb-3">
                <span
                    className={`block text-[15px] font-semibold leading-snug transition-colors duration-ui ease-standard
                                ${isActive ? 'text-ink' : 'text-ink-secondary'}`}
                >
                    {step.title}
                </span>
                <span
                    className={`mt-0.5 block text-[11px] font-semibold uppercase tracking-[0.08em]
                                transition-colors duration-ui ease-standard
                                ${isActive ? 'text-accent-ink' : 'text-ink-muted'}`}
                >
                    {step.label}
                </span>
            </span>
        </button>
    );
}

function DeckButton({ label, disabled, onClick, children }) {
    return (
        <button
            type="button"
            onClick={onClick}
            disabled={disabled}
            aria-label={label}
            className="grid h-11 w-11 place-items-center rounded-pill border border-gold-strong/60 text-ink
                       transition-colors duration-micro ease-standard hover:bg-accent-wash hover:text-accent-ink
                       disabled:opacity-35 disabled:hover:bg-transparent disabled:hover:text-ink focus-ring"
        >
            {children}
        </button>
    );
}

/* ── Phones, tablets, and reduced motion ─────────────────────────────────── */

function PlainSteps() {
    const reduceMotion = useReducedMotion();
    return (
        <div className="px-5 py-10 sm:px-7 lg:py-14">
            <p className="t-label">Our approach</p>
            <h2 id="approach-heading" className="t-display-2 mt-2">
                How We Craft Your Dream Wedding Story
            </h2>
            <p className="t-body-lead mt-3">
                Our process combines artistic vision with meticulous planning — ensuring every
                detail of your wedding is captured with passion and precision.
            </p>

            <ol className="mt-9 space-y-8">
                {STEPS.map((step, i) => (
                    <motion.li
                        key={step.number}
                        initial={reduceMotion ? false : { opacity: 0, y: 24 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: '0px 0px -80px 0px' }}
                        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                        className="grid gap-4 sm:grid-cols-12 sm:items-center sm:gap-6"
                    >
                        <figure className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-gold/30 bg-ground-sunk sm:col-span-5 sm:aspect-[3/4]">
                            <StepImage index={i} title={step.title} dim={false} />
                        </figure>

                        <div className="sm:col-span-7">
                            <p className="t-label text-accent-ink">{step.number} · {step.label}</p>
                            <h3 className="mt-1.5 font-display text-[24px] font-semibold leading-tight text-ink">
                                {step.title}
                            </h3>
                            <p className="t-body-sm mt-2.5">{step.copy}</p>
                        </div>
                    </motion.li>
                ))}
            </ol>
        </div>
    );
}
