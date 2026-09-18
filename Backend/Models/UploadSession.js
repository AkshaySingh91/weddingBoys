import mongoose from 'mongoose';

/**
 * A browser→R2 multipart upload in flight.
 *
 * This is the server-side half of resume. The browser cannot be trusted to
 * remember an upload across a refresh (persisting a 200 MB blob in IndexedDB is
 * not reliable), so the authoritative state lives here and the client only keeps
 * a small pointer keyed by a file fingerprint. On return the admin re-picks the
 * same file, we match it by fingerprint, ask R2 which parts already landed, and
 * continue from the first gap.
 *
 * `expiresAt` mirrors R2's own 7-day abort window for incomplete multipart
 * uploads, so a stale session and the stale R2 upload disappear together.
 */
const uploadSessionSchema = new mongoose.Schema({
    // Storage addressing
    mediaId: { type: String, required: true, index: true },
    key: { type: String, required: true },
    bucket: { type: String },
    uploadId: { type: String },          // absent for single-PUT (small) uploads

    // `${name}:${size}:${lastModified}` — identifies a re-picked File.
    fingerprint: { type: String, index: true },

    fileName: { type: String },
    fileSize: { type: Number },
    contentType: { type: String },
    partSize: { type: Number },
    partCount: { type: Number },

    // Where the finished asset belongs, captured up front so `complete` can
    // build the Media doc without the client restating it.
    ownerType: { type: String },
    ownerId: { type: mongoose.Schema.Types.Mixed, default: null },
    slot: { type: String },              // Website assets: 'hero' | 'bts' | 'page-<key>'
    rendition: { type: String, default: 'orig' },  // 'orig' | 'web' | 'loop' | 'poster'
    sourceMediaId: { type: String },     // set when this is a rendition of another asset

    meta: { type: mongoose.Schema.Types.Mixed, default: {} },

    status: {
        type: String,
        enum: ['Open', 'Completed', 'Aborted'],
        default: 'Open',
        index: true,
    },

    createdBy: { type: String },         // admin email from the session token
    expiresAt: { type: Date, required: true },
}, { timestamps: true });

// Sessions evaporate on their own once R2 has abandoned the upload.
uploadSessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
// Backs "what was I uploading?" for the signed-in admin.
uploadSessionSchema.index({ createdBy: 1, status: 1, updatedAt: -1 });

const UploadSession = mongoose.models.UploadSession
    || mongoose.model('UploadSession', uploadSessionSchema);
export default UploadSession;
