// Cloudflare Stream integration for large cinematic video.
//
// The point of this service is that the *bytes never touch our Node process*.
// We ask Cloudflare for a one-time "direct creator upload" URL, hand it to the
// browser, and the browser POSTs the multi-GB master straight to Cloudflare.
// Cloudflare then transcodes to adaptive HLS/DASH; we only persist the metadata
// (uid + playback URLs + thumbnail) into our Media collection.
//
// Env: CLOUDFLARE_ACCOUNT_ID (falls back to R2_ACCOUNT_ID — same account),
//      CLOUDFLARE_STREAM_API_TOKEN (a token with the Stream:Edit permission).

import { generateBlurDataURL } from './r2UploadService.js';

const ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID || process.env.R2_ACCOUNT_ID;
const API_TOKEN = process.env.CLOUDFLARE_STREAM_API_TOKEN;
const BASE = `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/stream`;

const authHeaders = (extra = {}) => ({ Authorization: `Bearer ${API_TOKEN}`, ...extra });

const firstError = (data, fallback) => data?.errors?.[0]?.message || fallback;

// Request a one-time Direct Creator Upload URL. `maxDurationSeconds` bounds what
// Cloudflare will accept (required by the API). The returned `uploadURL` is what
// the browser POSTs the file to; `uid` is the permanent asset id.
export async function createDirectUpload({ maxDurationSeconds = 10800, creator, name } = {}) {
    console.log(authHeaders({ 'Content-Type': 'application/json' }));
    const res = await fetch(`${BASE}/direct_upload`, {
        method: 'POST',
        headers: authHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({
            maxDurationSeconds,
            requireSignedURLs: false,
            ...(creator ? { creator } : {}),
            ...(name ? { meta: { name } } : {}),
        }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.success) throw new Error(firstError(data, 'Stream direct_upload failed'));
    return { uploadURL: data.result.uploadURL, uid: data.result.uid };
}

export async function getStreamVideo(uid) {
    const res = await fetch(`${BASE}/${uid}`, { headers: authHeaders() });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.success) throw new Error(firstError(data, 'Stream fetch failed'));
    return data.result;
}

export async function deleteStreamVideo(uid) {
    const res = await fetch(`${BASE}/${uid}`, { method: 'DELETE', headers: authHeaders() });
    if (!res.ok && res.status !== 404) {
        const data = await res.json().catch(() => ({}));
        throw new Error(firstError(data, 'Stream delete failed'));
    }
}

// Cloudflare exposes playback URLs (hls/dash/thumbnail) within seconds of the
// upload registering — well before the full transcode finishes. Poll briefly so
// the Media doc lands with real URLs; if the asset is still warming up we return
// whatever we have and let the doc be created in an 'Uploaded' (processing) state.
export async function waitForPlayback(uid, { tries = 5, delayMs = 1500 } = {}) {
    let last;
    for (let i = 0; i < tries; i += 1) {
        // eslint-disable-next-line no-await-in-loop
        last = await getStreamVideo(uid);
        if (last?.playback?.hls) return last;
        // eslint-disable-next-line no-await-in-loop
        await new Promise((r) => setTimeout(r, delayMs));
    }
    return last;
}

// Best-effort blur placeholder generated from the Stream thumbnail JPEG, so
// video posters get the same instant blur-up as images.
export async function blurFromThumbnail(thumbnailUrl) {
    try {
        const res = await fetch(thumbnailUrl);
        if (!res.ok) return undefined;
        const buf = Buffer.from(await res.arrayBuffer());
        return await generateBlurDataURL(buf);
    } catch {
        return undefined;
    }
}
