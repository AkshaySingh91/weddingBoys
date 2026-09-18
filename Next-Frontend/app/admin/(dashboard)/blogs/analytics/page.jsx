'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import BlogSubNav from '../_components/BlogSubNav.jsx';
import {
  Article,
  ChatCircleDots,
  ChartLineUp,
  Eye,
  CheckCircle,
  Clock,
  CursorClick,
  TrendUp,
  TrendDown,
  ArrowClockwise,
  CircleNotch,
  BookOpenText,
  Tag,
  ShareNetwork,
} from '@phosphor-icons/react';
import { fireMessage } from '@/Utils/fireMessage.js';
import { Button } from '@/app/admin/components/ui/Button.jsx';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '';

export default function AdminBlogAnalyticsPage() {
  const [range, setRange] = useState('30d'); // '7d' | '30d' | '90d' | '6m'
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hoveredPoint, setHoveredPoint] = useState(null);

  const fetchAnalytics = useCallback(async (selectedRange = range) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/admin/blogs/analytics?range=${selectedRange}`, {
        credentials: 'include',
      });
      const json = await res.json();
      if (res.ok && json.success) {
        setData(json);
      } else {
        fireMessage(json.message || 'Failed to load analytics', 'error');
      }
    } catch {
      fireMessage('Network error loading analytics', 'error');
    } finally {
      setLoading(false);
    }
  }, [range]);

  useEffect(() => {
    fetchAnalytics(range);
  }, [range, fetchAnalytics]);

  // Derived data
  const kpis = data?.kpis || {};
  const audienceTrend = data?.charts?.audienceTrend || [];
  const commentsTrend = data?.charts?.commentsTrend || [];
  const velocity = data?.charts?.velocity || [];
  const topStories = data?.topStories || [];
  const categoryShare = data?.categoryShare || [];

  // SVG Area Chart calculations
  const chartHeight = 220;
  const chartWidth = 700;
  const padding = { top: 20, right: 20, bottom: 30, left: 40 };

  const maxViewVal = useMemo(() => {
    if (!audienceTrend.length) return 10;
    const max = Math.max(...audienceTrend.map((d) => d.views || 0));
    return Math.max(10, Math.ceil(max * 1.15));
  }, [audienceTrend]);

  const chartPoints = useMemo(() => {
    if (!audienceTrend.length) return [];
    const usableWidth = chartWidth - padding.left - padding.right;
    const usableHeight = chartHeight - padding.top - padding.bottom;

    return audienceTrend.map((d, index) => {
      const x = padding.left + (index / Math.max(1, audienceTrend.length - 1)) * usableWidth;
      const yViews = padding.top + usableHeight - ((d.views || 0) / maxViewVal) * usableHeight;
      const yRead = padding.top + usableHeight - ((d.readCompletes || 0) / maxViewVal) * usableHeight;
      return { ...d, x, yViews, yRead };
    });
  }, [audienceTrend, maxViewVal]);

  // Generate SVG Path for Area & Line
  const { linePath, areaPath, readLinePath } = useMemo(() => {
    if (chartPoints.length === 0) return { linePath: '', areaPath: '', readLinePath: '' };

    const line = chartPoints.reduce((acc, pt, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${pt.x} ${pt.yViews}`, '');
    const baseLine = `${padding.top + (chartHeight - padding.top - padding.bottom)}`;
    const area = `${line} L ${chartPoints[chartPoints.length - 1].x} ${baseLine} L ${chartPoints[0].x} ${baseLine} Z`;
    const readLine = chartPoints.reduce((acc, pt, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${pt.x} ${pt.yRead}`, '');

    return { linePath: line, areaPath: area, readLinePath: readLine };
  }, [chartPoints]);

  return (
    <div className="space-y-6 pb-16 font-sans">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E5DCD3] pb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#1C1917]">
            Editorial Analytics &amp; Performance
          </h1>
          <p className="text-xs text-stone-500 mt-0.5">
            Track readership growth, story engagement depth, discussion activity, and client enquiry conversions.
          </p>
        </div>

        {/* Range Selector & Refresh */}
        <div className="flex items-center gap-2">
          <div className="inline-flex rounded-xl border border-[#E5DCD3] bg-white p-1 shadow-sm">
            {[
              { id: '7d', label: '7D' },
              { id: '30d', label: '30D' },
              { id: '90d', label: '90D' },
              { id: '6m', label: '6M' },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setRange(t.id)}
                className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-all ${
                  range === t.id
                    ? 'bg-[#1C1917] text-[#F7F4EF] shadow-sm'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <Button
            variant="outline"
            size="sm"
            icon={ArrowClockwise}
            onClick={() => fetchAnalytics(range)}
            disabled={loading}
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* Editorial Navigation Tabs */}
      <BlogSubNav />

      {/* Hero KPI Cards Row */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        {/* Total Views */}
        <div className="rounded-2xl border border-[#E5DCD3] bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500">Total Views</span>
            <div className="h-7 w-7 rounded-xl bg-stone-100 flex items-center justify-center text-stone-800 border border-stone-200">
              <Eye size={15} />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold tracking-tight text-[#1C1917] tabular-nums">
            {kpis.totalViews?.toLocaleString() || 0}
          </div>
          <div className="mt-1 flex items-center gap-1 text-[11px]">
            {kpis.viewsTrendPercent >= 0 ? (
              <span className="inline-flex items-center font-semibold text-emerald-600">
                <TrendUp size={12} className="mr-0.5" />
                +{kpis.viewsTrendPercent}%
              </span>
            ) : (
              <span className="inline-flex items-center font-semibold text-rose-600">
                <TrendDown size={12} className="mr-0.5" />
                {kpis.viewsTrendPercent}%
              </span>
            )}
            <span className="text-stone-400">vs prev {range}</span>
          </div>
        </div>

        {/* Avg Read Completion */}
        <div className="rounded-2xl border border-[#E5DCD3] bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-800">Read Completion</span>
            <div className="h-7 w-7 rounded-xl bg-amber-100 flex items-center justify-center text-amber-800 border border-amber-200">
              <Clock size={15} />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold tracking-tight text-[#1C1917] tabular-nums">
            {kpis.avgReadCompletionRate || 0}%
          </div>
          <div className="mt-1 flex items-center gap-1 text-[11px]">
            <span className="font-semibold text-stone-600">Depth ≥ 90%</span>
            <span className="text-stone-400">of article</span>
          </div>
        </div>

        {/* Total Comments */}
        <div className="rounded-2xl border border-[#E5DCD3] bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800">Discussions</span>
            <div className="h-7 w-7 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-800 border border-emerald-200">
              <ChatCircleDots size={15} />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold tracking-tight text-[#1C1917] tabular-nums">
            {kpis.totalComments?.toLocaleString() || 0}
          </div>
          <div className="mt-1 flex items-center gap-1 text-[11px]">
            <span className="font-semibold text-emerald-700">Community thoughts</span>
          </div>
        </div>

        {/* CTA Conversions */}
        <div className="rounded-2xl border border-[#E5DCD3] bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#8C532B]">Enquiry Leads</span>
            <div className="h-7 w-7 rounded-xl bg-amber-50 flex items-center justify-center text-[#8C532B] border border-amber-200">
              <CursorClick size={15} />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold tracking-tight text-[#1C1917] tabular-nums">
            {kpis.totalCtaClicks?.toLocaleString() || 0}
          </div>
          <div className="mt-1 flex items-center gap-1 text-[11px]">
            <span className="font-semibold text-[#8C532B]">CTA In-article clicks</span>
          </div>
        </div>

        {/* Active Catalog */}
        <div className="rounded-2xl border border-[#E5DCD3] bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500">Live Articles</span>
            <div className="h-7 w-7 rounded-xl bg-stone-100 flex items-center justify-center text-stone-800 border border-stone-200">
              <BookOpenText size={15} />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold tracking-tight text-[#1C1917] tabular-nums">
            {kpis.publishedArticles || 0}
          </div>
          <div className="mt-1 flex items-center gap-1 text-[11px] text-stone-400">
            <span>of {kpis.totalArticles || 0} written stories</span>
          </div>
        </div>
      </div>

      {/* Main Charts Section */}
      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-[35vh] gap-3 rounded-2xl border border-[#E5DCD3] bg-white">
          <CircleNotch size={26} className="animate-spin text-stone-600" />
          <p className="text-xs text-stone-500 font-medium">Aggregating time-series metrics...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Chart 1: Audience & Readership Trend (Area Chart) */}
          <div className="lg:col-span-2 rounded-2xl border border-[#E5DCD3] bg-white p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
              <div>
                <h3 className="text-sm font-bold text-[#1C1917]">Audience Impressions &amp; Readership Depth</h3>
                <p className="text-xs text-stone-500">Daily views vs complete read-throughs (scrolled ≥ 90%)</p>
              </div>
              <div className="flex items-center gap-4 text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#8C532B]" />
                  <span className="text-stone-600 font-medium">Views</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#C29555]" />
                  <span className="text-stone-600 font-medium">Read Completions</span>
                </div>
              </div>
            </div>

            {/* Interactive SVG Curve */}
            <div className="relative w-full overflow-hidden">
              <svg
                viewBox={`0 0 ${chartWidth} ${chartHeight}`}
                className="w-full h-auto overflow-visible"
              >
                <defs>
                  <linearGradient id="terracottaGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#8C532B" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="#8C532B" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Grid horizontal lines */}
                {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
                  const y = padding.top + (chartHeight - padding.top - padding.bottom) * (1 - ratio);
                  const val = Math.round(maxViewVal * ratio);
                  return (
                    <g key={ratio}>
                      <line
                        x1={padding.left}
                        y1={y}
                        x2={chartWidth - padding.right}
                        y2={y}
                        stroke="#E5DCD3"
                        strokeDasharray="3 3"
                      />
                      <text
                        x={padding.left - 8}
                        y={y + 3}
                        fontSize="9"
                        fill="#A8A29E"
                        textAnchor="end"
                      >
                        {val}
                      </text>
                    </g>
                  );
                })}

                {/* Area Gradient */}
                {areaPath && <path d={areaPath} fill="url(#terracottaGradient)" />}

                {/* Views Line */}
                {linePath && (
                  <path
                    d={linePath}
                    fill="none"
                    stroke="#8C532B"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                )}

                {/* Read Completes Line */}
                {readLinePath && (
                  <path
                    d={readLinePath}
                    fill="none"
                    stroke="#C29555"
                    strokeWidth="2"
                    strokeDasharray="4 4"
                    strokeLinecap="round"
                  />
                )}

                {/* Interactive Points */}
                {chartPoints.map((pt, i) => (
                  <circle
                    key={i}
                    cx={pt.x}
                    cy={pt.yViews}
                    r={hoveredPoint?.date === pt.date ? 5 : 2.5}
                    fill="#FFFFFF"
                    stroke="#8C532B"
                    strokeWidth={hoveredPoint?.date === pt.date ? 3 : 1.5}
                    className="cursor-pointer transition-all"
                    onMouseEnter={() => setHoveredPoint(pt)}
                  />
                ))}
              </svg>

              {/* Tooltip Overlay */}
              {hoveredPoint && (
                <div
                  className="absolute z-10 rounded-xl bg-[#1C1917] px-3 py-2 text-xs text-white shadow-xl pointer-events-none"
                  style={{
                    left: `${(hoveredPoint.x / chartWidth) * 100}%`,
                    top: '20px',
                    transform: 'translateX(-50%)',
                  }}
                >
                  <p className="font-semibold text-amber-300">{hoveredPoint.label}</p>
                  <div className="mt-1 space-y-0.5 text-[11px]">
                    <p className="text-stone-300">Views: <strong className="text-white">{hoveredPoint.views}</strong></p>
                    <p className="text-stone-300">Read Complete: <strong className="text-white">{hoveredPoint.readCompletes}</strong></p>
                    {hoveredPoint.ctaClicks > 0 && (
                      <p className="text-amber-200">CTA Clicks: <strong>{hoveredPoint.ctaClicks}</strong></p>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-between mt-2 px-6 text-[10px] text-stone-400">
              <span>{audienceTrend[0]?.label || ''}</span>
              <span>{audienceTrend[Math.floor(audienceTrend.length / 2)]?.label || ''}</span>
              <span>{audienceTrend[audienceTrend.length - 1]?.label || ''}</span>
            </div>
          </div>

          {/* Chart 2: Category Performance Distribution */}
          <div className="rounded-2xl border border-[#E5DCD3] bg-white p-6 shadow-sm flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-bold text-[#1C1917]">Category Performance Share</h3>
              <p className="text-xs text-stone-500 mb-4">Readership distribution across editorial topics</p>

              {categoryShare.length === 0 ? (
                <div className="py-12 text-center text-xs text-stone-400">No categories published yet</div>
              ) : (
                <div className="space-y-4">
                  {categoryShare.map((cat) => (
                    <div key={cat.category}>
                      <div className="flex justify-between text-xs font-semibold text-stone-700 mb-1">
                        <span>{cat.category}</span>
                        <span className="text-stone-500">{cat.sharePercent}% ({cat.views} views)</span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-stone-100 overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-[#8C532B] to-[#C29555] rounded-full transition-all duration-500"
                          style={{ width: `${Math.max(5, cat.sharePercent)}%` }}
                        />
                      </div>
                      <div className="mt-1 flex justify-between text-[10px] text-stone-400">
                        <span>{cat.postsCount} {cat.postsCount === 1 ? 'article' : 'articles'}</span>
                        <span>{Math.round(cat.views / Math.max(1, cat.postsCount))} avg views/post</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="mt-6 rounded-xl border border-[#E5DCD3] bg-stone-50 p-3 text-xs text-stone-600">
              <span className="font-semibold text-stone-800">Editorial Strategy Tip:</span>
              <p className="mt-0.5 text-stone-600">
                Wedding planning and venue guides generate high-intent search traffic, while real love stories drive the highest read-completion and sharing rates.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Second Row: Comments Health & Publishing Cadence */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Comments Activity Chart */}
        <div className="rounded-2xl border border-[#E5DCD3] bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-[#1C1917]">Community Conversation Activity</h3>
              <p className="text-xs text-stone-500">Approved reader comments vs pending and spam</p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-sm bg-emerald-600" /> Approved</span>
              <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-sm bg-amber-500" /> Pending</span>
              <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-sm bg-rose-500" /> Spam</span>
            </div>
          </div>

          <div className="h-44 flex items-end gap-1 pt-6 pb-2 px-2 border-b border-[#E5DCD3]">
            {commentsTrend.slice(-14).map((pt, idx) => {
              const maxC = Math.max(5, Math.max(...commentsTrend.map((c) => c.total || 0)));
              const approvedH = ((pt.approved || 0) / maxC) * 120;
              const pendingH = ((pt.pending || 0) / maxC) * 120;
              const spamH = ((pt.spam || 0) / maxC) * 120;

              return (
                <div key={idx} className="flex-1 flex flex-col items-center justify-end h-full group relative">
                  <div className="w-full max-w-[16px] flex flex-col gap-0.5 justify-end">
                    {spamH > 0 && <div style={{ height: `${spamH}px` }} className="bg-rose-500 rounded-sm" />}
                    {pendingH > 0 && <div style={{ height: `${pendingH}px` }} className="bg-amber-500 rounded-sm" />}
                    {approvedH > 0 && <div style={{ height: `${approvedH}px` }} className="bg-emerald-600 rounded-sm" />}
                  </div>

                  {/* Tooltip */}
                  <div className="absolute bottom-full mb-2 hidden group-hover:flex flex-col rounded-lg bg-[#1C1917] p-2 text-[10px] text-white shadow-md z-10 whitespace-nowrap">
                    <span className="font-bold">{pt.label}</span>
                    <span className="text-emerald-400">Approved: {pt.approved}</span>
                    <span className="text-amber-300">Pending: {pt.pending}</span>
                    <span className="text-rose-400">Spam: {pt.spam}</span>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="flex justify-between mt-2 text-[10px] text-stone-400">
            <span>Past 14 Days</span>
            <span>Today</span>
          </div>
        </div>

        {/* Publishing Velocity */}
        <div className="rounded-2xl border border-[#E5DCD3] bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-[#1C1917]">Editorial Publishing Velocity</h3>
              <p className="text-xs text-stone-500">Stories published monthly over the past 6 months</p>
            </div>
            <span className="rounded-full bg-stone-100 px-2.5 py-0.5 text-xs font-semibold text-stone-700">
              6-Month Cadence
            </span>
          </div>

          <div className="h-44 flex items-end gap-3 pt-6 pb-2 px-4 border-b border-[#E5DCD3]">
            {velocity.length === 0 ? (
              <div className="w-full flex items-center justify-center text-xs text-stone-400">
                No published stories recorded in range
              </div>
            ) : (
              velocity.map((v, idx) => {
                const maxV = Math.max(5, Math.max(...velocity.map((m) => m.count || 0)));
                const h = (v.count / maxV) * 120;
                return (
                  <div key={idx} className="flex-1 flex flex-col items-center justify-end h-full">
                    <span className="text-[11px] font-bold text-stone-700 mb-1">{v.count}</span>
                    <div
                      style={{ height: `${Math.max(8, h)}px` }}
                      className="w-full max-w-[28px] bg-gradient-to-t from-[#1C1917] to-stone-600 rounded-t-md transition-all"
                    />
                    <span className="text-[10px] font-semibold text-stone-500 mt-2 truncate w-full text-center">
                      {v.label}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Top Stories Performance Table */}
      <div className="rounded-2xl border border-[#E5DCD3] bg-white p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
          <div>
            <h3 className="text-base font-bold text-[#1C1917]">Top Performing Editorial Stories</h3>
            <p className="text-xs text-stone-500">Ranked by reader impressions, completion rates, and conversions</p>
          </div>
        </div>

        {topStories.length === 0 ? (
          <div className="py-12 text-center text-xs text-stone-400">
            No story impressions recorded in this time range.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-stone-600">
              <thead className="border-b border-[#E5DCD3] bg-stone-50/70 text-[11px] font-bold uppercase tracking-wider text-stone-500">
                <tr>
                  <th className="py-3 px-4">#</th>
                  <th className="py-3 px-4">Story Title</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4 text-right">Views</th>
                  <th className="py-3 px-4 text-right">Read Depth</th>
                  <th className="py-3 px-4 text-right">Comments</th>
                  <th className="py-3 px-4 text-right">CTA Leads</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {topStories.map((story, idx) => (
                  <tr key={story.id || idx} className="hover:bg-stone-50/50 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-stone-400">#{idx + 1}</td>
                    <td className="py-3.5 px-4 font-semibold text-[#1C1917] max-w-sm">
                      <Link
                        href={`/blogs/${story.slug}`}
                        target="_blank"
                        className="hover:text-[#8C532B] transition-colors line-clamp-1"
                      >
                        {story.title}
                      </Link>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="rounded-md bg-stone-100 px-2 py-0.5 text-[10px] font-medium text-stone-700">
                        {story.category}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right font-semibold text-[#1C1917] tabular-nums">
                      {story.views?.toLocaleString() || 0}
                    </td>
                    <td className="py-3.5 px-4 text-right tabular-nums">
                      <div className="inline-flex items-center gap-2">
                        <span className="font-semibold text-stone-800">{story.completionRate}%</span>
                        <div className="h-1.5 w-12 rounded-full bg-stone-200 overflow-hidden">
                          <div
                            className="h-full bg-[#8C532B] rounded-full"
                            style={{ width: `${story.completionRate}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-right font-medium text-stone-700 tabular-nums">
                      {story.comments || 0}
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold text-[#8C532B] tabular-nums">
                      {story.ctaClicks || 0}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
