/**
 * Per-client rollups.
 *
 * Counts come from PortfolioItem — the editorial layer knows what exists and
 * whether it is published. Bytes have to come from Media, because PortfolioItem
 * carries no size field at all.
 *
 * Both are whole-collection aggregations returning a Map keyed by client id, so
 * a list of N clients costs two queries rather than 2N. The same functions back
 * the single-client view, so a card and its detail page can never disagree.
 */
import mongoose from 'mongoose';
import PortfolioItem from '../Models/PortfolioItem.js';
import Media from '../Models/Media.js';

/** Bytes actually stored for one Media doc: master + every derivative. */
const BYTES_EXPR = {
    $add: [
        { $ifNull: ['$fileSize', 0] },
        { $sum: { $map: { input: { $ifNull: ['$imageVariants', []] }, as: 'v', in: { $ifNull: ['$$v.bytes', 0] } } } },
        { $ifNull: ['$video.posterBytes', 0] },
        { $sum: { $map: { input: { $ifNull: ['$video.posterVariants', []] }, as: 'p', in: { $ifNull: ['$$p.bytes', 0] } } } },
        // The `source` rendition IS the master file, already counted as fileSize.
        {
            $sum: {
                $map: {
                    input: { $filter: { input: { $ifNull: ['$video.renditions', []] }, as: 'r', cond: { $ne: ['$$r.role', 'source'] } } },
                    as: 'r',
                    in: { $ifNull: ['$$r.bytes', 0] },
                },
            },
        },
    ],
};

const GROUP_STAGE = {
    _id: '$client',
    total: { $sum: 1 },
    videos: { $sum: { $cond: [{ $eq: ['$kind', 'Video'] }, 1, 0] } },
    photos: { $sum: { $cond: [{ $eq: ['$kind', 'Photo'] }, 1, 0] } },
    hero: { $sum: { $cond: ['$isHero', 1, 0] } },
    drafts: { $sum: { $cond: [{ $eq: ['$status', 'Draft'] }, 1, 0] } },
    untagged: { $sum: { $cond: [{ $eq: [{ $size: { $ifNull: ['$tags', []] } }, 0] }, 1, 0] } },
    missingMedia: { $sum: { $cond: [{ $eq: ['$media', null] }, 1, 0] } },
    tagGroups: { $addToSet: '$tags' },
    eventGroups: { $addToSet: '$eventGroup' },
    cities: { $addToSet: '$location.city' },
    firstShoot: { $min: '$shootDate' },
    lastShoot: { $max: '$shootDate' },
    lastEdited: { $max: '$updatedAt' },
};

const PROJECT_STAGE = {
    total: 1, videos: 1, photos: 1, hero: 1, drafts: 1, untagged: 1, missingMedia: 1,
    firstShoot: 1, lastShoot: 1, lastEdited: 1,
    eventGroups: {
        $filter: {
            input: '$eventGroups', as: 'eg',
            cond: { $and: [{ $ne: ['$$eg', null] }, { $ne: ['$$eg', ''] }] },
        },
    },
    cities: {
        $filter: {
            input: '$cities', as: 'c',
            cond: { $and: [{ $ne: ['$$c', null] }, { $ne: ['$$c', ''] }] },
        },
    },
    // `$addToSet` over an array field yields an array OF arrays; flatten it.
    tags: { $reduce: { input: '$tagGroups', initialValue: [], in: { $setUnion: ['$$value', '$$this'] } } },
};

/** @returns {Promise<Map<string, object>>} clientId → counts */
export async function rollupByClient(clientId) {
    const rows = await PortfolioItem.aggregate([
        ...(clientId ? [{ $match: { client: new mongoose.Types.ObjectId(String(clientId)) } }] : []),
        { $group: GROUP_STAGE },
        { $project: PROJECT_STAGE },
    ]);
    return new Map(rows.map(({ _id, ...rest }) => [String(_id), rest]));
}

/**
 * @returns {Promise<Map<string, {bytes:number, assets:number}>>} clientId → storage
 *
 * Read off the existing {ownerType, ownerId} index. `ownerId` is stored as a
 * STRING for client-owned media (portfolioController writes `String(_id)`), so
 * it is grouped as one — no ObjectId cast, and no $lookup.
 */
export async function storageByClient(clientId) {
    const rows = await Media.aggregate([
        {
            $match: {
                ownerType: 'Client',
                status: { $ne: 'Archived' },
                ...(clientId ? { ownerId: String(clientId) } : {}),
            },
        },
        { $project: { ownerId: 1, bytes: BYTES_EXPR } },
        { $group: { _id: '$ownerId', bytes: { $sum: '$bytes' }, assets: { $sum: 1 } } },
    ]);
    return new Map(rows.map(({ _id, ...rest }) => [String(_id), rest]));
}

export const EMPTY_STATS = {
    total: 0, videos: 0, photos: 0, hero: 0, drafts: 0, untagged: 0, missingMedia: 0,
    tags: [], cities: [], firstShoot: null, lastShoot: null, lastEdited: null,
    storageBytes: 0, assetCount: 0,
};
