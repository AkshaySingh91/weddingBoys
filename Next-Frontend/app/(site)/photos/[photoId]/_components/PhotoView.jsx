'use client';

/**
 * /photos/[id] — one frame, inside the wedding it came from.
 *
 *   The strip   every photograph of this wedding, in the order the day happened
 *               (haldi → … → reception), opening on the one chosen. Swipe (or
 *               ← / →, or the arrows) to walk through it; the address follows
 *               the frame without a page load, and the page takes the light of
 *               the ceremony you are in (the Scene Grade of the story page).
 *               Native scroll-snap: no gesture code, nothing per frame.
 *   The facts   who, which ceremony, where and when — only what is known; real
 *               tags as links into the gallery; who photographed it.
 *   Actions     Select (the red grease-pencil loop, as in the gallery), Share,
 *               Ask about a shoot like this.
 *   Their day   the wedding at a glance, ceremony by ceremony; and a door into
 *               their whole story, at this ceremony's chapter.
 *   More like this  a contact sheet of related frames from other weddings.
 *
 * Phones: the strip on top, everything else below. Desktop: the strip on the
 * left, the facts in a sticky column on the right.
 * Images: 1024/1600 webp for the frame (never the original), lazy beyond the
 * first; the blur placeholder doubles as the ambient ground. No blur filters.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { FiChevronLeft, FiChevronRight, FiShare2, FiCheck, FiPlus } from 'react-icons/fi';
import PhotoTile, { GreasePencil, aspectOf, altOf, flyToTray } from '@/Component/photos/PhotoTile.jsx';
import SelectsTray from '@/Component/photos/SelectsTray.jsx';
import GridEnd from '@/Component/photos/GridEnd.jsx';
import { useSelects } from '@/Component/photos/selects.js';
import { stillLadder } from '@/lib/films.js';
import { gradeOf, inkOn, GOLD } from '@/lib/grades.js';
import { FRAME_SIZES, chapterKey, riteOrder } from '@/lib/photos.js';
import { SITE_URL } from '@/lib/siteConfig.js';

const coupleOf = (c) => [c?.Bride, c?.Groom].filter(Boolean).join(' & ');
const rite = (c) => (c === 'Wedding / Pheras' ? 'Wedding' : c || '');
const gradeFor = (p) => (p?.eventGroup ? gradeOf({ label: rite(p.eventGroup) }) : GOLD);

export default function PhotoView({ data, recommended = [], studioPhone = null }) {
    const { selectedPhoto: chosen, remainingPhotos = [], clientName, wedding } = data;
    const couple = coupleOf(clientName);
    const selects = useSelects();

    // The wedding's frames in the order the day happened; the chosen one is where we open.
    const frames = useMemo(() => {
        const all = [chosen, ...remainingPhotos.filter((p) => p._id !== chosen._id)];
        return all.map((p, i) => ({ p, i })).sort((a, b) => riteOrder(a.p.eventGroup) - riteOrder(b.p.eventGroup) || a.i - b.i).map((x) => x.p);
    }, [chosen, remainingPhotos]);
    const start = Math.max(0, frames.findIndex((p) => p._id === chosen._id));
    const [active, setActive] = useState(start);
    const cur = frames[active] || chosen;
    const strip = useRef(null);

    // Open on the chosen frame (CSS scroll-initial-target does it where supported).
    useEffect(() => {
        const el = strip.current?.children[start];
        if (el && strip.current) strip.current.scrollLeft = el.offsetLeft;
    }, [start]);

    // Which frame is showing: one observer on the strip.
    useEffect(() => {
        const root = strip.current;
        if (!root) return undefined;
        const io = new IntersectionObserver((es) => {
            for (const e of es) if (e.isIntersecting) setActive(Number(e.target.dataset.i));
        }, { root, threshold: 0.6 });
        [...root.children].forEach((c) => io.observe(c));
        return () => io.disconnect();
    }, [frames]);

    // The address and the title follow the frame (no navigation, no fetch).
    useEffect(() => {
        if (!cur?._id || window.location.pathname === `/photos/${cur._id}`) return;
        window.history.replaceState(window.history.state, '', `/photos/${cur._id}`);
        document.title = `${altOf(cur)} | The Wedding Vachan`;
    }, [cur, couple]);

    const go = (i, { reveal = false } = {}) => {
        const root = strip.current;
        const el = root?.children[Math.max(0, Math.min(frames.length - 1, i))];
        if (!el) return;
        const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        root.scrollTo({ left: el.offsetLeft, behavior: still ? 'auto' : 'smooth' });
        if (reveal) root.scrollIntoView({ block: 'center', behavior: still ? 'auto' : 'smooth' });
    };
    // ← / → walk the wedding (not while typing).
    useEffect(() => {
        const onKey = (e) => {
            if (e.target.closest?.('input, textarea, [contenteditable], dialog')) return;
            if (e.key === 'ArrowRight') { e.preventDefault(); go(active + 1); }
            if (e.key === 'ArrowLeft') { e.preventDefault(); go(active - 1); }
        };
        document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
    });

    // The ceremonies in this wedding (for the light and "their day").
    const ceremonies = useMemo(() => {
        const out = [];
        frames.forEach((p, i) => {
            const label = p.eventGroup || 'More moments';
            let c = out.find((x) => x.label === label);
            if (!c) { c = { label, grade: gradeFor(p), items: [] }; out.push(c); }
            c.items.push({ p, i });
        });
        return out;
    }, [frames]);
    const activeCeremony = ceremonies.findIndex((c) => c.items.some((x) => x.i === active));

    const selected = selects.has(cur._id);
    const [fresh, setFresh] = useState(null);
    const select = () => {
        const a = aspectOf(cur);
        const added = selects.toggle({ id: cur._id, src: stillLadder(cur.url, { width: cur.width, cap: 640 })?.src || cur.url, a });
        setFresh(added ? cur._id : null);
        if (added) {
            if (navigator.vibrate) navigator.vibrate(8);
            flyToTray(strip.current?.children[active]?.querySelector('img'));
        }
    };
    const pageUrl = () => `${window.location.origin}/photos/${cur._id}`;
    const share = async () => {
        if (navigator.share) { try { await navigator.share({ title: couple ? `${couple}, ${rite(cur.eventGroup)}` : 'A wedding photograph', url: pageUrl() }); } catch { /* dismissed */ } return; }
        window.open(`https://wa.me/?text=${encodeURIComponent(pageUrl())}`, '_blank', 'noopener');
    };
    const ask = studioPhone
        ? `https://wa.me/${String(studioPhone).replace(/\D/g, '')}?text=${encodeURIComponent(`Hi, we'd love a shoot like this one: ${SITE_URL}/photos/${cur._id}`)}`
        : '/contact';

    const place = [cur.photoLocation?.venue, cur.photoLocation?.city].filter(Boolean).join(', ');
    const date = typeof cur.photoShootDate === 'string' && !/^\d{4}-\d{2}-\d{2}T/.test(cur.photoShootDate) ? cur.photoShootDate : null;
    const frameTags = (cur.tags || []).filter((t) => t && t !== cur.eventGroup && rite(t) !== rite(cur.eventGroup));
    const credits = (cur.credits?.length ? cur.credits : chosen.credits || []).filter((c) => c?.name);
    const storyHref = wedding?.href ? `${wedding.href}${cur.eventGroup ? `#chapter-${chapterKey(cur.eventGroup)}` : ''}` : null;
    const grade = gradeFor(cur);

    return (
        <article className="relative isolate pb-24">
            {/* the light of the ceremony in view */}
            <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10">
                {ceremonies.map((c, i) => (
                    <span key={c.label} style={{ '--grade': c.grade }}
                        className={`scene-grade absolute inset-0 transition-opacity duration-[900ms] ease-entrance motion-reduce:transition-none ${i === activeCeremony ? 'opacity-100' : 'opacity-0'}`} />
                ))}
            </div>

            <div className="mx-auto w-full max-w-wide lg:grid lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-10 lg:px-8 lg:pt-6">
                {/* The strip */}
                <div className="relative lg:sticky lg:top-[calc(var(--header-height)+12px)] lg:self-start">
                    <div ref={strip} className="pv-strip" role="region" aria-roledescription="carousel" aria-label={couple ? `${couple}'s wedding, ${frames.length} photographs` : 'Photographs from this wedding'}>
                        {frames.map((p, i) => {
                            const ladder = stillLadder(p.url, { width: p.width, cap: 1600 });
                            const a = aspectOf(p);
                            return (
                                <figure key={p._id} data-i={i} data-initial={i === start || undefined} aria-roledescription="slide" aria-label={`${i + 1} of ${frames.length}`}
                                    className="pv-slide" style={p.blurDataURL ? { '--echo': `url(${p.blurDataURL})` } : undefined}>
                                    <span className="pv-frame" style={{ '--a': a.toFixed(4) }}>
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img src={ladder?.src || p.url} srcSet={ladder?.srcSet} sizes={FRAME_SIZES} alt={altOf(p)}
                                            width={p.width || undefined} height={p.height || undefined}
                                            loading={i === start ? 'eager' : 'lazy'} fetchPriority={i === start ? 'high' : undefined} decoding="async" />
                                        {selects.has(p._id) && <GreasePencil id={p._id} a={a} fresh={fresh === p._id} />}
                                    </span>
                                    <figcaption aria-hidden="true" className="edge-print pv-edge">
                                        &#9656; {String(i + 1).padStart(2, '0')}<span>THE WEDDING VACHAN</span>{p.eventGroup ? <span>{rite(p.eventGroup).toUpperCase()}</span> : null}
                                    </figcaption>
                                </figure>
                            );
                        })}
                    </div>
                    {/* where you are in the wedding */}
                    {frames.length > 1 && (
                        <>
                            <div aria-hidden="true" className="relative mx-4 mt-2 h-[2px] overflow-hidden rounded-full bg-ink/10 lg:mx-0">
                                <span className="absolute inset-y-0 left-0 rounded-full transition-transform duration-200 ease-standard"
                                    style={{ width: `${100 / frames.length}%`, transform: `translateX(${active * 100}%)`, background: `rgb(${grade})` }} />
                            </div>
                            <p className="sr-only" aria-live="polite">{`Photograph ${active + 1} of ${frames.length}${cur.eventGroup ? `, ${rite(cur.eventGroup)}` : ''}`}</p>
                            <button type="button" onClick={() => go(active - 1)} disabled={active === 0} aria-label="Previous photograph"
                                className="absolute left-3 top-[calc(50%-12px)] hidden h-12 w-12 -translate-y-1/2 cursor-pointer place-items-center rounded-full bg-white/95 text-ink shadow-[0_8px_24px_-10px_rgba(0,0,0,0.5)] transition-opacity hover:bg-white focus-ring disabled:pointer-events-none disabled:opacity-0 lg:grid">
                                <FiChevronLeft aria-hidden="true" className="h-5 w-5" />
                            </button>
                            <button type="button" onClick={() => go(active + 1)} disabled={active === frames.length - 1} aria-label="Next photograph"
                                className="absolute right-3 top-[calc(50%-12px)] hidden h-12 w-12 -translate-y-1/2 cursor-pointer place-items-center rounded-full bg-white/95 text-ink shadow-[0_8px_24px_-10px_rgba(0,0,0,0.5)] transition-opacity hover:bg-white focus-ring disabled:pointer-events-none disabled:opacity-0 lg:grid">
                                <FiChevronRight aria-hidden="true" className="h-5 w-5" />
                            </button>
                        </>
                    )}
                </div>

                {/* The facts and actions */}
                <aside className="px-5 pt-5 lg:px-0 lg:pt-2">
                    <p className="text-[13px] font-semibold tabular-nums text-ink-muted">
                        <Link href="/photos" className="hover:text-ink">Photographs</Link>
                        {frames.length > 1 && <span className="ml-3">{active + 1} of {frames.length}</span>}
                    </p>
                    <h1 className="mt-2 font-display text-[34px] leading-[1.05] text-ink sm:text-[40px]">
                        {storyHref ? <Link href={storyHref} className="hover:text-accent-ink">{couple || wedding.title}</Link> : (couple || 'A wedding photograph')}
                    </h1>
                    <div className="mt-3 flex flex-wrap gap-2">
                        {cur.eventGroup && (
                            <Link href={`/photos?tag=${encodeURIComponent(cur.eventGroup)}`} prefetch={false}
                                className="flex h-9 items-center gap-2 rounded-full bg-ground-raised pl-3 pr-3.5 text-[13.5px] font-semibold text-ink ring-1 ring-ink/10 hover:ring-ink/25 focus-ring">
                                <span aria-hidden="true" className="h-2.5 w-2.5 rounded-full" style={{ background: `rgb(${grade})` }} />{rite(cur.eventGroup)}
                            </Link>
                        )}
                        {place && <span className="flex h-9 items-center rounded-full px-3 text-[13.5px] text-ink-secondary ring-1 ring-ink/10">{place}</span>}
                        {date && <span className="flex h-9 items-center rounded-full px-3 text-[13.5px] text-ink-secondary ring-1 ring-ink/10">{date}</span>}
                    </div>

                    <div className="mt-5 flex gap-2">
                        <button type="button" onClick={select} aria-pressed={selected}
                            className={`flex h-12 flex-1 cursor-pointer items-center justify-center gap-2 rounded-full text-[15px] font-semibold focus-ring motion-safe:active:scale-[0.97] ${selected ? 'bg-accent text-ink-onAccent' : 'bg-ink text-ground hover:bg-ink/90'}`}>
                            {selected ? <FiCheck aria-hidden="true" className="h-[18px] w-[18px]" /> : <FiPlus aria-hidden="true" className="h-[18px] w-[18px]" />}
                            {selected ? 'Selected' : 'Select'}
                        </button>
                        <button type="button" onClick={share} aria-label="Share this photograph"
                            className="grid h-12 w-12 shrink-0 cursor-pointer place-items-center rounded-full text-ink ring-1 ring-ink/15 hover:bg-ink/5 focus-ring">
                            <FiShare2 aria-hidden="true" className="h-[18px] w-[18px]" />
                        </button>
                    </div>
                    <a href={ask} target={studioPhone ? '_blank' : undefined} rel={studioPhone ? 'noopener noreferrer' : undefined}
                        className="mt-2 flex h-12 w-full items-center justify-center rounded-full text-[15px] font-semibold text-accent-ink ring-1 ring-accent/40 hover:bg-accent/5 focus-ring">
                        Ask about a shoot like this
                    </a>

                    {frameTags.length > 0 && (
                        <div className="mt-7">
                            <h2 className="text-[12px] font-semibold uppercase tracking-[0.16em] text-ink-muted">In this frame</h2>
                            <ul className="mt-3 flex flex-wrap gap-2">
                                {frameTags.map((t) => (
                                    <li key={t}>
                                        <Link href={`/photos?tag=${encodeURIComponent(t)}`} prefetch={false}
                                            className="flex h-9 items-center rounded-full bg-ink/[0.05] px-3.5 text-[13.5px] font-semibold text-ink hover:bg-ink/10 focus-ring">{t}</Link>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* The door into their whole story */}
                    {storyHref && (
                        <Link href={storyHref} style={{ '--grade': grade, '--jelly-ink': inkOn(grade) }}
                            className="jelly mt-8 flex min-h-[132px] flex-col justify-end rounded-[20px] p-5 focus-ring">
                            {cur.blurDataURL && <span className="jelly-echo" style={{ backgroundImage: `url(${cur.blurDataURL})` }} />}
                            <span className="jelly-wash" />
                            <span className="relative text-[13px] font-semibold opacity-85">See their whole wedding</span>
                            <span className="relative mt-1 font-display text-[30px] leading-none">{wedding.title || couple}</span>
                        </Link>
                    )}

                    {credits.length > 0 && (
                        <dl className="mt-8 space-y-2 text-[14px]">
                            <dt className="text-[12px] font-semibold uppercase tracking-[0.16em] text-ink-muted">Photographed by</dt>
                            {credits.map((c, i) => (
                                <dd key={`${c.name}-${i}`} className="text-ink">
                                    {c.name}{c.role ? <span className="text-ink-muted">, {c.role}</span> : null}
                                </dd>
                            ))}
                        </dl>
                    )}
                </aside>
            </div>

            {/* Their day: the whole wedding, ceremony by ceremony, large enough to look at */}
            {frames.length > 1 && (
                <section aria-labelledby="day-title" className="mx-auto mt-14 w-full max-w-wide px-4 sm:px-6 lg:px-8">
                    <h2 id="day-title" className="font-display text-[30px] leading-tight text-ink sm:text-[40px]">Their day</h2>
                    <p className="mt-2 text-[15px] text-ink-muted">{frames.length} frames from {couple ? `${couple}'s` : 'this'} wedding, in the order it happened.</p>
                    <ol className="mt-6 space-y-8">
                        {ceremonies.map((c) => (
                            <li key={c.label}>
                                <div className="flex flex-wrap items-baseline justify-between gap-3">
                                    <h3 className="flex items-center gap-2.5 text-[17px] font-semibold text-ink">
                                        <span aria-hidden="true" className="h-3 w-3 rounded-full" style={{ background: `rgb(${c.grade})` }} />
                                        {rite(c.label)}<span className="text-[14px] font-normal text-ink-muted">{c.items.length} frame{c.items.length === 1 ? '' : 's'}</span>
                                    </h3>
                                    {wedding?.href && c.label !== 'More moments' && (
                                        <Link href={`${wedding.href}#chapter-${chapterKey(c.label)}`} className="text-[14px] font-semibold text-accent-ink hover:text-accent">In their story</Link>
                                    )}
                                </div>
                                <ul className="pgrid pgrid-day mt-3">
                                    {c.items.map(({ p, i }) => {
                                        const on = i === active;
                                        return (
                                            <li key={p._id} className="ptile" style={{ '--a': aspectOf(p).toFixed(4), backgroundColor: `rgb(${c.grade} / 0.2)`, ...(p.blurDataURL ? { backgroundImage: `url(${p.blurDataURL})` } : null) }}>
                                                <button type="button" onClick={() => go(i, { reveal: true })} aria-current={on || undefined} aria-label={`Show frame ${i + 1}, ${altOf(p)}`}
                                                    className="block h-full w-full cursor-pointer focus-ring">
                                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                                    <img src={stillLadder(p.url, { width: p.width, cap: 640 })?.src || p.url} srcSet={stillLadder(p.url, { width: p.width, cap: 1024 })?.srcSet}
                                                        sizes="(max-width: 639px) 50vw, 300px" alt="" loading="lazy" decoding="async" className="block h-full w-full object-cover" />
                                                </button>
                                                {on && <span aria-hidden="true" className="pointer-events-none absolute inset-0 z-[2] rounded-[4px]" style={{ boxShadow: `inset 0 0 0 3px rgb(${c.grade})` }} />}
                                                {selects.has(p._id) && <GreasePencil id={p._id} a={aspectOf(p)} />}
                                                <span aria-hidden="true" className="edge-print pointer-events-none absolute bottom-1.5 left-2 z-[2] text-white/90 [text-shadow:0_1px_2px_rgb(0_0_0/0.6)]">&#9656; {String(i + 1).padStart(2, '0')}</span>
                                            </li>
                                        );
                                    })}
                                    <GridEnd grade={c.grade} />
                                </ul>
                            </li>
                        ))}
                    </ol>
                </section>
            )}

            {/* More like this */}
            {recommended.length > 0 && (
                <section aria-labelledby="more-title" className="mx-auto mt-14 w-full max-w-wide px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-wrap items-end justify-between gap-3">
                        <h2 id="more-title" className="font-display text-[30px] leading-tight text-ink sm:text-[40px]">More like this</h2>
                        {cur.eventGroup && (
                            <Link href={`/photos?tag=${encodeURIComponent(cur.eventGroup)}`} className="text-[14px] font-semibold text-accent-ink hover:text-accent">
                                Every {rite(cur.eventGroup).toLowerCase()} photograph
                            </Link>
                        )}
                    </div>
                    <ul className="pgrid mt-5">
                        {recommended.slice(0, 18).map((p, i) => (
                            <PhotoTile key={p._id} p={p} i={i + 8} tint={gradeFor(p)} selected={selects.has(p._id)} onSelect={selects.toggle} />
                        ))}
                        <GridEnd grade={grade}>
                            {cur.eventGroup ? (
                                <>
                                    <span className="font-display text-[28px] leading-none">More {rite(cur.eventGroup).toLowerCase()}</span>
                                    <Link href={`/photos?tag=${encodeURIComponent(cur.eventGroup)}`} className="w-max text-[14px] font-semibold underline-offset-4 hover:underline focus-ring">See every one</Link>
                                </>
                            ) : (
                                <Link href="/photos" className="font-display text-[28px] leading-none focus-ring">Every photograph</Link>
                            )}
                        </GridEnd>
                    </ul>
                </section>
            )}

            <SelectsTray studioPhone={studioPhone} />
        </article>
    );
}
