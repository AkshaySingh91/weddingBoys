import { notFound } from 'next/navigation';
import BlockRenderer from '@/Component/cms/BlockRenderer.jsx';
import { SITE_URL } from '@/lib/blogApi.js';
import { RESERVED_CMS_PAGE_KEYS } from '@/lib/siteConfig.js';

const api_url = process.env.NEXT_PUBLIC_API_URL;

// Generic catch-all for admin-built CMS pages (e.g. /about, /pricing).
// Static routes in this group (about-us, films, blogs, …) take precedence in the
// App Router, so this only handles slugs backed by a published PageContent doc.

export const revalidate = 3600; // ISR

// Fetch a published page's content on the server (ISR-cached, fails soft).
async function fetchPage(slug) {
    // These keys back hand-built routes; serving them here too would create a
    // duplicate URL for the same content.
    if (RESERVED_CMS_PAGE_KEYS.has(String(slug).toLowerCase())) return null;
    try {
        const res = await fetch(`${api_url}/api/content/${slug}`, { next: { revalidate: 3600, tags: [`page:${slug}`] } });
        if (!res.ok) return null;
        const data = await res.json();
        return data.page || null;
    } catch {
        return null;
    }
}

export async function generateMetadata({ params }) {
    const { slug } = await params;
    const page = await fetchPage(slug);
    if (!page) return { title: 'Page not found | The Wedding Vachan' };
    return {
        title: `${page.title || slug} | The Wedding Vachan`,
        description: page.description || undefined,
        alternates: { canonical: `${SITE_URL}/${slug}` },
        openGraph: {
            title: page.title || slug,
            description: page.description || undefined,
            url: `${SITE_URL}/${slug}`,
            type: 'website',
        },
    };
}

export default async function CmsPage({ params }) {
    const { slug } = await params;
    const page = await fetchPage(slug);
    if (!page) notFound();

    return (
        <section className="min-h-screen">
            <BlockRenderer blocks={page.blocks || []} />
        </section>
    );
}
