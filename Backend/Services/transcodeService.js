/**
 * Video post-processing with ffmpeg.
 *
 * Delivery is progressive MP4 over HTTP range requests — no HLS, no ABR. From
 * one uploaded master we derive:
 *
 *   poster  a still frame, plus webp variants, for the <video poster> and every
 *           thumbnail. The poster is what the visitor actually sees first.
 *   web     a 720p re-encode. This is the default playback rendition; the master
 *           is reserved for full-screen viewing.
 *   loop    a short silent clip for the homepage hero. Re-encoded (not stream
 *           copied) precisely so it can be small — a stream copy of a 25 Mbps
 *           master would still be ~19 MB for 6 seconds.
 *
 * Every output gets `-movflags +faststart`, which relocates the moov atom to the
 * front of the file. Without it a player cannot begin until it has hunted down
 * the moov, which defeats the whole point of progressive delivery.
 */
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';

const run = promisify(execFile);

const FFMPEG = process.env.FFMPEG_PATH || 'ffmpeg';
const FFPROBE = process.env.FFPROBE_PATH || 'ffprobe';

// Encoding is CPU-bound and unbounded input is untrusted input; cap it.
const FFMPEG_TIMEOUT_MS = Number(process.env.FFMPEG_TIMEOUT_MS || 30 * 60 * 1000);

export const HERO_LOOP_SECONDS = Number(process.env.HERO_LOOP_SECONDS || 8);

export async function ffmpegAvailable() {
    try {
        await run(FFMPEG, ['-version'], { timeout: 15000 });
        return true;
    } catch {
        return false;
    }
}

/** Container/stream facts we need before deciding what to produce. */
export async function probe(file) {
    const { stdout } = await run(FFPROBE, [
        '-v', 'error',
        '-print_format', 'json',
        '-show_format', '-show_streams',
        file,
    ], { timeout: 60_000, maxBuffer: 8 * 1024 * 1024 });

    const info = JSON.parse(stdout);
    const video = (info.streams || []).find((s) => s.codec_type === 'video');
    const audio = (info.streams || []).find((s) => s.codec_type === 'audio');
    const duration = Number(info.format?.duration) || Number(video?.duration) || 0;

    return {
        duration,
        width: video?.width,
        height: video?.height,
        codec: video?.codec_name,
        bitrateKbps: info.format?.bit_rate ? Math.round(Number(info.format.bit_rate) / 1000) : undefined,
        hasAudio: Boolean(audio),
        sizeBytes: Number(info.format?.size) || undefined,
    };
}

/**
 * Is the moov atom ahead of mdat?
 *
 * Reads only the head of the file — a full ffprobe cannot answer this, and we
 * want it for masters we do NOT re-encode so the admin can be warned that the
 * file will start slowly.
 */
export async function hasFaststart(file, bytes = 65536) {
    const fh = await fs.open(file, 'r');
    try {
        const buf = Buffer.alloc(bytes);
        const { bytesRead } = await fh.read(buf, 0, bytes, 0);
        const head = buf.subarray(0, bytesRead);
        const moov = head.indexOf('moov');
        const mdat = head.indexOf('mdat');
        if (moov === -1) return false;          // not in the head at all
        if (mdat === -1) return true;           // moov found first
        return moov < mdat;
    } finally {
        await fh.close();
    }
}

export async function makeTempDir() {
    return fs.mkdtemp(path.join(os.tmpdir(), `wb-transcode-${crypto.randomBytes(4).toString('hex')}-`));
}

/**
 * Extract a poster still.
 *
 * Seeks to a fraction of the way in rather than t=0: wedding films almost always
 * open on a black fade-in, and a black poster is worse than none.
 */
export async function extractPoster(input, output, { duration, atFraction = 0.1 } = {}) {
    const at = Math.max(0, Math.min((duration || 0) * atFraction, Math.max(0, (duration || 1) - 0.1)));
    await run(FFMPEG, [
        '-hide_banner', '-loglevel', 'error', '-y',
        '-ss', at.toFixed(3),
        '-i', input,
        '-frames:v', '1',
        '-q:v', '2',
        output,
    ], { timeout: FFMPEG_TIMEOUT_MS });
    return output;
}

// Fit inside 1280x720 without ever enlarging, in either orientation, and keep
// both dimensions even (libx264 with yuv420p requires it).
const FIT_720 = "scale='min(1280,iw)':'min(720,ih)':force_original_aspect_ratio=decrease,"
    + 'scale=trunc(iw/2)*2:trunc(ih/2)*2';

/**
 * Would a web rendition actually help?
 *
 * Not always. Several masters in this library are already web-compressed —
 * 1920x1080 at 861 kbps, for instance. CRF is a QUALITY target, not a size
 * target, so re-encoding such a source at CRF 23 tries to restore detail that
 * was never there and produces a FILE TWICE THE SIZE of the original. When the
 * source is already small and no larger than 720p, the source is the web
 * rendition.
 */
export function shouldMakeWebRendition({ width, height, bitrateKbps } = {}) {
    const withinSize = (height || 0) <= 720 && (width || 0) <= 1280;
    const alreadyLean = (bitrateKbps || Infinity) <= 2500;
    return !(withinSize && alreadyLean);
}

/**
 * 720p playback rendition.
 *
 * `-maxrate`/`-bufsize` cap the output so it can never exceed the source's own
 * bitrate — CRF alone provides no such guarantee.
 */
export async function makeWebRendition(input, output, { hasAudio = true, sourceBitrateKbps } = {}) {
    // Target 2500 kbps for 720p, but never more than ~85% of the source.
    const cap = Math.max(
        500,
        Math.min(2500, Math.floor((sourceBitrateKbps || 2500) * 0.85)),
    );

    const args = [
        '-hide_banner', '-loglevel', 'error', '-y',
        '-i', input,
        '-vf', FIT_720,
        '-c:v', 'libx264', '-crf', '23', '-preset', 'medium',
        '-maxrate', `${cap}k`, '-bufsize', `${cap * 2}k`,
        '-pix_fmt', 'yuv420p',        // required for Safari/QuickTime compatibility
    ];
    if (hasAudio) args.push('-c:a', 'aac', '-b:a', '128k');
    else args.push('-an');
    args.push('-movflags', '+faststart', output);

    await run(FFMPEG, args, { timeout: FFMPEG_TIMEOUT_MS });
    return output;
}

/**
 * Short silent hero loop.
 *
 * `-ss` before `-i` seeks fast; because this re-encodes, the cut lands exactly
 * where asked rather than snapping to the previous keyframe. `-an` is the audio
 * strip — a hero loop is always muted anyway, and dropping the track is free.
 */
export async function makeHeroLoop(input, output, { duration, startSec, seconds = HERO_LOOP_SECONDS } = {}) {
    const start = Number.isFinite(startSec)
        ? Math.max(0, startSec)
        : Math.max(0, Math.min((duration || 0) * 0.15, Math.max(0, (duration || 0) - seconds)));

    await run(FFMPEG, [
        '-hide_banner', '-loglevel', 'error', '-y',
        '-ss', start.toFixed(3),
        '-i', input,
        '-t', String(seconds),
        '-vf', FIT_720,
        '-c:v', 'libx264', '-crf', '28', '-preset', 'slow',
        '-maxrate', '1200k', '-bufsize', '2400k',
        '-pix_fmt', 'yuv420p',
        '-an',
        // Start the output timeline at zero so the loop restarts seamlessly.
        '-avoid_negative_ts', 'make_zero', '-fflags', '+genpts',
        '-movflags', '+faststart',
        output,
    ], { timeout: FFMPEG_TIMEOUT_MS });
    return output;
}
