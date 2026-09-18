'use client';

import { useMemo } from 'react';
import {
    FilmSlate, ImageSquare, HardDrives, SpeakerSimpleSlash,
    SpeakerHigh, Lightning, Warning,
} from '@phosphor-icons/react';
import { formatBytes, formatDuration, formatDimensions } from '@/Utils/format.js';
import { cn } from '@/lib/utils.js';

/**
 * Every derivative of one asset, with its real size.
 *
 * The admin previously showed a single number — the master's `fileSize` — even
 * though the worker records exact `bytes` for every image variant, every video
 * rendition and both poster sizes. All of it already ships in the media list
 * response (`listMedia` has no projection), so this reads what is on the wire;
 * it computes nothing server-side and costs no extra request.
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
        // The base poster is a real object in the bucket; omitting it made the
        // total under-report by exactly its size.
        if (media.video?.posterStorageKey) {
            rows.push({
                key: media.video.posterStorageKey,
                group: 'Poster',
                label: 'poster',
                format: (media.video.posterStorageKey.split('.').pop() || '').toLowerCase(),
                bytes: media.video.posterBytes,
                url: media.video.posterUrl,
            });
        }
        for (const p of media.video?.posterVariants || []) {
            rows.push({
                key: p.storageKey || `poster-${p.width}`,
                group: 'Poster',
                label: `poster ${p.label || p.width}`,
                width: p.width,
                height: p.height,
                format: p.format,
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
                format: v.format,
                bytes: v.bytes,
                url: v.url,
            });
        }
    }

    // The `source` rendition IS the master file, so counting both would double it.
    const derivativeBytes = rows.filter((r) => !r.isMaster).reduce((sum, r) => sum + (r.bytes || 0), 0);
    const totalBytes = masterBytes + derivativeBytes;

    // What a visitor actually downloads: the web rendition for video, or the
    // mid-ladder variant for an image — not the master.
    const delivered = media.mediaType === 'Video'
        ? rows.find((r) => r.label === 'web')
        : rows.slice().sort((a, b) => Math.abs((a.width || 0) - 1024) - Math.abs((b.width || 0) - 1024))[0];

    return { rows, masterBytes, totalBytes, deliveredBytes: delivered?.bytes || 0 };
}

/**
 * Two derivatives that ended up the same pixel size are byte-for-byte
 * duplicates in the bucket. This happens when the ladder asks for a width
 * larger than the source and `withoutEnlargement` clamps it down.
 */
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
        <div className="rounded-xl border border-stone-200 bg-stone-50/60 p-3 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-stone-500">{label}</p>
            <p className="mt-1 text-sm font-semibold tabular-nums text-stone-900">{value}</p>
            {hint && <p className="mt-0.5 text-[10px] text-stone-500">{hint}</p>}
        </div>
    );
}

