import { pagination } from '../Utils/pagination.js';
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
import Client from '../Models/ClientSchema.js';
import { PUBLIC_GATE } from './portfolioVisibility.js';
import { resolveTagParam, loadTaxonomy } from './taxonomy.js';

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

// Wedding fields a photo or film inherits when it was uploaded without its own.
// Location and date are entered once per wedding in the admin; without this the
// detail pages showed neither for any item uploaded in bulk.
const CLIENT_FIELDS = 'clientName location celebrationDates weddingDate';
const hasPlace = (l) => Boolean(l && (l.city || l.venue || l.state));
/** The item's own location, or its wedding's. */
export const placeFor = (i) => (hasPlace(i.location) ? i.location : (i.client?.location || {}));
/** The item's shoot date, or its wedding's first day. */
export const dateFor = (i) => i.shootDate || i.client?.celebrationDates?.startDate || i.client?.weddingDate || null;

/**
 * Ids arrive from public URLs. Anything that is not 24 hex characters would make
 * Mongoose throw a CastError, so it is treated as "not found" rather than a 500.
 * (`isValidObjectId` is not enough: it accepts any 12-character string.)
 */
export const isItemId = (id) => /^[a-f0-9]{24}$/i.test(String(id || ''));

const parseTags = (tag) => String(tag || '').split(',').map((t) => t.trim()).filter(Boolean);

/* ------------------------------------------------------------------ queries */

/**
 * Tag filters match by tag id (Services/taxonomy.js): a label, slug or old name
 * all find the same films, so a renamed or merged tag keeps its rows.
 *
 * Several values: OR within a category, AND across categories (plan phase 6).
 * `Beach,Classic` (both themes) is Beach OR Classic; `Pre-Wedding,Beach` is
 * Pre-Wedding AND Beach. It used to be OR for everything, so each filter
 * added on /allfilms WIDENED the results. A value that names no tag matches
 * nothing, as the exact string match did.
 */
async function tagFilter(values) {
    if (!values?.length) return {};
    const tax = await loadTaxonomy();
    const clauses = new Map(); // the categories a value spans → its tag ids
    for (const v of values) {
        const ids = await resolveTagParam([v]);
        if (!ids.length) return null;
        const groups = [...new Set(ids.map((id) => String(tax.tagById.get(String(id))?.group)))].sort().join('|');
        if (!clauses.has(groups)) clauses.set(groups, new Map());
        ids.forEach((id) => clauses.get(groups).set(String(id), id));
    }
    const parts = [...clauses.values()].map((ids) => ({ tagIds: { $in: [...ids.values()] } }));
    return parts.length === 1 ? parts[0] : { $and: parts };
}

/** A named row sort (Services/collectionResolver.js), else the legacy feed order. */
const feedSort = async (sort) => {
    if (!sort) return FEED_SORT;
    const { SORTS } = await import('./collectionResolver.js');
    return SORTS[sort] || FEED_SORT;
};

export async function findFeed({ kind, tags = [], page = 1, limit = 10, sort }) {
    ({ page, limit } = pagination({ page, limit }, 10));
    const byTag = await tagFilter(tags);
    if (!byTag) return [];
    const filter = { kind, ...PUBLIC_GATE, ...byTag };
    return PortfolioItem.find(filter)
        .sort(await feedSort(sort))
        .skip((Math.max(1, page) - 1) * limit)
        .limit(limit)
        .populate('client', CLIENT_FIELDS)
        .lean();
}

export async function findFeedWithTotal({ kind, tags = [], page = 1, limit = 12, sort }) {
    ({ page, limit } = pagination({ page, limit }, 12));
    const byTag = await tagFilter(tags);
    if (!byTag) return { items: [], total: 0 };
    const filter = { kind, ...PUBLIC_GATE, ...byTag };
    const safePage = Math.max(1, page);
    const safeLimit = Math.max(1, limit);
    const [items, total] = await Promise.all([
        PortfolioItem.find(filter)
            .sort(await feedSort(sort))
            .skip((safePage - 1) * safeLimit)
            .limit(safeLimit)
            .populate('client', CLIENT_FIELDS)
            .lean(),
        PortfolioItem.countDocuments(filter),
    ]);
    return { items, total };
}


export async function findById(id) {
    if (!isItemId(id)) return null;
    return PortfolioItem.findOne({
        $or: [{ _id: id }, { 'legacy.subdocId': id }],
        ...PUBLIC_GATE,
    }).populate('client', CLIENT_FIELDS).lean();
}

export async function findSiblings({ clientId, kind, excludeId, limit = 50 }) {
    return PortfolioItem.find({
        client: clientId, kind, ...PUBLIC_GATE,
        ...(excludeId ? { _id: { $ne: excludeId } } : {}),
    }).sort(FEED_SORT).limit(limit).populate('client', CLIENT_FIELDS).lean();
}

/** Tag overlap, excluding this item. Bounded — the legacy route's $limit was commented out. */
export async function findRecommended({ item, page = 1, limit = 10 }) {
    ({ page, limit } = pagination({ page, limit }, 10));
    if (!item?.tagIds?.length) return [];
    return PortfolioItem.find({
        kind: item.kind, ...PUBLIC_GATE,
        tagIds: { $in: item.tagIds },
        _id: { $ne: item._id },
    }).sort({ heroPriority: -1, generalPriority: -1, _id: -1 })
        .skip((Math.max(1, page) - 1) * limit)
        .limit(limit)
        .populate('client', CLIENT_FIELDS)
        .lean();
}

