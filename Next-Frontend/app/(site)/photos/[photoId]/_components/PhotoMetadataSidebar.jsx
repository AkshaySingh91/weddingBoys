'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';

export default function PhotoMetadataSidebar({
    photo,
    clientName = {},
    wedding = null,
    teamList = [],
    isLiked = false,
    likeCount = 0,
    onToggleLike,
    onShare,
}) {
    // Couple name display
    const coupleText = useMemo(() => {
        const bride = clientName?.Bride?.trim();
        const groom = clientName?.Groom?.trim();
        if (bride && groom) return `${bride} & ${groom}`;
        return bride || groom || '';
    }, [clientName]);

    // Ceremony / Event name (Primary: eventGroup, Secondary: first ceremony tag, Fallback: 'Wedding')
    const ceremonyBadge = useMemo(() => {
        if (photo?.eventGroup?.trim()) return photo.eventGroup.trim();
        const knownCeremonies = ['Mehendi', 'Haldi', 'Wedding', 'Sangeet', 'Reception', 'Cocktail', 'Baraat', 'Pre-Wedding', 'Bride', 'Groom'];
        const found = photo?.tags?.find(t => knownCeremonies.some(k => k.toLowerCase() === t.toLowerCase()));
        return found || (photo?.tags?.[0] || 'Celebration');
    }, [photo]);

    // Title: custom photo title, else couple names
    const displayTitle = useMemo(() => {
        if (photo?.title && photo.title.trim() && photo.title !== coupleText) {
            return photo.title.trim();
        }
        return coupleText || 'Wedding Celebration';
    }, [photo, coupleText]);

    // Match BTS team members with avatars from teamList (State 15)
    const matchedTeam = useMemo(() => {
        const rawCredits = photo?.credits || [];
        if (!Array.isArray(rawCredits) || rawCredits.length === 0) return [];

        return rawCredits.map((member) => {
            const name = member.name || member.key || '';
            const role = member.role || member.value || '';
            const matched = teamList?.find((t) => {
                const teamName = t.about?.name?.trim().toLowerCase();
                const targetName = name?.trim().toLowerCase();
                if (!teamName || !targetName) return false;
                return targetName.includes(teamName) || teamName.includes(targetName);
            });
            return {
                name,
                role,
                avatar: matched?.imageMetaData?.url || null,
            };
        }).filter(m => m.name);
    }, [photo, teamList]);

    // Format location display
    const locationDisplay = useMemo(() => {
        const loc = photo?.photoLocation || {};
        const venue = loc.venue?.trim();
        const city = loc.city?.trim();
        const state = loc.state?.trim();
        if (venue && city) return `${venue}, ${city}`;
        if (city && state) return `${city}, ${state}`;
        return city || state || loc.country || null;
    }, [photo]);

    // Format shoot date
    const dateDisplay = useMemo(() => {
        if (!photo?.photoShootDate) return null;
        try {
            const dt = new Date(photo.photoShootDate);
            if (!Number.isNaN(dt.getTime())) {
                const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                return `${dt.getDate()} ${months[dt.getMonth()]} ${dt.getFullYear()}`;
            }
        } catch { }
        return String(photo.photoShootDate);
    }, [photo]);

    // Compute display tags (user tags if available, otherwise contextual ceremony/location fallbacks)
    const displayTags = useMemo(() => {
        if (Array.isArray(photo?.tags) && photo.tags.length > 0) {
            return photo.tags.slice(0, 6);
        }
        // Intelligent editorial fallback for older photos without database tags
        const pool = [];
        if (ceremonyBadge && ceremonyBadge !== 'Celebration') pool.push(ceremonyBadge);
        if (photo?.photoLocation?.city) pool.push(photo.photoLocation.city);
        if (photo?.eventGroup && !pool.includes(photo.eventGroup)) pool.push(photo.eventGroup);
        pool.push('Candid', 'FineArt', 'WeddingPhotography');
        return Array.from(new Set(pool)).slice(0, 5);
    }, [photo, ceremonyBadge]);

    return (
        <aside className="pd-sidebar" aria-label="Photograph details and credits">
            <div className="pd-sidebar-header">
                {/* Event Category Badge */}
                {ceremonyBadge && (
                    <div className="pd-badge-row">
                        <span className="pd-category-chip">{ceremonyBadge}</span>
                    </div>
                )}

                {/* Main Heading */}
                <h1 className="pd-title">{displayTitle}</h1>

                {/* Subline: Couple · Date · City */}
                <div className="pd-subline">
                    {coupleText && <span>{coupleText}</span>}
                    {dateDisplay && (
                        <>
                            <span className="pd-subline-dot">·</span>
                            <span>{dateDisplay}</span>
                        </>
                    )}
                    {photo?.photoLocation?.city && (
                        <>
                            <span className="pd-subline-dot">·</span>
                            <span>{photo.photoLocation.city}</span>
                        </>
                    )}
                </div>

                {/* Editorial Story / Narrative (State 16: collapses if missing) */}
                {photo?.caption && (
                    <p className="pd-story-text">{photo.caption}</p>
                )}
            </div>

            {/* Metadata Cards Grid (Event, Date, Location) — Collapses missing fields (State 16) */}
            {(ceremonyBadge || dateDisplay || locationDisplay) && (
                <div className="pd-metadata-grid">
                    {ceremonyBadge && (
                        <div className="pd-meta-card">
                            <div className="pd-meta-card__icon" aria-hidden="true">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                                    <polyline points="22,6 12,13 2,6" />
                                </svg>
                            </div>
                            <div className="pd-meta-card__content">
                                <span className="pd-meta-card__label">Event</span>
                                <span className="pd-meta-card__value">{ceremonyBadge}</span>
                            </div>
                        </div>
                    )}

                    {dateDisplay && (
                        <div className="pd-meta-card">
                            <div className="pd-meta-card__icon" aria-hidden="true">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                                    <line x1="16" y1="2" x2="16" y2="6" />
                                    <line x1="8" y1="2" x2="8" y2="6" />
                                    <line x1="3" y1="10" x2="21" y2="10" />
                                </svg>
                            </div>
                            <div className="pd-meta-card__content">
                                <span className="pd-meta-card__label">Date</span>
                                <span className="pd-meta-card__value">{dateDisplay}</span>
                            </div>
                        </div>
                    )}

                    {locationDisplay && (
                        <div className="pd-meta-card">
                            <div className="pd-meta-card__icon" aria-hidden="true">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                                    <circle cx="12" cy="10" r="3" />
                                </svg>
                            </div>
                            <div className="pd-meta-card__content">
                                <span className="pd-meta-card__label">Location</span>
                                <span className="pd-meta-card__value" title={locationDisplay}>{locationDisplay}</span>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Tags Chips Section (Editorial Tags with Intelligent Fallback for older images) */}
            {displayTags.length > 0 && (
                <div className="pd-tags-section">
                    <span className="pd-section-micro-label">Tags</span>
                    <div className="pd-tags-wrap" aria-label="Photograph tags">
                        {displayTags.map((tag, idx) => {
                            const cleanTag = tag.replace(/^#/, '');
                            return (
                                <Link
                                    key={idx}
                                    href={`/photos?tag=${encodeURIComponent(cleanTag)}`}
                                    className="pd-tag-pill"
                                >
                                    #{cleanTag}
                                </Link>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* BTS Team Row (State 15: Single-row horizontal rail with capsule pills) */}
            {matchedTeam.length > 0 && (
                <div className="pd-bts-section">
                    <div className="pd-bts-header">
                        <span className="pd-section-micro-label">BTS Team</span>
                        <span className="pd-bts-count">({matchedTeam.length})</span>
                    </div>
                    <div className="pd-bts-row" tabIndex={0} role="region" aria-label="Behind the scenes team members">
                        {matchedTeam.map((member, i) => (
                            <div key={i} className="pd-bts-member" title={`${member.name} — ${member.role || 'Crew'}`}>
                                <div className="pd-bts-avatar">
                                    {member.avatar ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img src={member.avatar} alt={member.name} className="pd-bts-avatar-img" />
                                    ) : (
                                        <span className="pd-bts-fallback">{member.name.charAt(0).toUpperCase()}</span>
                                    )}
                                </div>
                                <div className="pd-bts-info">
                                    <span className="pd-bts-name">{member.name}</span>
                                    <span className="pd-bts-role">{member.role || 'Crew'}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Action Buttons Cluster: Like, Share, Enquire */}
            <div className="pd-actions-cluster">
                <button
                    type="button"
                    className={`pd-action-btn ${isLiked ? 'liked' : ''}`}
                    onClick={onToggleLike}
                    aria-label={isLiked ? 'Unlike photograph' : 'Like photograph'}
                >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill={isLiked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                    </svg>
                    <span>{isLiked ? 'Liked' : 'Like'}</span>
                    {likeCount > 0 && <span>({likeCount})</span>}
                </button>

                <button
                    type="button"
                    className="pd-action-btn"
                    onClick={onShare}
                    aria-label="Share photograph"
                >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="18" cy="5" r="3" />
                        <circle cx="6" cy="12" r="3" />
                        <circle cx="18" cy="19" r="3" />
                        <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                        <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                    </svg>
                    <span>Share</span>
                </button>

                <Link
                    href={`/contact?inquire=photo&title=${encodeURIComponent(displayTitle)}`}
                    className="pd-enquire-btn"
                >
                    <span>Enquire about this shoot</span>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="5" y1="12" x2="19" y2="12" />
                        <polyline points="12 5 19 12 12 19" />
                    </svg>
                </Link>
            </div>
        </aside>
    );
}
