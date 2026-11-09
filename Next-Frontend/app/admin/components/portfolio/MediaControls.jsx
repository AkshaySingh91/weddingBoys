'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ImageSquare, ArrowCounterClockwise, Swap, LinkSimple, UploadSimple, Crosshair } from '@phosphor-icons/react';
import Uploader from '@/app/admin/components/Uploader.jsx';
import { Button } from '@/app/admin/components/ui/Button.jsx';
import { fireMessage } from '@/Utils/fireMessage.js';
import { cn } from '@/lib/utils.js';
import { visibilityChip, REASON_TEXT } from '@/app/admin/(dashboard)/clients/_lib/visibility.js';

const api_url = process.env.NEXT_PUBLIC_API_URL;

async function call(path, method, body) {
    const res = await fetch(`${api_url}${path}`, {
        method, credentials: 'include',
        headers: body ? { 'Content-Type': 'application/json' } : undefined,
        body: body ? JSON.stringify(body) : undefined,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.message || 'That did not work');
    return { status: res.status, ...data };
}

/**
 * The drawer's "on the site" controls for one item:
 *   - whether visitors see it, and every reason they do not;
 *   - a film's poster: one of this wedding's photos, or back to its own frame;
 *   - replace the file, keeping the item (tags, order, rows, URL).
 * `onChanged(fields)` hands back the fields that changed so the drawer and the
 * grid update without a reload.
 */
export default function MediaControls({ item, onChanged }) {
    const [photos, setPhotos] = useState(null);
    const [busy, setBusy] = useState(false);
    const [showReplace, setShowReplace] = useState(false);
    const [showCoverUpload, setShowCoverUpload] = useState(false);
    // The rows (collections) this item appears in, is pinned to, or is hidden from.
    const [placements, setPlacements] = useState(null);
    useEffect(() => {
        let cancelled = false;
        call(`/api/admin/portfolio/${item._id}/placements`, 'GET')
            .then((r) => { if (!cancelled) setPlacements(r.placements || []); })
            .catch(() => { if (!cancelled) setPlacements([]); });
        return () => { cancelled = true; };
    }, [item._id]);
    const chip = visibilityChip(item);
    const isVideo = item.kind === 'Video';
    const external = item.external?.provider;
    const clientId = item.client?._id || item.client;

    const run = async (fn, success) => {
        setBusy(true);
        try {
            const r = await fn();
            if (success) fireMessage(typeof success === 'function' ? success(r) : success, 'success');
            return r;
        } catch (err) {
            fireMessage(err.message, 'error');
            return null;
        } finally {
            setBusy(false);
        }
    };

    const loadPhotos = async () => {
        const r = await run(() => call(`/api/admin/portfolio?client=${clientId}&kind=Photo&limit=60&sort=order`, 'GET'));
        if (r) setPhotos((r.items || []).filter((p) => p.media?._id && p.media.status === 'Ready'));
    };

    const choosePoster = async (photo) => {
        const r = await run(() => call(`/api/admin/portfolio/${item._id}/poster`, 'POST', { media: photo.media._id }), 'Poster set');
        if (r) { setPhotos(null); onChanged?.({ render: r.item.render, poster: r.item.poster, mediaReady: r.item.mediaReady }); }
    };
    const resetPoster = async () => {
        const r = await run(() => call(`/api/admin/portfolio/${item._id}/poster`, 'DELETE'), 'Back to the film\'s own frame');
        if (r) onChanged?.({ render: r.item.render, poster: r.item.poster, mediaReady: r.item.mediaReady });
    };
    const uploadedCover = async (media) => {
        const m = media?.[0];
        if (!m) return;
        const r = await run(() => call(`/api/admin/portfolio/${item._id}/poster`, 'POST', { media: m._id }),
            (res) => (res.item?.render?.posterUrl === item.render?.posterUrl ? 'Cover set — it appears when the image finishes processing' : 'Cover set'));
        if (r) { setShowCoverUpload(false); onChanged?.({ render: r.item.render, poster: r.item.poster, mediaReady: r.item.mediaReady }); }
    };
    // Where the subject is on the cover: click the still. Phones crop the sides
    // and wide screens crop top/bottom around this point.
    const focus = item.coverFocus?.x != null ? item.coverFocus : item.render?.focus;
    const setFocus = async (next) => {
        const r = await run(() => call(`/api/admin/portfolio/${item._id}`, 'PATCH', { coverFocus: next }), next ? 'Focus saved' : 'Back to automatic focus');
        if (r) onChanged?.({ coverFocus: r.item.coverFocus ?? null });
    };
    const onFocusClick = (e) => {
        const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
        setFocus({ x: Math.min(1, Math.max(0, (e.clientX - left) / width)), y: Math.min(1, Math.max(0, (e.clientY - top) / height)) });
    };
    const replaceWith = async (media) => {
        const m = media?.[0];
        if (!m) return;
        const r = await run(() => call(`/api/admin/portfolio/${item._id}/replace`, 'POST', { media: m._id }),
            (res) => (res.pending ? 'Uploaded — it replaces the current file when processing finishes' : 'File replaced'));
        if (r) { setShowReplace(false); onChanged?.({ render: r.item.render, mediaReady: r.item.mediaReady, pendingMedia: r.item.pendingMedia }); }
    };

    return (
        <div className="rounded-xl border border-edge-subtle bg-white p-5 space-y-4 shadow-xs">
            <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-ink-muted">On the site</span>
                {chip && <span className={cn('rounded-lg px-1.5 py-0.5 text-[10px] font-semibold text-white', chip.cls)}>{chip.label}</span>}
                {item.pendingMedia && <span className="rounded-lg bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-900">New file processing</span>}
            </div>
            {item.visibility && !item.visibility.public && (
                <ul className="list-disc space-y-0.5 pl-5 text-xs text-ink-secondary">
                    {item.visibility.reasons.map((r) => <li key={r}>Not shown: {REASON_TEXT[r] || r}</li>)}
                </ul>
            )}

            <label className="flex items-center gap-2 text-xs text-ink-secondary">
                <span className="font-semibold">Spotlight</span>
                <input
                    type="number" min={0} max={100} defaultValue={item.spotlight ?? 0}
                    onBlur={async (e) => {
                        const v = Math.min(100, Math.max(0, parseInt(e.target.value, 10) || 0));
                        if (v === (item.spotlight ?? 0)) return;
                        const r = await run(() => call(`/api/admin/portfolio/${item._id}`, 'PATCH', { spotlight: v }), 'Spotlight saved');
                        if (r) onChanged?.({ spotlight: v });
                    }}
                    className="h-7 w-16 rounded-lg border border-edge-strong px-2 text-xs"
                />
                <span className="text-ink-muted">0–100; rows sorted &ldquo;Featured first&rdquo; show higher first</span>
            </label>

            <div className="space-y-1">
                <p className="text-xs font-semibold text-ink-secondary">Appears in</p>
                {placements === null ? <p className="text-xs text-ink-muted">Checking rows…</p>
                    : placements.length ? (
                        <ul className="space-y-0.5 text-xs text-ink-secondary">
                            {placements.map((p) => (
                                <li key={p._id}>
                                    <Link href={`/admin/collections/${p._id}`} className="text-accent-ink hover:underline">{p.title}</Link>
                                    {p.shown ? ` — position ${p.position}` : ''}
                                    {p.pinned ? ' (pinned)' : ''}
                                    {p.hidden ? ' — hidden in this row' : ''}
                                    {!p.shown && !p.hidden ? ' — pinned, not shown' : ''}
                                    {p.status === 'Draft' ? ' · row is a draft' : ''}
                                </li>
                            ))}
                        </ul>
                    ) : <p className="text-xs text-ink-muted">No row shows it.</p>}
            </div>

            {external && (
                <p className="flex items-center gap-1.5 text-xs text-ink-secondary">
                    <LinkSimple size={13} />
                    Plays from {external === 'youtube' ? 'YouTube' : 'Vimeo'}:
                    <a href={item.external.url} target="_blank" rel="noreferrer" className="truncate text-accent-ink hover:underline">{item.external.url}</a>
                </p>
            )}

            {isVideo && (
                <div className="space-y-2">
                    <p className="text-xs font-semibold text-ink-secondary">Cover</p>
                    {item.render?.posterUrl && (
                        <div className="space-y-1">
                            <button type="button" disabled={busy} onClick={onFocusClick} aria-label="Set where the subject is on the cover"
                                className="relative block aspect-video w-full cursor-crosshair overflow-hidden rounded-lg border border-edge-subtle">
                                {/* eslint-disable-next-line @next/next/no-img-element -- admin preview */}
                                <img src={item.render.posterUrl} alt="" className="h-full w-full object-cover" />
                                {focus && (
                                    <>
                                        {/* the 9:16 phone crop around the focus */}
                                        <span aria-hidden="true" className="absolute inset-y-0 border-x-2 border-white/90 bg-white/10 shadow-[0_0_0_9999px_rgba(0,0,0,0.35)]"
                                            style={{ width: '31.64%', left: `${Math.min(68.36, Math.max(0, focus.x * 100 - 15.82))}%` }} />
                                        <span aria-hidden="true" className="absolute h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-accent shadow"
                                            style={{ left: `${focus.x * 100}%`, top: `${focus.y * 100}%` }} />
                                    </>
                                )}
                            </button>
                            <p className="flex flex-wrap items-center gap-x-2 text-[11px] text-ink-muted">
                                <Crosshair size={12} /> Click the subject — the box is what phones show.
                                {item.coverFocus?.x != null && (
                                    <button type="button" disabled={busy} onClick={() => setFocus(null)} className="text-accent-ink hover:underline">Use automatic focus</button>
                                )}
                            </p>
                        </div>
                    )}
                    <div className="flex flex-wrap gap-2">
                        <Button type="button" variant="outline" size="sm" icon={ImageSquare} disabled={busy} onClick={photos ? () => setPhotos(null) : loadPhotos}>
                            {photos ? 'Close' : 'Choose from this wedding\'s photos'}
                        </Button>
                        <Button type="button" variant="outline" size="sm" icon={UploadSimple} disabled={busy} onClick={() => setShowCoverUpload((v) => !v)}>
                            {showCoverUpload ? 'Cancel' : 'Upload a cover'}
                        </Button>
                        {item.poster && (
                            <Button type="button" variant="ghost" size="sm" icon={ArrowCounterClockwise} disabled={busy} onClick={resetPoster}>
                                Use the best frame from the film
                            </Button>
                        )}
                    </div>
                    {showCoverUpload && (
                        <Uploader
                            ownerType="Client"
                            ownerId={clientId}
                            multiple={false}
                            accept="image/*"
                            label="Drop the cover image here"
                            onUploaded={uploadedCover}
                        />
                    )}
                    {photos && (photos.length ? (
                        <div className="grid grid-cols-4 gap-2">
                            {photos.map((p) => (
                                <button key={p._id} type="button" disabled={busy} onClick={() => choosePoster(p)}
                                    className="relative aspect-video overflow-hidden rounded-lg border border-edge-subtle hover:border-accent">
                                    {/* eslint-disable-next-line @next/next/no-img-element -- admin thumbnail */}
                                    <img src={p.render?.imageUrl} alt="" className="h-full w-full object-cover" />
                                </button>
                            ))}
                        </div>
                    ) : <p className="text-xs text-ink-muted">This wedding has no processed photos yet.</p>)}
                </div>
            )}

            {!external && (
                <div className="space-y-2">
                    <Button type="button" variant="outline" size="sm" icon={Swap} onClick={() => setShowReplace((v) => !v)}>
                        {showReplace ? 'Cancel' : `Replace the ${isVideo ? 'film' : 'photo'} file`}
                    </Button>
                    {showReplace && (
                        <>
                            <p className="text-[11px] text-ink-muted">The item keeps its tags, order and address; visitors see the old file until the new one is ready.</p>
                            <Uploader
                                ownerType="Client"
                                ownerId={clientId}
                                multiple={false}
                                accept={isVideo ? 'video/*' : 'image/*'}
                                showVideoOptions={isVideo}
                                label={`Drop the new ${isVideo ? 'film' : 'photo'} here`}
                                onUploaded={replaceWith}
                            />
                        </>
                    )}
                </div>
            )}
        </div>
    );
}
