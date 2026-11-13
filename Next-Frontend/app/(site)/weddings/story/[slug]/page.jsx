import { notFound, permanentRedirect } from 'next/navigation';
import { SITE_URL } from '@/lib/siteConfig.js';
import WeddingStory from './_components/WeddingStory.jsx';
import { fetchFilmDiscovery } from '@/lib/filmDiscovery.js';

const api_url = process.env.NEXT_PUBLIC_API_URL;

// Server-rendered and cached; any portfolio change (publish, reorder, cover,
// slug) refreshes it at once through the `portfolio` tag (Backend/Services/revalidate.js).
export const revalidate = 3600;

/** { data } for a story, { redirectTo } for an old slug, or null. */
async function getStory(slug) {
    try {
        // `v=2`: the response gained wedding.story (about, quote, highlights); a new
        // cache key so a copy cached before that is never served.
        const res = await fetch(`${api_url}/api/weddings/${encodeURIComponent(slug)}?v=2`, {
            next: { revalidate: 3600, tags: ['portfolio'] },
        });
        if (!res.ok) return null;
        const data = await res.json();
        return data.redirectTo ? { redirectTo: data.redirectTo } : { data };
    } catch {
        return null;
    }
}

const place = (loc = {}) => [loc.venue, loc.city].filter(Boolean).join(', ');

export async function generateMetadata({ params }) {
    const { slug } = await params;
    const story = await getStory(slug);
    const w = story?.data?.wedding;
    if (!w) return { title: 'Wedding story | The Wedding Vachan' };
    const where = w.location?.city ? ` in ${w.location.city}` : '';
    const title = `${w.title}'s wedding${where} | The Wedding Vachan`;
    const description = w.story?.about?.join(' ').slice(0, 300) || w.intro
        || `${w.title}'s wedding${where}: ${w.films ? `${w.films} film${w.films === 1 ? '' : 's'}` : ''}${w.films && w.photos ? ' and ' : ''}${w.photos ? `${w.photos} photographs` : ''} by The Wedding Vachan.`;
    const url = `${SITE_URL}/weddings/story/${w.slug}`;
    return {
        title,
        description,
        alternates: { canonical: url },
        openGraph: { title, description, url, type: 'article', images: w.cover?.url ? [{ url: w.cover.url, alt: w.title }] : [] },
    };
}

export default async function WeddingStoryPage({ params, searchParams }) {
    const [{ slug }, query] = await Promise.all([params, searchParams]);
    const [story, discovery] = await Promise.all([getStory(slug), fetchFilmDiscovery()]);
    if (story?.redirectTo) permanentRedirect(`/weddings/story/${story.redirectTo}${query?.film ? `?film=${encodeURIComponent(query.film)}` : ''}`);
    if (!story) notFound();
    const { wedding: w, films } = story.data;
    const url = `${SITE_URL}/weddings/story/${w.slug}`;
    // Structured data: a gallery of the wedding, with its films as videos.
    const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'ImageGallery',
        name: `${w.title}'s wedding`,
        url,
        description: w.story?.about?.join(' ') || w.intro || undefined,
        image: w.cover?.url || undefined,
        contentLocation: w.location?.city ? { '@type': 'Place', name: place(w.location) } : undefined,
        creator: { '@type': 'Organization', name: 'The Wedding Vachan', url: SITE_URL },
        associatedMedia: films.map((f) => ({
            '@type': 'VideoObject',
            name: f.caption || `${w.title}, ${f.ceremony || 'wedding'} film`,
            thumbnailUrl: f.posterUrl || undefined,
            ...(f.durationSec ? { duration: `PT${Math.round(f.durationSec)}S` } : {}),
            ...(f.embedUrl ? { embedUrl: f.embedUrl } : { contentUrl: f.webUrl || f.sourceUrl || undefined }),
            uploadDate: w.publishedAt || undefined,
        })),
    };
    const filmId = typeof query?.film === 'string' ? query.film : null;
    return (
        <>
            <script type="application/ld+json"
                // `<` escaped so text in the data can never close the script tag.
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }} />
            <WeddingStory data={story.data} filmId={filmId} rows={discovery?.rows || []} />
        </>
    );
}
