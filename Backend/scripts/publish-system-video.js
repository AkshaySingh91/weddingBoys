/**
 * Publish a site video (not a client film) to R2 as a System Media item.
 *
 * Encodes a seamless, silent web loop from a source clip: trims to the loop
 * window, crossfades the end back into the start so the restart is invisible,
 * scales to 720p H.264 with faststart, and takes the poster from the exact
 * first frame of the loop (so poster → video never jumps). Uploads loop.mp4,
 * poster.jpg and webp poster variants under system/<mediaId>/ (immutable,
 * edge-cached), and records a Media document (ownerType System, Ready).
 *
 *   node scripts/publish-system-video.js --in <clip.mp4> --title "…" \
 *        [--start 0] [--end <sec>] [--xfade 0.6] [--width 1280] [--poster-out <file.jpg>]   # dry run
 *   … --apply
 */
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import fs from 'node:fs/promises';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const run = promisify(execFile);
const here = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(here, '../.env') });
const arg = (k, d) => (process.argv.includes(k) ? process.argv[process.argv.indexOf(k) + 1] : d);
const APPLY = process.argv.includes('--apply');
const IN = arg('--in');
const TITLE = arg('--title', 'Site video');
if (!IN) throw new Error('--in <clip> is required');

const { probe, makeTempDir } = await import('../Services/transcodeService.js');
const { uploadFile, putObject, generateBlurDataURL, buildBaseKey } = await import('../Services/r2UploadService.js');
const { nanoid } = await import('nanoid');

const src = await probe(IN);
const START = Number(arg('--start', 0));
const END = Number(arg('--end', src.duration));
const XF = Number(arg('--xfade', 0.6));
const WIDTH = Number(arg('--width', 1280));
const len = END - START;
if (!(len > XF * 2)) throw new Error('Loop window too short for the crossfade');

const dir = await makeTempDir();
const loopPath = path.join(dir, 'loop.mp4');
const posterPath = path.join(dir, 'poster.jpg');

// [a] = the window after the first XF seconds; [b] = the first XF seconds.
// Fading [a]'s tail into [b] ends the clip on the frame it starts with.
const filter = [
    `[0:v]trim=${START + XF}:${END},setpts=PTS-STARTPTS[a]`,
    `[0:v]trim=${START}:${START + XF},setpts=PTS-STARTPTS[b]`,
    `[a][b]xfade=transition=fade:duration=${XF}:offset=${(len - XF - XF).toFixed(3)},scale=${WIDTH}:-2:flags=lanczos,format=yuv420p[v]`,
].join(';');
await run('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', '-i', IN, '-filter_complex', filter, '-map', '[v]',
    '-c:v', 'libx264', '-preset', 'slow', '-crf', '23', '-maxrate', '2000k', '-bufsize', '4000k',
    '-g', '48', '-keyint_min', '24', '-an', '-movflags', '+faststart', loopPath], { timeout: 10 * 60 * 1000 });
// The loop's first frame = the source at START + XF, at full source resolution.
await run('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', '-ss', String(START + XF), '-i', IN, '-frames:v', '1', '-q:v', '2', posterPath]);

const out = await probe(loopPath);
const posterBuf = await fs.readFile(posterPath);
console.log(`source  ${src.width}x${src.height} ${src.duration.toFixed(2)}s ${(src.sizeBytes / 1048576).toFixed(1)} MB`);
console.log(`loop    ${out.width}x${out.height} ${out.duration.toFixed(2)}s ${(out.sizeBytes / 1048576).toFixed(2)} MB ${out.bitrateKbps} kbps (window ${START}–${END}s, xfade ${XF}s)`);
const posterOut = arg('--poster-out');
if (posterOut) { await fs.copyFile(posterPath, posterOut); console.log(`poster  → ${posterOut}`); }

if (!APPLY) {
    console.log(`\nDry run — files in ${dir}. Re-run with --apply to upload.`);
    process.exit(0);
}

await mongoose.connect(process.env.MONGO_URI);
const { default: Media } = await import('../Models/Media.js');
const mediaId = nanoid(12);
const base = buildBaseKey({ ownerType: 'System', mediaId });
const loop = await uploadFile(`${base}/loop.mp4`, loopPath, 'video/mp4');
const poster = await putObject(`${base}/poster.jpg`, posterBuf, 'image/jpeg');
const posterVariants = [];
for (const w of [640, 1280, 1920]) {
    const { data, info } = await sharp(posterBuf).resize(w, null, { withoutEnlargement: true }).webp({ quality: 80 }).toBuffer({ resolveWithObject: true });
    const put = await putObject(`${base}/poster-${w}.webp`, data, 'image/webp');
    posterVariants.push({ label: String(w), width: info.width, height: info.height, url: put.url, storageKey: put.key, bytes: data.length, format: 'webp' });
}
const { dominant } = await sharp(posterBuf).stats();
const media = await Media.create({
    mediaId, provider: 'R2', ownerType: 'System', mediaType: 'Video', visibility: 'Public', status: 'Ready',
    title: TITLE, fileName: 'loop.mp4', originalFileName: path.basename(IN), mimeType: 'video/mp4',
    fileSize: loop.bytes, storageKey: loop.key, cdnUrl: loop.url, publicUrl: loop.url,
    width: out.width, height: out.height, duration: Math.round(out.duration),
    aspectRatio: +(out.width / out.height).toFixed(4),
    blurDataURL: await generateBlurDataURL(posterBuf),
    dominantColor: `#${[dominant.r, dominant.g, dominant.b].map((c) => c.toString(16).padStart(2, '0')).join('')}`,
    video: {
        posterUrl: poster.url, posterStorageKey: poster.key, posterBytes: posterBuf.length, posterVariants,
        loopUrl: loop.url, webUrl: loop.url, sourceUrl: loop.url, audioStripped: true,
        renditions: [{ role: 'loop', label: `${out.height}p`, url: loop.url, storageKey: loop.key, width: out.width, height: out.height,
            bytes: loop.bytes, durationSec: out.duration, bitrateKbps: out.bitrateKbps, faststart: true, hasAudio: false }],
    },
});
console.log(`\nMedia ${media.mediaId} (System, Ready)\n  loop   ${loop.url}\n  poster ${poster.url}`);
await mongoose.disconnect();
await fs.rm(dir, { recursive: true, force: true });
