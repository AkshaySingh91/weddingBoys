'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import BlogSubNav from '../_components/BlogSubNav.jsx';
import {
  Article,
  BookOpenText,
  CheckCircle,
  Clock,
  Trash,
  ShieldWarning,
  ArrowBendUpLeft,
  PushPin,
  MagnifyingGlass,
  ArrowClockwise,
  ShieldCheck,
  CircleNotch,
  ChatCircleDots,
  Eye,
  Check,
  X,
  WarningOctagon,
  ChartLineUp,
} from '@phosphor-icons/react';
import { fireMessage } from '@/Utils/fireMessage.js';
import { useAuth } from '@/Context/AdminAuthContext.jsx';
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

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '';

function formatDateTime(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function AdminCommentsPage() {
  const { authLoading, isAdminValid } = useAuth() || {};

  const [comments, setComments] = useState([]);
  const [counts, setCounts] = useState({ pending: 0, approved: 0, spam: 0, rejected: 0, all: 0 });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pending'); // 'pending' | 'approved' | 'spam' | 'rejected' | 'all'
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState(new Set());

  // Reply Dialog State
  const [replyTarget, setReplyTarget] = useState(null);
  const [replyContent, setReplyContent] = useState('');
  const [replyBusy, setReplyBusy] = useState(false);

  // Delete Dialog State
  const [deleteTargetId, setDeleteTargetId] = useState(null);
  const [deleteBusy, setDeleteBusy] = useState(false);

  // Action in-flight tracking
  const [actionBusyId, setActionBusyId] = useState(null);
  const [bulkBusy, setBulkBusy] = useState(false);

  // Fetch comments from API
  const fetchComments = useCallback(async (tab = 'pending', query = '') => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        status: tab,
        search: (query || '').trim(),
        limit: '50',
      });
      const res = await fetch(`${API_BASE}/api/admin/comments?${params.toString()}`, {
        credentials: 'include',
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setComments(data.comments || []);
        if (data.counts) setCounts(data.counts);
      } else {
        fireMessage(data.message || 'Failed to fetch comments', 'error');
      }
    } catch (err) {
      fireMessage('Network error loading comments', 'error');
    } finally {
      setLoading(false);
      setSelectedIds(new Set());
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchComments(activeTab);
  }, [activeTab, fetchComments]);

  // Single status change
  const handleStatusChange = async (commentId, newStatus) => {
    setActionBusyId(commentId);
    try {
      const res = await fetch(`${API_BASE}/api/admin/comments/${commentId}/status`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        fireMessage(`Comment marked as ${newStatus}`, 'success');
        fetchComments(activeTab, searchQuery);
      } else {
        fireMessage(data.message || 'Failed to update status', 'error');
      }
    } catch {
      fireMessage('Error updating status', 'error');
    } finally {
      setActionBusyId(null);
    }
  };

  // Toggle Pin
  const handleTogglePin = async (commentId) => {
    setActionBusyId(commentId);
    try {
      const res = await fetch(`${API_BASE}/api/admin/comments/${commentId}/pin`, {
        method: 'PUT',
        credentials: 'include',
      });
      const data = await res.json();
      if (res.ok && data.success) {
        fireMessage(data.message || 'Pin updated', 'success');
        fetchComments(activeTab, searchQuery);
      } else {
        fireMessage(data.message || 'Failed to toggle pin', 'error');
      }
    } catch {
      fireMessage('Error updating pin', 'error');
    } finally {
      setActionBusyId(null);
    }
  };

  // Studio Verified Reply
  const handleSendStudioReply = async (e) => {
    e.preventDefault();
    if (!replyTarget || !replyContent.trim()) return;

    setReplyBusy(true);
    try {
      const res = await fetch(`${API_BASE}/api/admin/comments/${replyTarget._id}/reply`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body: replyContent.trim() }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        fireMessage('Verified studio reply published', 'success');
        setReplyTarget(null);
        setReplyContent('');
        fetchComments(activeTab, searchQuery);
      } else {
        fireMessage(data.message || 'Failed to post reply', 'error');
      }
    } catch {
      fireMessage('Error posting studio reply', 'error');
    } finally {
      setReplyBusy(false);
    }
  };

  // Delete Comment
  const handleDeleteComment = async () => {
    if (!deleteTargetId) return;
    setDeleteBusy(true);
    try {
      const res = await fetch(`${API_BASE}/api/admin/comments/${deleteTargetId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      const data = await res.json();
      if (res.ok && data.success) {
        fireMessage('Comment and its replies deleted', 'success');
        setDeleteTargetId(null);
        fetchComments(activeTab, searchQuery);
      } else {
        fireMessage(data.message || 'Failed to delete comment', 'error');
      }
    } catch {
      fireMessage('Error deleting comment', 'error');
    } finally {
      setDeleteBusy(false);
    }
  };

  // Bulk Actions
  const handleBulkAction = async (action) => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;

    setBulkBusy(true);
    try {
      const res = await fetch(`${API_BASE}/api/admin/comments/bulk`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids, action }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        fireMessage(data.message || `Applied ${action} to selected comments`, 'success');
        fetchComments(activeTab, searchQuery);
      } else {
        fireMessage(data.message || 'Bulk action failed', 'error');
      }
    } catch {
      fireMessage('Error executing bulk action', 'error');
    } finally {
      setBulkBusy(false);
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === comments.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(comments.map((c) => c._id)));
    }
  };

  const toggleSelect = (id) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  return (
    <div className="space-y-6 pb-16 font-sans">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E5DCD3] pb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#1C1917]">
            Reader Comments &amp; Moderation
          </h1>
          <p className="text-xs text-stone-500 mt-0.5">
            Review reader reflections, filter spam, and reply directly with verified studio authority.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            icon={ArrowClockwise}
            onClick={() => fetchComments(activeTab, searchQuery)}
            disabled={loading}
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* Editorial Navigation Tabs */}
      <BlogSubNav />

      {/* KPI Cards Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div
          onClick={() => setActiveTab('pending')}
          className={`cursor-pointer rounded-2xl border p-4 transition-all shadow-sm ${
            activeTab === 'pending'
              ? 'border-amber-400 bg-amber-50/40 ring-2 ring-amber-400/20'
              : 'border-[#E5DCD3] bg-white hover:border-amber-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-800">Pending Review</span>
            <div className="h-7 w-7 rounded-xl bg-amber-100 flex items-center justify-center text-amber-800 border border-amber-200">
              <Clock size={16} />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold tracking-tight text-[#1C1917] tabular-nums">
            {counts.pending}
          </div>
          <p className="text-[11px] text-stone-400 mt-0.5">Awaiting publication</p>
        </div>

        <div
          onClick={() => setActiveTab('approved')}
          className={`cursor-pointer rounded-2xl border p-4 transition-all shadow-sm ${
            activeTab === 'approved'
              ? 'border-emerald-500 bg-emerald-50/40 ring-2 ring-emerald-500/20'
              : 'border-[#E5DCD3] bg-white hover:border-emerald-400'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800">Approved Live</span>
            <div className="h-7 w-7 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-800 border border-emerald-200">
              <CheckCircle size={16} />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold tracking-tight text-[#1C1917] tabular-nums">
            {counts.approved}
          </div>
          <p className="text-[11px] text-stone-400 mt-0.5">Visible to readers</p>
        </div>

        <div
          onClick={() => setActiveTab('spam')}
          className={`cursor-pointer rounded-2xl border p-4 transition-all shadow-sm ${
            activeTab === 'spam'
              ? 'border-rose-400 bg-rose-50/40 ring-2 ring-rose-400/20'
              : 'border-[#E5DCD3] bg-white hover:border-rose-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-rose-800">Flagged Spam</span>
            <div className="h-7 w-7 rounded-xl bg-rose-100 flex items-center justify-center text-rose-800 border border-rose-200">
              <ShieldWarning size={16} />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold tracking-tight text-[#1C1917] tabular-nums">
            {counts.spam}
          </div>
          <p className="text-[11px] text-stone-400 mt-0.5">Filtered out</p>
        </div>

        <div
          onClick={() => setActiveTab('all')}
          className={`cursor-pointer rounded-2xl border p-4 transition-all shadow-sm ${
            activeTab === 'all'
              ? 'border-[#1C1917] bg-stone-50 ring-2 ring-stone-900/10'
              : 'border-[#E5DCD3] bg-white hover:border-stone-400'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-stone-600">Total Discussions</span>
            <div className="h-7 w-7 rounded-xl bg-stone-100 flex items-center justify-center text-stone-800 border border-stone-200">
              <ChatCircleDots size={16} />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold tracking-tight text-[#1C1917] tabular-nums">
            {counts.all}
          </div>
          <p className="text-[11px] text-stone-400 mt-0.5">All received responses</p>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-[#E5DCD3] pb-3">
        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto">
          {[
            { key: 'pending', label: 'Pending Review', count: counts.pending },
            { key: 'approved', label: 'Approved', count: counts.approved },
            { key: 'spam', label: 'Spam', count: counts.spam },
            { key: 'rejected', label: 'Rejected', count: counts.rejected },
            { key: 'all', label: 'All', count: counts.all },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                activeTab === tab.key
                  ? 'bg-[#1C1917] text-[#F7F4EF]'
                  : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900'
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`rounded-full px-1.5 py-0.2 text-[10px] ${
                  activeTab === tab.key
                    ? 'bg-stone-700 text-stone-200'
                    : 'bg-stone-200 text-stone-600'
                }`}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Search Box */}
        <div className="relative w-full md:w-64">
          <MagnifyingGlass size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchComments(activeTab, searchQuery)}
            placeholder="Search commenter or text..."
            className="w-full rounded-xl border border-[#E5DCD3] bg-white pl-8 pr-3 py-1.5 text-xs text-stone-800 placeholder-stone-400 focus:border-[#8C532B] focus:outline-none"
          />
        </div>
      </div>

      {/* Bulk Action Toolbar */}
      {selectedIds.size > 0 && (
        <div className="flex items-center justify-between rounded-xl bg-stone-900 p-3 text-xs text-white shadow-lg animate-in fade-in duration-200">
          <div className="flex items-center gap-3">
            <span className="font-semibold text-amber-300">{selectedIds.size} comments selected</span>
            <button
              onClick={() => setSelectedIds(new Set())}
              className="text-stone-400 hover:text-white underline"
            >
              Deselect
            </button>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleBulkAction('approve')}
              disabled={bulkBusy}
              className="rounded-lg bg-emerald-600 px-3 py-1.5 font-medium hover:bg-emerald-500 transition-colors disabled:opacity-50"
            >
              Approve
            </button>
            <button
              onClick={() => handleBulkAction('spam')}
              disabled={bulkBusy}
              className="rounded-lg bg-amber-600 px-3 py-1.5 font-medium hover:bg-amber-500 transition-colors disabled:opacity-50"
            >
              Mark Spam
            </button>
            <button
              onClick={() => handleBulkAction('reject')}
              disabled={bulkBusy}
              className="rounded-lg bg-stone-700 px-3 py-1.5 font-medium hover:bg-stone-600 transition-colors disabled:opacity-50"
            >
              Reject
            </button>
            <button
              onClick={() => handleBulkAction('delete')}
              disabled={bulkBusy}
              className="rounded-lg bg-rose-600 px-3 py-1.5 font-medium hover:bg-rose-500 transition-colors disabled:opacity-50"
            >
              Delete
            </button>
          </div>
        </div>
      )}

      {/* Comments List */}
      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-[30vh] gap-3">
          <CircleNotch size={24} className="animate-spin text-stone-600" />
          <p className="text-xs text-stone-500 font-medium">Loading moderation queue...</p>
        </div>
      ) : comments.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[#E5DCD3] bg-white p-12 text-center">
          <ChatCircleDots size={32} className="mx-auto text-stone-400 mb-2" />
          <h3 className="text-base font-semibold text-[#1C1917]">No comments in this filter</h3>
          <p className="text-xs text-stone-500 mt-1 max-w-sm mx-auto">
            All caught up! No reader submissions currently match the &ldquo;{activeTab}&rdquo; filter.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Select All Checkbox */}
          <div className="flex items-center gap-2 px-2 text-xs font-medium text-stone-500">
            <input
              type="checkbox"
              checked={selectedIds.size === comments.length && comments.length > 0}
              onChange={toggleSelectAll}
              className="h-4 w-4 rounded border-[#E5DCD3] text-[#8C532B] focus:ring-[#8C532B]"
            />
            <span>Select All ({comments.length})</span>
          </div>

          {comments.map((comment) => (
            <div
              key={comment._id}
              className={`rounded-2xl border p-5 transition-all shadow-sm ${
                selectedIds.has(comment._id)
                  ? 'border-[#8C532B] bg-amber-50/20'
                  : 'border-[#E5DCD3] bg-white hover:border-stone-300'
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                {/* Left: Checkbox + Author & Post Context */}
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={selectedIds.has(comment._id)}
                    onChange={() => toggleSelect(comment._id)}
                    className="mt-1 h-4 w-4 rounded border-[#E5DCD3] text-[#8C532B] focus:ring-[#8C532B]"
                  />
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-bold text-sm text-[#1C1917]">
                        {comment.author?.name}
                      </span>
                      <span className="rounded-md bg-stone-100 px-2 py-0.5 text-[11px] font-mono text-stone-600 border border-stone-200">
                        {comment.author?.email}
                      </span>

                      {/* Verified studio badge */}
                      {comment.isStudioReply && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-[#1C1917] px-2 py-0.5 text-[10px] font-semibold text-[#C29555]">
                          <ShieldCheck size={12} />
                          The Wedding Boys Team
                        </span>
                      )}

                      {/* Pinned Badge */}
                      {comment.isPinned && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-800 border border-amber-200">
                          <PushPin size={11} className="fill-amber-800" />
                          Pinned
                        </span>
                      )}

                      {/* Status Badges */}
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
                          comment.status === 'approved'
                            ? 'bg-emerald-100 text-emerald-800'
                            : comment.status === 'pending'
                            ? 'bg-amber-100 text-amber-800'
                            : comment.status === 'spam'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-stone-100 text-stone-600'
                        }`}
                      >
                        {comment.status}
                      </span>
                    </div>

                    {/* Associated Story Link */}
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-stone-500">
                      <span>On story:</span>
                      {comment.blogPost ? (
                        <Link
                          href={`/blogs/${comment.blogPost.slug}`}
                          target="_blank"
                          className="font-medium text-[#8C532B] hover:underline"
                        >
                          &ldquo;{comment.blogPost.title}&rdquo;
                        </Link>
                      ) : (
                        <span className="italic text-stone-400">Post unavailable</span>
                      )}
                      <span>·</span>
                      <span>{formatDateTime(comment.createdAt)}</span>
                      {comment.likes > 0 && (
                        <>
                          <span>·</span>
                          <span className="font-semibold text-rose-600">{comment.likes} Likes</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right: Quick Action Controls */}
                <div className="flex items-center gap-1.5 shrink-0">
                  {comment.status !== 'approved' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleStatusChange(comment._id, 'approved')}
                      disabled={actionBusyId === comment._id}
                      className="border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                    >
                      <Check size={14} className="mr-1" />
                      Approve
                    </Button>
                  )}

                  {comment.status !== 'spam' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleStatusChange(comment._id, 'spam')}
                      disabled={actionBusyId === comment._id}
                      className="border-amber-300 text-amber-700 hover:bg-amber-50"
                    >
                      Spam
                    </Button>
                  )}

                  {comment.status === 'approved' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleTogglePin(comment._id)}
                      disabled={actionBusyId === comment._id}
                      className={comment.isPinned ? 'border-amber-400 bg-amber-50 text-amber-800' : ''}
                    >
                      <PushPin size={13} className="mr-1" />
                      {comment.isPinned ? 'Unpin' : 'Pin'}
                    </Button>
                  )}

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setReplyTarget(comment);
                      setReplyContent('');
                    }}
                  >
                    <ArrowBendUpLeft size={14} className="mr-1" />
                    Reply
                  </Button>

                  <button
                    onClick={() => setDeleteTargetId(comment._id)}
                    className="p-1.5 text-stone-400 hover:text-rose-600 transition-colors rounded-lg hover:bg-stone-100"
                    title="Delete"
                  >
                    <Trash size={16} />
                  </button>
                </div>
              </div>

              {/* Context if this comment is a reply */}
              {comment.parent && (
                <div className="mt-3 ml-7 rounded-xl border border-stone-200 bg-stone-50 p-2.5 text-xs text-stone-600">
                  <span className="font-semibold text-stone-700">In response to {comment.parent.author?.name || 'Reader'}:</span>
                  <p className="mt-0.5 line-clamp-1 italic">&ldquo;{comment.parent.body}&rdquo;</p>
                </div>
              )}

              {/* Comment Body */}
              <div className="mt-3 ml-7 text-xs sm:text-sm text-stone-800 leading-relaxed whitespace-pre-wrap">
                {comment.body}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Studio Reply Dialog */}
      {replyTarget && (
        <Dialog open={Boolean(replyTarget)} onOpenChange={() => setReplyTarget(null)}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <ShieldCheck size={20} className="text-[#C29555]" />
                <span>Verified Studio Reply</span>
              </DialogTitle>
              <DialogDescription>
                Post an official reply to <strong>{replyTarget.author?.name}</strong> on &ldquo;{replyTarget.blogPost?.title}&rdquo;.
              </DialogDescription>
            </DialogHeader>

            <div className="rounded-xl border border-[#E5DCD3] bg-stone-50 p-3 text-xs text-stone-600 my-2">
              <span className="font-semibold text-stone-800">Reader said:</span>
              <p className="mt-1 line-clamp-2 italic text-stone-700">&ldquo;{replyTarget.body}&rdquo;</p>
            </div>

            <form onSubmit={handleSendStudioReply}>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-stone-700 uppercase tracking-wider">
                  Studio Response
                </label>
                <textarea
                  required
                  rows={4}
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  placeholder="Thank you for your thoughts! Here is what we found during this shoot..."
                  className="w-full rounded-xl border border-[#E5DCD3] bg-white p-3 text-xs text-stone-900 focus:border-[#8C532B] focus:outline-none"
                />
                <p className="text-[11px] text-stone-400">
                  This reply will display the verified gold &ldquo;The Wedding Boys Team&rdquo; badge and email {replyTarget.author?.email} with a direct link.
                </p>
              </div>

              <DialogFooter className="mt-4">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setReplyTarget(null)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="gold"
                  size="sm"
                  disabled={replyBusy || !replyContent.trim()}
                >
                  {replyBusy ? 'Publishing...' : 'Publish Studio Reply'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {/* Delete Confirmation Dialog */}
      {deleteTargetId && (
        <Dialog open={Boolean(deleteTargetId)} onOpenChange={() => setDeleteTargetId(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-rose-600">
                <WarningOctagon size={20} />
                <span>Delete Comment?</span>
              </DialogTitle>
              <DialogDescription>
                This will permanently remove the comment and any child replies from the article and database. This action cannot be undone.
              </DialogDescription>
            </DialogHeader>

            <DialogFooter className="mt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDeleteTargetId(null)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDeleteComment}
                disabled={deleteBusy}
              >
                {deleteBusy ? 'Deleting...' : 'Delete Permanently'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
