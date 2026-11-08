/**
 * Browser → R2 direct upload, control plane only.
 *
 * No request body here ever carries file bytes. Node hands out presigned PUT
 * URLs for individual parts and orchestrates the two operations R2 cannot
 * presign (CreateMultipartUpload and CompleteMultipartUpload are POSTs).
 */
import { nanoid } from 'nanoid';
import Media from '../Models/Media.js';
import UploadSession from '../Models/UploadSession.js';
import {
    buildBaseKey, isR2Configured,
    PART_SIZE, SINGLE_PUT_MAX, partCountFor,
    signSinglePut, createMultipart, signParts, listParts,
    completeMultipart, abortMultipart, inspectObject,
    IMMUTABLE_CACHE_CONTROL,
} from '../Services/r2UploadService.js';
import { cdnUrlFor } from '../Utils/mediaUrl.js';
import { enqueueJob } from '../Services/mediaJobQueue.js';

const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;   // matches R2's abort window
const MAX_SIGN_BATCH = 50;

const OWNER_TYPES = ['Client', 'Website', 'Blog', 'Review', 'Team', 'Brand', 'System'];
const RENDITIONS = ['orig', 'web', 'loop', 'poster'];

const resolveMediaType = (mime = '') => {
    if (mime.startsWith('image/')) return 'Image';
    if (mime.startsWith('video/')) return 'Video';
    if (mime.startsWith('application/') || mime.startsWith('text/')) return 'Document';
    return 'Image';
};

const extFor = (fileName = '', contentType = '') => {
    const fromName = (fileName.split('.').pop() || '').toLowerCase();
    if (fromName && /^[a-z0-9]{1,5}$/.test(fromName)) return fromName;
    const fromMime = (contentType.split('/')[1] || '').toLowerCase();
    return fromMime.replace(/[^a-z0-9]/g, '') || 'bin';
};

const guard = (res) => {
    if (isR2Configured()) return false;
    res.status(503).json({
        message: 'Media storage is not configured. Set R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, '
            + 'R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME and R2_PUBLIC_URL.',
    });
    return true;
};

// POST /api/admin/uploads/create
export async function createUpload(req, res) {
    if (guard(res)) return;
    try {
        const {
            fileName, contentType, fileSize,
            ownerType = 'System', ownerId = null, slot,
            rendition = 'orig', sourceMediaId, fingerprint, meta = {},
        } = req.body || {};

        if (!fileName || !contentType || !Number.isFinite(fileSize) || fileSize <= 0) {
            return res.status(400).json({ message: 'fileName, contentType and a positive fileSize are required' });
        }
        if (!OWNER_TYPES.includes(ownerType)) {
            return res.status(400).json({ message: `ownerType must be one of ${OWNER_TYPES.join(', ')}` });
        }
        if (!RENDITIONS.includes(rendition)) {
            return res.status(400).json({ message: `rendition must be one of ${RENDITIONS.join(', ')}` });
        }

        // A rendition (web/loop/poster) belongs INSIDE its source asset's folder,
        // so every file for one asset shares a prefix and can be reaped together.
        let baseKey;
        let mediaId;
        if (rendition === 'orig') {
            mediaId = nanoid(12);
            baseKey = buildBaseKey({ ownerType, ownerId, slot, mediaId });
        } else {
            if (!sourceMediaId) {
                return res.status(400).json({ message: 'sourceMediaId is required for a non-orig rendition' });
            }
            const source = await Media.findOne({ mediaId: sourceMediaId }).select('storageKey mediaId').lean();
            if (!source) return res.status(404).json({ message: 'sourceMediaId not found' });
            mediaId = source.mediaId;
            baseKey = source.storageKey.replace(/\/[^/]+$/, '');   // strip the rendition filename
        }

        const key = `${baseKey}/${rendition}.${extFor(fileName, contentType)}`;
        const useMultipart = fileSize > SINGLE_PUT_MAX;

        const session = await UploadSession.create({
            mediaId, key,
            bucket: process.env.R2_BUCKET_NAME,
            uploadId: useMultipart ? await createMultipart({ key, contentType }) : undefined,
            fingerprint,
            fileName, fileSize, contentType,
            partSize: useMultipart ? PART_SIZE : undefined,
            partCount: useMultipart ? partCountFor(fileSize) : 1,
            ownerType, ownerId, slot, rendition, sourceMediaId,
            meta,
            createdBy: req.user?.email || req.admin?.email,
            expiresAt: new Date(Date.now() + SESSION_TTL_MS),
        });

        return res.status(201).json({
            sessionId: session._id,
            mediaId, key,
            mode: useMultipart ? 'multipart' : 'single',
            uploadId: session.uploadId,
            partSize: session.partSize,
            partCount: session.partCount,
            singlePartUrl: useMultipart ? undefined : await signSinglePut({ key, contentType }),
            // The single-PUT URL is signed WITH a Cache-Control header, so the
            // browser has to send the identical value back or the object lands
            // with R2's 4-hour default instead of being cached forever. Sent
            // explicitly rather than hardcoded client-side, so the two can never
            // disagree. (Multipart sets it at CreateMultipartUpload instead.)
            cacheControl: useMultipart ? undefined : IMMUTABLE_CACHE_CONTROL,
            expiresAt: session.expiresAt,
        });
    } catch (error) {
        console.error('createUpload error:', error);
        return res.status(500).json({ message: error.message });
    }
}

