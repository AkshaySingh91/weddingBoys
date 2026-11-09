'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  X, FilmSlate, Plus, Trash, Check, Sparkle, Tag as TagIcon,
  CalendarBlank, MapPin, CircleNotch, ArrowClockwise, WarningCircle,
  Star, SpeakerSimpleSlash, Repeat, Play, Pause, HardDrives, CheckCircle, ImageSquare, MagicWand
} from '@phosphor-icons/react';
import { Dialog, DialogContent } from '@/app/admin/components/ui/Dialog.jsx';
import { Button } from '@/app/admin/components/ui/Button.jsx';
import { Badge } from '@/app/admin/components/ui/Badge.jsx';
import { formatBytes } from '@/Utils/format.js';
import { createUpload } from '@/lib/upload/multipartUploader.js';
import { fireMessage } from '@/Utils/fireMessage.js';
import useTaxonomy from '@/Hooks/useTaxonomy.jsx';
import { cn } from '@/lib/utils.js';

const api_url = process.env.NEXT_PUBLIC_API_URL;

// A film's type and its ceremony are separate tag groups (Settings › Portfolio
// Tags): Film type is one per film (Teaser, Highlights, Full Wedding Film…),
// Ceremony one per item. They used to be one mixed list stored as eventGroup.
const DEFAULT_FILM_TYPE = 'Full Wedding Film';

/**
 * A film's cover: the worker picks the best frame by default (sharp, well
 * exposed, detailed — not just 10% in); or the admin drops in their own still.
 */
function CoverPicker({ cover, disabled, onChange }) {
  const inputRef = useRef(null);
  const [preview, setPreview] = useState('');
  useEffect(() => {
    if (!cover) return undefined;
    const url = URL.createObjectURL(cover);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- the object URL is revoked by this effect's cleanup
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [cover]);
  return (
    <div className="flex items-center gap-1">
      <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" tabIndex={-1}
        onChange={(e) => { const f = e.target.files?.[0]; if (f) onChange(f); e.target.value = ''; }} />
      {cover ? (
        <span className="flex items-center gap-1.5 rounded-xl border border-sky-300 bg-sky-50 py-0.5 pl-0.5 pr-1 text-xs font-semibold text-sky-900">
          {/* eslint-disable-next-line @next/next/no-img-element -- local preview */}
          {preview && <img src={preview} alt="" className="h-6 w-10 rounded-lg object-cover" />}
          <button type="button" disabled={disabled} onClick={() => inputRef.current?.click()} className="hover:underline">Custom cover</button>
          <button type="button" disabled={disabled} onClick={() => onChange(null)} aria-label="Use the best frame instead"
            className="grid h-5 w-5 place-items-center rounded-full hover:bg-sky-100"><X size={11} /></button>
        </span>
      ) : (
        <button type="button" disabled={disabled} onClick={() => inputRef.current?.click()}
          title="The worker picks the sharpest, best-exposed frame. Click to use your own image instead."
          className="flex items-center gap-1.5 rounded-xl border border-edge-subtle bg-white px-2.5 py-1 text-xs font-medium text-ink-secondary transition-all hover:border-edge-strong">
          <MagicWand size={13} />
          <span>Cover: best frame</span>
          <span className="text-ink-muted">· <ImageSquare size={12} className="inline -mt-0.5" /> use mine</span>
        </button>
      )}
    </div>
  );
}

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
function StagedVideoPreview({ file, isUploading, isDone, isSelected, onToggleSelect, it, onUpdateOption, onRemove, ceremonyOptions, filmTypeOptions }) {
  const [objectUrl, setObjectUrl] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const videoRef = useRef(null);

  useEffect(() => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    // Syncing with an external resource: the URL must be revoked by this effect's cleanup.
    // eslint-disable-next-line react-hooks/set-state-in-effect
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
      videoRef.current.play().then(() => setIsPlaying(true)).catch(() => { });
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
        'group rounded-xl border bg-white p-4 transition-all flex flex-col sm:flex-row items-start sm:items-center gap-4',
        isSelected && !isDone
          ? 'border-ink ring-2 ring-ink/15 shadow-sm'
          : 'border-edge-subtle hover:border-edge-strong'
      )}
    >
      {/* HTML5 Video Thumbnail Viewport */}
      <div className="relative aspect-video w-full sm:w-56 shrink-0 overflow-hidden rounded-xl bg-ink flex items-center justify-center">
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
              'absolute top-2 left-2 z-20 flex h-5 w-5 items-center justify-center rounded-lg border transition-all shadow-sm',
              isSelected
                ? 'bg-ink border-ink text-white'
                : 'bg-white/85 border-edge-strong text-transparent hover:border-ink'
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
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-ink/80 text-white shadow-md">
              {isPlaying ? <Pause size={18} weight="fill" /> : <Play size={18} weight="fill" className="ml-0.5" />}
            </span>
          </button>
        )}

        {/* Duration Chip */}
        <div className="absolute bottom-2 right-2 z-10 rounded-lg bg-black/70 px-1.5 py-0.5 font-mono text-[10px] text-white">
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
            <h4 className="font-sans text-xs sm:text-sm font-bold text-ink truncate" title={it.name}>
              {it.name}
            </h4>
            <p className="text-[11px] text-ink-muted">{formatBytes(it.size)}</p>
          </div>

          {!isUploading && !isDone && (
            <button
              type="button"
              onClick={() => onRemove(it.id)}
              className="text-ink-muted hover:text-rose-600 p-1 transition-colors"
            >
              <Trash size={15} />
            </button>
          )}
        </div>

        {/* Film Options: Ceremony, Hero, Silent Loop, Strip Audio */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          {/* Film type (one per film) */}
          <select
            disabled={isUploading || isDone}
            value={it.filmType || ''}
            onChange={(e) => onUpdateOption(it.id, 'filmType', e.target.value)}
            className="text-xs rounded-xl border border-edge-subtle bg-ground/70 px-2.5 py-1 text-ink focus:outline-none focus:border-ink"
          >
            <option value="">Film type: none</option>
            {filmTypeOptions.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          {/* Ceremony (one per film) */}
          <select
            disabled={isUploading || isDone}
            value={it.eventGroup || ''}
            onChange={(e) => onUpdateOption(it.id, 'eventGroup', e.target.value)}
            className="text-xs rounded-xl border border-edge-subtle bg-ground/70 px-2.5 py-1 text-ink focus:outline-none focus:border-ink"
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
                : 'bg-white border-edge-subtle text-ink-secondary hover:border-edge-strong'
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
                : 'bg-white border-edge-subtle text-ink-secondary hover:border-edge-strong'
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
                : 'bg-white border-edge-subtle text-ink-secondary hover:border-edge-strong'
            )}
          >
            <SpeakerSimpleSlash size={13} className={it.stripAudio ? 'text-rose-600' : ''} />
            <span>Mute Audio</span>
          </button>

          <CoverPicker cover={it.cover} disabled={isUploading || isDone} onChange={(f) => onUpdateOption(it.id, 'cover', f)} />
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

