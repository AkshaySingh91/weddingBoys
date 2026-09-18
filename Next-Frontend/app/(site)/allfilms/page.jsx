import { SITE_URL } from '@/lib/siteConfig.js';
import AllFilmsClient from './_components/AllFilmsClient.jsx';

const title = 'Browse All Wedding Films | The Wedding Boys';
const description =
    'Every wedding film we have shot, filterable by ceremony type, location, style and season — find the wedding story closest to the day you are planning.';

export const metadata = {
    title,
    description,
    alternates: { canonical: `${SITE_URL}/allfilms` },
    openGraph: { title, description, url: `${SITE_URL}/allfilms`, type: 'website' },
};

export default function AllFilmsPage() {
    return <AllFilmsClient />;
}
