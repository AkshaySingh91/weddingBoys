import express from 'express';
import { taxonomyExists } from '../../Services/taxonomy.js';
import { verifyToken } from '../../Middleware/auth.js';
import {
    listCeremonies,
    createCeremony,
    updateCeremony,
    deleteCeremony,
    reorderCeremonies,
} from '../../Controllers/ceremonyController.js';

const ceremonyRoute = express.Router();

// Public route for frontend dropdowns & filters
ceremonyRoute.get('/api/ceremonies', listCeremonies);

// Admin-protected routes. The writes retire once the tag system exists: ceremonies
// are then the Ceremony group, edited in Settings › Portfolio Tags, and a rename
// here would not reach the items that carry it.
const retiredOnceTaxonomy = async (req, res, next) => {
    if (!(await taxonomyExists())) return next();
    console.warn(`[410] retired ceremony write: ${req.method} ${req.originalUrl}`);
    return res.status(410).json({ message: 'Ceremonies are managed in Settings › Portfolio Tags now.', retired: true });
};
ceremonyRoute.get('/api/admin/ceremonies', verifyToken, listCeremonies);
ceremonyRoute.post('/api/admin/ceremonies', verifyToken, retiredOnceTaxonomy, createCeremony);
ceremonyRoute.post('/api/admin/ceremonies/reorder', verifyToken, retiredOnceTaxonomy, reorderCeremonies);
ceremonyRoute.patch('/api/admin/ceremonies/:id', verifyToken, retiredOnceTaxonomy, updateCeremony);
ceremonyRoute.delete('/api/admin/ceremonies/:id', verifyToken, retiredOnceTaxonomy, deleteCeremony);

export default ceremonyRoute;
