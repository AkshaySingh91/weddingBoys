#!/usr/bin/env node
/**
 * Requests every URL in the sitemap and reports any that no longer resolve.
 * Read-only (GET only). Run after the portfolio cut-over, and after any change
 * to how films and photos are looked up.
 *
 *   node scripts/checkSitemapUrls.mjs --site=https://theweddingvachan.com --api=https://api.example
 *   node scripts/checkSitemapUrls.mjs --site=http://localhost:3000 --api=http://localhost:8080 \
 *        --sitemap=https://theweddingvachan.com/sitemap.xml
 *
 * --sitemap reads the URL list from somewhere else (e.g. production's) and
 * requests each path against --site, so the live list can be checked against a
 * local or staging build before it ships.
 *
 * Film and photo pages fetch their data in the browser, so the page itself
 * answers 200 even when the film is gone and the visitor sees "not found".
 * For /films/<id> and /photos/<id> the API lookup behind the page is checked
 * too; that is the check that matters for the cut-over.
 *
 * Exits 1 when any URL fails.
 */
const arg = (n) => (process.argv.find((a) => a.startsWith(`--${n}=`)) || '').slice(n.length + 3);
const SITE = arg('site').replace(/\/$/, '');
const API = arg('api').replace(/\/$/, '');
const SITEMAP = arg('sitemap') || `${SITE}/sitemap.xml`;
const CONCURRENCY = Number(arg('concurrency')) || 4;

if (!SITE) {
    console.error('usage: node scripts/checkSitemapUrls.mjs --site=<origin> [--api=<api origin>] [--sitemap=<url>]');
    process.exit(2);
}
if (!API) console.warn('no --api given: film and photo pages are checked by page status only, which is always 200.\n');

const xml = await (await fetch(SITEMAP, { signal: AbortSignal.timeout(30000) })).text();
const locs = [...xml.matchAll(/<loc>\s*([^<]+?)\s*<\/loc>/g)].map((m) => m[1].replace(/&amp;/g, '&'));
if (!locs.length) {
    // theweddingvachan.com answered /sitemap.xml with its HTML home page when this
    // was written: the domain was still served by the previous frontend.
    const looksHtml = /<html/i.test(xml.slice(0, 500));
    console.error(`no <loc> entries in ${SITEMAP}${looksHtml ? ' (it returned an HTML page, not a sitemap: is this origin running the Next frontend?)' : ''}`);
    process.exit(1);
}

const failures = [];
const counts = { pages: 0, films: 0, photos: 0 };

async function check(loc) {
    const { pathname, search } = new URL(loc);
    const page = `${SITE}${pathname}${search}`;
    try {
        const res = await fetch(page, { redirect: 'manual', signal: AbortSignal.timeout(30000) });
        // A permanent redirect is a valid answer for a moved page, but it should
        // not be in the sitemap; report it without failing the run.
        if (res.status >= 300 && res.status < 400) console.log(`  redirect ${res.status} ${pathname} → ${res.headers.get('location')}`);
        else if (!res.ok) failures.push(`${res.status} ${pathname}`);
        counts.pages += 1;
    } catch (e) {
        failures.push(`${e.name} ${pathname}`);
    }

    const detail = pathname.match(/^\/(films|photos)\/([^/]+)$/);
    if (API && detail) {
        const [, kind, id] = detail;
        const api = `${API}/api/${kind === 'films' ? 'videos' : 'photos'}/${id}`;
        try {
            const res = await fetch(api, { signal: AbortSignal.timeout(30000) });
            if (!res.ok) failures.push(`${res.status} ${pathname} (API ${api})`);
            counts[kind] += 1;
        } catch (e) {
            failures.push(`${e.name} ${pathname} (API ${api})`);
        }
    }
}

let next = 0;
await Promise.all(Array.from({ length: CONCURRENCY }, async () => {
    while (next < locs.length) await check(locs[next++]);
}));

console.log(`${locs.length} sitemap URL(s) · ${counts.pages} page(s) requested · `
    + `${counts.films} film and ${counts.photos} photo lookup(s) via the API`);
if (failures.length) {
    console.log(`\n✖ ${failures.length} failure(s):`);
    failures.forEach((f) => console.log(`  ${f}`));
    process.exit(1);
}
console.log('✔ every sitemap URL resolves.');
