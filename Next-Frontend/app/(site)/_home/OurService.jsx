'use client';

/**
 * Our Magical Offerings.
 *
 * Six services, unchanged in number, title and description. What changed is
 * everything around them:
 *
 *  - Six cards differed only by two raw hex backgrounds (#9a724e51 / #e4b88f67)
 *    alternating down the grid. Muddy, off-token, and exactly the "identical
 *    rounded cards" pattern the brief bans. One card treatment now, and the
 *    photographs do the differentiating.
 *  - `border-2 border-slate-300` put a cold rgb(203,213,225) hairline on a warm
 *    ivory page — Tailwind slate was the audit's most-flagged colour family.
 *  - A `bg-pink-200/50` quarter-circle sat behind each icon puck, rotated 45°.
 *    The corner ornament is kept and re-cut in gold: it belongs to the theme now
 *    rather than fighting it.
 *  - ALL SIX links pointed at /photos, including Cinematic Wedding Films. Each
 *    now goes where it says, and the label says where that is instead of
 *    reading "Explore Gallery" six times.
 *  - The heading rendered in the sans face while the film row above it uses the
 *    display face; the two sections did not look like the same site.
 *  - The decorative SVG grid stroked #fff at 0.2 opacity on a cream ground, so
 *    it drew nothing at all. Replaced with the jaali the rest of the site uses.
 *  - The closing CTA was a <button> calling window.open(), so it could not be
 *    middle-clicked, opened in a new tab by keyboard, or read as a link — and
 *    it handed the opened tab a window.opener reference.
 *
 * Mobile showed all six at full size: 3,172px, roughly four screens. Four show;
 * the last two are one tap away. Nothing is removed.
 */
import { useState, memo } from 'react';
import Link from 'next/link';
import { FiCamera, FiFilm, FiVideo, FiMusic, FiHeart, FiGift, FiArrowRight, FiPlus, FiMinus } from 'react-icons/fi';
import { useStudioDetails } from '@/Context/StudioDetailsContext.jsx';
import Section from '@/Component/ui/Section.jsx';
import Button from '@/Component/ui/Button.jsx';

import homeImage1 from '@/Asset/Home/homeImage1.jpg';
import homeImage2 from '@/Asset/Home/homeImage2.jpeg';
import homeImage3 from '@/Asset/Home/homeImage3.jpg';
import homeImage4 from '@/Asset/Home/homeImage4.jpg';
import homeImage5 from '@/Asset/Home/homeImage5.jpg';
import homeImage6 from '@/Asset/Home/homeImage6.jpg';

/**
 * A photograph that fades in over the warm skeleton rather than over
 * `bg-gray-200 animate-pulse`, which read as broken on this ground (R-58). The
 * box is fixed by aspect ratio, so nothing moves when the image arrives.
 */
const ServiceImage = memo(function ServiceImage({ src, alt }) {
    const [loaded, setLoaded] = useState(false);
    return (
        <div className="relative aspect-[4/3] w-full overflow-hidden">
            {!loaded && <div aria-hidden="true" className="skeleton absolute inset-0" />}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
                src={src?.src ?? src}
                alt={alt}
                loading="lazy"
                decoding="async"
                onLoad={() => setLoaded(true)}
                className={`absolute inset-0 h-full w-full object-cover
                            transition-[opacity,transform] duration-media ease-entrance
                            group-hover/svc:scale-[1.04] ${loaded ? 'opacity-100' : 'opacity-0'}`}
            />
        </div>
    );
});

/**
 * Where each service actually leads. Two of the six — Baby Celebrations and
 * Same-Day Edits — have no page of their own, so they lead to the enquiry form
 * rather than to a gallery that does not show them.
 */
const SERVICES = [
    {
        title: 'Cinematic Wedding Films',
        description: 'Hollywood-style storytelling that captures every tear, laugh, and magical moment in 4K brilliance.',
        Icon: FiFilm,
        image: homeImage1,
        href: '/films',
        cta: 'Watch the films',
    },
    {
        title: 'Storybook Photography',
        description: 'Timeless images that transform your special day into a visual fairytale.',
        Icon: FiCamera,
        image: homeImage4,
        href: '/photos',
        cta: 'See the photographs',
    },
    {
        title: 'Pre-Wedding Adventures',
        description: 'Romantic shoots that tell your unique love story before the big day.',
        Icon: FiHeart,
        image: homeImage3,
        href: '/photos',
        cta: 'See the photographs',
    },
    {
        title: 'Engagement Stories',
        description: 'Capture the excitement of your new journey together.',
        Icon: FiGift,
        image: homeImage6,
        href: '/photos',
        cta: 'See the photographs',
    },
    {
        title: 'Baby Celebrations',
        description: 'Cherish the joy of new beginnings with heartwarming coverage.',
        Icon: FiMusic,
        image: homeImage2,
        href: '/contact',
        cta: 'Ask about this',
    },
    {
        title: 'Same-Day Edits',
        description: 'Your highlights delivered within hours - perfect for receptions and social media.',
        Icon: FiVideo,
        image: homeImage5,
        href: '/contact',
        cta: 'Ask about this',
    },
];

/** How many show on a phone before the reveal. */
const MOBILE_VISIBLE = 4;

