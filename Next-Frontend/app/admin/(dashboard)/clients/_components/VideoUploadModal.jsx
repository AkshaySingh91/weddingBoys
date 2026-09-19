'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  X, FilmSlate, Plus, Trash, Check, Sparkle, Tag as TagIcon,
  CalendarBlank, MapPin, CircleNotch, ArrowClockwise, WarningCircle,
  Star, SpeakerSimpleSlash, Repeat, Play, Pause, HardDrives, CheckCircle
} from '@phosphor-icons/react';
import { Dialog, DialogContent } from '@/app/admin/components/ui/Dialog.jsx';
import { Button } from '@/app/admin/components/ui/Button.jsx';
import { Badge } from '@/app/admin/components/ui/Badge.jsx';
import { formatBytes } from '@/Utils/format.js';
import { createUpload } from '@/lib/upload/multipartUploader.js';
import { fireMessage } from '@/Utils/fireMessage.js';
import { cn } from '@/lib/utils.js';

const api_url = process.env.NEXT_PUBLIC_API_URL;

const DEFAULT_VIDEO_CEREMONIES = [
  'Teaser / Trailer',
  'Highlights Film',
  'Full Wedding Film',
  'Pre-Wedding Film',
  'Sangeet Night',
  'Haldi & Mehendi',
  'Reception Party',
];

/**
 * Circular / Border Progress Indicator for Videos
 */
