import { SITE_URL, SOCIAL_LINKS } from '@/lib/siteConfig.js';
import ColdOpen from './_components/ColdOpen.jsx';
import HowItStarted from './_components/HowItStarted.jsx';
import TheNumber from './_components/TheNumber.jsx';
import Founders from './_components/Founders.jsx';
import ContactSheet from './_components/ContactSheet.jsx';
import OurVachan from './_components/OurVachan.jsx';
import EndCredits from './_components/EndCredits.jsx';
import StickyActions from './_components/StickyActions.jsx';
import { FOUNDER_NAMES } from './_components/storyData.js';

const title = 'Our Story | The Wedding Vachan';
const description =
    'Two friends, one camera, since 2015. Meet the founders, managing director and crew behind The Wedding Vachan, and the promises we put in writing.';

export const metadata = {
    title,
    description,
    alternates: { canonical: `${SITE_URL}/about-us` },
    openGraph: { title, description, url: `${SITE_URL}/about-us`, type: 'website' },
};

export const revalidate = 600;

const api = process.env.NEXT_PUBLIC_API_URL;

/** A failed fetch degrades a section; it never takes the page down. */
async function getJSON(path) {
    try {
        const res = await fetch(`${api}${path}`, { next: { revalidate: 600 } });
        return res.ok ? await res.json() : null;
    } catch {
        return null;
    }
}

const digits = (phone) => String(phone || '').replace(/\D/g, '');

export default async function AboutPage() {
    const [team, studio] = await Promise.all([getJSON('/api/team'), getJSON('/api/studio/details')]);

    // Founders come from storyData, not the API. Anyone the API still marks as
    // "Founder" but who is not a current founder is left out of the crew too.
    const crew = (team?.teamImages || [])
        .filter((m) => m.about?.name
            && !FOUNDER_NAMES.includes(m.about.name.trim().toLowerCase())
            && m.about.designation?.trim().toLowerCase() !== 'founder')
        .map((m) => ({ id: m._id, name: m.about.name.trim(), role: m.about.designation, src: m.url }));

    const details = studio?.studioDetails;
    const phone = digits(details?.contact?.[0]);
    const whatsapp = phone
        ? `https://wa.me/${phone}?text=${encodeURIComponent('Hi, we would like to talk about our wedding.')}`
        : null;
    const socials = {
        youtube: SOCIAL_LINKS.youtube,
        instagram: SOCIAL_LINKS.instagramMumbai,
    };

    return (
        <>
            <ColdOpen />
            <HowItStarted youtube={socials.youtube} />
            <TheNumber socials={socials} />
            <Founders />
            <ContactSheet />
            <OurVachan />
            <EndCredits crew={crew} whatsapp={whatsapp} />
            <StickyActions whatsapp={whatsapp} />
        </>
    );
}
