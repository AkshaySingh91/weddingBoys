// routes/Admin/embedRoute.js
import express from 'express';
import authenticateAdmin from '../../Middleware/authenticateAdmin.js';
import { resolveEmbed, searchPortfolioClients } from '../../Controllers/embedController.js';

const router = express.Router();

// GET /api/admin/embed/resolve?url=...  — resolves any supported URL to embed metadata
router.get('/api/admin/embed/resolve', authenticateAdmin, resolveEmbed);

// POST /api/admin/embed/resolve  — supports URL in request body
router.post('/api/admin/embed/resolve', authenticateAdmin, resolveEmbed);

// GET /api/admin/embed/clients?query=...  — search portfolio clients for 1-click embed
router.get('/api/admin/embed/clients', authenticateAdmin, searchPortfolioClients);

export default router;
