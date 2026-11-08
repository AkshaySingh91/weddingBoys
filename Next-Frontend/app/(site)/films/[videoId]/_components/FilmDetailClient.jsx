'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import CinematicPlayer from './CinematicPlayer';
import './filmDetail.css';

const api_url = typeof window !== 'undefined'
    ? (window.location.hostname === 'localhost' ? (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080') : '')
    : (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080');

export default function FilmDetailClient({ initialFilmData, videoId, initialTeam = [] }) {
    const [filmData, setFilmData] = useState(initialFilmData || null);
    const [teamList, setTeamList] = useState(initialTeam || []);
    const [recommendedVideos, setRecommendedVideos] = useState([]);
    const [isLoading, setIsLoading] = useState(!initialFilmData);
    const [isTheater, setIsTheater] = useState(true);

    const videoRef = useRef(null);
    const stillsRailRef = useRef(null);
    const teamRailRef = useRef(null);

    const scrollStills = (direction) => {
        if (stillsRailRef.current) {
            const scrollAmount = direction === 'left' ? -440 : 440;
            stillsRailRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
        }
    };

    const scrollTeam = (direction) => {
        if (teamRailRef.current) {
            const scrollAmount = direction === 'left' ? -320 : 320;
            teamRailRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
        }
    };

    /* Like state */
    const [isLiked, setIsLiked] = useState(() => {
        if (typeof window !== 'undefined' && videoId) {
            return localStorage.getItem(`film_liked_${videoId}`) === 'true';
        }
        return false;
    });
    const [toastMessage, setToastMessage] = useState('');

    const showToast = (msg) => {
        setToastMessage(msg);
        setTimeout(() => setToastMessage(''), 2600);
    };

    /* Client-side fallback fetch */
    const fetchFilmDetails = useCallback(async () => {
        if (!videoId) return;
        try {
            setIsLoading(true);
            const res = await fetch(`${api_url}/api/videos/${videoId}`);
            const data = await res.json();
            if (res.ok && data.selectedVideo) {
                setFilmData(data);
            }
        } catch (err) {
            console.error('Error fetching film details:', err);
        } finally {
            setIsLoading(false);
        }
    }, [videoId]);

    /* Fetch team avatars from /api/team */
    const fetchTeam = useCallback(async () => {
        try {
            const res = await fetch(`${api_url}/api/team`);
            const data = await res.json();
            if (data.teamImages) {
                setTeamList(data.teamImages);
            }
        } catch (err) {
            console.warn('Could not load team images', err);
        }
    }, []);

    /* Fetch recommended videos */
    const fetchRecommended = useCallback(async () => {
        if (!videoId) return;
        try {
            const res = await fetch(`${api_url}/api/videos/${videoId}/recommended`);
            const data = await res.json();
            if (data.recommendedVideos) {
                setRecommendedVideos(data.recommendedVideos);
            }
        } catch (err) {
            console.warn('Could not load recommended videos', err);
        }
    }, [videoId]);

    useEffect(() => {
        if (!initialFilmData) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            fetchFilmDetails();
        }
        if (!initialTeam || initialTeam.length === 0) {
            fetchTeam();
        }
        fetchRecommended();
    }, [initialFilmData, initialTeam, fetchFilmDetails, fetchTeam, fetchRecommended]);

    /* Like toggle */
    const handleLikeToggle = () => {
        const next = !isLiked;
        setIsLiked(next);
        if (typeof window !== 'undefined' && videoId) {
            localStorage.setItem(`film_liked_${videoId}`, next ? 'true' : 'false');
        }
        showToast(next ? 'Saved to favorites' : 'Removed from favorites');
    };

    /* Share action */
    const handleShare = async () => {
        const url = typeof window !== 'undefined' ? window.location.href : '';
        const title = `${filmData?.clientName?.Bride} & ${filmData?.clientName?.Groom} Wedding Film`;
        if (typeof navigator !== 'undefined' && navigator.share) {
            try {
                await navigator.share({ title, url });
            } catch {
                // dismissed
            }
        } else if (typeof navigator !== 'undefined' && navigator.clipboard) {
            await navigator.clipboard.writeText(url);
            showToast('Film link copied to clipboard');
        }
    };

    /* Play trigger — now handled by CinematicPlayer internally */

    if (isLoading) {
        return (
            <div className="film-detail-page">
                <div className="fd-player-section">
                    <div className="fd-player-container animate-pulse bg-ground-sunk" />
                </div>
            </div>
        );
    }

    if (!filmData || !filmData.selectedVideo) {
        return (
            <div className="film-detail-page">
                <div className="max-w-xl mx-auto text-center py-20 px-6">
                    <h1 className="font-display text-3xl mb-4">Film Not Found</h1>
                    <p className="text-ink-muted mb-6">The wedding film you are looking for is not available.</p>
                    <Link href="/allfilms" className="fd-primary-btn">
                        Browse All Films
                    </Link>
                </div>
            </div>
        );
    }

    const { clientName, selectedVideo, remainingVideos = [], photos = [], wedding } = filmData;
    const bride = clientName?.Bride || '';
    const groom = clientName?.Groom || '';
    const coupleName = [bride, groom].filter(Boolean).join(' & ') || 'Wedding Celebration';

    const shootDate = selectedVideo.videoShootDate || '';
    const city = selectedVideo.videoLocation?.city || '';
    const state = selectedVideo.videoLocation?.state || '';
    const locationText = [city, state].filter(Boolean).join(', ') || city;
    const tags = selectedVideo.tags || [];
    const bts = selectedVideo.bts || [];

    /* Priority: Client photo first; if not available, fallback to video thumbnail */
    const clientPhotoUrl = photos?.[0]?.photoMetaData?.url || photos?.[0]?.url || null;
    const coverImage = clientPhotoUrl || selectedVideo.thumbnailUrl;

    /* Secondary photograph for highlight card (if multiple photos exist, use photo 2, else photo 1, else video thumbnail) */
    const highlightPhotoUrl =
        photos?.[1]?.photoMetaData?.url ||
        photos?.[1]?.url ||
        clientPhotoUrl ||
        selectedVideo.thumbnailUrl;

    /* About paragraph */
    const aboutText =
        selectedVideo.about ||
        `A beautiful celebration filled with heartfelt moments, vibrant traditions, and unforgettable emotions. ${coupleName}’s wedding was a perfect blend of timeless culture, candid joy, and cinematic storytelling${locationText ? ` in ${locationText}` : ''}.`;

    /* Match BTS team members with avatars from /api/team */
    const matchedTeam = bts.map((item) => {
        const clean = (s) => (s || '').toLowerCase().trim();
        const roleKeywords = ['photographer', 'phototgrapher', 'photo', 'videography', 'videographer', 'video', 'editor', 'drone', 'pilot', 'director', 'story', 'assistant', 'manager', 'cinematographer', 'candid'];

        let name = item.key;
        let role = item.value;

        if (clean(item.key).includes('phototgraph') || clean(item.key).includes('photograph')) {
            name = item.value;
            role = 'Photographer';
        } else if (roleKeywords.some((r) => clean(item.key).includes(r))) {
            name = item.value;
            role = item.key;
        }

        if (role) {
            role = role.split(' ').map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
        }

        const matched = teamList.find((t) => {
            const teamName = clean(t.about?.name);
            if (!teamName) return false;
            return clean(name).includes(teamName) || teamName.includes(clean(name));
        });

        const initials = name
            .split(' ')
            .map((n) => n[0])
            .filter(Boolean)
            .slice(0, 2)
            .join('')
            .toUpperCase() || 'WB';

        return {
            name,
            role,
            avatarUrl: matched?.url || null,
            initials,
        };
    });

    return (
        <div className="film-detail-page">
            {/* ═══════════════════════════════════════════════════════════════
                1. CINEMATIC VIDEO PLAYER (Contained with Left-Right Spacing & Reduced Height)
                ═══════════════════════════════════════════════════════════════ */}
            <div className={`fd-player-section ${isTheater ? 'fd-theater-mode' : ''}`}>
                <div className="fd-player-container">
                    {selectedVideo.embedUrl ? (
                        <iframe
                            src={selectedVideo.embedUrl}
                            title={`${coupleName} — Wedding Film`}
                            allow="autoplay; fullscreen; picture-in-picture; encrypted-media"
                            allowFullScreen
                            className="fd-iframe"
                        />
                    ) : (
                        <CinematicPlayer
                            src={selectedVideo.url}
                            poster={coverImage}
                            title={`${coupleName} — Wedding Film`}
                            watermarkSrc="/companyLogo.png"
                            dominantColor={photos?.[0]?.dominantColor || '#24140e'}
                            isTheater={isTheater}
                            onToggleTheater={() => setIsTheater((prev) => !prev)}
                            onNext={remainingVideos?.[0]?._id ? () => { window.location.href = `/films/${remainingVideos[0]._id}`; } : (recommendedVideos?.[0]?._id ? () => { window.location.href = `/films/${recommendedVideos[0]._id}`; } : undefined)}
                            nextTitle={remainingVideos?.[0]?.clientName?.Bride ? `${remainingVideos[0].clientName.Bride} & ${remainingVideos[0].clientName.Groom || ''}` : (recommendedVideos?.[0]?.clientName?.Bride ? `${recommendedVideos[0].clientName.Bride} & ${recommendedVideos[0].clientName.Groom || ''}` : undefined)}
                        />
                    )}
                </div>
            </div>

            {/* ═══════════════════════════════════════════════════════════════
                2. MAIN CONTENT AREA
                ═══════════════════════════════════════════════════════════════ */}
            <div className="fd-main-content">
                {/* Header: Title, Metadata, Actions, & Tag Chips */}
                <div className="fd-header-grid">
                    <div className="fd-header-left">
                        {/* Direct couple title without redundant 'wedding film' heading */}
                        <h1 className="fd-title">{coupleName}</h1>

                        <div className="fd-meta-row">
                            {shootDate && (
                                <div className="fd-meta-item">
                                    <svg className="fd-meta-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                                        <line x1="16" y1="2" x2="16" y2="6" />
                                        <line x1="8" y1="2" x2="8" y2="6" />
                                        <line x1="3" y1="10" x2="21" y2="10" />
                                    </svg>
                                    <span>{shootDate}</span>
                                </div>
                            )}

                            {shootDate && locationText && <span className="fd-meta-divider" aria-hidden="true">·</span>}

                            {locationText && (
                                <div className="fd-meta-item">
                                    <svg className="fd-meta-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                                        <circle cx="12" cy="10" r="3" />
                                    </svg>
                                    <span>{locationText}</span>
                                </div>
                            )}
                        </div>

                        <p className="fd-about-text">{aboutText}</p>

                        {tags.length > 0 && (
                            <div className="fd-tags-rail" aria-label="Tags">
                                {tags.map((tag) => (
                                    <Link key={tag} href={`/allfilms?tag=${encodeURIComponent(tag)}`} className="fd-tag-chip">
                                        {tag}
                                    </Link>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="fd-header-right">
                        <div className="fd-actions-row">
                            <button
                                type="button"
                                onClick={handleLikeToggle}
                                className={`fd-action-btn ${isLiked ? 'fd-action-btn--liked' : ''}`}
                                aria-label="Save to favorites"
                            >
                                <svg width="15" height="15" viewBox="0 0 24 24" fill={isLiked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                                </svg>
                                <span>{isLiked ? 'Liked' : 'Like'}</span>
                            </button>

                            <button
                                type="button"
                                onClick={handleShare}
                                className="fd-action-btn"
                                aria-label="Share this film"
                            >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="18" cy="5" r="3" />
                                    <circle cx="6" cy="12" r="3" />
                                    <circle cx="18" cy="19" r="3" />
                                    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                                    <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                                </svg>
                                <span>Share</span>
                            </button>

                            <Link href="/contact" className="fd-primary-btn">
                                <span>Inquire</span>
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <line x1="5" y1="12" x2="19" y2="12" />
                                    <polyline points="12 5 19 12 12 19" />
                                </svg>
                            </Link>
                        </div>

                        {/* Large Highlight Photograph Card */}
                        {highlightPhotoUrl && (
                            <div className="fd-couple-portrait-wrap">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                    src={highlightPhotoUrl}
                                    alt={`${coupleName} Highlight`}
                                    className="fd-couple-portrait-img"
                                    loading="lazy"
                                />
                            </div>
                        )}
                    </div>
                </div>

                {/* ═══════════════════════════════════════════════════════════
                    3. PRODUCTION TEAM (Spacious Capsule Cards with Position Wrapped Below)
                    ═══════════════════════════════════════════════════════════ */}
                {matchedTeam.length > 0 && (
                    <section className="fd-team-section" aria-label="Production Team">
                        <div className="fd-team-head-row">
                            <h2 className="fd-section-label">Production Team</h2>
                            {matchedTeam.length > 3 && (
                                <div className="fd-nav-chevrons fd-nav-chevrons--sm">
                                    <button
                                        type="button"
                                        onClick={() => scrollTeam('left')}
                                        className="fd-chevron-btn fd-chevron-btn--sm"
                                        aria-label="Previous team members"
                                    >
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                                            <polyline points="15 18 9 12 15 6" />
                                        </svg>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => scrollTeam('right')}
                                        className="fd-chevron-btn fd-chevron-btn--sm"
                                        aria-label="Next team members"
                                    >
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                                            <polyline points="9 18 15 12 9 6" />
                                        </svg>
                                    </button>
                                </div>
                            )}
                        </div>
                        <div className="fd-team-row" ref={teamRailRef}>
                            {matchedTeam.map((member, idx) => (
                                <div key={idx} className="fd-team-card">
                                    <div className="fd-team-card__avatar">
                                        {member.avatarUrl ? (
                                            // eslint-disable-next-line @next/next/no-img-element
                                            <img
                                                src={member.avatarUrl}
                                                alt={member.name}
                                                className="fd-team-card__avatar-img"
                                                loading="lazy"
                                            />
                                        ) : (
                                            <div className="fd-team-card__avatar-fallback">
                                                {member.initials}
                                            </div>
                                        )}
                                    </div>
                                    <div className="fd-team-card__content">
                                        <span className="fd-team-card__name">{member.name}</span>
                                        <span className="fd-team-card__role">{member.role}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* ═══════════════════════════════════════════════════════════
                    4. FILM CHAPTERS (Other ceremonies of this same wedding)
                    ═══════════════════════════════════════════════════════════ */}
                {remainingVideos.length > 0 && (
                    <section className="fd-chapters-section" aria-label="Other ceremonies of this wedding">
                        <div className="fd-section-head-row">
                            <h2 className="fd-section-head-title">Ceremonies from this Wedding</h2>
                            {wedding?.href && (
                                <Link href={wedding.href} className="fd-story-link">
                                    <span>Full Wedding Story</span>
                                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <polyline points="9 18 15 12 9 6" />
                                    </svg>
                                </Link>
                            )}
                        </div>

                        <div className="fd-chapters-grid">
                            {/* Current film */}
                            <div className="fd-chapter-item fd-chapter-item--active">
                                <div className="fd-chapter-media">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                        src={selectedVideo.thumbnailUrl}
                                        alt={coupleName}
                                        className="fd-chapter-media__img"
                                    />
                                    <span className="fd-chapter-badge">Now Playing</span>
                                </div>
                                <div className="fd-chapter-info">
                                    <h3 className="fd-chapter-name">{selectedVideo.tags?.[0] || 'Featured Film'}</h3>
                                    <p className="fd-chapter-date">{shootDate}</p>
                                </div>
                            </div>

                            {/* Other ceremonies */}
                            {remainingVideos.map((sibling, idx) => (
                                <Link key={sibling._id || idx} href={`/films/${sibling._id}`} className="fd-chapter-item">
                                    <div className="fd-chapter-media">
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img
                                            src={sibling.thumbnailMetaData?.url || sibling.thumbnailUrl}
                                            alt={coupleName}
                                            className="fd-chapter-media__img"
                                            loading="lazy"
                                        />
                                        <div className="fd-chapter-play-icon" aria-hidden="true">
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                                <polygon points="5 3 19 12 5 21 5 3" />
                                            </svg>
                                        </div>
                                    </div>
                                    <div className="fd-chapter-info">
                                        <h3 className="fd-chapter-name">{sibling.tags?.[0] || `Ceremony ${idx + 2}`}</h3>
                                        <p className="fd-chapter-date">{sibling.videoShootDate || ''}</p>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </section>
                )}

                {/* ═══════════════════════════════════════════════════════════
                    5. PHOTOGRAPHY STILLS (With Chevron Navigation)
                    ═══════════════════════════════════════════════════════════ */}
                {photos.length > 0 && (
                    <section className="fd-stills-section" aria-label="Wedding photography stills">
                        <div className="fd-section-head-row">
                            <div className="fd-section-title-wrap">
                                <h2 className="fd-section-head-title">Stills from the Day</h2>
                                {photos.length > 1 && (
                                    <span className="fd-counter-pill">{photos.length} Photographs</span>
                                )}
                            </div>
                            <div className="fd-stills-actions">
                                {wedding?.href && (
                                    <Link href={wedding.href} className="fd-story-link">
                                        <span>Full Wedding Story</span>
                                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <polyline points="9 18 15 12 9 6" />
                                        </svg>
                                    </Link>
                                )}
                                <div className="fd-nav-chevrons">
                                    <button
                                        type="button"
                                        onClick={() => scrollStills('left')}
                                        className="fd-chevron-btn"
                                        aria-label="Previous photographs"
                                    >
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                                            <polyline points="15 18 9 12 15 6" />
                                        </svg>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => scrollStills('right')}
                                        className="fd-chevron-btn"
                                        aria-label="Next photographs"
                                    >
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                                            <polyline points="9 18 15 12 9 6" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="fd-stills-rail" ref={stillsRailRef}>
                            {photos.map((p, idx) => (
                                <div key={p._id || idx} className="fd-still-card">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                        src={p.photoMetaData?.url || p.url}
                                        alt={`${coupleName} Still ${idx + 1}`}
                                        className="fd-still-card__img"
                                        loading="lazy"
                                    />
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* ═══════════════════════════════════════════════════════════
                    6. "MORE LIKE THIS" RECOMMENDED FILMS
                    ═══════════════════════════════════════════════════════════ */}
                {recommendedVideos.length > 0 && (
                    <section className="fd-recommended-section" aria-label="Recommended wedding films">
                        <div className="fd-recommended-head">
                            <h2 className="fd-recommended-title">More Like This</h2>
                            <Link href="/allfilms" className="fd-view-all-link">
                                <span>Browse All Films</span>
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="9 18 15 12 9 6" />
                                </svg>
                            </Link>
                        </div>

                        <div className="fd-recommended-grid">
                            {recommendedVideos.slice(0, 4).map((rec) => {
                                const recBride = rec.clientName?.Bride || '';
                                const recGroom = rec.clientName?.Groom || '';
                                const recCouple = [recBride, recGroom].filter(Boolean).join(' & ') || 'Wedding Story';
                                const recCity = rec.videoLocation?.city || '';
                                const recTags = (rec.tags || []).slice(0, 2);
                                const recThumb = rec.thumbnailMetaData?.url || rec.thumbnailUrl;

                                return (
                                    <Link key={rec._id} href={`/films/${rec._id}`} className="fd-rec-card">
                                        <div className="fd-rec-media">
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            <img
                                                src={recThumb}
                                                alt={recCouple}
                                                className="fd-rec-img"
                                                loading="lazy"
                                            />
                                            <div className="fd-rec-play" aria-hidden="true">
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                                    <polygon points="5 3 19 12 5 21 5 3" />
                                                </svg>
                                            </div>
                                        </div>
                                        <div className="fd-rec-body">
                                            <h3 className="fd-rec-couple">{recCouple}</h3>
                                            {recCity && <span className="fd-rec-meta">{recCity}</span>}
                                            {recTags.length > 0 && (
                                                <div className="fd-rec-tags">
                                                    {recTags.map((t, i) => (
                                                        <span key={i} className="fd-rec-tag">{t}</span>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </Link>
                                );
                            })}
                        </div>
                    </section>
                )}
            </div>

            {/* Subtle Toast Notification */}
            {toastMessage && (
                <div className="fd-toast" role="status" aria-live="polite">
                    {toastMessage}
                </div>
            )}
        </div>
    );
}
