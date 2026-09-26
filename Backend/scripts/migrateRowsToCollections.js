/**
 * Today's rows become collections (plan phase 5).
 *
 *   node scripts/migrateRowsToCollections.js [--dry-run | --apply | --verify | --rollback=<runId>]
 *
 *   home-hero                the hero carousel: today's hero films pinned in today's
 *                            order, no rule (system row — cannot be deleted)
 *   home-films-<tag>         one per tag in Home › "Our films" (homepageVideosTags)
 *   films-<tag>              one per tag on /films (filmsPageVideoTags)
 *   home-portfolio-<cat>     one per category of the home "Our portfolio" photo grid
 *
 * Rows sort newest shoot first (plan decision: the old generalPriority values were
 * random). Pages keep reading their current lists until phase 6 composes them
 * from these rows, so nothing visible changes except the hero, which already
 * reads home-hero — and its films and order are pinned exactly as today.
 *
 * Create-only: a row whose key exists is left as it is.
 */
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { parseMode, startRun, loadRun, markRolledBack } from './lib/runLog.js';

dotenv.config();
const { mode, runId } = parseMode();
await mongoose.connect(process.env.MONGO_URI);
const db = mongoose.connection.db;
console.log(`database "${db.databaseName}" · mode ${mode}`);

const Collection = (await import('../Models/Collection.js')).default;
const WebsiteSetting = (await import('../Models/WebsiteSettingSchema.js')).default;
const { resolveTagParam, slugify, taxonomyExists } = await import('../Services/taxonomy.js');
const { resolveCollection } = await import('../Services/collectionResolver.js');
const portfolio = await import('../Services/portfolioService.js');

// The home "Our portfolio" categories (Next-Frontend/app/(site)/_home/OurPortfolio.jsx).
const PORTFOLIO_CATEGORIES = ['All Work', 'Wedding', 'Pre-Wedding', 'Garden', 'Haldi'];
const ROW_LIMIT = 10;       // what the home and /films rows request today
const PORTFOLIO_LIMIT = 8;  // what the home grid shows

/* ---------------------------------------------------------------- rollback */
if (mode === 'rollback') {
    let run;
    try { run = await loadRun('migrateRowsToCollections', runId); } catch (e) { console.error(e.message); await mongoose.disconnect(); process.exit(1); }
    const ids = run.changes.filter((c) => c.op === 'create').map((c) => c.docId);
    const r = await Collection.deleteMany({ _id: { $in: ids } });
    console.log(`rolled back ${runId}: ${r.deletedCount} row(s) removed`);
    await markRolledBack(runId, { removed: r.deletedCount });
    await mongoose.disconnect();
    process.exit(0);
}

if (!(await taxonomyExists())) {
    console.error('The tag system does not exist yet: run scripts/migrateTagsToTaxonomy.js --apply first.');
    await mongoose.disconnect();
    process.exit(1);
}

/* ---------------------------------------------------------------- plan */
const ws = await WebsiteSetting.findOne().lean();
const heroNow = await portfolio.findHeroVideos(); // before home-hero exists: today's flagged hero
const plan = [];
const heroExists = await Collection.exists({ key: 'home-hero' });
plan.push({
    key: 'home-hero', title: 'Home hero', kind: 'Video', system: true, sort: 'newestShoot', limit: 12,
    rule: { enabled: false }, pinned: heroExists ? undefined : heroNow.map((i) => i._id),
    description: 'The home page carousel. Pinned films in this order; no rule.',
});
const tagRow = async (prefix, label, page, kind, limit) => ({
    key: `${prefix}-${slugify(label)}`, title: label, kind, sort: 'newestShoot', limit,
    rule: { enabled: true, match: 'any', tagIds: await resolveTagParam([label]) },
    description: `Migrated from the ${page} tag list ("${label}").`,
});
for (const t of ws?.homepageVideosTags || []) plan.push(await tagRow('home-films', t, 'Home "Our films"', 'Video', ROW_LIMIT));
for (const t of ws?.filmsPageVideoTags || []) plan.push(await tagRow('films', t, '/films', 'Video', ROW_LIMIT));
for (const cat of PORTFOLIO_CATEGORIES) {
    plan.push(cat === 'All Work'
        ? { key: 'home-portfolio-all', title: 'All Work', kind: 'Photo', sort: 'newestShoot', limit: PORTFOLIO_LIMIT, rule: { enabled: true, tagIds: [] }, description: 'Home "Our portfolio" — every photo.' }
        : await tagRow('home-portfolio', cat, 'home "Our portfolio" category', 'Photo', PORTFOLIO_LIMIT));
}

