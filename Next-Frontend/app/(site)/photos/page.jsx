import { SITE_URL } from '@/lib/siteConfig.js';
import PhotosClient from './_components/PhotosClient.jsx';

const title = 'Wedding Photography Gallery | The Wedding Boys';
const description =
    'A gallery of real Indian weddings — candid moments, portraits, rituals and celebration, photographed by The Wedding Boys.';

export const metadata = {
    title,
    description,
    alternates: { canonical: `${SITE_URL}/photos` },
    openGraph: { title, description, url: `${SITE_URL}/photos`, type: 'website' },
};

export default function PhotosPage() {
    return <PhotosClient />;
}
