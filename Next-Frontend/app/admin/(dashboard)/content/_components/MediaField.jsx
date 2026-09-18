'use client';

import { useState } from 'react';
import Image from 'next/image';
import { ImagePlus, X, Film, FileText, GripVertical } from 'lucide-react';
import MediaPickerModal from '@/app/admin/components/MediaPickerModal.jsx';

const thumbUrl = (m) => m?.url || m?.cdnUrl || m?.publicUrl || '';

function Thumb({ media }) {
    const url = thumbUrl(media);
    if (media?.mediaType === 'Image' && url) {
        return <Image src={url} alt={media.altText || ''} fill sizes="120px" className="object-cover" />;
    }
    return (
        <div className="flex h-full w-full items-center justify-center bg-gray-100 text-gray-400">
            {media?.mediaType === 'Video' ? <Film size={20} /> : <FileText size={20} />}
        </div>
    );
}

/**
 * Attach media from the library.
 *  - mode="single": one asset (replace on pick)
 *  - mode="gallery": ordered list (append on pick, reorder, remove)
 * `value` is an array of serialized Media objects ({ _id, url, ... }).
 */
export default function MediaField({ mode = 'single', value = [], onChange, ownerType = 'Website', typeFilter = '' }) {
    const [open, setOpen] = useState(false);
    const list = Array.isArray(value) ? value : [];

    const handleSelect = (picked) => {
        if (mode === 'single') {
            onChange([Array.isArray(picked) ? picked[0] : picked].filter(Boolean));
        } else {
            const arr = Array.isArray(picked) ? picked : [picked];
            // De-dupe by _id while preserving order.
            const merged = [...list];
            for (const m of arr) {
                if (!merged.some((x) => x._id === m._id)) merged.push(m);
            }
            onChange(merged);
        }
    };

    const removeAt = (i) => onChange(list.filter((_, idx) => idx !== i));
    const move = (i, dir) => {
        const j = i + dir;
        if (j < 0 || j >= list.length) return;
        const next = [...list];
        [next[i], next[j]] = [next[j], next[i]];
        onChange(next);
    };

    return (
        <div>
            {mode === 'single' ? (
                list[0] ? (
                    <div className="relative h-28 w-44 overflow-hidden rounded-lg border border-gray-200">
                        <Thumb media={list[0]} />
                        <button
                            type="button"
                            onClick={() => onChange([])}
                            className="absolute right-1 top-1 rounded-full bg-black/60 p-1 text-white"
                        >
                            <X size={12} />
                        </button>
                        <button
                            type="button"
                            onClick={() => setOpen(true)}
                            className="absolute inset-x-0 bottom-0 bg-black/50 py-1 text-center text-xs text-white"
                        >
                            Replace
                        </button>
                    </div>
                ) : (
                    <button
                        type="button"
                        onClick={() => setOpen(true)}
                        className="flex h-28 w-44 flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-gray-300 text-gray-400 hover:border-rose-400"
                    >
                        <ImagePlus size={20} />
                        <span className="text-xs">Choose media</span>
                    </button>
                )
            ) : (
                <div className="flex flex-wrap gap-2">
                    {list.map((m, i) => (
                        <div key={m._id || i} className="group relative h-24 w-24 overflow-hidden rounded-lg border border-gray-200">
                            <Thumb media={m} />
                            <button
                                type="button"
                                onClick={() => removeAt(i)}
                                className="absolute right-1 top-1 hidden rounded-full bg-black/60 p-1 text-white group-hover:block"
                            >
                                <X size={11} />
                            </button>
                            <div className="absolute inset-x-0 bottom-0 hidden items-center justify-between bg-black/50 px-1 py-0.5 text-white group-hover:flex">
                                <button type="button" onClick={() => move(i, -1)} className="text-xs disabled:opacity-30" disabled={i === 0}>‹</button>
                                <GripVertical size={11} className="opacity-60" />
                                <button type="button" onClick={() => move(i, 1)} className="text-xs disabled:opacity-30" disabled={i === list.length - 1}>›</button>
                            </div>
                        </div>
                    ))}
                    <button
                        type="button"
                        onClick={() => setOpen(true)}
                        className="flex h-24 w-24 flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-gray-300 text-gray-400 hover:border-rose-400"
                    >
                        <ImagePlus size={18} />
                        <span className="text-[11px]">Add</span>
                    </button>
                </div>
            )}

            <MediaPickerModal
                open={open}
                onClose={() => setOpen(false)}
                onSelect={handleSelect}
                multiple={mode === 'gallery'}
                ownerType={ownerType}
                typeFilter={typeFilter}
            />
        </div>
    );
}
