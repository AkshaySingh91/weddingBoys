'use client';

/**
 * FilmLightbox — what happens when someone presses play.
 *
 * Watch in place, then go deeper without hunting for it: beside the film sits
 * "the story behind it" — couple, event, place and length, the categories it
 * belongs to (into the library), their wedding story with a photo mosaic, the
 * film's own page, who filmed it, other films from the same wedding, and Up
 * next. Everything is one tap away while the film keeps playing.
 *
 * Ground: warm, not black — the brand's wine, lit by a large blurred copy of
 * the film's poster (painted once; no per-frame sampling), so each film tints
 * its own room.
 *
 *   Desktop  the film on the left, sized to the viewport HEIGHT so nothing is
 *            ever cut off; the story panel on the right, scrolling on its own.
 *   Phone    full screen — no empty space above: the film pinned at the top,
 *            the story and Up next scrolling beneath. The bar above the film
 *            drags down to close; Back closes too.
 *
 * Both: focus moves in and is restored, the page behind is locked, Escape
 * closes, reduced motion skips the travel. While open, the address can show
 * ?watch=<id> (url) so the film can be shared.
 *
 * Props: src, title, poster?, href? (film page), onClose, url?,
 *        upNext? { title, poster, blurb?, onPlay } — starts by itself 6s after the film ends,
 *        more? [{ id, title, poster, blurb?, onPlay }] — the rest of the queue,
 *        meta? 'Pre-Wedding · Goa', chips? [{ label, href }],
 *        detailId? — fetches /api/videos/:id for the wedding story, photos, crew,
 *        other films and length; playId?(id) → true if that film can play in place.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createPortal } from 'react-dom';
import { motion, MotionConfig, useDragControls, useMotionValue, useTransform } from 'framer-motion';
import { FiX, FiArrowUpRight, FiPlay, FiClock, FiMapPin } from 'react-icons/fi';
import Videoplayer from '@/Component/Videoplayer.jsx';

const EMBED = /^https:\/\/(www\.youtube-nocookie\.com\/embed\/|player\.vimeo\.com\/video\/)/;
const withAutoplay = (u) => `${u}${u.includes('?') ? '&' : '?'}autoplay=1`;
const EASE = [0.16, 1, 0.3, 1];
const api = process.env.NEXT_PUBLIC_API_URL || '';

const mins = (s) => (Number.isFinite(s) && s > 0 ? (s < 60 ? `${Math.round(s)} sec` : `${Math.floor(s / 60)} min ${Math.round(s % 60)} sec`) : null);

function useIsWide() {
    const [wide, setWide] = useState(() => typeof window !== 'undefined' && window.matchMedia('(min-width: 1024px)').matches);
    useEffect(() => {
        const mq = window.matchMedia('(min-width: 1024px)');
        const sync = () => setWide(mq.matches);
        mq.addEventListener('change', sync);
        return () => mq.removeEventListener('change', sync);
    }, []);
    return wide;
}

/** The wedding behind the film: story link, photos, crew, other films, length. */
function useDetail(id) {
    const [detail, setDetail] = useState(null);
    useEffect(() => {
        if (!id) return undefined;
        const c = new AbortController();
        fetch(`${api}/api/videos/${encodeURIComponent(id)}`, { signal: c.signal })
            .then((r) => (r.ok ? r.json() : null)).then((d) => setDetail(d ? { id, ...d } : null)).catch(() => {});
        return () => c.abort();
    }, [id]);
    return detail?.id === id ? detail : null;
}

