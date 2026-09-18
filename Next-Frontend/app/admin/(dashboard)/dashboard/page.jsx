'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  SquaresFour,
  PhoneCall,
  Images,
  BookOpenText,
  ShieldCheck,
  CalendarBlank,
  FilmSlate,
  Plus,
  ArrowRight,
  ArrowSquareOut,
  CaretRight,
  Compass,
  Sparkle,
  SlidersHorizontal,
  CircleNotch,
} from '@phosphor-icons/react';
import { useAuth } from '@/Context/AdminAuthContext.jsx';
import { useStudioDetails } from '@/Context/StudioDetailsContext.jsx';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/app/admin/components/ui/Card.jsx';
import { Button } from '@/app/admin/components/ui/Button.jsx';
import { Badge } from '@/app/admin/components/ui/Badge.jsx';
import { apiFetch } from '@/lib/apiClient.js';

export default function DashboardPage() {
  const { user, role, loading: authLoading, isAdminValid } = useAuth() || {};
  const { studioName } = useStudioDetails();
  const router = useRouter();

  const [stats, setStats] = useState({
    enquiries: [],
    unreadCount: 0,
    mediaCount: 0,
    blogsCount: 0,
    loading: true,
  });

  // Auth gate
  useEffect(() => {
    if (!authLoading && !isAdminValid) {
      router.push('/admin/login');
    }
  }, [authLoading, isAdminValid, router]);

  // Fetch real-time dashboard data
  const loadDashboardData = useCallback(async () => {
    try {
      // 1. Fetch inquiries
      const resInq = await apiFetch('/api/admin/get-clients-enquiry', { method: 'GET' });
      const inqData = await resInq.json().catch(() => ({}));
      const enquiries = Array.isArray(inqData?.allInquiries) ? inqData.allInquiries : [];
      const unread = enquiries.filter((i) => !i.isViewed).length;

      // 2. Fetch media list count
      let mediaCount = 0;
      try {
        const resMedia = await apiFetch('/api/admin/media?limit=1', { method: 'GET' });
        const mediaData = await resMedia.json().catch(() => ({}));
        mediaCount = mediaData?.total || 0;
      } catch {
        mediaCount = 0;
      }

      // 3. Fetch blogs count
      let blogsCount = 0;
      try {
        const resBlogs = await apiFetch('/api/blogs', { method: 'GET' });
        const blogsData = await resBlogs.json().catch(() => ({}));
        blogsCount = Array.isArray(blogsData) ? blogsData.length : blogsData?.posts?.length || 0;
      } catch {
        blogsCount = 0;
      }

      setStats({
        enquiries,
        unreadCount: unread,
        mediaCount,
        blogsCount,
        loading: false,
      });
    } catch (err) {
      console.error('Dashboard load error:', err);
      setStats((prev) => ({ ...prev, loading: false }));
    }
  }, []);

  useEffect(() => {
    if (isAdminValid) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      loadDashboardData();
    }
  }, [isAdminValid, loadDashboardData]);

  if (authLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3 font-sans">
        <CircleNotch size={28} className="animate-spin text-stone-600" />
        <p className="text-xs font-medium text-stone-600 tracking-wide">Loading Studio Workspace...</p>
      </div>
    );
  }

  if (!isAdminValid) return null;

  const todayStr = new Intl.DateTimeFormat('en-IN', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date());

  const recentEnquiries = stats.enquiries.slice(0, 5);

  return (
    <div className="space-y-6 pb-12 font-sans">
      {/* 1. Sleek Studio Command Bar */}
      <div className="bg-gradient-to-br from-white to-red-50 rounded-2xl border border-red-100 p-5 sm:p-6 shadow-sm shadow-red-900/5 relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="space-y-1">
            
            <div className="flex items-center gap-2">
              <Badge variant="luxury" size="sm" dot dotColor="bg-white">
                Studio Cockpit
              </Badge>
              <span className="text-xs text-stone-500 font-sans tabular-nums">{todayStr}</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-sans font-bold tracking-tight text-[#2F2F2F]">
              Welcome back, {user?.name || 'Administrator'}
            </h1>

            <p className="text-xs sm:text-sm text-stone-600 font-sans max-w-2xl leading-relaxed">
              Real-time overview of {studioName || 'The Wedding Boys'} production pipeline, couple inquiries, editorial releases, and Cloudflare media assets.
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <Link href="/admin/blogs">
              <Button variant="luxury" size="sm" icon={Plus}>
                New Blog Post
              </Button>
            </Link>

            <Link href="/admin/media">
              <Button variant="outline" size="sm" icon={Images}>
                Media Library
              </Button>
            </Link>

            <Link href="/" target="_blank" rel="noopener noreferrer">
              <Button variant="secondary" size="sm" iconRight={ArrowSquareOut}>
                Live Website
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* 2. Key Performance Indicators (KPIs) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Enquiries KPI */}
        <Card className="border-[#E5DCD3] bg-white shadow-sm hover:border-stone-400 transition-all">
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider">
                Client Enquiries
              </span>
              <div className="w-8 h-8 rounded-lg bg-red-50 border border-red-100 flex items-center justify-center text-red-500">
                <PhoneCall size={16} />
              </div>
            </div>
            <div className="mt-2.5 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-[#2F2F2F] tabular-nums">
                {stats.loading ? '—' : stats.enquiries.length}
              </span>
              {stats.unreadCount > 0 && (
                <Badge variant="warning" size="sm">
                  {stats.unreadCount} new
                </Badge>
              )}
            </div>
            <div className="mt-2.5 flex items-center justify-between text-xs text-stone-500 pt-2 border-t border-stone-100">
              <Link
                href="/admin/total-Enquires"
                className="text-red-600 hover:text-[#2F2F2F] font-semibold inline-flex items-center gap-1 group"
              >
                Open Pipeline
                <ArrowRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
              </Link>
              <span className="tabular-nums">Couples</span>
            </div>
          </CardContent>
        </Card>

        {/* Media Assets KPI */}
        <Card className="border-[#E5DCD3] bg-white shadow-sm hover:border-stone-400 transition-all">
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider">
                Cloud Media Assets
              </span>
              <div className="w-8 h-8 rounded-lg bg-red-50 border border-red-100 flex items-center justify-center text-red-500">
                <Images size={16} />
              </div>
            </div>
            <div className="mt-2.5 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-[#2F2F2F] tabular-nums">
                {stats.loading ? '—' : stats.mediaCount}
              </span>
              <Badge variant="gold" size="sm">
                Cloudflare R2
              </Badge>
            </div>
            <div className="mt-2.5 flex items-center justify-between text-xs text-stone-500 pt-2 border-t border-stone-100">
              <Link
                href="/admin/media"
                className="text-red-600 hover:text-[#2F2F2F] font-semibold inline-flex items-center gap-1 group"
              >
                Asset Storage
                <ArrowRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
              </Link>
              <span>CDN Optimized</span>
            </div>
          </CardContent>
        </Card>

        {/* Published Articles KPI */}
        <Card className="border-[#E5DCD3] bg-white shadow-sm hover:border-stone-400 transition-all">
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider">
                Editorial Blogs
              </span>
              <div className="w-8 h-8 rounded-lg bg-red-50 border border-red-100 flex items-center justify-center text-red-500">
                <BookOpenText size={16} />
              </div>
            </div>
            <div className="mt-2.5 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-[#2F2F2F] tabular-nums">
                {stats.loading ? '—' : stats.blogsCount}
              </span>
              <Badge variant="terracotta" size="sm">
                SEO Live
              </Badge>
            </div>
            <div className="mt-2.5 flex items-center justify-between text-xs text-stone-500 pt-2 border-t border-stone-100">
              <Link
                href="/admin/blogs"
                className="text-[#A3603A] hover:text-[#1C1917] font-semibold inline-flex items-center gap-1 group"
              >
                Manage Posts
                <ArrowRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
              </Link>
              <span>Articles</span>
            </div>
          </CardContent>
        </Card>

        {/* Security & Access KPI */}
        <Card className="border-stone-200 bg-white shadow-sm hover:border-stone-400 transition-all">
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider">
                Security Posture
              </span>
              <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700">
                <ShieldCheck size={16} />
              </div>
            </div>
            <div className="mt-2.5 flex items-baseline gap-2">
              <span className="text-xl font-bold text-[#2F2F2F]">
                {user?.mfaEnabled ? 'Secured' : 'Attention'}
              </span>
              <Badge variant={user?.mfaEnabled ? 'success' : 'warning'} size="sm">
                {user?.mfaEnabled ? '2FA Enabled' : 'Enable 2FA'}
              </Badge>
            </div>
            <div className="mt-2.5 flex items-center justify-between text-xs text-stone-500 pt-2 border-t border-stone-100">
              <Link
                href="/admin/security"
                className="text-red-600 hover:text-[#2F2F2F] font-semibold inline-flex items-center gap-1 group"
              >
                Security Center
                <ArrowRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
              </Link>
              <span className="tabular-nums">{role || 'SuperAdmin'}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 3. Main Workspace Grid: Recent Inquiries + Shortcuts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Recent Couple Inquiries */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="border-[#E5DCD3] bg-white shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-stone-100">
              <div>
                <CardTitle className="text-sm font-bold text-[#2F2F2F] font-sans">
                  Recent Client Enquiries
                </CardTitle>
                <CardDescription className="text-xs text-stone-500 font-sans">
                  Latest couple submissions received from the wedding marketing portal
                </CardDescription>
              </div>
              <Link href="/admin/total-Enquires">
                <Button variant="secondary" size="sm" iconRight={ArrowRight}>
                  View All
                </Button>
              </Link>
            </CardHeader>

            <CardContent className="p-0">
              {stats.loading ? (
                <div className="p-8 text-center text-xs text-stone-500">Loading inquiries...</div>
              ) : recentEnquiries.length === 0 ? (
                <div className="p-10 text-center text-xs text-stone-500">
                  No inquiries recorded yet.
                </div>
              ) : (
                <div className="divide-y divide-stone-100">
                  {recentEnquiries.map((inq) => (
                    <div
                      key={inq._id}
                      className="p-3.5 sm:px-5 hover:bg-stone-50 transition-colors flex items-center justify-between gap-4"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs font-bold text-[#2F2F2F] truncate font-sans">
                            {inq.Bride || 'Bride'} & {inq.Groom || 'Groom'}
                          </h4>
                          {!inq.isViewed && (
                            <Badge variant="gold" size="sm">
                              New
                            </Badge>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-3 text-xs text-stone-600 mt-1 font-sans">
                          {inq.Contact && (
                            <span className="flex items-center gap-1 font-medium text-stone-800 tabular-nums">
                              <PhoneCall size={13} className="text-stone-400" />
                              {inq.Contact}
                            </span>
                          )}
                          {inq.Date?.start && (
                            <span className="flex items-center gap-1 text-stone-600 tabular-nums whitespace-nowrap">
                              <CalendarBlank size={13} className="text-stone-400" />
                              {inq.Date.start}
                            </span>
                          )}
                          {inq.Reach && (
                            <span className="flex items-center gap-1 text-stone-500 text-[11px]">
                              <Compass size={13} className="text-stone-400" />
                              {inq.Reach}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="shrink-0">
                        <Link href="/admin/total-Enquires">
                          <Button variant="ghost" size="sm" iconRight={CaretRight}>
                            Review
                          </Button>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right 1 Col: Quick Studio Shortcuts */}
        <div className="space-y-4">
          <Card className="border-[#E5DCD3] bg-white shadow-sm">
            <CardHeader className="pb-3 border-b border-stone-100">
              <CardTitle className="text-sm font-bold text-[#2F2F2F] font-sans">
                Studio Shortcuts
              </CardTitle>
              <CardDescription className="text-xs text-stone-500 font-sans">
                Fast navigation to primary management modules
              </CardDescription>
            </CardHeader>

            <CardContent className="p-3 space-y-2">
              <Link
                href="/admin/website-setting/home"
                className="flex items-center justify-between p-2.5 rounded-xl bg-stone-50/80 hover:bg-red-50/50 border border-stone-200/70 hover:border-red-100 transition-all group cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-white border border-stone-200 flex items-center justify-center text-red-500 shadow-sm">
                    <Sparkle size={16} />
                  </div>
                  <div>
                    <h5 className="text-xs font-semibold text-[#2F2F2F] group-hover:text-red-600 transition-colors">
                      Home Page Experience
                    </h5>
                    <p className="text-[11px] text-stone-500">Hero banners, reviews & maps</p>
                  </div>
                </div>
                <CaretRight size={14} className="text-stone-400 group-hover:translate-x-0.5 transition-transform" />
              </Link>

              <Link
                href="/admin/website-setting/films"
                className="flex items-center justify-between p-2.5 rounded-xl bg-stone-50/80 hover:bg-red-50/50 border border-stone-200/70 hover:border-red-100 transition-all group cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-white border border-stone-200 flex items-center justify-center text-red-500 shadow-sm">
                    <FilmSlate size={16} />
                  </div>
                  <div>
                    <h5 className="text-xs font-semibold text-[#2F2F2F] group-hover:text-red-600 transition-colors">
                      Cinematic Films
                    </h5>
                    <p className="text-[11px] text-stone-500">Trailers, teasers & stories</p>
                  </div>
                </div>
                <CaretRight size={14} className="text-stone-400 group-hover:translate-x-0.5 transition-transform" />
              </Link>

              <Link
                href="/admin/content"
                className="flex items-center justify-between p-2.5 rounded-xl bg-stone-50/80 hover:bg-red-50/50 border border-stone-200/70 hover:border-red-100 transition-all group cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-white border border-stone-200 flex items-center justify-center text-red-500 shadow-sm">
                    <BookOpenText size={16} />
                  </div>
                  <div>
                    <h5 className="text-xs font-semibold text-[#2F2F2F] group-hover:text-red-600 transition-colors">
                      Page Content CMS
                    </h5>
                    <p className="text-[11px] text-stone-500">Varanasi, Dharaa, About Us</p>
                  </div>
                </div>
                <CaretRight size={14} className="text-stone-400 group-hover:translate-x-0.5 transition-transform" />
              </Link>

              <Link
                href="/admin/studio-setting"
                className="flex items-center justify-between p-2.5 rounded-xl bg-stone-50/80 hover:bg-red-50/50 border border-stone-200/70 hover:border-red-100 transition-all group cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-white border border-stone-200 flex items-center justify-center text-red-500 shadow-sm">
                    <SlidersHorizontal size={16} />
                  </div>
                  <div>
                    <h5 className="text-xs font-semibold text-[#2F2F2F] group-hover:text-red-600 transition-colors">
                      Studio Info & Contact
                    </h5>
                    <p className="text-[11px] text-stone-500">Phone, address, social channels</p>
                  </div>
                </div>
                <CaretRight size={14} className="text-stone-400 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
