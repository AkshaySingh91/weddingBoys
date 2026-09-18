import { COOKIE_NAME } from '../constants.js';
import { verifyAccessToken } from '../Utils/authTokens.js';

/**
 * Strict access-token verification. Reads the signed, HttpOnly access-token
 * cookie, verifies the JWT and attaches `req.user`.
 *
 * The legacy `session-token` fallback has been removed — pre-migration cookies
 * are no longer honoured anywhere, so every protected route now requires a
 * token minted by the current auth system.
 */
export function verifyToken(req, res, next) {
    const accessToken = req.signedCookies?.[COOKIE_NAME.access_token]?.trim();

    if (!accessToken) {
        return res.status(401).json({ message: 'Unauthorized: No token provided' });
    }

    try {
        const payload = verifyAccessToken(accessToken);
        req.user = {
            id: payload.sub,
            userId: payload.userId,
            email: payload.email,
            name: payload.name,
            role: payload.role,
        };
        // Back-compat shape for controllers that still read req.admin.
        req.admin = { ...req.user, role: 'admin', appRole: payload.role };
        return next();
    } catch (err) {
        return res.status(401).json({
            message: 'Unauthorized: access token invalid or expired',
            code: 'TOKEN_EXPIRED',
        });
    }
}

export default verifyToken;
