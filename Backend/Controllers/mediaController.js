// controllers/mediaController.js
import Media from '../Models/Media.js';
import { putObjectUrl, deleteObject, generatePublicUrl } from './awsController.js';
import { ingestImage, ingestVideo, deleteFromR2 } from '../Services/r2UploadService.js';
import {
    createDirectUpload, waitForPlayback, blurFromThumbnail, deleteStreamVideo,
} from '../Services/cloudflareStreamService.js';

// Map a mime type to our coarse mediaType bucket.
const resolveMediaType = (mimeType = '') => {
    if (mimeType.startsWith('image/')) {
        // SVG / gif we still treat as Image; animation is opt-in via explicit override.
        return 'Image';
    }
    if (mimeType.startsWith('video/')) return 'Video';
    if (mimeType.startsWith('application/') || mimeType.startsWith('text/')) return 'Document';
    return 'Image';
};

const safeName = (name = 'file') => name.replace(/\s+/g, '-').replace(/[^a-zA-Z0-9._-]/g, '');

// Tags arrive as an array (JSON) or a comma-separated string (multipart form).
const parseTags = (raw) => {
    if (Array.isArray(raw)) return raw.filter(Boolean);
    if (typeof raw === 'string' && raw.trim()) return raw.split(',').map((t) => t.trim()).filter(Boolean);
    return [];
};

// POST /api/admin/media/presign
// Body: { files: [{ fileName, fileType, ownerType?, ownerId? }] }
// Creates a Media doc per file in `Uploading` status and returns presigned PUT urls.
const presignMediaUpload = async (req, res) => {
    try {
        const { files } = req.body;
        if (!Array.isArray(files) || files.length === 0) {
            return res.status(400).json({ message: 'No files provided' });
        }

        const uploadedBy = req.admin?.email;

        const results = await Promise.all(files.map(async (file) => {
            const { fileName, fileType, ownerType = 'System', ownerId = null } = file;
            const mediaType = resolveMediaType(fileType);
            const key = `media/${ownerType.toLowerCase()}/${Date.now()}-${safeName(fileName)}`;

            const presignedUrl = await putObjectUrl(key, fileType);
            const publicUrl = generatePublicUrl(key);

            const doc = await Media.create({
                fileName: key.split('/').pop(),
                originalFileName: fileName,
                mimeType: fileType,
                mediaType,
                ownerType,
                ownerId,
                status: 'Uploading',
                provider: 'S3',
                bucket: process.env.S3_BUCKET_NAME,
                storageKey: key,
                publicUrl,
                uploadedBy
            });

            return { mediaId: doc.mediaId, _id: doc._id, key, presignedUrl, publicUrl, mediaType };
        }));

        res.json({ uploads: results });
    } catch (error) {
        console.error('presignMediaUpload error:', error);
        res.status(500).json({ message: 'Failed to generate upload URLs' });
    }
};

// POST /api/admin/media/confirm
// Body: { key, width?, height?, duration?, fileSize?, checksum?, title?, altText?, caption?, tags? }
// Called after the browser finishes the direct S3 PUT. Flips status to Ready and
// stores the client-computed dimensions/metadata.
const confirmMediaUpload = async (req, res) => {
    try {
        const { key, width, height, duration, fileSize, checksum, title, altText, caption, tags } = req.body;
        if (!key) return res.status(400).json({ message: 'Missing storage key' });

        const media = await Media.findOne({ storageKey: key });
        if (!media) return res.status(404).json({ message: 'Media record not found' });

        if (width != null) media.width = width;
        if (height != null) media.height = height;
        if (duration != null) media.duration = duration;
        if (fileSize != null) media.fileSize = fileSize;
        if (checksum) media.checksum = checksum;
        if (title != null) media.title = title;
        if (altText != null) media.altText = altText;
        if (caption != null) media.caption = caption;
        if (Array.isArray(tags)) media.tags = tags;
        media.status = 'Ready';

        await media.save();
        res.json({ media });
    } catch (error) {
        console.error('confirmMediaUpload error:', error);
        res.status(500).json({ message: 'Failed to confirm upload' });
    }
};