const loadOpenSession = async (req, res) => {
    const session = await UploadSession.findById(req.params.sessionId);
    if (!session) { res.status(404).json({ message: 'Upload session not found' }); return null; }
    if (session.status !== 'Open') { res.status(409).json({ message: `Session is ${session.status}` }); return null; }
    return session;
};

// POST /api/admin/uploads/:sessionId/sign
// Re-callable: an expired part URL is simply signed again.
export async function signUploadParts(req, res) {
    if (guard(res)) return;
    try {
        const session = await loadOpenSession(req, res);
        if (!session) return;

        const { partNumbers } = req.body || {};
        if (!Array.isArray(partNumbers) || !partNumbers.length) {
            return res.status(400).json({ message: 'partNumbers must be a non-empty array' });
        }
        if (partNumbers.length > MAX_SIGN_BATCH) {
            return res.status(400).json({ message: `Request at most ${MAX_SIGN_BATCH} part URLs at a time` });
        }
        const invalid = partNumbers.some(
            (n) => !Number.isInteger(n) || n < 1 || n > session.partCount
        );
        if (invalid) return res.status(400).json({ message: 'partNumbers out of range' });

        const urls = await signParts({ key: session.key, uploadId: session.uploadId, partNumbers });
        return res.status(200).json({ urls });
    } catch (error) {
        console.error('signUploadParts error:', error);
        return res.status(500).json({ message: error.message });
    }
}

// GET /api/admin/uploads/:sessionId/parts — what R2 already holds.
export async function getUploadParts(req, res) {
    if (guard(res)) return;
    try {
        const session = await UploadSession.findById(req.params.sessionId);
        if (!session) return res.status(404).json({ message: 'Upload session not found' });
        if (session.status === 'Aborted') return res.status(409).json({ message: 'Session is Aborted' });
        const completionPending = session.status !== 'Open';
        let uploaded = false;
        if (!session.uploadId && !completionPending) {
            try {
                const stored = await inspectObject(session.key);
                uploaded = stored.fileSize === session.fileSize && stored.contentType === session.contentType;
            } catch (error) {
                if (error.$metadata?.httpStatusCode !== 404 && !['NotFound', 'NoSuchKey'].includes(error.name)) throw error;
            }
        }
        const parts = session.uploadId && !completionPending
            ? await listParts({ key: session.key, uploadId: session.uploadId }) : [];
        return res.status(200).json({
            uploadId: session.uploadId, key: session.key,
            partSize: session.partSize, partCount: session.partCount, parts,
            completionPending: completionPending || uploaded,
            ...(!session.uploadId && !uploaded && !completionPending ? {
                singlePartUrl: await signSinglePut({ key: session.key, contentType: session.contentType }),
                cacheControl: IMMUTABLE_CACHE_CONTROL,
            } : {}),
        });
    } catch (error) {
        console.error('getUploadParts error:', error);
        return res.status(500).json({ message: error.message });
    }
}

