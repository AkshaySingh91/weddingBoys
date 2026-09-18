import { verifyToken } from './auth.js';

/**
 * Historical name used by every existing admin route. It now delegates to the
 * shared `verifyToken`, which understands both the new access-token cookie and
 * the legacy session cookie — so existing routes gain the new auth system
 * without any per-route changes.
 */
export default function authenticateAdmin(req, res, next) {
    return verifyToken(req, res, next);
}
