/**
 * The tag system (plan phase 3): groups of tags, items that store tag ids.
 *
 * Replaces three unrelated loose-string systems — the `Tags` categories, the
 * `Ceremony` list (which drove nothing public), and the hardcoded lists in the
 * upload modals. Items carry `tagIds`; their `tags` / `eventGroup` strings are
 * label copies this module writes, so nothing reads a label that can drift.
 *
 *   validateTagIds    exist, apply to the item's kind, ≤ 1 per single group
 *   tagFieldsFor      { tagIds, tags, eventGroup } for an item write
 *   resolveTagParam   "haldi", "Pre-Wedding", "cassic" → tag ids, via label,
 *                     slug or alias, case-insensitively
 *   refreshMirrors    rewrite the label copies after a rename or merge
 */
import mongoose from 'mongoose';
import Tag from '../Models/Tag.js';
import TagGroup from '../Models/TagGroup.js';
import PortfolioItem from '../Models/PortfolioItem.js';

export const SYSTEM_GROUPS = Object.freeze({ ceremony: 'ceremony', filmType: 'film-type', unsorted: 'unsorted' });

export class TaxonomyError extends Error {
    constructor(status, message, details) {
        super(message);
        this.status = status;
        this.details = details;
    }
}

/** Trim, collapse spaces, drop a leading '#'. */
export const normaliseLabel = (s) => String(s ?? '').trim().replace(/^#+/, '').replace(/\s+/g, ' ').trim();

export const slugify = (s) => normaliseLabel(s).toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

/**
 * A label an admin may create. Commas are refused: the public `?tag=` parameter
 * is comma-separated, so "Haldi, Mehendi" could never be linked to.
 */
export function checkLabel(raw) {
    const label = normaliseLabel(raw);
    if (!label) throw new TaxonomyError(400, 'A tag needs a name');
    if (label.includes(',')) throw new TaxonomyError(400, 'Tag names cannot contain commas');
    if (label.length > 60) throw new TaxonomyError(400, 'Tag names are at most 60 characters');
    if (!slugify(label)) throw new TaxonomyError(400, 'A tag name needs at least one letter or digit');
    return label;
}

/* ------------------------------------------------------------------ cache */
// The taxonomy is a few dozen documents read on every public tag filter.
// Writers call invalidateTaxonomy(); other processes see changes within TTL.
const TTL_MS = 10_000;
let cached = null;
let cachedAt = 0;

export function invalidateTaxonomy() { cached = null; }

export async function loadTaxonomy() {
    if (cached && Date.now() - cachedAt < TTL_MS) return cached;
    const [groups, tags] = await Promise.all([
        TagGroup.find({}).sort({ order: 1, label: 1 }).lean(),
        Tag.find({}).sort({ order: 1, label: 1 }).lean(),
    ]);
    const groupById = new Map(groups.map((g) => [String(g._id), g]));
    const groupByKey = new Map(groups.map((g) => [g.key, g]));
    const tagById = new Map(tags.map((t) => [String(t._id), t]));
    cached = { groups, tags, groupById, groupByKey, tagById };
    cachedAt = Date.now();
    return cached;
}

export const taxonomyExists = async () => (await TagGroup.estimatedDocumentCount()) > 0;

/* -------------------------------------------------------------- validation */

/**
 * Checks tag ids for an item of `kind`. Returns them de-duplicated as
 * ObjectIds; throws TaxonomyError(400) listing exactly what is wrong.
 */
export async function validateTagIds(ids, kind) {
    if (!Array.isArray(ids)) throw new TaxonomyError(400, 'tagIds must be an array');
    const unique = [...new Set(ids.map(String))];
    const invalid = unique.filter((id) => !mongoose.isValidObjectId(id));
    if (invalid.length) throw new TaxonomyError(400, 'Invalid tag id', { invalid });

    const tax = await loadTaxonomy();
    const unknown = unique.filter((id) => !tax.tagById.has(id));
    // A tag created a moment ago in another process may not be cached yet.
    if (unknown.length) {
        invalidateTaxonomy();
        const fresh = await loadTaxonomy();
        const stillUnknown = unknown.filter((id) => !fresh.tagById.has(id));
        if (stillUnknown.length) throw new TaxonomyError(400, 'Unknown tag', { unknown: stillUnknown });
    }
    const t = await loadTaxonomy();

    const wrongKind = [];
    const perSingleGroup = new Map();
    for (const id of unique) {
        const tag = t.tagById.get(id);
        const group = t.groupById.get(String(tag.group));
        if (kind && group && !(group.appliesTo || []).includes(kind)) wrongKind.push(`${tag.label} (${group.label} is not for ${kind === 'Video' ? 'films' : 'photos'})`);
        if (group?.cardinality === 'single') {
            const list = perSingleGroup.get(group.label) || [];
            list.push(tag.label);
            perSingleGroup.set(group.label, list);
        }
    }
    if (wrongKind.length) throw new TaxonomyError(400, `Not allowed on this item: ${wrongKind.join(', ')}`, { wrongKind });
    const conflicts = [...perSingleGroup.entries()].filter(([, l]) => l.length > 1).map(([group, tags]) => ({ group, tags }));
    if (conflicts.length) {
        throw new TaxonomyError(400, conflicts.map((c) => `Only one ${c.group} per item (got ${c.tags.join(', ')})`).join('; '), { conflicts });
    }
    return unique.map((id) => new mongoose.Types.ObjectId(id));
}

/** The label copies for a set of tag ids (see PortfolioItem.tags / eventGroup). */
export function mirrorsFor(tagIds, tax) {
    const tags = [];
    let eventGroup = '';
    for (const id of tagIds || []) {
        const tag = tax.tagById.get(String(id));
        if (!tag) continue;
        const group = tax.groupById.get(String(tag.group));
        if (group?.key === SYSTEM_GROUPS.ceremony) eventGroup = tag.label;
        else tags.push(tag.label);
    }
    return { tags, eventGroup };
}

/** Validated `{ tagIds, tags, eventGroup }` to `$set` on an item of `kind`. */
export async function tagFieldsFor(ids, kind) {
    const tagIds = await validateTagIds(ids, kind);
    return { tagIds, ...mirrorsFor(tagIds, await loadTaxonomy()) };
}

/* -------------------------------------------------------------- resolution */

/**
 * Public `?tag=` values (labels, slugs or old names) → tag ids. One value can
 * match several tags (Haldi is both a Category tag and a Ceremony); all count.
 * An unknown value matches nothing, which is what the string match did too.
 */
export async function resolveTagParam(values) {
    const wanted = (values || []).map(normaliseLabel).filter(Boolean);
    if (!wanted.length) return [];
    const { tags } = await loadTaxonomy();
    const keys = new Set(wanted.flatMap((v) => [v.toLowerCase(), slugify(v)]));
    return tags
        .filter((t) => keys.has(t.label.toLowerCase()) || keys.has(t.slug) || (t.aliases || []).some((a) => keys.has(a)))
        .map((t) => t._id);
}

/* ----------------------------------------------------------------- writers */

/** Rewrite `tags` / `eventGroup` from `tagIds` on every item matching `filter`. */
export async function refreshMirrors(filter) {
    invalidateTaxonomy();
    const tax = await loadTaxonomy();
    const items = await PortfolioItem.find(filter).select('tagIds tags eventGroup').lean();
    const ops = [];
    for (const i of items) {
        const m = mirrorsFor(i.tagIds, tax);
        if (JSON.stringify(m.tags) === JSON.stringify(i.tags || []) && m.eventGroup === (i.eventGroup || '')) continue;
        ops.push({ updateOne: { filter: { _id: i._id }, update: { $set: m }, timestamps: false } });
    }
    if (ops.length) await PortfolioItem.bulkWrite(ops, { ordered: false });
    return ops.length;
}

/** Items per tag, split by kind: Map(tagId → { Video, Photo, total }). */
export async function usageCounts() {
    const rows = await PortfolioItem.aggregate([
        { $unwind: '$tagIds' },
        { $group: { _id: { tag: '$tagIds', kind: '$kind' }, n: { $sum: 1 } } },
    ]);
    const out = new Map();
    for (const r of rows) {
        const key = String(r._id.tag);
        const entry = out.get(key) || { Video: 0, Photo: 0, total: 0 };
        entry[r._id.kind] = r.n;
        entry.total += r.n;
        out.set(key, entry);
    }
    return out;
}

/* ------------------------------------------------------------ public reads */

/** GET /api/tags: every visible group with its visible tags, in admin order. */
export async function publicTaxonomy() {
    const { groups, tags } = await loadTaxonomy();
    return groups.filter((g) => !g.hidden).map((g) => ({
        _id: g._id, key: g.key, label: g.label, cardinality: g.cardinality, appliesTo: g.appliesTo,
        tags: tags.filter((t) => String(t.group) === String(g._id) && !t.hidden)
            .map((t) => ({ _id: t._id, label: t.label, slug: t.slug, color: t.color })),
    }));
}

/**
 * The old `/api/get-all-tags` shape — `[{ _id, tagType, tags: [label] }]` —
 * built from the groups that came from the old categories, so the /allfilms
 * filters and the admin row pickers see the same list (renames included).
 */
export async function legacyTagCategories() {
    const { groups, tags } = await loadTaxonomy();
    return groups.filter((g) => g.legacyTagType && !g.hidden).map((g) => ({
        _id: g._id,
        tagType: g.label,
        tags: tags.filter((t) => String(t.group) === String(g._id) && !t.hidden).map((t) => t.label),
    }));
}

/** The old `/api/ceremonies` shape, from the Ceremony group. */
export async function legacyCeremonies() {
    const { groupByKey, tags } = await loadTaxonomy();
    const g = groupByKey.get(SYSTEM_GROUPS.ceremony);
    if (!g) return [];
    return tags.filter((t) => String(t.group) === String(g._id) && !t.hidden).map((t) => ({
        _id: t._id, name: t.label, slug: t.slug, order: t.order, color: t.color, isActive: true, description: t.description,
    }));
}

/**
 * Old item tag strings (the embedded Client arrays) → tag ids, for the
 * backfill. A string resolves to the category tag of that name first — the
 * same word can also be a Ceremony ("Haldi"), but in `tags` it was always a
 * category. Returns the ids and the strings that matched nothing.
 */
export function idsForLegacyStrings(strings, tax) {
    const ids = [];
    const unresolved = [];
    const rank = (t) => {
        const g = tax.groupById.get(String(t.group));
        return (g?.legacyTagType ? 0 : g?.key === SYSTEM_GROUPS.unsorted ? 1 : 2) * 1000 + (g?.order ?? 0);
    };
    for (const raw of strings || []) {
        const s = normaliseLabel(raw);
        if (!s) continue;
        const names = new Set([s.toLowerCase(), slugify(s)]);
        const hit = tax.tags
            .filter((t) => names.has(t.label.toLowerCase()) || names.has(t.slug) || (t.aliases || []).some((a) => names.has(a)))
            .sort((a, b) => rank(a) - rank(b))[0];
        if (!hit) unresolved.push(s);
        else if (!ids.some((x) => String(x) === String(hit._id))) ids.push(hit._id);
    }
    return { ids, unresolved };
}
