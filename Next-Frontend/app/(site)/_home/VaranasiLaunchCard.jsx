'use client';

/**
 * Varanasi — "A day on the ghats".
 *
 * The new branch, sold as one day in the city, in the three moments the
 * Varanasi page films: Dawn (the dawn voyage), Afternoon (the heritage walk),
 * Dusk (the Aarti sequence). Each moment changes the photograph, the sky tint
 * and the story; diyas drift along the river, brightest at the Aarti.
 *
 *   Desktop  a wide night stage with a sun-path arc along the bottom. A diya
 *            travels the arc between the three stops (motion value → SVG
 *            attributes, no re-render per frame) and leaves a gold trail.
 *   Phones   a story: three progress dashes over a 4:5 stage, swipe between
 *            moments; the story and CTA sit below.
 *
 * Auto-advance only while in view, the tab is visible and nobody is hovering,
 * focusing or holding it; never under reduced motion. All three moments are in
 * the server HTML (tab panels), so the copy is crawlable.
 *
 * AI PLACEHOLDER: the afternoon moment has no photograph of a couple in a
 * gali yet — see AI_PLACEHOLDERS below for the file name and prompt.
 */
import { memo, useCallback, useEffect, useId, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { animate, motion, MotionConfig, useMotionValue, useTransform } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { FiArrowUpRight, FiClock, FiPause, FiPlay } from 'react-icons/fi';
import dawnWide from '@/Asset/Varanasi/varanasi-boat-intimate.png';
import dawnTall from '@/Asset/Varanasi/fragmentRiver.png';
import galiStandIn from '@/Asset/Varanasi/culture-ghats.png';
import aarti from '@/Asset/Varanasi/culture-aarti.png';

/**
 * Images to generate and drop in. Until then the slot shows the stand-in with a
 * visible "AI placeholder" tag so it cannot ship unnoticed.
 */
export const AI_PLACEHOLDERS = {
    gali: {
        file: 'Asset/Varanasi/varanasi-gali-couple.png',
        size: '2400 × 1600 (3:2), couple right of centre (~two-thirds across) — the copy sits on the left on desktop',
        // When the file exists: replace the `galiStandIn` import with it and delete `placeholder: 'gali'`.
    },
};

const MOMENTS = [
    {
        key: 'dawn', time: 'Dawn', when: 'Before the city wakes',
        title: 'The Dawn Voyage', sub: 'Just you and the river',
        body: 'A boat to the middle of the misty Ganga before sunrise. No crowds, no noise: only the two of you as the first light reaches the water.',
        wide: dawnWide, tall: dawnTall, posWide: '50% 55%', posTall: '50% 62%', flipWide: true,
        sky: 'radial-gradient(120% 80% at 70% 0%, rgba(244,179,122,0.45), transparent 60%)', diyas: 0.4,
    },
    {
        key: 'gali', time: 'Afternoon', when: 'In the old city',
        title: 'The Heritage Walk', sub: 'Texture, alleys and time',
        body: 'Narrow galis, carved wooden doors and marigold-draped corridors. Varanasi is a film set at every corner, made for raw, candid portraits.',
        wide: galiStandIn, tall: galiStandIn, posWide: '50% 60%', posTall: '64% 55%', placeholder: 'gali',
        sky: 'radial-gradient(120% 80% at 30% 0%, rgba(255,226,170,0.32), transparent 62%)', diyas: 0.15,
    },
    {
        key: 'aarti', time: 'Dusk', when: 'At the Ganga Aarti',
        title: 'The Aarti Sequence', sub: 'Silhouettes in sacred fire',
        body: 'Your film lit by the flames of the Ganga Aarti: the two of you framed against the fire, the bells and the river at night.',
        wide: aarti, tall: aarti, posWide: '40% 45%', posTall: '22% 50%', flipWide: true,
        sky: 'radial-gradient(120% 90% at 60% 100%, rgba(232,120,40,0.35), transparent 60%)', diyas: 1,
    },
];

const STEP_MS = 6500;
const EASE = [0.16, 1, 0.3, 1];

/* ── Offer (optional, from env) ───────────────────────────────────────────── */
const DEADLINE = Date.parse(process.env.NEXT_PUBLIC_VARANASI_OFFER_ENDS_AT || '');
const OFFER_LABEL = process.env.NEXT_PUBLIC_VARANASI_OFFER_LABEL || 'Varanasi booking offer';

const Offer = memo(function Offer() {
    const [left, setLeft] = useState(null);
    useEffect(() => {
        if (!Number.isFinite(DEADLINE)) return undefined;
        const tick = () => setLeft(Math.max(0, DEADLINE - Date.now()));
        tick();
        const t = setInterval(tick, 60_000);
        return () => clearInterval(t);
    }, []);
    if (!Number.isFinite(DEADLINE) || !left) return null;
    const d = Math.floor(left / 86_400_000); const h = Math.floor(left / 3_600_000) % 24;
    return (
        <p className="mt-4 inline-flex items-center gap-2 rounded-full bg-white/[0.08] px-3 py-1.5 text-[12.5px] text-ink-onDeep/85 ring-1 ring-white/10">
            <FiClock aria-hidden="true" className="h-3.5 w-3.5 text-gold" />
            {OFFER_LABEL}: <span className="font-semibold tabular-nums text-ink-onDeep">{d}d {h}h</span> left
        </p>
    );
});

/* ── Pieces ───────────────────────────────────────────────────────────────── */

/** Diyas on the river: few, slow, paused off-screen (data-live on the stage). */
const DIYAS = [
    { top: '8%', dur: 46, delay: -4, scale: 1 },
    { top: '34%', dur: 58, delay: -22, scale: 0.8 },
    { top: '18%', dur: 52, delay: -37, scale: 0.9 },
    { top: '52%', dur: 64, delay: -12, scale: 0.7 },
    { top: '70%', dur: 49, delay: -30, scale: 0.85 },
];
function Diyas({ strength }) {
    return (
        <span aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 h-[26%] overflow-hidden transition-opacity duration-[1200ms]"
            style={{ opacity: strength }}>
            {DIYAS.map((d, i) => (
                <span key={i} className="diya-drift absolute left-0" style={{ top: d.top, animationDuration: `${d.dur}s`, animationDelay: `${d.delay}s` }}>
                    <span className="diya-bob block" style={{ transform: `scale(${d.scale})`, animationDelay: `${i * -0.7}s`, '--i': i }}>
                        <span className="diya-flame mx-auto block h-[9px] w-[6px] rounded-[50%_50%_45%_45%] bg-[#FFD27A]" />
                        <span className="mt-[1px] block h-[4px] w-[16px] rounded-b-full bg-[#8A4B22]" />
                    </span>
                </span>
            ))}
        </span>
    );
}

function Photo({ m, on, tall, priority }) {
    return (
        <div className={`absolute inset-0 transition-opacity duration-[900ms] ease-entrance ${on ? 'opacity-100' : 'opacity-0'}`} aria-hidden={on ? undefined : true}>
            {/* the mirror lives on a wrapper: the zoom animation owns the image's transform */}
            <div className={`absolute inset-0 ${!tall && m.flipWide ? '-scale-x-100' : ''}`}>
                <Image src={tall ? m.tall : m.wide} alt={on ? `${m.title}: ${m.sub}` : ''} fill placeholder="blur"
                    sizes={tall ? '(max-width: 1023px) 100vw, 1px' : '(max-width: 1023px) 1px, 1400px'}
                    loading={priority ? 'eager' : 'lazy'}
                    className={`object-cover ${on ? 'motion-safe:animate-[heroZoom_9s_ease-out_both]' : ''}`}
                    style={{ objectPosition: tall ? m.posTall : m.posWide }} />
            </div>
            {m.placeholder && (
                <span className="absolute right-3 top-16 z-20 rounded-lg border border-dashed border-gold/80 bg-black/55 px-2.5 py-1.5 text-[10.5px] font-semibold uppercase tracking-[0.14em] text-gold lg:right-20 lg:top-6">
                    AI placeholder · {AI_PLACEHOLDERS[m.placeholder].file.split('/').pop()}
                </span>
            )}
        </div>
    );
}

/* Sun-path arc (desktop): quadratic Bézier, three stops along it. */
const P0 = { x: 30, y: 180 }; const P1 = { x: 500, y: -40 }; const P2 = { x: 970, y: 180 };
const STOPS = [0.14, 0.5, 0.86];
const bez = (t, k) => (1 - t) ** 2 * P0[k] + 2 * (1 - t) * t * P1[k] + t ** 2 * P2[k];
const ARC = `M ${P0.x} ${P0.y} Q ${P1.x} ${P1.y} ${P2.x} ${P2.y}`;

function SunArc({ active, onPick, tabIds, panelIds }) {
    const t = useMotionValue(STOPS[0]);
    const cx = useTransform(t, (v) => bez(v, 'x'));
    const cy = useTransform(t, (v) => bez(v, 'y'));
    const trail = useTransform(t, (v) => v);
    useEffect(() => {
        const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        const c = animate(t, STOPS[active], reduce ? { duration: 0 } : { duration: 1.1, ease: EASE });
        return () => c.stop();
    }, [active, t]);

    return (
        <div className="relative">
            <svg viewBox="0 0 1000 200" className="block h-auto w-full overflow-visible" aria-hidden="true">
                <defs>
                    <radialGradient id="diya-glow"><stop offset="0" stopColor="#FFD27A" stopOpacity="0.9" /><stop offset="1" stopColor="#FFB347" stopOpacity="0" /></radialGradient>
                </defs>
                <path d={ARC} fill="none" stroke="rgba(251,246,238,0.22)" strokeWidth="1.5" strokeDasharray="2 7" strokeLinecap="round" />
                <motion.path d={ARC} fill="none" stroke="rgb(var(--gold-rgb))" strokeWidth="2" strokeLinecap="round" style={{ pathLength: trail }} />
                {STOPS.map((s, i) => (
                    <circle key={s} cx={bez(s, 'x')} cy={bez(s, 'y')} r={i === active ? 6 : 4.5}
                        fill={i === active ? 'rgb(var(--gold-rgb))' : 'rgba(251,246,238,0.55)'} className="transition-all duration-ui" />
                ))}
                <motion.circle cx={cx} cy={cy} r="26" fill="url(#diya-glow)" className="diya-pulse" />
                <motion.circle cx={cx} cy={cy} r="5" fill="#FFE3A3" />
            </svg>
            {/* stop labels: the real tabs */}
            <div role="tablist" aria-label="A day on the ghats" className="absolute inset-0">
                {MOMENTS.map((m, i) => (
                    <button key={m.key} id={tabIds[i]} role="tab" type="button" aria-selected={i === active} aria-controls={panelIds[i]}
                        tabIndex={i === active ? 0 : -1} onClick={() => onPick(i)}
                        onKeyDown={(e) => {
                            if (e.key === 'ArrowRight') { e.preventDefault(); onPick((i + 1) % 3); document.getElementById(tabIds[(i + 1) % 3])?.focus(); }
                            if (e.key === 'ArrowLeft') { e.preventDefault(); onPick((i + 2) % 3); document.getElementById(tabIds[(i + 2) % 3])?.focus(); }
                        }}
                        className="group absolute -translate-x-1/2 cursor-pointer rounded-2xl px-3 py-2 text-center focus-ring"
                        style={{ left: `${(bez(STOPS[i], 'x') / 1000) * 100}%`, top: `${(bez(STOPS[i], 'y') / 200) * 100 + 7}%` }}>
                        <span className={`block text-[11px] font-semibold uppercase tracking-[0.2em] transition-colors ${i === active ? 'text-gold' : 'text-ink-onDeep/55 group-hover:text-ink-onDeep/85'}`}>{m.time}</span>
                        <span className={`mt-0.5 block whitespace-nowrap text-[14px] font-semibold transition-colors ${i === active ? 'text-ink-onDeep' : 'text-ink-onDeep/60 group-hover:text-ink-onDeep'}`}>{m.title}</span>
                    </button>
                ))}
            </div>
        </div>
    );
}

function Cta({ className = '' }) {
    return (
        <Link href="/varanasi"
            className={`cta-ember group relative isolate inline-flex h-[52px] items-center justify-between gap-4 whitespace-nowrap rounded-full bg-accent pl-6 pr-1.5 text-[15px] font-semibold text-ink-onAccent
                        shadow-[0_14px_34px_-14px_rgba(196,47,47,0.75)] transition-[background-color,transform] duration-ui ease-standard hover:bg-accent-hover
                        motion-safe:active:scale-[0.97] focus-ring ${className}`}>
            Step onto the ghats
            <span aria-hidden="true" className="relative grid h-10 w-10 place-items-center rounded-full bg-white/15">
                <span className="diya-flame absolute -top-1.5 h-[7px] w-[5px] rounded-[50%_50%_45%_45%] bg-[#FFD27A] opacity-0 transition-opacity duration-ui group-hover:opacity-100" />
                <FiArrowUpRight className="h-4 w-4 transition-transform duration-ui group-hover:-translate-y-px group-hover:translate-x-px" />
            </span>
        </Link>
    );
}

function Story({ m, i, active, panelId, tabId }) {
    const on = i === active;
    return (
        <div id={panelId} role="tabpanel" aria-labelledby={tabId} hidden={!on}>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-gold">{m.time} · {m.when}</p>
            <motion.div key={m.key} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: EASE }}>
                <h3 className="mt-2 text-[24px] font-semibold leading-tight tracking-[-0.02em] text-ink-onDeep sm:text-[28px]">{m.title}</h3>
                <p className="text-[14.5px] text-ink-onDeep/60">{m.sub}</p>
                <p className="mt-3 max-w-md text-[15px] leading-relaxed text-ink-onDeep/80">{m.body}</p>
            </motion.div>
        </div>
    );
}

