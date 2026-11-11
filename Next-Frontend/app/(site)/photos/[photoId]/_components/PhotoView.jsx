'use client';

/**
 * /photos/[id] — "The Proof Table".
 *
 * The studio's table, with this wedding's prints laid out on it in the order the
 * day happened. The same warm light-table world as Your selects and the lookbook.
 *
 *   The prints   every frame of the wedding as a print (white border, soft
 *                shadow) on the warm table; the neighbours peek in at the
 *                edges, a little smaller and tilted, and the one in front
 *                settles straight. Swipe, ← / → or the arrows; the address
 *                follows the frame with no page load; the page takes the light
 *                of the ceremony you are in (the story page's Scene Grade).
 *   The names    the ceremonies of the day glide under the print — the one
 *                you are in sits centred, underlined in its colour; tap one to
 *                go to its first frame.
 *   Their day    each ceremony is a pile of prints in its own light. Open one
 *                and its frames are dealt onto the table — they fly from the
 *                pile into a justified spread that closes at every width. The
 *                open pile follows the print in front.
 *   More like this  the same ceremony at other weddings, a justified sheet.
 *
 * Motion: one Web Animations "deal" per pile change (on screen only, ≤ 12
 * prints), transitions on the neighbours when the print in front changes —
 * nothing runs while idle, no blur, no running animation. Reduced motion:
 * the deal fades.
 */
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { FiChevronLeft, FiChevronRight, FiShare2, FiCheck, FiPlus } from 'react-icons/fi';
import PhotoTile, { GreasePencil, aspectOf, altOf, flyToTray } from '@/Component/photos/PhotoTile.jsx';
import SelectsTray from '@/Component/photos/SelectsTray.jsx';
import { useSelects } from '@/Component/photos/selects.js';
import { stillLadder } from '@/lib/films.js';
import { gradeOf, GOLD } from '@/lib/grades.js';
import { FRAME_SIZES, chapterKey, riteOrder } from '@/lib/photos.js';
import { justify, tileSizes } from '@/lib/justify.js';
import { SITE_URL } from '@/lib/siteConfig.js';

