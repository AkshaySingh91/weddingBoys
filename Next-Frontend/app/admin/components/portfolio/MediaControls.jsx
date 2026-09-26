'use client';

import { useState } from 'react';
import { ImageSquare, ArrowCounterClockwise, Swap, LinkSimple } from '@phosphor-icons/react';
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
    const replaceWith = async (media) => {
        const m = media?.[0];
        if (!m) return;
        const r = await run(() => call(`/api/admin/portfolio/${item._id}/replace`, 'POST', { media: m._id }),
            (res) => (res.pending ? 'Uploaded — it replaces the current file when processing finishes' : 'File replaced'));
        if (r) { setShowReplace(false); onChanged?.({ render: r.item.render, mediaReady: r.item.mediaReady, pendingMedia: r.item.pendingMedia }); }
    };

    return (
        <div className="rounded-2xl border border-stone-200 bg-white p-5 space-y-4 shadow-xs">
            <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-stone-500">On the site</span>
                {chip && <span className={cn('rounded-md px-1.5 py-0.5 text-[10px] font-semibold text-white', chip.cls)}>{chip.label}</span>}
                {item.pendingMedia && <span className="rounded-md bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-900">New file processing</span>}
            </div>
            {item.visibility && !item.visibility.public && (
                <ul className="list-disc space-y-0.5 pl-5 text-xs text-stone-600">
                    {item.visibility.reasons.map((r) => <li key={r}>Not shown: {REASON_TEXT[r] || r}</li>)}
                </ul>
            )}

            {external && (
                <p className="flex items-center gap-1.5 text-xs text-stone-600">
                    <LinkSimple size={13} />
                    Plays from {external === 'youtube' ? 'YouTube' : 'Vimeo'}:
                    <a href={item.external.url} target="_blank" rel="noreferrer" className="truncate text-[#D9342A] hover:underline">{item.external.url}</a>
                </p>
            )}

            {isVideo && (
                <div className="space-y-2">
                    <p className="text-xs font-semibold text-stone-700">Poster</p>
                    <div className="flex flex-wrap gap-2">
                        <Button type="button" variant="outline" size="sm" icon={ImageSquare} disabled={busy} onClick={photos ? () => setPhotos(null) : loadPhotos}>
                            {photos ? 'Close' : 'Choose from this wedding\'s photos'}
                        </Button>
                        {item.poster && (
                            <Button type="button" variant="ghost" size="sm" icon={ArrowCounterClockwise} disabled={busy} onClick={resetPoster}>
                                Use the film&apos;s own frame
                            </Button>
                        )}
                    </div>
                    {photos && (photos.length ? (
                        <div className="grid grid-cols-4 gap-2">
                            {photos.map((p) => (
                                <button key={p._id} type="button" disabled={busy} onClick={() => choosePoster(p)}
                                    className="relative aspect-video overflow-hidden rounded-lg border border-stone-200 hover:border-[#D9342A]">
                                    {/* eslint-disable-next-line @next/next/no-img-element -- admin thumbnail */}
                                    <img src={p.render?.imageUrl} alt="" className="h-full w-full object-cover" />
                                </button>
                            ))}
                        </div>
                    ) : <p className="text-xs text-stone-500">This wedding has no processed photos yet.</p>)}
                </div>
            )}

            {!external && (
                <div className="space-y-2">
                    <Button type="button" variant="outline" size="sm" icon={Swap} onClick={() => setShowReplace((v) => !v)}>
                        {showReplace ? 'Cancel' : `Replace the ${isVideo ? 'film' : 'photo'} file`}
                    </Button>
                    {showReplace && (
                        <>
                            <p className="text-[11px] text-stone-500">The item keeps its tags, order and address; visitors see the old file until the new one is ready.</p>
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
