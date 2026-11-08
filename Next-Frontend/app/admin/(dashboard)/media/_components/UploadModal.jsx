'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import Image from 'next/image';
import {
  UploadSimple, X, FilmSlate, ImageSquare, FileText, Check, CircleNotch,
  Sparkle, WarningCircle, Tag as TagIcon, Buildings, Article, Users,
  ChatCircleDots, Star, Question, HardDrives
} from '@phosphor-icons/react';
import { Dialog, DialogContent } from '@/app/admin/components/ui/Dialog.jsx';
import { Button } from '@/app/admin/components/ui/Button.jsx';
import { Badge } from '@/app/admin/components/ui/Badge.jsx';
import { formatBytes } from '@/Utils/format.js';
import { cn } from '@/lib/utils.js';

const TARGET_COLLECTIONS = [
  { key: 'Client', label: 'Client Work', hint: 'Films & photos from client weddings' },
  { key: 'Website', label: 'Website & CMS', hint: 'Hero reels, page media & carousels' },
  { key: 'Blog', label: 'Blog Stories', hint: 'Editorial article imagery' },
  { key: 'Team', label: 'Team', hint: 'Staff portraits and profiles' },
  { key: 'Review', label: 'Reviews', hint: 'Client review media' },
  { key: 'Brand', label: 'Brand Identity', hint: 'Logos, seals & watermarks' },
  { key: 'System', label: 'Unassigned Backlog', hint: 'Unlinked assets pool' },
];

/**
 * World-Class Studio Upload Pre-Flight & Staging Modal
 *
 * Eliminates blind auto-uploads. Gives admins full visibility:
 * 1. Visual thumbnail inspection of all staged assets.
 * 2. Target collection selection before sending bytes.
 * 3. Initial title, alt text, and studio tag assignment.
 * 4. Ability to drop accidental files before committing to R2.
 * 5. Real-time per-file upload and Sharp/R2 optimization telemetry.
 */
