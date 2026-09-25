/**
 * Builds the tag system (plan phase 3) from today's loose strings.
 *
 *   node scripts/migrateTagsToTaxonomy.js [--dry-run | --apply | --verify | --rollback=<runId>]
 *
 * Choices live in scripts/tag-migration-map.json (typo merges, where each old
 * ceremony/film value goes, the film types). Edit it and re-run --dry-run.
 *
 * Groups created:
 *   one per `Tags` category, same name and order (multi, films and photos)
 *   Ceremony   from the `Ceremony` collection (single: one per item)
 *   Film type  from the map (single, films only)
 *   Unsorted   hidden; every string that matches nothing lands here, so no tag
 *              an item carries is ever dropped
 *
 * Items: `tags` strings → tag ids in their category; `eventGroup` → a Ceremony
 * or Film type tag. The label copies (`tags`, `eventGroup`) are rewritten from
 * the ids, so a merged typo ("Cassic") reads as its tag ("Classic").
 *
 * Only the new collections and PortfolioItem change. The embedded Client arrays
 * that production still reads are not touched, so this is invisible to visitors
 * until the portfolio cut-over; the old `Tags` and `Ceremony` collections stay
 * as they are (dropped in phase 7).
 */
import dotenv from 'dotenv';
import fs from 'node:fs';
import mongoose from 'mongoose';
import { parseMode, startRun, loadRun, markRolledBack } from './lib/runLog.js';
import { normaliseLabel, slugify, mirrorsFor, SYSTEM_GROUPS } from '../Services/taxonomy.js';

dotenv.config();
const { mode, runId } = parseMode();
const MAP = JSON.parse(fs.readFileSync(new URL('./tag-migration-map.json', import.meta.url), 'utf8'));

await mongoose.connect(process.env.MONGO_URI);
const db = mongoose.connection.db;
const TagGroup = (await import('../Models/TagGroup.js')).default;
const Tag = (await import('../Models/Tag.js')).default;
const itemsCol = db.collection('portfolioitems');
const groupsCol = TagGroup.collection;   // taggroups
const newTagsCol = Tag.collection;       // taxonomytags (the old `tags` collection is left alone)
console.log(`database "${db.databaseName}" · mode ${mode}`);

const ITEM_FIELDS = ['tagIds', 'tags', 'eventGroup'];
const pick = (doc) => Object.fromEntries(ITEM_FIELDS.map((f) => [f, doc?.[f] ?? null]));
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

/* ---------------------------------------------------------------- rollback */
if (mode === 'rollback') {
    let run;
    try { run = await loadRun('migrateTagsToTaxonomy', runId); } catch (e) { console.error(e.message); await mongoose.disconnect(); process.exit(1); }
    let items = 0;
    const kept = [];
    for (const c of run.changes.filter((x) => x.op === 'item')) {
        const current = await itemsCol.findOne({ _id: c.docId });
        if (!current) continue;
        if (!same(pick(current), c.after)) { kept.push(String(c.docId)); continue; }
        const $set = { tags: c.before.tags ?? [], eventGroup: c.before.eventGroup ?? '' };
        await itemsCol.updateOne({ _id: c.docId }, c.before.tagIds === null ? { $set, $unset: { tagIds: '' } } : { $set: { ...$set, tagIds: c.before.tagIds } });
        items += 1;
    }
    const tagIds = run.changes.filter((x) => x.op === 'tag').map((x) => x.docId);
    const groupIds = run.changes.filter((x) => x.op === 'group').map((x) => x.docId);
    const t = await newTagsCol.deleteMany({ _id: { $in: tagIds } });
    const g = await groupsCol.deleteMany({ _id: { $in: groupIds } });
    console.log(`rolled back ${runId}: ${items} item(s) restored, ${t.deletedCount} tag(s) and ${g.deletedCount} group(s) removed`);
    if (kept.length) console.log(`kept ${kept.length} item(s) edited since the run: ${kept.slice(0, 10).join(', ')}`);
    await markRolledBack(runId, { items, tags: t.deletedCount, groups: g.deletedCount, kept: kept.length });
    await mongoose.disconnect();
    process.exit(0);
}

const [categories, ceremonies, items, settings, existingGroups] = await Promise.all([
    db.collection('tags').find({}).sort({ _id: 1 }).toArray(),
    db.collection('ceremonies').find({}).sort({ order: 1, name: 1 }).toArray(),
    itemsCol.find({}).toArray(),
    db.collection('websitesettings').findOne({}),
    groupsCol.countDocuments(),
]);

