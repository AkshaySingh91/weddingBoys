/**
 * The render cache on PortfolioItem — the URLs the public site reads.
 *
 * One builder and one writer, shared by the worker, the portfolio controller,
 * the backfill and the maintenance script, so they cannot drift apart again.
 *
 * Why a dedicated writer: the obvious update, `$set: { render }` on every item
 * that uses a Media, silently replaces a hand-picked film poster with the frame
 * the worker auto-extracted. Six legacy films have a separate poster image; any
 * reprocess of their video, or one run of `scripts/syncPortfolioRenders.js`,
 * would have swapped all six. `syncRenderForMedia` never touches `posterUrl` on
 * an item that has its own `poster`.
 */
import PortfolioItem from '../Models/PortfolioItem.js';
import { markMediaReady } from './portfolioVisibility.js';

/** Build the render cache for an item from its Media (and optional poster Media). */
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

const dotted = (obj) => Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v !== undefined).map(([k, v]) => [`render.${k}`, v]),
);

/**
 * Refresh every item that shows `media`, after it (re)processes.
 *
 *   - items with no custom poster     → the whole render, auto poster included;
 *   - items WITH a custom poster      → every render field except `posterUrl`;
 *   - items whose poster IS `media`   → just `posterUrl` (a custom poster image
 *                                       that has itself just finished processing).
 *
 * Then recomputes `mediaReady` on those items, which is what makes a
 * Published-intent upload go live by itself once processing finishes.
 *
 * @returns {{ full: number, keptPoster: number, posterUpdated: number, nowPublic: number }}
 */
export async function syncRenderForMedia(media) {
    const render = renderFromMedia(media);
    const { posterUrl, ...withoutPoster } = render;

    const full = await PortfolioItem.updateMany(
        { media: media._id, poster: null },            // null also matches "no poster field"
        { $set: { render } },
    );
    const kept = await PortfolioItem.updateMany(
        { media: media._id, poster: { $ne: null } },
        { $set: dotted(withoutPoster) },
    );

    let posterUpdated = { modifiedCount: 0 };
    const ownUrl = media.cdnUrl || media.publicUrl;
    if (media.mediaType === 'Image' && ownUrl) {
        posterUpdated = await PortfolioItem.updateMany(
            { poster: media._id },
            { $set: { 'render.posterUrl': ownUrl } },
        );
    }

    const nowPublic = await markMediaReady(media);

    return {
        full: full.modifiedCount || 0,
        keptPoster: kept.modifiedCount || 0,
        posterUpdated: posterUpdated.modifiedCount || 0,
        nowPublic: nowPublic.length,
    };
}
