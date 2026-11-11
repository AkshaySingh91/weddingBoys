/** The /api/photos query string, shared by the server page and the gallery. */
export function queryOf({ tags = [], q = '', page = 1, limit = 24, sort = null }) {
    const p = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (tags.length) p.set('tag', tags.join(','));
    if (q.trim()) p.set('q', q.trim());
    if (sort) p.set('sort', sort);
    return p.toString();
}

/** The photo page's frame: full width on phones, the left column on desktop. */
export const FRAME_SIZES = '(max-width: 1023px) 100vw, 64vw';

/** The wedding story's chapter id for a ceremony ("Wedding / Pheras" → wedding-pheras). */
export const chapterKey = (label) => String(label || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

/** Ceremonies in the order a wedding happens. */
const RITE = ['pre-wedding', 'engagement', 'tilak', 'mehendi', 'haldi', 'sangeet', 'cocktail', 'wedding', 'wedding / pheras', 'reception'];
export const riteOrder = (label) => { const i = RITE.indexOf(String(label || '').toLowerCase()); return i < 0 ? RITE.length : i; };
