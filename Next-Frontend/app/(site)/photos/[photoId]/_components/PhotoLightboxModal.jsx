'use client';

import React, { useEffect, useMemo } from 'react';

export default function PhotoLightboxModal({
    isOpen,
    currentPhoto,
    photosList = [],
    onClose,
    onSelectPhoto,
}) {
    const currentIndex = useMemo(() => {
        if (!currentPhoto || !photosList.length) return 0;
        const idx = photosList.findIndex(p => String(p._id) === String(currentPhoto._id));
        return idx >= 0 ? idx : 0;
    }, [currentPhoto, photosList]);

    const hasSiblings = photosList.length > 1;

    // Body scroll lock
    useEffect(() => {
        if (isOpen) {
            const originalOverflow = document.body.style.overflow;
            document.body.style.overflow = 'hidden';
            return () => {
                document.body.style.overflow = originalOverflow;
            };
        }
    }, [isOpen]);

    // Keyboard navigation with modifier key protection
    useEffect(() => {
        if (!isOpen) return;

        const handleKeyDown = (e) => {
            // Guard: Never intercept browser or OS shortcut combinations
            if (e.metaKey || e.ctrlKey || e.altKey || e.shiftKey) return;

            if (e.key === 'Escape') {
                e.preventDefault();
                onClose?.();
            } else if (e.key === 'ArrowLeft' && hasSiblings) {
                e.preventDefault();
                const prevIdx = (currentIndex - 1 + photosList.length) % photosList.length;
                onSelectPhoto?.(photosList[prevIdx]);
            } else if (e.key === 'ArrowRight' && hasSiblings) {
                e.preventDefault();
                const nextIdx = (currentIndex + 1) % photosList.length;
                onSelectPhoto?.(photosList[nextIdx]);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, hasSiblings, currentIndex, photosList, onClose, onSelectPhoto]);

    if (!isOpen || !currentPhoto) return null;

    return (
        <div
            className="pd-lightbox"
            onClick={onClose}
            role="dialog"
            aria-modal="true"
            aria-label="Full screen photograph view"
        >
            {/* Close Button */}
            <button
                type="button"
                className="pd-lightbox-close-btn"
                onClick={onClose}
                aria-label="Close full screen (Esc)"
                title="Close (Esc)"
            >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
            </button>

            {/* Left Chevron */}
            {hasSiblings && (
                <button
                    type="button"
                    className="pd-lightbox-nav-btn prev"
                    onClick={(e) => {
                        e.stopPropagation();
                        const prevIdx = (currentIndex - 1 + photosList.length) % photosList.length;
                        onSelectPhoto?.(photosList[prevIdx]);
                    }}
                    aria-label="Previous photograph"
                >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="15 18 9 12 15 6" />
                    </svg>
                </button>
            )}

            {/* Main Centered High-Res Image */}
            <div
                className="pd-lightbox-img-wrap"
                onClick={(e) => e.stopPropagation()}
            >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                    src={currentPhoto.url}
                    alt={currentPhoto.title || 'Wedding Photograph'}
                    className="pd-lightbox-img"
                />
            </div>

            {/* Right Chevron */}
            {hasSiblings && (
                <button
                    type="button"
                    className="pd-lightbox-nav-btn next"
                    onClick={(e) => {
                        e.stopPropagation();
                        const nextIdx = (currentIndex + 1) % photosList.length;
                        onSelectPhoto?.(photosList[nextIdx]);
                    }}
                    aria-label="Next photograph"
                >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="9 18 15 12 9 6" />
                    </svg>
                </button>
            )}
        </div>
    );
}
