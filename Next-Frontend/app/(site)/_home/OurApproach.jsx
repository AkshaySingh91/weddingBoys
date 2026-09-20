'use client';

/**
 * Our Approach — sticky stacking cards.
 *
 * Replaces the vertical timeline (centre line, five numbered nodes, alternating
 * text blocks, icons hung on the line).
 *
 * Mechanics: one `useScroll` over the list drives everything — card scale, the
 * step counter and the progress line all read the same normalised progress, so
 * they cannot fall out of step. Each card is `position: sticky`, so the stack
 * piles up as you scroll and unpiles as you scroll back; scaling each card down
 * as the next arrives is what reads as depth. Nothing is a one-shot animation,
 * so fast, slow and reverse scrolling all land on the same state.
 *
 * Deviations from the brief, deliberate:
 *  - Bodoni Moda rather than Playfair/Cormorant — it is the site's display face
 *    and every other section heading was just unified onto it.
 *  - No glassmorphism: it is on this project's anti-pattern list. Depth comes
 *    from the shadow, the hairline and the scale offset instead.
 *  - Existing ground / gold / accent tokens rather than new hex values.
 *
 * Below `md`, and under `prefers-reduced-motion`, there is no stacking at all:
 * the steps render as a plain vertical list with a simple entry fade.
 */
import { useRef } from 'react';
import { motion, useScroll, useSpring, useTransform, useReducedMotion } from 'framer-motion';
import { FiPhone, FiFeather, FiMapPin, FiCamera, FiFilm } from 'react-icons/fi';
import Section from '@/Component/ui/Section.jsx';

const STEPS = [
    {
        number: '01',
        title: 'Initial Consultation',
        copy: 'We begin by understanding your unique vision and dreams in an in-depth consultation. Your story sets the foundation for a cinematic masterpiece.',
        Icon: FiPhone,
        theme: 'Discovery',
    },
    {
        number: '02',
        title: 'Tailored Package Creation',
        copy: 'Our team designs a bespoke package that perfectly balances creativity with practicality, ensuring every detail is covered.',
        Icon: FiFeather,
        theme: 'Customisation',
    },
    {
        number: '03',
        title: 'Pre-Wedding Planning',
        copy: 'We conduct venue visits, craft detailed shot lists, and meticulously plan every moment to guarantee nothing is missed.',
        Icon: FiMapPin,
        theme: 'Planning',
    },
    {
        number: '04',
        title: 'Wedding Day Magic',
        copy: 'Our skilled team captures every heartfelt moment and candid smile with artistic precision and technical excellence.',
        Icon: FiCamera,
        theme: 'The day itself',
    },
    {
        number: '05',
        title: 'Post-Production Mastery',
        copy: 'Finally, we curate and refine your visuals into a timeless cinematic piece that tells your unique love story.',
        Icon: FiFilm,
        theme: 'Storytelling',
    },
];

export default function OurApproach() {
    const reduceMotion = useReducedMotion();

    return (
        <Section width="wide" rhythm="tight" id="process" aria-labelledby="approach-heading">
            {/* overflow-x-clip, NOT overflow-hidden: `hidden` makes this a
                scroll container and silently breaks `position: sticky` in every
                descendant — which is the whole mechanism this section runs on.
                Measured: the counter scrolled 1123px off the top. */}
            <div className="relative overflow-x-clip lg:rounded-3xl sm:rounded-lg bg-gradient-to-b from-[#FFDCCC] to-[#FFF0E6] px-5 py-10 sm:px-7 lg:py-14">
                <header className="relative z-10">
                    <p className="t-label">Our approach</p>
                    {/* Was an <h1> mid-page — the last of the four the home page
                        carried (audit R-42). */}
                    <h2 id="approach-heading" className="t-display-2 mt-2">
                        How We Craft Your Dream Wedding Story
                    </h2>
                    <p className="t-body-lead mt-3">
                        Our process combines artistic vision with meticulous planning — ensuring every
                        detail of your wedding is captured with passion and precision.
                    </p>
                </header>

                {/* ── Phones, and anyone who asked for reduced motion: a plain
                       vertical list. No stacking, no pinning. ── */}
                <ol className="mt-10 space-y-4 md:hidden">
                    {STEPS.map((step) => (
                        <motion.li
                            key={step.number}
                            initial={reduceMotion ? false : { opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: '0px 0px -80px 0px' }}
                            transition={{ duration: 0.5 }}
                        >
                            <StepCard step={step} />
                        </motion.li>
                    ))}
                </ol>

                {/* ── md and up ── */}
                <div className="hidden md:block">
                    {reduceMotion
                        ? (
                            <ol className="mt-10 space-y-4">
                                {STEPS.map((step) => (
                                    <li key={step.number}><StepCard step={step} /></li>
                                ))}
                            </ol>
                        )
                        : <StackedSteps />}
                </div>
            </div>
        </Section>
    );
}

/**
 * The scrolling stack.
 *
 * `useScroll` lives here rather than in the parent because it needs its target
 * ref to be mounted. Hooks cannot be conditional, so calling it in the parent
 * meant it still ran under `prefers-reduced-motion` — where this list is never
 * rendered — and Framer threw "Target ref is defined but not hydrated". Moving
 * it into the component that owns the ref means it only ever runs when the ref
 * is really on the page.
 */
