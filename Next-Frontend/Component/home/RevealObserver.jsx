'use client';

/**
 * One IntersectionObserver for the whole home page's chapter entrances.
 *
 * Sections stay server components and only mark elements: `data-rise`
 * (rise | fade | draw | pop) and a `--d` stagger index. Nothing is hidden in the
 * server HTML: only elements that start BELOW the fold are marked `data-wait`
 * (hidden by CSS) once this runs, and each gets `data-in` (which plays the
 * entrance) as it scrolls in. No JS, no IntersectionObserver or reduced motion →
 * this never arms and everything is simply there. See globals.css › Reveal.
 */
import { useEffect } from 'react';

export default function RevealObserver() {
    useEffect(() => {
        if (typeof IntersectionObserver === 'undefined') return undefined;
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;

        const io = new IntersectionObserver((entries) => {
            for (const e of entries) {
                if (!e.isIntersecting) continue;
                e.target.setAttribute('data-in', '');
                io.unobserve(e.target);
            }
        }, { rootMargin: '0px 0px -6% 0px' });

        const fold = window.innerHeight;
        document.querySelectorAll('[data-rise]').forEach((el) => {
            if (el.getBoundingClientRect().top < fold) return; // on screen (even partly): never hide it
            el.setAttribute('data-wait', '');
            io.observe(el);
        });
        return () => io.disconnect();
    }, []);
    return null;
}
