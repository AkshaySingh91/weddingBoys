'use client';

/**
 * Home › Banaras pre-wedding.
 *
 * Not a "we opened a branch" banner: an invitation to do your pre-wedding
 * shoot on the ghats of Banaras, in plain words.
 *
 *   Phones   "Banaras bula raha hai" — a full-screen walk down the ghats
 *            (./varanasi/BanarasWalk.jsx), then a short closing invitation.
 *   Desktop  one day on the ghats: sunrise, the old lanes, the Ganga Aarti.
 *            A diya travels a sun-path arc between the three stops and leaves
 *            a gold trail; the day plays once and rests at the Aarti, where the
 *            river diyas light in turn and the button catches an ember glow.
 *
 * Auto-advance only while in view, the tab is visible and nobody is hovering or
 * focusing it; a visible pause/replay button; never under reduced motion. All
 * copy is in the server HTML.
 *
 * AI PLACEHOLDER: the old-lanes stop needs a photograph of a couple in a gali —
 * see AI_PLACEHOLDERS in ./varanasi/shared.jsx.
 */
import { memo, useCallback, useEffect, useId, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { animate, motion, MotionConfig, useMotionValue, useTransform } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { FiArrowUpRight, FiClock, FiPause, FiPlay } from 'react-icons/fi';
import { STOPS as MOMENTS, Diyas, PlaceholderTag } from './varanasi/shared.jsx';
import BanarasWalk from './varanasi/BanarasWalk.jsx';

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

function Photo({ m, on, priority }) {
    return (
        <div className={`absolute inset-0 transition-opacity duration-[900ms] ease-entrance ${on ? 'opacity-100' : 'opacity-0'}`} aria-hidden={on ? undefined : true}>
            {/* the mirror lives on a wrapper: the zoom animation owns the image's transform */}
            <div className={`absolute inset-0 ${m.flipWide ? '-scale-x-100' : ''}`}>
                <Image src={m.wide} alt={on ? m.title : ''} fill placeholder="blur" sizes="(max-width: 1023px) 1px, 1400px"
                    loading={priority ? 'eager' : 'lazy'}
                    className={`object-cover ${on ? 'motion-safe:animate-[heroZoom_9s_ease-out_both]' : ''}`}
                    style={{ objectPosition: m.posWide }} />
            </div>
            <PlaceholderTag id={m.placeholder} className="right-20 top-6" />
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
                        <span className={`block whitespace-nowrap text-[14px] font-semibold transition-colors ${i === active ? 'text-gold' : 'text-ink-onDeep/60 group-hover:text-ink-onDeep'}`}>{m.label}</span>
                    </button>
                ))}
            </div>
        </div>
    );
}

function Cta({ className = '', href = '/varanasi', children = 'Plan your Banaras pre-wedding' }) {
    return (
        <Link href={href}
            className={`cta-ember group relative isolate inline-flex h-[52px] items-center justify-between gap-4 whitespace-nowrap rounded-full bg-accent pl-6 pr-1.5 text-[15px] font-semibold text-ink-onAccent
                        shadow-[0_14px_34px_-14px_rgba(196,47,47,0.75)] transition-[background-color,transform] duration-ui ease-standard hover:bg-accent-hover
                        motion-safe:active:scale-[0.97] focus-ring ${className}`}>
            {children}
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
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-gold">{i + 1} · {m.label}</p>
            <motion.div key={m.key} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: EASE }}>
                <p className="mt-2 font-display text-[34px] font-medium italic leading-[1.05] text-ink-onDeep">{m.hi}</p>
                <h3 className="mt-3 text-[18px] font-semibold leading-snug text-ink-onDeep">{m.title}</h3>
                <p className="mt-1 max-w-md text-[15px] leading-relaxed text-ink-onDeep/80">{m.line}</p>
            </motion.div>
        </div>
    );
}

/* ── Section ──────────────────────────────────────────────────────────────── */

/* ── Desktop: one day on the ghats ─────────────────────────────────────── */

