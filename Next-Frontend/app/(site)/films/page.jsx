import { SITE_URL } from '@/lib/siteConfig.js';
import FilmsClient from './_components/FilmsClient.jsx';
import { composedSection } from '@/lib/pageComposition.js';

const title = 'Wedding Films & Cinematography Portfolio | The Wedding Vachan';
const description =
    'Watch our cinematic wedding films — real Indian weddings captured as stories, from intimate ceremonies to grand celebrations. Browse the full portfolio by style and location.';

export const metadata = {
    title,
    description,
    alternates: { canonical: `${SITE_URL}/films` },
    openGraph: { title, description, url: `${SITE_URL}/films`, type: 'website' },
};

// The rows come from Admin › Content › Films (each a row in Admin › Rows),
// resolved here so they are in the server HTML.
export default async function FilmsPage() {
    const composed = await composedSection('films', 'filmRows');
    return <FilmsClient initialRows={composed?.data?.rows || null} />;
}
