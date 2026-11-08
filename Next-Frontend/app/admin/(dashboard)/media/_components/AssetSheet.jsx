'use client';

import { useState } from 'react';
import Image from 'next/image';
import {
    Copy, Check, Trash, FilmSlate, FileText, ImageSquare, Star,
    HardDrives, LinkSimple, ArrowSquareOut, LockKey, X, Tag as TagIcon,
    Sparkle, Info, ShieldCheck,
} from '@phosphor-icons/react';
import { Dialog, DialogContent } from '@/app/admin/components/ui/Dialog.jsx';
import { Button } from '@/app/admin/components/ui/Button.jsx';
import { Badge } from '@/app/admin/components/ui/Badge.jsx';
import AssetBreakdown, { derivativesOf } from '@/app/admin/components/AssetBreakdown.jsx';
import { formatBytes, formatDuration, formatDimensions } from '@/Utils/format.js';
import { cn } from '@/lib/utils.js';

const fieldInput = 'w-full rounded-xl border border-edge-subtle bg-white px-3.5 py-2 text-xs text-ink placeholder:text-ink-muted outline-none transition-all focus:border-accent focus:ring-2 focus:ring-accent/15';
const labelCls = 'mb-1.5 flex items-center justify-between text-[11px] font-semibold uppercase tracking-wider text-ink-secondary';

const urlOf = (m) => m?.cdnUrl || m?.publicUrl || m?.url || '';

const STATUS_TONE = {
    Ready: 'success',
    Processing: 'warning',
    Uploading: 'warning',
    Draft: 'neutral',
    Archived: 'danger',
};

/**
 * World-Class Studio Asset Inspector
 *
 * Implements a dual-panel studio viewport:
 * 1. Cinematic Media Stage: Dark matte canvas showing media with natural aspect-ratio,
 *    live badges, raw full-res external link, and a technical metadata bar.
 * 2. Pro Metadata & Pipeline Inspector: Segmented tabs for editorial details
 *    and CDN derivatives, with smooth localized scrolling and sticky action controls.
 */
