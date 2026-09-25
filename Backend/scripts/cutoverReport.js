/**
 * What changes for visitors when PORTFOLIO_READS=v2 is switched on. Read-only.
 *
 *   node scripts/cutoverReport.js [--json]
 *
 * Production still reads the arrays embedded in each Client; the admin now
 * writes only PortfolioItem. This compares the two in the database itself, so
 * it can run against a rehearsal copy before production is touched:
 *
 *   BLOCKER  the switch would make the site worse — an embedded film or photo
 *            with no item (it would vanish), or a published item with nothing to
 *            show (a broken image or player).
 *   REVIEW   a visible change that is probably intended but needs a human:
 *            items an admin hid, wizard-created weddings that would go live
 *            (test data such as "test & test" belongs here), hero and row order.
 *   INFO     facts for the runbook.
 *
 * Exits 1 when there is any blocker, so the runbook can stop on it.
 */
import dotenv from 'dotenv';
import mongoose from 'mongoose';

dotenv.config();
const AS_JSON = process.argv.includes('--json');

await mongoose.connect(process.env.MONGO_URI);
const db = mongoose.connection.db;
const col = (n) => db.collection(n);

const [clients, items, media, settings] = await Promise.all([
    col('clients').find({}).toArray(),
    col('portfolioitems').find({}).toArray(),
    col('media').find({}, { projection: { status: 1, mediaType: 1 } }).toArray(),
    col('websitesettings').findOne({}),
]);

const report = { database: db.databaseName, generatedAt: new Date().toISOString(), blockers: [], review: [], info: [] };
const blocker = (title, rows = []) => report.blockers.push({ title, rows });
const review = (title, rows = []) => report.review.push({ title, rows });
const info = (title, rows = []) => report.info.push({ title, rows });

const id = (x) => String(x);
const nameOf = (c) => (c ? [c.clientName?.Bride, c.clientName?.Groom].filter(Boolean).join(' & ') || '(no names)' : '(deleted wedding)');
const clientById = new Map(clients.map((c) => [id(c._id), c]));
const mediaById = new Map(media.map((m) => [id(m._id), m]));
const itemByLegacy = new Map(items.filter((i) => i.legacy?.subdocId).map((i) => [id(i.legacy.subdocId), i]));
const label = (i) => `${i.kind.padEnd(5)} ${id(i._id)}  ${nameOf(clientById.get(id(i.client)))}`;

/* ------------------------------------------------------------- weddings */
const byStatus = {};
for (const c of clients) byStatus[c.status || '(none)'] = (byStatus[c.status || '(none)'] || 0) + 1;
const legacyClients = clients.filter((c) => (c.videos?.length || 0) + (c.photos?.length || 0) > 0);
info(`${clients.length} wedding(s): ${Object.entries(byStatus).map(([s, n]) => `${n} ${s}`).join(', ')}; `
    + `${legacyClients.length} have embedded films/photos (what production shows today)`);

/* ------------------------------------------------- embedded -> item coverage */
const subdocs = [];
for (const c of clients) {
    for (const v of c.videos || []) subdocs.push({ c, kind: 'Video', sub: v });
    for (const p of c.photos || []) subdocs.push({ c, kind: 'Photo', sub: p });
}
const missing = subdocs.filter((s) => !itemByLegacy.has(id(s.sub._id)));
if (missing.length) {
    blocker(`${missing.length} embedded film/photo(s) have no item — they would disappear. Run the backfill.`,
        missing.map((s) => `${s.kind.padEnd(5)} ${id(s.sub._id)}  ${nameOf(s.c)}`));
}
info(`${subdocs.length} embedded film/photo(s), ${items.length} item(s): `
    + `${items.filter((i) => i.legacy?.subdocId).length} backfilled, ${items.filter((i) => !i.legacy?.subdocId).length} created in the admin`);

