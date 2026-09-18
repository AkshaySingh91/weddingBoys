"use client";

// Team member grid: handles staging brand-new team member profiles
// (file picker → name/designation → presigned upload) and inline editing
// of members already saved in the database.
import { useState, useEffect } from 'react';
import {
    UsersThree, Plus, Trash, PencilSimple, FloppyDisk, X, Check, CircleNotch
} from '@phosphor-icons/react';
import { fireMessage } from '@/Utils/fireMessage.js';
import Button from '@/app/admin/components/ui/Button.jsx';
import Badge from '@/app/admin/components/ui/Badge.jsx';
import useUploader from '@/Hooks/useUploader.jsx';

const api_url = process.env.NEXT_PUBLIC_API_URL;

export default function TeamImage({ teamImages, fetchTeamImage }) {
    const [isAdding, setIsAdding] = useState(false);
    const [imagePreview, setImagePreview] = useState([]);
    const [imageMeta, setImageMeta] = useState([]);
    const [files, setFiles] = useState([]);

    // Browser→R2 direct, resumable, with per-file progress.
    const { enqueue, items, overallProgress, isUploading } = useUploader({ ownerType: 'Team' });
    const [editableImage, setEditableImage] = useState([]);
    const [isImageEditing, setIsImageEditing] = useState([]);
    const [savingNew, setSavingNew] = useState(false);

    useEffect(() => {
        if (teamImages && teamImages.length) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setEditableImage(teamImages);
            setIsImageEditing(teamImages.map((t) => ({ id: t._id, isEditing: false })));
        }
    }, [teamImages]);

    useEffect(() => {
        return () => {
            imagePreview.forEach((img) => URL.revokeObjectURL(img.url));
        };
    }, [imagePreview]);

    const addNewTeamImage = async () => {
        if (!imageMeta.length) return;
        for (const img of imageMeta) {
            if (!img.name?.trim() || !img.designation?.trim()) {
                return fireMessage('Please specify name and designation for all staged members', 'error');
            }
        }

        setSavingNew(true);
        try {
            // Upload every staged portrait, then persist only what landed.
            const media = await enqueue(files);
            if (media.length !== files.length) {
                throw new Error(`${files.length - media.length} portrait(s) failed to upload`);
            }

            // Pair each uploaded asset back to the name/designation the admin
            // typed. `enqueue` preserves input order, and imageMeta is built from
            // the same file list, so index alignment holds.
            const uploadedImage = media.map((m, i) => ({
                mediaId: m.mediaId,
                name: imageMeta[i]?.name,
                designation: imageMeta[i]?.designation,
            }));

            const res = await fetch(`${api_url}/api/admin/team`, {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ uploadedImage }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Failed to save team members');

            fireMessage('Team members added successfully', 'success');
            fetchTeamImage();
            cancelAddingNewImage();
        } catch (error) {
            fireMessage(error.message, 'error');
        } finally {
            setSavingNew(false);
        }
    };

    const handleInputChange = (index, field, value) => {
        setImageMeta((prev) => prev.map((item, i) => (i === index ? { ...item, [field]: value } : item)));
    };

    const handleFileChange = (e) => {
        const selected = Array.from(e.target.files).map((file) => {
            const newName = `${file.name.split('.')[0]}_${Date.now()}.${file.type.split('/')[1]}`;
            const blob = file.slice(0, file.size);
            return new File([blob], newName, { type: file.type });
        });

        const fileMeta = selected.map((f) => ({
            fileMeta: { name: f.name, size: f.size, type: f.type },
            name: '',
            designation: '',
        }));
        const prevUrl = selected.map((img) => ({ name: img.name, url: URL.createObjectURL(img) }));

        setImageMeta((prev) => [...prev, ...fileMeta]);
        setFiles((prev) => [...prev, ...selected]);
        setImagePreview((prev) => [...prev, ...prevUrl]);
        setIsAdding(true);
    };

    const changeAbout = (id, field, value) => {
        if (!id || !id.trim()) return;
        setEditableImage((prev) =>
            prev.map((img) => (img._id === id ? { ...img, about: { ...img.about, [field]: value } } : img))
        );
    };

    const deleteTeamMember = async (id, memberName) => {
        if (!window.confirm(`Delete ${memberName || 'this team member'}?`)) return;
        try {
            const res = await fetch(`${api_url}/api/admin/team`, {
                method: 'DELETE',
                body: JSON.stringify({ id }),
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
            });
            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.message || 'Deletion failed');
            }
            fireMessage('Team member removed', 'success');
            fetchTeamImage();
        } catch (error) {
            fireMessage(error.message, 'error');
        }
    };

    const editImage = (id) => {
        if (!id || !id.trim()) return;
        setIsImageEditing((prev) => prev.map((i) => (i.id === id ? { ...i, isEditing: true } : i)));
    };

    const cancelImageEdit = (id) => {
        if (!id || !id.trim()) return;
        setIsImageEditing((prev) => prev.map((i) => (i.id === id ? { ...i, isEditing: false } : i)));
        setEditableImage((prev) =>
            prev.map((i) => {
                if (i._id !== id) return i;
                const original = teamImages.find((img) => img._id === id);
                return original ? { ...original } : i;
            })
        );
    };

    const saveImageEdit = async (id) => {
        if (!id || !id.trim()) return;
        try {
            const details = editableImage.find((img) => img._id === id);
            if (!details?.about?.name?.trim() || !details?.about?.designation?.trim()) {
                throw new Error('Name and designation are both required');
            }
            const res = await fetch(`${api_url}/api/admin/team`, {
                method: 'PUT',
                body: JSON.stringify({ details }),
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
            });
            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.message || 'Update failed');
            }
            fireMessage('Team member profile updated', 'success');
            setIsImageEditing((prev) => prev.map((i) => (i.id === id ? { ...i, isEditing: false } : i)));
            fetchTeamImage();
        } catch (error) {
            fireMessage(error.message, 'error');
        }
    };

    const members = editableImage.filter((i) => !i.isHero);

    return (
        <div className="rounded-2xl border border-[#E7E2DA] bg-white p-6 shadow-sm space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-[#F5F2EC] pb-4">
                <div className="flex items-center gap-2.5">
                    <UsersThree size={20} weight="duotone" className="text-[#C5A880]" />
                    <div>
                        <h2 className="text-lg font-serif font-semibold text-[#1C1917]">Team Member Profiles</h2>
                        <p className="text-xs font-sans text-[#78716C]">
                            Manage individual artist and crew cards featured on the studio team roster.
                        </p>
                    </div>
                </div>
                <div>
                    {!isAdding ? (
                        <div>
                            <input
                                id="teamImages"
                                type="file"
                                accept="image/*"
                                multiple
                                onChange={handleFileChange}
                                className="hidden"
                            />
                            <label
                                htmlFor="teamImages"
                                className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-[#E7E2DA] bg-white px-3.5 py-2 text-xs font-medium font-sans text-[#1C1917] shadow-sm transition hover:bg-[#F7F4EF]"
                            >
                                <Plus size={14} weight="bold" /> Add Team Members
                            </label>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={cancelAddingNewImage}
                                disabled={savingNew}
                                icon={<X size={14} weight="bold" />}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="button"
                                variant="gold"
                                size="sm"
                                onClick={addNewTeamImage}
                                loading={savingNew}
                                icon={<FloppyDisk size={14} weight="bold" />}
                            >
                                Save Staged Members
                            </Button>
                        </div>
                    )}
                </div>
            </div>

            {/* Staging New Members Form */}
            {isAdding && imageMeta.length > 0 && (
                <div className="rounded-xl border border-dashed border-[#C5A880] bg-[#FAF8F5] p-5 space-y-4">
                    <span className="text-xs font-medium font-sans text-[#1C1917]">
                        Fill Profile Details for Staged Members ({imageMeta.length})
                    </span>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {imageMeta.map((img, index) => (
                            <div key={img.fileMeta.name} className="relative rounded-xl border border-[#E7E2DA] bg-white p-3.5 shadow-sm space-y-3">
                                <div className="aspect-square w-full overflow-hidden rounded-lg bg-[#F7F4EF]">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                        src={imagePreview.find((i) => i.name === img.fileMeta.name)?.url}
                                        alt="preview"
                                        className="h-full w-full object-cover"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <input
                                        placeholder="Full Name (e.g., Arjun Verma)"
                                        type="text"
                                        value={img.name}
                                        onChange={(e) => handleInputChange(index, 'name', e.target.value)}
                                        className="w-full rounded-lg border border-[#E7E2DA] py-1.5 px-2.5 text-xs font-sans text-[#1C1917] outline-none focus:border-[#C5A880]"
                                    />
                                    <input
                                        placeholder="Designation (e.g., Lead Cinematographer)"
                                        type="text"
                                        value={img.designation}
                                        onChange={(e) => handleInputChange(index, 'designation', e.target.value)}
                                        className="w-full rounded-lg border border-[#E7E2DA] py-1.5 px-2.5 text-xs font-sans text-[#1C1917] outline-none focus:border-[#C5A880]"
                                    />
                                </div>
                                <button
                                    type="button"
                                    className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-white text-[#78716C] shadow-md hover:text-rose-600"
                                    onClick={() => {
                                        setImagePreview((prev) => prev.filter((file) => file.name !== img.fileMeta.name));
                                        setFiles((prev) => prev.filter((file) => file.name !== img.fileMeta.name));
                                        setImageMeta((prev) => prev.filter((file) => file.fileMeta.name !== img.fileMeta.name));
                                    }}
                                >
                                    <X size={12} weight="bold" />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Existing Member Grid */}
            {members.length === 0 ? (
                <div className="rounded-xl border border-dashed border-[#D6D0C5] p-12 text-center text-xs font-sans text-[#78716C]">
                    No team members listed yet. Click &quot;Add Team Members&quot; above to create profiles.
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                    {members.map((img) => {
                        const cardEditing = isImageEditing.find((i) => i.id === img._id)?.isEditing;
                        const memberName = img.about?.name || 'Team Member';
                        const memberRole = img.about?.designation || 'Artist';

                        return (
                            <div
                                key={img._id}
                                className="group relative flex flex-col overflow-hidden rounded-2xl border border-[#E7E2DA] bg-[#FAF8F5] shadow-sm transition hover:shadow-md"
                            >
                                <div className="relative aspect-4/5 w-full overflow-hidden bg-[#1C1917]">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                        src={img.url}
                                        alt={memberName}
                                        className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                                    />
                                    {/* Action Buttons Header */}
                                    <div className="absolute top-2.5 right-2.5 flex items-center gap-1">
                                        {!cardEditing ? (
                                            <>
                                                <button
                                                    type="button"
                                                    onClick={() => editImage(img._id)}
                                                    className="flex h-7 w-7 items-center justify-center rounded-full bg-white/90 text-[#44403C] shadow-md backdrop-blur-sm transition hover:bg-white hover:text-[#1C1917]"
                                                    title="Edit profile"
                                                >
                                                    <PencilSimple size={13} weight="bold" />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => deleteTeamMember(img._id, memberName)}
                                                    className="flex h-7 w-7 items-center justify-center rounded-full bg-white/90 text-rose-600 shadow-md backdrop-blur-sm transition hover:bg-white"
                                                    title="Delete member"
                                                >
                                                    <Trash size={13} weight="bold" />
                                                </button>
                                            </>
                                        ) : (
                                            <>
                                                <button
                                                    type="button"
                                                    onClick={() => saveImageEdit(img._id)}
                                                    className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-600 text-white shadow-md transition hover:bg-emerald-700"
                                                    title="Save"
                                                >
                                                    <Check size={13} weight="bold" />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => cancelImageEdit(img._id)}
                                                    className="flex h-7 w-7 items-center justify-center rounded-full bg-white text-[#44403C] shadow-md transition hover:bg-[#F7F4EF]"
                                                    title="Cancel"
                                                >
                                                    <X size={13} weight="bold" />
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>

                                <div className="p-4 bg-white flex-1 flex flex-col justify-between">
                                    {!cardEditing ? (
                                        <div>
                                            <h3 className="font-serif text-base font-semibold text-[#1C1917] truncate">
                                                {memberName}
                                            </h3>
                                            <p className="mt-0.5 text-xs font-sans text-[#78716C] truncate">
                                                {memberRole}
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="space-y-2">
                                            <input
                                                type="text"
                                                value={img.about?.name || ''}
                                                onChange={(e) => changeAbout(img._id, 'name', e.target.value)}
                                                placeholder="Name"
                                                className="w-full rounded-lg border border-[#C5A880] py-1 px-2 text-xs font-sans text-[#1C1917] outline-none"
                                            />
                                            <input
                                                type="text"
                                                value={img.about?.designation || ''}
                                                onChange={(e) => changeAbout(img._id, 'designation', e.target.value)}
                                                placeholder="Designation"
                                                className="w-full rounded-lg border border-[#C5A880] py-1 px-2 text-xs font-sans text-[#1C1917] outline-none"
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
