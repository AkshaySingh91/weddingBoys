/**
 * Re-encode every hero film's loop at the new, lighter settings (720p, ~1.4 MB
 * for 8 s instead of 1080p at 2–6 MB) and re-pick its cover with the best-frame
 * picker + focal point. Runs the worker's own processHeroLoop LOCALLY, so it does
 * not depend on which code the production worker is running.
 *
 * Each film keeps the loop window and crop it was cut with last time (taken from
 * its latest finished hero job). Files go to new immutable paths
 * (`hero-<runId>/…`); the previous loop and poster stay in R2 untouched, so a
 * bad result can be undone by pointing the media back at them.
 *
 *   node scripts/reencode-hero-loops.js            # dry run: what would change
 *   node scripts/reencode-hero-loops.js --apply    # re-encode and sync renders
 *   node scripts/reencode-hero-loops.js --apply --only <mediaId>
 */
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config({ path: path.join(path.dirname(fileURLToPath(import.meta.url)), '../.env') });
const APPLY = process.argv.includes('--apply');
const only = process.argv.includes('--only') ? process.argv[process.argv.indexOf('--only') + 1] : null;

const { default: PortfolioItem } = await import('../Models/PortfolioItem.js');
const { default: Media } = await import('../Models/Media.js');
const { default: MediaJob } = await import('../Models/MediaJob.js');
const { processHeroLoop } = await import('../Services/heroLoopProcessor.js');
const { syncRenderForMedia } = await import('../Services/portfolioRender.js');

await mongoose.connect(process.env.MONGO_URI);
const items = await PortfolioItem.find({ isHero: true, kind: 'Video', media: { $ne: null } }).select('media title heroPriority poster').lean();
const runId = `r${Date.now().toString(36)}`;
const mb = (b) => (b ? `${(b / 1048576).toFixed(2)} MB` : '?');

for (const item of items) {
    const media = await Media.findById(item.media);
    if (!media || media.mediaType !== 'Video') continue;
    if (only && media.mediaId !== only) continue;
    const last = await MediaJob.findOne({ media: media._id, type: { $in: ['hero', 'transcode'] }, status: { $in: ['done', 'Done', 'completed', 'succeeded'] } })
        .sort({ updatedAt: -1 }).lean()
        || await MediaJob.findOne({ media: media._id, type: { $in: ['hero', 'transcode'] } }).sort({ updatedAt: -1 }).lean();
    const o = last?.options || {};
    const options = {
        loopStartSec: Number.isFinite(o.loopStartSec) ? o.loopStartSec : undefined,
        loopSeconds: o.loopSeconds,
        loopCrop: o.loopCrop,
    };
    const loop = (media.video?.renditions || []).find((r) => r.role === 'loop');
    console.log(`${media.mediaId}  ${item.title || ''}  loop now ${mb(loop?.bytes)} ${loop?.width}x${loop?.height}`
        + `  window start=${options.loopStartSec ?? 'auto'} len=${options.loopSeconds ?? 8}${options.loopCrop ? ' (cropped)' : ''}`
        + `${item.poster ? '  [custom cover kept]' : ''}`);
    if (!APPLY) continue;
    const t = Date.now();
    await processHeroLoop(media, options, `${runId}-${media.mediaId}`.replace(/[^a-zA-Z0-9_-]/g, ''));
    const next = (media.video?.renditions || []).find((r) => r.role === 'loop');
    const res = await syncRenderForMedia(media);
    console.log(`   → ${mb(next?.bytes)} ${next?.width}x${next?.height}, focus ${media.focus?.x},${media.focus?.y}, ${((Date.now() - t) / 1000).toFixed(0)}s, items updated ${res.full + res.keptPoster}`);
}
if (!APPLY) console.log('\nDry run. Re-run with --apply to re-encode.');
await mongoose.disconnect();