/* --------------------------------------------------- nothing to show on v2 */
const showable = (i) => (i.kind === 'Photo'
    ? Boolean(i.render?.imageUrl)
    : Boolean((i.render?.webUrl || i.render?.sourceUrl || i.render?.loopUrl) && i.render?.posterUrl));
const published = items.filter((i) => i.status === 'Published');
const broken = published.filter((i) => !showable(i));
if (broken.length) {
    blocker(`${broken.length} published item(s) have nothing to show (a photo with no image, a film with no video or poster)`,
        broken.map((i) => `${label(i)}  media ${mediaById.get(id(i.media))?.status || 'missing'}`));
}
const notReady = published.filter((i) => showable(i) && mediaById.get(id(i.media))?.status !== 'Ready');
if (notReady.length) {
    // Seen on production: photos whose Media record was archived in the media
    // library while the file itself is still served. Today's site shows them too.
    review(`${notReady.length} published item(s) whose media record is not Ready — the site shows them today as well; `
        + 'hide any that were meant to be deleted',
        notReady.map((i) => `${label(i)}  media ${mediaById.get(id(i.media))?.status || 'missing'}`));
}

/* ---------------------------------------------------- what visitors lose */
const hidden = subdocs
    .map((s) => ({ s, item: itemByLegacy.get(id(s.sub._id)) }))
    .filter(({ item }) => item && item.status !== 'Published');
if (hidden.length) {
    review(`${hidden.length} film/photo(s) visible today would be hidden (their item is not Published — hidden in the admin)`,
        hidden.map(({ item }) => `${label(item)}  status ${item.status}`));
}

/* --------------------------------------------------- what visitors gain */
const nativeByClient = new Map();
for (const i of items.filter((x) => !x.legacy?.subdocId)) {
    const k = id(i.client);
    if (!nativeByClient.has(k)) nativeByClient.set(k, []);
    nativeByClient.get(k).push(i);
}
const nativeRows = [...nativeByClient.entries()].map(([cid, list]) => {
    const c = clientById.get(cid);
    const pub = list.filter((i) => i.status === 'Published').length;
    const created = list.map((i) => i.createdAt).filter(Boolean).sort((a, b) => a - b)[0];
    return {
        goesLive: pub > 0,
        line: `${nameOf(c).padEnd(28)} wedding ${cid}  status ${c?.status || '-'}  `
            + `${list.length} item(s), ${pub} published  created ${created ? created.toISOString().slice(0, 10) : '?'}`,
    };
});
if (nativeRows.length) {
    review(`${nativeRows.length} wedding(s) have admin-created items. Those with published items appear on the site at the switch — delete test weddings first`,
        nativeRows.map((r) => `${r.goesLive ? 'GOES LIVE ' : 'stays hidden'}  ${r.line}`));
}

/* --------------------------------------------------------------- hero */
const legacyHero = (settings?.heroVideos || []).slice()
    .sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0))
    .map((h) => {
        const c = clientById.get(id(h.clientId));
        const v = (c?.videos || []).find((x) => x?.videoMetaData?.key === h.videoKey);
        return v ? id(v._id) : null;
    })
    .filter(Boolean);
const v2Hero = items.filter((i) => i.kind === 'Video' && i.isHero && i.status === 'Published')
    .sort((a, b) => ((b.heroPriority ?? 0) - (a.heroPriority ?? 0)) || id(b._id).localeCompare(id(a._id)))
    .slice(0, 12)
    .map((i) => id(i._id));
const heroLine = (ids) => ids.map((x) => `${x} ${nameOf(clientById.get(id(items.find((i) => id(i._id) === x)?.client)))}`);
if (legacyHero.join() === v2Hero.join()) info(`hero carousel: identical (${v2Hero.length} slide(s), same order)`);
else review(legacyHero.slice().sort().join() === v2Hero.slice().sort().join()
    ? 'hero carousel: same films, different order (equal priorities are tied). Set the order in Admin › Hero before switching'
    : 'hero carousel changes', [
    `today (${legacyHero.length}):`, ...heroLine(legacyHero).map((l) => '  ' + l),
    `after (${v2Hero.length}):`, ...heroLine(v2Hero).map((l) => '  ' + l),
]);

