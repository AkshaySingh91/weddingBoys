// Production media ingestion for Cloudflare R2.
//
// One S3-compatible client (R2 speaks the S3 API) + sharp for image processing.
// On ingest we read intrinsic dimensions, generate a tiny blur placeholder and
// the dominant colour, emit down-scaled variants, and push everything to R2
// under an immutable key. The returned object drops straight into the Media
// model.
//
// Video: R2 stores the master. Poster stills and the web/hero-loop renditions
// are produced by the ffmpeg worker (Services/transcodeService.js), not here —
// this module only moves bytes and processes images.

import {
    S3Client,
    PutObjectCommand,
    DeleteObjectCommand,
    CreateMultipartUploadCommand,
    CompleteMultipartUploadCommand,
    AbortMultipartUploadCommand,
    UploadPartCommand,
    ListPartsCommand,
    HeadObjectCommand,
    GetObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import sharp from 'sharp';
import crypto from 'node:crypto';
import { withStoragePrefix, assertWritableKey, canDeleteKey } from './storageGuard.js';

// R2 lives in the same Cloudflare account as Stream, so CLOUDFLARE_ACCOUNT_ID
// is accepted as the account id. The public origin is R2_PUBLIC_URL (the custom
// domain bound to the bucket); NEXT_PUBLIC_CDN_URL is kept as an alias so the
// frontend and backend can share one value if preferred.
const ACCOUNT_ID = process.env.R2_ACCOUNT_ID || process.env.CLOUDFLARE_ACCOUNT_ID;
const R2_ENDPOINT = `https://${ACCOUNT_ID}.r2.cloudflarestorage.com`;
const BUCKET = process.env.R2_BUCKET_NAME;
const CDN_BASE = (process.env.R2_PUBLIC_URL || process.env.NEXT_PUBLIC_CDN_URL || '').replace(/\/$/, '');

export const isR2Configured = () => Boolean(
    ACCOUNT_ID &&
    process.env.R2_ACCESS_KEY_ID &&
    process.env.R2_SECRET_ACCESS_KEY &&
    BUCKET &&
    CDN_BASE
);

// region 'auto' is required for R2.
//
// The two checksum options are NOT optional. From @aws-sdk/client-s3 v3.729 the
// SDK defaults to `WHEN_SUPPORTED`, which adds `x-amz-sdk-checksum-algorithm`
// and `x-amz-checksum-crc32` to the signed request. R2 does not implement crc32,
// so every PutObject and every presigned UploadPart fails with a signature or
// unsupported-header error. Forcing `WHEN_REQUIRED` restores compatibility.
const r2 = new S3Client({
    region: 'auto',
    endpoint: R2_ENDPOINT,
    credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
    },
    requestChecksumCalculation: 'WHEN_REQUIRED',
    responseChecksumValidation: 'WHEN_REQUIRED',
});

// Immutable objects: the key embeds a unique id and is never rewritten, so a
// one-year immutable TTL is always safe. Every write path must use this.
export const IMMUTABLE_CACHE_CONTROL = 'public, max-age=31536000, immutable';

// Concrete variant widths. These are the ONLY widths the frontend loader may
// snap to (cloudflareLoader.js LADDER must stay in sync with this list).
//
// Every image emits the FULL ladder, even when the source is narrower than a
// given width — `withoutEnlargement` caps the output at the source width so a
// small image simply yields several same-size files. The previous code skipped
// wide variants for small sources, which would make the loader request a
// variant that was never written and 404.
export const VARIANT_WIDTHS_PUBLIC = [
    { label: 'sm', width: 640 },
    { label: 'md', width: 1024 },
    { label: 'lg', width: 1600 },
    { label: 'xl', width: 2400 },
];
const VARIANT_WIDTHS = VARIANT_WIDTHS_PUBLIC;

// AVIF is ~4x the CPU of WebP for a modest size win, so it is opt-in. Turn it on
// with MEDIA_EMIT_AVIF=1 once the worker has headroom.
const EMIT_AVIF = process.env.MEDIA_EMIT_AVIF === '1';

/**
 * Build the immutable base key for one asset: `<domain>/<scope>/<mediaId>`.
 * Renditions hang off it as `<baseKey>/orig.jpg`, `<baseKey>/1024.webp`,
 * `<baseKey>/web.mp4`, `<baseKey>/poster.jpg`, and so on.
 *
 * The `<mediaId>` segment is unique per upload, so a key is never rewritten —
 * that is precisely what makes the immutable cache header safe. Ownership moving
 * in Mongo does NOT move bytes; `Media.storageKey` stays the only authority.
 */
