import { SITE_URL } from '@/lib/siteConfig.js';
import FilmsClient from './_components/FilmsClient.jsx';
import { redirect } from 'next/navigation';
import { fetchFilmDiscovery } from '@/lib/filmDiscovery.js';

const title = 'Wedding Films & Cinematography Portfolio | The Wedding Vachan';
const description =
    'Watch our cinematic wedding films — real Indian weddings captured as stories, from intimate ceremonies to grand celebrations. Browse the full portfolio by style and location.';

export const metadata = {
    title,
    description,
    alternates: { canonical: `${SITE_URL}/films` },
    openGraph: { title, description, url: `${SITE_URL}/films`, type: 'website' },
};

// Published portfolio metadata generates complete, priority-sorted categories.
// Resolve on the server so the film links and category headings are in HTML.
// A category link (?category=…) belongs to the library: /allfilms filters by it.
export default async function FilmsPage({ searchParams }) {
    const query = await searchParams;
    if (typeof query?.category === 'string' && query.category !== 'best-films') {
        redirect(`/allfilms?category=${encodeURIComponent(query.category.slice(0, 120))}`);
    }
    const discovery = await fetchFilmDiscovery();
    return <FilmsClient discovery={discovery} />;
}
