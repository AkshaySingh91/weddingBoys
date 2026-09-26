/**
 * Admin API for the tag system: /api/admin/taxonomy/*.
 *
 * Every change that affects items or page rows is recorded as a TagOperation
 * and can be undone (latest change per tag first).
 *
 * Production still reads the embedded arrays (PORTFOLIO_READS unset), which
 * match films by the tag's TEXT. Renaming, merging or deleting a tag that is in
 * use would empty those rows on the live site, so those three are refused for
 * used tags until the portfolio cut-over. Creating, reordering, recolouring and
 * moving between groups are safe either way.
 */
import mongoose from 'mongoose';
import Tag from '../Models/Tag.js';
import TagGroup from '../Models/TagGroup.js';
import TagOperation from '../Models/TagOperation.js';
import PortfolioItem from '../Models/PortfolioItem.js';
import WebsiteSetting from '../Models/WebsiteSettingSchema.js';
import Collection from '../Models/Collection.js';
import {
    TaxonomyError, checkLabel, slugify, normaliseLabel, invalidateTaxonomy, loadTaxonomy,
    refreshMirrors, usageCounts, SYSTEM_GROUPS,
} from '../Services/taxonomy.js';
import { portfolioReadsEnabled } from '../Services/portfolioService.js';
import { revalidatePortfolio } from '../Services/revalidate.js';

const PAGE_LISTS = ['homepageVideosTags', 'filmsPageVideoTags', 'photoPagePhotoTags'];
const PAGE_LIST_NAMES = { homepageVideosTags: 'Home films', filmsPageVideoTags: 'Films page', photoPagePhotoTags: 'Photos page' };
const oid = (id) => new mongoose.Types.ObjectId(String(id));
const who = (req) => req.user?.email || req.admin?.email;

/** Wraps a handler: TaxonomyError → its status, anything else → 500. */
const handle = (fn) => async (req, res) => {
    try {
        return await fn(req, res);
    } catch (error) {
        if (error instanceof TaxonomyError) return res.status(error.status).json({ message: error.message, ...(error.details || {}) });
        if (error?.code === 11000) return res.status(409).json({ message: 'That name is already taken in this group' });
        console.error('taxonomy error:', error);
        return res.status(500).json({ message: error.message });
    }
};

const changed = () => { invalidateTaxonomy(); revalidatePortfolio(); };

/** Lower-cased names a tag answers to: label, slug, aliases. */
const namesOf = (tag) => new Set([tag.label.toLowerCase(), tag.slug, ...(tag.aliases || [])]);

/** Which page row lists mention the tag (by any of its names). */
async function pageListsUsing(tag) {
    const ws = await WebsiteSetting.findOne().select(PAGE_LISTS.join(' ')).lean();
    const names = namesOf(tag);
    return PAGE_LISTS.filter((l) => (ws?.[l] || []).some((s) => names.has(normaliseLabel(s).toLowerCase()) || names.has(slugify(s))));
}

/**
 * Replace every mention of `from` (a tag) in the page row lists with `toLabel`,
 * de-duplicated. Returns the lists as they were, or null if nothing changed.
 */
async function rewritePageLists(from, toLabel) {
    const ws = await WebsiteSetting.findOne().select(PAGE_LISTS.join(' '));
    if (!ws) return null;
    const names = namesOf(from);
    const before = {};
    let dirty = false;
    for (const l of PAGE_LISTS) {
        const cur = ws[l] || [];
        before[l] = [...cur];
        const next = [];
        for (const s of cur) {
            const v = names.has(normaliseLabel(s).toLowerCase()) || names.has(slugify(s)) ? toLabel : s;
            if (!next.includes(v)) next.push(v);
        }
        if (JSON.stringify(next) !== JSON.stringify(cur)) { ws[l] = next; dirty = true; }
    }
    if (!dirty) return null;
    await ws.save();
    return before;
}

async function restorePageLists(snapshot) {
    if (!snapshot) return;
    await WebsiteSetting.updateOne({}, { $set: snapshot });
}

