'use client';

import { useState, useEffect } from 'react';
import { fireMessage } from '@/Utils/fireMessage.js';
import { Button } from '@/app/admin/components/ui/Button.jsx';
import { Badge } from '@/app/admin/components/ui/Badge.jsx';
import {
  FilmSlate,
  PencilSimple,
  Tag,
  Check,
  MapPin,
  CalendarBlank,
  CircleNotch,
} from '@phosphor-icons/react';

const api_url = process.env.NEXT_PUBLIC_API_URL;

export default function VideoThumbnail() {
  const [isLoading, setIsLoading] = useState(false);
  const [clients, setClients] = useState([]);
  const [homepageTags, setHomepageTags] = useState([]);
  const [tagsData, setTagsData] = useState([]);
  const [newAddedTags, setNewAddedTags] = useState([]);
  const [selectedTag, setSelectedTag] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const fetchVideos = async (t) => {
    if (!t) return;
    try {
      setIsLoading(true);
      const res = await fetch(`${api_url}/api/videos?tag=${encodeURIComponent(t)}`);
      const data = await res.json();
      if (res.status >= 300) {
        return fireMessage(data.message, 'error');
      }
      setClients(data.client || []);
    } catch (error) {
      fireMessage(error.message, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const fetchHomeTags = async () => {
      try {
        setIsLoading(true);
        const res = await fetch(`${api_url}/api/homepage/tags`);
        const data = await res.json();
        if (res.status >= 300) {
          return fireMessage(data.message, 'error');
        }
        setHomepageTags(data.tags || []);
        setNewAddedTags(data.tags || []);
        if (data.tags?.length > 0) {
          setSelectedTag(data.tags[0]);
          await fetchVideos(data.tags[0]);
        }
      } catch (error) {
        fireMessage(error.message, 'error');
      } finally {
        setIsLoading(false);
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
        setTagsData(data.allTags || []);
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    };

    fetchCategories();
    fetchHomeTags();
  }, []);

  const handleSave = async () => {
    try {
      setSaving(true);
      const res = await fetch(`${api_url}/api/admin/homepage/tags`, {
        method: 'POST',
        credentials: 'include',
        body: JSON.stringify({ newAddedTags }),
        headers: { 'Content-type': 'application/json' },
      });
      const data = await res.json();
      if (res.status >= 300) {
        return fireMessage(data.message, 'error');
      }
      setHomepageTags(data.tags || []);
      setIsEditing(false);
      fireMessage('Homepage showcase tags updated successfully.', 'success');
      if (data.tags?.length && !data.tags.includes(selectedTag)) {
        setSelectedTag(data.tags[0]);
        fetchVideos(data.tags[0]);
      }
    } catch (error) {
      fireMessage(error.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setNewAddedTags(homepageTags);
  };

  const toggleTag = (t) => {
    setNewAddedTags((prev) =>
      prev.includes(t) ? prev.filter((item) => item !== t) : [...prev, t]
    );
  };

  const handleChangeTag = (t) => {
    setSelectedTag(t);
    fetchVideos(t);
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Section Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#E5DCD3] pb-4">
        <div>
          <h2 className="flex items-center gap-2 text-xl font-serif text-[#1C1917]">
            <FilmSlate size={20} weight="fill" className="text-[#A3603A]" />
            Showcase Reel Thumbnails
          </h2>
          <p className="mt-0.5 text-xs text-stone-500">
            Curate the category filter pills and featured video reels showcased on the homepage.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {!isEditing ? (
            <Button
              variant="outline"
              size="sm"
              icon={PencilSimple}
              onClick={() => setIsEditing(true)}
            >
              Curate Tags
            </Button>
          ) : (
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleCancel} disabled={saving}>
                Cancel
              </Button>
              <Button variant="terracotta" size="sm" loading={saving} onClick={handleSave}>
                Save Tag Pills
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Editing Taxonomy Pill Selector */}
      {isEditing && (
        <div className="rounded-2xl border border-[#E5DCD3] bg-[#FCFAF7] p-5 space-y-4">
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[#A3603A]">
              Homepage Filter Taxonomy
            </h3>
            <p className="text-xs text-stone-500 mt-0.5">
              Click tags below to include or exclude them from the homepage film switcher.
            </p>
          </div>

          <div className="space-y-3">
            {tagsData.map((tagType) => (
              <div key={tagType.tagType} className="space-y-1.5">
                <span className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider">
                  {tagType.tagType}
                </span>
                <div className="flex flex-wrap gap-2">
                  {tagType.tags.map((t) => {
                    const isSelected = newAddedTags.includes(t);
                    return (
                      <button
                        key={t}
                        type="button"
                        onClick={() => toggleTag(t)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition cursor-pointer ${
                          isSelected
                            ? 'bg-[#1C1917] text-white shadow-sm'
                            : 'bg-white text-stone-700 border border-[#E5DCD3] hover:border-[#A3603A]'
                        }`}
                      >
                        {isSelected && <Check size={12} className="text-[#C29555]" />}
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

      {/* Category Pills Strip */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {homepageTags.map((t) => {
          const active = selectedTag === t;
          return (
            <button
              key={t}
              onClick={() => handleChangeTag(t)}
              className={`shrink-0 px-4 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer ${
                active
                  ? 'bg-[#A3603A] text-white shadow-sm'
                  : 'bg-white border border-[#E5DCD3] text-stone-700 hover:border-[#A3603A]'
              }`}
            >
              {t}
            </button>
          );
        })}
      </div>

      {/* Videos Horizontal / Grid Display */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16 text-stone-400">
          <CircleNotch size={24} className="animate-spin text-[#A3603A]" />
        </div>
      ) : clients.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[#E5DCD3] bg-white p-12 text-center">
          <FilmSlate size={32} className="mx-auto text-stone-400 mb-2" />
          <h3 className="font-serif text-base text-[#1C1917]">No Films with Tag &ldquo;{selectedTag}&rdquo;</h3>
          <p className="text-xs text-stone-500 mt-1 max-w-sm mx-auto">
            Assign this tag to wedding film shoots in the Wedding Archive to have them appear here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {clients.map((c) => (
            <div
              key={c.videos?._id || c._id}
              className="group relative overflow-hidden rounded-2xl border border-[#E5DCD3] bg-white shadow-sm transition hover:shadow-md"
            >
              <div className="relative aspect-[16/10] overflow-hidden bg-stone-100">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={c.thumbnailUrl}
                  alt={c.clientName?.Bride ? `${c.clientName.Bride} & ${c.clientName.Groom}` : 'Wedding'}
                  className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-stone-950/80 via-stone-950/20 to-transparent" />

                <div className="absolute bottom-3 left-4 right-4 text-white">
                  <div className="flex items-center gap-2 text-[11px] font-medium text-[#E5DCD3]">
                    {c.videos?.videoShootDate && (
                      <span className="flex items-center gap-1">
                        <CalendarBlank size={12} />
                        {c.videos.videoShootDate}
                      </span>
                    )}
                    {c.videos?.videoLocation?.city && (
                      <span className="flex items-center gap-1">
                        <MapPin size={12} className="text-[#C29555]" />
                        {c.videos.videoLocation.city}
                      </span>
                    )}
                  </div>
                  <h4 className="font-serif text-lg font-semibold tracking-tight text-white mt-0.5">
                    {c.clientName?.Bride} & {c.clientName?.Groom}
                  </h4>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
