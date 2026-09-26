/**
 * One truth per thing on the home page (plan phase 7).
 *
 *   node scripts/consolidateHomeSources.js [--dry-run | --apply | --verify | --rollback=<runId>]
 *
 *   stats    The track record rendered twice: once hardcoded inside "Our packages",
 *            once as the CMS `home-stats` block at the foot of the page. The site
 *            now draws it once, from the block, in the packages' design. This
 *            moves the block to just after `home-packages` (where visitors see it
 *            today) and, if it still has the default wording, gives it the
 *            section's heading, lead and one line per figure.
 *   team     `home-team` now always shows Website › Team. Members typed into the
 *            block are added there (by name, photo kept); the block's copy is cleared.
 *   reviews  `home-reviews` now always shows the Couple reviews. Same treatment.
 *   bts      The BTS tab (WebsiteSettings.BtsPhotos, read only by the old site) is
 *            retired; its photos are added to the `home-bts` gallery if that is empty.
 *
 * Applies to the published layout and to a saved draft. Idempotent; each page's
 * previous state and every created team member / review is recorded for --rollback.
 */
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { parseMode, startRun, loadRun, markRolledBack } from './lib/runLog.js';

dotenv.config();
const { mode, runId } = parseMode();
await mongoose.connect(process.env.MONGO_URI);
const db = mongoose.connection.db;
console.log(`database "${db.databaseName}" · mode ${mode}`);

const pages = db.collection('pagecontents');
const team = db.collection('teamschemas');
const reviews = db.collection('clientreviews');
const mediaColl = db.collection('media');
const SCRIPT = 'consolidateHomeSources';

/* ---------------------------------------------------------------- rollback */
if (mode === 'rollback') {
    let run;
    try { run = await loadRun(SCRIPT, runId); } catch (e) { console.error(e.message); await mongoose.disconnect(); process.exit(1); }
    const n = { pages: 0, team: 0, reviews: 0 };
    for (const c of [...run.changes].reverse()) {
        if (c.op === 'page') { await pages.replaceOne({ _id: c.docId }, c.before); n.pages += 1; }
        if (c.op === 'create-team') { await team.deleteOne({ _id: c.docId }); n.team += 1; }
        if (c.op === 'create-review') { await reviews.deleteOne({ _id: c.docId }); n.reviews += 1; }
    }
    console.log(`rolled back ${runId}: ${JSON.stringify(n)}`);
    await markRolledBack(runId, n);
    await mongoose.disconnect();
    process.exit(0);
}

const DEFAULT_STATS_TITLE = 'Our Track Record';
const STATS_HEADING = 'Crafting Timeless Memories Since 2020';
const STATS_LEAD = 'Trusted by generations, our lens has witnessed countless stories of love, tradition, and celebration.';
const STATS_DETAIL = {
    'weddings captured': 'Magical moments preserved',
    'awards won': 'Industry recognition',
    'happy clients': 'Satisfied families',
    'years experience': 'In the industry',
};
const norm = (s) => String(s || '').trim().toLowerCase();
const byOrder = (a, b) => (a.order || 0) - (b.order || 0);

/** The stats block after the packages, default wording filled in. Returns [blocks, notes]. */
function fixStats(blocks) {
    const notes = [];
    let list = [...blocks].sort(byOrder).map((b) => ({ ...b }));
    const stats = list.find((b) => b.type === 'stats' && (b.key === 'home-stats' || !b.key));
    if (!stats) return [blocks, notes];
    if (stats.title === DEFAULT_STATS_TITLE) {
        stats.title = STATS_HEADING;
        if (!stats.subtitle) stats.subtitle = STATS_LEAD;
        notes.push(`stats heading → "${STATS_HEADING}"`);
    }
    let filled = 0;
    stats.items = (stats.items || []).map((it) => {
        const detail = STATS_DETAIL[norm(it.subtitle)];
        if (detail && !it.body) { filled += 1; return { ...it, body: detail }; }
        return it;
    });
    if (filled) notes.push(`stats: ${filled} figure line(s) filled`);
    const pi = list.findIndex((b) => b.key === 'home-packages');
    const si = list.indexOf(stats);
    if (pi >= 0 && si !== pi + 1) {
        list.splice(si, 1);
        list.splice(list.findIndex((b) => b.key === 'home-packages') + 1, 0, stats);
        notes.push('stats moved to just after "Our packages"');
    }
    list = list.map((b, i) => ({ ...b, order: i }));
    return [list, notes];
}

const photoNode = async (mediaIds = []) => {
    const m = mediaIds.length ? await mediaColl.findOne({ _id: mediaIds[0] }) : null;
    return m ? { key: m.storageKey, mediaId: m.mediaId } : null;
};

/* ---------------------------------------------------------------- plan */
const home = await pages.findOne({ pageKey: 'home' });
if (!home) {
    console.log('No home page: nothing to do.');
    await mongoose.disconnect();
    process.exit(0);
}
const ws = await db.collection('websitesettings').findOne({});
const teamNames = new Set((await team.find({}, { projection: { 'about.name': 1 } }).toArray()).map((t) => norm(t.about?.name)));
const reviewKeys = new Set((await reviews.find({}).toArray()).map((r) => `${norm(r.person?.name)}|${norm(r.reviewText).slice(0, 60)}`));

const creates = [];   // { coll, doc, label }
const notes = [];
const unmatched = [];

