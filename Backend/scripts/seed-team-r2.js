/**
 * Replace the team on the site with the new brand's crew, served from R2.
 *
 *   - backs up every current Team record (masthead + people) to a JSON file
 *   - uploads the new group photo as the only masthead image
 *   - uploads each portrait (founders, MD, crew) through ingestImage — the same
 *     path the admin uploader uses: EXIF-stripped master + webp ladder + blur
 *   - removes the old masthead images and old team records from the admin
 *     (their Media is marked Archived; R2 bytes are kept, so nothing is lost)
 *
 * Re-running is safe: people already uploaded (same name, tier) are skipped,
 * and only records NOT created by this script are removed.
 *
 *   node scripts/seed-team-r2.js --group <group.png> --backup <dir>            # dry run
 *   node scripts/seed-team-r2.js --group <group.png> --backup <dir> --apply
 */
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(here, '../.env') });
const arg = (k) => (process.argv.includes(k) ? process.argv[process.argv.indexOf(k) + 1] : null);
const APPLY = process.argv.includes('--apply');
const GROUP = arg('--group');
const BACKUP = arg('--backup');
if (!GROUP || !BACKUP) throw new Error('--group <file> and --backup <dir> are required');

const ASSETS = path.join(here, '../../Next-Frontend/Asset/Team');
const SOURCE = 'seed-team-r2';

// The crew as the site shows it (mirrors Next-Frontend/lib/team.js).
// `placeholder`: the studio supplied the photo without a name — stand-in name.
const PEOPLE = [
    { name: 'Aman Singh', designation: 'Founder', tier: 'founder', file: 'aman-singh.jpg' },
    { name: 'Suraj Singh', designation: 'Founder', tier: 'founder', file: 'suraj-singh.jpg' },
    { name: 'Abhay Singh', designation: 'Managing Director', tier: 'md', file: 'abhay.jpg', line: 'Runs the studio day to day, so the founders can stay behind the camera.' },
    { name: 'Swapnil', designation: 'Candid Photographer', tier: 'crew', file: 'swapnil-hatkar.jpg' },
    { name: 'Aman Rai', designation: 'Cinematographer', tier: 'crew', file: 'crew-aman-rai.jpg' },
    { name: 'Anand Yadav', designation: 'Traditional Photographer', tier: 'crew', file: 'crew-anand-yadav.jpg' },
    { name: 'Karan', designation: 'Cinematic Editor', tier: 'crew', file: 'crew-karan.jpg' },
    { name: 'Rohit Patil', designation: 'Cinematographer', tier: 'crew', file: 'crew-rohit.jpg', placeholder: true },
    { name: 'Vikram Shinde', designation: 'Photographer', tier: 'crew', file: 'crew-vikram.jpg', placeholder: true },
    { name: 'Nikhil Jadhav', designation: 'Film Editor', tier: 'crew', file: 'crew-nikhil.jpg', placeholder: true },
    { name: 'Deepak', designation: 'Drone Pilot', tier: 'crew', file: 'crew-pranav.jpg', placeholder: true },
    { name: 'Swapnil Hatkar', designation: 'Camera Assistant', tier: 'crew', file: 'swapnil.jpg' },
];

const { default: Team } = await import('../Models/TeamSchema.js');
const { default: Media } = await import('../Models/Media.js');
const { ingestImage } = await import('../Services/r2UploadService.js');
const { nanoid } = await import('nanoid');

await mongoose.connect(process.env.MONGO_URI);

const all = await Team.find().lean();
const ours = all.filter((t) => t.imageMetaData?.source === SOURCE);
const old = all.filter((t) => t.imageMetaData?.source !== SOURCE);
console.log(`Current: ${all.length} records (${old.length} old, ${ours.length} from this script)`);
for (const t of old) console.log(`  remove  ${t.isHero ? 'masthead' : 'person  '} ${t._id} ${t.about?.name || ''}`);

const has = (p) => ours.some((t) => !t.isHero && t.about?.name === p.name && t.about?.tier === p.tier);
const hasGroup = ours.some((t) => t.isHero);
console.log(`  add     masthead group photo${hasGroup ? ' (already there — skip)' : ''}`);
for (const [i, p] of PEOPLE.entries()) console.log(`  add     #${i + 1} ${p.tier.padEnd(7)} ${p.name} — ${p.designation}${has(p) ? ' (already there — skip)' : ''}`);

if (!APPLY) {
    console.log('\nDry run. Re-run with --apply.');
    await mongoose.disconnect();
    process.exit(0);
}

await fs.mkdir(BACKUP, { recursive: true });
const backupFile = path.join(BACKUP, `team-backup-${Date.now()}.json`);
await fs.writeFile(backupFile, JSON.stringify(all, null, 2));
console.log(`Backed up ${all.length} records → ${backupFile}`);

async function upload(file, originalFileName) {
    const mediaId = nanoid(12);
    const ingested = await ingestImage({ buffer: await fs.readFile(file), originalFileName, ownerType: 'Team', mediaId });
    const media = await Media.create({ ...ingested, mediaId, visibility: 'Public' });
    return media;
}

if (!hasGroup) {
    const m = await upload(GROUP, 'the-wedding-vachan-crew.png');
    await Team.create({ isHero: true, about: { caption: 'The Wedding Vachan crew' }, imageMetaData: { mediaId: m.mediaId, source: SOURCE } });
    console.log(`  masthead → ${m.cdnUrl}`);
}
for (const [i, p] of PEOPLE.entries()) {
    if (has(p)) continue;
    const m = await upload(path.join(ASSETS, p.file), p.file);
    await Team.create({
        isHero: false,
        about: { name: p.name, designation: p.designation, tier: p.tier, order: i + 1, ...(p.line ? { line: p.line } : {}), ...(p.placeholder ? { placeholder: true } : {}) },
        imageMetaData: { mediaId: m.mediaId, source: SOURCE },
    });
    console.log(`  ${p.name} → ${m.cdnUrl}`);
}

const oldMediaIds = old.map((t) => t.imageMetaData?.mediaId).filter(Boolean);
if (oldMediaIds.length) await Media.updateMany({ mediaId: { $in: oldMediaIds } }, { $set: { status: 'Archived' } });
const removed = await Team.deleteMany({ _id: { $in: old.map((t) => t._id) } });
console.log(`Removed ${removed.deletedCount} old records; archived ${oldMediaIds.length} media (bytes kept in R2).`);
await mongoose.disconnect();