/** Refuse a text-changing operation on a used tag while production reads by text. */
async function guardLegacy(tag, action) {
    if (portfolioReadsEnabled()) return;
    const [used, lists] = await Promise.all([PortfolioItem.countDocuments({ tagIds: tag._id }), pageListsUsing(tag)]);
    if (used || lists.length) {
        throw new TaxonomyError(409, `${action} a tag that is in use waits for the portfolio switch: the live site still finds films by the tag's name, so "${tag.label}" rows would go empty.`, { legacyReads: true, usage: used, pageLists: lists });
    }
}

async function getTag(id) {
    if (!mongoose.isValidObjectId(id)) throw new TaxonomyError(404, 'Tag not found');
    const tag = await Tag.findById(id);
    if (!tag) throw new TaxonomyError(404, 'Tag not found');
    return tag;
}
async function getGroup(id) {
    if (!mongoose.isValidObjectId(id)) throw new TaxonomyError(404, 'Group not found');
    const group = await TagGroup.findById(id);
    if (!group) throw new TaxonomyError(404, 'Group not found');
    return group;
}

/** A name (slug or alias) another tag in the group already answers to. */
async function assertFreeInGroup(groupId, label, exceptId) {
    const slug = slugify(label);
    const clash = await Tag.findOne({
        group: groupId, _id: { $ne: exceptId },
        $or: [{ slug }, { aliases: slug }, { aliases: label.toLowerCase() }],
    }).lean();
    if (clash) throw new TaxonomyError(409, `"${clash.label}" already exists in this group${clash.slug === slug ? '' : ' (as an old name)'} — merge instead`, { existing: clash._id });
    return slug;
}

/* ================================================================== read */

// GET /api/admin/taxonomy
export const getTaxonomy = handle(async (_req, res) => {
    invalidateTaxonomy();
    const [{ groups, tags }, usage, ws, rows] = await Promise.all([
        loadTaxonomy(), usageCounts(), WebsiteSetting.findOne().select(PAGE_LISTS.join(' ')).lean(),
        Collection.find({}).select('title rule.tagIds rule.excludeTagIds').lean(),
    ]);
    const pageRowsOf = (t) => {
        const names = namesOf(t);
        const lists = PAGE_LISTS.filter((l) => (ws?.[l] || []).some((s) => names.has(normaliseLabel(s).toLowerCase()) || names.has(slugify(s)))).map((l) => PAGE_LIST_NAMES[l]);
        // Rows (collections) whose rule uses the tag.
        const inRules = rows.filter((c) => [...(c.rule?.tagIds || []), ...(c.rule?.excludeTagIds || [])].some((x) => String(x) === String(t._id))).map((c) => c.title);
        return [...lists, ...inRules];
    };
    return res.status(200).json({
        legacyReads: !portfolioReadsEnabled(),
        groups: groups.map((g) => ({
            ...g,
            tags: tags.filter((t) => String(t.group) === String(g._id)).map((t) => ({
                ...t,
                usage: usage.get(String(t._id)) || { Video: 0, Photo: 0, total: 0 },
                pageRows: pageRowsOf(t),
            })),
        })),
    });
});

// GET /api/admin/taxonomy/operations
export const listOperations = handle(async (req, res) => {
    const limit = Math.min(100, parseInt(req.query.limit, 10) || 30);
    const operations = await TagOperation.find({}).sort({ createdAt: -1 }).limit(limit)
        .select('type tag summary by undoneAt undoneBy createdAt').lean();
    return res.status(200).json({ operations });
});

/* ================================================================ groups */

// POST /api/admin/taxonomy/groups { label, cardinality, appliesTo, description }
export const createGroup = handle(async (req, res) => {
    const label = checkLabel(req.body?.label);
    const key = slugify(label);
    if (await TagGroup.exists({ key })) throw new TaxonomyError(409, `A group called "${label}" already exists`);
    const appliesTo = (req.body?.appliesTo || ['Video', 'Photo']).filter((k) => ['Video', 'Photo'].includes(k));
    if (!appliesTo.length) throw new TaxonomyError(400, 'A group must apply to films, photos or both');
    const last = await TagGroup.findOne({ key: { $ne: SYSTEM_GROUPS.unsorted } }).sort({ order: -1 }).lean();
    const group = await TagGroup.create({
        key, label, appliesTo,
        cardinality: req.body?.cardinality === 'single' ? 'single' : 'multi',
        description: req.body?.description,
        order: (last?.order ?? 0) + 1,
    });
    changed();
    return res.status(201).json({ group });
});

