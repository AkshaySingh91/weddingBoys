// Admin: pricing CRUD, global config, and the Command Center analytics.
import express from 'express'
import { verifyToken } from '../../Middleware/auth.js'
import {
    listPackages, createPackage, updatePackage, deletePackage, reorderPackages,
} from '../../Controllers/pricingController.js'
import { updateConfig } from '../../Controllers/siteConfigController.js'
import { getDashboard } from '../../Controllers/analyticsController.js'

const Route = express.Router();
Route.use(verifyToken);

// Analytics
Route.get('/api/admin/analytics/dashboard', getDashboard);

// Pricing
Route.get('/api/admin/pricing', listPackages);
Route.post('/api/admin/pricing', createPackage);
Route.put('/api/admin/pricing/reorder', reorderPackages);
Route.put('/api/admin/pricing/:id', updatePackage);
Route.delete('/api/admin/pricing/:id', deletePackage);

// Globals
Route.put('/api/admin/config', updateConfig);

export default Route;
