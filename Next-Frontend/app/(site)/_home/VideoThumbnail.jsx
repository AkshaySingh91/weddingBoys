'use client';

import React, { useCallback, useState, useEffect } from 'react';
import Link from 'next/link';
import { FiArrowRight, FiPlay, FiCalendar } from 'react-icons/fi';
import Chapter, { ChapterAction, Em, ArrowDot, GlassChip, CARD } from '@/Component/home/Chapter.jsx';
import FilterRail from '@/Component/ui/FilterRail.jsx';
import { fireMessage } from '@/Utils/fireMessage.js';
import { Skeleton } from '@/Component/ui/Skeleton.jsx';

const api_url = process.env.NEXT_PUBLIC_API_URL;

/**
 * `data` (from the page composition, Admin › Content › Home): { heading,
 * defaultTab, tabs: [{ key, title, items }] } — each tab is a row from
 * Admin › Rows, already resolved on the server, so tabs switch instantly with no
 * request. Without it (CMS unreachable) the component reads the old tag list.
 */
export default function VideoThumbnail({ data } = {}) {
    const tabs = Array.isArray(data?.tabs) ? data.tabs : null;
    const firstTab = tabs ? (tabs.find((t) => t.key === data.defaultTab) || tabs[0]) : null;
    const [isLoading, setIsLoading] = useState(false);
    const [clients, setClients] = useState(firstTab ? firstTab.items : [])
    const [homepageTags, setHomepageTags] = useState(tabs ? tabs.map((t) => t.title) : [])
    const [selectedTag, setSelectedTag] = useState(firstTab ? firstTab.title : "");

    const fetchVideos = async (t) => {
        try {
            setIsLoading(true)
            const res = await fetch(`${api_url}/api/videos?tag=${t}`)
            const data = await res.json();
            if (res.status >= 300) {
                return fireMessage(data.message, 'error')
            }
            setClients(data.client)
        } catch (error) {
            console.log(error)
            return fireMessage(error.message, 'error')
        } finally {
            setIsLoading(false)
        }
    }
    const fetchHomeTags = useCallback(
        async () => {
            try {
                setIsLoading(true)
                const res = await fetch(`${api_url}/api/homepage/tags`)
                const data = await res.json();
                if (res.status >= 300) {
                    return fireMessage(data.message, 'error')
                }
                setHomepageTags(data.tags)
                if (data.tags.length > 0) {
                    await fetchVideos(data.tags[0]);
                    setSelectedTag(data.tags[0])
                }
            } catch (error) {
                return fireMessage(error.message, 'error')
            } finally {
                setIsLoading(false)
            }
        }, []);

    useEffect(() => {
        if (tabs) return; // composed on the server: nothing to fetch
        // eslint-disable-next-line react-hooks/set-state-in-effect
        fetchHomeTags();    //it is tag that are selected
    }, [fetchHomeTags, tabs])

    const handleChangeTag = (t) => {
        setSelectedTag(t);
        if (tabs) setClients(tabs.find((x) => x.title === t)?.items || []);
        else fetchVideos(t)
    }
    const ALL_FILMS = { href: '/films', label: 'All films' };
    const chipOptions = tabs
        ? tabs.map((t) => ({ value: t.title, label: t.title, count: t.items?.length ?? 0 }))
        : homepageTags;
    return (
        <Chapter label="Films" glow="right" className="overflow-x-clip"
            title={<>Our <Em>films</Em>, cut like cinema</>}
            lead={data?.heading && data.heading !== 'Our films' ? data.heading : 'Real weddings from across India — told as stories, not recaps.'}
            action={ALL_FILMS}>
            <div className="mt-7">
                {isLoading && !homepageTags.length ? (
                    <div className="flex gap-2">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-11 w-28 shrink-0" rounded="pill" />)}</div>
                ) : homepageTags.length > 1 && (
                    <FilterRail label="Filter films by category" options={chipOptions} value={selectedTag}
                        onChange={handleChangeTag} align="start" />
                )}
            </div>

            <div className="mt-5 flex snap-x snap-mandatory gap-3 overflow-x-auto scrollbar-none pb-4
                            -mr-5 pr-5 md:-mr-8 md:pr-8 lg:-mr-6 lg:gap-4 lg:pr-6">
                {isLoading ? (
                    [...Array(4)].map((_, i) => (
                        <Skeleton key={i} className="aspect-[4/5] w-[74vw] shrink-0 sm:w-[42vw] lg:w-[320px]" rounded="media" />
                    ))
                ) : clients && clients.length ? (
                    clients.map((c) => {
                        const couple = [c.clientName?.Bride, c.clientName?.Groom].filter(Boolean).join(' & ');
                        const meta = [c.videos?.videoShootDate, c.videos?.videoLocation?.city].filter(Boolean).join(' · ');
                        return (
                            <Link href={`/films/${c.videos._id}`} key={c.videos._id}
                                className="group relative aspect-[4/5] w-[74vw] shrink-0 cursor-pointer snap-start overflow-hidden rounded-[28px] bg-ground-sunk
                                           shadow-[0_18px_36px_-22px_rgba(51,22,26,0.6)] focus-ring sm:w-[42vw] lg:w-[320px]">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={c.thumbnailUrl} alt={`${couple} wedding film`} loading="lazy" decoding="async"
                                    className="absolute inset-0 h-full w-full object-cover transition-transform duration-media ease-entrance group-hover:scale-[1.04]" />
                                <span aria-hidden="true" className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/45 to-transparent" />
                                <span className="absolute inset-x-3 top-3 flex items-start justify-between gap-2">
                                    {meta ? <GlassChip><FiCalendar aria-hidden="true" className="h-3.5 w-3.5" />{meta}</GlassChip> : <span />}
                                    <ArrowDot tone="glass" />
                                </span>
                                <span className="absolute inset-x-2 bottom-2 flex items-center gap-3 rounded-[22px] bg-white/80 p-2 pl-4 backdrop-blur-md">
                                    <span className="min-w-0 flex-1">
                                        <span className="block truncate font-display text-[19px] font-medium leading-tight text-ink">{couple}</span>
                                        <span className="block text-[12px] font-medium text-ink-muted">Wedding film</span>
                                    </span>
                                    <span aria-hidden="true" className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-accent text-ink-onAccent">
                                        <FiPlay className="ml-0.5 h-4 w-4" />
                                    </span>
                                </span>
                            </Link>
                        );
                    })
                ) : (
                    <div className={`w-full px-6 py-10 text-center ${CARD}`}>
                        <p className="text-[15px] text-ink-secondary">No films in this category yet.</p>
                        <Link href="/films" className="mt-3 inline-flex items-center gap-1.5 text-[14px] font-semibold text-accent-ink hover:text-accent">
                            Browse every film <FiArrowRight aria-hidden="true" className="h-4 w-4" />
                        </Link>
                    </div>
                )}
            </div>

            <ChapterAction action={ALL_FILMS} className="mt-4" />
        </Chapter>
    );
}
