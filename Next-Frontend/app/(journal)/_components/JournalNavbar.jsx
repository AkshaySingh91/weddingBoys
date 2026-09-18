'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import {
  MagnifyingGlass,
  X,
  List,
  ArrowUpRight,
  FilmSlate,
  Sparkle,
} from '@phosphor-icons/react';
import { cn } from '@/lib/utils.js';

export default function JournalNavbar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();

  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [scrolled, setScrolled] = useState(false);

  const isArticlePage = pathname.startsWith('/blogs/') && pathname !== '/blogs';

  // Scroll Progress listener for article pages
  useEffect(() => {
    const handleScroll = () => {
      const currentScroll = window.scrollY;
      setScrolled(currentScroll > 20);

      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (totalHeight > 0) {
        const progress = Math.min(100, Math.max(0, (currentScroll / totalHeight) * 100));
        setScrollProgress(progress);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    router.push(`/blogs?search=${encodeURIComponent(searchQuery.trim())}`);
    setSearchOpen(false);
  };

  const categories = [
    { label: 'All Stories', href: '/blogs' },
    { label: 'Real Weddings', href: '/blogs?category=Real+Weddings' },
    { label: 'Planning Guides', href: '/blogs?category=Planning+Guides' },
    { label: 'Cinematography', href: '/blogs?category=Cinematography' },
    { label: 'Photo Essays', href: '/blogs?category=Photo+Essays' },
  ];

  return (
    <header
      className={cn(
        'sticky top-0 z-50 w-full transition-all duration-300 font-sans',
        scrolled
          ? 'bg-[#FFF7EE]/95 backdrop-blur-md shadow-sm border-b border-[#E5DCD3]'
          : 'bg-[#FFF7EE] border-b border-[#E5DCD3]'
      )}
    >
      <div className="mx-auto max-w-[1240px] px-4 sm:px-6">
        <div className="flex h-20 items-center justify-between gap-4">
          {/* Brand & Editorial Masthead */}
          <div className="flex min-w-0 items-center gap-3">
            <Link
              href="/"
              className="group flex min-w-0 flex-col items-start focus:outline-none"
              title="Return to The Wedding Boys Studio"
            >
              {/*
                Smaller and tighter on a phone. At 375 the masthead wanted ~208px
                beside a 176px action group inside 343px of usable width, and
                because both flex children were `shrink-0` neither gave way — so
                every journal page scrolled sideways by 62px on a phone.
              */}
              <span className="whitespace-nowrap font-serif text-sm sm:text-xl font-bold tracking-[0.1em] sm:tracking-[0.16em] text-[#5E2B17] group-hover:text-[#FF5353] transition-colors leading-tight">
                THE WEDDING BOYS
              </span>
              <span className="mt-0.5 whitespace-nowrap font-mono text-[9px] uppercase tracking-[0.25em] text-[#74583E]">
                Cinematography Studio
              </span>
            </Link>

            <span className="hidden sm:inline-block text-[#E5BDA7]/60 font-light">/</span>

            <Link
              href="/blogs"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FCEEE6] text-[#FF5353] text-[11px] font-bold tracking-wider uppercase border border-[#E5BDA7]/60 hover:bg-[#FF5353] hover:text-white transition-all shadow-sm"
            >
              <Sparkle size={11} weight="fill" />
              <span>Journal</span>
            </Link>
          </div>

          {/* Desktop Editorial Categories (prompt-1.png) */}
          {/*
            xl, not md. The link row is 572px and sits between a logo and an
            action group that are both `shrink-0`, so the bar needs ~1156px to
            lay out — but it switched to desktop mode at 768, where it overflowed
            the viewport by 388px and gave every page on the site a horizontal
            scrollbar at tablet width. It now stays in the burger menu until it
            actually fits.
          */}
          <nav className="hidden xl:flex items-center gap-1 sm:gap-1.5">
            {categories.map((cat) => {
              const isActive =
                cat.href === '/blogs'
                  ? pathname === '/blogs' && !searchParams.get('category')
                  : searchParams.get('category') === cat.href.split('category=')[1]?.replace(/\+/g, ' ');

              return (
                <Link
                  key={cat.label}
                  href={cat.href}
                  className={cn(
                    'px-3.5 py-1.5 rounded-full text-xs transition-all whitespace-nowrap',
                    isActive
                      ? 'bg-[#FF5353] text-white font-semibold shadow-sm'
                      : 'text-[#74583E] hover:text-[#5E2B17] hover:bg-[#FCEEE6] font-medium'
                  )}
                >
                  {cat.label}
                </Link>
              );
            })}
          </nav>

          {/* Right Action Utilities */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Search Trigger */}
            <button
              onClick={() => setSearchOpen(!searchOpen)}
              className="p-2 text-[#74583E] hover:text-[#5E2B17] hover:bg-[#FCEEE6] rounded-full transition-colors cursor-pointer"
              title="Search Journal Stories"
              aria-label="Search"
            >
              {searchOpen ? <X size={17} /> : <MagnifyingGlass size={17} />}
            </button>

            {/* Link back to Films Portfolio */}
            <Link
              href="/allfilms"
              className="hidden lg:inline-flex items-center gap-1.5 text-xs font-semibold text-[#74583E] hover:text-[#FF5353] transition-colors"
            >
              <FilmSlate size={15} />
              <span>Films</span>
            </Link>

            {/* Inquire Studio CTA Button */}
            <Link
              href="/contact"
              className="inline-flex items-center gap-1 px-4 sm:px-5 py-2 rounded-full bg-[#FF5353] hover:bg-[#e04545] text-white text-xs font-semibold tracking-wide transition-all shadow-sm hover:shadow-md active:scale-95"
            >
              <span>Inquire</span>
              <ArrowUpRight size={13} weight="bold" />
            </Link>

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="xl:hidden p-2 text-[#5E2B17] hover:bg-[#FCEEE6] rounded-lg transition-colors cursor-pointer"
              aria-label="Open Mobile Menu"
            >
              {mobileMenuOpen ? <X size={20} /> : <List size={20} />}
            </button>
          </div>
        </div>

        {/* Expandable Search Input Bar */}
        {searchOpen && (
          <div className="py-3 pb-4 border-t border-[#E5DCD3] animate-in fade-in slide-in-from-top-2 duration-200">
            <form onSubmit={handleSearchSubmit} className="relative max-w-2xl mx-auto">
              <MagnifyingGlass
                size={17}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-[#74583E]/70"
              />
              <input
                type="text"
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search wedding stories, destination guides, camera craft..."
                className="w-full pl-11 pr-24 py-2 bg-white border border-[#E5DCD3] rounded-full text-xs text-[#2F2F2F] placeholder:text-[#78716C] focus:outline-none focus:border-[#FF5353] focus:ring-2 focus:ring-[#FF5353]/15 shadow-sm"
              />
              <button
                type="submit"
                className="absolute right-1.5 top-1/2 -translate-y-1/2 px-4 py-1.5 bg-[#FF5353] hover:bg-[#e04545] text-white rounded-full text-xs font-semibold transition-colors cursor-pointer"
              >
                Search
              </button>
            </form>
          </div>
        )}

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="xl:hidden py-4 border-t border-[#E5DCD3] space-y-2 animate-in fade-in duration-200">
            <p className="text-[10px] font-bold uppercase tracking-wider text-[#74583E] px-3">
              Journal Sections
            </p>
            {categories.map((cat) => (
              <Link
                key={cat.label}
                href={cat.href}
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-xl text-sm font-medium text-[#2F2F2F] hover:bg-[#FCEEE6] hover:text-[#5E2B17] transition-colors"
              >
                {cat.label}
              </Link>
            ))}
            <div className="pt-3 border-t border-[#E5DCD3] flex items-center justify-between px-3 text-xs">
              <Link
                href="/allfilms"
                onClick={() => setMobileMenuOpen(false)}
                className="font-semibold text-[#74583E] hover:text-[#FF5353]"
              >
                Explore Films Archive
              </Link>
              <Link
                href="/"
                onClick={() => setMobileMenuOpen(false)}
                className="text-[#74583E] hover:text-[#5E2B17]"
              >
                Studio Home
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Reading Progress Line for Article Pages */}
      {isArticlePage && (
        <div className="absolute bottom-0 left-0 h-[2px] w-full bg-[#E5DCD3]">
          <div
            className="h-full bg-gradient-to-r from-[#FF5353] to-[#FAD7A0] transition-all duration-150 ease-out"
            style={{ width: `${scrollProgress}%` }}
          />
        </div>
      )}
    </header>
  );
}