// Every R2 storageKey an ingest wrote, so we can roll back on a DB failure.
const collectR2Keys = (ingested) => {
    const keys = [];
    if (ingested.storageKey) keys.push(ingested.storageKey);
    for (const v of ingested.imageVariants || []) if (v.storageKey) keys.push(v.storageKey);
    // poster key isn't returned separately; derived below when present.
    return keys;
};

// POST /api/admin/media/upload   (multipart/form-data, field name "file")
// Server-side ingestion path: the buffer is optimized by sharp (blur placeholder,
// dominant colour, down-scaled variants) and pushed to R2 *before* we persist the
// rich Media document. This replaces presign+direct-PUT for the CMS uploader.
const ingestMediaUpload = async (req, res) => {
    const file = req.file;
    if (!file) return res.status(400).json({ message: 'No file provided (field name "file")' });

    const { ownerType = 'System', ownerId = null, title, altText, caption } = req.body;
    const tags = parseTags(req.body.tags);
    const uploadedBy = req.admin?.email;
    const isVideo = file.mimetype.startsWith('video/');

    let ingested;
    try {
        // ---- Step 1: optimize + push bytes to R2 (may create several objects) ----
        ingested = isVideo
            ? await ingestVideo({ buffer: file.buffer, contentType: file.mimetype, originalFileName: file.originalname, ownerType, uploadedBy })
            : await ingestImage({ buffer: file.buffer, originalFileName: file.originalname, ownerType, uploadedBy });
    } catch (err) {
        console.error('R2 ingest failed:', err);
        return res.status(502).json({ message: 'Media processing/upload failed' });
    }

    // ---- Step 2: persist the Media document ----
    try {
        const media = await Media.create({
            ...ingested,
            ownerId,
            ...(title != null ? { title } : {}),
            ...(altText != null ? { altText } : {}),
            ...(caption != null ? { caption } : {}),
            ...(tags.length ? { tags } : {}),
        });
        return res.status(201).json({ media });
    } catch (err) {
        // R2 succeeded but Mongo failed → roll back the just-uploaded objects so we
        // don't leak orphans in the bucket. Best-effort; log anything we can't remove.
        console.error('Media doc create failed after R2 upload — rolling back objects:', err);
        await Promise.allSettled(
            collectR2Keys(ingested).map((key) =>
                deleteFromR2(key).catch((e) => console.error('Orphan cleanup failed for', key, e.message)),
            ),
        );
        return res.status(500).json({ message: 'Failed to save media record' });
    }
};

// POST /api/admin/media/stream-upload-url
// Body: { fileName?, durationSeconds? }
// Returns a one-time Cloudflare Stream Direct Creator Upload URL. The browser
// uploads the master straight to Cloudflare — the file never hits this server.
const createStreamUploadUrl = async (req, res) => {
    try {
        const { fileName, durationSeconds } = req.body;
        // Bound the upload by the client-reported duration (+buffer), else a
        // generous 3h ceiling. Cloudflare requires this for direct uploads.
        const maxDurationSeconds = durationSeconds ? Math.ceil(Number(durationSeconds)) + 60 : 10800;
        const { uploadURL, uid } = await createDirectUpload({
            maxDurationSeconds,
            creator: req.admin?.email,
            name: fileName,
        });
        res.json({ uploadURL, uid });
    } catch (error) {
        console.error('createStreamUploadUrl error:', error);
        res.status(502).json({ message: error.message || 'Failed to create Stream upload URL' });
    }
};

