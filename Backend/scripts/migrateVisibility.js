/**
 * Fills the publishing-lifecycle fields (plan phase 2) on existing data.
 *
 *   node scripts/migrateVisibility.js [--dry-run | --apply | --verify | --rollback=<runId>]
 *
 *   Client.status        weddings with none get one (scripts/lib/visibilityBaseline.js)
 *   Client.publishedAt   for published weddings
 *   item.clientStatus    copied from its wedding
 *   item.mediaReady      processed and something to show
 *   item.status          Add Wedding uploads in draft weddings → Published intent
 *   item.publishedAt     for items that are public
 *
 * Must run BEFORE `PORTFOLIO_READS=v2` is switched on: the public reads require
 * clientStatus and mediaReady, so without it the v2 site shows nothing.
 *
 * The guarantee, checked in every mode: no item becomes newly public. "Public
 * before" is the old v2 rule (item status Published); anything that would be
 * public after but was not before stops --apply. Items that stop being public
 * are listed — with the old rule those were published items in draft weddings
 * or files still processing, which the old rule showed by mistake.
 */
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { parseMode, startRun, loadRun, markRolledBack } from './lib/runLog.js';
import { baselineClientStatus, baselineMediaReady, baselineItemStatus } from './lib/visibilityBaseline.js';
import { hasRender } from '../Services/portfolioVisibility.js';

dotenv.config();
const { mode, runId } = parseMode();

await mongoose.connect(process.env.MONGO_URI);
const db = mongoose.connection.db;
const clientsCol = db.collection('clients');
const itemsCol = db.collection('portfolioitems');
console.log(`database "${db.databaseName}" · mode ${mode}`);

const ITEM_FIELDS = ['status', 'clientStatus', 'mediaReady', 'publishedAt'];
const CLIENT_FIELDS = ['status', 'publishedAt'];
const pick = (doc, fields) => Object.fromEntries(fields.map((f) => [f, doc?.[f] ?? null]));
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const nameOf = (c) => (c ? [c.clientName?.Bride, c.clientName?.Groom].filter(Boolean).join(' & ') : '(no wedding)');

/* ---------------------------------------------------------------- rollback */
if (mode === 'rollback') {
    let run;
    try { run = await loadRun('migrateVisibility', runId); } catch (e) { console.error(e.message); await mongoose.disconnect(); process.exit(1); }
    let restored = 0;
    const kept = [];
    for (const c of run.changes) {
        const col = c.op === 'client' ? clientsCol : itemsCol;
        const fields = c.op === 'client' ? CLIENT_FIELDS : ITEM_FIELDS;
        const current = await col.findOne({ _id: c.docId });
        if (!current) continue;
        if (!same(pick(current, fields), c.after)) { kept.push(`${c.op} ${c.docId}`); continue; }
        const $set = {};
        const $unset = {};
        for (const f of fields) (c.before[f] === null ? ($unset[f] = '') : ($set[f] = c.before[f]));
        await col.updateOne({ _id: c.docId }, { ...(Object.keys($set).length ? { $set } : {}), ...(Object.keys($unset).length ? { $unset } : {}) });
        restored += 1;
    }
    console.log(`rolled back ${runId}: restored ${restored} document(s)`);
    if (kept.length) console.log(`kept ${kept.length} changed since the run: ${kept.slice(0, 10).join(', ')}`);
    await markRolledBack(runId, { restored, kept: kept.length });
    await mongoose.disconnect();
    process.exit(0);
}

/* ---------------------------------------------------------------- plan */
const [clients, items, media] = await Promise.all([
    clientsCol.find({}, { projection: { clientName: 1, status: 1, publishedAt: 1, createdAt: 1, 'videos._id': 1, 'photos._id': 1 } }).toArray(),
    itemsCol.find({}).toArray(),
    db.collection('media').find({}, { projection: { status: 1 } }).toArray(),
]);
const clientById = new Map(clients.map((c) => [String(c._id), c]));
const mediaStatus = new Map(media.map((m) => [String(m._id), m.status]));

const clientChanges = [];
const targetStatus = new Map();
for (const c of clients) {
    const status = baselineClientStatus(c);
    targetStatus.set(String(c._id), status);
    const after = {
        status,
        publishedAt: c.publishedAt ?? (status === 'Published' ? (c.createdAt || c._id.getTimestamp()) : null),
    };
    const before = pick(c, CLIENT_FIELDS);
    if (!same(before, after)) clientChanges.push({ doc: c, before, after });
}