/**
 * Production Asset Inspector for uploaded films:
 * Shows playable stored video, 8s teaser loop preview, and adaptive transcode matrix.
 */
function VideoAssetInspector({ it }) {
  const [objectUrl, setObjectUrl] = useState('');
  const [activeTab, setActiveTab] = useState('master');

  useEffect(() => {
    if (!it?.file) return;
    const url = URL.createObjectURL(it.file);
    // Syncing with an external resource: the URL must be revoked by this effect's cleanup.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setObjectUrl(url);
    return () => {
      URL.revokeObjectURL(url);
    };
  }, [it]);

  if (!it) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-ink-muted p-8 text-center text-xs">
        Select a film from the list to inspect its stored video and teaser loop assets.
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col p-6 overflow-y-auto space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-edge-subtle pb-3">
        <div>
          <h4 className="font-sans text-sm font-bold text-ink truncate max-w-md" title={it.name}>
            {it.name}
          </h4>
          <div className="flex items-center gap-2 text-xs text-ink-muted mt-0.5">
            <span className="font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-lg">
              {[it.filmType, it.eventGroup].filter(Boolean).join(' · ') || 'Wedding Film'}
            </span>
            <span>·</span>
            <span>Raw Master: {formatBytes(it.size)}</span>
            <span>·</span>
            <span className="text-emerald-700 font-medium">✓ Stored in Cloudflare R2</span>
          </div>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center gap-1 bg-ground-sunk p-1 rounded-xl border border-edge-subtle">
          <button
            type="button"
            onClick={() => setActiveTab('master')}
            className={cn(
              'px-3 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer',
              activeTab === 'master'
                ? 'bg-white text-ink shadow-sm'
                : 'text-ink-secondary hover:text-ink'
            )}
          >
            Stored Master Video
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('loop')}
            className={cn(
              'px-3 py-1 text-xs font-semibold rounded-lg transition-all flex items-center gap-1 cursor-pointer',
              activeTab === 'loop'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-ink-secondary hover:text-ink'
            )}
          >
            <Repeat size={12} weight="bold" />
            8s Loop Preview
          </button>
        </div>
      </div>

      {/* Player Viewport */}
      {activeTab === 'master' ? (
        <div className="space-y-2">
          <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-black shadow-md flex items-center justify-center">
            {objectUrl && (
              <video
                controls
                playsInline
                src={objectUrl}
                className="h-full w-full object-contain"
              />
            )}
          </div>
          <div className="flex items-center justify-between text-xs text-ink-muted px-1">
            <span>High-resolution original file safely preserved in Cloudflare R2.</span>
            <span className="font-mono text-[11px] text-ink-secondary font-medium">Master Quality</span>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {it.makeLoop ? (
            <div className="rounded-xl border border-purple-200 bg-purple-50/50 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-purple-950 flex items-center gap-1.5">
                  <Repeat size={15} weight="bold" className="text-purple-600" />
                  8s Silent Teaser Loop Asset
                </span>
                <span className="text-[10px] font-semibold bg-purple-100 text-purple-900 px-2 py-0.5 rounded-lg border border-purple-200">
                  Transcoding / Playable
                </span>
              </div>
              <div className="relative aspect-video max-h-60 w-full overflow-hidden rounded-xl bg-black shadow-sm mx-auto">
                {objectUrl && (
                  <video
                    autoPlay
                    loop
                    muted
                    playsInline
                    controls
                    src={objectUrl}
                    className="h-full w-full object-cover"
                  />
                )}
              </div>
              <p className="text-[11px] text-purple-900/90 leading-relaxed">
                Playable 8s loop designated for the couple showcase header, hero card reels, and lightweight mobile preview streaming.
              </p>
            </div>
          ) : (
            <div className="rounded-xl border border-edge-subtle bg-ground p-8 text-center space-y-2">
              <Repeat size={24} className="mx-auto text-ink-muted" />
              <p className="text-xs font-semibold text-ink-secondary">8s Loop was not requested for this film</p>
              <p className="text-[11px] text-ink-muted">
                To generate 8s silent teaser loops, enable &quot;Generate 8s Loop&quot; during staging before uploading.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Streaming Renditions & Assets Status */}
      <div className="rounded-xl border border-edge-subtle bg-ground/70 p-4 space-y-2.5">
        <h5 className="text-xs font-bold text-ink uppercase tracking-wide">
          Derived Streaming Assets & Renditions
        </h5>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
          <div className="rounded-xl border border-edge-subtle bg-white p-2.5">
            <span className="text-[10px] text-ink-muted block font-semibold">1080p FHD</span>
            <span className="text-xs font-bold text-ink">Adaptive MP4</span>
            <span className="text-[10px] text-purple-700 block mt-0.5 font-medium">Worker Queued</span>
          </div>
          <div className="rounded-xl border border-edge-subtle bg-white p-2.5">
            <span className="text-[10px] text-ink-muted block font-semibold">720p HD</span>
            <span className="text-xs font-bold text-ink">Adaptive MP4</span>
            <span className="text-[10px] text-purple-700 block mt-0.5 font-medium">Worker Queued</span>
          </div>
          <div className="rounded-xl border border-edge-subtle bg-white p-2.5">
            <span className="text-[10px] text-ink-muted block font-semibold">480p Mobile</span>
            <span className="text-xs font-bold text-ink">Efficient MP4</span>
            <span className="text-[10px] text-purple-700 block mt-0.5 font-medium">Worker Queued</span>
          </div>
          <div className="rounded-xl border border-edge-subtle bg-white p-2.5">
            <span className="text-[10px] text-ink-muted block font-semibold">Poster Frame</span>
            <span className="text-xs font-bold text-ink">JPEG Thumbnail</span>
            <span className="text-[10px] text-emerald-700 block mt-0.5 font-medium">Auto-Extracted</span>
          </div>
        </div>
      </div>
    </div>
  );
}

const EMPTY_VIDEOS = [];

export default function VideoUploadModal({
  open,
  onClose,
  initialFiles = EMPTY_VIDEOS,
  clientId,
  onUploadComplete,
  // The wedding's own date and place (and the ceremony being viewed), used
  // as each film's starting values: { shootDate, city, venue, ceremony }.
  defaults,
}) {
  const [items, setItems] = useState([]);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [isUploading, setIsUploading] = useState(false);
  const [overallProgress, setOverallProgress] = useState(0);
  const [activeUploadsCount, setActiveUploadsCount] = useState(0);
  const [uploadFinished, setUploadFinished] = useState(false);
  const [uploadedResults, setUploadedResults] = useState([]);
  const [inspectedVideoId, setInspectedVideoId] = useState(null);

  // Options come from the tag system; labels are turned into tag ids on upload.
  const taxonomy = useTaxonomy();
  const ceremonyOptions = useMemo(() => (taxonomy.groupByKey.get('ceremony')?.tags || []).filter((t) => !t.hidden).map((t) => t.label), [taxonomy.groupByKey]);
  const filmTypeOptions = useMemo(() => (taxonomy.groupByKey.get('film-type')?.tags || []).filter((t) => !t.hidden).map((t) => t.label), [taxonomy.groupByKey]);

  const fileInputRef = useRef(null);
  const prevOpenRef = useRef(false);
  const uploadedPlacementsRef = useRef([]);

  // When upload finishes, default inspected video to first film
  useEffect(() => {
    if (uploadFinished && items.length && !inspectedVideoId) {
      setInspectedVideoId(items[0]?.id);
    }
  }, [uploadFinished, items, inspectedVideoId]);

  const inspectedItem = useMemo(() => {
    return items.find((it) => it.id === inspectedVideoId) || items[0] || null;
  }, [items, inspectedVideoId]);

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
        filmType: DEFAULT_FILM_TYPE,
        eventGroup: defaults?.ceremony || '',
        shootDate: defaults?.shootDate || '',
        city: defaults?.city || '',
        venue: defaults?.venue || '',
        isHero: false, // opt-in only: the first film of every batch used to join the home hero
        makeLoop: true,
        stripAudio: false,
        cover: null,
        caption: '',
      }));
      setItems(newItems);
      setSelectedIds(new Set(newItems.map((it) => it.id)));
    }
    // Only the open transition acts (prevOpenRef); re-runs while open or closed are no-ops.
  }, [open, initialFiles, defaults?.ceremony, defaults?.city, defaults?.shootDate, defaults?.venue]);

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
      filmType: DEFAULT_FILM_TYPE,
      eventGroup: defaults?.ceremony || '',
      shootDate: defaults?.shootDate || '',
      city: defaults?.city || '',
      venue: defaults?.venue || '',
      isHero: false,
      makeLoop: true,
      stripAudio: false,
      cover: null,
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

        // Step 2: Assign to Client Portfolio Item, tagged by id (a typed tag the
        // tag system does not have yet is created in Unsorted).
        const { ids: tagIds, failures: tagFailures } = await taxonomy.idsFromLabels('Video', {
          ceremony: item.eventGroup, filmType: item.filmType, tags: item.tags || [],
        });
        if (tagFailures.length) fireMessage(`Some tags were skipped: ${tagFailures.join(', ')}`, 'error');
        const portRes = await fetch(`${api_url}/api/admin/portfolio`, {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            media: media._id,
            client: clientId,
            kind: 'Video',
            tagIds,
            isHero: Boolean(item.isHero),
            heroPriority: item.isHero ? 1 : 0,
            shootDate: item.shootDate || undefined,
            location: (item.city || item.venue) ? { city: item.city, venue: item.venue } : undefined,
            caption: item.caption,
            // No status: the server decides (plan D7) — live with the wedding if
            // it is a draft, hidden for review if it is already published.
          }),
        });

        if (!portRes.ok) {
          const errData = await portRes.json();
          throw new Error(errData.message || 'Portfolio assignment failed');
        }

        let { item: portfolioDoc } = await portRes.json();

        // Step 3: a custom cover, if one was chosen. It processes in the
        // background; the film shows it as soon as it is ready. A cover that
        // fails never fails the film — it falls back to the best frame.
        if (item.cover) {
          try {
            const coverMedia = await createUpload({
              file: item.cover,
              ownerType: 'Client',
              ownerId: clientId,
              meta: { title: `Cover — ${item.name.replace(/\.[^/.]+$/, '')}` },
            }).promise;
            const coverRes = await fetch(`${api_url}/api/admin/portfolio/${portfolioDoc._id}/poster`, {
              method: 'POST',
              credentials: 'include',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ media: coverMedia._id }),
            });
            const coverData = await coverRes.json().catch(() => ({}));
            if (!coverRes.ok) throw new Error(coverData.message || 'Cover not set');
            portfolioDoc = coverData.item || portfolioDoc;
          } catch (coverErr) {
            fireMessage(`${item.name}: cover not set (${coverErr.message}) — using the best frame`, 'error');
          }
        }

        uploadedPlacements.push(portfolioDoc);
        uploadedPlacementsRef.current.push(portfolioDoc);

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
    // A retry adds to what earlier runs uploaded instead of replacing it.
    setUploadedResults((prev) => [...prev, ...uploadedPlacements]);

    if (uploadedPlacements.length > 0) {
      fireMessage(`Uploaded and queued ${uploadedPlacements.length} wedding films!`, 'success');
    }
  };

  const safeClose = () => {
    const toReturn = uploadedResults.length > 0 ? uploadedResults : uploadedPlacementsRef.current;
    if (toReturn.length > 0) {
      onUploadComplete?.(toReturn);
    }
    onClose();
  };

  const handleFinishAndExit = () => {
    safeClose();
  };

  const doneCount = items.filter((it) => it.status === 'done').length;
  const errorCount = items.filter((it) => it.status === 'error').length;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && !isUploading && safeClose()}>
      <DialogContent
        hideCloseButton
        className="max-w-4xl w-[95vw] h-[85vh] max-h-[820px] p-0 overflow-hidden flex flex-col rounded-xl border border-edge-subtle bg-ground shadow-2xl"
      >
        {/* Header */}
        <header className="flex items-center justify-between border-b border-edge-subtle px-6 py-4 bg-white shrink-0">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-ink text-amber-400 shrink-0 shadow-sm">
              <FilmSlate size={22} weight="bold" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-bold text-ink font-sans tracking-tight">
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
              <p className="text-xs text-ink-muted font-sans">
                {uploadFinished
                  ? 'Master video files securely uploaded to Cloudflare R2 and queued for FFmpeg worker transcode.'
                  : 'Play previews, configure 8s silent loop, audio stripping, and hero presentation before upload.'}
              </p>
            </div>
          </div>

          <button
            type="button"
            disabled={isUploading}
            onClick={safeClose}
            className="flex items-center justify-center h-8 w-8 rounded-xl text-ink-muted hover:text-ink-secondary hover:bg-ground-sunk transition-colors disabled:opacity-50"
          >
            <X size={16} />
            <span className="sr-only">Close</span>
          </button>
        </header>

        {/* Staged Video Cards List & Reassurance Status */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {uploadFinished ? (
            /* Post-Upload 2-Pane Asset Inspector Layout */
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Top Status Banner */}
              <div className="bg-emerald-50/80 border-b border-emerald-200 px-6 py-3.5 flex items-center justify-between gap-4 shrink-0">
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-600 text-white shrink-0 shadow-sm">
                    <CheckCircle size={20} weight="fill" />
                  </span>
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-emerald-950 font-sans">
                      Video Ingest Complete: {doneCount} of {items.length} films ready!
                    </h4>
                    <p className="text-[11px] text-emerald-900/90 max-w-xl leading-relaxed">
                      Master video files safely stored in Cloudflare R2 bucket. Click any film on the left to inspect its master video and 8s teaser loop assets.
                    </p>
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  {/* Failed items keep their settings; a retry uploads only those. */}
                  {errorCount > 0 && (
                    <Button type="button" variant="outline" size="sm" onClick={startUpload} disabled={isUploading} className="text-xs">
                      Retry {errorCount} failed
                    </Button>
                  )}
                  <Button
                    type="button"
                    variant="terracotta"
                    size="sm"
                    onClick={handleFinishAndExit}
                    className="shrink-0 text-xs font-semibold px-4 shadow-sm"
                  >
                    Finish & View Client Gallery
                  </Button>
                </div>
              </div>

              {/* 2-Pane View: Left Video Roster + Right Production Asset Inspector */}
              <div className="flex-1 flex overflow-hidden">
                {/* Left Pane: Film Roster & Summary */}
                <aside className="w-80 border-r border-edge-subtle bg-ground flex flex-col shrink-0 overflow-y-auto p-4 space-y-3 scrollbar-thin">
                  {/* Metrics Card */}
                  <div className="rounded-xl border border-edge-subtle bg-white p-3 space-y-1.5 shadow-sm">
                    <div className="flex items-center justify-between text-xs font-bold text-ink">
                      <span>Uploaded Films</span>
                      <span className="text-emerald-700 font-semibold">{doneCount} of {items.length}</span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-ink-muted">
                      <span>Total Master Size:</span>
                      <span className="font-mono font-semibold text-ink-secondary">{formatBytes(totalBytes)}</span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-ink-muted">
                      <span>Est. Streaming Deriv:</span>
                      <span className="font-mono font-semibold text-purple-700">~{formatBytes(totalBytes * 1.8)}</span>
                    </div>
                  </div>

                  <p className="text-[11px] font-bold uppercase tracking-wider text-ink-muted px-1 pt-1">
                    Select film to inspect
                  </p>

                  {/* Film Cards List */}
                  <div className="space-y-2">
                    {items.map((it) => {
                      const isInspected = inspectedItem?.id === it.id;
                      return (
                        <div
                          key={it.id}
                          onClick={() => setInspectedVideoId(it.id)}
                          className={cn(
                            'p-3 rounded-xl border transition-all cursor-pointer select-none text-left',
                            isInspected
                              ? 'border-amber-600 bg-amber-50/60 ring-2 ring-amber-500/20 shadow-sm'
                              : 'border-edge-subtle bg-white hover:border-edge-strong'
                          )}
                        >
                          <p className="font-sans text-xs font-bold text-ink truncate" title={it.name}>
                            {it.name}
                          </p>
                          <div className="flex items-center gap-1.5 mt-1 text-[10px] text-ink-muted">
                            <span className="font-semibold text-ink-secondary">{[it.filmType, it.eventGroup].filter(Boolean).join(' · ')}</span>
                            <span>·</span>
                            <span>{formatBytes(it.size)}</span>
                          </div>
                          <div className="flex items-center gap-1.5 mt-2">
                            <span className="text-[10px] font-medium bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded-lg">
                              ✓ R2 Master
                            </span>
                            {it.makeLoop && (
                              <span className="text-[10px] font-medium bg-purple-100 text-purple-800 px-1.5 py-0.5 rounded-lg flex items-center gap-0.5">
                                <Repeat size={10} /> 8s Loop
                              </span>
                            )}
                            {it.stripAudio && (
                              <span className="text-[10px] font-medium bg-rose-100 text-rose-800 px-1.5 py-0.5 rounded-lg">
                                Muted
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </aside>

                {/* Right Pane: Production Asset Inspector */}
                <div className="flex-1 bg-white flex flex-col overflow-hidden">
                  <VideoAssetInspector it={inspectedItem} />
                </div>
              </div>
            </div>
          ) : (
            /* Normal Staging View */
            <>
              {/* Top Action Strip */}
              <div className="border-b border-edge-subtle bg-ground px-6 py-2.5 shrink-0 flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    disabled={isUploading}
                    onClick={selectAll}
                    className="font-semibold text-ink-secondary hover:text-ink underline cursor-pointer text-xs"
                  >
                    {selectedIds.size === items.length ? 'Deselect All' : `Select All (${items.length})`}
                  </button>
                  <span className="text-stone-300">·</span>
                  <span className="text-ink-muted font-medium text-xs">
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
                    className="border-edge-subtle text-ink-secondary hover:bg-ground text-xs"
                  >
                    Add Films
                  </Button>
                </div>
              </div>

              {/* Staged Videos List with Playable Previews */}
              <div className="flex-1 overflow-y-auto p-6 space-y-3.5 scrollbar-thin scrollbar-thumb-stone-200">
                {!items.length ? (
                  <div className="flex flex-col items-center justify-center h-full text-center py-16 space-y-3">
                    <span className="flex h-16 w-16 items-center justify-center rounded-xl bg-ground-sunk text-ink-secondary">
                      <FilmSlate size={32} />
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-ink">No wedding films staged</p>
                      <p className="text-xs text-ink-muted">Pick or drop cinematic video files to stage for this wedding</p>
                    </div>
                    <Button
                      type="button"
                      variant="gold"
                      size="sm"
                      icon={Plus}
                      onClick={() => fileInputRef.current?.click()}
                      className="bg-ink text-white hover:bg-ink"
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
                        filmTypeOptions={filmTypeOptions}
                      />
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Footer Actions */}
        <footer className="flex items-center justify-between border-t border-edge-subtle bg-white px-6 py-4 shrink-0">
          <div className="flex items-center gap-3">
            {isUploading && (
              <div className="flex items-center gap-2">
                <CircleNotch size={18} className="animate-spin text-amber-600" />
                <span className="text-xs font-semibold text-ink">
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
              <span className="text-xs text-ink-muted">
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
                  onClick={safeClose}
                  className="border-edge-subtle text-ink-secondary hover:bg-ground"
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
