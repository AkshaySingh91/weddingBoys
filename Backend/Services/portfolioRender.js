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

/** The image URL to use as a poster: a ~1280px variant when there is one. */
export const posterUrlOf = (media) => {
    const variants = (media?.imageVariants || []).filter((v) => v.url).sort((a, b) => a.width - b.width);
    return (variants.find((v) => v.width >= 1280) || variants[variants.length - 1])?.url || media?.cdnUrl || media?.publicUrl;
};

const focusOf = (m) => (Number.isFinite(m?.focus?.x) && Number.isFinite(m?.focus?.y) ? { x: m.focus.x, y: m.focus.y } : undefined);

/** The fields a custom cover owns on the render: its URL, focus, placeholder. */
export const coverFields = (poster) => ({
    posterUrl: posterUrlOf(poster),
    focus: focusOf(poster),
    blurDataURL: poster?.blurDataURL,
    dominantColor: poster?.dominantColor,
});

/** Build the render cache for an item from its Media (and optional poster Media). */
export const renderFromMedia = (media, poster) => {
    if (!media) return {};
    return {
        posterUrl: poster ? posterUrlOf(poster) : media.video?.posterUrl,
        focus: focusOf(poster) || focusOf(media),
        blurDataURL: poster?.blurDataURL || media.blurDataURL,
        dominantColor: poster?.dominantColor || media.dominantColor,
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
    // A replacement file waiting on this media goes live now that it is ready:
    // the item switches to it, and the refresh below gives it the new render.
    if (media.status === 'Ready') {
        await PortfolioItem.updateMany(
            { pendingMedia: media._id },
            { $set: { media: media._id, mediaId: media.mediaId }, $unset: { pendingMedia: 1 } },
        );
    }
    const render = renderFromMedia(media);
    // A custom cover owns the still and everything derived from it.
    const { posterUrl, focus, blurDataURL, dominantColor, ...withoutPoster } = render;

    const full = await PortfolioItem.updateMany(
        { media: media._id, poster: null },            // null also matches "no poster field"
        { $set: { render } },
    );
    const kept = await PortfolioItem.updateMany(
        { media: media._id, poster: { $ne: null } },
        { $set: dotted(withoutPoster) },
    );

    let posterUpdated = { modifiedCount: 0 };
    if (media.mediaType === 'Image' && media.status === 'Ready' && posterUrlOf(media)) {
        posterUpdated = await PortfolioItem.updateMany(
            { poster: media._id },
            { $set: dotted(coverFields(media)) },
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
