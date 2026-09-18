'use client';

import { useState, useEffect } from 'react';
import { trackBlogView, trackBlogReadComplete } from '@/lib/analytics/tracker.js';

export default function ReadingProgressBar({ postSlug }) {
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        if (postSlug) {
            trackBlogView(postSlug);
        }
    }, [postSlug]);

    useEffect(() => {
        let ticking = false;

        const handleScroll = () => {
            if (!ticking) {
                window.requestAnimationFrame(() => {
                    const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
                    if (totalHeight > 0) {
                        const currentProgress = (window.scrollY / totalHeight) * 100;
                        setProgress(Math.min(100, Math.max(0, currentProgress)));

                        // Trigger read-completion at >= 90% scroll depth
                        if (currentProgress >= 90 && postSlug) {
                            trackBlogReadComplete(postSlug);
                        }
                    }
                    ticking = false;
                });
                ticking = true;
            }
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        handleScroll();

        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    if (progress <= 0) return null;

    /*
      The bar carries a readout and a line of encouragement, as in the reference.
      They sit in the 3px strip's own row above the navbar rather than floating
      over the page, so nothing of the article is covered. Both are hidden on
      small screens, where there is no room for them beside the bar.
    */
    const rounded = Math.round(progress);

    return (
        <div aria-hidden="true" className="pointer-events-none fixed inset-x-0 top-0 z-50">
            <div className="h-[3px] w-full bg-studio-blush">
                <div
                    className="h-full bg-gradient-to-r from-studio-coral via-studio-terracotta to-studio-gold transition-[width] duration-150 ease-out"
                    style={{ width: `${progress}%` }}
                />
            </div>
            <div className="hidden items-center justify-between px-5 pt-1 sm:flex">
                <span className="text-[10px] font-bold tabular-nums text-studio-inkMuted">{rounded}%</span>
                <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-studio-inkMuted">
                    {rounded < 90 ? 'A beautiful story ahead…' : 'Thank you for reading'}
                </span>
            </div>
        </div>
    );
}
