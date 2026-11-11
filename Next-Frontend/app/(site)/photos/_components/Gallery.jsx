'use client';

/**
 * /photos — a contact sheet of real weddings, built to be browsed for ideas
 * (poses, outfits, places, rituals) and to work on a budget phone on 3G.
 *
 *   - page 1 arrives in the server HTML: real links, real <img srcset> (640/1024
 *     webp, never the original), sized boxes — the gallery shows before any JS
 *   - ONE grid for every screen: justified rows in pure CSS (each frame
 *     flex-grows by its aspect, so a row shares one height and fills the width:
 *     no holes, no crop). Phones get portrait pairs and full-width landscapes.
 *   - lenses: the ceremonies first (each in its own colour — choosing one bathes
 *     the page in that ceremony's light, as on the wedding story), then Refine:
 *     setting, style, rituals, tradition — only tags that have photographs
 *   - search runs on the server (couples, ceremonies, tags), not on what loaded
 *   - more frames load before you reach the end; on Data Saver / 2G it waits
 *     for a tap and uses smaller images. A failed page offers a retry and
 *     resumes when the connection returns. A real "Load more" link is always
 *     in the HTML for crawlers and no-JS.
 *   - Select: circle a frame (see PhotoTile) — "Your selects" collects them.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { FiSearch, FiSliders, FiX } from 'react-icons/fi';
import PhotoTile from '@/Component/photos/PhotoTile.jsx';
import SelectsTray from '@/Component/photos/SelectsTray.jsx';
import GridEnd from '@/Component/photos/GridEnd.jsx';
import { useSelects } from '@/Component/photos/selects.js';
import useNetworkStatus from '@/Hooks/useNetworkStatus.jsx';
import { gradeOf, GOLD } from '@/lib/grades.js';
import { queryOf } from '@/lib/photos.js';

const api = () => (typeof window !== 'undefined' && window.location.hostname !== 'localhost' ? '' : (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'));
const rite = (c) => (c === 'Wedding / Pheras' ? 'Wedding' : c);

/** Refine lenses: taxonomy groups gathered under names a couple would use. */
const LENSES = [
    { key: 'setting', label: 'Setting', groups: ['event-type', 'pre-wedding-themes', 'region'] },
    { key: 'style', label: 'Style', groups: ['category', 'wedding-themes'] },
    { key: 'ritual', label: 'Rituals', groups: ['ceremony-details'] },
    { key: 'tradition', label: 'Tradition', groups: ['tradition'] },
];
const MIN = 3; // a value needs this many photographs to be offered

