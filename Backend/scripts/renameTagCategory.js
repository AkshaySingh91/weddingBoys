/**
 * Rename a tag category (Tags.tagType).
 *
 *   node scripts/renameTagCategory.js --from=Caste --to=Tradition --dry-run
 *   node scripts/renameTagCategory.js --from=Caste --to=Tradition
 *
 * Safe without a cascade: portfolio items store the tag strings themselves
 * (Hindu, Sikh, Parsi…), never the category name, so the rename touches exactly
 * one document. The category name is what /allfilms shows as a filter label.
 *
 * Written for "Caste", which held religions rather than castes — an inaccurate
 * and poorly-read label on a public filter. Idempotent: re-running after the
 * rename reports that there is nothing to do.
 */
import dotenv from 'dotenv';
import mongoose from 'mongoose';

dotenv.config();

const arg = (n) => (process.argv.find((a) => a.startsWith(`--${n}=`)) || '').slice(n.length + 3);
const FROM = arg('from').trim();
const TO = arg('to').trim();
const DRY = process.argv.includes('--dry-run');

if (!FROM || !TO) {
    console.error('usage: node scripts/renameTagCategory.js --from=<name> --to=<name> [--dry-run]');
    process.exit(2);
}

await mongoose.connect(process.env.MONGO_URI);
const tags = mongoose.connection.db.collection('tags');
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

try {
    console.log(`${DRY ? '[dry-run] ' : ''}database "${mongoose.connection.db.databaseName}": "${FROM}" -> "${TO}"`);
    const source = await tags.findOne({ tagType: new RegExp(`^${esc(FROM)}$`, 'i') });
    const target = await tags.findOne({ tagType: new RegExp(`^${esc(TO)}$`, 'i') });

    if (!source && target) { console.log(`nothing to do: "${target.tagType}" already exists and "${FROM}" does not.`); }
    else if (!source) { console.error(`no category named "${FROM}".`); process.exitCode = 1; }
    else if (target) { console.error(`refusing: a category named "${target.tagType}" already exists; merge is a phase 3 operation.`); process.exitCode = 1; }
    else {
        console.log(`  "${source.tagType}" holds ${source.tags.length} tag(s): ${source.tags.join(', ')}`);
        if (DRY) console.log('[dry-run] nothing written.');
        else {
            const r = await tags.updateOne({ _id: source._id }, { $set: { tagType: TO } });
            console.log(`renamed (${r.modifiedCount} document).`);
        }
    }
} finally {
    await mongoose.disconnect();
}
