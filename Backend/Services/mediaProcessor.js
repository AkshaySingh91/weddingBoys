/**
 * Executes one media job: turn an uploaded master into everything the site
 * actually serves, then flip the Media doc to Ready.
 *
 * Runs in the worker process, never in an HTTP handler — a 200 MB re-encode
 * would otherwise peg the API for minutes.
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import Media from '../Models/Media.js';
import PortfolioItem from '../Models/PortfolioItem.js';
import { syncRenderForMedia } from './portfolioRender.js';
import {
    downloadToFile, uploadFile, putObject,
    generateBlurDataURL, VARIANT_WIDTHS_PUBLIC,
} from './r2UploadService.js';
import {
    probe, hasFaststart, makeTempDir,
    extractPoster, makeWebRendition, makeHeroLoop, shouldMakeWebRendition,
} from './transcodeService.js';

const baseKeyOf = (storageKey) => storageKey.replace(/\/[^/]+$/, '');
const POSTER_WIDTHS = [640, 1280];

/**
 * Video job: poster (+ webp variants), 720p web rendition, and — when the asset
 * is destined for the hero — a short silent loop.
 */
export async function processVideo(media, options = {}) {
    const dir = await makeTempDir();
    try {
        const baseKey = baseKeyOf(media.storageKey);
        const master = path.join(dir, 'master.mp4');
        await downloadToFile(media.storageKey, master);

        const info = await probe(master);
        const sourceFaststart = await hasFaststart(master);

        // ---- poster -------------------------------------------------------
        const posterPath = path.join(dir, 'poster.jpg');
        await extractPoster(master, posterPath, { duration: info.duration });
        const posterBuf = await fs.readFile(posterPath);

        const poster = await putObject(`${baseKey}/poster.jpg`, posterBuf, 'image/jpeg');
        const posterVariants = [];
        for (const w of POSTER_WIDTHS) {
            // eslint-disable-next-line no-await-in-loop
            const { data, info: vi } = await sharp(posterBuf)
                .resize(w, null, { withoutEnlargement: true })
                .webp({ quality: 72 })
                .toBuffer({ resolveWithObject: true });
            // eslint-disable-next-line no-await-in-loop
            const put = await putObject(`${baseKey}/poster-${w}.webp`, data, 'image/webp');
            posterVariants.push({
                label: String(w), width: vi.width, height: vi.height,
                url: put.url, storageKey: put.key, bytes: data.length, format: 'webp',
            });
        }
        const blurDataURL = await generateBlurDataURL(posterBuf);
        const { dominant } = await sharp(posterBuf).stats();
        const dominantColor = `#${[dominant.r, dominant.g, dominant.b]
            .map((c) => c.toString(16).padStart(2, '0')).join('')}`;

        // ---- renditions ---------------------------------------------------
        const renditions = [{
            role: 'source',
            url: media.cdnUrl,
            storageKey: media.storageKey,
            width: info.width,
            height: info.height,
            bytes: info.sizeBytes,
            durationSec: info.duration,
            bitrateKbps: info.bitrateKbps,
            faststart: sourceFaststart,
            hasAudio: info.hasAudio,
        }];

        // A web rendition is only worth producing — and only worth keeping — if it
        // is actually smaller than the master. Sources that arrive already
        // web-compressed are served directly instead.
        let webUrl = media.cdnUrl;
        if (shouldMakeWebRendition(info)) {
            const webPath = path.join(dir, 'web.mp4');
            await makeWebRendition(master, webPath, {
                hasAudio: info.hasAudio && !options.stripAudio,
                sourceBitrateKbps: info.bitrateKbps,
            });
            const webBytes = (await fs.stat(webPath)).size;

            if (webBytes < (info.sizeBytes || Infinity)) {
                const web = await uploadFile(`${baseKey}/web.mp4`, webPath, 'video/mp4');
                const webInfo = await probe(webPath);
                webUrl = web.url;
                renditions.push({
                    role: 'web', url: web.url, storageKey: web.key,
                    width: webInfo.width, height: webInfo.height, bytes: web.bytes,
                    durationSec: webInfo.duration, bitrateKbps: webInfo.bitrateKbps,
                    faststart: true, hasAudio: webInfo.hasAudio,
                });
            } else {
                // Encoded larger than the original — discard it rather than ship a
                // "web" rendition that costs the visitor more than the master.
                console.warn(`[media] ${media.mediaId}: web rendition (${(webBytes / 1048576).toFixed(1)} MB)`
                    + ` was not smaller than the source (${((info.sizeBytes || 0) / 1048576).toFixed(1)} MB) — keeping the source`);
            }
        }

        let loopUrl;
        if (options.makeLoop) {
            const loopPath = path.join(dir, 'loop.mp4');
            await makeHeroLoop(master, loopPath, { duration: info.duration, startSec: options.loopStartSec });
            const loop = await uploadFile(`${baseKey}/loop.mp4`, loopPath, 'video/mp4');
            const loopInfo = await probe(loopPath);
            loopUrl = loop.url;
            renditions.push({
                role: 'loop', url: loop.url, storageKey: loop.key,
                width: loopInfo.width, height: loopInfo.height, bytes: loop.bytes,
                durationSec: loopInfo.duration, bitrateKbps: loopInfo.bitrateKbps,
                faststart: true, hasAudio: false,
            });
        }

        media.width = info.width;
        media.height = info.height;
        media.duration = Math.round(info.duration);
        media.aspectRatio = info.width && info.height ? +(info.width / info.height).toFixed(4) : undefined;
        media.blurDataURL = blurDataURL;
        media.dominantColor = dominantColor;
        media.video = {
            ...(media.video || {}),
            posterUrl: poster.url,
            posterStorageKey: poster.key,
            posterBytes: posterBuf.length,
            posterVariants,
            sourceUrl: media.cdnUrl,
            webUrl,
            loopUrl,
            renditions,
            codec: info.codec,
            audioStripped: Boolean(options.stripAudio) || !info.hasAudio,
        };
        media.status = 'Ready';
        media.processing = { ...(media.processing || {}), lastError: null };
        await media.save();

        // Keep all PortfolioItem placements in sync with newly generated video derivatives & poster
        try {
            // Poster-safe: never replaces a hand-picked film poster with the
            // auto-extracted frame (Services/portfolioRender.js).
            await syncRenderForMedia(media);
        } catch (syncErr) {
            console.error('PortfolioItem sync error after video transcode:', syncErr);
        }

        return media;
    } finally {
        await fs.rm(dir, { recursive: true, force: true });
    }
}

