'use client';

import { useState, useEffect, useMemo, useCallback, useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import {
    X, Trash, FilmSlate, ImageSquare, ArrowSquareOut, Star,
    Check, Copy, Plus, CalendarBlank, MapPin,
} from '@phosphor-icons/react';
import { Button } from '@/app/admin/components/ui/Button.jsx';
import { Badge } from '@/app/admin/components/ui/Badge.jsx';
import AssetBreakdown, { derivativesOf } from '@/app/admin/components/AssetBreakdown.jsx';
import { formatBytes, formatDuration } from '@/Utils/format.js';
import { cn } from '@/lib/utils.js';
import { posterOf, nameOf } from './PortfolioCard.jsx';
import TagPicker from '@/app/admin/components/taxonomy/TagPicker.jsx';
import useTaxonomy from '@/Hooks/useTaxonomy.jsx';
import MediaControls from './MediaControls.jsx';

const api_url = process.env.NEXT_PUBLIC_API_URL;

const inputClass = 'w-full rounded-xl border border-edge-subtle bg-white px-3.5 py-2.5 text-sm text-ink placeholder:text-ink-muted outline-none transition-all focus:border-accent focus:ring-2 focus:ring-accent/15';
const labelClass = 'mb-1.5 block text-xs font-semibold text-ink-secondary';
const sectionHeaderClass = 'text-xs font-semibold uppercase tracking-wider text-ink-muted';

/** `<input type="date">` needs yyyy-mm-dd; the API returns an ISO timestamp. */
const toDateInput = (d) => {
    if (!d) return '';
    const dt = new Date(d);
    return Number.isNaN(dt.getTime()) ? '' : dt.toISOString().slice(0, 10);
};

const initialForm = (item) => ({
    title: item.title || '',
    caption: item.caption || '',
    // Tags are ids from the tag system; the item's `tags` / `eventGroup` strings
    // are copies the server writes from them.
    tagIds: (item.tagIds || []).map(String),
    shootDate: toDateInput(item.shootDate),
    location: { ...(item.location || {}) },
    generalPriority: item.generalPriority ?? 0,
    isHero: Boolean(item.isHero),
    heroPriority: item.heroPriority ?? 0,
    status: item.status || 'Published',
    credits: (item.credits || []).map((c) => ({ name: c.name || '', role: c.role || '' })),
});

const noopSubscribe = () => () => {};

export default function EditDrawer({ item, saving, onClose, onSave, onDelete, onItemChanged }) {
    // true only in the browser (the drawer portals into document.body); no effect needed.
    const mounted = useSyncExternalStore(noopSubscribe, () => true, () => false);
    const [form, setForm] = useState(() => initialForm(item));
    const [activeTab, setActiveTab] = useState('details'); // 'details' | 'derivatives'
    const taxonomy = useTaxonomy();
    const [mediaDoc, setMediaDoc] = useState(item?.media || null);
    const [copiedUrl, setCopiedUrl] = useState(false);

    const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
    const setLoc = (k, v) => setForm((f) => ({ ...f, location: { ...f.location, [k]: v } }));

    // Fetch full Media doc if mediaId exists (to retrieve live renditions & variants)
    const mediaId = item?.mediaId || item?.media?._id || item?.media?.mediaId || (typeof item?.media === 'string' ? item?.media : null);
    useEffect(() => {
        if (!mediaId) return;
        let isMounted = true;

        async function fetchMedia() {
            try {
                const res = await fetch(`${api_url}/api/admin/media/${mediaId}`, { credentials: 'include' });
                if (res.ok) {
                    const data = await res.json();
                    if (data.media && isMounted) {
                        setMediaDoc(data.media);
                    }
                }
            } catch (err) {
                console.warn('Failed to fetch media for EditDrawer:', err);
            }
        }
        fetchMedia();

        return () => {
            isMounted = false;
        };
    }, [mediaId]);

    const submit = useCallback(() => {
        onSave(item._id, {
            ...form,
            shootDate: form.shootDate || null,
            generalPriority: Number(form.generalPriority) || 0,
            heroPriority: Number(form.heroPriority) || 0,
            isHero: item.kind === 'Video' ? form.isHero : false,
            credits: form.credits.filter((c) => c.name || c.role),
        });
    }, [item._id, item.kind, form, onSave]);

    // Keyboard Shortcuts: [Esc] to Close, [Cmd+S] / [Ctrl+S] to Save
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                onClose();
            } else if ((e.metaKey || e.ctrlKey) && e.key === 's') {
                e.preventDefault();
                submit();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [submit, onClose]);

    const isVideo = item.kind === 'Video' || item.mediaType === 'Video' || mediaDoc?.mediaType === 'Video';
    const poster = posterOf(item) || mediaDoc?.video?.posterUrl || '';

    // Primary video stream URL
    const videoStreamUrl = item.render?.webUrl || item.render?.sourceUrl || mediaDoc?.video?.webUrl || mediaDoc?.video?.sourceUrl || mediaDoc?.cdnUrl || mediaDoc?.publicUrl || '';
    // Primary photo URL
    const photoUrl = item.render?.imageUrl || mediaDoc?.cdnUrl || mediaDoc?.publicUrl || poster || '';

    const publicHref = isVideo ? `/films/${item._id}` : `/photos/${item._id}`;

    const { rows: derivatives } = useMemo(() => derivativesOf(mediaDoc || item.media), [mediaDoc, item.media]);

    const copyDirectUrl = async () => {
        const target = isVideo ? videoStreamUrl : photoUrl;
        if (!target) return;
        try {
            await navigator.clipboard.writeText(target);
            setCopiedUrl(true);
            setTimeout(() => setCopiedUrl(false), 2000);
        } catch { /* clipboard error */ }
    };

    if (!mounted) return null;

    return createPortal(
        <div className="fixed inset-0 z-[100] flex justify-end">
            {/* Clean Studio Scrim Backdrop covering the entire viewport */}
            <div
                aria-label="Close editor"
                onClick={onClose}
                className="fixed inset-0 bg-ink/40 backdrop-blur-[2px] transition-opacity animate-in fade-in duration-200 cursor-pointer"
            />

            {/* Slide-in Right Workstation Drawer */}
            <aside className="relative flex h-full w-full max-w-2xl sm:max-w-3xl flex-col bg-ground border-l border-edge-subtle shadow-2xl transition-transform animate-in slide-in-from-right duration-300 ease-out z-10 font-sans">
                {/* Header */}
                <header className="flex shrink-0 flex-col border-b border-edge-subtle bg-white px-6 py-4 space-y-4 shadow-xs">
                    <div className="flex items-center justify-between gap-4">
                        <div className="min-w-0 flex items-center gap-3">
                            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-ink text-white shrink-0 shadow-sm">
                                {isVideo ? <FilmSlate size={18} weight="fill" /> : <ImageSquare size={18} weight="fill" />}
                            </span>
                            <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                    <h3 className="truncate text-base font-semibold text-ink">
                                        {nameOf(item)}
                                    </h3>
                                    <Badge size="sm" variant={form.status === 'Published' ? 'success' : 'neutral'} dot>
                                        {form.status}
                                    </Badge>
                                    {form.isHero && isVideo && (
                                        <Badge size="sm" variant="gold">
                                            <Star size={11} weight="fill" /> Hero Reel
                                        </Badge>
                                    )}
                                </div>
                                <p className="text-xs text-ink-muted mt-0.5">
                                    <span className="font-medium text-ink-secondary">{item.kind} Asset</span>
                                    {item.eventGroup && (
                                        <>
                                            <span className="mx-1.5 text-stone-300">·</span>
                                            <span className="text-accent-ink font-medium">{item.eventGroup}</span>
                                        </>
                                    )}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <Button
                                variant="ghost"
                                size="iconSm"
                                onClick={onClose}
                                aria-label="Close drawer"
                                className="hover:bg-ground-sunk text-ink-muted hover:text-ink rounded-xl"
                            >
                                <X size={18} />
                            </Button>
                        </div>
                    </div>

                    {/* Navigation Tabs */}
                    <div className="flex items-center gap-2 border-t border-edge-subtle pt-3">
                        <button
                            type="button"
                            onClick={() => setActiveTab('details')}
                            className={cn(
                                'flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer',
                                activeTab === 'details'
                                    ? 'bg-accent text-white shadow-xs'
                                    : 'bg-ground-sunk text-ink-secondary hover:text-ink hover:bg-ground-sunk/70'
                            )}
                        >
                            Details & Metadata
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveTab('derivatives')}
                            className={cn(
                                'flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer',
                                activeTab === 'derivatives'
                                    ? 'bg-accent text-white shadow-xs'
                                    : 'bg-ground-sunk text-ink-secondary hover:text-ink hover:bg-ground-sunk/70'
                            )}
                        >
                            Pipeline & Derivatives
                            {derivatives.length > 0 && (
                                <span className={cn(
                                    'px-1.5 py-0.5 rounded-full text-[10px] font-bold',
                                    activeTab === 'derivatives' ? 'bg-white/20 text-white' : 'bg-ground-sunk text-ink-secondary'
                                )}>
                                    {derivatives.length}
                                </span>
                            )}
                        </button>
                    </div>
                </header>

                {/* Content Body */}
                <div className="min-h-0 flex-1 overflow-y-auto p-6 space-y-5 scrollbar-thin">
                    {activeTab === 'details' ? (
                        <>
                            {/* Cinematic Media Stage */}
                            <div className="space-y-2">
                                <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-ink shadow-md flex items-center justify-center group">
                                    {isVideo ? (
                                        item.render?.embedUrl ? (
                                            // A YouTube / Vimeo film: preview it in the host's player.
                                            <iframe
                                                src={item.render.embedUrl}
                                                title={item.external?.title || 'Film'}
                                                allow="autoplay; fullscreen; picture-in-picture"
                                                allowFullScreen
                                                className="h-full w-full border-0"
                                            />
                                        ) : videoStreamUrl ? (
                                            <video
                                                controls
                                                playsInline
                                                poster={poster}
                                                src={videoStreamUrl}
                                                className="h-full w-full object-contain"
                                            />
                                        ) : poster ? (
                                            <Image
                                                src={poster}
                                                alt={item.title || 'preview'}
                                                fill
                                                unoptimized
                                                sizes="(max-width: 768px) 100vw, 600px"
                                                className="object-contain"
                                            />
                                        ) : (
                                            <span className="flex flex-col items-center justify-center text-ink-muted gap-2">
                                                <FilmSlate size={36} className="text-ink-secondary" />
                                                <span className="text-xs">No video stream linked</span>
                                            </span>
                                        )
                                    ) : photoUrl ? (
                                        <Image
                                            src={photoUrl}
                                            alt={item.title || 'preview'}
                                            fill
                                            unoptimized
                                            sizes="(max-width: 768px) 100vw, 600px"
                                            className="object-contain"
                                        />
                                    ) : (
                                        <span className="flex flex-col items-center justify-center text-ink-muted gap-2">
                                            <ImageSquare size={36} className="text-ink-secondary" />
                                            <span className="text-xs">No image asset linked</span>
                                        </span>
                                    )}

                                    {/* Action overlay */}
                                    <div className="absolute top-3 right-3 flex items-center gap-2 opacity-90 group-hover:opacity-100 transition-opacity z-10">
                                        <button
                                            type="button"
                                            onClick={copyDirectUrl}
                                            title="Copy direct CDN asset URL"
                                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-ink/80 backdrop-blur-sm text-white text-xs font-medium hover:bg-ink transition cursor-pointer shadow-sm border border-white/10"
                                        >
                                            {copiedUrl ? <Check size={13} weight="bold" className="text-emerald-400" /> : <Copy size={13} />}
                                            <span>{copiedUrl ? 'Copied' : 'Copy CDN URL'}</span>
                                        </button>
                                        <a
                                            href={publicHref}
                                            target="_blank"
                                            rel="noreferrer"
                                            title="View Public Page"
                                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-ink/80 backdrop-blur-sm text-white text-xs font-medium hover:bg-ink transition cursor-pointer shadow-sm border border-white/10"
                                        >
                                            <ArrowSquareOut size={13} />
                                            <span>Public Page</span>
                                        </a>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between text-xs text-ink-muted px-1">
                                    <span>
                                        {isVideo
                                            ? 'Interactive playback with adaptive streaming.'
                                            : 'Full-resolution master photograph preserved in Cloudflare R2.'}
                                    </span>
                                    <span className="font-medium text-ink-secondary">
                                        {mediaDoc?.width && mediaDoc?.height
                                            ? `${mediaDoc.width} × ${mediaDoc.height}`
                                            : (isVideo ? '1080p Stream' : 'High Resolution')}
                                    </span>
                                </div>
                            </div>

                            {/* Hero Feature Reel Controls (For Videos) */}
                            {isVideo && (
                                <div className="rounded-xl border border-amber-200 bg-amber-50/40 p-5 space-y-4 shadow-xs">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-100 text-amber-800">
                                                <Star size={18} weight="fill" />
                                            </span>
                                            <div>
                                                <h4 className="text-xs font-semibold text-amber-950">Homepage Hero Showcase Reel</h4>
                                                <p className="text-xs text-amber-800/80 mt-0.5">
                                                    Features this film in the premier top client header & hero marquee.
                                                </p>
                                            </div>
                                        </div>

                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={form.isHero}
                                                onChange={(e) => set('isHero', e.target.checked)}
                                                className="sr-only peer"
                                            />
                                            <div className="w-11 h-6 bg-ground-sunk peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-edge-strong after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent"></div>
                                        </label>
                                    </div>

                                    {form.isHero && (
                                        <div className="pt-3 border-t border-amber-200/70 flex items-center justify-between gap-4">
                                            <span className="text-xs font-medium text-amber-900">Hero Priority Sorting Rank:</span>
                                            <input
                                                type="number"
                                                min="0"
                                                max="100"
                                                className="w-24 rounded-xl border border-amber-300 bg-white px-3 py-1.5 text-xs text-amber-950 font-semibold focus:outline-none focus:ring-2 focus:ring-accent/20 text-center"
                                                value={form.heroPriority}
                                                onChange={(e) => set('heroPriority', e.target.value)}
                                            />
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Title & Caption */}
                            <div className="rounded-xl border border-edge-subtle bg-white p-5 space-y-4 shadow-xs">
                                <div>
                                    <label className={labelClass}>Asset Title / Headline</label>
                                    <input
                                        className={inputClass}
                                        value={form.title}
                                        placeholder="e.g. Royal Jaipur Sunset Pheras"
                                        onChange={(e) => set('title', e.target.value)}
                                    />
                                </div>

                                <div>
                                    <label className={labelClass}>Editorial Caption & Story</label>
                                    <textarea
                                        rows={3}
                                        className={inputClass}
                                        value={form.caption}
                                        placeholder="Add an evocative description of the moments captured..."
                                        onChange={(e) => set('caption', e.target.value)}
                                    />
                                </div>
                            </div>

                            {/* On the site: visibility reasons, poster, replace file */}
                            <MediaControls item={item} onChanged={onItemChanged} />

                            {/* Tags: the tag system (Ceremony, Film type, categories) */}
                            <div className="rounded-xl border border-edge-subtle bg-white p-5 space-y-4 shadow-xs">
                                <div className="flex items-center justify-between">
                                    <span className={sectionHeaderClass}>Tags</span>
                                    <span className="text-xs text-ink-muted">{form.tagIds.length} selected</span>
                                </div>
                                <TagPicker
                                    taxonomy={taxonomy}
                                    kind={item.kind}
                                    value={form.tagIds}
                                    onChange={(ids) => set('tagIds', ids)}
                                />
                            </div>

                            {/* Shoot Date & Publishing Status */}
                            <div className="rounded-xl border border-edge-subtle bg-white p-5 space-y-4 shadow-xs">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className={labelClass}>Shoot Date</label>
                                        <input
                                            type="date"
                                            className={inputClass}
                                            value={form.shootDate}
                                            onChange={(e) => set('shootDate', e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <label className={labelClass}>Publishing Status</label>
                                        <select
                                            className={inputClass}
                                            value={form.status}
                                            onChange={(e) => set('status', e.target.value)}
                                        >
                                            <option value="Published">Published (Live in Gallery)</option>
                                            <option value="Draft">Draft (Hidden)</option>
                                            <option value="Archived">Archived</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* Location & Venue Details */}
                            <div className="rounded-xl border border-edge-subtle bg-white p-5 space-y-4 shadow-xs">
                                <span className={sectionHeaderClass}>Location & Venue Details</span>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className={labelClass}>City</label>
                                        <input
                                            className={inputClass}
                                            placeholder="e.g. Udaipur"
                                            value={form.location.city || ''}
                                            onChange={(e) => setLoc('city', e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <label className={labelClass}>State</label>
                                        <input
                                            className={inputClass}
                                            placeholder="e.g. Rajasthan"
                                            value={form.location.state || ''}
                                            onChange={(e) => setLoc('state', e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <label className={labelClass}>Country</label>
                                        <input
                                            className={inputClass}
                                            placeholder="e.g. India"
                                            value={form.location.country || ''}
                                            onChange={(e) => setLoc('country', e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <label className={labelClass}>Venue</label>
                                        <input
                                            className={inputClass}
                                            placeholder="e.g. Taj Lake Palace"
                                            value={form.location.venue || ''}
                                            onChange={(e) => setLoc('venue', e.target.value)}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Production Credits */}
                            <div className="rounded-xl border border-edge-subtle bg-white p-5 space-y-4 shadow-xs">
                                <div className="flex items-center justify-between">
                                    <span className={sectionHeaderClass}>Behind the Scenes Credits</span>
                                    <button
                                        type="button"
                                        onClick={() => set('credits', [...form.credits, { name: '', role: '' }])}
                                        className="text-xs font-semibold text-accent-ink hover:underline cursor-pointer flex items-center gap-1"
                                    >
                                        <Plus size={13} weight="bold" /> Add Credit
                                    </button>
                                </div>

                                <div className="space-y-2.5">
                                    {form.credits.map((c, idx) => (
                                        <div key={idx} className="flex gap-2 items-center">
                                            <input
                                                className={inputClass}
                                                placeholder="Artist / Crew Name"
                                                value={c.name}
                                                onChange={(e) =>
                                                    set(
                                                        'credits',
                                                        form.credits.map((x, i) => (i === idx ? { ...x, name: e.target.value } : x))
                                                    )
                                                }
                                            />
                                            <input
                                                className={inputClass}
                                                placeholder="Role (e.g. Lead Cinematographer)"
                                                value={c.role}
                                                onChange={(e) =>
                                                    set(
                                                        'credits',
                                                        form.credits.map((x, i) => (i === idx ? { ...x, role: e.target.value } : x))
                                                    )
                                                }
                                            />
                                            <Button
                                                variant="ghost"
                                                size="iconSm"
                                                onClick={() => set('credits', form.credits.filter((_, i) => i !== idx))}
                                                aria-label="Remove credit"
                                                className="text-ink-muted hover:text-rose-600 shrink-0"
                                            >
                                                <X size={16} />
                                            </Button>
                                        </div>
                                    ))}
                                    {!form.credits.length && <p className="text-xs text-ink-muted">No production credits recorded.</p>}
                                </div>
                            </div>
                        </>
                    ) : (
                        /* Tab 2: Pipeline & Derivatives */
                        <div className="space-y-4">
                            <AssetBreakdown media={mediaDoc || item.media} />
                        </div>
                    )}
                </div>

                {/* Footer Controls */}
                <footer className="shrink-0 flex items-center justify-between gap-3 border-t border-edge-subtle bg-white px-6 py-4">
                    <Button
                        variant="danger"
                        size="sm"
                        icon={Trash}
                        onClick={() => onDelete(item)}
                        className="text-xs font-semibold px-4 py-2"
                    >
                        Delete Asset
                    </Button>

                    <div className="flex items-center gap-3">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={onClose}
                            className="text-xs font-semibold px-4 py-2"
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="primary"
                            size="sm"
                            loading={saving}
                            onClick={submit}
                            className="text-xs font-semibold px-6 py-2 bg-accent hover:bg-accent-hover text-white shadow-sm active:scale-95 transition-all"
                        >
                            Save Changes
                        </Button>
                    </div>
                </footer>
            </aside>
        </div>,
        document.body
    );
}
