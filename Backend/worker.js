/**
 * Media worker.
 *
 * A separate process from the API on purpose: ffmpeg pegs a core for minutes at
 * a time, and doing that inside Express would stall every request and lose all
 * in-flight work on the next deploy.
 *
 *   node worker.js            # run it (pm2/systemd in production)
 *
 * Transcoding is deliberately serialised (concurrency 1) — running two 1080p
 * encodes at once on a shared box makes both slower and starves the API.
 * Image ladders are cheap enough to overlap.
 */
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import DBconnection from './Config/DBconnection.js';
import {
    claimNextJob, completeJob, failJob, heartbeat, reclaimStaleJobs, workerId,
} from './Services/mediaJobQueue.js';
import { processJob } from './Services/mediaProcessor.js';
import { ffmpegAvailable } from './Services/transcodeService.js';
import { isR2Configured } from './Services/r2UploadService.js';
import Media from './Models/Media.js';

dotenv.config();

const IDLE_DELAY_MS = Number(process.env.WORKER_IDLE_MS || 3000);
const HEARTBEAT_MS = 30_000;
const RECLAIM_EVERY_MS = 60_000;

let running = true;
let active = 0;

const log = (...a) => console.log(`[worker ${workerId()}]`, ...a);

async function runOne(job) {
    active += 1;
    const beat = setInterval(() => heartbeat(job._id).catch(() => { }), HEARTBEAT_MS);
    const started = Date.now();
    try {
        log(`▶ ${job.type} ${job.mediaId} (attempt ${job.attempts})`);
        await processJob(job);
        await completeJob(job._id);
        log(`✔ ${job.type} ${job.mediaId} in ${((Date.now() - started) / 1000).toFixed(1)}s`);
    } catch (error) {
        log(`✖ ${job.type} ${job.mediaId}: ${error.message}`);
        await failJob(job._id, error);
        // Surface the failure on the asset so the admin UI can show it rather
        // than leaving it stuck in Processing with no explanation.
        await Media.updateOne({ mediaId: job.mediaId }, {
            $set: { 'processing.lastError': String(error.message).slice(0, 1000) },
            $inc: { 'processing.attempts': 1 },
        }).catch(() => { });
    } finally {
        clearInterval(beat);
        active -= 1;
    }
}

async function loop() {
    while (running) {
        let job = null;
        try {
            job = await claimNextJob();
        } catch (error) {
            log('claim failed:', error.message);
        }

        if (!job) {
            // eslint-disable-next-line no-await-in-loop
            await new Promise((r) => setTimeout(r, IDLE_DELAY_MS));
            continue;
        }
        // eslint-disable-next-line no-await-in-loop
        await runOne(job);
    }
}

async function main() {
    if (!isR2Configured()) {
        console.error('✖ R2 is not configured — set R2_* and R2_PUBLIC_URL.');
        process.exit(1);
    }
    if (!await ffmpegAvailable()) {
        console.error('✖ ffmpeg not found on PATH. Install it, or set FFMPEG_PATH.');
        process.exit(1);
    }

    DBconnection();
    await mongoose.connection.asPromise();
    log('started; polling for jobs');

    // Return work abandoned by a worker that died mid-job.
    const reclaimed = await reclaimStaleJobs();
    if (reclaimed) log(`reclaimed ${reclaimed} stale job(s)`);
    const reclaimTimer = setInterval(() => {
        reclaimStaleJobs().then((n) => n && log(`reclaimed ${n} stale job(s)`)).catch(() => { });
    }, RECLAIM_EVERY_MS);

    const shutdown = async (signal) => {
        if (!running) return;
        running = false;
        log(`${signal} — finishing ${active} in-flight job(s)`);
        clearInterval(reclaimTimer);
        // Let the current job finish; its lock keeps anyone else off it.
        while (active > 0) await new Promise((r) => setTimeout(r, 250));
        await mongoose.disconnect();
        process.exit(0);
    };
    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));

    await loop();
}

main().catch((error) => {
    console.error('worker fatal:', error);
    process.exit(1);
});
