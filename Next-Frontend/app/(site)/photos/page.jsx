import { SITE_URL } from '@/lib/siteConfig.js';
import { composedSection } from '@/lib/pageComposition.js';
import Gallery from './_components/Gallery.jsx';
import { queryOf } from '@/lib/photos.js';

const api_url = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
const title = 'Wedding Photography Gallery | The Wedding Vachan';
const description =
    'Real Indian weddings photographed by The Wedding Vachan: haldi, mehendi, sangeet, pheras and pre-wedding shoots. Browse for poses, outfits and places, and save the ones you love.';

export const metadata = {
    title,
    description,
    alternates: { canonical: `${SITE_URL}/photos` },
    openGraph: { title, description, url: `${SITE_URL}/photos`, type: 'website' },
};

const getJSON = async (path) => {
    try {
        const res = await fetch(`${api_url}${path}`, { next: { revalidate: 300, tags: ['portfolio', 'photos'] } });
        return res.ok ? await res.json() : null;
    } catch {
        return null;
    }
};

/*
 * The first page is rendered here, so the HTML already holds the gallery: real
 * links and right-sized images. ?tag=a,b  ?q=text  ?page=n  are all honoured
 * (shareable filters; crawlable paging). Order and page size come from
 * Admin › Content › Photos.
 */
export default async function PhotosPage({ searchParams }) {
    const query = await searchParams;
    const tags = typeof query?.tag === 'string' ? query.tag.slice(0, 500).split(',').map((t) => t.trim()).filter(Boolean) : [];
    const q = typeof query?.q === 'string' ? query.q.slice(0, 80) : '';
    const page = Math.max(1, Math.min(50, Number.parseInt(query?.page, 10) || 1));
    const composed = await composedSection('photos', 'photoGallery');
    const sort = composed?.data?.sort || null;
    const pageSize = Math.min(48, Math.max(12, Number(composed?.data?.pageSize) || 24));

    const [initial, facets, studio] = await Promise.all([
        getJSON(`/api/photos?${queryOf({ tags, q, page, limit: pageSize, sort })}`),
        getJSON('/api/photos/facets'),
        getJSON('/api/studio/details'),
    ]);

    const photos = initial?.photos || [];
    const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        name: 'Wedding photographs',
        url: `${SITE_URL}/photos`,
        mainEntity: {
            '@type': 'ItemList',
            numberOfItems: initial?.total || photos.length,
            itemListElement: photos.slice(0, 24).map((p, i) => ({
                '@type': 'ListItem', position: i + 1, url: `${SITE_URL}/photos/${p._id}`,
            })),
        },
    };

    return (
        <>
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
            <Gallery key={`${tags.join(',')}|${q}|${page}`} initial={initial ? { ...initial, page } : null} facets={facets}
                initialTags={tags} initialQuery={q} sort={sort} pageSize={pageSize}
                studioPhone={studio?.studioDetails?.contact?.[0] || null} />
        </>
    );
}