export default function Gallery({ initial, facets, initialTags = [], initialQuery = '', sort = null, pageSize = 24, studioPhone = null }) {
    const { tier, online } = useNetworkStatus();
    const selects = useSelects();
    const [items, setItems] = useState(initial?.photos || []);
    const [page, setPage] = useState(initial?.page || 1);
    const [total, setTotal] = useState(initial?.total || 0);
    const [hasMore, setHasMore] = useState(Boolean(initial?.hasMore));
    const [tags, setTags] = useState(initialTags);
    const [q, setQ] = useState(initialQuery);
    const [busy, setBusy] = useState(false);       // replacing results (filters)
    const [more, setMore] = useState(false);       // appending a page
    const [failed, setFailed] = useState(false);
    const [refine, setRefine] = useState(false);
    const [round, setRound] = useState(0);         // bumps when results are replaced (fade)
    const ctrl = useRef(null);
    const first = useRef(true);
    const sentinel = useRef(null);

    // Facets → the ceremony row and the refine lenses (only values with photos).
    const ceremonyGroup = facets?.groups?.find((g) => g.key === 'ceremony');
    const ceremonies = useMemo(() => (ceremonyGroup?.tags || []).filter((t) => t.count >= MIN), [ceremonyGroup]);
    const ceremonyLabels = useMemo(() => new Set(ceremonies.map((t) => t.label.toLowerCase()).concat(ceremonies.map((t) => rite(t.label).toLowerCase()))), [ceremonies]);
    const lenses = useMemo(() => LENSES.map((l) => ({
        ...l,
        tags: (facets?.groups || []).filter((g) => l.groups.includes(g.key)).flatMap((g) => g.tags)
            .filter((t) => t.count >= MIN && !ceremonyLabels.has(t.label.toLowerCase()))
            .filter((t, i, all) => all.findIndex((x) => x.label === t.label) === i),
    })).filter((l) => l.tags.length), [facets, ceremonyLabels]);

    const ceremony = ceremonies.find((c) => tags.includes(c.label)) || null;
    const grade = ceremony ? gradeOf({ label: rite(ceremony.label), color: ceremony.color }) : null;
    const refined = tags.filter((t) => t !== ceremony?.label);

    const load = useCallback(async ({ nextPage, replace, withTags, withQ }) => {
        ctrl.current?.abort();
        const c = new AbortController();
        ctrl.current = c;
        replace ? setBusy(true) : setMore(true);
        setFailed(false);
        try {
            const res = await fetch(`${api()}/api/photos?${queryOf({ tags: withTags, q: withQ, page: nextPage, limit: pageSize, sort })}`, { signal: c.signal });
            if (!res.ok) throw new Error(String(res.status));
            const data = await res.json();
            setItems((cur) => {
                if (replace) return data.photos || [];
                const seen = new Set(cur.map((x) => x._id));
                return cur.concat((data.photos || []).filter((x) => !seen.has(x._id)));
            });
            setPage(nextPage);
            setTotal(data.total ?? 0);
            setHasMore(Boolean(data.hasMore));
            if (replace) setRound((r) => r + 1);
        } catch (e) {
            if (e.name !== 'AbortError') setFailed(true);
        } finally {
            if (ctrl.current === c) { setBusy(false); setMore(false); }
        }
    }, [pageSize, sort]);

    // Filters and search replace the results (search waits for a pause in typing).
    useEffect(() => {
        if (first.current) { first.current = false; return undefined; }
        const t = setTimeout(() => load({ nextPage: 1, replace: true, withTags: tags, withQ: q }), q ? 320 : 0);
        const u = new URL(window.location.href);
        if (tags.length) u.searchParams.set('tag', tags.join(',')); else u.searchParams.delete('tag');
        if (q.trim()) u.searchParams.set('q', q.trim()); else u.searchParams.delete('q');
        u.searchParams.delete('page');
        window.history.replaceState(window.history.state, '', `${u.pathname}${u.search}`);
        return () => clearTimeout(t);
    }, [tags, q, load]);

    // The next page loads before the end is reached (not on Data Saver / 2G).
    const loadMore = useCallback(() => {
        if (busy || more || !hasMore) return;
        load({ nextPage: page + 1, replace: false, withTags: tags, withQ: q });
    }, [busy, more, hasMore, page, tags, q, load]);
    useEffect(() => {
        const el = sentinel.current;
        if (!el || tier === 'low' || failed || !hasMore) return undefined;
        const io = new IntersectionObserver((es) => { if (es[0].isIntersecting) loadMore(); }, { rootMargin: tier === 'medium' ? '700px 0px' : '1400px 0px' });
        io.observe(el);
        return () => io.disconnect();
    }, [tier, failed, hasMore, loadMore]);
    // Back online after a failure: try again.
    useEffect(() => {
        if (!failed) return undefined;
        window.addEventListener('online', loadMore);
        return () => window.removeEventListener('online', loadMore);
    }, [failed, loadMore]);

    const toggle = (label, single = false) => setTags((cur) => {
        if (cur.includes(label)) return cur.filter((t) => t !== label);
        if (single) return [label, ...cur.filter((t) => !ceremonies.some((c) => c.label === t))];
        return [...cur, label];
    });
    const cap = tier === 'low' ? 640 : 1024;
    const nextHref = `/photos?${queryOf({ tags, q, page: page + 1, limit: pageSize })}`.replace(/&limit=\d+/, '');

    return (
        <div className="relative isolate">
            {/* the chosen ceremony's light */}
            <span aria-hidden="true" style={{ '--grade': grade || GOLD }}
                className={`scene-grade pointer-events-none fixed inset-0 -z-10 transition-opacity duration-[900ms] ease-entrance motion-reduce:transition-none ${grade ? 'opacity-100' : 'opacity-0'}`} />

            <header className="mx-auto w-full max-w-wide px-4 pt-8 sm:px-6 lg:px-8 lg:pt-12">
                <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-5">
                    <div className="max-w-2xl">
                        <h1 className="font-display text-[44px] leading-[0.95] text-ink sm:text-[64px]">Photographs</h1>
                        <p className="mt-3 text-[16px] leading-relaxed text-ink-secondary sm:text-[17px]">
                            {facets?.total ? `${facets.total} frames from real weddings. ` : ''}Find a pose, an outfit, a place for your own day, and circle the ones you love.
                        </p>
                    </div>
                    <label className="relative w-full sm:w-[340px]">
                        <span className="sr-only">Search photographs</span>
                        <FiSearch aria-hidden="true" className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
                        <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="A couple, Haldi, beach…" enterKeyHint="search"
                            className="h-12 w-full rounded-full bg-ground-raised pl-11 pr-4 text-[16px] text-ink ring-1 ring-ink/10 placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-accent/50" />
                    </label>
                </div>
            </header>

            {/* Lenses: sticky, solid (no blur) */}
            <nav aria-label="Filter photographs" className="sticky top-[var(--header-height)] z-20 mt-6 bg-ground/95">
                <div className="mx-auto flex w-full max-w-wide items-center gap-2 px-4 py-2.5 sm:px-6 lg:px-8">
                    <ul className="-my-1 flex min-w-0 flex-1 gap-2 overflow-x-auto py-1 scrollbar-none">
                        <li>
                            <button type="button" aria-pressed={!ceremony} onClick={() => setTags(refined)}
                                className={`h-10 shrink-0 cursor-pointer whitespace-nowrap rounded-full px-4 text-[14px] font-semibold focus-ring ${!ceremony ? 'bg-ink text-ground' : 'bg-ground-raised text-ink-secondary ring-1 ring-ink/10 hover:text-ink'}`}>
                                All
                            </button>
                        </li>
                        {ceremonies.map((c) => {
                            const on = ceremony?.label === c.label;
                            const g = gradeOf({ label: rite(c.label), color: c.color });
                            return (
                                <li key={c.label}>
                                    <button type="button" aria-pressed={on} onClick={() => toggle(c.label, true)}
                                        style={on ? { background: `rgb(${g})`, color: '#fff' } : undefined}
                                        className={`flex h-10 shrink-0 cursor-pointer items-center gap-2 whitespace-nowrap rounded-full pl-3 pr-4 text-[14px] font-semibold transition-colors duration-ui focus-ring ${on ? '' : 'bg-ground-raised text-ink-secondary ring-1 ring-ink/10 hover:text-ink'}`}>
                                        <span aria-hidden="true" className="h-2.5 w-2.5 rounded-full" style={{ background: on ? '#fff' : `rgb(${g})` }} />
                                        {rite(c.label)}
                                        <span className={`text-[12px] font-medium tabular-nums ${on ? 'text-white/80' : 'text-ink-muted'}`}>{c.count}</span>
                                    </button>
                                </li>
                            );
                        })}
                    </ul>
                    {lenses.length > 0 && (
                        <button type="button" onClick={() => setRefine(true)} aria-haspopup="dialog" aria-label={refined.length ? `Refine, ${refined.length} ticked` : 'Refine'}
                            className="flex h-10 shrink-0 cursor-pointer items-center gap-2 rounded-full bg-ground-raised px-4 text-[14px] font-semibold text-ink ring-1 ring-ink/15 hover:ring-ink/30 focus-ring">
                            <FiSliders aria-hidden="true" className="h-4 w-4" />
                            <span className="hidden sm:inline">Refine</span>
                            {refined.length > 0 && <span className="grid h-5 min-w-5 place-items-center rounded-full bg-accent px-1.5 text-[11px] text-ink-onAccent">{refined.length}</span>}
                        </button>
                    )}
                </div>
            </nav>

            <section aria-labelledby="results-line" className="mx-auto w-full max-w-wide px-4 pb-24 pt-3 sm:px-6 lg:px-8">
                <div className="flex min-h-11 flex-wrap items-center gap-2">
                    <p id="results-line" aria-live="polite" className="mr-2 text-[14px] text-ink-muted">
                        <span className="font-semibold tabular-nums text-ink">{total}</span> photograph{total === 1 ? '' : 's'}
                        {q.trim() ? <> matching &ldquo;{q.trim()}&rdquo;</> : null}
                    </p>
                    {refined.map((t) => (
                        <button key={t} type="button" onClick={() => toggle(t)} aria-label={`Remove ${t}`}
                            className="flex h-9 cursor-pointer items-center gap-1.5 rounded-full bg-ink/[0.06] pl-3 pr-2 text-[13px] font-semibold text-ink hover:bg-ink/10 focus-ring">
                            {t}<FiX aria-hidden="true" className="h-3.5 w-3.5" />
                        </button>
                    ))}
                </div>

                {items.length ? (
                    <ul key={round} className={`pgrid mt-2 transition-opacity duration-200 ${round ? 'pgrid-fresh' : ''} ${busy ? 'opacity-40' : 'opacity-100'}`}>
                        {items.map((p, i) => (
                            <PhotoTile key={p._id} p={p} i={i} priority={i === 0} cap={i < pageSize ? 1024 : cap}
                                tint={p.eventGroup ? gradeOf({ label: rite(p.eventGroup) }) : GOLD}
                                selected={selects.has(p._id)} onSelect={selects.toggle} />
                        ))}
                        <GridEnd grade={grade || GOLD}>
                            {hasMore ? (
                                <>
                                    <span className="font-display text-[28px] leading-none">Keep going</span>
                                    <button type="button" onClick={loadMore} className="w-max cursor-pointer text-[14px] font-semibold underline-offset-4 hover:underline focus-ring">
                                        {more ? 'Loading…' : `${Math.max(0, total - items.length)} more frames`}
                                    </button>
                                </>
                            ) : (
                                <>
                                    <span className="font-display text-[28px] leading-none">Every frame, seen.</span>
                                    <Link href="/films" className="w-max text-[14px] font-semibold underline-offset-4 hover:underline focus-ring">Watch the films</Link>
                                </>
                            )}
                        </GridEnd>
                    </ul>
                ) : (
                    <div className="mt-4 grid min-h-[260px] place-content-center rounded-[20px] bg-ground-sunk/60 px-6 text-center">
                        <p className="text-[16px] font-semibold text-ink">{busy ? 'Looking…' : 'No photographs match these filters.'}</p>
                        {!busy && (tags.length > 0 || q) && (
                            <button type="button" onClick={() => { setTags([]); setQ(''); }} className="mx-auto mt-4 h-11 cursor-pointer rounded-full bg-ink px-5 text-[14px] font-semibold text-ground focus-ring">Show every photograph</button>
                        )}
                    </div>
                )}

                {/* the end of the sheet: auto-load sentinel, a real link, retry, or the end */}
                <div ref={sentinel} className="mt-8 flex min-h-12 flex-col items-center gap-3 text-center">
                    {failed ? (
                        <>
                            <p className="text-[14px] text-ink-secondary">{online ? 'The next photographs did not load.' : 'You are offline. The photographs above stay here.'}</p>
                            <button type="button" onClick={loadMore} className="h-11 cursor-pointer rounded-full bg-ink px-5 text-[14px] font-semibold text-ground focus-ring">Try again</button>
                        </>
                    ) : hasMore ? (
                        <a href={nextHref} onClick={(e) => { e.preventDefault(); loadMore(); }} aria-busy={more}
                            className="inline-flex h-11 items-center rounded-full px-5 text-[14px] font-semibold text-ink ring-1 ring-ink/15 hover:bg-ink/5 focus-ring">
                            {more ? 'Loading more photographs…' : tier === 'low' ? `Load ${Math.min(pageSize, total - items.length)} more (smaller images)` : 'Load more photographs'}
                        </a>
                    ) : null}
                </div>
            </section>

            <RefineSheet open={refine} onClose={() => setRefine(false)} lenses={lenses} tags={tags} toggle={toggle} total={total} busy={busy}
                clear={() => setTags(ceremony ? [ceremony.label] : [])} />
            <SelectsTray studioPhone={studioPhone} />
        </div>
    );
}

