'use client';

import Link from 'next/link';
import Image from 'next/image';
import {
  MapPin,
  Buildings,
  Sun,
  VideoCamera,
  Sparkle,
} from '@phosphor-icons/react';

const coverOf = (post) =>
  typeof post?.coverImage === 'string'
    ? post.coverImage
    : post?.coverImage?.cdnUrl || post?.coverImage?.publicUrl || post?.coverImage?.url || post?.featuredImage?.url || null;

export default function RealWeddingHero({ post }) {
  const heroImage = coverOf(post) || '/Asset/journal/ananya-kabir-hero-sunset.jpg';
  const title = post?.title || 'Real Wedding Feature';
  const category = post?.category || 'Real Weddings';

  const details = post?.weddingDetails || {};
  const destination = details.destination || post?.venue || 'Rajasthan, India';
  const venue = details.venue || post?.venue || 'Heritage Palace';
  const seasonMood = details.seasonMood || [post?.season, post?.mood].filter(Boolean).join(' • ') || 'Winter • Royal Traditional';
  const cinemaCrew = details.cinemaCrew || '6-Camera Team + 4K Drone';
  const subtitle = details.subtitle || [destination, venue, 'Celebration Film'].filter(Boolean).join(' • ');
  const flourish = details.flourishQuote || 'Some love stories look like history —';
  const tagline = details.tagline || 'FRAMES\nTHAT\nPRESERVE\nFOREVER';

  // Dynamic 4-card stats strip across hero bottom edge
  const stats = [
    {
      icon: MapPin,
      label: 'DESTINATION',
      value: destination,
    },
    {
      icon: Buildings,
      label: 'VENUE',
      value: venue,
    },
    {
      icon: Sun,
      label: 'SEASON & MOOD',
      value: seasonMood,
    },
    {
      icon: VideoCamera,
      label: 'CINEMA CREW',
      value: cinemaCrew,
    },
  ];

  return (
    <div className="relative w-full mb-14 sm:mb-18">
      {/* 1. Full-Bleed Panoramic Hero Visual (prompt-2.png) */}
      <div className="relative h-[480px] sm:h-[540px] md:h-[600px] w-full overflow-hidden bg-stone-950">
        <Image
          src={heroImage}
          alt={title}
          fill
          priority
          sizes="100vw"
          className="object-cover object-center scale-102"
        />

        {/* Cinematic Vignette & Gradient Overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-black/30 pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-transparent to-black/40 pointer-events-none" />

        {/* Overlaid Content Container */}
        <div className="relative z-10 mx-auto max-w-[1240px] h-full px-4 sm:px-6 flex flex-col justify-between pt-6 sm:pt-8 pb-16 sm:pb-20">
          {/* Top Overlaid Breadcrumbs */}
          <nav aria-label="Breadcrumbs" className="flex items-center gap-2 text-xs text-white/70 font-medium">
            <Link href="/" className="hover:text-white transition-colors">
              Home
            </Link>
            <span className="text-white/40">/</span>
            <Link href="/blogs" className="hover:text-white transition-colors">
              Journal
            </Link>
            <span className="text-white/40">/</span>
            <Link href={`/blogs?category=${encodeURIComponent(category)}`} className="hover:text-white transition-colors">
              {category}
            </Link>
            <span className="text-white/40">/</span>
            <span className="text-white truncate max-w-[200px] sm:max-w-md">
              {title}
            </span>
          </nav>

          {/* Center-Left Editorial Headline & Details */}
          <div className="max-w-3xl space-y-3.5 sm:space-y-4">
            {/* Real Wedding Feature Frosted Pill Badge */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md border border-white/30 text-white text-[10px] font-mono font-bold tracking-[0.22em] uppercase shadow-sm">
              <Sparkle size={11} weight="fill" className="text-gold" />
              <span>REAL WEDDING FEATURE</span>
            </div>

            {/* Grand Title in Playfair Display */}
            <h1 className="font-display font-display text-3xl sm:text-4xl md:text-5xl lg:text-[54px] font-bold text-white leading-[1.12] tracking-tight drop-shadow-md">
              {title}
            </h1>

            {/* Subtitle / Venue & Festivities Info */}
            <p className="text-xs sm:text-sm md:text-base text-white/90 font-medium tracking-wide drop-shadow-sm">
              {subtitle}
            </p>

            {/* Romantic Calligraphy Flourish */}
            {flourish && (
              <div className="pt-2 flex items-center gap-3">
                <p className="font-[family-name:var(--font-display italic)] text-2xl sm:text-3xl text-white/90 tracking-wide font-normal">
                  {flourish}
                </p>
                <div className="w-12 h-[1px] bg-white/50 rounded-full" />
              </div>
            )}
          </div>

          {/* Right Vertical Luxury Wordmark (prompt-2.png) */}
          <div className="hidden lg:block absolute right-6 bottom-24 text-right pointer-events-none select-none">
            <p className="font-mono text-[9px] font-bold tracking-[0.3em] uppercase text-white/70 leading-relaxed whitespace-pre-line">
              {tagline}
            </p>
          </div>
        </div>
      </div>

      {/* 2. Floating 4-Card Glassmorphic Stats Strip across Hero Bottom Edge (prompt-2.png) */}
      <div className="relative -mt-8 sm:-mt-10 mx-auto max-w-[1140px] px-4 sm:px-6 z-20">
        <div className="rounded-2xl bg-white/95 backdrop-blur-xl border border-[#E5DCD3] shadow-lg p-3.5 sm:p-5">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 divide-y md:divide-y-0 md:divide-x divide-[#E5DCD3]">
            {stats.map((stat, idx) => {
              const Icon = stat.icon;
              return (
                <div
                  key={stat.label}
                  className={`flex items-center gap-3 ${
                    idx === 0 ? 'pt-0 md:pl-2' : 'pt-3 md:pt-0 md:pl-4'
                  }`}
                >
                  <div className="w-9 h-9 rounded-full bg-[#FCEEE6] border border-[#E5BDA7]/50 flex items-center justify-center text-gold shrink-0 shadow-sm">
                    <Icon size={18} weight="fill" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[9px] font-mono font-bold tracking-[0.2em] text-[#74583E] uppercase block">
                      {stat.label}
                    </span>
                    <span className="text-xs sm:text-[13px] font-bold text-[#5E2B17] truncate block mt-0.5">
                      {stat.value}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
