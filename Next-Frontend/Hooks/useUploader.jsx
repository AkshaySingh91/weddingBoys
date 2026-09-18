'use client';

import { useCallback, useRef, useState } from 'react';
import {
    createUpload, listResumable, recallSession, fingerprintOf,
} from '@/lib/upload/multipartUploader.js';
import useNetworkStatus from '@/Hooks/useNetworkStatus.jsx';

/**
 * The single upload entry point for the admin.
 *
 * Replaces seven hand-rolled copies of `uploadFileInBucket`, five of which
 * swallowed their errors — they called fireMessage and returned normally, so the
 * caller happily went on to save a database row referencing bytes that had never
 * reached the bucket. Three rules fix that class of bug for good:
 *
 *   1. Every failure rejects and lands the item in `status: 'error'`.
 *   2. The Media document is written by the server only after `complete`
 *      succeeds, so a row cannot exist without its object.
 *   3. A finished item always carries the hydrated `media` document, so callers
 *      stop hand-assembling `{ key: ... }` shapes.
 */
/** Rolling window for the throughput estimate. */
const SPEED_WINDOW_MS = 5000;

export default function useUploader({ ownerType = 'System', ownerId = null, slot } = {}) {
    const [items, setItems] = useState([]);
    const [resumable, setResumable] = useState([]);
    const handles = useRef(new Map());   // itemId -> uploader handle
    const samples = useRef(new Map());   // itemId -> [{ t, loaded }] rolling window
    const { tier } = useNetworkStatus();

    const patch = useCallback((id, next) => {
        setItems((prev) => prev.map((it) => (it.id === id ? { ...it, ...next } : it)));
    }, []);

    /**
     * Throughput and time remaining, from a rolling window of progress samples.
     *
     * A multipart upload runs several parts at once and each finishes in a
     * burst, so instantaneous rates swing wildly. Measuring across a window
     * gives a figure that is stable enough to read while still reacting when
     * the connection genuinely changes.
     */
    const measure = useCallback((id, loaded, total) => {
        const now = Date.now();
        const window = samples.current.get(id) || [];
        window.push({ t: now, loaded });

        while (window.length > 2 && now - window[0].t > SPEED_WINDOW_MS) window.shift();
        samples.current.set(id, window);

        const first = window[0];
        const elapsed = (now - first.t) / 1000;
        const moved = loaded - first.loaded;
        if (elapsed < 0.4 || moved <= 0) return {};

        const bytesPerSecond = moved / elapsed;
        const remaining = Math.max(0, (total || 0) - loaded);
        return {
            bytesPerSecond,
            etaSeconds: bytesPerSecond > 0 ? remaining / bytesPerSecond : null,
        };
    }, []);

    const upload = useCallback(async (item, opts = {}) => {
        // A weak connection cannot usefully run three parallel part uploads.
        const concurrency = tier === 'low' ? 1 : 3;

        const handle = createUpload({
            file: item.file,
            ownerType: opts.ownerType ?? ownerType,
            ownerId: opts.ownerId ?? ownerId,
            slot: opts.slot ?? slot,
            rendition: opts.rendition ?? 'orig',
            sourceMediaId: opts.sourceMediaId,
            meta: opts.meta ?? {},
            concurrency,
            resumeSessionId: opts.resumeSessionId,
            onProgress: (loaded, total) => {
                patch(item.id, {
                    progress: total ? Math.round((loaded / total) * 100) : 0,
                    loaded,
                    total,
                    ...measure(item.id, loaded, total),
                });
            },
            onStatus: (status) => patch(item.id, { status }),
        });
        handles.current.set(item.id, handle);

        try {
            const media = await handle.promise;
            patch(item.id, { status: 'done', progress: 100, media, error: null });
            return media;
        } catch (error) {
            if (error.name === 'PausedError') { patch(item.id, { status: 'paused' }); return null; }
            if (error.name === 'AbortError') { patch(item.id, { status: 'cancelled' }); return null; }
            patch(item.id, { status: 'error', error: error.message });
            throw error;
        } finally {
            handles.current.delete(item.id);
            samples.current.delete(item.id);
            patch(item.id, { bytesPerSecond: null, etaSeconds: null });
        }
    }, [ownerType, ownerId, slot, tier, patch, measure]);

    /**
     * Queue files. Resolves once every file has settled, with the successful
     * Media documents — partial success is reported rather than hidden.
     */
    const enqueue = useCallback(async (files, opts = {}) => {
        const list = Array.from(files || []);
        if (!list.length) return [];

        const staged = list.map((file) => ({
            id: `${fingerprintOf(file)}#${Math.random().toString(36).slice(2, 8)}`,
            file,
            name: file.name,
            size: file.size,
            type: file.type,
            status: 'queued',
            progress: 0,
            error: null,
            media: null,
            // A prior session for this exact file means it can be picked up
            // rather than restarted from byte zero.
            canResume: Boolean(recallSession(file)),
        }));
        setItems((prev) => [...prev, ...staged]);

        const settled = await Promise.allSettled(staged.map((it) => upload(it, opts)));
        return settled.filter((r) => r.status === 'fulfilled' && r.value).map((r) => r.value);
    }, [upload]);

    const pause = useCallback((id) => handles.current.get(id)?.pause(), []);

    /**
     * `upload()` rethrows so `enqueue`'s allSettled can tell success from
     * failure. resume/retry are called straight from click handlers, though, so
     * a rethrow there is a promise nobody is holding — an unhandledRejection on
     * every failed retry. The failure is already recorded on the item, which is
     * what the UI renders, so swallow it and report null.
     */
    const resume = useCallback(async (id) => {
        const item = items.find((it) => it.id === id);
        if (!item) return null;
        const prior = recallSession(item.file);
        try {
            return await upload(item, { resumeSessionId: prior?.sessionId });
        } catch {
            return null;
        }
    }, [items, upload]);

    const cancel = useCallback(async (id) => {
        await handles.current.get(id)?.abort();
        setItems((prev) => prev.filter((it) => it.id !== id));
    }, []);

    const retry = useCallback(async (id) => {
        const item = items.find((it) => it.id === id);
        if (!item) return null;
        patch(id, { status: 'queued', error: null, progress: 0 });
        try {
            return await upload(item);
        } catch {
            return null;
        }
    }, [items, upload, patch]);

    const clearFinished = useCallback(() => {
        setItems((prev) => prev.filter((it) => !['done', 'cancelled'].includes(it.status)));
    }, []);

    const refreshResumable = useCallback(async () => {
        setResumable(await listResumable());
    }, []);

    const active = items.filter((it) => ['queued', 'creating', 'uploading', 'completing'].includes(it.status));
    const totalBytes = items.reduce((n, it) => n + (it.size || 0), 0);
    const doneBytes = items.reduce((n, it) => n + (it.loaded || (it.status === 'done' ? it.size : 0)), 0);

    // Parts upload in parallel across files, so the batch rate is the sum of
    // the in-flight rates; the batch ETA follows from what is left overall.
    const overallSpeed = active.reduce((n, it) => n + (it.bytesPerSecond || 0), 0);
    const overallEta = overallSpeed > 0 ? (totalBytes - doneBytes) / overallSpeed : null;

    return {
        items,
        enqueue, pause, resume, cancel, retry, clearFinished,
        resumable, refreshResumable,
        isUploading: active.length > 0,
        overallProgress: totalBytes ? Math.round((doneBytes / totalBytes) * 100) : 0,
        overallSpeed,
        overallEta,
        totalBytes,
        doneBytes,
    };
}
