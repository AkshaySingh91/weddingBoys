import { SITE_URL } from '@/lib/siteConfig.js';
import AllFilmsClient from './_components/AllFilmsClient.jsx';
import { composedSection } from '@/lib/pageComposition.js';

const title = 'Browse All Wedding Films | The Wedding Boys';
const description =
    'Every wedding film we have shot, filterable by ceremony type, location, style and season — find the wedding story closest to the day you are planning.';

export const metadata = {
    title,
    description,
    alternates: { canonical: `${SITE_URL}/allfilms` },
    openGraph: { title, description, url: `${SITE_URL}/allfilms`, type: 'website' },
};

// Which filters /allfilms offers, and the page size, come from Admin › Content › All films.
export default async function AllFilmsPage() {
    const composed = await composedSection('allfilms', 'browseFilms');
    return <AllFilmsClient composition={composed?.data || null} />;
}
