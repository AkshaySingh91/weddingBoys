import express from 'express';
import { submitEnquiry } from '../../Controllers/enquiryController.js';
import { rateLimit } from '../../Middleware/rateLimit.js';

const router = express.Router();
router.post('/api/enquiry', rateLimit({ limit: 20, windowMs: 60 * 60 * 1000 }), submitEnquiry);
export default router;
