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
import { resolveTagParam, tagFieldsFor, TaxonomyError, loadTaxonomy, validateTagIds, mirrorsFor } from '../Services/taxonomy.js';
import { locationFrom } from '../Services/weddingProfile.js';
import Collection from '../Models/Collection.js';
import { HERO_KEY } from '../Services/collectionResolver.js';
import { lookupVideo, ExternalVideoError } from '../Services/externalVideo.js';

/** New items join the end of their wedding's order. */
const nextOrder = async (clientId) => ((await PortfolioItem.findOne({ client: clientId }).sort({ order: -1 }).select('order').lean())?.order ?? -1) + 1;

const MAX_BULK = 500;
const MEDIA_FIELDS = 'status cdnUrl publicUrl mediaType imageVariants video fileSize originalFileName processing.lastError';

/**
 * Tags are written as `tagIds` only (plan phase 3); the `tags` / `eventGroup`
 * strings are copies the server derives. A caller still sending the strings
 * is a screen that was missed, so it gets a clear 400 instead of a silent drop.
 */
function refuseTagStrings(body) {
    const sent = ['tags', 'eventGroup'].filter((k) => body?.[k] !== undefined && !(Array.isArray(body[k]) && !body[k].length) && body[k] !== '');
    return sent.length ? `Send tags as tagIds (ids from /api/admin/taxonomy), not ${sent.join(' / ')}` : null;
}
const taxonomyFail = (res, error) => res.status(error.status || 400).json({ message: error.message, ...(error.details || {}) });

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
            ...(tag ? { tagIds: { $in: await resolveTagParam(String(tag).split(',')) } } : {}),
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
            // The story page's order (the admin's arrangement).
            order: { order: 1, shootDate: 1, _id: 1 },
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
            kind, tagIds = [], shootDate, location = {},
            generalPriority = 0, isHero = false, heroPriority = 0, caption,
            credits = [], title, status,
        } = req.body || {};

        if (!clientId) return res.status(400).json({ message: 'client is required' });
        if (!mediaObjectId && !mediaId) return res.status(400).json({ message: 'media or mediaId is required' });
        const stringTags = refuseTagStrings(req.body);
        if (stringTags) return res.status(400).json({ message: stringTags });

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
        let tagFields;
        try { tagFields = await tagFieldsFor(tagIds, resolvedKind); } catch (e) { if (e instanceof TaxonomyError) return taxonomyFail(res, e); throw e; }

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
            ...tagFields,
            shootDate,
            location: locationFrom(location),
            order: await nextOrder(clientDoc._id),
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
                ...(tagFields.eventGroup ? { eventGroup: tagFields.eventGroup } : {}),
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
        const ALLOWED = ['shootDate', 'location', 'generalPriority', 'isHero',
            'heroPriority', 'caption', 'title', 'status', 'credits', 'spotlight'];
        const patch = {};
        for (const k of ALLOWED) if (req.body[k] !== undefined) patch[k] = req.body[k];
        const stringTags = refuseTagStrings(req.body);
        if (stringTags) return res.status(400).json({ message: stringTags });
        if (patch.location !== undefined) patch.location = locationFrom(patch.location || {});
        if (req.body.tagIds !== undefined) {
            if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ message: 'Portfolio item not found' });
            const current = await PortfolioItem.findById(req.params.id).select('kind').lean();
            if (!current) return res.status(404).json({ message: 'Portfolio item not found' });
            try { Object.assign(patch, await tagFieldsFor(req.body.tagIds, current.kind)); } catch (e) { if (e instanceof TaxonomyError) return taxonomyFail(res, e); throw e; }
        }

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
        const { ids, filter: rawFilter, all, expectedCount, set = {}, tagIds: tagOps, shiftPriority } = req.body || {};
        if (req.body?.tags !== undefined || set.eventGroup !== undefined) {
            return res.status(400).json({ message: 'Change tags with tagIds: { add, remove, replace } (ids from /api/admin/taxonomy)' });
        }

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
        const ALLOWED_SET = ['isHero', 'heroPriority', 'generalPriority', 'status'];
        const $set = {};
        for (const k of ALLOWED_SET) if (set[k] !== undefined) $set[k] = set[k];
        if (Object.keys($set).length) update.$set = $set;
        if (Number.isFinite(shiftPriority)) update.$inc = { generalPriority: shiftPriority };
        const hasTagOps = tagOps && (tagOps.add?.length || tagOps.remove?.length || Array.isArray(tagOps.replace));

        if (!Object.keys(update).length && !hasTagOps) return res.status(400).json({ message: 'Nothing to change' });

        let tagResult = { changed: 0, failures: [] };
        if (hasTagOps) {
            try { tagResult = await applyBulkTagOps(filter, tagOps); } catch (e) { if (e instanceof TaxonomyError) return taxonomyFail(res, e); throw e; }
        }
        const result = Object.keys(update).length
            ? await PortfolioItem.updateMany(filter, update)
            : { matchedCount: await PortfolioItem.countDocuments(filter), modifiedCount: tagResult.changed };
        await PortfolioItem.updateMany({ ...filter, ...PUBLIC_GATE, publishedAt: null }, { $set: { publishedAt: new Date() } }, { timestamps: false });
        revalidatePortfolio();

        // What the admin needs to hear after "Publish": how many are live now,
        // and how many are meant to be but are waiting on the wedding or on
        // processing.
        const [nowPublic, waiting] = await Promise.all([
            PortfolioItem.countDocuments({ ...filter, ...PUBLIC_GATE }),
            PortfolioItem.countDocuments({ ...filter, status: 'Published', $nor: [PUBLIC_GATE] }),
        ]);
        return res.status(200).json({
            matched: result.matchedCount, modified: Math.max(result.modifiedCount, tagResult.changed),
            nowPublic, waiting,
            ...(tagResult.failures.length ? { tagFailures: tagResult.failures } : {}),
        });
    } catch (error) {
        console.error('bulkUpdatePortfolio error:', error);
        return res.status(500).json({ message: error.message });
    }
}

