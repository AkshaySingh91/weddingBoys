// controllers/embedController.js
import Client from '../Models/ClientSchema.js';

// Provider host allowlist for strict security (FR-EMBED-03)
const ALLOWED_DOMAINS = [
    'youtube.com',
    'www.youtube.com',
    'youtu.be',
    'm.youtube.com',
    'vimeo.com',
    'player.vimeo.com',
    'cloudflarestream.com',
    'videodelivery.net',
    'iframe.videodelivery.net',
    'instagram.com',
    'www.instagram.com',
    'spotify.com',
    'open.spotify.com',
    'google.com',
    'maps.google.com',
    'goo.gl',
    'pinterest.com',
    'www.pinterest.com',
    'pin.it',
];

/**
 * Validate URL against domain allowlist
 */
function isDomainAllowed(rawUrl) {
    try {
        const parsed = new URL(rawUrl);
        const host = parsed.hostname.toLowerCase();
        return ALLOWED_DOMAINS.some((allowed) => host === allowed || host.endsWith('.' + allowed));
    } catch {
        return false;
    }
}

/**
 * Fetch JSON with a timeout
 */
async function fetchWithTimeout(url, timeoutMs = 4000) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    try {
        const res = await fetch(url, {
            signal: controller.signal,
            headers: { 'User-Agent': 'WeddingBoysBot/1.0 (+https://theweddingboys.in)' },
        });
        if (!res.ok) return null;
        return await res.json();
    } catch {
        return null;
    } finally {
        clearTimeout(timeout);
    }
}

/**
 * POST or GET /api/admin/embed/resolve?url=...
 * Resolves any supported external URL into standardized embed metadata.
 */
