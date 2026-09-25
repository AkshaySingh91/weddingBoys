/**
 * Backfill PortfolioItem from the embedded Client.videos[] / Client.photos[].
 *
 * Additive and idempotent: it neither modifies nor removes the embedded arrays,
 * so the live site is unaffected until read paths are switched over separately.
 *
 * The subdocument `_id` is reused as the PortfolioItem `_id` (pre-flight
 * verified zero duplicates), so every existing /films/:id and /photos/:id URL —
 * already published in the sitemap — keeps resolving with no redirect table.
 *
 * Join to Media is via `Media.legacy.s3Key === videoMetaData.key`. It does NOT
 * read `Client.videos[].mediaId`: that field was never persisted, because the
 * path is undeclared on ClientSchema and Mongoose strict mode discarded it.
 *
 *   node scripts/backfillPortfolioItems.js [--dry-run | --apply | --verify | --rollback=<runId>]
 *                                          [--client=<id>] [--refresh-links]
 *
 * Follows the shared script contract (scripts/lib/runLog.js): with no mode it is
 * a dry run — it used to write on a bare invocation. --apply records every item
 * it creates or re-links; --rollback=<runId> deletes the items that run created
 * and restores the links it replaced, except where the item has changed since,
 * which it keeps and lists.
 *
 * CREATE-ONLY by default. A re-run never overwrites what an admin has since
 * edited. The original script `$set` tags, hero flags, priorities, location,
 * credits and `status: 'Published'` on EVERY run — so running it again after any
 * admin edit silently reverted the edit and republished anything hidden.
 *
 *   editorial fields  (title, tags, shootDate, location, isHero, heroPriority,
 *                      generalPriority, credits, clientNameText, status)
 *                     → written only when the item is first created.
 *   link fields       (media, mediaId, poster, posterMediaId, render, legacy)
 *                     → also written only on create, unless --refresh-links, which
 *                       re-points existing items at their assets and nothing else.
 *
 * --verify compares by ID, not by count: every embedded subdoc must have an item
 * whose `legacy.subdocId` is that subdoc. A count comparison stopped meaning
 * anything the moment the wizard began creating items with no legacy twin.
 */
import dotenv from 'dotenv';
import mongoose from 'mongoose';

dotenv.config();

const { parseMode, startRun, loadRun, markRolledBack } = await import('./lib/runLog.js');
const { mode, runId: ROLLBACK_ID } = parseMode();
const DRY = mode === 'dryRun';
const VERIFY_ONLY = mode === 'verify';
const ONE = (process.argv.find((a) => a.startsWith('--client=')) || '').split('=')[1];
const REFRESH_LINKS = process.argv.includes('--refresh-links');

const PortfolioItem = (await import('../Models/PortfolioItem.js')).default;
const Client = (await import('../Models/ClientSchema.js')).default;
const Media = (await import('../Models/Media.js')).default;
const WebsiteSetting = (await import('../Models/WebsiteSettingSchema.js')).default;
const { renderFromMedia } = await import('../Services/portfolioRender.js');

await mongoose.connect(process.env.MONGO_URI);
console.log(`database "${mongoose.connection.db.databaseName}" · mode ${mode}`);

// What an admin can edit. A rollback leaves any item whose values here differ
// from what the run wrote, because deleting it would delete that edit.
const fingerprint = (d) => JSON.stringify({
    tags: [...(d.tags || [])],
    status: d.status ?? null,
    isHero: Boolean(d.isHero),
    heroPriority: d.heroPriority ?? 0,
    generalPriority: d.generalPriority ?? 0,
    title: d.title ?? null,
    caption: d.caption ?? null,
    eventGroup: d.eventGroup || '',
    shootDate: d.shootDate ? new Date(d.shootDate).getTime() : null,
    location: ['country', 'state', 'city', 'venue'].map((k) => d.location?.[k] ?? null),
    credits: (d.credits || []).map((c) => [c.name ?? null, c.role ?? null]),
});
const LINK_KEYS = ['media', 'mediaId', 'poster', 'posterMediaId', 'render', 'legacy'];
const linksOf = (d) => Object.fromEntries(LINK_KEYS.map((k) => [k, d?.[k] ?? null]));

