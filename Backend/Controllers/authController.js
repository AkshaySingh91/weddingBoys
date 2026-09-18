import bcrypt from 'bcrypt';
import crypto from 'node:crypto';
import { z } from 'zod';
import QRCode from 'qrcode';
import Admin from '../Models/adminSchema.js';
import Session from '../Models/Session.js';
import {
    COOKIE_NAME, MAX_FAILED_LOGINS, ACCOUNT_LOCK_MS, REFRESH_TOKEN_TTL_MS,
} from '../constants.js';
import {
    signAccessToken, issueSession, setAuthCookies, clearAuthCookies,
    hashToken, generateRefreshToken, signMfaTempToken, verifyMfaTempToken,
} from '../Utils/authTokens.js';
import { sendMail, passwordResetEmail } from '../Utils/mailer.js';
import { generateTotpSecret, buildOtpAuthUrl, verifyTotp } from '../Utils/totp.js';
import {
    generateRecoveryCodes, hashRecoveryCodes, findRecoveryCodeIndex,
} from '../Utils/recoveryCodes.js';

// ---------------- validation ----------------
const passwordRule = z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Za-z]/, 'Password must contain a letter')
    .regex(/\d/, 'Password must contain a number');

const loginSchema = z.object({
    email: z.string().email('Invalid email'),
    password: z.string().min(1, 'Password is required'),
    rememberMe: z.boolean().optional().default(true),
});

const forgotSchema = z.object({ email: z.string().email('Invalid email') });

const resetSchema = z.object({
    token: z.string().min(10, 'Invalid reset token'),
    password: passwordRule,
});

// Turn a ZodError into a flat, UI-friendly payload.
const zodFail = (res, error) => res.status(400).json({
    message: error.issues[0]?.message || 'Invalid request',
    errors: error.issues.map((i) => ({ field: i.path.join('.'), message: i.message })),
});

const clientIp = (req) => req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.ip;

const publicUser = (admin) => ({
    id: admin._id,
    userId: admin.userId,
    name: admin.name,
    firstName: admin.firstName,
    lastName: admin.lastName,
    email: admin.email,
    phone: admin.phone,
    role: admin.role,
    status: admin.status,
    avatar: admin.avatar,
    mfaEnabled: admin.mfaEnabled,
    lastLoginAt: admin.lastLoginAt,
});

// ---------------- POST /api/admin/auth/login ----------------
export async function login(req, res) {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) return zodFail(res, parsed.error);
    const { email, password, rememberMe } = parsed.data;

    try {
        const admin = await Admin.findOne({ email: email.toLowerCase() });
        // Generic message either way — never reveal whether the email exists.
        const invalid = () => res.status(401).json({ message: 'Invalid email or password' });
        if (!admin) return invalid();

        if (admin.accountLockedUntil && admin.accountLockedUntil > new Date()) {
            const mins = Math.ceil((admin.accountLockedUntil - Date.now()) / 60000);
            return res.status(423).json({ message: `Account locked. Try again in ${mins} minute(s).` });
        }
        if (admin.status === 'Suspended') {
            return res.status(403).json({ message: 'This account has been suspended.' });
        }

        const ok = await bcrypt.compare(password, admin.password);
        if (!ok) {
            admin.failedLoginAttempts = (admin.failedLoginAttempts || 0) + 1;
            if (admin.failedLoginAttempts >= MAX_FAILED_LOGINS) {
                admin.accountLockedUntil = new Date(Date.now() + ACCOUNT_LOCK_MS);
                admin.failedLoginAttempts = 0;
            }
            await admin.save();
            return invalid();
        }

        // Password is correct — clear the brute-force counters either way.
        admin.failedLoginAttempts = 0;
        admin.accountLockedUntil = null;

        // MFA gate: stop here and hand back a short-lived token that only
        // permits the TOTP step. No session cookies are issued yet.
        if (admin.mfaEnabled) {
            await admin.save();
            return res.status(200).json({
                requiresMfa: true,
                tempToken: signMfaTempToken(admin),
            });
        }

        admin.lastLoginAt = new Date();
        admin.lastLoginIp = clientIp(req);
        if (admin.status === 'Invited') admin.status = 'Active';
        await admin.save();

        const accessToken = signAccessToken(admin);
        const refreshToken = await issueSession(admin, req);
        setAuthCookies(res, { accessToken, refreshToken, rememberMe });

        return res.status(200).json({ message: 'Logged in', user: publicUser(admin) });
    } catch (error) {
        console.error('login error:', error);
        return res.status(500).json({ message: 'Server error' });
    }
}