function DesktopDay() {
    const uid = useId();
    const tabIds = MOMENTS.map((m) => `${uid}-tab-${m.key}`);
    const panelIds = MOMENTS.map((m) => `${uid}-panel-${m.key}`);
    const [active, setActive] = useState(0);
    const [held, setHeld] = useState(false);       // hover / focus pauses the day
    const [cycle, setCycle] = useState(0);         // restarts the timer on manual picks
    const { ref, inView } = useInView({ rootMargin: '0px 0px -15% 0px' });
    const [visible, setVisible] = useState(true);
    const [reduced, setReduced] = useState(false);
    const [paused, setPaused] = useState(false);   // the visible pause button (WCAG 2.2.2)
    const [done, setDone] = useState(false);       // the day plays once, then rests at the Aarti
    const [armed, setArmed] = useState(false);     // JS + motion: the swell line waits for dusk

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
            if (next === MOMENTS.length - 1) setDone(true);   // the Aarti: rest here
        }, STEP_MS);
        return () => clearTimeout(t);
    }, [running, active, cycle]);
    const swell = active === MOMENTS.length - 1;

    const pick = useCallback((i) => { setActive(i); setCycle((c) => c + 1); }, []);
    const m = MOMENTS[active];

    return (
        <div ref={ref} className="mx-auto hidden w-full max-w-wide px-6 py-20 lg:block"
            onMouseEnter={() => setHeld(true)} onMouseLeave={() => setHeld(false)}
            onFocus={() => setHeld(true)} onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) setHeld(false); }}>
            <div data-rise="sheet" data-live={inView && visible ? '' : undefined} data-swell={swell ? '' : undefined} data-armed={armed ? '' : undefined}
                className="varanasi-stage relative h-[min(86svh,760px)] min-h-[620px] overflow-hidden rounded-[32px] bg-[#140A0C] text-ink-onDeep shadow-[0_40px_90px_-40px_rgba(51,22,26,0.9)]">
                {MOMENTS.map((x, i) => <Photo key={x.key} m={x} on={i === active} priority={i === 0} />)}
                {MOMENTS.map((x, i) => (
                    <span key={x.key} aria-hidden="true" className={`pointer-events-none absolute inset-0 mix-blend-soft-light transition-opacity duration-[1200ms] ${i === active ? 'opacity-100' : 'opacity-0'}`}
                        style={{ background: x.sky }} />
                ))}
                <span aria-hidden="true" className={`pointer-events-none absolute inset-0 transition-opacity duration-[1200ms] ${swell ? 'opacity-100' : 'opacity-0'}`}><span className="aarti-glow absolute inset-0" /></span>
                <span aria-hidden="true" className="pointer-events-none absolute inset-0
                    [background:linear-gradient(90deg,rgba(20,10,12,0.92),rgba(20,10,12,0.55)_38%,transparent_62%),linear-gradient(0deg,rgba(20,10,12,0.95),transparent_42%)]" />
                <Diyas strength={m.diyas} />

                {/* the invitation */}
                <div className="absolute left-0 top-0 z-20 max-w-[560px] px-12 pt-12">
                    <p className="inline-flex items-center gap-2 rounded-full bg-white/10 py-1 pl-1 pr-3.5 text-[12.5px] font-semibold ring-1 ring-white/15 backdrop-blur-md">
                        <span aria-hidden="true" className="chapter-no__n grid h-6 min-w-6 place-items-center rounded-full bg-gold px-1.5 text-[10.5px] tabular-nums text-ground-deep" />
                        Pre-wedding shoot in Banaras
                        <span aria-hidden="true" className="relative ml-1 flex h-2 w-2">
                            <span className="absolute inline-flex h-full w-full rounded-full bg-accent opacity-75 motion-safe:animate-ping" />
                            <span className="relative inline-flex h-2 w-2 rounded-full bg-accent" />
                        </span>
                        <span className="text-ink-onDeep/75">Booking this season</span>
                    </p>
                    <h2 id="varanasi-title" className="mt-4 text-balance text-[54px] font-semibold leading-[1.02] tracking-[-0.035em]">
                        Your pre-wedding, on the ghats of <em className="font-display font-medium italic tracking-normal text-gold">Banaras</em>.
                    </h2>
                    <p className="mt-3 max-w-md text-[16px] leading-relaxed text-ink-onDeep/75">
                        Sunrise on the Ganga, the old lanes, and the grand Ganga Aarti. Our team now shoots in Varanasi.
                    </p>
                    <Offer />
                </div>

                {!reduced && (
                    <button type="button" onClick={() => { if (done) { setDone(false); pick(0); setPaused(false); } else setPaused((v) => !v); }}
                        aria-pressed={done ? undefined : paused}
                        aria-label={done ? 'Replay the day' : paused ? 'Play the day' : 'Pause the day'}
                        className="absolute right-5 top-5 z-20 grid h-11 w-11 cursor-pointer place-items-center rounded-full bg-black/35 text-ink-onDeep ring-1 ring-white/20 backdrop-blur-md
                                   transition-colors duration-ui hover:bg-black/55 focus-ring">
                        {paused || done ? <FiPlay aria-hidden="true" className="ml-0.5 h-4 w-4" /> : <FiPause aria-hidden="true" className="h-4 w-4" />}
                    </button>
                )}
                <p className="absolute right-5 top-[4.6rem] z-10 text-[10.5px] uppercase tracking-[0.18em] text-ink-onDeep/40">Sample images</p>

                <div className="absolute bottom-12 left-12 z-10 w-[460px]">
                    {MOMENTS.map((x, i) => <Story key={x.key} m={x} i={i} active={active} panelId={panelIds[i]} tabId={tabIds[i]} />)}
                    <Cta className="mt-7" />
                    <p className="swell-line mt-3 text-[13px] text-ink-onDeep/70">See shoot ideas, packages and dates on the Banaras page.</p>
                </div>
                <div className="absolute bottom-8 left-[44%] right-10 z-10 xl:right-16">
                    <SunArc active={active} onPick={pick} tabIds={tabIds} panelIds={panelIds} />
                </div>
            </div>
        </div>
    );
}