function MiniFilm({ item, label, onClick, countdown }) {
    return (
        <button type="button" onClick={onClick}
            className="group relative flex w-full cursor-pointer items-center gap-3 rounded-[16px] p-1.5 pr-3 text-left transition-colors duration-ui hover:bg-white/[0.08] focus-ring">
            <span className="relative aspect-video w-[104px] shrink-0 overflow-hidden rounded-[11px] bg-black/30">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {item.poster && <img src={item.poster} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover transition-transform duration-media group-hover:scale-105" />}
                <span aria-hidden="true" className="absolute inset-0 grid place-items-center bg-black/0 transition-colors group-hover:bg-black/25">
                    <FiPlay className="ml-0.5 h-5 w-5 text-white opacity-0 transition-opacity group-hover:opacity-100" />
                </span>
            </span>
            <span className="min-w-0 flex-1">
                {label && <span className="block text-[10.5px] font-semibold uppercase tracking-[0.16em] text-white/55">{label}</span>}
                <span className="block truncate font-display text-[16.5px] leading-tight text-white">{item.title}</span>
                {item.blurb && <span className="block truncate text-[12.5px] text-white/60">{item.blurb}</span>}
            </span>
            {countdown && (
                <span aria-hidden="true" className="absolute inset-x-2 -bottom-0.5 h-[3px] overflow-hidden rounded-full bg-white/15">
                    <span className="block h-full origin-left rounded-full bg-gold motion-safe:animate-[heroBar_6s_linear_both]" />
                </span>
            )}
        </button>
    );
}

export default function FilmLightbox({ src, title, poster, href, onClose, upNext, url, more = [], meta, chips = [], detailId, playId }) {
    const restoreTo = useRef(null);
    const closeRef = useRef(null);
    const pushed = useRef(false);
    const wide = useIsWide();
    const detail = useDetail(detailId);
    const router = useRouter();

    // Up-next countdown: armed when the film ends; Cancel or a new film disarms it.
    const [ending, setEnding] = useState(false);
    const [prevSrc, setPrevSrc] = useState(src);
    if (prevSrc !== src) { setPrevSrc(src); setEnding(false); }
    // Keyed on WHICH film is next, not the object (callers rebuild it each render).
    const upNextRef = useRef(upNext);
    useEffect(() => { upNextRef.current = upNext; });
    const nextKey = upNext ? (upNext.id || upNext.title) : null;
    useEffect(() => {
        if (!ending || !nextKey) return undefined;
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;   // no auto-advance: the button stays
        const t = setTimeout(() => upNextRef.current?.onPlay(), 6000);
        return () => clearTimeout(t);
    }, [ending, nextKey]);
    // A swapped film keeps the address in step.
    useEffect(() => { if (url && pushed.current) window.history.replaceState({ film: true }, '', url); }, [url]);
    const y = useMotionValue(0);
    const groundOpacity = useTransform(y, [0, 320], [1, 0]);
    const drag = useDragControls();

    // The latest onClose / url without re-running the open effect: callers often
    // pass a fresh arrow each render, and re-running it would push a new history
    // entry every time (then Back would not return to the page's own address).
    const onCloseRef = useRef(onClose);
    const urlRef = useRef(url);
    useEffect(() => { onCloseRef.current = onClose; urlRef.current = url; });

    // Close through history when we pushed an entry, so Back and the X agree.
    const close = useCallback(() => {
        if (pushed.current) { pushed.current = false; window.history.back(); } else onCloseRef.current();
    }, []);
    // Leaving for a page: the film entry stays behind, so Back returns to the film.
    const leave = () => { pushed.current = false; };

    // Open once: lock the page, push one history entry, wire Back / Escape.
    useEffect(() => {
        restoreTo.current = document.activeElement;
        const { overflow } = document.body.style;
        document.body.style.overflow = 'hidden';
        // Re-mounting over our own entry (React dev re-runs effects) reuses it.
        if (window.history.state?.film) window.history.replaceState({ film: true }, '', urlRef.current || undefined);
        else window.history.pushState({ film: true }, '', urlRef.current || undefined);
        pushed.current = true;
        const onPop = () => { pushed.current = false; onCloseRef.current(); };
        const onKey = (e) => { if (e.key === 'Escape') close(); };
        window.addEventListener('popstate', onPop);
        document.addEventListener('keydown', onKey);
        const raf = requestAnimationFrame(() => closeRef.current?.focus({ preventScroll: true }));
        return () => {
            cancelAnimationFrame(raf);
            window.removeEventListener('popstate', onPop);
            document.removeEventListener('keydown', onKey);
            document.body.style.overflow = overflow;
            restoreTo.current?.focus?.({ preventScroll: true });
        };
    }, [close]);

    const film = EMBED.test(src || '') ? (
        <div key={src} className="relative aspect-video w-full bg-black">
            <iframe src={withAutoplay(src)} title={title || 'Wedding film'} allow="autoplay; fullscreen; picture-in-picture; encrypted-media"
                allowFullScreen className="absolute inset-0 h-full w-full border-0" />
        </div>
    ) : (
        <Videoplayer key={src} src={src} poster={poster} title={title} autoPlay onEnded={() => setEnding(true)} />
    );

    // ── the story panel ────────────────────────────────────────────────────
    const length = mins(detail?.selectedVideo?.durationSec);
    const story = detail?.wedding?.href ? detail.wedding : null;
    const photos = (detail?.photos || []).filter((p) => p.url);
    const crew = [...new Map((detail?.selectedVideo?.bts || []).map((c) => [c.key, c])).values()].slice(0, 6);
    const siblings = (detail?.remainingVideos || []).filter((v) => v._id !== detailId).slice(0, 3);
    const hasPanel = Boolean(detailId || upNext || more.length || chips.length);

    const panel = (
        <div className="space-y-6 text-white">
            <div>
                <p className="font-display text-[26px] leading-tight lg:text-[30px]">{title}</p>
                <p className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13.5px] text-white/70">
                    {meta && <span className="inline-flex items-center gap-1.5"><FiMapPin aria-hidden="true" className="h-3.5 w-3.5" />{meta}</span>}
                    {length && <span className="inline-flex items-center gap-1.5"><FiClock aria-hidden="true" className="h-3.5 w-3.5" />{length}</span>}
                </p>
                {chips.length > 0 && (
                    <ul className="mt-3 flex flex-wrap gap-1.5" aria-label="Find more films like this">
                        {chips.map((c) => (
                            <li key={c.label}>
                                <Link href={c.href} onClick={leave}
                                    className="inline-flex h-8 items-center rounded-full bg-white/[0.08] px-3 text-[12.5px] font-semibold text-white/85 ring-1 ring-white/10 transition-colors hover:bg-white/[0.16] hover:text-white focus-ring">
                                    {c.label}
                                </Link>
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            {/* their wedding story — the way into the detail pages */}
            {(story || href) && (
                <div className="overflow-hidden rounded-[20px] bg-white/[0.06] ring-1 ring-white/10">
                    {story && (
                        <Link href={story.href} onClick={leave} className="group block focus-ring">
                            <div className="grid h-28 grid-cols-4 gap-0.5 overflow-hidden">
                                {(photos.length ? photos.slice(0, 4) : [{ url: poster }]).map((p, i, list) => (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img key={p._id || i} src={p.url} alt="" loading="lazy"
                                        className={`h-full w-full object-cover transition-transform duration-media group-hover:scale-105 ${list.length === 1 ? 'col-span-4' : i === 0 && list.length === 2 ? 'col-span-3' : ''}`} />
                                ))}
                            </div>
                            <div className="flex items-center justify-between gap-3 p-4">
                                <div className="min-w-0">
                                    <p className="text-[10.5px] font-semibold uppercase tracking-[0.16em] text-gold">Their wedding story</p>
                                    <p className="mt-0.5 truncate text-[15px] font-semibold">
                                        {photos.length ? `${photos.length} photos, the films and the day` : 'The films and the day, in full'}
                                    </p>
                                </div>
                                <span aria-hidden="true" className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white text-[#2B1318] transition-transform group-hover:-translate-y-px group-hover:translate-x-px">
                                    <FiArrowUpRight className="h-4 w-4" />
                                </span>
                            </div>
                        </Link>
                    )}
                    {href && (
                        <Link href={href} onClick={leave}
                            className={`flex items-center justify-between px-4 py-3 text-[13.5px] font-semibold text-white/80 transition-colors hover:bg-white/[0.06] hover:text-white focus-ring ${story ? 'border-t border-white/10' : ''}`}>
                            Film details &amp; credits <FiArrowUpRight aria-hidden="true" className="h-4 w-4" />
                        </Link>
                    )}
                </div>
            )}

            {crew.length > 0 && (
                <div>
                    <p className="text-[10.5px] font-semibold uppercase tracking-[0.16em] text-white/55">Filmed by</p>
                    <p className="mt-1.5 text-[13.5px] leading-relaxed text-white/80">{crew.map((c) => `${c.key} (${c.value})`).join(' · ')}</p>
                </div>
            )}

            {siblings.length > 0 && (
                <div>
                    <p className="mb-1.5 text-[10.5px] font-semibold uppercase tracking-[0.16em] text-white/55">Also from this wedding</p>
                    {siblings.map((v) => {
                        const item = { title: [detail.clientName?.Bride, detail.clientName?.Groom].filter(Boolean).join(' & ') || 'Film', poster: v.thumbnailUrl, blurb: (v.tags || []).slice(0, 2).join(' · ') };
                        return playId
                            ? <MiniFilm key={v._id} item={item} onClick={() => { if (!playId(v._id)) { leave(); router.push(`/films/${v._id}`); } }} />
                            : <Link key={v._id} href={`/films/${v._id}`} onClick={leave} className="block rounded-[16px] focus-ring"><MiniFilm item={item} /></Link>;
                    })}
                </div>
            )}

            {upNext && (
                <div>
                    <div className="mb-1.5 flex items-center justify-between">
                        <p className="text-[10.5px] font-semibold uppercase tracking-[0.16em] text-white/55" aria-live="polite">{ending ? 'Next film starting…' : 'Up next'}</p>
                        {ending && (
                            <button type="button" onClick={() => setEnding(false)}
                                className="h-8 cursor-pointer rounded-full px-3 text-[12.5px] font-semibold text-white/80 ring-1 ring-white/20 hover:bg-white/10 focus-ring">
                                Cancel
                            </button>
                        )}
                    </div>
                    <MiniFilm item={upNext} onClick={upNext.onPlay} countdown={ending} />
                    {more.map((m) => <MiniFilm key={m.id} item={m} onClick={m.onPlay} />)}
                </div>
            )}
        </div>
    );

    const closeBtn = (
        <button ref={closeRef} type="button" onClick={close} aria-label="Close film"
            className="grid h-11 w-11 shrink-0 cursor-pointer place-items-center rounded-full bg-white/10 text-white ring-1 ring-white/20 backdrop-blur
                       transition-colors duration-micro ease-standard hover:bg-white/20 focus-ring">
            <FiX className="h-5 w-5" />
        </button>
    );

    if (typeof document === 'undefined') return null;
    return createPortal(
        <MotionConfig reducedMotion="user">
            <div role="dialog" aria-modal="true" aria-label={title ? `${title} — film` : 'Film'} className="fixed inset-0 z-modal">
                {/* Warm ground, lit by the film's own poster */}
                <motion.div aria-hidden="true" className="absolute inset-0" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.25 }}
                    onClick={wide ? close : undefined}>
                    <motion.div className="absolute inset-0 overflow-hidden bg-[#2B1318]" style={!wide ? { opacity: groundOpacity } : undefined}>
                        {poster && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img key={poster} src={poster} alt="" className="absolute inset-0 h-full w-full scale-125 object-cover opacity-60 blur-[90px] saturate-[1.25]" />
                        )}
                        <span className="absolute inset-0 [background:radial-gradient(120%_90%_at_30%_40%,transparent,rgba(43,19,24,0.55)_70%,rgba(43,19,24,0.85))]" />
                    </motion.div>
                </motion.div>

                {wide ? (
                    /* Desktop: film (fit to height) + the story panel */
                    <div className="pointer-events-none absolute inset-0 flex gap-6 p-6 xl:gap-8 xl:p-8">
                        <motion.div className="pointer-events-auto flex min-w-0 flex-1 items-center justify-center"
                            initial={{ opacity: 0, y: 16, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.52, ease: EASE }}>
                            <div className="w-full overflow-hidden rounded-[20px] shadow-[0_40px_90px_-30px_rgba(0,0,0,0.7)] ring-1 ring-white/10"
                                style={{ maxWidth: 'calc((100svh - 4rem) * 16 / 9)' }}>
                                {film}
                            </div>
                        </motion.div>
                        {hasPanel ? (
                            <motion.aside aria-label="About this film"
                                className="pointer-events-auto relative flex w-[360px] shrink-0 flex-col overflow-hidden rounded-[24px] bg-[#2B1318]/55 ring-1 ring-white/10 backdrop-blur-2xl xl:w-[380px]"
                                initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.45, ease: EASE, delay: 0.08 }}>
                                <div className="absolute right-4 top-4 z-10">{closeBtn}</div>
                                <div className="flex-1 overflow-y-auto overscroll-contain p-5 pr-4 pt-6 scrollbar-none">{panel}</div>
                            </motion.aside>
                        ) : (
                            <div className="pointer-events-auto absolute right-6 top-6">{closeBtn}</div>
                        )}
                    </div>
                ) : (
                    /* Phone / tablet: full screen — film pinned at the top, story beneath */
                    <motion.div className="absolute inset-0 flex flex-col"
                        style={{ y }} initial={{ y: '100%' }} animate={{ y: 0 }} transition={{ duration: 0.36, ease: EASE }}
                        drag="y" dragControls={drag} dragListener={false} dragConstraints={{ top: 0, bottom: 0 }} dragElastic={{ top: 0, bottom: 0.6 }}
                        onDragEnd={(_, info) => { if (info.offset.y > 120 || info.velocity.y > 500) close(); }}>
                        {/* the bar above the film: drag it down to close */}
                        <div className="flex shrink-0 touch-none items-center justify-between gap-3 px-3 pb-2 pt-[max(0.6rem,env(safe-area-inset-top))]"
                            onPointerDown={(e) => { if (!e.target.closest('button')) drag.start(e); }}>
                            <span aria-hidden="true" className="ml-1 h-1 w-10 rounded-full bg-white/30" />
                            {closeBtn}
                        </div>
                        <div className="shrink-0">{film}</div>
                        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-5">
                            {panel}
                        </div>
                    </motion.div>
                )}
            </div>
        </MotionConfig>,
        document.body,
    );
}
