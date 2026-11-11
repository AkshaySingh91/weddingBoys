'use client';

/**
 * /films — the hub. Built to make "one more film" effortless:
 *
 *   billboard   the highest-ranked film that has a moving loop: poster first
 *               (the LCP), the loop fades in on capable connections; Play
 *   Top 10      the studio's ranking, big outlined numerals behind the posters
 *   rails       a few intent rails (events, destinations, a theme, a region),
 *               chosen by lib/films.pickRails — not 37 near-empty sections
 *   chip cloud  every other category, as links into the /allfilms library
 *
 * Every card plays in place (FilmCard + useFilmPlayer): no page load between
 * films, "Up next" comes from the same rail, ?watch=<id> makes it shareable.
 * Film links and headings are in the server HTML.
 */
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { FiPlay, FiArrowRight, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { useInView } from 'react-intersection-observer';
import FilmCard from '@/Component/films/FilmCard.jsx';
import useFilmPlayer from '@/Component/films/useFilmPlayer.jsx';
import RevealObserver from '@/Component/home/RevealObserver.jsx';
import useNetworkStatus from '@/Hooks/useNetworkStatus.jsx';
import { focusStyle } from '@/lib/focus.js';
import { coupleOf, blurbOf, filmHref, pickRails } from '@/lib/films.js';
import { contactHref } from '@/lib/contact.js';

const libraryHref = (key) => `/allfilms?category=${encodeURIComponent(key)}`;

/* ── Billboard ─────────────────────────────────────────────────────────── */

function Billboard({ film, total, onPlay }) {
    const { ref, inView } = useInView({ threshold: 0.2 });
    const { tier, online } = useNetworkStatus();
    const [reduced, setReduced] = useState(true);
    const [visible, setVisible] = useState(true);
    const [playing, setPlaying] = useState(false);
    const videoRef = useRef(null);
    useEffect(() => {
        const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
        const sync = () => setReduced(mq.matches);
        sync(); mq.addEventListener('change', sync);
        const vis = () => setVisible(document.visibilityState === 'visible');
        document.addEventListener('visibilitychange', vis);
        return () => { mq.removeEventListener('change', sync); document.removeEventListener('visibilitychange', vis); };
    }, []);
    const allow = Boolean(film?.loopUrl) && online && tier !== 'low' && !reduced;
    useEffect(() => {
        const v = videoRef.current; if (!v) return;
        if (inView && visible) v.play().catch(() => {}); else v.pause();
    }, [inView, visible, allow]);
    if (!film) return null;
    const couple = coupleOf(film);
    return (
        <section ref={ref} aria-labelledby="films-title"
            className="relative -mt-[calc(var(--header-height)+0.75rem)] h-[78svh] min-h-[560px] overflow-hidden bg-ground-deep text-ink-onDeep lg:-mx-4 lg:h-[min(88svh,860px)]">
            {/* eslint-disable-next-line @next/next/no-img-element -- the LCP poster */}
            <img src={film.thumbnailUrl} alt={`${couple} — wedding film`} loading="eager" fetchPriority="high" decoding="async"
                style={{ ...focusStyle(film.focus), ...(film.blurDataURL ? { backgroundImage: `url(${film.blurDataURL})`, backgroundSize: 'cover' } : null) }}
                className="absolute inset-0 h-full w-full object-cover motion-safe:animate-[heroZoom_9s_ease-out_both]" />
            {allow && (
                <video ref={videoRef} src={film.loopUrl} muted loop playsInline preload="auto" aria-hidden="true" onPlaying={() => setPlaying(true)}
                    style={focusStyle(film.focus)}
                    className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-[520ms] ease-entrance ${playing ? 'opacity-100' : 'opacity-0'}`} />
            )}
            <span aria-hidden="true" className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-ground-deep/80 to-transparent" />
            <span aria-hidden="true" className="absolute inset-0 [background:linear-gradient(0deg,rgb(var(--ground-deep-rgb))_0%,rgb(var(--ground-deep-rgb)/0.75)_28%,transparent_62%)] lg:[background:linear-gradient(90deg,rgb(var(--ground-deep-rgb)/0.85),transparent_58%),linear-gradient(0deg,rgb(var(--ground-deep-rgb))_0%,transparent_45%)]" />

            <div className="absolute inset-x-0 bottom-0 pb-10 sm:pb-14 lg:pb-20">
                <div className="mx-auto w-full max-w-wide px-5 md:px-8 lg:px-10">
                    <p className="inline-flex items-center gap-2 rounded-full bg-white/10 py-1 pl-1 pr-3.5 text-[12.5px] font-semibold ring-1 ring-white/15 backdrop-blur-md">
                        <span className="grid h-6 min-w-6 place-items-center rounded-full bg-gold px-1.5 text-[10.5px] tabular-nums text-ground-deep">{total}</span>
                        Our films
                    </p>
                    <h1 id="films-title" className="mt-4 max-w-3xl font-display text-[46px] font-medium leading-[0.98] sm:text-[64px] lg:text-[88px]">
                        Real stories. <span className="italic text-gold">Timeless</span> films.
                    </h1>
                    <p className="mt-5 text-[12px] font-semibold uppercase tracking-[0.18em] text-ink-onDeep/60">Now showing</p>
                    <p className="mt-1 text-[18px] font-semibold sm:text-[20px]">{couple}{blurbOf(film) && <span className="font-normal text-ink-onDeep/70"> — {blurbOf(film)}</span>}</p>
                    <div className="mt-6 flex flex-wrap items-center gap-3">
                        <button type="button" onClick={() => onPlay(film)}
                            className="inline-flex h-[52px] cursor-pointer items-center gap-3 rounded-full bg-white pl-2 pr-6 text-[15px] font-semibold text-ink shadow-[0_14px_34px_-14px_rgba(0,0,0,0.7)]
                                       transition-transform duration-ui ease-standard hover:bg-ground motion-safe:active:scale-[0.97] focus-ring">
                            <span className="grid h-10 w-10 place-items-center rounded-full bg-accent text-ink-onAccent"><FiPlay aria-hidden="true" className="ml-0.5 h-4 w-4" /></span>
                            Play the film
                        </button>
                        <Link href="/allfilms" className="inline-flex h-[52px] items-center gap-2 rounded-full px-5 text-[15px] font-semibold ring-1 ring-white/30 backdrop-blur-md hover:bg-white/10 focus-ring">
                            Browse all {total} <FiArrowRight aria-hidden="true" className="h-4 w-4" />
                        </Link>
                        <Link href={filmHref(film)} className="hidden text-[14px] font-semibold text-ink-onDeep/75 underline-offset-4 hover:underline sm:inline">Film page</Link>
                    </div>
                </div>
            </div>
        </section>
    );
}

/* ── Rails ─────────────────────────────────────────────────────────────── */

function Rail({ id, title, sub, count, href, films, onPlay, rank = false, playingId }) {
    const railRef = useRef(null);
    const startRef = useRef(null);
    const endRef = useRef(null);
    const [ends, setEnds] = useState({ start: true, end: false });
    // Arrows from two sentinels — no state per scroll event.
    useEffect(() => {
        const root = railRef.current;
        if (!root || typeof IntersectionObserver === 'undefined') return undefined;
        const io = new IntersectionObserver((entries) => {
            setEnds((e) => {
                const next = { ...e };
                for (const en of entries) {
                    if (en.target === startRef.current) next.start = en.isIntersecting;
                    if (en.target === endRef.current) next.end = en.isIntersecting;
                }
                return next;
            });
        }, { root, threshold: 0.9 });
        io.observe(startRef.current); io.observe(endRef.current);
        return () => io.disconnect();
    }, []);
    const page = (d) => {
        const el = railRef.current; if (!el) return;
        const card = el.querySelector('article')?.getBoundingClientRect().width || 320;
        el.scrollBy({ left: d * Math.max(card, el.clientWidth - card), behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
    };
    const mask = `${ends.start ? '' : 'lg:[mask-image:linear-gradient(to_right,transparent,#000_80px)]'} ${ends.end ? '' : '[mask-image:linear-gradient(to_right,#000_calc(100%-48px),transparent)]'}`;
    return (
        <section id={id} aria-labelledby={`${id}-title`} className="group/rail relative scroll-mt-24 py-6 sm:py-8">
            <div className="mx-auto flex w-full max-w-wide items-end justify-between gap-4 px-5 md:px-8 lg:px-10">
                <div data-rise="">
                    <h2 id={`${id}-title`} className="text-[22px] font-semibold tracking-[-0.02em] text-ink sm:text-[28px]">
                        {title} {count != null && <span className="align-middle text-[14px] font-medium tabular-nums text-ink-muted">{count}</span>}
                    </h2>
                    {sub && <p className="mt-0.5 text-[14px] text-ink-muted">{sub}</p>}
                </div>
                {href && (
                    <Link href={href} className="inline-flex shrink-0 items-center gap-1.5 text-[14px] font-semibold text-accent-ink hover:text-accent focus-ring">
                        See all <FiArrowRight aria-hidden="true" className="h-4 w-4" />
                    </Link>
                )}
            </div>
            <div className="relative mt-4">
                <div ref={railRef}
                    className={`flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-px-5 px-5 pb-2 scrollbar-none sm:gap-4 md:scroll-px-8 md:px-8
                                lg:mx-auto lg:max-w-wide lg:scroll-px-10 lg:px-10 ${mask}`}
                    onKeyDown={(e) => { if (e.key === 'ArrowRight') page(1); if (e.key === 'ArrowLeft') page(-1); }}>
                    <span ref={startRef} aria-hidden="true" className="w-px shrink-0" />
                    {films.map((f, i) => (
                        <FilmCard key={f.videos._id} film={f} variant={rank ? 'rank' : 'auto'} rank={rank ? i + 1 : undefined} nowPlaying={playingId === f.videos._id}
                            onPlay={(x) => onPlay(x, films)} sizes={rank ? '260px' : '(max-width: 640px) 72vw, 360px'}
                            className={`shrink-0 snap-start ${rank ? 'w-[64vw] sm:w-[300px] lg:w-[330px]' : 'w-[72vw] sm:w-[340px] lg:w-[360px]'}`} />
                    ))}
                    <span ref={endRef} aria-hidden="true" className="w-px shrink-0" />
                </div>
                {!ends.start && (
                    <button type="button" onClick={() => page(-1)} aria-label={`Scroll ${title} left`}
                        className="absolute left-3 top-[38%] hidden h-12 w-12 -translate-y-1/2 cursor-pointer place-items-center rounded-full bg-ground-raised text-ink opacity-0 shadow-[0_10px_24px_-12px_rgba(51,22,26,0.6)] ring-1 ring-ink/10
                                   transition-opacity duration-micro group-hover/rail:opacity-100 focus-visible:opacity-100 focus-ring lg:grid">
                        <FiChevronLeft aria-hidden="true" className="h-5 w-5" />
                    </button>
                )}
                {!ends.end && (
                    <button type="button" onClick={() => page(1)} aria-label={`Scroll ${title} right`}
                        className="absolute right-3 top-[38%] hidden h-12 w-12 -translate-y-1/2 cursor-pointer place-items-center rounded-full bg-ground-raised text-ink opacity-0 shadow-[0_10px_24px_-12px_rgba(51,22,26,0.6)] ring-1 ring-ink/10
                                   transition-opacity duration-micro group-hover/rail:opacity-100 focus-visible:opacity-100 focus-ring lg:grid">
                        <FiChevronRight aria-hidden="true" className="h-5 w-5" />
                    </button>
                )}
            </div>
        </section>
    );
}

/* ── Page ──────────────────────────────────────────────────────────────── */

export default function FilmsClient({ discovery = null }) {
    const films = discovery?.films || [];
    const groups = discovery?.groups || [];
    const best = (discovery?.rows || []).find((r) => r.key === 'best-films')?.items || films;
    const billboard = best.find((f) => f.loopUrl) || best[0];
    const top = best.slice(0, 10);
    const { rails, rest } = pickRails(groups, { total: discovery?.total || films.length });
    const { play, player, playing } = useFilmPlayer(films, discovery?.rows || []);

    if (!discovery) {
        return (
            <div className="mx-auto max-w-wide px-5 py-24 text-center">
                <h1 className="font-display text-[40px]">Our films</h1>
                <p className="mt-3 text-ink-secondary">Films could not be loaded just now. <Link href="/allfilms" className="font-semibold text-accent-ink">Browse all films</Link></p>
            </div>
        );
    }

    // The chip cloud: small categories, by group.
    const cloud = rest.reduce((acc, r) => {
        (acc[r.groupLabel] ||= []).push(r);
        return acc;
    }, {});

    return (
        <div className="bg-ground pb-6">
            <RevealObserver />
            <Billboard film={billboard} total={discovery.total} onPlay={(f) => play(f, best)} />

            <div className="relative z-10 -mt-6 rounded-t-[28px] bg-ground pt-4 lg:-mx-4">
                <Rail id="top-10" title="Our top 10" sub="Ranked by the studio" films={top} onPlay={play} rank playingId={playing?.videos?._id} />
                {rails.map((r) => (
                    <Rail key={r.key} id={`rail-${r.key}`} title={r.title} sub={r.groupLabel} count={r.items.length}
                        href={libraryHref(r.key)} films={r.items} onPlay={play} playingId={playing?.videos?._id} />
                ))}

                {/* More ways to browse */}
                <section aria-labelledby="more-ways-title" className="mx-auto w-full max-w-wide px-5 py-10 md:px-8 lg:px-10">
                    <h2 id="more-ways-title" data-rise="" className="text-[22px] font-semibold tracking-[-0.02em] text-ink sm:text-[28px]">More ways to browse</h2>
                    <p data-rise="" className="mt-1 text-[14px] text-ink-muted">Every place, setting and style we have filmed.</p>
                    <div className="mt-6 space-y-5">
                        {Object.entries(cloud).map(([label, rows]) => (
                            <div key={label} data-rise="fade" className="sm:flex sm:gap-6">
                                <p className="mb-2 w-44 shrink-0 pt-2.5 text-[12px] font-semibold uppercase tracking-[0.16em] text-ink-muted sm:mb-0">{label}</p>
                                <ul className="flex flex-wrap gap-2">
                                    {rows.map((r) => (
                                        <li key={r.key}>
                                            <Link href={libraryHref(r.key)}
                                                className="inline-flex h-10 items-center gap-2 rounded-full bg-ground-raised pl-1.5 pr-4 text-[13.5px] font-semibold text-ink-secondary ring-1 ring-ink/[0.08]
                                                           transition-colors duration-micro hover:text-ink hover:ring-ink/25 motion-safe:active:scale-[0.97] focus-ring">
                                                <span className="grid h-7 min-w-7 place-items-center rounded-full bg-ink/[0.05] px-1.5 text-[11.5px] tabular-nums text-ink">{r.items.length}</span>
                                                {r.title}
                                            </Link>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>
                </section>

                <section className="mx-auto w-full max-w-wide px-5 pb-10 md:px-8 lg:px-10">
                    <div data-rise="sheet" className="flex flex-col items-start justify-between gap-5 rounded-[28px] bg-ground-deep p-6 text-ink-onDeep sm:flex-row sm:items-center sm:p-10">
                        <div>
                            <h2 className="font-display text-[30px] leading-tight sm:text-[40px]">Let&rsquo;s make your story <span className="italic text-gold">next</span>.</h2>
                            <p className="mt-2 text-[15px] text-ink-onDeep/75">Tell us where, when and what you&rsquo;re dreaming of.</p>
                        </div>
                        <Link href={contactHref({ from: 'films', focus: 'date' })} className="inline-flex h-12 shrink-0 items-center gap-2 rounded-full bg-accent px-6 text-[15px] font-semibold text-ink-onAccent hover:bg-accent-hover motion-safe:active:scale-[0.97] focus-ring">
                            Plan your wedding film <FiArrowRight aria-hidden="true" className="h-4 w-4" />
                        </Link>
                    </div>
                </section>
            </div>
            {player}
        </div>
    );
}