async function transform(blocks, where) {
    let [out, n] = fixStats(blocks);
    n.forEach((x) => notes.push(`${where}: ${x}`));
    out = await Promise.all(out.map(async (b) => {
        if (b.type === 'team' && b.items?.length) {
            for (const it of b.items) {
                const name = String(it.title || '').trim();
                if (!name || teamNames.has(norm(name))) continue;
                const img = await photoNode(it.media);
                if (!img) { unmatched.push(`${where}: team member "${name}" has no photo; add them in Website › Team`); continue; }
                teamNames.add(norm(name));
                creates.push({ coll: 'team', label: `team member "${name}"`, doc: { imageMetaData: img, isHero: false, about: { name, designation: String(it.subtitle || '').trim() || 'Team' } } });
            }
            notes.push(`${where}: home-team's ${b.items.length} typed member(s) cleared; the block shows Website › Team`);
            return { ...b, items: [] };
        }
        if (b.type === 'reviews' && b.items?.length) {
            for (const it of b.items) {
                const name = String(it.title || '').trim();
                const text = String(it.body || '').trim();
                const key = `${norm(name)}|${norm(text).slice(0, 60)}`;
                if (!name || !text || reviewKeys.has(key)) continue;
                const photo = await photoNode(it.media);
                const gender = ['Bride', 'Groom', 'Couple', 'Family'].find((g) => g.toLowerCase() === norm(it.subtitle)) || 'Couple';
                if (!photo) { unmatched.push(`${where}: review by "${name}" has no photo; add it in Website › Home › Couple reviews`); continue; }
                reviewKeys.add(key);
                creates.push({ coll: 'reviews', label: `review by "${name}"`, doc: { reviewText: text, photo, person: { name, gender }, client: null, createdAt: new Date(), updatedAt: new Date() } });
            }
            notes.push(`${where}: home-reviews' ${b.items.length} typed review(s) cleared; the block shows Couple reviews`);
            return { ...b, items: [] };
        }
        if (b.type === 'mediaGallery' && b.key === 'home-bts' && !(b.media || []).length && ws?.BtsPhotos?.length) {
            const ids = [];
            for (const p of ws.BtsPhotos) {
                const m = await mediaColl.findOne(p.mediaId ? { mediaId: p.mediaId } : { storageKey: p.photoMetaData?.key });
                if (m) ids.push(m._id); else unmatched.push(`${where}: BTS photo ${p.mediaId || p.photoMetaData?.key} has no media record; not imported`);
            }
            if (ids.length) notes.push(`${where}: ${ids.length} BTS photo(s) added to "Behind the scenes"`);
            return { ...b, media: ids };
        }
        return b;
    }));
    return out;
}

const next = { ...home, blocks: await transform(home.blocks || [], 'published') };
if (home.draft?.blocks) next.draft = { ...home.draft, blocks: await transform(home.draft.blocks, 'draft') };

/* ---------------------------------------------------------------- verify */
if (mode === 'verify') {
    const problems = [];
    for (const [where, blocks] of [['published', home.blocks || []], ...(home.draft?.blocks ? [['draft', home.draft.blocks]] : [])]) {
        const sorted = [...blocks].sort(byOrder);
        const pi = sorted.findIndex((b) => b.key === 'home-packages');
        const si = sorted.findIndex((b) => b.type === 'stats');
        if (sorted.filter((b) => b.type === 'stats').length > 1) problems.push(`${where}: more than one stats block`);
        if (pi >= 0 && si >= 0 && si !== pi + 1) problems.push(`${where}: stats is not just after "Our packages"`);
        for (const b of sorted) {
            if ((b.type === 'team' || b.type === 'reviews') && b.items?.length) problems.push(`${where}: ${b.key || b.type} still holds ${b.items.length} typed item(s)`);
        }
    }
    const people = await team.countDocuments({ isHero: { $ne: true }, 'about.name': { $exists: true } });
    console.log(`  team members shown: ${people} · reviews shown: ${await reviews.countDocuments()}`);
    problems.forEach((p) => console.log('  ✖ ' + p));
    console.log(problems.length ? `✖ ${problems.length} problem(s)` : '✔ stats once, after the packages; team and reviews read from their own screens');
    await mongoose.disconnect();
    process.exit(problems.length ? 1 : 0);
}

const changed = JSON.stringify(next) !== JSON.stringify(home);
notes.forEach((n) => console.log('  ' + n));
creates.forEach((c) => console.log(`  create ${c.label}`));
unmatched.forEach((u) => console.log('  ! ' + u));
if (!changed && !creates.length) console.log('  nothing to change');
if (mode === 'dryRun') {
    console.log('[dry-run] nothing written.');
    await mongoose.disconnect();
    process.exit(0);
}

const run = await startRun(SCRIPT);
try {
    for (const c of creates) {
        const r = await (c.coll === 'team' ? team : reviews).insertOne(c.doc);
        await run.record({ op: c.coll === 'team' ? 'create-team' : 'create-review', docId: r.insertedId });
    }
    if (changed) {
        await pages.replaceOne({ _id: home._id }, { ...next, updatedAt: new Date() });
        await run.record({ op: 'page', docId: home._id, before: home });
    }
    await run.finish({ created: creates.length, pageChanged: changed });
} catch (error) {
    await run.fail(error);
    throw error;
}
console.log('Next: node scripts/consolidateHomeSources.js --verify');
await mongoose.disconnect();
process.exit(0);