/**
 * POST /api/admin/portfolio/external — a film hosted on YouTube or Vimeo (D8).
 * { client, url, tagIds?, shootDate?, location?, title?, caption?, status? }
 *
 * The server looks the video up (title, poster, Vimeo duration). There is no
 * file to process, so the item is ready at once and follows the same publish
 * rules as an upload.
 */
export async function addExternalFilm(req, res) {
    try {
        const { client: clientId, url, tagIds = [], shootDate, location, title, caption, status } = req.body || {};
        if (!mongoose.isValidObjectId(clientId)) return res.status(400).json({ message: 'client is required' });
        const clientDoc = await Client.findById(clientId).lean();
        if (!clientDoc) return res.status(404).json({ message: 'Client not found' });

        let video;
        try { video = await lookupVideo(url); } catch (e) { if (e instanceof ExternalVideoError) return res.status(e.status).json({ message: e.message }); throw e; }
        const dup = await PortfolioItem.findOne({ client: clientId, 'external.provider': video.provider, 'external.videoId': video.videoId }).select('_id').lean();
        if (dup) return res.status(409).json({ message: 'This video is already in the wedding', existingItemId: dup._id });

        let tagFields;
        try { tagFields = await tagFieldsFor(tagIds, 'Video'); } catch (e) { if (e instanceof TaxonomyError) return taxonomyFail(res, e); throw e; }
        const clientNameText = [clientDoc.clientName?.Bride, clientDoc.clientName?.Groom].filter(Boolean).join(' & ');
        const clientStatus = clientDoc.status || 'Draft';
        const render = {
            posterUrl: video.posterUrl,
            embedUrl: video.embedUrl,
            aspectRatio: video.width && video.height ? +(video.width / video.height).toFixed(4) : 16 / 9,
            durationSec: video.durationSec,
            syncedAt: new Date(),
        };
        const item = await PortfolioItem.create({
            kind: 'Video',
            client: clientDoc._id,
            external: {
                provider: video.provider, url: video.url, videoId: video.videoId,
                title: video.title, posterUrl: video.posterUrl, durationSec: video.durationSec,
            },
            title: title || clientNameText,
            caption: caption ?? video.title,
            ...tagFields,
            shootDate,
            location: locationFrom(location),
            order: await nextOrder(clientDoc._id),
            clientNameText,
            status: status === 'Draft' || status === 'Published' ? status : (clientStatus === 'Published' ? 'Draft' : 'Published'),
            clientStatus,
            mediaReady: Boolean(render.posterUrl),
            render,
        });
        const visibility = explainVisibility(item.toObject(), { status: 'Ready' });
        if (visibility.public) {
            item.publishedAt = new Date();
            await item.save();
            revalidatePortfolio();
        }
        return res.status(201).json({ item: { ...item.toObject(), visibility }, visibility });
    } catch (error) {
        console.error('addExternalFilm error:', error);
        return res.status(500).json({ message: error.message });
    }
}

