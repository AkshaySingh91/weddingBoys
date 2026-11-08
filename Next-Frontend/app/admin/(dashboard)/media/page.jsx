'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import {
  UploadSimple, MagnifyingGlass, FilmSlate, FileText, ImageSquare,
  CircleNotch, Star, HardDrives, Stack, Users, Article, ChatCircleDots,
  Buildings, Sparkle, Question, WarningCircle, GridFour, Check, Trash,
  ArrowBendUpRight, Tag, Eye, EyeSlash, CloudArrowUp, CaretDown, X,
} from '@phosphor-icons/react';
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent,
  DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator,
} from '@/app/admin/components/ui/Dropdown.jsx';
import useMediaLibrary from '@/Hooks/useMediaLibrary.jsx';
import { fireMessage } from '@/Utils/fireMessage.js';
import { Button } from '@/app/admin/components/ui/Button.jsx';
import { Badge } from '@/app/admin/components/ui/Badge.jsx';
import { cn } from '@/lib/utils.js';
import { formatBytes, formatDuration } from '@/Utils/format.js';
import AssetSheet, { urlOf, STATUS_TONE } from './_components/AssetSheet.jsx';
import DeleteConfirmModal from './_components/DeleteConfirmModal.jsx';
import UploadModal from './_components/UploadModal.jsx';
import MediaFilterBar, { ORIENTATION_OPTIONS, SORT_OPTIONS } from './_components/MediaFilterBar.jsx';
import MediaGridCard from './_components/MediaGridCard.jsx';
import { PageHeader } from '@/app/admin/components/ui/PageHeader.jsx';


/**
 * Purpose, not file type, is the useful axis.
 *
 * "Images / Videos / Documents" says nothing about what an asset is FOR. What
 * an admin actually asks is "where does this belong" — a client's wedding, the
 * team page, a review. `ownerType` already encodes exactly that and is already
 * indexed, so this is a change of emphasis, not of schema.
 *
 * `System` is renamed Unassigned because that is what it means: every library
 * upload lands there, attached to nothing, reachable by no public page.
 */
const DOMAIN_COLLECTIONS = [
  { key: '', label: 'Everything', icon: Stack, hint: 'All studio assets' },
  { key: 'Client', label: 'Client Work', icon: Sparkle, hint: 'Films & photos from client weddings' },
  { key: 'Website', label: 'Website & CMS', icon: Buildings, hint: 'Managed page media & carousels' },
  { key: 'Blog', label: 'Blog Stories', icon: Article, hint: 'Editorial article imagery' },
  { key: 'Team', label: 'Team', icon: Users, hint: 'Portraits and team profiles' },
  { key: 'Review', label: 'Reviews', icon: ChatCircleDots, hint: 'Client review media' },
  { key: 'Brand', label: 'Brand Identity', icon: Star, hint: 'Logos, seals & watermarks' },
];

const WORKFLOW_QUEUES = [
  { key: 'System', label: 'Unassigned Backlog', icon: Question, hint: 'Assets not linked to any wedding or page' },
];

const ALL_PURPOSES = [...DOMAIN_COLLECTIONS, ...WORKFLOW_QUEUES];

const TYPE_TABS = [
  { key: '', label: 'All' },
  { key: 'Image', label: 'Images' },
  { key: 'Video', label: 'Videos' },
  { key: 'Document', label: 'Docs' },
  { key: 'Animation', label: 'Animations' },
];

// 'System' is offered separately as "Unassigned Backlog", so it is excluded here
// to avoid a duplicated option.
const UPLOAD_TARGETS = DOMAIN_COLLECTIONS.filter((p) => p.key);

