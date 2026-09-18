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
 *   node scripts/backfillPortfolioItems.js [--dry-run] [--verify] [--client=<id>]
 */
import dotenv from 'dotenv';
import mongoose from 'mongoose';

dotenv.config();

const DRY = process.argv.includes('--dry-run');
const VERIFY_ONLY = process.argv.includes('--verify');
const ONE = (process.argv.find((a) => a.startsWith('--client=')) || '').split('=')[1];

const PortfolioItem = (await import('../Models/PortfolioItem.js')).default;
const Client = (await import('../Models/ClientSchema.js')).default;
const Media = (await import('../Models/Media.js')).default;
const WebsiteSetting = (await import('../Models/WebsiteSettingSchema.js')).default;

await mongoose.connect(process.env.MONGO_URI);

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

function renderFromMedia(media, poster) {
    if (!media) return {};
    const posterUrl = poster?.cdnUrl || poster?.publicUrl || media.video?.posterUrl;
    return {
        posterUrl,
        blurDataURL: media.blurDataURL,
        dominantColor: media.dominantColor,
        aspectRatio: media.aspectRatio,
        width: media.width,
        height: media.height,
        ...(media.mediaType === 'Image' ? { imageUrl: media.cdnUrl || media.publicUrl } : {}),
        ...(media.mediaType === 'Video' ? {
            loopUrl: media.video?.loopUrl,
            webUrl: media.video?.webUrl,
            sourceUrl: media.video?.sourceUrl || media.cdnUrl,
            durationSec: media.duration,
        } : {}),
        syncedAt: new Date(),
    };
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
    let embedded = 0;
    for (const c of clients) embedded += (c.videos || []).length + (c.photos || []).length;
    const items = await PortfolioItem.countDocuments(ONE ? { client: ONE } : {});
    console.log(`embedded subdocs: ${embedded}`);
    console.log(`portfolio items : ${items}`);
    console.log(embedded === items ? '✔ counts reconcile' : `✖ drift of ${Math.abs(embedded - items)}`);
    const orphan = await PortfolioItem.countDocuments({ media: null });
    if (orphan) console.warn(`⚠ ${orphan} item(s) have no Media doc (asset never migrated)`);
    await mongoose.disconnect();
    process.exit(0);
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

if (!DRY && ops.length) {
    const res = await PortfolioItem.bulkWrite(ops, { ordered: false });
    stats.upserts = (res.upsertedCount || 0) + (res.modifiedCount || 0);
    console.log(`upserted ${res.upsertedCount || 0}, updated ${res.modifiedCount || 0}`);
}

if (anomalies.length) {
    console.log(`\n⚠ ${anomalies.length} anomaly/anomalies (reported, not auto-corrected):`);
    anomalies.slice(0, 20).forEach((a) => console.log('   ' + a));
    if (anomalies.length > 20) console.log(`   …and ${anomalies.length - 20} more`);
}
console.log(`\nmissing Media: ${stats.noMedia} · reversed credits: ${stats.reversedCredits}`);

await mongoose.disconnect();
