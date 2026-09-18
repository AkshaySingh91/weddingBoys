import { SITE_URL } from '@/lib/siteConfig.js';
import FilmsClient from './_components/FilmsClient.jsx';

const title = 'Wedding Films & Cinematography Portfolio | The Wedding Boys';
const description =
    'Watch our cinematic wedding films — real Indian weddings captured as stories, from intimate ceremonies to grand celebrations. Browse the full portfolio by style and location.';

export const metadata = {
    title,
    description,
    alternates: { canonical: `${SITE_URL}/films` },
    openGraph: { title, description, url: `${SITE_URL}/films`, type: 'website' },
};

export default function FilmsPage() {
    return <FilmsClient />;
}
