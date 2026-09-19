'use client';

import { useCallback, useState, useRef, useEffect } from 'react';
import { FiPlay, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import Link from 'next/link';
import { useInView } from 'react-intersection-observer';
import FilmLightbox from '@/Component/FilmLightbox.jsx';
import useNetworkStatus from '@/Hooks/useNetworkStatus.jsx';

/**
 * Hero carousel.
 *
 * The delivery rules here are the whole point of this component — the previous
 * version mounted every slide as an autoplaying <video preload="auto">, which
 * pulled ~79 MB of full-resolution master footage before the page could settle.
 *
 *   1. Every slide paints its POSTER immediately. The poster is the LCP element.
 *   2. Only the ACTIVE slide ever mounts a <video>, and it uses preload="none"
 *      so bytes are requested only once the browser decides to play it.
 *   3. Playback is gated on the carousel actually being in view, the visitor not
 *      asking for reduced motion, a connection tier that can afford it, and
 *      being online.
 *
 * Posters are plain <img> rather than next/image on purpose: while the API still
 * hands out per-request SIGNED S3 URLs, every page load produces a new URL, so
 * the Next optimizer would re-download and re-encode the same photo for every
 * visitor while never once serving a cache hit. Once media moves to immutable
 * R2 CDN URLs this becomes next/image with the variant-snapping loader.
 */
export default function HeroCarousel({ slides = [] }) {
    const [currentSlide, setCurrentSlide] = useState(0);
    const [lightboxUrl, setLightboxUrl] = useState(null);
    const [canPlay, setCanPlay] = useState(false);

    const slideRef = useRef(null);
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

    useEffect(() => {
        if (slideRef.current) {
            slideRef.current.style.transform = `translateX(${-currentSlide * 100}%)`;
        }
    }, [currentSlide]);

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

    return (
        <>
            {lightboxUrl && (
                <FilmLightbox src={lightboxUrl} title={captionOf(active)} onClose={() => setLightboxUrl(null)} />
            )}

            {/*
              The hero frame.

              Height is viewport-relative rather than a fixed 33rem: on a phone
              33rem was 61% of the screen and on a large desktop it was a letterbox
              strip. `svh` rather than `vh` so the mobile browser chrome collapsing
              does not resize the hero mid-scroll.

              The arch is the design system's framing device (DESIGN-SYSTEM.md §1)
              and this is its primary appearance — a dome-topped mehrab, not a
              rounded rectangle.
            */}
            <div
                ref={viewRef}
                className="hero-banner group/hero relative isolate w-full overflow-hidden
                           arch-soft border border-gold/35 bg-ground-sunk
                           h-[58svh] min-h-[400px] max-h-[820px] sm:h-[64svh] lg:h-[74svh]"
            >
                <div
                    ref={slideRef}
                    className="flex h-full transition-transform duration-500 ease-out"
                    onTouchStart={(e) => { touchStartX.current = e.touches[0].clientX; }}
                    onTouchMove={(e) => { touchEndX.current = e.touches[0].clientX; }}
                    onTouchEnd={handleTouchEnd}
                >
                    {slides.map((slide, index) => {
                        const isActive = index === currentSlide;
                        return (
                            /* Key falls back to the index: `videoKey` is not
                               guaranteed unique across slides, which is what
                               produced React's duplicate-key warning — the one
                               console error on the home page. */
                            <div key={slide.videoKey || `slide-${index}`} className="relative h-full w-full flex-shrink-0">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                    style={slide.dominantColor ? { backgroundColor: slide.dominantColor } : undefined}
                                    src={slide.posterUrl}
                                    srcSet={posterSrcSet(slide)}
                                    sizes="100vw"
                                    width={slide.aspectRatio ? 1280 : undefined}
                                    height={slide.aspectRatio ? Math.round(1280 / slide.aspectRatio) : undefined}
                                    alt={`${slide.clientName?.Bride} & ${slide.clientName?.Groom} wedding film`}
                                    className="absolute inset-0 h-full w-full object-cover"
                                    fetchPriority={index === 0 ? 'high' : 'auto'}
                                    loading={index === 0 ? 'eager' : 'lazy'}
                                    decoding="async"
                                />

                                {isActive && allowVideo && heroSrc(slide) && (
                                    <video
                                        key={slide.videoKey}
                                        className={`absolute inset-0 h-full w-full object-cover transition-opacity
                                                    duration-media ease-entrance ${canPlay ? 'opacity-100' : 'opacity-0'}`}
                                        src={heroSrc(slide)}
                                        poster={slide.posterUrl}
                                        preload="none"
                                        muted
                                        autoPlay
                                        playsInline
                                        loop
                                        onCanPlay={() => setCanPlay(true)}
                                    />
                                )}

                                {/* Scrim from the token, not a hand-rolled black gradient.
                                    Guarantees 5.6:1 for the caption whatever the frame. */}
                                <div aria-hidden="true" className="scrim-bottom pointer-events-none absolute inset-0" />
                            </div>
                        );
                    })}
                </div>

                {/* ── Caption + play, on one baseline ───────────────────────── */}
                <div className="pointer-events-none absolute inset-x-0 bottom-0 p-5 sm:p-7 lg:p-9">
                    <div className="flex items-end justify-between gap-4">
                        <Link
                            href={`/films/${active.videoId}`}
                            className="pointer-events-auto min-w-0 text-white transition-opacity duration-micro
                                       ease-standard hover:opacity-90"
                        >
                            {/* No eyebrow label above this heading. A tracked-out
                                uppercase kicker is on the system's own
                                anti-pattern list (DESIGN-SYSTEM.md §8) and I put
                                one here by reflex; the couple's name needs no
                                introduction. */}
                            <h2 className="font-display text-[26px] font-semibold leading-tight
                                           sm:text-[34px] lg:text-[42px]">
                                {captionOf(active)}
                            </h2>
                            <p className="mt-1 text-[13px] text-white/80 sm:text-[14px]">
                                {[active.videoShootDate, active.videoLocation?.city].filter(Boolean).join(' · ')}
                            </p>
                        </Link>

                        {/* The play affordance. Labelled, 56px, gold-ringed — the
                            old one was an unlabelled 48px white-on-white/10 circle. */}
                        <button
                            type="button"
                            onClick={() => setLightboxUrl(active.sourceUrl || active.webUrl || active.videoUrl)}
                            aria-label={`Play film — ${captionOf(active)}`}
                            className="pointer-events-auto grid h-14 w-14 shrink-0 place-items-center rounded-pill
                                       border border-gold/70 bg-ink/45 text-white backdrop-blur-sm
                                       transition-all duration-micro ease-standard
                                       hover:scale-105 hover:border-gold hover:bg-accent
                                       active:scale-95 sm:h-16 sm:w-16"
                        >
                            <FiPlay className="ml-0.5 h-6 w-6" />
                        </button>
                    </div>

                    {/* Slide indicators — gold thread, and a real control rather
                        than decoration: each one selects its slide. */}
                    {multiple && (
                        <div className="pointer-events-auto mt-5 flex items-center gap-2">
                            {slides.map((s2, i) => (
                                <button
                                    key={s2.videoKey || `dot-${i}`}
                                    type="button"
                                    onClick={() => goToSlide(i)}
                                    aria-label={`Show film ${i + 1} of ${slides.length}`}
                                    aria-current={i === currentSlide}
                                    className="group/dot grid h-11 place-items-center px-1"
                                >
                                    <span
                                        className={`block h-[3px] rounded-pill transition-all duration-ui ease-standard
                                                    ${i === currentSlide
                                                        ? 'w-9 bg-gold'
                                                        : 'w-4 bg-white/45 group-hover/dot:bg-white/80'}`}
                                    />
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* ── Prev / next. Hidden with a single slide, and revealed on
                       hover at desktop so they do not sit on the photograph
                       permanently. Always visible on touch, which has no hover. ── */}
                {multiple && (
                    <div className="pointer-events-none absolute inset-y-0 inset-x-0 flex items-center justify-between px-3 sm:px-4">
                        {[['prev', FiChevronLeft, 'Previous film'], ['next', FiChevronRight, 'Next film']].map(
                            ([dir, Icon, label]) => (
                                <button
                                    key={dir}
                                    type="button"
                                    onClick={() => handleSlideChange(dir)}
                                    aria-label={label}
                                    className="pointer-events-auto grid h-11 w-11 place-items-center rounded-pill
                                               border border-white/25 bg-ink/40 text-white backdrop-blur-sm
                                               transition-all duration-micro ease-standard
                                               hover:border-gold hover:bg-ink/65 active:scale-95
                                               lg:opacity-0 lg:group-hover/hero:opacity-100 lg:focus-visible:opacity-100"
                                >
                                    <Icon className="h-5 w-5" />
                                </button>
                            ),
                        )}
                    </div>
                )}
            </div>
        </>
    );
}
