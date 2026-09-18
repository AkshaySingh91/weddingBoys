'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  MagnifyingGlass,
  Sparkle,
  ArrowRight,
  BookOpenText,
  Eye,
  FilmSlate,
} from '@phosphor-icons/react';
import { cn } from '@/lib/utils.js';

function coverOf(post) {
  if (!post) return null;
  if (typeof post.coverImage === 'string') return post.coverImage;
  return post.coverImage?.cdnUrl || post.coverImage?.publicUrl || post.coverImage?.url || null;
}

export default function BlogIndexClient({ initialPosts = [], categories = [] }) {
  const [activeCategory, setActiveCategory] = useState('All');
  const [query, setQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 6; // Strictly maximum 6 cards per page in Archive to prevent orphaned grid slots

  // Standard category display list matching prompt-1.png
  const displayCategories = useMemo(() => {
    const defaultOrder = ['All', 'Real Weddings', 'Planning Guides', 'Cinematography', 'Photo Essays'];
    const existing = new Set(categories);
    const result = defaultOrder.filter((c) => existing.has(c) || c === 'All');
    for (const c of categories) {
      if (!result.includes(c)) result.push(c);
    }
    return result;
  }, [categories]);

  // Category counts
  const counts = useMemo(() => {
    const map = { All: initialPosts.length };
    for (const post of initialPosts) {
      if (post.category) {
        map[post.category] = (map[post.category] || 0) + 1;
      }
    }
    return map;
  }, [initialPosts]);

  // Filtered stories
  const filteredPosts = useMemo(() => {
    return initialPosts.filter((post) => {
      const matchCategory =
        activeCategory === 'All' || post.category === activeCategory;
      const matchQuery =
        !query ||
        post.title?.toLowerCase().includes(query.toLowerCase()) ||
        post.excerpt?.toLowerCase().includes(query.toLowerCase()) ||
        post.category?.toLowerCase().includes(query.toLowerCase()) ||
        post.venue?.toLowerCase().includes(query.toLowerCase()) ||
        post.tags?.some((t) => t.toLowerCase().includes(query.toLowerCase()));
      return matchCategory && matchQuery;
    });
  }, [initialPosts, activeCategory, query]);

  // 1. Featured Hero Post (Lake Pichola Udaipur Royal Wedding or first post)
  const heroPost = useMemo(() => {
    return (
      filteredPosts.find((p) => p.featured) ||
      filteredPosts.find((p) => p.slug?.includes('ananya-kabir') || p.slug?.includes('udaipur')) ||
      filteredPosts[0] ||
      null
    );
  }, [filteredPosts]);

  // 2. Curated Two-Column Posts (Preserving Emotion & Mumbai Rooftop)
  const secondaryPosts = useMemo(() => {
    if (!heroPost) return filteredPosts.slice(0, 2);
    const nonHero = filteredPosts.filter(
      (p) => p._id !== heroPost._id && p.slug !== heroPost.slug
    );

    // Try finding the exact curated stories from prompt-1.png if category is 'All'
    if (activeCategory === 'All') {
      const p1 = nonHero.find((p) => p.slug?.includes('preserving-emotion') || p.category === 'Cinematography');
      const p2 = nonHero.find((p) => p.slug?.includes('tarun-meera') || (p !== p1 && p.category === 'Real Weddings'));
      if (p1 && p2) return [p1, p2];
    }
    return nonHero.slice(0, 2);
  }, [filteredPosts, heroPost, activeCategory]);

  // 3. Archive Section Posts (Maximum 6 per page)
  const remainingPosts = useMemo(() => {
    const usedIds = new Set([
      heroPost?._id || heroPost?.slug,
      ...secondaryPosts.map((p) => p._id || p.slug),
    ]);
    return filteredPosts.filter((p) => !usedIds.has(p._id || p.slug));
  }, [filteredPosts, heroPost, secondaryPosts]);

  // Pagination for archive grid (Strictly 6 cards per page)
  const totalPages = Math.max(1, Math.ceil(remainingPosts.length / pageSize));
  const paginatedArchive = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return remainingPosts.slice(start, start + pageSize);
  }, [remainingPosts, currentPage, pageSize]);

  return (
    <div className="space-y-4 sm:space-y-5 font-sans">
      {/* 1. Magazine Editorial Masthead with User's PNG Palace & Flower Art (prompt-1.png) */}
      <header className="relative overflow-hidden bg-gradient-to-r from-[#FAF1E8] via-[#FFF7EE] to-[#FAF1E8] border border-[#E5DCD3]/70 py-4 sm:py-5 px-4 sm:px-8 text-center shadow-sm">
        {/* Left Side Palace Fade Image - flush on the left with no margin */}
        <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-[45%] max-w-[480px] select-none z-0">
          <Image
            src="/Asset/journal/thumbnail-left-side-palace.png"
            alt=""
            fill
            priority
            className="object-cover object-left opacity-90"
          />
        </div>

        {/* Right Side Botanical Sketch Fade Image */}
        <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-[36%] max-w-[400px] select-none z-0">
          <Image
            src="/Asset/journal/thumbnail-right-side-flower.png"
            alt=""
            fill
            priority
            className="object-contain object-right opacity-90"
          />
        </div>

        {/* Right Italic Calligraphy Script ("Stories That Feel Like You") */}
        <div className="pointer-events-none absolute right-5 sm:right-9 top-3 sm:top-4 z-10 text-right select-none hidden sm:block">
          <p className="font-[family-name:var(--font-greatvibes)] text-2xl md:text-[27px] text-[#9E6243] leading-none tracking-wide">
            Stories
          </p>
          <p className="font-[family-name:var(--font-greatvibes)] text-2xl md:text-[27px] text-[#9E6243] leading-tight tracking-wide -mt-0.5">
            That Feel
          </p>
          <p className="font-[family-name:var(--font-greatvibes)] text-2xl md:text-[27px] text-[#9E6243] leading-tight tracking-wide -mt-0.5">
            Like You
          </p>
          <div className="w-13 h-[1.5px] bg-[#9E6243]/70 ml-auto mt-0.5 rounded-full" />
        </div>

        {/* Center Masthead Content */}
        <div className="relative z-10 max-w-xl mx-auto space-y-3">
          {/* Issue Badge */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FCEEE6] border border-[#E5BDA7]/60 text-[#74583E] text-[10px] font-mono font-bold tracking-[0.22em] uppercase shadow-sm">
            <Sparkle size={11} weight="fill" className="text-[#FF5353]" />
            <span>THE WEDDING BOYS BLOGS</span>
          </div>

          {/* Editorial Display Headline in Playfair Display */}
          <h1 className="font-playfair font-serif text-2xl sm:text-3xl md:text-[36px] font-bold tracking-tight text-[#5E2B17] leading-[1.18]">
            Cinema, Heritage &amp; Real Love Stories
          </h1>

          {/* Subtitle */}
          <p className="text-xs sm:text-[13px] text-[#74583E] leading-relaxed max-w-md mx-auto font-sans">
            Curated wedding films, royal palace destination guides, and visual essays from India&rsquo;s storytelling wedding cinematographers.
          </p>
        </div>
      </header>

      <div className="px-10">
        {/* 2. Category Filter & Search Bar (Single Row, No Overlap, prompt-1.png) */}
        <section aria-label="Story Categories and Search">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-2.5 border-b border-[#E5DCD3]">
            {/* Category Pills Strip */}
            <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
              {displayCategories.map((cat) => {
                const isActive = activeCategory === cat;
                const count = counts[cat] || 0;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => {
                      setActiveCategory(cat);
                      setCurrentPage(1);
                    }}
                    className={cn(
                      'px-3.5 py-1.5 rounded-full text-xs transition-all cursor-pointer whitespace-nowrap',
                      isActive
                        ? 'bg-[#FF5353] text-white font-semibold shadow-sm'
                        : 'bg-white border border-[#E5DCD3] text-[#74583E] hover:border-[#FF5353]/40 font-medium'
                    )}
                  >
                    <span>{cat}</span>
                    <span className="ml-1 opacity-90 tabular-nums">({count})</span>
                  </button>
                );
              })}
            </div>

            {/* Clean Pill Search Bar */}
            <div className="relative w-full md:w-72 shrink-0">
              <MagnifyingGlass
                size={15}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#74583E]/70"
              />
              <input
                type="text"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Search stories, destinations, advice..."
                className="w-full pl-9 pr-9 py-1.5 bg-white border border-[#E5DCD3] rounded-full text-xs text-[#2F2F2F] placeholder:text-[#78716C] focus:outline-none focus:border-[#FF5353] focus:ring-1 focus:ring-[#FF5353]/20 transition-all shadow-sm"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => {
                    setQuery('');
                    setCurrentPage(1);
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-semibold text-[#FF5353] hover:text-[#E04242] cursor-pointer"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        </section>

        {/* Zero Results State */}
        {filteredPosts.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[#E5DCD3] bg-white p-12 text-center shadow-sm">
            <div className="w-12 h-12 rounded-full bg-[#FCEEE6] flex items-center justify-center text-[#FF5353] mx-auto mb-3">
              <BookOpenText size={24} />
            </div>
            <h3 className="font-serif text-lg font-bold text-[#5E2B17]">No editorial stories match your search</h3>
            <p className="text-xs text-[#74583E] mt-1 max-w-sm mx-auto leading-relaxed">
              Try choosing another topic category or clearing your search term to see all published journal features.
            </p>
            <button
              onClick={() => {
                setActiveCategory('All');
                setQuery('');
                setCurrentPage(1);
              }}
              className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#FF5353] text-white text-xs font-semibold hover:bg-[#E04242] transition-colors cursor-pointer shadow-sm"
            >
              <span>Reset All Filters</span>
            </button>
          </div>
        ) : (
          <div className="space-y-4 sm:space-y-5">
            {/* 3. Hero Feature Story (Horizontal Split, Compact Height ~350px, prompt-1.png) */}
            {heroPost && (
              <section aria-label="Hero Spotlight">
                <Link
                  href={`/blogs/${heroPost.slug}`}
                  className="group block overflow-hidden rounded-2xl border border-[#E5DCD3] bg-white shadow-sm hover:shadow-md transition-all duration-300"
                >
                  <div className="grid grid-cols-1 md:grid-cols-12 h-auto md:h-[350px]">
                    {/* Left 58% Image Showcase */}
                    <div className="md:col-span-7 relative h-[250px] md:h-full overflow-hidden bg-[#FCEEE6]">
                      {coverOf(heroPost) ? (
                        <Image
                          src={coverOf(heroPost)}
                          alt={heroPost.title}
                          fill
                          priority
                          unoptimized
                          sizes="(max-width: 768px) 100vw, 58vw"
                          className="object-cover group-hover:scale-103 transition-transform duration-700 ease-out"
                        />
                      ) : (
                        <div className="h-full w-full bg-gradient-to-br from-[#5E2B17] via-[#74583E] to-[#4E2818]" />
                      )}

                      {/* Gradient Overlay for bottom text */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/15 to-transparent pointer-events-none" />

                      {/* Top-Left Featured Badge */}
                      <div className="absolute top-4 left-4">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/95 backdrop-blur-md text-[#FF5353] text-[10px] font-bold uppercase tracking-wider border border-[#E5DCD3] shadow-sm">
                          <Sparkle size={11} weight="fill" />
                          <span>Featured Story</span>
                        </span>
                      </div>

                      {/* Bottom-Left Overlay Typography ("UDAIPUR — A STORY FOREVER") */}
                      <div className="absolute bottom-4 left-4 right-4">
                        <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-white font-semibold drop-shadow-sm">
                          {heroPost.venue?.includes('Udaipur') || heroPost.tags?.includes('Udaipur')
                            ? 'Udaipur — A Story Forever'
                            : `${heroPost.venue || heroPost.category} · Heritage Cinema`}
                        </p>
                      </div>
                    </div>

                    {/* Right 42% Editorial Content */}
                    <div className="md:col-span-5 p-5 sm:p-6 md:p-7 flex flex-col justify-between bg-white h-full">
                      <div className="space-y-2.5">
                        {/* Category & Read Time */}
                        <div className="flex items-center gap-2 text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-[#FF5353]">
                          <span>{heroPost.category}</span>
                          <span className="text-[#E5DCD3]">·</span>
                          <span className="text-[#74583E] font-medium">
                            {heroPost.readingTime || 6} MIN READ
                          </span>
                        </div>

                        {/* Main Title in Playfair Display */}
                        <h2 className="font-playfair font-serif text-lg sm:text-xl md:text-[23px] font-bold leading-snug text-[#5E2B17] group-hover:text-[#FF5353] transition-colors">
                          {heroPost.title}
                        </h2>

                        {/* Excerpt */}
                        <p className="text-xs text-[#74583E] leading-relaxed line-clamp-3">
                          {heroPost.excerpt}
                        </p>
                      </div>

                      {/* Author Byline & Coral CTA Button */}
                      <div className="pt-4 border-t border-[#E5DCD3] flex items-center justify-between gap-3 mt-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-[#FCEEE6] border border-[#E5BDA7]/50 flex items-center justify-center text-[#5E2B17] font-serif font-bold text-xs shrink-0 overflow-hidden">
                            {heroPost.author?.avatar ? (
                              <Image
                                src={heroPost.author.avatar}
                                alt={heroPost.author.name}
                                width={32}
                                height={32}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <span>{(heroPost.author?.name || 'A')[0]}</span>
                            )}
                          </div>
                          <div>
                            <p className="text-xs font-bold text-[#5E2B17] leading-tight">
                              By {heroPost.author?.name || 'Akshay Singh'}
                            </p>
                            <p className="text-[9px] text-[#74583E] tracking-wider mt-0.5">
                              {heroPost.author?.role || 'Founder & Creative Director'}
                            </p>
                          </div>
                        </div>

                        <span className="inline-flex items-center justify-center gap-1 px-4 py-2 bg-[#FF5353] group-hover:bg-[#E04242] text-white text-xs font-semibold rounded-full tracking-wide transition-all shrink-0 shadow-sm">
                          <span>Read Feature</span>
                          <ArrowRight size={12} weight="bold" />
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              </section>
            )}

            {/* 4. Curated Two-Column Cards (Horizontal Minimal Height ~190px, prompt-1.png) */}
            {secondaryPosts.length > 0 && (
              <section aria-label="Curated Stories" className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
                {secondaryPosts.map((post) => (
                  <Link
                    key={post._id || post.slug}
                    href={`/blogs/${post.slug}`}
                    className="group flex flex-row overflow-hidden rounded-2xl border border-[#E5DCD3] bg-white shadow-sm hover:shadow-md transition-all duration-300 h-[185px] sm:h-[195px]"
                  >
                    {/* Left 40% Image Thumbnail */}
                    <div className="w-[38%] sm:w-[40%] shrink-0 h-full relative overflow-hidden bg-[#FCEEE6]">
                      {coverOf(post) ? (
                        <Image
                          src={coverOf(post)}
                          alt={post.title}
                          fill
                          unoptimized
                          sizes="(max-width: 768px) 40vw, 25vw"
                          className="object-cover group-hover:scale-105 transition-transform duration-600 ease-out"
                        />
                      ) : (
                        <div className="h-full w-full bg-[#FDE9D9] flex items-center justify-center text-[#74583E]">
                          <FilmSlate size={28} />
                        </div>
                      )}
                    </div>

                    {/* Right 60% Content */}
                    <div className="w-[62%] sm:w-[60%] p-4 sm:p-5 flex flex-col justify-between">
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-1.5 text-[9px] sm:text-[10px] font-mono font-bold uppercase tracking-[0.16em] text-[#FF5353]">
                          <span>{post.category}</span>
                          <span className="text-[#E5DCD3]">·</span>
                          <span className="text-[#74583E] font-medium">
                            {post.readingTime || 4} MIN READ
                          </span>
                        </div>

                        <h3 className="font-playfair font-serif text-sm sm:text-base font-bold text-[#5E2B17] group-hover:text-[#FF5353] transition-colors leading-snug line-clamp-2">
                          {post.title}
                        </h3>

                        <p className="text-[11px] text-[#74583E] line-clamp-2 leading-relaxed">
                          {post.excerpt}
                        </p>
                      </div>

                      <div className="pt-2">
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#FF5353] group-hover:translate-x-1 transition-transform">
                          <span>Read Story</span>
                          <ArrowRight size={11} weight="bold" />
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </section>
            )}

            {/* 5. Breakout Director Credo Quote Banner (Compact Height ~160px, prompt-1.png) */}
            <section
              aria-label="Cinematic Credo"
              className="my-2 rounded-2xl bg-gradient-to-r from-[#4E2818] via-[#5E2B17] to-[#4E2818] text-white p-6 sm:p-8 text-center relative overflow-hidden shadow-sm"
            >
              {/* Left Palace Arches Watermark */}
              <div className="pointer-events-none absolute -left-4 top-1/2 -translate-y-1/2 w-44 sm:w-56 h-44 sm:h-56 opacity-15 select-none">
                <Image
                  src="/Asset/journal/palace-silhouette-banner.svg"
                  alt=""
                  width={220}
                  height={220}
                  className="w-full h-full object-contain"
                />
              </div>

              {/* Right Palace Arches Watermark (Mirrored) */}
              <div className="pointer-events-none absolute -right-4 top-1/2 -translate-y-1/2 w-44 sm:w-56 h-44 sm:h-56 opacity-15 select-none -scale-x-100">
                <Image
                  src="/Asset/journal/palace-silhouette-banner.svg"
                  alt=""
                  width={220}
                  height={220}
                  className="w-full h-full object-contain"
                />
              </div>

              <div className="max-w-2xl mx-auto space-y-2 relative z-10">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/10 border border-[#FAD7A0]/30 text-[#FAD7A0] text-[9px] font-mono font-bold uppercase tracking-[0.25em]">
                  <Sparkle size={10} weight="fill" />
                  <span>Cinematic Credo</span>
                </div>

                <blockquote className="font-playfair font-serif text-base sm:text-lg md:text-[21px] italic leading-relaxed text-white">
                  &ldquo;A wedding film shouldn&rsquo;t feel like a montage of choreographed poses; it must feel like an emotional heirloom that transports you back to the exact vibration of the room.&rdquo;
                </blockquote>

                <p className="text-xs text-[#FAD7A0] font-sans font-medium tracking-wide">
                  — Akshay Singh, Creative Director, The Wedding Boys Studio
                </p>
              </div>
            </section>

            {/* 6. Archive Stories Grid (Strictly 6 Cards per Page, prompt-1.png) */}
            {remainingPosts.length > 0 && (
              <section aria-label="More Stories from The Journal" className="space-y-5">
                <div className="flex items-center justify-between pb-1 border-b border-[#E5DCD3]">
                  <h3 className="font-playfair font-serif text-xl sm:text-2xl font-bold text-[#5E2B17]">
                    More Stories from The Journal
                  </h3>
                  <Link
                    href="/blogs"
                    className="text-xs font-medium text-[#74583E] hover:text-[#FF5353] transition-colors"
                  >
                    Explore all stories →
                  </Link>
                </div>

                {/* 3-Column Grid (Max 6 Cards) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
                  {paginatedArchive.map((post) => (
                    <Link
                      key={post._id || post.slug}
                      href={`/blogs/${post.slug}`}
                      className="group flex flex-col overflow-hidden rounded-2xl border border-[#E5DCD3] bg-white shadow-sm hover:shadow-md transition-all duration-300"
                    >
                      {/* Thumbnail with Category Badge */}
                      <div className="relative h-[145px] sm:h-[155px] overflow-hidden bg-[#FCEEE6]">
                        {coverOf(post) ? (
                          <Image
                            src={coverOf(post)}
                            alt={post.title}
                            fill
                            unoptimized
                            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                            className="object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                          />
                        ) : (
                          <div className="h-full w-full bg-[#FDE9D9] flex items-center justify-center text-[#74583E]">
                            <Eye size={24} />
                          </div>
                        )}
                        <span className="absolute bottom-2.5 left-2.5 rounded-full bg-white/95 backdrop-blur-md px-2.5 py-0.5 text-[9px] font-bold text-[#5E2B17] border border-[#E5DCD3]/80 uppercase tracking-wider">
                          {post.category}
                        </span>
                      </div>

                      {/* Card Body (Compact Height ~290px Total) */}
                      <div className="flex flex-1 flex-col justify-between p-3.5 sm:p-4 space-y-3">
                        <div className="space-y-1">
                          <div className="text-[9px] font-mono uppercase tracking-wider text-[#74583E]">
                            {post.venue ? `${post.venue} · ` : ''}
                            {post.readingTime || 3} MIN READ
                          </div>

                          <h4 className="font-playfair font-serif text-sm sm:text-[15px] font-bold text-[#5E2B17] group-hover:text-[#FF5353] transition-colors leading-snug line-clamp-2">
                            {post.title}
                          </h4>

                          <p className="text-[11px] text-[#74583E] line-clamp-2 leading-relaxed">
                            {post.excerpt}
                          </p>
                        </div>

                        {/* Card Footer: Author + Circular Arrow */}
                        <div className="pt-2.5 border-t border-[#E5DCD3] flex items-center justify-between text-[11px] text-[#74583E]">
                          <span className="font-medium truncate max-w-[140px]">
                            {post.author?.name || 'Akshay Singh'}
                          </span>
                          <div className="w-6.5 h-6.5 rounded-full bg-[#FCEEE6] group-hover:bg-[#FF5353] group-hover:text-white text-[#74583E] flex items-center justify-center transition-colors shrink-0 shadow-sm">
                            <ArrowRight size={11} weight="bold" />
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>

                {/* Numbered Pagination (prompt-1.png: strictly paginate if > 6 cards) */}
                {totalPages > 1 && (
                  <div className="pt-4 flex items-center justify-center gap-1.5">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                      const isActive = page === currentPage;
                      return (
                        <button
                          key={page}
                          type="button"
                          onClick={() => {
                            setCurrentPage(page);
                            window.scrollTo({ top: 600, behavior: 'smooth' });
                          }}
                          className={cn(
                            'w-8 h-8 rounded-full text-xs font-semibold transition-all cursor-pointer flex items-center justify-center',
                            isActive
                              ? 'bg-[#FF5353] text-white shadow-sm'
                              : 'bg-white border border-[#E5DCD3] text-[#74583E] hover:border-[#FF5353] hover:text-[#FF5353]'
                          )}
                        >
                          {page}
                        </button>
                      );
                    })}
                    {currentPage < totalPages && (
                      <button
                        type="button"
                        onClick={() => {
                          setCurrentPage((p) => Math.min(totalPages, p + 1));
                          window.scrollTo({ top: 600, behavior: 'smooth' });
                        }}
                        className="px-3.5 py-1.5 rounded-full bg-white border border-[#E5DCD3] text-[#74583E] hover:border-[#FF5353] hover:text-[#FF5353] text-xs font-semibold transition-all cursor-pointer inline-flex items-center gap-1 shadow-sm"
                      >
                        <span>Next</span>
                        <ArrowRight size={11} weight="bold" />
                      </button>
                    )}
                  </div>
                )}
              </section>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
