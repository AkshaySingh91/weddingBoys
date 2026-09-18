/**
 * VideoBlock — renders video embeds with click-to-load facade for performance.
 * Supports: Cloudflare Stream, YouTube, Vimeo, MP4.
 */
'use client';

import { useState } from 'react';
import { Play } from '@phosphor-icons/react';

function getYouTubeThumbnail(id) {
  return `https://img.youtube.com/vi/${id}/hqdefault.jpg`;
}

function getVimeoEmbedUrl(id) {
  return `https://player.vimeo.com/video/${id}?autoplay=1`;
}

export default function VideoBlock({ node }) {
  // The node (extensions/WeddingVideoEmbed) stores `streamUid` and `poster`;
  // this block read `videoId` and `thumbnail`, so a Cloudflare Stream id and its
  // poster frame never arrived — the facade rendered with no still image. Both
  // names are accepted so older content keeps working.
  const a = node.attrs || {};
  const { src, provider, caption, aspectRatio } = a;
  const videoId = a.videoId || a.streamUid || null;
  const thumbnail = a.thumbnail || a.poster || null;
  const [loaded, setLoaded] = useState(false);

  const resolvedProvider = provider || (
    src?.includes('youtube') ? 'youtube' :
    src?.includes('vimeo') ? 'vimeo' :
    src?.includes('cloudflarestream') || src?.includes('videodelivery') ? 'stream' :
    'mp4'
  );

  const resolvedId = videoId || (
    resolvedProvider === 'youtube' ? src?.match(/(?:v=|youtu\.be\/|embed\/)([^&?/]+)/)?.[1] :
    resolvedProvider === 'vimeo' ? src?.match(/vimeo\.com\/(?:video\/)?(\d+)/)?.[1] :
    null
  );

  const thumbUrl = thumbnail || (
    resolvedProvider === 'youtube' && resolvedId ? getYouTubeThumbnail(resolvedId) : null
  );

  const embedUrl = (
    resolvedProvider === 'youtube' ? `https://www.youtube.com/embed/${resolvedId}?autoplay=1&rel=0` :
    resolvedProvider === 'vimeo' ? getVimeoEmbedUrl(resolvedId) :
    resolvedProvider === 'stream' ? src :
    src
  );

  const ratio = aspectRatio || '16/9';

  return (
    <figure className="">
      <div
        className="relative overflow-hidden rounded-2xl bg-studio-obsidian"
        style={{ aspectRatio: ratio }}
      >
        {!loaded ? (
          // Click-to-load facade — lightweight thumbnail + play button
          <button
            onClick={() => setLoaded(true)}
            className="group absolute inset-0 flex cursor-pointer items-center justify-center"
            aria-label="Play video"
          >
            {thumbUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={thumbUrl}
                alt={caption || 'Video thumbnail'}
                className="absolute inset-0 h-full w-full object-cover opacity-80 transition-opacity group-hover:opacity-100"
                loading="lazy"
              />
            )}
            <div className="relative z-10 flex h-16 w-16 items-center justify-center rounded-full bg-white/90 shadow-lg transition-transform group-hover:scale-110">
              <Play size={28} weight="fill" className="ml-1 text-studio-ink" />
            </div>
          </button>
        ) : resolvedProvider === 'mp4' ? (
          <video
            src={src}
            controls
            autoPlay
            className="h-full w-full object-cover"
          />
        ) : (
          <iframe
            src={embedUrl}
            allow="autoplay; fullscreen; picture-in-picture; encrypted-media"
            allowFullScreen
            className="absolute inset-0 h-full w-full border-0"
            loading="lazy"
            title={caption || 'Embedded video'}
          />
        )}
      </div>
      {caption && (
        <figcaption className="mt-3 text-center text-sm text-studio-inkMuted">
          {caption}
        </figcaption>
      )}
    </figure>
  );
}