// POST /api/admin/uploads/:sessionId/complete
export async function completeUpload(req, res) {
    if (guard(res)) return;
    let session;
    const token = nanoid();
    try {
        const previous = await UploadSession.findById(req.params.sessionId);
        if (!previous) return res.status(404).json({ message: 'Upload session not found' });
        if (previous.status === 'Completed' && previous.completionVersion === 1) {
            const media = await Media.findOne({ mediaId: previous.mediaId });
            if (media) return res.status(200).json({ media });
        }
        if (previous.status === 'Aborted') return res.status(409).json({ message: 'Session is Aborted' });
        session = await UploadSession.findOneAndUpdate({
            _id: previous._id, status: { $ne: 'Aborted' },
            $or: [{ completionLockedAt: null }, { completionLockedAt: { $lt: new Date(Date.now() - 120000) } }],
        }, { $set: { status: 'Completing', completionToken: token, completionLockedAt: new Date(),
            completionMeta: previous.completionMeta || { ...(previous.meta || {}), ...(req.body?.meta || {}) } } }, { new: true });
        if (!session) return res.status(409).json({ message: 'Completion is in progress; retry shortly' });
        const meta = session.completionMeta;
        const completed = async (media) => {
            const result = await UploadSession.updateOne({ _id: session._id, completionToken: token }, {
                $set: { status: 'Completed', completionVersion: 1 }, $unset: { completionLockedAt: '', completionToken: '' },
            });
            if (!result.matchedCount) throw new Error('Completion lease expired; retry to recover');
            return res.status(200).json({ media });
        };

        let stored;
        if (session.uploadId) {
            try {
                stored = await completeMultipart({ key: session.key, uploadId: session.uploadId, expectedPartCount: session.partCount });
            } catch (error) {
                // A prior request may have committed the R2 object before losing its DB write.
                if (error.name !== 'NoSuchUpload' && error.Code !== 'NoSuchUpload' && error.code !== 'NoSuchUpload') throw error;
                stored = await inspectObject(session.key);
            }
        } else {
            stored = await inspectObject(session.key);
        }
        if (stored.fileSize !== session.fileSize || stored.contentType?.split(';')[0] !== session.contentType?.split(';')[0]) {
            const error = new Error('Stored object size or content type does not match the upload');
            error.code = 'OBJECT_MISMATCH';
            throw error;
        }

        const mediaType = resolveMediaType(session.contentType);

        // A non-orig rendition attaches to the existing asset rather than
        // creating a second Media document for the same logical thing.
        if (session.rendition !== 'orig') {
            const media = await attachRendition(session, stored, mediaType);
            return await completed(media);
        }

        const url = cdnUrlFor(session.key);

        const media = await Media.findOneAndUpdate({ mediaId: session.mediaId }, { $setOnInsert: {
            mediaId: session.mediaId,
            fileName: session.key.split('/').pop(),
            originalFileName: session.fileName,
            mimeType: session.contentType,
            fileSize: stored.fileSize ?? session.fileSize,
            checksum: stored.etag,
            ownerType: session.ownerType,
            ownerId: session.ownerId,
            mediaType,
            // Images and videos both need derivative work before they are servable.
            status: mediaType === 'Document' ? 'Ready' : 'Processing',
            provider: 'R2',
            bucket: session.bucket,
            storageKey: session.key,
            publicUrl: url,
            cdnUrl: url,
            title: meta.title,
            altText: meta.altText,
            caption: meta.caption,
            tags: Array.isArray(meta.tags) ? meta.tags : undefined,
            width: meta.width,
            height: meta.height,
            aspectRatio: meta.width && meta.height ? +(meta.width / meta.height).toFixed(4) : undefined,
            uploadedBy: session.createdBy,
            ...(mediaType === 'Video' ? { video: { sourceUrl: url, renditions: [{ role: 'source', url, storageKey: session.key, bytes: stored.fileSize, durationSec: meta.duration }] } } : {}),
        } }, { upsert: true, new: true, setDefaultsOnInsert: true });

        if (mediaType !== 'Document') await enqueueJob({
            idempotencyKey: `upload:${session._id}`,
            mediaId: media.mediaId,
            type: mediaType === 'Video' ? 'transcode' : 'derivatives',
            // Hero slides get the short silent loop; `stripAudio` lets the admin
            // drop the audio track on any video (it is free during the re-encode).
            options: mediaType === 'Video' ? {
                makeLoop: Boolean(meta.makeLoop ?? meta.isHeroVideo),
                stripAudio: Boolean(meta.stripAudio),
                loopStartSec: Number.isFinite(meta.loopStartSec) ? meta.loopStartSec : undefined,
                sequenceSource: Boolean(meta.sequenceSource),
            } : {},
        });

        return await completed(media);
    } catch (error) {
        if (session) await UploadSession.updateOne({ _id: session._id, completionToken: token }, {
            ...(error.code === 'MISSING_PARTS' ? { $set: { status: 'Open' } } : {}),
            $unset: { completionLockedAt: '', completionToken: '' },
        }).catch(() => {});
        if (error.code === 'OBJECT_MISMATCH') return res.status(400).json({ message: error.message });
        if (error.code === 'MISSING_PARTS') {
            return res.status(409).json({ message: 'Upload is incomplete', missing: error.missing });
        }
        console.error('completeUpload error:', error);
        return res.status(500).json({ message: error.message });
    }
}

