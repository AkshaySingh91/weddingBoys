'use client';

import {
  WarningCircle, Trash, X, FilmSlate, ImageSquare, ShieldCheck,
} from '@phosphor-icons/react';
import { Dialog, DialogContent } from '@/app/admin/components/ui/Dialog.jsx';
import { Button } from '@/app/admin/components/ui/Button.jsx';
import { cn } from '@/lib/utils.js';

/**
 * Studio Client Deletion Confirmation Modal
 *
 * Eliminates archaic `window.confirm` dialogs across the client archive.
 * Clearly discloses:
 * 1. Live site impact: films & photographs will be pulled from public showcase.
 * 2. Asset preservation: raw files are NOT deleted from cloud storage;
 *    they safely return to the Unassigned Media Library backlog.
 * 3. Supports force-delete confirmation if live published placements exist.
 */
export default function DeleteClientModal({
  open,
  onClose,
  onConfirm,
  client,
  loading = false,
  isDraft = false,
}) {
  const bride = client?.clientName?.Bride || '';
  const groom = client?.clientName?.Groom || '';
  const clientName = [bride, groom].filter(Boolean).join(' & ') || 'Untitled Wedding';

  const stats = client?.stats || {};
  const videoCount = stats.videos || client?.videos?.length || 0;
  const photoCount = stats.photos || client?.photos?.length || 0;
  const publishedCount = stats.total || (videoCount + photoCount);

  return (
    <Dialog open={open} onOpenChange={(v) => !v && !loading && onClose()}>
      <DialogContent
        hideCloseButton
        className="max-w-md w-[92vw] p-0 overflow-hidden scrollbar-none rounded-2xl border border-[#E8DDD1] bg-[#FFFCF8] shadow-2xl"
      >
        <div className="p-5 sm:p-6 space-y-4">
          {/* Header */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <span className="flex items-center justify-center h-10 w-10 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 shrink-0">
                <WarningCircle size={22} weight="fill" />
              </span>
              <div>
                <h3 className="text-sm sm:text-base font-bold text-stone-900 font-sans tracking-tight">
                  {isDraft ? 'Discard Wedding Draft?' : `Delete ${clientName}?`}
                </h3>
                <p className="text-xs text-stone-500 font-sans">
                  {isDraft ? 'Cancel client creation and discard intake' : 'Client archive removal & unpublish'}
                </p>
              </div>
            </div>

            <button
              type="button"
              disabled={loading}
              onClick={onClose}
              className="flex items-center justify-center h-8 w-8 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors disabled:opacity-50"
            >
              <X size={16} />
              <span className="sr-only">Close</span>
            </button>
          </div>

          {/* Client Overview Card */}
          <div className="rounded-xl border border-[#E8DDD1]/80 bg-white p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-stone-900 font-serif tracking-wide">
                {clientName}
              </span>
              <span className="text-[10px] font-medium text-stone-500 uppercase tracking-wider">
                {isDraft ? 'Draft Intake' : 'Client Archive'}
              </span>
            </div>

            {!isDraft && (
              <div className="flex items-center gap-3 pt-1 text-[11px] text-stone-600">
                <span className="flex items-center gap-1">
                  <FilmSlate size={12} className="text-stone-400" />
                  <span className="font-semibold text-stone-800">{videoCount}</span> films
                </span>
                <span className="text-stone-300">·</span>
                <span className="flex items-center gap-1">
                  <ImageSquare size={12} className="text-stone-400" />
                  <span className="font-semibold text-stone-800">{photoCount}</span> photos
                </span>
              </div>
            )}
          </div>

          {/* Impact Warning Notice */}
          <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-3 text-xs text-amber-950 space-y-1.5">
            <p className="font-semibold text-amber-900 flex items-center gap-1.5">
              <WarningCircle size={14} weight="bold" className="text-amber-600 shrink-0" />
              {isDraft
                ? 'Discarding removes this record'
                : 'Live Showcase Impact'}
            </p>
            <p className="text-[11px] leading-relaxed text-amber-900/90">
              {isDraft
                ? 'The empty client record created during this intake session will be deleted from your database.'
                : 'Their films and photographs will be removed from the public website showcase. Any map coordinates will also be cleared.'}
            </p>
          </div>

          {/* Asset Preservation Note */}
          {!isDraft && (
            <div className="rounded-xl border border-emerald-200/80 bg-emerald-50/60 p-3 text-[11px] text-emerald-950 flex items-start gap-2">
              <ShieldCheck size={16} weight="fill" className="text-emerald-600 shrink-0 mt-0.5" />
              <p className="leading-relaxed text-emerald-900/90">
                <span className="font-semibold text-emerald-950">Zero file data loss:</span> Raw master media files are NOT deleted from cloud storage. They will be safely returned to the <span className="font-medium text-emerald-950">Unassigned Backlog</span> in your Media Library.
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={loading}
              onClick={onClose}
              className="border-[#E8DDD1] text-stone-700 hover:bg-stone-50"
            >
              Keep {isDraft ? 'Draft' : 'Wedding'}
            </Button>
            <Button
              type="button"
              variant="danger"
              size="sm"
              loading={loading}
              icon={Trash}
              onClick={onConfirm}
              className="bg-rose-600 hover:bg-rose-700 text-white font-medium shadow-xs"
            >
              {isDraft ? 'Discard Draft' : 'Delete Wedding Archive'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
