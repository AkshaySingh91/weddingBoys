'use client';

import { useCallback, useRef, useState } from 'react';
import { fireMessage } from '@/Utils/fireMessage.js';

const api_url = process.env.NEXT_PUBLIC_API_URL;

/**
 * Data layer for the Portfolio curation screen.
 *
 * PortfolioItem is the editorial layer: what a piece of media *means* and where
 * it appears. Media is the asset layer: bytes, variants, renditions. This hook
 * only ever touches the former — deleting a placement never deletes the file.
 *
 * Curation used to be per-client: to change what /films showed you opened each
 * client and edited each video. Every call here is cross-client by design.
 */
export default function usePortfolio() {
    const [items, setItems] = useState([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(false);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const requestId = useRef(0);

    const request = useCallback(async (path, options = {}) => {
        const res = await fetch(`${api_url}${path}`, { credentials: 'include', ...options });
        const data = await res.json().catch(() => ({}));
        if (res.status >= 300) {
            const err = new Error(data.message || `Request failed (${res.status})`);
            err.status = res.status;
            err.data = data;
            throw err;
        }
        return data;
    }, []);

    /** reset=true replaces the grid (filter change); false appends (load more). */
    const fetchItems = useCallback(async (filters = {}, { reset = true, pageNum = 1, limit = 48 } = {}) => {
        const rid = ++requestId.current;
        setLoading(true);
        try {
            const params = new URLSearchParams({ page: String(pageNum), limit: String(limit) });
            for (const [k, v] of Object.entries(filters)) {
                if (v !== '' && v !== null && v !== undefined && v !== false) params.set(k, String(v));
            }
            const data = await request(`/api/admin/portfolio?${params.toString()}`);
            // Filters change faster than the network answers; drop stale pages.
            if (rid !== requestId.current) return;
            setItems((prev) => (reset ? data.items : [...prev, ...data.items]));
            setTotal(data.total ?? 0);
            setPage(data.page ?? pageNum);
            setHasMore(Boolean(data.hasMore));
        } catch (err) {
            if (rid === requestId.current) fireMessage(err.message, 'error');
        } finally {
            if (rid === requestId.current) setLoading(false);
        }
    }, [request]);

    /** Patch one item and splice the server's copy back into the grid. */
    const updateItem = useCallback(async (id, patch) => {
        setSaving(true);
        try {
            const { item } = await request(`/api/admin/portfolio/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(patch),
            });
            setItems((prev) => prev.map((i) => (i._id === id ? { ...i, ...item } : i)));
            fireMessage('Saved', 'success');
            return item;
        } catch (err) {
            fireMessage(err.message, 'error');
            return null;
        } finally {
            setSaving(false);
        }
    }, [request]);

    /**
     * Bulk edit. `body` is { ids, set?, tags?: {add,remove,replace}, shiftPriority? }.
     * The server caps this at 500 ids and refuses a filter-wide write whose
     * expectedCount does not match, so a mistyped filter cannot rewrite the set.
     */
    const bulkUpdate = useCallback(async (body) => {
        setSaving(true);
        try {
            const data = await request('/api/admin/portfolio/bulk', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });
            // Say what visitors will see, not how many rows changed: "live" is
            // what passes the public gate, "waiting" is meant to be live but held
            // by the wedding being a draft or a file still processing.
            const waiting = data.waiting ? ` · ${data.waiting} waiting (draft wedding or processing)` : '';
            fireMessage(`Updated ${data.modified} of ${data.matched} · ${data.nowPublic ?? 0} live${waiting}`, 'success');
            // A tag that does not fit some items (e.g. a film type on photos) skips them.
            if (data.tagFailures?.length) fireMessage(`${data.tagFailures.length} item(s) skipped: ${data.tagFailures[0].message}`, 'error');
            return data;
        } catch (err) {
            fireMessage(err.message, 'error');
            return null;
        } finally {
            setSaving(false);
        }
    }, [request]);

    /**
     * Replace the entire hero set, in order. Whole-set replacement is the point:
     * the old per-client append is what let editing one client wipe the carousel.
     */
    const saveHeroSet = useCallback(async (ids) => {
        setSaving(true);
        try {
            const data = await request('/api/admin/portfolio/hero', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ids }),
            });
            fireMessage(`Hero carousel set to ${data.heroCount} film${data.heroCount === 1 ? '' : 's'}`, 'success');
            return data;
        } catch (err) {
            fireMessage(err.message, 'error');
            return null;
        } finally {
            setSaving(false);
        }
    }, [request]);

    /**
     * The hero carousel: the current ordered set, plus every published film that
     * could join it. One place, so the homepage screen does not re-implement
     * these queries.
     */
    const [heroSet, setHeroSet] = useState([]);
    const [heroCandidates, setHeroCandidates] = useState([]);
    const [heroLoading, setHeroLoading] = useState(true);

    const fetchHeroSet = useCallback(async () => {
        setHeroLoading(true);
        try {
            const [current, all] = await Promise.all([
                request('/api/admin/portfolio?kind=Video&isHero=true&limit=60&sort=priority'),
                request('/api/admin/portfolio?kind=Video&status=Published&limit=200&sort=priority'),
            ]);
            setHeroSet(current.items || []);
            setHeroCandidates(all.items || []);
        } catch (err) {
            fireMessage(err.message, 'error');
        } finally {
            setHeroLoading(false);
        }
    }, [request]);

    /** Assign a library asset to a client — the door that did not exist before. */
    const assignMedia = useCallback(async (payload) => {
        try {
            const { item } = await request('/api/admin/portfolio', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            return { item };
        } catch (err) {
            // 409 means the asset already has a placement; the caller reports it
            // per-file rather than failing the whole batch.
            return { error: err.message, status: err.status };
        }
    }, [request]);

    /** Removes the placement. `releaseMedia` unlinks ownership, `purgeMedia` purges R2 bytes and DB doc. */
    const removeItem = useCallback(async (id, { releaseMedia = false, purgeMedia = false } = {}) => {
        setSaving(true);
        try {
            const params = new URLSearchParams();
            if (releaseMedia) params.set('releaseMedia', 'true');
            if (purgeMedia) params.set('purgeMedia', 'true');
            await request(`/api/admin/portfolio/${id}?${params.toString()}`, { method: 'DELETE' });
            setItems((prev) => prev.filter((i) => i._id !== id));
            setTotal((t) => Math.max(0, t - 1));
            fireMessage(purgeMedia ? 'Permanently purged from R2' : 'Removed from portfolio', 'success');
            return true;
        } catch (err) {
            fireMessage(err.message, 'error');
            return false;
        } finally {
            setSaving(false);
        }
    }, [request]);

    return {
        items, total, page, hasMore, loading, saving,
        fetchItems, updateItem, bulkUpdate, saveHeroSet, assignMedia, removeItem,
        setItems,
        heroSet, heroCandidates, heroLoading, fetchHeroSet, setHeroSet,
    };
}
