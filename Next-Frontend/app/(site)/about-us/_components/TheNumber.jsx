'use client';

import { useEffect, useRef, useState } from 'react';

const TARGET = 1000;

/**
 * 03 · The number, with the places a family can check it.
 *
 * It counts up once, the first time it is seen, so the number is noticed —
 * then it stays still. Server HTML and reduced-motion visitors get the final
 * figure straight away.
 */
export default function TheNumber({ socials }) {
    const ref = useRef(null);
    const [value, setValue] = useState(TARGET);

    useEffect(() => {
        const el = ref.current;
        if (!el || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;
        if (el.getBoundingClientRect().top < window.innerHeight) return undefined; // already on screen

        setValue(0);
        let frame;
        const observer = new IntersectionObserver(([entry]) => {
            if (!entry.isIntersecting) return;
            observer.disconnect();
            const start = performance.now();
            const tick = (now) => {
                const t = Math.min((now - start) / 1400, 1);
                setValue(Math.round(TARGET * (1 - (1 - t) ** 3)));
                if (t < 1) frame = requestAnimationFrame(tick);
            };
            frame = requestAnimationFrame(tick);
        }, { threshold: 0.6 });
        observer.observe(el);
        return () => { observer.disconnect(); cancelAnimationFrame(frame); };
    }, []);

    const proof = [
        socials.youtube && { label: 'Our films on YouTube', href: socials.youtube },
        socials.instagram && { label: 'Our work on Instagram', href: socials.instagram },
    ].filter(Boolean);

    return (
        <section aria-labelledby="the-number" className="bg-ground-deep py-section-loose">
            <div className="mx-auto w-full max-w-content px-5 text-center md:px-8 lg:px-6">
                <p ref={ref} className="font-display text-[88px] leading-none text-ink-onDeep tabular-nums lg:text-[168px]">
                    <span aria-hidden="true">{value.toLocaleString('en-IN')}+</span>
                    <span className="sr-only">More than 1000</span>
                </p>
                <h2 id="the-number" className="t-display-2 mx-auto mt-4 !text-ink-onDeep">
                    love stories, filmed and photographed.
                </h2>
                {proof.length > 0 && (
                    <ul className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-8">
                        {proof.map((p) => (
                            <li key={p.href}>
                                <a
                                    href={p.href}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex min-h-[44px] items-center gap-2 border-b border-gold/40 text-[15px] font-medium text-ink-onDeep hover:border-gold"
                                >
                                    {p.label} <span aria-hidden="true">↗</span>
                                </a>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </section>
    );
}
