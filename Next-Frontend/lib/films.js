/**
 * Small helpers shared by /films, /allfilms and their cards — all read the
 * discovery film shape from /api/films/discovery.
 */
export const coupleOf = (f) => [f?.clientName?.Bride, f?.clientName?.Groom].filter(Boolean).join(' & ') || f?.title || 'Wedding film';
export const placeOf = (f) => f?.videos?.videoLocation?.city || f?.videos?.videoLocation?.state || '';
export const filmHref = (f) => `/films/${f?.videos?._id || f?._id}`;
/** What the in-place player plays: the 720p web file, else a YouTube/Vimeo embed. */
export const playSrc = (f) => f?.url || f?.embedUrl || null;
export const filmId = (f) => f?.videos?._id || f?._id;

/** "Pre-Wedding · Goa" */
export const blurbOf = (f) => [f?.event === 'Wedding / Pheras' ? 'Wedding' : f?.event, placeOf(f)].filter(Boolean).join(' · ');

/** Everything a search box should match against. */
export const searchTextOf = (f) => [coupleOf(f), f?.title, f?.event, placeOf(f), f?.videos?.videoLocation?.state, ...(f?.labels || [])]
    .filter(Boolean).join(' ').toLowerCase();

export const matchesQuery = (f, q) => {
    const words = String(q || '').toLowerCase().trim().split(/\s+/).filter(Boolean);
    if (!words.length) return true;
    const text = searchTextOf(f);
    return words.every((w) => text.includes(w));
};

/**
 * Rails for the hub. A small catalogue repeats films across categories, so the
 * rule is a per-group allowance rather than "no repeats": up to `perGroup[g]`
 * rails from each group, each with at least `min` films, skipping rows that
 * are really the whole library (≥ `wide` of `total`) and rows that are near
 * copies (≥ `same` overlap) of a rail already chosen. Everything else is `rest`
 * (the chip cloud). Group order: events, destinations, themes, regions, …
 */
export function pickRails(groups = [], {
    min = 3, total = 0, wide = 0.6, same = 0.85, skip = ['best-films'],
    perGroup = { events: 3, destinations: 2, themes: 1, regions: 1, formats: 0, traditions: 0 },
} = {}) {
    const rails = []; const rest = [];
    const order = ['events', 'destinations', 'themes', 'regions', 'formats', 'traditions'];
    const rank = (k) => { const i = order.indexOf(k); return i < 0 ? 99 : i; };
    const sorted = [...groups].sort((a, b) => rank(a.key) - rank(b.key));
    for (const g of sorted) {
        let taken = 0;
        const rows = [...g.rows].sort((a, b) => b.items.length - a.items.length);
        for (const r of rows) {
            if (skip.includes(r.key)) continue;
            const ids = new Set(r.items.map(filmId));
            const tooWide = total && ids.size / total >= wide;
            const copy = rails.some((x) => {
                const xs = x.items.map(filmId);
                return xs.filter((id) => ids.has(id)).length / Math.max(ids.size, xs.length) >= same;
            });
            if (taken < (perGroup[g.key] ?? 0) && ids.size >= min && !tooWide && !copy) {
                rails.push({ ...r, group: g.key, groupLabel: g.label });
                taken += 1;
            } else {
                rest.push({ ...r, group: g.key, groupLabel: g.label });
            }
        }
    }
    return { rails, rest };
}
