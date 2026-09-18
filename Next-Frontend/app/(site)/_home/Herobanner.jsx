import HeroCarousel from './HeroCarousel.jsx';

const api_url = process.env.NEXT_PUBLIC_API_URL;

/**
 * Hero banner — Server Component.
 *
 * The hero data is fetched here, on the server, so the poster URLs are in the
 * initial HTML. Previously this was a client `useEffect` fetch, which meant the
 * hero could not begin loading until the JS bundle had downloaded, hydrated and
 * completed an API round-trip — the LCP element was behind three serial waits.
 *
 * Fails soft: an unreachable API renders nothing rather than breaking the page,
 * matching the CMS fallback pattern used by app/(site)/page.jsx.
 */
async function fetchHeroSlides() {
    try {
        const res = await fetch(`${api_url}/api/hero-videos`, { next: { revalidate: 300 } });
        if (!res.ok) return [];
        const data = await res.json();
        return Array.isArray(data.heroVideos) ? data.heroVideos : [];
    } catch {
        return [];
    }
}

export default async function Herobanner() {
    const slides = await fetchHeroSlides();
    if (!slides.length) return null;
    return <HeroCarousel slides={slides} />;
}