export function buildBaseKey({ ownerType = 'System', ownerId, slot, mediaId }) {
    const id = mediaId || `${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
    const domain = {
        Client: 'client', Website: 'website', Blog: 'marketing/blog',
        Review: 'review', Team: 'team', Brand: 'brand', System: 'system',
    }[ownerType] || 'system';

    // Client media files under the client id; website content under its slot
    // (hero, bts, page-home...). Everything else is flat.
    const scope = ownerType === 'Client' && ownerId ? `/${ownerId}`
        : ownerType === 'Website' && slot ? `/${slot}`
            : '';
    // In a guarded (non-production) environment every new key lives under
    // STORAGE_KEY_PREFIX — see storageGuard.js.
    return withStoragePrefix(`${domain}${scope}/${id}`);
}

// The old fallback here returned `${R2_ENDPOINT}/${BUCKET}/${key}` — the PRIVATE
// S3-API endpoint, which is not publicly readable. That produced well-formed
// URLs that 404 for every visitor, silently. Fail loudly instead: a missing CDN
// base is a configuration error, not something to paper over.
const cdnUrl = (key) => {
    if (!CDN_BASE) {
        throw new Error(
            'R2_PUBLIC_URL is not set — refusing to build a media URL. ' +
            'Set it to the R2 custom domain (https://media.theweddingboys.in).'
        );
    }
    return `${CDN_BASE}/${key}`;
};

async function putObject(key, body, contentType, cacheControl = IMMUTABLE_CACHE_CONTROL) {
    assertWritableKey(key, 'put');
    await r2.send(new PutObjectCommand({
        Bucket: BUCKET,
        Key: key,
        Body: body,
        ContentType: contentType,
        CacheControl: cacheControl,
    }));
    return { key, url: cdnUrl(key) };
}

// A ~20-byte blurred WebP data URI, painted instantly under the real image.
export async function generateBlurDataURL(buffer) {
    const tiny = await sharp(buffer)
        .resize(16, 16, { fit: 'inside' })
        .webp({ quality: 40 })
        .toBuffer();
    return `data:image/webp;base64,${tiny.toString('base64')}`;
}

// Ingest an IMAGE: metadata + blur + dominant colour + variants → R2.
export async function ingestImage({ buffer, originalFileName, ownerType = 'System', ownerId, slot, mediaId, uploadedBy }) {
    const image = sharp(buffer, { failOn: 'none' });
    const meta = await image.metadata();
    const { dominant } = await image.stats();
    const hex = `#${[dominant.r, dominant.g, dominant.b].map((c) => c.toString(16).padStart(2, '0')).join('')}`;

    const checksum = crypto.createHash('sha256').update(buffer).digest('hex');
    const baseKey = buildBaseKey({ ownerType, ownerId, slot, mediaId });

    // Master. `.rotate()` bakes in the EXIF orientation and, because sharp drops
    // metadata unless explicitly asked to keep it, this also STRIPS EXIF/GPS —
    // the previous code uploaded the source buffer verbatim, publishing the
    // couple's location data to the CDN with every photo.
    const isPng = meta.format === 'png';
    const masterBuf = isPng
        ? await sharp(buffer).rotate().png({ compressionLevel: 9 }).toBuffer()
        : await sharp(buffer).rotate().jpeg({ quality: 90, mozjpeg: true }).toBuffer();
    const masterExt = isPng ? 'png' : 'jpg';
    const masterMime = isPng ? 'image/png' : 'image/jpeg';
    const master = await putObject(`${baseKey}/orig.${masterExt}`, masterBuf, masterMime);

    // Down-scaled variants — always the full ladder, never enlarged.
    const imageVariants = [];
    for (const v of VARIANT_WIDTHS) {
        const pipeline = sharp(buffer).rotate().resize(v.width, null, { withoutEnlargement: true });

        // eslint-disable-next-line no-await-in-loop
        const { data: webpBuf, info: webpInfo } = await pipeline
            .clone().webp({ quality: 72 }).toBuffer({ resolveWithObject: true });
        // eslint-disable-next-line no-await-in-loop
        const webpPut = await putObject(`${baseKey}/${v.width}.webp`, webpBuf, 'image/webp');
        imageVariants.push({
            label: v.label,
            width: webpInfo.width,      // the ACTUAL emitted size, not the requested one
            height: webpInfo.height,    // never populated before
            storageKey: webpPut.key,
            url: webpPut.url,
            bytes: webpBuf.length,
            format: 'webp',
        });

        if (EMIT_AVIF) {
            // eslint-disable-next-line no-await-in-loop
            const { data: avifBuf, info: avifInfo } = await pipeline
                .clone().avif({ quality: 50, effort: 3 }).toBuffer({ resolveWithObject: true });
            // eslint-disable-next-line no-await-in-loop
            const avifPut = await putObject(`${baseKey}/${v.width}.avif`, avifBuf, 'image/avif');
            imageVariants.push({
                label: v.label, width: avifInfo.width, height: avifInfo.height,
                storageKey: avifPut.key, url: avifPut.url, bytes: avifBuf.length, format: 'avif',
            });
        }
    }

    const blurDataURL = await generateBlurDataURL(buffer);

    return {
        provider: 'R2',
        bucket: BUCKET,
        // ownerType/ownerId were NOT returned here. Callers spread this object
        // straight into Media.create, so ownership fell back to the schema
        // default ('System', null) and 44 migrated images were filed as System
        // assets instead of Client/Team/Review. Ownership is an input to this
        // function; it must come back out.
        ownerType,
        ownerId,
        mediaType: 'Image',
        mimeType: masterMime,
        originalFileName,
        fileName: master.key.split('/').pop(),
        storageKey: master.key,
        publicUrl: master.url,
        cdnUrl: master.url,
        fileSize: masterBuf.length,
        checksum,
        width: meta.width,
        height: meta.height,
        aspectRatio: meta.width && meta.height ? +(meta.width / meta.height).toFixed(4) : undefined,
        blurDataURL,
        dominantColor: hex,
        imageVariants,
        status: 'Ready',
        uploadedBy,
    };
}

