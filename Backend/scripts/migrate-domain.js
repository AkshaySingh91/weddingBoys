/**
 * One-time rebrand migration: rewrite stored URLs from the old domain to the new.
 *
 *   media.theweddingboys.in  ->  media.theweddingvachan.com
 *   theweddingboys.in        ->  theweddingvachan.com   (www., admin., bare)
 *
 * Media documents store their full public URL (`cdnUrl`, `publicUrl`), and blog
 * bodies, CMS blocks and settings embed URLs too, so changing R2_PUBLIC_URL only
 * fixes new uploads. This walks every string in every document of every
 * collection and rewrites the old host wherever it appears.
 *
 *   node scripts/migrate-domain.js            # dry run: reports, writes nothing
 *   node scripts/migrate-domain.js --apply    # performs the writes
 *
 * Reversible: swap FROM and TO and run again with --apply.
 */
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config({ path: path.join(path.dirname(fileURLToPath(import.meta.url)), '../.env') });

const APPLY = process.argv.includes('--apply');
const FROM = /theweddingboys\.in/g;
const TO = 'theweddingvachan.com';

/** Returns [newValue, changedPaths] without mutating the input. */
function rewrite(value, at, changed) {
    if (typeof value === 'string') {
        if (!value.includes('theweddingboys.in')) return value;
        changed.push(at);
        return value.replace(FROM, TO);
    }
    if (Array.isArray(value)) return value.map((v, i) => rewrite(v, `${at}.${i}`, changed));
    if (value && typeof value === 'object' && value.constructor === Object) {
        const out = {};
        for (const [k, v] of Object.entries(value)) out[k] = rewrite(v, at ? `${at}.${k}` : k, changed);
        return out;
    }
    return value; // ObjectId, Date, Buffer, numbers…
}

await mongoose.connect(process.env.MONGO_URI);
const db = mongoose.connection.db;
console.log(`${APPLY ? 'APPLYING' : 'DRY RUN'} on database "${db.databaseName}"\n`);

let totalDocs = 0;
let totalFields = 0;
for (const { name } of await db.listCollections({}, { nameOnly: true }).toArray()) {
    if (name.startsWith('system.')) continue;
    const col = db.collection(name);
    const fieldCounts = {};
    let docs = 0;
    const ops = [];
    for await (const doc of col.find({})) {
        const changed = [];
        const { _id, ...rest } = doc;
        const updated = rewrite(rest, '', changed);
        if (!changed.length) continue;
        docs += 1;
        for (const p of changed) {
            const field = p.replace(/\.\d+(?=\.|$)/g, '.[]');
            fieldCounts[field] = (fieldCounts[field] || 0) + 1;
        }
        const $set = {};
        for (const top of new Set(changed.map((p) => p.split('.')[0]))) $set[top] = updated[top];
        ops.push({ updateOne: { filter: { _id }, update: { $set } } });
    }
    if (!docs) continue;
    totalDocs += docs;
    totalFields += Object.values(fieldCounts).reduce((a, b) => a + b, 0);
    console.log(`${name}: ${docs} document(s)`);
    for (const [f, n] of Object.entries(fieldCounts)) console.log(`    ${f}: ${n}`);
    if (APPLY && ops.length) {
        const res = await col.bulkWrite(ops, { ordered: false });
        console.log(`    -> modified ${res.modifiedCount}`);
    }
}

console.log(`\n${totalDocs} document(s), ${totalFields} value(s) ${APPLY ? 'rewritten' : 'would be rewritten'}.`);
await mongoose.disconnect();
