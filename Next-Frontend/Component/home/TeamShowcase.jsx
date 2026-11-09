'use client';

/**
 * The crew — an avatar row and one profile card (the "popular artist" pattern
 * from booking apps).
 *
 * The row is the navigation: ringed portraits, founders marked with a badge;
 * choosing one fills the card below with the large portrait, name and role.
 * Arrows step through the crew. One screen tall on a phone, where seven
 * full-height portraits used to run ~3,900px.
 */
import { useRef, useState } from 'react';
import { AnimatePresence, LayoutGroup, MotionConfig, motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { FiArrowLeft, FiArrowRight } from 'react-icons/fi';
import { ArrowDot, GlassChip, CARD } from './Chapter.jsx';

const mediaUrl = (m) => m?.url || m?.cdnUrl || m?.publicUrl || '';
const isFounder = (p) => /founder/i.test(p.subtitle || '');

export default function TeamShowcase({ items = [] }) {
    const people = items.filter((it) => mediaUrl(it.media?.[0]));
    const [{ i, dir }, setState] = useState({ i: 0, dir: 1 });
    const railRef = useRef(null);
    if (!people.length) return null;
    const n = people.length;
    const go = (to, d = to > i ? 1 : -1) => {
        const next = ((to % n) + n) % n;
        setState({ i: next, dir: d });
        // Keep the chosen avatar in view — scrollTo on the rail, never
        // scrollIntoView, which can also scroll the page vertically.
        const rail = railRef.current;
        const el = rail?.children[next];
        if (rail && el) rail.scrollTo({ left: el.offsetLeft - rail.clientWidth / 2 + el.clientWidth / 2, behavior: 'smooth' });
    };
    const p = people[i];
    const EASE = [0.16, 1, 0.3, 1];

    return (
        <MotionConfig reducedMotion="user">
        <LayoutGroup id="crew">
        <div className="mt-8 sm:mt-12">
            <div ref={railRef} role="tablist" aria-label="Choose a team member"
                className="-mx-5 flex gap-4 overflow-x-auto px-5 pb-3 pt-1 scrollbar-none sm:mx-0 sm:px-0 md:hidden"
                onKeyDown={(e) => {
                    if (e.key === 'ArrowRight') { e.preventDefault(); go(i + 1, 1); }
                    if (e.key === 'ArrowLeft') { e.preventDefault(); go(i - 1, -1); }
                }}>
                {people.map((m, k) => {
                    const on = k === i;
                    return (
                        <button key={m._id || k} type="button" role="tab" aria-selected={on} tabIndex={on ? 0 : -1} onClick={() => go(k)}
                            className="group flex w-[76px] shrink-0 cursor-pointer flex-col items-center gap-2 rounded-2xl focus-ring
                                       transition-transform duration-micro ease-standard motion-safe:active:scale-[0.96]">
                            <span className="relative isolate rounded-full bg-ink/10 p-[3px] transition-colors duration-ui ease-standard group-hover:bg-ink/25">
                                {/* The accent ring is one element that slides to the chosen avatar. */}
                                {on && <motion.span layoutId="crew-ring" aria-hidden="true" className="absolute inset-0 -z-10 rounded-full bg-accent"
                                    transition={{ type: 'spring', bounce: 0.1, duration: 0.32 }} />}
                                <span className="relative block h-[66px] w-[66px] overflow-hidden rounded-full bg-ground-sunk ring-2 ring-ground">
                                    <Image src={mediaUrl(m.media[0])} alt="" fill sizes="66px" className="object-cover" />
                                </span>
                                {isFounder(m) && (
                                    <span className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 rounded-full bg-ink px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.06em] text-gold">
                                        Founder
                                    </span>
                                )}
                            </span>
                            <span className={`w-full truncate text-center text-[12.5px] ${on ? 'font-semibold text-ink' : 'text-ink-muted'}`}>
                                {m.title?.split(' ')[0]}
                            </span>
                        </button>
                    );
                })}
            </div>

            <div className={`mt-4 grid gap-2 p-2 md:mt-0 md:grid-cols-[minmax(0,380px)_1fr] ${CARD}`}>
                <div className="relative aspect-[4/5] overflow-hidden rounded-[22px] bg-ground-sunk">
                    <AnimatePresence initial={false}>
                        <motion.div key={p._id || i} className="absolute inset-0"
                            initial={{ opacity: 0, scale: 1.03 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                            transition={{ duration: 0.32, ease: EASE }}>
                            <Image src={mediaUrl(p.media[0])} alt={p.title || ''} fill sizes="(max-width: 768px) 100vw, 420px" className="object-cover" />
                        </motion.div>
                    </AnimatePresence>
                    {/* Neighbours preloaded, so the crossfade never fades to an empty frame. */}
                    <span aria-hidden="true" className="hidden">
                        {[people[(i + 1) % n], people[(i - 1 + n) % n]].map((m, k) => (
                            <Image key={k} src={mediaUrl(m.media[0])} alt="" width={420} height={525} sizes="(max-width: 768px) 100vw, 420px" />
                        ))}
                    </span>
                    {p.subtitle && <span className="absolute left-3 top-3"><GlassChip>{p.subtitle}</GlassChip></span>}
                </div>
                <div className="flex flex-col p-3 sm:p-6">
                    <p className="text-[13px] font-semibold tabular-nums text-ink-muted">{String(i + 1).padStart(2, '0')} / {String(n).padStart(2, '0')}</p>
                    <motion.div key={p._id || i} aria-live="polite" className="min-h-[76px]"
                        initial={{ opacity: 0, x: dir * 12 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.26, ease: EASE }}>
                        <p className="mt-1 text-[28px] font-semibold leading-tight tracking-[-0.02em] text-ink sm:text-[36px]">{p.title}</p>
                        {p.subtitle && <p className="mt-1 text-[15.5px] text-accent-ink">{p.subtitle}</p>}
                        {p.body && <p className="mt-4 text-[15.5px] leading-relaxed text-ink-secondary">{p.body}</p>}
                    </motion.div>
                    {/* md+: the rest of the crew, so the card is never half empty. */}
                    <ul className="mt-6 hidden grid-cols-3 gap-2 md:grid lg:grid-cols-4">
                        {people.map((m, k) => k !== i && (
                            <li key={m._id || k}>
                                <button type="button" onClick={() => go(k)} aria-label={`${m.title}${m.subtitle ? `, ${m.subtitle}` : ''}`}
                                    className="group relative block aspect-[4/5] w-full cursor-pointer overflow-hidden rounded-2xl bg-ground-sunk focus-ring">
                                    <Image src={mediaUrl(m.media[0])} alt="" fill sizes="160px"
                                        className="object-cover grayscale-[40%] transition-[filter,transform] duration-media ease-entrance group-hover:scale-[1.04] group-hover:grayscale-0" />
                                    <span className="absolute inset-x-1.5 bottom-1.5 truncate rounded-xl bg-white/80 px-2 py-1 text-[11.5px] font-semibold text-ink backdrop-blur-md">
                                        {m.title?.split(' ')[0]}
                                    </span>
                                </button>
                            </li>
                        ))}
                    </ul>
                    <div className="mt-6 flex items-center gap-2 md:mt-auto">
                        <button type="button" onClick={() => go(i - 1, -1)} aria-label="Previous team member"
                            className="grid h-12 w-12 cursor-pointer place-items-center rounded-full bg-ink/[0.05] text-ink transition-colors hover:bg-ink/10 focus-ring">
                            <FiArrowLeft aria-hidden="true" className="h-4 w-4" />
                        </button>
                        <button type="button" onClick={() => go(i + 1, 1)} aria-label="Next team member"
                            className="grid h-12 w-12 cursor-pointer place-items-center rounded-full bg-ink text-ground transition-colors hover:bg-ink/90 focus-ring">
                            <FiArrowRight aria-hidden="true" className="h-4 w-4" />
                        </button>
                        <Link href="/team" className="group ml-auto inline-flex h-12 cursor-pointer items-center gap-2 rounded-full pl-4 text-[14px] font-semibold text-ink focus-ring">
                            Whole team <ArrowDot size="md" />
                        </Link>
                    </div>
                </div>
            </div>
        </div>
        </LayoutGroup>
        </MotionConfig>
    );
}
