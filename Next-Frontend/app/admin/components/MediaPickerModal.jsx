'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import {
    X,
    MagnifyingGlass,
    UploadSimple,
    Check,
    Trash,
    FilmSlate,
    FileText,
    CircleNotch,
    ImageSquare,
} from '@phosphor-icons/react';
import useMediaLibrary from '@/Hooks/useMediaLibrary.jsx';
import { fireMessage } from '@/Utils/fireMessage.js';
import { Button } from '@/app/admin/components/ui/Button.jsx';

const TYPE_TABS = [
    { key: '', label: 'All' },
    { key: 'Image', label: 'Images' },
    { key: 'Video', label: 'Videos' },
    { key: 'Document', label: 'Docs' },
];

function MediaThumb({ media }) {
    const url = media.cdnUrl || media.publicUrl || media.url;
    if (media.mediaType === 'Image' && url) {
        return (
            <Image
                src={url}
                alt={media.altText || media.title || 'media'}
                fill
                sizes="(max-width: 768px) 33vw, 160px"
                className="object-cover"
                {...(media.blurDataURL ? { placeholder: 'blur', blurDataURL: media.blurDataURL } : {})}
            />
        );
    }
    const poster = media.video?.posterUrl;
    if (media.mediaType === 'Video' && poster) {
        return (
            <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={poster} alt={media.altText || media.title || 'video'} className="h-full w-full object-cover" />
                <span className="absolute inset-0 flex items-center justify-center bg-black/30">
                    <FilmSlate size={24} className="text-white drop-shadow" />
                </span>
            </>
        );
    }
    return (
        <div className="flex h-full w-full items-center justify-center bg-stone-100 text-stone-400">
            {media.mediaType === 'Video' ? <FilmSlate size={28} /> : <FileText size={28} />}
        </div>
    );
}