function CircularProgressBadge({ progress = 0, status = 'queued', size = 56 }) {
  const strokeWidth = 4;
  const radius = (size - strokeWidth * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (Math.min(100, Math.max(0, progress)) / 100) * circumference;

  const isDone = status === 'done' || progress >= 100;
  const isError = status === 'error';
  const isProcessing = status === 'processing';

  return (
    <div className="relative flex items-center justify-center shrink-0" style={{ width: size, height: size }}>
      <svg className="absolute inset-0 h-full w-full -rotate-90" viewBox={`0 0 ${size} ${size}`}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255, 255, 255, 0.2)"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={isDone ? '#10B981' : isError ? '#EF4444' : isProcessing ? '#8B5CF6' : '#F59E0B'}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="transition-all duration-200 ease-out"
        />
      </svg>
      <div className="relative z-10 flex flex-col items-center justify-center text-white">
        {isDone ? (
          <Check size={20} weight="bold" className="text-emerald-400" />
        ) : isError ? (
          <X size={20} weight="bold" className="text-rose-400" />
        ) : isProcessing ? (
          <CircleNotch size={18} className="animate-spin text-purple-300" />
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
 * Interactive Video Card with Real Playable HTML5 Preview
 */
function StagedVideoPreview({ file, isUploading, isDone, isSelected, onToggleSelect, it, onUpdateOption, onRemove, ceremonyOptions }) {
  const [objectUrl, setObjectUrl] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const videoRef = useRef(null);

  useEffect(() => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    setObjectUrl(url);
    return () => {
      URL.revokeObjectURL(url);
    };
  }, [file]);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
    }
  };

  const formatDuration = (sec) => {
    if (!sec || isNaN(sec)) return '--:--';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div
      className={cn(
        'group rounded-2xl border bg-white p-4 transition-all flex flex-col sm:flex-row items-start sm:items-center gap-4',
        isSelected && !isDone
          ? 'border-stone-900 ring-2 ring-stone-900/15 shadow-sm'
          : 'border-stone-200 hover:border-stone-300'
      )}
    >
      {/* HTML5 Video Thumbnail Viewport */}
      <div className="relative aspect-video w-full sm:w-56 shrink-0 overflow-hidden rounded-xl bg-stone-950 flex items-center justify-center">
        {objectUrl && (
          <video
            ref={videoRef}
            src={objectUrl}
            muted
            playsInline
            onLoadedMetadata={(e) => setDuration(e.target.duration)}
            onEnded={() => setIsPlaying(false)}
            className="h-full w-full object-cover"
          />
        )}

        {/* Selection Checkbox */}
        {!isUploading && !isDone && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleSelect(it.id);
            }}
            className={cn(
              'absolute top-2 left-2 z-20 flex h-5 w-5 items-center justify-center rounded-md border transition-all shadow-sm',
              isSelected
                ? 'bg-stone-900 border-stone-900 text-white'
                : 'bg-white/85 border-stone-300 text-transparent hover:border-stone-700'
            )}
          >
            <Check size={11} weight="bold" />
          </button>
        )}

        {/* Done Checkmark */}
        {isDone && (
          <div className="absolute top-2 right-2 z-20 flex h-6 w-6 items-center justify-center rounded-full bg-emerald-600 text-white shadow-sm">
            <Check size={14} weight="bold" />
          </div>
        )}

        {/* Play/Pause Button Overlay */}
        {!isUploading && !isDone && (
          <button
            type="button"
            onClick={togglePlay}
            className="absolute inset-0 z-10 flex items-center justify-center bg-black/25 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-stone-900/80 text-white shadow-md">
              {isPlaying ? <Pause size={18} weight="fill" /> : <Play size={18} weight="fill" className="ml-0.5" />}
            </span>
          </button>
        )}

        {/* Duration Chip */}
        <div className="absolute bottom-2 right-2 z-10 rounded-md bg-black/70 px-1.5 py-0.5 font-mono text-[10px] text-white">
          {formatDuration(duration)}
        </div>

        {/* Upload Progress Loader */}
        {(it.status === 'uploading' || it.status === 'processing') && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/60 backdrop-blur-[2px]">
            <CircularProgressBadge progress={it.progress} status={it.status} size={52} />
          </div>
        )}
      </div>

      {/* Video Attributes & Controls */}
      <div className="flex-1 min-w-0 space-y-2.5 w-full">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h4 className="font-sans text-xs sm:text-sm font-bold text-stone-900 truncate" title={it.name}>
              {it.name}
            </h4>
            <p className="text-[11px] text-stone-500">{formatBytes(it.size)}</p>
          </div>

          {!isUploading && !isDone && (
            <button
              type="button"
              onClick={() => onRemove(it.id)}
              className="text-stone-400 hover:text-rose-600 p-1 transition-colors"
            >
              <Trash size={15} />
            </button>
          )}
        </div>

        {/* Film Options: Ceremony, Hero, Silent Loop, Strip Audio */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          {/* Ceremony Group */}
          <select
            disabled={isUploading || isDone}
            value={it.eventGroup || ''}
            onChange={(e) => onUpdateOption(it.id, 'eventGroup', e.target.value)}
            className="text-xs rounded-xl border border-stone-200 bg-stone-50/70 px-2.5 py-1 text-stone-800 focus:outline-none focus:border-stone-900"
          >
            <option value="">Ceremony: General</option>
            {ceremonyOptions.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          {/* Hero Switch */}
          <button
            type="button"
            disabled={isUploading || isDone}
            onClick={() => onUpdateOption(it.id, 'isHero', !it.isHero)}
            className={cn(
              'flex items-center gap-1.5 rounded-xl border px-2.5 py-1 text-xs font-medium transition-all',
              it.isHero
                ? 'bg-amber-50 border-amber-300 text-amber-900 font-semibold'
                : 'bg-white border-stone-200 text-stone-600 hover:border-stone-300'
            )}
          >
            <Star size={13} weight={it.isHero ? 'fill' : 'regular'} className={it.isHero ? 'text-amber-600' : ''} />
            <span>Hero Film</span>
          </button>

          {/* 8s Silent Loop Switch */}
          <button
            type="button"
            disabled={isUploading || isDone}
            onClick={() => onUpdateOption(it.id, 'makeLoop', !it.makeLoop)}
            className={cn(
              'flex items-center gap-1.5 rounded-xl border px-2.5 py-1 text-xs font-medium transition-all',
              it.makeLoop
                ? 'bg-purple-50 border-purple-300 text-purple-900 font-semibold'
                : 'bg-white border-stone-200 text-stone-600 hover:border-stone-300'
            )}
          >
            <Repeat size={13} weight={it.makeLoop ? 'bold' : 'regular'} className={it.makeLoop ? 'text-purple-600' : ''} />
            <span>Generate 8s Loop</span>
          </button>

          {/* Strip Audio Switch */}
          <button
            type="button"
            disabled={isUploading || isDone}
            onClick={() => onUpdateOption(it.id, 'stripAudio', !it.stripAudio)}
            className={cn(
              'flex items-center gap-1.5 rounded-xl border px-2.5 py-1 text-xs font-medium transition-all',
              it.stripAudio
                ? 'bg-rose-50 border-rose-300 text-rose-900 font-semibold'
                : 'bg-white border-stone-200 text-stone-600 hover:border-stone-300'
            )}
          >
            <SpeakerSimpleSlash size={13} className={it.stripAudio ? 'text-rose-600' : ''} />
            <span>Mute Audio</span>
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Concurrent Worker Pool for Video Uploads (e.g. 3 streams)
 */
async function runConcurrentVideoPool(tasks, concurrency = 3) {
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

const EMPTY_VIDEOS = [];

export default function VideoUploadModal({
  open,
  onClose,
  initialFiles = EMPTY_VIDEOS,
  clientId,
  onUploadComplete,
}) {
  const [items, setItems] = useState([]);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [isUploading, setIsUploading] = useState(false);
  const [overallProgress, setOverallProgress] = useState(0);
  const [activeUploadsCount, setActiveUploadsCount] = useState(0);
  const [uploadFinished, setUploadFinished] = useState(false);
  const [uploadedResults, setUploadedResults] = useState([]);

  // Dynamic Ceremonies for Videos
  const [ceremonyOptions, setCeremonyOptions] = useState(DEFAULT_VIDEO_CEREMONIES);

  const fileInputRef = useRef(null);
  const prevOpenRef = useRef(false);

  // Fetch dynamic ceremonies
  useEffect(() => {
    async function fetchCeremonies() {
      try {
        const res = await fetch(`${api_url}/api/ceremonies`, { credentials: 'include' });
        const data = await res.json();
        if (data.ceremonies?.length) {
          const names = data.ceremonies.map((c) => c.name);
          setCeremonyOptions([...new Set([...names, ...DEFAULT_VIDEO_CEREMONIES])]);
        }
      } catch (e) {
        console.warn('Ceremony fetch error for videos:', e);
      }
    }
    fetchCeremonies();
  }, []);

  // Initialize staged video items
  useEffect(() => {
    const wasOpen = prevOpenRef.current;
    prevOpenRef.current = open;

    if (!open) {
      if (wasOpen) {
        setItems([]);
        setSelectedIds(new Set());
        setIsUploading(false);
        setUploadFinished(false);
        setUploadedResults([]);
      }
      return;
    }

    if (!wasOpen && initialFiles && initialFiles.length > 0) {
      const newItems = initialFiles.map((file, idx) => ({
        id: `${file.name}-${file.size}-${Date.now()}-${idx}`,
        file,
        name: file.name,
        size: file.size,
        progress: 0,
        status: 'queued',
        error: null,
        eventGroup: 'Full Wedding Film',
        isHero: idx === 0,
        makeLoop: true,
        stripAudio: false,
        caption: '',
      }));
      setItems(newItems);
      setSelectedIds(new Set(newItems.map((it) => it.id)));
    }
  }, [open, initialFiles]);

  const totalBytes = useMemo(() => items.reduce((acc, it) => acc + (it.size || 0), 0), [items]);

  const handleAddFiles = (fileList) => {
    const files = Array.from(fileList || []);
    if (!files.length) return;
    const added = files.map((file, idx) => ({
      id: `${file.name}-${file.size}-${Date.now()}-${idx}`,
      file,
      name: file.name,
      size: file.size,
      progress: 0,
      status: 'queued',
      error: null,
      eventGroup: 'Full Wedding Film',
      isHero: items.length === 0 && idx === 0,
      makeLoop: true,
      stripAudio: false,
      caption: '',
    }));
    setItems((prev) => [...prev, ...added]);
    setSelectedIds((prev) => new Set([...prev, ...added.map((a) => a.id)]));
  };

  const handleRemoveItem = (id) => {
    if (isUploading) return;
    setItems((prev) => prev.filter((it) => it.id !== id));
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

  const updateItemOption = (id, key, value) => {
    setItems((prev) =>
      prev.map((it) => {
        if (key === 'isHero' && value === true) {
          return it.id === id ? { ...it, isHero: true } : { ...it, isHero: false };
        }
        return it.id === id ? { ...it, [key]: value } : it;
      })
    );
  };

  // Parallel Video Upload Execution
  const startUpload = async () => {
    if (!items.length || isUploading) return;
    setIsUploading(true);
    setUploadFinished(false);

    const uploadedPlacements = [];
    let completedBytes = 0;
    const CONCURRENCY_LIMIT = 3;

    const tasks = items.map((item) => async () => {
      if (item.status === 'done') return null;

      setActiveUploadsCount((c) => c + 1);
      setItems((prev) =>
        prev.map((it) => (it.id === item.id ? { ...it, status: 'uploading', progress: 0 } : it))
      );

      try {
        // Step 1: Upload to R2 directly with video transcoding flags
        const uploadHandle = createUpload({
          file: item.file,
          ownerType: 'Client',
          ownerId: clientId,
          meta: {
            title: item.name.replace(/\.[^/.]+$/, ''),
            tags: item.tags,
            eventGroup: item.eventGroup,
            makeLoop: Boolean(item.makeLoop),
            stripAudio: Boolean(item.stripAudio),
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

        // Step 2: Assign to Client Portfolio Item
        const portRes = await fetch(`${api_url}/api/admin/portfolio`, {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            media: media._id,
            client: clientId,
            kind: 'Video',
            tags: item.tags || [],
            eventGroup: item.eventGroup || '',
            isHero: Boolean(item.isHero),
            heroPriority: item.isHero ? 1 : 0,
            shootDate: item.shootDate || undefined,
            location: item.location ? { city: item.location } : undefined,
            caption: item.caption,
            status: 'Published',
          }),
        });

        if (!portRes.ok) {
          const errData = await portRes.json();
          throw new Error(errData.message || 'Portfolio assignment failed');
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
        console.error('Video upload failed for', item.name, err);
        setItems((prev) =>
          prev.map((it) => (it.id === item.id ? { ...it, status: 'error', error: err.message } : it))
        );
        throw err;
      } finally {
        setActiveUploadsCount((c) => Math.max(0, c - 1));
      }
    });

    await runConcurrentVideoPool(tasks, CONCURRENCY_LIMIT);

    setIsUploading(false);
    setUploadFinished(true);
    setUploadedResults(uploadedPlacements);

    if (uploadedPlacements.length > 0) {
      fireMessage(`Uploaded and queued ${uploadedPlacements.length} wedding films!`, 'success');
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
        className="max-w-4xl w-[95vw] h-[85vh] max-h-[820px] p-0 overflow-hidden flex flex-col rounded-3xl border border-[#E8DDD1] bg-[#FFFCF8] shadow-2xl"
      >
        {/* Header */}
        <header className="flex items-center justify-between border-b border-[#E8DDD1] px-6 py-4 bg-white shrink-0">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-stone-900 text-amber-400 shrink-0 shadow-sm">
              <FilmSlate size={22} weight="bold" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-bold text-stone-900 font-sans tracking-tight">
                  {uploadFinished ? 'Film Ingest & Transcode Status' : 'Stage Wedding Films & Cinema'}
                </h3>
                <Badge size="sm" variant="neutral">
                  {items.length} film{items.length === 1 ? '' : 's'} · {formatBytes(totalBytes)}
                </Badge>
                {isUploading && (
                  <Badge size="sm" variant="gold" className="animate-pulse">
                    {activeUploadsCount} concurrent streams
                  </Badge>
                )}
              </div>
              <p className="text-xs text-stone-500 font-sans">
                {uploadFinished
                  ? 'Master video files securely uploaded to Cloudflare R2 and queued for FFmpeg worker transcode.'
                  : 'Play previews, configure 8s silent loop, audio stripping, and hero presentation before upload.'}
              </p>
            </div>
          </div>

          <button
            type="button"
            disabled={isUploading}
            onClick={uploadFinished ? handleFinishAndExit : onClose}
            className="flex items-center justify-center h-8 w-8 rounded-xl text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors disabled:opacity-50"
          >
            <X size={16} />
            <span className="sr-only">Close</span>
          </button>
        </header>

        {/* Staged Video Cards List & Reassurance Status */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {uploadFinished ? (
            /* Post-Upload Ingest Summary Banner */
            <div className="bg-emerald-50/70 border-b border-emerald-200 px-6 py-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-600 text-white shrink-0 shadow-sm">
                  <CheckCircle size={22} weight="fill" />
                </span>
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-emerald-950 font-sans">
                    Video Ingest Complete: {doneCount} of {items.length} films ready!
                  </h4>
                  <p className="text-[11px] text-emerald-900/90 max-w-xl leading-relaxed">
                    Master video files have been safely stored in your Cloudflare R2 bucket. Background FFmpeg transcoding is queued to generate adaptive streaming renditions and 8s teaser loops.
                  </p>
                </div>
              </div>

              <Button
                type="button"
                variant="terracotta"
                size="sm"
                onClick={handleFinishAndExit}
                className="shrink-0 text-xs font-semibold px-4"
              >
                Finish & View Client Gallery
              </Button>
            </div>
          ) : (
            /* Top Action Strip */
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
                  accept="video/mp4,video/quicktime,video/webm,video/x-matroska,.mp4,.mov,.mkv,.webm"
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
                  Add Films
                </Button>
              </div>
            </div>
          )}

          {/* Staged Videos List with Playable Previews */}
          <div className="flex-1 overflow-y-auto p-6 space-y-3.5 scrollbar-thin scrollbar-thumb-stone-200">
            {!items.length ? (
              <div className="flex flex-col items-center justify-center h-full text-center py-16 space-y-3">
                <span className="flex h-16 w-16 items-center justify-center rounded-3xl bg-stone-100 text-stone-700">
                  <FilmSlate size={32} />
                </span>
                <div>
                  <p className="text-sm font-semibold text-stone-800">No wedding films staged</p>
                  <p className="text-xs text-stone-500">Pick or drop cinematic video files to stage for this wedding</p>
                </div>
                <Button
                  type="button"
                  variant="gold"
                  size="sm"
                  icon={Plus}
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-stone-900 text-white hover:bg-stone-800"
                >
                  Browse Video Files
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {items.map((it) => (
                  <StagedVideoPreview
                    key={it.id}
                    it={it}
                    file={it.file}
                    isUploading={isUploading}
                    isDone={uploadFinished && it.status === 'done'}
                    isSelected={selectedIds.has(it.id)}
                    onToggleSelect={toggleSelect}
                    onUpdateOption={updateItemOption}
                    onRemove={handleRemoveItem}
                    ceremonyOptions={ceremonyOptions}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <footer className="flex items-center justify-between border-t border-[#E8DDD1] bg-white px-6 py-4 shrink-0">
          <div className="flex items-center gap-3">
            {isUploading && (
              <div className="flex items-center gap-2">
                <CircleNotch size={18} className="animate-spin text-amber-600" />
                <span className="text-xs font-semibold text-stone-800">
                  Uploading ({activeUploadsCount} concurrent streams · {overallProgress}% total)
                </span>
              </div>
            )}
            {!isUploading && uploadFinished && (
              <span className="text-xs font-semibold text-emerald-700 flex items-center gap-1.5">
                <Check size={16} weight="bold" /> {doneCount} films stored on Cloudflare R2.
              </span>
            )}
            {!isUploading && !uploadFinished && (
              <span className="text-xs text-stone-500">
                {selectedIds.size} of {items.length} films ready for upload
              </span>
            )}
          </div>

          <div className="flex items-center gap-2.5">
            {uploadFinished ? (
              <Button
                type="button"
                variant="terracotta"
                size="sm"
                onClick={handleFinishAndExit}
                className="font-semibold px-5 shadow-sm"
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
                  variant="terracotta"
                  size="sm"
                  loading={isUploading}
                  disabled={!items.length || isUploading}
                  icon={Sparkle}
                  onClick={startUpload}
                  className="font-semibold shadow-sm px-4"
                >
                  Upload {items.length} Films (Parallel)
                </Button>
              </>
            )}
          </div>
        </footer>
      </DialogContent>
    </Dialog>
  );
}