// ---------------- POST /api/admin/auth/mfa/login-verify ----------------
// Completes a login that stopped at the MFA gate.
export async function mfaLoginVerify(req, res) {
    const schema = z.object({
        tempToken: z.string().min(10),
        code: z.string().regex(/^\d{6}$/, 'Enter the 6-digit code'),
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) return zodFail(res, parsed.error);
    const { tempToken, code } = parsed.data;

    try {
        let payload;
        try {
            payload = verifyMfaTempToken(tempToken);
        } catch {
            return res.status(401).json({ message: 'Verification window expired. Please sign in again.' });
        }

        const admin = await Admin.findById(payload.sub).select('+mfaSecret');
        if (!admin || !admin.mfaEnabled || !admin.mfaSecret) {
            return res.status(400).json({ message: 'Two-factor authentication is not enabled for this account' });
        }
        if (admin.status === 'Suspended') {
            return res.status(403).json({ message: 'This account has been suspended.' });
        }

        if (!await verifyTotp(code, admin.mfaSecret)) {
            admin.failedLoginAttempts = (admin.failedLoginAttempts || 0) + 1;
            if (admin.failedLoginAttempts >= MAX_FAILED_LOGINS) {
                admin.accountLockedUntil = new Date(Date.now() + ACCOUNT_LOCK_MS);
                admin.failedLoginAttempts = 0;
            }
            await admin.save();
            return res.status(400).json({ message: 'Invalid verification code' });
        }

        admin.failedLoginAttempts = 0;
        admin.accountLockedUntil = null;
        admin.lastLoginAt = new Date();
        admin.lastLoginIp = clientIp(req);
        if (admin.status === 'Invited') admin.status = 'Active';
        await admin.save();

        const accessToken = signAccessToken(admin);
        const refreshToken = await issueSession(admin, req);
        setAuthCookies(res, { accessToken, refreshToken, rememberMe: true });

        return res.status(200).json({ message: 'Logged in', user: publicUser(admin) });
    } catch (error) {
        console.error('mfaLoginVerify error:', error);
        return res.status(500).json({ message: 'Server error' });
    }
}

// ---------------- POST /api/admin/auth/mfa/recovery-verify ----------------
// Escape hatch when the authenticator device is lost. Each code works once.
export async function mfaRecoveryVerify(req, res) {
    const schema = z.object({
        tempToken: z.string().min(10),
        recoveryCode: z.string().min(8, 'Enter one of your backup codes'),
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) return zodFail(res, parsed.error);
    const { tempToken, recoveryCode } = parsed.data;

    try {
        let payload;
        try {
            payload = verifyMfaTempToken(tempToken);
        } catch {
            return res.status(401).json({ message: 'Verification window expired. Please sign in again.' });
        }

        const admin = await Admin.findById(payload.sub).select('+mfaRecoveryCodes');
        if (!admin || !admin.mfaEnabled) {
            return res.status(400).json({ message: 'Two-factor authentication is not enabled for this account' });
        }
        if (admin.status === 'Suspended') {
            return res.status(403).json({ message: 'This account has been suspended.' });
        }

        const index = await findRecoveryCodeIndex(admin.mfaRecoveryCodes, recoveryCode);
        if (index === -1) {
            admin.failedLoginAttempts = (admin.failedLoginAttempts || 0) + 1;
            if (admin.failedLoginAttempts >= MAX_FAILED_LOGINS) {
                admin.accountLockedUntil = new Date(Date.now() + ACCOUNT_LOCK_MS);
                admin.failedLoginAttempts = 0;
            }
            await admin.save();
            return res.status(401).json({ message: 'Invalid or already-used backup code' });
        }

        // Burn the code so it can never be replayed.
        admin.mfaRecoveryCodes[index].usedAt = new Date();
        admin.markModified('mfaRecoveryCodes');

        admin.failedLoginAttempts = 0;
        admin.accountLockedUntil = null;
        admin.lastLoginAt = new Date();
        admin.lastLoginIp = clientIp(req);
        if (admin.status === 'Invited') admin.status = 'Active';
        await admin.save();

        const remaining = admin.mfaRecoveryCodes.filter((c) => !c.usedAt).length;

        const accessToken = signAccessToken(admin);
        const refreshToken = await issueSession(admin, req);
        setAuthCookies(res, { accessToken, refreshToken, rememberMe: true });

        return res.status(200).json({
            message: 'Logged in with a backup code',
            user: publicUser(admin),
            recoveryCodesRemaining: remaining,
        });
    } catch (error) {
        console.error('mfaRecoveryVerify error:', error);
        return res.status(500).json({ message: 'Server error' });
    }
}

// ---------------- POST /api/admin/auth/mfa/setup ---------------- (authenticated)
// Generates a fresh secret + QR. Nothing is enabled until verify-setup succeeds.
export async function mfaSetup(req, res) {
    try {
        const admin = await Admin.findById(req.user.id);
        if (!admin) return res.status(404).json({ message: 'User not found' });
        if (admin.mfaEnabled) {
            return res.status(400).json({ message: 'Two-factor authentication is already enabled' });
        }

        const secret = await generateTotpSecret();
        const otpauthUrl = buildOtpAuthUrl(admin.email, secret);
        const qrCodeDataUrl = await QRCode.toDataURL(otpauthUrl);

        // Stash the pending secret but leave mfaEnabled false until verified.
        admin.mfaSecret = secret;
        await admin.save();

        return res.status(200).json({
            otpauthUrl,
            qrCode: qrCodeDataUrl,   // base64 data: URI, render directly in an <img>
            secret,                  // shown for manual entry into the app
        });
    } catch (error) {
        console.error('mfaSetup error:', error);
        return res.status(500).json({ message: 'Server error' });
    }
}

// ---------------- POST /api/admin/auth/mfa/verify-setup ---------------- (authenticated)
export async function mfaVerifySetup(req, res) {
    const schema = z.object({ code: z.string().regex(/^\d{6}$/, 'Enter the 6-digit code') });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) return zodFail(res, parsed.error);

    try {
        const admin = await Admin.findById(req.user.id).select('+mfaSecret +mfaRecoveryCodes');
        if (!admin) return res.status(404).json({ message: 'User not found' });
        if (!admin.mfaSecret) {
            return res.status(400).json({ message: 'Start setup first' });
        }
        if (!await verifyTotp(parsed.data.code, admin.mfaSecret)) {
            return res.status(400).json({ message: 'That code is not valid. Check your authenticator app and try again.' });
        }

        // Mint single-use backup codes. Plaintext is returned exactly once here
        // and never persisted — only bcrypt hashes are stored.
        const recoveryCodes = generateRecoveryCodes();
        admin.mfaRecoveryCodes = await hashRecoveryCodes(recoveryCodes);
        admin.mfaEnabled = true;
        await admin.save();

        return res.status(200).json({
            message: 'Two-factor authentication enabled',
            mfaEnabled: true,
            recoveryCodes,
        });
    } catch (error) {
        console.error('mfaVerifySetup error:', error);
        return res.status(500).json({ message: 'Server error' });
    }
}

// ---------------- POST /api/admin/auth/mfa/disable ---------------- (authenticated)
// Requires the current password so a hijacked session can't silently strip MFA.
export async function mfaDisable(req, res) {
    const schema = z.object({ password: z.string().min(1, 'Password is required') });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) return zodFail(res, parsed.error);

    try {
        const admin = await Admin.findById(req.user.id);
        if (!admin) return res.status(404).json({ message: 'User not found' });

        if (!await bcrypt.compare(parsed.data.password, admin.password)) {
            return res.status(401).json({ message: 'Incorrect password' });
        }

        admin.mfaEnabled = false;
        admin.mfaSecret = null;
        // Stale backup codes must not survive a disable/re-enable cycle.
        admin.mfaRecoveryCodes = [];
        await admin.save();

        return res.status(200).json({ message: 'Two-factor authentication disabled', mfaEnabled: false });
    } catch (error) {
        console.error('mfaDisable error:', error);
        return res.status(500).json({ message: 'Server error' });
    }
}

