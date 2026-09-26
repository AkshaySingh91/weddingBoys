'use client';

import { useState } from 'react';
import { fireMessage } from '@/Utils/fireMessage.js';
import { Button } from '@/app/admin/components/ui/Button.jsx';
import { Input } from '@/app/admin/components/ui/Input.jsx';
import { Textarea } from '@/app/admin/components/ui/Textarea.jsx';
import { Select } from '@/app/admin/components/ui/Select.jsx';
import WeddingSelect from './WeddingSelect.jsx';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/app/admin/components/ui/Dialog.jsx';
import { UploadSimple, Trash, CircleNotch } from '@phosphor-icons/react';

const api_url = process.env.NEXT_PUBLIC_API_URL;

export default function ReviewEdit({ setIsEditing, setEditingReview, editingReview }) {
  const [file, setFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [fileUrl, setFileUrl] = useState(editingReview?.url || null);
  const [saving, setSaving] = useState(false);

  const handleFileChange = (e) => {
    if (e.target.files?.[0]) {
      const f = e.target.files[0];
      const name = `${f.name.split('.')[0]}_${Date.now()}.${f.type.split('/')[1] || 'jpg'}`;
      const blob = f.slice(0, f.size);
      const newFile = new File([blob], name, { type: f.type });
      setFilePreview(URL.createObjectURL(newFile));
      setFile(newFile);
      setFileUrl(null);
      setEditingReview((prev) => ({
        ...prev,
        photo: { name, size: newFile.size, type: newFile.type },
      }));
    }
  };

  const handleClearImage = () => {
    setFileUrl(null);
    setFilePreview(null);
    setFile(null);
    setEditingReview((prev) => ({ ...prev, photo: null }));
  };

  const handleSaveDetails = async () => {
    if (!editingReview?.reviewText?.trim()) {
      return fireMessage('Review testimonial text is required.', 'error');
    }
    if (!editingReview?.person?.name?.trim()) {
      return fireMessage('Client name is required.', 'error');
    }

    try {
      setSaving(true);

      const uploadFileInBucket = async (f, presignedUrl) => {
        const response = await fetch(presignedUrl, {
          method: 'PUT',
          headers: { 'Content-Type': f.type },
          body: f,
        });
        if (response.ok && response.status === 200) {
          return { isValid: true };
        }
        return { isValid: false, msg: response.statusText };
      };

      const saveReview = async (urls) => {
        const res = await fetch(`${api_url}/api/admin/review/save-details`, {
          method: 'PUT',
          body: JSON.stringify({
            editingReview: {
              ...editingReview,
              photo: { key: urls.key },
            },
            isNewFile: true,
          }),
          credentials: 'include',
          headers: { 'Content-type': 'application/json' },
        });
        const data = await res.json();
        if (res.status >= 300) {
          return { isValid: false, msg: data.message || 'Unable to save review details.' };
        }
        return { isValid: true, msg: 'Review updated successfully.' };
      };

      if (!file) {
        // Save only text details
        const res = await fetch(`${api_url}/api/review/get-put-url`, {
          method: 'PUT',
          body: JSON.stringify({ editingReview }),
          credentials: 'include',
          headers: { 'Content-type': 'application/json' },
        });
        const data = await res.json();
        if (res.status >= 300) {
          fireMessage(data.message || 'Failed to update review.', 'error');
        } else {
          fireMessage(data.message || 'Review updated successfully.', 'success');
          setIsEditing(false);
          setEditingReview(null);
        }
      } else {
        // Upload new photo
        const res = await fetch(`${api_url}/api/admin/review/get-put-url`, {
          method: 'PUT',
          body: JSON.stringify({ editingReview }),
          credentials: 'include',
          headers: { 'Content-type': 'application/json' },
        });
        const data = await res.json();
        if (res.status >= 300 || !data.urls) {
          throw new Error(data.message || 'Failed to obtain upload URL.');
        }

        const urls = data.urls;
        if (urls.putUrl) {
          const uploadRes = await uploadFileInBucket(file, urls.putUrl);
          if (!uploadRes.isValid) {
            throw new Error(uploadRes.msg || 'Failed to upload photo to storage.');
          }

          const saveRes = await saveReview(urls);
          if (saveRes.isValid) {
            fireMessage(saveRes.msg, 'success');
            setIsEditing(false);
            setEditingReview(null);
          } else {
            throw new Error(saveRes.msg || 'Failed to save review details.');
          }
        }
      }
    } catch (error) {
      fireMessage(error.message || 'Something went wrong while saving.', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open onOpenChange={(open) => { if (!open) { setIsEditing(false); setEditingReview(null); } }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit Couple Testimonial</DialogTitle>
          <DialogDescription>
            Update the couple note, client attribution, and portrait photograph displayed on the homepage.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Portrait Photo Upload */}
          <div className="space-y-2">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-stone-600">
              Couple Portrait
            </label>
            <div className="flex items-center gap-4">
              <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl border border-[#E5DCD3] bg-stone-100 flex items-center justify-center">
                {filePreview || fileUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={filePreview || fileUrl}
                    alt="Couple Preview"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <UploadSimple size={24} className="text-stone-400" />
                )}
              </div>

              <div className="flex flex-col gap-2">
                <input
                  id="edit-review-photo"
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <label
                  htmlFor="edit-review-photo"
                  className="inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-[#E5DCD3] bg-white px-3 py-1.5 text-xs font-medium text-stone-700 shadow-sm transition hover:border-[#A3603A] hover:bg-stone-50"
                >
                  <UploadSimple size={14} />
                  <span>Choose Photo</span>
                </label>

                {(filePreview || fileUrl) && (
                  <button
                    type="button"
                    onClick={handleClearImage}
                    className="inline-flex items-center gap-1 text-[11px] font-medium text-rose-600 hover:text-rose-700 transition"
                  >
                    <Trash size={12} />
                    <span>Remove Photo</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Review Text */}
          <Textarea
            label="Love Note / Review Text"
            rows={4}
            value={editingReview?.reviewText || ''}
            onChange={(e) =>
              setEditingReview((prev) => ({ ...prev, reviewText: e.target.value }))
            }
            placeholder="Write the heartfelt couple testimonial..."
            maxLength={500}
          />

          {/* Client Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Client Name"
              value={editingReview?.person?.name || ''}
              onChange={(e) =>
                setEditingReview((prev) => ({
                  ...prev,
                  person: { ...prev.person, name: e.target.value },
                }))
              }
              placeholder="e.g. Ananya & Kabir"
            />

            <Select
              label="Role / Title"
              value={editingReview?.person?.gender || 'Bride'}
              onChange={(e) =>
                setEditingReview((prev) => ({
                  ...prev,
                  person: { ...prev.person, gender: e.target.value },
                }))
              }
              options={[
                { value: 'Bride', label: 'Bride' },
                { value: 'Groom', label: 'Groom' },
                { value: 'Couple', label: 'Couple' },
                { value: 'Family', label: 'Family' },
              ]}
            />
          </div>

          <WeddingSelect
            value={editingReview?.client}
            onChange={(client) => setEditingReview((prev) => ({ ...prev, client }))}
          />
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              setIsEditing(false);
              setEditingReview(null);
            }}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button
            variant="terracotta"
            onClick={handleSaveDetails}
            loading={saving}
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
