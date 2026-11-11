'use client';

/**
 * /weddings/story/[slug] — the ONE page for a couple. Every film and photo of
 * their wedding, told as a story. /films/<id> redirects here with ?film=<id>,
 * so the film someone chose opens the page.
 *
 *   Title sequence  the chosen film (or their first) — still + loop, the title
 *                   card, and the Letterbox: Watch closes the frame to a screen
 *   About           their headline, their story, their words, the highlights —
 *                   written in admin, or plain facts from the data when not
 *   Chapters        every ceremony in order, each with ITS films and photos;
 *                   films play in place with Up next through the whole wedding
 *   Credits         the crew, as a film's closing credits
 *   Their words     a review linked to this wedding
 *   More weddings   related couples · CTA
 *
 * Empty sections are not rendered. Text and links are in the server HTML.
 */
import { useMemo, useState } from 'react';
import Link from 'next/link';
import { FiPlay, FiArrowRight, FiArrowUpRight } from 'react-icons/fi';
import { TitleSequence } from '@/app/(site)/films/[videoId]/_components/FilmStory.jsx';
import { Equalizer } from '@/Component/films/FilmCard.jsx';
import useFilmPlayer from '@/Component/films/useFilmPlayer.jsx';
import RevealObserver from '@/Component/home/RevealObserver.jsx';

