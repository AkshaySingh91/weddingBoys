import { notFound } from 'next/navigation';
import { serializeJsonLd } from '@/lib/jsonLd.mjs';
import { SITE_URL } from '@/lib/siteConfig.js';
import FilmStory from './_components/FilmStory.jsx';
import { fetchFilmDiscovery } from '@/lib/filmDiscovery.js';

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

/** Films to keep watching: the catalogue's films that share the most labels. */
function relatedFilms(discovery, videoId) {
    const films = discovery?.films || [];
    const me = films.find((f) => f.videos?._id === videoId);
    const mine = new Set([me?.event, ...(me?.labels || [])].filter(Boolean));
    return films
        .filter((f) => f.videos?._id !== videoId)
        .map((f) => ({ f, score: [f.event, ...(f.labels || [])].filter((l) => mine.has(l)).length + (f.priority || 0) / 1000 }))
        .sort((a, b) => b.score - a.score)
        .slice(0, 10)
        .map(({ f }) => f);
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
    const [filmData, discovery] = await Promise.all([getFilm(videoId), fetchFilmDiscovery()]);

    if (!filmData?.selectedVideo) notFound();
    const video = filmData.selectedVideo;
    const filmSchema = {
        '@context': 'https://schema.org', '@type': 'VideoObject',
        name: [filmData.clientName?.Bride, filmData.clientName?.Groom].filter(Boolean).join(' & ') || 'Wedding film',
        description: filmData.film?.caption || video.caption || 'A cinematic wedding film by The Wedding Vachan.',
        thumbnailUrl: video.thumbnailUrl || video.thumbnailMetaData?.url,
        ...(video.publishedAt ? { uploadDate: video.publishedAt } : {}),
        ...(video.durationSec > 0 ? { duration: `PT${Math.round(video.durationSec)}S` } : {}),
        ...(video.embedUrl ? { embedUrl: video.embedUrl } : {}),
        ...(!video.embedUrl && video.url ? { contentUrl: video.url } : {}),
    };
    return (
        <>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(filmSchema) }} />
        <FilmStory data={filmData} videoId={videoId} related={relatedFilms(discovery, videoId)} rows={discovery?.rows || []} />
        </>
    );
}