/**
 * Refine — the photographer's shot list: ruled paper with a red margin rule;
 * each wish is a line with a box that takes a red grease-pencil tick (drawn
 * once), and its count sits on the right like a ledger. Phones: a bottom
 * sheet; desktop: a drawer.
 */
function RefineSheet({ open, onClose, lenses, tags, toggle, total, busy, clear }) {
    const ref = useRef(null);
    useEffect(() => {
        const d = ref.current;
        if (!d) return;
        if (open && !d.open) d.showModal();
        if (!open && d.open) d.close();
    }, [open]);
    const picked = tags.filter((t) => lenses.some((l) => l.tags.some((x) => x.label === t))).length;
    return (
        <dialog ref={ref} onClose={onClose} onClick={(e) => { if (e.target === ref.current) onClose(); }} aria-labelledby="refine-title"
            className="sheet-dialog m-0 max-h-none max-w-none bg-transparent p-0 backdrop:bg-[rgba(28,17,10,0.55)]">
            <div className="sheet-panel shot-list flex flex-col text-ink">
                <div className="flex items-start justify-between gap-4 pb-3 pl-14 pr-4 pt-5 sm:pr-6">
                    <div>
                        <h2 id="refine-title" className="font-display text-[32px] leading-none">Shot list</h2>
                        <p className="mt-2 text-[14px] text-ink-muted">Tick what you would like to see{picked ? `: ${picked} ticked` : ''}.</p>
                    </div>
                    <button type="button" onClick={onClose} aria-label="Close" className="grid h-11 w-11 shrink-0 cursor-pointer place-items-center rounded-full hover:bg-ink/5 focus-ring">
                        <FiX aria-hidden="true" className="h-5 w-5" />
                    </button>
                </div>
                <div className="min-h-0 flex-1 overflow-y-auto pb-4">
                    {lenses.map((l) => (
                        <fieldset key={l.key} className="mt-3">
                            <legend className="pl-14 text-[12px] font-semibold uppercase tracking-[0.18em] text-accent-ink">{l.label}</legend>
                            <ul className="mt-1 grid sm:grid-cols-1">
                                {l.tags.map((t) => {
                                    const on = tags.includes(t.label);
                                    return (
                                        <li key={t.label}>
                                            <button type="button" aria-pressed={on} onClick={() => toggle(t.label)}
                                                className="shot-line flex h-12 w-full cursor-pointer items-center gap-3 pl-14 pr-5 text-left focus-ring sm:pr-6">
                                                <span aria-hidden="true" className="shot-box">
                                                    {on && <svg viewBox="0 0 24 24" className="shot-tick"><path pathLength="1" d="M4 13 C6 14 8 16 10 19 C13 12 17 7 22 3" /></svg>}
                                                </span>
                                                <span className={`flex-1 text-[15px] ${on ? 'font-semibold text-ink' : 'text-ink-secondary'}`}>{t.label}</span>
                                                <span className="text-[13px] tabular-nums text-ink-muted">{t.count}</span>
                                            </button>
                                        </li>
                                    );
                                })}
                            </ul>
                        </fieldset>
                    ))}
                </div>
                <div className="flex gap-2 border-t border-ink/10 bg-ground-raised px-5 pb-[calc(16px+env(safe-area-inset-bottom))] pt-4 sm:px-6">
                    <button type="button" onClick={clear} className="h-12 cursor-pointer rounded-full px-5 text-[15px] font-semibold text-ink ring-1 ring-ink/15 hover:bg-ink/5 focus-ring">Clear</button>
                    <button type="button" onClick={onClose} className="h-12 flex-1 cursor-pointer rounded-full bg-ink text-[15px] font-semibold text-ground focus-ring">
                        {busy ? 'Finding photographs…' : `Show ${total} photograph${total === 1 ? '' : 's'}`}
                    </button>
                </div>
            </div>
        </dialog>
    );
}