/** The image URL to use as a poster: a ~1280px variant when there is one. */
const posterUrlOf = (media) => {
    const variants = (media.imageVariants || []).filter((v) => v.url).sort((a, b) => a.width - b.width);
    return (variants.find((v) => v.width >= 1280) || variants[variants.length - 1])?.url || media.cdnUrl || media.publicUrl;
};

/**
 * POST /api/admin/portfolio/:id/poster { media } — a chosen poster for a film.
 * The image keeps its own immutable key, so the CDN can never serve the old
 * frame for the new poster. DELETE goes back to the film's own frame.
 */
export async function setPoster(req, res) {
    try {
        if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ message: 'Portfolio item not found' });
        const item = await PortfolioItem.findById(req.params.id);
        if (!item) return res.status(404).json({ message: 'Portfolio item not found' });
        if (item.kind !== 'Video') return res.status(400).json({ message: 'Only films have posters' });
        const poster = await Media.findOne(mongoose.isValidObjectId(req.body?.media) ? { _id: req.body.media } : { mediaId: req.body?.media });
        if (!poster) return res.status(404).json({ message: 'Media not found' });
        if (poster.mediaType !== 'Image') return res.status(400).json({ message: 'A poster must be an image' });
        if (poster.status !== 'Ready') return res.status(409).json({ message: 'That image is still processing; try again in a moment' });

        item.poster = poster._id;
        item.posterMediaId = poster.mediaId;
        item.render = { ...(item.render?.toObject?.() || item.render || {}), posterUrl: posterUrlOf(poster) };
        // A film with no frame of its own becomes showable once it has a poster.
        const own = item.media ? await Media.findById(item.media).select('status').lean() : null;
        item.mediaReady = item.external?.provider ? true : readinessOf(item, own?.status);
        await item.save();
        revalidatePortfolio();
        return res.status(200).json({ item });
    } catch (error) {
        console.error('setPoster error:', error);
        return res.status(500).json({ message: error.message });
    }
}

export async function removePoster(req, res) {
    try {
        if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ message: 'Portfolio item not found' });
        const item = await PortfolioItem.findById(req.params.id);
        if (!item) return res.status(404).json({ message: 'Portfolio item not found' });
        const own = item.media ? await Media.findById(item.media).select('video.posterUrl status').lean() : null;
        const fallback = own?.video?.posterUrl || item.external?.posterUrl || null;
        item.poster = null;
        item.posterMediaId = null;
        item.render = { ...(item.render?.toObject?.() || item.render || {}), posterUrl: fallback };
        item.mediaReady = item.external?.provider ? Boolean(fallback) : readinessOf(item, own?.status);
        await item.save();
        revalidatePortfolio();
        return res.status(200).json({ item });
    } catch (error) {
        console.error('removePoster error:', error);
        return res.status(500).json({ message: error.message });
    }
}

/**
 * POST /api/admin/portfolio/:id/replace { media } — swap the file, keeping the
 * item (its tags, order, place in rows, URL). A file that is still processing
 * waits in `pendingMedia`; the live item keeps the old file until the worker
 * swaps the new one in (Services/portfolioRender.js), so nothing breaks midway.
 */
