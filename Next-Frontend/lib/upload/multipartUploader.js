'use client';

/**
 * Browser → R2 direct upload.
 *
 * Bytes go straight from the file input to R2 via presigned PUT URLs; the API is
 * only ever asked for metadata. Everything that made the old upload paths
 * fragile is handled here once, rather than copy-pasted seven times:
 *
 *   - real progress, per file and overall
 *   - pause / resume / cancel
 *   - per-part retry with backoff, and re-signing of URLs that expired mid-flight
 *   - resume across a page refresh, by asking R2 which parts already landed
 *   - failures REJECT. The old helpers swallowed errors and let callers save a
 *     database row pointing at bytes that never arrived.
 *
 * No dependencies. XMLHttpRequest rather than fetch because fetch still cannot
 * report upload progress.
 */

const api_url = process.env.NEXT_PUBLIC_API_URL;

const LS_KEY = 'wb.uploads.v1';
const MAX_ATTEMPTS = 5;
const SIGN_BATCH = 50;

export const fingerprintOf = (file) => `${file.name}:${file.size}:${file.lastModified}`;

/* ---------------------------------------------------------------- utilities */

const sleep = (ms, signal) => new Promise((resolve, reject) => {
    const t = setTimeout(resolve, ms);
    signal?.addEventListener('abort', () => { clearTimeout(t); reject(new DOMException('Aborted', 'AbortError')); }, { once: true });
});

// Exponential backoff with jitter — a synchronised retry storm helps nobody.
const backoffMs = (attempt) => Math.min(30_000, 500 * 2 ** attempt) * (0.5 + Math.random());

async function apiJson(path, { method = 'GET', body } = {}) {
    const res = await fetch(`${api_url}${path}`, {
        method,
        credentials: 'include',
        headers: body ? { 'Content-Type': 'application/json' } : undefined,
        body: body ? JSON.stringify(body) : undefined,
    });
    let data = null;
    try { data = await res.json(); } catch { /* empty body */ }
    if (!res.ok) {
        const err = new Error(data?.message || `Request failed (${res.status})`);
        err.status = res.status;
        err.data = data;
        throw err;
    }
    return data;
}

/** A single PUT with upload progress. Resolves with the ETag when R2 returns one. */
function putWithProgress(url, blob, { onProgress, signal, contentType, cacheControl } = {}) {
    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('PUT', url, true);
        if (contentType) xhr.setRequestHeader('Content-Type', contentType);
        // Signed into the URL by the server; omitting it stores the object with
        // R2's short default cache instead of the immutable one-year policy.
        if (cacheControl) xhr.setRequestHeader('Cache-Control', cacheControl);

        xhr.upload.onprogress = (e) => { if (e.lengthComputable) onProgress?.(e.loaded, e.total); };
        xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
                resolve({ etag: xhr.getResponseHeader('ETag'), status: xhr.status });
            } else {
                const err = new Error(`Upload failed (${xhr.status})`);
                err.status = xhr.status;
                reject(err);
            }
        };
        xhr.onerror = () => reject(Object.assign(new Error('Network error during upload'), { status: 0 }));
        xhr.ontimeout = () => reject(Object.assign(new Error('Upload timed out'), { status: 0 }));
        xhr.onabort = () => reject(new DOMException('Aborted', 'AbortError'));

        signal?.addEventListener('abort', () => xhr.abort(), { once: true });
        xhr.send(blob);
    });
}

/* ------------------------------------------- local index of in-flight uploads */
// Metadata only. Persisting 200 MB blobs in IndexedDB is unreliable, so resume
// works by matching a re-picked file against a fingerprint instead.

const readIndex = () => {
    try { return JSON.parse(localStorage.getItem(LS_KEY) || '{}'); } catch { return {}; }
};
const writeIndex = (idx) => {
    try { localStorage.setItem(LS_KEY, JSON.stringify(idx)); } catch { /* private mode / quota */ }
};
export function rememberSession(file, session) {
    const idx = readIndex();
    idx[fingerprintOf(file)] = { ...session, updatedAt: Date.now() };
    writeIndex(idx);
}
export function forgetSession(file) {
    const idx = readIndex();
    delete idx[fingerprintOf(file)];
    writeIndex(idx);
}
export const recallSession = (file) => readIndex()[fingerprintOf(file)] || null;

