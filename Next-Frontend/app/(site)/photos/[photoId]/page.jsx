import { notFound } from 'next/navigation';
import { preload } from 'react-dom';
import { SITE_URL } from '@/lib/siteConfig.js';
import { stillLadder } from '@/lib/films.js';
import PhotoView from './_components/PhotoView.jsx';
import { FRAME_SIZES } from '@/lib/photos.js';

const api_url = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

const getJSON = async (path) => {
    try {
        const res = await fetch(`${api_url}${path}`, { next: { revalidate: 300, tags: ['portfolio', 'photos'] } });
        return res.ok ? await res.json() : null;
    } catch {
        return null;
    }
};

const coupleOf = (c) => [c?.Bride, c?.Groom].filter(Boolean).join(' & ');
const rite = (c) => (c === 'Wedding / Pheras' ? 'Wedding' : c);

export async function generateMetadata({ params }) {
    const { photoId } = await params;
    const data = await getJSON(`/api/photos/${encodeURIComponent(photoId)}`);
    const p = data?.selectedPhoto;
    if (!p) return { title: 'Wedding photograph | The Wedding Vachan' };
    const couple = coupleOf(data.clientName);
    const city = p.photoLocation?.city ? `, ${p.photoLocation.city}` : '';
    const r = rite(p.eventGroup);
    const what = couple ? (!r || r === 'Wedding' ? `${couple}'s wedding` : `${r} at ${couple}'s wedding`) : r;
    const title = `${p.title || what || 'Wedding photograph'}${city} | The Wedding Vachan`;
    const description = p.caption || `${what || 'A wedding'}${city}, photographed by The Wedding Vachan.`;
    const url = `${SITE_URL}/photos/${photoId}`;
    const image = stillLadder(p.url, { width: p.width, cap: 1600 })?.srcSet?.split(', ').pop()?.split(' ')[0] || p.url;
    return {
        title, description,
        alternates: { canonical: url },
        openGraph: { title, description, url, type: 'article', images: image ? [{ url: image, alt: what || title }] : [] },
        twitter: { card: 'summary_large_image', title, description, images: image ? [image] : [] },
    };
}

export default async function PhotoPage({ params }) {
    const { photoId } = await params;
    const [data, recs, studio] = await Promise.all([
        getJSON(`/api/photos/${encodeURIComponent(photoId)}`),
        getJSON(`/api/photos/${encodeURIComponent(photoId)}/recommended`),
        getJSON('/api/studio/details'),
    ]);
    if (!data?.selectedPhoto) notFound();

    const p = data.selectedPhoto;
    // The photograph is the page's largest paint: fetch it first, at the right size.
    const ladder = stillLadder(p.url, { width: p.width, cap: 1600 });
    if (ladder) preload(ladder.src, { as: 'image', imageSrcSet: ladder.srcSet, imageSizes: FRAME_SIZES, fetchPriority: 'high' });

    const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'ImageObject',
        contentUrl: ladder?.srcSet?.split(', ').pop()?.split(' ')[0] || p.url,
        url: `${SITE_URL}/photos/${photoId}`,
        name: p.title || undefined,
        caption: p.caption || undefined,
        width: p.width || undefined,
        height: p.height || undefined,
        creditText: 'The Wedding Vachan',
        creator: { '@type': 'Organization', name: 'The Wedding Vachan', url: SITE_URL },
        copyrightNotice: 'The Wedding Vachan',
    };

    return (
        <>
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
            <PhotoView key={photoId} data={data} recommended={recs?.recommendedPhotos || []}
                studioPhone={studio?.studioDetails?.contact?.[0] || null} />
        </>
    );
}
