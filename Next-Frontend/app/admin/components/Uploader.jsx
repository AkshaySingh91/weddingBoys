'use client';

import { useCallback, useRef, useState } from 'react';
import {
    UploadSimple, FilmSlate, ImageSquare, FileText, CheckCircle,
    WarningCircle, Pause, Play, ArrowClockwise, X, CircleNotch,
} from '@phosphor-icons/react';
import useUploader from '@/Hooks/useUploader.jsx';
import { formatBytes, formatSpeed, formatEta } from '@/Utils/format.js';
import { Button } from '@/app/admin/components/ui/Button.jsx';
import { cn } from '@/lib/utils.js';
import AssetBreakdown from './AssetBreakdown.jsx';

const STATUS_LABEL = {
    queued: 'Waiting',
    creating: 'Preparing',
    uploading: 'Uploading',
    completing: 'Finishing',
    done: 'Ready',
    paused: 'Paused',
    cancelled: 'Cancelled',
    error: 'Failed',
};

const iconFor = (type = '') => {
    if (type.startsWith('video/')) return FilmSlate;
    if (type.startsWith('image/')) return ImageSquare;
    return FileText;
};

const isActive = (s) => ['queued', 'creating', 'uploading', 'completing'].includes(s);

/**
 * The admin's single upload surface.
 *
 * Bytes go browser→R2 directly through the resumable multipart uploader, which
 * is XHR-based specifically so progress can be reported — `fetch()` cannot do
 * that, which is why the screens still using it show a spinner and nothing else
 * for a 200 MB film. Every failure here surfaces; none resolve silently.
 */
