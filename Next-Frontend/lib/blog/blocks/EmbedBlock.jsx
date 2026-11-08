/**
 * EmbedBlock — universal embed renderer with the click-to-load facade pattern.
 * Supports: Cloudflare Stream, YouTube, Vimeo, Instagram, Spotify, Google Maps, Pinterest, and Client Showcase.
 * Guarantees zero Core Web Vitals regression (no upfront third-party script/iframe loading).
 */
'use client';

import { useState } from 'react';
import Image from 'next/image';
import {
  Play,
  InstagramLogo,
  SpotifyLogo,
  MapPin,
  PinterestLogo,
  FilmSlate,
  Sparkle,
  ArrowSquareOut,
  Waveform,
} from '@phosphor-icons/react';

export default function EmbedBlock({ node }) {
  const {
    provider = 'youtube',
    embedUrl = '',
    thumbnail = '',
    title = '',
    author = '',
    aspectRatio = '16/9',
    caption = '',
    clientRef = null,
  } = node?.attrs || {};

  const [isLoaded, setIsLoaded] = useState(false);

  // Compute CSS aspect ratio or fixed container class
  const getContainerStyle = () => {
    if (provider === 'spotify') {
      if (aspectRatio === 'compact') return 'h-[152px]';
      return 'h-[352px]';
    }
    if (aspectRatio === '9/16') return 'aspect-[9/16] max-w-sm mx-auto';
    if (aspectRatio === '4/5') return 'aspect-[4/5] max-w-md mx-auto';
    if (aspectRatio === '2/3') return 'aspect-[2/3] max-w-sm mx-auto';
    if (aspectRatio === '1/1') return 'aspect-square max-w-lg mx-auto';
    return 'aspect-video w-full';
  };

  // ── 1. SPOTIFY EMBED ──
  if (provider === 'spotify') {
    return (
      <figure className="mx-auto max-w-2xl font-sans">
        <div className={`relative overflow-hidden rounded-2xl border border-studio-border bg-[#121212] text-white shadow-md ${getContainerStyle()}`}>
          {!isLoaded ? (
            <button
              type="button"
              onClick={() => setIsLoaded(true)}
              className="group absolute inset-0 flex flex-col justify-between p-6 text-left cursor-pointer transition-colors hover:bg-white/5 w-full"
              aria-label={`Play Spotify track ${title}`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#1DB954]">
                  <SpotifyLogo size={20} weight="fill" />
                  <span>Wedding Soundtrack</span>
                </div>
                <Waveform size={20} className="text-white/40 group-hover:text-[#1DB954] transition-colors" />
              </div>

              <div className="flex items-center gap-4">
                {thumbnail && (
                  <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-white/10 shadow-md">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={thumbnail} alt={title} className="h-full w-full object-cover" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <h4 className="truncate text-base font-bold text-white group-hover:text-[#1DB954] transition-colors">
                    {title || 'Listen to Wedding Audio'}
                  </h4>
                  <p className="truncate text-xs text-white/60">
                    {author || 'Spotify Audio'}
                  </p>
                </div>
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#1DB954] text-black shadow-lg transition-transform group-hover:scale-105">
                  <Play size={20} weight="fill" className="ml-0.5" />
                </div>
              </div>

              <div className="text-[10px] text-white/40 font-mono">
                Click to load Spotify interactive player
              </div>
            </button>
          ) : (
            <iframe
              src={embedUrl}
              title={title || 'Spotify Player'}
              width="100%"
              height="100%"
              allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
              loading="lazy"
              className="border-0"
            />
          )}
        </div>
        {caption && (
          <figcaption className="mt-2.5 text-center text-xs text-studio-inkMuted italic">
            {caption}
          </figcaption>
        )}
      </figure>
    );
  }

  // ── 2. INSTAGRAM EMBED ──
  if (provider === 'instagram') {
    return (
      <figure className="mx-auto font-sans">
        <div className={`relative overflow-hidden rounded-2xl border border-studio-border bg-white shadow-md ${getContainerStyle()}`}>
          {!isLoaded ? (
            <button
              type="button"
              onClick={() => setIsLoaded(true)}
              className="group absolute inset-0 flex flex-col justify-between p-6 text-center cursor-pointer bg-gradient-to-b from-stone-50 to-white hover:bg-stone-50/80 transition-all w-full"
              aria-label="Load Instagram post"
            >
              <div className="flex items-center justify-between w-full border-b border-stone-200/60 pb-3">
                <div className="flex items-center gap-2 text-xs font-bold tracking-wide text-stone-700">
                  <div className="p-1 rounded-lg bg-gradient-to-tr from-[#f09433] via-[#dc2743] to-[#bc1888] text-white">
                    <InstagramLogo size={16} weight="bold" />
                  </div>
                  <span>Instagram Wedding Feature</span>
                </div>
                <span className="text-[11px] text-stone-400 font-mono">Reel / Post</span>
              </div>

              <div className="my-auto flex flex-col items-center gap-3">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-tr from-[#f09433] via-[#dc2743] to-[#bc1888] text-white shadow-lg transition-transform group-hover:scale-110">
                  <Play size={24} weight="fill" className="ml-1" />
                </div>
                <div className="max-w-xs">
                  <h4 className="text-sm font-semibold text-stone-900">
                    {title || 'View Reel on Instagram'}
                  </h4>
                  <p className="text-xs text-stone-500 mt-1">
                    Click to load Instagram interactive reel
                  </p>
                </div>
              </div>

              <div className="text-[11px] text-stone-400">
                The Wedding Vachan Studio Archive
              </div>
            </button>
          ) : (
            <iframe
              src={embedUrl}
              title={title || 'Instagram Embed'}
              className="absolute inset-0 h-full w-full border-0"
              loading="lazy"
              allowFullScreen
            />
          )}
        </div>
        {caption && (
          <figcaption className="mt-2.5 text-center text-xs text-studio-inkMuted italic">
            {caption}
          </figcaption>
        )}
      </figure>
    );
  }

  // ── 3. GOOGLE MAPS VENUE EMBED ──
  if (provider === 'google-maps') {
    return (
      <figure className="mx-auto font-sans">
        <div className={`relative overflow-hidden rounded-2xl border border-studio-border bg-stone-100 shadow-md ${getContainerStyle()}`}>
          {!isLoaded ? (
            <button
              type="button"
              onClick={() => setIsLoaded(true)}
              className="group absolute inset-0 flex flex-col justify-between p-6 text-left cursor-pointer bg-gradient-to-br from-stone-50 via-stone-100 to-[#F7F4EF] hover:from-white transition-all w-full"
              aria-label={`Open map for ${title}`}
            >
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-studio-terracotta">
                <MapPin size={18} weight="fill" />
                <span>Wedding Destination &amp; Venue Map</span>
              </div>

              <div className="my-auto">
                <h4 className="font-playfair text-xl sm:text-2xl font-bold text-stone-900 group-hover:text-studio-terracotta transition-colors">
                  {title || 'Wedding Venue Setting'}
                </h4>
                <p className="text-xs text-stone-600 mt-1.5 flex items-center gap-1.5">
                  <MapPin size={14} className="text-studio-terracotta" />
                  <span>Click to explore interactive Google Map &amp; directions</span>
                </p>
              </div>

              <div className="flex items-center justify-between border-t border-stone-200 pt-3">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-1.5 text-xs font-semibold text-stone-800 shadow-sm border border-stone-200 group-hover:bg-studio-terracotta group-hover:text-white transition-colors">
                  <MapPin size={14} weight="bold" />
                  Load Interactive Map
                </span>
                <ArrowSquareOut size={16} className="text-stone-400" />
              </div>
            </button>
          ) : (
            <iframe
              src={embedUrl}
              title={title || 'Venue Google Map'}
              className="absolute inset-0 h-full w-full border-0"
              loading="lazy"
              allowFullScreen
            />
          )}
        </div>
        {caption && (
          <figcaption className="mt-2.5 text-center text-xs text-studio-inkMuted italic">
            {caption}
          </figcaption>
        )}
      </figure>
    );
  }

  // ── 4. PINTEREST EMBED ──
  if (provider === 'pinterest') {
    return (
      <figure className="mx-auto font-sans">
        <div className={`relative overflow-hidden rounded-2xl border border-studio-border bg-white shadow-md ${getContainerStyle()}`}>
          {!isLoaded ? (
            <button
              type="button"
              onClick={() => setIsLoaded(true)}
              className="group absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center cursor-pointer hover:bg-stone-50 transition-colors w-full"
              aria-label="Load Pinterest Pin"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#E60023] text-white shadow-md transition-transform group-hover:scale-110">
                <PinterestLogo size={24} weight="bold" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-stone-900">
                  {title || 'Wedding Moodboard & Style Inspiration'}
                </h4>
                <p className="text-xs text-stone-500 mt-1">
                  Click to view Pinterest pin &amp; lookbook
                </p>
              </div>
            </button>
          ) : (
            <iframe
              src={embedUrl}
              title={title || 'Pinterest Pin'}
              className="absolute inset-0 h-full w-full border-0"
              loading="lazy"
            />
          )}
        </div>
        {caption && (
          <figcaption className="mt-2.5 text-center text-xs text-studio-inkMuted italic">
            {caption}
          </figcaption>
        )}
      </figure>
    );
  }

  // ── 5. CLIENT PORTFOLIO SHOWCASE EMBED ──
  if (provider === 'client-showcase') {
    const bride = clientRef?.bride || 'Bride';
    const groom = clientRef?.groom || 'Groom';
    const coupleNames = clientRef?.title || `${bride} & ${groom}`;
    const venue = clientRef?.venue || '';

    return (
      <figure className="mx-auto w-full font-sans">
        <div className="relative overflow-hidden rounded-2xl border border-studio-border bg-[#1C1917] text-white shadow-xl aspect-video w-full">
          {!isLoaded ? (
            <button
              type="button"
              onClick={() => setIsLoaded(true)}
              className="group absolute inset-0 flex flex-col justify-between p-6 sm:p-8 text-left cursor-pointer transition-transform w-full"
              aria-label={`Watch wedding film for ${coupleNames}`}
            >
              {thumbnail && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={thumbnail}
                  alt={coupleNames}
                  className="absolute inset-0 h-full w-full object-cover opacity-60 transition-opacity duration-300 group-hover:opacity-75"
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-black/30" />

              <div className="relative z-10 flex items-center justify-between">
                <div className="flex items-center gap-2 rounded-full bg-black/60 backdrop-blur-sm border border-white/20 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-studio-gold">
                  <FilmSlate size={14} weight="fill" />
                  <span>Studio Film Feature</span>
                </div>
                {venue && (
                  <span className="relative z-10 text-xs text-white/80 font-medium">
                    📍 {venue}
                  </span>
                )}
              </div>

              <div className="relative z-10 my-auto flex flex-col items-center text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-studio-gold text-white shadow-2xl transition-transform duration-300 group-hover:scale-110">
                  <Play size={28} weight="fill" className="ml-1" />
                </div>
                <h3 className="mt-4 font-playfair text-2xl sm:text-3xl font-bold text-white">
                  {coupleNames}
                </h3>
                <p className="text-xs text-white/75 mt-1">
                  Cinematic Wedding Film by The Wedding Vachan
                </p>
              </div>

              <div className="relative z-10 flex items-center justify-between text-[11px] text-white/60">
                <span>The Wedding Vachan Cinema</span>
                <span className="group-hover:text-studio-gold transition-colors font-medium">Click to Play Film ›</span>
              </div>
            </button>
          ) : (
            <iframe
              src={embedUrl}
              title={coupleNames}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="absolute inset-0 h-full w-full border-0"
              loading="lazy"
            />
          )}
        </div>
        {caption && (
          <figcaption className="mt-2.5 text-center text-xs text-studio-inkMuted italic">
            {caption}
          </figcaption>
        )}
      </figure>
    );
  }

  // ── 6. VIDEO EMBEDS (YouTube, Vimeo, Cloudflare Stream, MP4) ──
  const isStream = provider === 'stream';
  const isVimeo = provider === 'vimeo';

  return (
    <figure className="font-sans">
      <div className={`relative overflow-hidden rounded-2xl bg-studio-obsidian shadow-lg ${getContainerStyle()}`}>
        {!isLoaded ? (
          <button
            type="button"
            onClick={() => setIsLoaded(true)}
            className="group absolute inset-0 flex cursor-pointer items-center justify-center w-full"
            aria-label={`Play ${title || 'video'}`}
          >
            {thumbnail ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={thumbnail}
                alt={title || caption || 'Video thumbnail'}
                className="absolute inset-0 h-full w-full object-cover opacity-85 transition-opacity group-hover:opacity-100"
                loading="lazy"
              />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-stone-900 via-stone-800 to-black" />
            )}
            <div className="absolute inset-0 bg-black/25 group-hover:bg-black/10 transition-colors" />

            {/* Provider Pill */}
            <div className="absolute top-4 left-4 z-10 flex items-center gap-1.5 rounded-full bg-black/70 backdrop-blur-sm border border-white/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white">
              <FilmSlate size={13} className="text-studio-gold" />
              <span>{isStream ? 'Studio 4K Cinema' : isVimeo ? 'Vimeo Film' : 'YouTube Video'}</span>
            </div>

            {/* Play Button */}
            <div className="relative z-10 flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-full bg-white/95 text-studio-ink shadow-2xl transition-transform group-hover:scale-110">
              <Play size={30} weight="fill" className="ml-1 text-studio-ink" />
            </div>

            {/* Title / Hint Overlay */}
            {title && (
              <div className="absolute bottom-4 inset-x-4 z-10 rounded-xl bg-black/60 backdrop-blur-sm p-2.5 text-left text-white">
                <p className="truncate text-xs font-semibold">{title}</p>
                {author && <p className="text-[10px] text-white/60">{author}</p>}
              </div>
            )}
          </button>
        ) : (
          <iframe
            src={embedUrl}
            title={title || caption || 'Video'}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="absolute inset-0 h-full w-full border-0"
            loading="lazy"
          />
        )}
      </div>
      {caption && (
        <figcaption className="mt-2.5 text-center text-xs text-studio-inkMuted italic">
          {caption}
        </figcaption>
      )}
    </figure>
  );
}
