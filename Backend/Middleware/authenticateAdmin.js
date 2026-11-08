import { verifyToken } from './auth.js';

/**
 * Historical name used by every existing admin route. It now delegates to the
 * shared access-token verifier. Legacy session cookies are not accepted.
 */
export default function authenticateAdmin(req, res, next) {
    return verifyToken(req, res, next);
}
