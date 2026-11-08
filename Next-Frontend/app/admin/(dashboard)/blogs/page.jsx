'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Plus,
  PencilSimple,
  Trash,
  Eye,
  Clock,
  MagnifyingGlass,
  BookOpenText,
  CircleNotch,
  Article,
  CheckCircle,
  HourglassMedium,
  Archive,
  ArrowSquareOut,
  ChartLineUp,
  LinkSimple,
  CalendarBlank,
  Sparkle,
  ChatCircle,
  PenNib,
} from '@phosphor-icons/react';
import BlogSubNav from './_components/BlogSubNav.jsx';
import { fireMessage } from '@/Utils/fireMessage.js';
import { Button } from '@/app/admin/components/ui/Button.jsx';
import { Badge } from '@/app/admin/components/ui/Badge.jsx';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/app/admin/components/ui/Dialog.jsx';
import { cn } from '@/lib/utils.js';

const api_url = process.env.NEXT_PUBLIC_API_URL;

export default function AdminBlogsPage() {
  const [posts, setPosts] = useState(null);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('All');
  const [deleteId, setDeleteId] = useState(null);
  const [busyPublishId, setBusyPublishId] = useState(null);
  const [copyingPreviewId, setCopyingPreviewId] = useState(null);

  useEffect(() => {
    async function fetchPosts() {
      try {
        const res = await fetch(`${api_url}/api/admin/blogs`, {
          method: 'GET',
          credentials: 'include',
        });
        const data = await res.json();
        if (res.status >= 300) {
          setPosts([]);
          return fireMessage(data.error || 'Failed to load posts', 'error');
        }
        setPosts(data);
      } catch (err) {
        setPosts([]);
        fireMessage(err.message, 'error');
      }
    }
    fetchPosts();
  }, []);

  const stats = useMemo(() => {
    if (!posts) return { total: 0, published: 0, inReview: 0, scheduled: 0, drafts: 0, readingTime: 0 };
    const total = posts.length;
    const published = posts.filter((p) => p.status === 'Published').length;
    const inReview = posts.filter((p) => p.status === 'InReview').length;
    const scheduled = posts.filter((p) => p.status === 'Scheduled').length;
    const drafts = posts.filter((p) => p.status === 'Draft').length;
    const readingTime = posts.reduce((acc, p) => acc + (p.readingTime || 1), 0);
    return { total, published, inReview, scheduled, drafts, readingTime };
  }, [posts]);

  const copyPreviewLink = async (post) => {
    setCopyingPreviewId(post._id);
    try {
      const res = await fetch(`${api_url}/api/admin/blogs/${post._id}/preview-token`, {
        credentials: 'include',
      });
      const data = await res.json();
      if (res.ok && data.previewUrl) {
        const fullUrl = `${window.location.origin}${data.previewUrl}`;
        await navigator.clipboard.writeText(fullUrl);
        fireMessage('24-Hour Preview link copied to clipboard!', 'success');
      } else {
        fireMessage(data.error || 'Failed to generate preview link', 'error');
      }
    } catch (err) {
      fireMessage(err.message, 'error');
    } finally {
      setCopyingPreviewId(null);
    }
  };

  const remove = async (id) => {
    try {
      const res = await fetch(`${api_url}/api/admin/blogs/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      const data = await res.json();
      if (res.status >= 300) return fireMessage(data.error || 'Delete failed', 'error');
      setPosts((prev) => prev.filter((p) => p._id !== id));
      setDeleteId(null);
      fireMessage('Post deleted successfully', 'success');
    } catch (err) {
      fireMessage(err.message, 'error');
    }
  };

  const togglePublish = async (post) => {
    const nextStatus = post.status === 'Published' ? 'Draft' : 'Published';
    setBusyPublishId(post._id);
    try {
      const res = await fetch(`${api_url}/api/admin/blogs/${post._id}/publish`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      });
      const data = await res.json();
      if (res.status >= 300) return fireMessage(data.error || 'Update failed', 'error');
      setPosts((prev) => prev.map((p) => (p._id === post._id ? data : p)));
      fireMessage(`Story is now ${nextStatus.toLowerCase()}`, 'success');
    } catch (err) {
      fireMessage(err.message, 'error');
    } finally {
      setBusyPublishId(null);
    }
  };

  if (posts === null) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3 font-sans">
        <CircleNotch size={28} className="animate-spin text-ink-secondary" />
        <p className="text-xs text-ink-muted font-medium">Loading editorial stories...</p>
      </div>
    );
  }

  const visible = posts.filter((p) => {
    const matchesFilter = filter === 'All' || p.status === filter;
    const matchesQuery =
      !query ||
      p.title.toLowerCase().includes(query.toLowerCase()) ||
      (p.category && p.category.toLowerCase().includes(query.toLowerCase()));
    return matchesFilter && matchesQuery;
  });

  return (
    <div className="space-y-6 pb-16 font-sans">
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-edge-subtle pb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-ink">
            Editorial Stories &amp; Articles
          </h1>
          <p className="text-xs text-ink-muted mt-0.5">
            Manage wedding cinematography guides, real love stories, and studio journal publications.
          </p>
        </div>

        <Link href="/admin/blogs/create">
          <Button variant="gold" size="sm" icon={Plus}>
            Compose Story
          </Button>
        </Link>
      </div>

      {/* Universal Blog Management Sub-Navigation */}
      <BlogSubNav />

      {/* KPI Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <div className="rounded-xl border border-edge-subtle bg-white p-3.5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-ink-muted">Total Stories</span>
            <div className="h-6 w-6 rounded-lg bg-ground-sunk flex items-center justify-center text-ink-secondary border border-edge-subtle">
              <Article size={14} />
            </div>
          </div>
          <div className="mt-1.5 text-xl font-bold tracking-tight text-ink tabular-nums">
            {stats.total}
          </div>
          <p className="text-[10px] text-ink-muted mt-0.5">In library</p>
        </div>

        <div className="rounded-xl border border-edge-subtle bg-white p-3.5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">Published</span>
            <div className="h-6 w-6 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600 border border-emerald-200">
              <CheckCircle size={14} />
            </div>
          </div>
          <div className="mt-1.5 text-xl font-bold tracking-tight text-emerald-800 tabular-nums">
            {stats.published}
          </div>
          <p className="text-[10px] text-ink-muted mt-0.5">Live on website</p>
        </div>

        <div className="rounded-xl border border-edge-subtle bg-white p-3.5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700">In Review</span>
            <div className="h-6 w-6 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600 border border-amber-200">
              <HourglassMedium size={14} />
            </div>
          </div>
          <div className="mt-1.5 text-xl font-bold tracking-tight text-amber-800 tabular-nums">
            {stats.inReview}
          </div>
          <p className="text-[10px] text-ink-muted mt-0.5">Awaiting editorial</p>
        </div>

        <div className="rounded-xl border border-edge-subtle bg-white p-3.5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700">Scheduled</span>
            <div className="h-6 w-6 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 border border-indigo-200">
              <CalendarBlank size={14} />
            </div>
          </div>
          <div className="mt-1.5 text-xl font-bold tracking-tight text-indigo-800 tabular-nums">
            {stats.scheduled}
          </div>
          <p className="text-[10px] text-ink-muted mt-0.5">Future releases</p>
        </div>

        <div className="rounded-xl border border-edge-subtle bg-white p-3.5 shadow-sm col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-ink-secondary">Drafts</span>
            <div className="h-6 w-6 rounded-lg bg-ground-sunk flex items-center justify-center text-ink-secondary border border-edge-subtle">
              <Clock size={14} />
            </div>
          </div>
          <div className="mt-1.5 text-xl font-bold tracking-tight text-ink tabular-nums">
            {stats.drafts}
          </div>
          <p className="text-[10px] text-ink-muted mt-0.5">Work in progress</p>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 rounded-xl border border-edge-subtle shadow-sm">
        <div className="relative flex-1 max-w-md">
          <MagnifyingGlass size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-muted" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search stories by title or category..."
            className="w-full pl-9 pr-4 py-2 bg-ground border border-edge-subtle rounded-xl text-xs text-ink placeholder:text-ink-muted focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/30 transition-all"
          />
        </div>

        <div className="flex items-center gap-1 bg-ground-sunk p-1 rounded-xl border border-edge-subtle overflow-x-auto">
          {[
            { id: 'All', label: 'All Stories' },
            { id: 'Published', label: 'Published' },
            { id: 'InReview', label: 'In Review' },
            { id: 'Scheduled', label: 'Scheduled' },
            { id: 'Draft', label: 'Drafts' },
            { id: 'Archived', label: 'Archived' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilter(tab.id)}
              className={cn(
                'px-3 py-1 text-xs font-medium rounded-lg transition-all cursor-pointer whitespace-nowrap',
                filter === tab.id
                  ? 'bg-white text-ink font-semibold shadow-sm'
                  : 'text-ink-secondary hover:text-ink'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Article List */}
      {visible.length === 0 ? (
        <div className="bg-white rounded-xl border border-edge-subtle p-12 text-center flex flex-col items-center justify-center shadow-sm">
          <div className="w-12 h-12 rounded-full bg-ground-sunk flex items-center justify-center text-ink-muted mb-3 border border-edge-subtle">
            <BookOpenText size={24} />
          </div>
          <h4 className="text-sm font-semibold text-ink mb-1">No articles found</h4>
          <p className="text-xs text-ink-muted max-w-sm mb-4">
            Try adjusting your search query or compose your first wedding story.
          </p>
          <Link href="/admin/blogs/create">
            <Button variant="gold" size="sm" icon={Plus}>
              Compose First Story
            </Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {visible.map((post) => {
            const cover = typeof post.coverImage === 'string'
              ? post.coverImage
              : (post.coverImage?.publicUrl || post.coverImage?.cdnUrl || post.coverImage?.url || null);
            return (
              <div
                key={post._id}
                className="group flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-edge-subtle bg-white p-3.5 sm:p-4 shadow-sm hover:border-edge-strong transition-all"
              >
                <div className="flex items-center gap-4 min-w-0 flex-1">
                  {/* Cover Thumbnail */}
                  <div className="relative h-20 w-32 shrink-0 overflow-hidden rounded-xl bg-ground-sunk border border-edge-subtle flex items-center justify-center">
                    {cover ? (
                      <Image
                        src={cover}
                        alt={post.title}
                        fill
                        unoptimized
                        sizes="128px"
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-stone-300 bg-ground">
                        <Eye size={22} />
                      </div>
                    )}
                  </div>

                  {/* Article Meta */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="truncate text-sm font-bold text-ink group-hover:text-accent-ink transition-colors">
                        {post.title}
                      </h3>
                      <Badge
                        variant={
                          post.status === 'Published'
                            ? 'success'
                            : post.status === 'InReview'
                            ? 'warning'
                            : post.status === 'Scheduled'
                            ? 'info'
                            : 'neutral'
                        }
                        size="sm"
                        dot
                      >
                        {post.status === 'InReview' ? 'In Review' : post.status}
                        {post.status === 'Scheduled' && post.scheduledFor && (
                          <span className="ml-1 text-[10px] font-normal opacity-85">
                            ({new Date(post.scheduledFor).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })})
                          </span>
                        )}
                      </Badge>
                    </div>

                    <div className="mt-1.5 flex flex-wrap items-center gap-3 text-xs text-ink-muted">
                      {post.category && (
                        <span className="font-semibold text-ink-secondary bg-ground-sunk px-2 py-0.5 rounded-lg border border-edge-subtle">
                          {post.category}
                        </span>
                      )}
                      {post.template && (
                        <span className="font-medium text-accent-ink bg-accent/10 px-2 py-0.5 rounded-lg border border-accent/20 capitalize text-[11px]">
                          {post.template.replace(/-/g, ' ')}
                        </span>
                      )}
                      {post.seoScore > 0 && (
                        <span className="inline-flex items-center gap-1 font-mono text-[11px] px-2 py-0.5 rounded-lg bg-ground-sunk text-ink-secondary border border-edge-subtle">
                          <Sparkle size={11} className="text-accent-ink" weight="fill" />
                          SEO {post.seoScore}%
                        </span>
                      )}
                      {typeof post.views === 'number' && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-mono text-ink-muted">
                          <Eye size={12} className="text-ink-muted" />
                          {post.views} views
                        </span>
                      )}
                      <span className="flex items-center gap-1 tabular-nums">
                        <Clock size={13} className="text-ink-muted" />
                        {post.readingTime || 1} min read
                      </span>
                      {post.updatedAt && (
                        <span className="tabular-nums text-ink-muted">
                          Updated {new Date(post.updatedAt).toLocaleDateString('en-IN', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex shrink-0 items-center gap-2 border-t sm:border-t-0 border-edge-subtle pt-2 sm:pt-0">
                  {/* View Story Analytics */}
                  <Link href={`/admin/blogs/analytics`}>
                    <Button variant="ghost" size="iconSm" title="View Story Analytics" className="h-8 w-8 text-ink-secondary hover:text-accent-ink">
                      <ChartLineUp size={16} />
                    </Button>
                  </Link>

                  {/* Copy 24-Hour Preview Link */}
                  <Button
                    variant="ghost"
                    size="iconSm"
                    loading={copyingPreviewId === post._id}
                    onClick={() => copyPreviewLink(post)}
                    title="Copy 24-Hour Signed Preview Link"
                    className="h-8 w-8 text-ink-secondary hover:text-accent-ink"
                  >
                    <LinkSimple size={16} />
                  </Button>

                  {post.status === 'Published' && post.slug && (
                    <a
                      href={`/blogs/${post.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Button variant="ghost" size="iconSm" title="View Public Story" className="h-8 w-8 text-ink-secondary">
                        <ArrowSquareOut size={16} />
                      </Button>
                    </a>
                  )}

                  {/* Quick Status Transition Action */}
                  {post.status === 'InReview' ? (
                    <Button
                      variant="gold"
                      size="sm"
                      loading={busyPublishId === post._id}
                      onClick={() => togglePublish(post)}
                      className="text-xs h-8 px-3"
                    >
                      Approve &amp; Publish
                    </Button>
                  ) : post.status === 'Scheduled' ? (
                    <Button
                      variant="gold"
                      size="sm"
                      loading={busyPublishId === post._id}
                      onClick={() => togglePublish(post)}
                      className="text-xs h-8 px-3"
                    >
                      Publish Now
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      loading={busyPublishId === post._id}
                      onClick={() => togglePublish(post)}
                      className="text-xs h-8 px-3"
                    >
                      {post.status === 'Published' ? 'Unpublish' : 'Publish'}
                    </Button>
                  )}

                  <Link href={`/admin/blogs/edit/${post._id}`}>
                    <Button variant="ghost" size="iconSm" title="Edit Article" className="h-8 w-8 text-ink-secondary">
                      <PencilSimple size={16} />
                    </Button>
                  </Link>

                  <Button
                    variant="ghost"
                    size="iconSm"
                    className="text-ink-muted hover:text-rose-600 hover:bg-rose-50 h-8 w-8 transition-colors"
                    onClick={() => setDeleteId(post._id)}
                    title="Delete Article"
                  >
                    <Trash size={16} />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <Dialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <DialogContent className="sm:max-w-sm font-sans">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold text-ink">
              Delete Article
            </DialogTitle>
            <DialogDescription className="text-xs text-ink-muted">
              Are you sure you want to delete this blog story? Linked media records will be archived and this action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" onClick={() => setDeleteId(null)}>
              Cancel
            </Button>
            <Button
              variant="dangerSolid"
              size="sm"
              onClick={() => deleteId && remove(deleteId)}
            >
              Delete Post
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
