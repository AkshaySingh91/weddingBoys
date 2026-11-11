'use client';

/**
 * /weddings/story/[slug] — the ONE page for a couple, told like a film.
 * /films/<id> redirects here with ?film=<id>, so the film someone chose opens.
 *
 *   Opening titles  the chosen film (or their first): still + loop, the title
 *                   card, and the Letterbox — Watch closes the frame to a screen
 *   Prologue        their headline, their story, their words; the Programme —
 *                   the ceremonies listed like an invitation card's functions
 *   Scenes          every ceremony in order, each with ITS films (play in place,
 *                   Up next through the whole wedding) and photos (a swipeable
 *                   contact strip on phones, a mosaic on wider screens)
 *   End credits     the crew · their review · more weddings
 *   Post-credits    a slate: "Scene: your wedding"
 *
 * SIGNATURE — Scene Grade: each ceremony carries its own light. As the visitor
 * moves from haldi to reception, a soft wash behind the page crossfades from
 * turmeric to henna green, sangeet dusk, pheras sindoor and reception night;
 * on phones the browser bar takes the grade. One fixed layer of N gradients,
 * opacity only; the active scene comes from one IntersectionObserver (no work
 * per frame). Reduced motion: the grade changes without the crossfade.
 *
 * Empty sections are not rendered. Text and links are in the server HTML.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { FiPlay } from 'react-icons/fi';
import { TitleSequence } from '@/app/(site)/films/[videoId]/_components/FilmStory.jsx';
import { Equalizer } from '@/Component/films/FilmCard.jsx';
import useFilmPlayer from '@/Component/films/useFilmPlayer.jsx';
import RevealObserver from '@/Component/home/RevealObserver.jsx';
import ClapObserver from '@/app/(site)/team/_components/ClapObserver.jsx';

const pad = (n) => String(n).padStart(2, '0');
const rite = (c) => (c === 'Wedding / Pheras' ? 'Wedding' : c || '');
const length = (s) => (Number.isFinite(s) && s > 0 ? (s < 60 ? `${Math.round(s)} sec` : `${Math.floor(s / 60)} min${s % 60 >= 5 ? ` ${Math.round(s % 60)} sec` : ''}`) : null);
const where = (loc) => (typeof loc === 'string' ? loc : [loc?.venue, loc?.city].filter(Boolean).join(', '));
const counts = (c) => [c.films.length && `${c.films.length} film${c.films.length === 1 ? '' : 's'}`, c.photos.length && `${c.photos.length} photograph${c.photos.length === 1 ? '' : 's'}`].filter(Boolean).join(', ');

/* ── Scene Grade ───────────────────────────────────────────────────────── */

// The ritual's own light (r g b). A colour set on the ceremony tag in admin
// wins; these are the defaults.
const GRADES = {
    haldi: '232 170 40', mehendi: '112 128 60', mehndi: '112 128 60', sangeet: '120 70 130', cocktail: '120 70 130',
    engagement: '201 162 39', tilak: '201 162 39', 'pre-wedding': '201 162 39',
    wedding: '217 52 42', 'wedding-pheras': '217 52 42', pheras: '217 52 42', reception: '51 22 26',
};
const hexToRgb = (hex) => {
    const m = /^#?([0-9a-f]{6})$/i.exec(hex || '');
    if (!m) return null;
    const n = parseInt(m[1], 16);
    return `${(n >> 16) & 255} ${(n >> 8) & 255} ${n & 255}`;
};
const gradeOf = (c) => hexToRgb(c.color) || GRADES[c.key] || GRADES[String(c.label || '').toLowerCase().split(/[\s/]+/)[0]] || '201 162 39';
/** The grade mixed 30% into the ivory ground: for the browser bar. */
const barColour = (rgb) => {
    const [r, g, b] = rgb.split(' ').map(Number); const ground = [251, 246, 238];
    return `rgb(${[r, g, b].map((v, i) => Math.round(v * 0.3 + ground[i] * 0.7)).join(',')})`;
};

/** Which scene is in the middle of the screen (−1: none). One observer. */
function useActiveScene(count) {
    const [active, setActive] = useState(-1);
    useEffect(() => {
        if (!count || typeof IntersectionObserver === 'undefined') return undefined;
        const els = [...document.querySelectorAll('[data-scene]')];
        const io = new IntersectionObserver((entries) => {
            for (const e of entries) {
                const i = Number(e.target.dataset.scene);
                if (e.isIntersecting) setActive(i);
                else setActive((a) => (a === i ? -1 : a));
            }
        }, { rootMargin: '-45% 0px -45% 0px' });
        els.forEach((el) => io.observe(el));
        return () => io.disconnect();
    }, [count]);
    return active;
}

