import express from 'express';
import authenticateAdmin from '../../Middleware/authenticateAdmin.js';
import { getBlogAnalytics } from '../../Controllers/blogAnalyticsController.js';

const router = express.Router();

// Admin: Get analytics aggregates
router.get('/api/admin/blogs/analytics', authenticateAdmin, getBlogAnalytics);

export default router;
