'use client';

/**
 * FilmLightbox — what happens when someone presses play.
 *
 * It replaces a bare `fixed inset-0 bg-black/90` div holding a raw player. That
 * version had no entrance, no focus management, no escape key, no scroll lock,
 * and a close button that sat 8px from the corner at 32px square. Pressing play
 * on a wedding film is the most emotive interaction on the site and it behaved
 * like a debug overlay.
 *
 * What it does now:
 *
 *  - **Arrives.** The ground fades and the frame rises and scales from 96%, on
 *    the entrance easing. Under `prefers-reduced-motion` it simply appears.
 *  - **Sits on a warm ground**, not black — `--ground-deep` with a jaali screen
 *    behind the frame, so the film is framed rather than floated on a void.
 *  - **Traps focus**, restores it on close, locks the page behind, and closes on
 *    Escape or a click outside the frame.
 *  - **Is built for a phone**: full-bleed with safe-area padding, a 48px close
 *    target, and the title kept visible so the viewer knows what they opened.
 */
import { useEffect, useRef, useState } from 'react';
import { FiX } from 'react-icons/fi';
import Videoplayer from '@/Component/Videoplayer.jsx';

/** A YouTube (no-cookie) or Vimeo embed, as the API returns for films hosted there. */
const EMBED = /^https:\/\/(www\.youtube-nocookie\.com\/embed\/|player\.vimeo\.com\/video\/)/;
const withAutoplay = (url) => `${url}${url.includes('?') ? '&' : '?'}autoplay=1`;

export default function FilmLightbox({ src, title, onClose }) {
    const panelRef = useRef(null);
    const restoreTo = useRef(null);
    const [shown, setShown] = useState(false);

    useEffect(() => {
        restoreTo.current = document.activeElement;
        const { overflow } = document.body.style;
        document.body.style.overflow = 'hidden';

        // Two frames: one to mount at the start state, one to transition from it.
        const raf = requestAnimationFrame(() => requestAnimationFrame(() => setShown(true)));

        const focusables = () => panelRef.current?.querySelectorAll(
            'a[href], button:not([disabled]), input, [tabindex]:not([tabindex="-1"])',
        ) ?? [];
        const focusRaf = requestAnimationFrame(() => focusables()[0]?.focus());

        const onKey = (e) => {
            if (e.key === 'Escape') { onClose(); return; }
            if (e.key !== 'Tab') return;
            const items = [...focusables()];
            if (!items.length) return;
            const first = items[0];
            const last = items[items.length - 1];
            if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
            else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
        };
        document.addEventListener('keydown', onKey);

        return () => {
            cancelAnimationFrame(raf);
            cancelAnimationFrame(focusRaf);
            document.removeEventListener('keydown', onKey);
            document.body.style.overflow = overflow;
            restoreTo.current?.focus?.();
        };
    }, [onClose]);

    return (
        <div
            role="dialog"
            aria-modal="true"
            aria-label={title ? `${title} — film` : 'Film'}
            /* No horizontal padding on a phone: a 16:9 film in a 390px window is
               only ~200px tall, so every pixel of width is 0.56px of height.
               Edge-to-edge buys back a fifth of the picture. */
            className="fixed inset-0 z-modal flex items-center justify-center px-0 py-4 sm:p-8"
        >
            {/* Ground. Warm deep brown rather than black — black is an absence,
                this is a darkened room. */}
            <button
                type="button"
                aria-label="Close film"
                onClick={onClose}
                className={`absolute inset-0 h-full w-full bg-ground-deep/95 backdrop-blur-md
                            transition-opacity duration-ui ease-standard
                            ${shown ? 'opacity-100' : 'opacity-0'}`}
            />

            {/* Jaali behind the frame — the ornament reads as a screen the film
                is projected against. Decorative only, never over the video. */}
            <div
                aria-hidden="true"
                className={`jaali pointer-events-none absolute inset-0 transition-opacity duration-entrance
                            ease-entrance ${shown ? 'opacity-25' : 'opacity-0'}`}
            />

            <div
                ref={panelRef}
                className={`relative w-full max-w-5xl transition-all ease-entrance
                            motion-safe:duration-entrance motion-reduce:duration-0
                            ${shown ? 'translate-y-0 scale-100 opacity-100' : 'translate-y-4 scale-[0.96] opacity-0'}`}
            >
                <div className="mb-3 flex items-center justify-between gap-4 px-4 sm:px-0">
                    <p className="min-w-0 truncate font-display text-[17px] text-white sm:text-[20px]">
                        {title}
                    </p>
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Close film"
                        className="grid h-12 w-12 shrink-0 place-items-center rounded-pill border border-white/25
                                   text-white transition-colors duration-micro ease-standard
                                   hover:border-gold hover:bg-white/10"
                    >
                        <FiX className="h-5 w-5" />
                    </button>
                </div>

                {/* Gold-edged frame. Square corners here, not the arch: an arch
                    would crop the top of the picture, and the film is the point. */}
                <div className="overflow-hidden border-y border-gold/45 bg-black shadow-overlay sm:rounded-panel sm:border">
                    {EMBED.test(src || '') ? (
                        // Films hosted on YouTube / Vimeo play in the host's player.
                        <div className="relative aspect-video w-full">
                            <iframe
                                src={withAutoplay(src)}
                                title={title || 'Wedding film'}
                                allow="autoplay; fullscreen; picture-in-picture; encrypted-media"
                                allowFullScreen
                                className="absolute inset-0 h-full w-full border-0"
                            />
                        </div>
                    ) : (
                        <Videoplayer src={src} />
                    )}
                </div>
            </div>
        </div>
    );
}