// Ingest a VIDEO: store the master on R2, generate a poster if a frame buffer is
// supplied, and leave ABR to the transcoder (see header note).
export async function ingestVideo({ buffer, contentType = 'video/mp4', originalFileName, ownerType = 'System', ownerId, slot, mediaId, posterBuffer, uploadedBy }) {
    const baseKey = buildBaseKey({ ownerType, ownerId, slot, mediaId });
    const master = await putObject(`${baseKey}/orig.mp4`, buffer, contentType);

    let posterUrl;
    let blurDataURL;
    if (posterBuffer) {
        const poster = await putObject(`${baseKey}/poster.webp`, await sharp(posterBuffer).webp({ quality: 70 }).toBuffer(), 'image/webp');
        posterUrl = poster.url;
        blurDataURL = await generateBlurDataURL(posterBuffer);
    }

    return {
        provider: 'R2',
        bucket: BUCKET,
        ownerType,
        ownerId,
        mediaType: 'Video',
        mimeType: contentType,
        originalFileName,
        fileName: master.key.split('/').pop(),
        storageKey: master.key,
        publicUrl: master.url,
        cdnUrl: master.url,
        fileSize: buffer.length,
        blurDataURL,
        status: 'Ready',
        uploadedBy,
        video: { posterUrl },
    };
}

// ---------------------------------------------------------------------------
// Multipart upload (browser -> R2 direct, resumable)
//
// R2 presigned URLs cover only GET/HEAD/PUT/DELETE. CreateMultipartUpload and
// CompleteMultipartUpload are POSTs and CANNOT be presigned, so they are
// orchestrated here on the server. Only UploadPart (a PUT) is handed to the
// browser as a presigned URL — so the bytes still never pass through Node.
// ---------------------------------------------------------------------------

/** R2 requires every part except the last to be exactly this size (min 5 MiB). */
export const PART_SIZE = 16 * 1024 * 1024;

/** Files at or below this go up as a single presigned PUT — no multipart at all. */
export const SINGLE_PUT_MAX = 8 * 1024 * 1024;

export const partCountFor = (fileSize) => Math.max(1, Math.ceil(fileSize / PART_SIZE));

/** Presigned PUT for a whole small object (images, posters). */
export async function signSinglePut({ key, contentType, expiresIn = 3600 }) {
    assertWritableKey(key, 'presign');
    return getSignedUrl(r2, new PutObjectCommand({
        Bucket: BUCKET,
        Key: key,
        ContentType: contentType,
        CacheControl: IMMUTABLE_CACHE_CONTROL,
    }), { expiresIn });
}

/**
 * Begin a multipart upload.
 *
 * CacheControl and ContentType MUST be set here: for a multipart object they are
 * fixed at create time, and CompleteMultipartUpload cannot add them afterwards.
 * Omitting them ships every large video with no cache header at all.
 */
