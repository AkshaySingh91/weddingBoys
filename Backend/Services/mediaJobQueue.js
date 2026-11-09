/**
 * Claim/complete semantics for the media job queue.
 *
 * Kept separate from the worker loop so the API process can enqueue without
 * pulling in ffmpeg or sharp, and so the claim logic can be tested on its own.
 */
import os from 'node:os';
import MediaJob from '../Models/MediaJob.js';

/** A lock older than this means the worker holding it is gone. */
export const LOCK_TTL_MS = 5 * 60 * 1000;

export const workerId = () => `${os.hostname()}:${process.pid}`;

/**
 * Queue a job, unless an equivalent one is already pending.
 *
 * The dedupe matters: re-running the migration or retrying an upload must not
 * pile up duplicate transcodes of the same 200 MB file.
 */
export async function enqueueJob({ mediaId, type, options = {}, idempotencyKey }) {
    if (idempotencyKey) {
        try {
            return await MediaJob.findOneAndUpdate({ idempotencyKey },
                { $setOnInsert: { mediaId, type, options, idempotencyKey } },
                { upsert: true, new: true, setDefaultsOnInsert: true });
        } catch (error) {
            if (error.code !== 11000) throw error;
            return MediaJob.findOne({ idempotencyKey });
        }
    }
    const existing = await MediaJob.findOne({
        mediaId, type, status: { $in: ['queued', 'running'] },
    }).lean();
    if (existing) return existing;
    return MediaJob.create({ mediaId, type, options });
}

/**
 * Atomically take the next eligible job.
 *
 * One findOneAndUpdate does both the selection and the lock, so two workers
 * racing for the same document cannot both win.
 */
export async function claimNextJob(types = ['transcode', 'derivatives', 'reconcile', 'sequence', 'hero']) {
    const now = new Date();
    return MediaJob.findOneAndUpdate(
        {
            type: { $in: types },
            status: 'queued',
            runAfter: { $lte: now },
        },
        {
            $set: { status: 'running', lockedAt: now, lockedBy: workerId(), startedAt: now },
            $inc: { attempts: 1 },
        },
        { sort: { runAfter: 1, createdAt: 1 }, new: true },
    );
}

/** Keep a long-running job's lock alive so the reaper does not steal it. */
export async function heartbeat(jobId) {
    await MediaJob.updateOne({ _id: jobId, status: 'running' }, { $set: { lockedAt: new Date() } });
}

export async function completeJob(jobId) {
    await MediaJob.updateOne({ _id: jobId }, {
        $set: { status: 'done', finishedAt: new Date(), lastError: null },
        $unset: { lockedAt: '', lockedBy: '' },
    });
}

/** Fail with exponential backoff, or give up once maxAttempts is spent. */
export async function failJob(jobId, error) {
    const job = await MediaJob.findById(jobId);
    if (!job) return;

    const message = String(error?.message || error).slice(0, 1000);
    const exhausted = job.attempts >= job.maxAttempts;

    job.status = exhausted ? 'failed' : 'queued';
    job.lastError = message;
    job.lockedAt = undefined;
    job.lockedBy = undefined;
    if (exhausted) job.finishedAt = new Date();
    else job.runAfter = new Date(Date.now() + Math.min(30 * 60_000, 2 ** job.attempts * 30_000));

    await job.save();
}

/**
 * Return jobs whose worker died back to the queue.
 *
 * Without this a `kill -9` mid-transcode would leave the job 'running' forever
 * and the asset stuck in Processing.
 */
export async function reclaimStaleJobs() {
    const cutoff = new Date(Date.now() - LOCK_TTL_MS);
    const res = await MediaJob.updateMany(
        { status: 'running', lockedAt: { $lt: cutoff } },
        { $set: { status: 'queued', runAfter: new Date() }, $unset: { lockedAt: '', lockedBy: '' } },
    );
    return res.modifiedCount || 0;
}
