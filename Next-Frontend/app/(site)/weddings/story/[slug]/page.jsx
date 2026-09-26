import Link from 'next/link';
import { notFound, permanentRedirect } from 'next/navigation';
import Media from '@/Component/ui/Media.jsx';
import Section from '@/Component/ui/Section.jsx';
import Button from '@/Component/ui/Button.jsx';
import { SITE_URL } from '@/lib/siteConfig.js';
import WeddingCard from '../../_components/WeddingCard.jsx';
import StoryFilms from './_components/StoryFilms.jsx';

const api_url = process.env.NEXT_PUBLIC_API_URL;

// Server-rendered and cached; any portfolio change (publish, reorder, cover,
// slug) refreshes it at once through the `portfolio` tag (Backend/Services/revalidate.js).
export const revalidate = 3600;

/** { data } for a story, { redirectTo } for an old slug, or null. */
async function getStory(slug) {
    try {
        const res = await fetch(`${api_url}/api/weddings/${encodeURIComponent(slug)}`, {
            next: { revalidate: 3600, tags: ['portfolio'] },
        });
        if (!res.ok) return null;
        const data = await res.json();
        return data.redirectTo ? { redirectTo: data.redirectTo } : { data };
    } catch {
        return null;
    }
}

const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];
const place = (loc = {}) => [loc.venue, loc.city].filter(Boolean).join(', ');
/** Media's locked ratios, chosen from the photograph's own shape. */
const ratioOf = (a) => (!a ? 'still' : a < 0.9 ? 'portrait' : a > 1.2 ? 'still' : 'square');

export async function generateMetadata({ params }) {
    const { slug } = await params;
    const story = await getStory(slug);
    const w = story?.data?.wedding;
    if (!w) return { title: 'Wedding story | The Wedding Boys' };
    const where = w.location?.city ? ` in ${w.location.city}` : '';
    const title = `${w.title} — wedding${where} | The Wedding Boys`;
    const description = w.intro
        || `${w.title}'s wedding${where}: ${w.films ? `${w.films} film${w.films === 1 ? '' : 's'}` : ''}${w.films && w.photos ? ' and ' : ''}${w.photos ? `${w.photos} photographs` : ''} by The Wedding Boys.`;
    const url = `${SITE_URL}/weddings/story/${w.slug}`;
    return {
        title,
        description,
        alternates: { canonical: url },
        openGraph: { title, description, url, type: 'article', images: w.cover?.url ? [{ url: w.cover.url, alt: w.title }] : [] },
    };
}

