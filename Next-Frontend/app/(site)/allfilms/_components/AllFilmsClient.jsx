'use client';

/**
 * /allfilms — the library. Every film on one page, filtered instantly.
 *
 *   - all films arrive with the page (server-rendered links), so filtering and
 *     searching never wait for the network and there are no pages to click
 *   - categories: the zero-shift controls — a drill-down row on phones, a folder
 *     on desktop (lens tabs on top, the results inside the folder body)
 *   - search matches couple, place, event and every label; "/" focuses it
 *   - results update without re-laying-out the grid: cards keep their identity,
 *     only newly shown cards fade in (CSS, after the first change) — no flicker
 *   - the address keeps ?category= and ?q= so a filtered view can be shared
 *   - every card plays in place; "Up next" walks through the current results
 */
import { useEffect, useMemo, useRef, useState, startTransition } from 'react';
import Link from 'next/link';
import { MotionConfig } from 'framer-motion';
import { FiSearch, FiX, FiArrowRight } from 'react-icons/fi';
import FilmCard from '@/Component/films/FilmCard.jsx';
import useFilmPlayer from '@/Component/films/useFilmPlayer.jsx';
import CategoryDrill from '@/Component/ui/CategoryDrill.jsx';
import CategoryTiers from '@/Component/ui/CategoryTiers.jsx';
import { matchesQuery } from '@/lib/films.js';


