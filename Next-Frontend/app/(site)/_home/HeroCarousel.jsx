'use client';

import { useCallback, useState, useRef, useEffect } from 'react';
import { FiPlay, FiChevronLeft, FiChevronRight, FiX } from 'react-icons/fi';
import Link from 'next/link';
import { useInView } from 'react-intersection-observer';
import Videoplayer from '@/Component/Videoplayer.jsx';
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

    const handleTouchEnd = useCallback(() => {
        const change = touchEndX.current - touchStartX.current;
        if (Math.abs(change) > 50) handleSlideChange(change > 0 ? 'prev' : 'next');
    }, [handleSlideChange]);

    if (!slides.length) return null;

    return (
        <>
            {lightboxUrl && (
                <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[99999] flex items-center justify-center p-4">
                    <button
                        onClick={() => setLightboxUrl(null)}
                        aria-label="Close video"
                        className="absolute top-4 right-4 p-2 text-white hover:text-gray-200 transition-colors"
                    >
                        <FiX className="w-8 h-8" />
                    </button>
                    <Videoplayer src={lightboxUrl} className="max-w-4xl w-full" />
                </div>
            )}

            <div ref={viewRef} className="hero-banner relative h-[33rem] rounded-2xl overflow-hidden">
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
                            <div key={slide.videoKey} className="flex-shrink-0 relative w-full h-full">
                                {/* Poster: always present, always the first paint. */}
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                    style={slide.dominantColor ? { backgroundColor: slide.dominantColor } : undefined}
                                    src={slide.posterUrl}
                                    srcSet={posterSrcSet(slide)}
                                    sizes="100vw"
                                    width={slide.aspectRatio ? 1280 : undefined}
                                    height={slide.aspectRatio ? Math.round(1280 / slide.aspectRatio) : undefined}
                                    alt={`${slide.clientName?.Bride} & ${slide.clientName?.Groom} wedding film`}
                                    className="absolute inset-0 w-full h-full object-cover rounded-2xl"
                                    // The first poster is the LCP element; the rest can wait.
                                    fetchPriority={index === 0 ? 'high' : 'auto'}
                                    loading={index === 0 ? 'eager' : 'lazy'}
                                    decoding="async"
                                />

                                {/* Video: active slide only, and only when affordable. */}
                                {isActive && allowVideo && heroSrc(slide) && (
                                    <video
                                        key={slide.videoKey}
                                        className={`absolute inset-0 w-full h-full object-cover rounded-2xl transition-opacity duration-700 ${canPlay ? 'opacity-100' : 'opacity-0'}`}
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

                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent">
                                    <div className="absolute bottom-6 right-6">
                                        <button
                                            onClick={() => setLightboxUrl(
                                                slide.sourceUrl || slide.webUrl || slide.videoUrl,
                                            )}
                                            aria-label="Play film"
                                            className="p-3 bg-white/10 rounded-full backdrop-blur-sm hover:bg-white/20 transition-colors"
                                        >
                                            <FiPlay className="w-6 h-6 text-white" />
                                        </button>
                                    </div>

                                    <Link
                                        href={`/films/${slide.videoId}`}
                                        className="absolute bottom-6 left-6 text-white hover:text-gray-200 transition-colors"
                                    >
                                        <h2 className="text-2xl font-bold">
                                            {[slide.clientName?.Bride, slide.clientName?.Groom].filter(Boolean).join(' & ')}
                                        </h2>
                                        <div className="flex items-center gap-2 mt-1 text-sm">
                                            <span>{slide.videoShootDate}</span>
                                            <span>•</span>
                                            <span>{slide.videoLocation?.city}</span>
                                        </div>
                                    </Link>
                                </div>
                            </div>
                        );
                    })}
                </div>

                <div className="absolute inset-0 flex items-center justify-between px-4 pointer-events-none">
                    <button
                        onClick={() => handleSlideChange('prev')}
                        aria-label="Previous film"
                        className="pointer-events-auto p-2 bg-white/10 rounded-full backdrop-blur-sm hover:bg-white/20 transition-colors"
                    >
                        <FiChevronLeft className="w-8 h-8 text-white" />
                    </button>
                    <button
                        onClick={() => handleSlideChange('next')}
                        aria-label="Next film"
                        className="pointer-events-auto p-2 bg-white/10 rounded-full backdrop-blur-sm hover:bg-white/20 transition-colors"
                    >
                        <FiChevronRight className="w-8 h-8 text-white" />
                    </button>
                </div>
            </div>
        </>
    );
}
