'use client';

/**
 * The crew shot — the whole studio in one frame, wine-black ground.
 *
 * The photo is the LCP: eager, high priority, painted at once. Its only motion
 * is a CSS settle (transform), a one-shot gold light leak over the window
 * streaks, and a scroll-driven drift/dim as the ivory sheet slides over it.
 *
 * Phones: thirteen people across a 390px screen are 30px tall, so the line-up
 * becomes a pan — a native horizontal scroll at a readable height, starting on
 * the centre of the frame, with a hint that fades after the first move.
 *
 * Desktop: a follow spot. A soft pool of light trails the pointer across the
 * line-up and the rest of the frame dims, like a lighting check on set. One
 * element, moved by transform from a rAF — no React state per frame.
 */
import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { FiArrowLeft, FiArrowRight } from 'react-icons/fi';
import { Em } from '@/Component/home/Chapter.jsx';

const srcSetOf = (variants = []) => variants.map((v) => `${v.url} ${v.width}w`).join(', ') || undefined;

function GroupImage({ group, alt }) {
    if (group.image) {
        return <Image src={group.image} alt={alt} fill sizes="(max-width: 767px) 170svh, 100vw" placeholder="blur"
            loading="eager" fetchPriority="high" className="object-cover object-[50%_42%]" />;
    }
    return (
        // eslint-disable-next-line @next/next/no-img-element -- R2 webp ladder with its own srcset (the LCP)
        <img src={group.variants?.find((v) => v.width >= 1024)?.url || group.src} srcSet={srcSetOf(group.variants)}
            sizes="(max-width: 767px) 170svh, 100vw" alt={alt} width={group.width} height={group.height}
            loading="eager" fetchPriority="high" decoding="async"
            style={group.blurDataURL ? { backgroundImage: `url(${group.blurDataURL})`, backgroundSize: 'cover' } : undefined}
            className="absolute inset-0 h-full w-full object-cover object-[50%_42%]" />
    );
}

