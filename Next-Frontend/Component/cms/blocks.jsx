// No 'use client': these block renderers are pure presentational (next/image +
// next/link only, no hooks or browser APIs), so they work as React Server
// Components. When imported by a Server Component (BlockRenderer) they ship zero
// JS; when imported by the client CmsRender they render client-side. One source,
// both contexts.
import Image from 'next/image';
import Link from 'next/link';
import StatsBand from './StatsBand.jsx';

const mediaUrl = (m) => m?.url || m?.cdnUrl || m?.publicUrl || '';
const first = (arr) => (Array.isArray(arr) && arr.length ? arr[0] : null);

function SmartImage({ media, className, sizes = '100vw', priority = false }) {
    const url = mediaUrl(media);
    if (!url) return <div className={`bg-gradient-to-br from-rose-50 to-indigo-50 ${className}`} />;
    return (
        <Image
            src={url}
            alt={media.altText || media.title || ''}
            fill
            sizes={sizes}
            priority={priority}
            className={className}
        />
    );
}

function SectionHeading({ title, subtitle }) {
    if (!title && !subtitle) return null;
    return (
        <div className="mb-8 text-center">
            {title && <h2 className="t-display-2 mx-auto">{title}</h2>}
            {subtitle && <p className="mx-auto mt-2 max-w-2xl text-gray-500">{subtitle}</p>}
        </div>
    );
}

// ---- individual block renderers -------------------------------------------

function HeadingBlock({ block }) {
    return (
        <div className="py-10 text-center">
            {block.title && <h2 className="t-display-2 mx-auto">{block.title}</h2>}
            {block.subtitle && <p className="mt-2 text-gray-500">{block.subtitle}</p>}
        </div>
    );
}

function RichTextBlock({ block }) {
    return (
        <div className="mx-auto max-w-3xl py-10">
            {block.title && <h2 className="t-display-2 mx-auto mb-4">{block.title}</h2>}
            {block.body && <div className="prose prose-lg max-w-none text-gray-600" dangerouslySetInnerHTML={{ __html: block.body }} />}
        </div>
    );
}

function MediaSingleBlock({ block }) {
    const m = first(block.media);
    return (
        <figure className="mx-auto max-w-4xl py-10">
            <div className="relative aspect-[16/9] overflow-hidden rounded-2xl">
                <SmartImage media={m} className="object-cover" sizes="(max-width:1024px) 100vw, 1024px" />
            </div>
            {(block.title || m?.caption) && (
                <figcaption className="mt-2 text-center text-sm text-gray-500">{block.title || m?.caption}</figcaption>
            )}
        </figure>
    );
}

function MediaGalleryBlock({ block }) {
    const media = block.media || [];
    if (!media.length) return null;
    return (
        <section className="py-12">
            <SectionHeading title={block.title} subtitle={block.subtitle} />
            <div className="flex gap-3 overflow-x-auto px-4 pb-2 scrollbar-thin">
                {media.map((m, i) => (
                    <div key={m._id || i} className="relative aspect-[4/3] w-72 shrink-0 overflow-hidden rounded-xl">
                        <SmartImage media={m} className="object-cover" sizes="288px" />
                    </div>
                ))}
            </div>
        </section>
    );
}

function HeroVideoBlock({ block }) {
    const items = block.items || [];
    const lead = items[0];
    const leadMedia = first(lead?.media);
    return (
        <section className="py-8">
            {leadMedia && (
                <div className="relative mx-auto aspect-video w-full max-w-6xl overflow-hidden rounded-3xl bg-black">
                    {leadMedia.mediaType === 'Video' ? (
                        <video className="h-full w-full object-cover" src={mediaUrl(leadMedia)} autoPlay muted loop playsInline />
                    ) : (
                        <SmartImage media={leadMedia} className="object-cover" priority sizes="100vw" />
                    )}
                    {lead?.title && (
                        <div className="absolute bottom-6 left-6 text-white drop-shadow">
                            <p className="text-2xl font-semibold">{lead.title}</p>
                            {lead.link && <Link href={lead.link} className="text-sm underline">Watch the film</Link>}
                        </div>
                    )}
                </div>
            )}
            {items.length > 1 && (
                <div className="mx-auto mt-4 flex max-w-6xl gap-3 overflow-x-auto px-4 scrollbar-thin">
                    {items.slice(1).map((it, i) => {
                        const m = first(it.media);
                        return (
                            <Link key={it._id || i} href={it.link || '#'} className="relative aspect-video w-64 shrink-0 overflow-hidden rounded-xl bg-black">
                                {m?.mediaType === 'Video'
                                    ? <video className="h-full w-full object-cover" src={mediaUrl(m)} muted playsInline />
                                    : <SmartImage media={m} className="object-cover" sizes="256px" />}
                            </Link>
                        );
                    })}
                </div>
            )}
        </section>
    );
}

