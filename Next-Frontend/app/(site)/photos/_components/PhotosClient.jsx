'use client';

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import Link from 'next/link';
import InfiniteScroll from 'react-infinite-scroll-component';
import './photos.css';

const api_url = typeof window !== 'undefined'
    ? (window.location.hostname === 'localhost' ? (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080') : '')
    : (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080');

/* ── Default curated photography tags matching inspiration ── */
const DEFAULT_PHOTO_TAGS = [
    'Wedding',
    'Pre-Wedding',
    'Haldi',
    'Mehendi',
    'Sangeet',
    'Reception',
    'Palace Wedding',
    'Beach',
    'Classic',
    'Cultural',
];

/* ── Mobile Sheet Snap Positions (vh) ── */
const SHEET_PEEK = 54;
const SHEET_FULL = 8;
const SHEET_HIDDEN = 86;

/*
 * `composition` — Admin › Content › Photos, resolved on the server by page.jsx:
 * { facets, sort, pageSize, chosen }. When filter groups were chosen there
 * (`chosen`), their tags are the chips, in order; otherwise the gallery keeps its
 * own chips (the curated defaults, or the old photo tag list).
 */
const facetChips = (facets) => (facets || []).flatMap((f) => (f.tags || []).map((t) => t.label));

export default function PhotosClient({ composition = null, initialTag = null } = {}) {
    const chipsChosen = Boolean(composition?.chosen);
    const composedSort = composition?.sort || null;
    const [photos, setPhotos] = useState([]);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [isLoading, setIsLoading] = useState(true);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [tags, setTags] = useState(() => (chipsChosen ? facetChips(composition.facets) : DEFAULT_PHOTO_TAGS));
    const [selectedTag, setSelectedTag] = useState(initialTag);
    const requestRef = useRef(null);
    const [requestError, setRequestError] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [likedPhotos, setLikedPhotos] = useState({});

    /* ── Responsive Column Count for Masonry ── */
    const [columnCount, setColumnCount] = useState(4);

    useEffect(() => {
        const updateColumns = () => {
            const w = window.innerWidth;
            if (w >= 1280) setColumnCount(4);
            else if (w >= 1024) setColumnCount(4);
            else if (w >= 640) setColumnCount(3);
            else setColumnCount(2);
        };
        updateColumns();
        window.addEventListener('resize', updateColumns);
        return () => window.removeEventListener('resize', updateColumns);
    }, []);

    /* ── Mobile Sheet Drag State ── */
    const [sheetTop, setSheetTop] = useState(SHEET_PEEK);
    const [isDragging, setIsDragging] = useState(false);
    const dragStart = useRef({ y: 0, startTop: SHEET_PEEK });
    const sheetRef = useRef(null);

    /* ── Parallax for Hero Backdrop ── */
    const [parallaxY, setParallaxY] = useState(0);
    useEffect(() => {
        const onScroll = () => setParallaxY(window.scrollY * 0.3);
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    /* ── Fetch tags from API or fallback ── */
    useEffect(() => {
        if (chipsChosen) return; // chosen in the CMS, resolved on the server
        const fetchTags = async () => {
            try {
                const res = await fetch(`${api_url}/api/photopage/tags`);
                const data = await res.json();
                if (data.tags && data.tags.length > 0) {
                    setTags(data.tags);
                }
            } catch (err) {
                console.warn('Failed to load custom photo tags, using curated defaults', err);
            }
        };
        fetchTags();
    }, [chipsChosen]);

    /* ── Fetch Photos from Backend ── */
    const limit = composition?.pageSize || 24;

    const fetchPhotos = useCallback(async (targetPage = 1, currentTag = selectedTag, append = false) => {
        requestRef.current?.abort();
        const controller = new AbortController();
        requestRef.current = controller;
        try {
            setRequestError('');
            if (targetPage === 1) setIsLoading(true);
            else setIsLoadingMore(true);

            let url = `${api_url}/api/photos?page=${targetPage}&limit=${limit}`;
            // The order chosen in the CMS (newest shoot, newest published, featured).
            if (composedSort) url += `&sort=${composedSort}`;
            if (currentTag) {
                url += `&tag=${encodeURIComponent(currentTag)}`;
            }

            const res = await fetch(url, { signal: controller.signal });
            if (!res.ok) throw new Error('Photographs could not be loaded. Please try again.');
            const data = await res.json();
            if (controller.signal.aborted) return;
            const newPhotos = data.photos || [];

            if (append) {
                setPhotos(prev => {
                    // Prevent duplicate IDs
                    const existingIds = new Set(prev.map(p => p._id));
                    const fresh = newPhotos.filter(p => !existingIds.has(p._id));
                    return [...prev, ...fresh];
                });
            } else {
                setPhotos(newPhotos);
            }

            setHasMore(data.hasMore ?? newPhotos.length >= limit);
            setPage(targetPage + 1);
        } catch (error) {
            if (controller.signal.aborted) return;
            setRequestError(error.message);
            setHasMore(false);
        } finally {
            if (!controller.signal.aborted) { setIsLoading(false); setIsLoadingMore(false); }
        }
    }, [selectedTag, limit, composedSort]);

    // Initial load
    useEffect(() => {
        // Fetches external data; the callback sets its loading state.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        fetchPhotos(1, selectedTag, false);
        return () => requestRef.current?.abort();
    }, [fetchPhotos, selectedTag]);

    /* ── Filter Handler ── */
    const handleTagSelect = (tag) => setSelectedTag(selectedTag === tag ? null : tag);
    const showAll = () => setSelectedTag(null);

    useEffect(() => {
        const url = new URL(window.location.href);
        if (selectedTag) url.searchParams.set('tag', selectedTag);
        else url.searchParams.delete('tag');
        window.history.replaceState(null, '', url);
    }, [selectedTag]);

    /* ── Search Filtering (client-side on top of loaded photos) ── */
    const filteredPhotos = useMemo(() => {
        if (!searchQuery.trim()) return photos;
        const q = searchQuery.toLowerCase().trim();
        return photos.filter(photo => {
            const bride = (photo.clientName?.Bride || '').toLowerCase();
            const groom = (photo.clientName?.Groom || '').toLowerCase();
            const city = (photo.photoLocation?.city || '').toLowerCase();
            const state = (photo.photoLocation?.state || '').toLowerCase();
            const matchTag = (photo.tags || []).some(t => t.toLowerCase().includes(q));
            return bride.includes(q) || groom.includes(q) || city.includes(q) || state.includes(q) || matchTag;
        });
    }, [photos, searchQuery]);

    /* ── Mathematical Pinterest Column Partitioning (Greedy Shortest-Column) ── */
    const desktopColumns = useMemo(() => {
        const count = columnCount;
        const cols = Array.from({ length: count }, () => []);
        const heights = new Array(count).fill(0);

        for (const photo of filteredPhotos) {
            // Natural aspect ratio: width / height
            const rawRatio = Number(photo.aspectRatio) || 1;
            const clampedRatio = Math.max(0.6, Math.min(1.6, rawRatio));
            // Relative height = 1 / aspectRatio + metadata allowance
            const relativeHeight = (1 / clampedRatio) + 0.12;

            // Find shortest column
            let shortestIndex = 0;
            let minH = heights[0];
            for (let i = 1; i < count; i++) {
                if (heights[i] < minH) {
                    minH = heights[i];
                    shortestIndex = i;
                }
            }

            cols[shortestIndex].push(photo);
            heights[shortestIndex] += relativeHeight + 0.08;
        }

        return cols;
    }, [filteredPhotos, columnCount]);

    /* ── Mobile 2-Column Partitioning ── */
    const mobileColumns = useMemo(() => {
        const cols = [[], []];
        const heights = [0, 0];

        for (const photo of filteredPhotos) {
            const rawRatio = Number(photo.aspectRatio) || 1;
            const clampedRatio = Math.max(0.6, Math.min(1.6, rawRatio));
            const relativeHeight = (1 / clampedRatio) + 0.12;

            const target = heights[0] <= heights[1] ? 0 : 1;
            cols[target].push(photo);
            heights[target] += relativeHeight + 0.08;
        }

        return cols;
    }, [filteredPhotos]);

    /* ── Like / Bookmark Toggle ── */
    const toggleLike = (e, photoId) => {
        e.preventDefault();
        e.stopPropagation();
        setLikedPhotos(prev => ({
            ...prev,
            [photoId]: !prev[photoId]
        }));
    };

    /* ── Mobile Touch/Pointer Drag for Uno Sheet ── */
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

    const loadMorePhotos = () => {
        if (!isLoading && !isLoadingMore && hasMore) {
            fetchPhotos(page, selectedTag, true);
        }
    };

    return (
        <div className="photos-page" style={{ '--sheet-top': `${sheetTop}vh` }}>
            {requestError && <p role="alert" className="p-4 text-state-error">{requestError} <button type="button" onClick={() => fetchPhotos(1, selectedTag)} className="underline">Retry</button></p>}

            {/* ═══════════════════════════════════════════════════════════════
                DESKTOP LAYOUT  (lg+)
                ═══════════════════════════════════════════════════════════════ */}
            <div className="photos-desktop">
                {/* ── Full-Width Edge-to-Edge Banner (films-photo-banner-wide.webp) ── */}
                <header className="pd-banner" aria-label="Our Photographs Banner">
                    <div className="pd-banner__media">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src="/Asset/films/films-photo-banner-wide.webp"
                            alt="Our Photographs — Moments That Stay Forever"
                            className="pd-banner__img"
                            loading="eager"
                            fetchPriority="high"
                            decoding="async"
                        />

                        {/* Live Editorial Typography Overlay matching original layout */}
                        <div className="pd-banner__editorial">
                            <div className="pd-banner__eyebrow-wrap">
                                <span className="pd-banner__eyebrow">OUR PHOTOGRAPHS</span>
                                <span className="pd-banner__eyebrow-line" aria-hidden="true" />
                            </div>
                            <h1 className="pd-banner__title">
                                <span className="pd-banner__title-line1">Moments</span>
                                <span className="pd-banner__title-line2">That Stay Forever.</span>
                            </h1>
                            <p className="pd-banner__desc">
                                A collection of real celebrations, real people and real emotions — photographed across palaces, coastlines and sacred cities.
                            </p>
                        </div>
                    </div>
                </header>

                {/* ── Full-Width Horizon Bar (Tags + Search) ── */}
                <div className="pd-controls-bar">
                    <div className="pd-controls">
                        {/* Tag filter pills */}
                        <div className="pd-controls__tags" role="group" aria-label="Filter photographs by category">
                            <button
                                type="button"
                                onClick={showAll}
                                className={`photos-tag ${selectedTag === null ? 'photos-tag--active' : ''}`}
                                aria-pressed={selectedTag === null}
                            >
                                All
                            </button>
                            {tags.map((t) => (
                                <button
                                    key={t}
                                    type="button"
                                    onClick={() => handleTagSelect(t)}
                                    className={`photos-tag ${selectedTag === t ? 'photos-tag--active' : ''}`}
                                    aria-pressed={selectedTag === t}
                                >
                                    {t}
                                </button>
                            ))}
                        </div>

                        {/* Search Input */}
                        <div className="pd-search">
                            <svg className="pd-search__icon" width="16" height="16" viewBox="0 0 24 24"
                                fill="none" stroke="currentColor" strokeWidth="1.75"
                                strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="11" cy="11" r="8" />
                                <line x1="21" y1="21" x2="16.65" y2="16.65" />
                            </svg>
                            <input
                                type="search"
                                className="pd-search__input"
                                placeholder="Search by couple, location, or tag..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                aria-label="Search photographs"
                            />
                            {searchQuery && (
                                <button
                                    type="button"
                                    className="pd-search__clear"
                                    onClick={() => setSearchQuery('')}
                                    aria-label="Clear search"
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

                {/* ── Pinterest Masonry Waterfall Gallery ── */}
                <div className="photos-masonry-wrapper">
                    {isLoading ? (
                        <div className="photos-masonry">
                            {Array.from({ length: columnCount }).map((_, cIdx) => (
                                <div key={cIdx} className="photos-masonry__col">
                                    {[380, 260, 440, 320].map((h, i) => (
                                        <div
                                            key={i}
                                            className="rounded-2xl bg-ground-sunk animate-pulse"
                                            style={{ height: `${h}px` }}
                                        />
                                    ))}
                                </div>
                            ))}
                        </div>
                    ) : filteredPhotos.length > 0 ? (
                        <InfiniteScroll
                            dataLength={photos.length}
                            next={loadMorePhotos}
                            hasMore={hasMore && !searchQuery}
                            loader={
                                <div className="py-12 flex justify-center items-center">
                                    <div className="w-8 h-8 rounded-full border-2 border-accent border-t-transparent animate-spin" />
                                </div>
                            }
                        >
                            <div className="photos-masonry">
                                {desktopColumns.map((colPhotos, colIdx) => (
                                    <div key={colIdx} className="photos-masonry__col">
                                        {colPhotos.map((photo) => (
                                            <PhotoCard
                                                key={photo._id}
                                                photo={photo}
                                                isLiked={Boolean(likedPhotos[photo._id])}
                                                onToggleLike={(e) => toggleLike(e, photo._id)}
                                            />
                                        ))}
                                    </div>
                                ))}
                            </div>
                        </InfiniteScroll>
                    ) : (
                        <div className="photos-empty">
                            <div className="photos-empty__icon">
                                <svg width="32" height="32" viewBox="0 0 24 24" fill="none"
                                    stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="11" cy="11" r="8" />
                                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                                </svg>
                            </div>
                            <h2 className="photos-empty__title">No Photographs Found</h2>
                            <p className="photos-empty__text">
                                No photographs match your current filter. Try selecting another ceremony or resetting search.
                            </p>
                            <button
                                type="button"
                                onClick={() => { setSearchQuery(''); showAll(); }}
                                className="photos-empty__reset"
                            >
                                Reset all filters
                            </button>
                        </div>
                    )}
                </div>
            </div>


            {/* ═══════════════════════════════════════════════════════════════
                MOBILE LAYOUT  (<lg) — Fixed Hero + Uno Card Draggable Sheet
                ═══════════════════════════════════════════════════════════════ */}
            <div className="photos-mobile">
                {/* Fixed Hero Backdrop with Portrait Phone Banner */}
                <div className="photos-hero">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        src="/Asset/films/films-banner-phone.webp"
                        alt="Our Photographs — Moments That Stay Forever"
                        className="photos-hero__img"
                        style={{ transform: `translateY(${parallaxY * 0.4}px) scale(1.03)` }}
                        loading="eager"
                        fetchPriority="high"
                    />
                    <div className="photos-hero__gradient" />

                    {/* Editorial Typography Overlay (Dynamically placed over open sky, never cropped) */}
                    <div className="photos-hero__editorial">
                        <div className="photos-hero__eyebrow-wrap">
                            <span className="photos-hero__eyebrow">OUR PHOTOGRAPHS</span>
                            <span className="photos-hero__eyebrow-line" aria-hidden="true" />
                        </div>
                        <h1 className="photos-hero__title">
                            <span className="photos-hero__title-line1">Moments</span>
                            <span className="photos-hero__title-line2">That Stay Forever.</span>
                        </h1>
                        <p className="photos-hero__desc">
                            A collection of real celebrations, real people and real emotions — photographed across palaces, coastlines and sacred cities.
                        </p>
                    </div>
                </div>

                {/* Interactive Uno-Card Bottom Sheet */}
                <div
                    ref={sheetRef}
                    className={`photos-sheet ${isDragging ? 'photos-sheet--dragging' : ''}`}
                    style={{ top: `var(--sheet-top)` }}
                >
                    {/* Drag handle */}
                    <div
                        className="photos-sheet__handle-zone"
                        onTouchStart={onDragStart}
                        onMouseDown={onDragStart}
                        role="slider"
                        aria-label="Drag to expand or collapse photo gallery"
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-valuenow={Math.round(100 - sheetTop)}
                        tabIndex={0}
                    >
                        <div className="photos-sheet__handle" />
                    </div>

                    {/* Sheet header */}
                    <div className="photos-sheet__header">
                        <div>
                            <h2 className="photos-sheet__heading">Wedding Photography</h2>
                            <p className="photos-sheet__count">
                                {isLoading ? '...' : `${filteredPhotos.length} photographs`}
                            </p>
                        </div>
                    </div>

                    {/* Mobile Search Bar */}
                    <div className="photos-search-mobile">
                        <svg className="photos-search-mobile__icon" width="15" height="15" viewBox="0 0 24 24"
                            fill="none" stroke="currentColor" strokeWidth="1.75"
                            strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="11" cy="11" r="8" />
                            <line x1="21" y1="21" x2="16.65" y2="16.65" />
                        </svg>
                        <input
                            type="search"
                            className="photos-search-mobile__input"
                            placeholder="Search by couple, location, or tag..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            aria-label="Search photographs"
                        />
                        {searchQuery && (
                            <button
                                type="button"
                                className="photos-search-mobile__clear"
                                onClick={() => setSearchQuery('')}
                                aria-label="Clear search"
                            >
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
                                    stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <line x1="18" y1="6" x2="6" y2="18" />
                                    <line x1="6" y1="6" x2="18" y2="18" />
                                </svg>
                            </button>
                        )}
                    </div>

                    {/* Mobile Horizontal Tag Filter Rail */}
                    <div className="photos-tags-mobile" role="group" aria-label="Filter photographs by ceremony">
                        <div className="photos-tags-mobile__scroll">
                            <button
                                type="button"
                                onClick={showAll}
                                className={`photos-tag ${selectedTag === null ? 'photos-tag--active' : ''}`}
                                aria-pressed={selectedTag === null}
                            >
                                All
                            </button>
                            {tags.map((t) => (
                                <button
                                    key={t}
                                    type="button"
                                    onClick={() => handleTagSelect(t)}
                                    className={`photos-tag ${selectedTag === t ? 'photos-tag--active' : ''}`}
                                    aria-pressed={selectedTag === t}
                                >
                                    {t}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Mobile 2-Column Pinterest Waterfall */}
                    <div className="photos-mobile-feed">
                        {isLoading ? (
                            <div className="photos-masonry">
                                {[0, 1].map((c) => (
                                    <div key={c} className="photos-masonry__col">
                                        {[260, 180, 240].map((h, idx) => (
                                            <div
                                                key={idx}
                                                className="rounded-xl bg-ground-sunk animate-pulse"
                                                style={{ height: `${h}px` }}
                                            />
                                        ))}
                                    </div>
                                ))}
                            </div>
                        ) : filteredPhotos.length > 0 ? (
                            <div className="photos-masonry">
                                {mobileColumns.map((colPhotos, colIdx) => (
                                    <div key={colIdx} className="photos-masonry__col">
                                        {colPhotos.map((photo) => (
                                            <PhotoCard
                                                key={photo._id}
                                                photo={photo}
                                                isLiked={Boolean(likedPhotos[photo._id])}
                                                onToggleLike={(e) => toggleLike(e, photo._id)}
                                            />
                                        ))}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="photos-empty">
                                <p className="photos-empty__text">No photographs match your search.</p>
                                <button
                                    type="button"
                                    onClick={() => { setSearchQuery(''); showAll(); }}
                                    className="photos-empty__reset"
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
   LUXURY PHOTO CARD COMPONENT
   ═══════════════════════════════════════════════════════════════════════════ */
function PhotoCard({ photo, isLiked, onToggleLike }) {
    const [isLoaded, setIsLoaded] = useState(false);

    // Max 3 tags as requested
    const visibleTags = (photo.tags || []).slice(0, 3);

    // Natural aspect ratio clamped between 0.6 and 1.6
    const rawRatio = Number(photo.aspectRatio) || 1;
    const clampedRatio = Math.max(0.6, Math.min(1.6, rawRatio));

    // Couple Name & Location string
    const coupleText = photo.clientName?.Bride && photo.clientName?.Groom
        ? `${photo.clientName.Bride} & ${photo.clientName.Groom}`
        : photo.clientName?.Bride || photo.clientName?.Groom || '';

    const locationCity = photo.photoLocation?.city || '';

    return (
        <Link
            href={`/photos/${photo._id}`}
            className="photo-card"
            style={{
                backgroundColor: photo.dominantColor || 'var(--ground-sunk)'
            }}
        >
            <div
                className="photo-card__media-wrap"
                style={{ aspectRatio: `${clampedRatio}` }}
            >
                {/* Blurhash Placeholder */}
                {photo.blurDataURL && (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                        src={photo.blurDataURL}
                        alt=""
                        aria-hidden="true"
                        className={`photo-card__blur-placeholder ${isLoaded ? 'photo-card__blur-placeholder--hidden' : ''}`}
                    />
                )}

                {/* High-res Image */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                    src={photo.url}
                    alt={coupleText ? `${coupleText} wedding photograph` : 'Indian wedding photograph'}
                    className={`photo-card__img ${isLoaded ? 'photo-card__img--loaded' : ''}`}
                    loading="lazy"
                    decoding="async"
                    onLoad={() => setIsLoaded(true)}
                />

                {/* Scrim gradient on hover */}
                <div className="photo-card__scrim" aria-hidden="true" />

                {/* Client / Location Badge on hover */}
                {(coupleText || locationCity) && (
                    <div className="photo-card__meta">
                        <span className="photo-card__client-badge">
                            {coupleText} {locationCity ? `• ${locationCity}` : ''}
                        </span>
                    </div>
                )}

                {/* Max 3 Tags Floating on the Card */}
                {visibleTags.length > 0 && (
                    <div className="photo-card__tags">
                        {visibleTags.map((tag, idx) => (
                            <span key={idx} className="photo-card__tag-pill">
                                {tag}
                            </span>
                        ))}
                    </div>
                )}

                {/* Interactive Heart / Save Button */}
                <button
                    type="button"
                    onClick={onToggleLike}
                    className={`photo-card__heart-btn ${isLiked ? 'photo-card__heart-btn--liked' : ''}`}
                    aria-label={isLiked ? 'Unlike photo' : 'Like photo'}
                >
                    <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill={isLiked ? 'currentColor' : 'none'}
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                    </svg>
                </button>
            </div>
        </Link>
    );
}
