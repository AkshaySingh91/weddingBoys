// server/routes/blogRoutes.js
import express from 'express'
import authenticateAdmin from '../../Middleware/authenticateAdmin.js'
import BlogPost from '../../Models/blogPost.js';
import {
    createPost, updatePost, getAdminPosts, getPostBySlug, deletePost, getBlogUploadUrl,
} from "../../Controllers/blogController.js"

const router = express.Router();

// Create new blog
router.post('/api/admin/blogs/presigned-urls', authenticateAdmin, getBlogUploadUrl);
router.post('/api/admin/blogs', authenticateAdmin, createPost);

router.get('/api/admin/blogs', authenticateAdmin, getAdminPosts);


// Update blog
router.put('/api/admin/blogs/:id', authenticateAdmin, updatePost);

// Toggle publish status
router.put('/api/admin/blogs/:id/publish', authenticateAdmin, async (req, res) => {
    try {
        const blog = await BlogPost.findById(req.params.id);
        if (!blog) return res.status(404).json({ error: 'Blog not found' });

        blog.isPublished = req.body.isPublished;
        blog.publishedAt = req.body.isPublished ? new Date() : null;
        await blog.save();

        res.json(blog);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// Delete blog
router.delete('/api/admin/blogs/:id', authenticateAdmin, deletePost);


export default router;