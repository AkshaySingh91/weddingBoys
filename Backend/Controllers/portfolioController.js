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

const MAX_BULK = 500;

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
                .populate('media', 'status cdnUrl publicUrl mediaType imageVariants video fileSize originalFileName')
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
                staleIds.push(item._id);
            }
        }
        if (staleIds.length) {
            Promise.allSettled(staleIds.map(id => {
                const item = items.find(i => String(i._id) === String(id));
                return PortfolioItem.updateOne({ _id: id }, { $set: { render: item.render } });
            })).catch(() => { });
        }

        return res.status(200).json({
            items, total, page: parseInt(page, 10), limit: lim,
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
            // An asset still being transcoded is not servable yet; the worker
            // publishes it when the renditions exist. A caller may also ask for
            // Draft explicitly — uploading inside a wedding creates the
            // placement immediately, but nothing should reach the public
            // gallery before someone has looked at it. Never let a caller force
            // Published onto an asset that is not Ready.
            status: media.status === 'Ready' ? (status === 'Draft' ? 'Draft' : 'Published') : 'Draft',
            render: renderFromMedia(media),
        });

        await Media.updateOne({ _id: media._id }, {
            $set: {
                ownerType: 'Client',
                ownerId: String(clientDoc._id),
                ...(eventGroup !== undefined ? { eventGroup: eventGroup.trim() } : {})
            },
        });

        await item.populate('media', 'status cdnUrl publicUrl mediaType imageVariants video fileSize originalFileName');
        return res.status(201).json({ item });
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

        const item = await PortfolioItem.findByIdAndUpdate(req.params.id, { $set: patch }, { new: true, runValidators: true });
        if (!item) return res.status(404).json({ message: 'Portfolio item not found' });
        return res.status(200).json({ item });
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
            filter = rawFilter;
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
        return res.status(200).json({ matched: result.matchedCount, modified: result.modifiedCount });
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
        return res.status(200).json({
            message: req.query.purgeMedia === 'true' ? 'Permanently purged from R2 and portfolio' : 'Removed from portfolio',
            id: item._id
        });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
}
