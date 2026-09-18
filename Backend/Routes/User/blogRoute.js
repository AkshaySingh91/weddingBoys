// server/routes/User/blogRoute.js  (public, no auth)
import express from 'express'
import {
    getPublishedPosts, getPostBySlug, getRelatedPosts, togglePostLike,
} from "../../Controllers/blogController.js"

const router = express.Router();

router.get('/api/blogs', getPublishedPosts);
router.get('/api/blogs/slug/:slug', getPostBySlug);
router.get('/api/blogs/related/:slug', getRelatedPosts);
router.post('/api/blogs/:slug/like', togglePostLike);

export default router;