function StackedSteps() {
    const containerRef = useRef(null);
    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ['start start', 'end end'],
    });

    /* One spring, shared. The counter and the progress line read this rather
       than the raw value so they carry the same weight as the cards. */
    const progress = useSpring(scrollYProgress, { stiffness: 120, damping: 28, mass: 0.4 });

    return (
        <>
            <StepMeter progress={progress} />
            <ol ref={containerRef} className="relative mt-6">
                {STEPS.map((step, i) => (
                    <StickyStep
                        key={step.number}
                        step={step}
                        index={i}
                        total={STEPS.length}
                        progress={scrollYProgress}
                    />
                ))}
            </ol>
        </>
    );
}

/**
 * Step counter and progress line.
 *
 * The counter is a masked column of numbers translated by whole steps, so it
 * ticks between figures instead of smearing through half-rendered digits.
 */
function StepMeter({ progress }) {
    const total = STEPS.length;
    const stepIndex = useTransform(progress, (p) =>
        Math.min(total - 1, Math.max(0, Math.round(p * (total - 1)))));
    /* A percentage `y` resolves against the animated element's own height —
       the whole column — so `-200%` moved it two COLUMNS, not two digits
       (measured -280px where -56px was wanted). One digit is 100/total % of
       the column. */
    const tickerY = useSpring(
        useTransform(stepIndex, (i) => `${(-i * 100) / total}%`),
        { stiffness: 220, damping: 30, mass: 0.35 },
    );
    const fill = useTransform(progress, [0, 1], ['0%', '100%']);

    return (
        <div className="sticky top-[calc(var(--header-height)+16px)] z-20 flex items-center gap-4 py-4">
            <p className="flex items-baseline font-display text-[28px] font-semibold leading-none text-accent-ink">
                <span aria-hidden="true" className="block h-[1em] overflow-hidden">
                    <motion.span className="block" style={{ y: tickerY }}>
                        {STEPS.map((s) => (
                            <span key={s.number} className="block h-[1em] leading-none">{s.number}</span>
                        ))}
                    </motion.span>
                </span>
                <span className="ml-1 text-[18px] text-ink-muted">/ {String(total).padStart(2, '0')}</span>
            </p>

            <span aria-hidden="true" className="relative h-px flex-1 overflow-hidden bg-gold/40">
                <motion.span className="absolute inset-y-0 left-0 bg-accent" style={{ width: fill }} />
            </span>
        </div>
    );
}

/**
 * One card in the stack.
 *
 * Sticky, so it holds while the next scrolls up beneath it and then stays put
 * as that one lands on top. `scale` shrinks it once the following card begins
 * its approach; the small `top` offset per index keeps the edge of each earlier
 * card visible so the pile stays legible rather than becoming one slab.
 */
function StickyStep({ step, index, total, progress }) {
    const start = index / total;
    const targetScale = 1 - (total - index) * 0.02;
    const scale = useTransform(progress, [start, 1], [1, targetScale]);

    return (
        <li
            className="sticky h-[54vh]"
            style={{ top: `calc(var(--header-height) + 92px + ${index * 14}px)` }}
        >
            {/* No opacity on the card. Dimming a stacked card makes it
                translucent, and the cards beneath read straight through it —
                measured 0.75 on the topmost, with two earlier headings legible
                through it. Depth comes from scale and shadow instead. */}
            <motion.div style={{ scale }} className="origin-top will-change-transform">
                <StepCard step={step} large />
            </motion.div>
        </li>
    );
}

/** The card itself — identical in the stack and in the mobile list. */
function StepCard({ step, large = false }) {
    const { number, title, copy, Icon, theme } = step;
    return (
        <article
            className={`rounded-media border border-gold/35 bg-ground-raised shadow-panel
                        ${large ? 'flex min-h-[38vh] items-center p-7 lg:p-10' : 'p-5'}`}
        >
            <div className="relative flex w-full items-start gap-4">
                {large && (
                    <span
                        aria-hidden="true"
                        className="pointer-events-none absolute right-0 top-1/2 hidden -translate-y-1/2
                                   select-none font-display text-[110px] leading-none text-ink/[0.06] lg:block"
                    >
                        {number}
                    </span>
                )}
                <span
                    aria-hidden="true"
                    className={`grid shrink-0 place-items-center rounded-pill border border-gold/50
                                bg-accent-wash text-accent-ink ${large ? 'h-14 w-14' : 'h-11 w-11'}`}
                >
                    <Icon className={large ? 'h-6 w-6' : 'h-5 w-5'} />
                </span>

                <div className="min-w-0">
                    <p className="t-label">{number} · {theme}</p>
                    <h3 className={`mt-1.5 font-display font-semibold leading-tight text-ink
                                    ${large ? 'text-[26px] lg:text-[32px]' : 'text-[20px]'}`}>
                        {title}
                    </h3>
                    <p className={`mt-3 max-w-[54ch] leading-relaxed text-ink-secondary
                                   ${large ? 'text-[16px]' : 'text-[14px]'}`}>
                        {copy}
                    </p>
                </div>
            </div>
        </article>
    );
}
