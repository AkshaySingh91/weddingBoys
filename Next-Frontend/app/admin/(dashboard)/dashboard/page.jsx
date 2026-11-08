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
  WhatsappLogo,
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
        <CircleNotch size={28} className="animate-spin text-ink-secondary" />
        <p className="text-xs font-medium text-ink-secondary tracking-wide">Loading…</p>
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
      <div className="rounded-xl border border-edge-subtle bg-ground-raised p-5 shadow-panel sm:p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="space-y-1">
            <p className="text-xs text-ink-muted font-sans tabular-nums">{todayStr}</p>

            <h1 className="text-2xl sm:text-3xl font-sans font-bold tracking-tight text-ink">
              Welcome back{user?.name ? `, ${user.name.split(' ')[0]}` : ''}
            </h1>

            <p className="text-sm text-ink-secondary font-sans max-w-2xl leading-relaxed">
              {stats.loading
                ? 'Checking for new enquiries…'
                : stats.unreadCount > 0
                  ? `${stats.unreadCount} new ${stats.unreadCount === 1 ? 'enquiry is' : 'enquiries are'} waiting for a reply.`
                  : 'No new enquiries. You’re all caught up.'}
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <Link href="/admin/blogs/create">
              <Button variant="primary" size="sm" icon={Plus}>
                New story
              </Button>
            </Link>

            <Link href="/admin/media">
              <Button variant="secondary" size="sm" icon={Images}>
                Media library
              </Button>
            </Link>

            <Link href="/" target="_blank" rel="noopener noreferrer">
              <Button variant="ghost" size="sm" iconRight={ArrowSquareOut}>
                View website
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* 2. Key Performance Indicators (KPIs) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Enquiries KPI */}
        <Card className="border-edge-subtle bg-white shadow-sm hover:border-edge-strong transition-all">
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-ink-muted uppercase tracking-wider">
                Client Enquiries
              </span>
              <div className="w-8 h-8 rounded-lg bg-accent-wash border border-accent/25 flex items-center justify-center text-accent-ink">
                <PhoneCall size={16} />
              </div>
            </div>
            <div className="mt-2.5 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-ink tabular-nums">
                {stats.loading ? '—' : stats.enquiries.length}
              </span>
              {stats.unreadCount > 0 && (
                <Badge variant="warning" size="sm">
                  {stats.unreadCount} new
                </Badge>
              )}
            </div>
            <div className="mt-2.5 flex items-center justify-between text-xs text-ink-muted pt-2 border-t border-edge-subtle">
              <Link
                href="/admin/total-Enquires"
                className="text-accent-ink hover:text-ink font-semibold inline-flex items-center gap-1 group"
              >
                All enquiries
                <ArrowRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Media Assets KPI */}
        <Card className="border-edge-subtle bg-white shadow-sm hover:border-edge-strong transition-all">
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-ink-muted uppercase tracking-wider">
                Media library
              </span>
              <div className="w-8 h-8 rounded-lg bg-accent-wash border border-accent/25 flex items-center justify-center text-accent-ink">
                <Images size={16} />
              </div>
            </div>
            <div className="mt-2.5 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-ink tabular-nums">
                {stats.loading ? '—' : stats.mediaCount}
              </span>
              <span className="text-xs text-ink-muted">files</span>
            </div>
            <div className="mt-2.5 flex items-center justify-between text-xs text-ink-muted pt-2 border-t border-edge-subtle">
              <Link
                href="/admin/media"
                className="text-accent-ink hover:text-ink font-semibold inline-flex items-center gap-1 group"
              >
                Open library
                <ArrowRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Published Articles KPI */}
        <Card className="border-edge-subtle bg-white shadow-sm hover:border-edge-strong transition-all">
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-ink-muted uppercase tracking-wider">
                Published stories
              </span>
              <div className="w-8 h-8 rounded-lg bg-accent-wash border border-accent/25 flex items-center justify-center text-accent-ink">
                <BookOpenText size={16} />
              </div>
            </div>
            <div className="mt-2.5 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-ink tabular-nums">
                {stats.loading ? '—' : stats.blogsCount}
              </span>
              <span className="text-xs text-ink-muted">on the journal</span>
            </div>
            <div className="mt-2.5 flex items-center justify-between text-xs text-ink-muted pt-2 border-t border-edge-subtle">
              <Link
                href="/admin/blogs"
                className="text-accent-ink hover:text-ink font-semibold inline-flex items-center gap-1 group"
              >
                All stories
                <ArrowRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Security & Access KPI */}
        <Card className="border-edge-subtle bg-white shadow-sm hover:border-edge-strong transition-all">
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-ink-muted uppercase tracking-wider">
                Two-step sign-in
              </span>
              <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700">
                <ShieldCheck size={16} />
              </div>
            </div>
            <div className="mt-2.5 flex items-baseline gap-2">
              <span className="text-xl font-bold text-ink">
                {user?.mfaEnabled ? 'On' : 'Off'}
              </span>
              <Badge variant={user?.mfaEnabled ? 'success' : 'warning'} size="sm">
                {user?.mfaEnabled ? 'Protected' : 'Turn it on'}
              </Badge>
            </div>
            <div className="mt-2.5 flex items-center justify-between text-xs text-ink-muted pt-2 border-t border-edge-subtle">
              <Link
                href="/admin/security"
                className="text-accent-ink hover:text-ink font-semibold inline-flex items-center gap-1 group"
              >
                Security
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
          <Card className="border-edge-subtle bg-white shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-edge-subtle">
              <div>
                <CardTitle className="text-sm font-bold text-ink font-sans">
                  Recent enquiries
                </CardTitle>
                <CardDescription className="text-xs text-ink-muted font-sans">
                  Newest first. Reply on WhatsApp straight from here.
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
                <div className="p-8 text-center text-xs text-ink-muted">Loading inquiries...</div>
              ) : recentEnquiries.length === 0 ? (
                <div className="p-10 text-center text-xs text-ink-muted">
                  No inquiries recorded yet.
                </div>
              ) : (
                <div className="divide-y divide-edge-subtle">
                  {recentEnquiries.map((inq) => (
                    <div
                      key={inq._id}
                      className="p-3.5 sm:px-5 hover:bg-ground transition-colors flex items-center justify-between gap-4"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs font-bold text-ink truncate font-sans">
                            {inq.Bride || 'Bride'} & {inq.Groom || 'Groom'}
                          </h4>
                          {!inq.isViewed && (
                            <Badge variant="terracotta" size="sm">
                              New
                            </Badge>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-3 text-xs text-ink-secondary mt-1 font-sans">
                          {inq.Contact && (
                            <span className="flex items-center gap-1 font-medium text-ink tabular-nums">
                              <PhoneCall size={13} className="text-ink-muted" />
                              {inq.Contact}
                            </span>
                          )}
                          {inq.Date?.start && (
                            <span className="flex items-center gap-1 text-ink-secondary tabular-nums whitespace-nowrap">
                              <CalendarBlank size={13} className="text-ink-muted" />
                              {inq.Date.start}
                            </span>
                          )}
                          {inq.Reach && (
                            <span className="flex items-center gap-1 text-ink-muted text-[11px]">
                              <Compass size={13} className="text-ink-muted" />
                              {inq.Reach}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex shrink-0 items-center gap-1.5">
                        {inq.Contact && !String(inq.Contact).includes('@') && (
                          <a
                            href={`https://wa.me/${String(inq.Contact).replace(/[^0-9]/g, '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label={`WhatsApp ${inq.Bride || ''} and ${inq.Groom || ''}`}
                            className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-edge-strong bg-ground-raised px-2.5 text-xs font-medium text-ink transition-colors hover:bg-ground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                          >
                            <WhatsappLogo size={15} aria-hidden="true" />
                            <span className="hidden sm:inline">WhatsApp</span>
                          </a>
                        )}
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
          <Card className="border-edge-subtle bg-white shadow-sm">
            <CardHeader className="pb-3 border-b border-edge-subtle">
              <CardTitle className="text-sm font-bold text-ink font-sans">
                Shortcuts
              </CardTitle>
              <CardDescription className="text-xs text-ink-muted font-sans">
                The pages you edit most
              </CardDescription>
            </CardHeader>

            <CardContent className="p-3 space-y-2">
              <Link
                href="/admin/website-setting/home"
                className="flex items-center justify-between p-2.5 rounded-xl bg-ground/80 hover:bg-accent-wash/50 border border-edge-subtle hover:border-accent/25 transition-all group cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-white border border-edge-subtle flex items-center justify-center text-accent-ink shadow-sm">
                    <Sparkle size={16} />
                  </div>
                  <div>
                    <h5 className="text-xs font-semibold text-ink group-hover:text-accent-ink transition-colors">
                      Home page
                    </h5>
                    <p className="text-[11px] text-ink-muted">Hero banners, reviews & maps</p>
                  </div>
                </div>
                <CaretRight size={14} className="text-ink-muted group-hover:translate-x-0.5 transition-transform" />
              </Link>

              <Link
                href="/admin/content/films"
                className="flex items-center justify-between p-2.5 rounded-xl bg-ground/80 hover:bg-accent-wash/50 border border-edge-subtle hover:border-accent/25 transition-all group cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-white border border-edge-subtle flex items-center justify-center text-accent-ink shadow-sm">
                    <FilmSlate size={16} />
                  </div>
                  <div>
                    <h5 className="text-xs font-semibold text-ink group-hover:text-accent-ink transition-colors">
                      Cinematic Films
                    </h5>
                    <p className="text-[11px] text-ink-muted">Trailers, teasers & stories</p>
                  </div>
                </div>
                <CaretRight size={14} className="text-ink-muted group-hover:translate-x-0.5 transition-transform" />
              </Link>

              <Link
                href="/admin/content"
                className="flex items-center justify-between p-2.5 rounded-xl bg-ground/80 hover:bg-accent-wash/50 border border-edge-subtle hover:border-accent/25 transition-all group cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-white border border-edge-subtle flex items-center justify-center text-accent-ink shadow-sm">
                    <BookOpenText size={16} />
                  </div>
                  <div>
                    <h5 className="text-xs font-semibold text-ink group-hover:text-accent-ink transition-colors">
                      Page Content CMS
                    </h5>
                    <p className="text-[11px] text-ink-muted">Varanasi, Dharaa, About Us</p>
                  </div>
                </div>
                <CaretRight size={14} className="text-ink-muted group-hover:translate-x-0.5 transition-transform" />
              </Link>

              <Link
                href="/admin/settings?tab=studio"
                className="flex items-center justify-between p-2.5 rounded-xl bg-ground/80 hover:bg-accent-wash/50 border border-edge-subtle hover:border-accent/25 transition-all group cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-white border border-edge-subtle flex items-center justify-center text-accent-ink shadow-sm">
                    <SlidersHorizontal size={16} />
                  </div>
                  <div>
                    <h5 className="text-xs font-semibold text-ink group-hover:text-accent-ink transition-colors">
                      Studio details
                    </h5>
                    <p className="text-[11px] text-ink-muted">Phone, address, social channels</p>
                  </div>
                </div>
                <CaretRight size={14} className="text-ink-muted group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
