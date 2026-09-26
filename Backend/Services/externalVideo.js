/**
 * Films hosted on YouTube or Vimeo (plan D8): parse the link, ask the host's
 * oEmbed endpoint for the title, poster and (Vimeo) duration, and build the
 * privacy-friendly embed URL the site plays.
 *
 * Only these two hosts, matched on the parsed hostname — never a free-form URL
 * fetched or embedded on the admin's say-so.
 */
const TIMEOUT_MS = 8000;

export class ExternalVideoError extends Error {
    constructor(message, status = 400) { super(message); this.status = status; }
}

/** { provider, videoId } from a YouTube or Vimeo link, or throws. */
export function parseVideoUrl(raw) {
    let url;
    try { url = new URL(String(raw || '').trim()); } catch { throw new ExternalVideoError('Paste a full YouTube or Vimeo link'); }
    if (!['http:', 'https:'].includes(url.protocol)) throw new ExternalVideoError('Paste a full YouTube or Vimeo link');
    const host = url.hostname.replace(/^(www\.|m\.)/, '');

    if (host === 'youtu.be') {
        const id = url.pathname.slice(1).split('/')[0];
        if (/^[\w-]{11}$/.test(id)) return { provider: 'youtube', videoId: id };
    }
    if (host === 'youtube.com' || host === 'youtube-nocookie.com') {
        const v = url.searchParams.get('v');
        if (v && /^[\w-]{11}$/.test(v)) return { provider: 'youtube', videoId: v };
        const m = url.pathname.match(/^\/(?:embed|shorts|live|v)\/([\w-]{11})/);
        if (m) return { provider: 'youtube', videoId: m[1] };
    }
    if (host === 'vimeo.com' || host === 'player.vimeo.com') {
        const m = url.pathname.match(/(?:^|\/)(\d{6,12})(?:\/|$)/);
        if (m) return { provider: 'vimeo', videoId: m[1] };
    }
    throw new ExternalVideoError('That is not a YouTube or Vimeo video link');
}

export const canonicalUrl = ({ provider, videoId }) => (provider === 'youtube'
    ? `https://www.youtube.com/watch?v=${videoId}`
    : `https://vimeo.com/${videoId}`);

/** youtube-nocookie and Vimeo's do-not-track mode: no tracking cookies until play. */
export const embedUrlFor = ({ provider, videoId }) => (provider === 'youtube'
    ? `https://www.youtube-nocookie.com/embed/${videoId}?rel=0&modestbranding=1&playsinline=1`
    : `https://player.vimeo.com/video/${videoId}?dnt=1`);

async function getJson(url) {
    const res = await fetch(url, { signal: AbortSignal.timeout(TIMEOUT_MS), headers: { accept: 'application/json' } });
    if (res.status === 401 || res.status === 403) throw new ExternalVideoError('That video is private or cannot be embedded', 400);
    if (res.status === 404) throw new ExternalVideoError('That video does not exist', 400);
    if (!res.ok) throw new ExternalVideoError(`The video host answered ${res.status}; try again`, 502);
    return res.json();
}

/**
 * Look the video up. Returns { provider, videoId, url, embedUrl, title,
 * posterUrl, durationSec, width, height }.
 */
export async function lookupVideo(rawUrl) {
    const id = parseVideoUrl(rawUrl);
    const url = canonicalUrl(id);
    let meta;
    try {
        meta = id.provider === 'youtube'
            ? await getJson(`https://www.youtube.com/oembed?format=json&url=${encodeURIComponent(url)}`)
            : await getJson(`https://vimeo.com/api/oembed.json?url=${encodeURIComponent(url)}&width=1920`);
    } catch (error) {
        if (error instanceof ExternalVideoError) throw error;
        throw new ExternalVideoError('Could not reach the video host; try again', 502);
    }

    let posterUrl = meta.thumbnail_url;
    if (id.provider === 'youtube') {
        // oEmbed gives the 480px frame; use the full-HD one when the video has it.
        const hd = `https://i.ytimg.com/vi/${id.videoId}/maxresdefault.jpg`;
        const head = await fetch(hd, { method: 'HEAD', signal: AbortSignal.timeout(TIMEOUT_MS) }).catch(() => null);
        if (head?.ok) posterUrl = hd;
    } else if (posterUrl) {
        // Vimeo thumbnails are sized in the URL ("…_295x166" or "…-d_960"); ask
        // for full width, keeping the original if that size does not exist.
        const wide = posterUrl.replace(/_\d+x\d+(?=\.|$|\?)/, '_1920').replace(/-d_\d+(?=\?|$)/, '-d_1920');
        if (wide !== posterUrl) {
            const head = await fetch(wide, { method: 'HEAD', signal: AbortSignal.timeout(TIMEOUT_MS) }).catch(() => null);
            if (head?.ok) posterUrl = wide;
        }
    }

    return {
        ...id,
        url,
        embedUrl: embedUrlFor(id),
        title: meta.title,
        posterUrl,
        durationSec: Number.isFinite(meta.duration) ? meta.duration : undefined,
        width: meta.width,
        height: meta.height,
    };
}
