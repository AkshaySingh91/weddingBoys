import { SITE_URL } from '@/lib/siteConfig.js';
import PhotosClient from './_components/PhotosClient.jsx';
import { composedSection } from '@/lib/pageComposition.js';

const title = 'Wedding Photography Gallery | The Wedding Boys';
const description =
    'A gallery of real Indian weddings — candid moments, portraits, rituals and celebration, photographed by The Wedding Boys.';

export const metadata = {
    title,
    description,
    alternates: { canonical: `${SITE_URL}/photos` },
    openGraph: { title, description, url: `${SITE_URL}/photos`, type: 'website' },
};

// Filter groups, order and page size come from Admin › Content › Photos.
export default async function PhotosPage() {
    const composed = await composedSection('photos', 'photoGallery');
    return <PhotosClient composition={composed ? { ...composed.data, chosen: Boolean(composed.settings?.facetGroups?.length) } : null} />;
}
