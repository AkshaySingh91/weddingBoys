/**
 * Portfolio admin API.
 *
 * Two things this enables that were previously impossible:
 *
 *  1. An asset uploaded in the media library can become portfolio content.
 *     Before, add-client was the ONLY door: a library upload set `ownerType`
 *     with `ownerId: null`, producing an orphan that no public page could reach.
 *  2. Curation across clients. Changing what the films page shows meant opening
 *     each client and editing each video; now it is one filterable list.
 */
import mongoose from 'mongoose';
import PortfolioItem from '../Models/PortfolioItem.js';
import Media from '../Models/Media.js';
import Client from '../Models/ClientSchema.js';
import { deleteSingleMediaDoc } from './mediaController.js';
import { renderFromMedia } from '../Services/portfolioRender.js';
import { PUBLIC_GATE, explainVisibility, readinessOf } from '../Services/portfolioVisibility.js';
import { revalidatePortfolio } from '../Services/revalidate.js';

const MAX_BULK = 500;
const MEDIA_FIELDS = 'status cdnUrl publicUrl mediaType imageVariants video fileSize originalFileName processing.lastError';

/** Adds `visibility: { public, reasons }` for the admin's chips. */
const withVisibility = (item) => ({ ...item, visibility: explainVisibility(item, item.media) });

/**
 * The bulk endpoint's `filter` used to be passed to Mongo as sent, so any
 * operator ($where, $expr, a regex on any field) reached the query. Only these
 * fields, with plain values or `$in` of plain values, are accepted now.
 */
const BULK_FILTER_FIELDS = new Set(['client', 'kind', 'status', 'clientStatus', 'eventGroup', 'isHero', 'tags', 'mediaReady']);
const isPlain = (v) => ['string', 'boolean', 'number'].includes(typeof v);
function safeBulkFilter(raw) {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
    const out = {};
    for (const [k, v] of Object.entries(raw)) {
        if (!BULK_FILTER_FIELDS.has(k)) return null;
        if (isPlain(v)) out[k] = v;
        else if (v && typeof v === 'object' && Object.keys(v).length === 1 && Array.isArray(v.$in) && v.$in.every(isPlain)) out[k] = { $in: v.$in };
        else return null;
    }
    if (out.client !== undefined) {
        if (!mongoose.isValidObjectId(out.client)) return null;
        out.client = new mongoose.Types.ObjectId(String(out.client));
    }
    return Object.keys(out).length ? out : null;
}

/**
 * Admin search clauses.
 *
 * Deliberately NOT `$text`: the app connects with `serverApi: { version: '1',
 * strict: true }`, and `$text` is not in MongoDB's Stable API — it is rejected
 * under apiStrict whatever indexes exist. Same escaped-regex approach as
 * Services/portfolioService.js, over the fields denormalised for it.
 */
