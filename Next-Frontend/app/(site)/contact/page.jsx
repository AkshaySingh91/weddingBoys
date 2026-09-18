import { SITE_URL } from '@/lib/siteConfig.js';
import ContactClient from './_components/ContactClient.jsx';

const title = 'Contact & Booking Enquiries | The Wedding Boys';
const description =
    'Check our availability for your wedding date. Tell us about your celebration and we will get back to you with packages and a plan.';

export const metadata = {
    title,
    description,
    alternates: { canonical: `${SITE_URL}/contact` },
    openGraph: { title, description, url: `${SITE_URL}/contact`, type: 'website' },
};

export default function ContactPage() {
    return <ContactClient />;
}