export default function CrewHero({ group, count, facts, names }) {
    const panRef = useRef(null);
    const spotRef = useRef(null);
    const frameRef = useRef(null);
    const [panned, setPanned] = useState(false);
    const alt = `The Wedding Vachan crew${names.length ? `: ${names.join(', ')}` : ''}`;

    // Phones: start the pan on the centre of the line-up (the founders).
    useEffect(() => {
        const el = panRef.current;
        if (!el || el.scrollWidth <= el.clientWidth) return undefined;
        el.scrollLeft = (el.scrollWidth - el.clientWidth) / 2;
        const onScroll = () => { setPanned(true); el.removeEventListener('scroll', onScroll); };
        // The programmatic scroll above fires one event; listen after it.
        const t = setTimeout(() => el.addEventListener('scroll', onScroll, { passive: true }), 120);
        return () => { clearTimeout(t); el.removeEventListener('scroll', onScroll); };
    }, []);

    // Desktop follow spot: transform-only, one write per frame at most.
    useEffect(() => {
        const frame = frameRef.current; const spot = spotRef.current;
        if (!frame || !spot || !window.matchMedia('(hover: hover) and (pointer: fine)').matches) return undefined;
        const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        let raf = 0; let x = 0; let y = 0;
        const paint = () => { raf = 0; spot.style.transform = `translate3d(${x}px, ${y}px, 0) scale(2)`; };
        const move = (e) => {
            const r = frame.getBoundingClientRect();
            x = e.clientX - r.left; y = e.clientY - r.top;
            if (!raf) raf = requestAnimationFrame(paint);
        };
        const enter = (e) => { spot.style.willChange = 'transform'; move(e); spot.style.opacity = '1'; };
        const leave = () => { spot.style.opacity = '0'; spot.style.willChange = 'auto'; };
        spot.style.transition = still ? 'opacity 120ms linear' : 'opacity 420ms var(--ease-entrance), transform 260ms var(--ease-entrance)';
        frame.addEventListener('pointerenter', enter);
        frame.addEventListener('pointermove', move, { passive: true });
        frame.addEventListener('pointerleave', leave);
        return () => {
            cancelAnimationFrame(raf);
            frame.removeEventListener('pointerenter', enter);
            frame.removeEventListener('pointermove', move);
            frame.removeEventListener('pointerleave', leave);
        };
    }, []);

    return (
        <section aria-labelledby="crew-title"
            className="relative -mt-[calc(var(--header-height)+0.75rem)] overflow-hidden bg-ground-deep text-ink-onDeep lg:-mx-4">
            <div ref={frameRef} className="crew-drift relative h-[min(100svh,980px)] min-h-[620px]">
                {/* Phones: a horizontal pan along the line-up. md+: the frame fills the width. */}
                <div ref={panRef} className="absolute inset-0 overflow-x-auto overflow-y-hidden overscroll-x-contain scrollbar-none md:overflow-hidden">
                    <div className="relative h-full w-[170svh] max-w-none md:w-full">
                        <div className="crew-photo absolute inset-0">
                            <GroupImage group={group} alt={alt} />
                        </div>
                        {/* gold light leak over the window streaks (top right) */}
                        <span aria-hidden="true" className="crew-leak pointer-events-none absolute inset-0 opacity-0 mix-blend-soft-light
                            [background:radial-gradient(60%_55%_at_88%_6%,rgb(var(--gold-rgb)/0.95),transparent_70%)]" />
                    </div>
                </div>

                {/* Desktop follow spot: the frame dims except for a pool of light around the pointer. */}
                <span aria-hidden="true" className="pointer-events-none absolute inset-0 hidden overflow-hidden md:block">
                    {/* 1200px layer drawn at 2x: a soft gradient upscales cleanly at a quarter of the memory */}
                    <span ref={spotRef} className="absolute -left-[600px] -top-[600px] h-[1200px] w-[1200px] opacity-0
                        [background:radial-gradient(circle_at_center,transparent_0,transparent_75px,rgb(var(--ground-deep-rgb)/0.55)_165px)]" />
                </span>

                {/* legibility: header on top, copy at the bottom; dims further on scroll */}
                <span aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-ground-deep/80 to-transparent" />
                <span aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 h-[62%] bg-gradient-to-t from-ground-deep via-ground-deep/75 to-transparent" />
                <span aria-hidden="true" className="crew-dim pointer-events-none absolute inset-0 bg-ground-deep opacity-0" />

                {/* Pan hint (phones) */}
                <span aria-hidden="true"
                    className={`pointer-events-none absolute left-1/2 top-[calc(var(--header-height)+1.25rem)] -translate-x-1/2 items-center gap-2 whitespace-nowrap rounded-full bg-white/80 px-3 py-1.5
                                text-[12px] font-semibold text-ink shadow-[0_4px_14px_-6px_rgba(0,0,0,0.5)] backdrop-blur-md transition-opacity duration-ui md:hidden
                                ${panned ? 'flex opacity-0' : 'flex opacity-100'}`}>
                    <FiArrowLeft className="h-3.5 w-3.5" /> Swipe along the crew <FiArrowRight className="h-3.5 w-3.5" />
                </span>

                <div className="pointer-events-none absolute inset-x-0 bottom-0 pb-14 sm:pb-16 lg:pb-20">
                    <div className="mx-auto w-full max-w-wide px-5 md:px-8 lg:px-10">
                        <p className="inline-flex items-center gap-2 rounded-full bg-white/10 py-1 pl-1 pr-3.5 text-[12.5px] font-semibold text-ink-onDeep ring-1 ring-white/15 backdrop-blur-md">
                            <span className="grid h-6 min-w-6 place-items-center rounded-full bg-gold px-1.5 text-[10.5px] tabular-nums text-ground-deep">{count}</span>
                            The team
                        </p>
                        <h1 id="crew-title" className="mt-4 max-w-3xl text-balance text-[44px] font-semibold leading-[0.98] tracking-[-0.035em] sm:text-[64px] lg:text-[84px]">
                            One crew. <span className="[&_em]:text-gold"><Em>Every</Em></span> frame.
                        </h1>
                        <p className="mt-4 max-w-xl text-[15.5px] leading-relaxed text-ink-onDeep/75 sm:text-[17px]">
                            The founders, the managing director and the camera, stills and edit teams. These are the people who will be with you on your wedding day.
                        </p>
                        <ul className="mt-6 flex flex-wrap gap-2" aria-label="The team in numbers">
                            {facts.map((f, k) => (
                                <li key={f.label} style={{ animationDelay: `${200 + k * 60}ms` }}
                                    className="hero-fact rounded-full bg-white/[0.08] px-3.5 py-1.5 text-[13px] text-ink-onDeep/85 ring-1 ring-white/10 backdrop-blur-md">
                                    <span className="font-semibold tabular-nums text-ink-onDeep">{f.value}</span> {f.label}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </div>
        </section>
    );
}
