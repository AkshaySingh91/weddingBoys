/**
 * What a collection (a row) shows — one function for the admin's live preview
 * AND the public site, so they can never disagree.
 *
 *   1. pins, in their exact order; a pin that is not public is skipped;
 *   2. then the rule's matches over the public gate, excluding hidden items,
 *      the pins, and (with `dedupe`) anything shown earlier on the same page;
 *   3. sorted by the collection's sort with fixed tie-breakers;
 *   4. at most `maxPerWedding` per wedding (pins count), cut at `limit`.
 *
 * Hero status and upload order play no part: "5 films, 3 weddings, tagged
 * pre-wedding" is ordered by the row's own sort and nothing else.
 *
 * `explain` adds `notShown` — every item the admin might expect and why it is
 * missing — for the preview's "Not shown" panel.
 */
import mongoose from 'mongoose';
import Collection from '../Models/Collection.js';
import PortfolioItem from '../Models/PortfolioItem.js';
import { PUBLIC_GATE, explainVisibility } from './portfolioVisibility.js';

/** Fixed tie-breakers: the same data always gives the same order. */
export const SORTS = Object.freeze({
    newestShoot: { shootDate: -1, publishedAt: -1, _id: -1 },
    newestPublished: { publishedAt: -1, shootDate: -1, _id: -1 },
    featured: { spotlight: -1, shootDate: -1, publishedAt: -1, _id: -1 },
});

const oids = (list = []) => list.filter((x) => mongoose.isValidObjectId(x)).map((x) => new mongoose.Types.ObjectId(String(x)));
const isPublic = (i) => i.status === PUBLIC_GATE.status && i.clientStatus === PUBLIC_GATE.clientStatus && i.mediaReady === true;

/**
 * The rule as a Mongo filter (without the public gate or exclusions), or null
 * when the rule is off — then the row is its pins alone.
 */
export function ruleFilter(collection) {
    const r = collection.rule || {};
    if (r.enabled === false) return null;
    const f = { kind: collection.kind };
    const tags = oids(r.tagIds);
    if (tags.length) f.tagIds = r.match === 'all' ? { $all: tags } : { $in: tags };
    const not = oids(r.excludeTagIds);
    if (not.length) f.tagIds = { ...(f.tagIds || {}), $nin: not };
    const clients = oids(r.clientIds);
    if (clients.length) f.client = { $in: clients };
    if (r.citySlugs?.length) f['location.citySlug'] = { $in: r.citySlugs.map((s) => String(s).toLowerCase()) };
    if (r.shootDateFrom || r.shootDateTo) {
        f.shootDate = {};
        if (r.shootDateFrom) f.shootDate.$gte = new Date(r.shootDateFrom);
        if (r.shootDateTo) f.shootDate.$lte = new Date(r.shootDateTo);
    }
    return f;
}

/**
 * The ordering itself, pure: pins (already public, in order) then candidates
 * (already sorted), with the per-wedding cap and the limit. `candidates` may be
 * any (async) iterable, so a database cursor stops as soon as the row is full.
 */
export async function assemble({ collection, pins = [], candidates = [] }) {
    const limit = collection.limit || 12;
    const cap = collection.rule?.maxPerWedding || null;
    const items = [];
    const notShown = [];
    const perWedding = new Map();
    const clientOf = (i) => String(i.client?._id || i.client);
    const take = (i, source) => {
        items.push({ ...i, source });
        perWedding.set(clientOf(i), (perWedding.get(clientOf(i)) || 0) + 1);
    };

    for (const p of pins) {
        if (items.length >= limit) { notShown.push({ item: p, reason: 'over-limit' }); continue; }
        take(p, 'pinned');
    }
    let more = 0;
    for await (const c of candidates) {
        if (items.length >= limit) { more += 1; if (more > 1) break; continue; }
        if (cap && (perWedding.get(clientOf(c)) || 0) >= cap) { notShown.push({ item: c, reason: 'wedding-cap' }); continue; }
        take(c, 'rule');
    }
    return { items, notShown, hasMore: more > 0 };
}

const withClient = (q) => q.populate('client', 'clientName slug').lean();

/**
 * Resolve one collection (a saved document or an unsaved draft from the
 * editor). `exclude`: item ids already shown earlier on the page.
 */