export async function createMultipart({ key, contentType }) {
    assertWritableKey(key, 'multipart-create');
    const out = await r2.send(new CreateMultipartUploadCommand({
        Bucket: BUCKET,
        Key: key,
        ContentType: contentType,
        CacheControl: IMMUTABLE_CACHE_CONTROL,
    }));
    return out.UploadId;
}

/** Presigned PUT URLs for specific part numbers. Safe to call again for expired parts. */
export async function signParts({ key, uploadId, partNumbers, expiresIn = 3600 }) {
    return Promise.all(partNumbers.map(async (partNumber) => ({
        partNumber,
        url: await getSignedUrl(r2, new UploadPartCommand({
            Bucket: BUCKET, Key: key, UploadId: uploadId, PartNumber: partNumber,
        }), { expiresIn }),
        expiresAt: new Date(Date.now() + expiresIn * 1000),
    })));
}

/** Parts R2 has actually received — the resume primitive. Paginated. */
export async function listParts({ key, uploadId }) {
    const parts = [];
    let marker;
    do {
        // eslint-disable-next-line no-await-in-loop
        const out = await r2.send(new ListPartsCommand({
            Bucket: BUCKET, Key: key, UploadId: uploadId, PartNumberMarker: marker,
        }));
        for (const p of out.Parts || []) {
            parts.push({ partNumber: p.PartNumber, etag: p.ETag, size: p.Size, lastModified: p.LastModified });
        }
        marker = out.IsTruncated ? out.NextPartNumberMarker : undefined;
    } while (marker);
    return parts.sort((a, b) => a.partNumber - b.partNumber);
}

/**
 * Finish a multipart upload.
 *
 * The parts list is rebuilt from R2's own ListParts, never from the client's
 * request body, so a buggy or hostile client cannot assemble a corrupt object.
 */
export async function completeMultipart({ key, uploadId, expectedPartCount }) {
    const parts = await listParts({ key, uploadId });

    if (expectedPartCount && parts.length !== expectedPartCount) {
        const have = new Set(parts.map((p) => p.partNumber));
        const missing = Array.from({ length: expectedPartCount }, (_, i) => i + 1).filter((n) => !have.has(n));
        const err = new Error('Upload is incomplete');
        err.code = 'MISSING_PARTS';
        err.missing = missing;
        throw err;
    }

    await r2.send(new CompleteMultipartUploadCommand({
        Bucket: BUCKET,
        Key: key,
        UploadId: uploadId,
        MultipartUpload: { Parts: parts.map((p) => ({ PartNumber: p.partNumber, ETag: p.etag })) },
    }));

    const head = await r2.send(new HeadObjectCommand({ Bucket: BUCKET, Key: key }));
    return { key, url: cdnUrl(key), fileSize: head.ContentLength, etag: head.ETag, contentType: head.ContentType };
}

export async function abortMultipart({ key, uploadId }) {
    await r2.send(new AbortMultipartUploadCommand({ Bucket: BUCKET, Key: key, UploadId: uploadId }));
}

/**
 * Stream an object out of R2 to a local path.
 *
 * The transcode worker needs the master on disk — ffmpeg cannot read from a
 * buffer, and a 200 MB video must not be held in memory. Streaming straight to
 * a file keeps peak RSS flat regardless of file size.
 */
export async function downloadToFile(key, destPath) {
    const { createWriteStream } = await import('node:fs');
    const { pipeline } = await import('node:stream/promises');
    const out = await r2.send(new GetObjectCommand({ Bucket: BUCKET, Key: key }));
    await pipeline(out.Body, createWriteStream(destPath));
    return destPath;
}

/** Upload a local file to R2 by streaming it from disk. */
export async function uploadFile(key, filePath, contentType) {
    assertWritableKey(key, 'upload');
    const { createReadStream } = await import('node:fs');
    const { stat } = await import('node:fs/promises');
    const { size } = await stat(filePath);
    await r2.send(new PutObjectCommand({
        Bucket: BUCKET,
        Key: key,
        Body: createReadStream(filePath),
        ContentLength: size,           // required: a stream has no implicit length
        ContentType: contentType,
        CacheControl: IMMUTABLE_CACHE_CONTROL,
    }));
    return { key, url: cdnUrl(key), bytes: size };
}

export async function deleteFromR2(storageKey) {
    if (!canDeleteKey(storageKey, 'R2 delete')) return;
    await r2.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: storageKey }));
}

export { r2, putObject, cdnUrl };
