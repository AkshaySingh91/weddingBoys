import jwt from 'jsonwebtoken';
import crypto from 'node:crypto';
import Session from '../Models/Session.js';
import {
    COOKIE_NAME, baseCookieOptions,
    ACCESS_TOKEN_TTL, ACCESS_TOKEN_TTL_MS,
    REFRESH_TOKEN_TTL_MS, MFA_TEMP_TOKEN_TTL,
} from '../constants.js';

// Opaque, high-entropy refresh token. Never stored raw — only its SHA-256.
export const generateRefreshToken = () => crypto.randomBytes(48).toString('hex');
export const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

// Short-lived JWT carrying just enough identity for authorization decisions.
export function signAccessToken(admin) {
    return jwt.sign(
        {
            sub: String(admin._id),
            userId: admin.userId,
            email: admin.email,
            name: admin.name,
            role: admin.role,
            // Legacy claim: existing middleware//controllers check `role === 'admin'`.
            legacyRole: 'admin',
        },
        process.env.JWT_SECRET_KEY,
        { expiresIn: ACCESS_TOKEN_TTL },
    );
}

export function verifyAccessToken(token) {
    const payload = jwt.verify(token, process.env.JWT_SECRET_KEY);
    // A half-authenticated MFA token must never be accepted as a session.
    if (payload.purpose === 'mfa') {
        throw new Error('MFA token cannot be used for authentication');
    }
    return payload;
}

/**
 * Short-lived token issued after a correct password when MFA is enabled.
 * It proves "password step passed" and nothing else — it is NOT a session,
 * carries no role, and is rejected by verifyAccessToken.
 */
export function signMfaTempToken(admin) {
    return jwt.sign(
        { sub: String(admin._id), purpose: 'mfa' },
        process.env.JWT_SECRET_KEY,
        { expiresIn: MFA_TEMP_TOKEN_TTL },
    );
}

export function verifyMfaTempToken(token) {
    const payload = jwt.verify(token, process.env.JWT_SECRET_KEY);
    if (payload.purpose !== 'mfa') {
        throw new Error('Not a valid MFA token');
    }
    return payload;
}

// Create a Session row + return the raw refresh token to hand to the browser.
export async function issueSession(admin, req) {
    const refreshToken = generateRefreshToken();
    await Session.create({
        userId: admin._id,
        refreshTokenHash: hashToken(refreshToken),
        deviceFingerprint: req.headers['user-agent'] || 'unknown',
        ipAddress: req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.ip,
        expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_MS),
        isValid: true,
    });
    return refreshToken;
}

// Write both cookies. HttpOnly + Secure + SameSite + signed — never readable by JS.
export function setAuthCookies(res, { accessToken, refreshToken, rememberMe = true }) {
    const opts = baseCookieOptions();
    res.cookie(COOKIE_NAME.access_token, accessToken, {
        ...opts,
        expires: new Date(Date.now() + ACCESS_TOKEN_TTL_MS),
    });
    if (refreshToken) {
        res.cookie(COOKIE_NAME.refresh_token, refreshToken, {
            ...opts,
            // A non-persistent session drops the refresh cookie on browser close.
            ...(rememberMe ? { expires: new Date(Date.now() + REFRESH_TOKEN_TTL_MS) } : {}),
        });
    }
}

export function clearAuthCookies(res) {
    const { signed, ...clearOpts } = baseCookieOptions();
    res.clearCookie(COOKIE_NAME.access_token, clearOpts);
    res.clearCookie(COOKIE_NAME.refresh_token, clearOpts);
    // Also drop any stale pre-migration cookie so a logout is total.
    res.clearCookie(COOKIE_NAME.legacy_session_token, clearOpts);
}
