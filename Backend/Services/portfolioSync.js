/**
 * Keep PortfolioItem in step with the embedded Client.videos[] / Client.photos[].
 *
 * Called after every client write while both models are live (the dual-write
 * window). Once writes move to PortfolioItem directly this becomes a no-op and
 * can be deleted, along with the embedded arrays.
 *
 * Deliberately the same upsert logic the backfill uses, so a re-sync and a
 * backfill can never disagree — and it is keyed on the subdocument `_id`, which
 * is reused as the PortfolioItem `_id`, keeping published /films/:id URLs valid.
 */
import PortfolioItem from '../Models/PortfolioItem.js';
import Client from '../Models/ClientSchema.js';
import Media from '../Models/Media.js';

export const renderFromMedia = (media, poster) => {
    if (!media) return {};
    return {
        posterUrl: poster?.cdnUrl || poster?.publicUrl || media.video?.posterUrl,
        blurDataURL: media.blurDataURL,
        dominantColor: media.dominantColor,
        aspectRatio: media.aspectRatio,
        width: media.width,
        height: media.height,
        ...(media.mediaType === 'Image' ? { imageUrl: media.cdnUrl || media.publicUrl } : {}),
        ...(media.mediaType === 'Video' ? {
            loopUrl: media.video?.loopUrl,
            webUrl: media.video?.webUrl,
            sourceUrl: media.video?.sourceUrl || media.cdnUrl,
            durationSec: media.duration,
        } : {}),
        syncedAt: new Date(),
    };
};

/**
 * Rebuild every PortfolioItem for one client, and remove items whose subdocument
 * no longer exists (so deleting a video in the admin removes it from the feeds).
 */
export async function syncClientPortfolio(clientId) {
    const client = await Client.findById(clientId).lean();
    if (!client) return { synced: 0, removed: 0 };

    const clientNameText = [client.clientName?.Bride, client.clientName?.Groom].filter(Boolean).join(' & ');

    const keys = [];
    for (const v of client.videos || []) {
        if (v.videoMetaData?.key) keys.push(v.videoMetaData.key);
        if (v.thumbnailMetaData?.key) keys.push(v.thumbnailMetaData.key);
    }
    for (const p of client.photos || []) if (p.photoMetaData?.key) keys.push(p.photoMetaData.key);

    const mediaDocs = keys.length
        ? await Media.find({ 'legacy.s3Key': { $in: keys } }).lean()
        : [];
    const byKey = new Map(mediaDocs.map((m) => [m.legacy.s3Key, m]));

    const ops = [];
    const liveIds = [];

    for (const v of client.videos || []) {
        const media = byKey.get(v.videoMetaData?.key);
        const poster = byKey.get(v.thumbnailMetaData?.key);
        liveIds.push(v._id);
        ops.push({
            updateOne: {
                filter: { _id: v._id },
                update: {
                    $setOnInsert: { _id: v._id, kind: 'Video', client: client._id },
                    $set: {
                        media: media?._id ?? null, mediaId: media?.mediaId,
                        poster: poster?._id ?? null, posterMediaId: poster?.mediaId,
                        title: clientNameText,
                        tags: v.tags || [],
                        shootDate: v.videoShootDate,
                        location: v.videoLocation || {},
                        isHero: Boolean(v.isHeroVideo),
                        heroPriority: v.heroPriority ?? 0,
                        generalPriority: v.generalPriority ?? 0,
                        credits: (v.bts || []).map((b) => ({ name: b.key, role: b.value })),
                        clientNameText,
                        status: 'Published',
                        render: renderFromMedia(media, poster),
                        legacy: {
                            subdocId: v._id, source: 'client.videos',
                            s3Key: v.videoMetaData?.key, thumbnailS3Key: v.thumbnailMetaData?.key,
                        },
                    },
                },
                upsert: true,
            },
        });
    }

    for (const p of client.photos || []) {
        const media = byKey.get(p.photoMetaData?.key);
        liveIds.push(p._id);
        ops.push({
            updateOne: {
                filter: { _id: p._id },
                update: {
                    $setOnInsert: { _id: p._id, kind: 'Photo', client: client._id },
                    $set: {
                        media: media?._id ?? null, mediaId: media?.mediaId,
                        title: clientNameText,
                        tags: p.tags || [],
                        shootDate: p.photoShootDate,
                        location: p.photoLocation || {},
                        isHero: false, heroPriority: 0,
                        generalPriority: p.generalPriority ?? 0,
                        clientNameText,
                        status: 'Published',
                        render: renderFromMedia(media, null),
                        legacy: { subdocId: p._id, source: 'client.photos', s3Key: p.photoMetaData?.key },
                    },
                },
                upsert: true,
            },
        });
    }

    if (ops.length) await PortfolioItem.bulkWrite(ops, { ordered: false });

    // Anything still attributed to this client but no longer in its arrays was
    // deleted in the admin; drop it so it stops appearing in the feeds.
    const removed = await PortfolioItem.deleteMany({
        client: client._id, _id: { $nin: liveIds },
    });

    return { synced: ops.length, removed: removed.deletedCount || 0 };
}
