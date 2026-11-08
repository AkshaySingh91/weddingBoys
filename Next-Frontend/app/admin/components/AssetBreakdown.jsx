import { useMemo, useState } from 'react';
import Image from 'next/image';
import {
    FilmSlate, ImageSquare, HardDrives, SpeakerSimpleSlash,
    SpeakerHigh, Lightning, Warning, Copy, Check, ArrowSquareOut,
    Eye, Play, Pause, Rows, SquaresFour,
} from '@phosphor-icons/react';
import { formatBytes, formatDuration, formatDimensions } from '@/Utils/format.js';
import { cn } from '@/lib/utils.js';

/**
 * Every derivative of one asset, with its real size and playable/viewable assets.
 */

/** Flatten an asset's derivatives into one comparable list of rows. */
export function derivativesOf(media) {
    if (!media) return { rows: [], masterBytes: 0, totalBytes: 0, deliveredBytes: 0 };

    const masterBytes = media.fileSize || 0;
    const rows = [];

    if (media.mediaType === 'Video') {
        for (const r of media.video?.renditions || []) {
            rows.push({
                key: r.storageKey || `${r.role}-${r.width}`,
                group: 'Rendition',
                label: r.role || r.label || 'rendition',
                width: r.width,
                height: r.height,
                format: 'mp4',
                bytes: r.bytes,
                bitrateKbps: r.bitrateKbps,
                durationSec: r.durationSec,
                faststart: r.faststart,
                hasAudio: r.hasAudio,
                isMaster: r.role === 'source',
                url: r.url,
            });
        }
        // The base poster is a real object in the bucket
        if (media.video?.posterStorageKey || media.video?.posterUrl) {
            rows.push({
                key: media.video.posterStorageKey || 'poster-base',
                group: 'Poster',
                label: 'poster (master)',
                format: (media.video.posterStorageKey?.split('.').pop() || 'jpg').toLowerCase(),
                bytes: media.video.posterBytes,
                url: media.video.posterUrl,
            });
        }
        for (const p of media.video?.posterVariants || []) {
            rows.push({
                key: p.storageKey || `poster-${p.width}`,
                group: 'Poster',
                label: `poster ${p.label || p.width}w`,
                width: p.width,
                height: p.height,
                format: p.format || 'webp',
                bytes: p.bytes,
                url: p.url,
            });
        }
    } else {
        for (const v of media.imageVariants || []) {
            rows.push({
                key: v.storageKey || `${v.width}-${v.format}`,
                group: 'Variant',
                label: `${v.width}w`,
                width: v.width,
                height: v.height,
                format: v.format || 'webp',
                bytes: v.bytes,
                url: v.url,
            });
        }
    }

    // The `source` rendition IS the master file
    const derivativeBytes = rows.filter((r) => !r.isMaster).reduce((sum, r) => sum + (r.bytes || 0), 0);
    const totalBytes = masterBytes + derivativeBytes;

    const delivered = media.mediaType === 'Video'
        ? rows.find((r) => r.label === 'web')
        : rows.slice().sort((a, b) => Math.abs((a.width || 0) - 1024) - Math.abs((b.width || 0) - 1024))[0];

    return { rows, masterBytes, totalBytes, deliveredBytes: delivered?.bytes || 0 };
}

function duplicateWidths(rows) {
    const seen = new Map();
    const dupes = [];
    for (const r of rows) {
        if (r.isMaster || !r.width) continue;
        const sig = `${r.group}:${r.width}x${r.height}.${r.format}`;
        if (seen.has(sig)) dupes.push(r); else seen.set(sig, r);
    }
    return dupes;
}

function Stat({ label, value, hint }) {
    return (
        <div className="rounded-xl border border-edge-subtle bg-white p-3 shadow-xs">
            <p className="text-[10px] font-bold uppercase tracking-wider text-ink-muted">{label}</p>
            <p className="mt-1 text-sm font-bold tabular-nums text-ink">{value}</p>
            {hint && <p className="mt-0.5 text-[10px] text-ink-muted font-medium">{hint}</p>}
        </div>
    );
}

