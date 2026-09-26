/**
 * Admin API for collections (rows): /api/admin/collections/*.
 * The preview runs the same resolver as the public site (Services/collectionResolver.js).
 */
import mongoose from 'mongoose';
import Collection from '../Models/Collection.js';
import PortfolioItem from '../Models/PortfolioItem.js';
import { resolveCollection, HERO_KEY } from '../Services/collectionResolver.js';
import { validateTagIds, TaxonomyError, slugify } from '../Services/taxonomy.js';
import { toCard } from '../Services/cards.js';
import { revalidatePortfolio } from '../Services/revalidate.js';

const who = (req) => req.user?.email || req.admin?.email;
const isId = (x) => mongoose.isValidObjectId(x);
class CollectionError extends Error { constructor(status, message) { super(message); this.status = status; } }

const handle = (fn) => async (req, res) => {
    try {
        return await fn(req, res);
    } catch (error) {
        if (error instanceof CollectionError || error instanceof TaxonomyError) return res.status(error.status).json({ message: error.message, ...(error.details || {}) });
        if (error?.code === 11000) return res.status(409).json({ message: 'A row with that key already exists' });
        console.error('collection error:', error);
        return res.status(500).json({ message: error.message });
    }
};

/** Whitelisted, validated fields from a create / edit / preview body. */
async function readBody(body = {}, { creating = false, current = null } = {}) {
    const out = {};
    if (body.title !== undefined) {
        const t = String(body.title).trim();
        if (!t) throw new CollectionError(400, 'A row needs a title');
        out.title = t.slice(0, 120);
    }
    if (body.subtitle !== undefined) out.subtitle = String(body.subtitle || '').trim().slice(0, 240);
    if (body.description !== undefined) out.description = String(body.description || '').trim().slice(0, 500);
    if (creating || body.kind !== undefined) {
        if (!['Video', 'Photo'].includes(body.kind)) throw new CollectionError(400, 'kind must be Video or Photo');
        if (current && current.kind !== body.kind && (current.pinned?.length || current.hidden?.length)) {
            throw new CollectionError(409, 'Unpin and unhide everything before switching between films and photos');
        }
        out.kind = body.kind;
    }
    if (body.sort !== undefined) {
        if (!['newestShoot', 'newestPublished', 'featured'].includes(body.sort)) throw new CollectionError(400, 'Unknown sort');
        out.sort = body.sort;
    }
    if (body.limit !== undefined) out.limit = Math.min(60, Math.max(1, parseInt(body.limit, 10) || 12));
    if (body.dedupe !== undefined) out.dedupe = Boolean(body.dedupe);
    if (body.status !== undefined) {
        if (!['Draft', 'Published'].includes(body.status)) throw new CollectionError(400, 'status must be Draft or Published');
        out.status = body.status;
    }
    if (body.rule !== undefined) {
        const r = body.rule || {};
        const idsOf = async (list) => {
            const ids = (list || []).filter(Boolean).map(String);
            for (const id of ids) await validateTagIds([id], null); // each exists
            return [...new Set(ids)];
        };
        out.rule = {
            enabled: r.enabled !== false,
            tagIds: await idsOf(r.tagIds),
            match: r.match === 'all' ? 'all' : 'any',
            excludeTagIds: await idsOf(r.excludeTagIds),
            clientIds: [...new Set((r.clientIds || []).filter(isId).map(String))],
            citySlugs: [...new Set((r.citySlugs || []).map((c) => slugify(c)).filter(Boolean))],
            shootDateFrom: r.shootDateFrom ? new Date(r.shootDateFrom) : undefined,
            shootDateTo: r.shootDateTo ? new Date(r.shootDateTo) : undefined,
            maxPerWedding: r.maxPerWedding ? Math.min(60, Math.max(1, parseInt(r.maxPerWedding, 10))) : undefined,
        };
        for (const d of ['shootDateFrom', 'shootDateTo']) if (out.rule[d] && Number.isNaN(out.rule[d].getTime())) throw new CollectionError(400, 'Invalid date');
    }
    for (const list of ['pinned', 'hidden']) {
        if (body[list] !== undefined) out[list] = [...new Set((body[list] || []).filter(isId).map(String))];
    }
    return out;
}

/** Cards for the admin: the public card plus the wedding and why it is there. */
const adminCard = (i) => ({
    ...toCard(i),
    source: i.source,
    wedding: [i.client?.clientName?.Bride, i.client?.clientName?.Groom].filter(Boolean).join(' & '),
    clientId: String(i.client?._id || i.client),
});

async function preview(collection) {
    const r = await resolveCollection(collection, { explain: true });
    return {
        items: r.items.map(adminCard),
        hasMore: r.hasMore,
        counts: r.counts,
        notShown: r.notShown.map((n) => (n.item ? { ...adminCard(n.item), reason: n.reason, reasons: n.visibility?.reasons } : { _id: n.itemId, reason: n.reason })),
    };
}

async function getDoc(id) {
    const c = isId(id) ? await Collection.findById(id) : await Collection.findOne({ key: String(id).toLowerCase() });
    if (!c) throw new CollectionError(404, 'Row not found');
    return c;
}

/**
 * After any change. The hero row also keeps the items' isHero / heroPriority
 * flags in step with its pins: the Home › Hero manager and older reads still
 * look at those flags (they are dropped in plan phase 7).
 */
async function changed(c) {
    if (c?.key === HERO_KEY) {
        const pins = c.pinned.map((x) => new mongoose.Types.ObjectId(String(x)));
        await PortfolioItem.updateMany({ isHero: true, _id: { $nin: pins } }, { $set: { isHero: false, heroPriority: 0 } });
        if (pins.length) {
            await PortfolioItem.bulkWrite(pins.map((id, idx) => ({
                updateOne: { filter: { _id: id, kind: 'Video' }, update: { $set: { isHero: true, heroPriority: pins.length - idx } } },
            })), { ordered: false });
        }
    }
    revalidatePortfolio();
}