export default function AllFilmsClient({ discovery = null, initialCategory = null, initialQuery = '' }) {
    const films = useMemo(() => discovery?.films || [], [discovery]);
    // "All films" leads the lenses; then the discovery groups (best films is the same set).
    const groups = useMemo(() => [
        { key: 'all', label: 'All films', rows: [{ key: 'all', title: 'All films', items: films }] },
        ...(discovery?.groups || []).filter((g) => g.key !== 'featured'),
    ], [discovery, films]);
    const rowByKey = useMemo(() => {
        const m = new Map();
        groups.forEach((g) => g.rows.forEach((r) => m.set(r.key, { group: g.key, row: r })));
        return m;
    }, [groups]);

    const start = rowByKey.get(initialCategory) || rowByKey.get('all');
    const [group, setGroup] = useState(start.group);
    const [category, setCategory] = useState(start.row.key);
    const [query, setQuery] = useState(initialQuery);
    const searchRef = useRef(null);
    const { play, player, playing } = useFilmPlayer(films, groups.flatMap((g) => g.rows));
    const [changed, setChanged] = useState(false);   // first filter change arms the card entrance

    const current = rowByKey.get(category)?.row || groups[0].rows[0];
    const results = useMemo(() => current.items.filter((f) => matchesQuery(f, query)), [current, query]);

    // Keep the address shareable (?category=…&q=…), without adding history.
    useEffect(() => {
        const u = new URL(window.location.href);
        ['tag', 'page', 'limit'].forEach((k) => u.searchParams.delete(k));
        if (category && category !== 'all') u.searchParams.set('category', category); else u.searchParams.delete('category');
        if (query.trim()) u.searchParams.set('q', query.trim()); else u.searchParams.delete('q');
        window.history.replaceState(window.history.state, '', `${u.pathname}${u.search}`);
    }, [category, query]);

    // "/" jumps to search.
    useEffect(() => {
        const onKey = (e) => {
            if (e.key !== '/' || e.target.closest?.('input, textarea, [contenteditable]')) return;
            e.preventDefault(); searchRef.current?.focus();
        };
        document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
    }, []);

    const choose = (g, k) => { setChanged(true); startTransition(() => { setGroup(g); setCategory(k); }); };
    const crumbs = group !== 'all' && groups.find((g) => g.key === group);

    if (!discovery) {
        return (
            <div className="mx-auto max-w-wide px-5 py-24 text-center">
                <h1 className="font-display text-[40px]">All films</h1>
                <p className="mt-3 text-ink-secondary">Films could not be loaded just now. Please refresh in a moment.</p>
            </div>
        );
    }

    return (
        <MotionConfig reducedMotion="user">
            <div className="mx-auto w-full max-w-wide px-5 pb-16 pt-6 md:px-8 lg:px-6 lg:pt-10">
                {/* Head */}
                <div className="flex flex-wrap items-end justify-between gap-4">
                    <div>
                        <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-accent-ink">The library</p>
                        <h1 className="mt-1 text-[34px] font-semibold leading-[1.05] tracking-[-0.03em] text-ink sm:text-[44px]">
                            All <em className="font-display font-medium italic tracking-normal text-accent-ink">films</em>
                            <span className="ml-2 align-middle text-[16px] font-medium tabular-nums text-ink-muted">{films.length}</span>
                        </h1>
                    </div>
                    <label className="relative w-full sm:w-[340px]">
                        <span className="sr-only">Search films</span>
                        <FiSearch aria-hidden="true" className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
                        <input ref={searchRef} type="search" value={query} onChange={(e) => { setChanged(true); setQuery(e.target.value); }}
                            placeholder="Couple, place, Haldi, beach…"
                            className="h-12 w-full rounded-full bg-ground-raised pl-11 pr-11 text-[15px] text-ink ring-1 ring-ink/10 placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-accent/50" />
                        {!query && <kbd aria-hidden="true" className="pointer-events-none absolute right-4 top-1/2 hidden -translate-y-1/2 rounded-md px-1.5 text-[12px] text-ink-muted ring-1 ring-ink/15 lg:block">/</kbd>}
                        {query && (
                            <button type="button" onClick={() => setQuery('')} aria-label="Clear search"
                                className="absolute right-2 top-1/2 grid h-8 w-8 -translate-y-1/2 cursor-pointer place-items-center rounded-full text-ink-muted hover:bg-ink/5 hover:text-ink focus-ring">
                                <FiX aria-hidden="true" className="h-4 w-4" />
                            </button>
                        )}
                    </label>
                </div>

                {/* Categories: phones drill, desktop folder */}
                <div className="mt-6">
                    <CategoryDrill className="lg:hidden" label="Film categories" groups={groups} group={group} value={category} onChange={choose} />
                    <CategoryTiers folder className="hidden lg:block" label="Film categories" groups={groups} group={group} value={category} onChange={choose} />

                    <div className="folder-body mt-3 lg:mt-0 lg:pt-3">
                        <p className="text-[14px] text-ink-muted" aria-live="polite">
                            {crumbs && <span className="text-ink-secondary">{crumbs.label} › </span>}
                            <span className="font-semibold text-ink">{current.title}</span>
                            {' · '}<span className="tabular-nums">{results.length}</span> {results.length === 1 ? 'film' : 'films'}
                            {query.trim() && <> matching &ldquo;{query.trim()}&rdquo;</>}
                        </p>

                        {results.length ? (
                            /* No layout animation (it re-measured the whole grid and flickered):
                               cards keep their identity across filters, and only cards that are
                               new to the grid fade in, after the first change. */
                            <ul className={`mt-5 grid grid-cols-1 gap-x-4 gap-y-7 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 ${changed ? 'grid-changed' : ''}`}>
                                {results.map((f, i) => (
                                    <li key={f.videos._id} style={{ '--i': Math.min(i, 8) }}>
                                        <FilmCard film={f} variant="landscape" onPlay={(x) => play(x, results)} eager={i < 4}
                                            nowPlaying={playing?.videos?._id === f.videos._id}
                                            sizes="(max-width: 640px) 92vw, (max-width: 1024px) 46vw, 320px" />
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <div className="mt-5 grid min-h-[280px] place-content-center rounded-[24px] bg-ground-sunk/60 px-6 text-center">
                                <p className="text-[16px] font-semibold text-ink">No films match{query.trim() ? <> &ldquo;{query.trim()}&rdquo;</> : null} in {current.title}.</p>
                                <div className="mt-4 flex flex-wrap justify-center gap-2">
                                    {query.trim() && (
                                        <button type="button" onClick={() => setQuery('')} className="h-10 cursor-pointer rounded-full bg-ink px-4 text-[14px] font-semibold text-ground focus-ring">Clear the search</button>
                                    )}
                                    {category !== 'all' && (
                                        <button type="button" onClick={() => choose('all', 'all')} className="h-10 cursor-pointer rounded-full px-4 text-[14px] font-semibold text-ink ring-1 ring-ink/15 hover:bg-ink/5 focus-ring">
                                            Search all {films.length} films
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="mt-12 flex flex-col items-start justify-between gap-4 rounded-[28px] bg-ground-deep p-6 text-ink-onDeep sm:flex-row sm:items-center sm:p-8">
                    <p className="font-display text-[26px] leading-tight sm:text-[32px]">Seen one you love? <span className="italic text-gold">Let&rsquo;s make yours.</span></p>
                    <Link href="/contact" className="inline-flex h-12 shrink-0 items-center gap-2 rounded-full bg-accent px-6 text-[15px] font-semibold text-ink-onAccent hover:bg-accent-hover focus-ring">
                        Check your date <FiArrowRight aria-hidden="true" className="h-4 w-4" />
                    </Link>
                </div>
            </div>
            {player}
        </MotionConfig>
    );
}
