/**
 * The public shapes of a film, a photo and a wedding, shared by every endpoint
 * that shows them (story pages, the weddings index, related weddings), so a
 * card looks the same wherever it appears.
 */

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];

const monthYear = (d) => {
    const dt = d ? new Date(d) : null;
    return dt && !Number.isNaN(dt.getTime()) ? `${MONTHS[dt.getMonth()]} ${dt.getFullYear()}` : null;
};

const placeOf = (loc = {}) => ({ city: loc.city || null, venue: loc.venue || null, state: loc.state || null });

export function toFilmCard(i) {
    const r = i.render || {};
    return {
        _id: String(i._id),
        kind: 'Video',
        href: `/films/${i._id}`,
        title: i.title || null,
        caption: i.caption || null,
        ceremony: i.eventGroup || null,
        tags: i.tags || [],
        shootDate: monthYear(i.shootDate),
        location: placeOf(i.location),
        posterUrl: r.posterUrl || null,
        blurDataURL: r.blurDataURL || null,
        dominantColor: r.dominantColor || null,
        aspectRatio: r.aspectRatio || null,
        durationSec: r.durationSec || i.external?.durationSec || null,
        loopUrl: r.loopUrl || null,
        webUrl: r.webUrl || null,
        sourceUrl: r.sourceUrl || null,
        // YouTube / Vimeo films play in their embed; `external` says which.
        embedUrl: r.embedUrl || null,
        external: i.external?.provider ? { provider: i.external.provider, videoId: i.external.videoId } : null,
    };
}

export function toPhotoCard(i) {
    const r = i.render || {};
    return {
        _id: String(i._id),
        kind: 'Photo',
        href: `/photos/${i._id}`,
        title: i.title || null,
        caption: i.caption || null,
        ceremony: i.eventGroup || null,
        tags: i.tags || [],
        shootDate: monthYear(i.shootDate),
        location: placeOf(i.location),
        imageUrl: r.imageUrl || null,
        width: r.width || null,
        height: r.height || null,
        blurDataURL: r.blurDataURL || null,
        dominantColor: r.dominantColor || null,
        aspectRatio: r.aspectRatio || null,
    };
}

export const toCard = (i) => (i.kind === 'Video' ? toFilmCard(i) : toPhotoCard(i));

/** A wedding card. `cover` is its cover item (film or photo), `counts` { films, photos }. */
export function toWeddingCard(client, cover, counts = {}) {
    const bride = client.clientName?.Bride || '';
    const groom = client.clientName?.Groom || '';
    const r = cover?.render || {};
    return {
        slug: client.slug,
        href: `/weddings/story/${client.slug}`,
        couple: { bride, groom },
        title: [bride, groom].filter(Boolean).join(' & '),
        // Older weddings have no dates of their own: the first shoot's month stands in.
        dates: client.celebrationDates?.spanDisplay || monthYear(client.weddingDate || client.celebrationDates?.startDate || counts.firstShoot),
        location: placeOf(client.location),
        featured: Boolean(client.featured),
        cover: cover ? {
            url: r.posterUrl || r.imageUrl || null,
            blurDataURL: r.blurDataURL || null,
            dominantColor: r.dominantColor || null,
            aspectRatio: r.aspectRatio || null,
        } : null,
        films: counts.films || 0,
        photos: counts.photos || 0,
    };
}

/** Crew credited across a wedding's items, de-duplicated: [{ name, roles[] }]. */
export function crewOf(items) {
    const byName = new Map();
    for (const i of items) {
        for (const c of i.credits || []) {
            const name = (c.name || '').trim();
            if (!name) continue;
            const key = name.toLowerCase();
            const entry = byName.get(key) || { name, roles: [] };
            const role = (c.role || '').trim();
            if (role && !entry.roles.some((r) => r.toLowerCase() === role.toLowerCase())) entry.roles.push(role);
            byName.set(key, entry);
        }
    }
    return [...byName.values()];
}
