import { notFound } from 'next/navigation';
import { serializeJsonLd } from '@/lib/jsonLd.mjs';
import { SITE_URL } from '@/lib/siteConfig.js';
import FilmDetailClient from './_components/FilmDetailClient.jsx';

const api_url = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

async function getFilm(videoId) {
    try {
        const res = await fetch(`${api_url}/api/videos/${encodeURIComponent(videoId)}`, {
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
    const { videoId } = await params;
    const film = await getFilm(videoId);
    if (!film || !film.selectedVideo) {
        return {
            title: 'Wedding Film | The Wedding Vachan',
            description: 'Watch cinematic wedding stories by The Wedding Vachan.',
        };
    }

    const bride = film.clientName?.Bride || '';
    const groom = film.clientName?.Groom || '';
    const couple = [bride, groom].filter(Boolean).join(' & ') || 'Wedding Celebration';
    const city = film.selectedVideo.videoLocation?.city ? ` in ${film.selectedVideo.videoLocation.city}` : '';
    const title = `${couple} — Wedding Film${city} | The Wedding Vachan`;
    const description = `Watch ${couple}’s cinematic wedding film${city} by The Wedding Vachan. Real emotions, timeless rituals, and unscripted storytelling.`;
    const url = `${SITE_URL}/films/${videoId}`;
    const image = film.selectedVideo.thumbnailUrl || film.selectedVideo.thumbnailMetaData?.url;

    return {
        title,
        description,
        alternates: { canonical: url },
        openGraph: {
            title,
            description,
            url,
            type: 'video.other',
            images: image ? [{ url: image, alt: `${couple} Wedding Film` }] : [],
        },
    };
}

export default async function SpecificFilmPage({ params }) {
    const { videoId } = await params;
    const [filmData, team] = await Promise.all([
        getFilm(videoId),
        getTeam(),
    ]);

    if (!filmData?.selectedVideo) notFound();
    const video = filmData.selectedVideo;
    const filmSchema = {
        '@context': 'https://schema.org', '@type': 'VideoObject',
        name: [filmData.clientName?.Bride, filmData.clientName?.Groom].filter(Boolean).join(' & ') || 'Wedding film',
        description: video.caption || 'A cinematic wedding film by The Wedding Vachan.',
        thumbnailUrl: video.thumbnailUrl || video.thumbnailMetaData?.url,
        ...(video.publishedAt ? { uploadDate: video.publishedAt } : {}),
        ...(video.durationSec > 0 ? { duration: `PT${Math.round(video.durationSec)}S` } : {}),
        ...(video.embedUrl ? { embedUrl: video.embedUrl } : {}),
        ...(!video.embedUrl && video.url ? { contentUrl: video.url } : {}),
    };
    return (
        <>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(filmSchema) }} />
        <FilmDetailClient
            initialFilmData={filmData}
            videoId={videoId}
            initialTeam={team}
        />
        </>
    );
}
