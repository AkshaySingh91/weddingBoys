import mongoose from 'mongoose'
import * as uuid from 'uuid'
import { ALL_ROLES, ROLES } from '../constants.js'

// Enterprise admin/user entity. Kept under the `Admin` model name (rather than
// renaming to `User`) because BlogPost.author and every existing admin surface
// already reference 'Admin' — renaming would silently break those refs.
const adminSchema = new mongoose.Schema({
    userId: {
        type: String,
        unique: true,
        default: () => uuid.v4(),
        index: true,
    },
    // Legacy display name, kept in sync with firstName/lastName.
    name: {
        type: String,
        trim: true,
        required: true
    },
    firstName: { type: String, trim: true },
    lastName: { type: String, trim: true },
    email: {
        type: String,
        unique: true,
        lowercase: true,
        trim: true,
        index: true,
        validate: {
            validator: function (v) {
                return /^\S+@\S+\.\S+$/.test(v);
            },
            message: (props) => `${props.value} is not a valid email!`,
        },
    },
    phone: {
        type: String,
        unique: true,
        sparse: true,
        validate: {
            validator: function (v) {
                if (!v) return true;
                return /^\+91 ?\d{10}$/.test(v);
            },
            message: (props) => `${props.value} is not a valid phone number!`,
        }
    },
    // bcrypt hash. Field name kept as `password` for back-compat with the
    // existing login/signup controllers.
    password: {
        type: String,
        required: true,
    },
    // Legacy avatar object ({ key }); `avatarMedia` is the new Media reference.
    avatar: {
        type: Object,
        required: false,
        default: null,
    },
    avatarMedia: { type: mongoose.Schema.Types.ObjectId, ref: 'Media', default: null },

    // ---- RBAC ----
    role: {
        type: String,
        enum: ALL_ROLES,
        default: ROLES.EDITOR,
        index: true,
    },

    // ---- Security / lifecycle ----
    status: {
        type: String,
        enum: ['Active', 'Suspended', 'Invited'],
        default: 'Active',
        index: true,
    },
    mfaEnabled: { type: Boolean, default: false },
    mfaSecret: { type: String, default: null, select: false },
    // Single-use backup codes for when the authenticator device is lost.
    // Only bcrypt hashes are stored; the plaintext is shown exactly once.
    mfaRecoveryCodes: {
        type: [{
            codeHash: { type: String, required: true },
            usedAt: { type: Date, default: null },
        }],
        default: [],
        select: false,
    },

    // ---- Password reset ----
    passwordResetTokenHash: { type: String, default: null, select: false },
    passwordResetExpiresAt: { type: Date, default: null, select: false },

    // ---- Audit / brute-force ----
    lastLoginAt: { type: Date, default: null },
    lastLoginIp: { type: String, default: null },
    failedLoginAttempts: { type: Number, default: 0 },
    accountLockedUntil: { type: Date, default: null },
}, { timestamps: true });

// Keep `name` and firstName/lastName consistent regardless of which was set.
adminSchema.pre('save', function (next) {
    if (!this.name && (this.firstName || this.lastName)) {
        this.name = [this.firstName, this.lastName].filter(Boolean).join(' ');
    }
    if (this.name && !this.firstName) {
        const [first, ...rest] = this.name.trim().split(/\s+/);
        this.firstName = first;
        this.lastName = rest.join(' ') || undefined;
    }
    next();
});

adminSchema.virtual('isLocked').get(function () {
    return !!(this.accountLockedUntil && this.accountLockedUntil > new Date());
});

export default mongoose.models.Admin || mongoose.model('Admin', adminSchema);