function GradeLayer({ grades, active }) {
    return (
        <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-0">
            {grades.map((g, i) => (
                <span key={i} style={{ '--grade': g }}
                    className={`scene-grade absolute inset-0 transition-opacity duration-[900ms] ease-entrance motion-reduce:transition-none ${i === active ? 'opacity-100' : 'opacity-0'}`} />
            ))}
        </div>
    );
}

/** Phones: the current scene and a segmented reel; tap to jump between scenes. */
function ReelPill({ chapters, grades, active }) {
    const [open, setOpen] = useState(false);
    const total = chapters.reduce((n, c) => n + c.films.length * 4 + c.photos.length, 0) || 1;
    if (chapters.length < 2) return null;
    const cur = chapters[active];
    return (
        <nav aria-label="Jump to a ceremony"
            className={`fixed bottom-4 left-4 z-40 transition-[opacity,transform] duration-ui ease-standard md:hidden ${active >= 0 ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-3 opacity-0'}`}>
            {open && (
                <ol className="mb-2 w-60 overflow-hidden rounded-[20px] bg-ground-raised/95 py-1.5 shadow-[0_18px_40px_-18px_rgba(51,22,26,0.6)] ring-1 ring-ink/10 backdrop-blur-md">
                    {chapters.map((c, i) => (
                        <li key={c.key}>
                            <a href={`#chapter-${c.key}`} onClick={() => setOpen(false)}
                                className={`flex items-center gap-3 px-4 py-2.5 text-[14px] ${i === active ? 'font-semibold text-ink' : 'text-ink-secondary'}`}>
                                <span aria-hidden="true" className="h-2.5 w-2.5 rounded-full" style={{ background: `rgb(${grades[i]})` }} />
                                <span className="tabular-nums text-ink-muted">{pad(i + 1)}</span>{rite(c.label)}
                            </a>
                        </li>
                    ))}
                </ol>
            )}
            <button type="button" onClick={() => setOpen((v) => !v)} aria-expanded={open}
                className="flex h-11 cursor-pointer items-center gap-3 rounded-full bg-ground-raised/95 pl-4 pr-3 text-[13.5px] font-semibold text-ink shadow-[0_12px_30px_-14px_rgba(51,22,26,0.6)] ring-1 ring-ink/10 backdrop-blur-md focus-ring">
                <span className="tabular-nums text-ink-muted">{pad((active >= 0 ? active : 0) + 1)}</span>
                <span className="max-w-[8rem] truncate">{rite(cur?.label) || 'Scenes'}</span>
                <span aria-hidden="true" className="flex h-1.5 w-20 gap-[2px] overflow-hidden rounded-full">
                    {chapters.map((c, i) => (
                        <span key={c.key} className="h-full transition-opacity duration-ui"
                            style={{ flex: (c.films.length * 4 + c.photos.length) / total, background: `rgb(${grades[i]})`, opacity: i <= active ? 1 : 0.25 }} />
                    ))}
                </span>
            </button>
        </nav>
    );
}

/* ── Pieces ────────────────────────────────────────────────────────────── */

/** Wedding-API films → the shape the in-place player and FilmCard use. */
const asFilm = (f, couple) => ({
    _id: f._id, videos: { _id: f._id }, clientName: couple,
    thumbnailUrl: f.posterUrl, url: f.webUrl || f.sourceUrl || null, embedUrl: f.embedUrl || null, loopUrl: f.loopUrl || null,
    event: f.ceremony, labels: f.tags || [], blurDataURL: f.blurDataURL, dominantColor: f.dominantColor,
});

