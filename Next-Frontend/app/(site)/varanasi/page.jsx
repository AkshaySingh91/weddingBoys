import { SITE_URL } from '@/lib/siteConfig.js';
import VaranasiClient from './_components/VaranasiClient.jsx';

const title = 'Wedding Cinematography in Varanasi | The Wedding Boys';
const description =
    'The Wedding Boys are now filming in Varanasi. Ghats, rituals and river light — wedding films made for the oldest living city in the world.';

export const metadata = {
    title,
    description,
    alternates: { canonical: `${SITE_URL}/varanasi` },
    openGraph: { title, description, url: `${SITE_URL}/varanasi`, type: 'website' },
};

export default function VaranasiPage() {
    return <VaranasiClient />;
}
