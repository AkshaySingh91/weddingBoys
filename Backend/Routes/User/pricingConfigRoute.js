// Public: pricing tiers + global site config (no auth).
import express from 'express'
import { getActivePackages } from '../../Controllers/pricingController.js'
import { getPublicConfig } from '../../Controllers/siteConfigController.js'

const router = express.Router();

router.get('/api/pricing', getActivePackages);
router.get('/api/config', getPublicConfig);

export default router;
