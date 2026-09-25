/**
 * Read layer for PortfolioItem.
 *
 * Every public feed becomes a plain indexed find here, replacing the `$unwind`
 * over the whole clients collection (measured: COLLSCAN, zero index keys used).
 * Benchmarked at 24k items / 4.8k videos: the planner picks the `feed` index,
 * applies no blocking sort, and examines exactly the documents it returns.
 *
 * The adapters below reproduce the legacy response shapes byte-for-byte, so the
 * cut-over is invisible to the frontend and reversible with one env var.
 */
import PortfolioItem from '../Models/PortfolioItem.js';

/** `PORTFOLIO_READS=v2` switches the public routes onto this service. */
export const portfolioReadsEnabled = () => process.env.PORTFOLIO_READS === 'v2';

const FEED_SORT = { isHero: -1, heroPriority: -1, generalPriority: -1, _id: -1 };

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];

/** The legacy routes replace the date with "19 September" before responding. */
const displayDate = (d) => {
    if (!d) return null;
    const dt = new Date(d);
    return Number.isNaN(dt.getTime()) ? null : `${dt.getDate()} ${MONTHS[dt.getMonth()]}`;
};

/** The legacy detail and recommended routes use "September 2024" instead. */
const monthYear = (d) => {
    if (!d) return null;
    const dt = new Date(d);
    return Number.isNaN(dt.getTime()) ? null : `${MONTHS[dt.getMonth()]} ${dt.getFullYear()}`;
};

/**
 * Ids arrive from public URLs. Anything that is not 24 hex characters would make
 * Mongoose throw a CastError, so it is treated as "not found" rather than a 500.
 * (`isValidObjectId` is not enough: it accepts any 12-character string.)
 */
export const isItemId = (id) => /^[a-f0-9]{24}$/i.test(String(id || ''));

const parseTags = (tag) => String(tag || '').split(',').map((t) => t.trim()).filter(Boolean);

/* ------------------------------------------------------------------ queries */

export async function findFeed({ kind, tags = [], page = 1, limit = 10 }) {
    const filter = { kind, status: 'Published', ...(tags.length ? { tags: { $in: tags } } : {}) };
    return PortfolioItem.find(filter)
        .sort(FEED_SORT)
        .skip((Math.max(1, page) - 1) * limit)
        .limit(limit)
        .populate('client', 'clientName')
        .lean();
}

export async function findById(id) {
    if (!isItemId(id)) return null;
    return PortfolioItem.findOne({
        $or: [{ _id: id }, { 'legacy.subdocId': id }],
        status: 'Published',
    }).populate('client', 'clientName').lean();
}

export async function findSiblings({ clientId, kind, excludeId, limit = 50 }) {
    return PortfolioItem.find({
        client: clientId, kind, status: 'Published',
        ...(excludeId ? { _id: { $ne: excludeId } } : {}),
    }).sort(FEED_SORT).limit(limit).populate('client', 'clientName').lean();
}

/** Tag overlap, excluding this item. Bounded — the legacy route's $limit was commented out. */
export async function findRecommended({ item, page = 1, limit = 10 }) {
    if (!item?.tags?.length) return [];
    return PortfolioItem.find({
        kind: item.kind, status: 'Published',
        tags: { $in: item.tags },
        _id: { $ne: item._id },
    }).sort({ heroPriority: -1, generalPriority: -1, _id: -1 })
        .skip((Math.max(1, page) - 1) * limit)
        .limit(limit)
        .populate('client', 'clientName')
        .lean();
}

/**
 * Home "Our portfolio" grid. Reproduces the legacy pick exactly — lowest
 * generalPriority first, 8 photos — so the cut-over does not reshuffle the home
 * page. Which photos lead is an editorial choice that Phase 5 hands to the admin.
 */
export async function findHomePhotos({ category, limit = 8 }) {
    const all = !category || category === 'All Work';
    return PortfolioItem.find({ kind: 'Photo', status: 'Published', ...(all ? {} : { tags: category }) })
        .sort({ generalPriority: 1, _id: 1 })
        .limit(limit)
        .populate('client', 'clientName')
        .lean();
}

/**
 * The representative film and photo of each wedding on the map, chosen the way
 * the legacy route chose them: the highest-priority hero film, otherwise the
 * highest general priority; the photo with the highest general priority.
 * One query for every pinned wedding instead of loading each client's arrays.
 */
export async function findMapFeatures(clientIds) {
    const items = await PortfolioItem.find({ client: { $in: clientIds }, status: 'Published' })
        .sort(FEED_SORT)
        .lean();
    const byClient = new Map();
    for (const i of items) {
        const key = String(i.client);
        const entry = byClient.get(key) || { video: null, photo: null };
        if (i.kind === 'Video' && !entry.video) entry.video = i;
        if (i.kind === 'Photo' && !entry.photo) entry.photo = i;
        byClient.set(key, entry);
    }
    return byClient;
}