export default function UploadModal({
  open,
  files = [],
  initialTarget = 'Client',
  onClose,
  onUpload,
  uploadProgress = {},
}) {
  const [stagedList, setStagedList] = useState([]);
  const [targetCollection, setTargetCollection] = useState(initialTarget || 'Client');
  const [customTitle, setCustomTitle] = useState('');
  const [altText, setAltText] = useState('');
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadIndex, setUploadIndex] = useState(0);
  const [completedCount, setCompletedCount] = useState(0);
  const [isSuccess, setIsSuccess] = useState(false);

  // Initialize staged files with local object URLs for instant previews
  useEffect(() => {
    if (!files || !files.length) {
      setStagedList([]);
      return;
    }

    const items = Array.from(files).map((file, idx) => {
      const isImg = file.type.startsWith('image/');
      const isVid = file.type.startsWith('video/');
      const previewUrl = isImg ? URL.createObjectURL(file) : null;
      return {
        id: `${file.name}-${file.size}-${idx}`,
        file,
        name: file.name,
        size: file.size,
        type: file.type,
        isImg,
        isVid,
        previewUrl,
      };
    });

    setStagedList(items);
    setTargetCollection(initialTarget || 'Client');
    setCustomTitle('');
    setAltText('');
    setTags([]);
    setUploading(false);
    setUploadIndex(0);
    setCompletedCount(0);
    setIsSuccess(false);

    // Clean up memory on unmount or file reset
    return () => {
      items.forEach((item) => {
        if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
      });
    };
  }, [files, initialTarget]);

  // Handle accidental file removal
  const handleRemoveStaged = (idToRemove) => {
    setStagedList((prev) => {
      const target = prev.find((item) => item.id === idToRemove);
      if (target?.previewUrl) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((item) => item.id !== idToRemove);
    });
  };

  const handleAddTag = () => {
    const clean = tagInput.trim().replace(/^#/, '');
    if (!clean) return;
    if (!tags.includes(clean)) {
      setTags([...tags, clean]);
    }
    setTagInput('');
  };

  const handleRemoveTag = (tagToRemove) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const totalBytes = useMemo(
    () => stagedList.reduce((acc, item) => acc + item.size, 0),
    [stagedList]
  );

  const handleStartUpload = async () => {
    if (!stagedList.length || uploading) return;
    setUploading(true);
    setCompletedCount(0);

    try {
      for (let i = 0; i < stagedList.length; i++) {
        setUploadIndex(i + 1);
        const item = stagedList[i];
        await onUpload(item.file, {
          ownerType: targetCollection,
          title: stagedList.length === 1 && customTitle ? customTitle : item.name.replace(/\.[^/.]+$/, ''),
          altText: stagedList.length === 1 && altText ? altText : '',
          tags,
        });
        setCompletedCount((prev) => prev + 1);
      }
      setIsSuccess(true);
      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (err) {
      setUploading(false);
    }
  };

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && !uploading && onClose()}>
      <DialogContent
        hideCloseButton
        className="max-w-2xl w-[94vw] p-0 overflow-hidden scrollbar-none rounded-xl border border-edge-subtle bg-white shadow-2xl flex flex-col"
      >
        {/* Header with Telemetry & Close */}
        <div className="px-5 py-4 border-b border-edge-subtle bg-ground/80 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="flex items-center justify-center h-9 w-9 rounded-xl bg-accent-wash text-accent-ink border border-accent/25 shrink-0">
              <UploadSimple size={18} weight="bold" />
            </span>
            <div className="min-w-0">
              <h3 className="text-sm sm:text-base font-bold text-ink font-sans tracking-tight truncate">
                {uploading
                  ? `Uploading Assets (${uploadIndex}/${stagedList.length})`
                  : `Upload Pre-Flight (${stagedList.length} ${stagedList.length === 1 ? 'Asset' : 'Assets'})`}
              </h3>
              <p className="text-xs text-ink-muted font-sans truncate">
                {formatBytes(totalBytes)} total payload · Cloudflare R2 pipeline ingestion
              </p>
            </div>
          </div>

          {!uploading && (
            <button
              type="button"
              onClick={onClose}
              className="flex items-center justify-center h-8 w-8 rounded-lg text-ink-muted hover:text-ink-secondary hover:bg-ground-sunk/60 transition-colors"
            >
              <X size={16} />
              <span className="sr-only">Close</span>
            </button>
          )}
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4 max-h-[65vh] overflow-y-auto scrollbar-thin scrollbar-thumb-stone-200 scrollbar-track-transparent">
          {/* Staged Files Preview Grid / List */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-ink-muted">
              <span>Staged Assets Queue</span>
              <span className="text-[11px] font-normal text-ink-muted">
                {stagedList.length} files selected
              </span>
            </div>

            <div className="divide-y divide-edge-subtle rounded-xl border border-edge-subtle bg-ground/50 max-h-[220px] overflow-y-auto scrollbar-thin scrollbar-thumb-stone-200 scrollbar-track-transparent">
              {stagedList.map((item) => {
                const progKey = `${item.file.name}-${item.file.size}`;
                const pct = uploadProgress[progKey];
                return (
                  <div key={item.id} className="flex items-center gap-3 p-2.5 transition-colors hover:bg-white">
                    {/* Thumbnail */}
                    <div className="relative h-12 w-12 rounded-lg overflow-hidden bg-ground-sunk shrink-0 border border-edge-subtle">
                      {item.previewUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={item.previewUrl}
                          alt={item.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-ink-muted">
                          {item.isVid ? <FilmSlate size={20} /> : <FileText size={20} />}
                        </div>
                      )}
                    </div>

                    {/* Metadata */}
                    <div className="min-w-0 flex-1 space-y-1">
                      <p className="font-mono text-xs font-medium text-ink truncate" title={item.name}>
                        {item.name}
                      </p>
                      <div className="flex items-center gap-2 text-[10px] text-ink-muted font-mono">
                        <span className="tabular-nums font-semibold text-ink-secondary">{formatBytes(item.size)}</span>
                        <span>·</span>
                        <span className="uppercase text-ink-muted">{item.type.split('/')[1] || 'media'}</span>
                      </div>

                      {/* In-Flight Progress Bar */}
                      {uploading && pct !== undefined && (
                        <div className="mt-1 space-y-0.5">
                          <div className="flex justify-between text-[9px] text-ink-muted font-mono">
                            <span>{pct < 0 ? 'Optimizing variants…' : `${pct}%`}</span>
                          </div>
                          <div className="h-1 w-full overflow-hidden rounded-full bg-ground-sunk">
                            <div
                              className={cn(
                                'h-full transition-all duration-200',
                                pct < 0 ? 'w-full animate-pulse bg-red-400' : 'bg-accent'
                              )}
                              style={pct >= 0 ? { width: `${pct}%` } : undefined}
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Remove File Button (Disabled during upload) */}
                    {!uploading && (
                      <button
                        type="button"
                        onClick={() => handleRemoveStaged(item.id)}
                        className="flex items-center justify-center h-7 w-7 rounded-lg text-ink-muted hover:text-rose-600 hover:bg-rose-50 transition-colors"
                        title="Remove file from upload queue"
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Pre-Flight Metadata Configuration Controls (Hidden during uploading) */}
          {!uploading && (
            <div className="space-y-3 pt-2 border-t border-edge-subtle">
              {/* Target Collection Selector */}
              <div>
                <label className="mb-1 flex items-center justify-between text-[11px] font-semibold uppercase tracking-wider text-ink-secondary">
                  <span>Target Collection</span>
                  <span className="text-[10px] font-normal text-ink-muted">Where these assets belong</span>
                </label>
                <select
                  value={targetCollection}
                  onChange={(e) => setTargetCollection(e.target.value)}
                  className="w-full h-9 rounded-xl border border-edge-subtle bg-white px-3 text-xs font-medium text-ink outline-none focus:border-accent focus:ring-2 focus:ring-accent/15 cursor-pointer shadow-xs"
                >
                  {TARGET_COLLECTIONS.map((c) => (
                    <option key={c.key} value={c.key}>
                      {c.label} ({c.hint})
                    </option>
                  ))}
                </select>
              </div>

              {/* Single File Specific Controls */}
              {stagedList.length === 1 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 flex items-center justify-between text-[11px] font-semibold uppercase tracking-wider text-ink-secondary">
                      <span>Custom Title</span>
                      <span className="text-[10px] font-normal text-ink-muted">Optional</span>
                    </label>
                    <input
                      value={customTitle}
                      onChange={(e) => setCustomTitle(e.target.value)}
                      placeholder="e.g. Aditya & Janvi Haldi Ceremony"
                      className="w-full h-9 rounded-xl border border-edge-subtle bg-white px-3 text-xs text-ink placeholder:text-ink-muted outline-none focus:border-accent focus:ring-2 focus:ring-accent/15"
                    />
                  </div>
                  <div>
                    <label className="mb-1 flex items-center justify-between text-[11px] font-semibold uppercase tracking-wider text-ink-secondary">
                      <span>Alt Text</span>
                      <span className="text-[10px] font-normal text-ink-muted">SEO & Accessibility</span>
                    </label>
                    <input
                      value={altText}
                      onChange={(e) => setAltText(e.target.value)}
                      placeholder="e.g. Bride wearing yellow saree smiling"
                      className="w-full h-9 rounded-xl border border-edge-subtle bg-white px-3 text-xs text-ink placeholder:text-ink-muted outline-none focus:border-accent focus:ring-2 focus:ring-accent/15"
                    />
                  </div>
                </div>
              )}

              {/* Studio Tags Manager */}
              <div>
                <label className="mb-1 flex items-center justify-between text-[11px] font-semibold uppercase tracking-wider text-ink-secondary">
                  <span>Batch Studio Tags</span>
                  <span className="text-[10px] font-normal text-ink-muted">Press Enter or comma</span>
                </label>
                <div className="rounded-xl border border-edge-subtle bg-white p-1.5 focus-within:border-accent focus-within:ring-2 focus-within:ring-accent/15">
                  <div className="flex flex-wrap items-center gap-1.5">
                    {tags.map((t) => (
                      <span
                        key={t}
                        className="inline-flex items-center gap-1 rounded-lg bg-ground-sunk border border-edge-subtle px-2 py-0.5 text-xs text-ink font-medium"
                      >
                        <span>#{t}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveTag(t)}
                          className="text-ink-muted hover:text-accent-ink rounded-lg p-0.5"
                        >
                          <X size={10} weight="bold" />
                        </button>
                      </span>
                    ))}
                    <input
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ',') {
                          e.preventDefault();
                          handleAddTag();
                        }
                      }}
                      onBlur={handleAddTag}
                      placeholder={tags.length === 0 ? 'Type tag and press Enter (e.g. Haldi, Udaipur)...' : 'Add tag...'}
                      className="flex-1 min-w-[120px] bg-transparent px-1 py-0.5 text-xs text-ink placeholder:text-ink-muted outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Success State Notification */}
          {isSuccess && (
            <div className="flex items-center gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-900 animate-in fade-in">
              <Check size={16} weight="bold" className="text-emerald-600 shrink-0" />
              <p className="font-semibold">
                All {stagedList.length} assets successfully uploaded, processed, and added to the library!
              </p>
            </div>
          )}
        </div>

        {/* Footer Controls */}
        <div className="px-5 py-3.5 border-t border-edge-subtle bg-ground/80 flex items-center justify-between gap-3 shrink-0">
          <Button
            variant="secondary"
            size="sm"
            disabled={uploading}
            onClick={onClose}
          >
            Cancel
          </Button>

          <Button
            variant="primary"
            size="sm"
            disabled={stagedList.length === 0 || uploading}
            loading={uploading}
            icon={uploading ? CircleNotch : UploadSimple}
            onClick={handleStartUpload}
            className="font-semibold shadow-xs"
          >
            {uploading
              ? `Uploading (${completedCount}/${stagedList.length})`
              : `Confirm & Upload (${stagedList.length} ${stagedList.length === 1 ? 'Asset' : 'Assets'})`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
