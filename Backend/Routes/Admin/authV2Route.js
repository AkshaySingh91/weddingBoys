import express from 'express'
import { verifyToken } from '../../Middleware/auth.js'
import {
    login, refresh, logout, me, forgotPassword, resetPassword, mySessions,
    mfaLoginVerify, mfaRecoveryVerify, mfaSetup, mfaVerifySetup, mfaDisable,
    mfaRegenerateCodes,
} from '../../Controllers/authController.js'

const Route = express.Router();

// ---- public ----
Route.post('/api/admin/auth/login', login);
Route.post('/api/admin/auth/refresh', refresh);
Route.post('/api/admin/auth/logout', logout);
Route.post('/api/admin/auth/forgot-password', forgotPassword);
Route.post('/api/admin/auth/reset-password', resetPassword);
// Second leg of an MFA login — authorized by the short-lived tempToken, not a session.
Route.post('/api/admin/auth/mfa/login-verify', mfaLoginVerify);
// Backup-code alternative to the TOTP step — also gated by the tempToken.
Route.post('/api/admin/auth/mfa/recovery-verify', mfaRecoveryVerify);

// ---- authenticated ----
Route.get('/api/admin/auth/me', verifyToken, me);
Route.get('/api/admin/auth/sessions', verifyToken, mySessions);
Route.post('/api/admin/auth/mfa/setup', verifyToken, mfaSetup);
Route.post('/api/admin/auth/mfa/verify-setup', verifyToken, mfaVerifySetup);
Route.post('/api/admin/auth/mfa/disable', verifyToken, mfaDisable);
Route.post('/api/admin/auth/mfa/regenerate-codes', verifyToken, mfaRegenerateCodes);

export default Route;