// PATCH /api/admin/taxonomy/groups/:id { label, description, hidden, appliesTo, cardinality }
export const updateGroup = handle(async (req, res) => {
    const group = await getGroup(req.params.id);
    const { label, description, hidden, appliesTo, cardinality } = req.body || {};
    if (label !== undefined) group.label = checkLabel(label);
    if (description !== undefined) group.description = description;
    if (hidden !== undefined) group.hidden = Boolean(hidden);

    const tagIds = (await Tag.find({ group: group._id }).select('_id').lean()).map((t) => t._id);
    if (appliesTo !== undefined) {
        const next = appliesTo.filter((k) => ['Video', 'Photo'].includes(k));
        if (!next.length) throw new TaxonomyError(400, 'A group must apply to films, photos or both');
        const dropped = ['Video', 'Photo'].filter((k) => !next.includes(k));
        for (const kind of dropped) {
            const n = await PortfolioItem.countDocuments({ kind, tagIds: { $in: tagIds } });
            if (n) throw new TaxonomyError(409, `${n} ${kind === 'Video' ? 'film' : 'photo'}(s) use tags from this group`, { usage: n });
        }
        group.appliesTo = next;
    }
    if (cardinality !== undefined && cardinality !== group.cardinality) {
        if (group.system) throw new TaxonomyError(400, 'The system groups keep their rule');
        if (cardinality === 'single') {
            const [row] = await PortfolioItem.aggregate([
                { $project: { n: { $size: { $setIntersection: [{ $ifNull: ['$tagIds', []] }, tagIds] } } } },
                { $match: { n: { $gt: 1 } } }, { $count: 'items' },
            ]);
            if (row?.items) throw new TaxonomyError(409, `${row.items} item(s) carry more than one tag from this group`, { items: row.items });
        }
        group.cardinality = cardinality === 'single' ? 'single' : 'multi';
    }
    await group.save();
    changed();
    return res.status(200).json({ group });
});

// DELETE /api/admin/taxonomy/groups/:id — only an empty, non-system group
export const deleteGroup = handle(async (req, res) => {
    const group = await getGroup(req.params.id);
    if (group.system) throw new TaxonomyError(400, `${group.label} is a system group`);
    const n = await Tag.countDocuments({ group: group._id });
    if (n) throw new TaxonomyError(409, `Move, merge or delete its ${n} tag(s) first`, { tags: n });
    await group.deleteOne();
    changed();
    return res.status(200).json({ deleted: group._id });
});

// POST /api/admin/taxonomy/groups/reorder { ids }
export const reorderGroups = handle(async (req, res) => {
    const ids = req.body?.ids;
    if (!Array.isArray(ids) || !ids.every(mongoose.isValidObjectId)) throw new TaxonomyError(400, 'ids must be group ids');
    await TagGroup.bulkWrite(ids.map((id, order) => ({ updateOne: { filter: { _id: oid(id) }, update: { $set: { order } } } })));
    changed();
    return res.status(200).json({ ok: true });
});

/* ================================================================== tags */

// POST /api/admin/taxonomy/tags { group, label, color, description }
export const createTag = handle(async (req, res) => {
    const group = await getGroup(req.body?.group);
    const label = checkLabel(req.body?.label);
    const slug = await assertFreeInGroup(group._id, label);
    const last = await Tag.findOne({ group: group._id }).sort({ order: -1 }).lean();
    const tag = await Tag.create({
        group: group._id, label, slug,
        color: req.body?.color, description: req.body?.description,
        order: (last?.order ?? -1) + 1,
    });
    await TagOperation.create({ type: 'create', tag: tag._id, summary: `Created ${group.label}: ${label}`, after: tag.toObject(), by: who(req) });
    changed();
    return res.status(201).json({ tag });
});