function ReviewsBlock({ block }) {
    const items = block.items || [];
    if (!items.length) return null;
    return (
        <section className="bg-rose-50/40 py-14">
            <SectionHeading title={block.title} subtitle={block.subtitle} />
            <div className="mx-auto grid max-w-5xl gap-6 px-4 sm:grid-cols-2 lg:grid-cols-3">
                {items.map((it, i) => {
                    const m = first(it.media);
                    return (
                        <figure key={it._id || i} className="flex flex-col rounded-2xl bg-white p-6 shadow-sm">
                            {m && (
                                <div className="relative mx-auto mb-4 h-20 w-20 overflow-hidden rounded-full">
                                    <SmartImage media={m} className="object-cover" sizes="80px" />
                                </div>
                            )}
                            <blockquote className="flex-1 text-center text-sm text-gray-600">“{it.body}”</blockquote>
                            <figcaption className="mt-4 text-center">
                                <span className="block font-medium text-gray-900">{it.title}</span>
                                {it.subtitle && <span className="text-xs text-gray-400">{it.subtitle}</span>}
                            </figcaption>
                        </figure>
                    );
                })}
            </div>
        </section>
    );
}

function TeamBlock({ block }) {
    const items = block.items || [];
    if (!items.length) return null;
    return (
        <section className="py-14">
            <SectionHeading title={block.title} subtitle={block.subtitle} />
            <div className="mx-auto grid max-w-5xl gap-6 px-4 sm:grid-cols-2 lg:grid-cols-4">
                {items.map((it, i) => {
                    const m = first(it.media);
                    return (
                        <div key={it._id || i} className="text-center">
                            <div className="relative mx-auto aspect-[3/4] w-full overflow-hidden rounded-2xl">
                                <SmartImage media={m} className="object-cover" sizes="(max-width:640px) 50vw, 240px" />
                            </div>
                            <p className="mt-3 font-medium text-gray-900">{it.title}</p>
                            {it.subtitle && <p className="text-sm text-rose-500">{it.subtitle}</p>}
                            {it.body && <p className="mt-1 text-xs text-gray-500">{it.body}</p>}
                        </div>
                    );
                })}
            </div>
        </section>
    );
}

function FeatureCardsBlock({ block }) {
    const items = block.items || [];
    return (
        <section className="py-14">
            <SectionHeading title={block.title} subtitle={block.subtitle} />
            <div className="mx-auto grid max-w-5xl gap-6 px-4 sm:grid-cols-2 lg:grid-cols-3">
                {items.map((it, i) => {
                    const m = first(it.media);
                    const card = (
                        <div className="h-full overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
                            {m && (
                                <div className="relative aspect-[16/10]">
                                    <SmartImage media={m} className="object-cover" sizes="(max-width:640px) 100vw, 33vw" />
                                </div>
                            )}
                            <div className="p-5">
                                <h3 className="font-semibold text-gray-900">{it.title}</h3>
                                {it.body && <p className="mt-1 text-sm text-gray-500">{it.body}</p>}
                            </div>
                        </div>
                    );
                    return it.link
                        ? <Link key={it._id || i} href={it.link}>{card}</Link>
                        : <div key={it._id || i}>{card}</div>;
                })}
            </div>
        </section>
    );
}

function CtaBlock({ block }) {
    return (
        <section className="px-4 py-12">
            <div className="mx-auto max-w-4xl rounded-3xl bg-gradient-to-br from-rose-600 to-amber-500 p-10 text-center text-white">
                {block.title && <h2 className="t-display-2 mx-auto">{block.title}</h2>}
                {block.subtitle && <p className="mt-2 text-white/90">{block.subtitle}</p>}
                {block.body && <p className="mx-auto mt-3 max-w-xl text-sm text-white/80">{block.body}</p>}
                {block.link && (
                    <Link href={block.link} className="mt-6 inline-block rounded-full bg-white px-6 py-2.5 text-sm font-medium text-rose-600 hover:bg-rose-50">
                        Learn more
                    </Link>
                )}
            </div>
        </section>
    );
}

// The track record, in the design it had inside "Our packages" (StatsBand is a
// client component: it counts up when scrolled into view).
function StatsBlock({ block }) {
    return <StatsBand title={block.title} subtitle={block.subtitle} items={block.items} />;
}

export const BLOCK_RENDERERS = {
    heading: HeadingBlock,
    richText: RichTextBlock,
    mediaSingle: MediaSingleBlock,
    mediaGallery: MediaGalleryBlock,
    heroVideo: HeroVideoBlock,
    reviews: ReviewsBlock,
    team: TeamBlock,
    featureCards: FeatureCardsBlock,
    cta: CtaBlock,
    stats: StatsBlock,
};
