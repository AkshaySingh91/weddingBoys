import express from 'express';
import { verifyToken } from '../../Middleware/auth.js';
import {
    createUpload, signUploadParts, getUploadParts,
    completeUpload, abortUpload, listResumableUploads,
} from '../../Controllers/uploadController.js';

const Route = express.Router();

// Direct browser→R2 upload control plane. No route here receives file bytes;
// multer is deliberately absent.
Route.use(verifyToken);

Route.post('/api/admin/uploads/create', createUpload);
Route.get('/api/admin/uploads/resumable', listResumableUploads);
Route.post('/api/admin/uploads/:sessionId/sign', signUploadParts);
Route.get('/api/admin/uploads/:sessionId/parts', getUploadParts);
Route.post('/api/admin/uploads/:sessionId/complete', completeUpload);
Route.post('/api/admin/uploads/:sessionId/abort', abortUpload);

export default Route;
