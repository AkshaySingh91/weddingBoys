/**
 * Normalise Media.status onto the simplified lifecycle.
 *
 * The old enum carried virus-scan-era states that no code path can produce any
 * more: Uploaded, SavedToStorage and Published all mean "servable", which is now
 * a single state — Ready.
 *
 * Run this BEFORE deploying the tightened enum in Models/Media.js. Mongoose only
 * validates on write, so a stale value would not throw on read, but any later
 * save() of that document would fail validation.
 *
 * Idempotent. Safe to re-run.
 *
 *   node scripts/migrateMediaStatus.js [--dry-run]
 */
import dotenv from 'dotenv';
import mongoose from 'mongoose';

dotenv.config();

const DRY = process.argv.includes('--dry-run');
const REMAP = { Uploaded: 'Ready', SavedToStorage: 'Ready', Published: 'Ready' };

const uri = process.env.MONGO_URI;
if (!uri) {
    console.error('✖ MONGO_URI is not set');
    process.exit(1);
}

await mongoose.connect(uri);
const media = mongoose.connection.db.collection('media');

let total = 0;
for (const [from, to] of Object.entries(REMAP)) {
    const n = await media.countDocuments({ status: from });
    if (!n) continue;
    total += n;
    console.log(`${DRY ? '[dry-run] would remap' : 'remapping'} ${n} doc(s): ${from} → ${to}`);
    if (!DRY) await media.updateMany({ status: from }, { $set: { status: to } });
}

// Anything left outside the new enum needs a human decision, not a guess.
const ALLOWED = ['Draft', 'Uploading', 'Processing', 'Ready', 'Archived'];
const strays = await media.distinct('status', { status: { $nin: ALLOWED } });
if (strays.length) {
    console.warn('⚠ unrecognised status values still present:', strays.join(', '));
}

console.log(total ? `✔ ${DRY ? 'would update' : 'updated'} ${total} document(s)` : '✔ nothing to remap');
await mongoose.disconnect();