/* ---------------------------------------------------------------- verify */
if (mode === 'verify') {
    const { loadTaxonomy, invalidateTaxonomy } = await import('../Services/taxonomy.js');
    invalidateTaxonomy();
    const tax = await loadTaxonomy();
    const problems = [];
    if (!tax.groups.length) problems.push('no taxonomy yet: run --apply');
    for (const i of items) {
        if (!Array.isArray(i.tagIds)) { problems.push(`item ${i._id} has no tagIds`); continue; }
        const perGroup = new Map();
        for (const id of i.tagIds) {
            const tag = tax.tagById.get(String(id));
            if (!tag) { problems.push(`item ${i._id} → unknown tag ${id}`); continue; }
            const g = tax.groupById.get(String(tag.group));
            if (!(g.appliesTo || []).includes(i.kind)) problems.push(`item ${i._id} (${i.kind}) carries ${g.label}: ${tag.label}`);
            perGroup.set(g, (perGroup.get(g) || 0) + 1);
        }
        for (const [g, n] of perGroup) if (g.cardinality === 'single' && n > 1) problems.push(`item ${i._id} has ${n} ${g.label} tags`);
        const m = mirrorsFor(i.tagIds, tax);
        if (!same(m.tags, i.tags || []) || m.eventGroup !== (i.eventGroup || '')) problems.push(`item ${i._id} label copies out of date`);
    }
    // Count per tag both ways: ids, and the label copies they produce.
    for (const t of tax.tags) {
        const byId = items.filter((i) => (i.tagIds || []).some((x) => String(x) === String(t._id))).length;
        const g = tax.groupById.get(String(t.group));
        const byLabel = items.filter((i) => (g.key === SYSTEM_GROUPS.ceremony ? i.eventGroup === t.label : (i.tags || []).includes(t.label))).length;
        const sharedLabel = tax.tags.some((o) => o !== t && o.label === t.label && tax.groupById.get(String(o.group)).key !== SYSTEM_GROUPS.ceremony && g.key !== SYSTEM_GROUPS.ceremony);
        if (byId !== byLabel && !sharedLabel) problems.push(`tag ${g.label}: ${t.label} — ${byId} by id, ${byLabel} by label`);
    }
    const { resolveTagParam } = await import('../Services/taxonomy.js');
    for (const list of ['homepageVideosTags', 'filmsPageVideoTags', 'photoPagePhotoTags']) {
        for (const label of settings?.[list] || []) {
            if (!(await resolveTagParam([label])).length) problems.push(`${list}: "${label}" matches no tag`);
        }
    }
    console.log(`${tax.groups.length} group(s), ${tax.tags.length} tag(s), ${items.length} item(s)`);
    problems.slice(0, 25).forEach((p) => console.log('  ✖ ' + p));
    console.log(problems.length ? `✖ ${problems.length} problem(s)` : '✔ every item tagged by id, one per single group, label copies current, page rows resolve');
    await mongoose.disconnect();
    process.exit(problems.length ? 1 : 0);
}

if (existingGroups > 0) {
    console.log(`already migrated: ${existingGroups} tag group(s) exist. Roll back the earlier run first to redo it.`);
    await mongoose.disconnect();
    process.exit(mode === 'apply' ? 1 : 0);
}

/* ---------------------------------------------------------------- plan */
const oid = () => new mongoose.Types.ObjectId();
const now = new Date();
const planGroups = [];
const planTags = [];
const tagByGroupAndLower = new Map(); // `${groupKey}|${lower}` → tag

function addGroup(g) {
    const doc = { _id: oid(), appliesTo: ['Video', 'Photo'], cardinality: 'multi', hidden: false, system: false, createdAt: now, updatedAt: now, ...g };
    planGroups.push(doc);
    return doc;
}
function addTag(group, raw, extra = {}) {
    const label = normaliseLabel(raw);
    const k = `${group.key}|${label.toLowerCase()}`;
    if (tagByGroupAndLower.has(k)) return tagByGroupAndLower.get(k);
    let slug = slugify(label) || `tag-${planTags.length}`;
    while (planTags.some((t) => String(t.group) === String(group._id) && t.slug === slug)) slug += '-2';
    const doc = { _id: oid(), group: group._id, label, slug, aliases: [], hidden: false, order: planTags.filter((t) => String(t.group) === String(group._id)).length, createdAt: now, updatedAt: now, ...extra };
    planTags.push(doc);
    tagByGroupAndLower.set(k, doc);
    return doc;
}

