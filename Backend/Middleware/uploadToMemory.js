import multer from 'multer';

// Memory storage: the file lands in `req.file.buffer` so sharp can process it
// and we can stream it straight to R2 — no local disk round-trip. Used by the
// R2 ingestion endpoint (server-side optimize → upload), unlike the disk-based
// `uploadVideoLocally` middleware used elsewhere.
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
    const type = file.mimetype.split('/')[0];
    if (type === 'image' || type === 'video') {
        cb(null, true);
    } else {
        cb(new Error(`Unsupported file type: ${file.mimetype}`), false);
    }
};

// 100 MB cap — comfortably covers hero stills and short clips; longer films
// belong on Cloudflare Stream, not a single multipart POST.
const uploadToMemory = multer({
    storage,
    fileFilter,
    limits: { fileSize: 100 * 1024 * 1024 },
});

export default uploadToMemory;
