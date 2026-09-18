import express from 'express';
import {
    getBlogComments,
    createComment,
    likeComment,
    reportComment
} from '../../Controllers/commentController.js';

const router = express.Router();

// Public: Fetch approved comments for a blog post
router.get('/api/blogs/:slug/comments', getBlogComments);

// Public: Submit comment with anti-spam shield
router.post('/api/blogs/:slug/comments', createComment);

// Public: Like a comment
router.post('/api/comments/:id/like', likeComment);

// Public: Report a comment
router.post('/api/comments/:id/report', reportComment);

export default router;
