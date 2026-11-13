import { SITE_URL } from '@/lib/siteConfig.js';
import AllFilmsClient from './_components/AllFilmsClient.jsx';
import { fetchFilmDiscovery } from '@/lib/filmDiscovery.js';

const title = 'Browse All Wedding Films | The Wedding Vachan';
const description =
    'Every wedding film we have shot. Filter by ceremony, place, style or season to find one close to the day you are planning.';

export const metadata = {
    title,
    description,
    alternates: { canonical: `${SITE_URL}/allfilms` },
    openGraph: { title, description, url: `${SITE_URL}/allfilms`, type: 'website' },
};

// The whole library comes with the page: categories and films from the film
// discovery data (Admin › Portfolio tags drive the categories), so filtering
// and search happen instantly in the browser and every film link is in HTML.
//   ?category=<row key>   a category (e.g. events-haldi)
//   ?tag=<label>          older links: matched to a category by its title
//   ?q=<text>             a search
export default async function AllFilmsPage({ searchParams }) {
    const [query, discovery] = await Promise.all([searchParams, fetchFilmDiscovery()]);
    const rows = discovery?.groups?.flatMap((g) => g.rows) || [];
    let category = typeof query?.category === 'string' ? query.category.slice(0, 120) : null;
    if (!category && typeof query?.tag === 'string') {
        const tag = query.tag.slice(0, 120).toLowerCase();
        category = rows.find((r) => r.title.toLowerCase() === tag)?.key || null;
    }
    if (category && !rows.some((r) => r.key === category)) category = null;
    const q = typeof query?.q === 'string' ? query.q.slice(0, 120) : '';
    return <AllFilmsClient discovery={discovery} initialCategory={category} initialQuery={q} />;
}
