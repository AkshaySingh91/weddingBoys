'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  Tag,
  Plus,
  X,
  Check,
  CircleNotch,
  FolderPlus,
  Info,
} from '@phosphor-icons/react';
import { fireMessage } from '@/Utils/fireMessage.js';
import { Button } from '@/app/admin/components/ui/Button.jsx';
import { Badge } from '@/app/admin/components/ui/Badge.jsx';
import { PageHeader } from '@/app/admin/components/ui/PageHeader.jsx';

const api_url = process.env.NEXT_PUBLIC_API_URL;

export default function AddTagPage() {
  const [allTags, setAllTags] = useState([]);
  const [newCategory, setNewCategory] = useState('');
  const [newTag, setNewTag] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creatingCategory, setCreatingCategory] = useState(false);
  // One draft input per category, keyed by tagType.
  const [termDrafts, setTermDrafts] = useState({});
  const [addingTo, setAddingTo] = useState(null);

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

  // Initial load. Every state update happens after the await, so nothing is set
  // synchronously in the effect body, and a late response after unmount is ignored.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const response = await fetch(`${api_url}/api/get-all-tags`, { credentials: 'include' });
        const data = await response.json();
        if (cancelled) return;
        if (!response.ok) fireMessage(data.message, 'error');
        else setAllTags(data.allTags || []);
      } catch (error) {
        if (!cancelled) fireMessage(error.message, 'error');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

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

  /**
   * Add one term to an existing category.
   *
   * The old "Save All Changes" rewrote the entire vocabulary in one request and
   * never worked: the page sent `{tags, confirm}` while the server read
   * `{allTags, isConfirmed}`, so every save failed with 400. The server-side
   * delete-and-recreate it depended on has been retired (it orphaned tags already
   * stored on portfolio items). Adding is safe and is all this page does now;
   * rename, merge and delete come with the new tag manager.
   */
  const addTerm = async (tagType) => {
    const label = (termDrafts[tagType] || '').trim();
    if (!label) return;
    setAddingTo(tagType);
    try {
      const response = await fetch(`${api_url}/api/admin/tags/${encodeURIComponent(tagType)}/terms`, {
        method: 'POST',
        body: JSON.stringify({ label }),
        headers: { 'content-type': 'application/json' },
        credentials: 'include',
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) return fireMessage(data.message || 'Could not add that tag', 'error');
      setAllTags((prev) => prev.map((c) => (c.tagType === data.tagType ? { ...c, tags: data.tags } : c)));
      setTermDrafts((prev) => ({ ...prev, [tagType]: '' }));
      fireMessage(`Added to ${data.tagType}`, 'success');
    } catch (error) {
      fireMessage(error.message, 'error');
    } finally {
      setAddingTo(null);
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
      />

      <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-900">
        <Info size={18} weight="fill" className="mt-0.5 shrink-0 text-amber-600" />
        <p>
          You can create categories and add tags here. Renaming, merging and deleting tags are
          being rebuilt so they update every photo and film that uses them — until then they are
          switched off, because the old editor left renamed tags stranded on published work.
        </p>
      </div>

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
          {allTags.map((tag) => (
            <div
              key={tag.tagType}
              className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm space-y-4"
            >
              <div className="flex items-center gap-3 border-b border-stone-100 pb-3">
                <Tag size={18} weight="fill" className="text-stone-400 shrink-0" />
                <h2 className="font-sans text-base font-semibold text-[#2F2F2F]">{tag.tagType}</h2>
                <Badge variant="neutral">{tag.tags?.length || 0}</Badge>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {(tag.tags || []).map((t) => (
                  <span
                    key={t}
                    className="rounded-xl border border-stone-200 bg-stone-50 py-1.5 px-3 text-xs text-[#2F2F2F]"
                  >
                    {t}
                  </span>
                ))}

                <form
                  className="flex items-center gap-1.5"
                  onSubmit={(e) => { e.preventDefault(); addTerm(tag.tagType); }}
                >
                  <input
                    type="text"
                    value={termDrafts[tag.tagType] || ''}
                    onChange={(e) => setTermDrafts((prev) => ({ ...prev, [tag.tagType]: e.target.value }))}
                    placeholder="New tag…"
                    aria-label={`New tag in ${tag.tagType}`}
                    className="w-32 rounded-xl border border-dashed border-stone-300 bg-white py-1.5 px-3 text-xs text-[#2F2F2F] outline-none placeholder:text-stone-400 focus:border-red-400"
                  />
                  <Button
                    type="submit"
                    variant="outline"
                    size="sm"
                    icon={Plus}
                    loading={addingTo === tag.tagType}
                    disabled={!(termDrafts[tag.tagType] || '').trim()}
                  >
                    Add
                  </Button>
                </form>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
