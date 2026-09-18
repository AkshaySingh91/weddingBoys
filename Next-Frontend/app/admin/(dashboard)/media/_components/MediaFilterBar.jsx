'use client';

import { useEffect, useRef } from 'react';
import {
  MagnifyingGlass, X, ArrowsDownUp, Crop, GridFour,
  ArrowCounterClockwise, CaretDown, Check
} from '@phosphor-icons/react';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/app/admin/components/ui/Dropdown.jsx';
import { cn } from '@/lib/utils.js';

export const ORIENTATION_OPTIONS = [
  { key: '', label: 'All Ratios', hint: 'Any aspect ratio' },
  { key: 'landscape', label: 'Landscape (16:9)', hint: 'Wide cinematic & hero banners' },
  { key: 'portrait', label: 'Portrait (9:16)', hint: 'Vertical reels & portraits' },
  { key: 'square', label: 'Square (1:1)', hint: 'Instagram & profile squares' },
];

export const SORT_OPTIONS = [
  { key: 'newest', label: 'Newest First', hint: 'Recently uploaded' },
  { key: 'oldest', label: 'Oldest First', hint: 'Earliest uploads' },
  { key: 'size_desc', label: 'Largest Size', hint: 'Heaviest files first' },
  { key: 'size_asc', label: 'Smallest Size', hint: 'Lightest files first' },
  { key: 'name_asc', label: 'Filename (A → Z)', hint: 'Alphabetical order' },
];

/**
 * Studio Media Filter Bar
 *
 * Professional discovery toolbar for digital asset management:
 * 1. Debounced search with clear (X), keyboard shortcut (⌘K), and matching indicator.
 * 2. Media Type tabs (All / Images / Videos) with live counts.
 * 3. Studio Aspect Ratio Dropdown (All / Landscape / Portrait / Square).
 * 4. Studio Sort Dropdown (Newest / Oldest / Largest / Smallest / A-Z).
 * 5. Active query badges strip with one-click reset.
 */