export const resolveEmbed = async (req, res) => {
    try {
        const rawUrl = req.query.url || req.body.url;
        if (!rawUrl || typeof rawUrl !== 'string') {
            return res.status(400).json({ error: 'URL parameter is required' });
        }

        const trimmedUrl = rawUrl.trim();
        if (!isDomainAllowed(trimmedUrl)) {
            return res.status(400).json({
                error: 'Domain is not in the allowed embeds list. Supported: YouTube, Vimeo, Cloudflare Stream, Instagram, Spotify, Google Maps, Pinterest.',
            });
        }

        const parsed = new URL(trimmedUrl);
        const host = parsed.hostname.toLowerCase();
        const pathname = parsed.pathname;

        // ── 1. YouTube ──
        if (host.includes('youtube.com') || host.includes('youtu.be')) {
            let videoId = null;
            const isShorts = pathname.includes('/shorts/');

            if (host.includes('youtu.be')) {
                videoId = pathname.slice(1).split(/[?#]/)[0];
            } else if (isShorts) {
                videoId = pathname.split('/shorts/')[1]?.split(/[?#]/)[0];
            } else {
                videoId = parsed.searchParams.get('v');
            }

            if (!videoId || videoId.length < 5) {
                return res.status(400).json({ error: 'Could not extract YouTube video ID' });
            }

            const oembed = await fetchWithTimeout(
                `https://www.youtube.com/oembed?url=${encodeURIComponent(trimmedUrl)}&format=json`
            );

            return res.json({
                provider: 'youtube',
                embedId: videoId,
                url: trimmedUrl,
                embedUrl: `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`,
                title: oembed?.title || 'YouTube Wedding Video',
                author: oembed?.author_name || 'YouTube',
                thumbnail: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
                aspectRatio: isShorts ? '9/16' : '16/9',
                caption: '',
            });
        }

        // ── 2. Vimeo ──
        if (host.includes('vimeo.com')) {
            const match = pathname.match(/(?:video\/)?(\d+)/);
            const vimeoId = match ? match[1] : null;

            if (!vimeoId) {
                return res.status(400).json({ error: 'Could not extract Vimeo video ID' });
            }

            const oembed = await fetchWithTimeout(
                `https://vimeo.com/api/oembed.json?url=${encodeURIComponent(trimmedUrl)}`
            );

            return res.json({
                provider: 'vimeo',
                embedId: vimeoId,
                url: trimmedUrl,
                embedUrl: `https://player.vimeo.com/video/${vimeoId}?autoplay=1`,
                title: oembed?.title || 'Vimeo Cinematic Film',
                author: oembed?.author_name || 'Vimeo',
                thumbnail: oembed?.thumbnail_url || '',
                aspectRatio: '16/9',
                caption: '',
            });
        }

        // ── 3. Cloudflare Stream ──
        if (host.includes('cloudflarestream.com') || host.includes('videodelivery.net')) {
            const match = pathname.match(/([a-zA-Z0-9]{32})/);
            const streamUid = match ? match[1] : null;

            if (!streamUid) {
                return res.status(400).json({ error: 'Could not extract Cloudflare Stream UID' });
            }

            return res.json({
                provider: 'stream',
                embedId: streamUid,
                url: trimmedUrl,
                embedUrl: `https://iframe.videodelivery.net/${streamUid}`,
                title: 'The Wedding Boys Cinematic Film',
                author: 'The Wedding Boys',
                thumbnail: `https://videodelivery.net/${streamUid}/thumbnails/thumbnail.jpg?time=2s&height=720`,
                aspectRatio: '16/9',
                caption: '',
            });
        }

        // ── 4. Spotify ──
        if (host.includes('spotify.com')) {
            const match = pathname.match(/\/(track|playlist|album|episode)\/([a-zA-Z0-9]+)/);
            if (!match) {
                return res.status(400).json({ error: 'Could not extract Spotify resource ID' });
            }

            const [, type, spotifyId] = match;
            const oembed = await fetchWithTimeout(
                `https://open.spotify.com/oembed?url=${encodeURIComponent(trimmedUrl)}`
            );

            return res.json({
                provider: 'spotify',
                embedId: spotifyId,
                url: trimmedUrl,
                embedUrl: `https://open.spotify.com/embed/${type}/${spotifyId}?utm_source=generator&theme=0`,
                title: oembed?.title || 'Wedding Soundtrack',
                author: oembed?.author_name || 'Spotify',
                thumbnail: oembed?.thumbnail_url || '',
                aspectRatio: type === 'track' ? 'compact' : 'compact-card',
                caption: '',
            });
        }

        // ── 5. Instagram ──
        if (host.includes('instagram.com')) {
            const match = pathname.match(/\/(?:p|reel|tv)\/([a-zA-Z0-9_-]+)/);
            if (!match) {
                return res.status(400).json({ error: 'Could not extract Instagram post or reel code' });
            }

            const code = match[1];
            const isReel = pathname.includes('/reel/');

            return res.json({
                provider: 'instagram',
                embedId: code,
                url: trimmedUrl,
                embedUrl: `https://www.instagram.com/p/${code}/embed/captioned/`,
                title: isReel ? 'Instagram Wedding Reel' : 'Instagram Wedding Post',
                author: 'Instagram',
                thumbnail: '',
                aspectRatio: isReel ? '9/16' : '4/5',
                caption: '',
            });
        }

        // ── 6. Google Maps ──
        if (host.includes('google.com') && (pathname.includes('/maps') || host.includes('maps.google.com') || host.includes('goo.gl'))) {
            // Support direct embed iframe URLs, query URLs, or place URLs
            let query = parsed.searchParams.get('q') || parsed.searchParams.get('query');
            if (!query && pathname.includes('/place/')) {
                query = decodeURIComponent(pathname.split('/place/')[1]?.split('/')[0] || '').replace(/\+/g, ' ');
            }
            if (!query) {
                query = 'Wedding Venue';
            }

            const embedUrl = `https://maps.google.com/maps?q=${encodeURIComponent(query)}&t=&z=14&ie=UTF8&iwloc=&output=embed`;

            return res.json({
                provider: 'google-maps',
                embedId: query,
                url: trimmedUrl,
                embedUrl,
                title: query,
                author: 'Google Maps',
                thumbnail: '',
                aspectRatio: '16/9',
                caption: `Location: ${query}`,
            });
        }

        // ── 7. Pinterest ──
        if (host.includes('pinterest.com') || host.includes('pin.it')) {
            const match = pathname.match(/\/pin\/(\d+)/);
            const pinId = match ? match[1] : (pathname.split('/')[2] || 'pin');

            return res.json({
                provider: 'pinterest',
                embedId: pinId,
                url: trimmedUrl,
                embedUrl: `https://assets.pinterest.com/ext/embed.html?id=${pinId}`,
                title: 'Wedding Moodboard & Style Inspiration',
                author: 'Pinterest',
                thumbnail: '',
                aspectRatio: '2/3',
                caption: '',
            });
        }

        return res.status(400).json({ error: 'Unsupported embed provider' });
    } catch (err) {
        console.error('resolveEmbed error:', err);
        return res.status(500).json({ error: err.message || 'Server error resolving embed' });
    }
};

/**
 * GET /api/admin/embed/clients?query=...
 * Search portfolio clients to 1-click embed studio films & photo stories.
 */
export const searchPortfolioClients = async (req, res) => {
    try {
        const q = (req.query.query || '').trim();
        const filter = {};

        if (q) {
            filter.$or = [
                { 'clientName.Bride': { $regex: q, $options: 'i' } },
                { 'clientName.Groom': { $regex: q, $options: 'i' } },
                { 'videos.tags': { $regex: q, $options: 'i' } },
                { 'photos.tags': { $regex: q, $options: 'i' } },
            ];
        }

        const clients = await Client.find(filter)
            .sort({ createdAt: -1 })
            .limit(20)
            .lean();

        const formatted = clients.map((c) => {
            const bride = c.clientName?.Bride || 'Bride';
            const groom = c.clientName?.Groom || 'Groom';
            const title = `${bride} & ${groom}`;

            const videos = (c.videos || []).map((v) => ({
                id: v._id,
                title: `${title} — Wedding Film`,
                hlsUrl: v.videoMetaData?.hlsUrl || v.videoMetaData?.url || '',
                streamUid: v.videoMetaData?.streamUid || null,
                poster: v.thumbnailMetaData?.publicUrl || v.thumbnailMetaData?.url || '',
                venue: v.videoLocation?.venue || v.videoLocation?.city || '',
                tags: v.tags || [],
            }));

            const photos = (c.photos || []).map((p) => ({
                id: p._id,
                url: p.photoMetaData?.cdnUrl || p.photoMetaData?.publicUrl || p.photoMetaData?.url || '',
                venue: p.photoLocation?.venue || p.photoLocation?.city || '',
                tags: p.tags || [],
            }));

            return {
                id: c._id,
                title,
                bride,
                groom,
                videos,
                photos,
            };
        });

        res.json({ clients: formatted });
    } catch (err) {
        console.error('searchPortfolioClients error:', err);
        res.status(500).json({ error: err.message || 'Server error searching clients' });
    }
};
