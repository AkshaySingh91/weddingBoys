"use client";

// Banner strip on the public /team page: handles multi-image staging,
// presigned PUT uploads, and deletion.
import { useState, useEffect } from 'react';
import {
    Images, Plus, Trash, FloppyDisk, X, CircleNotch, PencilSimple
} from '@phosphor-icons/react';
import { fireMessage } from '@/Utils/fireMessage.js';
import Button from '@/app/admin/components/ui/Button.jsx';
import Badge from '@/app/admin/components/ui/Badge.jsx';
import useUploader from '@/Hooks/useUploader.jsx';

const api_url = process.env.NEXT_PUBLIC_API_URL;

export default function BannerImage({ bannerImage, fetchTeamImage }) {
    const [isEditing, setIsEditing] = useState(false);
    const [imagePreview, setImagePreview] = useState([]);
    const [imageMeta, setImageMeta] = useState([]);
    const [files, setFiles] = useState([]);
    const [saving, setSaving] = useState(false);

    // Bytes go browser→R2 direct, resumably, with real progress — replacing the
    // old presign→PUT→save handshake that showed nothing but a spinner.
    const { enqueue, items, overallProgress, isUploading } = useUploader({ ownerType: 'Team' });

    const handleCancel = () => {
        setImageMeta([]);
        setFiles([]);
        setImagePreview([]);
        setIsEditing(false);
    };

    const handleSave = async () => {
        if (!files.length) {
            setIsEditing(false);
            return;
        }

        setSaving(true);
        try {
            // Upload first. Only assets that genuinely landed in R2 come back,
            // so a database row can never reference bytes that failed.
            const media = await enqueue(files, { meta: { slot: 'hero' } });
            if (media.length !== files.length) {
                throw new Error(`${files.length - media.length} image(s) failed to upload`);
            }

            const res = await fetch(`${api_url}/api/admin/team/banner-image`, {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    uploadedImage: media.map((m) => ({ mediaId: m.mediaId })),
                }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Failed to save banner image');

            fireMessage('Team banner images saved successfully', 'success');
            fetchTeamImage();
            handleCancel();
        } catch (error) {
            fireMessage(error.message, 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleFileChange = (e) => {
        const selected = Array.from(e.target.files).map((file) => {
            const newName = `${file.name.split('.')[0]}_${Date.now()}.${file.type.split('/')[1]}`;
            const blob = file.slice(0, file.size);
            return new File([blob], newName, { type: file.type });
        });

        const fileMeta = selected.map((f) => ({ name: f.name, size: f.size, type: f.type }));
        const prevUrl = selected.map((img) => ({ name: img.name, url: URL.createObjectURL(img) }));

        setImageMeta((prev) => [...prev, ...fileMeta]);
        setFiles((prev) => [...selected, ...prev]);
        setImagePreview((prev) => [...prev, ...prevUrl]);
    };

    useEffect(() => {
        return () => {
            imagePreview.forEach((img) => URL.revokeObjectURL(img.url));
        };
    }, [imagePreview]);

    const deleteBannerImage = async (id) => {
        if (!window.confirm('Are you sure you want to delete this banner image?')) return;
        try {
            const res = await fetch(`${api_url}/api/admin/team/banner-image`, {
                method: 'DELETE',
                credentials: 'include',
                body: JSON.stringify({ id }),
                headers: { 'Content-type': 'application/json' },
            });
            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.message || 'Deletion failed');
            }
            fireMessage('Banner image removed', 'success');
            fetchTeamImage();
        } catch (error) {
            fireMessage(error.message, 'error');
        }
    };

    const activeHeroes = (bannerImage || []).filter((i) => i.isHero);

    return (
        <div className="rounded-2xl border border-[#E7E2DA] bg-white p-6 shadow-sm space-y-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-[#F5F2EC] pb-4">
                <div className="flex items-center gap-2.5">
                    <Images size={20} weight="duotone" className="text-[#C5A880]" />
                    <div>
                        <h2 className="text-lg font-serif font-semibold text-[#1C1917]">Team Masthead Mosaic</h2>
                        <p className="text-xs font-sans text-[#78716C]">
                            Hero images that form the wide header collage on the public team page.
                        </p>
                    </div>
                </div>
                <div>
                    {!isEditing ? (
                        <Button
                            type="button"
                            variant="gold"
                            size="sm"
                            onClick={() => setIsEditing(true)}
                            icon={<PencilSimple size={14} weight="bold" />}
                        >
                            Edit Masthead
                        </Button>
                    ) : (
                        <div className="flex items-center gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={handleCancel}
                                disabled={saving}
                                icon={<X size={14} weight="bold" />}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="button"
                                variant="gold"
                                size="sm"
                                onClick={handleSave}
                                loading={saving}
                                icon={<FloppyDisk size={14} weight="bold" />}
                            >
                                {isUploading ? `Uploading ${overallProgress}%` : 'Save Changes'}
                            </Button>
                        </div>
                    )}
                </div>
            </div>

            {items.length > 0 && (
                <div className="mb-4 space-y-1.5">
                    {items.map((it) => (
                        <div key={it.id} className="flex items-center gap-3 text-xs">
                            <span className="w-48 truncate text-stone-600">{it.name}</span>
                            <div className="h-1 flex-1 overflow-hidden rounded-full bg-stone-100">
                                <div
                                    className={`h-full rounded-full transition-all ${it.status === 'error' ? 'bg-red-400' : it.status === 'done' ? 'bg-green-500' : 'bg-[#C5A880]'}`}
                                    style={{ width: `${it.progress || 0}%` }}
                                />
                            </div>
                            <span className={`w-28 shrink-0 ${it.status === 'error' ? 'text-red-600' : 'text-stone-400'}`}>
                                {it.status === 'error' ? it.error : `${it.status} ${it.progress || 0}%`}
                            </span>
                        </div>
                    ))}
                </div>
            )}

            {isEditing && (
                <div className="space-y-4 rounded-xl border border-dashed border-[#C5A880] bg-[#FAF8F5] p-4">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-medium font-sans text-[#1C1917]">Stage New Masthead Photos</span>
                        <div className="flex items-center gap-2">
                            <input
                                id="bannerImage"
                                type="file"
                                accept="image/*"
                                multiple
                                onChange={handleFileChange}
                                className="hidden"
                            />
                            <label
                                htmlFor="bannerImage"
                                className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-[#E7E2DA] bg-white px-3 py-1.5 text-xs font-medium font-sans text-[#1C1917] shadow-sm transition hover:bg-[#F7F4EF]"
                            >
                                <Plus size={14} weight="bold" /> Choose Images
                            </label>
                            {imagePreview.length > 0 && (
                                <button
                                    type="button"
                                    className="text-xs font-medium text-rose-600 hover:underline"
                                    onClick={() => {
                                        setImagePreview([]);
                                        setFiles([]);
                                        setImageMeta([]);
                                    }}
                                >
                                    Clear Staged
                                </button>
                            )}
                        </div>
                    </div>

                    {imagePreview.length > 0 && (
                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                            {imagePreview.map((img) => (
                                <div key={img.name} className="relative aspect-video overflow-hidden rounded-xl border border-[#E7E2DA] bg-white shadow-sm">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img className="h-full w-full object-cover" alt="Staged" src={img.url} />
                                    <button
                                        type="button"
                                        className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-white text-[#78716C] shadow-md hover:text-rose-600"
                                        onClick={() => {
                                            setImagePreview((prev) => prev.filter((file) => file.name !== img.name));
                                            setFiles((prev) => prev.filter((file) => file.name !== img.name));
                                            setImageMeta((prev) => prev.filter((file) => file.name !== img.name));
                                        }}
                                    >
                                        <X size={12} weight="bold" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Current Masthead Collage Display */}
            {activeHeroes.length === 0 ? (
                <div className="rounded-xl border border-dashed border-[#D6D0C5] p-10 text-center text-xs font-sans text-[#78716C]">
                    No masthead photos currently active. Click &quot;Edit Masthead&quot; to stage pictures.
                </div>
            ) : (
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                    {activeHeroes.map((image) => (
                        <div key={image._id} className="group relative aspect-video overflow-hidden rounded-xl border border-[#E7E2DA] bg-[#FAF8F5] shadow-sm">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                                src={image.url}
                                alt="Team Banner"
                            />
                            {isEditing && (
                                <button
                                    type="button"
                                    className="absolute right-2.5 top-2.5 flex h-7 w-7 items-center justify-center rounded-full bg-white text-[#78716C] shadow-md hover:text-rose-600 transition"
                                    onClick={() => deleteBannerImage(image._id)}
                                >
                                    <Trash size={14} weight="bold" />
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