// Attach a web/loop/poster file to the Media doc it belongs to.
async function attachRendition(session, stored, mediaType) {
    const url = cdnUrlFor(session.key);
    const media = await Media.findOne({ mediaId: session.mediaId });
    if (!media) throw new Error('Source media not found for rendition');

    if (session.rendition === 'poster') {
        media.video = media.video || {};
        media.video.posterUrl = url;
        media.video.posterStorageKey = session.key;
    } else {
        media.video = media.video || {};
        media.video[`${session.rendition}Url`] = url;
        media.video.renditions = [
            ...(media.video.renditions || []).filter((r) => r.role !== session.rendition),
            { role: session.rendition, url, storageKey: session.key, bytes: stored.fileSize },
        ];
    }
    await media.save();
    return media;
}

// POST /api/admin/uploads/:sessionId/abort
export async function abortUpload(req, res) {
    if (guard(res)) return;
    try {
        // Claim the abort atomically; it must never race a completion lease.
        const session = await UploadSession.findOneAndUpdate({ _id: req.params.sessionId, status: 'Open' },
            { $set: { status: 'Aborted' } }, { new: true });
        if (!session) return res.status(409).json({ message: 'Only open uploads can be aborted' });
        if (session.uploadId) {
            await abortMultipart({ key: session.key, uploadId: session.uploadId }).catch(() => {});
        }
        return res.status(200).json({ ok: true });
    } catch (error) {
        console.error('abortUpload error:', error);
        return res.status(500).json({ message: error.message });
    }
}

// GET /api/admin/uploads/resumable
export async function listResumableUploads(req, res) {
    if (guard(res)) return;
    try {
        const sessions = await UploadSession.find({
            createdBy: req.user?.email || req.admin?.email,
            status: { $in: ['Open', 'Completing'] },
        }).sort({ updatedAt: -1 }).limit(25).lean();

        return res.status(200).json({
            sessions: sessions.map((s) => ({
                sessionId: s._id,
                status: s.status,
                key: s.key,
                fileName: s.fileName,
                fileSize: s.fileSize,
                fingerprint: s.fingerprint,
                partSize: s.partSize,
                partCount: s.partCount,
                ownerType: s.ownerType,
                ownerId: s.ownerId,
                createdAt: s.createdAt,
                expiresAt: s.expiresAt,
            })),
        });
    } catch (error) {
        console.error('listResumableUploads error:', error);
        return res.status(500).json({ message: error.message });
    }
}
