'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { BEATS, FOUNDERS } from './storyData.js';

/**
 * 02 · How it started — three dated beats.
 *
 * Desktop: the photo is pinned on the left and cross-fades as each beat reaches
 * the middle of the screen; the beat being read is full strength, the others
 * recede. Mobile: no pinning (it fights thumb-scrolling) — a year rail sticks
 * under the header and tells you where you are, and each beat carries its own
 * photo. The motion only ever answers "which part of the story am I in?".
 */
export default function HowItStarted({ youtube }) {
    const [active, setActive] = useState(0);
    const beatRefs = useRef([]);

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                for (const entry of entries) {
                    if (entry.isIntersecting) setActive(Number(entry.target.dataset.index));
                }
            },
            { rootMargin: '-45% 0px -50% 0px' },
        );
        beatRefs.current.forEach((el) => el && observer.observe(el));
        return () => observer.disconnect();
    }, []);

    const jumpTo = (index) => {
        beatRefs.current[index]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    };

    return (
        <section aria-labelledby="how-it-started" className="bg-ground">
            {/* Mobile year rail */}
            <nav
                aria-label="Story years"
                className="sticky top-header z-raised border-b border-edge-subtle bg-ground/95 backdrop-blur-sm lg:hidden"
            >
                <ol className="mx-auto flex max-w-content gap-6 px-5 md:px-8">
                    {BEATS.map((beat, i) => (
                        <li key={beat.year}>
                            <button
                                type="button"
                                onClick={() => jumpTo(i)}
                                aria-current={active === i ? 'step' : undefined}
                                className={`relative min-h-[48px] text-[15px] font-semibold transition-colors duration-ui ${
                                    active === i ? 'text-accent-ink' : 'text-ink-muted'
                                }`}
                            >
                                {beat.year}
                                <span
                                    aria-hidden="true"
                                    className={`absolute inset-x-0 bottom-0 h-[2px] origin-left bg-accent transition-transform duration-ui ease-standard ${
                                        active === i ? 'scale-x-100' : 'scale-x-0'
                                    }`}
                                />
                            </button>
                        </li>
                    ))}
                </ol>
            </nav>

            <div className="mx-auto w-full max-w-content px-5 py-section md:px-8 lg:px-6">
                <p id="how-it-started" className="t-label !text-accent-ink">How it started</p>

                <div className="mt-8 lg:mt-12 lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-16">
                    {/* Desktop pinned frame */}
                    <div className="hidden lg:block">
                        <div className="sticky top-[calc(var(--header-height)_+_40px)]">
                            <div className="relative aspect-[5/6] overflow-hidden rounded-media bg-ground-sunk">
                                {BEATS.map((beat, i) => (
                                    <div
                                        key={beat.year}
                                        aria-hidden={active !== i}
                                        className={`absolute inset-0 transition-opacity duration-media ease-standard motion-reduce:transition-none ${
                                            active === i ? 'opacity-100' : 'opacity-0'
                                        }`}
                                    >
                                        <BeatMedia beat={beat} sizes="(min-width: 1280px) 560px, 45vw" />
                                    </div>
                                ))}
                            </div>
                            <p className="t-caption mt-3">
                                {active === 0 ? 'Aman Singh and Suraj Singh' : BEATS[active].media.alt}
                            </p>
                        </div>
                    </div>

                    <ol className="space-y-16 lg:space-y-0">
                        {BEATS.map((beat, i) => (
                            <li
                                key={beat.year}
                                ref={(el) => { beatRefs.current[i] = el; }}
                                data-index={i}
                                className={`scroll-mt-[120px] transition-opacity duration-entrance ease-standard lg:flex lg:min-h-[72vh] lg:flex-col lg:justify-center ${
                                    active === i ? 'lg:opacity-100' : 'lg:opacity-30'
                                }`}
                            >
                                <div className="mb-6 overflow-hidden rounded-media lg:hidden">
                                    <div className="relative aspect-[4/3]">
                                        <BeatMedia beat={beat} sizes="(max-width: 970px) 100vw, 1px" />
                                    </div>
                                </div>
                                <p className="font-display text-[64px] leading-none text-accent lg:text-[112px]">{beat.year}</p>
                                <h2 className="t-display-2 mt-3">{beat.title}</h2>
                                <p className="t-body mt-3">{beat.body}</p>
                                {beat.link === 'youtube' && youtube && (
                                    <a
                                        href={youtube}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="mt-4 inline-flex min-h-[44px] items-center gap-2 text-[15px] font-semibold text-accent-ink hover:text-ink"
                                    >
                                        Watch on YouTube <span aria-hidden="true">→</span>
                                    </a>
                                )}
                            </li>
                        ))}
                    </ol>
                </div>
            </div>
        </section>
    );
}

function BeatMedia({ beat, sizes }) {
    if (beat.media === 'founders') {
        return (
            <div className="grid h-full grid-cols-2 gap-[2px]">
                {FOUNDERS.map((f) => (
                    <div key={f.name} className="relative h-full">
                        <Image src={f.image} alt={f.alt} fill placeholder="blur" unoptimized sizes={sizes} className="object-cover" />
                    </div>
                ))}
            </div>
        );
    }
    return <Image src={beat.media.src} alt={beat.media.alt} fill sizes={sizes} className="object-cover" />;
}
