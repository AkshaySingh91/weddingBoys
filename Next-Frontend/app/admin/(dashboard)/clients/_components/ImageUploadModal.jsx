'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  X, ImageSquare, Plus, Trash, Check, Sparkle, Tag as TagIcon,
  CalendarBlank, MapPin, CircleNotch, ArrowClockwise, WarningCircle,
  Users, SlidersHorizontal, CaretRight, ArrowsClockwise, HardDrives,
  CheckCircle, FolderSimpleStar
} from '@phosphor-icons/react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog, DialogContent } from '@/app/admin/components/ui/Dialog.jsx';
import { Button } from '@/app/admin/components/ui/Button.jsx';
import { Badge } from '@/app/admin/components/ui/Badge.jsx';
import { formatBytes } from '@/Utils/format.js';
import { createUpload } from '@/lib/upload/multipartUploader.js';
import { fireMessage } from '@/Utils/fireMessage.js';
import useTaxonomy from '@/Hooks/useTaxonomy.jsx';
import { cn } from '@/lib/utils.js';

const api_url = process.env.NEXT_PUBLIC_API_URL;

const DEFAULT_BTS_ROLES = [
  'Lead Photographer',
  'Cinematographer',
  'Candid Photographer',
  'Drone Pilot',
  'Traditional Video',
  'Chief Editor',
  'Colorist',
];

const CEREMONY_THEMES = {
  amber: {
    bg: 'bg-amber-50/70',
    border: 'border-amber-300',
    badge: 'bg-amber-100 text-amber-900 border-amber-300',
    accent: 'text-amber-700',
  },
  emerald: {
    bg: 'bg-emerald-50/70',
    border: 'border-emerald-300',
    badge: 'bg-emerald-100 text-emerald-900 border-emerald-300',
    accent: 'text-emerald-700',
  },
  purple: {
    bg: 'bg-purple-50/70',
    border: 'border-purple-300',
    badge: 'bg-purple-100 text-purple-900 border-purple-300',
    accent: 'text-purple-700',
  },
  indigo: {
    bg: 'bg-indigo-50/70',
    border: 'border-indigo-300',
    badge: 'bg-indigo-100 text-indigo-900 border-indigo-300',
    accent: 'text-indigo-700',
  },
  rose: {
    bg: 'bg-rose-50/70',
    border: 'border-rose-300',
    badge: 'bg-rose-100 text-rose-900 border-rose-300',
    accent: 'text-rose-700',
  },
  gold: {
    bg: 'bg-yellow-50/70',
    border: 'border-yellow-300',
    badge: 'bg-yellow-100 text-yellow-900 border-yellow-300',
    accent: 'text-yellow-700',
  },
  sky: {
    bg: 'bg-sky-50/70',
    border: 'border-sky-300',
    badge: 'bg-sky-100 text-sky-900 border-sky-300',
    accent: 'text-sky-700',
  },
  pink: {
    bg: 'bg-pink-50/70',
    border: 'border-pink-300',
    badge: 'bg-pink-100 text-pink-900 border-pink-300',
    accent: 'text-pink-700',
  },
  cyan: {
    bg: 'bg-cyan-50/70',
    border: 'border-cyan-300',
    badge: 'bg-cyan-100 text-cyan-900 border-cyan-300',
    accent: 'text-cyan-700',
  },
  orange: {
    bg: 'bg-orange-50/70',
    border: 'border-orange-300',
    badge: 'bg-orange-100 text-orange-900 border-orange-300',
    accent: 'text-orange-700',
  },
  neutral: {
    bg: 'bg-stone-100/70',
    border: 'border-stone-300',
    badge: 'bg-stone-200 text-stone-800 border-stone-300',
    accent: 'text-stone-700',
  },
};

/**
 * Individual Staged Photo Card with Group Selection Isolation & State Indicator
 */
