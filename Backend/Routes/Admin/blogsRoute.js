// server/routes/blogsRoute.js  (admin)
import express from 'express'
import authenticateAdmin from '../../Middleware/authenticateAdmin.js'
import {
    createPost, updatePost, getAdminPosts, getAdminPostById, deletePost, getBlogUploadUrl, togglePublish, getPreviewToken,
} from "../../Controllers/blogController.js"
import {
    createRevision, getRevisions, getRevisionById, restoreRevision,
} from "../../Controllers/revisionController.js"
import { getBlogAnalytics } from "../../Controllers/blogAnalyticsController.js"

const router = express.Router();

// Specific routes before parameterized :id
router.get('/api/admin/blogs/analytics', authenticateAdmin, getBlogAnalytics);

// Legacy blog-scoped presign (kept for back-compat).
router.post('/api/admin/blogs/presigned-urls', authenticateAdmin, getBlogUploadUrl);

router.post('/api/admin/blogs', authenticateAdmin, createPost);
router.get('/api/admin/blogs', authenticateAdmin, getAdminPosts);
router.get('/api/admin/blogs/:id', authenticateAdmin, getAdminPostById);
router.get('/api/admin/blogs/:id/preview-token', authenticateAdmin, getPreviewToken);
router.put('/api/admin/blogs/:id', authenticateAdmin, updatePost);
router.put('/api/admin/blogs/:id/publish', authenticateAdmin, togglePublish);
router.delete('/api/admin/blogs/:id', authenticateAdmin, deletePost);

// ---- Revision endpoints (Phase 1) ----
router.post('/api/admin/blogs/:id/revisions', authenticateAdmin, createRevision);
router.get('/api/admin/blogs/:id/revisions', authenticateAdmin, getRevisions);
router.get('/api/admin/blogs/:id/revisions/:revId', authenticateAdmin, getRevisionById);
router.post('/api/admin/blogs/:id/revisions/:revId/restore', authenticateAdmin, restoreRevision);

export default router;
