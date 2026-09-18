const api_url = process.env.NEXT_PUBLIC_API_URL;
const REVALIDATE = process.env.NODE_ENV === 'development' ? 0 : 3600;

export async function getPublishedPosts({ category, tag, search, page = 1, limit = 24 } = {}) {
    try {
        const params = new URLSearchParams({ page: String(page), limit: String(limit) });
        if (category) params.set('category', category);
        if (tag) params.set('tag', tag);
        if (search) params.set('search', search);
        const res = await fetch(`${api_url}/api/blogs?${params.toString()}`, { next: { revalidate: REVALIDATE } });
        if (!res.ok) return { posts: [], total: 0, hasMore: false };
        return await res.json();
    } catch {
        return { posts: [], total: 0, hasMore: false };
    }
}

export async function getPostBySlug(slug, { previewToken } = {}) {
    try {
        const query = previewToken ? `?previewToken=${encodeURIComponent(previewToken)}` : '';
        const res = await fetch(`${api_url}/api/blogs/slug/${encodeURIComponent(slug)}${query}`, {
            next: { revalidate: previewToken ? 0 : REVALIDATE },
            cache: previewToken ? 'no-store' : 'default',
        });
        if (!res.ok) return null;
        return await res.json();
    } catch {
        return null;
    }
}

export async function getRelatedPosts(slug) {
    try {
        const res = await fetch(`${api_url}/api/blogs/related/${encodeURIComponent(slug)}`, { next: { revalidate: REVALIDATE } });
        if (!res.ok) return [];
        const data = await res.json();
        return data.posts || [];
    } catch {
        return [];
    }
}

export async function getBlogComments(slug, { sort = 'newest', page = 1 } = {}) {
    try {
        const params = new URLSearchParams({ sort, page: String(page) });
        const res = await fetch(`${api_url}/api/blogs/${encodeURIComponent(slug)}/comments?${params.toString()}`, {
            next: { revalidate: 60 } // Shorter revalidation for comments freshness
        });
        if (!res.ok) return { total: 0, comments: [], commentsAllowed: true };
        return await res.json();
    } catch {
        return { total: 0, comments: [], commentsAllowed: true };
    }
}

export async function toggleBlogLike(slug, { decrement = false } = {}) {
    try {
        const res = await fetch(`${api_url}/api/blogs/${encodeURIComponent(slug)}/like`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ decrement }),
        });
        if (!res.ok) return null;
        return await res.json();
    } catch {
        return null;
    }
}

// Absolute site origin for canonical / OG / JSON-LD URLs.
// Re-exported from lib/siteConfig.js so every consumer resolves the same host —
// existing `import { SITE_URL } from '@/lib/blogApi.js'` call sites keep working.
export { SITE_URL } from './siteConfig.js';
