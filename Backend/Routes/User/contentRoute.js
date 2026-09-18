// Public content delivery (no auth).
import express from 'express'
import { getPageContent, listPublishedPageKeys } from '../../Controllers/contentController.js'

const router = express.Router();

// Published page keys, used by the Next.js sitemap to include CMS-built pages.
// Must stay ahead of adminOpsRoute in app.js, which applies verifyToken to
// everything reaching it — otherwise this 401s instead of resolving.
router.get('/api/content', listPublishedPageKeys);
router.get('/api/content/:pageKey', getPageContent);

export default router;
