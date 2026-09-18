'use client';

const api_url = process.env.NEXT_PUBLIC_API_URL;

// De-dupe concurrent/repeat loads of the same page so several <CmsSection>s on
// one screen share a single network request (signed URLs are per-request).
const cache = new Map();

export function getPageContent(pageKey) {
    if (!cache.has(pageKey)) {
        const p = fetch(`${api_url}/api/content/${pageKey}`, { credentials: 'omit' })
            .then((res) => (res.ok ? res.json() : { page: null }))
            .then((data) => data.page)
            .catch(() => null);
        cache.set(pageKey, p);
    }
    return cache.get(pageKey);
}

export const findBlock = (page, keyOrType) => (page?.blocks || [])
    .find((b) => b.key === keyOrType || b.type === keyOrType) || null;