export default function MediaLibraryPage() {
  const {
    items, total, hasMore, loading, uploadProgress, stats,
    fetchMedia, fetchStats, uploadNewMedia, updateMediaMeta, deleteMedia, setItems,
    selectedIds, toggleSelect, selectAll, clearSelection, isSelected,
    batchDeleteMedia, batchUpdateMedia,
  } = useMediaLibrary({ ownerType: 'System' });

  const [search, setSearch] = useState('');
  const [activeType, setActiveType] = useState('');
  const [orientation, setOrientation] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [purpose, setPurpose] = useState('');
  const [uploadOwner, setUploadOwner] = useState('Client');
  const [focused, setFocused] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef(null);
  const pageRef = useRef(1);
  const sentinelRef = useRef(null);
  const [batchTagInput, setBatchTagInput] = useState('');
  const [batchTagOpen, setBatchTagOpen] = useState(false);

  useEffect(() => { fetchStats(); }, [fetchStats]);

  // Global keyboard shortcuts for selection management
  useEffect(() => {
    const handleKeyDown = (e) => {
      const tag = document.activeElement?.tagName;
      const isInput = tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT';

      // Escape → clear selection (always, even in inputs)
      if (e.key === 'Escape' && selectedIds.length > 0) {
        e.preventDefault();
        clearSelection();
        return;
      }

      // ⌘A / Ctrl+A → select all visible (only when not focused on input)
      if ((e.metaKey || e.ctrlKey) && e.key === 'a' && !isInput && items.length > 0) {
        e.preventDefault();
        selectAll();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedIds, items, clearSelection, selectAll]);

  // Infinite scroll via IntersectionObserver — loads the next page
  // when the sentinel element scrolls into view.
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && hasMore && !loading) {
          loadMore();
        }
      },
      { rootMargin: '200px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasMore, loading]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const t = setTimeout(() => {
      pageRef.current = 1;
      fetchMedia({
        search,
        mediaType: activeType,
        ownerType: purpose,
        orientation,
        sortBy,
        pageNum: 1,
        reset: true,
      });
    }, 250);
    return () => clearTimeout(t);
  }, [search, activeType, purpose, orientation, sortBy, fetchMedia]);

  const loadMore = () => {
    pageRef.current += 1;
    fetchMedia({
      search,
      mediaType: activeType,
      ownerType: purpose,
      orientation,
      sortBy,
      pageNum: pageRef.current,
      reset: false,
    });
  };

  const refresh = () => {
    pageRef.current = 1;
    fetchMedia({
      search,
      mediaType: activeType,
      ownerType: purpose,
      orientation,
      sortBy,
      pageNum: 1,
      reset: true,
    });
    fetchStats();
  };

  const handleClearAllFilters = () => {
    setSearch('');
    setActiveType('');
    setOrientation('');
    setSortBy('newest');
  };

  const handleToggleFeatured = async (media) => {
    const nextFeatured = !media.featured;
    setItems((prev) => prev.map((m) => m._id === media._id ? { ...m, featured: nextFeatured } : m));
    try {
      await updateMediaMeta(media._id, { featured: nextFeatured });
      fireMessage(nextFeatured ? 'Marked as featured' : 'Removed from featured', 'success');
    } catch (err) {
      setItems((prev) => prev.map((m) => m._id === media._id ? { ...m, featured: media.featured } : m));
      fireMessage('Failed to update featured state', 'error');
    }
  };

  const handleSelectPurpose = (key) => {
    setPurpose(key);
    // Automatically synchronize upload target with current category
    if (key === 'System') {
      setUploadOwner('System');
    } else if (key) {
      setUploadOwner(key);
    } else {
      setUploadOwner('Client');
    }
  };

  const [stagedFiles, setStagedFiles] = useState(null);
  const [deletingMedia, setDeletingMedia] = useState(null);
  const [batchDeleting, setBatchDeleting] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  // Portfolio placements that would be taken off the site; set by a 409.
  const [inUse, setInUse] = useState(null);
  const [batchBusy, setBatchBusy] = useState(false);

  const handleFiles = (fileList) => {
    const files = Array.from(fileList || []);
    if (!files.length) return;
    setStagedFiles(files);
  };

  const save = async (draft) => {
    setSaving(true);
    try {
      const updated = await updateMediaMeta(draft._id, {
        title: draft.title || '', altText: draft.altText || '', caption: draft.caption || '',
        description: draft.description || '', tags: draft.tags || [],
        featured: !!draft.featured, visibility: draft.visibility || 'Public',
      });
      setFocused(updated);
      fireMessage('Saved', 'success');
    } catch (err) {
      fireMessage(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const requestDelete = (media) => {
    setDeletingMedia(media);
  };

  const requestBatchDelete = () => {
    if (!selectedIds.length) return;
    setBatchDeleting(true);
  };

  // First press: a file shown on the site comes back 409 with where it is used,
  // and the modal asks again. Second press deletes with `force`, which takes
  // those portfolio items off the site instead of leaving broken tiles.
  const confirmDeleteAction = async () => {
    setDeleteLoading(true);
    const force = Boolean(inUse);
    try {
      if (deletingMedia) {
        await deleteMedia(deletingMedia._id, { force });
        setFocused(null);
        setDeletingMedia(null);
        setInUse(null);
        fireMessage('Asset permanently removed', 'success');
      } else if (batchDeleting && selectedIds.length > 0) {
        const result = await batchDeleteMedia(selectedIds, { force });
        if (result?.placements) { setInUse(result.placements); return; }
        setBatchDeleting(false);
        setInUse(null);
      }
      refresh();
    } catch (err) {
      if (err.placements) setInUse(err.placements);
      else fireMessage(err.message, 'error');
    } finally {
      setDeleteLoading(false);
    }
  };

  // ── Batch Command Palette Handlers ──
  const handleBatchReassign = async (targetOwnerType) => {
    if (!selectedIds.length || batchBusy) return;
    setBatchBusy(true);
    try {
      await batchUpdateMedia(selectedIds, { ownerType: targetOwnerType });
      const label = ALL_PURPOSES.find((p) => p.key === targetOwnerType)?.label || targetOwnerType;
      fireMessage(`${selectedIds.length} assets moved to ${label}`, 'success');
      clearSelection();
      refresh();
    } catch (err) {
      fireMessage(err.message, 'error');
    } finally {
      setBatchBusy(false);
    }
  };

  const handleBatchFeatured = async (featured) => {
    if (!selectedIds.length || batchBusy) return;
    setBatchBusy(true);
    try {
      await batchUpdateMedia(selectedIds, { featured });
      fireMessage(featured ? `${selectedIds.length} assets starred` : `${selectedIds.length} assets unstarred`, 'success');
      refresh();
    } catch (err) {
      fireMessage(err.message, 'error');
    } finally {
      setBatchBusy(false);
    }
  };

  const handleBatchVisibility = async (visibility) => {
    if (!selectedIds.length || batchBusy) return;
    setBatchBusy(true);
    try {
      await batchUpdateMedia(selectedIds, { visibility });
      fireMessage(`${selectedIds.length} assets set to ${visibility}`, 'success');
      refresh();
    } catch (err) {
      fireMessage(err.message, 'error');
    } finally {
      setBatchBusy(false);
    }
  };

  const handleBatchAddTag = async () => {
    const clean = batchTagInput.trim().replace(/^#/, '');
    if (!clean || !selectedIds.length || batchBusy) return;
    setBatchBusy(true);
    try {
      await batchUpdateMedia(selectedIds, { tagsToAdd: [clean] });
      fireMessage(`Tag #${clean} added to ${selectedIds.length} assets`, 'success');
      setBatchTagInput('');
      setBatchTagOpen(false);
      refresh();
    } catch (err) {
      fireMessage(err.message, 'error');
    } finally {
      setBatchBusy(false);
    }
  };

  const activePurpose = ALL_PURPOSES.find((p) => p.key === purpose);
  const progressRows = useMemo(() => Object.entries(uploadProgress || {}), [uploadProgress]);
  const unassigned = stats?.byOwner?.System?.count || 0;

  return (
    <div
      className="space-y-4 font-sans"
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
    >
      <PageHeader
        title="Studio Media Library"
        subtitle={
          stats
            ? `${stats.total} master assets · ${formatBytes(stats.totalBytes)} pipeline storage on Cloudflare R2.`
            : 'Unified digital asset management for wedding films, photos, and site media.'
        }
        breadcrumbs={[
          { label: 'Admin', href: '/admin/dashboard' },
          { label: 'Media Library' },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <select
              aria-label="Upload category target"
              value={uploadOwner}
              onChange={(e) => setUploadOwner(e.target.value)}
              className="h-9 rounded-xl border border-edge-subtle bg-white px-3 text-xs font-medium text-ink-secondary outline-none focus:border-accent cursor-pointer shadow-xs"
            >
              {UPLOAD_TARGETS.map((o) => (
                <option key={o.key} value={o.key}>
                  Upload to: {o.label}
                </option>
              ))}
              <option value="System">Upload to: Unassigned Backlog</option>
            </select>

            <Button
              variant="primary"
              size="sm"
              icon={UploadSimple}
              loading={uploading}
              onClick={() => fileInputRef.current?.click()}
              className="shadow-xs font-semibold"
            >
              Upload Asset
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              hidden
              onChange={(e) => {
                handleFiles(e.target.files);
                e.target.value = '';
              }}
            />
          </div>
        }
      />

      {/* Operational Telemetry Strip */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 rounded-xl border border-edge-subtle bg-ground/90 p-2.5 shadow-xs backdrop-blur-xs">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="inline-flex items-center gap-1.5 rounded-lg bg-ground border border-edge-subtle px-2.5 py-1 font-medium text-ink-secondary">
            <HardDrives size={13} className="text-ink-muted" />
            <span className="font-semibold text-ink">{stats?.total || total || 0}</span> Assets
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-lg bg-ground border border-edge-subtle px-2.5 py-1 font-medium text-ink-secondary">
            <Sparkle size={13} className="text-ink-muted" />
            <span className="font-semibold text-ink">{formatBytes(stats?.totalBytes || 0)}</span> Cloudflare R2
          </span>
          {unassigned > 0 && (
            <button
              type="button"
              onClick={() => handleSelectPurpose('System')}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 font-medium transition-all cursor-pointer',
                purpose === 'System'
                  ? 'bg-amber-100 text-amber-900 border border-amber-300 shadow-xs'
                  : 'bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100/80'
              )}
            >
              <WarningCircle size={13} className="text-amber-600" />
              <span className="font-semibold">{unassigned} Unassigned</span>
              <span className="text-[10px] opacity-75 underline">Resolve</span>
            </button>
          )}
        </div>

        <div className="text-[11px] text-ink-muted font-medium">
          Active Scope: <span className="text-ink font-semibold">{activePurpose?.label || 'Everything'}</span>
          {activeType && <span> · <span className="text-ink font-semibold">{activeType}</span></span>}
          {orientation && <span> · <span className="text-ink font-semibold capitalize">{orientation}</span></span>}
          {sortBy && sortBy !== 'newest' && (
            <span> · <span className="text-ink font-semibold">{SORT_OPTIONS.find((s) => s.key === sortBy)?.label}</span></span>
          )}
        </div>
      </div>

      {/* Tablet / Mobile Horizontal Purpose Scroll Bar */}
      <div className="flex xl:hidden items-center gap-1.5 overflow-x-auto pb-1.5 scrollbar-none">
        {ALL_PURPOSES.map((p) => {
          const row = p.key ? stats?.byOwner?.[p.key] : { count: stats?.total, bytes: stats?.totalBytes };
          const count = row?.count || 0;
          const active = purpose === p.key;
          if (p.key && stats && count === 0 && p.key !== 'System') return null;
          return (
            <button
              key={p.key || 'all'}
              type="button"
              onClick={() => handleSelectPurpose(p.key)}
              className={cn(
                'shrink-0 flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-medium transition-all whitespace-nowrap cursor-pointer',
                active
                  ? 'bg-white shadow-xs border border-edge-subtle text-ink font-semibold ring-1 ring-ink/5'
                  : 'bg-ground-sunk/70 hover:bg-ground-sunk/60 text-ink-secondary border border-transparent',
                p.key === 'System' && !active && count > 0 && 'text-amber-700 bg-amber-50/60 border-amber-200/50'
              )}
            >
              <p.icon size={13} className={cn(active ? 'text-accent-ink' : 'text-ink-muted')} />
              <span>{p.label}</span>
              <span className={cn('text-[10px] tabular-nums rounded-full px-1.5 py-0.2', active ? 'bg-ground-sunk text-ink font-semibold' : 'text-ink-muted')}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      <div className="grid gap-5 xl:grid-cols-[220px_minmax(0,1fr)] items-start">
        {/* Desktop Purpose Sidebar - Unified White Studio Surface Card */}
        <aside className="hidden xl:flex flex-col xl:sticky xl:top-4 xl:self-start w-[220px] shrink-0 rounded-xl border border-edge-subtle bg-ground p-3 shadow-xs space-y-3.5">
          <div className="space-y-0.5">
            <p className="px-2 text-[10px] font-semibold uppercase tracking-wider text-ink-muted mb-1.5">
              Collections
            </p>
            {DOMAIN_COLLECTIONS.map((p) => {
              const row = p.key ? stats?.byOwner?.[p.key] : { count: stats?.total, bytes: stats?.totalBytes };
              const count = row?.count || 0;
              const active = purpose === p.key;
              if (p.key && stats && count === 0) return null;
              return (
                <button
                  key={p.key || 'all'}
                  type="button"
                  onClick={() => handleSelectPurpose(p.key)}
                  title={p.hint}
                  className={cn(
                    'flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left text-xs transition-all cursor-pointer',
                    active
                      ? 'bg-ground-sunk text-ink font-semibold shadow-2xs border border-edge-subtle'
                      : 'text-ink-secondary hover:text-ink hover:bg-ground border border-transparent'
                  )}
                >
                  <p.icon size={15} className={cn('shrink-0', active ? 'text-accent-ink' : 'text-ink-muted')} />
                  <span className="min-w-0 flex-1 truncate">{p.label}</span>
                  <span className={cn('shrink-0 tabular-nums text-[10px] rounded-full px-1.5 py-0.2', active ? 'bg-white text-ink font-semibold shadow-2xs' : 'text-ink-muted')}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="space-y-0.5 pt-2.5 border-t border-edge-subtle">
            <p className="px-2 text-[10px] font-semibold uppercase tracking-wider text-ink-muted mb-1.5">
              Workflows
            </p>
            {WORKFLOW_QUEUES.map((p) => {
              const row = stats?.byOwner?.System;
              const count = row?.count || 0;
              const active = purpose === p.key;
              return (
                <button
                  key={p.key}
                  type="button"
                  onClick={() => handleSelectPurpose(p.key)}
                  title={p.hint}
                  className={cn(
                    'flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left text-xs transition-all cursor-pointer',
                    active
                      ? 'bg-amber-50 text-amber-950 font-semibold shadow-2xs border border-amber-200'
                      : count > 0
                        ? 'text-amber-800 hover:bg-amber-50/70 border border-transparent'
                        : 'text-ink-secondary hover:bg-ground border border-transparent'
                  )}
                >
                  <p.icon size={15} className={cn('shrink-0', active ? 'text-amber-600' : count > 0 ? 'text-amber-500' : 'text-ink-muted')} />
                  <span className="min-w-0 flex-1 truncate">{p.label}</span>
                  <span className={cn(
                    'shrink-0 tabular-nums text-[10px] font-semibold rounded-full px-1.5 py-0.2',
                    active ? 'bg-white text-amber-900 shadow-2xs' : count > 0 ? 'bg-amber-100 text-amber-800' : 'text-ink-muted'
                  )}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {stats && (
            <div className="pt-2.5 border-t border-edge-subtle space-y-1">
              <div className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-wider text-ink-muted px-1">
                <span className="flex items-center gap-1.5">
                  <HardDrives size={12} className="text-ink-muted" /> Pipeline Storage
                </span>
                <span className="text-[10px] text-ink-muted font-mono">R2</span>
              </div>
              <p className="text-sm font-bold tabular-nums text-ink px-1">{formatBytes(stats.totalBytes)}</p>
              {activePurpose?.key && stats.byOwner?.[activePurpose.key] && (
                <div className="pt-1 flex items-center justify-between text-[11px] text-ink-muted px-1">
                  <span className="truncate">{activePurpose.label}</span>
                  <span className="font-mono font-medium text-ink-secondary">{formatBytes(stats.byOwner[activePurpose.key].bytes)}</span>
                </div>
              )}
            </div>
          )}
        </aside>

        <div className="min-w-0 space-y-3">

          <MediaFilterBar
            search={search}
            onSearchChange={setSearch}
            activeType={activeType}
            onTypeChange={setActiveType}
            typeTabs={TYPE_TABS}
            orientation={orientation}
            onOrientationChange={setOrientation}
            sortBy={sortBy}
            onSortChange={setSortBy}
            stats={stats}
            totalResults={total}
            onClearAll={handleClearAllFilters}
          />

          {progressRows.length > 0 && (
            <div className="space-y-1.5 rounded-xl border border-edge-subtle bg-white p-3">
              {progressRows.map(([name, pct]) => (
                <div key={name}>
                  <div className="flex justify-between text-[10px] text-ink-secondary">
                    <span className="truncate">{name}</span>
                    <span className="tabular-nums">{pct < 0 ? 'processing…' : `${pct}%`}</span>
                  </div>
                  <div className="mt-0.5 h-1 overflow-hidden rounded-full bg-ground-sunk">
                    <div className={cn('h-full rounded-full', pct < 0 ? 'w-full animate-pulse bg-red-400' : 'bg-accent')}
                      style={pct >= 0 ? { width: `${pct}%` } : undefined} />
                  </div>
                </div>
              ))}
            </div>
          )}

          {loading && items.length === 0 ? (
            <div className="flex items-center justify-center py-20 text-ink-muted">
              <CircleNotch size={22} className="animate-spin" />
            </div>
          ) : items.length === 0 ? (
            <div
              className="rounded-xl border-2 border-dashed border-edge-strong py-16 text-center bg-white/50"
              onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            >
              <CloudArrowUp size={36} weight="duotone" className="mx-auto text-stone-300 mb-3" />
              <p className="text-sm font-semibold text-ink-secondary">
                {search ? 'No matching assets' : `No assets in ${activePurpose?.label || 'this collection'}`}
              </p>
              <p className="mt-1 text-xs text-ink-muted max-w-xs mx-auto">
                {search
                  ? 'Try a different search term or adjust your filters.'
                  : 'Drag files here or use the Upload button to add your first asset.'}
              </p>
              {!search && (
                <Button
                  variant="primary"
                  size="sm"
                  icon={UploadSimple}
                  onClick={() => fileInputRef.current?.click()}
                  className="mt-4 shadow-xs font-semibold"
                >
                  Upload Asset
                </Button>
              )}
            </div>
          ) : (
            <>
              <div
                className="grid grid-cols-2 gap-3.5 rounded-xl sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 p-1 min-h-[200px]"
              >
                {items.map((m) => (
                  <MediaGridCard
                    key={m._id}
                    media={m}
                    selected={isSelected(m._id)}
                    onSelect={toggleSelect}
                    onInspect={setFocused}
                    onToggleFeatured={handleToggleFeatured}
                  />
                ))}
              </div>

              <div className="flex items-center justify-between pt-1">
                <p className="text-[11px] text-ink-muted">{items.length} of {total} shown</p>
                {loading && items.length > 0 && (
                  <CircleNotch size={16} className="animate-spin text-ink-muted" />
                )}
              </div>

              {/* Infinite Scroll Sentinel — auto-loads the next page when visible */}
              {hasMore && <div ref={sentinelRef} className="h-1" />}
            </>
          )}
        </div>
      </div>

      {/* Full-Viewport Drag-Drop Upload Overlay */}
      {dragging && (
        <div
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-ink/70 backdrop-blur-sm animate-in fade-in duration-150"
          onDragOver={(e) => e.preventDefault()}
          onDragLeave={(e) => {
            // Only dismiss when leaving the viewport entirely
            if (e.relatedTarget === null) setDragging(false);
          }}
          onDrop={(e) => { e.preventDefault(); setDragging(false); handleFiles(e.dataTransfer.files); }}
        >
          <div className="flex flex-col items-center gap-4 rounded-xl border-2 border-dashed border-accent/70 bg-ink/80 px-16 py-12 text-center shadow-2xl">
            <span className="flex h-16 w-16 items-center justify-center rounded-xl bg-accent/20 text-accent-ink animate-bounce">
              <CloudArrowUp size={36} weight="duotone" />
            </span>
            <div>
              <p className="text-lg font-bold text-white">Drop files to stage for upload</p>
              <p className="mt-1 text-sm text-ink-muted">
                Images, videos, and documents · Cloudflare R2 pipeline
              </p>
            </div>
            <div className="flex items-center gap-3 text-[11px] font-mono text-ink-muted">
              <span>JPG</span><span>·</span><span>PNG</span><span>·</span><span>WEBP</span><span>·</span><span>MP4</span><span>·</span><span>MOV</span><span>·</span><span>PDF</span>
            </div>
          </div>
        </div>
      )}

      {/* Floating Batch Command Palette */}
      {selectedIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2 rounded-xl border border-ink/90 bg-ink/95 px-3.5 py-2 text-white shadow-2xl backdrop-blur-md animate-in slide-in-from-bottom-4 font-sans">
          {/* Selection Counter */}
          <div className="flex items-center gap-2 text-xs font-medium pr-2.5 border-r border-ink">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-accent text-[11px] font-bold">
              {selectedIds.length}
            </span>
            <span>Selected</span>
          </div>

          {/* Select All */}
          <button
            type="button"
            onClick={selectAll}
            className="text-[11px] text-ink-muted hover:text-white font-medium transition cursor-pointer px-1.5 py-1"
          >
            All ({items.length})
          </button>

          <span className="h-4 w-px bg-ink" />

          {/* Reassign Collection Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                disabled={batchBusy}
                className="flex items-center gap-1.5 rounded-lg bg-white/10 hover:bg-white/15 border border-white/10 px-2.5 py-1.5 text-[11px] font-medium text-stone-200 transition cursor-pointer disabled:opacity-50"
              >
                <ArrowBendUpRight size={13} />
                <span>Move to…</span>
                <CaretDown size={10} className="text-ink-muted" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="center" side="top" sideOffset={8} className="w-52">
              <DropdownMenuLabel>Reassign Collection</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {ALL_PURPOSES.filter((p) => p.key).map((p) => (
                <DropdownMenuItem
                  key={p.key}
                  onClick={() => handleBatchReassign(p.key)}
                  className="flex items-center gap-2"
                >
                  <p.icon size={14} className="text-ink-muted shrink-0" />
                  <div className="flex flex-col min-w-0">
                    <span className="font-medium truncate">{p.label}</span>
                    <span className="text-[10px] text-ink-muted truncate">{p.hint}</span>
                  </div>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Batch Featured Toggle */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                disabled={batchBusy}
                className="flex items-center gap-1.5 rounded-lg bg-white/10 hover:bg-white/15 border border-white/10 px-2.5 py-1.5 text-[11px] font-medium text-stone-200 transition cursor-pointer disabled:opacity-50"
              >
                <Star size={13} />
                <span>Star</span>
                <CaretDown size={10} className="text-ink-muted" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="center" side="top" sideOffset={8} className="w-44">
              <DropdownMenuLabel>Featured Status</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => handleBatchFeatured(true)} className="flex items-center gap-2">
                <Star size={14} weight="fill" className="text-amber-500" />
                <span className="font-medium">Star All</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleBatchFeatured(false)} className="flex items-center gap-2">
                <Star size={14} className="text-ink-muted" />
                <span className="font-medium">Unstar All</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Batch Visibility Toggle */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                disabled={batchBusy}
                className="flex items-center gap-1.5 rounded-lg bg-white/10 hover:bg-white/15 border border-white/10 px-2.5 py-1.5 text-[11px] font-medium text-stone-200 transition cursor-pointer disabled:opacity-50"
              >
                <Eye size={13} />
                <span>Visibility</span>
                <CaretDown size={10} className="text-ink-muted" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="center" side="top" sideOffset={8} className="w-44">
              <DropdownMenuLabel>Visibility</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => handleBatchVisibility('Public')} className="flex items-center gap-2">
                <Eye size={14} className="text-emerald-500" />
                <span className="font-medium">Set Public</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleBatchVisibility('Private')} className="flex items-center gap-2">
                <EyeSlash size={14} className="text-rose-400" />
                <span className="font-medium">Set Private</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Batch Tag */}
          <DropdownMenu open={batchTagOpen} onOpenChange={setBatchTagOpen}>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                disabled={batchBusy}
                className="flex items-center gap-1.5 rounded-lg bg-white/10 hover:bg-white/15 border border-white/10 px-2.5 py-1.5 text-[11px] font-medium text-stone-200 transition cursor-pointer disabled:opacity-50"
              >
                <Tag size={13} />
                <span>Tag</span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="center" side="top" sideOffset={8} className="w-56">
              <DropdownMenuLabel>Add Tag to Selected</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <div className="px-2 py-1.5">
                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    value={batchTagInput}
                    onChange={(e) => setBatchTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        e.stopPropagation();
                        handleBatchAddTag();
                      }
                    }}
                    placeholder="Type tag name…"
                    className="flex-1 h-7 rounded-lg border border-edge-subtle bg-white px-2.5 text-xs text-ink placeholder:text-ink-muted outline-none focus:border-accent focus:ring-2 focus:ring-accent/15"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={handleBatchAddTag}
                    disabled={!batchTagInput.trim() || batchBusy}
                    className="flex h-7 items-center justify-center rounded-lg bg-accent hover:bg-accent-hover disabled:bg-stone-300 px-2.5 text-xs font-semibold text-white transition-colors disabled:cursor-not-allowed"
                  >
                    <Check size={13} weight="bold" />
                  </button>
                </div>
                <p className="mt-1 text-[10px] text-ink-muted">Press Enter to apply tag to {selectedIds.length} assets</p>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          <span className="h-4 w-px bg-ink" />

          {/* Batch Delete */}
          <button
            type="button"
            onClick={requestBatchDelete}
            disabled={batchBusy}
            className="flex items-center gap-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 px-2.5 py-1.5 text-[11px] font-semibold transition cursor-pointer shadow-xs disabled:opacity-50"
          >
            <Trash size={13} />
            <span>Delete ({selectedIds.length})</span>
          </button>

          {/* Clear Selection */}
          <button
            type="button"
            onClick={clearSelection}
            className="flex items-center justify-center h-6 w-6 rounded-lg text-ink-muted hover:text-white hover:bg-white/10 transition cursor-pointer ml-0.5"
            title="Clear selection (Esc)"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* key= remounts per asset, which is what resets the draft */}
      {focused && (
        <AssetSheet
          key={focused._id}
          media={focused}
          open={!!focused}
          saving={saving}
          onClose={() => setFocused(null)}
          onSave={save}
          onDelete={requestDelete}
        />
      )}

      {/* Upload Pre-Flight Staging Modal */}
      {stagedFiles && (
        <UploadModal
          open={!!stagedFiles && stagedFiles.length > 0}
          files={stagedFiles}
          initialTarget={uploadOwner || purpose || 'Client'}
          onClose={() => setStagedFiles(null)}
          onUpload={async (file, meta) => {
            await uploadNewMedia(file, meta);
            refresh();
          }}
          uploadProgress={uploadProgress}
        />
      )}

      {/* Studio Destructive Delete Confirmation Modal */}
      <DeleteConfirmModal
        open={!!deletingMedia || batchDeleting}
        media={deletingMedia}
        batchCount={batchDeleting ? selectedIds.length : 0}
        loading={deleteLoading}
        inUse={inUse}
        onClose={() => {
          setDeletingMedia(null);
          setBatchDeleting(false);
          setInUse(null);
        }}
        onConfirm={confirmDeleteAction}
      />
    </div>
  );
}