// POST /api/admin/media/stream-complete
// Body: { uid, fileName?, ownerType?, ownerId?, title?, altText?, caption?, tags? }
// Called after the browser finishes uploading to Cloudflare. We resolve the
// playback URLs + thumbnail, derive a blur placeholder, and persist the Media doc.
const completeStreamUpload = async (req, res) => {
    try {
        const { uid, fileName, ownerType = 'System', ownerId = null, title, altText, caption } = req.body;
        if (!uid) return res.status(400).json({ message: 'Missing Stream uid' });
        const tags = parseTags(req.body.tags);

        const info = await waitForPlayback(uid);
        const thumb = info?.thumbnail;
        const blurDataURL = thumb ? await blurFromThumbnail(thumb) : undefined;
        const w = info?.input?.width;
        const h = info?.input?.height;

        const media = await Media.create({
            provider: 'Stream',
            bucket: 'cloudflare-stream',
            mediaType: 'Video',
            status: info?.readyToStream ? 'Ready' : 'Uploaded',
            storageKey: uid,                       // schema requires a key; uid is Stream's key
            fileName: uid,
            originalFileName: fileName,
            mimeType: 'video/mp4',
            fileSize: info?.size,
            duration: info?.duration ? Math.round(info.duration) : undefined,
            width: w,
            height: h,
            aspectRatio: w && h ? +(w / h).toFixed(4) : undefined,
            blurDataURL,
            publicUrl: info?.preview,              // hosted watch page
            cdnUrl: `https://iframe.videodelivery.net/${uid}`, // universal ABR player
            video: {
                hlsUrl: info?.playback?.hls,
                dashUrl: info?.playback?.dash,
                posterUrl: thumb,
                streamUid: uid,
            },
            ownerType,
            ownerId,
            uploadedBy: req.admin?.email,
            ...(title != null ? { title } : {}),
            ...(altText != null ? { altText } : {}),
            ...(caption != null ? { caption } : {}),
            ...(tags.length ? { tags } : {}),
        });
        res.status(201).json({ media });
    } catch (error) {
        console.error('completeStreamUpload error:', error);
        res.status(500).json({ message: 'Failed to finalize Stream upload' });
    }
};