/**
 * Image job: build the derivative ladder for a master that was uploaded
 * directly to R2 by the browser (so it never passed through ingestImage).
 */
export async function processImage(media) {
    const dir = await makeTempDir();
    try {
        const baseKey = baseKeyOf(media.storageKey);
        const src = path.join(dir, 'src');
        await downloadToFile(media.storageKey, src);
        const buffer = await fs.readFile(src);

        const meta = await sharp(buffer).metadata();
        const { dominant } = await sharp(buffer).stats();

        const imageVariants = [];
        for (const v of VARIANT_WIDTHS_PUBLIC) {
            // eslint-disable-next-line no-await-in-loop
            const { data, info } = await sharp(buffer).rotate()
                .resize(v.width, null, { withoutEnlargement: true })
                .webp({ quality: 72 })
                .toBuffer({ resolveWithObject: true });
            // eslint-disable-next-line no-await-in-loop
            const put = await putObject(`${baseKey}/${v.width}.webp`, data, 'image/webp');
            imageVariants.push({
                label: v.label, width: info.width, height: info.height,
                storageKey: put.key, url: put.url, bytes: data.length, format: 'webp',
            });
        }

        media.width = meta.width;
        media.height = meta.height;
        media.aspectRatio = meta.width && meta.height ? +(meta.width / meta.height).toFixed(4) : undefined;
        media.blurDataURL = await generateBlurDataURL(buffer);
        media.dominantColor = `#${[dominant.r, dominant.g, dominant.b]
            .map((c) => c.toString(16).padStart(2, '0')).join('')}`;
        media.imageVariants = imageVariants;
        media.status = 'Ready';
        media.processing = { ...(media.processing || {}), lastError: null };
        await media.save();

        // Keep all PortfolioItem placements in sync with newly generated image derivatives
        try {
            // Poster-safe: never replaces a hand-picked film poster with the
            // auto-extracted frame (Services/portfolioRender.js).
            await syncRenderForMedia(media);
        } catch (syncErr) {
            console.error('PortfolioItem sync error after image derivatives:', syncErr);
        }

        return media;
    } finally {
        await fs.rm(dir, { recursive: true, force: true });
    }
}

export async function processJob(job) {
    const media = await Media.findOne({ mediaId: job.mediaId });
    if (!media) throw new Error(`Media ${job.mediaId} not found`);

    if (job.type === 'transcode') return processVideo(media, job.options || {});
    if (job.type === 'derivatives') return processImage(media);
    throw new Error(`Unknown job type: ${job.type}`);
}
