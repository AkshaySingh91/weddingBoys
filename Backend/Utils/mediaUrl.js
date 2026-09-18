/**
 * The single place a public media URL is built.
 *
 * Historically every read path called `getObjectUrl()` from awsController, which
 * returns a 1-hour AWS presigned GET. That defeats caching three times over: the
 * signature changes on every request, so the browser cache misses, any CDN
 * misses, and the Next image optimizer re-downloads and re-encodes the same file
 * for every visitor. Media served this way can never be fast.
 *
 * Assets on R2 are public and immutable, so their URL is just the CDN base plus
 * the object key — no signing, cacheable forever.
 *
 * During the S3→R2 migration `resolveLegacyKey()` provides the dual read: prefer
 * a migrated R2 object, fall back to the old bucket. Once the migration settles,
 * deleting that fallback is a two-line change.
 */
import Media from '../Models/Media.js';

// R2_PUBLIC_URL is the custom domain bound to the bucket; NEXT_PUBLIC_CDN_URL
// is accepted as an alias so one value can serve both processes.
const CDN_BASE = (process.env.R2_PUBLIC_URL || process.env.NEXT_PUBLIC_CDN_URL || '').replace(/\/$/, '');

export const isCdnConfigured = () => Boolean(CDN_BASE);

/** Absolute, unsigned, immutable URL for an R2 object key. */
export function cdnUrlFor(key) {
    if (!key) return null;
    if (!CDN_BASE) {
        throw new Error('R2_PUBLIC_URL is not set — cannot build a media URL.');
    }
    return `${CDN_BASE}/${String(key).replace(/^\//, '')}`;
}

/** Best URL for a populated Media document. */
export function resolveMedia(media) {
    if (!media) return null;
    return media.cdnUrl || media.publicUrl || (media.storageKey ? cdnUrlFor(media.storageKey) : null);
}

/**
 * Dual read for a legacy S3 key.
 *
 * Returns the R2 URL when the asset has been migrated, otherwise null so the
 * caller can fall back to its existing signed-URL path. Kept as one function so
 * the migration can be finished by deleting a single branch.
 */
export async function resolveLegacyKey(s3Key) {
    if (!s3Key) return null;
    const migrated = await Media.findOne({ 'legacy.s3Key': s3Key })
        .select('cdnUrl publicUrl storageKey')
        .lean();
    return migrated ? resolveMedia(migrated) : null;
}

/** Batch form of resolveLegacyKey — one query for a whole page of assets. */
export async function resolveLegacyKeys(s3Keys = []) {
    const keys = [...new Set(s3Keys.filter(Boolean))];
    if (!keys.length) return new Map();
    const rows = await Media.find({ 'legacy.s3Key': { $in: keys } })
        .select('cdnUrl publicUrl storageKey legacy.s3Key')
        .lean();
    return new Map(rows.map((r) => [r.legacy.s3Key, resolveMedia(r)]));
}

// ---------------------------------------------------------------------------
// mediaUrlForKey — the drop-in replacement for getObjectUrl()
// ---------------------------------------------------------------------------
//
// Call sites pass a legacy S3 key and get back the best URL available: the
// immutable R2 CDN URL once the asset has been migrated, otherwise the old
// signed S3 URL so nothing breaks mid-migration.
//
// Two problems this has to solve that a naive lookup would not:
//
//   1. N+1 queries. A photo page resolves 24 keys; one findOne each would be 24
//      round-trips. Keys requested within the same tick are therefore collected
//      and satisfied by a single $in query (the DataLoader pattern), so call
//      sites keep their simple `await mediaUrlForKey(key)` shape.
//
//   2. Repeat lookups. A migrated key maps to an immutable URL that can never
//      change, so it is cached for the life of the process. A key that is NOT
//      yet migrated is cached only briefly, so the switch is picked up soon
//      after the migration script runs.

const NEGATIVE_TTL_MS = 60_000;

const urlCache = new Map();          // s3Key -> cdn url (permanent once found)
const missCache = new Map();         // s3Key -> timestamp of the last miss

let pending = null;                  // { keys:Set, resolvers:[] }

function scheduleFlush() {
    if (pending.scheduled) return;
    pending.scheduled = true;
    // Same-tick collection: every key requested before the microtask queue
    // drains rides along on one query.
    queueMicrotask(async () => {
        const batch = pending;
        pending = null;
        try {
            const found = await resolveLegacyKeys([...batch.keys]);
            const now = Date.now();
            for (const key of batch.keys) {
                const url = found.get(key);
                if (url) urlCache.set(key, url);
                else missCache.set(key, now);
            }
            batch.resolve(found);
        } catch (error) {
            batch.reject(error);
        }
    });
}

function lookupBatched(key) {
    if (!pending) {
        let resolve; let reject;
        const promise = new Promise((res, rej) => { resolve = res; reject = rej; });
        pending = { keys: new Set(), promise, resolve, reject, scheduled: false };
    }
    pending.keys.add(key);
    const p = pending.promise;
    scheduleFlush();
    return p.then((found) => found.get(key) || null);
}

/**
 * Best public URL for a legacy S3 object key.
 *
 * @param {string} key                S3 object key
 * @param {Function} [signedFallback] usually getObjectUrl from awsController
 */
export async function mediaUrlForKey(key, signedFallback) {
    if (!key) return null;

    const cached = urlCache.get(key);
    if (cached) return cached;

    const missedAt = missCache.get(key);
    const recentlyMissed = missedAt && (Date.now() - missedAt) < NEGATIVE_TTL_MS;

    if (!recentlyMissed && isCdnConfigured()) {
        try {
            const url = await lookupBatched(key);
            if (url) return url;
        } catch {
            // A lookup failure must never take down a page — fall through to S3.
        }
    }

    return signedFallback ? signedFallback(key) : null;
}

/**
 * Resolve any "media holder" node to a URL.
 *
 * Legacy models store media as `{ key }` (an S3 object key) and the migration
 * added a nullable `{ mediaId }` sibling. New admin uploads write only a
 * mediaId — the bytes go straight to R2 and there is no S3 key at all.
 *
 * One function handles all three states so read paths do not have to care which
 * era a given asset comes from:
 *
 *   { mediaId }        → the R2 asset (new uploads, and anything migrated)
 *   { key }            → migrated? R2 CDN url : signed S3 url
 *   { mediaId, key }   → mediaId wins
 *
 * @param {object} node            e.g. Team.imageMetaData, Review.photo
 * @param {Function} signedFallback usually getObjectUrl
 */
export async function resolveNode(node, signedFallback) {
    if (!node) return null;

    if (node.mediaId) {
        const media = await Media.findOne({ mediaId: node.mediaId })
            .select('cdnUrl publicUrl storageKey')
            .lean();
        const url = resolveMedia(media);
        if (url) return url;
        // A mediaId that no longer resolves should not silently blank the page —
        // fall through to the legacy key if one is still recorded.
    }
    return node.key ? mediaUrlForKey(node.key, signedFallback) : null;
}

/** Test/ops hook — drop cached mappings (e.g. right after running a migration). */
export function clearMediaUrlCache() {
    urlCache.clear();
    missCache.clear();
}
