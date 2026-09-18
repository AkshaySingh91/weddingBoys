'use client';

import { useState } from 'react';
import Image from 'next/image';
import {
  Check, Star, LinkSimple, Eye, FilmSlate,
  FileText, Sparkle, ImageSquare
} from '@phosphor-icons/react';
import { Badge } from '@/app/admin/components/ui/Badge.jsx';
import { formatBytes, formatDuration } from '@/Utils/format.js';
import { urlOf, STATUS_TONE } from './AssetSheet.jsx';
import { fireMessage } from '@/Utils/fireMessage.js';
import { cn } from '@/lib/utils.js';

/**
 * World-Class Studio Media Grid Card
 *
 * Professional digital asset management card with:
 * 1. Immediate visual thumbnail with error resilience.
 * 2. Multi-selection checkbox with smooth hover trigger.
 * 3. Quick action overlay (Copy CDN URL, Toggle Star, Inspect).
 * 4. Technical derivative and duration badges.
 * 5. Clean metadata footer with file size and unassigned indicators.
 */
export default function MediaGridCard({
  media,
  selected = false,
  onSelect,
  onInspect,
  onToggleFeatured,
}) {
  const [copied, setCopied] = useState(false);
  const [thumbError, setThumbError] = useState(false);

  const url = urlOf(media);
  const isVideo = media.mediaType === 'Video';
  const isImage = media.mediaType === 'Image';
  const derivativeCount = media.imageVariants?.length || media.video?.renditions?.length || 0;
  const extension = media.mimeType ? media.mimeType.split('/')[1]?.toUpperCase() : media.mediaType || 'FILE';

  const handleCopyUrl = (e) => {
    e.stopPropagation();
    if (!url) {
      fireMessage('No CDN URL available', 'error');
      return;
    }
    navigator.clipboard.writeText(url);
    setCopied(true);
    fireMessage('CDN URL copied to clipboard', 'success');
    setTimeout(() => setCopied(false), 1500);
  };

  const handleFeaturedClick = (e) => {
    e.stopPropagation();
    if (onToggleFeatured) {
      onToggleFeatured(media);
    }
  };

  return (
    <div
      onClick={() => onInspect && onInspect(media)}
      className={cn(
        'group relative flex flex-col overflow-hidden rounded-2xl border bg-white text-left transition-all duration-200 cursor-pointer select-none',
        selected
          ? 'border-red-500 ring-2 ring-red-500/30 shadow-md'
          : 'border-stone-200/90 hover:border-stone-300 hover:shadow-md hover:-translate-y-0.5'
      )}
    >
      {/* Top-Left: Selection Checkbox */}
      <button
        type="button"
        aria-label="Select asset"
        onClick={(e) => {
          e.stopPropagation();
          onSelect && onSelect(media._id);
        }}
        className={cn(
          'absolute left-2.5 top-2.5 z-20 flex h-6 w-6 items-center justify-center rounded-lg transition-all cursor-pointer shadow-xs',
          selected
            ? 'bg-red-500 text-white opacity-100 scale-100'
            : 'bg-stone-900/60 text-white/80 hover:bg-stone-900 hover:text-white backdrop-blur-md opacity-0 group-hover:opacity-100 scale-95 group-hover:scale-100'
        )}
      >
        <Check size={13} weight="bold" />
      </button>

      {/* Top-Right: Floating Micro-Action Bar on Hover */}
      <div
        className={cn(
          'absolute right-2.5 top-2.5 z-20 flex items-center gap-1 rounded-xl bg-stone-950/80 p-1 text-white backdrop-blur-md transition-all duration-200 shadow-lg border border-white/10',
          copied || media.featured
            ? 'opacity-100'
            : 'opacity-0 group-hover:opacity-100 translate-y-1 group-hover:translate-y-0'
        )}
      >
        {/* Copy CDN URL */}
        <button
          type="button"
          onClick={handleCopyUrl}
          title="Copy CDN URL"
          className={cn(
            'flex h-6 w-6 items-center justify-center rounded-lg text-stone-300 hover:text-white hover:bg-white/15 transition-colors cursor-pointer',
            copied && 'text-emerald-400'
          )}
        >
          {copied ? <Check size={13} weight="bold" /> : <LinkSimple size={13} />}
        </button>

        {/* Toggle Featured Star */}
        <button
          type="button"
          onClick={handleFeaturedClick}
          title={media.featured ? 'Featured on studio pages' : 'Mark as Featured'}
          className={cn(
            'flex h-6 w-6 items-center justify-center rounded-lg transition-colors cursor-pointer',
            media.featured
              ? 'text-amber-400 hover:text-amber-300'
              : 'text-stone-300 hover:text-white hover:bg-white/15'
          )}
        >
          <Star size={13} weight={media.featured ? 'fill' : 'regular'} />
        </button>

        {/* Quick Inspect Details */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onInspect && onInspect(media);
          }}
          title="Inspect Asset Details"
          className="flex h-6 w-6 items-center justify-center rounded-lg text-stone-300 hover:text-white hover:bg-white/15 transition-colors cursor-pointer"
        >
          <Eye size={13} />
        </button>
      </div>

      {/* Thumbnail Surface */}
      <div className="relative block aspect-[4/3] w-full overflow-hidden bg-stone-100">
        {isImage && url && !thumbError ? (
          <Image
            src={url}
            alt={media.altText || media.title || 'media'}
            fill
            sizes="(max-width: 768px) 50vw, (max-width: 1280px) 33vw, 320px"
            className="object-cover transition-transform duration-300 group-hover:scale-103"
            onError={() => setThumbError(true)}
            {...(media.blurDataURL ? { placeholder: 'blur', blurDataURL: media.blurDataURL } : {})}
          />
        ) : isVideo && media.video?.posterUrl && !thumbError ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={media.video.posterUrl}
              alt={media.title || 'video'}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-103"
              onError={() => setThumbError(true)}
            />
            <span className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/10 transition-colors">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm shadow-md">
                <FilmSlate size={20} />
              </span>
            </span>
          </>
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center bg-stone-100 text-stone-400 gap-1.5 p-3 select-none">
            {isVideo ? (
              <FilmSlate size={26} />
            ) : media.mediaType === 'Document' ? (
              <FileText size={26} />
            ) : media.mediaType === 'Animation' ? (
              <Sparkle size={26} />
            ) : (
              <ImageSquare size={26} />
            )}
            <span className="text-[10px] font-mono uppercase tracking-wider text-stone-400">
              {extension}
            </span>
          </div>
        )}

        {/* Non-Ready Status Badge */}
        {media.status && media.status !== 'Ready' && (
          <span className="absolute left-2.5 bottom-2.5 z-10">
            <Badge size="sm" variant={STATUS_TONE[media.status] || 'neutral'}>
              {media.status}
            </Badge>
          </span>
        )}

        {/* Derivative Count Pill (for Ready images) */}
        {isImage && derivativeCount > 0 && (
          <span className="absolute left-2.5 bottom-2.5 z-10 hidden sm:inline-flex items-center rounded-md bg-black/60 px-1.5 py-0.5 text-[9px] font-mono text-white/90 backdrop-blur-xs">
            +{derivativeCount} web
          </span>
        )}

        {/* Video Duration Pill */}
        {isVideo && media.duration ? (
          <span className="absolute bottom-2.5 right-2.5 z-10 flex items-center gap-1 rounded-md bg-black/70 px-1.5 py-0.5 text-[10px] font-mono font-medium text-white backdrop-blur-xs">
            <FilmSlate size={11} />
            <span>{formatDuration(media.duration)}</span>
          </span>
        ) : null}
      </div>

      {/* Card Metadata Footer */}
      <div className="flex flex-1 flex-col justify-between p-3 space-y-1.5">
        <p
          className="text-xs font-semibold text-stone-900 truncate font-sans"
          title={media.title || media.originalFileName || media.mediaId}
        >
          {media.title || media.originalFileName || 'Untitled Asset'}
        </p>

        <div className="flex items-center justify-between text-[11px] text-stone-500 font-mono">
          <span className="tabular-nums font-medium text-stone-600">
            {formatBytes(media.fileSize)}
          </span>

          <div className="flex items-center gap-1.5">
            {media.ownerType === 'System' && (
              <span className="inline-flex items-center rounded bg-amber-50 border border-amber-200/80 px-1.5 py-0.2 text-[9px] font-semibold uppercase tracking-wider text-amber-700">
                unassigned
              </span>
            )}
            <span className="text-[10px] uppercase text-stone-400">
              {extension}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
