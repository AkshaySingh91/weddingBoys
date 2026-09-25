/**
 * Compares the public API on the legacy read path with the PortfolioItem path.
 * Read-only: it only makes GET/HEAD requests.
 *
 *   node scripts/parityCheck.js --legacy=http://localhost:8081 --v2=http://localhost:8082
 *                               [--categories="All Work,Wedding,Pre-Wedding,Garden,Haldi"]
 *                               [--no-media] [--strict]
 *
 * Run two backends against the SAME database, one with PORTFOLIO_READS unset (or
 * any value but v2) and one with PORTFOLIO_READS=v2; for a rehearsal both point
 * at the copy. Neither needs the media worker.
 *
 * Covers the hero, every home and /films tag row, the full film and photo feeds,
 * the home portfolio grid per category, the map, every film and photo page with
 * its recommendations, and search. Then (unless --no-media) it requests every
 * image and video URL the v2 responses contain.
 *
 *   BROKEN       v2 fails where legacy works, a field a page reads is missing,
 *                a date is formatted differently, or a media URL does not load.
 *   DIFFERENCES  what visitors will see differently: items added or removed,
 *                order changes. Expected ones are explained by cutoverReport.js
 *                (admin-hidden items, admin-created weddings, tied priorities).
 *
 * Exits 1 on anything BROKEN, or with --strict on any difference.
 */
const arg = (n) => (process.argv.find((a) => a.startsWith(`--${n}=`)) || '').slice(n.length + 3);
const LEGACY = arg('legacy').replace(/\/$/, '');
const V2 = arg('v2').replace(/\/$/, '');
const CATEGORIES = (arg('categories') || 'All Work,Wedding,Pre-Wedding,Garden,Haldi').split(',').map((s) => s.trim()).filter(Boolean);
const CHECK_MEDIA = !process.argv.includes('--no-media');
const STRICT = process.argv.includes('--strict');

if (!LEGACY || !V2) {
    console.error('usage: node scripts/parityCheck.js --legacy=<base url> --v2=<base url> [--no-media] [--strict]');
    process.exit(2);
}

const broken = [];
const diffs = [];
const passed = [];
const mediaUrls = new Map(); // url -> where it was seen

async function get(base, path) {
    const res = await fetch(base + path, { signal: AbortSignal.timeout(20000) });
    let body = null;
    try { body = await res.json(); } catch { /* non-JSON */ }
    return { status: res.status, body };
}

async function both(path) {
    const [l, v] = await Promise.all([get(LEGACY, path), get(V2, path)]);
    if (l.status === 200 && v.status !== 200) broken.push(`${path}: legacy 200, v2 ${v.status}`);
    return [l, v];
}

const noteMedia = (url, where) => { if (url && !mediaUrls.has(url)) mediaUrls.set(url, where); };

/**
 * Recommendations are the top N of many equal priorities, so which ties make the
 * cut is arbitrary on both paths. Only the count is compared.
 */
function compareCount(what, legacyList, v2List) {
    if (legacyList.length !== v2List.length) diffs.push(`${what}: ${legacyList.length} → ${v2List.length}`);
    else passed.push(what);
}

/** Membership and order of two id lists. */
function compare(what, legacyIds, v2Ids, { order = true } = {}) {
    const L = legacyIds.map(String);
    const V = v2Ids.map(String);
    const removed = L.filter((x) => !V.includes(x));
    const added = V.filter((x) => !L.includes(x));
    const parts = [];
    if (removed.length) parts.push(`−${removed.length} ${removed.join(' ')}`);
    if (added.length) parts.push(`+${added.length} ${added.join(' ')}`);
    if (!parts.length && order && L.join() !== V.join()) parts.push('same items, different order');
    if (parts.length) diffs.push(`${what} (${L.length} → ${V.length}): ${parts.join(' · ')}`);
    else passed.push(what);
}

function need(cond, what) { if (!cond) broken.push(what); }

/* ---------------------------------------------------------------- hero */
{
    const [l, v] = await both('/api/hero-videos');
    const L = l.body?.heroVideos || [];
    const V = v.body?.heroVideos || [];
    compare('hero', L.map((s) => s.videoId), V.map((s) => s.videoId));
    for (const s of V) {
        need(s.posterUrl, `hero ${s.videoId}: no posterUrl`);
        need(s.videoUrl, `hero ${s.videoId}: no videoUrl`);
        noteMedia(s.posterUrl, `hero ${s.videoId} poster`);
        noteMedia(s.loopUrl || s.webUrl || s.sourceUrl, `hero ${s.videoId} video`);
    }
}

