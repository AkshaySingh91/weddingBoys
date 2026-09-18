'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  Tag,
  Plus,
  Trash,
  FloppyDisk,
  X,
  Check,
  CircleNotch,
  FolderPlus,
} from '@phosphor-icons/react';
import { fireMessage } from '@/Utils/fireMessage.js';
import { Button } from '@/app/admin/components/ui/Button.jsx';
import { Badge } from '@/app/admin/components/ui/Badge.jsx';
import { PageHeader } from '@/app/admin/components/ui/PageHeader.jsx';
import { Input } from '@/app/admin/components/ui/Input.jsx';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/app/admin/components/ui/Dialog.jsx';

const api_url = process.env.NEXT_PUBLIC_API_URL;

export default function AddTagPage() {
  const [allTags, setAllTags] = useState([]);
  const [newCategory, setNewCategory] = useState('');
  const [newTag, setNewTag] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [creatingCategory, setCreatingCategory] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState({ open: false, message: '', tags: [], loading: false });

  const fetchCategories = useCallback(async () => {
    try {
      const response = await fetch(`${api_url}/api/get-all-tags`, {
        method: 'GET',
        credentials: 'include',
      });
      const data = await response.json();
      if (response.status >= 300) {
        return fireMessage(data.message, 'error');
      }
      setAllTags(data.allTags || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const addNewCategory = async () => {
    if (!newCategory.trim()) return fireMessage('Please enter a category name', 'error');
    for (const input of newTag) {
      if (!input?.value?.trim()) return fireMessage('Tag keywords cannot be empty', 'error');
    }
    if (!newTag.length) {
      return fireMessage('Add at least one keyword tag', 'error');
    }

    for (let i = 0; i < newTag.length; i++) {
      for (let j = i + 1; j < newTag.length; j++) {
        if (newTag[i].value.toLowerCase().trim() === newTag[j].value.toLowerCase().trim()) {
          return fireMessage('Keyword tags must be unique', 'error');
        }
      }
    }

    setCreatingCategory(true);
    try {
      const response = await fetch(`${api_url}/api/admin/tags`, {
        method: 'POST',
        body: JSON.stringify({
          tagType: newCategory.trim(),
          tags: newTag.map((t) => t.value.trim()),
        }),
        headers: { 'content-type': 'application/json' },
        credentials: 'include',
      });
      const data = await response.json();
      if (response.status >= 300) {
        return fireMessage(data.message, 'error');
      }
      fireMessage('Category and tags added successfully', 'success');
      setNewCategory('');
      setNewTag([]);
      fetchCategories();
    } catch (error) {
      fireMessage(error.message, 'error');
    } finally {
      setCreatingCategory(false);
    }
  };

  const updateAllChanges = async () => {
    setSaving(true);
    try {
      for (const tagDetail of allTags) {
        for (let i = 0; i < tagDetail.tags.length; i++) {
          for (let j = i + 1; j < tagDetail.tags.length; j++) {
            if (tagDetail.tags[i].toLowerCase().trim() === tagDetail.tags[j].toLowerCase().trim()) {
              setSaving(false);
              return fireMessage(`Duplicate keyword "${tagDetail.tags[i]}" inside ${tagDetail.tagType}`, 'error');
            }
          }
        }
      }

      const formattedTags = allTags.map((tagDetail) => ({
        tagType: tagDetail.tagType.charAt(0).toUpperCase() + tagDetail.tagType.slice(1),
        tags: tagDetail.tags.map((t) =>
          t
            .split('-')
            .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
            .join('-')
        ),
      }));

      const response = await fetch(`${api_url}/api/admin/tags`, {
        method: 'PUT',
        body: JSON.stringify({
          tags: formattedTags,
          confirm: false,
        }),
        headers: { 'content-type': 'application/json' },
        credentials: 'include',
      });
      const data = await response.json();
      if (response.status >= 300) {
        return fireMessage(data.message, 'error');
      }

      if (data.confirm) {
        setConfirmDialog({ open: true, message: data.message, tags: formattedTags, loading: false });
      } else {
        fireMessage('Tags updated successfully', 'success');
        fetchCategories();
      }
    } catch (error) {
      fireMessage(error.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const confirmAndSaveTags = async () => {
    setConfirmDialog((prev) => ({ ...prev, loading: true }));
    try {
      const confirmRes = await fetch(`${api_url}/api/admin/tags`, {
        method: 'PUT',
        body: JSON.stringify({
          tags: confirmDialog.tags,
          confirm: true,
        }),
        headers: { 'content-type': 'application/json' },
        credentials: 'include',
      });
      const confirmData = await confirmRes.json();
      if (confirmRes.status >= 300) {
        setConfirmDialog((prev) => ({ ...prev, loading: false }));
        return fireMessage(confirmData.message, 'error');
      }
      fireMessage('Taxonomy changes applied', 'success');
      setConfirmDialog({ open: false, message: '', tags: [], loading: false });
      fetchCategories();
    } catch (error) {
      setConfirmDialog((prev) => ({ ...prev, loading: false }));
      fireMessage(error.message, 'error');
    }
  };

  return (
    <div className="space-y-6 font-sans">
      <PageHeader
        title="Tag Taxonomy Manager"
        subtitle="Organize wedding styles, destinations, venues, and ceremony tags used across the portfolio filter system."
        breadcrumbs={[
          { label: 'Admin', href: '/admin/dashboard' },
          { label: 'Website Settings' },
          { label: 'Portfolio Tags' },
        ]}
      >
        <Button
          type="button"
          variant="terracotta"
          size="sm"
          onClick={updateAllChanges}
          loading={saving}
          icon={FloppyDisk}
        >
          Save All Changes
        </Button>
      </PageHeader>

      {/* Add New Category Card */}
      <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-2">
          <FolderPlus size={18} weight="fill" className="text-red-500" />
          <h2 className="text-base font-sans font-semibold text-[#2F2F2F]">
            Create New Taxonomy Category
          </h2>
        </div>
        <p className="text-xs text-stone-500">
          Add a category type (e.g., Destination, Ceremony, Season) and define its initial keyword tags.
        </p>

        <div className="space-y-3.5 max-w-2xl">
          <input
            type="text"
            placeholder="Category Name (e.g., Destination)"
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            className="w-full rounded-xl border border-stone-200 bg-white py-2.5 px-3.5 text-xs text-[#2F2F2F] placeholder:text-stone-400 outline-none transition focus:border-red-400 focus:ring-1 focus:ring-red-400/20"
          />

          {/* Chips for new tags */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            {newTag.map((input) => (
              <div
                key={input.id}
                className="flex items-center gap-1.5 rounded-xl border border-stone-200 bg-stone-50 py-1 px-2.5 shadow-sm"
              >
                <input
                  className="w-28 bg-transparent text-xs text-[#2F2F2F] outline-none placeholder:text-stone-400"
                  placeholder="Keyword…"
                  onChange={(e) => {
                    const val = e.target.value;
                    setNewTag((prev) =>
                      prev.map((tag) => (tag.id === input.id ? { ...tag, value: val } : tag))
                    );
                  }}
                  type="text"
                  value={input.value}
                />
                <button
                  type="button"
                  onClick={() => setNewTag((prev) => prev.filter((tag) => tag.id !== input.id))}
                  className="rounded-full p-0.5 text-stone-400 hover:bg-stone-200 hover:text-stone-900"
                >
                  <X size={12} weight="bold" />
                </button>
              </div>
            ))}

            <button
              type="button"
              onClick={() => setNewTag((prev) => [...prev, { id: Date.now(), value: '' }])}
              className="inline-flex items-center gap-1 rounded-xl border border-dashed border-stone-300 bg-white py-1.5 px-3 text-xs font-medium text-stone-600 transition hover:border-red-400 hover:text-red-600 cursor-pointer"
            >
              <Plus size={12} weight="bold" /> Add Keyword
            </button>
          </div>

          <div className="pt-2">
            <Button
              type="button"
              variant="terracotta"
              size="sm"
              onClick={addNewCategory}
              loading={creatingCategory}
              icon={Check}
            >
              Create Category
            </Button>
          </div>
        </div>
      </div>

      {/* Existing Categories */}
      {loading ? (
        <div className="flex items-center justify-center p-20 text-sm text-stone-500">
          <CircleNotch size={24} className="animate-spin text-red-500 mr-2.5" />
          Loading taxonomy categories…
        </div>
      ) : allTags.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-stone-200 bg-white p-16 text-center shadow-sm">
          <Tag size={32} className="mx-auto text-stone-300 mb-3" />
          <h3 className="text-base font-sans font-semibold text-[#2F2F2F]">No categories created</h3>
          <p className="mt-1 text-xs text-stone-500">Use the form above to define your first tag taxonomy.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {allTags.map((tag, index) => (
            <div
              key={`${tag.tagType}-${index}`}
              className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm space-y-4"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-stone-100 pb-3">
                <div className="flex items-center gap-3 flex-1 max-w-md">
                  <Tag size={18} weight="fill" className="text-stone-400 shrink-0" />
                  <input
                    type="text"
                    value={tag.tagType}
                    onChange={(e) => {
                      const val = e.target.value;
                      setAllTags((prev) =>
                        prev.map((t, i) => (i === index ? { ...t, tagType: val } : t))
                      );
                    }}
                    className="font-sans text-base font-semibold text-[#2F2F2F] bg-transparent outline-none border-b border-transparent focus:border-red-400 transition-colors w-full"
                  />
                  <Badge variant="neutral">{tag.tags?.length || 0}</Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setAllTags((prev) =>
                        prev.map((t, i) => (i === index ? { ...t, tags: [...(t.tags || []), ''] } : t))
                      )
                    }
                    icon={Plus}
                  >
                    Add Tag
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setAllTags((prev) => prev.filter((_, i) => i !== index))}
                    className="text-rose-600 hover:bg-rose-50"
                    icon={Trash}
                  >
                    Delete Category
                  </Button>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {(tag.tags || []).map((t, tIndex) => (
                  <div
                    key={`${tag.tagType}-${tIndex}`}
                    className="flex items-center gap-1.5 rounded-xl border border-stone-200 bg-stone-50 py-1.5 px-3 transition hover:border-red-400"
                  >
                    <input
                      type="text"
                      value={t}
                      placeholder="Tag name"
                      onChange={(e) => {
                        const val = e.target.value;
                        setAllTags((prev) =>
                          prev.map((item, itemIdx) =>
                            itemIdx === index
                              ? {
                                ...item,
                                tags: item.tags.map((str, sIdx) =>
                                  sIdx === tIndex ? val : str
                                ),
                              }
                              : item
                          )
                        );
                      }}
                      className="w-28 bg-transparent text-xs text-[#2F2F2F] outline-none placeholder:text-stone-400"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setAllTags((prev) =>
                          prev.map((item, itemIdx) =>
                            itemIdx === index
                              ? {
                                ...item,
                                tags: item.tags.filter((_, sIdx) => sIdx !== tIndex),
                              }
                              : item
                          )
                        )
                      }
                      className="rounded-full p-0.5 text-stone-400 hover:bg-stone-200 hover:text-[#2F2F2F]"
                    >
                      <X size={12} weight="bold" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Confirmation Dialog */}
      <Dialog
        open={confirmDialog.open}
        onOpenChange={(open) => !open && setConfirmDialog({ open: false, message: '', tags: [], loading: false })}
      >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Confirm Taxonomy Changes</DialogTitle>
            <DialogDescription className="whitespace-pre-wrap">
              {confirmDialog.message}
              {'\n\n'}Are you sure you want to apply these taxonomy changes?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button
              variant="outline"
              onClick={() => setConfirmDialog({ open: false, message: '', tags: [], loading: false })}
              disabled={confirmDialog.loading}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={confirmAndSaveTags}
              loading={confirmDialog.loading}
            >
              Confirm & Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