export async function resolveCollection(collection, { exclude = new Set(), explain = false } = {}) {
    const pinnedIds = oids(collection.pinned);
    const hiddenIds = oids(collection.hidden);
    const excluded = collection.dedupe ? oids([...exclude]) : [];

    let pinQuery = PortfolioItem.find({ _id: { $in: pinnedIds } });
    if (explain) pinQuery = pinQuery.populate('media', 'status processing.lastError');
    const pinDocs = pinnedIds.length ? await withClient(pinQuery) : [];
    const byId = new Map(pinDocs.map((d) => [String(d._id), d]));
    const notShown = [];
    const pins = [];
    for (const id of pinnedIds) {
        const d = byId.get(String(id));
        if (!d) { notShown.push({ itemId: String(id), reason: 'deleted' }); continue; }
        if (d.kind !== collection.kind) { notShown.push({ item: d, reason: 'wrong-kind' }); continue; }
        if (!isPublic(d)) { notShown.push({ item: d, reason: 'not-public', visibility: explainVisibility(d, d.media) }); continue; }
        pins.push(d);
    }

    const base = ruleFilter(collection);
    let candidates = [];
    if (base) {
        const filter = { ...base, ...PUBLIC_GATE, _id: { $nin: [...pinnedIds, ...hiddenIds, ...excluded] } };
        candidates = pageThrough(filter, SORTS[collection.sort] || SORTS.newestShoot);
    }
    const out = await assemble({ collection, pins, candidates });
    notShown.push(...out.notShown);

    let counts;
    if (explain) {
        // Items the admin may expect: matching the rule but hidden in this row,
        // shown earlier on the page, or not public (with the item's reasons).
        if (base) {
            const hiddenHits = hiddenIds.length ? await withClient(PortfolioItem.find({ ...base, _id: { $in: hiddenIds } }).limit(60)) : [];
            hiddenHits.forEach((d) => notShown.push({ item: d, reason: 'hidden-in-row' }));
            const earlier = excluded.length ? await withClient(PortfolioItem.find({ ...base, ...PUBLIC_GATE, _id: { $in: excluded } }).limit(60)) : [];
            earlier.forEach((d) => notShown.push({ item: d, reason: 'shown-earlier' }));
            const gated = await withClient(PortfolioItem.find({ ...base, _id: { $nin: [...pinnedIds, ...hiddenIds] }, $nor: [PUBLIC_GATE] })
                .populate('media', 'status processing.lastError').limit(60));
            gated.forEach((d) => notShown.push({ item: d, reason: 'not-public', visibility: explainVisibility(d, d.media) }));
        }
        counts = {
            shown: out.items.length,
            pinned: out.items.filter((i) => i.source === 'pinned').length,
            rule: out.items.filter((i) => i.source === 'rule').length,
            matching: base ? await PortfolioItem.countDocuments({ ...base, ...PUBLIC_GATE }) : 0,
            limit: collection.limit || 12,
        };
    }
    return { items: out.items, hasMore: out.hasMore, notShown: explain ? notShown : undefined, counts };
}

/** Sorted matches, fetched a page at a time so a full row stops the reads. */
async function* pageThrough(filter, sort, pageSize = 60) {
    for (let skip = 0; ; skip += pageSize) {
        const page = await withClient(PortfolioItem.find(filter).sort(sort).skip(skip).limit(pageSize));
        for (const d of page) yield d;
        if (page.length < pageSize) return;
    }
}

/**
 * Several rows of one page, in order: a row with `dedupe` skips what an
 * earlier row on the page already showed. Missing keys and Draft rows are
 * skipped. Returns [{ collection, items }].
 */
export async function resolveMany(keys, { includeDrafts = false, dedupeAll = false } = {}) {
    const docs = await Collection.find({ key: { $in: keys } }).lean();
    const byKey = new Map(docs.map((d) => [d.key, d]));
    const shown = new Set();
    const rows = [];
    for (const key of keys) {
        const c = byKey.get(key);
        if (!c || (!includeDrafts && c.status !== 'Published')) continue;
        // `dedupeAll`: the page asks every row to skip what earlier rows showed.
        const { items, hasMore } = await resolveCollection(dedupeAll ? { ...c, dedupe: true } : c, { exclude: shown });
        items.forEach((i) => shown.add(String(i._id)));
        rows.push({ collection: c, items, hasMore });
    }
    return rows;
}

export const HERO_KEY = 'home-hero';
