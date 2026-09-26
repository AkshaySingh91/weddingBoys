import express from 'express'
const Route = express.Router();
import authenticateAdmin from "../../Middleware/authenticateAdmin.js"
import uploadToMemory from "../../Middleware/uploadToMemory.js"
import {
    presignMediaUpload,
    confirmMediaUpload,
    ingestMediaUpload,
    listMedia,
    updateMedia,
    deleteMedia,
    mediaStats,
    batchDeleteMedia,
    batchUpdateMedia,
} from "../../Controllers/mediaController.js"

// Every media route is admin-only.
Route.use(authenticateAdmin)

// Wrap multer so file-filter / size-limit errors return clean JSON (413/415)
// instead of falling through to a generic 500.
const acceptUpload = (req, res, next) => {
    uploadToMemory.single('file')(req, res, (err) => {
        if (!err) return next();
        const tooBig = err.code === 'LIMIT_FILE_SIZE';
        return res.status(tooBig ? 413 : 415).json({
            message: tooBig ? 'File exceeds the 100 MB limit' : err.message,
        });
    });
};

// Server-side R2 ingestion (sharp optimize → R2 → Media doc). Images/docs.
Route.post("/api/admin/media/upload", acceptUpload, ingestMediaUpload)
// Cloudflare Stream direct uploads — retired (plan phase 7). Nothing calls them,
// and they wrote Media records the schema rejects (provider 'Stream', status
// 'Uploaded'). Videos go through the multipart upload and the worker.
Route.post(["/api/admin/media/stream-upload-url", "/api/admin/media/stream-complete"], (req, res) => {
    console.warn(`[410] retired Stream route: ${req.method} ${req.originalUrl}`);
    return res.status(410).json({ message: 'Stream uploads are retired. Upload videos from the wedding workspace.' });
})
// Legacy S3 presigned direct-PUT path (kept for back-compat).
Route.post("/api/admin/media/presign", presignMediaUpload)
Route.post("/api/admin/media/confirm", confirmMediaUpload)
// `/stats` and batch routes before the list and `/:id` route
Route.get("/api/admin/media/stats", mediaStats)
Route.post("/api/admin/media/batch-delete", batchDeleteMedia)
Route.post("/api/admin/media/batch-update", batchUpdateMedia)
Route.get("/api/admin/media", listMedia)
Route.patch("/api/admin/media/:id", updateMedia)
Route.delete("/api/admin/media/:id", deleteMedia)

export default Route