export default function MediaPickerModal({
    open,
    onClose,
    onSelect,
    multiple = false,
    ownerType = 'System',
    typeFilter = '',
}) {
    const {
        items, hasMore, loading, uploadProgress,
        fetchMedia, uploadNewMedia, updateMediaMeta, deleteMedia,
    } = useMediaLibrary({ ownerType });

    const [search, setSearch] = useState('');
    const [activeType, setActiveType] = useState(typeFilter || '');
    const [selected, setSelected] = useState([]);
    const [focused, setFocused] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [savingMeta, setSavingMeta] = useState(false);
    const fileInputRef = useRef(null);
    const pageRef = useRef(1);

    useEffect(() => {
        if (!open) return;
        const t = setTimeout(() => {
            pageRef.current = 1;
            fetchMedia({ search, mediaType: activeType, pageNum: 1, reset: true });
        }, 250);
        return () => clearTimeout(t);
    }, [open, search, activeType, fetchMedia]);

    useEffect(() => {
        if (open) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setSelected([]);
            setFocused(null);
        }
    }, [open]);

    if (!open) return null;

    const loadMore = () => {
        pageRef.current += 1;
        fetchMedia({ search, mediaType: activeType, pageNum: pageRef.current, reset: false });
    };

    const toggleSelect = (media) => {
        setFocused(media);
        if (!multiple) {
            setSelected([media._id]);
            return;
        }
        setSelected((prev) => (prev.includes(media._id)
            ? prev.filter((id) => id !== media._id)
            : [...prev, media._id]));
    };

    const handleFiles = async (fileList) => {
        const files = Array.from(fileList || []);
        if (!files.length) return;
        setUploading(true);
        try {
            for (const file of files) {
                const media = await uploadNewMedia(file, { ownerType });
                fetchMedia({ search: '', mediaType: activeType, pageNum: 1, reset: true });
                setFocused(media);
                if (!multiple) setSelected([media._id]);
                else setSelected((prev) => [...prev, media._id]);
            }
            fireMessage('Upload complete', 'success');
        } catch (err) {
            fireMessage(err.message, 'error');
        } finally {
            setUploading(false);
        }
    };

    const saveMeta = async () => {
        if (!focused) return;
        setSavingMeta(true);
        try {
            const updated = await updateMediaMeta(focused._id, {
                altText: focused.altText || '',
                caption: focused.caption || '',
                title: focused.title || '',
            });
            setFocused(updated);
            fireMessage('Saved metadata', 'success');
        } catch (err) {
            fireMessage(err.message, 'error');
        } finally {
            setSavingMeta(false);
        }
    };

    const handleDelete = async (media) => {
        try {
            await deleteMedia(media._id);
            if (focused?._id === media._id) setFocused(null);
            setSelected((prev) => prev.filter((id) => id !== media._id));
        } catch (err) {
            // In use by the portfolio: deleting it here, with no way to see
            // which weddings lose it, is too easy to do by accident.
            fireMessage(err.placements ? `${err.message} Delete it from the Media page to confirm.` : err.message, 'error');
        }
    };

    const confirmInsert = () => {
        const chosen = items.filter((m) => selected.includes(m._id));
        if (!chosen.length) {
            fireMessage('Select at least one asset', 'warning');
            return;
        }
        onSelect(multiple ? chosen : chosen[0]);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 font-sans">
            <div className="flex h-[85vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white border border-[#E5DCD3] shadow-2xl">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-[#E5DCD3] bg-[#F7F4EF] px-5 py-3.5">
                    <div>
                        <h2 className="text-sm font-bold text-[#1C1917]">Studio Media Library</h2>
                        <p className="text-[11px] text-stone-500">Select or upload cinematic photography and media assets.</p>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-xl p-1.5 text-stone-500 hover:bg-stone-200/80 hover:text-[#1C1917] transition-all cursor-pointer"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Toolbar */}
                <div className="flex flex-wrap items-center gap-3 border-b border-[#E5DCD3] bg-white px-5 py-3">
                    <div className="relative flex-1 min-w-[200px]">
                        <MagnifyingGlass size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search by title, alt text, tag…"
                            className="w-full rounded-xl border border-[#E5DCD3] bg-stone-50 py-1.5 pl-9 pr-3 text-xs text-[#1C1917] placeholder:text-stone-400 focus:border-[#8C532B] focus:ring-1 focus:ring-[#8C532B]/30 focus:outline-none"
                        />
                    </div>
                    {!typeFilter && (
                        <div className="flex gap-1 rounded-xl bg-stone-100 p-1 border border-stone-200">
                            {TYPE_TABS.map((tab) => (
                                <button
                                    key={tab.key}
                                    type="button"
                                    onClick={() => setActiveType(tab.key)}
                                    className={`rounded-lg px-3 py-1 text-xs font-medium transition-all cursor-pointer ${
                                        activeType === tab.key ? 'bg-white text-[#1C1917] font-semibold shadow-sm' : 'text-stone-600 hover:text-[#1C1917]'
                                    }`}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>
                    )}
                    <Button
                        variant="gold"
                        size="sm"
                        icon={uploading ? CircleNotch : UploadSimple}
                        loading={uploading}
                        onClick={() => fileInputRef.current?.click()}
                    >
                        Upload Asset
                    </Button>
                    <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        accept={typeFilter === 'Image' ? 'image/*' : typeFilter === 'Video' ? 'video/*' : undefined}
                        className="hidden"
                        onChange={(e) => handleFiles(e.target.files)}
                    />
                </div>

                {/* Body: grid + edit panel */}
                <div className="flex min-h-0 flex-1">
                    {/* Grid */}
                    <div
                        className="flex-1 overflow-y-auto p-4 bg-[#F7F4EF]/50"
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => { e.preventDefault(); handleFiles(e.dataTransfer.files); }}
                    >
                        {Object.keys(uploadProgress).length > 0 && (
                            <div className="mb-3 space-y-1.5">
                                {Object.entries(uploadProgress).map(([key, pct]) => {
                                    const processing = pct === -1;
                                    return (
                                        <div key={key} className="rounded-xl border border-[#E5DCD3] bg-white p-2">
                                            <div className="h-1.5 w-full overflow-hidden rounded bg-stone-200">
                                                <div
                                                    className={`h-full bg-[#8C532B] ${processing ? 'w-full animate-pulse' : 'transition-all'}`}
                                                    style={processing ? undefined : { width: `${pct}%` }}
                                                />
                                            </div>
                                            {processing && (
                                                <p className="mt-1 text-[11px] text-stone-500 font-medium">Optimizing &amp; uploading to Cloudflare R2…</p>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {items.length === 0 && !loading ? (
                            <div className="flex h-full flex-col items-center justify-center text-stone-400 p-8">
                                <div className="w-12 h-12 rounded-full bg-stone-100 flex items-center justify-center text-stone-400 mb-3 border border-stone-200">
                                    <ImageSquare size={26} />
                                </div>
                                <p className="text-xs font-semibold text-[#1C1917]">No media found</p>
                                <p className="text-[11px] text-stone-500 mt-0.5">Upload photography or videos to get started.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5">
                                {items.map((media) => {
                                    const isSel = selected.includes(media._id);
                                    return (
                                        <div
                                            key={media._id}
                                            className={`group relative aspect-square cursor-pointer overflow-hidden rounded-xl border-2 transition-all ${
                                                isSel ? 'border-[#8C532B] ring-2 ring-[#8C532B]/30' : 'border-[#E5DCD3] hover:border-stone-400'
                                            }`}
                                            onClick={() => toggleSelect(media)}
                                        >
                                            <MediaThumb media={media} />
                                            {isSel && (
                                                <span className="absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-[#8C532B] text-white shadow-sm">
                                                    <Check size={12} weight="bold" />
                                                </span>
                                            )}
                                            <button
                                                type="button"
                                                onClick={(e) => { e.stopPropagation(); handleDelete(media); }}
                                                className="absolute left-1.5 top-1.5 hidden rounded-lg bg-black/70 p-1 text-white group-hover:block hover:bg-rose-600 transition-colors"
                                                title="Delete asset"
                                            >
                                                <Trash size={12} />
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {loading && (
                            <div className="flex justify-center py-6 text-stone-500">
                                <CircleNotch size={24} className="animate-spin text-stone-600" />
                            </div>
                        )}
                        {hasMore && !loading && (
                            <div className="flex justify-center py-4">
                                <Button variant="outline" size="sm" onClick={loadMore}>
                                    Load More Assets
                                </Button>
                            </div>
                        )}
                    </div>

                    {/* Edit / detail panel */}
                    {focused && (
                        <div className="w-72 shrink-0 overflow-y-auto border-l border-[#E5DCD3] bg-white p-4 font-sans">
                            <div className="relative mb-3 aspect-video overflow-hidden rounded-xl bg-stone-100 border border-[#E5DCD3]">
                                <MediaThumb media={focused} />
                            </div>
                            <p className="mb-3 truncate text-xs font-semibold text-[#1C1917]">{focused.originalFileName || focused.title || 'Untitled Asset'}</p>

                            <label className="mb-1 block text-[11px] font-semibold text-stone-600">Alt text (SEO)</label>
                            <input
                                type="text"
                                value={focused.altText || ''}
                                onChange={(e) => setFocused({ ...focused, altText: e.target.value })}
                                placeholder="Describe the image..."
                                className="mb-3 w-full rounded-xl border border-[#E5DCD3] bg-stone-50 p-2 text-xs text-[#1C1917] focus:border-[#8C532B] focus:ring-1 focus:ring-[#8C532B]/30 focus:outline-none"
                            />

                            <label className="mb-1 block text-[11px] font-semibold text-stone-600">Caption</label>
                            <textarea
                                rows={2}
                                value={focused.caption || ''}
                                onChange={(e) => setFocused({ ...focused, caption: e.target.value })}
                                placeholder="Optional caption..."
                                className="mb-3 w-full rounded-xl border border-[#E5DCD3] bg-stone-50 p-2 text-xs text-[#1C1917] focus:border-[#8C532B] focus:ring-1 focus:ring-[#8C532B]/30 focus:outline-none"
                            />

                            <Button
                                variant="outline"
                                size="sm"
                                onClick={saveMeta}
                                loading={savingMeta}
                                className="w-full"
                            >
                                Save Metadata
                            </Button>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between border-t border-[#E5DCD3] bg-[#F7F4EF] px-5 py-3">
                    <span className="text-xs text-stone-600 font-medium">
                        {selected.length} asset{selected.length === 1 ? '' : 's'} selected
                    </span>
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={onClose}>
                            Cancel
                        </Button>
                        <Button
                            variant="primary"
                            size="sm"
                            onClick={confirmInsert}
                            disabled={selected.length === 0}
                        >
                            Insert {multiple && selected.length ? `(${selected.length})` : ''}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