if (mode === 'rollback') {
    const { changes } = await loadRun('backfillPortfolioItems', ROLLBACK_ID)
        .catch(async (error) => { console.error(error.message); await mongoose.disconnect(); process.exit(1); });
    const kept = [];
    let deleted = 0;
    let restored = 0;
    for (const c of changes) {
        const current = await PortfolioItem.findById(c.docId).lean();
        if (!current) continue;
        if (c.op === 'create') {
            if (fingerprint(current) !== c.fingerprint) { kept.push(`${c.docId} (edited since the run)`); continue; }
            await PortfolioItem.deleteOne({ _id: c.docId });
            deleted += 1;
        } else if (c.op === 'refresh') {
            if (JSON.stringify(linksOf(current)) !== JSON.stringify(c.after)) { kept.push(`${c.docId} (links changed since the run)`); continue; }
            await PortfolioItem.updateOne({ _id: c.docId }, { $set: c.before }, { timestamps: false });
            restored += 1;
        }
    }
    console.log(`rolled back ${ROLLBACK_ID}: deleted ${deleted} created item(s), restored links on ${restored}`);
    if (kept.length) {
        console.log(`kept ${kept.length} item(s) that changed after the run:`);
        kept.slice(0, 20).forEach((k) => console.log('   ' + k));
    }
    await markRolledBack(ROLLBACK_ID, { deleted, restored, kept: kept.length });
    await mongoose.disconnect();
    process.exit(0);
}

const stats = { videos: 0, photos: 0, noMedia: 0, reversedCredits: 0, upserts: 0 };
const anomalies = [];

// Heuristic vocabulary, used only to REPORT suspicious rows, never to rewrite.
const ROLE_WORDS = /\b(editor|photographer|cinematograph|videograph|director|pilot|assistant|producer|designer|operator|drone|story)\b/i;

// Roles as configured in the BTS schema — used only to DETECT reversed credit
// rows, never to rewrite them.
const roleTitles = new Set(
    (await mongoose.connection.db.collection('btsroles').find({}).toArray())
        .map((r) => String(r.title || '').trim().toLowerCase()),
);

const looksLikeRole = (s) => roleTitles.has(s.toLowerCase()) || ROLE_WORDS.test(s);

/**
 * `{ key: person, value: role }` is the convention — VideoDetailsForm writes
 * `{ key: role.key, value: role.title }` and btsRoleSchema is
 * `{ title: role, key: name }`.
 *
 * Some rows were hand-entered the other way round. They are copied VERBATIM and
 * reported, so a human corrects them in the admin. Silently swapping them here
 * would be guessing at whose name is whose.
 */
function toCredits(bts = [], ctx) {
    return bts.filter(Boolean).map((b) => {
        const key = String(b.key ?? '').trim();
        const value = String(b.value ?? '').trim();
        if (key && value && looksLikeRole(key) && !looksLikeRole(value)) {
            stats.reversedCredits += 1;
            anomalies.push(`${ctx}: credit looks reversed — name="${key}" role="${value}"`);
        }
        return { name: key, role: value };
    });
}


// Sanity-check the role vocabulary itself before trusting it.
// btsRoleSchema is `{ title: role, key: person }`. Rows entered the other way
// round poison every credit copied from them, and they also defeat the reversal
// heuristic below — a person's name registered as a `title` reads as a valid
// role. Report them; the fix belongs in /admin/website-setting/bts-schema-manager.
{
    const roleDocs = await mongoose.connection.db.collection('btsroles').find({}).toArray();
    for (const r of roleDocs) {
        const title = String(r.title || '').trim();
        const key = String(r.key || '').trim();
        if (title && key && ROLE_WORDS.test(key) && !ROLE_WORDS.test(title)) {
            anomalies.push(`btsroles: definition looks reversed — title="${title}" (should be the role) key="${key}" (should be the person)`);
        }
    }
}

const filter = ONE ? { _id: ONE } : {};
const clients = await Client.find(filter).lean();

