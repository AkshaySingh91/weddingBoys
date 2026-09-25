/**
 * Who can see a portfolio item — one rule, used by every public read.
 *
 * An item is public when all three hold:
 *   status       'Published'  the admin has not hidden it        (admin intent)
 *   clientStatus 'Published'  its wedding is published            (copied here)
 *   mediaReady   true         its asset finished processing and   (maintained here)
 *                             there is something to show
 *
 * The two copies exist so the rule is a single indexed match (`publicFeed`).
 * This module is their only writer:
 *   setClientStatus  wedding published / unpublished / archived
 *   markMediaReady   an asset (re)processed — the worker, render sync, backfill
 *   markMediaGone    an asset deleted from the media library
 *
 * Changing the wedding never rewrites item `status`. That is what makes
 * unpublish → republish exact: what was hidden on purpose stays hidden.
 */
import mongoose from 'mongoose';
import PortfolioItem from '../Models/PortfolioItem.js';
import Client from '../Models/ClientSchema.js';
import Media from '../Models/Media.js';
import { revalidatePortfolio } from './revalidate.js';

export const PUBLIC_GATE = Object.freeze({ status: 'Published', clientStatus: 'Published', mediaReady: true });

const PENDING = new Set(['Draft', 'Uploading', 'Processing']);

/** There is something to show: a photo with an image, a film with a video and a poster. */
export function hasRender(kind, render = {}) {
    if (kind === 'Photo') return Boolean(render.imageUrl);
    return Boolean((render.webUrl || render.sourceUrl || render.loopUrl) && render.posterUrl);
}

/** mediaReady for an item, from its render and its Media's status. */
export const readinessOf = (item, mediaStatus) => mediaStatus === 'Ready' && hasRender(item.kind, item.render);

/**
 * Why an item is or is not public, for the admin.
 * `media` is the item's Media (populated or passed in); without it the media
 * reason falls back to "processing".
 */
export function explainVisibility(item, media = item.media) {
    const reasons = [];
    if (item.status !== 'Published') reasons.push('hidden-by-admin');
    if (item.clientStatus === 'Archived') reasons.push('wedding-archived');
    else if (item.clientStatus !== 'Published') reasons.push('wedding-draft');
    if (!item.mediaReady) {
        const m = media && typeof media === 'object' ? media : null;
        if (m && !PENDING.has(m.status) && m.status !== 'Ready') reasons.push('asset-missing');
        else if (m?.processing?.lastError) reasons.push('failed');
        else if (!m || PENDING.has(m.status)) reasons.push('processing');
        else reasons.push('asset-missing'); // Ready but nothing to show, e.g. a film with no poster
    }
    return { public: reasons.length === 0, reasons };
}

/** Stamp `publishedAt` on items that just became public for the first time. */
async function stampFirstPublished(filter) {
    await PortfolioItem.updateMany(
        { ...filter, ...PUBLIC_GATE, publishedAt: null },
        { $set: { publishedAt: new Date() } },
        { timestamps: false },
    );
}

/**
 * Set a wedding's status and copy it onto every item. Items keep their own
 * status. Returns how many items are public afterwards.
 */
export async function setClientStatus(clientId, status) {
    const now = new Date();
    const client = await Client.findByIdAndUpdate(clientId, {
        $set: {
            status,
            ...(status === 'Archived' ? { archivedAt: now } : {}),
        },
    }, { new: true });
    if (!client) return null;
    if (status === 'Published' && !client.publishedAt) {
        client.publishedAt = now;
        await client.save();
    }

    // timestamps:false — the admin's "recently edited" list is about edits to
    // the item itself, not its wedding changing state.
    await PortfolioItem.updateMany({ client: client._id }, { $set: { clientStatus: status } }, { timestamps: false });
    await stampFirstPublished({ client: client._id });
    revalidatePortfolio();
    return {
        client,
        publicItems: await PortfolioItem.countDocuments({ client: client._id, ...PUBLIC_GATE }),
    };
}

/**
 * Recompute mediaReady for every item that shows `media`, as a file or as a
 * custom poster. Called after the render cache is refreshed.
 * Returns the ids of items that became public.
 */
export async function markMediaReady(media) {
    // Archiving is markMediaGone's decision (the admin deleted it). A sync that
    // merely re-reads an archived record must not hide what is still served.
    if (media.status === 'Archived') return [];
    const items = await PortfolioItem.find({ $or: [{ media: media._id }, { poster: media._id }] })
        .select('kind render media mediaReady status clientStatus')
        .lean();
    if (!items.length) return [];

    // A poster's own processing does not decide readiness; the item's file does.
    const otherIds = items.filter((i) => String(i.media) !== String(media._id)).map((i) => i.media);
    const statusById = new Map([[String(media._id), media.status]]);
    if (otherIds.length) {
        for (const m of await Media.find({ _id: { $in: otherIds } }).select('status').lean()) statusById.set(String(m._id), m.status);
    }

    const ops = [];
    const nowPublic = [];
    let touchesPublic = false;
    for (const i of items) {
        const ready = readinessOf(i, statusById.get(String(i.media)));
        const intendedPublic = i.status === 'Published' && i.clientStatus === 'Published';
        if (intendedPublic && (ready || i.mediaReady)) touchesPublic = true; // new URLs or newly shown
        if (ready === Boolean(i.mediaReady)) continue;
        ops.push({ updateOne: { filter: { _id: i._id }, update: { $set: { mediaReady: ready } }, timestamps: false } });
        if (ready && intendedPublic) nowPublic.push(i._id);
    }
    if (ops.length) await PortfolioItem.bulkWrite(ops, { ordered: false });
    if (nowPublic.length) await stampFirstPublished({ _id: { $in: nowPublic } });
    if (touchesPublic) revalidatePortfolio();
    return nowPublic;
}

/**
 * The asset's files are gone. Items showing it as their file stop being
 * public; items using it only as a custom poster fall back to their own
 * video's frame. Returns the affected item ids.
 */
export async function markMediaGone(mediaId) {
    const id = new mongoose.Types.ObjectId(String(mediaId));
    const asFile = await PortfolioItem.find({ media: id }).select('_id').lean();
    await PortfolioItem.updateMany({ media: id }, { $set: { mediaReady: false } }, { timestamps: false });

    const asPoster = await PortfolioItem.find({ poster: id }).select('media kind render').lean();
    for (const item of asPoster) {
        const own = await Media.findById(item.media).select('video.posterUrl status').lean();
        const render = { ...(item.render || {}), posterUrl: own?.video?.posterUrl };
        await PortfolioItem.updateOne({ _id: item._id }, {
            $set: {
                poster: null, posterMediaId: null, 'render.posterUrl': own?.video?.posterUrl ?? null,
                mediaReady: readinessOf({ kind: item.kind, render }, own?.status),
            },
        }, { timestamps: false });
    }
    if (asFile.length || asPoster.length) revalidatePortfolio();
    return [...asFile, ...asPoster].map((i) => i._id);
}

/** Every item that uses a Media, for the "in use" warning before deleting it. */
export async function placementsOf(mediaIds) {
    const ids = mediaIds.map((m) => new mongoose.Types.ObjectId(String(m)));
    return PortfolioItem.find({ $or: [{ media: { $in: ids } }, { poster: { $in: ids } }] })
        .select('kind media poster status clientStatus mediaReady client')
        .populate('client', 'clientName')
        .lean();
}