const searchClauses = (q) => {
    const rx = new RegExp(String(q).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    return [{ tags: rx }, { clientNameText: rx }, { title: rx },
    { caption: rx }, { 'location.city': rx }, { 'location.state': rx }];
};

// renderFromMedia is imported from Services/portfolioRender.js — single source of
// truth shared by this controller, the backfill, and the worker.

// GET /api/admin/portfolio
export async function listPortfolio(req, res) {
    try {
        const {
            kind, client, tag, eventGroup, isHero, status,
            q, missingMedia, untagged,
            page = 1, limit = 40, sort = 'priority',
        } = req.query;

        const filter = {
            ...(kind ? { kind } : {}),
            ...(client ? { client } : {}),
            ...(tag ? { tags: { $in: String(tag).split(',').map((t) => t.trim()).filter(Boolean) } } : {}),
            ...(eventGroup ? { eventGroup: String(eventGroup).trim() } : {}),
            ...(isHero !== undefined ? { isHero: isHero === 'true' } : {}),
            ...(status ? { status } : {}),
            ...(missingMedia === 'true' ? { media: null } : {}),
            ...(untagged === 'true' ? { tags: { $size: 0 } } : {}),
            ...(q ? { $or: searchClauses(q) } : {}),
        };

        const sorts = {
            priority: { isHero: -1, heroPriority: -1, generalPriority: -1, _id: -1 },
            recent: { updatedAt: -1 },
            shootDate: { shootDate: -1, _id: -1 },
        };

        const lim = Math.min(200, parseInt(limit, 10) || 40);
        const [items, total] = await Promise.all([
            PortfolioItem.find(filter)
                .sort(sorts[sort] || sorts.priority)
                .skip((Math.max(1, parseInt(page, 10)) - 1) * lim)
                .limit(lim)
                .populate('client', 'clientName')
                .populate('media', MEDIA_FIELDS)
                .lean(),
            PortfolioItem.countDocuments(filter),
        ]);

        // Heal stale render: if Media is Ready but render is still empty
        // (race between worker sync and this read), re-compute inline and
        // fire-and-forget persist so future reads don't repeat.
        const staleIds = [];
        for (const item of items) {
            if (!item.render?.posterUrl && !item.render?.imageUrl && item.media?.status === 'Ready') {
                const fresh = renderFromMedia(item.media);
                // An item with its own poster keeps it; the auto frame is only a
                // fallback for items that have none.
                if (item.poster) delete fresh.posterUrl;
                item.render = { ...(item.render || {}), ...fresh };
                item.mediaReady = readinessOf(item, item.media.status);
                staleIds.push(item._id);
            }
        }
        if (staleIds.length) {
            Promise.allSettled(staleIds.map(id => {
                const item = items.find(i => String(i._id) === String(id));
                return PortfolioItem.updateOne({ _id: id }, { $set: { render: item.render, mediaReady: item.mediaReady } });
            })).then(() => { if (staleIds.length) revalidatePortfolio(); }).catch(() => { });
        }

        return res.status(200).json({
            items: items.map(withVisibility), total, page: parseInt(page, 10), limit: lim,
            hasMore: (parseInt(page, 10) - 1) * lim + items.length < total,
        });
    } catch (error) {
        console.error('listPortfolio error:', error);
        return res.status(500).json({ message: error.message });
    }
}

/**
 * POST /api/admin/portfolio — assign a Media asset to a client.
 *
 * Also sets Media.ownerType/ownerId. That deliberately does NOT go through the
 * generic media PATCH whitelist: ownership reassignment has to happen alongside
 * the PortfolioItem write, or an admin editing alt text could silently orphan a
 * live item from the films page.
 */
export async function assignToClient(req, res) {
    try {
        const {
            media: mediaObjectId, mediaId, client: clientId,
            kind, tags = [], eventGroup, shootDate, location = {},
            generalPriority = 0, isHero = false, heroPriority = 0, caption,
            credits = [], title, status,
        } = req.body || {};

        if (!clientId) return res.status(400).json({ message: 'client is required' });
        if (!mediaObjectId && !mediaId) return res.status(400).json({ message: 'media or mediaId is required' });

        const media = await Media.findOne(
            mediaObjectId ? { _id: mediaObjectId } : { mediaId },
        );
        if (!media) return res.status(404).json({ message: 'Media not found' });

        const clientDoc = await Client.findById(clientId).lean();
        if (!clientDoc) return res.status(404).json({ message: 'Client not found' });

        const resolvedKind = kind
            || (media.mediaType === 'Video' ? 'Video' : media.mediaType === 'Image' ? 'Photo' : null);
        if (!resolvedKind) {
            return res.status(400).json({ message: `Cannot use a ${media.mediaType} as portfolio content` });
        }

        // One asset, one placement — guarded by the sparse unique-ish byMedia index.
        const existing = await PortfolioItem.findOne({ media: media._id }).lean();
        if (existing) {
            return res.status(409).json({ message: 'This asset is already in the portfolio', existingItemId: existing._id });
        }

        const clientNameText = [clientDoc.clientName?.Bride, clientDoc.clientName?.Groom].filter(Boolean).join(' & ');

        // Explicit intent wins. Otherwise (D7): into a draft wedding the item is
        // meant to go live with the wedding; into a live wedding it waits hidden
        // until someone has reviewed it. Processing no longer forces Draft —
        // `mediaReady` keeps it off the site until the worker has finished, and
        // then it appears by itself.
        const clientStatus = clientDoc.status || 'Draft';
        const intent = status === 'Draft' || status === 'Published'
            ? status
            : (clientStatus === 'Published' ? 'Draft' : 'Published');
        const render = renderFromMedia(media);

        const item = await PortfolioItem.create({
            kind: resolvedKind,
            client: clientDoc._id,
            media: media._id,
            mediaId: media.mediaId,
            title: title || clientNameText,
            caption,
            credits,
            tags,
            eventGroup: eventGroup?.trim() || '',
            shootDate,
            location,
            generalPriority,
            isHero: resolvedKind === 'Video' ? Boolean(isHero) : false,
            heroPriority: resolvedKind === 'Video' ? heroPriority : 0,
            clientNameText,
            status: intent,
            clientStatus,
            mediaReady: readinessOf({ kind: resolvedKind, render }, media.status),
            render,
        });
        if (item.status === 'Published' && item.clientStatus === 'Published' && item.mediaReady) {
            item.publishedAt = new Date();
            await item.save();
            revalidatePortfolio();
        }

        await Media.updateOne({ _id: media._id }, {
            $set: {
                ownerType: 'Client',
                ownerId: String(clientDoc._id),
                ...(eventGroup !== undefined ? { eventGroup: eventGroup.trim() } : {})
            },
        });

        await item.populate('media', MEDIA_FIELDS);
        const plain = item.toObject();
        const visibility = explainVisibility(plain, plain.media);
        return res.status(201).json({ item: { ...plain, visibility }, visibility });
    } catch (error) {
        console.error('assignToClient error:', error);
        return res.status(500).json({ message: error.message });
    }
}

// PATCH /api/admin/portfolio/:id
export async function updatePortfolioItem(req, res) {
    try {
        const ALLOWED = ['tags', 'eventGroup', 'shootDate', 'location', 'generalPriority', 'isHero',
            'heroPriority', 'caption', 'title', 'status', 'credits'];
        const patch = {};
        for (const k of ALLOWED) if (req.body[k] !== undefined) patch[k] = req.body[k];

        const item = await PortfolioItem.findByIdAndUpdate(req.params.id, { $set: patch }, { new: true, runValidators: true })
            .populate('media', MEDIA_FIELDS).lean();
        if (!item) return res.status(404).json({ message: 'Portfolio item not found' });
        const visibility = explainVisibility(item, item.media);
        if (visibility.public && !item.publishedAt) {
            item.publishedAt = new Date();
            await PortfolioItem.updateOne({ _id: item._id }, { $set: { publishedAt: item.publishedAt } }, { timestamps: false });
        }
        revalidatePortfolio();
        return res.status(200).json({ item: { ...item, visibility }, visibility });
    } catch (error) {
        return res.status(400).json({ message: error.message });
    }
}

/**
 * PATCH /api/admin/portfolio/bulk — the curation primitive.
 *
 * `all: true` requires a matching `expectedCount`, so a mistyped filter cannot
 * silently rewrite the collection.
 */
export async function bulkUpdatePortfolio(req, res) {
    try {
        const { ids, filter: rawFilter, all, expectedCount, set = {}, tags = {}, shiftPriority } = req.body || {};

        let filter;
        if (Array.isArray(ids) && ids.length) {
            if (ids.length > MAX_BULK) return res.status(400).json({ message: `At most ${MAX_BULK} ids per call` });
            filter = { _id: { $in: ids.map((i) => new mongoose.Types.ObjectId(i)) } };
        } else if (all && rawFilter) {
            filter = safeBulkFilter(rawFilter);
            if (!filter) {
                return res.status(400).json({ message: `filter may use only ${[...BULK_FILTER_FIELDS].join(', ')}, with plain values or $in` });
            }
            const count = await PortfolioItem.countDocuments(filter);
            if (count !== expectedCount) {
                return res.status(409).json({ message: `Filter matches ${count} items, expected ${expectedCount}`, count });
            }
        } else {
            return res.status(400).json({ message: 'Provide ids[], or filter + all + expectedCount' });
        }

        const update = {};
        const ALLOWED_SET = ['isHero', 'heroPriority', 'generalPriority', 'status', 'eventGroup'];
        const $set = {};
        for (const k of ALLOWED_SET) if (set[k] !== undefined) $set[k] = set[k];
        if (Object.keys($set).length) update.$set = $set;
        if (tags.add?.length) update.$addToSet = { tags: { $each: tags.add } };
        if (tags.remove?.length) update.$pullAll = { tags: tags.remove };
        if (Number.isFinite(shiftPriority)) update.$inc = { generalPriority: shiftPriority };
        if (tags.replace) { update.$set = { ...(update.$set || {}), tags: tags.replace }; }

        if (!Object.keys(update).length) return res.status(400).json({ message: 'Nothing to change' });

        const result = await PortfolioItem.updateMany(filter, update);
        await PortfolioItem.updateMany({ ...filter, ...PUBLIC_GATE, publishedAt: null }, { $set: { publishedAt: new Date() } }, { timestamps: false });
        revalidatePortfolio();

        // What the admin needs to hear after "Publish": how many are live now,
        // and how many are meant to be but are waiting on the wedding or on
        // processing.
        const [nowPublic, waiting] = await Promise.all([
            PortfolioItem.countDocuments({ ...filter, ...PUBLIC_GATE }),
            PortfolioItem.countDocuments({ ...filter, status: 'Published', $nor: [PUBLIC_GATE] }),
        ]);
        return res.status(200).json({ matched: result.matchedCount, modified: result.modifiedCount, nowPublic, waiting });
    } catch (error) {
        console.error('bulkUpdatePortfolio error:', error);
        return res.status(500).json({ message: error.message });
    }
}

/**
 * POST /api/admin/portfolio/hero — the hero set IS this list.
 *
 * Expressed as a whole-set replacement rather than per-client append, which is
 * structurally why the old WebsiteSetting.heroVideos array could be wiped by
 * editing one client.
 */
export async function setHeroSet(req, res) {
    try {
        const { ids = [] } = req.body || {};
        if (!Array.isArray(ids)) return res.status(400).json({ message: 'ids must be an array' });
        const objIds = ids.map((i) => new mongoose.Types.ObjectId(i));

        await PortfolioItem.updateMany({ isHero: true, _id: { $nin: objIds } }, { $set: { isHero: false, heroPriority: 0 } });
        const ops = objIds.map((id, idx) => ({
            updateOne: { filter: { _id: id, kind: 'Video' }, update: { $set: { isHero: true, heroPriority: ids.length - idx } } },
        }));
        if (ops.length) await PortfolioItem.bulkWrite(ops, { ordered: false });
        revalidatePortfolio();

        return res.status(200).json({ heroCount: await PortfolioItem.countDocuments({ isHero: true }) });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
}

// DELETE /api/admin/portfolio/:id
// Query options:
//   purgeMedia=true -> deletes master R2 object, all imageVariants/renditions/posters, media doc, and portfolio item.
//   releaseMedia=true -> keeps media intact, unlinks client ownership (ownerType: 'System').
//   (default) -> removes portfolio placement, keeps media intact.
export async function removePortfolioItem(req, res) {
    try {
        const item = await PortfolioItem.findById(req.params.id);
        if (!item) return res.status(404).json({ message: 'Portfolio item not found' });

        if (req.query.purgeMedia === 'true' && item.media) {
            const media = await Media.findById(item.media);
            if (media) {
                await deleteSingleMediaDoc(media);
                await Media.deleteOne({ _id: media._id });
            }
        } else if (req.query.releaseMedia === 'true' && item.media) {
            await Media.updateOne({ _id: item.media }, { $set: { ownerType: 'System', ownerId: null } });
        }

        await PortfolioItem.deleteOne({ _id: item._id });
        revalidatePortfolio();
        return res.status(200).json({
            message: req.query.purgeMedia === 'true' ? 'Permanently purged from R2 and portfolio' : 'Removed from portfolio',
            id: item._id
        });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
}