export default function MediaFilterBar({
  search = '',
  onSearchChange,
  activeType = '',
  onTypeChange,
  typeTabs = [],
  orientation = '',
  onOrientationChange,
  sortBy = 'newest',
  onSortChange,
  stats,
  totalResults,
  onClearAll,
}) {
  const searchInputRef = useRef(null);

  // Global keyboard shortcut to focus search (⌘K or /)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      } else if (e.key === '/' && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const hasActiveFilters = Boolean(
    search.trim() ||
    activeType ||
    orientation ||
    (sortBy && sortBy !== 'newest')
  );

  const currentOrientationObj = ORIENTATION_OPTIONS.find((o) => o.key === orientation) || ORIENTATION_OPTIONS[0];
  const currentSortObj = SORT_OPTIONS.find((s) => s.key === sortBy) || SORT_OPTIONS[0];

  return (
    <div className="space-y-2.5 font-sans">
      {/* Primary Discovery Bar */}
      <div className="flex flex-wrap items-center gap-2.5">
        {/* Search Input with Clear & Shortcut */}
        <div className="relative min-w-[14rem] flex-1">
          <MagnifyingGlass
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400"
          />
          <input
            ref={searchInputRef}
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search filename, title, alt text or #tag… (⌘K)"
            className="h-9 w-full rounded-xl border border-stone-200/90 bg-white pl-8 pr-16 text-xs text-stone-900 placeholder:text-stone-400 outline-none transition-all focus:border-red-400 focus:ring-2 focus:ring-red-400/15 shadow-xs"
          />

          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 z-10">
            {search ? (
              <button
                type="button"
                onClick={() => onSearchChange('')}
                className="flex h-5 w-5 items-center justify-center rounded-md text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors cursor-pointer"
                title="Clear search"
              >
                <X size={12} weight="bold" />
              </button>
            ) : (
              <kbd className="hidden sm:inline-flex items-center rounded border border-stone-200 bg-stone-50 px-1.5 py-0.5 font-mono text-[9px] font-semibold text-stone-400 select-none">
                ⌘K
              </kbd>
            )}
          </div>
        </div>

        {/* Media Type Segmented Tabs */}
        <div className="flex items-center rounded-xl border border-stone-200/90 bg-stone-100/80 p-0.5 shadow-2xs">
          <GridFour size={13} className="ml-2 mr-1 text-stone-400 shrink-0" />
          {typeTabs.map((t) => {
            const n = t.key ? stats?.byType?.[t.key]?.count : null;
            if (t.key && stats && !n) return null;
            const active = activeType === t.key;
            return (
              <button
                key={t.key || 'all'}
                type="button"
                onClick={() => onTypeChange(t.key)}
                className={cn(
                  'flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] font-medium transition-all cursor-pointer whitespace-nowrap',
                  active
                    ? 'bg-white shadow-xs text-stone-900 font-semibold ring-1 ring-stone-900/5'
                    : 'text-stone-600 hover:text-stone-900 hover:bg-white/50'
                )}
              >
                <span>{t.label}</span>
                {n !== null && (
                  <span className={cn('text-[10px] tabular-nums', active ? 'text-stone-800 font-bold' : 'text-stone-400')}>
                    {n}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Radix Studio Orientation Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              id="orientation-trigger"
              className={cn(
                'flex items-center gap-2 h-9 rounded-xl border px-3 text-xs font-medium outline-none transition-all cursor-pointer shadow-xs',
                orientation
                  ? 'border-red-300 bg-red-50/60 text-red-900 font-semibold ring-1 ring-red-400/20'
                  : 'border-stone-200/90 bg-white text-stone-700 hover:bg-stone-50'
              )}
            >
              <Crop size={14} className={orientation ? 'text-red-600' : 'text-stone-400'} />
              <span>{orientation ? currentOrientationObj.label : 'Ratio: All'}</span>
              <CaretDown size={11} className="text-stone-400" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuLabel>Aspect Ratio</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {ORIENTATION_OPTIONS.map((opt) => {
              const isSelected = orientation === opt.key;
              return (
                <DropdownMenuItem
                  key={opt.key || 'all'}
                  id={`ratio-option-${opt.key || 'all'}`}
                  onClick={() => onOrientationChange(opt.key)}
                  className="flex items-center justify-between"
                >
                  <div className="flex flex-col">
                    <span className={cn('font-medium', isSelected && 'font-bold text-red-600')}>
                      {opt.label}
                    </span>
                    <span className="text-[10px] text-stone-400">{opt.hint}</span>
                  </div>
                  {isSelected && <Check size={14} weight="bold" className="text-red-600" />}
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Radix Studio Sort Order Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              id="sort-trigger"
              className={cn(
                'flex items-center gap-2 h-9 rounded-xl border px-3 text-xs font-medium outline-none transition-all cursor-pointer shadow-xs',
                sortBy && sortBy !== 'newest'
                  ? 'border-red-300 bg-red-50/60 text-red-900 font-semibold ring-1 ring-red-400/20'
                  : 'border-stone-200/90 bg-white text-stone-700 hover:bg-stone-50'
              )}
            >
              <ArrowsDownUp size={14} className={sortBy !== 'newest' ? 'text-red-600' : 'text-stone-400'} />
              <span>Sort: {currentSortObj.label}</span>
              <CaretDown size={11} className="text-stone-400" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuLabel>Sort Order</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {SORT_OPTIONS.map((opt) => {
              const isSelected = sortBy === opt.key;
              return (
                <DropdownMenuItem
                  key={opt.key}
                  id={`sort-option-${opt.key}`}
                  onClick={() => onSortChange(opt.key)}
                  className="flex items-center justify-between"
                >
                  <div className="flex flex-col">
                    <span className={cn('font-medium', isSelected && 'font-bold text-red-600')}>
                      {opt.label}
                    </span>
                    <span className="text-[10px] text-stone-400">{opt.hint}</span>
                  </div>
                  {isSelected && <Check size={14} weight="bold" className="text-red-600" />}
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Active Filters Pill Strip */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-1.5 pt-0.5 animate-in fade-in">
          <span className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider pr-1">
            Active:
          </span>

          {search.trim() && (
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-white border border-stone-200/90 px-2 py-0.5 text-xs text-stone-800 shadow-2xs font-medium">
              <span className="text-stone-400 font-normal">Search:</span>
              <span className="font-semibold">&ldquo;{search.trim()}&rdquo;</span>
              <button
                type="button"
                onClick={() => onSearchChange('')}
                className="text-stone-400 hover:text-red-600 rounded p-0.5 transition-colors cursor-pointer"
                title="Remove search filter"
              >
                <X size={11} weight="bold" />
              </button>
            </span>
          )}

          {activeType && (
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-white border border-stone-200/90 px-2 py-0.5 text-xs text-stone-800 shadow-2xs font-medium">
              <span className="text-stone-400 font-normal">Type:</span>
              <span className="font-semibold">{activeType}</span>
              <button
                type="button"
                onClick={() => onTypeChange('')}
                className="text-stone-400 hover:text-red-600 rounded p-0.5 transition-colors cursor-pointer"
                title="Reset type filter"
              >
                <X size={11} weight="bold" />
              </button>
            </span>
          )}

          {orientation && (
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-white border border-stone-200/90 px-2 py-0.5 text-xs text-stone-800 shadow-2xs font-medium">
              <span className="text-stone-400 font-normal">Ratio:</span>
              <span className="font-semibold capitalize">{orientation}</span>
              <button
                type="button"
                onClick={() => onOrientationChange('')}
                className="text-stone-400 hover:text-red-600 rounded p-0.5 transition-colors cursor-pointer"
                title="Reset ratio filter"
              >
                <X size={11} weight="bold" />
              </button>
            </span>
          )}

          {sortBy && sortBy !== 'newest' && (
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-white border border-stone-200/90 px-2 py-0.5 text-xs text-stone-800 shadow-2xs font-medium">
              <span className="text-stone-400 font-normal">Sort:</span>
              <span className="font-semibold">{currentSortObj.label}</span>
              <button
                type="button"
                onClick={() => onSortChange('newest')}
                className="text-stone-400 hover:text-red-600 rounded p-0.5 transition-colors cursor-pointer"
                title="Reset sort order"
              >
                <X size={11} weight="bold" />
              </button>
            </span>
          )}

          <button
            type="button"
            id="clear-all-filters-btn"
            onClick={onClearAll}
            className="inline-flex items-center gap-1 rounded-lg text-xs font-semibold text-red-600 hover:text-red-700 hover:bg-red-50/70 px-2 py-0.5 transition-colors cursor-pointer"
          >
            <ArrowCounterClockwise size={12} weight="bold" />
            <span>Clear All</span>
          </button>

          {totalResults !== null && totalResults !== undefined && (
            <span className="ml-auto text-[11px] text-stone-500 font-medium">
              Showing <span className="font-semibold text-stone-800">{totalResults}</span> matching {totalResults === 1 ? 'asset' : 'assets'}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
