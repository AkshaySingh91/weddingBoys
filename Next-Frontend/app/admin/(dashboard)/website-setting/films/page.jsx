'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  FilmStrip,
  Play,
  PencilSimple,
  FloppyDisk,
  X,
  Check,
  CaretRight,
  CircleNotch,
  Tag,
} from '@phosphor-icons/react';
import { fireMessage } from '@/Utils/fireMessage.js';
import { Button } from '@/app/admin/components/ui/Button.jsx';
import { Badge } from '@/app/admin/components/ui/Badge.jsx';
import { PageHeader } from '@/app/admin/components/ui/PageHeader.jsx';

const api_url = process.env.NEXT_PUBLIC_API_URL;

export default function FilmsSettingPage() {
  const [newAddedTags, setNewAddedTags] = useState([]);
  const [filmPageTags, setFilmPageTags] = useState([]);
  const [allTags, setAllTags] = useState([]);
  const [allVideos, setAllVideos] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchVideos = async (tag) => {
      try {
        const res = await fetch(`${api_url}/api/videos?tag=${encodeURIComponent(tag)}`);
        const data = await res.json();
        if (res.status >= 300) {
          fireMessage(data.message, 'error');
          return [];
        }
        return data.client || [];
      } catch (error) {
        fireMessage(error.message, 'error');
        return [];
      }
    };

    const fetchFilmPageTags = async () => {
      try {
        const res = await fetch(`${api_url}/api/filmpage/tags`);
        const data = await res.json();
        if (res.status >= 300 || !data.tags) {
          return fireMessage(data.message, 'error');
        }
        setFilmPageTags(data.tags);
        setNewAddedTags(data.tags);
        if (data.tags.length > 0) {
          const rows = [];
          for (const tag of data.tags) {
            const videos = await fetchVideos(tag);
            rows.push({ tagName: tag, videos });
          }
          setAllVideos(rows);
        }
      } catch (error) {
        fireMessage(error.message, 'error');
      } finally {
        setLoading(false);
      }
    };

    const fetchCategories = async () => {
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
      }
    };

    fetchCategories();
    fetchFilmPageTags();
  }, []);

  const handleTags = (t) => {
    if (!isEditing) return;
    setNewAddedTags((prev) =>
      prev.includes(t) ? prev.filter((tag) => tag !== t) : [...prev, t]
    );
  };

  const handleCancel = () => {
    setNewAddedTags(filmPageTags);
    setIsEditing(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`${api_url}/api/admin/filmpage/tags`, {
        method: 'POST',
        body: JSON.stringify({ newAddedTags }),
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });
      const data = await res.json();
      if (res.status >= 300) {
        return fireMessage(data.message, 'error');
      }
      fireMessage('Film showcase tags updated successfully', 'success');
      setFilmPageTags(newAddedTags);
      setIsEditing(false);
    } catch (error) {
      fireMessage(error.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 font-sans">
      <PageHeader
        title="Films Showcase Curator"
        subtitle="Configure the curated category rows and featured film reels displayed on the public /films page."
        breadcrumbs={[
          { label: 'Admin', href: '/admin/dashboard' },
          { label: 'Website Settings' },
          { label: 'Films Page' },
        ]}
      >
        {!isEditing ? (
          <Button
            type="button"
            variant="terracotta"
            size="sm"
            onClick={() => setIsEditing(true)}
            icon={PencilSimple}
          >
            Edit Rows
          </Button>
        ) : (
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleCancel}
              disabled={saving}
              icon={X}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="terracotta"
              size="sm"
              onClick={handleSave}
              loading={saving}
              icon={FloppyDisk}
            >
              Save Selection
            </Button>
          </div>
        )}
      </PageHeader>

      {/* Tag Selection Drawer in Edit Mode */}
      {isEditing && (
        <div className="rounded-2xl border border-[#E5DCD3] bg-white p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2">
            <Tag size={18} weight="bold" className="text-[#A3603A]" />
            <h2 className="text-base font-serif font-semibold text-[#1C1917]">
              Select Showcase Tag Rows
            </h2>
          </div>
          <p className="text-xs text-stone-500">
            Click on tags to include or remove them as carousel rows on the public films showcase.
          </p>

          <div className="space-y-4 pt-2">
            {allTags.map((tagCategory) => (
              <div key={tagCategory._id} className="space-y-2">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-stone-400">
                  {tagCategory.tagType}
                </h3>
                <div className="flex flex-wrap gap-2">
                  {tagCategory.tags.map((t) => {
                    const isSelected = newAddedTags.includes(t);
                    return (
                      <button
                        key={t}
                        type="button"
                        onClick={() => handleTags(t)}
                        className={`flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-medium transition cursor-pointer ${
                          isSelected
                            ? 'border border-[#C29555] bg-[#1C1917] text-white shadow-sm'
                            : 'border border-[#E5DCD3] bg-[#FCFAF7] text-stone-700 hover:border-[#A3603A]'
                        }`}
                      >
                        {isSelected && <Check size={12} weight="bold" className="text-[#C29555]" />}
                        <span>{t}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Films Categories Showcase Preview */}
      {loading ? (
        <div className="flex items-center justify-center p-20 text-sm text-stone-500">
          <CircleNotch size={24} className="animate-spin text-[#A3603A] mr-2.5" />
          Loading films showcase rows…
        </div>
      ) : allVideos.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[#E5DCD3] bg-white p-16 text-center shadow-sm">
          <FilmStrip size={32} className="mx-auto text-[#A3603A] mb-3" />
          <h3 className="text-base font-serif font-semibold text-[#1C1917]">No film rows configured</h3>
          <p className="mt-1 text-xs text-stone-500">
            Click &quot;Edit Rows&quot; above to select the tags and films you want to feature.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {allVideos.map((filmsRow) => (
            <div
              key={filmsRow.tagName}
              className="rounded-2xl border border-[#E5DCD3] bg-white p-6 shadow-sm space-y-4"
            >
              <div className="flex items-center justify-between border-b border-[#E5DCD3]/60 pb-3">
                <div className="flex items-center gap-2.5">
                  <h2 className="text-lg font-serif font-semibold text-[#1C1917]">{filmsRow.tagName}</h2>
                  <Badge variant="neutral">
                    {filmsRow.videos?.length || 0} films
                  </Badge>
                </div>
                <Link
                  href="/allfilms"
                  target="_blank"
                  className="inline-flex items-center gap-1 text-xs font-medium text-stone-500 hover:text-[#1C1917] transition-colors"
                >
                  <span>View on Public Site</span>
                  <CaretRight size={12} weight="bold" />
                </Link>
              </div>

              <div className="overflow-x-auto pb-2 scrollbar-none">
                <div className="flex gap-4 min-w-min">
                  {filmsRow.videos && filmsRow.videos.length > 0 ? (
                    filmsRow.videos.map((video) => (
                      <Link
                        key={video.videos._id}
                        href={`/films/${video.videos._id}`}
                        target="_blank"
                        className="group relative flex w-64 shrink-0 flex-col overflow-hidden rounded-xl border border-[#E5DCD3] bg-[#FCFAF7] transition duration-200 hover:-translate-y-0.5 hover:shadow-md"
                      >
                        <div className="relative aspect-video w-full overflow-hidden bg-[#1C1917]">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            className="h-full w-full object-cover transition duration-300 group-hover:scale-105 opacity-90 group-hover:opacity-100"
                            src={video.videos.thumbnailUrl}
                            alt={video.videos.videoTitle || 'Film'}
                          />
                          <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity">
                            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-[#1C1917] shadow-md backdrop-blur-sm">
                              <Play size={16} weight="fill" className="text-[#A3603A] translate-x-0.5" />
                            </span>
                          </div>
                        </div>
                        <div className="p-3.5">
                          <h3 className="truncate font-serif text-sm font-semibold text-[#1C1917]">
                            {video.videos.videoTitle || `${video.clientName?.Bride} & ${video.clientName?.Groom}`}
                          </h3>
                          <p className="mt-0.5 truncate text-xs text-stone-500">
                            {video.clientName?.Bride} &amp; {video.clientName?.Groom}
                          </p>
                        </div>
                      </Link>
                    ))
                  ) : (
                    <p className="py-4 text-xs text-stone-400">
                      No videos currently tagged under &quot;{filmsRow.tagName}&quot;.
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
