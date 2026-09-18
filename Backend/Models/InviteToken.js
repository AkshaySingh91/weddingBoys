import mongoose from 'mongoose';
import { ALL_ROLES, ROLES } from '../constants.js';

// Password-less admin onboarding. Only the hash of the invite token is stored;
// the raw token lives solely in the emailed invitation link.
const inviteTokenSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        lowercase: true,
        trim: true,
        index: true,
    },
    role: {
        type: String,
        enum: ALL_ROLES,
        default: ROLES.EDITOR,
    },
    tokenHash: { type: String, required: true, index: true },
    invitedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
    expiresAt: { type: Date, required: true },
    acceptedAt: { type: Date, default: null },
}, { timestamps: true });

inviteTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.models.InviteToken || mongoose.model('InviteToken', inviteTokenSchema);
