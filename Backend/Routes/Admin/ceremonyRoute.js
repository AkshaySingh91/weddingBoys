import express from 'express';
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

// Admin-protected routes
ceremonyRoute.get('/api/admin/ceremonies', verifyToken, listCeremonies);
ceremonyRoute.post('/api/admin/ceremonies', verifyToken, createCeremony);
ceremonyRoute.post('/api/admin/ceremonies/reorder', verifyToken, reorderCeremonies);
ceremonyRoute.patch('/api/admin/ceremonies/:id', verifyToken, updateCeremony);
ceremonyRoute.delete('/api/admin/ceremonies/:id', verifyToken, deleteCeremony);

export default ceremonyRoute;
