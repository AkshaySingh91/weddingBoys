/**
 * Settings for the CMS `section` blocks that show portfolio content (plan
 * phase 6). Before this, a section block took no settings at all — the CMS
 * could reorder or hide the home films row but never say WHICH films.
 *
 *   heroVideos    { collectionKey }                         the home hero
 *   ourFilms      { heading, tabs[], defaultTab }           home "Our films" tabs
 *   portfolio     { heading, tabs[] }                       home "Our portfolio" grid
 *   filmRows      { rows[], dedupe }                        /films
 *   browseFilms   { facetGroups[], sort, pageSize }         /allfilms
 *   photoGallery  { facetGroups[], sort, pageSize }         /photos
 *
 * `tabs` / `rows` are collection keys, in display order; `facetGroups` are
 * tag-group keys (an empty list means every visible category).
 * Components not listed here take no settings and pass through untouched.
 */
import { z } from 'zod';

const KEY = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Use a row key such as films-beach');
const SORT = z.enum(['newestShoot', 'newestPublished', 'featured']);
const keys = (max) => z.array(KEY).max(max).default([]);

export const SECTION_SCHEMAS = {
    heroVideos: z.object({ collectionKey: KEY.default('home-hero') }),
    ourFilms: z.object({
        heading: z.string().trim().max(120).optional(),
        tabs: keys(12),
        defaultTab: KEY.optional(),
    }),
    portfolio: z.object({
        heading: z.string().trim().max(120).optional(),
        tabs: keys(12),
    }),
    filmRows: z.object({
        rows: keys(20),
        // Skip a film in a later row when an earlier row on the page showed it.
        dedupe: z.boolean().default(false),
    }),
    browseFilms: z.object({
        facetGroups: z.array(KEY).max(12).default([]),
        sort: SORT.default('newestShoot'),
        pageSize: z.number().int().min(6).max(48).default(12),
    }),
    photoGallery: z.object({
        facetGroups: z.array(KEY).max(12).default([]),
        sort: SORT.default('newestShoot'),
        pageSize: z.number().int().min(6).max(60).default(24),
    }),
};

/** Which kind of row each collection-taking setting expects. */
export const ROW_KIND = {
    heroVideos: { collectionKey: 'Video' },
    ourFilms: { tabs: 'Video', defaultTab: 'Video' },
    portfolio: { tabs: 'Photo' },
    filmRows: { rows: 'Video' },
};

/**
 * Validate one block's settings. Returns { settings } (with defaults filled
 * in, `component` kept) or { error }.
 */
export function parseSectionSettings(component, settings = {}) {
    const schema = SECTION_SCHEMAS[component];
    if (!schema) return { settings };
    const { component: _c, ...rest } = settings || {};
    const r = schema.safeParse(rest);
    if (!r.success) return { error: `${component}: ${r.error.issues[0]?.path.join('.') || 'settings'} — ${r.error.issues[0]?.message}` };
    return { settings: { component, ...r.data } };
}

/** Every collection key a set of blocks refers to, with the kind it must be. */
export function collectionRefs(blocks = []) {
    const refs = [];
    for (const b of blocks) {
        if (b.type !== 'section') continue;
        const kinds = ROW_KIND[b.settings?.component];
        if (!kinds) continue;
        for (const [field, kind] of Object.entries(kinds)) {
            const v = b.settings?.[field];
            for (const key of Array.isArray(v) ? v : v ? [v] : []) refs.push({ key, kind, block: b.key || b.settings.component });
        }
    }
    return refs;
}
