import { COOKIE_NAME } from '../constants.js';
import { verifyAccessToken } from '../Utils/authTokens.js';
import Admin from '../Models/adminSchema.js';
const VERIFIED = Symbol('verifiedAdmin');

/**
 * Strict access-token verification. Reads the signed, HttpOnly access-token
 * cookie, verifies the JWT and attaches `req.user`.
 *
 * The legacy `session-token` fallback has been removed — pre-migration cookies
 * are no longer honoured anywhere, so every protected route now requires a
 * token minted by the current auth system.
 */
export async function verifyToken(req, res, next) {
    if (req[VERIFIED]) return next();
    const raw = req.signedCookies?.[COOKIE_NAME.access_token];
    const accessToken = typeof raw === 'string' ? raw.trim() : '';

    if (!accessToken) {
        return res.status(401).json({ message: 'Unauthorized: No token provided' });
    }

    let payload;
    try {
        payload = verifyAccessToken(accessToken);
    } catch {
        return res.status(401).json({ message: 'Unauthorized: access token invalid or expired', code: 'TOKEN_EXPIRED' });
    }
    let admin;
    try {
        admin = await Admin.findById(payload.sub).select('userId email name phone role status authVersion').lean();
    } catch {
        return res.status(503).json({ message: 'Account verification is temporarily unavailable' });
    }
    if (!admin || (admin.status || 'Active') !== 'Active' || (admin.authVersion || 0) !== (payload.authVersion || 0)) {
        return res.status(401).json({ message: 'Account or session is no longer active', code: 'SESSION_REVOKED' });
    }
    req.user = {
        id: String(admin._id), userId: admin.userId, email: admin.email,
        name: admin.name, phone: admin.phone, role: admin.role || 'Editor',
    };
    req.admin = { ...req.user, role: 'admin', appRole: req.user.role };
    req[VERIFIED] = true;
    return next();
}

export default verifyToken;
