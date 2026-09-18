'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  X, ImageSquare, Plus, Trash, Check, Sparkle, Tag as TagIcon,
  CalendarBlank, MapPin, CircleNotch, ArrowClockwise, WarningCircle,
  Users, SlidersHorizontal, CaretRight, ArrowsClockwise, HardDrives
} from '@phosphor-icons/react';
import { Dialog, DialogContent } from '@/app/admin/components/ui/Dialog.jsx';
import { Button } from '@/app/admin/components/ui/Button.jsx';
import { Badge } from '@/app/admin/components/ui/Badge.jsx';
import { formatBytes } from '@/Utils/format.js';
import { createUpload } from '@/lib/upload/multipartUploader.js';
import { fireMessage } from '@/Utils/fireMessage.js';
import { cn } from '@/lib/utils.js';

const api_url = process.env.NEXT_PUBLIC_API_URL;

const EVENT_GROUP_PRESETS = [
  'Haldi',
  'Mehendi',
  'Sangeet',
  'Wedding / Pheras',
  'Reception',
  'Pre-Wedding',
  'Candid & Portraits',
];

const BTS_ROLE_PRESETS = [
  'Cinematographer',
  'Lead Photographer',
  'Candid Photographer',
  'Drone Pilot',
  'Editor',
];

const TAG_PRESETS = [
  'Bride', 'Groom', 'Couple', 'Decor', 'Rituals', 'Candid', 'Family', 'Portraits', 'Baraat'
];

/**
 * Circular / Border Progress Indicator
 */
function CircularProgressBadge({ progress = 0, status = 'queued', size = 52 }) {
  const strokeWidth = 3.5;
  const radius = (size - strokeWidth * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (Math.min(100, Math.max(0, progress)) / 100) * circumference;

  const isDone = status === 'done' || progress >= 100;
  const isError = status === 'error';

  return (
    <div className="relative flex items-center justify-center shrink-0" style={{ width: size, height: size }}>
      <svg className="absolute inset-0 h-full w-full -rotate-90" viewBox={`0 0 ${size} ${size}`}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255, 255, 255, 0.25)"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={isDone ? '#10B981' : isError ? '#EF4444' : '#F59E0B'}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="transition-all duration-200 ease-out"
        />
      </svg>
      <div className="relative z-10 flex flex-col items-center justify-center text-white">
        {isDone ? (
          <Check size={18} weight="bold" className="text-emerald-400" />
        ) : isError ? (
          <X size={18} weight="bold" className="text-rose-400" />
        ) : (
          <span className="font-mono text-[11px] font-bold tracking-tight">
            {Math.round(progress)}%
          </span>
        )}
      </div>
    </div>
  );
}

/**
 * Concurrent Worker Pool: Executes tasks with bounded concurrency (e.g. 5 streams)
 */
async function runConcurrentPool(tasks, concurrency = 5) {
  const results = [];
  let index = 0;

  const worker = async () => {
    while (index < tasks.length) {
      const currentIndex = index++;
      try {
        const res = await tasks[currentIndex]();
        results[currentIndex] = { status: 'fulfilled', value: res };
      } catch (err) {
        results[currentIndex] = { status: 'rejected', reason: err };
      }
    }
  };

  const workers = Array.from({ length: Math.min(concurrency, tasks.length) }, () => worker());
  await Promise.all(workers);
  return results;
}

const EMPTY_FILES = [];