function DerivativeCard({ item, isVideo, onPreview }) {
    const [copied, setCopied] = useState(false);

    const handleCopy = async (e) => {
        e.stopPropagation();
        if (!item.url) return;
        try {
            await navigator.clipboard.writeText(item.url);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch { /* clipboard unavailable */ }
    };

    const isVideoFile = item.format === 'mp4' || item.group === 'Rendition';
    const isLoop = item.label === 'loop';

    return (
        <div className="rounded-xl border border-edge-subtle bg-white p-3 shadow-2xs hover:border-accent/40 hover:shadow-xs transition-all space-y-2.5 flex flex-col">
            {/* Header info */}
            <div className="flex items-center justify-between gap-1.5">
                <div className="flex items-center gap-1.5 min-w-0">
                    <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-ground-sunk text-ink-secondary shrink-0">
                        {isVideoFile ? <FilmSlate size={13} weight="bold" /> : <ImageSquare size={13} weight="bold" />}
                    </span>
                    <span className="font-bold text-xs text-ink truncate capitalize">
                        {item.label}
                    </span>
                    {item.isMaster && (
                        <span className="rounded-lg bg-ground-sunk border border-edge-subtle px-1.5 py-0.5 text-[9px] font-semibold text-ink-secondary">
                            master
                        </span>
                    )}
                </div>

                <div className="flex items-center gap-1 shrink-0">
                    {item.hasAudio === false && (
                        <span className="rounded-lg bg-ground-sunk p-1 text-ink-muted" title="Silent Audio">
                            <SpeakerSimpleSlash size={11} />
                        </span>
                    )}
                    {item.hasAudio === true && (
                        <span className="rounded-lg bg-ground-sunk p-1 text-ink-secondary" title="Audio Track Included">
                            <SpeakerHigh size={11} />
                        </span>
                    )}
                    <span className="font-mono text-[10px] font-bold text-ink bg-ground-sunk/90 px-1.5 py-0.5 rounded-lg uppercase">
                        {item.format}
                    </span>
                </div>
            </div>

            {/* Asset Visual Stage / Player */}
            <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-ink/90 border border-ink flex items-center justify-center group">
                {item.url ? (
                    isVideoFile ? (
                        <video
                            src={item.url}
                            controls
                            playsInline
                            muted={isLoop}
                            loop={isLoop}
                            className="h-full w-full object-contain"
                        />
                    ) : (
                        <img
                            src={item.url}
                            alt={item.label}
                            className="h-full w-full object-contain"
                            loading="lazy"
                        />
                    )
                ) : (
                    <div className="flex flex-col items-center justify-center text-ink-muted text-center p-2 text-xs">
                        <Lightning size={18} className="text-amber-500 animate-pulse mb-1" />
                        <span>Processing in worker...</span>
                    </div>
                )}

                {item.url && onPreview && (
                    <button
                        type="button"
                        onClick={() => onPreview(item)}
                        className="absolute top-2 right-2 z-10 flex items-center gap-1 rounded-lg bg-ink/85 backdrop-blur-xs px-2 py-1 text-[10px] font-semibold text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-ink cursor-pointer shadow-md"
                    >
                        <Eye size={11} weight="bold" /> Stage
                    </button>
                )}
            </div>

            {/* Specs & Quick Actions */}
            <div className="mt-auto pt-1 flex items-center justify-between gap-2 text-xs border-t border-edge-subtle">
                <div className="min-w-0">
                    <p className="font-mono text-[11px] text-ink-secondary font-semibold tabular-nums">
                        {formatDimensions(item.width, item.height) || 'Adaptive'}
                    </p>
                    <div className="flex items-center gap-1.5 text-[10px] text-ink-muted mt-0.5">
                        <span className="font-bold text-ink">{formatBytes(item.bytes)}</span>
                        {item.bitrateKbps && <span>· {item.bitrateKbps} kbps</span>}
                        {item.durationSec && <span>· {formatDuration(item.durationSec)}</span>}
                    </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                    {item.url && (
                        <>
                            <button
                                type="button"
                                onClick={handleCopy}
                                title="Copy direct CDN URL"
                                className="flex h-7 w-7 items-center justify-center rounded-lg border border-edge-subtle bg-ground text-ink-secondary hover:border-edge-strong hover:text-ink transition-all cursor-pointer"
                            >
                                {copied ? <Check size={13} weight="bold" className="text-emerald-600" /> : <Copy size={13} />}
                            </button>
                            <a
                                href={item.url}
                                target="_blank"
                                rel="noreferrer"
                                title="Open in new window"
                                className="flex h-7 w-7 items-center justify-center rounded-lg border border-edge-subtle bg-ground text-ink-secondary hover:border-edge-strong hover:text-ink transition-all cursor-pointer"
                            >
                                <ArrowSquareOut size={13} />
                            </a>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

export default function AssetBreakdown({ media, className = '', compact = false, onPreview = null }) {
    const { rows, masterBytes, totalBytes, deliveredBytes } = useMemo(() => derivativesOf(media), [media]);
    const dupes = useMemo(() => duplicateWidths(rows), [rows]);
    const [viewMode, setViewMode] = useState('cards'); // 'cards' | 'table'

    if (!media) return null;

    const isVideo = media.mediaType === 'Video';
    const processing = media.status === 'Processing' || media.status === 'Uploading';
    const saving = masterBytes && deliveredBytes ? Math.round((1 - deliveredBytes / masterBytes) * 100) : null;
    const maxBytes = Math.max(...rows.map((r) => r.bytes || 0), 1);

    return (
        <div className={cn('space-y-4 font-sans', className)}>
            {!compact && (
                <div className="grid grid-cols-3 gap-2.5">
                    <Stat
                        label="Master Original"
                        value={formatBytes(masterBytes)}
                        hint={formatDimensions(media.width, media.height) || undefined}
                    />
                    <Stat
                        label="Total in R2"
                        value={formatBytes(totalBytes)}
                        hint={`${rows.filter((r) => !r.isMaster).length} derivative${rows.filter((r) => !r.isMaster).length === 1 ? '' : 's'}`}
                    />
                    <Stat
                        label="Delivered Stream"
                        value={deliveredBytes ? formatBytes(deliveredBytes) : '—'}
                        hint={saving !== null && saving > 0 ? `${saving}% saved` : undefined}
                    />
                </div>
            )}

            {processing && (
                <div className="flex items-center gap-2.5 rounded-xl border border-amber-200 bg-amber-50/80 p-3.5 text-xs text-amber-900 shadow-2xs">
                    <Lightning size={16} weight="fill" className="shrink-0 text-amber-600 animate-bounce" />
                    <div>
                        <p className="font-bold">Worker transcode & ladder pipeline active</p>
                        <p className="text-[11px] text-amber-800/90 mt-0.5">
                            Additional streaming variants will appear in real time once processing completes.
                        </p>
                    </div>
                </div>
            )}

            {rows.length === 0 && !processing && (
                <div className="rounded-xl border border-dashed border-edge-subtle bg-white p-8 text-center text-xs text-ink-muted space-y-1">
                    <p className="font-semibold text-ink-secondary">No derivatives recorded</p>
                    <p className="text-[11px] text-ink-muted">
                        {media.mimeType?.includes('svg')
                            ? 'Vector asset — served directly from Cloudflare R2 without size ladder.'
                            : 'This asset is served as-is from the edge bucket.'}
                    </p>
                </div>
            )}

            {rows.length > 0 && (
                <div className="space-y-3">
                    {/* View Switcher Strip */}
                    <div className="flex items-center justify-between px-1">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-ink-muted">
                            Available Renditions & Formats ({rows.length})
                        </span>
                        <div className="flex items-center gap-1 rounded-xl bg-ground-sunk p-1 border border-edge-subtle">
                            <button
                                type="button"
                                onClick={() => setViewMode('cards')}
                                className={cn(
                                    'flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold rounded-lg transition-all cursor-pointer',
                                    viewMode === 'cards'
                                        ? 'bg-white text-ink shadow-2xs'
                                        : 'text-ink-muted hover:text-ink'
                                )}
                            >
                                <SquaresFour size={13} weight="bold" />
                                Visual Cards
                            </button>
                            <button
                                type="button"
                                onClick={() => setViewMode('table')}
                                className={cn(
                                    'flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold rounded-lg transition-all cursor-pointer',
                                    viewMode === 'table'
                                        ? 'bg-white text-ink shadow-2xs'
                                        : 'text-ink-muted hover:text-ink'
                                )}
                            >
                                <Rows size={13} weight="bold" />
                                Table View
                            </button>
                        </div>
                    </div>

                    {/* Visual Cards View */}
                    {viewMode === 'cards' ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {rows.map((r) => (
                                <DerivativeCard
                                    key={r.key}
                                    item={r}
                                    isVideo={isVideo}
                                    onPreview={onPreview}
                                />
                            ))}
                        </div>
                    ) : (
                        /* Table View */
                        <div className="overflow-hidden rounded-xl border border-edge-subtle bg-white shadow-2xs">
                            <table className="w-full text-xs">
                                <thead>
                                    <tr className="border-b border-edge-subtle bg-ground text-ink-secondary">
                                        <th className="px-3 py-2 text-left font-semibold text-[11px] uppercase tracking-wider">
                                            {isVideo ? 'Rendition' : 'Size'}
                                        </th>
                                        <th className="px-3 py-2 text-left font-semibold text-[11px] uppercase tracking-wider">Dimensions</th>
                                        <th className="px-3 py-2 text-right font-semibold text-[11px] uppercase tracking-wider">Weight</th>
                                        <th className="px-3 py-2 text-right font-semibold text-[11px] uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-edge-subtle">
                                    {rows.map((r) => (
                                        <tr key={r.key} className="hover:bg-ground/60 transition-colors">
                                            <td className="px-3 py-2.5">
                                                <span className="flex items-center gap-2">
                                                    {r.group === 'Poster'
                                                        ? <ImageSquare size={13} className="shrink-0 text-ink-muted" />
                                                        : isVideo
                                                            ? <FilmSlate size={13} className="shrink-0 text-ink-muted" />
                                                            : <ImageSquare size={13} className="shrink-0 text-ink-muted" />}
                                                    <span className="font-semibold text-ink capitalize">{r.label}</span>
                                                    {r.isMaster && (
                                                        <span className="rounded-lg bg-ground-sunk border border-edge-subtle px-1.5 py-0.5 text-[9px] font-medium text-ink-secondary">master</span>
                                                    )}
                                                    {r.format && (
                                                        <span className="text-[10px] text-ink-muted font-mono uppercase bg-ground-sunk px-1 py-0.5 rounded-lg">{r.format}</span>
                                                    )}
                                                </span>
                                            </td>
                                            <td className="px-3 py-2.5 tabular-nums text-ink-secondary text-[11px]">
                                                {formatDimensions(r.width, r.height) || '—'}
                                                {r.bitrateKbps ? <span className="text-ink-muted"> · {r.bitrateKbps} kbps</span> : null}
                                                {r.durationSec ? <span className="text-ink-muted"> · {formatDuration(r.durationSec)}</span> : null}
                                            </td>
                                            <td className="px-3 py-2.5 text-right">
                                                <span className="flex items-center justify-end gap-2">
                                                    <span
                                                        aria-hidden
                                                        className="h-1.5 rounded-full bg-amber-500/70"
                                                        style={{ width: `${Math.max(4, ((r.bytes || 0) / maxBytes) * 44)}px` }}
                                                    />
                                                    <span className="tabular-nums font-semibold text-ink text-[11px]">{formatBytes(r.bytes)}</span>
                                                </span>
                                            </td>
                                            <td className="px-3 py-2.5 text-right">
                                                {r.url && (
                                                    <div className="flex items-center justify-end gap-1.5">
                                                        <a
                                                            href={r.url}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                            className="text-ink-muted hover:text-ink p-1"
                                                            title="Open stream"
                                                        >
                                                            <ArrowSquareOut size={13} />
                                                        </a>
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {dupes.length > 0 && (
                <p className="flex items-start gap-1.5 text-[10px] leading-relaxed text-amber-700 bg-amber-50/60 border border-amber-200/70 p-2.5 rounded-xl">
                    <Warning size={12} className="mt-0.5 shrink-0 text-amber-600" />
                    <span>
                        {dupes.length} derivative{dupes.length === 1 ? '' : 's'} duplicate a size already stored —
                        the ladder requested a width larger than the source, which was safely clamped.
                    </span>
                </p>
            )}

            {!compact && (
                <div className="flex items-center justify-between text-[11px] text-ink-muted pt-1">
                    <span className="flex items-center gap-1.5">
                        <HardDrives size={12} className="text-ink-muted" />
                        <span>{formatBytes(totalBytes)} preserved in Cloudflare R2 bucket</span>
                    </span>
                    <span className="text-emerald-700 font-medium">✓ CDN Cached Immutable</span>
                </div>
            )}
        </div>
    );
}