/* --------------------------------------------------------------- rows */
const LEGACY_SORT = (a, b) => (Number(b.sub.isHeroVideo) - Number(a.sub.isHeroVideo))
    || ((b.sub.heroPriority ?? 0) - (a.sub.heroPriority ?? 0))
    || ((b.sub.generalPriority ?? 0) - (a.sub.generalPriority ?? 0));
const V2_SORT = (a, b) => (Number(b.isHero) - Number(a.isHero))
    || ((b.heroPriority ?? 0) - (a.heroPriority ?? 0))
    || ((b.generalPriority ?? 0) - (a.generalPriority ?? 0))
    || id(b._id).localeCompare(id(a._id));
const rowTags = [...new Set([...(settings?.homepageVideosTags || []), ...(settings?.filmsPageVideoTags || [])])];
const rowLines = [];
for (const tag of rowTags) {
    const before = subdocs.filter((s) => s.kind === 'Video' && (s.sub.tags || []).includes(tag)).sort(LEGACY_SORT).map((s) => id(s.sub._id));
    const after = published.filter((i) => i.kind === 'Video' && (i.tags || []).includes(tag)).sort(V2_SORT).map((i) => id(i._id));
    const gone = before.filter((x) => !after.includes(x));
    const added = after.filter((x) => !before.includes(x));
    const orderOnly = !gone.length && !added.length && before.slice(0, 10).join() !== after.slice(0, 10).join();
    rowLines.push(`${tag.padEnd(22)} ${String(before.length).padStart(3)} → ${String(after.length).padStart(3)}`
        + (gone.length ? `  −${gone.length} (${gone.join(', ')})` : '')
        + (added.length ? `  +${added.length} (${added.join(', ')})` : '')
        + (orderOnly ? '  first-10 order differs (tied priorities)' : ''));
}
if (rowTags.length) info('home and /films rows, films per tag today → after', rowLines);

/* ---------------------------------------------------------------- map */
const pins = settings?.mapDisplayClient || [];
const orphanPins = pins.filter((p) => !clientById.has(id(p.clientId)));
if (orphanPins.length) {
    review(`${orphanPins.length} of ${pins.length} map pin(s) point at deleted weddings (never drawn, safe to remove)`,
        orphanPins.map((p) => `wedding ${id(p.clientId)}  at ${p.coordinate?.latitude}, ${p.coordinate?.longitute}`));
}
const unposteredPins = pins.filter((p) => clientById.has(id(p.clientId))
    && !published.some((i) => i.kind === 'Video' && id(i.client) === id(p.clientId) && i.render?.posterUrl));
if (unposteredPins.length) {
    review(`${unposteredPins.length} map pin(s) have no published film with a poster, so they are not drawn`,
        unposteredPins.map((p) => `${nameOf(clientById.get(id(p.clientId)))}  wedding ${id(p.clientId)}`));
}

/* ------------------------------------------------------------- output */
await mongoose.disconnect();

if (AS_JSON) {
    console.log(JSON.stringify(report, null, 2));
} else {
    console.log(`Cut-over report · database "${report.database}" · ${report.generatedAt}\n`);
    const section = (name, list) => {
        if (!list.length) return;
        console.log(`${name}`);
        for (const { title, rows } of list) {
            console.log(`  • ${title}`);
            rows.forEach((r) => console.log(`      ${r}`));
        }
        console.log('');
    };
    section('BLOCKERS', report.blockers);
    section('REVIEW', report.review);
    section('INFO', report.info);
    console.log(report.blockers.length
        ? `✖ ${report.blockers.length} blocker(s): do not switch PORTFOLIO_READS yet.`
        : '✔ no blockers. Read REVIEW before switching.');
}
process.exit(report.blockers.length ? 1 : 0);