export default function Uploader({
    ownerType = 'System',
    ownerId = null,
    slot,
    accept,
    multiple = true,
    showVideoOptions = false,
    onUploaded,
    label = 'Drop files here',
    hint,
    className = '',
}) {
    const {
        items, enqueue, pause, resume, cancel, retry, clearFinished,
        isUploading, overallProgress, overallSpeed, overallEta,
    } = useUploader({ ownerType, ownerId, slot });

    const [dragging, setDragging] = useState(false);
    const [makeLoop, setMakeLoop] = useState(false);
    const [stripAudio, setStripAudio] = useState(false);
    const [expanded, setExpanded] = useState(null);
    const inputRef = useRef(null);

    const handleFiles = useCallback(async (files) => {
        const list = Array.from(files || []);
        if (!list.length) return;
        const media = await enqueue(list, { meta: { makeLoop, stripAudio } });
        if (media.length) onUploaded?.(media);
    }, [enqueue, makeLoop, stripAudio, onUploaded]);

    const finished = items.filter((it) => ['done', 'cancelled'].includes(it.status));

    return (
        <div className={cn('space-y-3', className)}>
            <button
                type="button"
                onClick={() => inputRef.current?.click()}
                onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={(e) => { e.preventDefault(); setDragging(false); handleFiles(e.dataTransfer.files); }}
                className={cn(
                    'flex w-full flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed px-4 py-8 text-center transition',
                    dragging
                        ? 'border-gold bg-ground-sunk'
                        : 'border-edge-subtle bg-white hover:border-edge-strong hover:bg-ground',
                )}
            >
                <UploadSimple size={22} className={dragging ? 'text-accent-ink' : 'text-ink-muted'} />
                <span className="text-xs font-medium text-ink">{label}</span>
                <span className="text-[11px] text-ink-muted">
                    {hint || 'or click to browse — large films upload in the background and can be paused'}
                </span>
            </button>

            <input
                ref={inputRef}
                type="file"
                accept={accept}
                multiple={multiple}
                hidden
                onChange={(e) => { handleFiles(e.target.files); e.target.value = ''; }}
            />

            {showVideoOptions && (
                <div className="flex flex-wrap gap-4 rounded-xl border border-edge-subtle bg-white px-3 py-2">
                    <label className="flex cursor-pointer items-center gap-2 text-[11px] text-ink-secondary">
                        <input type="checkbox" checked={makeLoop} onChange={(e) => setMakeLoop(e.target.checked)}
                            className="h-3.5 w-3.5 accent-accent" />
                        Build a silent hero loop
                    </label>
                    <label className="flex cursor-pointer items-center gap-2 text-[11px] text-ink-secondary">
                        <input type="checkbox" checked={stripAudio} onChange={(e) => setStripAudio(e.target.checked)}
                            className="h-3.5 w-3.5 accent-accent" />
                        Strip the audio track
                    </label>
                </div>
            )}

            {items.length > 0 && (
                <div className="space-y-2 rounded-xl border border-edge-subtle bg-white p-3">
                    <div className="flex items-center justify-between gap-2">
                        <p className="text-[11px] font-medium text-ink-secondary">
                            {isUploading ? (
                                <>
                                    Uploading — {overallProgress}%
                                    {overallSpeed > 0 && (
                                        <span className="font-normal text-ink-muted">
                                            {' '}· {formatSpeed(overallSpeed)} · {formatEta(overallEta)} left
                                        </span>
                                    )}
                                </>
                            ) : (
                                `${items.length} file${items.length === 1 ? '' : 's'}`
                            )}
                        </p>
                        {finished.length > 0 && (
                            <button type="button" onClick={clearFinished}
                                className="text-[11px] text-ink-muted hover:text-ink">
                                Clear finished
                            </button>
                        )}
                    </div>

                    {items.map((it) => {
                        const Icon = iconFor(it.type);
                        const open = expanded === it.id;
                        return (
                            <div key={it.id} className="rounded-xl border border-edge-subtle bg-ground/50 p-2.5">
                                <div className="flex items-center gap-2.5">
                                    <Icon size={16} className="shrink-0 text-ink-muted" />
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-baseline justify-between gap-2">
                                            <p className="truncate text-xs font-medium text-ink">{it.name}</p>
                                            <span className="shrink-0 text-[10px] tabular-nums text-ink-muted">
                                                {formatBytes(it.size)}
                                            </span>
                                        </div>

                                        <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-ground-sunk">
                                            <div
                                                className={cn(
                                                    'h-full rounded-full transition-[width] duration-300',
                                                    it.status === 'error' ? 'bg-rose-500'
                                                        : it.status === 'done' ? 'bg-emerald-500'
                                                            : it.status === 'paused' ? 'bg-stone-400'
                                                                : 'bg-gold',
                                                )}
                                                style={{ width: `${it.status === 'done' ? 100 : it.progress || 0}%` }}
                                            />
                                        </div>

                                        <p className="mt-1 flex items-center gap-1 text-[10px] text-ink-muted">
                                            {it.status === 'completing' && <CircleNotch size={9} className="animate-spin" />}
                                            <span>{STATUS_LABEL[it.status] || it.status}</span>
                                            {isActive(it.status) && it.progress > 0 && <span>· {it.progress}%</span>}
                                            {it.status === 'uploading' && it.bytesPerSecond > 0 && (
                                                <span>· {formatSpeed(it.bytesPerSecond)} · {formatEta(it.etaSeconds)} left</span>
                                            )}
                                            {it.status === 'completing' && <span>· building renditions</span>}
                                            {it.status === 'error' && <span className="text-rose-600">· {it.error}</span>}
                                        </p>
                                    </div>

                                    <div className="flex shrink-0 items-center gap-0.5">
                                        {it.status === 'uploading' && (
                                            <Button variant="ghost" size="iconSm" onClick={() => pause(it.id)} aria-label="Pause">
                                                <Pause size={13} />
                                            </Button>
                                        )}
                                        {it.status === 'paused' && (
                                            <Button variant="ghost" size="iconSm" onClick={() => resume(it.id)} aria-label="Resume">
                                                <Play size={13} />
                                            </Button>
                                        )}
                                        {it.status === 'error' && (
                                            <Button variant="ghost" size="iconSm" onClick={() => retry(it.id)} aria-label="Retry">
                                                <ArrowClockwise size={13} />
                                            </Button>
                                        )}
                                        {isActive(it.status) && (
                                            <Button variant="ghost" size="iconSm" onClick={() => cancel(it.id)} aria-label="Cancel">
                                                <X size={13} />
                                            </Button>
                                        )}
                                        {it.status === 'done' && <CheckCircle size={15} weight="fill" className="text-emerald-500" />}
                                        {it.status === 'error' && <WarningCircle size={15} weight="fill" className="text-rose-500" />}
                                    </div>
                                </div>

                                {/* What the pipeline actually produced from this file. */}
                                {it.status === 'done' && it.media && (
                                    <div className="mt-2 border-t border-edge-subtle pt-2">
                                        <button
                                            type="button"
                                            onClick={() => setExpanded(open ? null : it.id)}
                                            className="text-[10px] font-medium text-accent-ink hover:underline"
                                        >
                                            {open ? 'Hide' : 'Show'} what was generated
                                        </button>
                                        {open && <AssetBreakdown media={it.media} className="mt-2" />}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