// PATCH /api/admin/taxonomy/tags/:id { label, color, description, hidden }
export const updateTag = handle(async (req, res) => {
    const tag = await getTag(req.params.id);
    const { label, color, description, hidden } = req.body || {};
    if (color !== undefined) tag.color = color;
    if (description !== undefined) tag.description = description;
    if (hidden !== undefined) tag.hidden = Boolean(hidden);

    let op = null;
    if (label !== undefined && checkLabel(label) !== tag.label) {
        const next = checkLabel(label);
        await guardLegacy(tag, 'Renaming');
        const slug = await assertFreeInGroup(tag.group, next, tag._id);
        const before = { label: tag.label, slug: tag.slug, aliases: [...tag.aliases] };
        // The old names keep resolving: links and rows that still say them work.
        const aliases = new Set([...tag.aliases, tag.label.toLowerCase(), tag.slug]);
        aliases.delete(slug);
        aliases.delete(next.toLowerCase());
        tag.label = next;
        tag.slug = slug;
        tag.aliases = [...aliases];
        await tag.save();
        const pageLists = await rewritePageLists({ ...before, aliases: before.aliases }, next);
        await refreshMirrors({ tagIds: tag._id });
        op = await TagOperation.create({
            type: 'rename', tag: tag._id, summary: `Renamed "${before.label}" to "${next}"`,
            before, after: { label: tag.label, slug: tag.slug, aliases: tag.aliases }, pageLists, by: who(req),
        });
    } else {
        await tag.save();
    }
    changed();
    return res.status(200).json({ tag, operation: op?._id });
});

/** Can `tag` live in `group`? Kinds and one-per-item rules for its current items. */
async function assertMovable(tag, group) {
    const usage = (await usageCounts()).get(String(tag._id)) || { Video: 0, Photo: 0 };
    for (const kind of ['Video', 'Photo']) {
        if (usage[kind] && !(group.appliesTo || []).includes(kind)) {
            throw new TaxonomyError(409, `${group.label} is not for ${kind === 'Video' ? 'films' : 'photos'}, and ${usage[kind]} use this tag`);
        }
    }
    if (group.cardinality === 'single') {
        const siblings = (await Tag.find({ group: group._id, _id: { $ne: tag._id } }).select('_id').lean()).map((t) => t._id);
        const n = await PortfolioItem.countDocuments({ tagIds: { $all: [tag._id], $in: siblings } });
        if (n) throw new TaxonomyError(409, `${n} item(s) already have a ${group.label}; ${group.label} allows one per item`, { conflicts: n });
    }
    await assertFreeInGroup(group._id, tag.label, tag._id);
}

// POST /api/admin/taxonomy/tags/:id/move { group }
export const moveTag = handle(async (req, res) => {
    const tag = await getTag(req.params.id);
    const group = await getGroup(req.body?.group);
    if (String(group._id) === String(tag.group)) return res.status(200).json({ tag });
    await assertMovable(tag, group);
    const from = await TagGroup.findById(tag.group).lean();
    const before = { group: tag.group };
    tag.group = group._id;
    await tag.save();
    await refreshMirrors({ tagIds: tag._id }); // moving into or out of Ceremony changes the copies
    await TagOperation.create({ type: 'move', tag: tag._id, summary: `Moved "${tag.label}" from ${from?.label} to ${group.label}`, before, after: { group: group._id }, by: who(req) });
    changed();
    return res.status(200).json({ tag });
});

