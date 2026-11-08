import { notFound } from 'next/navigation';
import { SITE_URL } from '@/lib/siteConfig.js';
import PhotoDetailClient from './_components/PhotoDetailClient.jsx';

const api_url = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

async function getPhoto(photoId) {
    try {
        const res = await fetch(`${api_url}/api/photos/${encodeURIComponent(photoId)}`, {
            cache: 'no-store',
        });
        if (!res.ok) return null;
        return await res.json();
    } catch {
        return null;
    }
}

async function getTeam() {
    try {
        const res = await fetch(`${api_url}/api/team`, {
            cache: 'no-store',
        });
        if (!res.ok) return [];
        const data = await res.json();
        return data.teamImages || [];
    } catch {
        return [];
    }
}

export async function generateMetadata({ params }) {
    const { photoId } = await params;
    const data = await getPhoto(photoId);

    if (!data || !data.selectedPhoto) {
        return {
            title: 'Wedding Photograph | The Wedding Vachan',
            description: 'Fine art wedding photography by The Wedding Vachan.',
        };
    }

    const bride = data.clientName?.Bride || '';
    const groom = data.clientName?.Groom || '';
    const couple = [bride, groom].filter(Boolean).join(' & ');
    const titleText = data.selectedPhoto.title || (couple ? `${couple} Wedding Photograph` : 'Fine Art Photograph');
    const city = data.selectedPhoto.photoLocation?.city ? ` in ${data.selectedPhoto.photoLocation.city}` : '';
    const title = `${titleText}${city} | The Wedding Vachan`;
    const description = data.selectedPhoto.caption || `Fine art wedding photography of ${couple || 'a celebration'}${city} captured by The Wedding Vachan.`;
    const url = `${SITE_URL}/photos/${photoId}`;
    const image = data.selectedPhoto.url;

    return {
        title,
        description,
        alternates: { canonical: url },
        openGraph: {
            title,
            description,
            url,
            type: 'article',
            images: image ? [{ url: image, alt: titleText }] : [],
        },
        twitter: {
            card: 'summary_large_image',
            title,
            description,
            images: image ? [image] : [],
        },
    };
}

export default async function SpecificPhotoPage({ params, searchParams }) {
    const { photoId } = await params;
    const [photoData, team] = await Promise.all([
        getPhoto(photoId),
        getTeam(),
    ]);

    if (!photoData || !photoData.selectedPhoto) {
        notFound();
    }

    return (
        <PhotoDetailClient
            key={photoId}
            initialLightbox={(await searchParams)?.view === 'lightbox'}
            initialData={photoData}
            initialTeam={team}
            photoId={photoId}
        />
    );
}
