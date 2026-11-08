import fs from 'node:fs/promises';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import sharp from 'sharp';
import Media from '../Models/Media.js';
import Sequence from '../Models/Sequence.js';
import { buildBaseKey, cdnUrl, downloadToFile, generateBlurDataURL, inspectObject, putObject } from './r2UploadService.js';
import { makeTempDir, probe } from './transcodeService.js';

const run = promisify(execFile);
const FFMPEG = process.env.FFMPEG_PATH || 'ffmpeg';
const MAX_FRAMES = 240;
const TIERS = [
    { label: 'desktop', everyNth: 1, width: 1600, quality: 76 },
    { label: 'mobile', everyNth: 2, width: 720, quality: 64 },
];

async function parallelFor(items, limit, operation) {
    let cursor = 0;
    let failure;
    await Promise.all(Array.from({ length: Math.min(limit, items.length) }, async () => {
        while (cursor < items.length && !failure) {
            const item = items[cursor++];
            try { await operation(item); }
            catch (error) { failure = error; }
        }
    }));
    if (failure) throw failure;
}

export function sequenceKey(sequence) {
    return buildBaseKey({ ownerType: 'Website', slot: `varanasi-${sequence.slot}-sequence`, mediaId: sequence.releaseId });
}

async function putOnce(key, data, type) {
    try {
        const existing = await inspectObject(key);
        if (existing.contentType === type && existing.fileSize === data.length) return existing;
        throw new Error(`Immutable sequence object differs: ${key}`);
    } catch (error) {
        if (error.name !== 'NotFound' && error.$metadata?.httpStatusCode !== 404) throw error;
    }
    return putObject(key, data, type);
}

async function extractFrames(source, dir, { startSec, durationSec, frameCount }) {
    const output = path.join(dir, 'source-%04d.jpg');
    await run(FFMPEG, [
        '-hide_banner', '-loglevel', 'error', '-ss', String(startSec), '-t', String(durationSec),
        '-i', source, '-vf', `fps=${frameCount}/${durationSec}`, '-q:v', '2', '-frames:v', String(frameCount),
        '-start_number', '0', output,
    ], { timeout: 30 * 60_000, maxBuffer: 1024 * 1024 });
    return (await fs.readdir(dir)).filter((name) => /^source-\d{4}\.jpg$/.test(name)).sort().map((name) => path.join(dir, name));
}

/** Existing local frames can be passed by the guarded one-time migration script. */
export async function generateSequence(sequenceId, { framePaths, startSec = 0, durationSec, frameCount = 150 } = {}) {
    const sequence = await Sequence.findById(sequenceId);
    if (!sequence || !['Draft', 'Processing', 'Failed'].includes(sequence.status)) throw new Error('Sequence is not processable');
    const dir = await makeTempDir();
    sequence.status = 'Processing';
    sequence.lastError = undefined;
    await sequence.save();
    try {
        let frames = framePaths;
        if (!frames) {
            const media = await Media.findOne({ mediaId: sequence.sourceMediaId });
            if (!media || media.mediaType !== 'Video' || !media.storageKey || !['Ready', 'Processing'].includes(media.status)) {
                throw new Error('Ready source video is required');
            }
            const source = path.join(dir, 'source.mp4');
            await downloadToFile(media.storageKey, source);
            const info = await probe(source);
            if (!info.width || !info.height || !info.duration) throw new Error('Source video has no usable video stream');
            const clipLength = Math.min(15, durationSec || info.duration - startSec);
            if (startSec < 0 || clipLength < 1 || startSec + clipLength > info.duration + 0.1) throw new Error('Invalid sequence trim');
            frames = await extractFrames(source, dir, { startSec, durationSec: clipLength, frameCount: Math.min(MAX_FRAMES, frameCount) });
        }
        if (!Array.isArray(frames) || frames.length < 24 || frames.length > MAX_FRAMES) throw new Error('Sequence must contain 24–240 frames');
        const expectedObjects = TIERS.reduce((sum, tier) => sum + Math.ceil(frames.length / tier.everyNth), 0);
        let processedObjects = 0;
        await Sequence.updateOne({ _id: sequence._id }, { $set: { expectedObjects, processedObjects: 0 } });

        const base = sequenceKey(sequence);
        const first = await fs.readFile(frames[0]);
        const meta = await sharp(first).metadata();
        if (!meta.width || !meta.height) throw new Error('Invalid first frame');
        const posterBuffer = await sharp(first).resize({ width: 1200, withoutEnlargement: true }).webp({ quality: 72 }).toBuffer();
        const poster = await putOnce(`${base}/poster.webp`, posterBuffer, 'image/webp');
        const blurDataURL = await generateBlurDataURL(first);
        const tierData = [];
        for (const tier of TIERS) {
            let bytes = 0;
            let width = 0;
            let height = 0;
            const keys = [];
            const indexes = Array.from({ length: Math.ceil(frames.length / tier.everyNth) }, (_, n) => n * tier.everyNth);
            await parallelFor(indexes, 3, async (index) => {
                const { data, info } = await sharp(frames[index])
                    .resize({ width: tier.width, withoutEnlargement: true })
                    .webp({ quality: tier.quality, effort: 4 }).toBuffer({ resolveWithObject: true });
                const key = `${base}/${tier.label}/frame_${String(index).padStart(4, '0')}.webp`;
                await putOnce(key, data, 'image/webp');
                keys.push(key);
                width = info.width;
                height = info.height;
                bytes += data.length;
                processedObjects += 1;
                if (processedObjects % 20 === 0) {
                    await Sequence.updateOne({ _id: sequence._id }, { $max: { processedObjects } });
                }
            });
            tierData.push({ ...tier, width, height, bytes, format: 'webp',
                keyPattern: `${base}/${tier.label}/frame_{index}.webp`, keys });
        }

        // Verify every object before making the manifest/public pointer reachable.
        for (const tier of tierData) {
            await parallelFor(tier.keys, 6, async (key) => {
                const head = await inspectObject(key);
                if (!head.fileSize || head.contentType !== 'image/webp') throw new Error(`Unusable frame: ${key}`);
            });
        }
        const manifest = {
            schemaVersion: 1, releaseId: sequence.releaseId, slot: sequence.slot,
            frameCount: frames.length, width: meta.width, height: meta.height,
            posterUrl: poster.url, blurDataURL, focalX: sequence.focalX, focalY: sequence.focalY,
            tiers: tierData.map(({ keys, ...tier }) => ({ ...tier, baseUrl: cdnUrl(tier.keyPattern) })),
        };
        const manifestKey = `${base}/manifest.json`;
        const manifestBuffer = Buffer.from(JSON.stringify(manifest));
        const manifestObject = await putOnce(manifestKey, manifestBuffer, 'application/json');
        sequence.set({
            status: 'Ready', frameCount: frames.length, startIndex: 0, padTo: 4,
            width: meta.width, height: meta.height, aspectRatio: meta.width / meta.height,
            keyPattern: tierData[0].keyPattern,
            posterUrl: poster.url, blurDataURL, manifestKey, manifestUrl: manifestObject.url,
            tiers: tierData.map(({ keys, ...tier }) => tier),
            totalBytes: posterBuffer.length + manifestBuffer.length + tierData.reduce((sum, tier) => sum + tier.bytes, 0),
            processedObjects: expectedObjects, expectedObjects,
            lastError: undefined,
        });
        await sequence.save();
        return sequence;
    } catch (error) {
        sequence.status = 'Failed';
        sequence.lastError = String(error.message).slice(0, 1000);
        await sequence.save();
        throw error;
    } finally {
        await fs.rm(dir, { recursive: true, force: true });
    }
}
