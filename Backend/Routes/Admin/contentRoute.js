// Admin content management. Editors+ may read/write; deletion is SuperAdmin-only.
import express from 'express'
import { verifyToken } from '../../Middleware/auth.js'
import { requireSuperAdmin } from '../../Middleware/rbac.js'
import {
    listPages, getAdminPageContent, upsertPageContent, deletePage,
    discardDraft, restoreDefaults, previewPage,
} from '../../Controllers/contentController.js'

const Route = express.Router();

Route.get('/api/admin/content', verifyToken, listPages);
Route.get('/api/admin/content/:pageKey', verifyToken, getAdminPageContent);
Route.put('/api/admin/content/:pageKey', verifyToken, upsertPageContent);
Route.post('/api/admin/content/:pageKey/discard', verifyToken, discardDraft);
Route.post('/api/admin/content/:pageKey/restore-defaults', verifyToken, restoreDefaults);
Route.post('/api/admin/content/:pageKey/preview', verifyToken, previewPage);
Route.delete('/api/admin/content/:pageKey', verifyToken, requireSuperAdmin, deletePage);

export default Route;
