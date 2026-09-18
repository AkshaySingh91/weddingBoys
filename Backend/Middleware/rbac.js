import { ROLES } from '../constants.js';

/**
 * Route guard. Use after `verifyToken`.
 *   router.put('/x', verifyToken, requireRole([ROLES.SUPER_ADMIN]), handler)
 */
export function requireRole(allowedRoles = []) {
    const allowed = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
    return (req, res, next) => {
        const role = req.user?.role;
        if (!role) {
            return res.status(401).json({ message: 'Unauthorized' });
        }
        // SuperAdmin implicitly passes every role check.
        if (role === ROLES.SUPER_ADMIN || allowed.includes(role)) {
            return next();
        }
        return res.status(403).json({ message: 'Forbidden: insufficient permissions' });
    };
}

export const requireSuperAdmin = requireRole([ROLES.SUPER_ADMIN]);

export default requireRole;
