'use client';

/**
 * FilmCard — one film, used by /films rails, the Top 10 and /allfilms.
 *
 *   - the whole card is a real <a> to the film page (crawlable, shareable);
 *     a plain click plays the film in place instead (onPlay) — watching the
 *     next film never costs a page load. Cmd/Ctrl/middle-click still opens
 *     the film page.
 *   - desktop: resting on a card for ~450ms plays its silent 8s loop inside the
 *     poster (only films that have one, only on a good connection, never under
 *     reduced motion); otherwise the poster drifts slowly
 *
 * Variants: 'landscape' (16:9), 'portrait' (4:5), 'auto' (4:5 on phones, 16:9 from sm),
 * 'rank' (Top 10: a big outlined numeral behind a portrait poster).
 */
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { FiPlay } from 'react-icons/fi';
import { focusStyle } from '@/lib/focus.js';
import { coupleOf, blurbOf, filmHref } from '@/lib/films.js';

const HOVER_MS = 450;

// One preview on the page at a time: starting a card stops the last one.
let stopActive = null;

function useCanPreview() {
    const [ok, setOk] = useState(false);
    useEffect(() => {
        const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
        const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        const c = navigator.connection;
        const slow = c && (c.saveData || ['slow-2g', '2g', '3g'].includes(c.effectiveType));
        // eslint-disable-next-line react-hooks/set-state-in-effect -- read once from the platform after mount
        setOk(fine && !still && !slow);
    }, []);
    return ok;
}

export default function FilmCard({ film, variant = 'landscape', rank, onPlay, sizes, eager = false, className = '', style }) {
    const couple = coupleOf(film);
    const blurb = blurbOf(film);
    const canPreview = useCanPreview();
    const [preview, setPreview] = useState(false);
    const [playing, setPlaying] = useState(false);
    const timer = useRef(0);
    useEffect(() => () => clearTimeout(timer.current), []);

    const stopPreview = () => { clearTimeout(timer.current); setPreview(false); setPlaying(false); };
    const startPreview = () => {
        if (!canPreview || !film.loopUrl) return;
        clearTimeout(timer.current);
        timer.current = setTimeout(() => {
            if (stopActive && stopActive !== stopPreview) stopActive();
            stopActive = stopPreview;
            setPreview(true);
        }, HOVER_MS);
    };
    const leave = () => { clearTimeout(timer.current); timer.current = setTimeout(stopPreview, 150); };
    const onClick = (e) => {
        if (!onPlay || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
        e.preventDefault();
        stopPreview();
        onPlay(film);
    };

    const portrait = variant === 'portrait' || variant === 'rank';
    const aspect = variant === 'auto' ? 'aspect-[4/5] sm:aspect-video' : portrait ? 'aspect-[4/5]' : 'aspect-video';
    const media = (
        <div className={`relative overflow-hidden rounded-[20px] bg-ground-deep ${aspect}`}
            style={film.dominantColor ? { backgroundColor: film.dominantColor } : undefined}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={film.thumbnailUrl} alt="" loading={eager ? 'eager' : 'lazy'} decoding="async" sizes={sizes}
                style={{ ...focusStyle(film.focus), ...(film.blurDataURL ? { backgroundImage: `url(${film.blurDataURL})`, backgroundSize: 'cover' } : null) }}
                className="absolute inset-0 h-full w-full object-cover transition-transform duration-[1600ms] ease-entrance group-hover:scale-[1.05]" />
            {preview && (
                <video src={film.loopUrl} muted loop playsInline autoPlay preload="auto" aria-hidden="true"
                    onPlaying={() => setPlaying(true)} style={focusStyle(film.focus)}
                    className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-500 ${playing ? 'opacity-100' : 'opacity-0'}`} />
            )}
            <span aria-hidden="true" className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/55 to-transparent opacity-80 transition-opacity duration-ui group-hover:opacity-100" />
            {film.loopUrl && canPreview && (
                <span aria-hidden="true" className={`absolute left-3 top-3 rounded-full bg-black/40 px-2 py-1 text-[10.5px] font-semibold uppercase tracking-[0.14em] text-white/85 backdrop-blur-md transition-opacity duration-ui
                                                     ${playing ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                    {playing ? 'Preview' : 'Hover to preview'}
                </span>
            )}
            {/* play mark: on the poster, decorative — the card itself is the control */}
            <span aria-hidden="true"
                className={`absolute bottom-3 right-3 grid place-items-center rounded-full bg-white/90 text-ink shadow-[0_10px_24px_-10px_rgba(0,0,0,0.6)] backdrop-blur
                            transition-transform duration-ui ease-entrance motion-safe:group-hover:scale-110 ${portrait ? 'h-11 w-11' : 'h-12 w-12'}`}>
                <FiPlay className="ml-0.5 h-[18px] w-[18px]" />
            </span>
        </div>
    );

    const info = (
        <div className={variant === 'rank' ? 'pt-2.5' : 'pt-3'}>
            <h3 className={`truncate font-display font-medium leading-tight text-ink ${variant === 'rank' ? 'text-[17px]' : 'text-[19px]'}`}>{couple}</h3>
            {blurb && <p className="mt-0.5 truncate text-[13px] text-ink-muted">{blurb}</p>}
        </div>
    );

    return (
        <article style={style}
            onPointerEnter={startPreview} onPointerLeave={leave} onFocus={startPreview} onBlur={leave}
            className={`group relative ${className}`}>
            {variant === 'rank' ? (
                <>
                    {/* the numeral sits on the poster's bottom edge; the poster overlaps it */}
                    <div className="flex items-end">
                        <span aria-hidden="true"
                            className="pointer-events-none relative z-0 -mr-7 select-none font-display text-[140px] font-semibold leading-[0.74] text-transparent
                                       [-webkit-text-stroke:2px_rgb(var(--ground-deep-rgb)/0.45)] sm:-mr-9 sm:text-[180px]">
                            {rank}
                        </span>
                        <div className="relative z-[1] w-[66%] transition-transform duration-ui ease-entrance motion-safe:group-hover:-translate-y-1">{media}</div>
                    </div>
                    <div className="ml-[34%]">{info}</div>
                </>
            ) : (
                <>
                    <div className="transition-transform duration-ui ease-entrance motion-safe:group-hover:-translate-y-1">{media}</div>
                    {info}
                </>
            )}
            {/* the card's link covers the whole card: a plain click plays in place */}
            <Link href={filmHref(film)} prefetch={false} onClick={onClick}
                aria-label={`${couple}${blurb ? ` — ${blurb}` : ''}: play film`}
                className="absolute inset-0 z-[3] rounded-[20px] focus-ring" />
        </article>
    );
}