function ChapterFilm({ f, playing, onPlay }) {
    return (
        <Link href={`/films/${f._id}`} prefetch={false}
            onClick={(e) => { if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey) return; e.preventDefault(); onPlay(); }}
            className="group relative block overflow-hidden rounded-[22px] bg-ground-deep focus-ring" aria-label={`Play the ${rite(f.ceremony) || 'wedding'} film`}>
            <span className="relative block aspect-video">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={f.thumbnailUrl} alt="" loading="lazy" decoding="async"
                    style={f.blurDataURL ? { backgroundImage: `url(${f.blurDataURL})`, backgroundSize: 'cover' } : undefined}
                    className="absolute inset-0 h-full w-full object-cover transition-transform duration-[1400ms] ease-entrance group-hover:scale-[1.04]" />
                <span aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent" />
                <span className="absolute bottom-3 left-3 inline-flex items-center gap-2 rounded-full bg-white/90 py-1.5 pl-1.5 pr-3.5 text-[13px] font-semibold text-ink">
                    <span className="grid h-8 w-8 place-items-center rounded-full bg-accent text-ink-onAccent">
                        {playing ? <Equalizer /> : <FiPlay aria-hidden="true" className="ml-0.5 h-3.5 w-3.5" />}
                    </span>
                    {playing ? 'Playing' : 'The film'}{f.durationSec ? <span className="font-normal text-ink-muted">{length(f.durationSec)}</span> : null}
                </span>
            </span>
        </Link>
    );
}

function Photos({ photos, title }) {
    const [open, setOpen] = useState(false);
    const shown = open ? photos : photos.slice(0, 6);
    const img = (p, extra) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={p.imageUrl || p.posterUrl} alt={p.caption || `${title}, a photograph`} loading="lazy" decoding="async"
            style={{ aspectRatio: p.aspectRatio || 1.5, ...(p.blurDataURL ? { backgroundImage: `url(${p.blurDataURL})`, backgroundSize: 'cover' } : null) }}
            className={extra} />
    );
    return (
        <div>
            {/* Phones: a contact strip — swipe through the scene's frames */}
            <ul className="-mx-5 flex snap-x snap-mandatory gap-2.5 overflow-x-auto px-5 pb-1 scroll-px-5 scrollbar-none sm:hidden" aria-label="Photographs">
                {photos.map((p, i) => (
                    <li key={p._id || i} className="h-[52svh] max-h-[440px] shrink-0 snap-start overflow-hidden rounded-[16px] bg-ground-deep">
                        {img(p, 'block h-full w-auto object-cover')}
                    </li>
                ))}
            </ul>
            {/* Wider screens: a mosaic */}
            <div className="hidden columns-2 gap-3 sm:block sm:columns-3 [&>*]:mb-3">
                {shown.map((p, i) => (
                    <figure key={p._id || i} data-rise="mask" style={{ '--d': Math.floor(i / 2) % 5 }} className="break-inside-avoid overflow-hidden rounded-[16px] bg-ground-deep">
                        {img(p, 'block h-auto w-full object-cover')}
                    </figure>
                ))}
            </div>
            {photos.length > 6 && (
                <button type="button" onClick={() => setOpen((v) => !v)}
                    className="mt-1 hidden h-11 cursor-pointer items-center gap-2 rounded-full px-5 text-[14px] font-semibold text-ink ring-1 ring-ink/15 hover:bg-ink/5 focus-ring sm:inline-flex">
                    {open ? 'Show fewer' : `Show all ${photos.length} photographs`}
                </button>
            )}
        </div>
    );
}

/** The ceremonies listed like the functions on an invitation card. */
function Programme({ title, chapters, grades, place }) {
    return (
        <nav aria-label="The celebrations" data-rise="sheet"
            className="relative rounded-[28px] bg-ground-raised px-7 pb-7 pt-8 text-center ring-1 ring-gold/40 shadow-[0_24px_50px_-36px_rgba(51,22,26,0.5)]">
            <span aria-hidden="true" className="pointer-events-none absolute inset-2 rounded-[22px] ring-1 ring-gold/25" />
            <p className="font-display text-[15px] italic text-ink-muted">the celebrations of</p>
            <p className="mt-1 font-display text-[28px] leading-tight text-ink">{title}</p>
            <ol className="mt-6 space-y-1">
                {chapters.map((c, i) => (
                    <li key={c.key}>
                        <a href={`#chapter-${c.key}`} className="group flex items-baseline justify-between gap-4 rounded-xl px-3 py-2 text-left transition-colors hover:bg-ink/[0.04] focus-ring">
                            <span className="flex items-baseline gap-3">
                                <span aria-hidden="true" className="relative top-[-2px] h-2 w-2 shrink-0 rounded-full" style={{ background: `rgb(${grades[i]})` }} />
                                <span className="font-display text-[20px] text-ink">{rite(c.label)}</span>
                            </span>
                            <span className="shrink-0 text-[13px] text-ink-muted">{counts(c)}</span>
                        </a>
                    </li>
                ))}
            </ol>
            {place && <p className="mt-5 text-[13.5px] text-ink-muted">{place}</p>}
        </nav>
    );
}

