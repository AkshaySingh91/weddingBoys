'use client';

import { useCallback, useState, useRef, useEffect } from 'react';
import { FiPlay, FiPause, FiArrowUpRight } from 'react-icons/fi';
import Link from 'next/link';
import { useInView } from 'react-intersection-observer';
import FilmLightbox from '@/Component/FilmLightbox.jsx';
import useNetworkStatus from '@/Hooks/useNetworkStatus.jsx';

/**
 * Hero — still-first, with a glass mini-player (Penpot board "D3").
 *
 * The full-height background is the active film's POSTER, never its video: a
 * slow connection or an unflattering frame can never be the first impression.
 * Stills crossfade between films with a slow zoom. The film itself plays only
 * in the mini-player's 16:9 thumbnail, docked at the bottom — tap to watch.
 *
 * Delivery rules (unchanged):
 *   1. Every slide paints its POSTER immediately. The poster is the LCP element.
 *   2. Only the ACTIVE film ever mounts a <video>, preload="none", inside the
 *      mini-player thumbnail.
 *   3. Video is gated on the hero being in view, reduced motion, a connection
 *      tier that can afford it, and being online.
 *
 * Posters are plain <img> rather than next/image on purpose: while the API still
 * hands out per-request SIGNED S3 URLs, every page load produces a new URL, so
 * the Next optimizer would re-download and re-encode the same photo for every
 * visitor while never once serving a cache hit. Once media moves to immutable
 * R2 CDN URLs this becomes next/image with the variant-snapping loader.
 */
const ADVANCE_MS = 7000;
const RING = 2 * Math.PI * 21; // play button progress ring (r = 21)

