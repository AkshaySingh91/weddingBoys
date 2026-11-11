'use client';

import { focusStyle } from '@/lib/focus.js';
import React, { useState, useEffect, useLayoutEffect, useRef, startTransition } from 'react';
import Link from 'next/link';
import { FiArrowRight, FiPlay, FiCalendar } from 'react-icons/fi';
import Chapter, { ChapterAction, Em, ArrowDot, GlassChip, CARD } from '@/Component/home/Chapter.jsx';
import CategoryDrill from '@/Component/ui/CategoryDrill.jsx';
import CategoryTiers from '@/Component/ui/CategoryTiers.jsx';
import { Skeleton } from '@/Component/ui/Skeleton.jsx';

const api_url = process.env.NEXT_PUBLIC_API_URL;

/**
 * The CMS supplies the section's heading and placement. Its data contains the
 * same complete film discovery groups as /films, resolved on the server.
 * Switching groups or categories never needs another request.
 */
export default function VideoThumbnail({ data } = {}) {
    const [loaded, setLoaded] = useState(null);
    const [loadError, setLoadError] = useState('');
    const [group, setGroup] = useState('featured');
    const [selectedKey, setSelectedKey] = useState('best-films');
    const source = data?.groups ? data : loaded;
    const tabs = source?.tabs || source?.rows || [];
    const groups = source?.groups || [];
    const selected = tabs.find(t => t.key === selectedKey) || tabs[0];
    const clients = selected?.items || [];
    const isLoading = !source && !loadError;
    useEffect(() => {
        if (data?.groups) return;
        const controller = new AbortController();
        fetch(`${api_url || ''}/api/films/discovery`, { signal: controller.signal })
            .then(r => { if (!r.ok) throw Error('Films could not be loaded.'); return r.json(); })
            .then(setLoaded).catch(e => { if (!controller.signal.aborted) setLoadError(e.message); });
        return () => controller.abort();
    }, [data]);
    const ALL_FILMS = { href: '/films', label: 'Explore all films' };
    const currentGroup = groups.find(g => g.key === group);

    // Content swap: new cards enter from the side you moved towards; the rail
    // itself stays mounted (no remount, no focus loss) and returns to its start.
    const order = groups.flatMap(g => g.rows.map(r => r.key));
    const [dir, setDir] = useState(1);
    const railRef = useRef(null);
    const choose = (g, k) => {
        setDir(order.indexOf(k) >= order.indexOf(selected?.key) ? 1 : -1);
        // First paint the chip; the 20+ cards follow in a transition (INP).
        startTransition(() => { setGroup(g); setSelectedKey(k); });
        // Warm the first few posters of the new category.
        const next = groups.find(x => x.key === g)?.rows.find(r => r.key === k)?.items || [];
        next.slice(0, 3).forEach(c => { if (c.thumbnailUrl) { const im = new window.Image(); im.src = c.thumbnailUrl; } });
    };
    useLayoutEffect(() => { if (railRef.current) railRef.current.scrollLeft = 0; }, [selected?.key]);
    return (
        <Chapter label="Films" glow="right" className="overflow-x-clip"
            title={<>Our <Em>films</Em>, cut like cinema</>}
            lead={data?.heading && data.heading !== 'Our films' ? data.heading : 'Start with our strongest stories, or find inspiration by destination, celebration and style.'}
            action={ALL_FILMS}>
            {/* Phones: one fixed-height drill row. Desktop: a folder — lens tabs on top,
                the sub-categories and the films inside the folder body. */}
            <div className="mt-7">
                {isLoading
                    ? <div className="flex h-[52px] items-center gap-2">{[0, 1, 2, 3].map(i => <Skeleton key={i} className="h-11 w-28" rounded="pill" />)}</div>
                    : (
                        <>
                            <CategoryDrill className="lg:hidden" label="Explore films by" groups={groups} group={group} value={selected?.key} onChange={choose} />
                            <CategoryTiers folder className="hidden lg:block" label="Explore films by" groups={groups} group={group} value={selected?.key} onChange={choose} />
                        </>
                    )}
            <div className="folder-body mt-4 lg:mt-0 lg:pt-2">
                <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
                    <p className="text-ink-muted">
                        {currentGroup && currentGroup.rows.length > 1 && <span className="text-ink-secondary">{currentGroup.label} › </span>}
                        <span className="font-semibold text-ink">{selected?.title || 'Our films'}</span> · <span key={clients.length} className="inline-block tabular-nums motion-safe:animate-[fadeUp_220ms_ease-out]">{clients.length}</span> {clients.length === 1 ? 'film' : 'films'} · favourites first
                    </p>
                    <Link href={selected?.key && selected.key !== 'best-films' ? `/allfilms?category=${encodeURIComponent(selected.key)}` : '/films'} className="font-semibold text-accent-ink focus-ring">View this category ↗</Link>
                </div>
                {loadError && <p role="alert" className="mt-3 text-ink-muted">{loadError} <Link href="/films">Browse films</Link></p>}

            <div ref={railRef} style={{ '--dir': dir }} className="mt-5 flex snap-x snap-mandatory gap-3 overflow-x-auto scrollbar-none pb-4
                            -mr-5 pr-5 md:-mr-8 md:pr-8 lg:mr-0 lg:gap-4 lg:pr-0">
                {isLoading ? (
                    [...Array(4)].map((_, i) => (
                        <Skeleton key={i} className="aspect-[4/5] w-[74vw] shrink-0 sm:w-[42vw] lg:w-[320px]" rounded="media" />
                    ))
                ) : clients && clients.length ? (
                    clients.map((c, k) => {
                        const couple = [c.clientName?.Bride, c.clientName?.Groom].filter(Boolean).join(' & ');
                        const meta = [c.videos?.videoShootDate, c.videos?.videoLocation?.city || c.videos?.videoLocation?.state].filter(Boolean).join(' · ');
                        return (
                            <Link href={`/films/${c.videos._id}`} key={`${selected?.key}-${c.videos._id}`}
                                style={{ animationDelay: `${Math.min(k, 3) * 45}ms` }}
                                className="group relative aspect-[4/5] w-[74vw] shrink-0 cursor-pointer snap-start overflow-hidden rounded-[28px] bg-ground-sunk transition-transform duration-ui ease-standard motion-safe:active:scale-[0.985]
                                           ${k < 4 ? 'wv-take' : ''}
                                           shadow-[0_18px_36px_-22px_rgba(51,22,26,0.6)] focus-ring sm:w-[42vw] lg:w-[320px]">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={c.thumbnailUrl} alt={`${couple} wedding film`} loading="lazy" decoding="async" style={focusStyle(c.focus)}
                                    className="absolute inset-0 h-full w-full object-cover transition-transform duration-media ease-entrance group-hover:scale-[1.04]" />
                                <span aria-hidden="true" className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/45 to-transparent" />
                                <span className="absolute inset-x-3 top-3 flex items-start justify-between gap-2">
                                    {meta ? <GlassChip><FiCalendar aria-hidden="true" className="h-3.5 w-3.5" />{meta}</GlassChip> : <span />}
                                    <ArrowDot tone="glass" />
                                </span>
                                <span className="absolute inset-x-2 bottom-2 flex items-center gap-3 rounded-[22px] bg-white/80 p-2 pl-4 backdrop-blur-md">
                                    <span className="min-w-0 flex-1">
                                        <span className="block truncate font-display text-[19px] font-medium leading-tight text-ink">{couple}</span>
                                        <span className="block text-[12px] font-medium text-ink-muted">{c.event || c.videos?.tags?.find(t => ['Pre-Wedding','Wedding','Haldi','Sangeet','Reception'].includes(t)) || 'Wedding film'}</span>
                                    </span>
                                    <span aria-hidden="true" className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-accent text-ink-onAccent">
                                        <FiPlay className="ml-0.5 h-4 w-4" />
                                    </span>
                                </span>
                            </Link>
                        );
                    })
                ) : (
                    <div className={`grid aspect-[4/5] w-[74vw] shrink-0 place-content-center px-6 text-center sm:w-[42vw] lg:w-[320px] ${CARD}`}>
                        <p className="text-[15px] text-ink-secondary">No films in this category yet.</p>
                        <Link href="/films" className="mt-3 inline-flex items-center gap-1.5 text-[14px] font-semibold text-accent-ink hover:text-accent">
                            Browse every film <FiArrowRight aria-hidden="true" className="h-4 w-4" />
                        </Link>
                    </div>
                )}
            </div>

            </div>
            </div>

            <ChapterAction action={ALL_FILMS} className="mt-4" />
        </Chapter>
    );
}
