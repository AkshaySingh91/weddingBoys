import { SITE_URL } from '@/lib/siteConfig.js';
import TeamClient from './_components/TeamClient.jsx';

const title = 'Meet the Team | The Wedding Boys';
const description =
    'The cinematographers, photographers and editors behind The Wedding Boys — the people who will be with you on your wedding day.';

export const metadata = {
    title,
    description,
    alternates: { canonical: `${SITE_URL}/team` },
    openGraph: { title, description, url: `${SITE_URL}/team`, type: 'website' },
};

export default function TeamPage() {
    return <TeamClient />;
}
