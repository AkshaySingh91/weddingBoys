'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

/**
 * Mobile only: once the cold open has scrolled away, WhatsApp and Enquire sit
 * in thumb reach. They step aside while the page's own final actions are on
 * screen, so the same two buttons are never shown twice.
 */
export default function StickyActions({ whatsapp }) {
    const [pastHero, setPastHero] = useState(false);
    const [atFinal, setAtFinal] = useState(false);

    useEffect(() => {
        const hero = document.getElementById('cold-open');
        const final = document.getElementById('final-card');
        const observer = new IntersectionObserver((entries) => {
            for (const e of entries) {
                if (e.target === hero) setPastHero(!e.isIntersecting && e.boundingClientRect.top < 0);
                if (e.target === final) setAtFinal(e.isIntersecting);
            }
        });
        if (hero) observer.observe(hero);
        if (final) observer.observe(final);
        return () => observer.disconnect();
    }, []);

    const visible = pastHero && !atFinal;

    return (
        <div
            aria-hidden={!visible}
            className={`fixed inset-x-0 bottom-0 z-sticky border-t border-edge-subtle bg-ground/95 px-4 pb-[calc(12px_+_env(safe-area-inset-bottom))] pt-3 backdrop-blur-md transition-transform duration-ui ease-standard motion-reduce:transition-none md:hidden ${
                visible ? 'translate-y-0' : 'pointer-events-none translate-y-full'
            }`}
        >
            <div className="flex gap-3">
                {whatsapp && (
                    <a
                        href={whatsapp}
                        target="_blank"
                        rel="noopener noreferrer"
                        tabIndex={visible ? undefined : -1}
                        className="inline-flex min-h-[48px] flex-1 items-center justify-center rounded-control border border-gold-strong/60 text-[15px] font-semibold text-ink"
                    >
                        WhatsApp us
                    </a>
                )}
                <Link
                    href="/contact"
                    tabIndex={visible ? undefined : -1}
                    className="inline-flex min-h-[48px] flex-1 items-center justify-center rounded-control bg-accent text-[15px] font-semibold text-ink-onAccent"
                >
                    Enquire
                </Link>
            </div>
        </div>
    );
}