// ---------------- POST /api/admin/auth/mfa/regenerate-codes ---------------- (authenticated)
// Issues a fresh set of backup codes. Re-authenticates with the current
// password so a hijacked session can't silently mint itself new codes
// (which would be a durable backdoor even after the password is changed).
export async function mfaRegenerateCodes(req, res) {
    const schema = z.object({ password: z.string().min(1, 'Password is required') });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) return zodFail(res, parsed.error);

    try {
        const admin = await Admin.findById(req.user.id).select('+mfaRecoveryCodes');
        if (!admin) return res.status(404).json({ message: 'User not found' });
        if (!admin.mfaEnabled) {
            return res.status(400).json({ message: 'Enable two-factor authentication first' });
        }

        if (!await bcrypt.compare(parsed.data.password, admin.password)) {
            return res.status(401).json({ message: 'Incorrect password' });
        }

        // Replace outright — every previously issued code is invalidated.
        const recoveryCodes = generateRecoveryCodes();
        admin.mfaRecoveryCodes = await hashRecoveryCodes(recoveryCodes);
        admin.markModified('mfaRecoveryCodes');
        await admin.save();

        return res.status(200).json({
            message: 'New backup codes generated. Your previous codes no longer work.',
            recoveryCodes,
        });
    } catch (error) {
        console.error('mfaRegenerateCodes error:', error);
        return res.status(500).json({ message: 'Server error' });
    }
}

