/** The /api/photos query string, shared by the server page and the gallery. */
export function queryOf({ tags = [], q = '', page = 1, limit = 24, sort = null }) {
    const p = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (tags.length) p.set('tag', tags.join(','));
    if (q.trim()) p.set('q', q.trim());
    if (sort) p.set('sort', sort);
    return p.toString();
}