const ceremonyGroup = addGroup({ key: SYSTEM_GROUPS.ceremony, label: 'Ceremony', cardinality: 'single', order: 0, system: true, description: 'The part of the wedding: one per film or photo.' });
for (const c of ceremonies.filter((x) => x.isActive !== false)) addTag(ceremonyGroup, c.name, { color: c.color, description: c.description });
const filmGroup = addGroup({ key: SYSTEM_GROUPS.filmType, label: 'Film type', cardinality: 'single', appliesTo: ['Video'], order: 1, system: true, description: 'What kind of film: one per film.' });
for (const f of MAP.filmTypes || []) addTag(filmGroup, f);
const legacyGroups = categories.map((c, idx) => {
    const g = addGroup({ key: slugify(c.tagType), label: normaliseLabel(c.tagType), order: 10 + idx, legacyTagType: c.tagType });
    for (const t of c.tags || []) if (normaliseLabel(t)) addTag(g, t);
    return g;
});
const unsorted = addGroup({ key: SYSTEM_GROUPS.unsorted, label: 'Unsorted', order: 99, hidden: true, system: true, description: 'Tags found on items that matched no category. Move or merge them.' });

// Item strings resolve against the categories in order; the first match wins.
const legacyIndex = new Map();
for (const g of legacyGroups) {
    for (const t of planTags.filter((x) => String(x.group) === String(g._id))) {
        if (!legacyIndex.has(t.label.toLowerCase())) legacyIndex.set(t.label.toLowerCase(), t);
    }
}
const groupByKey = new Map(planGroups.map((g) => [g.key, g]));

const lev = (a, b) => {
    const d = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
    for (let j = 1; j <= b.length; j++) d[0][j] = j;
    for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++) d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    return d[a.length][b.length];
};

const report = { renamed: new Map(), unsorted: new Map(), nearDup: new Map(), eventGroup: new Map(), newCeremony: new Set(), photoFilmType: [] };
const itemPlans = [];
for (const i of items) {
    const ids = [];
    const push = (t) => { if (!ids.some((x) => String(x) === String(t._id))) ids.push(t._id); };
    for (const raw of i.tags || []) {
        const s = normaliseLabel(raw);
        if (!s) continue;
        const target = MAP.tagRenames?.[s] ?? s;
        if (target !== s) report.renamed.set(`${s} → ${target}`, (report.renamed.get(`${s} → ${target}`) || 0) + 1);
        const tag = legacyIndex.get(target.toLowerCase());
        if (tag) {
            // The old spelling keeps resolving: links and rows saying "Cassic" find Classic.
            if (target !== s) for (const a of [s.toLowerCase(), slugify(s)]) if (!tag.aliases.includes(a) && a !== tag.slug) tag.aliases.push(a);
            push(tag);
            continue;
        }
        push(addTag(unsorted, target));
        report.unsorted.set(target, (report.unsorted.get(target) || 0) + 1);
        const close = [...legacyIndex.values()].find((t) => lev(t.label.toLowerCase(), target.toLowerCase()) <= 2);
        if (close) report.nearDup.set(target, close.label);
    }
    const eg = normaliseLabel(i.eventGroup);
    if (eg) {
        let tag;
        if (Object.hasOwn(MAP.eventGroups || {}, eg)) {
            const dest = MAP.eventGroups[eg];
            if (dest === null) tag = addTag(unsorted, eg);
            else {
                const [gKey, ...rest] = dest.split(':');
                tag = addTag(groupByKey.get(gKey), rest.join(':'));
            }
        } else {
            tag = tagByGroupAndLower.get(`${SYSTEM_GROUPS.ceremony}|${eg.toLowerCase()}`)
                || planTags.find((t) => String(t.group) === String(ceremonyGroup._id) && t.slug === slugify(eg));
            if (!tag) { tag = addTag(ceremonyGroup, eg); report.newCeremony.add(eg); }
        }
        if (String(tag.group) === String(filmGroup._id) && i.kind === 'Photo') {
            report.photoFilmType.push(`${i._id} "${eg}"`);
            tag = addTag(unsorted, eg);
        }
        const g = planGroups.find((x) => String(x._id) === String(tag.group));
        report.eventGroup.set(`${eg} → ${g.label}: ${tag.label}`, (report.eventGroup.get(`${eg} → ${g.label}: ${tag.label}`) || 0) + 1);
        push(tag);
    }
    itemPlans.push({ item: i, ids });
}