if (VERIFY_ONLY) {
    const subdocIds = new Set();
    for (const c of clients) {
        for (const v of c.videos || []) subdocIds.add(String(v._id));
        for (const p of c.photos || []) subdocIds.add(String(p._id));
    }
    const scope = ONE ? { client: new mongoose.Types.ObjectId(ONE) } : {};
    const items = await PortfolioItem.find(scope, { 'legacy.subdocId': 1, media: 1, render: 1, kind: 1, status: 1, client: 1 }).lean();

    const linked = new Set(items.filter((i) => i.legacy?.subdocId).map((i) => String(i.legacy.subdocId)));
    const missing = [...subdocIds].filter((id) => !linked.has(id));
    const extra = items.filter((i) => i.legacy?.subdocId && !subdocIds.has(String(i.legacy.subdocId)));
    const native = items.filter((i) => !i.legacy?.subdocId);
    const nullMedia = items.filter((i) => !i.media);
    const emptyRender = items.filter((i) => !(i.render?.posterUrl || i.render?.imageUrl || i.render?.sourceUrl));

    console.log(`embedded subdocs            : ${subdocIds.size}`);
    console.log(`portfolio items             : ${items.length}`);
    console.log(`  missing (subdoc, no item) : ${missing.length}${missing.length ? '  ✖ ' + missing.slice(0, 5).join(', ') : ''}`);
    console.log(`  extra (item, subdoc gone) : ${extra.length}`);
    console.log(`  native (wizard-created)   : ${native.length}`);
    console.log(`  no Media linked           : ${nullMedia.length}`);
    console.log(`  empty render (no URL)     : ${emptyRender.length}`);
    console.log(missing.length === 0 ? '✔ every embedded subdoc has its item' : '✖ backfill incomplete');
    await mongoose.disconnect();
    process.exit(missing.length === 0 ? 0 : 1);
}

// heroPriority as it actually renders today comes from WebsiteSetting, which is
// what /api/hero-videos reads; isHeroVideo is authoritative for membership.
const ws = await WebsiteSetting.findOne().select('heroVideos').lean();
const heroByKey = new Map((ws?.heroVideos || []).map((h) => [h.videoKey, h.priority ?? 0]));

const ops = [];

for (const c of clients) {
    const clientNameText = [c.clientName?.Bride, c.clientName?.Groom].filter(Boolean).join(' & ');

    const keys = [];
    for (const v of c.videos || []) {
        if (v.videoMetaData?.key) keys.push(v.videoMetaData.key);
        if (v.thumbnailMetaData?.key) keys.push(v.thumbnailMetaData.key);
    }
    for (const p of c.photos || []) if (p.photoMetaData?.key) keys.push(p.photoMetaData.key);

    const mediaDocs = await Media.find({ 'legacy.s3Key': { $in: keys } }).lean();
    const byKey = new Map(mediaDocs.map((m) => [m.legacy.s3Key, m]));

    for (const v of c.videos || []) {
        const media = byKey.get(v.videoMetaData?.key);
        const poster = byKey.get(v.thumbnailMetaData?.key);
        if (!media) { stats.noMedia += 1; anomalies.push(`client ${c._id}: video key has no Media — ${v.videoMetaData?.key}`); }
        stats.videos += 1;

        const isHero = Boolean(v.isHeroVideo);
        ops.push({
            updateOne: {
                filter: { _id: v._id },
                update: {
                    $setOnInsert: { _id: v._id, kind: 'Video', client: c._id },
                    $set: {
                        media: media?._id ?? null,
                        mediaId: media?.mediaId,
                        poster: poster?._id ?? null,
                        posterMediaId: poster?.mediaId,
                        title: clientNameText,
                        tags: v.tags || [],
                        shootDate: v.videoShootDate,
                        location: v.videoLocation || {},
                        isHero,
                        // Prefer the value that actually drives today's carousel.
                        heroPriority: isHero ? (heroByKey.get(v.videoMetaData?.key) ?? v.heroPriority ?? 0) : 0,
                        generalPriority: v.generalPriority ?? 0,
                        credits: toCredits(v.bts, `client ${c._id} video ${v._id}`),
                        clientNameText,
                        status: 'Published',
                        render: renderFromMedia(media, poster),
                        legacy: {
                            subdocId: v._id, source: 'client.videos',
                            s3Key: v.videoMetaData?.key, thumbnailS3Key: v.thumbnailMetaData?.key,
                        },
                    },
                },
                upsert: true,
            },
        });
    }

    for (const p of c.photos || []) {
        const media = byKey.get(p.photoMetaData?.key);
        if (!media) { stats.noMedia += 1; anomalies.push(`client ${c._id}: photo key has no Media — ${p.photoMetaData?.key}`); }
        stats.photos += 1;

        ops.push({
            updateOne: {
                filter: { _id: p._id },
                update: {
                    $setOnInsert: { _id: p._id, kind: 'Photo', client: c._id },
                    $set: {
                        media: media?._id ?? null,
                        mediaId: media?.mediaId,
                        title: clientNameText,
                        tags: p.tags || [],
                        shootDate: p.photoShootDate,
                        location: p.photoLocation || {},
                        isHero: false,
                        heroPriority: 0,
                        generalPriority: p.generalPriority ?? 0,
                        clientNameText,
                        status: 'Published',
                        render: renderFromMedia(media, null),
                        legacy: { subdocId: p._id, source: 'client.photos', s3Key: p.photoMetaData?.key },
                    },
                },
                upsert: true,
            },
        });
    }
}