function StagedPhotoCard({
  it,
  isSelected,
  isDimmed,
  isUploading,
  uploadFinished,
  onToggleSelect,
  onRemove,
}) {
  const isItemUploading = it.status === 'uploading' || it.status === 'processing';
  const isItemDone = it.status === 'done';
  const isItemError = it.status === 'error';

  return (
    <motion.div
      layout
      key={it.id}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: isDimmed ? 0.45 : 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      transition={{ type: 'spring', stiffness: 350, damping: 28 }}
      onClick={() => {
        if (!isUploading && !uploadFinished) {
          onToggleSelect(it.id);
        }
      }}
      className={cn(
        'group relative flex flex-col overflow-hidden rounded-2xl border bg-white transition-all select-none',
        !isUploading && !uploadFinished && !isDimmed && 'cursor-pointer hover:border-amber-400 hover:shadow-md',
        isDimmed && 'cursor-not-allowed filter grayscale-[25%]',
        isSelected && !uploadFinished
          ? 'border-amber-600 ring-2 ring-amber-500/30 shadow-md'
          : 'border-stone-200'
      )}
      title={isDimmed ? 'Deselect active group photos to select this' : undefined}
    >
      {/* Thumbnail Viewport */}
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-stone-100">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={it.previewUrl}
          alt={it.name}
          className={cn(
            'h-full w-full object-cover transition-transform duration-300',
            !isDimmed && 'group-hover:scale-105',
            (isItemUploading || isItemDone) && 'filter brightness-[0.75]'
          )}
        />

        {/* Checkbox (Pre-upload) */}
        {!isUploading && !uploadFinished && (
          <button
            type="button"
            disabled={isDimmed}
            onClick={(e) => {
              e.stopPropagation();
              onToggleSelect(it.id);
            }}
            className={cn(
              'absolute top-2 left-2 z-10 flex h-5 w-5 items-center justify-center rounded-md border transition-all shadow-sm',
              isSelected
                ? 'bg-amber-600 border-amber-600 text-white'
                : isDimmed
                ? 'bg-stone-100 border-stone-300 text-transparent opacity-50 cursor-not-allowed'
                : 'bg-white/85 border-stone-300 text-transparent hover:border-amber-500'
            )}
          >
            <Check size={11} weight="bold" />
          </button>
        )}

        {/* Completed Checkmark Badge */}
        {uploadFinished && (
          <div className="absolute top-2 right-2 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-emerald-600 text-white shadow-sm">
            <Check size={14} weight="bold" />
          </div>
        )}

        {/* Remove Item */}
        {!isUploading && !uploadFinished && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onRemove(it.id);
            }}
            className="absolute top-2 right-2 z-10 flex h-5 w-5 items-center justify-center rounded-md bg-stone-900/60 text-white opacity-0 group-hover:opacity-100 hover:bg-rose-600 transition-all"
          >
            <X size={11} />
          </button>
        )}

        {/* Parallel Progress Badge */}
        {(isItemUploading || (isItemDone && isUploading) || isItemError) && (
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
          {it.shootDate ? (
            <span className="truncate max-w-[80px] font-medium text-stone-600">{it.shootDate}</span>
          ) : (
            <span className="text-stone-400">No date</span>
          )}
        </div>
      </div>
    </motion.div>
  );
}

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
  // The wedding's own date and place (and the ceremony being viewed), used
  // wherever the admin has not typed one: { shootDate, city, venue, ceremony }.
  defaults,
}) {
  const [items, setItems] = useState([]);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [isUploading, setIsUploading] = useState(false);
  const [overallProgress, setOverallProgress] = useState(0);
  const [activeUploadsCount, setActiveUploadsCount] = useState(0);
  const [showDrawer, setShowDrawer] = useState(true);
  const [uploadFinished, setUploadFinished] = useState(false);
  const [uploadedResults, setUploadedResults] = useState([]);

  // Dynamic Ceremonies Taxonomy
  // Ceremonies are the Ceremony tag group (read through /api/ceremonies below);
  // the first one becomes the default theme once they load.
  const [ceremonies, setCeremonies] = useState([]);
  const [curationTheme, setCurationTheme] = useState('');
  // Tag suggestions: the photo tags used most, from the tag system.
  const taxonomy = useTaxonomy();
  const tagSuggestions = useMemo(() => taxonomy.groupsFor('Photo')
    .filter((g) => g.cardinality === 'multi')
    .flatMap((g) => (g.tags || []).filter((t) => !t.hidden))
    .sort((a, b) => (b.usage?.Photo || 0) - (a.usage?.Photo || 0))
    .slice(0, 14)
    .map((t) => t.label), [taxonomy]);

  // Dynamic BTS Crew Roles
  const [btsRolePresets, setBtsRolePresets] = useState(DEFAULT_BTS_ROLES);

  // Batch curation state
  const [curationDate, setCurationDate] = useState('');
  const [curationCity, setCurationCity] = useState('');
  const [curationVenue, setCurationVenue] = useState('');
  const [curationCredits, setCurationCredits] = useState([]);
  const [creditRoleInput, setCreditRoleInput] = useState('Lead Photographer');
  const [creditNameInput, setCreditNameInput] = useState('');
  const [curationTags, setCurationTags] = useState([]);
  const [customTagInput, setCustomTagInput] = useState('');

  const fileInputRef = useRef(null);
  const prevOpenRef = useRef(false);
  const uploadedPlacementsRef = useRef([]);
  const itemsRef = useRef(items);
  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  const storageKey = useMemo(() => `wb_photo_staging_${clientId || 'default'}`, [clientId]);

  // Fetch dynamic ceremonies from backend
  useEffect(() => {
    async function fetchCeremonies() {
      try {
        const res = await fetch(`${api_url}/api/ceremonies`, { credentials: 'include' });
        const data = await res.json();
        if (data.ceremonies?.length) {
          setCeremonies(data.ceremonies.map((c) => ({ name: c.name, color: c.color || 'amber' })));
          setCurationTheme((prev) => prev || data.ceremonies[0].name);
        }
      } catch (e) {
        console.warn('Failed to fetch dynamic ceremonies, using default list:', e);
      }
    }
    fetchCeremonies();
  }, []);

  // Fetch dynamic BTS schema roles from backend
  useEffect(() => {
    async function fetchBts() {
      try {
        const res = await fetch(`${api_url}/api/bts-schema`, { credentials: 'include' });
        const data = await res.json();
        if (data.schema?.length) {
          const titles = data.schema.map((s) => s.title).filter(Boolean);
          if (titles.length) {
            setBtsRolePresets(titles);
            setCreditRoleInput(titles[0]);
          }
        }
      } catch (e) {
        console.warn('Failed to fetch BTS schema roles, using defaults:', e);
      }
    }
    fetchBts();
  }, []);

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

    if (!wasOpen && initialFiles && initialFiles.length > 0) {
      const date = curationDate || defaults?.shootDate || '';
      const city = curationCity || defaults?.city || '';
      const venue = curationVenue || defaults?.venue || '';
      if (!curationDate && date) setCurationDate(date);
      if (!curationCity && city) setCurationCity(city);
      if (!curationVenue && venue) setCurationVenue(venue);
      const newItems = initialFiles.map((file, idx) => ({
        id: `${file.name}-${file.size}-${Date.now()}-${idx}`,
        file,
        name: file.name,
        size: file.size,
        previewUrl: URL.createObjectURL(file),
        progress: 0,
        status: 'queued',
        error: null,
        eventGroup: defaults?.ceremony || 'Unthemed',
        tags: [...curationTags],
        shootDate: date,
        city,
        venue,
        credits: [...curationCredits],
      }));
      setItems(newItems);
      setSelectedIds(new Set(newItems.map((it) => it.id)));
    }
    // Only the open transition acts (prevOpenRef); re-runs while open or closed are no-ops.
  }, [open, initialFiles, curationCity, curationCredits, curationDate, curationTags, curationVenue, defaults?.ceremony, defaults?.city, defaults?.shootDate, defaults?.venue]);

  // Clean up object URLs on unmount
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
      eventGroup: 'Unthemed',
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

  // Grouping structures
  const ceremonyGroups = useMemo(() => {
    const map = new Map();
    items.forEach((it) => {
      const theme = it.eventGroup && it.eventGroup !== 'Unthemed' ? it.eventGroup : null;
      if (theme) {
        if (!map.has(theme)) map.set(theme, []);
        map.get(theme).push(it);
      }
    });
    return map;
  }, [items]);

  const unthemedItems = useMemo(() => {
    return items.filter((it) => !it.eventGroup || it.eventGroup === 'Unthemed');
  }, [items]);

  // Active selection scope: when user selects an item, lock selection to that item's group
  const activeSelectionGroup = useMemo(() => {
    if (!selectedIds.size) return null;
    for (const it of items) {
      if (selectedIds.has(it.id)) {
        return it.eventGroup && it.eventGroup !== 'Unthemed' ? it.eventGroup : 'Unthemed';
      }
    }
    return null;
  }, [selectedIds, items]);

  const getCeremonyTheme = useCallback((themeName) => {
    const match = ceremonies.find((c) => c.name === themeName);
    const color = match?.color || 'amber';
    return CEREMONY_THEMES[color] || CEREMONY_THEMES.amber;
  }, [ceremonies]);

  const toggleSelect = (id) => {
    if (isUploading || uploadFinished) return;
    const targetItem = items.find((it) => it.id === id);
    if (!targetItem) return;

    const itemGroup = targetItem.eventGroup && targetItem.eventGroup !== 'Unthemed'
      ? targetItem.eventGroup
      : 'Unthemed';

    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
        return next;
      }

      // Group selection isolation: cannot mix items from different ceremony groups
      if (activeSelectionGroup && activeSelectionGroup !== itemGroup) {
        fireMessage(
          `Cannot mix selections across groups. Currently selecting in "${activeSelectionGroup}". Deselect to pick from "${itemGroup}".`,
          'warning'
        );
        return prev;
      }

      next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    if (selectedIds.size > 0) {
      setSelectedIds(new Set());
      return;
    }
    // Default to selecting all unthemed items for quick grouping
    if (unthemedItems.length > 0) {
      setSelectedIds(new Set(unthemedItems.map((it) => it.id)));
    } else if (items.length > 0) {
      const firstGroup = ceremonyGroups.keys().next().value;
      if (firstGroup) {
        const groupPhotos = ceremonyGroups.get(firstGroup) || [];
        setSelectedIds(new Set(groupPhotos.map((it) => it.id)));
      }
    }
  };

  const selectUnthemed = () => {
    if (activeSelectionGroup === 'Unthemed' && selectedIds.size === unthemedItems.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(unthemedItems.map((it) => it.id)));
    }
  };

  const selectGroup = (themeName) => {
    const groupPhotos = ceremonyGroups.get(themeName) || [];
    if (activeSelectionGroup === themeName && selectedIds.size === groupPhotos.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(groupPhotos.map((it) => it.id)));
    }
  };

  const ungroupCeremony = (themeName) => {
    if (isUploading || uploadFinished) return;
    const count = items.filter((it) => it.eventGroup === themeName).length;
    setItems((prev) =>
      prev.map((it) => (it.eventGroup === themeName ? { ...it, eventGroup: 'Unthemed' } : it))
    );
    if (activeSelectionGroup === themeName) {
      setSelectedIds(new Set());
    }
    fireMessage(`Ungrouped ${count} photos from ${themeName}`, 'info');
  };

  // Animated Ceremony Grouping & Reordering
  const handleGroupSelected = (targetTheme = curationTheme) => {
    if (!selectedIds.size) return;

    // 1. Update items with event theme, date, location, and credits
    const updated = items.map((it) => {
      if (!selectedIds.has(it.id)) return it;
      return {
        ...it,
        eventGroup: targetTheme,
        tags: curationTags.length ? [...curationTags] : it.tags,
        shootDate: curationDate || it.shootDate,
        city: curationCity || it.city,
        venue: curationVenue || it.venue,
        credits: curationCredits.length ? [...curationCredits] : it.credits,
      };
    });

    // 2. Dynamically reorder items so assigned ceremonies cluster contiguously,
    // placing the active targetTheme at the top cluster, followed by other rituals, then Unthemed
    const reordered = [...updated].sort((a, b) => {
      const aTheme = a.eventGroup || 'Unthemed';
      const bTheme = b.eventGroup || 'Unthemed';
      if (aTheme === bTheme) return 0;
      if (aTheme === targetTheme) return -1;
      if (bTheme === targetTheme) return 1;
      if (aTheme === 'Unthemed') return 1;
      if (bTheme === 'Unthemed') return -1;
      return aTheme.localeCompare(bTheme);
    });

    const count = selectedIds.size;
    setItems(reordered);

    // CRITICAL: Unselect all images after grouping so admin can cleanly select next group!
    setSelectedIds(new Set());

    fireMessage(`Grouped ${count} photos into ${targetTheme}!`, 'success');
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

        // Step 2: Create PortfolioItem placement with all curated metadata & BTS
        // credits, tagged by id (a typed tag the tag system lacks lands in Unsorted).
        const { ids: tagIds, failures: tagFailures } = await taxonomy.idsFromLabels('Photo', {
          ceremony: item.eventGroup && item.eventGroup !== 'Unthemed' ? item.eventGroup : '',
          tags: item.tags || [],
        });
        if (tagFailures.length) fireMessage(`Some tags were skipped: ${tagFailures.join(', ')}`, 'error');
        const portRes = await fetch(`${api_url}/api/admin/portfolio`, {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            media: media._id,
            client: clientId,
            kind: 'Photo',
            tagIds,
            shootDate: item.shootDate || undefined,
            location: (item.city || item.venue) ? { city: item.city, venue: item.venue } : undefined,
            credits: item.credits || [],
            // No status: the server decides (plan D7) — live with the wedding if
            // it is a draft, hidden for review if it is already published.
          }),
        });

        if (!portRes.ok) {
          const errData = await portRes.json();
          throw new Error(errData.message || 'Portfolio link failed');
        }

        const { item: portfolioDoc } = await portRes.json();
        uploadedPlacements.push(portfolioDoc);
        uploadedPlacementsRef.current.push(portfolioDoc);

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
    // A retry adds to what earlier runs uploaded instead of replacing it.
    setUploadedResults((prev) => [...prev, ...uploadedPlacements]);

    try {
      sessionStorage.removeItem(storageKey);
    } catch { /* ignore */ }

    if (uploadedPlacements.length > 0) {
      fireMessage(`Uploaded and curated ${uploadedPlacements.length} photographs!`, 'success');
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
  const unthemedCount = items.filter((it) => !it.eventGroup || it.eventGroup === 'Unthemed').length;
  const errorCount = items.filter((it) => it.status === 'error').length;

  // Group items by eventGroup for organized visual clusters
  const groupedClusters = useMemo(() => {
    const groups = {};
    items.forEach((it) => {
      const g = it.eventGroup || 'Unthemed';
      if (!groups[g]) groups[g] = [];
      groups[g].push(it);
    });
    return groups;
  }, [items]);

  return (
    <Dialog open={open} onOpenChange={(v) => !v && !isUploading && safeClose()}>
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
                  {uploadFinished ? 'Photo Ingest & Optimization Status' : 'Stage & Curate Photographs'}
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
                  ? 'All master photographs securely uploaded to Cloudflare R2 bucket with automated web optimization.'
                  : 'Select photos to group into ceremonies with animated reordering, shoot dates, and BTS crew roles.'}
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
                {showDrawer ? 'Hide Curation Panel' : 'Show Curation Panel'}
              </Button>
            )}

            <button
              type="button"
              disabled={isUploading}
              onClick={safeClose}
              className="flex items-center justify-center h-8 w-8 rounded-xl text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors disabled:opacity-50"
            >
              <X size={16} />
              <span className="sr-only">Close</span>
            </button>
          </div>
        </header>

        {/* Main Body: Staged Photos Grid & Right Ingest/Curation Panel */}
        <div className="flex-1 flex overflow-hidden">
          {/* Staged Photos Grid Viewport */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Action Ribbon Above Grid */}
            <div className="border-b border-[#E8DDD1] bg-[#FFFDF9] px-6 py-2.5 shrink-0 flex items-center justify-between text-xs">
              <div className="flex items-center gap-3">
                {activeSelectionGroup ? (
                  <>
                    <span className="inline-flex items-center gap-1.5 font-bold text-amber-900 bg-amber-100/90 border border-amber-300/80 px-2.5 py-0.5 rounded-lg text-xs">
                      <Sparkle size={12} weight="fill" className="text-amber-600" />
                      Active Selection: {selectedIds.size} photo{selectedIds.size === 1 ? '' : 's'} in &quot;{activeSelectionGroup}&quot;
                    </span>
                    <button
                      type="button"
                      disabled={isUploading}
                      onClick={() => setSelectedIds(new Set())}
                      className="font-medium text-stone-600 hover:text-stone-950 underline cursor-pointer text-xs"
                    >
                      Deselect All
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      disabled={isUploading || !items.length}
                      onClick={selectAll}
                      className="font-semibold text-stone-700 hover:text-stone-950 underline cursor-pointer text-xs"
                    >
                      {selectedIds.size === items.length ? 'Deselect All' : `Select All (${items.length})`}
                    </button>
                    {unthemedItems.length > 0 && (
                      <>
                        <span className="text-stone-300">·</span>
                        <button
                          type="button"
                          disabled={isUploading}
                          onClick={selectUnthemed}
                          className="text-amber-700 hover:text-amber-900 font-semibold underline cursor-pointer text-xs"
                        >
                          Select All Unassigned ({unthemedItems.length})
                        </button>
                      </>
                    )}
                    <span className="text-stone-300">·</span>
                    <span className="text-stone-500 font-medium text-xs">
                      {selectedIds.size} of {items.length} selected
                    </span>
                  </>
                )}
              </div>

              {!uploadFinished && (
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
              )}
            </div>

            {/* Staged Photos Viewport: Grouped into Dashed Ceremony Theme Containers */}
            <div className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-stone-200 space-y-6">
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
                <div className="space-y-6">
                  {/* 1. Grouped Ceremony Clusters (each in light theme container with dashed border) */}
                  <AnimatePresence>
                    {Array.from(ceremonyGroups.entries()).map(([ceremonyName, groupItems]) => {
                      const themeStyle = getCeremonyTheme(ceremonyName);
                      const sampleItem = groupItems[0];
                      const isGroupActive = activeSelectionGroup === ceremonyName;

                      return (
                        <motion.div
                          layout
                          key={`ceremony-group-${ceremonyName}`}
                          initial={{ opacity: 0, y: 15 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          transition={{ type: 'spring', stiffness: 350, damping: 28 }}
                          className={cn(
                            'rounded-3xl border-2 border-dashed p-4 sm:p-5 transition-all shadow-sm',
                            themeStyle.bg,
                            themeStyle.border
                          )}
                        >
                          {/* Group Header Bar */}
                          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 mb-3 border-b border-black/5">
                            <div className="flex flex-wrap items-center gap-2.5">
                              <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-white shadow-xs">
                                <Sparkle size={14} className={themeStyle.accent} weight="fill" />
                              </span>
                              <div className="flex items-center gap-2">
                                <h4 className="font-sans text-xs sm:text-sm font-bold text-stone-900 tracking-tight">
                                  {ceremonyName}
                                </h4>
                                <span className={cn('text-[11px] font-semibold px-2 py-0.5 rounded-full border shadow-xs', themeStyle.badge)}>
                                  {groupItems.length} photo{groupItems.length === 1 ? '' : 's'}
                                </span>
                              </div>

                              {/* Shoot Date & Venue Pills */}
                              {sampleItem?.shootDate && (
                                <span className="inline-flex items-center gap-1 text-[11px] text-stone-600 bg-white/85 px-2.5 py-0.5 rounded-lg border border-stone-200/80 shadow-xs">
                                  <CalendarBlank size={12} className="text-stone-400" />
                                  {sampleItem.shootDate}
                                </span>
                              )}
                              {sampleItem?.city && (
                                <span className="inline-flex items-center gap-1 text-[11px] text-stone-600 bg-white/85 px-2.5 py-0.5 rounded-lg border border-stone-200/80 shadow-xs">
                                  <MapPin size={12} className="text-stone-400" />
                                  {sampleItem.city}{sampleItem.venue ? ` · ${sampleItem.venue}` : ''}
                                </span>
                              )}
                              {sampleItem?.credits?.length > 0 && (
                                <span className="inline-flex items-center gap-1 text-[11px] text-stone-600 bg-white/85 px-2.5 py-0.5 rounded-lg border border-stone-200/80 shadow-xs">
                                  <Users size={12} className="text-stone-400" />
                                  {sampleItem.credits.map((c) => c.name).join(', ')}
                                </span>
                              )}
                            </div>

                            {/* Group Selection Actions */}
                            {!isUploading && !uploadFinished && (
                              <div className="flex items-center gap-2 text-xs">
                                <button
                                  type="button"
                                  onClick={() => selectGroup(ceremonyName)}
                                  className="font-semibold text-stone-700 hover:text-stone-950 underline cursor-pointer text-[11px]"
                                >
                                  {isGroupActive && selectedIds.size === groupItems.length ? 'Deselect Group' : 'Select Group'}
                                </button>
                                <span className="text-stone-300">·</span>
                                <button
                                  type="button"
                                  onClick={() => ungroupCeremony(ceremonyName)}
                                  className="font-semibold text-rose-600 hover:text-rose-700 underline cursor-pointer text-[11px]"
                                >
                                  Ungroup
                                </button>
                              </div>
                            )}
                          </div>

                          {/* Photos Grid for this Ceremony Group */}
                          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5">
                            {groupItems.map((it) => {
                              const isSelected = selectedIds.has(it.id);
                              const isDimmed = Boolean(activeSelectionGroup && activeSelectionGroup !== ceremonyName);

                              return (
                                <StagedPhotoCard
                                  key={it.id}
                                  it={it}
                                  isSelected={isSelected}
                                  isDimmed={isDimmed}
                                  isUploading={isUploading}
                                  uploadFinished={uploadFinished}
                                  onToggleSelect={toggleSelect}
                                  onRemove={handleRemoveItem}
                                />
                              );
                            })}
                          </div>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>

                  {/* 2. Unthemed / Unassigned Photos Container */}
                  {unthemedItems.length > 0 && (
                    <motion.div
                      layout
                      key="ceremony-group-unthemed"
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ type: 'spring', stiffness: 350, damping: 28 }}
                      className={cn(
                        'rounded-3xl border border-dashed border-stone-300/90 bg-stone-50/60 p-4 sm:p-5 transition-all',
                        ceremonyGroups.size > 0 && 'border-stone-300'
                      )}
                    >
                      {/* Header */}
                      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 mb-3 border-b border-stone-200/80">
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-sans text-xs sm:text-sm font-bold text-stone-800 tracking-tight">
                              {ceremonyGroups.size > 0 ? 'Unassigned Photos' : 'Staged Photographs'}
                            </h4>
                            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-stone-200/80 text-stone-700">
                              {unthemedItems.length} photo{unthemedItems.length === 1 ? '' : 's'} ready to group
                            </span>
                          </div>
                          <p className="text-[11px] text-stone-500 mt-0.5">
                            Select photos below, pick a ritual in the right panel, and click &quot;Group into...&quot;
                          </p>
                        </div>

                        {!isUploading && !uploadFinished && (
                          <button
                            type="button"
                            onClick={selectUnthemed}
                            className="font-semibold text-amber-700 hover:text-amber-900 underline cursor-pointer text-xs"
                          >
                            {activeSelectionGroup === 'Unthemed' && selectedIds.size === unthemedItems.length
                              ? 'Deselect Unassigned'
                              : `Select All Unassigned (${unthemedItems.length})`}
                          </button>
                        )}
                      </div>

                      {/* Unthemed Photo Grid */}
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5">
                        {unthemedItems.map((it) => {
                          const isSelected = selectedIds.has(it.id);
                          const isDimmed = Boolean(activeSelectionGroup && activeSelectionGroup !== 'Unthemed');

                          return (
                            <StagedPhotoCard
                              key={it.id}
                              it={it}
                              isSelected={isSelected}
                              isDimmed={isDimmed}
                              isUploading={isUploading}
                              uploadFinished={uploadFinished}
                              onToggleSelect={toggleSelect}
                              onRemove={handleRemoveItem}
                            />
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right Panel: Transitions smoothly between Curation Drawer and Ingest Status */}
          {showDrawer && (
            <aside className="w-80 border-l border-[#E8DDD1] bg-white flex flex-col shrink-0 overflow-y-auto p-5 space-y-5 scrollbar-thin">
              {uploadFinished ? (
                /* Non-Technical Ingest Status Summary Panel */
                <div className="space-y-5 animate-in fade-in duration-300">
                  <div className="space-y-1.5 pb-4 border-b border-[#E8DDD1]">
                    <div className="flex items-center gap-2">
                      <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
                        <CheckCircle size={18} weight="fill" />
                      </span>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-stone-900">
                        Ingest Completed
                      </h4>
                    </div>
                    <p className="text-[11px] text-stone-600 leading-relaxed">
                      {doneCount} photographs safely ingested and linked to this wedding.
                    </p>
                  </div>

                  {/* Clean Reassurance Notice */}
                  <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-3.5 space-y-2 text-xs">
                    <p className="font-semibold text-emerald-950 flex items-center gap-1.5">
                      <HardDrives size={15} className="text-emerald-700" />
                      Cloud Master Stored
                    </p>
                    <p className="text-[11px] text-emerald-900 leading-relaxed">
                      All high-resolution originals are safely uploaded to Cloudflare R2 storage bucket.
                    </p>
                  </div>

                  {/* Worker Optimization Info (Reassuring, non-technical) */}
                  <div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-3.5 space-y-2 text-xs">
                    <p className="font-semibold text-amber-950 flex items-center gap-1.5">
                      <Sparkle size={15} className="text-amber-700" />
                      Web Optimization
                    </p>
                    <p className="text-[11px] text-amber-900 leading-relaxed">
                      Web derivatives (2400w, 1600w, 1024w) and BlurHash previews are queued. If the background worker is currently offline, optimization will proceed automatically when the worker starts.
                    </p>
                  </div>

                  {/* Action Buttons */}
                  <div className="pt-3 space-y-2">
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
                        className="w-full text-xs font-semibold py-2.5"
                      >
                        Finish & View Client Gallery
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                /* Active Batch Curation Drawer */
                <div className="space-y-5 animate-in fade-in duration-200">
                  <div>
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-stone-900 flex items-center gap-1.5">
                        <FolderSimpleStar size={14} className="text-amber-600" />
                        Ceremony Grouping
                      </h4>
                      <span className="text-[10px] text-stone-500 bg-stone-100 border border-stone-200 px-1.5 py-0.5 rounded-md font-medium">
                        {selectedIds.size} Selected
                      </span>
                    </div>
                    <p className="text-[11px] text-stone-500 mt-1">
                      Choose ceremony and details, then click below to animate selected photos into a cluster.
                    </p>
                  </div>

                  {/* 1. Dynamic Ceremony Taxonomy Selector */}
                  <div className="space-y-2">
                    <label className="text-[11px] font-bold text-stone-800 uppercase tracking-wide block">
                      Ceremony Ritual
                    </label>
                    <div className="grid grid-cols-2 gap-1.5">
                      {ceremonies.map((c) => (
                        <button
                          key={c.name}
                          type="button"
                          onClick={() => setCurationTheme(c.name)}
                          className={cn(
                            'rounded-xl px-2.5 py-1.5 text-[11px] font-medium transition-all border text-left truncate cursor-pointer',
                            curationTheme === c.name
                              ? 'bg-amber-600 text-white border-amber-600 shadow-sm'
                              : 'bg-white text-stone-700 border-stone-200 hover:border-amber-300'
                          )}
                        >
                          {c.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 2. Shoot Date & Location */}
                  <div className="space-y-2.5 pt-1">
                    <div>
                      <label className="text-[11px] font-bold text-stone-800 uppercase tracking-wide block mb-1">
                        Ritual Date
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
                          placeholder="e.g. Taj Lake Palace"
                          value={curationVenue}
                          onChange={(e) => setCurationVenue(e.target.value)}
                          className="w-full px-2.5 py-1.5 text-xs rounded-xl border border-stone-200 focus:outline-none focus:border-amber-600 bg-stone-50/50"
                        />
                      </div>
                    </div>
                  </div>

                  {/* 3. Rich BTS Crew Assignment */}
                  <div className="space-y-2 pt-1 border-t border-stone-100">
                    <label className="text-[11px] font-bold text-stone-800 uppercase tracking-wide block">
                      BTS Crew Roles
                    </label>

                    <div className="flex gap-1.5">
                      <select
                        value={creditRoleInput}
                        onChange={(e) => setCreditRoleInput(e.target.value)}
                        className="text-xs rounded-xl border border-stone-200 px-2 py-1.5 bg-stone-50/50 focus:outline-none focus:border-amber-600"
                      >
                        {btsRolePresets.map((r) => (
                          <option key={r} value={r}>
                            {r}
                          </option>
                        ))}
                      </select>
                      <input
                        type="text"
                        placeholder="Crew member name..."
                        value={creditNameInput}
                        onChange={(e) => setCreditNameInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addCredit())}
                        className="flex-1 text-xs rounded-xl border border-stone-200 px-2.5 py-1.5 focus:outline-none focus:border-amber-600"
                      >
                      </input>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={addCredit}
                        className="text-xs border-stone-200 px-2"
                      >
                        Add
                      </Button>
                    </div>

                    {curationCredits.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-1">
                        {curationCredits.map((cred, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center gap-1 rounded-lg bg-amber-50 border border-amber-200/80 px-2 py-0.5 text-[10px] text-amber-950 font-medium"
                          >
                            <span className="font-semibold text-amber-900">{cred.role}:</span> {cred.name}
                            <button
                              type="button"
                              onClick={() => removeCredit(idx)}
                              className="text-stone-400 hover:text-stone-800 ml-0.5"
                            >
                              <X size={10} />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* 4. Tags */}
                  <div className="space-y-2 pt-1 border-t border-stone-100">
                    <label className="text-[11px] font-bold text-stone-800 uppercase tracking-wide block">
                      Curated Tags
                    </label>
                    <div className="flex flex-wrap gap-1">
                      {tagSuggestions.map((tag) => (
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

                  {/* Animated Grouping Action Button */}
                  <div className="pt-3 border-t border-stone-200">
                    <Button
                      type="button"
                      variant="gold"
                      size="sm"
                      disabled={!selectedIds.size || isUploading}
                      onClick={() => handleGroupSelected(curationTheme)}
                      className={cn(
                        'w-full font-semibold shadow-sm py-2 transition-all',
                        selectedIds.size
                          ? 'bg-stone-900 hover:bg-stone-800 text-white cursor-pointer'
                          : 'bg-stone-100 text-stone-400 cursor-not-allowed border border-stone-200'
                      )}
                    >
                      {selectedIds.size > 0
                        ? `Group ${selectedIds.size} Photo${selectedIds.size === 1 ? '' : 's'} into ${curationTheme}`
                        : `Select photos to group into ${curationTheme}`}
                    </Button>
                  </div>
                </div>
              )}
            </aside>
          )}
        </div>

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
                <Check size={16} weight="bold" /> {doneCount} photos stored with full ceremony & BTS taxonomy.
              </span>
            )}
            {!isUploading && !uploadFinished && (
              <span className="text-xs text-stone-500">
                {selectedIds.size} of {items.length} photos selected
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
