'use client';

/**
 * Services — a bento of the six things the studio makes.
 *
 * One hero card (films, the core of the studio), four photo tiles, one wide
 * tile and a wine-black call-to-action card, so the section reads as a set of
 * choices rather than a list. next/image (static imports, blur placeholder)
 * replaced an <img> that faded in on onLoad — which never fired when the image
 * beat hydration, leaving the cards blank.
 */
import { memo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { FiArrowUpRight, FiStar } from 'react-icons/fi';
import Chapter, { Em, ArrowDot, GlassChip, CARD, CARD_DEEP } from '@/Component/home/Chapter.jsx';

import homeImage1 from '@/Asset/Home/homeImage1.jpg';
import homeImage2 from '@/Asset/Home/homeImage2.jpeg';
import homeImage3 from '@/Asset/Home/homeImage3.jpg';
import homeImage4 from '@/Asset/Home/homeImage4.jpg';
import homeImage5 from '@/Asset/Home/homeImage5.jpg';
import homeImage6 from '@/Asset/Home/homeImage6.jpg';
import { STUDIO_WHATSAPP } from '@/lib/siteConfig.js';

/**
 * Where each service actually leads. Two of the six — Baby Celebrations and
 * Same-Day Edits — have no page of their own, so they lead to the enquiry form
 * rather than to a gallery that does not show them.
 */
const SERVICES = [
    {
        title: 'Cinematic Wedding Films',
        description: 'A film of your wedding, shot in 4K, with every tear and every laugh in it.',
        image: homeImage1,
        href: '/films',
        cta: 'Watch the films',
    },
    {
        title: 'Storybook Photography',
        description: 'Photographs of your day that you will want to print and keep.',
        image: homeImage4,
        href: '/photos',
        cta: 'See the photographs',
    },
    {
        title: 'Pre-Wedding Adventures',
        description: 'Romantic shoots that tell your unique love story before the big day.',
        image: homeImage3,
        href: '/photos',
        cta: 'See the photographs',
    },
    {
        title: 'Engagement Stories',
        description: 'A shoot before the wedding, somewhere that means something to you.',
        image: homeImage6,
        href: '/photos',
        cta: 'See the photographs',
    },
    {
        title: 'Baby Celebrations',
        description: 'The ring, the families and the first celebration, filmed and photographed.',
        image: homeImage2,
        href: '/contact',
        cta: 'Ask about this',
    },
    {
        title: 'Same-Day Edits',
        description: 'Your highlights within hours, in time for the reception and for social media.',
        image: homeImage5,
        href: '/contact',
        cta: 'Ask about this',
    },
];

function Tile({ svc, d = 0, className = '', imageClass = 'aspect-[4/3]' }) {
    return (
        <Link href={svc.href} data-rise="" style={{ '--d': d }} className={`group flex cursor-pointer flex-col overflow-hidden p-2 transition-[box-shadow,transform] duration-ui ease-standard motion-safe:active:scale-[0.985]
                                          hover:shadow-[0_20px_40px_-22px_rgba(51,22,26,0.45)] focus-ring ${CARD} ${className}`}>
            <span className={`relative block overflow-hidden rounded-[22px] bg-ground-sunk ${imageClass}`}>
                <Image src={svc.image} alt="" fill placeholder="blur" sizes="(max-width: 640px) 50vw, 300px"
                    className="object-cover transition-transform duration-media ease-entrance group-hover:scale-[1.05]" />
            </span>
            <span className="flex flex-1 items-end justify-between gap-2 px-2 pb-1.5 pt-3">
                <span className="min-w-0">
                    <span className="block text-[15px] font-semibold leading-snug text-ink sm:text-[16px]">{svc.title}</span>
                    <span className="mt-0.5 hidden text-[13.5px] leading-snug text-ink-muted sm:block">{svc.description}</span>
                </span>
                <ArrowDot size="sm" />
            </span>
        </Link>
    );
}

function OurServices() {
    const whatsapp = `https://wa.me/${STUDIO_WHATSAPP}`;
    const external = whatsapp.startsWith('http') ? { target: '_blank', rel: 'noopener noreferrer' } : {};
    const [hero, ...rest] = SERVICES;
    const tiles = rest.slice(0, 4);
    const wide = rest[4];

    return (
        <Chapter id="services" label="Services" glow="left"
            title={<>Everything we <Em>make</Em> for your wedding</>}
            lead="Films, photographs, or both. Choose what you need.">
            <div className="mt-8 grid grid-cols-2 gap-3 sm:mt-12 lg:grid-cols-4 lg:gap-4">
                {/* Hero card */}
                <Link href={hero.href} data-rise="fade"
                    className="group relative col-span-2 transition-transform duration-ui ease-standard motion-safe:active:scale-[0.985] aspect-[5/4] cursor-pointer overflow-hidden rounded-[28px] bg-ground-sunk
                               shadow-[0_22px_44px_-24px_rgba(51,22,26,0.6)] focus-ring sm:aspect-[16/10] lg:row-span-2 lg:aspect-auto">
                    <Image src={hero.image} alt="" fill placeholder="blur" sizes="(max-width: 1024px) 100vw, 600px"
                        className="object-cover transition-transform duration-media ease-entrance group-hover:scale-[1.04]" />
                    <span aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                    <span className="absolute inset-x-3 top-3 flex items-start justify-between">
                        <GlassChip><FiStar aria-hidden="true" className="h-3.5 w-3.5 text-accent" />Most booked</GlassChip>
                        <ArrowDot tone="glass" />
                    </span>
                    <span className="absolute inset-x-2 bottom-2 rounded-[22px] bg-white/80 p-4 backdrop-blur-md sm:p-5">
                        <span className="block text-[19px] font-semibold leading-tight tracking-[-0.01em] text-ink sm:text-[22px]">{hero.title}</span>
                        <span className="mt-1 block text-[14px] leading-snug text-ink-secondary">{hero.description}</span>
                    </span>
                </Link>

                {tiles.map((svc, k) => <Tile key={svc.title} svc={svc} d={k % 2} />)}

                {/* Wide tile */}
                {wide && (
                    <Link href={wide.href} data-rise=""
                        className={`group col-span-2 flex cursor-pointer items-center gap-4 p-2 pr-4 transition-[box-shadow,transform] duration-ui ease-standard motion-safe:active:scale-[0.985]
                                    hover:shadow-[0_20px_40px_-22px_rgba(51,22,26,0.45)] focus-ring ${CARD}`}>
                        <span className="relative aspect-square w-24 shrink-0 overflow-hidden rounded-[22px] bg-ground-sunk sm:w-28">
                            <Image src={wide.image} alt="" fill placeholder="blur" sizes="112px" className="object-cover" />
                        </span>
                        <span className="min-w-0 flex-1">
                            <span className="inline-flex rounded-full bg-accent-wash px-2.5 py-1 text-[11.5px] font-semibold text-accent-ink">Within hours</span>
                            <span className="mt-1.5 block text-[16px] font-semibold leading-snug text-ink">{wide.title}</span>
                            <span className="mt-0.5 block text-[13.5px] leading-snug text-ink-muted">{wide.description}</span>
                        </span>
                        <ArrowDot size="sm" />
                    </Link>
                )}

                {/* Call to action */}
                <div data-rise="" style={{ '--d': 1 }} className={`col-span-2 flex flex-col justify-between gap-5 p-6 sm:flex-row sm:items-center lg:col-span-2 ${CARD_DEEP}`}>
                    <span>
                        <span className="block text-[20px] font-semibold leading-tight tracking-[-0.01em]">Not on the list?</span>
                        <span className="mt-1 block text-[14.5px] leading-snug text-ink-onDeep/70">Every package is built around your celebration.</span>
                    </span>
                    <a href={whatsapp} {...external}
                        className="group inline-flex h-12 shrink-0 cursor-pointer items-center justify-between gap-3 rounded-full bg-accent pl-5 pr-1.5 text-[14.5px]
                                   font-semibold text-ink-onAccent transition-colors duration-micro ease-standard hover:bg-accent-hover focus-ring">
                        Plan your package
                        <span aria-hidden="true" className="grid h-9 w-9 place-items-center rounded-full bg-white/20">
                            <FiArrowUpRight className="h-4 w-4" />
                        </span>
                    </a>
                </div>
            </div>
        </Chapter>
    );
}

export default memo(OurServices);
