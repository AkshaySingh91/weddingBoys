import Link from 'next/link';
import Section from '@/Component/ui/Section.jsx';
import { SITE_URL } from '@/lib/siteConfig.js';
import WeddingCard from './_components/WeddingCard.jsx';

const api_url = process.env.NEXT_PUBLIC_API_URL;

export const revalidate = 3600;

export const metadata = {
    title: 'Wedding stories | The Wedding Boys',
    description: 'Real weddings filmed and photographed by The Wedding Boys: every ceremony, in the order it happened.',
    alternates: { canonical: `${SITE_URL}/weddings` },
};

async function getWeddings() {
    try {
        const res = await fetch(`${api_url}/api/weddings?limit=60`, { next: { revalidate: 3600, tags: ['portfolio'] } });
        if (!res.ok) return [];
        return (await res.json()).weddings || [];
    } catch {
        return [];
    }
}

/**
 * Every published wedding story. The city filter works on the list already
 * fetched (one request, cached), so switching cities never waits on the API.
 */
export default async function WeddingsIndexPage({ searchParams }) {
    const { city } = await searchParams;
    const all = await getWeddings();
    const cities = [...new Map(all.filter((w) => w.location?.city).map((w) => [w.location.city.toLowerCase(), w.location.city])).values()].sort();
    const active = typeof city === 'string' ? city.toLowerCase() : '';
    const weddings = active ? all.filter((w) => w.location?.city?.toLowerCase() === active) : all;

    return (
        <>
            <Section width="content" rhythm="normal">
                <h1 className="t-display-1">Wedding stories</h1>
                <p className="t-body-lead mt-4">Real weddings, told ceremony by ceremony: the films, the photographs and the people who made them.</p>

                {cities.length > 1 && (
                    <nav aria-label="Filter by city" className="mt-8 flex flex-wrap gap-2">
                        {[['', 'All'], ...cities.map((c) => [c.toLowerCase(), c])].map(([key, label]) => (
                            <Link key={key || 'all'} href={key ? `/weddings?city=${encodeURIComponent(key)}` : '/weddings'}
                                aria-current={active === key ? 'page' : undefined}
                                className={`rounded-pill border px-4 py-2 text-[14px] transition-colors duration-micro ${active === key
                                    ? 'border-accent bg-accent text-ink-onAccent'
                                    : 'border-gold-strong/50 text-ink hover:border-gold-strong hover:bg-accent-wash'}`}>
                                {label}
                            </Link>
                        ))}
                    </nav>
                )}
            </Section>

            <Section width="content" rhythm="tight">
                {weddings.length ? (
                    <ul className="grid gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
                        {weddings.map((w, i) => <li key={w.slug}><WeddingCard wedding={w} priority={i < 3} /></li>)}
                    </ul>
                ) : (
                    <p className="t-body">No wedding stories {active ? 'from this city ' : ''}yet.</p>
                )}
            </Section>
        </>
    );
}