// ---------------- POST /api/admin/auth/refresh ----------------
export async function refresh(req, res) {
    try {
        const raw = req.signedCookies?.[COOKIE_NAME.refresh_token]?.trim();
        if (!raw) return res.status(401).json({ message: 'No refresh token' });

        const session = await Session.findOne({ refreshTokenHash: hashToken(raw), isValid: true });
        if (!session || session.expiresAt < new Date()) {
            clearAuthCookies(res);
            return res.status(401).json({ message: 'Session expired, please log in again' });
        }

        const admin = await Admin.findById(session.userId);
        if (!admin || admin.status === 'Suspended') {
            session.isValid = false;
            await session.save();
            clearAuthCookies(res);
            return res.status(403).json({ message: 'Account unavailable' });
        }

        // Rotate the refresh token so a stolen one can't be reused.
        const nextRefresh = generateRefreshToken();
        session.refreshTokenHash = hashToken(nextRefresh);
        session.expiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL_MS);
        session.lastUsedAt = new Date();
        await session.save();

        const accessToken = signAccessToken(admin);
        setAuthCookies(res, { accessToken, refreshToken: nextRefresh, rememberMe: true });

        return res.status(200).json({ message: 'Refreshed', user: publicUser(admin) });
    } catch (error) {
        console.error('refresh error:', error);
        return res.status(500).json({ message: 'Server error' });
    }
}

// ---------------- POST /api/admin/auth/logout ----------------
export async function logout(req, res) {
    try {
        const raw = req.signedCookies?.[COOKIE_NAME.refresh_token]?.trim();
        if (raw) {
            await Session.findOneAndUpdate({ refreshTokenHash: hashToken(raw) }, { isValid: false });
        }
        clearAuthCookies(res);
        return res.status(200).json({ message: 'Logged out' });
    } catch (error) {
        console.error('logout error:', error);
        clearAuthCookies(res);
        return res.status(200).json({ message: 'Logged out' });
    }
}

