/**
 * Tells the Next frontend to drop cached data after an admin change, so a
 * publish shows on the site immediately instead of after the cache window
 * (hero 5 min, home 1 min, sitemap 1 h).
 *
 * Calls are coalesced for 2 s: a bulk edit of 40 items, or a worker finishing a
 * batch, sends one request, not 40. Failure is logged and swallowed — the cache
 * windows still expire on their own, so a missed refresh is a delay, never an
 * error for the admin.
 *
 * Needs FRONTEND_URL and REVALIDATION_SECRET. Deliberately no fallback secret:
 * the blog path's hardcoded fallback is public (it ships in the browser bundle).
 * Without both variables this is a no-op, logged once.
 *
 * Tags in use:
 *   portfolio      hero carousel, sitemap film/photo entries
 *   page:<key>     a CMS page (page:home is the home layout)
 */
const DELAY_MS = 2000;

let tags = new Set();
let paths = new Set();
let timer = null;
let warned = false;

export function queueRevalidate({ tags: t = [], paths: p = [] } = {}) {
    t.forEach((x) => tags.add(x));
    p.forEach((x) => paths.add(x));
    if (!timer) timer = setTimeout(flush, DELAY_MS);
}

/** Portfolio content changed: hero, rows, sitemap. */
export const revalidatePortfolio = () => queueRevalidate({ tags: ['portfolio'] });

async function flush() {
    const body = { tags: [...tags], paths: [...paths] };
    tags = new Set();
    paths = new Set();
    timer = null;

    const url = process.env.FRONTEND_URL;
    const secret = process.env.REVALIDATION_SECRET;
    if (!url || !secret) {
        if (!warned) console.warn('[revalidate] FRONTEND_URL or REVALIDATION_SECRET unset — site caches refresh on their own timers');
        warned = true;
        return;
    }
    try {
        const res = await fetch(`${url.replace(/\/$/, '')}/api/revalidate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ secret, ...body }),
            signal: AbortSignal.timeout(10000),
        });
        if (!res.ok) console.warn(`[revalidate] ${res.status} for ${body.tags.concat(body.paths).join(', ')}`);
    } catch (error) {
        console.warn(`[revalidate] ${error.message} for ${body.tags.concat(body.paths).join(', ')}`);
    }
}