/* ── Section ──────────────────────────────────────────────────────────────── */

function VaranasiLaunchCard() {
    return (
        <MotionConfig reducedMotion="user">
            <section aria-label="Pre-wedding shoot in Banaras" className="chapter relative isolate">
                {/* Phones: the walk down the ghats, then the invitation */}
                <div className="lg:hidden">
                    <BanarasWalk />
                    <div className="bg-[#140A0C] px-5 pb-12 pt-6 text-ink-onDeep">
                        <p className="font-display text-[26px] font-medium italic leading-tight text-gold">Aapki kahani, Ganga kinare.</p>
                        <p className="mt-2 text-[15px] leading-relaxed text-ink-onDeep/80">
                            Your love story, on the banks of the Ganga. Our team now shoots pre-weddings in Banaras: sunrise boat rides, the ghats and old lanes, and the Ganga Aarti.
                        </p>
                        <ul className="mt-4 flex flex-wrap gap-2 text-[12.5px]">
                            {MOMENTS.map((x) => <li key={x.key} className="rounded-full bg-white/[0.08] px-3 py-1.5 ring-1 ring-white/10">{x.label}</li>)}
                        </ul>
                        <Offer />
                        <div className="mt-6 grid gap-2.5">
                            <Cta className="w-full">See shoot ideas &amp; packages</Cta>
                            <Link href="/contact"
                                className="inline-flex h-12 items-center justify-center rounded-full text-[15px] font-semibold text-ink-onDeep ring-1 ring-white/25 hover:bg-white/10 motion-safe:active:scale-[0.97] focus-ring">
                                Check your dates
                            </Link>
                        </div>
                        <p className="mt-4 text-center text-[10.5px] uppercase tracking-[0.18em] text-ink-onDeep/40">Booking this season · Sample images</p>
                    </div>
                </div>
                <DesktopDay />
            </section>
        </MotionConfig>
    );
}

export default memo(VaranasiLaunchCard);
