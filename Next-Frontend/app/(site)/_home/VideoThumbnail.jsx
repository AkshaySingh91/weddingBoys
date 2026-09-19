'use client';

import React, { useCallback, useState, useEffect } from 'react';
import Link from 'next/link';
import { FiArrowRight } from 'react-icons/fi';
import { fireMessage } from '@/Utils/fireMessage.js';
import Section from '@/Component/ui/Section.jsx';
import { Skeleton } from '@/Component/ui/Skeleton.jsx';

const api_url = process.env.NEXT_PUBLIC_API_URL;

export default function VideoThumbnail() {
    const [isLoading, setIsLoading] = useState(false);
    const [clients, setClients] = useState([])
    const [homepageTags, setHomepageTags] = useState([])
    const [selectedTag, setSelectedTag] = useState("");

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
        // eslint-disable-next-line react-hooks/set-state-in-effect
        fetchHomeTags();    //it is tag that are selected
    }, [fetchHomeTags])

    const handleChangeTag = (t) => {
        setSelectedTag(t);
        fetchVideos(t)
    }
    return (
        <Section width="wide" rhythm="tight" className="overflow-hidden">
            {/*
              Heading is an <h2>, not an <h1>. The home page carried FOUR <h1>
              elements and this was one of them (audit R-42); "Our Films" is a
              section label, not the page's subject.
            */}
            <div className="flex items-end justify-between gap-4 px-5 md:px-8 lg:px-12">
                <div>
                    <h2 className="t-display-2">Our films</h2>
                    <div className="rule-ornament mt-3 w-40" aria-hidden="true" />
                </div>
                <Link
                    href="/films"
                    className="hidden shrink-0 items-center gap-1.5 text-[14px] font-semibold
                               text-accent-ink transition-colors duration-micro ease-standard
                               hover:text-accent sm:inline-flex"
                >
                    All films
                    <FiArrowRight aria-hidden="true" className="h-4 w-4" />
                </Link>
            </div>

            {/* ── Filters. Left-aligned under the heading, so they read as a
                   control rather than as decoration floating mid-page. ── */}
            <div
                role="group"
                aria-label="Filter films by category"
                className="mt-6 flex gap-2 overflow-x-auto scrollbar-none px-5 md:px-8 lg:px-12"
            >
                {isLoading && !homepageTags.length
                    ? [...Array(3)].map((_, i) => (
                        <Skeleton key={i} className="h-10 w-28 shrink-0" rounded="pill" />
                    ))
                    : homepageTags.map((t) => {
                        const on = selectedTag === t;
                        return (
                            <button
                                key={t}
                                type="button"
                                onClick={() => handleChangeTag(t)}
                                aria-pressed={on}
                                className={`min-h-[44px] shrink-0 whitespace-nowrap rounded-pill border px-5
                                            text-[13px] font-semibold transition-colors duration-micro ease-standard
                                            ${on
                                                ? 'border-accent bg-accent text-white'
                                                : 'border-gold/50 bg-transparent text-ink-secondary hover:border-gold hover:bg-accent-wash hover:text-accent-ink'}`}
                            >
                                {t}
                            </button>
                        );
                    })}
            </div>

            {/* ── The rail.
                   A rail rather than a grid: a category holding two films used to
                   leave 55.6% of the viewport empty at 1425px because the cards
                   were a fixed 416×416. A rail has no empty cells — two films or
                   twenty both read as deliberate. Scroll-snap and a peeking next
                   card make it obvious there is more to the right.

                   A rail removes empty *cells*, but it does not fill a row on its
                   own: two 300px cards in a 1440px viewport still left ~800px of
                   void, which is the defect in a different shape. So when a
                   category holds three films or fewer the row centres, and only
                   then — centring a rail that overflows would clip the first card
                   out of reach. ── */}
            <div
                className={`mt-8 flex snap-x snap-mandatory gap-4 overflow-x-auto scrollbar-none
                            px-5 pb-2 md:px-8 lg:gap-6 lg:px-12
                            ${(clients?.length ?? 0) <= 3 ? 'lg:justify-center' : ''}`}
            >
                {isLoading ? (
                    [...Array(4)].map((_, i) => (
                        <div key={i} className="w-[68vw] shrink-0 sm:w-[46vw] lg:w-[300px]">
                            <Skeleton className="aspect-[4/5] w-full arch" />
                            <Skeleton className="mt-3 h-4 w-3/4" rounded="control" />
                        </div>
                    ))
                ) : clients && clients.length ? (
                    clients.map((c) => (
                        <Link
                            href={`/films/${c.videos._id}`}
                            key={c.videos._id}
                            className="group/film w-[68vw] shrink-0 snap-start sm:w-[46vw] lg:w-[300px]"
                        >
                            {/* Portrait 4:5 under the arch. This is where the dome
                                belongs — on a wide hero it read as a doorway; on a
                                portrait card it is ornament. */}
                            <div className="relative overflow-hidden arch border border-gold/35 bg-ground-sunk
                                            transition-transform duration-ui ease-standard
                                            group-hover/film:-translate-y-1">
                                <div className="aspect-[4/5] w-full">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                        src={c.thumbnailUrl}
                                        alt={`${c.clientName?.Bride} & ${c.clientName?.Groom} wedding film`}
                                        loading="lazy"
                                        decoding="async"
                                        className="h-full w-full object-cover transition-transform duration-media
                                                   ease-entrance group-hover/film:scale-[1.04]"
                                    />
                                </div>

                                {/* Scrim token. The old card set white text over a
                                    hand-rolled slate gradient and measured 1.0:1
                                    against its effective background (audit R-06). */}
                                <div aria-hidden="true" className="scrim-bottom pointer-events-none absolute inset-0" />

                                <div className="absolute inset-x-0 bottom-0 p-4 text-white lg:p-5">
                                    <p className="font-display text-[19px] font-semibold leading-tight lg:text-[21px]">
                                        {[c.clientName?.Bride, c.clientName?.Groom].filter(Boolean).join(' & ')}
                                    </p>
                                    <p className="mt-1 text-[12px] text-white/85">
                                        {[c.videos?.videoShootDate, c.videos?.videoLocation?.city]
                                            .filter(Boolean).join(' · ')}
                                    </p>
                                </div>
                            </div>
                        </Link>
                    ))
                ) : (
                    /* A designed empty state. The old one was a bare <p>No videos
                       found</p> with no styling and no way forward. */
                    <div className="w-full rounded-panel border border-gold/35 bg-ground-raised px-6 py-10 text-center">
                        <p className="t-body">No films in this category yet.</p>
                        <Link
                            href="/films"
                            className="mt-3 inline-flex items-center gap-1.5 text-[14px] font-semibold text-accent-ink
                                       transition-colors duration-micro ease-standard hover:text-accent"
                        >
                            Browse every film
                            <FiArrowRight aria-hidden="true" className="h-4 w-4" />
                        </Link>
                    </div>
                )}
            </div>

            {/* The desktop "All films" link is hidden on phones; this is its
                mobile equivalent, at full width where a thumb can reach it. */}
            <div className="mt-6 px-5 sm:hidden md:px-8">
                <Link
                    href="/films"
                    className="flex min-h-[44px] items-center justify-center gap-1.5 rounded-pill border
                               border-gold/50 text-[14px] font-semibold text-accent-ink transition-colors
                               duration-micro ease-standard hover:bg-accent-wash"
                >
                    All films
                    <FiArrowRight aria-hidden="true" className="h-4 w-4" />
                </Link>
            </div>
        </Section>
    );
}
