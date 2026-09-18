/**
 * Migrate legacy S3 media into R2 + the Media collection.
 *
 * The old system stores bare S3 keys inside embedded arrays and signs a fresh
 * URL on every read. This walks every holder of such a key, copies the bytes to
 * R2 under an immutable path, builds the derivative ladder, and records a Media
 * document carrying `legacy.s3Key`.
 *
 * Two deliberate safety properties:
 *
 *   1. It does NOT remove the legacy keys. It writes a nullable `mediaId`
 *      sibling next to each one. Read paths already prefer the migrated asset
 *      and fall back to the S3 signed URL (Utils/mediaUrl.js), so the site keeps
 *      working whether this runs fully, partially, or not at all.
 *   2. It is idempotent — an asset whose `legacy.s3Key` already exists is
 *      skipped, so a re-run after a failure resumes rather than duplicating.
 *
 *   node scripts/migrateS3ToR2.js [--dry-run] [--limit=N] [--only=clients|website|team|reviews|admins]
 */
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { nanoid } from 'nanoid';

dotenv.config();

const { getObjectBuffer } = await import('../Controllers/awsController.js');
const { ingestImage, putObject, buildBaseKey, isR2Configured } = await import('../Services/r2UploadService.js');
const { cdnUrlFor } = await import('../Utils/mediaUrl.js');
const { enqueueJob } = await import('../Services/mediaJobQueue.js');

const Media = (await import('../Models/Media.js')).default;
const Client = (await import('../Models/ClientSchema.js')).default;
const WebsiteSetting = (await import('../Models/WebsiteSettingSchema.js')).default;
const Team = (await import('../Models/TeamSchema.js')).default;
const Review = (await import('../Models/ReviewSchema.js')).default;
const Admin = (await import('../Models/adminSchema.js')).default;

const DRY = process.argv.includes('--dry-run');
const LIMIT = Number((process.argv.find((a) => a.startsWith('--limit=')) || '').split('=')[1]) || Infinity;
const ONLY = (process.argv.find((a) => a.startsWith('--only=')) || '').split('=')[1];

const stats = { scanned: 0, migrated: 0, skipped: 0, failed: 0 };
const isVideoKey = (key) => /\.(mp4|mov|m4v|webm)$/i.test(key);
// Legacy keys encode the mime subtype as the extension, so an SVG lands as
// `.svg+xml`. SVG is already resolution-independent: rasterising it through the
// sharp ladder would lose quality and gain nothing, so it is copied verbatim.
const isSvgKey = (key) => /\.svg(\+xml)?$/i.test(key);

/** Copy one S3 object into R2 and record it. Returns the Media doc (or null). */
async function migrateKey({ s3Key, ownerType, ownerId, slot, label }) {
    stats.scanned += 1;
    if (stats.migrated + stats.skipped >= LIMIT) return null;

    const existing = await Media.findOne({ 'legacy.s3Key': s3Key }).lean();
    if (existing) {
        stats.skipped += 1;
        return existing;
    }
    if (DRY) {
        console.log(`  [dry-run] ${label}: ${s3Key}`);
        stats.migrated += 1;
        return null;
    }

    try {
        const { buffer, contentType } = await getObjectBuffer(s3Key);
        const mediaId = nanoid(12);
        const originalFileName = s3Key.split('/').pop();

        let doc;
        if (isSvgKey(s3Key) || (contentType || '').includes('svg')) {
            const baseKey = buildBaseKey({ ownerType, ownerId, slot, mediaId });
            const key = `${baseKey}/orig.svg`;
            await putObject(key, buffer, 'image/svg+xml');
            const url = cdnUrlFor(key);
            doc = await Media.create({
                mediaId,
                fileName: 'orig.svg',
                originalFileName,
                mimeType: 'image/svg+xml',
                fileSize: buffer.length,
                ownerType, ownerId,
                mediaType: 'Image',
                status: 'Ready',          // vector art needs no derivatives
                provider: 'R2',
                bucket: process.env.R2_BUCKET_NAME,
                storageKey: key,
                publicUrl: url,
                cdnUrl: url,
                legacy: { s3Key },
                uploadedBy: 'migration',
            });
        } else if (isVideoKey(s3Key) || (contentType || '').startsWith('video/')) {
            // Bytes only. Poster/web/loop are produced by the ffmpeg worker,
            // which is enqueued below — this script never shells out to ffmpeg.
            const baseKey = buildBaseKey({ ownerType, ownerId, slot, mediaId });
            const key = `${baseKey}/orig.mp4`;
            await putObject(key, buffer, contentType || 'video/mp4');
            const url = cdnUrlFor(key);
            doc = await Media.create({
                mediaId,
                fileName: 'orig.mp4',
                originalFileName,
                mimeType: contentType || 'video/mp4',
                fileSize: buffer.length,
                ownerType, ownerId,
                mediaType: 'Video',
                status: 'Processing',
                provider: 'R2',
                bucket: process.env.R2_BUCKET_NAME,
                storageKey: key,
                publicUrl: url,
                cdnUrl: url,
                legacy: { s3Key },
                uploadedBy: 'migration',
                video: { sourceUrl: url, renditions: [{ role: 'source', url, storageKey: key, bytes: buffer.length }] },
            });
            await enqueueJob({ mediaId, type: 'transcode', options: { makeLoop: slot === 'hero' } });
        } else {
            const ingested = await ingestImage({
                buffer, originalFileName, ownerType, ownerId, slot, mediaId, uploadedBy: 'migration',
            });
            doc = await Media.create({ ...ingested, mediaId, legacy: { s3Key } });
        }

        stats.migrated += 1;
        console.log(`  ✔ ${label}: ${s3Key} → ${doc.storageKey}`);
        return doc;
    } catch (error) {
        stats.failed += 1;
        console.error(`  ✖ ${label}: ${s3Key} — ${error.message}`);
        return null;
    }
}

