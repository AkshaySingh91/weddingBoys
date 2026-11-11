'use client';

/**
 * /films/[id] — the film as one chapter of a couple's story.
 *
 *   1 Title sequence   the film's own still (LCP) and, where it has one, its
 *                      silent loop; a film-title card — the couple, the
 *                      ceremony, the place, the date. "Watch the film" turns
 *                      the frame into the player, in place.
 *   2 The moment       the film's caption and the couple's intro, set as an
 *                      editorial passage — or, when none was written, a plain
 *                      factual line built from the data (never invented copy).
 *   3 Chapters         every film from this wedding in story order, this one
 *                      "Now watching"; the others play in place.
 *   4 Stills           the wedding's photographs as a mosaic → the full story.
 *   5 End credits      the people who made it, set like a film's credits.
 *   6 Keep watching    films that share its moments (play in place) + the CTA.
 *
 * Sections without content are simply not rendered. Text and links are in the
 * server HTML; motion is the shared RevealObserver (data-rise) and CSS.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { FiPlay, FiArrowUpRight, FiArrowRight, FiClock, FiMapPin } from 'react-icons/fi';
import Videoplayer from '@/Component/Videoplayer.jsx';
import FilmCard, { Equalizer } from '@/Component/films/FilmCard.jsx';
import useFilmPlayer from '@/Component/films/useFilmPlayer.jsx';
import RevealObserver from '@/Component/home/RevealObserver.jsx';
import useNetworkStatus from '@/Hooks/useNetworkStatus.jsx';
import { focusStyle } from '@/lib/focus.js';

const EMBED = /^https:\/\/(www\.youtube-nocookie\.com\/embed\/|player\.vimeo\.com\/video\/)/;
const rite = (c) => (c === 'Wedding / Pheras' ? 'Wedding' : c || '');
const length = (s) => (Number.isFinite(s) && s > 0 ? (s < 60 ? `${Math.round(s)} sec` : `${Math.floor(s / 60)} min${s % 60 >= 5 ? ` ${Math.round(s % 60)} sec` : ''}`) : null);
const pad = (n) => String(n).padStart(2, '0');

/* ── 1 · Title sequence ───────────────────────────────────────────────── */