const pad = (n) => String(n).padStart(2, '0');
const rite = (c) => (c === 'Wedding / Pheras' ? 'Wedding' : c || '');
const length = (s) => (Number.isFinite(s) && s > 0 ? (s < 60 ? `${Math.round(s)} sec` : `${Math.floor(s / 60)} min${s % 60 >= 5 ? ` ${Math.round(s % 60)} sec` : ''}`) : null);
const where = (loc = {}) => [loc.venue, loc.city].filter(Boolean).join(', ');

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
    return (
        <div>
            <div className="columns-2 gap-3 sm:columns-3 [&>*]:mb-3">
                {shown.map((p, i) => (
                    <figure key={p._id || i} data-rise="mask" style={{ '--d': Math.floor(i / 2) % 5 }} className="break-inside-avoid overflow-hidden rounded-[16px] bg-ground-deep">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={p.imageUrl || p.posterUrl} alt={p.caption || `${title}, a photograph`} loading="lazy" decoding="async"
                            style={{ aspectRatio: p.aspectRatio || 1.5, ...(p.blurDataURL ? { backgroundImage: `url(${p.blurDataURL})`, backgroundSize: 'cover' } : null) }}
                            className="block h-auto w-full object-cover" />
                    </figure>
                ))}
            </div>
            {photos.length > 6 && (
                <button type="button" onClick={() => setOpen((v) => !v)}
                    className="mt-1 inline-flex h-11 cursor-pointer items-center gap-2 rounded-full px-5 text-[14px] font-semibold text-ink ring-1 ring-ink/15 hover:bg-ink/5 focus-ring">
                    {open ? 'Show fewer' : `Show all ${photos.length} photographs`}
                </button>
            )}
        </div>
    );
}

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
    const chapters = ceremonies.filter((c) => c.films.length || c.photos.length);
    const photoCount = chapters.reduce((n, c) => n + c.photos.length, 0);

    return (
        <article className="bg-ground pb-10">
            <RevealObserver />

            <TitleSequence couple={w.title} facts={facts}
                poster={opening?.thumbnailUrl || w.cover?.url} loopUrl={opening?.loopUrl}
                film={{ blurDataURL: opening?.blurDataURL || w.cover?.blurDataURL, focus: null }}
                src={opening ? (opening.url || opening.embedUrl) : null} durationSec={openingRaw?.durationSec}
                nextChapter={next ? rite(next.event) || 'the next film' : null}
                onNext={() => { if (next) play(next, allFilms); }} />

            {/* About */}
            {story.headline && (
            <section aria-labelledby="about-title" className="mx-auto w-full max-w-wide px-5 pb-6 pt-14 sm:pt-20 md:px-8 lg:px-10">
                <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] lg:gap-16">
                    <div>
                        <h2 id="about-title" data-rise="" className="text-balance font-display text-[34px] leading-[1.08] text-ink sm:text-[48px]">{story.headline}</h2>
                        <div className={`mt-6 space-y-4 ${story.generated?.about ? 'text-[17px] leading-relaxed text-ink-secondary' : 'text-[18px] leading-[1.7] text-ink'}`}>
                            {(story.about || []).map((p, i) => <p key={i} data-rise="" style={{ '--d': i + 1 }}>{p}</p>)}
                        </div>
                    </div>
                    <div className="space-y-8">
                        {story.quote && (
                            <figure data-rise="" className="relative rounded-[28px] bg-accent-tint p-7">
                                <span aria-hidden="true" className="absolute -top-5 left-6 font-display text-[90px] leading-none text-accent/40">&ldquo;</span>
                                <blockquote className="font-display text-[24px] leading-snug text-ink">{story.quote.text}</blockquote>
                                <figcaption className="mt-3 text-[14px] text-ink-muted">{story.quote.by}</figcaption>
                            </figure>
                        )}
                        {story.highlights?.length > 0 && (
                            <dl className="grid grid-cols-2 gap-3">
                                {story.highlights.map((h, i) => (
                                    <div key={`${h.label}-${i}`} data-rise="" style={{ '--d': i }} className="rounded-[22px] bg-ground-raised p-5 ring-1 ring-ink/[0.06]">
                                        <dd className="font-display text-[34px] leading-none text-ink">{h.value}</dd>
                                        <dt className="mt-2 text-[13px] text-ink-muted">{h.label}</dt>
                                    </div>
                                ))}
                            </dl>
                        )}
                    </div>
                </div>
            </section>
            )}

            {/* The day, chapter by chapter */}
            {chapters.length > 0 && (
                <section aria-labelledby="chapters-title" className="mx-auto w-full max-w-wide px-5 py-12 md:px-8 lg:px-10">
                    <h2 id="chapters-title" data-rise="" className="text-[26px] font-semibold tracking-[-0.02em] text-ink sm:text-[34px]">
                        The celebration, <em className="font-display font-medium italic tracking-normal text-accent-ink">chapter by chapter</em>
                    </h2>
                    <ol className="mt-10 space-y-16 sm:space-y-20">
                        {chapters.map((c, i) => (
                            <li key={c.key} id={`chapter-${c.key}`} className="story-chapter relative grid gap-6 lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-12">
                                <header className="lg:sticky lg:top-[calc(var(--header-height)+2rem)] lg:self-start">
                                    <p data-rise="" className="font-display text-[64px] font-black leading-none text-accent/50 sm:text-[84px]">{pad(i + 1)}</p>
                                    <h3 data-rise="" style={{ '--d': 1 }} className="-mt-3 font-display text-[30px] leading-tight text-ink sm:text-[36px]">{rite(c.label)}</h3>
                                    <p data-rise="" style={{ '--d': 2 }} className="mt-1 text-[14px] text-ink-muted">
                                        {[c.films.length && `${c.films.length} film${c.films.length === 1 ? '' : 's'}`, c.photos.length && `${c.photos.length} photograph${c.photos.length === 1 ? '' : 's'}`].filter(Boolean).join(', ')}
                                    </p>
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

            {/* Credits */}
            {crew.length > 0 && (
                <section aria-labelledby="credits-title" className="mx-auto mt-4 w-full max-w-wide px-5 md:px-8 lg:px-10">
                    <div className="rounded-[32px] bg-ground-deep px-6 py-14 text-center text-ink-onDeep sm:py-20">
                        <h2 id="credits-title" data-rise="" className="font-display text-[26px] italic text-gold sm:text-[30px]">The people behind their story</h2>
                        <dl className="mx-auto mt-10 max-w-3xl space-y-5 sm:space-y-4">
                            {crew.map((c, i) => (
                                <div key={c.name} data-rise="" style={{ '--d': i % 5 }} className="sm:grid sm:grid-cols-[1fr_auto_1fr] sm:items-baseline sm:gap-5">
                                    <dt className="text-[11px] font-semibold uppercase tracking-[0.24em] text-ink-onDeep/55 sm:text-right">{(c.roles || []).join(' · ') || 'Crew'}</dt>
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
                        <h2 id="more-title" data-rise="" className="text-[26px] font-semibold tracking-[-0.02em] text-ink sm:text-[34px]">More weddings</h2>
                        <Link href="/weddings" className="inline-flex items-center gap-1.5 text-[14px] font-semibold text-accent-ink hover:text-accent">All weddings <FiArrowRight aria-hidden="true" className="h-4 w-4" /></Link>
                    </div>
                    <ul className="mt-6 grid gap-4 sm:grid-cols-3">
                        {related.map((r) => (
                            <li key={r.slug} data-rise="" >
                                <Link href={r.href} className="group block focus-ring rounded-[22px]">
                                    <span className="relative block aspect-[4/5] overflow-hidden rounded-[22px] bg-ground-deep">
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        {r.cover?.url && <img src={r.cover.url} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover transition-transform duration-[1400ms] ease-entrance group-hover:scale-[1.04]" />}
                                        <span aria-hidden="true" className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/60 to-transparent" />
                                        <span className="absolute inset-x-4 bottom-4 text-white">
                                            <span className="block font-display text-[24px] leading-tight">{r.title}</span>
                                            <span className="block text-[13px] text-white/75">{[r.location, r.dates].filter(Boolean).join(', ')}</span>
                                        </span>
                                    </span>
                                </Link>
                            </li>
                        ))}
                    </ul>
                </section>
            )}

            <section className="mx-auto w-full max-w-wide px-5 md:px-8 lg:px-10">
                <div data-rise="sheet" className="flex flex-col items-start justify-between gap-5 rounded-[28px] bg-accent-tint p-6 sm:flex-row sm:items-center sm:p-10">
                    <div>
                        <p className="font-display text-[30px] leading-tight text-ink sm:text-[40px]">Your story could be <em className="italic text-accent-ink">the next one</em>.</p>
                        <p className="mt-2 text-[15px] text-ink-secondary">Tell us your date and where you&rsquo;re celebrating.</p>
                    </div>
                    <Link href="/contact" className="inline-flex h-12 shrink-0 items-center gap-2 rounded-full bg-accent px-6 text-[15px] font-semibold text-ink-onAccent hover:bg-accent-hover motion-safe:active:scale-[0.97] focus-ring">
                        Check your date <FiArrowUpRight aria-hidden="true" className="h-4 w-4" />
                    </Link>
                </div>
            </section>
            {photoCount === 0 && null}
            {player}
        </article>
    );
}
