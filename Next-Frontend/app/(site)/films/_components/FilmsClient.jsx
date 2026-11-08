'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import Link from 'next/link';
import { fireMessage } from '@/Utils/fireMessage';
import { Skeleton, SkeletonRegion } from '@/Component/ui/Skeleton.jsx';
import './films.css';

const api_url = typeof window !== 'undefined'
    ? (window.location.hostname === 'localhost' ? (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080') : '')
    : (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080');

/* ═══════════════════════════════════════════════════════════════════════════
   FILMS PAGE — "Our Films" Cinematic Archive
   ═══════════════════════════════════════════════════════════════════════════
   Desktop: Split hero → tag pills + search → category rows (horizontal rails)
   Mobile: Fixed hero → Uno-card sheet → search + tag pills → 2-col grid

   All colours from globals.css design tokens. No arbitrary hex values.
   ─────────────────────────────────────────────────────────────────────────── */


/* ── Sheet drag positions (vh) — mobile only ── */
const SHEET_PEEK = 54;
const SHEET_FULL = 8;
const SHEET_HIDDEN = 86;

/*
 * `initialRows` — the rows chosen in Admin › Content › Films (each a row in
 * Admin › Rows), resolved on the server by page.jsx: [{ key, title, items }].
 * When present the page renders them straight away and does not fetch; when
 * null (CMS unreachable) it reads the old tag list as before.
 */
const rowsToState = (rows) => (rows || []).map((r) => ({ tagName: r.title, videos: r.items || [] }));

export default function FilmsClient({ initialRows = null } = {}) {
    const [allVideos, setAllVideos] = useState(() => rowsToState(initialRows));
    const [tags, setTags] = useState(() => rowsToState(initialRows).map((r) => r.tagName));
    const [selectedTag, setSelectedTag] = useState(null);
    const [filteredVideos, setFilteredVideos] = useState(() => rowsToState(initialRows)
        .flatMap((r) => r.videos.map((v) => ({ ...v, _tag: r.tagName }))));
    const [isLoading, setIsLoading] = useState(!initialRows);
    const [searchQuery, setSearchQuery] = useState('');

    /* ── Sheet drag state (mobile) ── */
    const [sheetTop, setSheetTop] = useState(SHEET_PEEK);
    const [isDragging, setIsDragging] = useState(false);
    const dragStart = useRef({ y: 0, startTop: SHEET_PEEK });
    const sheetRef = useRef(null);

    /* ── Parallax ── */
    const [parallaxY, setParallaxY] = useState(0);

    useEffect(() => {
        const onScroll = () => setParallaxY(window.scrollY * 0.3);
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    /* ── Data fetching ── */
    const fetchVideos = async (tag) => {
        try {
            const res = await fetch(`${api_url}/api/videos?tag=${tag}&page=1&limit=10`);
            const data = await res.json();
            if (res.status >= 300) {
                fireMessage(data.message, 'error');
                return [];
            }
            return data.client || [];
        } catch (error) {
            console.error(error);
            fireMessage(error.message, 'error');
            return [];
        }
    };

    useEffect(() => {
        if (initialRows) return; // composed on the server
        const fetchFilmPageTags = async () => {
            setIsLoading(true);
            try {
                const res = await fetch(`${api_url}/api/filmpage/tags`);
                const data = await res.json();
                if (res.status >= 300 || !data.tags) {
                    return fireMessage(data.message, 'error');
                }
                setTags(data.tags);

                if (data.tags.length > 0) {
                    const videosData = [];
                    for (const tag of data.tags) {
                        const videos = await fetchVideos(tag);
                        videosData.push({ tagName: tag, videos });
                    }
                    setAllVideos(videosData);
                    const flat = videosData.flatMap(r =>
                        (r.videos || []).map(v => ({ ...v, _tag: r.tagName }))
                    );
                    setFilteredVideos(flat);
                }
            } catch (error) {
                fireMessage(error.message, 'error');
            } finally {
                setIsLoading(false);
            }
        };
        fetchFilmPageTags();
    }, [initialRows]);

    /* ── Search — filters across couple names, locations, tags ── */
    const applySearch = useCallback((query, tagFilter) => {
        let pool;
        if (tagFilter) {
            const row = allVideos.find(r => r.tagName === tagFilter);
            pool = row ? (row.videos || []).map(v => ({ ...v, _tag: tagFilter })) : [];
        } else {
            pool = allVideos.flatMap(r =>
                (r.videos || []).map(v => ({ ...v, _tag: r.tagName }))
            );
        }

        if (query.trim()) {
            const q = query.toLowerCase();
            pool = pool.filter(v => {
                const bride = (v.clientName?.Bride || '').toLowerCase();
                const groom = (v.clientName?.Groom || '').toLowerCase();
                const city = (v.videos?.videoLocation?.city || '').toLowerCase();
                const tag = (v._tag || '').toLowerCase();
                return bride.includes(q) || groom.includes(q) || city.includes(q) || tag.includes(q);
            });
        }
        setFilteredVideos(pool);
    }, [allVideos]);

    const handleSearch = useCallback((e) => {
        const q = e.target.value;
        setSearchQuery(q);
        applySearch(q, selectedTag);
    }, [selectedTag, applySearch]);

    /* ── Tag filter ── */
    const showAll = useCallback(() => {
        setSelectedTag(null);
        applySearch(searchQuery, null);
    }, [searchQuery, applySearch]);

    const handleTagSelect = useCallback((tag) => {
        if (tag === selectedTag) {
            showAll();
        } else {
            setSelectedTag(tag);
            applySearch(searchQuery, tag);
        }
    }, [selectedTag, searchQuery, applySearch, showAll]);

    /* ── Touch/pointer drag for sheet (mobile) ── */
    const onDragStart = (e) => {
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        dragStart.current = { y: clientY, startTop: sheetTop };
        setIsDragging(true);
    };
    const onDragMove = useCallback((e) => {
        if (!isDragging) return;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        const diff = clientY - dragStart.current.y;
        const vh = window.innerHeight / 100;
        const newTop = dragStart.current.startTop + (diff / vh);
        setSheetTop(Math.max(SHEET_FULL, Math.min(SHEET_HIDDEN, newTop)));
    }, [isDragging]);
    const onDragEnd = useCallback(() => {
        if (!isDragging) return;
        setIsDragging(false);
        const positions = [SHEET_FULL, SHEET_PEEK, SHEET_HIDDEN];
        const nearest = positions.reduce((prev, curr) =>
            Math.abs(curr - sheetTop) < Math.abs(prev - sheetTop) ? curr : prev
        );
        setSheetTop(nearest);
    }, [isDragging, sheetTop]);

    useEffect(() => {
        if (!isDragging) return;
        const moveHandler = (e) => onDragMove(e);
        const endHandler = () => onDragEnd();
        window.addEventListener('touchmove', moveHandler, { passive: false });
        window.addEventListener('touchend', endHandler);
        window.addEventListener('mousemove', moveHandler);
        window.addEventListener('mouseup', endHandler);
        return () => {
            window.removeEventListener('touchmove', moveHandler);
            window.removeEventListener('touchend', endHandler);
            window.removeEventListener('mousemove', moveHandler);
            window.removeEventListener('mouseup', endHandler);
        };
    }, [isDragging, onDragMove, onDragEnd]);

    /* ── Hero image ── */
    const heroImage =
        allVideos.length > 0 && allVideos[0]?.videos?.length > 0
            ? allVideos[0].videos[0]?.thumbnailUrl
            : null;

    /* ═══ DESKTOP — decide which rows to show ═══
       When a tag is selected, only show that row. When "All", show every row.
       Search further filters within those rows. */
    const desktopRows = selectedTag
        ? allVideos.filter(r => r.tagName === selectedTag)
        : allVideos;

    const desktopFilteredRows = desktopRows.map(row => {
        if (!searchQuery.trim()) return row;
        const q = searchQuery.toLowerCase();
        const filtered = (row.videos || []).filter(v => {
            const bride = (v.clientName?.Bride || '').toLowerCase();
            const groom = (v.clientName?.Groom || '').toLowerCase();
            const city = (v.videos?.videoLocation?.city || '').toLowerCase();
            return bride.includes(q) || groom.includes(q) || city.includes(q);
        });
        return { ...row, videos: filtered };
    }).filter(row => row.videos && row.videos.length > 0);

    return (
        <div className="films-page" style={{ '--sheet-top': `${sheetTop}vh` }}>

            {/* ═══════════════════════════════════════════════════════════════
                DESKTOP LAYOUT  (lg+)
                ═══════════════════════════════════════════════════════════════ */}
            <div className="films-desktop">
                {/* ── Full-Width Desktop Banner (Edge-to-edge with live editorial typography) ── */}
                <header className="fd-banner" aria-label="Our Films Banner">
                    <div className="fd-banner__media">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src="/Asset/films/films-photo-banner-wide.webp"
                            alt="Our Films — Real Stories, Timeless Films"
                            className="fd-banner__img"
                            loading="eager"
                            fetchPriority="high"
                            decoding="async"
                        />

                        {/* Live Editorial Typography Overlay matching original layout */}
                        <div className="fd-banner__editorial">
                            <div className="fd-banner__eyebrow-wrap">
                                <span className="fd-banner__eyebrow">OUR FILMS</span>
                                <span className="fd-banner__eyebrow-line" aria-hidden="true" />
                            </div>
                            <h1 className="fd-banner__title">
                                <span className="fd-banner__title-line1">Real Stories.</span>
                                <span className="fd-banner__title-line2">Timeless Films.</span>
                            </h1>
                            <p className="fd-banner__desc">
                                Cinematic wedding films from real celebrations — palaces, coastlines and sacred cities. Every film is a story of people, places and emotions.
                            </p>
                        </div>
                    </div>
                </header>

                {/* ── Tag filters + Search bar (Full-width horizon bar with inner alignment) ── */}
                <div className="fd-controls-bar">
                    <div className="fd-controls">
                        <div className="fd-controls__tags" role="group" aria-label="Filter films by category">
                            {isLoading ? (
                                [...Array(5)].map((_, i) => (
                                    <Skeleton key={i} className="h-9 w-28 shrink-0" rounded="pill" />
                                ))
                            ) : (
                                <>
                                    <button
                                        type="button"
                                        onClick={showAll}
                                        className={`films-tag ${selectedTag === null ? 'films-tag--active' : ''}`}
                                        aria-pressed={selectedTag === null}
                                    >
                                        All
                                    </button>
                                    {tags.map((t) => (
                                        <button
                                            key={t}
                                            type="button"
                                            onClick={() => handleTagSelect(t)}
                                            className={`films-tag ${selectedTag === t ? 'films-tag--active' : ''}`}
                                            aria-pressed={selectedTag === t}
                                        >
                                            {t}
                                        </button>
                                    ))}
                                </>
                            )}
                        </div>
                        <div className="fd-search">
                            <svg className="fd-search__icon" width="16" height="16" viewBox="0 0 24 24"
                                fill="none" stroke="currentColor" strokeWidth="1.75"
                                strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="11" cy="11" r="8" />
                                <line x1="21" y1="21" x2="16.65" y2="16.65" />
                            </svg>
                            <input
                                type="search"
                                className="fd-search__input"
                                placeholder="Search by name, location or wedding..."
                                value={searchQuery}
                                onChange={handleSearch}
                                aria-label="Search films"
                            />
                            {searchQuery && (
                                <button
                                    type="button"
                                    className="fd-search__clear"
                                    onClick={() => { setSearchQuery(''); applySearch('', selectedTag); }}
                                    aria-label="Clear search query"
                                >
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
                                        stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                        <line x1="18" y1="6" x2="6" y2="18" />
                                        <line x1="6" y1="6" x2="18" y2="18" />
                                    </svg>
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* ── Category Rows (horizontal rails) ── */}
                <div className="fd-rows">
                    {isLoading ? (
                        [...Array(3)].map((_, i) => (
                            <div key={i} className="fd-row">
                                <div className="fd-row__header">
                                    <Skeleton className="h-8 w-40" rounded="control" />
                                </div>
                                <div className="fd-row__rail">
                                    {[...Array(4)].map((_, j) => (
                                        <div key={j} className="fd-row__card-skeleton">
                                            <Skeleton className="aspect-[4/3] w-full" rounded="media" />
                                            <div className="mt-3 space-y-2">
                                                <Skeleton className="h-3 w-2/3" rounded="control" />
                                                <Skeleton className="h-4 w-3/4" rounded="control" />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))
                    ) : desktopFilteredRows.length > 0 ? (
                        desktopFilteredRows.map((row) => (
                            <CategoryRow
                                key={row.tagName}
                                tagName={row.tagName}
                                videos={row.videos || []}
                            />
                        ))
                    ) : (
                        <div className="films-empty">
                            <div className="films-empty__icon">
                                <svg width="48" height="48" viewBox="0 0 24 24" fill="none"
                                    stroke="currentColor" strokeWidth="1.5"
                                    strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="11" cy="11" r="8" />
                                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                                </svg>
                            </div>
                            <h3 className="films-empty__title">No Films Found</h3>
                            <p className="films-empty__text">
                                No films match your search. Try a different name or location.
                            </p>
                            <button type="button" onClick={() => { setSearchQuery(''); showAll(); }} className="films-empty__reset">
                                Clear search
                            </button>
                        </div>
                    )}
                </div>
            </div>


            {/* ═══════════════════════════════════════════════════════════════
                MOBILE LAYOUT  (<lg)
                ═══════════════════════════════════════════════════════════════ */}
            <div className="films-mobile">
                {/* Fixed Hero Backdrop with Portrait Phone Banner */}
                <div className="films-hero">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        src="/Asset/films/films-banner-phone.webp"
                        alt="Our Films — Real Stories. Timeless Films."
                        className="films-hero__img"
                        style={{ transform: `translateY(${parallaxY * 0.4}px) scale(1.03)` }}
                        loading="eager"
                        fetchPriority="high"
                    />
                    <div className="films-hero__gradient" />

                    {/* Editorial Typography Overlay (Dynamically placed over open sky, never cropped) */}
                    <div className="films-hero__editorial">
                        <div className="films-hero__eyebrow-wrap">
                            <span className="films-hero__eyebrow">OUR FILMS</span>
                            <span className="films-hero__eyebrow-line" aria-hidden="true" />
                        </div>
                        <h1 className="films-hero__title">
                            <span className="films-hero__title-line1">Real Stories.</span>
                            <span className="films-hero__title-line2">Timeless Films.</span>
                        </h1>
                        <p className="films-hero__desc">
                            Cinematic wedding films from real celebrations — palaces, coastlines and sacred cities. Every film is a story of people, places and emotions.
                        </p>
                    </div>
                </div>

                {/* Interactive Sheet */}
                <div
                    ref={sheetRef}
                    className={`films-sheet ${isDragging ? 'films-sheet--dragging' : ''}`}
                    style={{ top: `var(--sheet-top)` }}
                >
                    {/* Drag handle */}
                    <div
                        className="films-sheet__handle-zone"
                        onTouchStart={onDragStart}
                        onMouseDown={onDragStart}
                        role="slider"
                        aria-label="Drag to expand or collapse film list"
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-valuenow={Math.round(100 - sheetTop)}
                        tabIndex={0}
                    >
                        <div className="films-sheet__handle" />
                    </div>

                    {/* Sheet header */}
                    <div className="films-sheet__header">
                        <div>
                            <h2 className="films-sheet__heading">Wedding Films</h2>
                            <p className="films-sheet__count">
                                {isLoading ? '...' : `${filteredVideos.length} films`}
                            </p>
                        </div>
                        <Link href="/allfilms" className="films-sheet__view-all">
                            View All
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                                stroke="currentColor" strokeWidth="2.5"
                                strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="9 18 15 12 9 6" />
                            </svg>
                        </Link>
                    </div>

                    {/* ── Mobile Search Bar ── */}
                    <div className="films-search-mobile">
                        <svg className="films-search-mobile__icon" width="15" height="15" viewBox="0 0 24 24"
                            fill="none" stroke="currentColor" strokeWidth="1.75"
                            strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="11" cy="11" r="8" />
                            <line x1="21" y1="21" x2="16.65" y2="16.65" />
                        </svg>
                        <input
                            type="search"
                            className="films-search-mobile__input"
                            placeholder="Search by name or location..."
                            value={searchQuery}
                            onChange={handleSearch}
                            aria-label="Search films"
                        />
                        {searchQuery && (
                            <button
                                type="button"
                                className="films-search-mobile__clear"
                                onClick={() => { setSearchQuery(''); applySearch('', selectedTag); }}
                                aria-label="Clear search query"
                            >
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
                                    stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <line x1="18" y1="6" x2="6" y2="18" />
                                    <line x1="6" y1="6" x2="18" y2="18" />
                                </svg>
                            </button>
                        )}
                    </div>

                    {/* Horizontal tag filters */}
                    <div className="films-tags" role="group" aria-label="Filter films by category">
                        <div className="films-tags__scroll">
                            {isLoading ? (
                                [...Array(4)].map((_, i) => (
                                    <Skeleton key={i} className="h-9 w-24 shrink-0" rounded="pill" />
                                ))
                            ) : (
                                <>
                                    <button
                                        type="button"
                                        onClick={showAll}
                                        className={`films-tag ${selectedTag === null ? 'films-tag--active' : ''}`}
                                        aria-pressed={selectedTag === null}
                                    >
                                        All
                                    </button>
                                    {tags.map((t) => (
                                        <button
                                            key={t}
                                            type="button"
                                            onClick={() => handleTagSelect(t)}
                                            className={`films-tag ${selectedTag === t ? 'films-tag--active' : ''}`}
                                            aria-pressed={selectedTag === t}
                                        >
                                            {t}
                                        </button>
                                    ))}
                                </>
                            )}
                        </div>
                    </div>

                    {/* Mobile film feed — 2-col grid */}
                    <div className="films-feed">
                        {isLoading ? (
                            <SkeletonRegion label="Loading films">
                                <div className="films-feed__grid">
                                    {[...Array(6)].map((_, i) => (
                                        <div key={i} className="films-card-skeleton">
                                            <Skeleton className="aspect-[3/4] w-full" rounded="media" />
                                            <div className="mt-3 space-y-2">
                                                <Skeleton className="h-4 w-3/4" rounded="control" />
                                                <Skeleton className="h-3 w-1/2" rounded="control" />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </SkeletonRegion>
                        ) : filteredVideos.length > 0 ? (
                            <div className="films-feed__grid">
                                {filteredVideos.map((video, index) => (
                                    <FilmCard
                                        key={video.videos?._id || index}
                                        video={video}
                                        index={index}
                                        layout="portrait"
                                    />
                                ))}
                            </div>
                        ) : (
                            <div className="films-empty">
                                <div className="films-empty__icon">
                                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none"
                                        stroke="currentColor" strokeWidth="1.5"
                                        strokeLinecap="round" strokeLinejoin="round">
                                        <circle cx="11" cy="11" r="8" />
                                        <line x1="21" y1="21" x2="16.65" y2="16.65" />
                                    </svg>
                                </div>
                                <h3 className="films-empty__title">No Films Found</h3>
                                <p className="films-empty__text">
                                    No films match your search.
                                </p>
                                <button
                                    type="button"
                                    onClick={() => { setSearchQuery(''); showAll(); }}
                                    className="films-empty__reset"
                                >
                                    Clear search
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="h-24" />
                </div>
            </div>
        </div>
    );
}


/* ═══════════════════════════════════════════════════════════════════════════
   CATEGORY ROW — Horizontal scrollable rail per tag (desktop)
   ═══════════════════════════════════════════════════════════════════════════ */
function CategoryRow({ tagName, videos }) {
    const railRef = useRef(null);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(false);

    const checkScroll = useCallback(() => {
        const el = railRef.current;
        if (!el) return;
        setCanScrollLeft(el.scrollLeft > 4);
        setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
    }, []);

    useEffect(() => {
        checkScroll();
        const el = railRef.current;
        if (!el) return;
        el.addEventListener('scroll', checkScroll, { passive: true });
        window.addEventListener('resize', checkScroll);
        return () => {
            el.removeEventListener('scroll', checkScroll);
            window.removeEventListener('resize', checkScroll);
        };
    }, [checkScroll, videos]);

    const scroll = (direction) => {
        const el = railRef.current;
        if (!el) return;
        const cardWidth = el.querySelector('.films-card')?.offsetWidth || 300;
        el.scrollBy({ left: direction * (cardWidth + 20) * 2, behavior: 'smooth' });
    };

    return (
        <div className="fd-row">
            <div className="fd-row__header">
                <div className="fd-row__title-group">
                    <h2 className="fd-row__title">{tagName}</h2>
                </div>
                <Link href="/allfilms" className="fd-row__view-all">
                    View All
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                        stroke="currentColor" strokeWidth="2.5"
                        strokeLinecap="round" strokeLinejoin="round">
                        <line x1="5" y1="12" x2="19" y2="12" />
                        <polyline points="12 5 19 12 12 19" />
                    </svg>
                </Link>
            </div>

            <div className="fd-row__rail-wrap">
                {/* Left arrow */}
                {canScrollLeft && (
                    <button
                        type="button"
                        className="fd-row__arrow fd-row__arrow--left"
                        onClick={() => scroll(-1)}
                        aria-label="Scroll left"
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
                            stroke="currentColor" strokeWidth="2.5"
                            strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="15 18 9 12 15 6" />
                        </svg>
                    </button>
                )}

                <div className="fd-row__rail" ref={railRef}>
                    {videos.map((video, index) => (
                        <FilmCard
                            key={video.videos?._id || index}
                            video={{ ...video, _tag: tagName }}
                            index={index}
                            layout="landscape"
                        />
                    ))}
                </div>

                {/* Right arrow */}
                {canScrollRight && (
                    <button
                        type="button"
                        className="fd-row__arrow fd-row__arrow--right"
                        onClick={() => scroll(1)}
                        aria-label="Scroll right"
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
                            stroke="currentColor" strokeWidth="2.5"
                            strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="9 18 15 12 9 6" />
                        </svg>
                    </button>
                )}
            </div>
        </div>
    );
}


/* ═══════════════════════════════════════════════════════════════════════════
   FILM CARD — Dual-layout: portrait (mobile grid) / landscape (desktop rail)
   ═══════════════════════════════════════════════════════════════════════════ */
function FilmCard({ video, index, layout = 'portrait' }) {
    const [imageLoaded, setImageLoaded] = useState(false);

    const bride = video.clientName?.Bride || '';
    const groom = video.clientName?.Groom || '';
    const coupleName = [bride, groom].filter(Boolean).join(' & ');
    const date = video.videos?.videoShootDate || '';
    const city = video.videos?.videoLocation?.city || '';
    const meta = [date, city].filter(Boolean).join(' · ');

    const isLandscape = layout === 'landscape';

    return (
        <Link
            href={`/films/${video.videos?._id}`}
            className={`films-card ${isLandscape ? 'films-card--landscape' : ''}`}
            style={{ '--card-delay': `${index * 60}ms` }}
        >
            <div className={`films-card__media ${isLandscape ? 'films-card__media--landscape' : ''}`}>
                {!imageLoaded && (
                    <div className="films-card__placeholder skeleton" />
                )}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                    src={video.thumbnailUrl}
                    alt={`${coupleName} wedding film`}
                    loading="lazy"
                    decoding="async"
                    className={`films-card__img ${imageLoaded ? 'films-card__img--loaded' : ''}`}
                    onLoad={() => setImageLoaded(true)}
                />

                <div className="films-card__scrim" />

                {/* Play button */}
                <div className="films-card__play">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M8 5.14v13.72a1 1 0 001.55.83l10.72-6.86a1 1 0 000-1.66L9.55 4.31A1 1 0 008 5.14z" />
                    </svg>
                </div>

                {/* Tag badge — mobile only */}
                {!isLandscape && video._tag && (
                    <span className="films-card__badge">{video._tag}</span>
                )}
            </div>

            <div className="films-card__info">
                {meta && <p className="films-card__meta">{meta.toUpperCase()}</p>}
                <p className="films-card__couple">{coupleName}</p>
            </div>
        </Link>
    );
}
