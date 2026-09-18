'use client';

import { useCallback, useRef, useState } from 'react';
import { createUpload } from '@/lib/upload/multipartUploader.js';
import { fireMessage } from '@/Utils/fireMessage.js';

const api_url = process.env.NEXT_PUBLIC_API_URL;

// Shared media-library data layer: paginated listing + resumable upload.
//
// Everything — image, document or a 200 MB film — goes browser→R2 direct through
// the multipart uploader. The bytes never touch Node, and derivatives (image
// ladder, poster, web/loop renditions) are built afterwards by the ffmpeg worker,
// which is why a finished upload can come back as `status: 'Processing'`.
export default function useMediaLibrary({ ownerType = 'System' } = {}) {
    const [items, setItems] = useState([]);
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(null);
    const [hasMore, setHasMore] = useState(false);
    const [loading, setLoading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState({});
    const [stats, setStats] = useState(null);
    const [selectedIds, setSelectedIds] = useState([]);
    const requestId = useRef(0);

    /**
     * Counts and stored bytes per purpose, for the library's navigation.
     * Bytes include every derivative, so the figure matches the bucket rather
     * than just the sum of the masters.
     */
    const fetchStats = useCallback(async () => {
        try {
            const res = await fetch(`${api_url}/api/admin/media/stats`, { credentials: 'include' });
            if (res.ok) setStats(await res.json());
        } catch {
            // Counts are a convenience — the grid works without them.
        }
    }, []);

    // Fetch a page of media. reset=true replaces the grid (new search/filter);
    // reset=false appends (infinite scroll).
    const fetchMedia = useCallback(async ({
        search = '',
        mediaType = '',
        ownerType: ownerFilter = '',
        ownerId = '',
        sortBy = 'newest',
        orientation = '',
        featured = '',
        visibility = '',
        tag = '',
        pageNum = 1,
        reset = true,
        limit = 24,
    } = {}) => {
        const rid = ++requestId.current;
        setLoading(true);
        try {
            const params = new URLSearchParams({ page: String(pageNum), limit: String(limit) });
            if (search) params.set('search', search);
            if (mediaType) params.set('mediaType', mediaType);
            if (ownerFilter) params.set('ownerType', ownerFilter);
            if (ownerId) params.set('ownerId', ownerId);
            if (sortBy && sortBy !== 'newest') params.set('sortBy', sortBy);
            if (orientation) params.set('orientation', orientation);
            if (featured) params.set('featured', featured);
            if (visibility) params.set('visibility', visibility);
            if (tag) params.set('tag', tag);

            const res = await fetch(`${api_url}/api/admin/media?${params.toString()}`, {
                method: 'GET',
                credentials: 'include',
            });
            const data = await res.json();
            if (res.status >= 300) {
                fireMessage(data.message || 'Failed to load media', 'error');
                return;
            }
            // Ignore stale responses that arrived out of order.
            if (rid !== requestId.current) return;

            setItems((prev) => (reset ? data.items : [...prev, ...data.items]));
            setPage(data.page);
            setTotal(data.total ?? null);
            setHasMore(data.hasMore);
        } catch (err) {
            fireMessage(err.message, 'error');
        } finally {
            if (rid === requestId.current) setLoading(false);
        }
    }, []);

    /**
     * Selection Management
     */
    const toggleSelect = useCallback((id) => {
        setSelectedIds((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));
    }, []);

    const selectOnly = useCallback((id) => {
        setSelectedIds([id]);
    }, []);

    const selectAll = useCallback(() => {
        setSelectedIds(items.map((m) => m._id));
    }, [items]);

    const clearSelection = useCallback(() => {
        setSelectedIds([]);
    }, []);

    const isSelected = useCallback((id) => selectedIds.includes(id), [selectedIds]);

    /**
     * Batch Operations
     */
    const batchDeleteMedia = useCallback(async (ids) => {
        if (!ids || !ids.length) return false;
        try {
            const res = await fetch(`${api_url}/api/admin/media/batch-delete`, {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ids }),
            });
            const data = await res.json();
            if (res.status >= 300) throw new Error(data.message || 'Batch delete failed');

            const idSet = new Set(ids);
            setItems((prev) => prev.filter((m) => !idSet.has(m._id)));
            setSelectedIds((prev) => prev.filter((id) => !idSet.has(id)));
            fireMessage(`${ids.length} assets deleted`, 'success');
            fetchStats();
            return true;
        } catch (err) {
            fireMessage(err.message, 'error');
            return false;
        }
    }, [fetchStats]);

    const batchUpdateMedia = useCallback(async (ids, patch) => {
        if (!ids || !ids.length || !patch) return false;
        try {
            const res = await fetch(`${api_url}/api/admin/media/batch-update`, {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ids, patch }),
            });
            const data = await res.json();
            if (res.status >= 300) throw new Error(data.message || 'Batch update failed');

            const idSet = new Set(ids);
            setItems((prev) => prev.map((m) => {
                if (!idSet.has(m._id)) return m;
                const updated = { ...m };
                if (patch.ownerType !== undefined) updated.ownerType = patch.ownerType;
                if (patch.ownerId !== undefined) updated.ownerId = patch.ownerId;
                if (patch.featured !== undefined) updated.featured = !!patch.featured;
                if (patch.visibility !== undefined) updated.visibility = patch.visibility;
                if (patch.tagsToAdd) updated.tags = Array.from(new Set([...(updated.tags || []), ...patch.tagsToAdd]));
                if (patch.tagsToRemove) {
                    const removeSet = new Set(patch.tagsToRemove);
                    updated.tags = (updated.tags || []).filter((t) => !removeSet.has(t));
                }
                return updated;
            }));
            fireMessage(`${ids.length} assets updated`, 'success');
            fetchStats();
            return true;
        } catch (err) {
            fireMessage(err.message, 'error');
            return false;
        }
    }, [fetchStats]);

    /**
     * Upload one file and return the hydrated Media document.
     */
    const uploadNewMedia = useCallback((file, meta = {}) => {
        const key = `${file.name}-${file.size}`;
        const setProg = (v) => setUploadProgress((prev) => ({ ...prev, [key]: v }));
        const clearProg = () => setUploadProgress((prev) => { const n = { ...prev }; delete n[key]; return n; });

        const handle = createUpload({
            file,
            ownerType: meta.ownerType || ownerType,
            ownerId: meta.ownerId || null,
            slot: meta.slot,
            meta: {
                title: meta.title || file.name,
                altText: meta.altText || '',
                caption: meta.caption || '',
                tags: meta.tags,
                makeLoop: meta.makeLoop,
                stripAudio: meta.stripAudio,
            },
            onProgress: (loaded, total) => { if (total) setProg(Math.round((loaded / total) * 100)); },
            onStatus: (status) => { if (status === 'completing') setProg(-1); },
        });

        // Expose the controls so a caller that wants pause/cancel can reach them,
        // without changing the promise-shaped contract everything else relies on.
        const promise = handle.promise.finally(clearProg);
        promise.pause = handle.pause;
        promise.abort = handle.abort;
        return promise;
    }, [ownerType]);

    const updateMediaMeta = useCallback(async (id, patch) => {
        const res = await fetch(`${api_url}/api/admin/media/${id}`, {
            method: 'PATCH',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(patch),
        });
        const data = await res.json();
        if (res.status >= 300) throw new Error(data.message || 'Update failed');
        setItems((prev) => prev.map((m) => (m._id === id ? data.media : m)));
        return data.media;
    }, []);

    const deleteMedia = useCallback(async (id) => {
        const res = await fetch(`${api_url}/api/admin/media/${id}`, {
            method: 'DELETE',
            credentials: 'include',
        });
        const data = await res.json();
        if (res.status >= 300) throw new Error(data.message || 'Delete failed');
        setItems((prev) => prev.filter((m) => m._id !== id));
        setSelectedIds((prev) => prev.filter((itemId) => itemId !== id));
        return true;
    }, []);

    return {
        items, page, total, hasMore, loading, uploadProgress,
        fetchMedia, uploadNewMedia, updateMediaMeta, deleteMedia, setItems,
        stats, fetchStats,
        // Selection & Batch
        selectedIds, setSelectedIds, toggleSelect, selectOnly, selectAll, clearSelection, isSelected,
        batchDeleteMedia, batchUpdateMedia,
    };
}
