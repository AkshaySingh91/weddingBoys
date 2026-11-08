import { SITE_URL } from '@/lib/siteConfig.js';
import VaranasiClient from './_components/VaranasiClient.jsx';

const title = 'Wedding Cinematography in Varanasi | The Wedding Vachan';
const description =
    'The Wedding Vachan are now filming in Varanasi. Ghats, rituals and river light — wedding films made for the oldest living city in the world.';

export const metadata = {
    title,
    description,
    alternates: { canonical: `${SITE_URL}/varanasi` },
    openGraph: { title, description, url: `${SITE_URL}/varanasi`, type: 'website' },
};

export default async function VaranasiPage() {
    let sequences = {};
    try {
        const api = process.env.NEXT_PUBLIC_API_URL;
        if (api) {
            const response = await fetch(`${api}/api/sequences/varanasi`, {
                next: { revalidate: 300, tags: ['page:varanasi'] },
                signal: AbortSignal.timeout(3000),
            });
            if (response.ok) sequences = await response.json();
        }
    } catch {
        // Existing local sequence remains available while the media API is down.
    }
    return <VaranasiClient sequences={sequences} />;
}
