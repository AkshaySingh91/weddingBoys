'use client';

import React, { useRef } from 'react';
import Link from 'next/link';

export default function SimilarPhotosRail({
    recommendations = [],
    currentPhoto = null,
    likedPhotos = new Set(),
    onToggleLikePhoto,
}) {
    const railRef = useRef(null);

    // State 9: Hide section completely if no similar photos exist!
    if (!recommendations || recommendations.length === 0) {
        return null;
    }

    const scrollRail = (direction) => {
        if (!railRef.current) return;
        const scrollAmount = 320;
        railRef.current.scrollBy({
            left: direction === 'left' ? -scrollAmount : scrollAmount,
            behavior: 'smooth',
        });
    };

    // Subtitle based on current photo ceremony/tag
    const tagContext = currentPhoto?.eventGroup || currentPhoto?.tags?.[0] || 'wedding';
    const subtitle = `More beautiful ${tagContext.toLowerCase()} moments from other weddings.`;

    return (
        <section className="pd-similar-band" aria-label="Similar wedding photographs">
            <div className="pd-container">
                <div className="pd-section-header">
                    <div className="pd-section-title-wrap">
                        <h2 className="pd-section-heading">Similar Photos (Recommended)</h2>
                        <p className="pd-section-subtitle">{subtitle}</p>
                    </div>

                    <Link href="/photos" className="pd-section-link">
                        <span>View more similar photos</span>
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="5" y1="12" x2="19" y2="12" />
                            <polyline points="12 5 19 12 12 19" />
                        </svg>
                    </Link>
                </div>

            <div className="pd-similar-track-wrap">
                {/* Left / Right Navigation Chevrons */}
                {recommendations.length > 3 && (
                    <>
                        <button
                            type="button"
                            className="pd-rail-chevron prev"
                            onClick={() => scrollRail('left')}
                            aria-label="Previous similar photos"
                        >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="15 18 9 12 15 6" />
                            </svg>
                        </button>
                        <button
                            type="button"
                            className="pd-rail-chevron next"
                            onClick={() => scrollRail('right')}
                            aria-label="Next similar photos"
                        >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="9 18 15 12 9 6" />
                            </svg>
                        </button>
                    </>
                )}

                {/* Horizontal Scrolling Rail */}
                <div className="pd-similar-rail" ref={railRef}>
                    {recommendations.map((item) => {
                        const isLiked = likedPhotos.has(item._id);
                        const bride = item.clientName?.Bride;
                        const groom = item.clientName?.Groom;
                        const cardTitle = bride && groom ? `${bride} & ${groom}` : (item.title || 'Wedding Celebration');
                        const city = item.photoLocation?.city || '';
                        const date = item.photoShootDate || '';
                        const metaLine = [city, date].filter(Boolean).join(' · ');
                        const visibleTags = (item.tags || []).slice(0, 2);

                        return (
                            <Link
                                key={item._id}
                                href={`/photos/${item._id}`}
                                className="pd-similar-card"
                            >
                                <div className="pd-similar-card__img-wrap">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                        src={item.url}
                                        alt={cardTitle}
                                        className="pd-similar-card__img"
                                        loading="lazy"
                                    />
                                    <button
                                        type="button"
                                        className={`pd-similar-card__heart-btn ${isLiked ? 'liked' : ''}`}
                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            onToggleLikePhoto?.(item._id);
                                        }}
                                        aria-label={isLiked ? 'Unlike photo' : 'Like photo'}
                                    >
                                        <svg width="15" height="15" viewBox="0 0 24 24" fill={isLiked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                                        </svg>
                                    </button>
                                </div>

                                <div className="pd-similar-card__body">
                                    <span className="pd-similar-card__title">{cardTitle}</span>
                                    {metaLine && <span className="pd-similar-card__meta">{metaLine}</span>}
                                    {visibleTags.length > 0 && (
                                        <div className="pd-similar-card__tags">
                                            {visibleTags.map((t, idx) => (
                                                <span key={idx} className="pd-similar-card__tag-pill">{t}</span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </Link>
                        );
                    })}
                </div>
            </div>
            </div>
        </section>
    );
}
