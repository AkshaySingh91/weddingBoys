/**
 * Removes the data the site stopped reading at the v2 switch (plan phase 7).
 * Run it only after production has read v2 for a quiet week.
 *
 *   PORTFOLIO_READS=v2 node scripts/contractLegacy.js --switched-on=YYYY-MM-DD [--dump-dir=./backups]
 *       [--dry-run | --apply | --verify | --rollback=<runId>]
 *
 * Removes
 *   Client.videos / Client.photos        the embedded films and photos (PortfolioItem holds them)
 *   WebsiteSettings.heroVideos           the old hero list (the hero is the `home-hero` row)
 *   WebsiteSettings.BtsPhotos            the retired BTS tab (the `home-bts` gallery holds them)
 *   collections tags, ceremonies, sequences   (the tag manager replaced the first two;
 *                                             nothing ever used the third)
 *
 * Keeps, on purpose
 *   item `tags` / `eventGroup` and hero flags   still read by cards and the admin; kept in step by the tag manager and Rows
 *   WebsiteSettings page tag lists              read only by the site's fallbacks when the CMS is unreachable
 *   WebsiteSettings.mapDisplayClient            the wizard still records a pin
 *   old indexes                                 their schema declarations recreate them; they go with the code
 *
 * Refuses unless: this process has PORTFOLIO_READS=v2 (the setting the server runs with);
 * --switched-on is at least 7 days ago; every embedded film/photo has its PortfolioItem;
 * the tag manager exists; the BTS photos were moved (scripts/consolidateHomeSources.js).
 * --apply first writes everything it removes to <dump-dir>/<runId>.json; --rollback
 * puts it back from that file.
 */
import fs from 'node:fs';
import path from 'node:path';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { parseMode, startRun, loadRun, markRolledBack } from './lib/runLog.js';

dotenv.config();
const { mode, runId } = parseMode();
const arg = (name) => (process.argv.find((a) => a.startsWith(`--${name}=`)) || '').slice(name.length + 3) || null;
await mongoose.connect(process.env.MONGO_URI);
const db = mongoose.connection.db;
const { EJSON } = mongoose.mongo.BSON;
console.log(`database "${db.databaseName}" · mode ${mode}`);
const SCRIPT = 'contractLegacy';
const DROP = ['tags', 'ceremonies', 'sequences'];
const done = async (code = 0) => { await mongoose.disconnect(); process.exit(code); };
const exists = async (name) => (await db.listCollections({ name }).toArray()).length > 0;

/* ---------------------------------------------------------------- rollback */
if (mode === 'rollback') {
    let run;
    try { run = await loadRun(SCRIPT, runId); } catch (e) { console.error(e.message); await done(1); }
    const file = run.changes.find((c) => c.op === 'dump')?.file;
    if (!file || !fs.existsSync(file)) { console.error(`dump file not found: ${file}`); await done(1); }
    const dump = EJSON.parse(fs.readFileSync(file, 'utf8'));
    for (const c of dump.clients) await db.collection('clients').updateOne({ _id: c._id }, { $set: { videos: c.videos || [], photos: c.photos || [] } });
    for (const w of dump.websitesettings) {
        const set = {};
        if ('heroVideos' in w) set.heroVideos = w.heroVideos;
        if ('BtsPhotos' in w) set.BtsPhotos = w.BtsPhotos;
        if (Object.keys(set).length) await db.collection('websitesettings').updateOne({ _id: w._id }, { $set: set });
    }
    for (const name of DROP) {
        const docs = dump.collections[name] || [];
        if (docs.length && !(await db.collection(name).countDocuments())) await db.collection(name).insertMany(docs);
    }
    const summary = { clients: dump.clients.length, collections: Object.fromEntries(DROP.map((n) => [n, (dump.collections[n] || []).length])) };
    console.log(`rolled back ${runId}: ${JSON.stringify(summary)}`);
    await markRolledBack(runId, summary);
    await done();
}

/* ---------------------------------------------------------------- what is there */
const clients = await db.collection('clients').find({ $or: [{ videos: { $exists: true } }, { photos: { $exists: true } }] }, { projection: { videos: 1, photos: 1 } }).toArray();
const embedded = clients.flatMap((c) => [...(c.videos || []), ...(c.photos || [])]);
const bridged = new Set((await db.collection('portfolioitems').find({ 'legacy.subdocId': { $in: embedded.map((s) => s._id) } }, { projection: { 'legacy.subdocId': 1 } }).toArray()).map((i) => String(i.legacy.subdocId)));
const orphans = embedded.filter((s) => !bridged.has(String(s._id)));
const ws = await db.collection('websitesettings').find({}, { projection: { heroVideos: 1, BtsPhotos: 1 } }).toArray();
const home = await db.collection('pagecontents').findOne({ pageKey: 'home' });
const btsBlock = (home?.blocks || []).find((b) => b.key === 'home-bts');
const btsWaiting = ws.some((w) => (w.BtsPhotos || []).length) && !(btsBlock?.media || []).length;
const counts = {};
for (const name of DROP) counts[name] = (await exists(name)) ? await db.collection(name).countDocuments() : null;

