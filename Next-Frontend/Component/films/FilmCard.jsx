'use client';

/**
 * FilmCard — one film, used by /films rails, the Top 10 and /allfilms.
 *
 *   - the whole card is a real <a> to the film page (crawlable, shareable);
 *     a plain click plays the film in place instead (onPlay) — watching the
 *     next film never costs a page load. Cmd/Ctrl/middle-click still opens
 *     the film page.
 *   - desktop: resting the pointer on a card for ~450ms plays its silent 8s
 *     loop inside the poster (only films that have one, only on a good
 *     connection, never under reduced motion), marked by equalizer bars. A card
 *     sliding under a still pointer while the page scrolls never starts one —
 *     previews begin on pointer MOVE, and any scroll stops the active one.
 *   - nowPlaying: the film open in the player wears the bars too.
 *
 * Variants: 'landscape' (16:9), 'portrait' (4:5), 'auto' (4:5 on phones, 16:9 from sm),
 * 'rank' (Top 10: a heavy Bodoni numeral standing behind the poster).
 */
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { FiPlay } from 'react-icons/fi';
import { focusStyle } from '@/lib/focus.js';
import { coupleOf, blurbOf, filmHref } from '@/lib/films.js';

const HOVER_MS = 450;

// One preview on the page at a time, and none while the page is scrolling.
let stopActive = null;
let scrollWired = false;
function wireScrollStop() {
    if (scrollWired || typeof window === 'undefined') return;
    scrollWired = true;
    window.addEventListener('scroll', () => { stopActive?.(); }, { passive: true });
}

function useCanPreview() {
    const [ok, setOk] = useState(false);
    useEffect(() => {
        const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
        const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        const c = navigator.connection;
        const slow = c && (c.saveData || ['slow-2g', '2g', '3g'].includes(c.effectiveType));
        if (fine) wireScrollStop();
        // eslint-disable-next-line react-hooks/set-state-in-effect -- read once from the platform after mount
        setOk(fine && !still && !slow);
    }, []);
    return ok;
}

/** Four bars, like a music player — "this one is playing". */
export function Equalizer({ className = '' }) {
    return (
        <span aria-hidden="true" className={`eq inline-flex h-3.5 items-end gap-[2px] ${className}`}>
            <span /><span /><span /><span />
        </span>
    );
}

export default function FilmCard({ film, variant = 'landscape', rank, onPlay, sizes, eager = false, nowPlaying = false, className = '', style }) {
    const couple = coupleOf(film);
    const blurb = blurbOf(film);
    const canPreview = useCanPreview();
    const [preview, setPreview] = useState(false);
    const [playing, setPlaying] = useState(false);
    const timer = useRef(0);
    useEffect(() => () => clearTimeout(timer.current), []);

    const stopPreview = () => { clearTimeout(timer.current); setPreview(false); setPlaying(false); if (stopActive === stopPreview) stopActive = null; };
    const arm = () => {
        if (!canPreview || !film.loopUrl || preview || nowPlaying) return;
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

    const rankCard = variant === 'rank';
    const portrait = variant === 'portrait' || rankCard;
    const aspect = variant === 'auto' ? 'aspect-[4/5] sm:aspect-video' : portrait ? 'aspect-[4/5]' : 'aspect-video';
    const live = playing || nowPlaying;
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
            {/* playing: equalizer bars, top left */}
            <span aria-hidden="true"
                className={`absolute left-3 top-3 inline-flex items-center gap-2 rounded-full bg-black/45 px-2.5 py-1.5 text-[11px] font-semibold text-white backdrop-blur-md transition-opacity duration-ui
                            ${live ? 'opacity-100' : 'opacity-0'}`}>
                <Equalizer />{nowPlaying ? 'Now playing' : null}
            </span>
            {/* play mark: on the poster, decorative — the card itself is the control */}
            <span aria-hidden="true"
                className={`absolute bottom-3 right-3 grid place-items-center rounded-full bg-white/90 text-ink shadow-[0_10px_24px_-10px_rgba(0,0,0,0.6)] backdrop-blur
                            transition-transform duration-ui ease-entrance motion-safe:group-hover:scale-110 ${portrait ? 'h-11 w-11' : 'h-12 w-12'}`}>
                <FiPlay className="ml-0.5 h-[18px] w-[18px]" />
            </span>
        </div>
    );

    const info = (
        <div className={rankCard ? 'pt-3' : 'pt-3'}>
            <h3 className={`truncate font-display font-medium leading-tight text-ink ${rankCard ? 'text-[18px]' : 'text-[19px]'}`}>{couple}</h3>
            {blurb && <p className="mt-0.5 truncate text-[13px] text-ink-muted">{blurb}</p>}
        </div>
    );

    return (
        <article style={style}
            onPointerMove={arm} onPointerLeave={leave} onFocus={arm} onBlur={leave}
            className={`group relative ${className}`}>
            {rankCard ? (
                /* Fixed geometry: the numeral stands in its own column behind the poster's
                   left edge, so "1" and "10" never move the poster or the names. */
                <div className="relative pl-[30%]">
                    <span aria-hidden="true"
                        className="rank-numeral pointer-events-none absolute bottom-[3.6rem] left-0 z-0 select-none font-display font-black leading-[0.72] tracking-[-0.06em]"
                        data-digits={String(rank).length}>
                        {rank}
                    </span>
                    <div className="relative z-[1] transition-transform duration-ui ease-entrance motion-safe:group-hover:-translate-y-1">{media}</div>
                    <div className="relative z-[1]">{info}</div>
                </div>
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
