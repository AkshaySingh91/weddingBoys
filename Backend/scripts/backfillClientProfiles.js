/**
 * Gives existing weddings what their story pages need (plan phase 4).
 *
 *   node scripts/backfillClientProfiles.js [--dry-run | --apply | --verify | --rollback=<runId>]
 *
 *   slug        "bride-groom", made unique (then -<year>, then -2, -3…); collisions listed
 *   location    the most common city / venue / state across its items, if it has none
 *   cover       its first film by today's order, else its first photo, if none chosen
 *   story       on, if never set
 *   item order  today's feed order (hero, priorities), for weddings never ordered
 *   item citySlug  from each item's city
 *
 * Only fills what is empty: a slug, location, cover or order an admin set is
 * never replaced. Items' order is only written for weddings whose items are
 * all still at 0.
 */
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { parseMode, startRun, loadRun, markRolledBack } from './lib/runLog.js';
import { slugify } from '../Services/taxonomy.js';
import { slugForNames } from '../Services/weddingProfile.js';

dotenv.config();
const { mode, runId } = parseMode();
await mongoose.connect(process.env.MONGO_URI);
const db = mongoose.connection.db;
const clientsCol = db.collection('clients');
const itemsCol = db.collection('portfolioitems');
console.log(`database "${db.databaseName}" · mode ${mode}`);

const CLIENT_FIELDS = ['slug', 'location', 'cover', 'story'];
// Fields may be dotted ("location.citySlug").
const get = (doc, path) => path.split('.').reduce((v, k) => v?.[k], doc);
const pick = (doc, fields) => Object.fromEntries(fields.map((f) => [f, get(doc, f) ?? null]));
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const nameOf = (c) => [c.clientName?.Bride, c.clientName?.Groom].filter(Boolean).join(' & ');

/* ---------------------------------------------------------------- rollback */
if (mode === 'rollback') {
    let run;
    try { run = await loadRun('backfillClientProfiles', runId); } catch (e) { console.error(e.message); await mongoose.disconnect(); process.exit(1); }
    let restored = 0;
    const kept = [];
    for (const c of run.changes) {
        const col = c.op === 'client' ? clientsCol : itemsCol;
        const current = await col.findOne({ _id: c.docId });
        if (!current) continue;
        const fields = Object.keys(c.after);
        if (!same(pick(current, fields), c.after)) { kept.push(`${c.op} ${c.docId}`); continue; }
        const $set = {};
        const $unset = {};
        for (const f of fields) (c.before[f] === null ? ($unset[f] = '') : ($set[f] = c.before[f]));
        await col.updateOne({ _id: c.docId }, { ...(Object.keys($set).length ? { $set } : {}), ...(Object.keys($unset).length ? { $unset } : {}) });
        restored += 1;
    }
    console.log(`rolled back ${runId}: restored ${restored}; kept ${kept.length} changed since`);
    await markRolledBack(runId, { restored, kept: kept.length });
    await mongoose.disconnect();
    process.exit(0);
}

const [clients, items] = await Promise.all([
    clientsCol.find({}).project({ videos: 0, photos: 0 }).toArray(),
    itemsCol.find({}).project({ client: 1, kind: 1, location: 1, order: 1, isHero: 1, heroPriority: 1, generalPriority: 1, status: 1, clientStatus: 1, mediaReady: 1 }).toArray(),
]);
const itemsBy = new Map();
for (const i of items) {
    const k = String(i.client);
    if (!itemsBy.has(k)) itemsBy.set(k, []);
    itemsBy.get(k).push(i);
}
const FEED = (a, b) => (Number(b.isHero) - Number(a.isHero)) || ((b.heroPriority ?? 0) - (a.heroPriority ?? 0))
    || ((b.generalPriority ?? 0) - (a.generalPriority ?? 0)) || String(b._id).localeCompare(String(a._id));

/* ---------------------------------------------------------------- verify */
if (mode === 'verify') {
    const problems = [];
    const seen = new Map();
    for (const c of clients) {
        if (!c.slug) problems.push(`${nameOf(c)} has no slug`);
        else if (seen.has(c.slug)) problems.push(`slug "${c.slug}" used by ${nameOf(c)} and ${seen.get(c.slug)}`);
        else seen.set(c.slug, nameOf(c));
        for (const old of c.slugHistory || []) if (clients.some((o) => o !== c && o.slug === old)) problems.push(`old slug "${old}" of ${nameOf(c)} is another wedding's slug`);
        if (c.cover && !(itemsBy.get(String(c._id)) || []).some((i) => String(i._id) === String(c.cover))) problems.push(`${nameOf(c)}: cover is not one of its items`);
    }
    for (const i of items) if (i.location?.city && i.location.citySlug !== slugify(i.location.city)) problems.push(`item ${i._id}: citySlug out of date`);
    const index = (await clientsCol.indexes()).find((x) => x.key?.slug === 1);
    console.log(`${clients.length} wedding(s), ${seen.size} slug(s); unique slug index: ${index?.unique ? 'yes' : 'NO'}`);
    problems.slice(0, 20).forEach((p) => console.log('  ✖ ' + p));
    console.log(problems.length ? `✖ ${problems.length} problem(s)` : '✔ every wedding has a unique slug; covers and city slugs consistent');
    await mongoose.disconnect();
    process.exit(problems.length ? 1 : 0);
}

