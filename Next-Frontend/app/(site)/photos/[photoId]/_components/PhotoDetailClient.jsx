'use client';

import { useRouter } from 'next/navigation';
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import './photoDetail.css';

import PhotoHeroShowcase from './PhotoHeroShowcase.jsx';
import PhotoMetadataSidebar from './PhotoMetadataSidebar.jsx';
import ClientCeremonyGallery from './ClientCeremonyGallery.jsx';
import SimilarPhotosRail from './SimilarPhotosRail.jsx';
import PhotoLightboxModal from './PhotoLightboxModal.jsx';
import { fireMessage } from '@/Utils/fireMessage.js';

const api_url = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

export default function PhotoDetailClient({
    initialData = null,
    initialTeam = [],
    photoId,
    initialLightbox = false,
}) {
    const router = useRouter();
    // Current Active Photo & Client Data
    const currentPhoto = initialData?.selectedPhoto || null;
    const clientName = initialData?.clientName || {};
    const wedding = initialData?.wedding || null;
    const remainingPhotos = useMemo(() => initialData?.remainingPhotos || [], [initialData]);
    const ceremonies = initialData?.ceremonies || [];
    const [teamList, setTeamList] = useState(initialTeam || []);

    // Recommendations (Similar Photos)
    const [recommendations, setRecommendations] = useState([]);
    const [likedPhotos, setLikedPhotos] = useState(new Set());
    const [isLightboxOpen, setIsLightboxOpen] = useState(initialLightbox);

    // Combine all photos of this client
    const allClientPhotos = useMemo(() => {
        if (!currentPhoto) return remainingPhotos;
        const others = remainingPhotos.filter(p => String(p._id) !== String(currentPhoto._id));
        return [currentPhoto, ...others];
    }, [currentPhoto, remainingPhotos]);

    useEffect(() => {
        const controller = new AbortController();
        async function loadRecommendations() {
            try {
                const res = await fetch(`${api_url}/api/photos/${encodeURIComponent(photoId)}/recommended?page=1&limit=12`, { signal: controller.signal });
                if (!res.ok) return;
                const data = await res.json();
                if (!controller.signal.aborted) setRecommendations(data.recommendedPhotos || []);
            } catch (error) { if (!controller.signal.aborted) console.warn('Could not load recommendations', error); }
        }
        async function loadTeam() {
            try {
                const response = await fetch(`${api_url}/api/team`, { signal: controller.signal });
                if (!response.ok) return;
                const data = await response.json();
                if (!controller.signal.aborted) setTeamList(data.teamImages || []);
            } catch (error) { if (!controller.signal.aborted) console.warn('Could not load team', error); }
        }
        if (photoId) loadRecommendations();
        if (!initialTeam?.length) loadTeam();
        return () => controller.abort();
    }, [photoId, initialTeam]);

    // Handle photo selection (switch active without reload)
    const handleSelectPhoto = useCallback((photo) => {
        if (!photo?._id || String(photo._id) === String(currentPhoto?._id)) return;
        router.push(`/photos/${encodeURIComponent(photo._id)}${isLightboxOpen ? '?view=lightbox' : ''}`, { scroll: !isLightboxOpen });
    }, [router, currentPhoto?._id, isLightboxOpen]);

    // Handle Like Toggle
    const handleToggleLike = useCallback(() => {
        if (!currentPhoto?._id) return;
        setLikedPhotos((prev) => {
            const next = new Set(prev);
            if (next.has(currentPhoto._id)) {
                next.delete(currentPhoto._id);
            } else {
                next.add(currentPhoto._id);
            }
            return next;
        });
    }, [currentPhoto]);

    const handleToggleLikePhoto = useCallback((id) => {
        setLikedPhotos((prev) => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
    }, []);

    // Handle Share
    const handleShare = useCallback(async () => {
        const title = currentPhoto?.title || 'Fine Art Wedding Photography | The Wedding Vachan';
        const url = typeof window !== 'undefined' ? window.location.href : '';
        if (navigator.share) {
            try {
                await navigator.share({ title, text: `Check out this photograph: ${title}`, url });
                return;
            } catch (err) {
                if (err.name === 'AbortError') return;
            }
        }
        if (navigator.clipboard) {
            try {
                await navigator.clipboard.writeText(url);
                fireMessage?.('Link copied to clipboard!', 'success');
            } catch {
                fireMessage?.('Could not copy link', 'error');
            }
        }
    }, [currentPhoto]);

    if (!currentPhoto) {
        return (
            <div className="pd-root" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
                <div style={{ color: '#8C7B70', fontSize: '15px' }}>Loading photograph...</div>
            </div>
        );
    }

    return (
        <div className="pd-root">
            {/* ══════════════════════════════════════════════════════════
                1. TOP HERO SHOWCASE & METADATA SIDEBAR (Band 1: Canvas)
                ══════════════════════════════════════════════════════════ */}
            <section className="pd-hero-band" aria-label="Photograph showcase and details">
                <div className="pd-container">
                    <div className="pd-hero-section">
                        <PhotoHeroShowcase
                            currentPhoto={currentPhoto}
                            photosList={allClientPhotos}
                            onSelectPhoto={handleSelectPhoto}
                            onOpenLightbox={() => setIsLightboxOpen(true)}
                        />

                        <PhotoMetadataSidebar
                            photo={currentPhoto}
                            clientName={clientName}
                            wedding={wedding}
                            teamList={teamList}
                            isLiked={likedPhotos.has(currentPhoto._id)}
                            likeCount={likedPhotos.has(currentPhoto._id) ? 1 : 0}
                            onToggleLike={handleToggleLike}
                            onShare={handleShare}
                        />
                    </div>
                </div>
            </section>

            {/* ══════════════════════════════════════════════════════════
                2. "EXPLORE MORE FROM THIS CLIENT" (Band 2: Warm Ground Sunk)
                ══════════════════════════════════════════════════════════ */}
            <ClientCeremonyGallery
                clientPhotos={allClientPhotos}
                ceremonies={ceremonies}
                clientName={clientName}
                wedding={wedding}
                currentPhoto={currentPhoto}
                onSelectPhoto={handleSelectPhoto}
            />

            {/* ══════════════════════════════════════════════════════════
                3. "SIMILAR PHOTOS (RECOMMENDED)" (Band 3: Crisp Editorial)
                ══════════════════════════════════════════════════════════ */}
            <SimilarPhotosRail
                recommendations={recommendations}
                currentPhoto={currentPhoto}
                likedPhotos={likedPhotos}
                onToggleLikePhoto={handleToggleLikePhoto}
            />

            {/* ══════════════════════════════════════════════════════════
                4. FULLSCREEN LIGHTBOX MODAL
                ══════════════════════════════════════════════════════════ */}
            <PhotoLightboxModal
                isOpen={isLightboxOpen}
                currentPhoto={currentPhoto}
                photosList={allClientPhotos}
                onClose={() => setIsLightboxOpen(false)}
                onSelectPhoto={handleSelectPhoto}
            />
        </div>
    );
}
