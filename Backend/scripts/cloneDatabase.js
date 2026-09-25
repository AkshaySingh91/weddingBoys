/**
 * Clone one MongoDB database into another on the same cluster.
 *
 * Used to give development its own database (it had been pointing at
 * production) and, later, to make throwaway copies for rehearsing migrations.
 * Every migration in the admin-control plan is rehearsed on a copy made by this
 * script before it is run against production.
 *
 *   node scripts/cloneDatabase.js --from=test --to=weddingboys_dev --dry-run
 *   node scripts/cloneDatabase.js --from=test --to=weddingboys_dev
 *   node scripts/cloneDatabase.js --from=test --to=rehearsal_1 --replace
 *
 * Reads the cluster from MONGO_URI but always names both databases explicitly —
 * the URI's default database is never used, so the direction cannot be inferred
 * wrongly from whatever `.env` currently points at.
 *
 * Safety:
 *   - refuses --from === --to;
 *   - refuses a target that already holds documents unless --replace;
 *   - skips work queues by default (mediajobs, uploadsessions): copying them would
 *     let a worker attached to the copy pick up production's pending jobs and
 *     re-process production files. Override with --skip= (empty to copy all).
 *   - --verify compares per-collection document counts afterwards.
 */
import dotenv from 'dotenv';
import { MongoClient } from 'mongodb';

dotenv.config();

const arg = (name) => {
    const hit = process.argv.find((a) => a.startsWith(`--${name}=`));
    return hit ? hit.slice(name.length + 3) : undefined;
};
const flag = (name) => process.argv.includes(`--${name}`);

const FROM = arg('from');
const TO = arg('to');
const DRY = flag('dry-run');
const REPLACE = flag('replace');
const SKIP = new Set((arg('skip') ?? 'mediajobs,uploadsessions').split(',').map((s) => s.trim()).filter(Boolean));
const BATCH = 500;

if (!FROM || !TO) {
    console.error('usage: node scripts/cloneDatabase.js --from=<db> --to=<db> [--dry-run] [--replace] [--skip=a,b]');
    process.exit(2);
}
if (FROM === TO) {
    console.error(`refusing: --from and --to are both "${FROM}"`);
    process.exit(2);
}

const client = new MongoClient(process.env.MONGO_URI);
await client.connect();

try {
    const src = client.db(FROM);
    const dst = client.db(TO);

    const srcCols = (await src.listCollections({}, { nameOnly: true }).toArray())
        .map((c) => c.name)
        .filter((n) => !n.startsWith('system.'))
        .sort();

    if (!srcCols.length) {
        console.error(`refusing: source database "${FROM}" has no collections — wrong name?`);
        process.exit(2);
    }

    const dstCols = (await dst.listCollections({}, { nameOnly: true }).toArray()).map((c) => c.name);
    let dstDocs = 0;
    for (const n of dstCols) dstDocs += await dst.collection(n).estimatedDocumentCount();
    if (dstDocs > 0 && !REPLACE) {
        console.error(`refusing: target "${TO}" already holds ${dstDocs} document(s). Pass --replace to overwrite it.`);
        process.exit(2);
    }

    console.log(`${DRY ? '[dry-run] ' : ''}clone "${FROM}" -> "${TO}"  (skipping: ${[...SKIP].join(', ') || 'nothing'})`);

    const plan = [];
    for (const name of srcCols) {
        const count = await src.collection(name).countDocuments();
        plan.push({ name, count, skip: SKIP.has(name) });
        console.log(`  ${SKIP.has(name) ? 'skip ' : 'copy '} ${name.padEnd(22)} ${count}`);
    }

    if (DRY) {
        console.log('[dry-run] nothing written.');
    } else {
        if (REPLACE) {
            for (const n of dstCols) await dst.collection(n).drop().catch(() => {});
        }
        for (const { name, skip } of plan) {
            if (skip) continue;
            const out = dst.collection(name);
            let buf = [];
            for await (const doc of src.collection(name).find({})) {
                buf.push(doc);
                if (buf.length >= BATCH) { await out.insertMany(buf, { ordered: false }); buf = []; }
            }
            if (buf.length) await out.insertMany(buf, { ordered: false });

            // Recreate indexes after the data so unique indexes build once.
            const indexes = (await src.collection(name).indexes()).filter((ix) => ix.name !== '_id_');
            for (const ix of indexes) {
                const { key, v, ns, ...options } = ix;
                await out.createIndex(key, options).catch((e) => console.warn(`  ! index ${name}.${ix.name}: ${e.message}`));
            }
            if (!(await dst.listCollections({ name }).toArray()).length) await dst.createCollection(name);
        }

        // Verify.
        let ok = true;
        for (const { name, count, skip } of plan) {
            if (skip) continue;
            const got = await dst.collection(name).countDocuments();
            if (got !== count) { ok = false; console.error(`  MISMATCH ${name}: source ${count}, copy ${got}`); }
        }
        console.log(ok ? `verified: every copied collection matches "${FROM}".` : 'VERIFY FAILED');
        if (!ok) process.exitCode = 1;
    }
} finally {
    await client.close();
}