export default function HeroCarousel({ slides = [] }) {
    const [currentSlide, setCurrentSlide] = useState(0);
    const [lightboxUrl, setLightboxUrl] = useState(null);
    const [canPlay, setCanPlay] = useState(false);

    const touchStartX = useRef(0);
    const touchEndX = useRef(0);

    const { tier, online } = useNetworkStatus();

    /**
     * Pick the cheapest rendition that still looks right.
     *
     * The hero is decoration, not the feature — it must never cost a visitor the
     * full master. `loop` is a ~1 MB silent clip built for exactly this; `web` is
     * the 720p re-encode; the master is reached only through the play button.
     */
    // Posters ship as WebP variants (~29 KB at 1280px) alongside the JPEG master
    // (~133 KB). Browsers that understand the srcset take the small one; anything
    // else falls back to `src`.
    const posterSrcSet = (slide) => (slide.posterVariants || [])
        .filter((v) => v.url && v.width)
        .map((v) => `${v.url} ${v.width}w`)
        .join(', ') || undefined;

    /** "Bride & Groom", or a sensible fallback if a name is missing. */
    const captionOf = (slide) => [slide?.clientName?.Bride, slide?.clientName?.Groom]
        .filter(Boolean).join(' & ') || 'Wedding film';

    const heroSrc = (slide) => (tier === 'medium'
        ? (slide.loopUrl || slide.webUrl || null)
        : (slide.loopUrl || slide.webUrl || slide.sourceUrl || slide.videoUrl || null));
    const { ref: viewRef, inView } = useInView({ threshold: 0.25 });

    // Respect the OS "reduce motion" setting for an autoplaying background video.
    const [reducedMotion, setReducedMotion] = useState(false);
    useEffect(() => {
        const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
        const sync = () => setReducedMotion(mq.matches);
        sync();
        mq.addEventListener('change', sync);
        return () => mq.removeEventListener('change', sync);
    }, []);

    // On a 'low' tier the hero stays a still image — no video is requested at all.
    const allowVideo = inView && online && !reducedMotion && tier !== 'low';

    // Auto-advance: one film every ADVANCE_MS while the hero is on screen, the
    // visitor has not paused it, no film is open and motion is allowed. The
    // progress ring around the play button shows the same countdown.
    const [paused, setPaused] = useState(false);
    const autoplay = slides.length > 1 && inView && !paused && !lightboxUrl && !reducedMotion;
    useEffect(() => {
        if (!autoplay) return undefined;
        const t = setTimeout(() => { setCanPlay(false); setCurrentSlide((i) => (i + 1) % slides.length); }, ADVANCE_MS);
        return () => clearTimeout(t);
    }, [autoplay, currentSlide, slides.length]);

    const handleSlideChange = useCallback((direction) => {
        // A new slide mounts a new <video>; hide it until that element reports
        // canplay. Reset here rather than in an effect on currentSlide — this is
        // the event that causes the change, so no cascading render is needed.
        setCanPlay(false);
        setCurrentSlide((prev) => {
            if (!slides.length) return prev;
            return direction === 'next'
                ? (prev + 1) % slides.length
                : prev === 0 ? slides.length - 1 : prev - 1;
        });
    }, [slides.length]);

    /** Jump straight to a slide — used by the indicators. */
    const goToSlide = useCallback((index) => {
        setCanPlay(false);
        setCurrentSlide(index);
    }, []);

    const handleTouchEnd = useCallback(() => {
        const change = touchEndX.current - touchStartX.current;
        if (Math.abs(change) > 50) handleSlideChange(change > 0 ? 'prev' : 'next');
    }, [handleSlideChange]);

    if (!slides.length) return null;

    const active = slides[currentSlide];
    const multiple = slides.length > 1;
    const playFilm = () => setLightboxUrl(active.sourceUrl || active.webUrl || active.videoUrl || active.embedUrl);

    return (
        <>
            {lightboxUrl && (
                <FilmLightbox src={lightboxUrl} title={captionOf(active)} onClose={() => setLightboxUrl(null)} />
            )}

            {/* Full-bleed, full-height: pulled up under the floating header and out
                of the page wrapper's padding (#top: py-3, lg:px-4). */}
            <div
                ref={viewRef}
                data-analytics-section="hero"
                className="hero-banner relative isolate -mt-[calc(var(--header-height)+0.75rem)] h-[100svh] min-h-[600px] max-h-[1000px]
                           w-auto overflow-hidden bg-ground-deep lg:-mx-4"
                onTouchStart={(e) => { touchStartX.current = e.touches[0].clientX; touchEndX.current = e.touches[0].clientX; }}
                onTouchMove={(e) => { touchEndX.current = e.touches[0].clientX; }}
                onTouchEnd={handleTouchEnd}
            >
                {/* Stills, stacked and crossfaded. */}
                {slides.map((slide, index) => {
                    const isActive = index === currentSlide;
                    const near = isActive || index === (currentSlide + 1) % slides.length;
                    return (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                            key={slide.videoKey || `still-${index}`}
                            style={slide.dominantColor ? { backgroundColor: slide.dominantColor } : undefined}
                            src={near ? slide.posterUrl : undefined}
                            srcSet={near ? posterSrcSet(slide) : undefined}
                            sizes="100vw"
                            alt={isActive ? `${captionOf(slide)} wedding film` : ''}
                            aria-hidden={isActive ? undefined : true}
                            className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-[900ms] ease-entrance
                                        ${isActive ? 'opacity-100 motion-safe:animate-[heroZoom_9s_ease-out_both]' : 'opacity-0'}`}
                            fetchPriority={index === 0 ? 'high' : 'auto'}
                            loading={index === 0 ? 'eager' : 'lazy'}
                            decoding="async"
                        />
                    );
                })}

                {/* Scrims: top for the header, bottom/left for the copy. */}
                <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-48 bg-gradient-to-b from-ground-deep/60 to-transparent" />
                <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ground-deep/90 via-ground-deep/25 to-transparent
                                                   lg:bg-gradient-to-r lg:from-ground-deep/80 lg:via-ground-deep/20" />

                {/* Statement */}
                <div className="absolute inset-x-0 bottom-[132px] px-5 sm:px-8 lg:bottom-auto lg:top-1/2 lg:-translate-y-1/2 lg:px-20">
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

                {/* Glass mini-player */}
                <div className="absolute inset-x-3 bottom-[max(0.75rem,env(safe-area-inset-bottom))] sm:inset-x-auto sm:right-6 sm:w-[440px] lg:bottom-8 lg:right-10 lg:w-[460px]">
                    <div className="flex items-center gap-2.5 rounded-[28px] bg-white/80 p-2 pr-2.5 sm:gap-3 sm:rounded-[30px] sm:pr-3 ring-1 ring-white/60 shadow-[0_20px_44px_-20px_rgba(51,22,26,0.6)] backdrop-blur-xl">
                        {/* Thumbnail + its pause control (siblings: no button inside a button). */}
                        <div className="relative shrink-0">
                        <button type="button" onClick={playFilm} aria-label={`Play film — ${captionOf(active)}`}
                            className="relative aspect-video w-28 shrink-0 cursor-pointer overflow-hidden rounded-[20px] bg-ground-deep focus-ring sm:w-36 sm:rounded-[22px]">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={active.posterUrl} srcSet={posterSrcSet(active)} sizes="160px" alt="" className="absolute inset-0 h-full w-full object-cover" />
                            {allowVideo && heroSrc(active) && (
                                <video
                                    key={active.videoKey || currentSlide}
                                    data-analytics-video-id={active.videoId || active.videoKey}
                                    className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-media ease-entrance ${canPlay ? 'opacity-100' : 'opacity-0'}`}
                                    src={heroSrc(active)}
                                    poster={active.posterUrl}
                                    preload="none"
                                    muted
                                    autoPlay
                                    playsInline
                                    loop
                                    onCanPlay={() => setCanPlay(true)}
                                />
                            )}
                        </button>
                            {multiple && !reducedMotion && (
                                <button type="button" onClick={() => setPaused((v) => !v)} aria-label={paused ? 'Resume films' : 'Pause films'}
                                    className="absolute left-1.5 top-1.5 grid h-7 w-7 cursor-pointer place-items-center rounded-full bg-white/85 text-ink shadow-sm backdrop-blur transition-colors hover:bg-white focus-ring">
                                    {paused ? <FiPlay className="ml-px h-3 w-3" /> : <FiPause className="h-3 w-3" />}
                                </button>
                            )}
                        </div>
                        <Link href={`/films/${active.videoId}`} className="min-w-0 flex-1 rounded-xl focus-ring" aria-live="polite">
                            <span className="block text-[10.5px] font-semibold uppercase tracking-[0.12em] text-accent-ink sm:inline-flex sm:rounded-full sm:bg-accent-tint
                                             sm:px-2.5 sm:py-0.5 sm:text-[11px] sm:normal-case sm:tracking-normal">Now playing</span>
                            <span key={currentSlide} className="mt-0.5 block truncate font-display text-[17px] leading-tight text-ink motion-safe:animate-[fadeUp_320ms_cubic-bezier(0.16,1,0.3,1)] sm:mt-1 sm:text-[19px]">
                                {captionOf(active)}
                            </span>
                            <span className="block text-[11.5px] text-ink-muted sm:text-[12px]">Film {currentSlide + 1} of {slides.length}</span>
                        </Link>
                        <button type="button" onClick={playFilm} aria-label={`Watch ${captionOf(active)}`}
                            className="relative grid h-12 w-12 shrink-0 cursor-pointer place-items-center rounded-full bg-ground-deep text-ink-onDeep transition-transform
                                       duration-micro ease-standard motion-safe:active:scale-95 focus-ring">
                            <FiPlay className="relative ml-0.5 h-4 w-4" />
                            {multiple && (
                                <svg aria-hidden="true" viewBox="0 0 48 48" className="absolute inset-0 -rotate-90">
                                    <circle cx="24" cy="24" r="21" fill="none" stroke="rgb(var(--ink-on-deep-rgb) / 0.15)" strokeWidth="2.5" />
                                    <circle key={currentSlide} cx="24" cy="24" r="21" fill="none" stroke="rgb(var(--accent-rgb))" strokeWidth="2.5"
                                        strokeLinecap="round" strokeDasharray={RING}
                                        style={{ strokeDashoffset: RING, animation: autoplay ? `heroRing ${ADVANCE_MS}ms linear forwards` : 'none' }} />
                                </svg>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
}