export default function ImageUploadModal({
  open,
  onClose,
  initialFiles = EMPTY_FILES,
  clientId,
  onUploadComplete,
}) {
  const [items, setItems] = useState([]);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [isUploading, setIsUploading] = useState(false);
  const [overallProgress, setOverallProgress] = useState(0);
  const [activeUploadsCount, setActiveUploadsCount] = useState(0);
  const [showDrawer, setShowDrawer] = useState(true);
  const [uploadFinished, setUploadFinished] = useState(false);
  const [uploadedResults, setUploadedResults] = useState([]);

  // Batch curation state
  const [curationTheme, setCurationTheme] = useState('Haldi');
  const [curationDate, setCurationDate] = useState('');
  const [curationCity, setCurationCity] = useState('');
  const [curationVenue, setCurationVenue] = useState('');
  const [curationCredits, setCurationCredits] = useState([]); // [{ role, name }]
  const [creditRoleInput, setCreditRoleInput] = useState('Lead Photographer');
  const [creditNameInput, setCreditNameInput] = useState('');
  const [curationTags, setCurationTags] = useState([]);
  const [customTagInput, setCustomTagInput] = useState('');

  const fileInputRef = useRef(null);
  const prevOpenRef = useRef(false);
  const itemsRef = useRef(items);
  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  const storageKey = useMemo(() => `wb_photo_staging_${clientId || 'default'}`, [clientId]);

  // Restore draft curation metadata from sessionStorage
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.theme) setCurationTheme(parsed.theme);
        if (parsed.date) setCurationDate(parsed.date);
        if (parsed.city) setCurationCity(parsed.city);
        if (parsed.venue) setCurationVenue(parsed.venue);
        if (parsed.credits?.length) setCurationCredits(parsed.credits);
        if (parsed.tags?.length) setCurationTags(parsed.tags);
      }
    } catch { /* ignore sessionStorage error */ }
  }, [storageKey]);

  // Persist draft curation metadata on change
  useEffect(() => {
    try {
      sessionStorage.setItem(
        storageKey,
        JSON.stringify({
          theme: curationTheme,
          date: curationDate,
          city: curationCity,
          venue: curationVenue,
          credits: curationCredits,
          tags: curationTags,
        })
      );
    } catch { /* ignore */ }
  }, [storageKey, curationTheme, curationDate, curationCity, curationVenue, curationCredits, curationTags]);

  // Initialize staged items from incoming initialFiles
  useEffect(() => {
    const wasOpen = prevOpenRef.current;
    prevOpenRef.current = open;

    if (!open) {
      if (wasOpen) {
        // Modal just transitioned from open to closed: revoke preview URLs and reset
        setItems((prev) => {
          prev.forEach((it) => {
            if (it.previewUrl) URL.revokeObjectURL(it.previewUrl);
          });
          return [];
        });
        setSelectedIds(new Set());
        setIsUploading(false);
        setUploadFinished(false);
        setUploadedResults([]);
      }
      return;
    }

    // Modal just opened: populate from initialFiles
    if (!wasOpen && initialFiles && initialFiles.length > 0) {
      const newItems = initialFiles.map((file, idx) => ({
        id: `${file.name}-${file.size}-${Date.now()}-${idx}`,
        file,
        name: file.name,
        size: file.size,
        previewUrl: URL.createObjectURL(file),
        progress: 0,
        status: 'queued', // 'queued' | 'uploading' | 'processing' | 'done' | 'error'
        error: null,
        eventGroup: curationTheme || 'Haldi',
        tags: [...curationTags],
        shootDate: curationDate || '',
        city: curationCity || '',
        venue: curationVenue || '',
        credits: [...curationCredits],
      }));
      setItems(newItems);
      setSelectedIds(new Set(newItems.map((it) => it.id)));
    }
  }, [open, initialFiles]);

  // Clean up remaining object URLs only on unmount
  useEffect(() => {
    return () => {
      itemsRef.current.forEach((it) => {
        if (it.previewUrl) URL.revokeObjectURL(it.previewUrl);
      });
    };
  }, []);

  const totalBytes = useMemo(() => items.reduce((acc, it) => acc + (it.size || 0), 0), [items]);

  const handleAddFiles = (fileList) => {
    const files = Array.from(fileList || []);
    if (!files.length) return;
    const added = files.map((file, idx) => ({
      id: `${file.name}-${file.size}-${Date.now()}-${idx}`,
      file,
      name: file.name,
      size: file.size,
      previewUrl: URL.createObjectURL(file),
      progress: 0,
      status: 'queued',
      error: null,
      eventGroup: curationTheme || 'Haldi',
      tags: [...curationTags],
      shootDate: curationDate || '',
      city: curationCity || '',
      venue: curationVenue || '',
      credits: [...curationCredits],
    }));
    setItems((prev) => [...prev, ...added]);
    setSelectedIds((prev) => new Set([...prev, ...added.map((a) => a.id)]));
  };

  const handleRemoveItem = (id) => {
    if (isUploading) return;
    setItems((prev) => {
      const item = prev.find((it) => it.id === id);
      if (item?.previewUrl) URL.revokeObjectURL(item.previewUrl);
      return prev.filter((it) => it.id !== id);
    });
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  const toggleSelect = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    if (selectedIds.size === items.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(items.map((it) => it.id)));
    }
  };

  // Batch Apply Handlers
  const applyCurationToSelected = () => {
    if (!selectedIds.size) return;
    setItems((prev) =>
      prev.map((it) => {
        if (!selectedIds.has(it.id)) return it;
        return {
          ...it,
          eventGroup: curationTheme || it.eventGroup,
          tags: curationTags.length ? [...curationTags] : it.tags,
          shootDate: curationDate || it.shootDate,
          city: curationCity || it.city,
          venue: curationVenue || it.venue,
          credits: curationCredits.length ? [...curationCredits] : it.credits,
        };
      })
    );
    fireMessage(`Applied event & BTS curation to ${selectedIds.size} photos`, 'success');
  };

  const addCredit = () => {
    if (!creditNameInput.trim()) return;
    setCurationCredits((prev) => [...prev, { role: creditRoleInput, name: creditNameInput.trim() }]);
    setCreditNameInput('');
  };

  const removeCredit = (index) => {
    setCurationCredits((prev) => prev.filter((_, i) => i !== index));
  };

  const toggleTag = (tag) => {
    setCurationTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const addCustomTag = () => {
    const trimmed = customTagInput.trim();
    if (!trimmed) return;
    if (!curationTags.includes(trimmed)) {
      setCurationTags((prev) => [...prev, trimmed]);
    }
    setCustomTagInput('');
  };

  // Parallel Multi-Part Upload Execution
  const startUpload = async () => {
    if (!items.length || isUploading) return;
    setIsUploading(true);
    setUploadFinished(false);

    const uploadedPlacements = [];
    let completedBytes = 0;
    const CONCURRENCY_LIMIT = 5;

    // Create a task for each queued item
    const tasks = items.map((item) => async () => {
      if (item.status === 'done') return null;

      setActiveUploadsCount((c) => c + 1);
      setItems((prev) =>
        prev.map((it) => (it.id === item.id ? { ...it, status: 'uploading', progress: 0 } : it))
      );

      try {
        // Step 1: Upload raw master image directly to R2
        const uploadHandle = createUpload({
          file: item.file,
          ownerType: 'Client',
          ownerId: clientId,
          meta: {
            title: item.name.replace(/\.[^/.]+$/, ''),
            tags: item.tags,
            eventGroup: item.eventGroup,
          },
          onProgress: (loaded, total) => {
            const pct = total ? Math.round((loaded / total) * 100) : 0;
            setItems((prev) =>
              prev.map((it) => (it.id === item.id ? { ...it, progress: pct } : it))
            );
          },
          onStatus: (status) => {
            setItems((prev) =>
              prev.map((it) => (it.id === item.id ? { ...it, status } : it))
            );
          },
        });

        const media = await uploadHandle.promise;

        setItems((prev) =>
          prev.map((it) => (it.id === item.id ? { ...it, status: 'processing', progress: 95 } : it))
        );

        // Step 2: Create PortfolioItem placement with all curated metadata & BTS credits
        const portRes = await fetch(`${api_url}/api/admin/portfolio`, {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            media: media._id,
            client: clientId,
            kind: 'Photo',
            tags: item.tags || [],
            eventGroup: item.eventGroup || '',
            shootDate: item.shootDate || undefined,
            location: (item.city || item.venue) ? { city: item.city, venue: item.venue } : undefined,
            credits: item.credits || [],
            status: 'Published',
          }),
        });

        if (!portRes.ok) {
          const errData = await portRes.json();
          throw new Error(errData.message || 'Portfolio link failed');
        }

        const { item: portfolioDoc } = await portRes.json();
        uploadedPlacements.push(portfolioDoc);

        completedBytes += item.size;
        setOverallProgress(Math.round((completedBytes / totalBytes) * 100));

        setItems((prev) =>
          prev.map((it) => (it.id === item.id ? { ...it, status: 'done', progress: 100 } : it))
        );

        return portfolioDoc;
      } catch (err) {
        console.error('Upload failed for', item.name, err);
        setItems((prev) =>
          prev.map((it) => (it.id === item.id ? { ...it, status: 'error', error: err.message } : it))
        );
        throw err;
      } finally {
        setActiveUploadsCount((c) => Math.max(0, c - 1));
      }
    });

    await runConcurrentPool(tasks, CONCURRENCY_LIMIT);

    setIsUploading(false);
    setUploadFinished(true);
    setUploadedResults(uploadedPlacements);

    // Clear session storage upon successful completion
    try {
      sessionStorage.removeItem(storageKey);
    } catch { /* ignore */ }

    if (uploadedPlacements.length > 0) {
      fireMessage(`Uploaded and curated ${uploadedPlacements.length} photographs!`, 'success');
    }
  };

  const handleFinishAndExit = () => {
    onUploadComplete?.(uploadedResults);
    onClose();
  };

  const doneCount = items.filter((it) => it.status === 'done').length;
  const errorCount = items.filter((it) => it.status === 'error').length;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && !isUploading && onClose()}>
      <DialogContent
        hideCloseButton
        className="max-w-6xl w-[96vw] h-[90vh] max-h-[880px] p-0 overflow-hidden flex flex-col rounded-3xl border border-[#E8DDD1] bg-[#FFFCF8] shadow-2xl"
      >
        {/* Header */}
        <header className="flex items-center justify-between border-b border-[#E8DDD1] px-6 py-4 bg-white shrink-0">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 shrink-0">
              <ImageSquare size={22} weight="bold" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-stone-900 font-sans tracking-tight">
                  {uploadFinished ? 'Photo Ingest & Optimization Summary' : 'Stage & Curate Photographs'}
                </h3>
                <Badge size="sm" variant="neutral">
                  {items.length} file{items.length === 1 ? '' : 's'} · {formatBytes(totalBytes)}
                </Badge>
                {isUploading && (
                  <Badge size="sm" variant="gold" className="animate-pulse">
                    {activeUploadsCount} parallel streams
                  </Badge>
                )}
              </div>
              <p className="text-xs text-stone-500 font-sans">
                {uploadFinished
                  ? 'All master photographs securely stored on R2 with complete BTS and event taxonomy.'
                  : 'Assign event theme, shoot date, venue, and team roles before launching parallel ingest.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!uploadFinished && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                icon={SlidersHorizontal}
                onClick={() => setShowDrawer((v) => !v)}
                className="border-stone-200 text-xs text-stone-700 hover:bg-stone-50"
              >
                {showDrawer ? 'Hide Curation Drawer' : 'Show Curation Drawer'}
              </Button>
            )}

            <button
              type="button"
              disabled={isUploading}
              onClick={uploadFinished ? handleFinishAndExit : onClose}
              className="flex items-center justify-center h-8 w-8 rounded-xl text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors disabled:opacity-50"
            >
              <X size={16} />
              <span className="sr-only">Close</span>
            </button>
          </div>
        </header>

        {/* Post-Upload Ingest Summary State */}
        {uploadFinished ? (
          <div className="flex-1 overflow-y-auto p-8 space-y-6 bg-[#FFFCF8]">
            {/* Success Hero Banner */}
            <div className="rounded-3xl border border-emerald-200 bg-emerald-50/60 p-6 flex items-start gap-4 shadow-sm">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-600 text-white shrink-0 shadow-sm">
                <Check size={28} weight="bold" />
              </span>
              <div className="space-y-1">
                <h4 className="text-base font-bold text-emerald-950 font-sans">
                  Ingest Complete: {doneCount} of {items.length} photographs processed!
                </h4>
                <p className="text-xs text-emerald-900/80 leading-relaxed max-w-2xl">
                  Raw master files have been written directly to Cloudflare R2 bucket with immutable storage keys.
                  Each photo is assigned to this client’s wedding gallery with event theme ({curationTheme}) and BTS credits.
                </p>
              </div>
            </div>

            {/* Derivative Breakdown & Worker Transparency */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="rounded-2xl border border-[#E8DDD1] bg-white p-5 space-y-3">
                <div className="flex items-center gap-2 text-stone-900 font-bold text-xs uppercase tracking-wider">
                  <HardDrives size={18} className="text-amber-600" />
                  <span>Derivative Generation Matrix</span>
                </div>
                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between p-2 rounded-xl bg-stone-50 border border-stone-200/60">
                    <span className="font-semibold text-stone-800">Master Source</span>
                    <Badge size="sm" variant="success">Stored (R2 /orig)</Badge>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded-xl bg-stone-50 border border-stone-200/60">
                    <span className="font-semibold text-stone-800">Web Resolutions (2400w, 1600w, 1024w, 640w)</span>
                    <Badge size="sm" variant="gold">Worker Transcode</Badge>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded-xl bg-stone-50 border border-stone-200/60">
                    <span className="font-semibold text-stone-800">BlurHash Placeholder (LQIP)</span>
                    <Badge size="sm" variant="gold">Background Queue</Badge>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-[#E8DDD1] bg-white p-5 space-y-3">
                <div className="flex items-center gap-2 text-stone-900 font-bold text-xs uppercase tracking-wider">
                  <Sparkle size={18} className="text-amber-600" />
                  <span>Curated Wedding Taxonomy</span>
                </div>
                <div className="space-y-2 text-xs text-stone-600">
                  <p><span className="font-semibold text-stone-900">Event Group:</span> {curationTheme}</p>
                  <p><span className="font-semibold text-stone-900">Shoot Date:</span> {curationDate || 'Not specified'}</p>
                  <p><span className="font-semibold text-stone-900">Location:</span> {[curationCity, curationVenue].filter(Boolean).join(', ') || 'Not specified'}</p>
                  <p><span className="font-semibold text-stone-900">BTS Team:</span> {curationCredits.length ? curationCredits.map((c) => `${c.role}: ${c.name}`).join(' · ') : 'None assigned'}</p>
                  <p><span className="font-semibold text-stone-900">Tags:</span> {curationTags.length ? curationTags.join(', ') : 'None'}</p>
                </div>
              </div>
            </div>

            {errorCount > 0 && (
              <div className="rounded-2xl border border-rose-200 bg-rose-50/70 p-4 text-xs text-rose-900 flex items-center gap-3">
                <WarningCircle size={20} className="text-rose-600 shrink-0" />
                <span>{errorCount} file(s) failed during network upload. You can retry them or upload them separately.</span>
              </div>
            )}
          </div>
        ) : (
          /* Main Pre-Flight & Staging View with Side Curation Drawer */
          <div className="flex-1 flex overflow-hidden">
            {/* Left/Middle: Staged Photos Grid */}
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Action Ribbon */}
              <div className="border-b border-[#E8DDD1] bg-[#FFFDF9] px-6 py-2.5 shrink-0 flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    disabled={isUploading}
                    onClick={selectAll}
                    className="font-semibold text-stone-700 hover:text-stone-950 underline cursor-pointer text-xs"
                  >
                    {selectedIds.size === items.length ? 'Deselect All' : `Select All (${items.length})`}
                  </button>
                  <span className="text-stone-300">·</span>
                  <span className="text-stone-500 font-medium text-xs">
                    {selectedIds.size} of {items.length} selected
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/avif,image/heic,.jpg,.jpeg,.png,.webp,.heic"
                    multiple
                    hidden
                    onChange={(e) => handleAddFiles(e.target.files)}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={isUploading}
                    icon={Plus}
                    onClick={() => fileInputRef.current?.click()}
                    className="border-stone-200 text-stone-700 hover:bg-stone-50 text-xs"
                  >
                    Add Photos
                  </Button>
                </div>
              </div>

              {/* Grid Viewport */}
              <div className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-stone-200">
                {!items.length ? (
                  <div className="flex flex-col items-center justify-center h-full text-center py-16 space-y-3">
                    <span className="flex h-16 w-16 items-center justify-center rounded-3xl bg-amber-50 text-amber-700">
                      <ImageSquare size={32} />
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-stone-800">No photographs staged</p>
                      <p className="text-xs text-stone-500">Pick or drop image files to stage for this wedding</p>
                    </div>
                    <Button
                      type="button"
                      variant="gold"
                      size="sm"
                      icon={Plus}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      Browse Photos
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5">
                    {items.map((it) => {
                      const isSelected = selectedIds.has(it.id);
                      const isItemUploading = it.status === 'uploading' || it.status === 'processing';
                      const isItemDone = it.status === 'done';
                      const isItemError = it.status === 'error';

                      return (
                        <div
                          key={it.id}
                          onClick={() => !isUploading && toggleSelect(it.id)}
                          className={cn(
                            'group relative flex flex-col overflow-hidden rounded-2xl border bg-white transition-all cursor-pointer select-none',
                            isSelected
                              ? 'border-amber-600 ring-2 ring-amber-500/25 shadow-sm'
                              : 'border-stone-200/90 hover:border-stone-300'
                          )}
                        >
                          {/* Thumbnail Viewport */}
                          <div className="relative aspect-[4/3] w-full overflow-hidden bg-stone-100">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={it.previewUrl}
                              alt={it.name}
                              className={cn(
                                'h-full w-full object-cover transition-transform duration-300 group-hover:scale-105',
                                (isItemUploading || isItemDone) && 'filter brightness-[0.7]'
                              )}
                            />

                            {/* Checkbox */}
                            {!isUploading && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleSelect(it.id);
                                }}
                                className={cn(
                                  'absolute top-2 left-2 z-10 flex h-5 w-5 items-center justify-center rounded-md border transition-all shadow-xs',
                                  isSelected
                                    ? 'bg-amber-600 border-amber-600 text-white'
                                    : 'bg-white/85 border-stone-300 text-transparent hover:border-amber-500'
                                )}
                              >
                                <Check size={11} weight="bold" />
                              </button>
                            )}

                            {/* Remove Item */}
                            {!isUploading && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRemoveItem(it.id);
                                }}
                                className="absolute top-2 right-2 z-10 flex h-5 w-5 items-center justify-center rounded-md bg-stone-900/60 text-white opacity-0 group-hover:opacity-100 hover:bg-rose-600 transition-all"
                              >
                                <X size={11} />
                              </button>
                            )}

                            {/* Parallel Progress Badge */}
                            {(isItemUploading || isItemDone || isItemError) && (
                              <div className="absolute inset-0 flex items-center justify-center bg-black/45 backdrop-blur-[2px]">
                                <CircularProgressBadge progress={it.progress} status={it.status} size={50} />
                              </div>
                            )}
                          </div>

                          {/* Metadata Summary on Card */}
                          <div className="p-2.5 space-y-1 bg-white">
                            <p className="truncate font-sans text-[11px] font-semibold text-stone-900" title={it.name}>
                              {it.name}
                            </p>
                            <div className="flex items-center justify-between text-[10px] text-stone-500">
                              <span>{formatBytes(it.size)}</span>
                              <span className="rounded-md bg-amber-50 border border-amber-200/70 px-1.5 py-0.2 font-medium text-amber-900">
                                {it.eventGroup}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Right Drawer: Single-Step Event Theming & BTS Details */}
            {showDrawer && (
              <aside className="w-80 border-l border-[#E8DDD1] bg-white flex flex-col shrink-0 overflow-y-auto p-5 space-y-5 scrollbar-thin">
                <div>
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-stone-900 flex items-center gap-1.5">
                      <SlidersHorizontal size={14} className="text-amber-600" />
                      Batch Curation & BTS
                    </h4>
                    <span className="text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded-md font-medium">
                      Auto-Saved Draft
                    </span>
                  </div>
                  <p className="text-[11px] text-stone-500 mt-1">
                    Apply event themes and crew roles to {selectedIds.size} selected photo{selectedIds.size === 1 ? '' : 's'}.
                  </p>
                </div>

                {/* 1. Event Theme Selector */}
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-stone-800 uppercase tracking-wide block">
                    Event Theme / Ceremony
                  </label>
                  <div className="grid grid-cols-2 gap-1.5">
                    {EVENT_GROUP_PRESETS.map((group) => (
                      <button
                        key={group}
                        type="button"
                        onClick={() => setCurationTheme(group)}
                        className={cn(
                          'rounded-xl px-2.5 py-1.5 text-[11px] font-medium transition-all border text-left truncate cursor-pointer',
                          curationTheme === group
                            ? 'bg-amber-600 text-white border-amber-600 shadow-2xs'
                            : 'bg-white text-stone-700 border-stone-200 hover:border-amber-300'
                        )}
                      >
                        {group}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 2. Shoot Date & Location */}
                <div className="space-y-2.5 pt-1">
                  <div>
                    <label className="text-[11px] font-bold text-stone-800 uppercase tracking-wide block mb-1">
                      Shoot Date
                    </label>
                    <div className="relative">
                      <CalendarBlank size={14} className="absolute left-2.5 top-2.5 text-stone-400" />
                      <input
                        type="date"
                        value={curationDate}
                        onChange={(e) => setCurationDate(e.target.value)}
                        className="w-full pl-8 pr-2.5 py-1.5 text-xs rounded-xl border border-stone-200 focus:outline-none focus:border-amber-600 bg-stone-50/50"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[11px] font-bold text-stone-800 uppercase tracking-wide block mb-1">
                        City
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Udaipur"
                        value={curationCity}
                        onChange={(e) => setCurationCity(e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs rounded-xl border border-stone-200 focus:outline-none focus:border-amber-600 bg-stone-50/50"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-stone-800 uppercase tracking-wide block mb-1">
                        Venue
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Oberoi"
                        value={curationVenue}
                        onChange={(e) => setCurationVenue(e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs rounded-xl border border-stone-200 focus:outline-none focus:border-amber-600 bg-stone-50/50"
                      />
                    </div>
                  </div>
                </div>

                {/* 3. Team Member BTS Roles */}
                <div className="space-y-2 pt-1 border-t border-stone-100">
                  <label className="text-[11px] font-bold text-stone-800 uppercase tracking-wide block flex items-center justify-between">
                    <span>BTS Team & Crew</span>
                    <Users size={14} className="text-stone-400" />
                  </label>

                  <div className="space-y-1.5">
                    <div className="flex gap-1.5">
                      <select
                        value={creditRoleInput}
                        onChange={(e) => setCreditRoleInput(e.target.value)}
                        className="w-1/2 text-xs rounded-xl border border-stone-200 px-2 py-1.5 bg-stone-50/50 focus:outline-none focus:border-amber-600"
                      >
                        {BTS_ROLE_PRESETS.map((r) => (
                          <option key={r} value={r}>{r}</option>
                        ))}
                      </select>
                      <input
                        type="text"
                        placeholder="Crew Name"
                        value={creditNameInput}
                        onChange={(e) => setCreditNameInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addCredit())}
                        className="w-1/2 text-xs rounded-xl border border-stone-200 px-2 py-1.5 bg-stone-50/50 focus:outline-none focus:border-amber-600"
                      />
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={addCredit}
                        className="px-2 border-stone-200 text-stone-700 shrink-0"
                      >
                        <Plus size={12} />
                      </Button>
                    </div>

                    {/* Active Crew Chips */}
                    {curationCredits.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-1">
                        {curationCredits.map((c, i) => (
                          <span
                            key={i}
                            className="inline-flex items-center gap-1 rounded-lg bg-stone-100 border border-stone-200 px-2 py-0.5 text-[10px] text-stone-800"
                          >
                            <span className="font-semibold text-amber-900">{c.role}:</span> {c.name}
                            <button
                              type="button"
                              onClick={() => removeCredit(i)}
                              className="text-stone-400 hover:text-rose-600 ml-0.5"
                            >
                              <X size={10} />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* 4. Tags */}
                <div className="space-y-2 pt-1 border-t border-stone-100">
                  <label className="text-[11px] font-bold text-stone-800 uppercase tracking-wide block">
                    Curated Tags
                  </label>
                  <div className="flex flex-wrap gap-1">
                    {TAG_PRESETS.map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => toggleTag(tag)}
                        className={cn(
                          'rounded-lg px-2 py-0.5 text-[10px] font-medium transition-all border cursor-pointer',
                          curationTags.includes(tag)
                            ? 'bg-amber-100 border-amber-300 text-amber-900 font-semibold'
                            : 'bg-white border-stone-200 text-stone-600 hover:border-stone-300'
                        )}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>

                  <div className="flex gap-1.5 pt-1">
                    <input
                      type="text"
                      placeholder="Add custom tag..."
                      value={customTagInput}
                      onChange={(e) => setCustomTagInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomTag())}
                      className="flex-1 text-xs rounded-xl border border-stone-200 px-2.5 py-1 focus:outline-none focus:border-amber-600"
                    />
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={addCustomTag}
                      className="text-xs border-stone-200 px-2"
                    >
                      Add
                    </Button>
                  </div>
                </div>

                {/* Apply Button */}
                <div className="pt-3 border-t border-stone-200">
                  <Button
                    type="button"
                    variant="gold"
                    size="sm"
                    disabled={!selectedIds.size || isUploading}
                    onClick={applyCurationToSelected}
                    className="w-full bg-stone-900 hover:bg-stone-800 text-white font-semibold shadow-xs"
                  >
                    Apply to {selectedIds.size} Selected Photos
                  </Button>
                </div>
              </aside>
            )}
          </div>
        )}

        {/* Footer Actions */}
        <footer className="flex items-center justify-between border-t border-[#E8DDD1] bg-white px-6 py-4 shrink-0">
          <div className="flex items-center gap-3">
            {isUploading && (
              <div className="flex items-center gap-2">
                <CircleNotch size={18} className="animate-spin text-amber-600" />
                <span className="text-xs font-semibold text-stone-800">
                  Parallel R2 Ingest ({activeUploadsCount} concurrent streams · {overallProgress}% total)
                </span>
              </div>
            )}
            {!isUploading && uploadFinished && (
              <span className="text-xs font-semibold text-emerald-700 flex items-center gap-1.5">
                <Check size={16} weight="bold" /> {doneCount} photos ready with full wedding taxonomy.
              </span>
            )}
            {!isUploading && !uploadFinished && (
              <span className="text-xs text-stone-500">
                {selectedIds.size} of {items.length} photos selected for batch curation
              </span>
            )}
          </div>

          <div className="flex items-center gap-2.5">
            {uploadFinished ? (
              <Button
                type="button"
                variant="gold"
                size="sm"
                onClick={handleFinishAndExit}
                className="bg-stone-900 hover:bg-stone-800 text-white font-semibold px-5 shadow-xs"
              >
                Finish & View Client Gallery
              </Button>
            ) : (
              <>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={isUploading}
                  onClick={onClose}
                  className="border-stone-200 text-stone-700 hover:bg-stone-50"
                >
                  Cancel
                </Button>

                <Button
                  type="button"
                  variant="gold"
                  size="sm"
                  loading={isUploading}
                  disabled={!items.length || isUploading}
                  icon={Sparkle}
                  onClick={startUpload}
                  className="bg-stone-900 hover:bg-stone-800 text-white font-semibold shadow-xs"
                >
                  Upload {items.length} Photographs (Parallel)
                </Button>
              </>
            )}
          </div>
        </footer>
      </DialogContent>
    </Dialog>
  );
}
