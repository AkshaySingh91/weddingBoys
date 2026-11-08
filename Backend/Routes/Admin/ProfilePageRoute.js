import express from 'express';
import { verifyToken } from '../../Middleware/auth.js';
import { getProfile, verifyProfile, saveProfile, changePassword } from '../../Controllers/profileController.js';

const router = express.Router();
router.use('/api/admin/profile', verifyToken);
router.get('/api/admin/profile', getProfile);
router.put('/api/admin/profile/verify', verifyProfile);
router.put('/api/admin/profile/save', saveProfile);
router.post('/api/admin/profile/change-password', changePassword);
export default router;