// GET /api/admin/media?page=1&limit=24&search=&mediaType=&ownerType=&ownerId=&sortBy=&orientation=&featured=&visibility=&tag=
const listMedia = async (req, res) => {
    try {
        const page = Math.max(parseInt(req.query.page) || 1, 1);
        const limit = Math.min(Math.max(parseInt(req.query.limit) || 24, 1), 100);
        const { search, mediaType, ownerType, ownerId, sortBy, orientation, featured, visibility, tag } = req.query;

        const query = { status: { $ne: 'Archived' } };
        if (mediaType) query.mediaType = mediaType;
        if (ownerType) query.ownerType = ownerType;
        if (ownerId) query.ownerId = ownerId;
        if (tag) query.tags = tag;
        if (featured === 'true') query.featured = true;
        if (featured === 'false') query.featured = false;
        if (visibility && (visibility === 'Public' || visibility === 'Private')) {
            query.visibility = visibility;
        }

        if (orientation) {
            if (orientation === 'portrait') {
                query.width = { $exists: true, $gt: 0 };
                query.height = { $exists: true, $gt: 0 };
                query.$expr = { $lt: ['$width', '$height'] };
            } else if (orientation === 'landscape') {
                query.width = { $exists: true, $gt: 0 };
                query.height = { $exists: true, $gt: 0 };
                query.$expr = { $gt: ['$width', '$height'] };
            } else if (orientation === 'square') {
                query.width = { $exists: true, $gt: 0 };
                query.height = { $exists: true, $gt: 0 };
                query.$expr = { $eq: ['$width', '$height'] };
            }
        }

        if (search) {
            // Escaped: an unescaped `(` from the search box is an invalid regex
            // and throws, turning a typo into a 500.
            const rx = new RegExp(search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
            query.$or = [{ title: rx }, { altText: rx }, { caption: rx }, { tags: rx }, { originalFileName: rx }];
        }

        let sortOption = '-createdAt';
        if (sortBy === 'oldest') sortOption = 'createdAt';
        else if (sortBy === 'size_desc') sortOption = '-fileSize';
        else if (sortBy === 'size_asc') sortOption = 'fileSize';
        else if (sortBy === 'name_asc') sortOption = 'title originalFileName';

        const total = await Media.countDocuments(query);
        const items = await Media.find(query)
            .sort(sortOption)
            .skip((page - 1) * limit)
            .limit(limit);

        res.json({ items, page, limit, total, hasMore: page * limit < total });
    } catch (error) {
        console.error('listMedia error:', error);
        res.status(500).json({ message: 'Failed to fetch media' });
    }
};

/**
 * GET /api/admin/media/stats
 *
 * Counts and stored bytes per owner and per type, for the library's navigation.
 * `ownerType` is the only real usage axis the data has — file type says nothing
 * about what an asset is FOR — and it is already indexed.
 *
 * Bytes include every derivative, not just the master, so the figure matches
 * what is actually in the bucket.
 */
const mediaStats = async (req, res) => {
    try {
        const BYTES = {
            $add: [
                { $ifNull: ['$fileSize', 0] },
                { $sum: { $map: { input: { $ifNull: ['$imageVariants', []] }, as: 'v', in: { $ifNull: ['$$v.bytes', 0] } } } },
                { $ifNull: ['$video.posterBytes', 0] },
                { $sum: { $map: { input: { $ifNull: ['$video.posterVariants', []] }, as: 'p', in: { $ifNull: ['$$p.bytes', 0] } } } },
                // `source` IS the master, already counted as fileSize.
                { $sum: { $map: { input: { $filter: { input: { $ifNull: ['$video.renditions', []] }, as: 'r', cond: { $ne: ['$$r.role', 'source'] } } }, as: 'r', in: { $ifNull: ['$$r.bytes', 0] } } } },
            ],
        };

        const [byOwner, byType, byStatus, totals] = await Promise.all([
            Media.aggregate([
                { $match: { status: { $ne: 'Archived' } } },
                { $project: { ownerType: 1, bytes: BYTES } },
                { $group: { _id: '$ownerType', count: { $sum: 1 }, bytes: { $sum: '$bytes' } } },
            ]),
            Media.aggregate([
                { $match: { status: { $ne: 'Archived' } } },
                { $group: { _id: '$mediaType', count: { $sum: 1 } } },
            ]),
            Media.aggregate([
                { $group: { _id: '$status', count: { $sum: 1 } } },
            ]),
            Media.aggregate([
                { $match: { status: { $ne: 'Archived' } } },
                { $project: { bytes: BYTES } },
                { $group: { _id: null, count: { $sum: 1 }, bytes: { $sum: '$bytes' } } },
            ]),
        ]);

        const toMap = (rows) => rows.reduce((acc, r) => ({ ...acc, [r._id || 'Unknown']: r }), {});
        res.json({
            byOwner: toMap(byOwner),
            byType: toMap(byType),
            byStatus: toMap(byStatus),
            total: totals[0]?.count || 0,
            totalBytes: totals[0]?.bytes || 0,
        });
    } catch (error) {
        console.error('mediaStats error:', error);
        res.status(500).json({ message: 'Failed to compute media stats' });
    }
};

// PATCH /api/admin/media/:id
// Editable metadata from the picker (alt/caption/title/tags/featured/visibility).
const updateMedia = async (req, res) => {
    try {
        const { title, altText, caption, description, tags, featured, visibility } = req.body;
        const update = {};
        if (title !== undefined) update.title = title;
        if (altText !== undefined) update.altText = altText;
        if (caption !== undefined) update.caption = caption;
        if (description !== undefined) update.description = description;
        if (Array.isArray(tags)) update.tags = tags;
        if (featured !== undefined) update.featured = featured;
        if (visibility !== undefined) update.visibility = visibility;

        const media = await Media.findByIdAndUpdate(req.params.id, update, { new: true, runValidators: true });
        if (!media) return res.status(404).json({ message: 'Media not found' });
        res.json({ media });
    } catch (error) {
        console.error('updateMedia error:', error);
        res.status(400).json({ message: error.message });
    }
};

const deleteSingleMediaDoc = async (media) => {
    if (media.provider === 'Stream') {
        const uid = media.video?.streamUid || media.storageKey;
        if (uid) {
            await deleteStreamVideo(uid).catch((e) => console.error('Stream delete failed for', uid, e.message));
        }
    } else {
        const keys = media.provider === 'R2'
            ? [...new Set([
                media.storageKey,
                ...(media.imageVariants || []).map((v) => v.storageKey),
                media.video?.posterStorageKey,
                ...(media.video?.posterVariants || []).map((v) => v.storageKey),
                ...(media.video?.renditions || []).map((r) => r.storageKey),
            ].filter(Boolean))]
            : [media.storageKey].filter(Boolean);
        const remove = media.provider === 'R2' ? deleteFromR2 : deleteObject;
        await Promise.allSettled(keys.map((k) =>
            remove(k).catch((e) => console.error('Object delete failed for', k, e.message)),
        ));
    }
    media.status = 'Archived';
    await media.save();
    return media._id;
};

// DELETE /api/admin/media/:id
// Removes the physical S3/R2 object and soft-deletes the record (status Archived).
const deleteMedia = async (req, res) => {
    try {
        const media = await Media.findById(req.params.id);
        if (!media) return res.status(404).json({ message: 'Media not found' });

        const id = await deleteSingleMediaDoc(media);
        res.json({ message: 'Media archived', id });
    } catch (error) {
        console.error('deleteMedia error:', error);
        res.status(500).json({ message: 'Failed to delete media' });
    }
};

// POST /api/admin/media/batch-delete
// Body: { ids: [string] }
const batchDeleteMedia = async (req, res) => {
    try {
        const { ids } = req.body;
        if (!Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({ message: 'No media IDs provided' });
        }
        const docs = await Media.find({ _id: { $in: ids } });
        if (!docs.length) return res.status(404).json({ message: 'No matching media found' });

        const results = await Promise.allSettled(docs.map((doc) => deleteSingleMediaDoc(doc)));
        const deletedIds = results.filter((r) => r.status === 'fulfilled').map((r) => r.value);
        res.json({ message: `${deletedIds.length} assets archived`, deletedIds });
    } catch (error) {
        console.error('batchDeleteMedia error:', error);
        res.status(500).json({ message: 'Failed to batch delete media' });
    }
};

// POST /api/admin/media/batch-update
// Body: { ids: [string], patch: { ownerType?, ownerId?, tagsToAdd?, tagsToRemove?, featured?, visibility? } }
const batchUpdateMedia = async (req, res) => {
    try {
        const { ids, patch } = req.body;
        if (!Array.isArray(ids) || ids.length === 0 || !patch) {
            return res.status(400).json({ message: 'IDs array and patch object are required' });
        }

        const updateOps = {};
        const setFields = {};
        if (patch.ownerType !== undefined) setFields.ownerType = patch.ownerType;
        if (patch.ownerId !== undefined) setFields.ownerId = patch.ownerId;
        if (patch.featured !== undefined) setFields.featured = !!patch.featured;
        if (patch.visibility !== undefined) setFields.visibility = patch.visibility;

        if (Object.keys(setFields).length > 0) updateOps.$set = setFields;
        if (Array.isArray(patch.tagsToAdd) && patch.tagsToAdd.length > 0) {
            updateOps.$addToSet = { tags: { $each: patch.tagsToAdd } };
        }
        if (Array.isArray(patch.tagsToRemove) && patch.tagsToRemove.length > 0) {
            updateOps.$pull = { tags: { $in: patch.tagsToRemove } };
        }

        if (Object.keys(updateOps).length === 0) {
            return res.status(400).json({ message: 'No valid update operations provided' });
        }

        const result = await Media.updateMany({ _id: { $in: ids } }, updateOps);
        res.json({ message: `${result.modifiedCount} assets updated`, modifiedCount: result.modifiedCount });
    } catch (error) {
        console.error('batchUpdateMedia error:', error);
        res.status(500).json({ message: 'Failed to batch update media' });
    }
};

export {
    mediaStats,
    presignMediaUpload,
    confirmMediaUpload,
    ingestMediaUpload,
    createStreamUploadUrl,
    completeStreamUpload,
    listMedia,
    updateMedia,
    deleteMedia,
    deleteSingleMediaDoc,
    batchDeleteMedia,
    batchUpdateMedia
};