/* ---------------------------------------------------------------- verify */
if (mode === 'verify') {
    const problems = [];
    const info = [];
    for (const p of plan) {
        const c = await Collection.findOne({ key: p.key }).lean();
        if (!c) { problems.push(`${p.key} missing`); continue; }
        const { items } = await resolveCollection(c);
        const ids = items.map((i) => String(i._id));
        if (p.key === 'home-hero') {
            // The hero must be exactly today's: compare with the flag-based hero.
            const flags = (await db.collection('portfolioitems').find({ kind: 'Video', isHero: true, status: 'Published', clientStatus: 'Published', mediaReady: true })
                .sort({ heroPriority: -1, _id: -1 }).limit(12).toArray()).map((i) => String(i._id));
            if (ids.join() !== flags.join()) problems.push(`home-hero shows ${ids.length} [${ids.join(', ')}], flags say [${flags.join(', ')}]`);
            else info.push(`home-hero: ${ids.length} film(s), same order as today`);
            continue;
        }
        if (p.rule.tagIds?.length === 0 && p.kind === 'Video') { problems.push(`${p.key}: its tag matches nothing`); continue; }
        const label = p.title === 'All Work' ? null : p.title;
        const today = p.kind === 'Photo'
            ? await portfolio.findHomePhotos({ category: label || 'All Work', limit: 500 })
            : await portfolio.findFeed({ kind: 'Video', tags: [label], limit: 500 });
        const todayIds = today.map((i) => String(i._id));
        if (todayIds.length <= c.limit) {
            const same = todayIds.length === ids.length && todayIds.every((x) => ids.includes(x));
            if (!same) problems.push(`${p.key}: today ${todayIds.length} [${todayIds.join(', ')}], row ${ids.length} [${ids.join(', ')}]`);
            else info.push(`${p.key}: same ${ids.length} item(s) as today`);
        } else {
            const inRow = ids.filter((x) => todayIds.includes(x)).length;
            info.push(`${p.key}: ${todayIds.length} match, row shows ${ids.length} (limit ${c.limit}); all ${inRow} are today's matches — which ones now follows newest shoot first`);
            if (inRow !== ids.length) problems.push(`${p.key}: shows items today's row would never show`);
        }
    }
    info.forEach((i) => console.log('  ✔ ' + i));
    problems.forEach((p) => console.log('  ✖ ' + p));
    console.log(problems.length ? `✖ ${problems.length} problem(s)` : '✔ hero identical; every row shows today\'s items');
    await mongoose.disconnect();
    process.exit(problems.length ? 1 : 0);
}

/* ---------------------------------------------------------------- report / apply */
const existing = new Set((await Collection.find({ key: { $in: plan.map((p) => p.key) } }).select('key').lean()).map((c) => c.key));
const toCreate = plan.filter((p) => !existing.has(p.key));
console.log(`${plan.length} row(s) planned, ${existing.size} already exist, ${toCreate.length} to create`);
for (const p of plan) {
    const note = p.key === 'home-hero' ? `${(p.pinned || []).length} pinned film(s)` : `${p.kind === 'Video' ? 'films' : 'photos'}, ${p.rule.tagIds.length ? `${p.rule.tagIds.length} tag id(s)` : 'every item'}, limit ${p.limit}`;
    console.log(`    ${existing.has(p.key) ? 'exists ' : 'create '} ${p.key.padEnd(34)} ${note}`);
}
const unresolved = toCreate.filter((p) => p.key !== 'home-hero' && p.title !== 'All Work' && !p.rule.tagIds.length);
if (unresolved.length) console.log(`⚠ these rows' tags match nothing: ${unresolved.map((p) => p.title).join(', ')}`);

if (mode === 'dryRun') {
    console.log('[dry-run] nothing written.');
    await mongoose.disconnect();
    process.exit(0);
}
const run = await startRun('migrateRowsToCollections');
try {
    for (const p of toCreate) {
        const c = await Collection.create({ ...p, pinned: p.pinned || [], status: 'Published', updatedBy: 'migrateRowsToCollections' });
        await run.record({ op: 'create', docId: c._id, key: c.key });
    }
    await run.finish({ created: toCreate.length });
} catch (error) {
    await run.fail(error);
    throw error;
}
console.log('Next: node scripts/migrateRowsToCollections.js --verify');
await mongoose.disconnect();
process.exit(0);