function OurServices() {
    const { studioContact } = useStudioDetails();
    const [expanded, setExpanded] = useState(false);
    const hidden = SERVICES.length - MOBILE_VISIBLE;

    const whatsapp = studioContact?.[0] ? `https://wa.me/${studioContact[0]}` : '/contact';

    return (
        <Section id="services" width="wide" rhythm="tight" className="relative overflow-x-clip">
            {/* The lattice the rest of the site uses, in place of an SVG grid
                that stroked white on cream and therefore drew nothing. */}
            <div aria-hidden="true" className="jaali pointer-events-none absolute inset-0 opacity-[0.4]" />

            <div className="relative">
                <h2 className="t-display-2">Our Magical Offerings</h2>
                <div className="rule-ornament mt-2.5 w-36" aria-hidden="true" />

                <p className="t-body-lead mt-4 max-w-prose">
                    Every love story deserves its own visual symphony – discover how we transform
                    moments into everlasting memories.
                </p>
                <p className="t-heading-3 mt-2 text-accent-ink">
                    Beyond photography — creating living memories
                </p>

                <ul id="services-list" className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
                    {SERVICES.map((svc, idx) => {
                        const foldedAway = idx >= MOBILE_VISIBLE && !expanded;
                        return (
                            <li
                                key={svc.title}
                                className={foldedAway ? 'hidden sm:block' : 'block'}
                            >
                                {/* `relative` + the link's ::after makes the whole
                                    card clickable with exactly one anchor in it —
                                    a nested <a> would be invalid and unreadable. */}
                                <article
                                    className="group/svc relative flex h-full flex-col overflow-hidden
                                               rounded-media border border-gold/35 bg-ground-raised
                                               shadow-panel transition-transform duration-ui ease-standard
                                               hover:-translate-y-1 focus-within:-translate-y-1"
                                >
                                    <div className="relative">
                                        <ServiceImage src={svc.image} alt={svc.title} />

                                        {/* The corner ornament, re-cut. It was a
                                            pink quarter-circle on a red-and-gold
                                            site; the shape is kept, the colour is
                                            now the marigold the theme uses. */}
                                        <div
                                            aria-hidden="true"
                                            className="pointer-events-none absolute -right-6 -top-6 h-16 w-16
                                                       rotate-45 rounded-bl-full bg-marigold/30"
                                        />

                                        <span
                                            aria-hidden="true"
                                            className="absolute right-4 top-4 grid h-11 w-11 place-items-center
                                                       rounded-pill border border-gold/60 bg-ground/90
                                                       text-accent-ink backdrop-blur-sm"
                                        >
                                            <svc.Icon className="h-5 w-5" />
                                        </span>
                                    </div>

                                    <div className="flex flex-1 flex-col p-5 lg:p-6">
                                        <h3 className="t-heading-3">{svc.title}</h3>
                                        <p className="t-body-sm mt-2 flex-1">{svc.description}</p>

                                        <Link
                                            href={svc.href}
                                            className="mt-4 inline-flex items-center gap-1.5 self-start text-[14px]
                                                       font-semibold text-accent-ink transition-colors
                                                       duration-micro ease-standard hover:text-accent
                                                       after:absolute after:inset-0 after:content-['']"
                                        >
                                            {svc.cta}
                                            <FiArrowRight
                                                aria-hidden="true"
                                                className="h-4 w-4 transition-transform duration-micro
                                                           ease-standard group-hover/svc:translate-x-0.5"
                                            />
                                        </Link>
                                    </div>
                                </article>
                            </li>
                        );
                    })}
                </ul>

                {/* Phones only — from sm up the grid shows all six anyway. The
                    control stays mounted rather than disappearing on expand:
                    unmounting the button a keyboard user just pressed throws
                    focus back to the document and loses their place. */}
                <div className="mt-6 sm:hidden">
                    <Button
                        variant="secondary"
                        size="md"
                        className="w-full rounded-pill"
                        aria-expanded={expanded}
                        aria-controls="services-list"
                        onClick={() => setExpanded((v) => !v)}
                    >
                        {expanded ? (
                            <>
                                <FiMinus aria-hidden="true" className="h-4 w-4" />
                                Show fewer services
                            </>
                        ) : (
                            <>
                                <FiPlus aria-hidden="true" className="h-4 w-4" />
                                See all {SERVICES.length} services
                                <span className="sr-only">({hidden} more)</span>
                            </>
                        )}
                    </Button>
                </div>

                <div className="rule-ornament mt-12" aria-hidden="true" />

                <div className="mt-8 flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <p className="t-body max-w-prose">
                        Don&apos;t see exactly what you&apos;re looking for? We customize every package.
                    </p>
                    {/* Was a <button onClick={window.open(...,'_blank')}> — not
                        middle-clickable, not openable from the keyboard, and it
                        handed the new tab a window.opener handle. */}
                    <Button
                        href={whatsapp}
                        variant="primary"
                        size="lg"
                        className="shrink-0 rounded-pill"
                        {...(whatsapp.startsWith('http')
                            ? { target: '_blank', rel: 'noopener noreferrer' }
                            : {})}
                    >
                        <FiCamera aria-hidden="true" className="h-4 w-4" />
                        Create your perfect package
                    </Button>
                </div>
            </div>
        </Section>
    );
}

export default memo(OurServices);