console.log(`${DRY ? '[dry-run] ' : ''}${clients.length} client(s) → ${stats.videos} video(s), ${stats.photos} photo(s)`);

// The op builders above describe a full item. Split each one so that editorial
// fields are only ever written on insert, and link fields only on insert or with
// --refresh-links. `$setOnInsert` and `$set` never share a field, as Mongo requires.
const LINK_FIELDS = new Set(['media', 'mediaId', 'poster', 'posterMediaId', 'render', 'legacy']);
for (const op of ops) {
    const u = op.updateOne.update;
    const onInsert = { ...u.$setOnInsert };
    const refresh = {};
    for (const [field, value] of Object.entries(u.$set || {})) {
        if (REFRESH_LINKS && LINK_FIELDS.has(field)) refresh[field] = value;
        else onInsert[field] = value;
    }
    op.updateOne.update = Object.keys(refresh).length
        ? { $setOnInsert: onInsert, $set: refresh }
        : { $setOnInsert: onInsert };
    // Mongoose otherwise adds `$set: { updatedAt }` to every op, so a no-op
    // re-run stamped all items as just edited — corrupting the admin's "last
    // edited" and any publish date later derived from updatedAt.
    op.updateOne.timestamps = false;
}

const existingIds = new Set((await PortfolioItem.find(
    { _id: { $in: ops.map((o) => o.updateOne.filter._id) } }, { _id: 1 },
).lean()).map((d) => String(d._id)));
const toCreate = ops.filter((o) => !existingIds.has(String(o.updateOne.filter._id))).length;
console.log(`${DRY ? '[dry-run] ' : ''}would create ${toCreate}, leave ${existingIds.size} existing item(s) untouched`
    + (REFRESH_LINKS ? ` (links refreshed on ${existingIds.size})` : ''));

if (!DRY && ops.length) {
    const run = await startRun('backfillPortfolioItems');
    try {
        const refreshIds = REFRESH_LINKS ? ops.map((o) => o.updateOne.filter._id).filter((id) => existingIds.has(String(id))) : [];
        const beforeLinks = new Map((await PortfolioItem.find({ _id: { $in: refreshIds } }).lean())
            .map((d) => [String(d._id), linksOf(d)]));

        const res = await PortfolioItem.bulkWrite(ops, { ordered: false });
        stats.upserts = (res.upsertedCount || 0) + (res.modifiedCount || 0);

        // Record from the database, not from the ops, so the fingerprint is
        // exactly what a later rollback will compare against.
        const createdIds = Object.values(res.upsertedIds || {});
        for (const d of await PortfolioItem.find({ _id: { $in: createdIds } }).lean()) {
            await run.record({ op: 'create', docId: d._id, fingerprint: fingerprint(d) });
        }
        for (const d of await PortfolioItem.find({ _id: { $in: refreshIds } }).lean()) {
            const before = beforeLinks.get(String(d._id));
            if (JSON.stringify(before) !== JSON.stringify(linksOf(d))) {
                await run.record({ op: 'refresh', docId: d._id, before, after: linksOf(d) });
            }
        }
        console.log(`created ${res.upsertedCount || 0}, links refreshed ${res.modifiedCount || 0}`);
        await run.finish({ created: res.upsertedCount || 0, refreshed: res.modifiedCount || 0 });
    } catch (error) {
        await run.fail(error);
        throw error;
    }
}

if (anomalies.length) {
    console.log(`\n⚠ ${anomalies.length} anomaly/anomalies (reported, not auto-corrected):`);
    anomalies.slice(0, 20).forEach((a) => console.log('   ' + a));
    if (anomalies.length > 20) console.log(`   …and ${anomalies.length - 20} more`);
}
console.log(`\nmissing Media: ${stats.noMedia} · reversed credits: ${stats.reversedCredits}`);

await mongoose.disconnect();