// POST /api/admin/taxonomy/tags/:id/merge { into, dryRun }
export const mergeTag = handle(async (req, res) => {
    const source = await getTag(req.params.id);
    const target = await getTag(req.body?.into);
    if (String(source._id) === String(target._id)) throw new TaxonomyError(400, 'Choose a different tag to merge into');
    if (String(source.group) !== String(target.group)) throw new TaxonomyError(400, 'Merge within one group; move the tag first');

    const [items, hadTarget, lists] = await Promise.all([
        PortfolioItem.find({ tagIds: source._id }).select('_id').lean(),
        PortfolioItem.find({ tagIds: { $all: [source._id, target._id] } }).select('_id').lean(),
        pageListsUsing(source),
    ]);
    if (req.body?.dryRun) {
        return res.status(200).json({
            dryRun: true,
            summary: `"${source.label}" → "${target.label}"`,
            items: items.length, alreadyHadTarget: hadTarget.length,
            pageRows: lists.map((l) => PAGE_LIST_NAMES[l]),
        });
    }
    await guardLegacy(source, 'Merging');

    const itemIds = items.map((i) => i._id);
    const hadIds = hadTarget.map((i) => i._id);
    const hadSet = new Set(hadIds.map(String));
    const swap = itemIds.filter((id) => !hadSet.has(String(id)));
    if (swap.length) {
        await PortfolioItem.updateMany({ _id: { $in: swap } }, { $set: { 'tagIds.$[s]': target._id } }, { arrayFilters: [{ s: source._id }] });
    }
    if (hadIds.length) await PortfolioItem.updateMany({ _id: { $in: hadIds } }, { $pull: { tagIds: source._id } });

    const beforeTarget = { aliases: [...target.aliases] };
    const aliases = new Set([...target.aliases, source.label.toLowerCase(), source.slug, ...source.aliases]);
    aliases.delete(target.slug);
    aliases.delete(target.label.toLowerCase());
    target.aliases = [...aliases];
    await target.save();
    const pageLists = await rewritePageLists(source, target.label);
    // Rows built on the source tag now use the target (their rules as they were
    // are kept on the operation, for undo).
    const rows = await Collection.find({ $or: [{ 'rule.tagIds': source._id }, { 'rule.excludeTagIds': source._id }] });
    const rowsBefore = rows.map((c) => ({ _id: c._id, tagIds: [...c.rule.tagIds], excludeTagIds: [...c.rule.excludeTagIds] }));
    const swapIn = (list) => [...new Set(list.map((x) => (String(x) === String(source._id) ? String(target._id) : String(x))))];
    for (const c of rows) {
        c.rule.tagIds = swapIn(c.rule.tagIds);
        c.rule.excludeTagIds = swapIn(c.rule.excludeTagIds);
        await c.save();
    }
    const sourceDoc = source.toObject();
    await source.deleteOne();
    await refreshMirrors({ _id: { $in: itemIds } });

    const op = await TagOperation.create({
        type: 'merge', tag: target._id, summary: `Merged "${sourceDoc.label}" into "${target.label}" (${itemIds.length} item(s))`,
        before: { source: sourceDoc, targetAliases: beforeTarget.aliases, rows: rowsBefore }, after: { target: target._id },
        items: itemIds, itemsHadTarget: hadIds, pageLists, by: who(req),
    });
    changed();
    return res.status(200).json({ tag: target, items: itemIds.length, operation: op._id });
});

// DELETE /api/admin/taxonomy/tags/:id — only when nothing uses it
export const deleteTag = handle(async (req, res) => {
    const tag = await getTag(req.params.id);
    const [used, lists] = await Promise.all([PortfolioItem.countDocuments({ tagIds: tag._id }), pageListsUsing(tag)]);
    if (used) throw new TaxonomyError(409, `${used} item(s) use "${tag.label}". Merge it into another tag instead.`, { usage: used });
    if (lists.length) throw new TaxonomyError(409, `"${tag.label}" is a row on: ${lists.map((l) => PAGE_LIST_NAMES[l]).join(', ')}. Remove the row first.`, { pageRows: lists });
    const rules = await Collection.find({ $or: [{ 'rule.tagIds': tag._id }, { 'rule.excludeTagIds': tag._id }] }).select('title').lean();
    if (rules.length) throw new TaxonomyError(409, `"${tag.label}" is in the rule of: ${rules.map((r) => r.title).join(', ')}. Change those rows first.`, { collections: rules.map((r) => r.title) });
    const before = tag.toObject();
    await tag.deleteOne();
    await TagOperation.create({ type: 'delete', tag: tag._id, summary: `Deleted "${before.label}"`, before, by: who(req) });
    changed();
    return res.status(200).json({ deleted: tag._id });
});

