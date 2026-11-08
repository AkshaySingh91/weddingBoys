'use client';

import React, { useMemo } from 'react';

export default function PhotoHeroShowcase({
    currentPhoto,
    photosList = [],
    onSelectPhoto,
    onOpenLightbox,
}) {
    const currentIndex = useMemo(() => {
        if (!currentPhoto || !photosList.length) return 0;
        const idx = photosList.findIndex(p => String(p._id) === String(currentPhoto._id));
        return idx >= 0 ? idx : 0;
    }, [currentPhoto, photosList]);

    const hasSiblings = photosList.length > 1;

    const handlePrev = (e) => {
        e.stopPropagation();
        if (!hasSiblings) return;
        const prevIdx = (currentIndex - 1 + photosList.length) % photosList.length;
        onSelectPhoto?.(photosList[prevIdx]);
    };

    const handleNext = (e) => {
        e.stopPropagation();
        if (!hasSiblings) return;
        const nextIdx = (currentIndex + 1) % photosList.length;
        onSelectPhoto?.(photosList[nextIdx]);
    };

    // Determine adaptive frame class based on aspect ratio (States 11 & 12)
    const frameAspectClass = useMemo(() => {
        const ar = currentPhoto?.aspectRatio;
        if (!ar) return 'pd-showcase-frame--landscape';
        if (ar >= 1.2) return 'pd-showcase-frame--landscape';
        if (ar <= 0.95) return 'pd-showcase-frame--portrait';
        return 'pd-showcase-frame--square';
    }, [currentPhoto?.aspectRatio]);

    if (!currentPhoto) return null;

    return (
        <div className="pd-showcase-column">
            {/* Main Showcase Frame */}
            <div
                className={`pd-showcase-frame ${frameAspectClass}`}
                onClick={() => onOpenLightbox?.()}
                role="button"
                tabIndex={0}
                aria-label="Open full screen photograph"
                onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        onOpenLightbox?.();
                    }
                }}
            >
                {/* Ambient Blurred Background (YouTube-style ambient backdrop for portrait / narrow images) */}
                <div className="pd-showcase-ambient-wrap" aria-hidden="true">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        src={currentPhoto.url}
                        alt=""
                        className="pd-showcase-ambient-img"
                        loading="eager"
                    />
                    <div className="pd-showcase-ambient-overlay" />
                </div>

                {/* Main Foreground Image (100% sharp, contained) */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                    src={currentPhoto.url}
                    alt={currentPhoto.title || 'Wedding Photograph'}
                    className="pd-showcase-img"
                    loading="eager"
                />

                {/* Left / Right Chevron Overlay (only if multiple photos exist) */}
                {hasSiblings && (
                    <>
                        <button
                            type="button"
                            className="pd-showcase-nav-btn prev"
                            onClick={handlePrev}
                            aria-label="Previous photograph"
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="15 18 9 12 15 6" />
                            </svg>
                        </button>
                        <button
                            type="button"
                            className="pd-showcase-nav-btn next"
                            onClick={handleNext}
                            aria-label="Next photograph"
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="9 18 15 12 9 6" />
                            </svg>
                        </button>
                    </>
                )}

                {/* Fullscreen Expand Icon */}
                <button
                    type="button"
                    className="pd-showcase-fullscreen-btn"
                    onClick={(e) => {
                        e.stopPropagation();
                        onOpenLightbox?.();
                    }}
                    aria-label="View full screen"
                    title="View full screen"
                >
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="15 3 21 3 21 9" />
                        <polyline points="9 21 3 21 3 15" />
                        <line x1="21" y1="3" x2="14" y2="10" />
                        <line x1="3" y1="21" x2="10" y2="14" />
                    </svg>
                </button>
            </div>

            {/* Thumbnail Strip Below Showcase (States 1 & 7: completely hidden if single photo) */}
            {hasSiblings && (
                <div className="pd-thumbnail-strip" aria-label="Client photo thumbnails">
                    {photosList.map((photo) => {
                        const isSelected = String(photo._id) === String(currentPhoto._id);
                        return (
                            <button
                                key={photo._id}
                                type="button"
                                className={`pd-thumb-btn ${isSelected ? 'active' : ''}`}
                                onClick={() => onSelectPhoto?.(photo)}
                                aria-label={`View photo ${photo.title || ''}`}
                                aria-current={isSelected ? 'true' : undefined}
                            >
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                    src={photo.url}
                                    alt=""
                                    className="pd-thumb-img"
                                    loading="lazy"
                                />
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