const itemChanges = [];
const newlyPublic = [];
const noLongerPublic = [];
const archivedKept = [];
for (const i of items) {
    const client = clientById.get(String(i.client));
    const clientStatus = client ? targetStatus.get(String(i.client)) : 'Archived';
    const status = baselineItemStatus(i, clientStatus);
    const mStatus = mediaStatus.get(String(i.media));
    const mediaReady = baselineMediaReady(i, mStatus);
    const isPublic = status === 'Published' && clientStatus === 'Published' && mediaReady;
    const wasPublic = i.status === 'Published';
    const after = {
        status,
        clientStatus,
        mediaReady,
        publishedAt: i.publishedAt ?? (isPublic ? i._id.getTimestamp() : null),
    };
    const line = `${i.kind.padEnd(5)} ${i._id}  ${nameOf(client)}`;
    if (isPublic && !wasPublic) newlyPublic.push(line);
    if (!isPublic && wasPublic) {
        const why = [clientStatus !== 'Published' && `wedding ${clientStatus}`, !mediaReady && `media ${mStatus || 'missing'}${hasRender(i.kind, i.render) ? '' : ', nothing to show'}`].filter(Boolean).join(', ');
        noLongerPublic.push(`${line}  (${why})`);
    }
    if (mediaReady && mStatus === 'Archived') archivedKept.push(line);
    const before = pick(i, ITEM_FIELDS);
    if (!same(before, after)) itemChanges.push({ doc: i, before, after });
}

const statusCounts = {};
for (const c of clients) {
    const k = `${c.status || '(none)'} → ${targetStatus.get(String(c._id))}`;
    statusCounts[k] = (statusCounts[k] || 0) + 1;
}
const intentFlips = itemChanges.filter((c) => c.before.status !== c.after.status);

/* ---------------------------------------------------------------- verify */
if (mode === 'verify') {
    const problems = [];
    for (const c of clients) if (!c.status) problems.push(`wedding ${c._id} has no status`);
    for (const i of items) {
        const c = clientById.get(String(i.client));
        if (i.clientStatus === undefined || i.mediaReady === undefined) problems.push(`item ${i._id} lacks clientStatus/mediaReady`);
        else if (c && i.clientStatus !== c.status) problems.push(`item ${i._id} clientStatus ${i.clientStatus} ≠ wedding ${c.status}`);
        if (i.mediaReady && !hasRender(i.kind, i.render)) problems.push(`item ${i._id} mediaReady with nothing to show`);
    }
    console.log(`${clients.length} wedding(s), ${items.length} item(s), ${items.filter((i) => i.status === 'Published' && i.clientStatus === 'Published' && i.mediaReady).length} public`);
    problems.slice(0, 20).forEach((p) => console.log('  ✖ ' + p));
    console.log(problems.length ? `✖ ${problems.length} problem(s)` : '✔ every wedding has a status; every item carries its wedding\'s status and a readiness flag');
    await mongoose.disconnect();
    process.exit(problems.length ? 1 : 0);
}

/* ---------------------------------------------------------------- report */
const list = (title, rows) => {
    console.log(`${title}: ${rows.length}`);
    rows.slice(0, 25).forEach((r) => console.log('    ' + r));
    if (rows.length > 25) console.log(`    …and ${rows.length - 25} more`);
};
console.log(`weddings: ${Object.entries(statusCounts).map(([k, n]) => `${n} ${k}`).join(', ')}`);
console.log(`would change ${clientChanges.length} wedding(s), ${itemChanges.length} item(s)`);
list('  Add Wedding uploads in draft weddings, Draft → Published intent (still hidden: the wedding is Draft)',
    intentFlips.map((c) => `${c.doc.kind.padEnd(5)} ${c.doc._id}  ${nameOf(clientById.get(String(c.doc.client)))}`));
list('  kept visible although their media record is Archived (files still served)', archivedKept);
list('  NO LONGER PUBLIC under the new rule', noLongerPublic);
list('  NEWLY PUBLIC (must be 0)', newlyPublic);

if (newlyPublic.length) {
    console.error('✖ refusing: the migration would make items public that are not public today.');
    await mongoose.disconnect();
    process.exit(1);
}

if (mode === 'dryRun') {
    console.log('[dry-run] nothing written.');
    await mongoose.disconnect();
    process.exit(0);
}

/* ---------------------------------------------------------------- apply */
const run = await startRun('migrateVisibility');
try {
    for (const { doc, before, after } of clientChanges) {
        await clientsCol.updateOne({ _id: doc._id }, { $set: after });
        await run.record({ op: 'client', docId: doc._id, before, after });
    }
    for (const { doc, before, after } of itemChanges) {
        await itemsCol.updateOne({ _id: doc._id }, { $set: after });
        await run.record({ op: 'item', docId: doc._id, before, after });
    }
    await run.finish({ clients: clientChanges.length, items: itemChanges.length, noLongerPublic: noLongerPublic.length });
} catch (error) {
    await run.fail(error);
    throw error;
}
console.log('Next: node scripts/migrateVisibility.js --verify');
await mongoose.disconnect();