export default function AssetBreakdown({ media, className = '', compact = false }) {
    const { rows, masterBytes, totalBytes, deliveredBytes } = useMemo(() => derivativesOf(media), [media]);
    const dupes = useMemo(() => duplicateWidths(rows), [rows]);

    if (!media) return null;

    const isVideo = media.mediaType === 'Video';
    const processing = media.status === 'Processing' || media.status === 'Uploading';
    const saving = masterBytes && deliveredBytes ? Math.round((1 - deliveredBytes / masterBytes) * 100) : null;
    const maxBytes = Math.max(...rows.map((r) => r.bytes || 0), 1);

    return (
        <div className={cn('space-y-4 font-sans', className)}>
            {!compact && (
                <div className="grid grid-cols-3 gap-2.5">
                    <Stat label="Original" value={formatBytes(masterBytes)}
                        hint={formatDimensions(media.width, media.height) || undefined} />
                    <Stat label="Total stored" value={formatBytes(totalBytes)}
                        hint={`${rows.filter((r) => !r.isMaster).length} derivative${rows.filter((r) => !r.isMaster).length === 1 ? '' : 's'}`} />
                    <Stat label="Delivered" value={deliveredBytes ? formatBytes(deliveredBytes) : '—'}
                        hint={saving !== null && saving > 0 ? `${saving}% lighter` : undefined} />
                </div>
            )}

            {processing && (
                <p className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs text-amber-800 break-words">
                    <Lightning size={14} weight="fill" className="shrink-0 text-amber-600" />
                    Still processing — derivatives appear once the worker finishes.
                </p>
            )}

            {rows.length === 0 && !processing && (
                <div className="rounded-xl border border-dashed border-stone-200 bg-stone-50/50 p-6 text-center text-xs text-stone-500">
                    {media.mimeType?.includes('svg')
                        ? 'Vector asset — served as-is, no size ladder needed.'
                        : media.mimeType?.includes('gif')
                            ? 'Animated GIF — kept intact, resizing would flatten the animation.'
                            : 'No derivatives recorded for this asset.'}
                </div>
            )}

            {rows.length > 0 && (
                <div className="overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm">
                    <table className="w-full text-xs">
                        <thead>
                            <tr className="border-b border-stone-200 bg-stone-50/80 text-stone-600">
                                <th className="px-3 py-2 text-left font-semibold text-[11px] uppercase tracking-wider">
                                    {isVideo ? 'Rendition' : 'Size'}
                                </th>
                                <th className="px-3 py-2 text-left font-semibold text-[11px] uppercase tracking-wider">Dimensions</th>
                                <th className="px-3 py-2 text-right font-semibold text-[11px] uppercase tracking-wider">Weight</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-stone-100">
                            {rows.map((r) => (
                                <tr key={r.key} className="hover:bg-stone-50/60 transition-colors">
                                    <td className="px-3 py-2.5">
                                        <span className="flex items-center gap-2">
                                            {r.group === 'Poster'
                                                ? <ImageSquare size={13} className="shrink-0 text-stone-400" />
                                                : isVideo
                                                    ? <FilmSlate size={13} className="shrink-0 text-stone-400" />
                                                    : <ImageSquare size={13} className="shrink-0 text-stone-400" />}
                                            <span className="font-medium text-stone-800">{r.label}</span>
                                            {r.isMaster && (
                                                <span className="rounded-md bg-stone-100 border border-stone-200/80 px-1.5 py-0.5 text-[9px] font-medium text-stone-600">master</span>
                                            )}
                                            {r.format && r.format !== 'mp4' && (
                                                <span className="text-[10px] text-stone-400 font-mono uppercase">{r.format}</span>
                                            )}
                                            {r.hasAudio === false && (
                                                <SpeakerSimpleSlash size={12} className="text-stone-400" title="silent" />
                                            )}
                                            {r.hasAudio === true && (
                                                <SpeakerHigh size={12} className="text-stone-400" title="has audio" />
                                            )}
                                        </span>
                                    </td>
                                    <td className="px-3 py-2.5 tabular-nums text-stone-600 text-[11px]">
                                        {formatDimensions(r.width, r.height) || '—'}
                                        {r.bitrateKbps ? <span className="text-stone-400"> · {r.bitrateKbps} kbps</span> : null}
                                        {r.durationSec ? <span className="text-stone-400"> · {formatDuration(r.durationSec)}</span> : null}
                                    </td>
                                    <td className="px-3 py-2.5 text-right">
                                        <span className="flex items-center justify-end gap-2">
                                            <span
                                                aria-hidden
                                                className="h-1.5 rounded-full bg-red-500/70"
                                                style={{ width: `${Math.max(4, ((r.bytes || 0) / maxBytes) * 44)}px` }}
                                            />
                                            <span className="tabular-nums font-medium text-stone-800 text-[11px]">{formatBytes(r.bytes)}</span>
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {dupes.length > 0 && (
                <p className="flex items-start gap-1.5 text-[10px] leading-relaxed text-amber-700 break-words">
                    <Warning size={11} className="mt-px shrink-0" />
                    {dupes.length} derivative{dupes.length === 1 ? '' : 's'} duplicate a size already stored —
                    the ladder asked for a width larger than the source, so it was clamped.
                </p>
            )}

            {!compact && (
                <p className="flex items-center gap-1.5 text-[10px] text-stone-500">
                    <HardDrives size={11} />
                    {formatBytes(totalBytes)} in R2 · served immutable from the CDN
                </p>
            )}
        </div>
    );
}