const planTax = {
    tagById: new Map(planTags.map((t) => [String(t._id), t])),
    groupById: new Map(planGroups.map((g) => [String(g._id), g])),
};
const itemChanges = itemPlans.map(({ item, ids }) => {
    const after = { tagIds: ids, ...mirrorsFor(ids, planTax) };
    return { item, before: pick(item), after };
}).filter((c) => !same(c.before, c.after));
const labelChanges = itemChanges.filter((c) => !same(c.before.tags ?? [], c.after.tags) || (c.before.eventGroup ?? '') !== c.after.eventGroup);

const pageRows = [];
for (const list of ['homepageVideosTags', 'filmsPageVideoTags', 'photoPagePhotoTags']) {
    for (const label of settings?.[list] || []) {
        const hit = planTags.find((t) => t.label.toLowerCase() === normaliseLabel(label).toLowerCase() || t.slug === slugify(label));
        pageRows.push(`${hit ? '✔' : '✖'} ${list}: "${label}"${hit ? '' : ' matches no tag'}`);
    }
}

/* ---------------------------------------------------------------- report */
const list = (title, rows) => { console.log(`${title}: ${rows.length}`); rows.slice(0, 30).forEach((r) => console.log('    ' + r)); };
console.log(`groups (${planGroups.length}):`);
for (const g of planGroups) {
    const n = planTags.filter((t) => String(t.group) === String(g._id)).length;
    console.log(`    ${g.label.padEnd(20)} ${g.cardinality.padEnd(6)} ${g.appliesTo.join('+').padEnd(11)} ${String(n).padStart(3)} tag(s)${g.hidden ? '  (hidden)' : ''}`);
}
list('typo/case merges from the map', [...report.renamed].map(([k, n]) => `${k}  (${n} item(s))`));
list('item tags that match no category → Unsorted', [...report.unsorted].map(([k, n]) => `${k}  (${n} item(s))${report.nearDup.has(k) ? `   did you mean "${report.nearDup.get(k)}"? add it to tagRenames` : ''}`));
list('ceremony / film values', [...report.eventGroup].map(([k, n]) => `${k}  (${n} item(s))`));
list('new ceremonies created from item values', [...report.newCeremony]);
list('film types on photos → Unsorted', report.photoFilmType);
list('page rows', pageRows);
console.log(`items: ${itemChanges.length} of ${items.length} get tag ids; ${labelChanges.length} have their label copies rewritten`);
labelChanges.slice(0, 10).forEach((c) => console.log(`    ${c.item._id}: [${(c.before.tags || []).join(', ')}] "${c.before.eventGroup || ''}" → [${c.after.tags.join(', ')}] "${c.after.eventGroup}"`));

if (pageRows.some((r) => r.startsWith('✖'))) {
    console.error('✖ refusing: a page row would match no tag. Fix the map or the row first.');
    await mongoose.disconnect();
    process.exit(1);
}
if (mode === 'dryRun') {
    console.log('[dry-run] nothing written.');
    await mongoose.disconnect();
    process.exit(0);
}

/* ---------------------------------------------------------------- apply */
await TagGroup.init();
await Tag.init();
const run = await startRun('migrateTagsToTaxonomy');
try {
    for (const g of planGroups) {
        await groupsCol.insertOne(g);
        await run.record({ op: 'group', docId: g._id });
    }
    for (const t of planTags) {
        await newTagsCol.insertOne(t);
        await run.record({ op: 'tag', docId: t._id });
    }
    for (const { item, before, after } of itemChanges) {
        await itemsCol.updateOne({ _id: item._id }, { $set: after });
        await run.record({ op: 'item', docId: item._id, before, after });
    }
    await run.finish({ groups: planGroups.length, tags: planTags.length, items: itemChanges.length });
} catch (error) {
    await run.fail(error);
    throw error;
}
console.log('Next: node scripts/migrateTagsToTaxonomy.js --verify');
await mongoose.disconnect();
