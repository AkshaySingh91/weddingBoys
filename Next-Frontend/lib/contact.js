/**
 * Links into /contact that carry where the visitor was, so the invitation
 * there arrives half-written:
 *   from     which button ('header', 'film', 'story', 'selects', 'varanasi', 'city', …)
 *   film     a film id     → "You were watching X's film"
 *   wedding  a story slug  → "You were reading X's wedding"
 *   selects  photo ids     → the frames they circled
 *   kind     'Wedding' | 'Pre-wedding shoot' | …   (pre-chosen)
 *   city     a place                                (pre-filled)
 *   focus    'date' — "Check your date" buttons open on the date
 */
export function contactHref({ from, film, wedding, selects, kind, city, focus } = {}) {
    const p = new URLSearchParams();
    if (from) p.set('from', from);
    if (film) p.set('film', film);
    if (wedding) p.set('wedding', wedding);
    if (selects?.length) p.set('selects', [].concat(selects).slice(0, 30).join(','));
    if (kind) p.set('kind', kind);
    if (city) p.set('city', city);
    if (focus) p.set('focus', focus);
    const q = p.toString();
    return q ? `/contact?${q}` : '/contact';
}

export const KINDS = ['Wedding', 'Pre-wedding shoot', 'Engagement', 'Destination wedding', 'Family function'];
