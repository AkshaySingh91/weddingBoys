import Admin from '../Models/adminSchema.js';
import { ACCOUNT_LOCK_MS, MAX_FAILED_LOGINS } from '../constants.js';
import { hashToken } from '../Utils/authTokens.js';

export function rejectLockedAccount(admin, res) {
    if (!admin.accountLockedUntil || admin.accountLockedUntil <= new Date()) return false;
    const minutes = Math.max(1, Math.ceil((admin.accountLockedUntil - Date.now()) / 60000));
    res.status(423).json({ message: `Account locked. Try again in ${minutes} minute(s).` });
    return true;
}

// Increment in the database rather than losing parallel failed attempts.
export async function recordLoginFailure(adminId, challengeId) {
    await Admin.updateOne({ _id: adminId, ...(challengeId ? { mfaChallengeHash: hashToken(challengeId) } : {}) }, [
        { $set: { failedLoginAttempts: { $add: [{ $ifNull: ['$failedLoginAttempts', 0] }, 1] } } },
        { $set: { accountLockedUntil: { $cond: [
            { $gte: ['$failedLoginAttempts', MAX_FAILED_LOGINS] },
            new Date(Date.now() + ACCOUNT_LOCK_MS), '$accountLockedUntil',
        ] } } },
    ]);
}

export function matchesMfaChallenge(admin, payload) {
    return admin.mfaChallengeHash === hashToken(payload.jti)
        && admin.mfaChallengeExpiresAt > new Date()
        && (admin.authVersion || 0) === (payload.authVersion || 0);
}

// Compare-and-clear the challenge. Only one concurrent verification can win.
export async function consumeMfaChallenge(admin, payload, req, recoveryIndex) {
    const now = new Date();
    return Admin.findOneAndUpdate({
        _id: admin._id, status: 'Active', mfaEnabled: true,
        $expr: { $eq: [{ $ifNull: ['$authVersion', 0] }, payload.authVersion || 0] },
        mfaChallengeHash: hashToken(payload.jti), mfaChallengeExpiresAt: { $gt: now },
        $or: [{ accountLockedUntil: null }, { accountLockedUntil: { $lte: now } }],
        ...(recoveryIndex !== undefined ? {
            [`mfaRecoveryCodes.${recoveryIndex}.usedAt`]: null,
            [`mfaRecoveryCodes.${recoveryIndex}.codeHash`]: admin.mfaRecoveryCodes[recoveryIndex].codeHash,
        } : { mfaSecret: admin.mfaSecret }),
    }, { $set: {
        mfaChallengeHash: null, mfaChallengeExpiresAt: null,
        failedLoginAttempts: 0, accountLockedUntil: null,
        lastLoginAt: now, lastLoginIp: req.ip,
        ...(recoveryIndex !== undefined ? { [`mfaRecoveryCodes.${recoveryIndex}.usedAt`]: now } : {}),
    } }, { new: true }).select('+mfaRecoveryCodes');
}
