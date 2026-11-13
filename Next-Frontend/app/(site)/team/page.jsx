import { SITE_URL, SITE_NAME, STUDIO_WHATSAPP } from '@/lib/siteConfig.js';
import RevealObserver from '@/Component/home/RevealObserver.jsx';
import { buildTeam } from './_lib/teamData.js';
import CrewHero from './_components/CrewHero.jsx';
import Slates from './_components/Slates.jsx';
import CallSheet from './_components/CallSheet.jsx';
import YourRow from './_components/YourRow.jsx';

const title = 'Meet the Team | The Wedding Vachan';
const description =
    'The founders, managing director and the camera, stills and edit crew behind The Wedding Vachan: the people who will be with you on your wedding day.';

export const metadata = {
    title,
    description,
    alternates: { canonical: `${SITE_URL}/team` },
    openGraph: { title, description, url: `${SITE_URL}/team`, type: 'website' },
};

export const revalidate = 600;

const api = process.env.NEXT_PUBLIC_API_URL;

/** A failed fetch degrades to the bundled crew; it never takes the page down. */
async function getJSON(path) {
    try {
        const res = await fetch(`${api}${path}`, { next: { revalidate: 600, tags: ['page:team'] } });
        return res.ok ? await res.json() : null;
    } catch {
        return null;
    }
}


export default async function TeamPage() {
    const team = await getJSON('/api/team');
    const { founders, md, departments, everyone, group, count } = buildTeam(team);
    const crewCount = departments.reduce((n, d) => n + d.people.length, 0);

    const phone = STUDIO_WHATSAPP;
    const whatsapp = phone
        ? `https://wa.me/${phone}?text=${encodeURIComponent('Hi, we would like to check our wedding date.')}`
        : null;

    const facts = [
        { value: founders.length, label: founders.length === 1 ? 'founder' : 'founders' },
        ...(md ? [{ value: 1, label: 'managing director' }] : []),
        { value: crewCount, label: 'on the crew' },
        { value: departments.length, label: 'departments' },
    ];

    // Structured data: only people whose names the studio has confirmed.
    const named = everyone.filter((p) => !p.placeholder);
    const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name: SITE_NAME,
        url: SITE_URL,
        founder: founders.filter((p) => !p.placeholder).map((p) => ({ '@type': 'Person', name: p.name, jobTitle: 'Founder' })),
        employee: named.filter((p) => p.tierKey !== 'founder').map((p) => ({ '@type': 'Person', name: p.name, jobTitle: p.role })),
    };

    return (
        <>
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
            <RevealObserver />
            <CrewHero group={group} count={count} facts={facts} names={named.map((p) => p.name)} />
            {/* The ivory sheet slides over the crew shot. */}
            <div className="chapters relative z-10 -mt-8 rounded-t-[32px] bg-ground lg:-mx-4">
                <Slates founders={founders} md={md} />
                <CallSheet departments={departments} crewCount={crewCount} />
                <YourRow people={everyone} crewCount={count} whatsapp={whatsapp} />
            </div>
        </>
    );
}