/**
 * Home "Our portfolio" grid. Reproduces the legacy pick exactly — lowest
 * generalPriority first, 8 photos — so the cut-over does not reshuffle the home
 * page. Which photos lead is an editorial choice that Phase 5 hands to the admin.
 */
export async function findHomePhotos({ category, limit = 8 }) {
    const all = !category || category === 'All Work';
    const byTag = all ? {} : await tagFilter([category]);
    if (!byTag) return [];
    return PortfolioItem.find({ kind: 'Photo', ...PUBLIC_GATE, ...byTag })
        .sort({ generalPriority: 1, _id: 1 })
        .limit(limit)
        .populate('client', CLIENT_FIELDS)
        .lean();
}

/**
 * The representative film and photo of each wedding on the map, chosen the way
 * the legacy route chose them: the highest-priority hero film, otherwise the
 * highest general priority; the photo with the highest general priority.
 * One query for every pinned wedding instead of loading each client's arrays.
 */
export async function findMapFeatures(clientIds) {
    const items = await PortfolioItem.find({ client: { $in: clientIds }, ...PUBLIC_GATE })
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

/**
 * The hero carousel. Once the `home-hero` collection exists
 * (scripts/migrateRowsToCollections.js) it IS the hero: its pins in order, then
 * its rule if one is set. Until then, the items flagged isHero.
 */
export async function findHeroVideos(limit = 12) {
    const { default: Collection } = await import('../Models/Collection.js');
    const { resolveCollection, HERO_KEY } = await import('./collectionResolver.js');
    const hero = await Collection.findOne({ key: HERO_KEY, status: 'Published' }).lean();
    if (hero) return (await resolveCollection(hero)).items;
    return findHeroByFlag(limit);
}

async function findHeroByFlag(limit) {
    // `_id` breaks ties so equal priorities keep one order across requests.
    return PortfolioItem.find({ kind: 'Video', isHero: true, ...PUBLIC_GATE })
        .sort({ heroPriority: -1, _id: -1 })
        .limit(limit)
        .populate('client', CLIENT_FIELDS)
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
    ({ page, limit } = pagination({ page, limit }, 10));
    const q = String(query || '').trim();
    if (!q) return [];
    const rx = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    // A search that names a tag, even by an old name, also finds its items.
    const tagIds = await resolveTagParam([q]);

    return PortfolioItem.find({
        ...(kind ? { kind } : {}),
        ...PUBLIC_GATE,
        $or: [
            { tags: rx },
            ...(tagIds.length ? [{ tagIds: { $in: tagIds } }] : []),
            { clientNameText: rx },
            { title: rx },
            { caption: rx },
            { 'location.city': rx },
            { 'location.state': rx },
        ],
    }).sort({ generalPriority: -1, _id: -1 })
        .skip((Math.max(1, page) - 1) * limit)
        .limit(limit)
        .populate('client', CLIENT_FIELDS)
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
            videoShootDate: displayDate(dateFor(i)),
            isHeroVideo: i.isHero,
            heroPriority: i.heroPriority,
            generalPriority: i.generalPriority,
            videoLocation: placeFor(i),
            bts: (i.credits || []).map((c) => ({ key: c.name, value: c.role })),
        },
        thumbnailUrl: posterOf(i),
        // Additions — the legacy shape had no way to express these.
        url: i.render?.webUrl || i.render?.sourceUrl || null,
        // YouTube / Vimeo films (no `url`): play `embedUrl` in an iframe.
        embedUrl: i.render?.embedUrl || null,
        external: i.external?.provider ? { provider: i.external.provider, videoId: i.external.videoId } : null,
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
        photoShootDate: dateFor(i),
        photoLocation: placeFor(i),
        generalPriority: i.generalPriority,
        url: i.render?.imageUrl || null,
        clientName: i.client?.clientName,
        blurDataURL: i.render?.blurDataURL || null,
        dominantColor: i.render?.dominantColor || null,
        aspectRatio: i.render?.aspectRatio || (i.render?.width && i.render?.height ? Number((i.render.width / i.render.height).toFixed(4)) : 1.5),
        title: i.title || null,
        caption: i.caption || null,
        eventGroup: i.eventGroup || null,
        credits: i.credits || [],
        width: i.render?.width || null,
        height: i.render?.height || null,
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
        videoShootDate: displayDate(dateFor(i)),
        videoLocation: placeFor(i),
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
        // A YouTube / Vimeo film has no loop to autoplay; the hero shows its poster.
        embedUrl: i.render?.embedUrl || null,
    };
}

/**
 * The wedding's story page for a film or photo page's "Full wedding" link —
 * only when that page is public (wedding published, story on, slug set).
 */
export async function storyLinkFor(clientId) {
    if (!clientId) return null;
    const c = await Client.findById(clientId).select('slug status story clientName').lean();
    if (!c?.slug || c.status !== 'Published' || c.story?.enabled === false) return null;
    return {
        slug: c.slug,
        href: `/weddings/story/${c.slug}`,
        title: [c.clientName?.Bride, c.clientName?.Groom].filter(Boolean).join(' & '),
    };
}

export { parseTags, displayDate, monthYear };