async function migrateClients() {
    const clients = await Client.find();
    for (const client of clients) {
        let dirty = false;
        for (const v of client.videos || []) {
            if (v.videoMetaData?.key && !v.mediaId) {
                const m = await migrateKey({
                    s3Key: v.videoMetaData.key, ownerType: 'Client', ownerId: String(client._id),
                    slot: v.isHeroVideo ? 'hero' : undefined, label: 'client video',
                });
                if (m) { v.mediaId = m.mediaId; dirty = true; }
            }
            if (v.thumbnailMetaData?.key && !v.posterMediaId) {
                const m = await migrateKey({
                    s3Key: v.thumbnailMetaData.key, ownerType: 'Client', ownerId: String(client._id),
                    label: 'client video poster',
                });
                if (m) { v.posterMediaId = m.mediaId; dirty = true; }
            }
        }
        for (const p of client.photos || []) {
            if (p.photoMetaData?.key && !p.mediaId) {
                const m = await migrateKey({
                    s3Key: p.photoMetaData.key, ownerType: 'Client', ownerId: String(client._id),
                    label: 'client photo',
                });
                if (m) { p.mediaId = m.mediaId; dirty = true; }
            }
        }
        if (dirty && !DRY) { client.markModified('videos'); client.markModified('photos'); await client.save(); }
    }
}

async function migrateWebsite() {
    const settings = await WebsiteSetting.findOne();
    if (!settings) return;
    let dirty = false;

    for (const bts of settings.BtsPhotos || []) {
        if (bts.photoMetaData?.key && !bts.mediaId) {
            const m = await migrateKey({ s3Key: bts.photoMetaData.key, ownerType: 'Website', slot: 'bts', label: 'bts photo' });
            if (m) { bts.mediaId = m.mediaId; dirty = true; }
        }
    }
    const logo = settings.companyDetails?.companyLogo;
    if (logo?.key && !logo.mediaId) {
        const m = await migrateKey({ s3Key: logo.key, ownerType: 'Brand', label: 'studio logo' });
        if (m) { logo.mediaId = m.mediaId; dirty = true; }
    }
    if (dirty && !DRY) { settings.markModified('BtsPhotos'); settings.markModified('companyDetails'); await settings.save(); }
}

async function migrateTeam() {
    for (const member of await Team.find()) {
        if (member.imageMetaData?.key && !member.imageMetaData.mediaId) {
            const m = await migrateKey({ s3Key: member.imageMetaData.key, ownerType: 'Team', label: 'team image' });
            if (m && !DRY) { member.imageMetaData.mediaId = m.mediaId; member.markModified('imageMetaData'); await member.save(); }
        }
    }
}

async function migrateReviews() {
    for (const review of await Review.find()) {
        if (review.photo?.key && !review.photo.mediaId) {
            const m = await migrateKey({ s3Key: review.photo.key, ownerType: 'Review', label: 'review photo' });
            if (m && !DRY) { review.photo.mediaId = m.mediaId; review.markModified('photo'); await review.save(); }
        }
    }
}

async function migrateAdmins() {
    for (const admin of await Admin.find()) {
        if (admin.avatar?.key && !admin.avatar.mediaId) {
            const m = await migrateKey({ s3Key: admin.avatar.key, ownerType: 'System', label: 'admin avatar' });
            if (m && !DRY) { admin.avatar.mediaId = m.mediaId; admin.markModified('avatar'); await admin.save(); }
        }
    }
}

// ---- run -------------------------------------------------------------------
if (!isR2Configured()) {
    console.error('✖ R2 is not configured — set R2_* and R2_PUBLIC_URL.');
    process.exit(1);
}
await mongoose.connect(process.env.MONGO_URI);
console.log(DRY ? '── DRY RUN — nothing will be written ──' : '── migrating S3 → R2 ──');

const steps = { clients: migrateClients, website: migrateWebsite, team: migrateTeam, reviews: migrateReviews, admins: migrateAdmins };
for (const [name, fn] of Object.entries(steps)) {
    if (ONLY && ONLY !== name) continue;
    console.log(`\n${name}:`);
    await fn();
}

console.log('\n──────────────');
console.log(`scanned ${stats.scanned} · migrated ${stats.migrated} · skipped ${stats.skipped} · failed ${stats.failed}`);
if (!DRY && stats.migrated) console.log('Run the worker (npm run worker) to build video renditions.');
await mongoose.disconnect();
