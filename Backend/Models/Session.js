import mongoose from 'mongoose';

// One document per logged-in device. The refresh token is only ever stored as
// a SHA-256 hash, so a DB leak cannot be replayed as a valid session.
const sessionSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Admin',
        required: true,
        index: true,
    },
    refreshTokenHash: { type: String, required: true, index: true },
    deviceFingerprint: { type: String },   // User-Agent string
    ipAddress: { type: String },
    expiresAt: { type: Date, required: true },
    isValid: { type: Boolean, default: true, index: true },
    lastUsedAt: { type: Date, default: Date.now },
}, { timestamps: true });

// Let MongoDB reap expired sessions automatically.
sessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.models.Session || mongoose.model('Session', sessionSchema);
