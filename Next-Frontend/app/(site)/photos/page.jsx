import { SITE_URL } from '@/lib/siteConfig.js';
import PhotosClient from './_components/PhotosClient.jsx';
import { composedSection } from '@/lib/pageComposition.js';

const title = 'Wedding Photography Gallery | The Wedding Vachan';
const description =
    'A gallery of real Indian weddings — candid moments, portraits, rituals and celebration, photographed by The Wedding Vachan.';

export const metadata = {
    title,
    description,
    alternates: { canonical: `${SITE_URL}/photos` },
    openGraph: { title, description, url: `${SITE_URL}/photos`, type: 'website' },
};

// Filter groups, order and page size come from Admin › Content › Photos.
export default async function PhotosPage({ searchParams }) {
    const query = await searchParams;
    const tag = typeof query?.tag === 'string' ? query.tag.slice(0, 500) : null;
    const composed = await composedSection('photos', 'photoGallery');
    return <PhotosClient key={tag || 'all'} initialTag={tag} composition={composed ? { ...composed.data, chosen: Boolean(composed.settings?.facetGroups?.length) } : null} />;
}
