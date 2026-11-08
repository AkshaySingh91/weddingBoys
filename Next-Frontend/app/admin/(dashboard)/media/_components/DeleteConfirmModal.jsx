'use client';

import Image from 'next/image';
import {
  WarningCircle, Trash, X, FilmSlate, ImageSquare,
} from '@phosphor-icons/react';
import { Dialog, DialogContent } from '@/app/admin/components/ui/Dialog.jsx';
import { Button } from '@/app/admin/components/ui/Button.jsx';
import { formatBytes } from '@/Utils/format.js';
import { urlOf } from './AssetSheet.jsx';

/**
 * World-Class Studio Destructive Confirmation Modal
 *
 * Eliminates archaic browser `window.confirm` popups.
 * Provides transparent disclosure of exact storage impact:
 * master asset + all generated CDN derivatives permanently purged from R2.
 */
export default function DeleteConfirmModal({
  open,
  onClose,
  onConfirm,
  media,
  batchCount = 0,
  loading = false,
  inUse = null,
}) {
  const live = (inUse || []).filter((p) => p.live).length;
  const isBatch = batchCount > 1 || (!media && batchCount > 0);
  const url = media ? urlOf(media) : '';
  const derivativeCount = media?.imageVariants?.length || media?.video?.renditions?.length || 0;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && !loading && onClose()}>
      <DialogContent
        hideCloseButton
        className="max-w-md w-[92vw] p-0 overflow-hidden scrollbar-none rounded-xl border border-edge-subtle bg-white shadow-2xl"
      >
        <div className="p-5 sm:p-6 space-y-4">
          {/* Header with Danger Badge & Close */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <span className="flex items-center justify-center h-10 w-10 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 shrink-0">
                <WarningCircle size={22} weight="fill" />
              </span>
              <div>
                <h3 className="text-sm sm:text-base font-bold text-ink font-sans tracking-tight">
                  {isBatch ? `Permanently Delete ${batchCount} Assets?` : 'Permanently Delete Asset?'}
                </h3>
                <p className="text-xs text-ink-muted font-sans">
                  Irreversible action · Cloudflare R2 Storage Purge
                </p>
              </div>
            </div>

            <button
              type="button"
              disabled={loading}
              onClick={onClose}
              className="flex items-center justify-center h-8 w-8 rounded-lg text-ink-muted hover:text-ink-secondary hover:bg-ground-sunk transition-colors disabled:opacity-50"
            >
              <X size={16} />
              <span className="sr-only">Close</span>
            </button>
          </div>

          {/* Single Asset Context Card */}
          {!isBatch && media && (
            <div className="flex items-center gap-3 rounded-xl border border-edge-subtle bg-ground/70 p-3">
              <div className="relative h-14 w-14 rounded-lg overflow-hidden bg-ground-sunk shrink-0 border border-edge-subtle">
                {media.mediaType === 'Image' && url ? (
                  <Image
                    src={url}
                    alt={media.title || 'asset'}
                    fill
                    className="object-cover"
                  />
                ) : media.mediaType === 'Video' && media.video?.posterUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={media.video.posterUrl}
                    alt="video poster"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-ink-muted">
                    {media.mediaType === 'Video' ? <FilmSlate size={20} /> : <ImageSquare size={20} />}
                  </div>
                )}
              </div>

              <div className="min-w-0 flex-1 space-y-1">
                <p className="font-mono text-xs font-semibold text-ink truncate">
                  {media.originalFileName || media.title || 'Untitled Asset'}
                </p>
                <div className="flex flex-wrap items-center gap-2 text-[11px] text-ink-muted">
                  <span className="tabular-nums font-medium">{formatBytes(media.fileSize)}</span>
                  <span>·</span>
                  <span>{media.mediaType || 'Media'}</span>
                  {derivativeCount > 0 && (
                    <>
                      <span>·</span>
                      <span className="text-amber-700 font-medium">+{derivativeCount} derivatives</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Batch Context Card */}
          {isBatch && (
            <div className="rounded-xl border border-amber-200 bg-amber-50/80 p-3.5 text-xs text-amber-900 space-y-1">
              <p className="font-semibold text-amber-800">
                {batchCount} assets selected for permanent deletion
              </p>
              <p className="text-[11px] leading-relaxed text-amber-700">
                Every selected master asset and its generated web renditions will be purged simultaneously from Cloudflare R2 pipeline storage.
              </p>
            </div>
          )}

          {/* In use by the portfolio: the server refused the first attempt. */}
          {inUse?.length > 0 && (
            <div className="rounded-xl border border-rose-300 bg-rose-50 p-3 text-xs text-rose-950 space-y-2">
              <p className="font-semibold">
                Used by {inUse.length} portfolio item{inUse.length === 1 ? '' : 's'}
                {live > 0 ? `, ${live} live on the site` : ''}. Deleting takes {inUse.length === 1 ? 'it' : 'them'} off the site.
              </p>
              <ul className="space-y-0.5 text-[11px] text-rose-900">
                {inUse.slice(0, 6).map((p) => (
                  <li key={`${p.itemId}-${p.usedAs}`}>
                    {p.wedding} · {p.kind === 'Video' ? 'film' : 'photo'}{p.usedAs === 'poster' ? ' poster' : ''}{p.live ? ' · live' : ''}
                  </li>
                ))}
                {inUse.length > 6 && <li>…and {inUse.length - 6} more</li>}
              </ul>
            </div>
          )}

          {/* Consequence Disclosure */}
          <div className="rounded-xl border border-rose-100 bg-rose-50/40 p-3 text-xs text-ink-secondary leading-relaxed font-sans">
            <p className="text-[11px] text-rose-950 font-medium">
              {!isBatch
                ? 'This action immediately removes the raw master file and every generated responsive web derivative from Cloudflare R2. Any site page referencing this asset will show a missing media state.'
                : 'All selected files will be permanently erased. Public galleries or stories referencing these IDs will no longer load their visuals.'}
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="px-5 sm:px-6 py-3.5 border-t border-edge-subtle bg-ground/80 flex items-center justify-end gap-2.5">
          <Button
            variant="secondary"
            size="sm"
            disabled={loading}
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            variant="danger"
            size="sm"
            icon={Trash}
            loading={loading}
            onClick={onConfirm}
            className="font-semibold shadow-xs"
          >
            {inUse?.length
              ? 'Delete and take off the site'
              : isBatch ? `Delete ${batchCount} Assets Permanently` : 'Delete Permanently'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
