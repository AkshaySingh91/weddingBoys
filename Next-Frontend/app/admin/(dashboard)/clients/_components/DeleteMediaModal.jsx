'use client';

import { useState } from 'react';
import { Trash, WarningCircle, X, Check, ShieldWarning, ArrowCounterClockwise } from '@phosphor-icons/react';
import { Dialog, DialogContent } from '@/app/admin/components/ui/Dialog.jsx';
import { Button } from '@/app/admin/components/ui/Button.jsx';
import { cn } from '@/lib/utils.js';

/**
 * World-class Studio Media Deletion Modal
 * Offers clear, unambiguous studio choices:
 *  1. Unlink from Portfolio (Removes editorial placement, keeps R2 storage intact)
 *  2. Permanently Purge from R2 (Purges master file, all derived image variants / video renditions, and DB record)
 */
export default function DeleteMediaModal({
  open,
  onClose,
  items = [], // Array of items to delete (single or multiple)
  onConfirm,
}) {
  const [mode, setMode] = useState('unlink'); // 'unlink' | 'purge'
  const [isDeleting, setIsDeleting] = useState(false);

  if (!open || !items.length) return null;

  const count = items.length;
  const isMultiple = count > 1;
  const sampleName = items[0]?.title || items[0]?.clientNameText || 'selected item';

  const handleAction = async () => {
    setIsDeleting(true);
    try {
      await onConfirm({
        ids: items.map((it) => it._id),
        purgeMedia: mode === 'purge',
      });
      onClose();
    } catch (err) {
      console.error('Delete media error:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && !isDeleting && onClose()}>
      <DialogContent
        hideCloseButton
        className="max-w-lg w-[95vw] p-0 overflow-hidden rounded-xl border border-edge-subtle bg-ground shadow-2xl"
      >
        {/* Header */}
        <header className="flex items-center justify-between border-b border-edge-subtle px-6 py-4 bg-white">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-50 border border-rose-200 text-rose-700">
              <Trash size={22} weight="bold" />
            </span>
            <div>
              <h3 className="text-base font-bold text-ink font-sans tracking-tight">
                {isMultiple ? `Delete ${count} Portfolio Items` : 'Remove Portfolio Item'}
              </h3>
              <p className="text-xs text-ink-muted font-sans">
                Choose how you want to handle these files and R2 storage
              </p>
            </div>
          </div>
          <button
            type="button"
            disabled={isDeleting}
            onClick={onClose}
            className="flex items-center justify-center h-8 w-8 rounded-xl text-ink-muted hover:text-ink-secondary hover:bg-ground-sunk transition-colors disabled:opacity-50"
          >
            <X size={16} />
            <span className="sr-only">Close</span>
          </button>
        </header>

        {/* Content Body */}
        <div className="p-6 space-y-4">
          <div className="rounded-xl border border-amber-200/80 bg-amber-50/50 p-4 text-xs text-amber-900 flex items-start gap-3">
            <WarningCircle size={20} className="text-amber-700 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-semibold">Target: {isMultiple ? `${count} items selected` : sampleName}</p>
              <p className="text-amber-800/90 leading-relaxed">
                You can remove this from the client&apos;s public presentation, or permanently purge all bytes from Cloudflare R2 storage.
              </p>
            </div>
          </div>

          {/* Deletion Mode Selector */}
          <div className="space-y-2.5 pt-1">
            <label
              onClick={() => setMode('unlink')}
              className={cn(
                'flex items-start gap-3.5 p-3.5 rounded-xl border cursor-pointer transition-all select-none',
                mode === 'unlink'
                  ? 'border-amber-600 bg-white ring-2 ring-amber-500/20 shadow-xs'
                  : 'border-edge-subtle bg-white/70 hover:border-edge-strong'
              )}
            >
              <input
                type="radio"
                name="deleteMode"
                value="unlink"
                checked={mode === 'unlink'}
                onChange={() => setMode('unlink')}
                className="mt-1 accent-amber-600"
              />
              <div className="space-y-0.5">
                <p className="text-xs font-bold text-ink">
                  Unlink from Portfolio only <span className="text-emerald-700 font-medium">(Safe)</span>
                </p>
                <p className="text-[11px] text-ink-muted leading-relaxed">
                  Removes this media from the client&apos;s wedding gallery. The master asset and variants remain stored in your Cloudflare R2 media library for other placements.
                </p>
              </div>
            </label>

            <label
              onClick={() => setMode('purge')}
              className={cn(
                'flex items-start gap-3.5 p-3.5 rounded-xl border cursor-pointer transition-all select-none',
                mode === 'purge'
                  ? 'border-rose-600 bg-rose-50/30 ring-2 ring-rose-500/20 shadow-xs'
                  : 'border-edge-subtle bg-white/70 hover:border-rose-300'
              )}
            >
              <input
                type="radio"
                name="deleteMode"
                value="purge"
                checked={mode === 'purge'}
                onChange={() => setMode('purge')}
                className="mt-1 accent-rose-600"
              />
              <div className="space-y-0.5">
                <p className="text-xs font-bold text-rose-950 flex items-center gap-1.5">
                  <ShieldWarning size={14} className="text-rose-600" />
                  Permanently Purge from Cloudflare R2 <span className="text-rose-600 font-semibold">(Irreversible)</span>
                </p>
                <p className="text-[11px] text-rose-900/80 leading-relaxed">
                  Immediately deletes the master file, all derived image variants (640w, 1024w, 1600w, 2400w), video renditions, and poster frames from Cloudflare R2 bucket. Frees storage.
                </p>
              </div>
            </label>
          </div>
        </div>

        {/* Footer */}
        <footer className="flex items-center justify-between border-t border-edge-subtle bg-white px-6 py-4">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isDeleting}
            onClick={onClose}
            className="border-edge-subtle text-ink-secondary hover:bg-ground"
          >
            Cancel
          </Button>

          <Button
            type="button"
            variant={mode === 'purge' ? 'danger' : 'gold'}
            size="sm"
            loading={isDeleting}
            onClick={handleAction}
            className={cn(
              'font-semibold shadow-xs',
              mode === 'purge'
                ? 'bg-rose-600 hover:bg-rose-700 text-white'
                : 'bg-ink hover:bg-ink text-white'
            )}
          >
            {mode === 'purge'
              ? `Purge ${count} Item${isMultiple ? 's' : ''} from R2`
              : `Unlink ${count} Item${isMultiple ? 's' : ''}`}
          </Button>
        </footer>
      </DialogContent>
    </Dialog>
  );
}