// POST /api/admin/taxonomy/tags/reorder { group, ids }
export const reorderTags = handle(async (req, res) => {
    const group = await getGroup(req.body?.group);
    const ids = req.body?.ids;
    if (!Array.isArray(ids) || !ids.every(mongoose.isValidObjectId)) throw new TaxonomyError(400, 'ids must be tag ids');
    await Tag.bulkWrite(ids.map((id, order) => ({ updateOne: { filter: { _id: oid(id), group: group._id }, update: { $set: { order } } } })));
    changed();
    return res.status(200).json({ ok: true });
});

/* ================================================================== undo */

// POST /api/admin/taxonomy/operations/:id/undo
export const undoOperation = handle(async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.id)) throw new TaxonomyError(404, 'Change not found');
    const op = await TagOperation.findById(req.params.id);
    if (!op) throw new TaxonomyError(404, 'Change not found');
    if (op.undoneAt) throw new TaxonomyError(409, 'Already undone');

    // Undo newest first: a later change to the same tag depends on this one.
    const tagIdsInvolved = [op.tag, op.before?.source?._id].filter(Boolean);
    const later = await TagOperation.findOne({
        _id: { $ne: op._id }, createdAt: { $gt: op.createdAt }, undoneAt: null,
        $or: [{ tag: { $in: tagIdsInvolved } }, { 'before.source._id': { $in: tagIdsInvolved } }],
    }).lean();
    if (later) throw new TaxonomyError(409, `Undo the later change first: ${later.summary}`);

    if (op.type === 'create') {
        const n = await PortfolioItem.countDocuments({ tagIds: op.tag });
        if (n) throw new TaxonomyError(409, `${n} item(s) now use this tag`);
        await Tag.deleteOne({ _id: op.tag });
    } else if (op.type === 'rename') {
        const tag = await getTag(op.tag);
        await assertFreeInGroup(tag.group, op.before.label, tag._id);
        const current = { label: tag.label, slug: tag.slug, aliases: tag.aliases };
        Object.assign(tag, op.before);
        await tag.save();
        // Rewrite rather than restore the snapshot, so row edits made since survive.
        await rewritePageLists(current, op.before.label);
        await refreshMirrors({ tagIds: tag._id });
    } else if (op.type === 'delete') {
        await Tag.collection.insertOne(op.before);
    } else if (op.type === 'move') {
        const tag = await getTag(op.tag);
        const group = await getGroup(op.before.group);
        await assertMovable(tag, group);
        tag.group = group._id;
        await tag.save();
        await refreshMirrors({ tagIds: tag._id });
    } else if (op.type === 'merge') {
        const source = op.before.source;
        await Tag.collection.insertOne(source);
        const had = new Set((op.itemsHadTarget || []).map(String));
        const swapBack = (op.items || []).filter((id) => !had.has(String(id)));
        if (swapBack.length) {
            await PortfolioItem.updateMany({ _id: { $in: swapBack } }, { $set: { 'tagIds.$[t]': source._id } }, { arrayFilters: [{ t: op.tag }] });
        }
        if (had.size) await PortfolioItem.updateMany({ _id: { $in: op.itemsHadTarget } }, { $addToSet: { tagIds: source._id } });
        await Tag.updateOne({ _id: op.tag }, { $set: { aliases: op.before.targetAliases || [] } });
        if (op.pageLists) await restorePageLists(op.pageLists);
        for (const r of op.before.rows || []) {
            await Collection.updateOne({ _id: r._id }, { $set: { 'rule.tagIds': r.tagIds, 'rule.excludeTagIds': r.excludeTagIds } });
        }
        await refreshMirrors({ _id: { $in: op.items || [] } });
    }

    op.undoneAt = new Date();
    op.undoneBy = who(req);
    await op.save();
    changed();
    return res.status(200).json({ undone: op._id, summary: op.summary });
});
