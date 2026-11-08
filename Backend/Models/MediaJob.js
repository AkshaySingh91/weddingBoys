import mongoose from 'mongoose';

/**
 * A unit of post-upload work: transcode a video, or build an image's derivative
 * ladder. Deliberately a MongoDB collection rather than Redis/BullMQ — the
 * volume here is a handful of jobs per upload, and adding a broker would be
 * infrastructure for its own sake.
 *
 * Claiming is a single atomic findOneAndUpdate (see Services/mediaJobQueue.js),
 * so multiple workers can never take the same job. `lockedAt` doubles as a
 * heartbeat: a job whose lock has gone stale is reclaimed, which is what makes a
 * killed worker recoverable rather than a permanent stall.
 */
const mediaJobSchema = new mongoose.Schema({
    mediaId: { type: String, required: true, index: true },
    idempotencyKey: String,
    type: {
        type: String,
        enum: ['transcode', 'derivatives', 'reconcile', 'sequence'],
        required: true,
    },
    status: {
        type: String,
        enum: ['queued', 'running', 'done', 'failed'],
        default: 'queued',
        index: true,
    },

    // Job-specific input, e.g. { makeLoop: true, stripAudio: true, loopStartSec: 12 }
    options: { type: mongoose.Schema.Types.Mixed, default: {} },

    attempts: { type: Number, default: 0 },
    maxAttempts: { type: Number, default: 3 },
    lastError: { type: String },

    lockedAt: { type: Date },        // heartbeat; stale ⇒ reclaimable
    lockedBy: { type: String },      // `${hostname}:${pid}`
    startedAt: { type: Date },
    finishedAt: { type: Date },

    // Backoff: a failed job is not eligible again until this time.
    runAfter: { type: Date, default: () => new Date() },
}, { timestamps: true });

mediaJobSchema.index({ idempotencyKey: 1 }, { unique: true, partialFilterExpression: { idempotencyKey: { $type: 'string' } } });

// The claim query: eligible work, oldest first.
mediaJobSchema.index({ status: 1, runAfter: 1, createdAt: 1 });
// Reclaim sweep for jobs whose worker died mid-flight.
mediaJobSchema.index({ status: 1, lockedAt: 1 });
// Finished jobs are audit trail only — let them expire after a week.
mediaJobSchema.index({ finishedAt: 1 }, { expireAfterSeconds: 7 * 24 * 60 * 60 });

const MediaJob = mongoose.models.MediaJob || mongoose.model('MediaJob', mediaJobSchema);
export default MediaJob;
