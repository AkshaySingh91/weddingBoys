import express from 'express'
import { verifyToken } from '../../Middleware/auth.js'
import { requireSuperAdmin } from '../../Middleware/rbac.js'
import {
    listUsers, inviteUser, acceptInvite, updateUserRole, updateUserStatus, revokeUserSessions,
} from '../../Controllers/userController.js'

const Route = express.Router();

// Public: a brand-new admin completes onboarding from an emailed invite link.
Route.post('/api/admin/users/accept-invite', acceptInvite);

// Any authenticated admin can see the team roster.
Route.get('/api/admin/users', verifyToken, listUsers);

// Mutating team membership is SuperAdmin-only.
Route.post('/api/admin/users/invite', verifyToken, requireSuperAdmin, inviteUser);
Route.put('/api/admin/users/:id/role', verifyToken, requireSuperAdmin, updateUserRole);
Route.put('/api/admin/users/:id/status', verifyToken, requireSuperAdmin, updateUserStatus);
Route.delete('/api/admin/users/:id/sessions', verifyToken, requireSuperAdmin, revokeUserSessions);

export default Route;