export default function AssetSheet({ media, open, onClose, onSave, onDelete, saving }) {
    const [d, setDraft] = useState(media);
    const [copiedUrl, setCopiedUrl] = useState(false);
    const [copiedName, setCopiedName] = useState(false);
    const [tab, setTab] = useState('details');
    const [newTag, setNewTag] = useState('');

    const set = (patch) => setDraft((prev) => ({ ...prev, ...patch }));

    const url = urlOf(media);
    const isVideo = media.mediaType === 'Video';
    const isImage = media.mediaType === 'Image';
    const { rows: derivatives } = derivativesOf(media);

    const copyUrl = async () => {
        if (!url) return;
        try {
            await navigator.clipboard.writeText(url);
            setCopiedUrl(true);
            setTimeout(() => setCopiedUrl(false), 2000);
        } catch { /* clipboard unavailable */ }
    };

    const copyName = async () => {
        const name = media.originalFileName || media.title || '';
        if (!name) return;
        try {
            await navigator.clipboard.writeText(name);
            setCopiedName(true);
            setTimeout(() => setCopiedName(false), 2000);
        } catch { /* clipboard unavailable */ }
    };

    const handleAddTag = () => {
        const clean = newTag.trim().replace(/^#/, '');
        if (!clean) return;
        const current = d.tags || [];
        if (!current.includes(clean)) {
            set({ tags: [...current, clean] });
        }
        setNewTag('');
    };

    const handleRemoveTag = (tagToRemove) => {
        set({ tags: (d.tags || []).filter((t) => t !== tagToRemove) });
    };

    const handleTagKeyDown = (e) => {
        if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            handleAddTag();
        }
    };

    return (
        <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
            <DialogContent
                hideCloseButton
                className="max-w-5xl xl:max-w-6xl w-[95vw] h-[88vh] max-h-[820px] min-h-[520px] p-0 overflow-hidden scrollbar-none rounded-xl md:rounded-xl border border-edge-subtle bg-white shadow-2xl flex flex-col gap-0"
            >
                <div className="flex flex-col lg:flex-row h-full w-full min-h-0 min-w-0 overflow-hidden">
                    {/* Left Column: Cinematic Media Stage */}
                    <div className="flex flex-col w-full lg:w-[54%] xl:w-[56%] h-[42vh] lg:h-full min-w-0 min-h-0 bg-ink text-white border-b lg:border-b-0 lg:border-r border-ink/80 shrink-0">
                        {/* Stage Canvas */}
                        <div className="relative flex-1 min-h-0 w-full flex items-center justify-center p-4 sm:p-6 overflow-hidden bg-gradient-to-b from-ink/80 via-ink to-ink">
                            {/* Ambient subtle backdrop grid */}
                            <div className="absolute inset-0 bg-[radial-gradient(#262626_1px,transparent_1px)] [background-size:16px_16px] opacity-40 pointer-events-none" />

                            {/* Top Stage Badges & Actions Overlay */}
                            <div className="absolute left-3.5 top-3.5 right-3.5 flex items-center justify-between gap-2 z-10 pointer-events-auto">
                                <div className="flex flex-wrap items-center gap-1.5 min-w-0">
                                    <Badge size="sm" variant={STATUS_TONE[media.status] || 'neutral'} dot>
                                        {media.status}
                                    </Badge>
                                    <span className="inline-flex items-center rounded-full bg-ink/90 border border-ink/80 px-2.5 py-0.5 text-[10px] font-medium text-stone-300 backdrop-blur-md">
                                        {media.ownerType === 'System' ? 'Unassigned' : media.ownerType}
                                    </span>
                                    {media.featured && (
                                        <Badge size="sm" variant="gold">
                                            <Star size={10} weight="fill" /> Featured
                                        </Badge>
                                    )}
                                    {media.visibility === 'Private' && (
                                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/20 border border-amber-500/40 px-2 py-0.5 text-[10px] font-medium text-amber-300">
                                            <LockKey size={10} weight="fill" /> Private
                                        </span>
                                    )}
                                </div>

                                <div className="flex items-center gap-1.5 shrink-0">
                                    {url && (
                                        <a
                                            href={url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center justify-center h-7 w-7 rounded-lg bg-ink/90 hover:bg-ink text-stone-300 hover:text-white transition-colors border border-ink/70 shadow-sm backdrop-blur-md"
                                            title="Open full resolution raw asset in new tab"
                                        >
                                            <ArrowSquareOut size={13} />
                                        </a>
                                    )}
                                </div>
                            </div>

                            {/* Media Viewport */}
                            <div className="relative w-full h-full flex items-center justify-center min-w-0 min-h-0 pt-7">
                                {isImage && url ? (
                                    <div className="relative w-full h-full max-h-full max-w-full">
                                        <Image
                                            src={url}
                                            alt={media.altText || media.title || 'asset'}
                                            fill
                                            priority
                                            sizes="(max-width: 1024px) 100vw, 650px"
                                            className="object-contain drop-shadow-2xl transition-opacity duration-300"
                                            {...(media.blurDataURL ? { placeholder: 'blur', blurDataURL: media.blurDataURL } : {})}
                                        />
                                    </div>
                                ) : isVideo && (media.video?.webUrl || media.video?.sourceUrl || url) ? (
                                    <div className="relative w-full h-full flex items-center justify-center">
                                        <video
                                            src={media.video?.webUrl || media.video?.sourceUrl || url}
                                            poster={media.video?.posterUrl}
                                            controls
                                            preload="metadata"
                                            className="max-h-full max-w-full rounded-xl object-contain shadow-2xl bg-black"
                                        />
                                    </div>
                                ) : isVideo && media.video?.posterUrl ? (
                                    <div className="relative w-full h-full flex items-center justify-center">
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img
                                            src={media.video.posterUrl}
                                            alt={media.title || 'video poster'}
                                            className="max-h-full max-w-full rounded-xl object-contain shadow-2xl"
                                        />
                                        <span className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                            <span className="rounded-full bg-black/60 p-3 text-white backdrop-blur-sm">
                                                <FilmSlate size={28} />
                                            </span>
                                        </span>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center gap-2.5 text-ink-muted">
                                        {isVideo ? (
                                            <FilmSlate size={44} weight="thin" />
                                        ) : media.mediaType === 'Document' ? (
                                            <FileText size={44} weight="thin" />
                                        ) : (
                                            <ImageSquare size={44} weight="thin" />
                                        )}
                                        <span className="text-xs font-mono text-ink-muted">
                                            {media.mediaType || 'Asset Preview'}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Technical Metadata & Quick Action Strip */}
                        <div className="shrink-0 bg-ink/95 border-t border-ink/80 p-3.5 sm:p-4 space-y-3">
                            {/* File Name Row */}
                            <div className="flex items-center justify-between gap-2.5 min-w-0">
                                <div className="flex items-center gap-2 min-w-0 flex-1">
                                    <span className="shrink-0 flex items-center justify-center h-6 w-6 rounded-lg bg-ink text-ink-muted">
                                        {isVideo ? <FilmSlate size={12} /> : <ImageSquare size={12} />}
                                    </span>
                                    <span
                                        className="font-mono text-xs text-stone-200 font-medium truncate min-w-0 flex-1"
                                        title={media.originalFileName || media.title || 'asset'}
                                    >
                                        {media.originalFileName || media.title || 'Untitled Asset'}
                                    </span>
                                </div>
                                <button
                                    type="button"
                                    onClick={copyName}
                                    className="shrink-0 inline-flex items-center gap-1 rounded-lg bg-ink/80 hover:bg-stone-700 px-2 py-1 text-[10px] font-medium text-stone-300 transition-colors"
                                    title="Copy original filename"
                                >
                                    {copiedName ? (
                                        <>
                                            <Check size={11} className="text-emerald-400" />
                                            <span className="text-emerald-400">Copied</span>
                                        </>
                                    ) : (
                                        <>
                                            <Copy size={11} />
                                            <span>Copy Name</span>
                                        </>
                                    )}
                                </button>
                            </div>

                            {/* 4-Card Quick Specs Grid */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                <div className="rounded-lg bg-ink/70 border border-ink/70 px-2.5 py-1.5 min-w-0">
                                    <p className="text-[9px] uppercase tracking-wider text-ink-muted font-semibold truncate">Dimensions</p>
                                    <p className="text-xs font-mono text-stone-200 font-medium mt-0.5 truncate">
                                        {formatDimensions(media.width, media.height) || (media.duration ? formatDuration(media.duration) : '—')}
                                    </p>
                                </div>
                                <div className="rounded-lg bg-ink/70 border border-ink/70 px-2.5 py-1.5 min-w-0">
                                    <p className="text-[9px] uppercase tracking-wider text-ink-muted font-semibold truncate">Size</p>
                                    <p className="text-xs font-mono text-stone-200 font-medium mt-0.5 truncate">
                                        {formatBytes(media.fileSize)}
                                    </p>
                                </div>
                                <div className="rounded-lg bg-ink/70 border border-ink/70 px-2.5 py-1.5 min-w-0">
                                    <p className="text-[9px] uppercase tracking-wider text-ink-muted font-semibold truncate">Format</p>
                                    <p className="text-xs font-mono text-stone-200 font-medium mt-0.5 truncate">
                                        {media.mimeType ? media.mimeType.split('/')[1]?.toUpperCase() : (media.mediaType || '—')}
                                    </p>
                                </div>
                                <div className="rounded-lg bg-ink/70 border border-ink/70 px-2.5 py-1.5 min-w-0">
                                    <p className="text-[9px] uppercase tracking-wider text-ink-muted font-semibold truncate">Uploaded</p>
                                    <p className="text-xs font-mono text-stone-200 font-medium mt-0.5 truncate">
                                        {media.createdAt
                                            ? new Date(media.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
                                            : '—'}
                                    </p>
                                </div>
                            </div>

                            {/* CDN URL Bar */}
                            <div className="flex items-center gap-2 rounded-xl bg-ink/90 border border-ink px-3 py-2 text-xs min-w-0">
                                <LinkSimple size={13} className="shrink-0 text-ink-muted" />
                                <span
                                    className="font-mono text-[11px] text-ink-muted truncate flex-1 min-w-0 select-all"
                                    title={url}
                                >
                                    {url || 'No CDN URL generated'}
                                </span>
                                <button
                                    type="button"
                                    onClick={copyUrl}
                                    className={cn(
                                        'shrink-0 flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium transition-all shadow-sm',
                                        copiedUrl
                                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                            : 'bg-accent/20 hover:bg-accent-hover text-red-300 border border-accent/40 active:scale-95'
                                    )}
                                >
                                    {copiedUrl ? <Check size={12} /> : <Copy size={12} />}
                                    <span>{copiedUrl ? 'Copied!' : 'Copy CDN URL'}</span>
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Metadata Editor & Derivatives */}
                    <div className="flex flex-col w-full lg:w-[46%] xl:w-[44%] h-[58vh] lg:h-full min-w-0 min-h-0 bg-white overflow-hidden">
                        {/* Header with Tabs & Close */}
                        <div className="shrink-0 px-5 sm:px-6 py-3.5 border-b border-edge-subtle bg-ground/70 flex items-center justify-between gap-3">
                            {/* Segmented Tab Controls */}
                            <div className="flex items-center gap-1 rounded-xl border border-edge-subtle bg-white p-1 shadow-sm">
                                <button
                                    type="button"
                                    onClick={() => setTab('details')}
                                    className={cn(
                                        'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all',
                                        tab === 'details'
                                            ? 'bg-accent text-white shadow-sm'
                                            : 'text-ink-secondary hover:text-ink hover:bg-ground'
                                    )}
                                >
                                    <FileText size={13} weight={tab === 'details' ? 'bold' : 'regular'} />
                                    <span>Details & Metadata</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setTab('sizes')}
                                    className={cn(
                                        'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all',
                                        tab === 'sizes'
                                            ? 'bg-accent text-white shadow-sm'
                                            : 'text-ink-secondary hover:text-ink hover:bg-ground'
                                    )}
                                >
                                    <HardDrives size={13} weight={tab === 'sizes' ? 'bold' : 'regular'} />
                                    <span>Derivatives</span>
                                    {derivatives.length > 0 && (
                                        <span
                                            className={cn(
                                                'ml-0.5 rounded-full px-1.5 py-0.2 text-[10px] font-mono',
                                                tab === 'sizes' ? 'bg-white/25 text-white' : 'bg-ground-sunk/80 text-ink-secondary'
                                            )}
                                        >
                                            {derivatives.length}
                                        </span>
                                    )}
                                </button>
                            </div>

                            {/* Modal Close Button */}
                            <button
                                type="button"
                                onClick={onClose}
                                className="flex items-center justify-center h-8 w-8 rounded-xl text-ink-muted hover:text-ink-secondary hover:bg-ground-sunk/60 transition-colors focus:outline-none focus:ring-2 focus:ring-accent/20"
                                title="Close Inspector"
                            >
                                <X size={16} />
                                <span className="sr-only">Close</span>
                            </button>
                        </div>

                        {/* Scrollable Form Body with Subtle Studio Scrollbar */}
                        <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-5 space-y-3 scrollbar-thin scrollbar-thumb-stone-200 hover:scrollbar-thumb-stone-300 scrollbar-track-transparent">
                            {tab === 'details' ? (
                                <>
                                    {/* Unassigned Warning Banner */}
                                    {media.ownerType === 'System' && (
                                        <div className="flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50/80 p-2.5 text-xs text-amber-900">
                                            <LinkSimple size={15} weight="bold" className="mt-0.5 shrink-0 text-amber-600" />
                                            <div className="space-y-0.5 min-w-0">
                                                <p className="font-semibold text-amber-800 text-xs">Unassigned Asset Pool</p>
                                                <p className="text-[11px] leading-relaxed text-amber-700">
                                                    Not linked to any wedding story or page. Assign it from Portfolio Curation to display publicly.
                                                </p>
                                            </div>
                                        </div>
                                    )}

                                    {/* Title Field */}
                                    <div>
                                        <label className={labelCls}>
                                            <span>Title</span>
                                            <span className="text-[10px] font-normal text-ink-muted">Display name in admin & galleries</span>
                                        </label>
                                        <input
                                            className={fieldInput}
                                            value={d.title || ''}
                                            onChange={(e) => set({ title: e.target.value })}
                                            placeholder="e.g. Aditya & Janvi Haldi Ceremony"
                                        />
                                    </div>

                                    {/* Alt Text Field */}
                                    <div>
                                        <label className={labelCls}>
                                            <span>Alt Text</span>
                                            <span className="text-[10px] font-normal text-ink-muted">Google SEO & Accessibility</span>
                                        </label>
                                        <input
                                            className={fieldInput}
                                            value={d.altText || ''}
                                            onChange={(e) => set({ altText: e.target.value })}
                                            placeholder="e.g. Bride wearing yellow saree smiling during flower shower at Udaipur palace"
                                        />
                                        <p className="mt-1 text-[10px] text-ink-muted leading-snug">
                                            Critical for ranking high in Google Wedding Photography searches and screen readers.
                                        </p>
                                    </div>

                                    {/* Caption / Description */}
                                    <div>
                                        <label className={labelCls}>
                                            <span>Caption / Story Note</span>
                                            <span className="text-[10px] font-normal text-ink-muted">Optional</span>
                                        </label>
                                        <textarea
                                            rows={2}
                                            className={fieldInput}
                                            value={d.caption || ''}
                                            onChange={(e) => set({ caption: e.target.value })}
                                            placeholder="Write an editorial snippet or backdrop context for this moment..."
                                        />
                                    </div>

                                    {/* Interactive Tag Manager */}
                                    <div>
                                        <label className={labelCls}>
                                            <span>Tags & Keywords</span>
                                            <span className="text-[10px] font-normal text-ink-muted">Hit Enter or Comma to add</span>
                                        </label>
                                        <div className="rounded-xl border border-edge-subtle bg-white p-1.5 focus-within:border-accent focus-within:ring-2 focus-within:ring-accent/15">
                                            <div className="flex flex-wrap items-center gap-1.5">
                                                {(d.tags || []).map((t) => (
                                                    <span
                                                        key={t}
                                                        className="inline-flex items-center gap-1 rounded-lg bg-ground-sunk border border-edge-subtle px-2 py-0.5 text-xs text-ink font-medium group transition-all"
                                                    >
                                                        <span>#{t}</span>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleRemoveTag(t)}
                                                            className="text-ink-muted hover:text-accent-ink rounded-lg p-0.5 transition-colors"
                                                            title={`Remove ${t}`}
                                                        >
                                                            <X size={10} weight="bold" />
                                                        </button>
                                                    </span>
                                                ))}
                                                <input
                                                    className="flex-1 min-w-[120px] bg-transparent px-1 py-0.5 text-xs text-ink placeholder:text-ink-muted outline-none"
                                                    value={newTag}
                                                    onChange={(e) => setNewTag(e.target.value)}
                                                    onKeyDown={handleTagKeyDown}
                                                    onBlur={handleAddTag}
                                                    placeholder={(d.tags || []).length === 0 ? 'Type tag and press Enter (e.g. Udaipur, Haldi)...' : 'Add tag...'}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Visibility & Curation Switches */}
                                    <div className="pt-1">
                                        <span className={labelCls}>Placement & Curation</span>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1">
                                            {/* Featured Toggle Card */}
                                            <label
                                                className={cn(
                                                    'flex items-center gap-2.5 rounded-xl border px-3 py-2 cursor-pointer transition-all',
                                                    d.featured
                                                        ? 'border-amber-300 bg-amber-50/60 shadow-xs'
                                                        : 'border-edge-subtle bg-white hover:bg-ground/60'
                                                )}
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={!!d.featured}
                                                    className="h-3.5 w-3.5 accent-red-500 shrink-0 cursor-pointer"
                                                    onChange={(e) => set({ featured: e.target.checked })}
                                                />
                                                <div className="min-w-0 select-none flex-1">
                                                    <div className="flex items-center gap-1.5">
                                                        <Star size={12} weight="fill" className={d.featured ? 'text-amber-500' : 'text-ink-muted'} />
                                                        <span className="text-xs font-semibold text-ink">Featured Asset</span>
                                                    </div>
                                                    <p className="text-[10px] text-ink-muted truncate">
                                                        Reels & portfolio highlights
                                                    </p>
                                                </div>
                                            </label>

                                            {/* Private Visibility Toggle Card */}
                                            <label
                                                className={cn(
                                                    'flex items-center gap-2.5 rounded-xl border px-3 py-2 cursor-pointer transition-all',
                                                    d.visibility === 'Private'
                                                        ? 'border-rose-300 bg-rose-50/40 shadow-xs'
                                                        : 'border-edge-subtle bg-white hover:bg-ground/60'
                                                )}
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={d.visibility === 'Private'}
                                                    className="h-3.5 w-3.5 accent-red-500 shrink-0 cursor-pointer"
                                                    onChange={(e) => set({ visibility: e.target.checked ? 'Private' : 'Public' })}
                                                />
                                                <div className="min-w-0 select-none flex-1">
                                                    <div className="flex items-center gap-1.5">
                                                        <LockKey size={12} weight="fill" className={d.visibility === 'Private' ? 'text-rose-600' : 'text-ink-muted'} />
                                                        <span className="text-xs font-semibold text-ink">Private Visibility</span>
                                                    </div>
                                                    <p className="text-[10px] text-ink-muted truncate">
                                                        Direct link only, unlisted
                                                    </p>
                                                </div>
                                            </label>
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <AssetBreakdown media={media} />
                            )}
                        </div>

                        {/* Sticky Action Footer */}
                        <div className="shrink-0 px-5 sm:px-6 py-3 border-t border-edge-subtle bg-ground/80 backdrop-blur flex items-center justify-between gap-3">
                            <Button
                                variant="danger"
                                size="sm"
                                icon={Trash}
                                onClick={() => onDelete(media)}
                            >
                                Delete Asset
                            </Button>

                            <div className="flex items-center gap-2">
                                <Button variant="secondary" size="sm" onClick={onClose}>
                                    Cancel
                                </Button>
                                <Button
                                    variant="primary"
                                    size="sm"
                                    loading={saving}
                                    icon={Check}
                                    onClick={() => onSave(d)}
                                >
                                    Save Changes
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}

export { urlOf, STATUS_TONE };
