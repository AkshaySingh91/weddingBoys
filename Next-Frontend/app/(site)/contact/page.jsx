import { SITE_URL } from '@/lib/siteConfig.js';
import { KINDS } from '@/lib/contact.js';
import { stillLadder } from '@/lib/films.js';
import Invitation from './_components/Invitation.jsx';

const api_url = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
const title = 'Check your date | The Wedding Vachan';
const description =
    'Tell us your names, your date (or just the month) and where you are getting married. Send it here or on WhatsApp, and we will reply.';

export const metadata = {
    title,
    description,
    alternates: { canonical: `${SITE_URL}/contact` },
    openGraph: { title, description, url: `${SITE_URL}/contact`, type: 'website' },
};

const getJSON = async (path) => {
    try {
        const res = await fetch(`${api_url}${path}`, { next: { revalidate: 300, tags: ['portfolio'] } });
        return res.ok ? await res.json() : null;
    } catch {
        return null;
    }
};
const one = (v, max = 120) => (typeof v === 'string' ? v.slice(0, max).trim() : '');
const isId = (v) => /^[0-9a-f]{24}$/i.test(v);

/**
 * /contact — the invitation. Whatever button brought the visitor here travels
 * along (lib/contact.js) and is resolved here, so the card can say what they
 * were looking at: a film, a wedding's story, the frames they circled.
 */
export default async function ContactPage({ searchParams }) {
    const q = await searchParams;
    const from = one(q?.from, 40);
    const film = isId(one(q?.film, 24)) ? one(q.film, 24) : null;
    const wedding = /^[a-z0-9-]{1,80}$/.test(one(q?.wedding, 80)) ? one(q.wedding, 80) : null;
    const selects = one(q?.selects, 30 * 25).split(',').filter(isId).slice(0, 30);
    const kindParam = one(q?.kind, 60);
    const kind = KINDS.find((k) => k.toLowerCase() === kindParam.toLowerCase()) || '';
    const city = one(q?.city, 80);

    const [studio, filmData, weddingData, selectData] = await Promise.all([
        getJSON('/api/studio/details'),
        film ? getJSON(`/api/videos/${film}`) : null,
        wedding ? getJSON(`/api/weddings/${wedding}`) : null,
        selects.length ? getJSON(`/api/photos/batch?ids=${selects.join(',')}`) : null,
    ]);

    // What they were looking at, in the shape the card shows.
    let context = null;
    if (filmData?.selectedVideo || filmData?.film) {
        const couple = [filmData.clientName?.Bride, filmData.clientName?.Groom].filter(Boolean).join(' & ');
        const poster = filmData.selectedVideo?.thumbnailUrl || filmData.selectedVideo?.thumbnailMetaData?.url || null;
        context = { type: 'film', label: couple ? `${couple}'s film` : 'one of our films', images: poster ? [poster] : [], href: `/films/${film}` };
    } else if (weddingData?.wedding) {
        const w = weddingData.wedding;
        context = { type: 'story', label: `${w.title}'s wedding`, images: w.cover?.url ? [w.cover.url] : [], href: `/weddings/story/${wedding}` };
    } else if (selectData?.photos?.length) {
        const n = selectData.photos.length;
        context = {
            type: 'selects', label: `${n} photograph${n === 1 ? '' : 's'} you circled`,
            images: selectData.photos.slice(0, 5).map((p) => stillLadder(p.url, { width: p.width, cap: 640 })?.src || p.url),
            href: `/photos/selects?ids=${selects.join(',')}`,
        };
    }

    const s = studio?.studioDetails || {};
    return (
        <Invitation
            from={from} context={context} initialKind={kind || (from === 'varanasi' ? 'Pre-wedding shoot' : '')}
            initialCity={city} focus={one(q?.focus, 10)}
            studio={{ phones: Array.isArray(s.contact) ? s.contact : [], email: s.email || null, address: s.address || null, instagram: s.socials?.instagram || null }} />
    );
}
