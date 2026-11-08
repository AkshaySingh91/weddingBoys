import { verifyToken } from './auth.js';
import { ROLES } from '../constants.js';

const PUBLIC_POSTS = new Set([
    '/api/admin/auth/login', '/api/admin/auth/refresh', '/api/admin/auth/logout',
    '/api/admin/auth/forgot-password', '/api/admin/auth/reset-password',
    '/api/admin/auth/mfa/login-verify', '/api/admin/auth/mfa/recovery-verify',
    '/api/admin/users/accept-invite',
]);

// Staff may read the workspace. Mutations are explicitly split by responsibility;
// account self-service is open to every authenticated role. Unknown writes fail closed.
export function authorizeAdmin(req, res, next) {
    const path = (req.originalUrl || req.url).split('?')[0].replace(/\/$/, '').toLowerCase();
    const role = req.user?.role;
    if (role === ROLES.SUPER_ADMIN) return next();
    if (!Object.values(ROLES).includes(role)) return res.status(401).json({ message: 'Unauthorized' });
    if (/^\/api\/admin\/(auth|profile)(\/|$)/.test(path)) return next();
    const privateBusinessData = /^\/api\/admin\/(get-clients-enquiry|enquires|studio-setting|config|pricing)(\/|$)/.test(path);
    if (!privateBusinessData && ['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next();
    const editor = /^\/api\/admin\/(blogs|comments|content|homepage|home-page|review|reviews|team)(\/|$)/.test(path);
    const portfolio = /^\/api\/admin\/(portfolio|clients?|add-client|collections|taxonomy|ceremonies|map-clients|filmpage|photopage|tags)(\/|$)/.test(path) || /^\/api\/admin\/homepage\/tags(\/|$)/.test(path);
    const sharedMedia = /^\/api\/admin\/(media|uploads|embed)(\/|$)/.test(path);
    if (!privateBusinessData && (sharedMedia || (editor && role === ROLES.EDITOR) || (portfolio && role === ROLES.PORTFOLIO_MANAGER))) return next();
    return res.status(403).json({ message: 'Your role does not permit this action' });
}

export function protectAdmin(req, res, next) {
    const path = (req.originalUrl || req.url).split('?')[0].replace(/\/$/, '').toLowerCase();
    if (req.method === 'POST' && PUBLIC_POSTS.has(path)) return next();
    return verifyToken(req, res, () => authorizeAdmin(req, res, next));
}
