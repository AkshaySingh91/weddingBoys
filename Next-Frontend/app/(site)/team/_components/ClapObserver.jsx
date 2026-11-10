'use client';

/**
 * Claps each slate (`.slate[data-clap]`) when 60% of it is in view.
 *
 * Arms first (`data-clap-armed` hides the portrait behind its shutter), then
 * sets `data-clapped` — the CSS in globals.css › Slates does the rest. A slate
 * already on screen at load claps after a short beat so the clap is still seen.
 * No IntersectionObserver or reduced motion → never arms: portraits just show.
 */
import { useEffect } from 'react';

export default function ClapObserver() {
    useEffect(() => {
        if (typeof IntersectionObserver === 'undefined') return undefined;
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            document.querySelectorAll('.slate[data-clap]').forEach((el) => el.setAttribute('data-clapped', ''));
            return undefined;
        }
        const timers = [];
        const io = new IntersectionObserver((entries) => {
            for (const e of entries) {
                if (!e.isIntersecting) continue;
                io.unobserve(e.target);
                const onScreenAtLoad = e.target.dataset.clapEarly === '1';
                timers.push(setTimeout(() => e.target.setAttribute('data-clapped', ''), onScreenAtLoad ? 300 : 0));
            }
        }, { threshold: 0.6 });
        const fold = window.innerHeight;
        document.querySelectorAll('.slate[data-clap]').forEach((el) => {
            if (el.getBoundingClientRect().top < fold) el.dataset.clapEarly = '1';
            el.setAttribute('data-clap-armed', '');
            io.observe(el);
        });
        return () => { io.disconnect(); timers.forEach(clearTimeout); };
    }, []);
    return null;
}