const coupleOf = (c) => [c?.Bride, c?.Groom].filter(Boolean).join(' & ');
const rite = (c) => (c === 'Wedding / Pheras' ? 'Wedding' : c || '');
const gradeFor = (p) => (p?.eventGroup ? gradeOf({ label: rite(p.eventGroup) }) : GOLD);
const TILTS = [-1.6, 1.2, -0.8, 1.7, -1.3, 0.9];
const PILE = [[-6, -10, 2], [5, 8, -1], [-1, 0, 0]]; // [rotate°, x px, y px] for the three top prints
const still = () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

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
    const names = useRef(null);
    const spread = useRef(null);
    const pileRefs = useRef([]);

    const centre = (root, el) => el.offsetLeft - (root.clientWidth - el.clientWidth) / 2;

    // Open on the chosen print (CSS scroll-initial-target does it where supported).
    useLayoutEffect(() => {
        const root = strip.current;
        const el = root?.children[start];
        if (el) root.scrollLeft = centre(root, el);
    }, [start]);

    // Which print is in front: one observer on the strip.
    useEffect(() => {
        const root = strip.current;
        if (!root) return undefined;
        const io = new IntersectionObserver((es) => {
            for (const e of es) if (e.isIntersecting) setActive(Number(e.target.dataset.i));
        }, { root, threshold: 0.7 });
        [...root.children].forEach((c) => io.observe(c));
        return () => io.disconnect();
    }, [frames]);

    // The address and the title follow the print (no navigation, no fetch).
    useEffect(() => {
        if (!cur?._id || window.location.pathname === `/photos/${cur._id}`) return;
        window.history.replaceState(window.history.state, '', `/photos/${cur._id}`);
        document.title = `${altOf(cur)} | The Wedding Vachan`;
    }, [cur]);

    const go = (i, { reveal = false } = {}) => {
        const root = strip.current;
        const el = root?.children[Math.max(0, Math.min(frames.length - 1, i))];
        if (!el) return;
        root.scrollTo({ left: centre(root, el), behavior: still() ? 'auto' : 'smooth' });
        if (reveal) root.scrollIntoView({ block: 'center', behavior: still() ? 'auto' : 'smooth' });
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

    // The ceremonies of the day.
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
    const activeCeremony = Math.max(0, ceremonies.findIndex((c) => c.items.some((x) => x.i === active)));
    const posInCeremony = (ceremonies[activeCeremony]?.items.findIndex((x) => x.i === active) ?? 0) + 1;

    // The names glide: the ceremony you are in, centred.
    useEffect(() => {
        const ol = names.current;
        const btn = ol?.children[activeCeremony];
        if (btn) ol.scrollTo({ left: centre(ol, btn), behavior: still() ? 'auto' : 'smooth' });
    }, [activeCeremony]);

    // The open pile: the ceremony in front, unless one was opened by hand (until the print moves on).
    const [pinned, setPinned] = useState(null);
    const open = pinned && pinned.at === activeCeremony ? pinned.ci : activeCeremony;
    const openC = ceremonies[open] || ceremonies[0];
    const spreadLayout = useMemo(() => justify(openC.items.map(({ p }) => aspectOf(p))), [openC]);
    const dealt = useRef(false);
    // The deal: prints fly from the pile to their places (only when on screen).
    useLayoutEffect(() => {
        if (!dealt.current) { dealt.current = true; return; }
        const ul = spread.current; const pile = pileRefs.current[open];
        if (!ul || !pile) return;
        const box = ul.getBoundingClientRect();
        if (box.bottom < 0 || box.top > window.innerHeight) return;
        const from = pile.getBoundingClientRect();
        const fx = from.left + from.width / 2; const fy = from.top + from.height / 2;
        [...ul.children].forEach((li, n) => {
            if (still() || n > 11) { li.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 220, delay: still() ? 0 : 300 }); return; }
            const r = li.getBoundingClientRect();
            const s = Math.min(0.4, 96 / r.width);
            li.animate([
                { transform: `translate(${fx - (r.left + r.width / 2)}px, ${fy - (r.top + r.height / 2)}px) scale(${s}) rotate(${n % 2 ? 5 : -5}deg)`, opacity: 0.5 },
                { transform: 'none', opacity: 1 },
            ], { duration: 560, delay: n * 40, easing: 'cubic-bezier(0.16, 1, 0.3, 1)', fill: 'backwards' });
        });
    }, [open]);

    const selected = selects.has(cur._id);
    const [fresh, setFresh] = useState(null);
    const select = () => {
        const added = selects.toggle({ id: cur._id, src: stillLadder(cur.url, { width: cur.width, cap: 640 })?.src || cur.url, a: aspectOf(cur) });
        setFresh(added ? cur._id : null);
        if (added) {
            if (navigator.vibrate) navigator.vibrate(8);
            flyToTray(strip.current?.children[active]?.querySelector('img'));
        }
    };
    const share = async () => {
        const url = `${window.location.origin}/photos/${cur._id}`;
        if (navigator.share) { try { await navigator.share({ title: altOf(cur), url }); } catch { /* dismissed */ } return; }
        window.open(`https://wa.me/?text=${encodeURIComponent(url)}`, '_blank', 'noopener');
    };
    const ask = studioPhone
        ? `https://wa.me/${String(studioPhone).replace(/\D/g, '')}?text=${encodeURIComponent(`Hi, we'd love a shoot like this one: ${SITE_URL}/photos/${cur._id}`)}`
        : '/contact?from=photo';

    const place = [cur.photoLocation?.venue, cur.photoLocation?.city].filter(Boolean).join(', ');
    const date = typeof cur.photoShootDate === 'string' && !/^\d{4}-\d{2}-\d{2}T/.test(cur.photoShootDate) ? cur.photoShootDate : null;
    const frameTags = (cur.tags || []).filter((t) => t && t !== cur.eventGroup && rite(t) !== rite(cur.eventGroup));
    const credits = (cur.credits?.length ? cur.credits : chosen.credits || []).filter((c) => c?.name);
    const storyHref = wedding?.href ? `${wedding.href}${cur.eventGroup ? `#chapter-${chapterKey(cur.eventGroup)}` : ''}` : null;
    const grade = gradeFor(cur);
    const recs = useMemo(() => recommended.slice(0, 18), [recommended]);
    const recLayout = useMemo(() => justify(recs.map(aspectOf)), [recs]);

    return (
        <article className="relative isolate pb-24">
            {/* the light of the ceremony in front */}
            <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10">
                {ceremonies.map((c, i) => (
                    <span key={c.label} style={{ '--grade': c.grade }}
                        className={`scene-grade absolute inset-0 transition-opacity duration-[900ms] ease-entrance motion-reduce:transition-none ${i === activeCeremony ? 'opacity-100' : 'opacity-0'}`} />
                ))}
            </div>

            <div className="mx-auto w-full max-w-wide lg:grid lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-10 lg:px-8 lg:pt-6">
                {/* The prints */}
                <div className="relative pt-3 lg:sticky lg:top-[calc(var(--header-height)+8px)] lg:self-start lg:pt-0">
                    <div ref={strip} className="pv-strip" role="region" aria-roledescription="carousel"
                        style={{ '--first': aspectOf(frames[0]).toFixed(4), '--last': aspectOf(frames[frames.length - 1]).toFixed(4) }}
                        aria-label={couple ? `${couple}'s wedding, ${frames.length} photographs` : 'Photographs from this wedding'}>
                        {frames.map((p, i) => {
                            const ladder = stillLadder(p.url, { width: p.width, cap: 1600 });
                            const a = aspectOf(p);
                            const near = Math.abs(i - active);
                            return (
                                <figure key={p._id} data-i={i} data-initial={i === start || undefined} aria-roledescription="slide" aria-label={`${i + 1} of ${frames.length}`}
                                    className="pv-slide" data-front={near === 0 || undefined} style={{ '--a': a.toFixed(4), '--tilt': `${TILTS[i % TILTS.length]}deg` }}>
                                    <span className="pv-print" style={{ '--a': a.toFixed(4) }}>
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img src={ladder?.src || p.url} srcSet={ladder?.srcSet} sizes={FRAME_SIZES} alt={altOf(p)}
                                            width={p.width || undefined} height={p.height || undefined}
                                            loading={near <= 1 ? 'eager' : 'lazy'} fetchPriority={i === start ? 'high' : undefined} decoding="async"
                                            style={p.blurDataURL ? { backgroundImage: `url(${p.blurDataURL})`, backgroundSize: 'cover' } : undefined} />
                                        {selects.has(p._id) && <GreasePencil id={p._id} a={a} fresh={fresh === p._id} />}
                                    </span>
                                </figure>
                            );
                        })}
                    </div>
                    {frames.length > 1 && (
                        <>
                            <button type="button" onClick={() => go(active - 1)} disabled={active === 0} aria-label="Previous photograph"
                                className="absolute left-3 top-[calc(50%-36px)] hidden h-12 w-12 -translate-y-1/2 cursor-pointer place-items-center rounded-full bg-white text-ink shadow-[0_8px_24px_-10px_rgba(51,22,26,0.5)] transition-opacity hover:bg-ground focus-ring disabled:pointer-events-none disabled:opacity-0 lg:grid">
                                <FiChevronLeft aria-hidden="true" className="h-5 w-5" />
                            </button>
                            <button type="button" onClick={() => go(active + 1)} disabled={active === frames.length - 1} aria-label="Next photograph"
                                className="absolute right-3 top-[calc(50%-36px)] hidden h-12 w-12 -translate-y-1/2 cursor-pointer place-items-center rounded-full bg-white text-ink shadow-[0_8px_24px_-10px_rgba(51,22,26,0.5)] transition-opacity hover:bg-ground focus-ring disabled:pointer-events-none disabled:opacity-0 lg:grid">
                                <FiChevronRight aria-hidden="true" className="h-5 w-5" />
                            </button>
                            {/* The names glide: the ceremony you are in, centred */}
                            <nav aria-label="Ceremonies in this wedding" className="mt-2">
                                {ceremonies.length > 1 && (
                                    <ol ref={names} className="pv-names">
                                        {ceremonies.map((c, ci) => (
                                            <li key={c.label}>
                                                <button type="button" onClick={() => go(c.items[0].i)} aria-current={ci === activeCeremony || undefined}
                                                    style={{ '--grade': c.grade }} className="pv-name font-display focus-ring">
                                                    {rite(c.label)}
                                                </button>
                                            </li>
                                        ))}
                                    </ol>
                                )}
                                <p aria-live="polite" className="text-center text-[13px] tabular-nums text-ink-muted">
                                    {ceremonies.length > 1 ? `${posInCeremony} of ${ceremonies[activeCeremony].items.length}` : `${active + 1} of ${frames.length}`}
                                </p>
                            </nav>
                        </>
                    )}
                </div>

                {/* The facts and actions */}
                <aside className="px-5 pt-6 lg:px-0 lg:pt-2">
                    <p className="text-[13px] font-semibold text-ink-muted"><Link href="/photos" className="hover:text-ink">Photographs</Link></p>
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

                    {storyHref && (
                        <Link href={storyHref} className="group mt-8 flex items-center gap-4 rounded-[18px] bg-ground-raised p-3 pr-5 ring-1 ring-ink/[0.07] hover:ring-ink/20 focus-ring">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={stillLadder(frames[0].url, { width: frames[0].width, cap: 640 })?.src || frames[0].url} alt="" loading="lazy"
                                className="h-16 w-14 shrink-0 rounded-[3px] object-cover shadow-[0_6px_14px_-8px_rgba(51,22,26,0.5)] ring-4 ring-white" style={{ transform: 'rotate(-3deg)' }} />
                            <span className="min-w-0">
                                <span className="block text-[13px] text-ink-muted">See their whole wedding</span>
                                <span className="block truncate font-display text-[28px] leading-tight text-ink">{wedding.title || couple}</span>
                            </span>
                        </Link>
                    )}

                    {credits.length > 0 && (
                        <dl className="mt-8 space-y-2 text-[14px]">
                            <dt className="text-[12px] font-semibold uppercase tracking-[0.16em] text-ink-muted">Photographed by</dt>
                            {credits.map((c, i) => (
                                <dd key={`${c.name}-${i}`} className="text-ink">{c.name}{c.role ? <span className="text-ink-muted">, {c.role}</span> : null}</dd>
                            ))}
                        </dl>
                    )}
                </aside>
            </div>

            {/* Their day: each ceremony a pile on the table; open one to deal its prints */}
            {frames.length > 1 && (
                <section aria-labelledby="day-title" className="mx-auto mt-16 w-full max-w-wide px-4 sm:px-6 lg:px-8">
                    <h2 id="day-title" className="font-display text-[30px] leading-tight text-ink sm:text-[40px]">Their day</h2>
                    <p className="mt-2 text-[15px] text-ink-muted">{frames.length} frames from {couple ? `${couple}'s` : 'this'} wedding, in the order it happened.</p>
                    <ul className="pv-piles" aria-label="Ceremonies">
                        {ceremonies.map((c, ci) => (
                            <li key={c.label}>
                                <button type="button" ref={(el) => { pileRefs.current[ci] = el; }} aria-pressed={ci === open} aria-controls="pv-spread"
                                    onClick={() => setPinned({ ci, at: activeCeremony })} style={{ '--grade': c.grade }} className="pv-pile focus-ring">
                                    <span aria-hidden="true" className="pv-pile-stack">
                                        {c.items.slice(0, 3).reverse().map(({ p }, k, arr) => {
                                            const [r, x, y] = PILE[3 - arr.length + k];
                                            return (
                                                // eslint-disable-next-line @next/next/no-img-element
                                                <img key={p._id} src={stillLadder(p.url, { width: p.width, cap: 640 })?.src || p.url} alt="" loading="lazy" decoding="async"
                                                    style={{ transform: `translate(${x}px, ${y}px) rotate(${r}deg)` }} />
                                            );
                                        })}
                                    </span>
                                    <span className="pv-pile-name font-display">{rite(c.label)}</span>
                                    <span className="block text-[13px] text-ink-muted">{c.items.length} frame{c.items.length === 1 ? '' : 's'}</span>
                                </button>
                            </li>
                        ))}
                    </ul>

                    <div className="mt-8 flex flex-wrap items-baseline justify-between gap-3">
                        <h3 className="flex items-center gap-2.5 font-display text-[28px] leading-tight text-ink">
                            <span aria-hidden="true" className="h-3 w-3 rounded-full" style={{ background: `rgb(${openC.grade})` }} />{rite(openC.label)}
                        </h3>
                        {wedding?.href && openC.label !== 'More moments' && (
                            <Link href={`${wedding.href}#chapter-${chapterKey(openC.label)}`} className="text-[14px] font-semibold text-accent-ink hover:text-accent">In their story</Link>
                        )}
                    </div>
                    <div className="jwrap mt-4">
                        <ul id="pv-spread" ref={spread} className="jgrid" aria-label={`${rite(openC.label)} photographs`}>
                            {openC.items.map(({ p, i }, n) => {
                                const on = i === active;
                                const ladder = stillLadder(p.url, { width: p.width, cap: 1024 });
                                return (
                                    <li key={p._id} className="ptile jt" style={{ ...spreadLayout[n], backgroundColor: `rgb(${openC.grade} / 0.2)`, ...(p.blurDataURL ? { backgroundImage: `url(${p.blurDataURL})` } : null) }}>
                                        <button type="button" onClick={() => go(i, { reveal: true })} aria-current={on || undefined} aria-label={`Show ${altOf(p)}`}
                                            className="block h-full w-full cursor-pointer focus-ring">
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            <img src={ladder?.src || p.url} srcSet={ladder?.srcSet} sizes={tileSizes(spreadLayout[n])} alt="" loading="lazy" decoding="async"
                                                className="block h-full w-full object-cover" />
                                        </button>
                                        {on && <span aria-hidden="true" className="pointer-events-none absolute inset-0 z-[2] rounded-[4px]" style={{ boxShadow: `inset 0 0 0 3px rgb(${openC.grade})` }} />}
                                        {selects.has(p._id) && <GreasePencil id={p._id} a={aspectOf(p)} />}
                                    </li>
                                );
                            })}
                        </ul>
                    </div>
                </section>
            )}

            {/* More like this */}
            {recs.length > 0 && (
                <section aria-labelledby="more-title" className="mx-auto mt-16 w-full max-w-wide px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-wrap items-end justify-between gap-3">
                        <h2 id="more-title" className="font-display text-[30px] leading-tight text-ink sm:text-[40px]">
                            {cur.eventGroup ? `${rite(cur.eventGroup)}, at other weddings` : 'More like this'}
                        </h2>
                        {cur.eventGroup && (
                            <Link href={`/photos?tag=${encodeURIComponent(cur.eventGroup)}`} className="text-[14px] font-semibold text-accent-ink hover:text-accent">
                                Every {rite(cur.eventGroup).toLowerCase()} photograph
                            </Link>
                        )}
                    </div>
                    <div className="jwrap mt-5">
                        <ul className="jgrid">
                            {recs.map((p, i) => (
                                <PhotoTile key={p._id} p={p} i={i + 8} tint={gradeFor(p)} layout={recLayout[i]} selected={selects.has(p._id)} onSelect={selects.toggle} />
                            ))}
                        </ul>
                    </div>
                </section>
            )}

            <SelectsTray studioPhone={studioPhone} />
        </article>
    );
}
