/**
 * Repair Media.ownerType / ownerId for assets migrated off S3.
 *
 * `ingestImage()` did not return `ownerType`/`ownerId`, and the S3→R2 migration
 * spread its result straight into `Media.create`. Ownership therefore fell back
 * to the schema default and every migrated IMAGE was filed as `System` with a
 * null owner — 44 of them. Videos and the SVG logo were unaffected because those
 * branches passed ownership explicitly.
 *
 * Ownership is re-derived from the holder that actually references the asset, so
 * genuinely System-owned library uploads are never touched: an asset is only
 * reassigned if some Client / Team / Review / WebsiteSetting document points at
 * its `legacy.s3Key`.
 *
 * Idempotent. Safe to re-run.
 *
 *   node scripts/backfillMediaOwners.js [--dry-run]
 */
import dotenv from 'dotenv';
import mongoose from 'mongoose';

dotenv.config();

const DRY = process.argv.includes('--dry-run');

const Media = (await import('../Models/Media.js')).default;
const Client = (await import('../Models/ClientSchema.js')).default;
const WebsiteSetting = (await import('../Models/WebsiteSettingSchema.js')).default;
const Team = (await import('../Models/TeamSchema.js')).default;
const Review = (await import('../Models/ReviewSchema.js')).default;
const Admin = (await import('../Models/adminSchema.js')).default;

await mongoose.connect(process.env.MONGO_URI);

// s3Key -> { ownerType, ownerId }
const owners = new Map();
const claim = (key, ownerType, ownerId = null) => {
    if (key && !owners.has(key)) owners.set(key, { ownerType, ownerId });
};

for (const c of await Client.find().lean()) {
    for (const v of c.videos || []) {
        claim(v.videoMetaData?.key, 'Client', String(c._id));
        claim(v.thumbnailMetaData?.key, 'Client', String(c._id));
    }
    for (const p of c.photos || []) claim(p.photoMetaData?.key, 'Client', String(c._id));
}
for (const t of await Team.find().lean()) claim(t.imageMetaData?.key, 'Team', String(t._id));
for (const r of await Review.find().lean()) claim(r.photo?.key, 'Review', String(r._id));
for (const a of await Admin.find().lean()) claim(a.avatar?.key, 'System', String(a._id));

const ws = await WebsiteSetting.findOne().lean();
for (const b of ws?.BtsPhotos || []) claim(b.photoMetaData?.key, 'Website', null);
claim(ws?.companyDetails?.companyLogo?.key, 'Brand', null);

console.log(`${DRY ? '[dry-run] ' : ''}resolved ${owners.size} owned key(s) from holders`);

const media = await Media.find({ 'legacy.s3Key': { $in: [...owners.keys()] } })
    .select('mediaId ownerType ownerId legacy.s3Key').lean();

let fixed = 0;
let already = 0;
const byType = {};

for (const m of media) {
    const want = owners.get(m.legacy.s3Key);
    if (!want) continue;
    if (m.ownerType === want.ownerType && String(m.ownerId ?? '') === String(want.ownerId ?? '')) {
        already += 1;
        continue;
    }
    byType[`${m.ownerType} → ${want.ownerType}`] = (byType[`${m.ownerType} → ${want.ownerType}`] || 0) + 1;
    if (!DRY) {
        await Media.updateOne({ _id: m._id }, { $set: { ownerType: want.ownerType, ownerId: want.ownerId } });
    }
    fixed += 1;
}

console.log(DRY ? '[dry-run] would reassign:' : 'reassigned:');
for (const [k, n] of Object.entries(byType)) console.log(`  ${k}: ${n}`);
console.log(`${fixed} changed, ${already} already correct, ${media.length} matched`);

const orphans = [...owners.keys()].filter((k) => !media.some((m) => m.legacy.s3Key === k));
if (orphans.length) console.warn(`⚠ ${orphans.length} referenced key(s) have no Media doc (never migrated)`);

await mongoose.disconnect();