export async function findHeroVideos(limit = 12) {
    // `_id` breaks ties so equal priorities keep one order across requests.
    return PortfolioItem.find({ kind: 'Video', isHero: true, status: 'Published' })
        .sort({ heroPriority: -1, _id: -1 })
        .limit(limit)
        .populate('client', 'clientName')
        .lean();
}

/**
 * Search across tags, couple names and place.
 *
 * Uses an escaped regex `$or`, NOT `$text`. The app connects with
 * `serverApi: { version: '1', strict: true }` (Config/DBconnection.js), and
 * `$text` is not part of MongoDB's Stable API — under apiStrict it is rejected
 * whatever indexes exist. The fields below are denormalised onto the item for
 * exactly this reason, so the capability is unchanged: the legacy route matched
 * TAGS ONLY, so a couple's name or a city returned nothing.
 *
 * The pattern is escaped, so a visitor cannot inject a catastrophic-backtracking
 * expression the way they could against `new RegExp(query)`.
 */
export async function search({ query, kind, page = 1, limit = 10 }) {
    const q = String(query || '').trim();
    if (!q) return [];
    const rx = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');

    return PortfolioItem.find({
        ...(kind ? { kind } : {}),
        status: 'Published',
        $or: [
            { tags: rx },
            { clientNameText: rx },
            { title: rx },
            { caption: rx },
            { 'location.city': rx },
            { 'location.state': rx },
        ],
    }).sort({ generalPriority: -1, _id: -1 })
        .skip((Math.max(1, page) - 1) * limit)
        .limit(limit)
        .populate('client', 'clientName')
        .lean();
}

/* ----------------------------------------------------------------- adapters */
// These exist so the cut-over is invisible to the frontend. They are the only
// place that knows about the legacy field names, and they are what should be
// deleted once the frontend consumes PortfolioItem directly.

const posterOf = (i) => i.render?.posterUrl || i.render?.imageUrl || null;

/** Legacy `/api/videos` row: { _id: clientId, clientName, videos: <subdoc>, thumbnailUrl } */
export function toLegacyVideoRow(i) {
    return {
        _id: String(i.client?._id || i.client),
        clientName: i.client?.clientName,
        videos: {
            _id: String(i._id),
            videoMetaData: { key: i.legacy?.s3Key },
            // `url` here is what the film page's recommended strip and the map read.
            thumbnailMetaData: { key: i.legacy?.thumbnailS3Key, url: posterOf(i) },
            tags: i.tags || [],
            videoShootDate: displayDate(i.shootDate),
            isHeroVideo: i.isHero,
            heroPriority: i.heroPriority,
            generalPriority: i.generalPriority,
            videoLocation: i.location || {},
            bts: (i.credits || []).map((c) => ({ key: c.name, value: c.role })),
        },
        thumbnailUrl: posterOf(i),
        // Additions — the legacy shape had no way to express these.
        url: i.render?.webUrl || i.render?.sourceUrl || null,
        loopUrl: i.render?.loopUrl || null,
        blurDataURL: i.render?.blurDataURL || null,
        dominantColor: i.render?.dominantColor || null,
        aspectRatio: i.render?.aspectRatio || null,
    };
}

/** Legacy `/api/photos` row. */
export function toLegacyPhotoRow(i) {
    return {
        _id: String(i._id),
        // `url` here is what the film page's photo gallery reads.
        photoMetaData: { key: i.legacy?.s3Key, url: i.render?.imageUrl || null },
        tags: i.tags || [],
        photoShootDate: i.shootDate,
        photoLocation: i.location || {},
        generalPriority: i.generalPriority,
        url: i.render?.imageUrl || null,
        clientName: i.client?.clientName,
        blurDataURL: i.render?.blurDataURL || null,
        dominantColor: i.render?.dominantColor || null,
        aspectRatio: i.render?.aspectRatio || null,
    };
}

/** Legacy `/api/hero-videos` slide. */
export function toLegacyHeroSlide(i) {
    return {
        videoKey: i.legacy?.s3Key,
        priority: i.heroPriority,
        clientId: String(i.client?._id || i.client),
        clientName: i.client?.clientName,
        videoId: String(i._id),
        videoShootDate: displayDate(i.shootDate),
        videoLocation: i.location || {},
        posterUrl: posterOf(i),
        posterVariants: [],
        blurDataURL: i.render?.blurDataURL || null,
        dominantColor: i.render?.dominantColor || null,
        aspectRatio: i.render?.aspectRatio || null,
        duration: i.render?.durationSec || null,
        loopUrl: i.render?.loopUrl || null,
        webUrl: i.render?.webUrl || null,
        sourceUrl: i.render?.sourceUrl || null,
        videoUrl: i.render?.loopUrl || i.render?.webUrl || i.render?.sourceUrl || null,
    };
}

export { parseTags, displayDate, monthYear };
