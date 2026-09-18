'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Play, X } from '@phosphor-icons/react';

function resolveEmbedUrl(url = '') {
  if (!url) return '';
  if (url.includes('youtube.com') || url.includes('youtu.be')) {
    const id = url.match(/(?:v=|youtu\.be\/|embed\/)([^&?/]+)/)?.[1];
    return id ? `https://www.youtube.com/embed/${id}?autoplay=1&rel=0` : url;
  }
  if (url.includes('vimeo.com')) {
    const id = url.match(/vimeo\.com\/(?:video\/)?(\d+)/)?.[1];
    return id ? `https://player.vimeo.com/video/${id}?autoplay=1` : url;
  }
  return url;
}

export default function VideoTrailerPlayer({
  video,
  thumbnail: defaultThumbnail = '/Asset/journal/real-wedding-trailer-thumb.png',
  videoUrl: defaultVideoUrl = '',
  title: defaultTitle = 'Watch Official 4K Wedding Trailer',
}) {
  const [isPlaying, setIsPlaying] = useState(false);

  const rawUrl = video?.url || defaultVideoUrl;
  if (!rawUrl) return null; // Gracefully collapse if editor didn't add a trailer

  const embedUrl = resolveEmbedUrl(rawUrl);
  const thumbnail = video?.thumbnail || defaultThumbnail;
  const duration = video?.duration || '3:45 min';
  const title = video?.title ? `${video.title} (${duration})` : `${defaultTitle} (${duration})`;

  return (
    <section aria-label="Official 4K Wedding Film Trailer" className="my-10 sm:my-14">
      {/* 16:9 Cinema Container (prompt-2.png) */}
      <div className="relative aspect-[16/7.5] sm:aspect-[16/6.8] md:aspect-[16/6.2] w-full overflow-hidden rounded-2xl sm:rounded-3xl border border-[#E5DCD3] shadow-md bg-stone-950 group cursor-pointer"
        onClick={() => setIsPlaying(true)}
      >
        <Image
          src={thumbnail}
          alt={title}
          fill
          priority
          sizes="(max-width: 1240px) 100vw, 1240px"
          className="object-cover object-center group-hover:scale-103 transition-transform duration-700 ease-out"
        />

        {/* Cinematic Gradient Overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/30 pointer-events-none" />

        {/* 4K Quality Badge (Top Right) */}
        <div className="absolute top-4 right-4 sm:top-5 sm:right-6">
          <span className="inline-flex items-center px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-md bg-black/80 backdrop-blur-md border border-[#FAD7A0]/40 text-[#FAD7A0] font-mono text-[10px] sm:text-xs font-bold tracking-widest uppercase shadow-sm">
            4K
          </span>
        </div>

        {/* Glowing Central Play Button */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="relative flex items-center justify-center">
            {/* Animated Pulse Ring */}
            <div className="absolute w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-[#FF5353]/30 animate-ping" />
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-[#FF5353] group-hover:bg-[#E04242] group-hover:scale-110 text-white flex items-center justify-center shadow-lg transition-all duration-300">
              <Play size={24} weight="fill" className="ml-1" />
            </div>
          </div>
        </div>

        {/* Bottom Caption Bar (prompt-2.png) */}
        <div className="absolute bottom-0 inset-x-0 p-4 sm:p-5 flex items-center justify-between text-white bg-gradient-to-t from-black/90 to-transparent">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#FF5353] animate-pulse" />
            <p className="font-sans text-xs sm:text-sm font-semibold tracking-wide text-white drop-shadow-sm">
              {title}
            </p>
          </div>
          <span className="text-[10px] font-mono uppercase tracking-widest text-[#FAD7A0] hidden sm:block">
            Cinema Experience
          </span>
        </div>
      </div>

      {/* Video Lightbox Modal */}
      {isPlaying && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 sm:p-8"
          onClick={() => setIsPlaying(false)}
        >
          <div
            className="relative w-full max-w-5xl aspect-video rounded-2xl overflow-hidden bg-black shadow-2xl border border-white/10"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setIsPlaying(false)}
              className="absolute top-4 right-4 z-10 p-2 rounded-full bg-black/60 hover:bg-white text-white hover:text-black transition-all cursor-pointer"
              aria-label="Close video"
            >
              <X size={20} weight="bold" />
            </button>
            <iframe
              src={embedUrl}
              title={title}
              className="w-full h-full border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        </div>
      )}
    </section>
  );
}
