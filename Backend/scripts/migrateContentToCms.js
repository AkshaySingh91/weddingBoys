/**
 * One-time migration: pull existing website content (BTS photos, reviews, team
 * members, hero videos) into the polymorphic Media collection, then assemble a
 * `home` PageContent document of media-backed blocks that references them.
 *
 *   node scripts/migrateContentToCms.js            # migrate
 *   node scripts/migrateContentToCms.js --dry-run  # report only, write nothing
 *   node scripts/migrateContentToCms.js --force    # rebuild even if 'home' exists
 *
 * Idempotent: an S3 key already present in Media is reused rather than duplicated,
 * and the 'home' page is only (re)built with --force.
 */
import 'dotenv/config';
import mongoose from 'mongoose';
import Media from '../Models/Media.js';
import PageContent from '../Models/PageContent.js';
import WebsiteSettings from '../Models/WebsiteSettingSchema.js';
import ClientReview from '../Models/ReviewSchema.js';
import TeamSchema from '../Models/TeamSchema.js';
import ClientSchema from '../Models/ClientSchema.js';

const DRY = process.argv.includes('--dry-run');
const FORCE = process.argv.includes('--force');

const bucket = process.env.S3_BUCKET_NAME;
const region = process.env.AWS_REGION;
const publicUrl = (key) => `https://${bucket}.s3.${region}.amazonaws.com/${key}`;

let created = 0;
let reused = 0;

// Find-or-create a Media record for an existing S3 key.
async function ensureMedia(key, { ownerType, mediaType = 'Image', title, altText, meta = {} }) {
    if (!key) return null;
    const existing = await Media.findOne({ storageKey: key });
    if (existing) { reused += 1; return existing._id; }

    if (DRY) { created += 1; return `(new:${key})`; }

    const fileName = key.split('/').pop();
    const doc = await Media.create({
        fileName,
        originalFileName: fileName,
        mediaType,
        ownerType,
        status: 'Ready',
        provider: 'S3',
        bucket,
        storageKey: key,
        publicUrl: publicUrl(key),
        title,
        altText: altText || title,
        ...meta,
    });
    created += 1;
    return doc._id;
}

async function buildBtsBlock() {
    const settings = await WebsiteSettings.findOne().select('BtsPhotos').lean();
    const photos = settings?.BtsPhotos || [];
    const media = [];
    for (const p of photos) {
        const key = p?.photoMetaData?.key;
        const id = await ensureMedia(key, { ownerType: 'Website', title: 'Behind the scenes' });
        if (id) media.push(id);
    }
    if (!media.length) return null;
    return {
        key: 'home-bts',
        type: 'mediaGallery',
        title: 'Behind Every Beautiful Shot is a Dedicated Team',
        media,
        settings: { layout: 'strip' },
    };
}

async function buildReviewsBlock() {
    const reviews = await ClientReview.find().lean();
    const items = [];
    for (const r of reviews) {
        const id = await ensureMedia(r?.photo?.key, {
            ownerType: 'Review', title: r?.person?.name, altText: `${r?.person?.name} review photo`,
        });
        items.push({
            title: r?.person?.name,
            subtitle: r?.person?.gender,
            body: r.reviewText,
            media: id ? [id] : [],
            meta: { legacyReviewId: String(r._id) },
        });
    }
    if (!items.length) return null;
    return { key: 'home-reviews', type: 'reviews', title: 'Love Notes from Our Couples', items };
}

async function buildTeamBlock() {
    const members = await TeamSchema.find().lean();
    const items = [];
    for (const m of members) {
        const key = m?.imageMetaData?.key;
        const about = m?.about || {};
        const id = await ensureMedia(key, {
            ownerType: 'Team', title: about?.name || 'Team member', altText: about?.name,
        });
        items.push({
            title: about?.name || '',
            subtitle: about?.role || about?.designation || '',
            body: about?.bio || about?.description || '',
            media: id ? [id] : [],
            meta: { isHero: !!m.isHero, legacyTeamId: String(m._id) },
        });
    }
    if (!items.length) return null;
    return { key: 'home-team', type: 'team', title: 'Meet the Team', items };
}

async function buildHeroBlock() {
    const settings = await WebsiteSettings.findOne().select('heroVideos').lean();
    const heroVideos = (settings?.heroVideos || []).sort((a, b) => (b.priority || 0) - (a.priority || 0));
    const items = [];
    for (const hv of heroVideos) {
        const id = await ensureMedia(hv.videoKey, {
            ownerType: 'Website', mediaType: 'Video', title: 'Hero film',
        });
        // Preserve the client link so the film page URL still resolves.
        let videoId = null; let clientName = null;
        if (hv.clientId) {
            const client = await ClientSchema.findById(hv.clientId).select('clientName videos').lean();
            clientName = client?.clientName;
            const match = client?.videos?.find((v) => v?.videoMetaData?.key === hv.videoKey);
            videoId = match ? String(match._id) : null;
        }
        items.push({
            title: clientName ? `${clientName.Bride} & ${clientName.Groom}` : '',
            media: id ? [id] : [],
            link: videoId ? `/films/${videoId}` : '',
            meta: { priority: hv.priority || 0, clientId: hv.clientId ? String(hv.clientId) : null, videoId },
        });
    }
    if (!items.length) return null;
    return { key: 'home-hero', type: 'heroVideo', title: 'Turning Moments into Memories', items };
}

async function main() {
    const uri = process.env.MONGO_URI || process.env.MONGODB_URI || process.env.DB_URL;
    if (!uri) { console.error('✖ No Mongo connection string (MONGO_URI)'); process.exit(1); }
    await mongoose.connect(uri);
    console.log(`✓ Connected${DRY ? ' (dry-run)' : ''}`);

    const existing = await PageContent.findOne({ pageKey: 'home' });
    if (existing && !FORCE) {
        console.log("· 'home' PageContent already exists — pass --force to rebuild. Exiting.");
        await mongoose.disconnect();
        process.exit(0);
    }

    const blocks = [];
    for (const build of [buildHeroBlock, buildBtsBlock, buildTeamBlock, buildReviewsBlock]) {
        // eslint-disable-next-line no-await-in-loop
        const block = await build();
        if (block) blocks.push(block);
    }
    blocks.forEach((b, i) => { b.order = i; b.visible = true; });

    console.log(`\nBlocks assembled: ${blocks.map((b) => `${b.type}(${b.media?.length || b.items?.length || 0})`).join(', ')}`);
    console.log(`Media records — created: ${created}, reused: ${reused}`);

    if (DRY) {
        console.log('\nDry run — nothing written.');
    } else {
        await PageContent.findOneAndUpdate(
            { pageKey: 'home' },
            { $set: { pageKey: 'home', title: 'Home', status: 'Published', blocks } },
            { upsert: true, new: true },
        );
        console.log("\n✓ 'home' PageContent written.");
    }

    await mongoose.disconnect();
    process.exit(0);
}

main().catch(async (err) => {
    console.error('✖ Migration failed:', err.message);
    try { await mongoose.disconnect(); } catch { /* already closed */ }
    process.exit(1);
});
