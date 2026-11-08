'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';

export default function ClientCeremonyGallery({
    clientPhotos = [],
    ceremonies = [],
    clientName = {},
    wedding = null,
    currentPhoto = null,
    onSelectPhoto,
}) {
    // Total other client photos
    const totalPhotos = clientPhotos.length;

    // States 1 & 7: If client has only 1 photo or no other photos, hide client gallery completely!

    const coupleText = useMemo(() => {
        const bride = clientName?.Bride?.trim();
        const groom = clientName?.Groom?.trim();
        if (bride && groom) return `${bride} & ${groom}`;
        return bride || groom || 'this client';
    }, [clientName]);

    // Active ceremony of current photo (for State 6 default active selection)
    const currentCeremony = currentPhoto?.eventGroup?.trim() || '';

    // Calculate unique ceremony groups present in client photos
    const computedCeremonies = useMemo(() => {
        if (ceremonies && ceremonies.length > 0) return ceremonies;

        // Fallback computation from clientPhotos
        const map = new Map();
        for (const p of clientPhotos) {
            const grp = p.eventGroup?.trim() || '';
            if (grp) {
                if (!map.has(grp)) {
                    map.set(grp, {
                        name: grp,
                        count: 0,
                        coverUrl: p.url,
                        previewPhotos: [],
                    });
                }
                const entry = map.get(grp);
                entry.count++;
                if (entry.previewPhotos.length < 5) {
                    entry.previewPhotos.push({
                        _id: String(p._id),
                        url: p.url,
                        aspectRatio: p.aspectRatio || 1.5,
                    });
                }
            }
        }
        return Array.from(map.values());
    }, [ceremonies, clientPhotos]);

    // Determine State Type:
    // Has multiple ceremonies?
    const hasMultipleCeremonies = computedCeremonies.length > 1;
    // Has only single ceremony with multiple photos?
    const isSingleCeremony = computedCeremonies.length === 1;
    // Client has photos but zero ceremony metadata (State 10)?
    const hasNoCeremonyMetadata = computedCeremonies.length === 0;

    // Default filter tab:
    // If multiple ceremonies, default to current photo's ceremony if exists, otherwise 'ALL'
    const initialTab = useMemo(() => {
        if (hasMultipleCeremonies) {
            const matchesCurrent = computedCeremonies.some(c => c.name === currentCeremony);
            return matchesCurrent ? currentCeremony : 'ALL';
        }
        if (isSingleCeremony) {
            return computedCeremonies[0].name;
        }
        return 'ALL';
    }, [hasMultipleCeremonies, isSingleCeremony, computedCeremonies, currentCeremony]);

    const [activeTab, setActiveTab] = useState(initialTab);

    // Filter photos based on active tab
    const filteredPhotos = useMemo(() => {
        if (activeTab === 'ALL') {
            return clientPhotos;
        }
        return clientPhotos.filter(p => p.eventGroup === activeTab);
    }, [activeTab, clientPhotos]);

    // Subtitle logic
    const sectionSubtitle = useMemo(() => {
        if (hasMultipleCeremonies && activeTab === 'ALL') {
            return `Different chapters from ${coupleText}'s beautiful wedding.`;
        }
        if (activeTab !== 'ALL') {
            return `More beautiful moments from ${coupleText}'s ${activeTab}.`;
        }
        if (isSingleCeremony) {
            return `More beautiful moments from ${coupleText}'s ${computedCeremonies[0].name}.`;
        }
        return `More photographs from ${coupleText}'s celebration.`;
    }, [hasMultipleCeremonies, activeTab, coupleText, isSingleCeremony, computedCeremonies]);

    // State 14: Curate preview if large gallery (50+ photos)
    const MAX_PREVIEW = 24;
    const isVeryLargeGallery = filteredPhotos.length > MAX_PREVIEW;
    const displayedPhotos = isVeryLargeGallery ? filteredPhotos.slice(0, MAX_PREVIEW) : filteredPhotos;

    // Section title
    const sectionTitle = hasNoCeremonyMetadata
        ? 'More from this client'
        : 'Explore more from this client';

    // If fewer than or equal to 4 photos, use balanced grid to eliminate awkward empty gaps
    const isFewPhotos = displayedPhotos.length <= 4;

    if (totalPhotos <= 1) return null;

    return (
        <section className="pd-client-band" aria-label="Explore more from this client">
            <div className="pd-container">
                {/* Header: Title + Subtitle + View Full Gallery Link */}
                <div className="pd-section-header">
                    <div className="pd-section-title-wrap">
                        <h2 className="pd-section-heading">{sectionTitle}</h2>
                        <p className="pd-section-subtitle">{sectionSubtitle}</p>
                    </div>

                    {wedding?.href && (
                        <Link href={wedding.href} className="pd-section-link">
                            <span>View full gallery</span>
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="5" y1="12" x2="19" y2="12" />
                                <polyline points="12 5 19 12 12 19" />
                            </svg>
                        </Link>
                    )}
                </div>

                {/* Filter Chips / Tabs (States 2, 3, 5, 6 — Never invented if State 10) */}
                {!hasNoCeremonyMetadata && (
                    <div className="pd-filter-tabs" role="tablist" aria-label="Ceremony filters">
                        {hasMultipleCeremonies && (
                            <button
                                type="button"
                                role="tab"
                                aria-selected={activeTab === 'ALL'}
                                className={`pd-filter-pill ${activeTab === 'ALL' ? 'active' : ''}`}
                                onClick={() => setActiveTab('ALL')}
                            >
                                All ({totalPhotos})
                            </button>
                        )}

                        {computedCeremonies.map((c) => {
                            const isActive = activeTab === c.name;
                            return (
                                <button
                                    key={c.name}
                                    type="button"
                                    role="tab"
                                    aria-selected={isActive}
                                    className={`pd-filter-pill ${isActive ? 'active' : ''}`}
                                    onClick={() => setActiveTab(c.name)}
                                >
                                    {c.name} ({c.count})
                                </button>
                            );
                        })}
                    </div>
                )}

                {/* ══════════════════════════════════════════════════════════════
                    LAYOUT SELECTION ENGINE:
                    1. Multi-Ceremony Cards (Image 1):
                       Shown when multiple ceremonies exist AND activeTab === 'ALL'.
                    2. Editorial Masonry Mosaic (Image 2 & 3):
                       Shown when a specific ceremony is active, or single ceremony,
                       or no ceremony metadata.
                    ══════════════════════════════════════════════════════════════ */}
                {hasMultipleCeremonies && activeTab === 'ALL' ? (
                    /* Multi-Ceremony Collection Cards (State 3 / Image 1) */
                    <div className="pd-ceremony-grid">
                        {computedCeremonies.map((ceremony) => {
                            const remainingCount = ceremony.count > 4 ? ceremony.count - 4 : 0;
                            const previewSlice = ceremony.previewPhotos?.slice(0, 4) || [];

                            return (
                                <div
                                    key={ceremony.name}
                                    className="pd-ceremony-card"
                                    onClick={() => setActiveTab(ceremony.name)}
                                    role="button"
                                    tabIndex={0}
                                    aria-label={`View ${ceremony.name} gallery`}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' || e.key === ' ') setActiveTab(ceremony.name);
                                    }}
                                >
                                    {/* Lead Featured Photo with Overlay */}
                                    <div className="pd-ceremony-cover-wrap">
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img
                                            src={ceremony.coverUrl}
                                            alt={ceremony.name}
                                            className="pd-ceremony-cover-img"
                                            loading="lazy"
                                        />
                                        <div className="pd-ceremony-cover-overlay">
                                            <div className="pd-ceremony-cover-meta">
                                                <span className="pd-ceremony-name">{ceremony.name}</span>
                                                <span className="pd-ceremony-count">{ceremony.count} Photos</span>
                                            </div>
                                            <div className="pd-ceremony-arrow-btn" aria-hidden="true">
                                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                    <line x1="5" y1="12" x2="19" y2="12" />
                                                    <polyline points="12 5 19 12 12 19" />
                                                </svg>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Row of Preview Thumbnails with +N Overlay */}
                                    {previewSlice.length > 0 && (
                                        <div className="pd-ceremony-previews">
                                            {previewSlice.map((item, idx) => {
                                                const isLast = idx === 3 && remainingCount > 0;
                                                return (
                                                    <div key={item._id || idx} className="pd-ceremony-preview-item">
                                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                                        <img
                                                            src={item.url}
                                                            alt=""
                                                            className="pd-ceremony-preview-img"
                                                            loading="lazy"
                                                        />
                                                        {isLast && (
                                                            <div className="pd-ceremony-preview-more">
                                                                +{remainingCount}
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    /* Editorial Mosaic Grid (Balanced auto-fit for <= 4, Masonry for > 4) */
                    <div className={isFewPhotos ? "pd-collage-grid--few" : "pd-masonry-collage"}>
                        {displayedPhotos.map((photo) => (
                            <div
                                key={photo._id}
                                className="pd-masonry-item"
                                onClick={() => onSelectPhoto?.(photo)}
                                role="button"
                                tabIndex={0}
                                aria-label={`View photo ${photo.title || ''}`}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' || e.key === ' ') onSelectPhoto?.(photo);
                                }}
                            >
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                    src={photo.url}
                                    alt={photo.title || 'Wedding Photo'}
                                    className="pd-masonry-img"
                                    loading="lazy"
                                />
                                <div className="pd-masonry-overlay">
                                    <span>{photo.eventGroup || photo.title || 'View Photo'}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* State 14: Very Large Gallery Preview CTA */}
                {isVeryLargeGallery && wedding?.href && (
                    <div style={{ textAlign: 'center', marginTop: '36px' }}>
                        <Link href={wedding.href} className="pd-enquire-btn">
                            <span>View all {totalPhotos} photos from this wedding</span>
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="5" y1="12" x2="19" y2="12" />
                                <polyline points="12 5 19 12 12 19" />
                            </svg>
                        </Link>
                    </div>
                )}
            </div>
        </section>
    );
}