/* ------------------------------------------------------------- the uploader */

/**
 * Start (or resume) an upload.
 *
 * @returns {{ promise: Promise<object>, pause: Function, resume: Function, abort: Function, getSessionId: Function }}
 */
export function createUpload({
    file,
    ownerType = 'System',
    ownerId = null,
    slot,
    rendition = 'orig',
    sourceMediaId,
    meta = {},
    concurrency = 3,
    onProgress,          // (uploadedBytes, totalBytes)
    onStatus,            // ('creating'|'uploading'|'paused'|'completing'|'done'|'error')
    resumeSessionId,
}) {
    let controller = new AbortController();
    let paused = false;
    let cancelled = false;
    let session = null;

    const uploadedByPart = new Map();
    const emitProgress = () => {
        let sum = 0;
        for (const n of uploadedByPart.values()) sum += n;
        onProgress?.(Math.min(sum, file.size), file.size);
    };

    async function ensureSession() {
        if (session) return session;

        if (resumeSessionId) {
            // Resuming: trust the server's view of what already landed.
            const parts = await apiJson(`/api/admin/uploads/${resumeSessionId}/parts`);
            session = { sessionId: resumeSessionId, mode: parts.uploadId ? 'multipart' : 'single', ...parts };
            for (const p of parts.parts || []) uploadedByPart.set(p.partNumber, p.size);
            emitProgress();
            return session;
        }

        onStatus?.('creating');
        session = await apiJson('/api/admin/uploads/create', {
            method: 'POST',
            body: {
                fileName: file.name,
                contentType: file.type || 'application/octet-stream',
                fileSize: file.size,
                ownerType, ownerId, slot, rendition, sourceMediaId,
                fingerprint: fingerprintOf(file),
                meta,
            },
        });
        rememberSession(file, {
            sessionId: session.sessionId, key: session.key,
            partSize: session.partSize, partCount: session.partCount,
        });
        return session;
    }

    async function uploadPart(partNumber, url) {
        const { partSize } = session;
        const start = (partNumber - 1) * partSize;
        const blob = file.slice(start, Math.min(start + partSize, file.size));

        let attempt = 0;
        let signedUrl = url;
        // An expired presigned URL is not a real failure — re-sign and carry on.
        let freeResigns = 2;

        for (;;) {
            try {
                await putWithProgress(signedUrl, blob, {
                    signal: controller.signal,
                    onProgress: (loaded) => { uploadedByPart.set(partNumber, loaded); emitProgress(); },
                });
                uploadedByPart.set(partNumber, blob.size);
                emitProgress();
                return;
            } catch (error) {
                if (error.name === 'AbortError') throw error;

                const expired = error.status === 403;
                if (expired && freeResigns > 0) {
                    freeResigns -= 1;
                    const { urls } = await apiJson(`/api/admin/uploads/${session.sessionId}/sign`, {
                        method: 'POST', body: { partNumbers: [partNumber] },
                    });
                    signedUrl = urls[0].url;
                    continue;
                }
                // A definite client error will not fix itself.
                if (error.status >= 400 && error.status < 500 && !expired) throw error;

                attempt += 1;
                if (attempt >= MAX_ATTEMPTS) throw error;
                uploadedByPart.set(partNumber, 0);
                emitProgress();
                await sleep(backoffMs(attempt), controller.signal);

                const { urls } = await apiJson(`/api/admin/uploads/${session.sessionId}/sign`, {
                    method: 'POST', body: { partNumbers: [partNumber] },
                });
                signedUrl = urls[0].url;
            }
        }
    }

    async function run() {
        await ensureSession();

        if (session.mode === 'single') {
            onStatus?.('uploading');
            let url = session.singlePartUrl;
            if (!url) {
                // Resumed single-part upload: mint a fresh presigned PUT.
                const fresh = await apiJson('/api/admin/uploads/create', {
                    method: 'POST',
                    body: {
                        fileName: file.name, contentType: file.type, fileSize: file.size,
                        ownerType, ownerId, slot, rendition, sourceMediaId,
                        fingerprint: fingerprintOf(file), meta,
                    },
                });
                session = fresh;
                url = fresh.singlePartUrl;
            }
            await putWithProgress(url, file, {
                signal: controller.signal,
                contentType: file.type || 'application/octet-stream',
                cacheControl: session.cacheControl,
                onProgress: (loaded) => { uploadedByPart.set(1, loaded); emitProgress(); },
            });
        } else {
            onStatus?.('uploading');
            const done = new Set(uploadedByPart.keys());
            const todo = [];
            for (let n = 1; n <= session.partCount; n += 1) if (!done.has(n)) todo.push(n);

            // Sign in batches so a 13-part file is two round-trips, not thirteen.
            const signed = new Map();
            for (let i = 0; i < todo.length; i += SIGN_BATCH) {
                const slice = todo.slice(i, i + SIGN_BATCH);
                const { urls } = await apiJson(`/api/admin/uploads/${session.sessionId}/sign`, {
                    method: 'POST', body: { partNumbers: slice },
                });
                for (const u of urls) signed.set(u.partNumber, u.url);
            }

            // Bounded parallelism: enough to saturate an upstream, not so much
            // that the browser's per-host socket budget starves the sign calls.
            const queue = [...todo];
            const workers = Array.from({ length: Math.max(1, concurrency) }, async () => {
                while (queue.length) {
                    if (cancelled || paused) return;
                    const n = queue.shift();
                    await uploadPart(n, signed.get(n));
                }
            });

            // allSettled, not all: `Array.from` with an async mapper starts every
            // worker immediately, so `Promise.all` would adopt the first rejection
            // and leave the other workers' rejections unobserved — an
            // unhandledRejection per worker whenever an upload genuinely fails.
            // Settle them all, then surface the first real error.
            const results = await Promise.allSettled(workers);
            const failed = results.find((r) => r.status === 'rejected');
            if (failed) throw failed.reason;
        }

        if (paused || cancelled) {
            const err = new Error(paused ? 'Upload paused' : 'Upload cancelled');
            err.name = paused ? 'PausedError' : 'AbortError';
            throw err;
        }

        onStatus?.('completing');
        const { media } = await apiJson(`/api/admin/uploads/${session.sessionId}/complete`, {
            method: 'POST', body: { meta },
        });
        forgetSession(file);
        onStatus?.('done');
        return media;
    }

    const promise = run().catch((error) => {
        // pause() aborts the in-flight parts, so the rejection surfaces as an
        // AbortError even though the user only paused. Disambiguate on the flag,
        // not the error name — otherwise pausing is reported as cancelling and
        // the item cannot be resumed.
        if (paused && error.name === 'AbortError') {
            const pausedErr = new Error('Upload paused');
            pausedErr.name = 'PausedError';
            throw pausedErr;
        }
        if (error.name !== 'AbortError' && error.name !== 'PausedError') onStatus?.('error');
        throw error;
    });

    return {
        promise,
        getSessionId: () => session?.sessionId,
        pause() {
            paused = true;
            controller.abort();          // in-flight parts are simply re-sent later
            onStatus?.('paused');
        },
        resume() {
            paused = false;
            controller = new AbortController();
            return createUpload({
                file, ownerType, ownerId, slot, rendition, sourceMediaId, meta,
                concurrency, onProgress, onStatus,
                resumeSessionId: session?.sessionId,
            });
        },
        async abort() {
            cancelled = true;
            controller.abort();
            if (session?.sessionId) {
                await apiJson(`/api/admin/uploads/${session.sessionId}/abort`, { method: 'POST' }).catch(() => { });
            }
            forgetSession(file);
        },
    };
}

/** In-flight uploads this admin can pick back up. */
export async function listResumable() {
    const data = await apiJson('/api/admin/uploads/resumable').catch(() => ({ sessions: [] }));
    return data.sessions || [];
}
