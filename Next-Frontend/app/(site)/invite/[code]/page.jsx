import { cache } from 'react';
import { notFound } from 'next/navigation';
import { stillLadder } from '@/lib/films.js';
import InviteView from './_components/InviteView.jsx';
import { STUDIO_WHATSAPP } from '@/lib/siteConfig.js';

const api_url = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

// One fetch per request (metadata and page share it); never cached — it can be revoked or expire.
const getInvite = cache(async (code) => {
    if (!/^[2-9A-HJKMNP-TV-Z]{8}$/.test(String(code || ''))) return null;
    try {
        const res = await fetch(`${api_url}/api/invites/${code}`, { cache: 'no-store' });
        return res.ok ? (await res.json()).invitation : null;
    } catch {
        return null;
    }
});

const namesOf = (inv) => [inv.names?.a, inv.names?.b].filter(Boolean).join(' & ');

/** A couple's invitation, as their partner opens it. Personal: never indexed. */
export async function generateMetadata({ params }) {
    const { code } = await params;
    const inv = await getInvite(code);
    if (!inv) return { title: 'Invitation | The Wedding Vachan', robots: { index: false, follow: false } };
    const names = namesOf(inv);
    const title = `${names} invite The Wedding Vachan to their ${(inv.kind || 'wedding').toLowerCase()}`;
    const description = [[inv.when, inv.city].filter(Boolean).join(', '), `${inv.photos.length} photographs from The Wedding Vachan.`].filter(Boolean).join('. ');
    const lead = inv.photos.find((p) => Number(p.aspectRatio) > 1) || inv.photos[0];
    const image = lead ? stillLadder(lead.url, { width: lead.width, cap: 1024 })?.srcSet?.split(', ').pop()?.split(' ')[0] || lead.url : null;
    return {
        title, description,
        robots: { index: false, follow: false },
        openGraph: { title, description, type: 'website', images: image ? [{ url: image, alt: title }] : [] },
        twitter: { card: 'summary_large_image', title, description, images: image ? [image] : [] },
    };
}

export default async function InvitePage({ params }) {
    const { code } = await params;
    const inv = await getInvite(code);
    if (!inv) notFound();
    return <InviteView invitation={inv} studioPhone={STUDIO_WHATSAPP} />;
}