/* ── Section ──────────────────────────────────────────────────────────────── */

function VaranasiLaunchCard() {
    const uid = useId();
    const tabIds = MOMENTS.map((m) => `${uid}-tab-${m.key}`);
    const panelIds = MOMENTS.map((m) => `${uid}-panel-${m.key}`);
    const [active, setActive] = useState(0);
    const [held, setHeld] = useState(false);       // hover / focus / touch hold pauses the day
    const [cycle, setCycle] = useState(0);         // restarts the story dash on manual picks
    const { ref, inView } = useInView({ rootMargin: '0px 0px -15% 0px' });
    const [visible, setVisible] = useState(true);
    const [reduced, setReduced] = useState(false);
    const [paused, setPaused] = useState(false);   // the visible pause button (WCAG 2.2.2)
    const [done, setDone] = useState(false);       // the day plays once, then rests at the Aarti
    const [armed, setArmed] = useState(false);     // JS + motion: the swell line waits for dusk
    const swipe = useRef(null);

    useEffect(() => {
        const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
        const sync = () => { setReduced(mq.matches); setArmed(!mq.matches); };
        sync(); mq.addEventListener('change', sync);
        const vis = () => setVisible(document.visibilityState === 'visible');
        document.addEventListener('visibilitychange', vis);
        return () => { mq.removeEventListener('change', sync); document.removeEventListener('visibilitychange', vis); };
    }, []);

    const running = inView && visible && !held && !reduced && !paused && !done;
    useEffect(() => {
        if (!running) return undefined;
        const t = setTimeout(() => {
            const next = active + 1;
            setActive(next);
            if (next === MOMENTS.length - 1) setDone(true);   // dusk: rest here
        }, STEP_MS);
        return () => clearTimeout(t);
    }, [running, active, cycle]);
    const swell = active === MOMENTS.length - 1;          // the Aarti swell plays whenever dusk is on

    const pick = useCallback((i) => { setActive(i); setCycle((c) => c + 1); }, []);
    const m = MOMENTS[active];

    // Phones: swipe the stage.
    const onDown = (e) => { swipe.current = { x: e.clientX, y: e.clientY }; setHeld(true); };
    const onUp = (e) => {
        const s = swipe.current; swipe.current = null; setHeld(false);
        if (!s) return;
        const dx = e.clientX - s.x;
        if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(e.clientY - s.y)) pick((active + (dx < 0 ? 1 : 2)) % 3);
    };

    return (
        <MotionConfig reducedMotion="user">
            <section ref={ref} aria-labelledby="varanasi-title" className="chapter relative isolate"
                onMouseEnter={() => setHeld(true)} onMouseLeave={() => setHeld(false)}
                onFocus={() => setHeld(true)} onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) setHeld(false); }}>
                <div className="mx-auto w-full max-w-wide px-3 py-10 sm:px-5 sm:py-14 md:px-8 lg:px-6 lg:py-20">
                    <div data-rise="sheet" data-live={inView && visible ? '' : undefined} data-swell={swell ? '' : undefined} data-armed={armed ? '' : undefined}
                        className="varanasi-stage relative overflow-hidden rounded-[32px] bg-[#140A0C] text-ink-onDeep shadow-[0_40px_90px_-40px_rgba(51,22,26,0.9)]">

                        {/* ── Header (both) ── */}
                        <div className="relative z-20 px-5 pt-6 sm:px-8 sm:pt-8 lg:absolute lg:left-0 lg:top-0 lg:max-w-[540px] lg:px-12 lg:pt-12">
                            <p className="inline-flex items-center gap-2 rounded-full bg-white/10 py-1 pl-1 pr-3.5 text-[12.5px] font-semibold ring-1 ring-white/15 backdrop-blur-md">
                                <span aria-hidden="true" className="chapter-no__n grid h-6 min-w-6 place-items-center rounded-full bg-gold px-1.5 text-[10.5px] tabular-nums text-ground-deep" />
                                New branch
                                <span aria-hidden="true" className="relative ml-1 flex h-2 w-2">
                                    <span className="absolute inline-flex h-full w-full rounded-full bg-accent opacity-75 motion-safe:animate-ping" />
                                    <span className="relative inline-flex h-2 w-2 rounded-full bg-accent" />
                                </span>
                                <span className="text-ink-onDeep/75">Booking this season</span>
                            </p>
                            <h2 id="varanasi-title" className="mt-4 text-balance text-[36px] font-semibold leading-[1.02] tracking-[-0.035em] sm:text-[48px] lg:text-[58px]">
                                Your wedding, on the <em className="font-display font-medium italic tracking-normal text-gold">ghats</em>.
                            </h2>
                            <p className="mt-3 max-w-md text-[15px] leading-relaxed text-ink-onDeep/75 sm:text-[16px]">
                                We&rsquo;re now filming in Varanasi. The same team, one day in the oldest living city, in three moments.
                            </p>
                            <Offer />
                        </div>

                        {/* ── Stage: phones 4:5 story · desktop wide ── */}
                        <div className="relative mt-5 aspect-[4/5] touch-pan-y select-none sm:aspect-[16/11] lg:mt-0 lg:aspect-auto lg:h-[min(86svh,760px)] lg:min-h-[620px]"
                            onPointerDown={onDown} onPointerUp={onUp} onPointerCancel={() => { swipe.current = null; setHeld(false); }}>
                            {/* photographs */}
                            <div className="absolute inset-0 lg:hidden">
                                {MOMENTS.map((x, i) => <Photo key={x.key} m={x} on={i === active} tall priority={i === 0} />)}
                            </div>
                            <div className="absolute inset-0 hidden lg:block">
                                {MOMENTS.map((x, i) => <Photo key={x.key} m={x} on={i === active} priority={i === 0} />)}
                            </div>
                            {/* sky tint per moment, the skyline at the horizon, legibility */}
                            {MOMENTS.map((x, i) => (
                                <span key={x.key} aria-hidden="true" className={`pointer-events-none absolute inset-0 mix-blend-soft-light transition-opacity duration-[1200ms] ${i === active ? 'opacity-100' : 'opacity-0'}`}
                                    style={{ background: x.sky }} />
                            ))}
                            <span aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-[#140A0C] to-transparent lg:hidden" />
                            <span aria-hidden="true" className="pointer-events-none absolute inset-0 hidden lg:block
                                [background:linear-gradient(90deg,rgba(20,10,12,0.92),rgba(20,10,12,0.55)_38%,transparent_62%),linear-gradient(0deg,rgba(20,10,12,0.95),transparent_42%)]" />
                            <span aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-[#140A0C] via-[#140A0C]/50 to-transparent lg:hidden" />
                            <Diyas strength={m.diyas} />

                            {/* pause / play — visible control for the moving day */}
                            {!reduced && (
                                <button type="button" onClick={() => { if (done) { setDone(false); pick(0); setPaused(false); } else setPaused((v) => !v); }}
                                    aria-pressed={done ? undefined : paused}
                                    aria-label={done ? 'Replay the day' : paused ? 'Play the day' : 'Pause the day'}
                                    className="absolute right-3 top-3 z-20 grid h-11 w-11 cursor-pointer place-items-center rounded-full bg-black/35 text-ink-onDeep ring-1 ring-white/20 backdrop-blur-md
                                               transition-colors duration-ui hover:bg-black/55 focus-ring lg:right-5 lg:top-5">
                                    {paused || done ? <FiPlay aria-hidden="true" className="ml-0.5 h-4 w-4" /> : <FiPause aria-hidden="true" className="h-4 w-4" />}
                                </button>
                            )}

                            {/* phones: tap the left / right of the photo to step (story grammar) */}
                            <button type="button" aria-label="Previous moment" onClick={() => pick((active + 2) % 3)}
                                className="absolute bottom-16 left-0 top-12 z-[5] w-1/3 cursor-pointer lg:hidden" />
                            <button type="button" aria-label="Next moment" onClick={() => pick((active + 1) % 3)}
                                className="absolute bottom-16 right-0 top-12 z-[5] w-1/3 cursor-pointer lg:hidden" />

                            {/* phones: story dashes */}
                            <div className="absolute left-4 right-16 top-[1.65rem] z-10 flex gap-1.5 lg:hidden" aria-hidden="true">
                                {MOMENTS.map((x, i) => (
                                    <span key={x.key} className="h-[3px] flex-1 overflow-hidden rounded-full bg-white/25">
                                        <span key={`${x.key}-${cycle}-${active}`}
                                            className={`block h-full origin-left rounded-full bg-white ${i < active ? 'scale-x-100' : i > active ? 'scale-x-0' : running ? 'animate-[heroBar_6.5s_linear_both]' : 'scale-x-100'}`} />
                                    </span>
                                ))}
                            </div>
                            {/* phones: the moment chips (tabs) */}
                            <div role="tablist" aria-label="A day on the ghats" className="absolute inset-x-4 bottom-4 z-10 flex gap-1.5 lg:hidden">
                                {MOMENTS.map((x, i) => (
                                    <button key={x.key} role="tab" type="button" aria-selected={i === active} aria-controls={`${panelIds[i]}-m`} onClick={() => pick(i)}
                                        className={`flex-1 rounded-full px-2 py-2 text-[12.5px] font-semibold backdrop-blur-md transition-colors duration-ui focus-ring
                                                    ${i === active ? 'bg-white text-ink' : 'bg-white/10 text-ink-onDeep/80 ring-1 ring-white/15'}`}>
                                        {x.time}
                                    </button>
                                ))}
                            </div>

                            {/* desktop: the story + CTA at left, the sun arc along the bottom */}
                            <div className="absolute bottom-12 left-12 z-10 hidden w-[440px] lg:block">
                                {MOMENTS.map((x, i) => <Story key={x.key} m={x} i={i} active={active} panelId={panelIds[i]} tabId={tabIds[i]} />)}
                                <Cta className="mt-7" />
                                <p className="swell-line mt-3 text-[13px] text-ink-onDeep/70">Three shoots. One day. See them on the Varanasi page.</p>
                            </div>
                            <p className="absolute right-5 top-[4.6rem] z-10 hidden text-[10.5px] uppercase tracking-[0.18em] text-ink-onDeep/40 lg:block">Illustrative frames</p>
                            <div className="absolute bottom-8 left-[44%] right-10 z-10 hidden lg:block xl:right-16">
                                <SunArc active={active} onPick={pick} tabIds={tabIds} panelIds={panelIds} />
                            </div>
                        </div>

                        {/* phones: story + CTA below the stage */}
                        <div className="relative z-10 px-5 pb-6 pt-5 sm:px-8 sm:pb-8 lg:hidden">
                            {MOMENTS.map((x, i) => (
                                <div key={x.key} id={`${panelIds[i]}-m`} role="tabpanel" hidden={i !== active} aria-label={x.title}>
                                    <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-gold">{x.time} · {x.when}</p>
                                    <h3 className="mt-1.5 text-[22px] font-semibold leading-tight tracking-[-0.02em]">{x.title}</h3>
                                    <p className="mt-2 text-[14.5px] leading-relaxed text-ink-onDeep/80">{x.body}</p>
                                </div>
                            ))}
                            <Cta className="mt-5 w-full" />
                            <p className="swell-line mt-3 text-center text-[13px] text-ink-onDeep/70">Three shoots. One day. See them on the Varanasi page.</p>
                            <p className="mt-2 text-center text-[10.5px] uppercase tracking-[0.18em] text-ink-onDeep/35">Illustrative frames</p>
                        </div>
                    </div>
                </div>
            </section>
        </MotionConfig>
    );
}

export default memo(VaranasiLaunchCard);
