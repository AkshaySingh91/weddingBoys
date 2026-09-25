'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

const api_url = process.env.NEXT_PUBLIC_API_URL;

/**
 * The tag system for admin screens (Backend/Services/taxonomy.js).
 *
 * Items are tagged with tag ids; screens show labels. This hook loads groups
 * and tags once and gives the lookups every picker needs, plus the manager's
 * operations. Each call returns `{ ok, data, message, status }` and never
 * throws, so a screen decides how to report a refusal (a 409 from a rename is
 * an answer, not a crash).
 */
async function request(path, { method = 'GET', body } = {}) {
    try {
        const res = await fetch(`${api_url}${path}`, {
            method,
            credentials: 'include',
            headers: body ? { 'Content-Type': 'application/json' } : undefined,
            body: body ? JSON.stringify(body) : undefined,
        });
        const data = await res.json().catch(() => ({}));
        return { ok: res.ok, status: res.status, data, message: data.message };
    } catch (err) {
        return { ok: false, status: 0, data: {}, message: err.message };
    }
}

export default function useTaxonomy() {
    const [groups, setGroups] = useState([]);
    const [legacyReads, setLegacyReads] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const reload = useCallback(async () => {
        const r = await request('/api/admin/taxonomy');
        if (r.ok) {
            setGroups(r.data.groups || []);
            setLegacyReads(Boolean(r.data.legacyReads));
            setError(null);
        } else {
            setError(r.message || 'Could not load tags');
        }
        setLoading(false);
        return r;
    }, []);

    useEffect(() => {
        let cancelled = false;
        request('/api/admin/taxonomy').then((r) => {
            if (cancelled) return;
            if (r.ok) {
                setGroups(r.data.groups || []);
                setLegacyReads(Boolean(r.data.legacyReads));
            } else {
                setError(r.message || 'Could not load tags');
            }
            setLoading(false);
        });
        return () => { cancelled = true; };
    }, []);

    const lookups = useMemo(() => {
        const tagById = new Map();
        const groupById = new Map();
        const groupByKey = new Map();
        for (const g of groups) {
            groupById.set(g._id, g);
            groupByKey.set(g.key, g);
            for (const t of g.tags || []) tagById.set(t._id, { ...t, groupKey: g.key, groupLabel: g.label });
        }
        return { tagById, groupById, groupByKey };
    }, [groups]);

    /** Groups a film or photo can use, in admin order; hidden groups only if asked. */
    const groupsFor = useCallback((kind, { includeHidden = false } = {}) => groups.filter((g) =>
        (!kind || (g.appliesTo || []).includes(kind)) && (includeHidden || !g.hidden)), [groups]);

    /** A tag's id from its label in a group ("ceremony", "Haldi"), matching old names too. */
    const idFor = useCallback((groupKey, label) => {
        const g = lookups.groupByKey.get(groupKey);
        const want = String(label || '').trim().toLowerCase();
        if (!g || !want) return null;
        return (g.tags || []).find((t) => t.label.toLowerCase() === want || t.slug === want || (t.aliases || []).includes(want))?._id || null;
    }, [lookups]);

    const labelOf = useCallback((id) => lookups.tagById.get(String(id))?.label || null, [lookups]);

    /** Create a tag and add it to the local state; returns the tag or null (message reported by caller). */
    const createTag = useCallback(async (groupId, label, extra = {}) => {
        const r = await request('/api/admin/taxonomy/tags', { method: 'POST', body: { group: groupId, label, ...extra } });
        if (r.ok) {
            const tag = { ...r.data.tag, usage: { Video: 0, Photo: 0, total: 0 }, pageRows: [] };
            setGroups((prev) => prev.map((g) => (g._id === groupId ? { ...g, tags: [...(g.tags || []), tag] } : g)));
            return { ...r, tag };
        }
        return r;
    }, []);

    /**
     * Label-based screens (the upload modals keep their own UX): turn
     * `{ ceremony, filmType, tags: [labels] }` into tag ids, creating what does
     * not exist yet — a typed ceremony in Ceremony, a typed tag in Unsorted,
     * where the tag manager can file it later.
     */
    const idsFromLabels = useCallback(async (kind, { ceremony, filmType, tags = [] }) => {
        const ids = [];
        const failures = [];
        const want = async (groupKey, label) => {
            if (!label) return;
            let id = idFor(groupKey, label);
            if (!id && groupKey !== 'film-type') {
                // A free-text tag may already exist in any group the item can use.
                for (const g of groupsFor(kind, { includeHidden: true })) {
                    if (groupKey === 'ceremony' && g.key !== 'ceremony') continue;
                    const hit = idFor(g.key, label);
                    if (hit) { id = hit; break; }
                }
            }
            if (!id) {
                const target = lookups.groupByKey.get(groupKey === 'tags' ? 'unsorted' : groupKey);
                if (!target) { failures.push(label); return; }
                const r = await createTag(target._id, label);
                // Another upload in the same batch may have just created it.
                if (r.status === 409 && r.data.existing) id = r.data.existing;
                else if (!r.ok) { failures.push(`${label}: ${r.message}`); return; }
                else id = r.tag._id;
            }
            if (!ids.includes(id)) ids.push(id);
        };
        await want('ceremony', ceremony);
        if (kind === 'Video') await want('film-type', filmType);
        for (const t of tags) await want('tags', t);
        return { ids, failures };
    }, [idFor, groupsFor, lookups, createTag]);

    /* -------- manager operations: each reloads so usage and rows stay exact */
    const run = useCallback(async (path, method, body) => {
        const r = await request(path, { method, body });
        if (r.ok && !body?.dryRun) await reload();
        return r;
    }, [reload]);

    return {
        groups, legacyReads, loading, error, reload,
        ...lookups, groupsFor, idFor, labelOf, createTag, idsFromLabels,
        createGroup: (body) => run('/api/admin/taxonomy/groups', 'POST', body),
        updateGroup: (id, body) => run(`/api/admin/taxonomy/groups/${id}`, 'PATCH', body),
        deleteGroup: (id) => run(`/api/admin/taxonomy/groups/${id}`, 'DELETE'),
        reorderGroups: (ids) => run('/api/admin/taxonomy/groups/reorder', 'POST', { ids }),
        updateTag: (id, body) => run(`/api/admin/taxonomy/tags/${id}`, 'PATCH', body),
        moveTag: (id, group) => run(`/api/admin/taxonomy/tags/${id}/move`, 'POST', { group }),
        mergeTag: (id, into, dryRun = false) => run(`/api/admin/taxonomy/tags/${id}/merge`, 'POST', { into, dryRun }),
        deleteTag: (id) => run(`/api/admin/taxonomy/tags/${id}`, 'DELETE'),
        reorderTags: (group, ids) => run('/api/admin/taxonomy/tags/reorder', 'POST', { group, ids }),
        listOperations: () => request('/api/admin/taxonomy/operations?limit=20'),
        undo: (opId) => run(`/api/admin/taxonomy/operations/${opId}/undo`, 'POST', {}),
    };
}