export async function replaceFile(req, res) {
    try {
        if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ message: 'Portfolio item not found' });
        const item = await PortfolioItem.findById(req.params.id);
        if (!item) return res.status(404).json({ message: 'Portfolio item not found' });
        if (item.external?.provider) return res.status(400).json({ message: 'This film is a YouTube / Vimeo link; add the new link instead' });
        const media = await Media.findOne(mongoose.isValidObjectId(req.body?.media) ? { _id: req.body.media } : { mediaId: req.body?.media });
        if (!media) return res.status(404).json({ message: 'Media not found' });
        const kind = media.mediaType === 'Video' ? 'Video' : media.mediaType === 'Image' ? 'Photo' : null;
        if (kind !== item.kind) return res.status(400).json({ message: `Replace a ${item.kind === 'Video' ? 'film with a video' : 'photo with an image'}` });
        if (String(media._id) === String(item.media)) return res.status(400).json({ message: 'That is already this item\'s file' });
        const other = await PortfolioItem.findOne({ _id: { $ne: item._id }, $or: [{ media: media._id }, { pendingMedia: media._id }] }).select('_id').lean();
        if (other) return res.status(409).json({ message: 'That file is already used by another item', existingItemId: other._id });

        await Media.updateOne({ _id: media._id }, { $set: { ownerType: 'Client', ownerId: String(item.client) } });
        if (media.status !== 'Ready') {
            item.pendingMedia = media._id;
            await item.save();
            return res.status(202).json({ item, pending: true, message: 'The new file replaces the old one when it has finished processing' });
        }
        const render = renderFromMedia(media);
        if (item.poster) render.posterUrl = item.render?.posterUrl;
        item.media = media._id;
        item.mediaId = media.mediaId;
        item.pendingMedia = undefined;
        item.render = render;
        item.mediaReady = readinessOf({ kind: item.kind, render }, media.status);
        await item.save();
        revalidatePortfolio();
        return res.status(200).json({ item, pending: false });
    } catch (error) {
        console.error('replaceFile error:', error);
        return res.status(500).json({ message: error.message });
    }
}

/**
 * Bulk tag edits, item by item, because the rules are per item: a tag must fit
 * the item's kind, and adding to a one-per-item group (Ceremony, Film type)
 * REPLACES the item's current tag in that group instead of adding a second.
 * Items a tag cannot apply to are skipped and reported, not failed as a batch.
 */
async function applyBulkTagOps(filter, { add = [], remove = [], replace } = {}) {
    const all = [...add, ...remove, ...(Array.isArray(replace) ? replace : [])];
    // Each id must exist. One at a time: together they may legitimately name two
    // ceremonies (replace one, add another); the per-item check below decides.
    for (const id of new Set(all.map(String))) await validateTagIds([id], null);
    const tax = await loadTaxonomy();
    const groupOf = (id) => String(tax.tagById.get(String(id))?.group);
    const singleGroups = new Set(tax.groups.filter((g) => g.cardinality === 'single').map((g) => String(g._id)));

    const items = await PortfolioItem.find(filter).select('kind tagIds').limit(MAX_BULK + 1).lean();
    if (items.length > MAX_BULK) throw new TaxonomyError(400, `Tag edits apply to at most ${MAX_BULK} items at a time`);

    const ops = [];
    const failures = [];
    for (const item of items) {
        let next = Array.isArray(replace) ? replace.map(String) : (item.tagIds || []).map(String);
        next = next.filter((id) => !remove.map(String).includes(id));
        for (const id of add.map(String)) {
            const g = groupOf(id);
            if (singleGroups.has(g)) next = next.filter((x) => groupOf(x) !== g);
            if (!next.includes(id)) next.push(id);
        }
        if (JSON.stringify(next) === JSON.stringify((item.tagIds || []).map(String))) continue;
        try {
            const tagIds = await validateTagIds(next, item.kind);
            ops.push({ updateOne: { filter: { _id: item._id }, update: { $set: { tagIds, ...mirrorsFor(tagIds, tax) } } } });
        } catch (e) {
            if (!(e instanceof TaxonomyError)) throw e;
            failures.push({ itemId: item._id, message: e.message });
        }
    }
    if (ops.length) await PortfolioItem.bulkWrite(ops, { ordered: false });
    return { changed: ops.length, failures };
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
        // The hero is the `home-hero` collection: the list becomes its pins, in order.
        await Collection.updateOne({ key: HERO_KEY }, { $set: { pinned: objIds } });
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
        await Collection.updateMany({}, { $pull: { pinned: item._id, hidden: item._id } });
        revalidatePortfolio();
        return res.status(200).json({
            message: req.query.purgeMedia === 'true' ? 'Permanently purged from R2 and portfolio' : 'Removed from portfolio',
            id: item._id
        });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
}
