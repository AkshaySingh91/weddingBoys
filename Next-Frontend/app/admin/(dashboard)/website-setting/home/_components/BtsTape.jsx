'use client';

import { useEffect, useState } from 'react';
import { fireMessage } from '@/Utils/fireMessage.js';
import { Button } from '@/app/admin/components/ui/Button.jsx';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/app/admin/components/ui/Dialog.jsx';
import {
  Camera,
  Plus,
  Trash,
  UploadSimple,
  CircleNotch,
  X,
  Sparkle,
} from '@phosphor-icons/react';

const api_url = process.env.NEXT_PUBLIC_API_URL;

export default function BtsTape() {
  const [btsImageFile, setBtsImageFile] = useState([]);
  const [btsImagePreview, setBtsImagePreview] = useState([]);
  const [btsImageUrl, setBtsImageUrl] = useState([]);
  const [btsMetaData, setBtsMetaData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleteConfirmKey, setDeleteConfirmKey] = useState(null);

  const fetchBtsImage = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${api_url}/api/homepage/bts-image`);
      const data = await res.json();
      if (res.status >= 300) {
        return fireMessage(data.message, 'error');
      }
      setBtsImageUrl(data.btsUrls || []);
    } catch (error) {
      fireMessage(error.message || 'Error loading BTS gallery', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBtsImage();
  }, []);

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files || []);
    const processedFiles = files.map((file) => {
      const newName = `${file.name.split('.')[0]}_${Date.now()}.${file.type.split('/')[1] || 'jpg'}`;
      const blob = file.slice(0, file.size);
      return new File([blob], newName, { type: file.type });
    });

    const fileMeta = processedFiles.map((f) => ({
      name: f.name,
      size: f.size,
      type: f.type,
    }));

    setBtsMetaData((prev) => [...prev, ...fileMeta]);
    setBtsImageFile((prev) => [...processedFiles, ...prev]);

    const prevUrls = processedFiles.map((img) => ({
      name: img.name,
      url: URL.createObjectURL(img),
    }));
    setBtsImagePreview((prev) => [...prev, ...prevUrls]);
  };

  const handleCancel = () => {
    setBtsImagePreview([]);
    setBtsImageFile([]);
    setBtsMetaData([]);
    setIsEditing(false);
  };

  const handleSave = async (e) => {
    e?.preventDefault();
    if (!btsImageFile.length) {
      return fireMessage('No new images selected for upload.', 'error');
    }

    try {
      setSaving(true);

      const res = await fetch(`${api_url}/api/admin/homepage/bts-image/get-url`, {
        method: 'PUT',
        body: JSON.stringify({ btsMetaData }),
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      if (res.status >= 300 || !data.imgUrls) {
        throw new Error(data.message || 'Failed to acquire upload authorization.');
      }

      // Upload each file to presigned URL
      const filesMetaWithKey = [];
      btsMetaData.forEach((file) => {
        const img = data.imgUrls.find((u) => u.imageName === file.name);
        if (img) {
          filesMetaWithKey.push({ ...file, key: img.imgKey });
        }
      });

      let i = 0;
      for (const urlsObj of data.imgUrls) {
        const fileToUpload = btsImageFile[i];
        if (fileToUpload) {
          await fetch(urlsObj.putUrl, {
            method: 'PUT',
            headers: { 'Content-Type': fileToUpload.type },
            body: fileToUpload,
          });
        }
        i++;
      }

      // Save references in database
      const saveRes = await fetch(`${api_url}/api/admin/homepage/bts-image/save-details`, {
        method: 'PUT',
        body: JSON.stringify({ filesMetaWithKey }),
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });
      const saveData = await saveRes.json();
      if (saveRes.status >= 300) {
        throw new Error(saveData.message || 'Failed to register BTS frames.');
      }

      fireMessage('BTS Marquee photos added successfully.', 'success');
      handleCancel();
      fetchBtsImage();
    } catch (error) {
      fireMessage(error.message || 'Something went wrong during upload.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const deleteBtsImage = async () => {
    if (!deleteConfirmKey) return;
    try {
      setSaving(true);
      const res = await fetch(`${api_url}/api/admin/homepage/bts-image`, {
        method: 'DELETE',
        body: JSON.stringify({ key: deleteConfirmKey }),
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      if (res.status >= 300) {
        throw new Error(data.message || 'Failed to delete photo.');
      }
      setBtsImageUrl((prev) => prev.filter((img) => img.key !== deleteConfirmKey));
      fireMessage('BTS photo deleted successfully.', 'success');
      setDeleteConfirmKey(null);
    } catch (error) {
      fireMessage(error.message || 'Error deleting photo.', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#E5DCD3] pb-4">
        <div>
          <h2 className="flex items-center gap-2 text-xl font-serif text-[#1C1917]">
            <Camera size={20} weight="fill" className="text-[#A3603A]" />
            Behind The Scenes Moving Tape
          </h2>
          <p className="mt-0.5 text-xs text-stone-500">
            Candid crew and production moments rolling horizontally across the homepage banner.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {!isEditing ? (
            <Button
              variant="terracotta"
              size="sm"
              icon={Plus}
              onClick={() => setIsEditing(true)}
            >
              Add BTS Photos
            </Button>
          ) : (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCancel}
                disabled={saving}
              >
                Cancel
              </Button>
              <Button
                variant="terracotta"
                size="sm"
                loading={saving}
                onClick={handleSave}
              >
                {saving ? 'Uploading...' : 'Save Photos'}
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Editing / Upload Dropzone */}
      {isEditing && (
        <div className="rounded-2xl border border-dashed border-[#A3603A]/60 bg-[#FAF1E6]/40 p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-[#A3603A]">
                Select New Production Photos
              </p>
              <p className="text-xs text-stone-500 mt-0.5">
                PNG or JPEG frames. You can select multiple photos simultaneously.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <input
                id="bts-file-input"
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileChange}
                className="hidden"
              />
              <label
                htmlFor="bts-file-input"
                className="inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-[#E5DCD3] bg-white px-3 py-1.5 text-xs font-medium text-stone-700 shadow-sm transition hover:border-[#A3603A] hover:bg-stone-50"
              >
                <UploadSimple size={14} />
                <span>Choose Files</span>
              </label>

              {btsImagePreview.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setBtsImagePreview([]);
                    setBtsImageFile([]);
                    setBtsMetaData([]);
                  }}
                  className="text-stone-500 hover:text-stone-800"
                >
                  Clear Selection
                </Button>
              )}
            </div>
          </div>

          {/* Staged Upload Previews */}
          {btsImagePreview.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 pt-2">
              {btsImagePreview.map((img) => (
                <div key={img.name} className="relative group overflow-hidden rounded-xl border border-[#E5DCD3] bg-white aspect-[4/3]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={img.url}
                    alt="Upload Preview"
                    className="h-full w-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setBtsImagePreview((prev) => prev.filter((f) => f.name !== img.name));
                      setBtsImageFile((prev) => prev.filter((f) => f.name !== img.name));
                      setBtsMetaData((prev) => prev.filter((f) => f.name !== img.name));
                    }}
                    className="absolute top-1.5 right-1.5 p-1 rounded-full bg-stone-900/70 text-white hover:bg-rose-600 transition"
                    title="Remove from batch"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteConfirmKey} onOpenChange={(open) => { if (!open) setDeleteConfirmKey(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Delete BTS Photo?</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove this frame from the homepage BTS tape? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirmKey(null)} disabled={saving}>
              Keep Photo
            </Button>
            <Button variant="danger" onClick={deleteBtsImage} loading={saving}>
              Delete Photo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Live Gallery Strip */}
      {loading ? (
        <div className="flex items-center justify-center py-16 text-stone-400">
          <CircleNotch size={24} className="animate-spin text-[#A3603A]" />
        </div>
      ) : btsImageUrl.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[#E5DCD3] bg-white p-12 text-center">
          <Sparkle size={32} className="mx-auto text-stone-400 mb-2" />
          <h3 className="font-serif text-base text-[#1C1917]">No BTS Photos Yet</h3>
          <p className="text-xs text-stone-500 mt-1 max-w-sm mx-auto">
            Upload candid snapshots from wedding cinematography shoots to showcase your film crew in action.
          </p>
          <Button
            variant="terracotta"
            size="sm"
            icon={Plus}
            className="mt-4"
            onClick={() => setIsEditing(true)}
          >
            Add First Photo
          </Button>
        </div>
      ) : (
        <div className="rounded-2xl border border-[#E5DCD3] bg-white p-5 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-stone-500">
              Active Film Tape Strip ({btsImageUrl.length} frames)
            </span>
            <span className="text-[11px] text-stone-400">
              Hover to delete individual frames
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {btsImageUrl.map((bts) => (
              <div
                key={bts.key}
                className="group relative overflow-hidden rounded-2xl border border-[#E5DCD3] bg-stone-100 aspect-[4/3] shadow-sm transition hover:shadow-md"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={bts.url}
                  alt="BTS production frame"
                  className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                />

                <div className="absolute inset-0 bg-stone-900/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <button
                    type="button"
                    onClick={() => setDeleteConfirmKey(bts.key)}
                    className="p-2 rounded-xl bg-white/90 text-rose-600 hover:bg-rose-600 hover:text-white transition shadow-lg"
                    title="Delete photo"
                  >
                    <Trash size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