// GET /api/admin/collections
export const listCollections = handle(async (_req, res) => {
    const docs = await Collection.find({}).sort({ system: -1, key: 1 }).lean();
    const rows = [];
    for (const c of docs) {
        const r = await resolveCollection(c);
        rows.push({ ...c, shown: r.items.length, hasMore: r.hasMore, thumbs: r.items.slice(0, 4).map((i) => i.render?.posterUrl || i.render?.imageUrl).filter(Boolean) });
    }
    return res.status(200).json({ collections: rows });
});

// GET /api/admin/collections/:id  (id or key)
export const getCollection = handle(async (req, res) => {
    const c = await getDoc(req.params.id);
    return res.status(200).json({ collection: c, preview: await preview(c.toObject()) });
});

// POST /api/admin/collections/preview  { ...draft }  — the editor's live preview
export const previewDraft = handle(async (req, res) => {
    const fields = await readBody(req.body, { creating: true });
    return res.status(200).json(await preview({ limit: 12, sort: 'newestShoot', ...fields }));
});

// POST /api/admin/collections
export const createCollection = handle(async (req, res) => {
    const fields = await readBody(req.body, { creating: true });
    if (!fields.title) throw new CollectionError(400, 'A row needs a title');
    const key = slugify(req.body.key || fields.title);
    if (!key) throw new CollectionError(400, 'A row needs a key');
    const c = await Collection.create({ ...fields, key, updatedBy: who(req) });
    changed();
    return res.status(201).json({ collection: c });
});

// PATCH /api/admin/collections/:id
export const updateCollection = handle(async (req, res) => {
    const c = await getDoc(req.params.id);
    const fields = await readBody(req.body, { current: c });
    if (c.system && fields.kind && fields.kind !== c.kind) throw new CollectionError(400, 'This row\'s kind is fixed');
    Object.assign(c, fields, { updatedBy: who(req) });
    await c.save();
    await changed(c);
    return res.status(200).json({ collection: c, preview: await preview(c.toObject()) });
});

// DELETE /api/admin/collections/:id
export const deleteCollection = handle(async (req, res) => {
    const c = await getDoc(req.params.id);
    if (c.system) throw new CollectionError(400, `"${c.title}" is used by the site and cannot be deleted`);
    await c.deleteOne();
    changed();
    return res.status(200).json({ deleted: c._id });
});

/**
 * POST /api/admin/collections/:id/items/:itemId/:action — pin | unpin | hide | unhide.
 * Pin puts the item at `index` (default: after the other pins) and un-hides it;
 * hide un-pins it.
 */
export const itemAction = handle(async (req, res) => {
    const c = await getDoc(req.params.id);
    const { itemId, action } = req.params;
    if (!isId(itemId)) throw new CollectionError(404, 'Item not found');
    const item = await PortfolioItem.findById(itemId).select('kind').lean();
    if (!item) throw new CollectionError(404, 'Item not found');
    if (['pin', 'hide'].includes(action) && item.kind !== c.kind) throw new CollectionError(400, `This row shows ${c.kind === 'Video' ? 'films' : 'photos'}`);
    const without = (list) => list.filter((x) => String(x) !== String(itemId));
    if (action === 'pin') {
        const pins = without(c.pinned);
        const at = Number.isInteger(req.body?.index) ? Math.max(0, Math.min(pins.length, req.body.index)) : pins.length;
        pins.splice(at, 0, item._id);
        c.pinned = pins;
        c.hidden = without(c.hidden);
    } else if (action === 'unpin') c.pinned = without(c.pinned);
    else if (action === 'hide') { c.hidden = [...without(c.hidden), item._id]; c.pinned = without(c.pinned); }
    else if (action === 'unhide') c.hidden = without(c.hidden);
    else throw new CollectionError(400, 'Unknown action');
    c.updatedBy = who(req);
    await c.save();
    await changed(c);
    return res.status(200).json({ collection: c, preview: await preview(c.toObject()) });
});

// POST /api/admin/collections/:id/pins { ids } — the dragged pin order (the same set, reordered)
export const reorderPins = handle(async (req, res) => {
    const c = await getDoc(req.params.id);
    const ids = (req.body?.ids || []).map(String);
    const current = c.pinned.map(String);
    if (ids.length !== current.length || !ids.every((x) => current.includes(x))) throw new CollectionError(400, 'Send the same pins, reordered');
    c.pinned = ids;
    c.updatedBy = who(req);
    await c.save();
    await changed(c);
    return res.status(200).json({ collection: c, preview: await preview(c.toObject()) });
});

/**
 * GET /api/admin/portfolio/:id/placements — the rows an item appears in, and
 * the ones it is pinned to or hidden from ("Appears in" in the edit drawer).
 */
export const itemPlacements = handle(async (req, res) => {
    if (!isId(req.params.id)) throw new CollectionError(404, 'Item not found');
    const id = String(req.params.id);
    const docs = await Collection.find({}).lean();
    const placements = [];
    for (const c of docs) {
        const pinned = c.pinned.some((x) => String(x) === id);
        const hidden = c.hidden.some((x) => String(x) === id);
        const { items } = await resolveCollection(c);
        const position = items.findIndex((i) => String(i._id) === id);
        if (pinned || hidden || position >= 0) {
            placements.push({ _id: c._id, key: c.key, title: c.title, status: c.status, pinned, hidden, shown: position >= 0, position: position >= 0 ? position + 1 : null });
        }
    }
    return res.status(200).json({ placements });
});

export { HERO_KEY };
