import express from 'express';
import authenticateAdmin from '../../Middleware/authenticateAdmin.js';
import {
    getAdminComments,
    updateCommentStatus,
    bulkUpdateCommentStatus,
    replyToComment,
    togglePinComment,
    deleteComment
} from '../../Controllers/commentAdminController.js';

const router = express.Router();

// Moderation queue with filters & counts
router.get('/api/admin/comments', authenticateAdmin, getAdminComments);

// Single status update
router.put('/api/admin/comments/:id/status', authenticateAdmin, updateCommentStatus);

// Bulk actions (approve, spam, reject, delete)
router.put('/api/admin/comments/bulk', authenticateAdmin, bulkUpdateCommentStatus);

// Studio verified reply
router.post('/api/admin/comments/:id/reply', authenticateAdmin, replyToComment);

// Pin/unpin comment
router.put('/api/admin/comments/:id/pin', authenticateAdmin, togglePinComment);

// Delete comment and replies
router.delete('/api/admin/comments/:id', authenticateAdmin, deleteComment);

export default router;
