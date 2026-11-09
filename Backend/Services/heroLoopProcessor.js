/** Build a curated hero rendition without replacing a film's source or web encode. */
import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import { downloadToFile, uploadFile, putObject, generateBlurDataURL } from './r2UploadService.js';
import { makeTempDir, probe, makeHeroLoop, extractBestPoster } from './transcodeService.js';
import { focalPoint } from './coverService.js';

export async function processHeroLoop(media, options, jobId) {
    if (!jobId || !/^[a-zA-Z0-9_-]+$/.test(jobId)) throw new Error('Hero job requires a safe version id');
    const dir = await makeTempDir();
    try {
        const master = path.join(dir, 'master.mp4');
        await downloadToFile(media.storageKey, master);
        const source = await probe(master);
        if (source.width <= source.height) throw new Error('Hero requires landscape footage');
        const crop = options.loopCrop;
        if (crop && (crop.x + crop.width > source.width || crop.y + crop.height > source.height)) throw new Error('Hero crop exceeds source frame');
        const seconds = Math.min(12, Math.max(4, Number(options.loopSeconds) || 8));
        const loopPath = path.join(dir, 'hero.mp4');
        await makeHeroLoop(master, loopPath, { duration: source.duration, startSec: options.loopStartSec, seconds, crop });
        const info = await probe(loopPath);
        // New immutable paths: existing source, web encode and earlier posters stay intact.
        const base = media.storageKey.replace(/\/[^/]+$/, '') + `/hero-${jobId}`;
        const loop = await uploadFile(`${base}/loop.mp4`, loopPath, 'video/mp4');
        const posterPath = path.join(dir, 'poster.jpg');
        // The hero still must match the loop's first moments visually, so pick the
        // best frame from the MASTER inside the loop window (full resolution, not
        // the 720p loop) — the poster is the LCP and stays sharp on big screens.
        const start = Number.isFinite(options.loopStartSec) ? options.loopStartSec : Math.max(0, Math.min(source.duration * 0.15, source.duration - seconds));
        await extractBestPoster(master, posterPath, { duration: source.duration, start, end: start + Math.min(seconds, 3), count: 8 });
        if (crop) {
            const raw = await fs.readFile(posterPath);
            await sharp(raw).extract({ left: crop.x, top: crop.y, width: crop.width, height: crop.height }).jpeg({ quality: 90 }).toFile(posterPath + '.c.jpg');
            await fs.rename(posterPath + '.c.jpg', posterPath);
        }
        const posterBuf = await fs.readFile(posterPath);
        const focus = await focalPoint(posterBuf).catch(() => ({ x: 0.5, y: 0.5 }));
        const poster = await putObject(`${base}/poster.jpg`, posterBuf, 'image/jpeg');
        const posterVariants = [];
        for (const width of [640, 1280, 1920]) {
            const { data, info: image } = await sharp(posterBuf).resize(width, null, { withoutEnlargement: true }).webp({ quality: 84 }).toBuffer({ resolveWithObject: true });
            const asset = await putObject(`${base}/poster-${width}.webp`, data, 'image/webp');
            posterVariants.push({ label: String(width), width: image.width, height: image.height, url: asset.url, storageKey: asset.key, bytes: data.length, format: 'webp' });
        }
        const previous = media.video?.toObject?.() || media.video || {};
        const renditions = (previous.renditions || []).filter(r => r.role !== 'loop');
        renditions.push({ role: 'loop', label: 'hero-hd', width: info.width, height: info.height, durationSec: info.duration, bitrateKbps: info.bitrateKbps, bytes: loop.bytes, storageKey: loop.key, url: loop.url, faststart: true, hasAudio: false });
        media.video = { ...previous, loopUrl: loop.url, posterUrl: poster.url, posterStorageKey: poster.key, posterBytes: posterBuf.length, posterVariants, renditions };
        media.focus = focus;
        media.blurDataURL = await generateBlurDataURL(posterBuf);
        const { dominant } = await sharp(posterBuf).stats();
        media.dominantColor = `#${[dominant.r, dominant.g, dominant.b].map(c => c.toString(16).padStart(2, '0')).join('')}`;
        media.processing = { ...(media.processing?.toObject?.() || media.processing || {}), filesReadyForJob: jobId, lastError: null };
        await media.save();
        return media;
    } finally {
        await fs.rm(dir, { recursive: true, force: true });
    }
}