export function TitleSequence({ couple, facts, poster, loopUrl, film, src, durationSec, nextChapter, onNext }) {
    const { tier, online } = useNetworkStatus();
    const [reduced, setReduced] = useState(true);
    const [moving, setMoving] = useState(false);
    const [box, setBox] = useState(null);          // the 16:9 screen rect inside the frame, once watching
    const [settled, setSettled] = useState(false); // bars closed: the poster layer can go
    const [ended, setEnded] = useState(false);
    const frameRef = useRef(null);
    useEffect(() => {
        const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
        const sync = () => setReduced(mq.matches);
        sync(); mq.addEventListener('change', sync);
        return () => mq.removeEventListener('change', sync);
    }, []);
    const watching = Boolean(box);
    const tight = settled && box && box.W < 640;
    const allowLoop = Boolean(loopUrl) && online && tier !== 'low' && !reduced && !watching;
    const len = length(durationSec);

    // The largest 16:9 rect that fits the frame, centred: letterbox on phones,
    // pillarbox on wide screens.
    const measure = () => {
        const el = frameRef.current; if (!el) return null;
        const W = el.clientWidth; const H = el.clientHeight;
        // The frame starts under the floating header: keep the screen below it.
        const header = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--header-height')) || 72;
        const topPad = header + 20; const bottomPad = 24;
        const availH = H - topPad - bottomPad;
        const w = Math.min(W - (W > 640 ? 48 : 0), availH * 16 / 9); const h = w * 9 / 16;
        // Phones: the screen sits just under the header (the frame then tightens
        // around it); wider screens centre it in the frame.
        return { top: W < 640 ? topPad : topPad + (availH - h) / 2, left: (W - w) / 2, width: w, height: h, W, H };
    };
    // The Letterbox: on click (same task — keeps the browser's permission to
    // play with sound) the player mounts in the screen rect under the still,
    // the title fades, the still's edges close in to that rect, then it goes.
    const watch = () => {
        const b = measure(); if (!b) return;
        setBox(b);
        window.setTimeout(() => setSettled(true), reduced ? 0 : 560);
    };
    useEffect(() => {
        if (!watching) return undefined;
        const onResize = () => setBox(measure());
        window.addEventListener('resize', onResize);
        return () => window.removeEventListener('resize', onResize);
    }, [watching]);
    // When the film ends: the next chapter, after a 6s countdown (Cancel stays).
    useEffect(() => {
        if (!ended || !nextChapter || reduced) return undefined;
        const t = setTimeout(() => { setEnded(false); onNext(); }, 6000);
        return () => clearTimeout(t);
    }, [ended, nextChapter, onNext, reduced]);

    const clip = box ? `inset(${box.top}px ${box.left}px ${box.H - box.top - box.height}px ${box.left}px round 20px)` : 'inset(0px 0px 0px 0px round 0px)';

    return (
        <section aria-labelledby="film-title" className="relative -mt-[calc(var(--header-height)+0.75rem)] overflow-hidden bg-[#2B1318] text-ink-onDeep lg:-mx-4">
            {/* the room: wine, lit by the film's still (seen as the bars close in) */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={poster} alt="" aria-hidden="true" className="absolute inset-0 h-full w-full scale-125 object-cover opacity-45 blur-[80px] saturate-[1.2]" />

            {/* Phones: once the bars have closed, the frame tightens around the film
                (user-initiated, so not a layout shift) — no empty wine above and below. */}
            <div ref={frameRef}
                className={`crew-drift relative h-[86svh] min-h-[560px] transition-[height,min-height] duration-500 ease-entrance motion-reduce:transition-none lg:h-[min(92svh,900px)] ${tight ? '!min-h-0' : ''}`}
                style={tight ? { height: box.top + box.height + 20 } : undefined}>
                {/* the screen: the player lives in the 16:9 rect once watching */}
                {box && (
                    <div className="absolute z-[1] overflow-hidden rounded-[20px] bg-black shadow-[0_40px_90px_-30px_rgba(0,0,0,0.7)] ring-1 ring-white/10"
                        style={{ top: box.top, left: box.left, width: box.width, height: box.height }}>
                        {EMBED.test(src) ? (
                            <iframe src={`${src}${src.includes('?') ? '&' : '?'}autoplay=1`} title={`${couple} — wedding film`}
                                allow="autoplay; fullscreen; picture-in-picture; encrypted-media" allowFullScreen className="absolute inset-0 h-full w-full border-0" />
                        ) : (
                            <Videoplayer src={src} poster={poster} title={couple} autoPlay onEnded={() => setEnded(true)} className="!aspect-auto h-full" />
                        )}
                        {ended && nextChapter && (
                            <div className="absolute inset-x-3 bottom-3 z-20 flex flex-wrap items-center justify-end gap-2">
                                <button type="button" onClick={() => { setEnded(false); onNext(); }}
                                    className="relative inline-flex h-12 cursor-pointer items-center gap-3 overflow-hidden rounded-full bg-white pl-2 pr-5 text-[14px] font-semibold text-ink focus-ring">
                                    <span className="grid h-9 w-9 place-items-center rounded-full bg-accent text-ink-onAccent"><FiPlay aria-hidden="true" className="ml-0.5 h-4 w-4" /></span>
                                    Next chapter: {nextChapter}
                                    <span aria-hidden="true" className="absolute inset-x-4 bottom-1 h-[3px] overflow-hidden rounded-full bg-ink/10">
                                        <span className="block h-full origin-left rounded-full bg-accent motion-safe:animate-[heroBar_6s_linear_both]" />
                                    </span>
                                </button>
                                <button type="button" onClick={() => setEnded(false)}
                                    className="h-12 cursor-pointer rounded-full bg-black/50 px-4 text-[13.5px] font-semibold text-white ring-1 ring-white/25 backdrop-blur focus-ring">Cancel</button>
                            </div>
                        )}
                    </div>
                )}

                {/* the still, which closes in to the screen */}
                {!settled && (
                    <div className="absolute inset-0 z-[2] transition-[clip-path] duration-[520ms] ease-entrance motion-reduce:transition-none" style={{ clipPath: clip }}>
                        {/* eslint-disable-next-line @next/next/no-img-element -- the LCP still */}
                        <img src={poster} alt={`${couple} — wedding film`} loading="eager" fetchPriority="high" decoding="async"
                            style={{ ...focusStyle(film?.focus), ...(film?.blurDataURL ? { backgroundImage: `url(${film.blurDataURL})`, backgroundSize: 'cover' } : null) }}
                            className="title-still absolute inset-0 h-full w-full object-cover" />
                        {allowLoop && (
                            <video src={loopUrl} muted loop playsInline autoPlay preload="auto" aria-hidden="true" onPlaying={() => setMoving(true)}
                                style={focusStyle(film?.focus)}
                                className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-[700ms] ease-entrance ${moving ? 'opacity-100' : 'opacity-0'}`} />
                        )}
                        <span aria-hidden="true" className={`absolute inset-0 transition-opacity duration-300 [background:linear-gradient(0deg,rgb(var(--ground-deep-rgb))_6%,rgb(var(--ground-deep-rgb)/0.92)_22%,rgb(var(--ground-deep-rgb)/0.55)_40%,transparent_62%)] ${watching ? 'opacity-0' : 'opacity-100'}`} />
                        <span aria-hidden="true" className="crew-dim absolute inset-0 bg-ground-deep opacity-0" />
                    </div>
                )}

                {/* the title card */}
                <div className={`absolute inset-x-0 bottom-[8%] z-[3] px-5 text-center transition-[opacity,transform] duration-200 ease-standard md:px-8
                                 ${watching ? 'pointer-events-none -translate-y-2 opacity-0' : ''}`} aria-hidden={watching || undefined}>
                    <p className="title-card title-card--1 inline-flex items-center gap-3 font-display text-[16px] italic text-ink-onDeep/85 [text-shadow:0_1px_12px_rgba(0,0,0,0.6)]">
                        <span aria-hidden="true" className="h-px w-8 bg-gold" />a film by The Wedding Vachan<span aria-hidden="true" className="h-px w-8 bg-gold" />
                    </p>
                    <h1 id="film-title" className="title-card title-card--2 mx-auto mt-2 max-w-5xl text-balance font-display text-[44px] font-medium leading-[0.98] [text-shadow:0_2px_30px_rgba(0,0,0,0.35)] sm:text-[64px] lg:text-[84px]">
                        {couple}
                    </h1>
                    {facts.length > 0 && (
                        <p className="title-card title-card--3 mt-4 flex flex-wrap items-center justify-center gap-x-5 gap-y-1 text-[15px] text-ink-onDeep/75 sm:text-[17px]">
                            {facts.map((f, i) => <span key={f} className={i === 1 ? 'text-ink-onDeep' : ''}>{f}</span>)}
                        </p>
                    )}
                    {src && (
                        <button type="button" onClick={watch} tabIndex={watching ? -1 : 0}
                            className="title-card title-card--4 group mt-7 inline-flex h-14 cursor-pointer items-center gap-3 rounded-full bg-white pl-2 pr-6 text-[15.5px] font-semibold text-ink
                                       shadow-[0_18px_40px_-16px_rgba(0,0,0,0.7)] transition-transform duration-ui ease-standard hover:bg-ground motion-safe:active:scale-[0.97] focus-ring">
                            <span className="grid h-10 w-10 place-items-center rounded-full bg-accent text-ink-onAccent transition-transform duration-ui group-hover:scale-110">
                                <FiPlay aria-hidden="true" className="ml-0.5 h-4 w-4" />
                            </span>
                            Watch the film{len && <span className="font-normal text-ink-muted">{len}</span>}
                        </button>
                    )}
                </div>
            </div>
        </section>
    );
}

/* ── page ─────────────────────────────────────────────────────────────── */

export default function FilmStory({ data, videoId, related = [], rows = [] }) {
    const v = data.selectedVideo || {};
    const film = data.film || {};
    const story = data.story || {};
    const couple = [data.clientName?.Bride, data.clientName?.Groom].filter(Boolean).join(' & ') || 'Wedding film';
    const ceremony = rite(film.ceremony || v.tags?.[0]);
    const place = story.location?.city || v.videoLocation?.city || v.videoLocation?.state || '';
    const date = v.videoShootDate || '';
    const facts = [ceremony && (ceremony === 'Wedding' ? 'Their wedding' : `Their ${ceremony.toLowerCase()}`), place, date].filter(Boolean);
    const src = v.url || v.embedUrl || null;
    const poster = v.thumbnailUrl || v.thumbnailMetaData?.url;
    const titleRef = useRef(null);
    // Start the film from anywhere on the page (the chapter card): back to the title, then Watch.
    const watch = () => {
        titleRef.current?.scrollIntoView({ block: 'start', behavior: 'smooth' });
        window.setTimeout(() => titleRef.current?.querySelector('button.title-card--4')?.click(), 450);
    };

    // Chapters as films the in-place player understands.
    const chapters = useMemo(() => (data.chapters?.length ? data.chapters
        : [{ _id: videoId, ceremony: film.ceremony, posterUrl: poster, date, durationSec: v.durationSec, url: v.url, loopUrl: v.loopUrl, current: true }]),
    [data.chapters, videoId, film.ceremony, poster, date, v.durationSec, v.url, v.loopUrl]);
    const chapterFilms = useMemo(() => chapters.map((c) => ({
        _id: c._id, videos: { _id: c._id, videoShootDate: c.date, videoLocation: v.videoLocation },
        clientName: data.clientName, thumbnailUrl: c.posterUrl, url: c.url, embedUrl: c.embedUrl, loopUrl: c.loopUrl,
        event: c.ceremony, focus: c.focus, labels: [],
    })), [chapters, data.clientName, v.videoLocation]);
    const { play, player, playing } = useFilmPlayer(useMemo(() => [...chapterFilms, ...related], [chapterFilms, related]), rows);

    const curIdx = chapters.findIndex((c) => c.current);
    const nextIdx = chapters.length > 1 ? chapters.findIndex((c, i) => i > curIdx && c.url) : -1;
    const photos = (data.photos || []).filter((p) => p.url);
    // One line per person, their roles joined — like a film's closing credits.
    const credits = [...(film.credits?.length ? film.credits : (v.bts || []).map((b) => ({ name: b.key, role: b.value })))
        .filter((c) => c?.name)
        .reduce((m, c) => m.set(c.name, [...(m.get(c.name) || []), c.role].filter(Boolean)), new Map())]
        .map(([name, roles]) => ({ name, role: [...new Set(roles)].join(' · ') }));
    const words = [film.caption, story.intro].filter(Boolean);
    const others = chapters.filter((c) => !c.current).length;

    return (
        <div className="bg-ground pb-10">
            <RevealObserver />
            <div ref={titleRef} className="scroll-mt-[calc(var(--header-height)+0.75rem)]">
                <TitleSequence couple={couple} facts={facts} poster={poster} loopUrl={v.loopUrl} film={film} src={src}
                    durationSec={v.durationSec} nextChapter={nextIdx >= 0 ? (rite(chapters[nextIdx].ceremony) || 'the next film') : null}
                    onNext={() => { if (nextIdx >= 0) play(chapterFilms[nextIdx], chapterFilms); }} />
            </div>

            {/* 2 · The moment */}
            <section aria-label="About this film" className="mx-auto w-full max-w-4xl px-5 pb-8 pt-14 text-center sm:pt-20 md:px-8">
                {words.length ? words.map((w, i) => (
                    <p key={i} data-rise="" style={{ '--d': i + 1 }}
                        className={i === 0 ? 'text-balance font-display text-[28px] leading-[1.25] text-ink sm:text-[38px]' : 'mx-auto mt-5 max-w-2xl text-[16.5px] leading-relaxed text-ink-secondary'}>
                        {w}
                    </p>
                )) : (
                    <p data-rise="" style={{ '--d': 1 }} className="text-balance font-display text-[28px] leading-[1.25] text-ink sm:text-[38px]">
                        {ceremony ? `${couple}’s ${ceremony.toLowerCase()}` : couple}{place ? `, filmed in ${place}` : ''}{date ? ` in ${date}` : ''}.
                        {others > 0 && <span className="text-ink-muted"> One of {others + 1} films from their celebration.</span>}
                    </p>
                )}
                <p data-rise="" style={{ '--d': 3 }} className="mt-6 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-[13.5px] text-ink-muted">
                    {place && <span className="inline-flex items-center gap-1.5"><FiMapPin aria-hidden="true" className="h-4 w-4" />{[story.location?.venue, place].filter(Boolean).join(', ')}</span>}
                    {length(v.durationSec) && <span className="inline-flex items-center gap-1.5"><FiClock aria-hidden="true" className="h-4 w-4" />{length(v.durationSec)}</span>}
                    {data.wedding?.href && (
                        <Link href={data.wedding.href} className="inline-flex items-center gap-1 font-semibold text-accent-ink hover:text-accent">
                            Their wedding story <FiArrowUpRight aria-hidden="true" className="h-4 w-4" />
                        </Link>
                    )}
                </p>
            </section>

            {/* 3 · Chapters */}
            {chapters.length > 1 && (
                <section aria-labelledby="chapters-title" className="mx-auto w-full max-w-wide px-5 py-10 md:px-8 lg:px-10">
                    <h2 id="chapters-title" data-rise="" className="text-center text-[24px] font-semibold tracking-[-0.02em] text-ink sm:text-[32px]">
                        Their celebration, <em className="font-display font-medium italic tracking-normal text-accent-ink">chapter by chapter</em>
                    </h2>
                    <ol className="chapter-line relative mx-auto mt-10 grid max-w-5xl gap-5 sm:grid-cols-2 lg:flex lg:justify-center lg:gap-6">
                        {chapters.map((c, i) => {
                            const cur = c.current;
                            const isPlaying = playing?.videos?._id === c._id;
                            const body = (
                                <>
                                    <span className="relative block aspect-video overflow-hidden rounded-[18px] bg-ground-deep">
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img src={c.posterUrl} alt="" loading="lazy" style={focusStyle(c.focus)}
                                            className={`absolute inset-0 h-full w-full object-cover transition-transform duration-[1200ms] ease-entrance group-hover:scale-105 ${cur ? '' : 'saturate-[0.85]'}`} />
                                        <span aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                                        <span className="absolute left-3 top-3 rounded-full bg-black/45 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-white backdrop-blur-md">
                                            Chapter {pad(i + 1)}
                                        </span>
                                        {(cur || isPlaying) && (
                                            <span className="absolute bottom-3 left-3 inline-flex items-center gap-2 rounded-full bg-white/90 px-2.5 py-1 text-[11.5px] font-semibold text-ink">
                                                <Equalizer className="text-accent" />{cur ? 'Now watching' : 'Playing'}
                                            </span>
                                        )}
                                        {!cur && (
                                            <span aria-hidden="true" className="absolute bottom-3 right-3 grid h-10 w-10 place-items-center rounded-full bg-white/90 text-ink transition-transform group-hover:scale-110">
                                                <FiPlay className="ml-0.5 h-4 w-4" />
                                            </span>
                                        )}
                                    </span>
                                    <span className="mt-3 block font-display text-[21px] leading-tight text-ink">{rite(c.ceremony) || 'Film'}</span>
                                    <span className="mt-0.5 block text-[13px] text-ink-muted">{[c.date, length(c.durationSec)].filter(Boolean).join(' · ')}</span>
                                </>
                            );
                            return (
                                <li key={c._id} data-rise="" style={{ '--d': i }} className={`relative lg:w-[300px] ${cur ? 'chapter-current' : ''}`}>
                                    {cur ? (
                                        <button type="button" onClick={watch} aria-label={`Chapter ${i + 1}, ${rite(c.ceremony)}: now watching — play`}
                                            className="group block w-full cursor-pointer rounded-[20px] p-2 text-left ring-2 ring-accent/70 focus-ring">{body}</button>
                                    ) : (
                                        <Link href={`/films/${c._id}`} prefetch={false}
                                            onClick={(e) => { if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || !c.url) return; e.preventDefault(); play(chapterFilms[i], chapterFilms); }}
                                            className="group block rounded-[20px] p-2 transition-colors hover:bg-ground-raised focus-ring">{body}</Link>
                                    )}
                                </li>
                            );
                        })}
                    </ol>
                </section>
            )}

            {/* 4 · Stills */}
            {photos.length > 0 && (
                <section aria-labelledby="stills-title" className="mx-auto w-full max-w-wide px-5 py-12 md:px-8 lg:px-10">
                    <div className="flex flex-wrap items-end justify-between gap-4">
                        <h2 id="stills-title" data-rise="" className="text-[24px] font-semibold tracking-[-0.02em] text-ink sm:text-[32px]">
                            Stills from <em className="font-display font-medium italic tracking-normal text-accent-ink">the day</em>
                        </h2>
                        {data.wedding?.href && (
                            <Link href={data.wedding.href} className="inline-flex items-center gap-1.5 text-[14px] font-semibold text-accent-ink hover:text-accent">
                                All {photos.length} photos in their story <FiArrowRight aria-hidden="true" className="h-4 w-4" />
                            </Link>
                        )}
                    </div>
                    <div className="mt-6 columns-2 gap-3 sm:columns-3 lg:columns-4 [&>*]:mb-3">
                        {photos.slice(0, 12).map((p, i) => (
                            <Link key={p._id || i} href={data.wedding?.href || '#'} data-rise="mask" style={{ '--d': Math.floor(i / 2) % 5 }}
                                className="group relative block overflow-hidden rounded-[16px] bg-ground-deep break-inside-avoid focus-ring"
                                aria-label={`Photo ${i + 1} from ${couple}'s wedding story`}>
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={p.url} alt="" loading="lazy" decoding="async"
                                    style={{ aspectRatio: p.aspectRatio || 1.5, ...(p.blurDataURL ? { backgroundImage: `url(${p.blurDataURL})`, backgroundSize: 'cover' } : null) }}
                                    className="block h-auto w-full object-cover transition-transform duration-[1200ms] ease-entrance group-hover:scale-[1.04]" />
                            </Link>
                        ))}
                    </div>
                </section>
            )}

            {/* 5 · End credits */}
            {credits.length > 0 && (
                <section aria-labelledby="credits-title" className="mx-auto mt-6 w-full max-w-wide px-5 md:px-8 lg:px-10">
                    <div className="credits relative overflow-hidden rounded-[32px] bg-ground-deep px-6 py-14 text-center text-ink-onDeep sm:py-20">
                        <h2 id="credits-title" data-rise="" className="font-display text-[26px] italic text-gold sm:text-[30px]">The people behind this film</h2>
                        {/* classic credits: role right-aligned · name left-aligned, on one centre line */}
                        <dl className="mx-auto mt-10 max-w-3xl space-y-5 sm:space-y-4">
                            {credits.map((c, i) => (
                                <div key={c.name} data-rise="" style={{ '--d': i % 5 }}
                                    className="sm:grid sm:grid-cols-[1fr_auto_1fr] sm:items-baseline sm:gap-5">
                                    <dt className="text-[11px] font-semibold uppercase tracking-[0.24em] text-ink-onDeep/55 sm:text-right">{c.role || 'Crew'}</dt>
                                    <span aria-hidden="true" className="hidden h-1 w-1 rounded-full bg-gold sm:block" />
                                    <dd className="mt-1 font-display text-[24px] leading-tight sm:mt-0 sm:text-left sm:text-[28px]">{c.name}</dd>
                                </div>
                            ))}
                        </dl>
                        <p data-rise="" className="mt-12 font-display text-[18px] italic text-ink-onDeep/70">for {couple}</p>
                    </div>
                </section>
            )}

            {/* 6 · Keep watching */}
            {related.length > 0 && (
                <section aria-labelledby="more-title" className="py-12">
                    <div className="mx-auto flex w-full max-w-wide items-end justify-between gap-4 px-5 md:px-8 lg:px-10">
                        <h2 id="more-title" data-rise="" className="text-[24px] font-semibold tracking-[-0.02em] text-ink sm:text-[32px]">Keep watching</h2>
                        <Link href="/films" className="inline-flex items-center gap-1.5 text-[14px] font-semibold text-accent-ink hover:text-accent">All films <FiArrowRight aria-hidden="true" className="h-4 w-4" /></Link>
                    </div>
                    <div className="mt-5 flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-px-5 px-5 pb-2 scrollbar-none sm:gap-4 md:scroll-px-8 md:px-8 lg:mx-auto lg:max-w-wide lg:px-10">
                        {related.map((f) => (
                            <FilmCard key={f.videos._id} film={f} variant="auto" onPlay={(x) => play(x, related)} nowPlaying={playing?.videos?._id === f.videos._id}
                                sizes="(max-width: 640px) 72vw, 340px" className="w-[72vw] shrink-0 snap-start sm:w-[320px] lg:w-[340px]" />
                        ))}
                    </div>
                </section>
            )}

            <section className="mx-auto w-full max-w-wide px-5 md:px-8 lg:px-10">
                <div data-rise="sheet" className="flex flex-col items-start justify-between gap-5 rounded-[28px] bg-accent-tint p-6 sm:flex-row sm:items-center sm:p-10">
                    <div>
                        <p className="font-display text-[30px] leading-tight text-ink sm:text-[40px]">Your story could be <em className="italic text-accent-ink">the next film</em>.</p>
                        <p className="mt-2 text-[15px] text-ink-secondary">Tell us your date and where you&rsquo;re celebrating.</p>
                    </div>
                    <Link href="/contact" className="inline-flex h-12 shrink-0 items-center gap-2 rounded-full bg-accent px-6 text-[15px] font-semibold text-ink-onAccent hover:bg-accent-hover motion-safe:active:scale-[0.97] focus-ring">
                        Check your date <FiArrowRight aria-hidden="true" className="h-4 w-4" />
                    </Link>
                </div>
            </section>
            {player}
        </div>
    );
}