function Clapper() {
    return (
        <div aria-hidden="true" className="relative h-7">
            <span className="slate-arm absolute inset-x-0 top-0 h-[22px]">
                <span className="slate-bar slate-stripes-deep absolute inset-0 rounded-[6px]" />
            </span>
            <span className="slate-seam absolute inset-x-1 bottom-[3px] h-[2px] rounded-full bg-gold" />
        </div>
    );
}

/* ── Page ──────────────────────────────────────────────────────────────── */

export default function WeddingStory({ data, filmId = null, rows = [] }) {
    const { wedding: w, films = [], ceremonies = [], crew = [], reviews = [], related = [] } = data;
    const couple = useMemo(() => ({ Bride: w.couple?.bride, Groom: w.couple?.groom }), [w.couple?.bride, w.couple?.groom]);
    const story = w.story || {};

    // The opening film: the one they came for, else the wedding's first.
    const ordered = useMemo(() => ceremonies.flatMap((c) => c.films), [ceremonies]);
    const allFilms = useMemo(() => (ordered.length ? ordered : films).map((f) => asFilm(f, couple)), [ordered, films, couple]);
    const opening = allFilms.find((f) => f._id === filmId) || allFilms[0] || null;
    const openingRaw = (ordered.length ? ordered : films).find((f) => f._id === opening?._id);
    const nextIdx = opening ? allFilms.findIndex((f) => f._id === opening._id) + 1 : -1;
    const next = nextIdx > 0 && nextIdx < allFilms.length ? allFilms[nextIdx] : null;
    const { play, player, playing } = useFilmPlayer(allFilms, rows);

    const facts = [w.dates, where(w.location)].filter(Boolean);
    const chapters = useMemo(() => ceremonies.filter((c) => c.films.length || c.photos.length), [ceremonies]);
    const grades = useMemo(() => chapters.map(gradeOf), [chapters]);
    const active = useActiveScene(chapters.length);

    // Phones: the browser bar takes the scene's grade (restored on leaving).
    const metaRef = useRef(null);
    useEffect(() => {
        let meta = document.querySelector('meta[name="theme-color"]');
        if (!meta) { meta = document.createElement('meta'); meta.name = 'theme-color'; document.head.appendChild(meta); }
        metaRef.current = { meta, prev: meta.getAttribute('content') };
        return () => { const m = metaRef.current; if (m?.prev) m.meta.setAttribute('content', m.prev); else m?.meta.removeAttribute('content'); };
    }, []);
    useEffect(() => {
        const m = metaRef.current; if (!m) return;
        if (active >= 0) m.meta.setAttribute('content', barColour(grades[active]));
        else if (m.prev) m.meta.setAttribute('content', m.prev); else m.meta.removeAttribute('content');
    }, [active, grades]);

    const showProgramme = story.generated?.highlights !== false && chapters.length > 0;

    return (
        <article className="relative isolate bg-ground pb-10">
            <RevealObserver />
            <ClapObserver />
            <GradeLayer grades={grades} active={active} />

            <div className="relative z-[1]">
                <TitleSequence couple={w.title} facts={facts}
                    poster={opening?.thumbnailUrl || w.cover?.url} loopUrl={opening?.loopUrl}
                    film={{ blurDataURL: opening?.blurDataURL || w.cover?.blurDataURL, focus: null }}
                    src={opening ? (opening.url || opening.embedUrl) : null} durationSec={openingRaw?.durationSec}
                    nextChapter={next ? rite(next.event) || 'the next film' : null}
                    onNext={() => { if (next) play(next, allFilms); }} />

                {/* Prologue */}
                {story.headline && (
                    <section aria-labelledby="about-title" className="mx-auto w-full max-w-wide px-5 pb-6 pt-14 sm:pt-20 md:px-8 lg:px-10">
                        <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:gap-16">
                            <div>
                                <h2 id="about-title" data-rise="" className="text-balance font-display text-[34px] leading-[1.08] text-ink sm:text-[48px]">{story.headline}</h2>
                                <div className={`mt-6 space-y-4 ${story.generated?.about ? 'text-[17px] leading-relaxed text-ink-secondary' : 'text-[18px] leading-[1.7] text-ink'}`}>
                                    {(story.about || []).map((p, i) => <p key={i} data-rise="" style={{ '--d': i + 1 }}>{p}</p>)}
                                </div>
                                {story.quote && (
                                    <figure data-rise="" className="mt-10 border-l-2 border-accent pl-6">
                                        <blockquote className="font-display text-[24px] leading-snug text-ink sm:text-[28px]">&ldquo;{story.quote.text}&rdquo;</blockquote>
                                        <figcaption className="mt-3 text-[14px] text-ink-muted">{story.quote.by}</figcaption>
                                    </figure>
                                )}
                            </div>
                            <div className="space-y-6">
                                {showProgramme ? (
                                    <Programme title={w.title} chapters={chapters} grades={grades} place={where(w.location)} />
                                ) : (
                                    /* highlights the studio wrote: one card, divided cells */
                                    <dl data-rise="sheet" className="grid grid-cols-2 overflow-hidden rounded-[28px] bg-ground-raised ring-1 ring-ink/[0.07]">
                                        {story.highlights.map((h, i) => (
                                            <div key={`${h.label}-${i}`} className={`p-5 ${i % 2 ? 'border-l border-ink/[0.07]' : ''} ${i > 1 ? 'border-t border-ink/[0.07]' : ''}`}>
                                                <dd className="font-display text-[32px] leading-none text-ink">{h.value}</dd>
                                                <dt className="mt-2 text-[13px] text-ink-muted">{h.label}</dt>
                                            </div>
                                        ))}
                                    </dl>
                                )}
                            </div>
                        </div>
                    </section>
                )}

                {/* Scenes */}
                {chapters.length > 0 && (
                    <section aria-labelledby="chapters-title" className="mx-auto w-full max-w-wide px-5 py-12 md:px-8 lg:px-10">
                        <h2 id="chapters-title" data-rise="" className="font-display text-[30px] leading-tight text-ink sm:text-[40px]">The celebration, scene by scene</h2>
                        <ol className="mt-10 space-y-16 sm:space-y-20">
                            {chapters.map((c, i) => (
                                <li key={c.key} id={`chapter-${c.key}`} data-scene={i} style={{ '--grade': grades[i] }}
                                    className="story-chapter relative scroll-mt-24 grid gap-6 lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-12">
                                    <header className="lg:sticky lg:top-[calc(var(--header-height)+2rem)] lg:self-start">
                                        <p data-rise="" className="font-display text-[64px] font-black leading-none sm:text-[84px]" style={{ color: `rgb(${grades[i]} / 0.55)` }}>{pad(i + 1)}</p>
                                        <h3 data-rise="" style={{ '--d': 1 }} className="-mt-3 font-display text-[30px] leading-tight text-ink sm:text-[36px]">{rite(c.label)}</h3>
                                        <span aria-hidden="true" data-rise="draw" style={{ '--d': 2, background: `rgb(${grades[i]})` }} className="mt-3 block h-[3px] w-14 rounded-full" />
                                        <p data-rise="" style={{ '--d': 2 }} className="mt-3 text-[14px] text-ink-muted">{counts(c)}</p>
                                    </header>
                                    <div className="min-w-0 space-y-4">
                                        {c.films.map((f) => {
                                            const film = allFilms.find((x) => x._id === f._id) || asFilm(f, couple);
                                            return <div key={f._id} data-rise="mask"><ChapterFilm f={{ ...f, ...film }} playing={playing?.videos?._id === f._id} onPlay={() => play(film, allFilms)} /></div>;
                                        })}
                                        {c.photos.length > 0 && <Photos photos={c.photos} title={w.title} />}
                                    </div>
                                </li>
                            ))}
                        </ol>
                    </section>
                )}

                {/* End credits */}
                {crew.length > 0 && (
                    <section aria-labelledby="credits-title" className="mx-auto mt-4 w-full max-w-wide px-5 md:px-8 lg:px-10">
                        <div className="rounded-[32px] bg-ground-deep px-6 py-14 text-center text-ink-onDeep sm:py-20">
                            <h2 id="credits-title" data-rise="" className="font-display text-[26px] italic text-gold sm:text-[30px]">The people behind their story</h2>
                            <dl className="mx-auto mt-10 max-w-3xl space-y-5 sm:space-y-4">
                                {crew.map((c, i) => (
                                    <div key={c.name} data-rise="line" style={{ '--d': i % 5 }} className="sm:grid sm:grid-cols-[1fr_auto_1fr] sm:items-baseline sm:gap-5">
                                        <dt className="text-[11px] font-semibold uppercase tracking-[0.24em] text-ink-onDeep/55 sm:text-right">{(c.roles || []).join(', ') || 'Crew'}</dt>
                                        <span aria-hidden="true" className="hidden h-1 w-1 rounded-full bg-gold sm:block" />
                                        <dd className="mt-1 font-display text-[24px] leading-tight sm:mt-0 sm:text-left sm:text-[28px]">{c.name}</dd>
                                    </div>
                                ))}
                            </dl>
                            <p data-rise="" className="mt-12 font-display text-[18px] italic text-ink-onDeep/70">for {w.title}</p>
                        </div>
                    </section>
                )}

                {/* Their words */}
                {reviews.length > 0 && (
                    <section aria-labelledby="words-title" className="mx-auto w-full max-w-3xl px-5 py-16 text-center md:px-8">
                        <h2 id="words-title" className="sr-only">In their words</h2>
                        {reviews.map((r, i) => (
                            <figure key={i} data-rise="" className="mx-auto">
                                <blockquote className="text-balance font-display text-[26px] leading-snug text-ink sm:text-[34px]">&ldquo;{r.text}&rdquo;</blockquote>
                                <figcaption className="mt-5 inline-flex items-center gap-3 text-[15px] text-ink-secondary">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    {r.photoUrl && <img src={r.photoUrl} alt="" className="h-11 w-11 rounded-full object-cover" />}
                                    {r.name}
                                </figcaption>
                            </figure>
                        ))}
                    </section>
                )}

                {/* More weddings */}
                {related.length > 0 && (
                    <section aria-labelledby="more-title" className="mx-auto w-full max-w-wide px-5 py-12 md:px-8 lg:px-10">
                        <div className="flex items-end justify-between gap-4">
                            <h2 id="more-title" data-rise="" className="font-display text-[30px] leading-tight text-ink sm:text-[40px]">More weddings</h2>
                            <Link href="/weddings" className="text-[14px] font-semibold text-accent-ink hover:text-accent">All weddings</Link>
                        </div>
                        <ul className="mt-6 grid gap-4 sm:grid-cols-3">
                            {related.map((r) => (
                                <li key={r.slug} data-rise="">
                                    <Link href={r.href} className="group block rounded-[22px] focus-ring">
                                        <span className="relative block aspect-[4/5] overflow-hidden rounded-[22px] bg-ground-deep">
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            {r.cover?.url && <img src={r.cover.url} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover transition-transform duration-[1400ms] ease-entrance group-hover:scale-[1.04]" />}
                                            <span aria-hidden="true" className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/60 to-transparent" />
                                            <span className="absolute inset-x-4 bottom-4 text-white">
                                                <span className="block font-display text-[24px] leading-tight">{r.title}</span>
                                                <span className="block text-[13px] text-white/75">{[where(r.location), r.dates].filter(Boolean).join(', ')}</span>
                                            </span>
                                        </span>
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </section>
                )}

                {/* Post-credits: the next scene is theirs */}
                <section aria-labelledby="next-scene-title" className="mx-auto w-full max-w-3xl px-5 pb-6 pt-8 md:px-8">
                    <div data-clap="" tabIndex={-1} className="slate group relative rounded-[28px] bg-ground-deep p-3 text-ink-onDeep shadow-[0_30px_60px_-34px_rgba(51,22,26,0.8)] sm:p-4">
                        <Clapper />
                        <div className="slate-shot mt-2 rounded-[20px] bg-black/20 p-6 sm:p-8">
                            <h2 id="next-scene-title" className="font-display text-[30px] leading-tight sm:text-[40px]">The next scene could be yours.</h2>
                            <dl className="mt-6 grid grid-cols-2 gap-px overflow-hidden rounded-[16px] bg-white/10 text-left sm:grid-cols-3">
                                {[['Scene', 'Your wedding'], ['Couple', 'You two'], ['Date', 'Tell us']].map(([k, v], i) => (
                                    <div key={k} className={`bg-ground-deep px-4 py-3 ${i === 2 ? 'col-span-2 sm:col-span-1' : ''}`}>
                                        <dt className="text-[11px] font-semibold uppercase tracking-[0.2em] text-ink-onDeep/50">{k}</dt>
                                        <dd className="mt-1 text-[17px] font-semibold">{v}</dd>
                                    </div>
                                ))}
                            </dl>
                            <Link href="/contact" className="mt-6 inline-flex h-12 items-center rounded-full bg-accent px-6 text-[15px] font-semibold text-ink-onAccent hover:bg-accent-hover motion-safe:active:scale-[0.97] focus-ring">
                                Check your date
                            </Link>
                        </div>
                    </div>
                </section>
            </div>

            <ReelPill chapters={chapters} grades={grades} active={active} />
            {player}
        </article>
    );
}
