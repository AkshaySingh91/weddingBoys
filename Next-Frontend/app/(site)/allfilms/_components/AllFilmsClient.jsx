'use client';

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import Link from 'next/link';
import { createPortal } from 'react-dom';
import './allfilms.css';

const api_url = typeof window !== 'undefined'
    ? (window.location.hostname === 'localhost' ? (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080') : '')
    : (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080');

/* ── Primary Curated Quick Category Pills ── */
const DEFAULT_QUICK_TAGS = [
    'Wedding',
    'Pre-Wedding',
    'Haldi',
    'Mehendi',
    'Sangeet',
    'Reception',
    'Palace Wedding',
    'Beach',
    'Classic',
    'North India',
];

/*
 * `composition` — Admin › Content › All films, resolved on the server by
 * page.jsx: { facets: [{ key, label, tags: [{ label, slug }] }], sort, pageSize }.
 * It decides which filter groups appear (in order) and the starting page size;
 * null (CMS unreachable) falls back to every category from /api/get-all-tags.
 */
const facetsToGroups = (facets) => (facets || []).map((f) => ({ tagType: f.label, tags: (f.tags || []).map((t) => t.label) }));

export default function AllFilmsClient({ composition = null, initialTag = null, initialPage = 1, initialLimit = null } = {}) {
    const [videos, setVideos] = useState([]);
    const [allTagGroups, setAllTagGroups] = useState(() => facetsToGroups(composition?.facets));
    const [currentPage, setCurrentPage] = useState(initialPage);
    const [totalPages, setTotalPages] = useState(1);
    const [totalFilms, setTotalFilms] = useState(0);
    const [limit, setLimit] = useState(initialLimit || composition?.pageSize || 12);
    const composedSort = composition?.sort || null;
    const [isLoading, setIsLoading] = useState(true);

    /* ── Filter States ── */
    const [selectedQuickTag, setSelectedQuickTag] = useState(initialTag);
    const requestRef = useRef(null);
    const [requestError, setRequestError] = useState('');
    const [facetFilters, setFacetFilters] = useState({});
    const [searchQuery, setSearchQuery] = useState('');
    const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);

    /* ── Hydration-safe client detection for Portal ── */
    const isMounted = React.useSyncExternalStore(
        () => () => {},
        () => true,
        () => false
    );

    /* ── Lock Body Scroll when Modal is Open ── */
    useEffect(() => {
        if (isFilterModalOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [isFilterModalOpen]);

    /* ── Close Modal on Escape Key ── */
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape' && isFilterModalOpen) {
                setIsFilterModalOpen(false);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isFilterModalOpen]);

    /* ── Fetch All Tag Groups from Backend ── */
    useEffect(() => {
        if (composition?.facets?.length) return; // chosen in the CMS, resolved on the server
        const fetchAllTags = async () => {
            try {
                const res = await fetch(`${api_url}/api/get-all-tags`);
                const data = await res.json();
                if (data.allTags && data.allTags.length > 0) {
                    setAllTagGroups(data.allTags);
                }
            } catch (err) {
                console.warn('Failed to load facet tag groups, using defaults', err);
            }
        };
        fetchAllTags();
    }, [composition]);

    /* ── Active Facet Filter Count ── */
    const activeFacetCount = useMemo(() => {
        let count = 0;
        for (const key in facetFilters) {
            if (facetFilters[key]) count++;
        }
        if (selectedQuickTag) count++;
        return count;
    }, [facetFilters, selectedQuickTag]);

    /* ── Fetch Videos from Backend with Pagination ── */
    const fetchVideos = useCallback(async (
        targetPage = currentPage,
        quickTag = selectedQuickTag,
        facets = facetFilters,
        currentLimit = limit
    ) => {
        requestRef.current?.abort();
        const controller = new AbortController();
        requestRef.current = controller;
        try {
            setIsLoading(true);
            setRequestError('');

            // Build comma-separated query of active tags
            const activeTags = [];
            if (quickTag) activeTags.push(quickTag);
            for (const key in facets) {
                if (facets[key] && !activeTags.includes(facets[key])) {
                    activeTags.push(facets[key]);
                }
            }
            const tagQuery = activeTags.join(',');

            let url = `${api_url}/api/videos?page=${targetPage}&limit=${currentLimit}`;
            // The order chosen in the CMS (newest shoot, newest published, featured).
            if (composedSort) url += `&sort=${composedSort}`;
            if (tagQuery) {
                url += `&tag=${encodeURIComponent(tagQuery)}`;
            }

            const res = await fetch(url, { signal: controller.signal });
            if (!res.ok) throw new Error('Films could not be loaded. Please try again.');
            const data = await res.json();
            if (controller.signal.aborted) return;
            const newVideos = data.client || [];
            const total = data.total ?? data.pagination?.total ?? newVideos.length;
            const computedTotalPages = data.totalPages ?? data.pagination?.totalPages ?? Math.max(1, Math.ceil(total / currentLimit));

            setVideos(newVideos);
            setTotalFilms(total);
            setTotalPages(computedTotalPages);
            setCurrentPage(targetPage);
        } catch (error) {
            if (controller.signal.aborted) return;
            setRequestError(error.message);
            setVideos([]);
            setTotalFilms(0);
            setTotalPages(1);
        } finally {
            if (!controller.signal.aborted) setIsLoading(false);
        }
    }, [currentPage, limit, selectedQuickTag, facetFilters, composedSort]);

    // Initial load
    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        fetchVideos();
        return () => requestRef.current?.abort();
    }, [fetchVideos]);

    /* ── Scroll Smoothly to Top of Grid ── */
    const scrollToGridTop = () => {
        const gridEl = document.getElementById('films-grid');
        if (gridEl) {
            const yOffset = -90;
            const y = gridEl.getBoundingClientRect().top + window.pageYOffset + yOffset;
            window.scrollTo({ top: Math.max(0, y), behavior: 'smooth' });
        }
    };

    /* ── Page Navigation Handler ── */
    const handlePageChange = (newPage) => {
        if (newPage === currentPage || newPage < 1 || newPage > totalPages) return;
        setCurrentPage(newPage);
        scrollToGridTop();
    };

    /* ── Items Per Page Change Handler ── */
    const handleLimitChange = (newLimit) => {
        if (newLimit === limit) return;
        setLimit(newLimit);
        setCurrentPage(1);
        scrollToGridTop();
    };

    /* ── Quick Tag Filter Handler ── */
    const handleQuickTagSelect = (tag) => {
        setSelectedQuickTag(selectedQuickTag === tag ? null : tag);
        setCurrentPage(1);
    };

    /* ── Facet Filter Chip Handler ── */
    const handleFacetSelect = (tagType, tagValue) => {
        const nextFacets = { ...facetFilters };
        if (nextFacets[tagType] === tagValue) {
            delete nextFacets[tagType];
        } else {
            nextFacets[tagType] = tagValue;
        }
        setFacetFilters(nextFacets);
        setCurrentPage(1);
    };

    /* ── Reset All Filters ── */
    const handleResetAll = () => {
        setSelectedQuickTag(null);
        setFacetFilters({});
        setSearchQuery('');
        setCurrentPage(1);
    };

    useEffect(() => {
        const url = new URL(window.location.href);
        const active = [selectedQuickTag, ...Object.values(facetFilters)].filter(Boolean);
        if (active.length) url.searchParams.set('tag', [...new Set(active)].join(','));
        else url.searchParams.delete('tag');
        if (currentPage > 1) url.searchParams.set('page', String(currentPage));
        else url.searchParams.delete('page');
        url.searchParams.set('limit', String(limit));
        window.history.replaceState(null, '', url);
    }, [selectedQuickTag, facetFilters, currentPage, limit]);

    /* ── Live Search Filtering (Client-side within loaded page batch) ── */
    const filteredVideos = useMemo(() => {
        if (!searchQuery.trim()) return videos;
        const q = searchQuery.toLowerCase().trim();
        return videos.filter(video => {
            const bride = (video.clientName?.Bride || '').toLowerCase();
            const groom = (video.clientName?.Groom || '').toLowerCase();
            const city = (video.videos?.videoLocation?.city || '').toLowerCase();
            const state = (video.videos?.videoLocation?.state || '').toLowerCase();
            const matchTag = (video.videos?.tags || []).some(t => t.toLowerCase().includes(q));
            return bride.includes(q) || groom.includes(q) || city.includes(q) || state.includes(q) || matchTag;
        });
    }, [videos, searchQuery]);

    const startItem = totalFilms === 0 ? 0 : (currentPage - 1) * limit + 1;
    const endItem = Math.min(currentPage * limit, totalFilms);

    return (
        <div className="allfilms-page">
            <h1 className="sr-only">Browse all wedding films</h1>
            {requestError && <p role="alert" className="p-4 text-state-error">{requestError} <button type="button" onClick={() => fetchVideos()} className="underline">Retry</button></p>}

            {/* ── Sticky Horizon Controls Bar ── */}
            <div className="af-controls-bar">
                <div className="af-controls">
                    {/* Quick Category Tag Pills */}
                    <div className="af-controls__tags" role="group" aria-label="Filter films by ceremony">
                        <button
                            type="button"
                            onClick={handleResetAll}
                            className={`af-tag ${selectedQuickTag === null && Object.keys(facetFilters).length === 0 ? 'af-tag--active' : ''}`}
                            aria-pressed={selectedQuickTag === null && Object.keys(facetFilters).length === 0}
                        >
                            All Films
                        </button>
                        {DEFAULT_QUICK_TAGS.map((tag) => (
                            <button
                                key={tag}
                                type="button"
                                onClick={() => handleQuickTagSelect(tag)}
                                className={`af-tag ${selectedQuickTag === tag ? 'af-tag--active' : ''}`}
                                aria-pressed={selectedQuickTag === tag}
                            >
                                {tag}
                            </button>
                        ))}
                    </div>

                    {/* Right Actions: Search + Filter Modal Button */}
                    <div className="af-controls__actions">
                        {/* Search Input */}
                        <div className="af-search">
                            <svg className="af-search__icon" width="15" height="15" viewBox="0 0 24 24"
                                 fill="none" stroke="currentColor" strokeWidth="1.75"
                                 strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="11" cy="11" r="8" />
                                <line x1="21" y1="21" x2="16.65" y2="16.65" />
                            </svg>
                            <input
                                type="search"
                                className="af-search__input"
                                placeholder="Search couple, city, tag..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                aria-label="Search wedding films"
                            />
                            {searchQuery && (
                                <button
                                    type="button"
                                    className="af-search__clear"
                                    onClick={() => setSearchQuery('')}
                                    aria-label="Clear search"
                                >
                                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none"
                                         stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                        <line x1="18" y1="6" x2="6" y2="18" />
                                        <line x1="6" y1="6" x2="18" y2="18" />
                                    </svg>
                                </button>
                            )}
                        </div>

                        {/* Filter Button (Opens Modal on Desktop & Bottom Sheet on Mobile) */}
                        <button
                            type="button"
                            onClick={() => setIsFilterModalOpen(true)}
                            className={`af-filter-btn ${activeFacetCount > 0 ? 'af-filter-btn--active' : ''}`}
                            aria-haspopup="dialog"
                            aria-expanded={isFilterModalOpen}
                            aria-label="Open filter options"
                        >
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
                                 stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
                            </svg>
                            <span>Filter By</span>
                            {activeFacetCount > 0 && (
                                <span className="af-filter-btn__badge">{activeFacetCount}</span>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* ── Main Film Archive Grid ── */}
            <main className="af-grid-wrapper" id="films-grid">
                <div className="af-grid-header">
                    <p className="af-grid-count">
                        {isLoading
                            ? 'Loading wedding films...'
                            : totalFilms > 0
                                ? `Showing ${startItem}–${endItem} of ${totalFilms} film${totalFilms === 1 ? '' : 's'}`
                                : '0 films found'}
                    </p>

                    {totalPages > 1 && (
                        <div className="af-grid-page-indicator">
                            Page {currentPage} of {totalPages}
                        </div>
                    )}
                </div>

                {isLoading ? (
                    <div className="af-grid">
                        {Array.from({ length: Math.min(limit, 6) }).map((_, i) => (
                            <div key={i} className="rounded-2xl bg-ground-sunk animate-pulse" style={{ height: '360px' }} />
                        ))}
                    </div>
                ) : filteredVideos.length > 0 ? (
                    <>
                        <div className="af-grid">
                            {filteredVideos.map((clientDetail, idx) => (
                                <FilmArchiveCard
                                    key={clientDetail.videos?._id || clientDetail._id || idx}
                                    clientDetail={clientDetail}
                                />
                            ))}
                        </div>

                        {/* ── Pagination Controls ── */}
                        <FilmPagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            totalFilms={totalFilms}
                            limit={limit}
                            onPageChange={handlePageChange}
                            onLimitChange={handleLimitChange}
                        />
                    </>
                ) : (
                    <div className="af-empty">
                        <div className="af-empty__icon">
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none"
                                 stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                <polygon points="23 7 16 12 23 17 23 7" />
                                <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
                            </svg>
                        </div>
                        <h2 className="af-empty__title">No Films Found</h2>
                        <p className="af-empty__text">
                            We couldn&apos;t find any wedding films matching your current filter selection. Try removing a tag or resetting filters.
                        </p>
                        <button
                            type="button"
                            onClick={handleResetAll}
                            className="af-empty__reset"
                        >
                            Reset all filters
                        </button>
                    </div>
                )}
            </main>

            {/* ═══════════════════════════════════════════════════════════════
                FILTER MODAL (Desktop Dialog / Mobile Bottom Sheet)
                Zero UI shifting & portalled directly to document.body!
                ═══════════════════════════════════════════════════════════════ */}
            {isFilterModalOpen && isMounted && typeof document !== 'undefined' && createPortal(
                <>
                    {/* Backdrop Overlay */}
                    <div
                        className="af-modal-backdrop"
                        onClick={() => setIsFilterModalOpen(false)}
                        aria-hidden="true"
                    />

                    {/* Modal Dialog Wrapper */}
                    <div
                        className="af-modal-wrapper"
                        role="dialog"
                        aria-modal="true"
                        aria-label="Filter Wedding Films"
                    >
                        <div className="af-modal">
                            {/* Mobile Drag Handle Bar */}
                            <div className="af-modal__handle-bar" aria-hidden="true" />

                            {/* Header */}
                            <div className="af-modal__header">
                                <div className="af-modal__title-group">
                                    <h2 className="af-modal__title">Filter Films</h2>
                                    {activeFacetCount > 0 && (
                                        <span className="af-modal__active-count">
                                            {activeFacetCount} active
                                        </span>
                                    )}
                                </div>
                                <button
                                    type="button"
                                    className="af-modal__close-btn"
                                    onClick={() => setIsFilterModalOpen(false)}
                                    aria-label="Close filter modal"
                                >
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                                         stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                        <line x1="18" y1="6" x2="6" y2="18" />
                                        <line x1="6" y1="6" x2="18" y2="18" />
                                    </svg>
                                </button>
                            </div>

                            {/* Body: Multi-Facet Categories */}
                            <div className="af-modal__body">
                                {allTagGroups.map((group) => (
                                    <div key={group.tagType} className="af-modal__group">
                                        <span className="af-modal__group-label">{group.tagType}</span>
                                        <div className="af-modal__chips">
                                            {group.tags.map((tag) => {
                                                const isActive = facetFilters[group.tagType] === tag || selectedQuickTag === tag;
                                                return (
                                                    <button
                                                        key={tag}
                                                        type="button"
                                                        onClick={() => handleFacetSelect(group.tagType, tag)}
                                                        className={`af-modal__chip ${isActive ? 'af-modal__chip--active' : ''}`}
                                                        aria-pressed={isActive}
                                                    >
                                                        {tag}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Footer */}
                            <div className="af-modal__footer">
                                <button
                                    type="button"
                                    onClick={handleResetAll}
                                    className="af-modal__reset-btn"
                                >
                                    Reset all
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setIsFilterModalOpen(false)}
                                    className="af-modal__apply-btn"
                                >
                                    Show {totalFilms} Film{totalFilms === 1 ? '' : 's'}
                                </button>
                            </div>
                        </div>
                    </div>
                </>,
                document.body
            )}
        </div>
    );
}


/* ═══════════════════════════════════════════════════════════════════════════
   PAGINATION CONTROLS COMPONENT
   ═══════════════════════════════════════════════════════════════════════════ */
function FilmPagination({ currentPage, totalPages, totalFilms, limit, onPageChange, onLimitChange }) {
    // Generate page numbers with smart ellipsis
    const getPageNumbers = () => {
        if (totalPages <= 7) {
            return Array.from({ length: totalPages }, (_, i) => i + 1);
        }
        if (currentPage <= 4) {
            return [1, 2, 3, 4, 5, '...', totalPages];
        }
        if (currentPage >= totalPages - 3) {
            return [1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
        }
        return [1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages];
    };

    const pages = getPageNumbers();
    const startItem = totalFilms === 0 ? 0 : (currentPage - 1) * limit + 1;
    const endItem = Math.min(currentPage * limit, totalFilms);

    return (
        <nav className="af-pagination" aria-label="Wedding films pagination">
            <div className="af-pagination__info">
                <span className="af-pagination__count-text">
                    Showing <strong>{startItem}–{endItem}</strong> of <strong>{totalFilms}</strong> film{totalFilms === 1 ? '' : 's'}
                </span>
                <div className="af-pagination__limit-wrap">
                    <span className="af-pagination__limit-label">Per page:</span>
                    {[12, 18, 24].map((count) => (
                        <button
                            key={count}
                            type="button"
                            onClick={() => onLimitChange(count)}
                            className={`af-pagination__limit-btn ${limit === count ? 'af-pagination__limit-btn--active' : ''}`}
                            aria-pressed={limit === count}
                        >
                            {count}
                        </button>
                    ))}
                </div>
            </div>

            {totalPages > 1 && (
                <div className="af-pagination__controls">
                    <button
                        type="button"
                        onClick={() => onPageChange(currentPage - 1)}
                        disabled={currentPage <= 1}
                        className="af-page-nav af-page-nav--prev"
                        aria-label="Previous page"
                    >
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="15 18 9 12 15 6" />
                        </svg>
                        <span>Previous</span>
                    </button>

                    <div className="af-page-numbers">
                        {pages.map((p, idx) => {
                            if (p === '...') {
                                return (
                                    <span key={`ellipsis-${idx}`} className="af-page-ellipsis" aria-hidden="true">
                                        &hellip;
                                    </span>
                                );
                            }
                            const isCurrent = p === currentPage;
                            return (
                                <button
                                    key={p}
                                    type="button"
                                    onClick={() => onPageChange(p)}
                                    className={`af-page-btn ${isCurrent ? 'af-page-btn--active' : ''}`}
                                    aria-current={isCurrent ? 'page' : undefined}
                                    aria-label={`Page ${p}`}
                                >
                                    {p}
                                </button>
                            );
                        })}
                    </div>

                    <button
                        type="button"
                        onClick={() => onPageChange(currentPage + 1)}
                        disabled={currentPage >= totalPages}
                        className="af-page-nav af-page-nav--next"
                        aria-label="Next page"
                    >
                        <span>Next</span>
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="9 18 15 12 9 6" />
                        </svg>
                    </button>
                </div>
            )}
        </nav>
    );
}


/* ═══════════════════════════════════════════════════════════════════════════
   LUXURY FILM ARCHIVE CARD COMPONENT
   ═══════════════════════════════════════════════════════════════════════════ */
function FilmArchiveCard({ clientDetail }) {
    const videoRef = useRef(null);
    const [isVideoPlaying, setIsVideoPlaying] = useState(false);

    const bride = clientDetail.clientName?.Bride || '';
    const groom = clientDetail.clientName?.Groom || '';
    const coupleName = [bride, groom].filter(Boolean).join(' & ') || 'Wedding Celebration';

    const date = clientDetail.videos?.videoShootDate || '';
    const city = clientDetail.videos?.videoLocation?.city || '';
    const state = clientDetail.videos?.videoLocation?.state || '';
    const locationText = [city, state].filter(Boolean).join(', ') || city;
    const metaTop = [date, locationText].filter(Boolean).join(' · ');

    const tags = (clientDetail.videos?.tags || []).slice(0, 3);
    const videoId = clientDetail.videos?._id || clientDetail._id;

    /* Handle Video Hover Preview */
    const handleMouseEnter = () => {
        if (clientDetail.loopUrl && videoRef.current) {
            videoRef.current.currentTime = 0;
            const playPromise = videoRef.current.play();
            if (playPromise !== undefined) {
                playPromise
                    .then(() => setIsVideoPlaying(true))
                    .catch(() => setIsVideoPlaying(false));
            }
        }
    };

    const handleMouseLeave = () => {
        if (videoRef.current) {
            videoRef.current.pause();
            setIsVideoPlaying(false);
        }
    };

    return (
        <Link
            href={`/films/${videoId}`}
            className="af-card"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            <div className="af-card__media">
                {/* High-res Poster Thumbnail */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                    src={clientDetail.thumbnailUrl}
                    alt={`${coupleName} Wedding Film`}
                    className="af-card__img"
                    loading="lazy"
                    decoding="async"
                />

                {/* Looping Video Preview on Hover (Netflix-style) */}
                {clientDetail.loopUrl && (
                    <video
                        ref={videoRef}
                        src={clientDetail.loopUrl}
                        muted
                        playsInline
                        loop
                        preload="none"
                        className={`af-card__video ${isVideoPlaying ? 'af-card__video--active' : ''}`}
                    />
                )}

                {/* Scrim gradient overlay */}
                <div className="af-card__scrim" aria-hidden="true" />

                {/* Top Badge: Date & Location */}
                {metaTop && (
                    <div className="af-card__top">
                        <span className="af-card__meta-pill">{metaTop}</span>
                    </div>
                )}

                {/* Play Button Overlay */}
                <div className="af-card__play" aria-hidden="true">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                        <polygon points="5 3 19 12 5 21 5 3" />
                    </svg>
                </div>
            </div>

            {/* Card Body */}
            <div className="af-card__body">
                <h3 className="af-card__couple">{coupleName}</h3>

                {/* Tag Pills (Max 3) */}
                {tags.length > 0 && (
                    <div className="af-card__tags">
                        {tags.map((tag, idx) => (
                            <span key={idx} className="af-card__tag-pill">
                                {tag}
                            </span>
                        ))}
                    </div>
                )}
            </div>
        </Link>
    );
}