/* ---------------------------------------------------------- tag rows */
const rowTags = new Set();
for (const path of ['/api/homepage/tags', '/api/filmpage/tags']) {
    const { body } = await get(LEGACY, path);
    for (const t of body?.tags || []) rowTags.add(t);
}
const videoIds = new Set();
for (const tag of rowTags) {
    const [l, v] = await both(`/api/videos?tag=${encodeURIComponent(tag)}&page=1&limit=100`);
    const L = l.body?.client || [];
    const V = v.body?.client || [];
    compare(`row "${tag}"`, L.map((r) => r.videos._id), V.map((r) => r.videos._id));
    for (const r of V) {
        need(r.thumbnailUrl, `row "${tag}" film ${r.videos._id}: no thumbnailUrl`);
        noteMedia(r.thumbnailUrl, `row "${tag}" film ${r.videos._id}`);
        need(r.videos.videoShootDate === (L.find((x) => x.videos._id === r.videos._id)?.videos.videoShootDate ?? r.videos.videoShootDate),
            `row "${tag}" film ${r.videos._id}: date differs`);
    }
}

/* ------------------------------------------------------------ feeds */
{
    const [l, v] = await both('/api/videos?page=1&limit=500');
    const L = l.body?.client || [];
    const V = v.body?.client || [];
    compare('all films (/allfilms)', L.map((r) => r.videos._id), V.map((r) => r.videos._id), { order: false });
    [...L, ...V].forEach((r) => videoIds.add(r.videos._id));
    for (const r of V) noteMedia(r.thumbnailUrl, `film ${r.videos._id} thumbnail`);
}
const photoIds = new Set();
{
    const [l, v] = await both('/api/photos?page=1&limit=500');
    const L = l.body?.photos || [];
    const V = v.body?.photos || [];
    compare('all photos (/photos)', L.map((p) => p._id), V.map((p) => p._id), { order: false });
    [...L, ...V].forEach((p) => photoIds.add(String(p._id)));
    for (const p of V) {
        need(p.url, `photo ${p._id}: no url in the feed`);
        noteMedia(p.url, `photo ${p._id}`);
        const twin = L.find((x) => String(x._id) === String(p._id));
        if (twin?.url && p.url && twin.url !== p.url) diffs.push(`photo ${p._id}: different image URL (legacy ${twin.url} · v2 ${p.url})`);
    }
}

/* ------------------------------------------------- home portfolio grid */
for (const category of CATEGORIES) {
    const [l, v] = await both(`/api/home/sample-photos?category=${encodeURIComponent(category)}`);
    const L = l.body?.photos || [];
    const V = v.body?.photos || [];
    compare(`home portfolio "${category}"`, L.map((p) => p._id), V.map((p) => p._id));
    for (const p of V) {
        need(p.url, `home portfolio "${category}" photo ${p._id}: no url`);
        need(p.client?.Bride !== undefined, `home portfolio "${category}" photo ${p._id}: no client names`);
    }
}

/* ---------------------------------------------------------------- map */
{
    const [l, v] = await both('/api/map-clients');
    const L = l.body?.clients || [];
    const V = v.body?.clients || [];
    compare('map pins', L.map((c) => c.clientId), V.map((c) => c.clientId), { order: false });
    for (const c of V) {
        const twin = L.find((x) => x.clientId === c.clientId);
        need(c.url && c.video?._id && c.coordinate, `map pin ${c.clientId}: missing url, film or coordinate`);
        if (twin && twin.video?._id !== c.video?._id) diffs.push(`map pin ${c.clientId}: links film ${c.video?._id} (legacy ${twin.video?._id})`);
        noteMedia(c.url, `map pin ${c.clientId}`);
    }
}