export default async function WeddingStoryPage({ params }) {
    const { slug } = await params;
    const story = await getStory(slug);
    if (story?.redirectTo) permanentRedirect(`/weddings/story/${story.redirectTo}`);
    if (!story) notFound();

    const { wedding: w, films, ceremonies, crew, related, reviews = [] } = story.data;
    const chapters = ceremonies.filter((c) => c.photos.length);
    const url = `${SITE_URL}/weddings/story/${w.slug}`;

    // Structured data: a gallery of the wedding, with its films as videos.
    const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'ImageGallery',
        name: `${w.title} — wedding`,
        url,
        description: w.intro || undefined,
        image: w.cover?.url || undefined,
        contentLocation: w.location?.city ? { '@type': 'Place', name: place(w.location) } : undefined,
        creator: { '@type': 'Organization', name: 'The Wedding Boys', url: SITE_URL },
        associatedMedia: films.map((f) => ({
            '@type': 'VideoObject',
            name: f.caption || `${w.title} — wedding film`,
            thumbnailUrl: f.posterUrl || undefined,
            ...(f.embedUrl ? { embedUrl: f.embedUrl } : { contentUrl: f.webUrl || f.sourceUrl || undefined }),
            uploadDate: w.publishedAt || undefined,
        })),
    };

    return (
        <article className="bg-ground">
            <script type="application/ld+json"
                // `<` escaped so text in the data can never close the script tag.
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }} />

            {/* Cover — full width and square-cornered: the arch is for portrait frames. */}
            <header className="relative">
                <Media
                    src={w.cover?.url}
                    alt={`${w.title}, wedding`}
                    ratio="fill"
                    className="h-[68svh] min-h-[420px] max-h-[860px] w-full"
                    scrim="hero"
                    priority
                    sizes="100vw"
                    blurDataURL={w.cover?.blurDataURL}
                    dominantColor={w.cover?.dominantColor}
                    overlay={
                        <div className="absolute inset-x-0 bottom-0">
                            <div className="mx-auto w-full max-w-content px-5 pb-10 md:px-8 lg:px-6 lg:pb-14">
                                <h1 className="t-display-hero" style={{ color: 'var(--ink-on-deep)' }}>
                                    {w.couple.bride}
                                    <span className="block">&amp; {w.couple.groom}</span>
                                </h1>
                                <div className="mt-5 flex flex-wrap gap-x-10 gap-y-2" style={{ color: 'var(--ink-on-deep)' }}>
                                    {place(w.location) && <p className="t-body" style={{ color: 'inherit' }}>{place(w.location)}</p>}
                                    {w.dates && <p className="t-body" style={{ color: 'inherit' }}>{w.dates}</p>}
                                </div>
                            </div>
                        </div>
                    }
                />
            </header>

            {w.intro && (
                <Section width="prose" rhythm="normal">
                    <p className="t-body-lead whitespace-pre-line">{w.intro}</p>
                    <div className="rule-ornament mt-10" aria-hidden="true" />
                </Section>
            )}

            {films.length > 0 && (
                <Section width="content" rhythm={w.intro ? 'tight' : 'normal'} aria-labelledby="films-heading">
                    <h2 id="films-heading" className="t-display-2 mb-8">{films.length === 1 ? 'The film' : 'The films'}</h2>
                    <StoryFilms films={films} couple={w.title} />
                </Section>
            )}

            {/* The ceremonies, in the order they happened — a genuine sequence,
                so chapter numbers are earned here (DESIGN-SYSTEM.md §8.8). */}
            {chapters.map((c, i) => (
                <Section key={c.key} width="content" rhythm="normal" aria-labelledby={`ch-${c.key}`}
                    className={i % 2 === 1 ? 'bg-ground-sunk/60' : ''}>
                    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
                        <div>
                            {chapters.length > 1 && <p className="t-label mb-2">Chapter {ROMAN[i] || i + 1}</p>}
                            <h2 id={`ch-${c.key}`} className="t-display-1">{c.label}</h2>
                        </div>
                        <p className="t-caption">{c.photos.length} photograph{c.photos.length === 1 ? '' : 's'}</p>
                    </div>
                    <ul className="columns-1 gap-4 sm:columns-2 lg:columns-3">
                        {c.photos.map((p, j) => (
                            <li key={p._id} className="mb-4 break-inside-avoid">
                                <Link href={p.href} className="group block" aria-label={`${c.label} — photograph ${j + 1}`}>
                                    <Media
                                        src={p.imageUrl}
                                        alt={`${w.title}, ${c.label}`}
                                        ratio={j === 0 ? 'portrait' : ratioOf(p.aspectRatio)}
                                        // The chapter's opening photograph sits in the arch.
                                        className={j === 0 ? 'arch-soft border border-gold/40' : ''}
                                        imgClassName="transition-transform duration-media ease-standard group-hover:scale-[1.02]"
                                        blurDataURL={p.blurDataURL}
                                        dominantColor={p.dominantColor}
                                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 380px"
                                    />
                                </Link>
                            </li>
                        ))}
                    </ul>
                </Section>
            ))}

            {/* The couple's own words: a review linked to this wedding in Admin › Home › Couple reviews. */}
            {reviews.length > 0 && (
                <Section width="prose" rhythm="normal" aria-labelledby="words-heading">
                    <h2 id="words-heading" className="t-display-2 mb-8">In their words</h2>
                    <div className="space-y-10">
                        {reviews.map((r, i) => (
                            <figure key={i}>
                                <blockquote className="t-body-lead whitespace-pre-line">“{r.text}”</blockquote>
                                <figcaption className="mt-4">
                                    <span className="t-heading-3 block">{r.name}</span>
                                    {r.role && <span className="t-caption">{r.role}</span>}
                                </figcaption>
                            </figure>
                        ))}
                    </div>
                </Section>
            )}

            {crew.length > 0 && (
                <Section width="content" rhythm="normal" aria-labelledby="crew-heading">
                    <div className="rule-ornament mb-12" aria-hidden="true" />
                    <h2 id="crew-heading" className="t-display-2 mb-8">The crew</h2>
                    <dl className="grid gap-x-10 gap-y-6 sm:grid-cols-2 lg:grid-cols-3">
                        {crew.map((m) => (
                            <div key={m.name}>
                                <dt className="t-heading-3">{m.name}</dt>
                                {m.roles.length > 0 && <dd className="t-body-sm mt-1">{m.roles.join(', ')}</dd>}
                            </div>
                        ))}
                    </dl>
                </Section>
            )}

            {related.length > 0 && (
                <Section width="content" rhythm="normal" aria-labelledby="more-heading">
                    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
                        <h2 id="more-heading" className="t-display-2">More weddings</h2>
                        <Link href="/weddings" className="t-body-sm font-semibold text-accent-ink hover:text-ink">All wedding stories</Link>
                    </div>
                    <ul className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
                        {related.map((r) => <li key={r.slug}><WeddingCard wedding={r} /></li>)}
                    </ul>
                </Section>
            )}

            <Section width="prose" rhythm="loose" className="text-center">
                <div className="corners mx-auto border border-gold/40 bg-ground-raised px-6 py-12 sm:px-12">
                    <h2 className="t-display-2 mx-auto">Planning your wedding?</h2>
                    <p className="t-body mx-auto mt-4">Tell us about the days, the places and the people. We will tell you how we would film it.</p>
                    <div className="mt-8">
                        <Button href="/contact" variant="primary" size="lg">Enquire about your wedding</Button>
                    </div>
                </div>
            </Section>
        </article>
    );
}
