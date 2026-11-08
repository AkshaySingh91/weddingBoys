import { SITE_URL, RESERVED_CMS_PAGE_KEYS } from '@/lib/siteConfig.js';
import { getAllDestinationSlugs } from '@/lib/weddingLocations.js';

const api_url = process.env.NEXT_PUBLIC_API_URL;

// Rebuild the sitemap hourly so newly published posts and films appear without
// a deploy.
export const revalidate = 3600;

// Static, hand-built routes. `/search-result` is deliberately absent — it is
// disallowed in robots.txt as thin, parameterised content.
const STATIC_ROUTES = [
    { path: '/', changeFrequency: 'weekly', priority: 1.0 },
    { path: '/films', changeFrequency: 'weekly', priority: 0.9 },
    { path: '/allfilms', changeFrequency: 'weekly', priority: 0.7 },
    { path: '/weddings', changeFrequency: 'weekly', priority: 0.8 },
    { path: '/photos', changeFrequency: 'weekly', priority: 0.9 },
    { path: '/blogs', changeFrequency: 'daily', priority: 0.9 },
    { path: '/varanasi', changeFrequency: 'monthly', priority: 0.8 },
    { path: '/dharaa-event-management', changeFrequency: 'monthly', priority: 0.7 },
    { path: '/team', changeFrequency: 'monthly', priority: 0.6 },
    { path: '/about-us', changeFrequency: 'monthly', priority: 0.6 },
    { path: '/contact', changeFrequency: 'monthly', priority: 0.6 },
];

// Every fetch here fails soft: a sitemap missing a section is recoverable, a
// build that crashes because the API blipped is not.
// Tagged `portfolio` so publishing a film or photo refreshes the sitemap at once
// (Backend/Services/revalidate.js) instead of within the hour.
async function safeJson(path) {
    try {
        const res = await fetch(`${api_url}${path}`, { next: { revalidate, tags: ['portfolio'] } });
        if (!res.ok) return null;
        return await res.json();
    } catch {
        return null;
    }
}

// Blog posts — the primary organic-search surface.
async function blogEntries() {
    const posts = [];
    for (let page = 1; page <= 1000; page++) {
        const data = await safeJson(`/api/blogs?page=${page}&limit=50`);
        posts.push(...(data?.posts || []));
        if (!data?.hasMore) break;
    }
    return posts.filter((p) => p.slug).map((p) => ({
        url: `${SITE_URL}/blogs/${p.slug}`,
        lastModified: new Date(p.updatedAt || p.publishedAt || Date.now()),
        changeFrequency: 'monthly', priority: 0.8,
    }));
}

async function portfolioEntries(kind) {
    const entries = [];
    for (let page = 1; page <= 500; page++) {
        const data = await safeJson(`/api/${kind}?page=${page}&limit=100`);
        if (!data) break;
        const rows = kind === 'videos' ? data.client || [] : data.photos || [];
        entries.push(...rows.map((row) => kind === 'videos' ? row?.videos?._id : row?._id).filter(Boolean).map((id) => ({
            url: `${SITE_URL}/${kind === 'videos' ? 'films' : 'photos'}/${id}`,
            changeFrequency: 'monthly', priority: kind === 'videos' ? 0.7 : 0.6,
        })));
        if (data.hasMore === false || (!data.hasMore && rows.length < 100)) break;
    }
    return entries;
}

// Film detail pages. `/api/videos` returns client records whose `videos`
// subdocument holds the id used by /films/[videoId].
async function filmEntries() { return portfolioEntries('videos'); }

// Wedding story pages — the fullest page about any one couple.
async function weddingStoryEntries() {
    const out = [];
    for (let page = 1; page <= 20; page++) {
        const data = await safeJson(`/api/weddings?limit=60&page=${page}`);
        for (const w of data?.weddings || []) {
            out.push({ url: `${SITE_URL}/weddings/story/${w.slug}`, changeFrequency: 'monthly', priority: 0.8 });
        }
        if (!data?.hasMore) break;
    }
    return out;
}

// Photo detail pages.
async function photoEntries() { return portfolioEntries('photos'); }

// CMS-built pages (/[slug]) that an admin published and that have no hand-built
// route. Reserved keys (which only feed existing routes) and anything already
// listed as a static route are skipped, so no URL is submitted twice.
async function cmsPageEntries(taken) {
    const data = await safeJson('/api/content');
    const pages = data?.pages || [];
    return pages
        .filter((p) => p.pageKey
            && p.status === 'Published'
            && !RESERVED_CMS_PAGE_KEYS.has(p.pageKey.toLowerCase())
            && !taken.has(`/${p.pageKey}`))
        .map((p) => ({
            url: `${SITE_URL}/${p.pageKey}`,
            lastModified: new Date(p.updatedAt || Date.now()),
            changeFrequency: 'monthly',
            priority: 0.5,
        }));
}

// Category hubs for blog topics
const CATEGORY_HUBS = [
    'Real Weddings',
    'Wedding Planning',
    'Photography',
    'Decor & Styling',
    'Venues',
    'Bridal Fashion',
];

function categoryHubEntries() {
    return CATEGORY_HUBS.map((cat) => ({
        url: `${SITE_URL}/blogs?category=${encodeURIComponent(cat)}`,
        lastModified: new Date(),
        changeFrequency: 'daily',
        priority: 0.8,
    }));
}

// Programmatic destination wedding city hubs
function destinationHubEntries() {
    return getAllDestinationSlugs().map(({ city }) => ({
        url: `${SITE_URL}/weddings/${city}`,
        lastModified: new Date(),
        changeFrequency: 'weekly',
        priority: 0.85,
    }));
}

export default async function sitemap() {
    const taken = new Set(STATIC_ROUTES.map((r) => r.path));

    const [blogs, films, photos, cmsPages, stories] = await Promise.all([
        blogEntries(),
        filmEntries(),
        photoEntries(),
        cmsPageEntries(taken),
        weddingStoryEntries(),
    ]);

    const staticEntries = STATIC_ROUTES.map(({ path, changeFrequency, priority }) => ({
        url: `${SITE_URL}${path === '/' ? '' : path}`,
        lastModified: new Date(),
        changeFrequency,
        priority,
    }));

    const destinationEntries = destinationHubEntries();
    const categoryEntries = categoryHubEntries();

    return [
        ...staticEntries,
        ...destinationEntries,
        ...categoryEntries,
        ...blogs,
        ...stories,
        ...films,
        ...photos,
        ...cmsPages,
    ];
}
