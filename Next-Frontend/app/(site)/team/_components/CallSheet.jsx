'use client';

/**
 * "The call sheet" — the crew by department.
 *
 * Desktop (lg+): end-credits typography. Each department is a block of rows —
 * big name, role, department — with thin rules between. Hovering a row brings
 * that person's portrait out beside the cursor (ONE shared floating element,
 * moved by transform from a rAF, its image swapped — no React state per frame).
 * Click / Enter opens the row into a crew pass, one at a time.
 *
 * Phones: each department is a horizontal snap deck of crew passes — lanyard
 * ID badges with the portrait, name, role and a department strip. The centred
 * pass leads; neighbours recede (scroll-driven CSS, @supports only).
 *
 * Both: a sticky department index (scrollspy) — jump links, never filters, so
 * every name stays in the HTML and nothing reflows.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { LayoutGroup, MotionConfig, motion, AnimatePresence } from 'framer-motion';
import { FiPlus } from 'react-icons/fi';
import { PortraitImage } from '@/Component/team/Portrait.jsx';
import { ChapterHead } from '@/Component/home/Chapter.jsx';

const pad = (n) => String(n).padStart(2, '0');
const EASE = [0.16, 1, 0.3, 1];

/** Department accent: the strip on a pass, the dot in the index. */
const TONE = {
    camera: 'bg-accent',
    stills: 'bg-gold',
    post: 'bg-ground-deep',
    aerial: 'bg-ink-muted',
    crew: 'bg-ink',
};

/** Which department is on screen: one observer, a band across the middle. */
function useScrollspy(ids) {
    const [active, setActive] = useState(ids[0]);
    const key = ids.join(',');  // re-observe only when the departments change
    useEffect(() => {
        if (typeof IntersectionObserver === 'undefined') return undefined;
        const io = new IntersectionObserver((entries) => {
            for (const e of entries) if (e.isIntersecting) setActive(e.target.dataset.dept);
        }, { rootMargin: '-40% 0px -55% 0px' });
        // Both layouts are in the DOM; the hidden one never intersects.
        document.querySelectorAll('[data-dept]').forEach((el) => io.observe(el));
        return () => io.disconnect();
    }, [key]);
    return active;
}

function jump(e, key) {
    // The visible layout's section (the other one is display:none).
    const el = [...document.querySelectorAll(`[data-dept="${key}"]`)].find((n) => n.offsetParent !== null);
    if (!el) return;
    e.preventDefault();
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
    history.replaceState(null, '', `#${el.id}`);
}

function DeptIndex({ departments, active, vertical, prefix }) {
    const railRef = useRef(null);
    // Phones: keep the active chip in view by scrolling the rail only (never the page).
    useEffect(() => {
        const rail = railRef.current;
        if (vertical || !rail) return;
        const el = rail.querySelector('[aria-current="true"]');
        if (!el) return;
        const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        rail.scrollTo({ left: el.offsetLeft - rail.clientWidth / 2 + el.clientWidth / 2, behavior: reduce ? 'auto' : 'smooth' });
    }, [active, vertical]);
    return (
        <LayoutGroup id={vertical ? 'dept-index-v' : 'dept-index-h'}>
            <nav ref={railRef} aria-label="Departments"
                className={vertical
                    ? 'flex flex-col gap-1'
                    : 'flex gap-1 overflow-x-auto rounded-full bg-ground-raised/90 p-1 ring-1 ring-ink/[0.07] shadow-[0_10px_24px_-18px_rgba(51,22,26,0.6)] backdrop-blur-md scrollbar-none'}>
                {departments.map((d, k) => {
                    const on = active === d.key;
                    return (
                        <a key={d.key} href={`#${prefix}-${d.key}`} onClick={(e) => jump(e, d.key)} aria-current={on ? 'true' : undefined}
                            className={`relative isolate flex shrink-0 items-center gap-2 rounded-full font-semibold transition-colors duration-ui focus-ring
                                        ${vertical ? 'px-4 py-2.5 text-[14px]' : 'px-3.5 py-2 text-[13px]'}
                                        ${on ? 'text-ground' : 'text-ink-secondary hover:text-ink'}`}>
                            {on && <motion.span layoutId="dept-pill" aria-hidden="true" className="absolute inset-0 -z-10 rounded-full bg-ink"
                                transition={{ type: 'spring', bounce: 0.1, duration: 0.32 }} />}
                            {vertical && <span className={`tabular-nums text-[11px] ${on ? 'text-ground/60' : 'text-ink-muted'}`}>{pad(k + 1)}</span>}
                            {d.label}
                            <span className={`rounded-full px-1.5 text-[11px] tabular-nums ${on ? 'bg-white/15' : 'bg-ink/[0.06]'}`}>{d.people.length}</span>
                        </a>
                    );
                })}
            </nav>
        </LayoutGroup>
    );
}

