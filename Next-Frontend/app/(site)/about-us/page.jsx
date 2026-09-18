import { SITE_URL } from '@/lib/siteConfig.js';
import AboutClient from './_components/AboutClient.jsx';

const title = 'About The Wedding Boys | Our Story & Approach';
const description =
    'How The Wedding Boys came to be, how we work, and why we film weddings the way we do — storytelling first, cinematic always.';

export const metadata = {
    title,
    description,
    alternates: { canonical: `${SITE_URL}/about-us` },
    openGraph: { title, description, url: `${SITE_URL}/about-us`, type: 'website' },
};

export default function AboutPage() {
    return <AboutClient />;
}