/* -------------------------------------------------------- film pages */
for (const id of videoIds) {
    const [l, v] = await both(`/api/videos/${id}`);
    if (v.status !== 200) { if (l.status !== 200) passed.push(`film ${id}: 404 on both`); continue; }
    const L = l.body || {};
    const V = v.body;
    need(V.selectedVideo?.url, `film ${id}: no video url`);
    noteMedia(V.selectedVideo?.url, `film ${id} video`);
    if (l.status === 200) {
        need(L.selectedVideo?.videoShootDate === V.selectedVideo?.videoShootDate,
            `film ${id}: date "${V.selectedVideo?.videoShootDate}" (legacy "${L.selectedVideo?.videoShootDate}")`);
        compare(`film ${id} gallery`, (L.photos || []).map((p) => p._id), (V.photos || []).map((p) => p._id), { order: false });
    }
    for (const p of V.photos || []) {
        need(p.photoMetaData?.url, `film ${id} gallery photo ${p._id}: no photoMetaData.url`);
        noteMedia(p.photoMetaData?.url, `film ${id} gallery`);
    }

    const [lr, vr] = await both(`/api/videos/${id}/recommended`);
    const VR = vr.body?.recommendedVideos || [];
    if (lr.status === 200) compareCount(`film ${id} recommended`, lr.body?.recommendedVideos || [], VR);
    for (const r of VR) {
        need(r.thumbnailMetaData?.url, `film ${id} recommended ${r._id}: no thumbnailMetaData.url`);
        need(/^[A-Z][a-z]+ \d{4}$/.test(r.videoShootDate || ''), `film ${id} recommended ${r._id}: date "${r.videoShootDate}"`);
    }
}

/* ------------------------------------------------------- photo pages */
for (const id of photoIds) {
    const [l, v] = await both(`/api/photos/${id}`);
    if (v.status !== 200) { if (l.status !== 200) passed.push(`photo ${id}: 404 on both`); continue; }
    need(v.body.selectedPhoto?.url, `photo page ${id}: no url`);
    if (l.status === 200) {
        need(l.body.selectedPhoto?.photoShootDate === v.body.selectedPhoto?.photoShootDate,
            `photo page ${id}: date "${v.body.selectedPhoto?.photoShootDate}" (legacy "${l.body.selectedPhoto?.photoShootDate}")`);
        compare(`photo ${id} same-wedding strip`, (l.body.remainingPhotos || []).map((p) => p._id), (v.body.remainingPhotos || []).map((p) => p._id), { order: false });
    }
    for (const p of v.body.remainingPhotos || []) need(p.url, `photo page ${id} strip ${p._id}: no url`);

    const [lr, vr] = await both(`/api/photos/${id}/recommended?page=1&limit=10`);
    const VR = vr.body?.recommendedPhotos || [];
    if (lr.status === 200) compareCount(`photo ${id} recommended`, lr.body?.recommendedPhotos || [], VR);
    for (const r of VR) need(r.url, `photo ${id} recommended ${r._id}: no url`);
}

/* -------------------------------------------------------------- search */
// v2 also matches couple names, titles and places, so it may find MORE; it
// must never find less for a tag.
for (const q of [...rowTags].slice(0, 6)) {
    const [l, v] = await both(`/api/search?query=${encodeURIComponent(q)}`);
    const count = (b) => ['videos', 'photos', 'results', 'client'].reduce((n, k) => n + (Array.isArray(b?.[k]) ? b[k].length : 0), 0);
    if (count(v.body) < count(l.body)) diffs.push(`search "${q}": ${count(l.body)} → ${count(v.body)} results`);
    else passed.push(`search "${q}"`);
}

/* --------------------------------------------------------------- media */
if (CHECK_MEDIA) {
    const entries = [...mediaUrls.entries()];
    let i = 0;
    const worker = async () => {
        while (i < entries.length) {
            const [url, where] = entries[i++];
            try {
                const res = await fetch(url, { method: 'HEAD', signal: AbortSignal.timeout(20000) });
                if (!res.ok) broken.push(`${where}: ${res.status} ${url}`);
            } catch (e) {
                broken.push(`${where}: ${e.name} ${url}`);
            }
        }
    };
    await Promise.all(Array.from({ length: 8 }, worker));
    passed.push(`${entries.length} media URL(s) requested`);
}

/* -------------------------------------------------------------- output */
console.log(`Parity · legacy ${LEGACY} · v2 ${V2}\n`);
const list = (title, rows) => {
    if (!rows.length) return;
    console.log(`${title} (${rows.length})`);
    rows.forEach((r) => console.log(`  ${r}`));
    console.log('');
};
list('BROKEN', broken);
list('DIFFERENCES', diffs);
console.log(`${passed.length} check(s) identical, ${videoIds.size} film page(s), ${photoIds.size} photo page(s).`);
console.log(broken.length ? '✖ v2 is broken somewhere above.' : diffs.length ? '✔ nothing broken; review the differences.' : '✔ identical.');
process.exit(broken.length || (STRICT && diffs.length) ? 1 : 0);