// ---------------- GET /api/admin/auth/me ----------------
export async function me(req, res) {
    try {
        const admin = await Admin.findById(req.user.id).select('+mfaRecoveryCodes')
            || await Admin.findOne({ email: req.user.email }).select('+mfaRecoveryCodes');
        if (!admin) return res.status(404).json({ message: 'User not found' });
        return res.status(200).json({
            user: {
                ...publicUser(admin),
                recoveryCodesRemaining: (admin.mfaRecoveryCodes || []).filter((c) => !c.usedAt).length,
            },
        });
    } catch (error) {
        return res.status(500).json({ message: 'Server error' });
    }
}

// ---------------- POST /api/admin/auth/forgot-password ----------------
export async function forgotPassword(req, res) {
    const parsed = forgotSchema.safeParse(req.body);
    if (!parsed.success) return zodFail(res, parsed.error);

    // Always answer 200 so the endpoint can't be used to enumerate accounts.
    const generic = { message: 'If that email is registered, a reset link has been sent.' };
    try {
        const admin = await Admin.findOne({ email: parsed.data.email.toLowerCase() });
        if (!admin) return res.status(200).json(generic);

        const rawToken = crypto.randomBytes(32).toString('hex');
        admin.passwordResetTokenHash = hashToken(rawToken);
        admin.passwordResetExpiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
        await admin.save();

        const resetUrl = `${process.env.ADMIN_URL || 'https://admin.theweddingboys.in'}/reset-password/${rawToken}`;

        const { subject, html, text } = passwordResetEmail({ name: admin.firstName || admin.name, resetUrl });
        // sendMail never throws — a mail outage must not change this response.
        await sendMail({ to: admin.email, subject, html, text });

        return res.status(200).json({
            ...generic,
            // Surfaced only outside production so the flow is testable locally.
            ...(process.env.NODE_ENV !== 'production' ? { devResetUrl: resetUrl } : {}),
        });
    } catch (error) {
        console.error('forgotPassword error:', error);
        return res.status(200).json(generic);
    }
}

// ---------------- POST /api/admin/auth/reset-password ----------------
export async function resetPassword(req, res) {
    const parsed = resetSchema.safeParse(req.body);
    if (!parsed.success) return zodFail(res, parsed.error);
    const { token, password } = parsed.data;

    try {
        const admin = await Admin.findOne({
            passwordResetTokenHash: hashToken(token),
            passwordResetExpiresAt: { $gt: new Date() },
        }).select('+passwordResetTokenHash +passwordResetExpiresAt');

        if (!admin) {
            return res.status(400).json({ message: 'Reset link is invalid or has expired' });
        }

        admin.password = await bcrypt.hash(password, await bcrypt.genSalt(10));
        admin.passwordResetTokenHash = null;
        admin.passwordResetExpiresAt = null;
        admin.failedLoginAttempts = 0;
        admin.accountLockedUntil = null;
        if (admin.status === 'Invited') admin.status = 'Active';
        await admin.save();

        // A password change must invalidate every existing device session.
        await Session.updateMany({ userId: admin._id }, { isValid: false });
        clearAuthCookies(res);

        return res.status(200).json({ message: 'Password updated. Please log in.' });
    } catch (error) {
        console.error('resetPassword error:', error);
        return res.status(500).json({ message: 'Server error' });
    }
}

// ---------------- GET /api/admin/auth/sessions ----------------
export async function mySessions(req, res) {
    try {
        const sessions = await Session.find({ userId: req.user.id, isValid: true })
            .sort('-lastUsedAt')
            .select('-refreshTokenHash');
        return res.status(200).json({ sessions });
    } catch (error) {
        return res.status(500).json({ message: 'Server error' });
    }
}
