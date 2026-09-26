/**
 * The public pages become compositions of rows (plan phase 6).
 *
 *   node scripts/migratePagesToComposition.js [--dry-run | --apply | --verify | --rollback=<runId>]
 *
 *   home      hero → home-hero; "Our films" tabs → the home-films-* rows in the order
 *             of today's tag list; "Our portfolio" tabs → the home-portfolio-* rows
 *   films     one filmRows section: today's /films tag list, in order, as rows
 *   allfilms  created: one browseFilms section (every visible category as a filter)
 *   photos    one photoGallery section (no filter groups chosen: the gallery
 *             keeps its own chips until the admin picks some)
 *
 * Needs scripts/migrateRowsToCollections.js first. Everything goes live as it
 * is today: same rows, same order. If the home page is a Draft (hidden) today,
 * its blocks move to the draft and the layout visitors currently see is
 * published. Each page's previous state is recorded for --rollback.
 */
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { parseMode, startRun, loadRun, markRolledBack } from './lib/runLog.js';

dotenv.config();
const { mode, runId } = parseMode();
await mongoose.connect(process.env.MONGO_URI);
const db = mongoose.connection.db;
console.log(`database "${db.databaseName}" · mode ${mode}`);

const pages = db.collection('pagecontents');
const Collection = (await import('../Models/Collection.js')).default;
const { slugify } = await import('../Services/taxonomy.js');
const { DEFAULT_LAYOUTS } = await import('../Utils/pageLayouts.js');
const { parseSectionSettings } = await import('../Utils/sectionSettings.js');
const { resolveBlocks } = await import('../Services/pageComposer.js');
const { nanoid } = await import('nanoid');

/* ---------------------------------------------------------------- rollback */
if (mode === 'rollback') {
    let run;
    try { run = await loadRun('migratePagesToComposition', runId); } catch (e) { console.error(e.message); await mongoose.disconnect(); process.exit(1); }
    let n = 0;
    for (const c of run.changes) {
        if (c.op === 'create') await pages.deleteOne({ _id: c.docId });
        else await pages.replaceOne({ _id: c.docId }, c.before);
        n += 1;
    }
    console.log(`rolled back ${runId}: ${n} page(s) restored`);
    await markRolledBack(runId, { pages: n });
    await mongoose.disconnect();
    process.exit(0);
}

const ws = await db.collection('websitesettings').findOne({});
const rowKeys = new Set((await Collection.find({}).select('key').lean()).map((c) => c.key));
if (!rowKeys.has('home-hero')) {
    console.error('No rows yet: run scripts/migrateRowsToCollections.js --apply first.');
    await mongoose.disconnect();
    process.exit(1);
}
const keysFor = (prefix, labels) => labels.map((l) => `${prefix}-${slugify(l)}`).filter((k) => rowKeys.has(k));
const HOME_TABS = keysFor('home-films', ws?.homepageVideosTags || []);
const FILM_ROWS = keysFor('films', ws?.filmsPageVideoTags || []);
const PORTFOLIO_TABS = ['home-portfolio-all', ...keysFor('home-portfolio', ['Wedding', 'Pre-Wedding', 'Garden', 'Haldi'])].filter((k) => rowKeys.has(k));

const SETTINGS = {
    heroVideos: { collectionKey: 'home-hero' },
    ourFilms: { tabs: HOME_TABS },
    portfolio: { tabs: PORTFOLIO_TABS },
    filmRows: { rows: FILM_ROWS, dedupe: false },
    browseFilms: { facetGroups: [], sort: 'newestShoot', pageSize: 12 },
    photoGallery: { facetGroups: [], sort: 'newestShoot', pageSize: 24 },
};
const withSettings = (blocks) => blocks.map((b) => {
    if (b.type !== 'section' || !SETTINGS[b.settings?.component]) return b;
    const { settings } = parseSectionSettings(b.settings.component, { ...b.settings, ...SETTINGS[b.settings.component] });
    return { ...b, settings };
});
const fresh = (key) => DEFAULT_LAYOUTS[key].map((b, i) => ({ _id: nanoid(10), media: [], items: [], ...b, order: i }));