/* ---------------------------------------------------------------- plan */
const taken = new Set(clients.flatMap((c) => [c.slug, ...(c.slugHistory || [])].filter(Boolean)));
const collisions = [];
function freeSlug(c) {
    // Same rule as a new wedding (Services/weddingProfile.js slugForNames): "aisha-rahul".
    const root = slugForNames(c.clientName?.Bride, c.clientName?.Groom) || 'wedding';
    const d = new Date(c.weddingDate || c.celebrationDates?.startDate || NaN);
    const candidates = [root, ...(Number.isNaN(d.getTime()) ? [] : [`${root}-${d.getFullYear()}`])];
    for (let n = 2; n < 500; n++) candidates.push(`${root}-${n}`);
    const slug = candidates.find((s) => !taken.has(s));
    if (slug !== root) collisions.push(`${nameOf(c)} → ${slug} ("${root}" taken)`);
    taken.add(slug);
    return slug;
}
const mostCommon = (values) => {
    const counts = new Map();
    for (const v of values.filter(Boolean)) counts.set(v, (counts.get(v) || 0) + 1);
    return [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
};

const clientChanges = [];
const itemChanges = [];
for (const c of clients) {
    const own = (itemsBy.get(String(c._id)) || []).slice().sort(FEED);
    const after = {};
    if (!c.slug) after.slug = freeSlug(c);
    if (!c.location?.city) {
        const city = mostCommon(own.map((i) => i.location?.city?.trim()));
        if (city) {
            const inCity = own.filter((i) => i.location?.city?.trim() === city);
            after.location = Object.fromEntries(Object.entries({
                ...(c.location || {}),
                city, citySlug: slugify(city),
                venue: c.location?.venue || mostCommon(inCity.map((i) => i.location?.venue?.trim())),
                state: c.location?.state || mostCommon(inCity.map((i) => i.location?.state?.trim())),
            }).filter(([, v]) => v));
        }
    }
    if (!c.cover) {
        const pub = own.filter((i) => i.status === 'Published' && i.mediaReady);
        const cover = pub.find((i) => i.kind === 'Video') || pub.find((i) => i.kind === 'Photo') || own[0];
        if (cover) after.cover = cover._id;
    }
    if (!c.story) after.story = { enabled: true };
    if (Object.keys(after).length) clientChanges.push({ doc: c, before: pick(c, Object.keys(after)), after });

    const neverOrdered = own.every((i) => !i.order);
    own.forEach((i, idx) => {
        const set = {};
        if (neverOrdered && idx !== (i.order ?? 0)) set.order = idx;
        if (i.location?.city && i.location.citySlug !== slugify(i.location.city)) set['location.citySlug'] = slugify(i.location.city);
        if (Object.keys(set).length) {
            const before = { order: i.order ?? null, 'location.citySlug': i.location?.citySlug ?? null };
            itemChanges.push({ doc: i, set, before: Object.fromEntries(Object.keys(set).map((k) => [k, before[k]])) });
        }
    });
}

console.log(`weddings: ${clientChanges.length} of ${clients.length} get profile fields; items: ${itemChanges.length} get order or city slug`);
for (const { doc, after } of clientChanges) {
    console.log(`    ${nameOf(doc).padEnd(26)} ${after.slug ? `slug ${after.slug}` : ''}${after.location ? `  city ${after.location.city}${after.location.venue ? ` / ${after.location.venue}` : ''}` : ''}${after.cover ? '  cover set' : ''}`);
}
if (collisions.length) { console.log('slug collisions resolved:'); collisions.forEach((x) => console.log('    ' + x)); }
const noCity = clients.filter((c) => !c.location?.city && !clientChanges.find((x) => x.doc === c)?.after.location);
if (noCity.length) console.log(`no city found for ${noCity.length}: ${noCity.map(nameOf).join(', ')} — set it in the workspace`);

if (mode === 'dryRun') {
    console.log('[dry-run] nothing written.');
    await mongoose.disconnect();
    process.exit(0);
}

/* ---------------------------------------------------------------- apply */
const run = await startRun('backfillClientProfiles');
try {
    for (const { doc, before, after } of clientChanges) {
        await clientsCol.updateOne({ _id: doc._id }, { $set: after });
        await run.record({ op: 'client', docId: doc._id, before, after });
    }
    for (const { doc, set, before } of itemChanges) {
        await itemsCol.updateOne({ _id: doc._id }, { $set: set });
        await run.record({ op: 'item', docId: doc._id, before, after: set });
    }
    await run.finish({ clients: clientChanges.length, items: itemChanges.length });
} catch (error) {
    await run.fail(error);
    throw error;
}
// The unique index is declared on the model; make sure it exists now that
// every wedding has a distinct slug.
const Client = (await import('../Models/ClientSchema.js')).default;
await Client.syncIndexes();
console.log('Next: node scripts/backfillClientProfiles.js --verify');
await mongoose.disconnect();
