'use client';

/**
 * Home hero — the studio's films, playing.
 *
 * Phone: full-height; the film plays behind the statement once it can play
 * through (poster first), with a glass mini-player docked at the bottom
 * (now playing, story dashes, pause, watch). Swipe the hero to change film —
 * it follows the finger, then settles.
 *
 * Desktop: the film plays full-bleed behind the statement (Penpot "A") with a
 * rail of film cards along the bottom (Penpot "B"): one highlight glides to the
 * active card, which shows the progress. Switching is an editor's dissolve
 * with a slight push-in. Hovering or focusing the rail pauses rotation.
 *
 * Delivery and SEO (from the video-motion-designer review):
 *   1. Slide 0's poster <img> is the LCP element (eager, fetchPriority high).
 *      Headline and copy are in the server HTML. No video in the SSR markup.
 *   2. Background video is the ~loop rendition only — never the master.
 *   3. Video mounts after hydration and only when: in view, tab visible,
 *      online, no reduced motion, tier not 'low' (Save-Data / 2G).
 *   4. It fades in on canplaythrough/playing; until then the poster shows.
 *      If autoplay is refused (iOS Low Power Mode) the poster simply stays.
 *   5. After the active film is PLAYING and the browser is idle, the NEXT
 *      film is warmed in a hidden paused <video preload="auto"> — on the
 *      'high' tier only. At most two hero videos are ever mounted.
 *   6. The 7s countdown starts when the film is actually moving (or at once
 *      when video isn't allowed) and stops when paused, off-screen or open.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { LayoutGroup, motion, MotionConfig } from 'framer-motion';
import { FiPlay, FiPause, FiArrowUpRight } from 'react-icons/fi';
import { useInView } from 'react-intersection-observer';
import FilmLightbox from '@/Component/FilmLightbox.jsx';
import useNetworkStatus from '@/Hooks/useNetworkStatus.jsx';

const ADVANCE_MS = 7000;
const RING = 2 * Math.PI * 21;

const captionOf = (slide) => [slide?.clientName?.Bride, slide?.clientName?.Groom].filter(Boolean).join(' & ') || 'Wedding film';
const posterSrcSet = (slide) => (slide.posterVariants || []).filter((v) => v.url && v.width).map((v) => `${v.url} ${v.width}w`).join(', ') || undefined;
const smallPoster = (slide) => (slide.posterVariants || []).filter((v) => v.url && v.width).sort((a, b) => a.width - b.width).find((v) => v.width >= 320)?.url || slide.posterUrl;

function useMedia(query) {
    const [match, setMatch] = useState(false);
    useEffect(() => {
        const mq = window.matchMedia(query);
        const sync = () => setMatch(mq.matches);
        sync();
        mq.addEventListener('change', sync);
        return () => mq.removeEventListener('change', sync);
    }, [query]);
    return match;
}

export default function HeroCarousel({ slides = [] }) {
    const n = slides.length;
    const [current, setCurrent] = useState(0);
    const [dir, setDir] = useState(1);
    const [playingIdx, setPlayingIdx] = useState(-1);   // index whose video is actually moving
    const [paused, setPaused] = useState(false);          // viewer pressed pause
    const [hoverRail, setHoverRail] = useState(false);
    const [lightbox, setLightbox] = useState(null);
    const [warmNext, setWarmNext] = useState(false);
    const [visible, setVisible] = useState(true);
    const videoRefs = useRef(new Map());
    const touch = useRef({ x: 0, y: 0, dx: 0, lock: null });
    const stackRef = useRef(null);

    const { tier, online } = useNetworkStatus();
    const reducedMotion = useMedia('(prefers-reduced-motion: reduce)');
    const desktop = useMedia('(min-width: 1024px)');
    const { ref: viewRef, inView } = useInView({ threshold: 0.25 });

    useEffect(() => {
        const sync = () => setVisible(document.visibilityState === 'visible');
        document.addEventListener('visibilitychange', sync);
        return () => document.removeEventListener('visibilitychange', sync);
    }, []);

    const allowVideo = inView && visible && online && !reducedMotion && tier !== 'low' && !lightbox;
    const loopOf = (s) => s.loopUrl || (tier === 'high' ? s.webUrl : null) || null;
    const next = (current + 1) % Math.max(n, 1);

    // Which slides have a mounted <video>: the active one, plus the next once warmed.
    const mounted = new Set();
    if (allowVideo && n) {
        if (loopOf(slides[current])) mounted.add(current);
        if (warmNext && tier === 'high' && n > 1 && loopOf(slides[next])) mounted.add(next);
    }

    // Play the active video, pause the others.
    useEffect(() => {
        videoRefs.current.forEach((v, i) => {
            if (!v) return;
            if (i === current && allowVideo) v.play().catch(() => {});
            else v.pause();
        });
    }, [current, allowVideo, warmNext]);

    // Warm the next film once the active one is playing and the browser is idle.
    useEffect(() => {
        if (warmNext || playingIdx !== current || tier !== 'high' || n < 2) return undefined;
        const ric = window.requestIdleCallback || ((cb) => setTimeout(cb, 1500));
        const cancel = window.cancelIdleCallback || clearTimeout;
        const id = ric(() => setWarmNext(true), { timeout: 3000 });
        return () => cancel(id);
    }, [playingIdx, current, tier, n, warmNext]);

    const started = !allowVideo || !loopOf(slides[current] || {}) || playingIdx === current;
    const autoplay = n > 1 && inView && visible && !paused && !hoverRail && !lightbox && !reducedMotion && started;

    const go = useCallback((to, d) => {
        setDir(d ?? (to > current ? 1 : -1));
        setCurrent(((to % n) + n) % n);
        setWarmNext(false); // the warmed film becomes active; warm the one after it once this plays
    }, [current, n]);

    useEffect(() => {
        if (!autoplay) return undefined;
        const t = setTimeout(() => go(current + 1, 1), ADVANCE_MS);
        return () => clearTimeout(t);
    }, [autoplay, current, go]);

    // Phone swipe: the stack follows the finger, then settles.
    const onTouchStart = (e) => { touch.current = { x: e.touches[0].clientX, y: e.touches[0].clientY, dx: 0, lock: null }; };
    const onTouchMove = (e) => {
        const t = touch.current;
        const dx = e.touches[0].clientX - t.x; const dy = e.touches[0].clientY - t.y;
        if (t.lock === null && (Math.abs(dx) > 8 || Math.abs(dy) > 8)) t.lock = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y';
        if (t.lock !== 'x' || reducedMotion) return;
        t.dx = dx;
        if (stackRef.current) { stackRef.current.style.transition = 'none'; stackRef.current.style.transform = `translate3d(${dx * 0.35}px,0,0)`; }
    };
    const onTouchEnd = () => {
        const t = touch.current;
        if (stackRef.current) { stackRef.current.style.transition = 'transform 420ms cubic-bezier(0.16,1,0.3,1)'; stackRef.current.style.transform = ''; }
        if (t.lock === 'x' && Math.abs(t.dx) > Math.min(90, window.innerWidth * 0.22)) go(current + (t.dx < 0 ? 1 : -1), t.dx < 0 ? 1 : -1);
    };

    if (!n) return null;
    const active = slides[current];
    const multiple = n > 1;
    const playFilm = () => setLightbox(active);
    // The 720p film everywhere: the masters are 100–290 MB. Master only when no 720p exists.
    const filmSrc = (s) => s.webUrl || s.embedUrl || s.sourceUrl || s.videoUrl;
    const progressStyle = { animationDuration: `${ADVANCE_MS}ms`, animationPlayState: autoplay ? 'running' : 'paused' };

    return (
        <MotionConfig reducedMotion="user">
            {lightbox && (
                <FilmLightbox src={filmSrc(lightbox)} title={captionOf(lightbox)} poster={lightbox.posterUrl}
                    href={lightbox.videoId ? `/films/${lightbox.videoId}` : undefined} onClose={() => setLightbox(null)} />
            )}

            <div ref={viewRef} data-analytics-section="hero"
                className="hero-banner relative isolate -mt-[calc(var(--header-height)+0.75rem)] h-[100svh] min-h-[600px] max-h-[1000px] overflow-hidden bg-ground-deep lg:-mx-4"
                onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd} style={{ touchAction: 'pan-y' }}>

                {/* ── The picture: posters (always) + video layers (when allowed) ── */}
                <div ref={stackRef} className="absolute inset-0 will-change-transform">
                    {slides.map((slide, i) => {
                        const on = i === current;
                        const near = on || i === next;
                        const showVideo = mounted.has(i) && playingIdx === i && on;
                        return (
                            <div key={slide.videoKey || `slide-${i}`} aria-hidden={on ? undefined : true}
                                className={`absolute inset-0 transition-[opacity,transform] ease-entrance motion-reduce:transition-none
                                            ${on ? 'z-10 scale-100 opacity-100 duration-[900ms]' : 'z-0 scale-[1.04] opacity-0 duration-[600ms]'}`}
                                style={!on || desktop ? undefined : { transitionDuration: '700ms' }}>
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                    style={slide.dominantColor ? { backgroundColor: slide.dominantColor } : undefined}
                                    src={near ? slide.posterUrl : undefined}
                                    srcSet={near ? posterSrcSet(slide) : undefined}
                                    sizes="100vw"
                                    alt={on ? `${captionOf(slide)} wedding film` : ''}
                                    className={`absolute inset-0 h-full w-full object-cover ${on ? 'motion-safe:animate-[heroZoom_9s_ease-out_both]' : ''}`}
                                    fetchPriority={i === 0 ? 'high' : 'auto'}
                                    loading={i === 0 ? 'eager' : 'lazy'}
                                    decoding="async"
                                />
                                {mounted.has(i) && (
                                    <video
                                        ref={(el) => { if (el) videoRefs.current.set(i, el); else videoRefs.current.delete(i); }}
                                        data-analytics-video-id={slide.videoId || slide.videoKey}
                                        src={loopOf(slide)}
                                        poster={slide.posterUrl}
                                        preload="auto"
                                        muted
                                        playsInline
                                        loop
                                        autoPlay={on}
                                        onPlaying={() => { if (i === current) setPlayingIdx(i); }}
                                        onCanPlayThrough={(e) => { if (i === current && !e.currentTarget.paused) setPlayingIdx(i); }}
                                        className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-media ease-entrance ${showVideo ? 'opacity-100' : 'opacity-0'}`}
                                    />
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* Scrims */}
                <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 z-20 h-48 bg-gradient-to-b from-ground-deep/60 to-transparent" />
                <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-20 bg-gradient-to-t from-ground-deep/90 via-ground-deep/25 to-transparent
                                                   lg:bg-[linear-gradient(90deg,rgb(var(--ground-deep-rgb)/0.8),rgb(var(--ground-deep-rgb)/0.15)_60%,transparent),linear-gradient(0deg,rgb(var(--ground-deep-rgb)/0.85),transparent_38%)]" />

                {/* ── Statement ── */}
                <div className="absolute inset-x-0 bottom-[150px] z-30 px-5 sm:px-8 lg:bottom-auto lg:top-[42%] lg:-translate-y-1/2 lg:px-20">
                    <h1 className="max-w-[12ch] font-display text-[46px] font-medium leading-[0.98] text-ink-onDeep
                                   motion-safe:animate-[fadeUp_600ms_cubic-bezier(0.16,1,0.3,1)_backwards] sm:text-[64px] lg:text-[96px]">
                        Films, not recaps.
                    </h1>
                    <p className="mt-4 max-w-md text-[15px] leading-relaxed text-ink-onDeep/85 motion-safe:animate-[fadeUp_600ms_cubic-bezier(0.16,1,0.3,1)_80ms_backwards] sm:text-[17px]">
                        Shot by the founders. Based in Mumbai, filming across India.
                    </p>
                    <Link href="/films"
                        className="group mt-6 inline-flex h-12 items-center gap-3 rounded-full bg-white/15 pl-5 pr-1.5 text-[14.5px] font-semibold text-ink-onDeep
                                   ring-1 ring-white/35 backdrop-blur-md transition-colors duration-ui ease-standard hover:bg-white/25 focus-ring
                                   motion-safe:animate-[fadeUp_600ms_cubic-bezier(0.16,1,0.3,1)_160ms_backwards]">
                        All films
                        <span aria-hidden="true" className="grid h-9 w-9 place-items-center rounded-full bg-white/20">
                            <FiArrowUpRight className="h-4 w-4 transition-transform duration-ui ease-standard group-hover:-translate-y-px group-hover:translate-x-px" />
                        </span>
                    </Link>
                </div>

                {/* ── Phone: glass mini-player ── */}
                <div className="absolute inset-x-3 bottom-[max(0.75rem,env(safe-area-inset-bottom))] z-30 sm:inset-x-auto sm:right-6 sm:w-[440px] lg:hidden">
                    {multiple && (
                        <div aria-hidden="true" className="mb-2 flex gap-1.5 px-3">
                            {slides.map((s, i) => (
                                <span key={s.videoKey || i} className="h-[3px] flex-1 overflow-hidden rounded-full bg-white/30">
                                    {i < current && <span className="block h-full w-full bg-white" />}
                                    {i === current && <span key={current} className="block h-full w-full origin-left bg-white motion-safe:animate-[heroBar_linear_forwards] motion-reduce:scale-x-100" style={progressStyle} />}
                                </span>
                            ))}
                        </div>
                    )}
                    <div className="flex items-center gap-2.5 rounded-[28px] bg-white/80 p-2 pr-2.5 shadow-[0_20px_44px_-20px_rgba(51,22,26,0.6)] ring-1 ring-white/60 backdrop-blur-xl sm:gap-3 sm:rounded-[30px] sm:pr-3">
                        <div className="relative shrink-0">
                            <button type="button" onClick={playFilm} aria-label={`Play film — ${captionOf(active)}`}
                                className="relative block aspect-video w-28 cursor-pointer overflow-hidden rounded-[20px] bg-ground-deep focus-ring sm:w-36">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img key={current} src={smallPoster(active)} alt="" className="absolute inset-0 h-full w-full object-cover motion-safe:animate-[fadeUp_220ms_ease-out]" />
                            </button>
                            {multiple && !reducedMotion && (
                                <button type="button" onClick={() => setPaused((v) => !v)} aria-label={paused ? 'Resume films' : 'Pause films'}
                                    className="absolute left-1.5 top-1.5 grid h-7 w-7 cursor-pointer place-items-center rounded-full bg-white/85 text-ink shadow-sm backdrop-blur transition-colors hover:bg-white focus-ring">
                                    {paused ? <FiPlay className="ml-px h-3 w-3" /> : <FiPause className="h-3 w-3" />}
                                </button>
                            )}
                        </div>
                        <Link href={`/films/${active.videoId}`} className="min-w-0 flex-1 rounded-xl focus-ring" aria-live="polite">
                            <span className="block text-[10.5px] font-semibold uppercase tracking-[0.12em] text-accent-ink">Now playing</span>
                            <span key={current} className="mt-0.5 block truncate font-display text-[17px] leading-tight text-ink motion-safe:animate-[fadeUp_320ms_cubic-bezier(0.16,1,0.3,1)]">
                                {captionOf(active)}
                            </span>
                            <span className="block text-[11.5px] text-ink-muted">Film {current + 1} of {n}</span>
                        </Link>
                        <button type="button" onClick={playFilm} aria-label={`Watch ${captionOf(active)}`}
                            className="relative grid h-12 w-12 shrink-0 cursor-pointer place-items-center rounded-full bg-ground-deep text-ink-onDeep transition-transform duration-micro ease-standard motion-safe:active:scale-95 focus-ring">
                            <FiPlay className="relative ml-0.5 h-4 w-4" />
                            {multiple && (
                                <svg aria-hidden="true" viewBox="0 0 48 48" className="absolute inset-0 -rotate-90">
                                    <circle cx="24" cy="24" r="21" fill="none" stroke="rgb(var(--ink-on-deep-rgb) / 0.15)" strokeWidth="2.5" />
                                    <circle key={current} cx="24" cy="24" r="21" fill="none" stroke="rgb(var(--accent-rgb))" strokeWidth="2.5" strokeLinecap="round"
                                        strokeDasharray={RING} style={{ strokeDashoffset: RING, animationName: 'heroRing', animationTimingFunction: 'linear', animationFillMode: 'forwards', ...progressStyle }} />
                                </svg>
                            )}
                        </button>
                    </div>
                </div>

                {/* ── Desktop: now playing + film rail ── */}
                <div className="absolute inset-x-0 bottom-0 z-30 hidden px-20 pb-10 lg:block">
                    <div className="mb-5 flex items-end justify-between gap-6">
                        <div aria-live="polite" className="min-w-0">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-onDeep/70">Now playing</p>
                            <p key={current} className="mt-1 truncate font-display text-[30px] leading-tight text-ink-onDeep motion-safe:animate-[fadeUp_420ms_cubic-bezier(0.16,1,0.3,1)]">
                                {captionOf(active)}
                            </p>
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                            {multiple && (
                                <button type="button" onClick={() => setPaused((v) => !v)} aria-label={paused ? 'Resume films' : 'Pause films'}
                                    className="grid h-12 w-12 cursor-pointer place-items-center rounded-full bg-white/15 text-ink-onDeep ring-1 ring-white/30 backdrop-blur-md transition-colors hover:bg-white/25 focus-ring">
                                    {paused ? <FiPlay className="ml-0.5 h-4 w-4" /> : <FiPause className="h-4 w-4" />}
                                </button>
                            )}
                            <button type="button" onClick={playFilm}
                                className="inline-flex h-12 cursor-pointer items-center gap-2.5 rounded-full bg-ink-onDeep pl-2 pr-5 text-[14.5px] font-semibold text-ink transition-transform duration-micro motion-safe:active:scale-[0.97] focus-ring">
                                <span aria-hidden="true" className="grid h-9 w-9 place-items-center rounded-full bg-accent text-ink-onAccent"><FiPlay className="ml-0.5 h-4 w-4" /></span>
                                Watch the film
                            </button>
                        </div>
                    </div>
                    {multiple && (
                        <LayoutGroup id="hero-rail">
                            <div className="flex gap-4" role="group" aria-label="Choose a film"
                                onMouseEnter={() => setHoverRail(true)} onMouseLeave={() => setHoverRail(false)}
                                onFocus={() => setHoverRail(true)} onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) setHoverRail(false); }}>
                                {slides.map((s, i) => {
                                    const on = i === current;
                                    return (
                                        <button key={s.videoKey || i} type="button" aria-pressed={on} aria-label={`Show ${captionOf(s)}`}
                                            onClick={() => go(i, i > current ? 1 : -1)}
                                            className="group relative w-[200px] shrink-0 cursor-pointer text-left transition-transform duration-ui ease-standard hover:-translate-y-1 focus-ring rounded-[20px]">
                                            <span className="relative block aspect-video overflow-hidden rounded-[20px] bg-ground-deep">
                                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                                <img src={smallPoster(s)} alt={`${captionOf(s)} wedding film`} loading="lazy" decoding="async"
                                                    className={`absolute inset-0 h-full w-full object-cover transition-[opacity,transform] duration-ui ease-standard group-hover:scale-[1.06]
                                                                ${on ? 'opacity-100' : 'opacity-60 group-hover:opacity-90'}`} />
                                                {on && <motion.span layoutId="rail-active" aria-hidden="true" className="pointer-events-none absolute inset-0 z-10 rounded-[20px] ring-2 ring-inset ring-white/80"
                                                    transition={{ type: 'spring', stiffness: 400, damping: 36 }} />}
                                                {on && (
                                                    <span className="absolute inset-x-0 bottom-0 h-[3px] bg-white/25">
                                                        <span key={current} className="block h-full w-full origin-left bg-accent motion-safe:animate-[heroBar_linear_forwards] motion-reduce:scale-x-100" style={progressStyle} />
                                                    </span>
                                                )}
                                            </span>
                                            <span className={`mt-2 block truncate text-[13px] font-semibold ${on ? 'text-ink-onDeep' : 'text-ink-onDeep/65'}`}>{captionOf(s)}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </LayoutGroup>
                    )}
                </div>
            </div>
        </MotionConfig>
    );
}
