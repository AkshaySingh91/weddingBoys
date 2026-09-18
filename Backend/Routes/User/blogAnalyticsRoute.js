import express from 'express';
import { trackBlogEvent } from '../../Controllers/blogAnalyticsController.js';

const router = express.Router();

// Public: Ingest view / read-complete / CTA events
router.post('/api/blogs/:slug/view', trackBlogEvent);

export default router;
