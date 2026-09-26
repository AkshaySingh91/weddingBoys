/**
 * A wedding's public identity: its story-page slug and its location.
 *
 * Slugs are "bride-groom" (aisha-rahul). They are unique across current AND
 * past slugs, because a past slug is a live redirect: handing it to another
 * wedding would send old links to the wrong couple.
 */
import Client from '../Models/ClientSchema.js';
import { slugify } from './taxonomy.js';

/** Words the router or the site already uses under /weddings. */
const RESERVED = new Set(['story', 'new', 'edit', 'admin', 'api', 'weddings']);
const SLUG_RX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const slugForNames = (bride, groom) => slugify([bride, groom].filter(Boolean).join(' '));

export class SlugError extends Error {
    constructor(message) { super(message); this.status = 400; }
}

/** A slug an admin typed: lower-case words joined by hyphens, 3–80 chars, not reserved. */
export function checkSlug(raw) {
    const slug = String(raw ?? '').trim().toLowerCase();
    if (!SLUG_RX.test(slug)) throw new SlugError('Use lower-case letters, digits and single hyphens (e.g. aisha-rahul)');
    if (slug.length < 3 || slug.length > 80) throw new SlugError('A slug is 3 to 80 characters');
    if (RESERVED.has(slug)) throw new SlugError(`"${slug}" is reserved`);
    return slug;
}

/** Is `slug` (current or past) free for the wedding `exceptId`? */
export async function slugTaken(slug, exceptId) {
    return Boolean(await Client.exists({
        _id: { $ne: exceptId },
        $or: [{ slug }, { slugHistory: slug }],
    }));
}

/**
 * The first free slug for a couple: aisha-rahul, then aisha-rahul-2025 (the
 * wedding year), then aisha-rahul-2, -3…
 */
export async function uniqueSlug(base, { exceptId, year } = {}) {
    let root = slugify(base) || 'wedding';
    if (RESERVED.has(root)) root = `${root}-wedding`;
    const candidates = [root, ...(year ? [`${root}-${year}`] : [])];
    for (const c of candidates) if (!(await slugTaken(c, exceptId))) return c;
    for (let n = 2; n < 500; n++) {
        const c = `${root}-${n}`;
        if (!(await slugTaken(c, exceptId))) return c;
    }
    throw new SlugError('Could not find a free slug');
}

/** A location from admin input, with its city slug for /weddings/<city>. */
export function locationFrom(input = {}) {
    const clean = (v) => (typeof v === 'string' ? v.replace(/\s+/g, ' ').trim() : undefined);
    const loc = {
        city: clean(input.city),
        state: clean(input.state),
        country: clean(input.country),
        venue: clean(input.venue),
    };
    loc.citySlug = loc.city ? slugify(loc.city) : undefined;
    return Object.fromEntries(Object.entries(loc).filter(([, v]) => v));
}