if (mode === 'verify') {
    const left = [];
    if (embedded.length) left.push(`${clients.length} wedding(s) still hold ${embedded.length} embedded film(s)/photo(s)`);
    if (ws.some((w) => 'heroVideos' in w || 'BtsPhotos' in w)) left.push('WebsiteSettings still has heroVideos / BtsPhotos');
    for (const name of DROP) if (counts[name] !== null) left.push(`collection "${name}" still exists (${counts[name]})`);
    left.forEach((l) => console.log('  · ' + l));
    console.log(left.length ? `${left.length} thing(s) not yet removed` : '✔ the legacy data is gone');
    await done();
}

/* ---------------------------------------------------------------- guards */
const refuse = [];
if (process.env.PORTFOLIO_READS !== 'v2') refuse.push('PORTFOLIO_READS is not "v2" here. Run this with the setting the server runs with, after the switch.');
const switched = arg('switched-on') ? new Date(`${arg('switched-on')}T00:00:00Z`) : null;
if (!switched || Number.isNaN(switched.getTime())) refuse.push('--switched-on=YYYY-MM-DD (the day production switched to v2) is required.');
else if (Date.now() - switched.getTime() < 7 * 86400e3) refuse.push(`the switch was on ${arg('switched-on')}: wait until 7 quiet days have passed.`);
if (orphans.length) refuse.push(`${orphans.length} embedded film(s)/photo(s) have no PortfolioItem: run scripts/backfillPortfolioItems.js --apply and --verify.`);
if (!(await db.collection('taggroups').countDocuments())) refuse.push('the tag manager has no groups: run scripts/migrateTagsToTaxonomy.js first.');
if (btsWaiting) refuse.push('the BTS photos are not in the home "Behind the scenes" gallery yet: run scripts/consolidateHomeSources.js --apply.');

console.log(`  embedded: ${embedded.length} film(s)/photo(s) in ${clients.length} wedding(s), ${embedded.length - orphans.length} with a PortfolioItem`);
console.log(`  WebsiteSettings: heroVideos ${ws.reduce((n, w) => n + (w.heroVideos || []).length, 0)}, BtsPhotos ${ws.reduce((n, w) => n + (w.BtsPhotos || []).length, 0)}`);
for (const name of DROP) console.log(`  collection ${name}: ${counts[name] === null ? 'absent' : `${counts[name]} document(s), dropped`}`);
if (refuse.length) {
    refuse.forEach((r) => console.log('  ✖ ' + r));
    console.log(mode === 'apply' ? 'Refused: nothing written.' : '[dry-run] the run would be refused.');
    await done(mode === 'apply' ? 1 : 0);
}
if (mode === 'dryRun') {
    console.log('[dry-run] nothing written. --apply dumps all of the above first.');
    await done();
}

/* ---------------------------------------------------------------- apply */
const run = await startRun(SCRIPT);
const dumpDir = path.resolve(arg('dump-dir') || './backups');
fs.mkdirSync(dumpDir, { recursive: true });
const dumpFile = path.join(dumpDir, `${run.runId}.json`);
const dump = {
    database: db.databaseName,
    at: new Date(),
    clients: clients.map((c) => ({ _id: c._id, videos: c.videos, photos: c.photos })),
    websitesettings: ws,
    collections: {},
};
for (const name of DROP) dump.collections[name] = counts[name] === null ? [] : await db.collection(name).find().toArray();
fs.writeFileSync(dumpFile, EJSON.stringify(dump, { relaxed: false }));
console.log(`  dump written: ${dumpFile}`);
await run.record({ op: 'dump', file: dumpFile });

try {
    const c = await db.collection('clients').updateMany({ _id: { $in: clients.map((x) => x._id) } }, { $unset: { videos: '', photos: '' } });
    const w = await db.collection('websitesettings').updateMany({}, { $unset: { heroVideos: '', BtsPhotos: '' } });
    for (const name of DROP) if (counts[name] !== null) await db.collection(name).drop();
    await run.record({ op: 'contract', clients: c.modifiedCount, websitesettings: w.modifiedCount });
    await run.finish({ dumpFile, clients: c.modifiedCount, dropped: DROP.filter((n) => counts[n] !== null) });
} catch (error) {
    await run.fail(error);
    console.error(`failed; everything removed so far is in ${dumpFile}`);
    throw error;
}
console.log('Next: node scripts/contractLegacy.js --verify');
await done();
