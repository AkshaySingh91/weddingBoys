import SharedSelects from './_components/SharedSelects.jsx';
import { STUDIO_WHATSAPP } from '@/lib/siteConfig.js';

const api_url = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

// A couple's shortlist, opened from a WhatsApp link — personal, so not indexed.
export const metadata = {
    title: 'Selected photographs | The Wedding Vachan',
    description: 'Wedding photographs picked from The Wedding Vachan gallery.',
    robots: { index: false, follow: true },
};

const getJSON = async (path) => {
    try {
        const res = await fetch(`${api_url}${path}`, { next: { revalidate: 300, tags: ['portfolio', 'photos'] } });
        return res.ok ? await res.json() : null;
    } catch {
        return null;
    }
};

export default async function SelectsPage({ searchParams }) {
    const query = await searchParams;
    const ids = (typeof query?.ids === 'string' ? query.ids : '').split(',').filter((x) => /^[0-9a-f]{24}$/i.test(x)).slice(0, 60);
    const [data] = await Promise.all([
        ids.length ? getJSON(`/api/photos/batch?ids=${ids.join(',')}`) : null,
    ]);
    return <SharedSelects photos={data?.photos || []} studioPhone={STUDIO_WHATSAPP} />;
}