/* ---------------------------------------------------------------- plan */
const plan = [];
for (const key of ['home', 'films', 'allfilms', 'photos']) {
    const doc = await pages.findOne({ pageKey: key });
    const hasSection = (doc?.blocks || []).some((b) => b.type === 'section' && SETTINGS[b.settings?.component]);
    let next;
    if (!doc) next = { pageKey: key, title: key, status: 'Published', blocks: withSettings(fresh(key)), createdAt: new Date(), updatedAt: new Date() };
    else if (key === 'home') {
        const blocks = withSettings(doc.blocks || []);
        next = doc.status === 'Published'
            ? { ...doc, blocks }
            // Hidden today: visitors see the fallback layout; publish that, keep the rest as a draft.
            : { ...doc, status: 'Published', blocks: withSettings(fresh('home')), draft: { blocks, savedAt: new Date(), savedBy: 'migratePagesToComposition' } };
    } else {
        // films / photos exist but were never read; their (empty) blocks get the section.
        next = { ...doc, status: 'Published', blocks: hasSection ? withSettings(doc.blocks) : [...withSettings(fresh(key)), ...(doc.blocks || []).map((b, i) => ({ ...b, order: i + 1 }))] };
    }
    next.publishedAt = new Date();
    next.publishedBy = 'migratePagesToComposition';
    plan.push({ key, doc, next });
}

/* ---------------------------------------------------------------- verify */
if (mode === 'verify') {
    const problems = [];
    for (const key of ['home', 'films', 'allfilms', 'photos']) {
        const doc = await pages.findOne({ pageKey: key });
        if (!doc || doc.status !== 'Published') { problems.push(`${key}: not published`); continue; }
        const resolved = await resolveBlocks((doc.blocks || []).filter((b) => b.type === 'section'));
        for (const b of resolved) {
            if (SETTINGS[b.settings?.component] && !b.data) problems.push(`${key}: ${b.settings.component} did not resolve`);
        }
        const find = (c) => resolved.find((b) => b.settings?.component === c)?.data;
        if (key === 'home') {
            const films = find('ourFilms');
            if (films && films.tabs.map((t) => t.title).join() !== (ws?.homepageVideosTags || []).join()) problems.push(`home tabs [${films.tabs.map((t) => t.title)}] ≠ today's [${ws?.homepageVideosTags}]`);
            else console.log(`  ✔ home: hero ${find('heroVideos')?.slides.length} slide(s); films tabs ${films?.tabs.map((t) => `${t.title}(${t.items.length})`).join(', ')}; portfolio ${find('portfolio')?.tabs.map((t) => t.title).join(', ')}`);
        }
        if (key === 'films') {
            const rows = find('filmRows')?.rows || [];
            if (rows.map((r) => r.title).join() !== (ws?.filmsPageVideoTags || []).join()) problems.push(`films rows [${rows.map((r) => r.title)}] ≠ today's [${ws?.filmsPageVideoTags}]`);
            else console.log(`  ✔ films: ${rows.map((r) => `${r.title}(${r.items.length})`).join(', ')}`);
        }
        if (key === 'allfilms') console.log(`  ✔ allfilms: filters ${find('browseFilms')?.facets.map((f) => f.label).join(', ')}`);
        if (key === 'photos') console.log(`  ✔ photos: gallery section, ${find('photoGallery')?.facets.length} filter group(s) available`);
    }
    problems.forEach((p) => console.log('  ✖ ' + p));
    console.log(problems.length ? `✖ ${problems.length} problem(s)` : '✔ every page composed, and shows today\'s rows in today\'s order');
    await mongoose.disconnect();
    process.exit(problems.length ? 1 : 0);
}

for (const { key, doc, next } of plan) {
    const sections = next.blocks.filter((b) => b.type === 'section' && SETTINGS[b.settings?.component]);
    console.log(`  ${doc ? 'update' : 'create'} ${key.padEnd(9)} ${doc?.status && doc.status !== 'Published' ? `(was ${doc.status}; its blocks become the draft) ` : ''}`
        + sections.map((b) => `${b.settings.component} ${JSON.stringify(Object.fromEntries(Object.entries(b.settings).filter(([k]) => k !== 'component')))}`).join('; '));
}
if (mode === 'dryRun') {
    console.log('[dry-run] nothing written.');
    await mongoose.disconnect();
    process.exit(0);
}
const run = await startRun('migratePagesToComposition');
try {
    for (const { doc, next } of plan) {
        if (doc) {
            await pages.replaceOne({ _id: doc._id }, next);
            await run.record({ op: 'update', docId: doc._id, before: doc });
        } else {
            const r = await pages.insertOne(next);
            await run.record({ op: 'create', docId: r.insertedId });
        }
    }
    await run.finish({ pages: plan.length });
} catch (error) {
    await run.fail(error);
    throw error;
}
console.log('Next: node scripts/migratePagesToComposition.js --verify');
await mongoose.disconnect();
process.exit(0);