/* ── Desktop: credits ─────────────────────────────────────────────────────── */

function Credits({ departments }) {
    const [open, setOpen] = useState(null);         // person id
    const [hover, setHover] = useState(null);       // person shown in the floating portrait
    const floatRef = useRef(null);
    // Trailing float: each frame closes 20% of the gap to the pointer and tilts
    // with horizontal speed (±5°). Flips left past 60% of the viewport so it
    // never covers the name. Reduced motion: snaps, no tilt. No React state.
    const pos = useRef({ x: 0, y: 0, tx: 0, ty: 0, raf: 0, still: false, live: false, kick: null });
    useEffect(() => {
        const p = pos.current;
        p.still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        const tick = () => {
            const k = p.still ? 1 : 0.2;
            const dx = p.tx - p.x;
            p.x += dx * k; p.y += (p.ty - p.y) * k;
            const tilt = p.still ? 0 : Math.max(-5, Math.min(5, dx * 0.08));
            if (floatRef.current) floatRef.current.style.transform = `translate3d(${p.x}px, ${p.y}px, 0) rotate(${tilt.toFixed(2)}deg)`;
            p.raf = Math.abs(p.tx - p.x) > 0.5 || Math.abs(p.ty - p.y) > 0.5 ? requestAnimationFrame(tick) : 0;
        };
        p.kick = () => { if (!p.raf) p.raf = requestAnimationFrame(tick); };
        return () => { cancelAnimationFrame(p.raf); p.kick = null; };
    }, []);
    const onMove = useCallback((e) => {
        const p = pos.current;
        // Never over the hovered name: start just past the end of its text.
        const name = e.target.closest?.('button')?.querySelector('[data-name]');
        const after = name ? name.getBoundingClientRect().right + 20 : 0;
        const flip = Math.max(e.clientX + 24, after) + 220 > window.innerWidth - 16;
        p.tx = flip ? e.clientX - 244 : Math.max(e.clientX + 24, after);
        p.ty = e.clientY - 130;
        if (!p.live) { p.x = p.tx; p.y = p.ty; p.live = true; }   // first sample: appear under the pointer
        p.kick?.();
    }, []);

    // Preload the portraits on the first intent to hover (not on Save-Data).
    const warmed = useRef(false);
    const warm = useCallback(() => {
        if (warmed.current || navigator.connection?.saveData) return;
        warmed.current = true;
        departments.flatMap((d) => d.people).forEach((p) => {
            const url = p.variants?.find((v) => v.width >= 320)?.url;
            if (url) { const img = new window.Image(); img.decoding = 'async'; img.src = url; }
        });
    }, [departments]);

    // Escape closes the open pass and returns focus to its row.
    useEffect(() => {
        if (!open) return undefined;
        const onKey = (e) => {
            if (e.key !== 'Escape') return;
            const id = open;
            setOpen(null);
            document.querySelector(`[aria-controls="pass-${id}"]`)?.focus();
        };
        document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
    }, [open]);

    return (
        <div className="relative" onPointerEnter={warm} onPointerMove={onMove} onPointerLeave={() => { setHover(null); pos.current.live = false; }}>
            {/* the floating portrait: one fixed element, transform-only, decorative */}
            <div ref={floatRef} aria-hidden="true" className="pointer-events-none fixed left-0 top-0 z-30 will-change-transform">
                <AnimatePresence>
                    {hover && hover.id !== open && (
                        <motion.div key="float"
                            initial={{ opacity: 0, clipPath: 'inset(100% 0% 0% 0% round 20px)' }}
                            animate={{ opacity: 1, clipPath: 'inset(0% 0% 0% 0% round 20px)', transition: { duration: 0.32, ease: EASE } }}
                            exit={{ opacity: 0, transition: { duration: 0.18 } }}
                            className="relative h-[260px] w-[220px] overflow-hidden rounded-[20px] bg-ground-deep shadow-[0_30px_60px_-24px_rgba(51,22,26,0.7)]">
                            {/* every portrait stacked, the hovered one shown: swaps never flash blank */}
                            {departments.flatMap((d) => d.people).map((p) => (
                                <span key={p.id} className={`absolute inset-0 transition-opacity duration-[160ms] ${p.id === hover.id ? 'opacity-100' : 'opacity-0'}`}>
                                    <PortraitImage person={p} sizes="220px" className="object-[50%_22%]" />
                                </span>
                            ))}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {departments.map((d, k) => (
                <section key={d.key} id={`credits-${d.key}`} data-dept={d.key} aria-labelledby={`credits-${d.key}-title`} className="scroll-mt-28 pb-14 last:pb-0">
                    <header className="relative flex items-baseline gap-4 pb-3">
                        <span aria-hidden="true" data-rise="draw" className="absolute inset-x-0 bottom-0 h-px bg-ink/20" />
                        <span className="text-[12px] font-semibold uppercase tracking-[0.18em] tabular-nums text-accent-ink">Dept {pad(k + 1)}</span>
                        <h3 id={`credits-${d.key}-title`} className="text-[15px] font-semibold uppercase tracking-[0.14em] text-ink">{d.label}</h3>
                        <span className="text-[13px] text-ink-muted">{d.note}</span>
                        <span className="ml-auto text-[12px] tabular-nums text-ink-muted">{d.people.length} on call</span>
                    </header>
                    <ul>
                        {d.people.map((p, i) => {
                            const isOpen = open === p.id;
                            return (
                                <li key={p.id} className="border-b border-ink/[0.08]">
                                    <button type="button" aria-expanded={isOpen} aria-controls={`pass-${p.id}`}
                                        onPointerEnter={() => setHover(p)} onFocus={() => setHover(null)}
                                        onClick={() => setOpen(isOpen ? null : p.id)}
                                        className="group grid w-full cursor-pointer grid-cols-[minmax(0,1fr)_minmax(0,0.7fr)_auto] items-baseline gap-6 py-4 text-left focus-ring">
                                        <span className="block overflow-clip">
                                            <span data-rise="line" style={{ '--d': i }}
                                                className="block truncate text-[clamp(30px,3.4vw,52px)] font-semibold leading-[1.08] tracking-[-0.035em] text-ink transition-[color,transform] duration-ui ease-entrance group-hover:translate-x-2 group-hover:text-accent-ink">
                                                <span data-name="">{p.name}</span>
                                            </span>
                                        </span>
                                        <span data-rise="fade" style={{ '--d': i }} className="truncate text-[15px] text-ink-secondary">{p.role}</span>
                                        <span aria-hidden="true" className={`grid h-10 w-10 place-items-center rounded-full ring-1 ring-ink/15 transition-[transform,background-color,color] duration-ui ease-entrance
                                                          ${isOpen ? 'rotate-45 bg-ink text-ground' : 'text-ink group-hover:bg-ink group-hover:text-ground'}`}>
                                            <FiPlus className="h-4 w-4" />
                                        </span>
                                    </button>
                                    <AnimatePresence initial={false}>
                                        {isOpen && (
                                            <motion.div id={`pass-${p.id}`} key="pass" initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.42, ease: EASE }} className="overflow-hidden">
                                                <div className="pb-6"><Pass person={p} dept={d} wide /></div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </li>
                            );
                        })}
                    </ul>
                </section>
            ))}
        </div>
    );
}

/* ── The crew pass (phones: the deck; desktop: an opened credit row) ─────── */

function Pass({ person, dept, wide = false }) {
    return (
        <article aria-label={`${person.name}, ${person.role}`}
            className={`relative overflow-hidden rounded-[26px] bg-ground-raised ring-1 ring-ink/[0.08] shadow-[0_22px_44px_-26px_rgba(51,22,26,0.55)]
                        ${wide ? 'grid max-w-2xl grid-cols-[220px_minmax(0,1fr)] gap-6 p-3' : 'p-2.5'}`}>
            {/* punched lanyard slot */}
            {!wide && <span aria-hidden="true" className="absolute left-1/2 top-3 z-10 h-2 w-12 -translate-x-1/2 rounded-full bg-ground ring-1 ring-ink/10" />}
            <div className={`relative overflow-hidden rounded-[20px] bg-ground-deep ${wide ? 'aspect-[4/5]' : 'aspect-[4/5]'}`}>
                <PortraitImage person={person} sizes={wide ? '220px' : '72vw'} className="object-[50%_22%]" />
                <span data-rise={wide ? undefined : 'draw'} style={{ '--d': 2 }} className={`absolute inset-x-0 bottom-0 h-1.5 ${TONE[dept.key] || TONE.crew}`} aria-hidden="true" />
            </div>
            <div className={wide ? 'flex flex-col justify-between py-2 pr-3' : 'px-1.5 pb-1 pt-3'}>
                <div>
                    <p className="text-[10.5px] font-semibold uppercase tracking-[0.18em] text-ink-muted">{dept.label}</p>
                    <p className={`mt-1 font-semibold leading-tight tracking-[-0.02em] text-ink ${wide ? 'text-[30px]' : 'text-[21px]'}`}>{person.name}</p>
                    <p className="mt-0.5 text-[14px] text-accent-ink">{person.role}</p>
                </div>
                <p className={`flex items-center justify-between border-t border-dashed border-ink/15 pt-2.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-ink-muted
                               ${wide ? 'mt-6' : 'mt-3'}`}>
                    <span>All access</span><span>The Wedding Vachan</span>
                </p>
            </div>
        </article>
    );
}

/* ── Phones: decks of passes ──────────────────────────────────────────────── */

function Decks({ departments }) {
    return departments.map((d, k) => (
        <section key={d.key} id={`deck-${d.key}`} data-dept={d.key} aria-labelledby={`deck-${d.key}-title`} className="scroll-mt-36 pt-8 first:pt-6">
            <header className="flex items-baseline gap-3 px-5 md:px-8">
                <span className="text-[11px] font-semibold uppercase tracking-[0.18em] tabular-nums text-accent-ink">Dept {pad(k + 1)}</span>
                <h3 id={`deck-${d.key}-title`} className="text-[18px] font-semibold tracking-[-0.01em] text-ink">{d.label}</h3>
                <span className="ml-auto text-[12px] tabular-nums text-ink-muted">{d.people.length} on call</span>
            </header>
            <ul className="pass-deck mt-3 flex snap-x snap-mandatory gap-3 overflow-x-auto px-5 pb-4 pt-1 scroll-px-5 scrollbar-none md:px-8">
                {d.people.map((p, i) => (
                    <li key={p.id} data-rise="sheet" style={{ '--d': i }} className="pass-card w-[72vw] max-w-[300px] shrink-0 snap-center sm:w-[44vw]">
                        <Pass person={p} dept={d} />
                    </li>
                ))}
            </ul>
        </section>
    ));
}

export default function CallSheet({ departments, crewCount }) {
    const ids = departments.map((d) => d.key);
    const active = useScrollspy(ids);
    if (!departments.length) return null;

    return (
        <MotionConfig reducedMotion="user">
            <section id="call-sheet" aria-labelledby="call-sheet-title" className="relative">
                <div className="mx-auto w-full max-w-wide px-5 pt-6 md:px-8 lg:px-10 lg:pt-10">
                    <ChapterHead label="The call sheet" title={<span id="call-sheet-title">Who you&rsquo;ll meet on the <em className="font-display font-medium italic tracking-normal text-accent-ink">day</em></span>}
                        lead="Every wedding gets a call sheet: who is shooting the film, who is on stills, who is in the edit. This is ours." />
                    {/* the call sheet's header strip */}
                    <dl data-rise="" style={{ '--d': 3 }}
                        className="mt-6 grid grid-cols-2 gap-px overflow-hidden rounded-[18px] bg-ink/[0.08] text-[11px] font-semibold uppercase tracking-[0.16em] sm:grid-cols-3">
                        {[['Production', 'The Wedding Vachan'], ['Unit', `${crewCount} crew`], ['Departments', departments.length]].map(([k, v], i) => (
                            <div key={k} className={`bg-ground-raised px-4 py-3 ${i === 2 ? 'hidden sm:block' : ''}`}>
                                <dt className="text-ink-muted">{k}</dt>
                                <dd className="mt-1 text-[13px] normal-case tracking-normal text-ink">{v}</dd>
                            </div>
                        ))}
                    </dl>
                </div>

                {/* Phones / tablets: sticky chip rail + decks of passes */}
                <div className="lg:hidden">
                    <div className="sticky top-[calc(var(--header-height)+6px)] z-20 mt-6 px-5 md:px-8">
                        <DeptIndex departments={departments} active={active} prefix="deck" />
                    </div>
                    <Decks departments={departments} />
                </div>

                {/* Desktop: sticky index + credits */}
                <div className="mx-auto hidden w-full max-w-wide grid-cols-12 gap-10 px-10 pt-12 lg:grid">
                    <aside className="col-span-3">
                        <div className="sticky top-[calc(var(--header-height)+2rem)]">
                            <DeptIndex departments={departments} active={active} vertical prefix="credits" />
                        </div>
                    </aside>
                    <div className="col-span-9">
                        <Credits departments={departments} />
                    </div>
                </div>
            </section>
        </MotionConfig>
    );
}
