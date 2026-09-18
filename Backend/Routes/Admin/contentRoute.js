// Admin content management. Editors+ may read/write; deletion is SuperAdmin-only.
import express from 'express'
import { verifyToken } from '../../Middleware/auth.js'
import { requireSuperAdmin } from '../../Middleware/rbac.js'
import {
    listPages, getAdminPageContent, upsertPageContent, deletePage,
} from '../../Controllers/contentController.js'

const Route = express.Router();

Route.get('/api/admin/content', verifyToken, listPages);
Route.get('/api/admin/content/:pageKey', verifyToken, getAdminPageContent);
Route.put('/api/admin/content/:pageKey', verifyToken, upsertPageContent);
Route.delete('/api/admin/content/:pageKey', verifyToken, requireSuperAdmin, deletePage);

export default Route;
