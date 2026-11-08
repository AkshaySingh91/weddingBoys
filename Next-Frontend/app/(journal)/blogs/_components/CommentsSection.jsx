'use client';

import { useState, useEffect, useTransition } from 'react';
import { Heart, MessageSquare, Pin, ShieldCheck, Flag, Check } from 'lucide-react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '';

function formatRelativeTime(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffSecs = Math.floor((now - date) / 1000);

    if (diffSecs < 60) return 'Just now';
    if (diffSecs < 3600) return `${Math.floor(diffSecs / 60)}m ago`;
    if (diffSecs < 86400) return `${Math.floor(diffSecs / 3600)}h ago`;
    if (diffSecs < 604800) return `${Math.floor(diffSecs / 86400)}d ago`;

    return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
}

function getAvatarInitials(name = '') {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return (name[0] || 'W').toUpperCase();
}

export default function CommentsSection({
    postSlug,
    initialComments = [],
    initialTotal = 0,
    commentsAllowed = true
}) {
    const [comments, setComments] = useState(initialComments);
    const [total, setTotal] = useState(initialTotal);
    const [sort, setSort] = useState('newest'); // 'newest' | 'top'
    const [isPending, startTransition] = useTransition();

    // Form state
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [website, setWebsite] = useState('');
    const [body, setBody] = useState('');
    const [honeypot, setHoneypot] = useState('');
    const [renderedAt, setRenderedAt] = useState(0);

    // Submission states
    const [submitting, setSubmitting] = useState(false);
    const [feedback, setFeedback] = useState(null); // { type: 'success' | 'error', text: '' }

    // Reply state: ID of the top-level comment being replied to
    const [activeReplyId, setActiveReplyId] = useState(null);
    const [replyBody, setReplyBody] = useState('');
    const [replySubmitting, setReplySubmitting] = useState(false);

    // Likes tracking in localStorage
    const [likedIds, setLikedIds] = useState(new Set());

    useEffect(() => {
        setRenderedAt(Date.now());
        try {
            const stored = JSON.parse(localStorage.getItem('twb_liked_comments') || '[]');
            setLikedIds(new Set(stored));
        } catch {
            // Ignore localStorage errors
        }
    }, []);

    // Load comments when sort changes
    const reloadComments = async (selectedSort) => {
        try {
            const res = await fetch(`${API_BASE}/api/blogs/${encodeURIComponent(postSlug)}/comments?sort=${selectedSort}`);
            if (res.ok) {
                const data = await res.json();
                setComments(data.comments || []);
                setTotal(data.total || 0);
            }
        } catch (err) {
            console.error('Failed to load comments:', err);
        }
    };

    const handleSortChange = (newSort) => {
        setSort(newSort);
        startTransition(() => {
            reloadComments(newSort);
        });
    };

    // Submit top-level comment
    const handleSubmitComment = async (e) => {
        e.preventDefault();
        setFeedback(null);

        if (!name.trim() || !email.trim() || !body.trim()) {
            setFeedback({ type: 'error', text: 'Please provide your name, email, and comment.' });
            return;
        }

        setSubmitting(true);
        try {
            const res = await fetch(`${API_BASE}/api/blogs/${encodeURIComponent(postSlug)}/comments`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: name.trim(),
                    email: email.trim(),
                    website: website.trim(),
                    body: body.trim(),
                    website_hp: honeypot,
                    _renderedAt: renderedAt
                })
            });

            const data = await res.json();
            if (res.ok && data.success) {
                setFeedback({
                    type: 'success',
                    text: data.message || 'Thank you! Your comment has been submitted.'
                });
                setBody('');
                // If comment was auto-approved, inject into local state
                if (data.status === 'approved' && data.comment) {
                    setComments((prev) => [{ ...data.comment, replies: [] }, ...prev]);
                    setTotal((prev) => prev + 1);
                }
            } else {
                setFeedback({
                    type: 'error',
                    text: data.message || 'Unable to submit comment. Please try again.'
                });
            }
        } catch {
            setFeedback({ type: 'error', text: 'Network error. Please try again.' });
        } finally {
            setSubmitting(false);
        }
    };

    // Submit inline reply
    const handleSubmitReply = async (parentComment) => {
        if (!replyBody.trim()) return;
        setReplySubmitting(true);

        try {
            const res = await fetch(`${API_BASE}/api/blogs/${encodeURIComponent(postSlug)}/comments`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: name.trim() || 'Reader',
                    email: email.trim(),
                    body: replyBody.trim(),
                    parentId: parentComment._id,
                    website_hp: honeypot,
                    _renderedAt: renderedAt
                })
            });

            const data = await res.json();
            if (res.ok && data.success) {
                setReplyBody('');
                setActiveReplyId(null);
                setFeedback({
                    type: 'success',
                    text: data.message || 'Your reply has been submitted.'
                });
                if (data.status === 'approved' && data.comment) {
                    setComments((prev) =>
                        prev.map((c) =>
                            c._id === parentComment._id
                                ? { ...c, replies: [...(c.replies || []), data.comment] }
                                : c
                        )
                    );
                    setTotal((prev) => prev + 1);
                }
            }
        } catch {
            // Silently close reply form on error
        } finally {
            setReplySubmitting(false);
        }
    };

    // Like a comment (optimistic)
    const handleLike = async (commentId) => {
        if (likedIds.has(commentId)) return;

        // Optimistic update
        const nextLiked = new Set(likedIds).add(commentId);
        setLikedIds(nextLiked);
        try {
            localStorage.setItem('twb_liked_comments', JSON.stringify(Array.from(nextLiked)));
        } catch {}

        setComments((prev) =>
            prev.map((c) => {
                if (c._id === commentId) return { ...c, likes: (c.likes || 0) + 1 };
                if (c.replies) {
                    return {
                        ...c,
                        replies: c.replies.map((r) =>
                            r._id === commentId ? { ...r, likes: (r.likes || 0) + 1 } : r
                        )
                    };
                }
                return c;
            })
        );

        try {
            await fetch(`${API_BASE}/api/comments/${commentId}/like`, { method: 'POST' });
        } catch {
            // Ignore failure on background like
        }
    };

    // Report comment
    const handleReport = async (commentId) => {
        if (!confirm('Flag this comment as inappropriate or spam for editorial review?')) return;
        try {
            await fetch(`${API_BASE}/api/comments/${commentId}/report`, { method: 'POST' });
            alert('Thank you. The comment has been flagged for our team.');
        } catch {
            alert('Unable to report at this moment.');
        }
    };

    if (!commentsAllowed) {
        return (
            <section className="mt-20 border-t border-studio-border pt-12 text-center text-sm text-studio-inkMuted">
                Comments are closed for this article.
            </section>
        );
    }

    return (
        <section id="comments" aria-label="Article Discussion" className="mt-20 border-t border-studio-border pt-12">
            {/* Section Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-8 border-b border-studio-border">
                <div className="flex items-center gap-3">
                    <h3 className="font-display text-2xl sm:text-3xl font-bold text-studio-ink">
                        Conversations
                    </h3>
                    <span className="rounded-full bg-studio-canvas px-3 py-1 text-xs font-semibold text-studio-terracotta border border-studio-border">
                        {total} {total === 1 ? 'Thought' : 'Thoughts'}
                    </span>
                </div>

                {/* Sort dropdown */}
                {total > 1 && (
                    <div className="flex items-center gap-2 text-xs font-medium text-studio-inkMuted">
                        <span>Sort by:</span>
                        <select
                            value={sort}
                            onChange={(e) => handleSortChange(e.target.value)}
                            disabled={isPending}
                            className="rounded-lg border border-studio-border bg-white px-3 py-1.5 text-xs text-studio-ink focus:border-studio-terracotta focus:outline-none"
                        >
                            <option value="newest">Newest First</option>
                            <option value="top">Most Appreciated</option>
                        </select>
                    </div>
                )}
            </div>

            {/* Main Submit Comment Form */}
            <form onSubmit={handleSubmitComment} className="mt-8 rounded-2xl border border-studio-border bg-studio-canvas/50 p-6 sm:p-8">
                <h4 className="font-display text-lg font-semibold text-studio-ink mb-1">
                    Leave a Thought
                </h4>
                <p className="text-xs text-studio-inkMuted mb-6">
                    Your email address will not be published. Required fields are marked *
                </p>

                {/* Honeypot field (hidden from genuine users) */}
                <input
                    type="text"
                    name="website_hp"
                    value={honeypot}
                    onChange={(e) => setHoneypot(e.target.value)}
                    style={{ display: 'none' }}
                    tabIndex={-1}
                    autoComplete="off"
                />

                {feedback && (
                    <div
                        className={`mb-6 rounded-xl p-4 text-xs font-medium ${
                            feedback.type === 'success'
                                ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                                : 'bg-accent-wash border border-accent/30 text-accent'
                        }`}
                    >
                        {feedback.text}
                    </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                    <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-studio-inkSecondary mb-1.5">
                            Name *
                        </label>
                        <input
                            type="text"
                            required
                            maxLength={80}
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Your name or initials"
                            className="w-full rounded-xl border border-studio-border bg-white px-4 py-2.5 text-sm text-studio-ink placeholder-studio-inkMuted focus:border-studio-terracotta focus:outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-studio-inkSecondary mb-1.5">
                            Email (Never Shared) *
                        </label>
                        <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="you@example.com"
                            className="w-full rounded-xl border border-studio-border bg-white px-4 py-2.5 text-sm text-studio-ink placeholder-studio-inkMuted focus:border-studio-terracotta focus:outline-none"
                        />
                    </div>
                </div>

                <div className="mb-4">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-studio-inkSecondary mb-1.5">
                        Comment *
                    </label>
                    <textarea
                        required
                        rows={4}
                        maxLength={3000}
                        value={body}
                        onChange={(e) => setBody(e.target.value)}
                        placeholder="What resonated with you in this story? Share your perspective, questions, or congratulations..."
                        className="w-full rounded-xl border border-studio-border bg-white p-4 text-sm text-studio-ink placeholder-studio-inkMuted focus:border-studio-terracotta focus:outline-none leading-relaxed resize-y"
                    />
                    <div className="flex justify-between items-center mt-1 text-[11px] text-studio-inkMuted">
                        <span>Markdown and clean links are welcomed.</span>
                        <span>{3000 - body.length} characters remaining</span>
                    </div>
                </div>

                <div className="flex justify-end">
                    <button
                        type="submit"
                        disabled={submitting}
                        className="rounded-xl bg-studio-ink px-7 py-3 text-xs font-semibold uppercase tracking-wider text-studio-canvas transition-colors hover:bg-studio-terracotta disabled:opacity-50"
                    >
                        {submitting ? 'Sharing...' : 'Share Thought'}
                    </button>
                </div>
            </form>

            {/* Comment Thread List */}
            <div className="mt-12 space-y-8">
                {comments.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-studio-border p-12 text-center">
                        <MessageSquare className="mx-auto h-8 w-8 text-studio-inkMuted/60 mb-3" />
                        <p className="font-display text-lg text-studio-ink font-semibold">No reflections yet</p>
                        <p className="text-xs text-studio-inkMuted mt-1">
                            Be the first to share your reflections on this wedding journey.
                        </p>
                    </div>
                ) : (
                    comments.map((comment) => (
                        <div key={comment._id} id={`comment-${comment._id}`} className="group/item">
                            {/* Top-Level Comment Card */}
                            <div className={`rounded-2xl border ${comment.isPinned ? 'border-gold/60 bg-amber-50/20' : 'border-studio-border bg-white'} p-6 transition-all`}>
                                {/* Pinned Banner */}
                                {comment.isPinned && (
                                    <div className="mb-3 flex items-center gap-1.5 text-xs font-semibold text-gold-strong">
                                        <Pin className="h-3.5 w-3.5 fill-gold-strong" />
                                        <span>Pinned Reflection</span>
                                    </div>
                                )}

                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex items-center gap-3">
                                        {/* Avatar */}
                                        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                                            comment.isStudioReply
                                                ? 'bg-studio-ink text-studio-gold border border-studio-gold'
                                                : 'bg-studio-canvas text-studio-ink border border-studio-border'
                                        }`}>
                                            {getAvatarInitials(comment.author?.name)}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className="font-semibold text-sm text-studio-ink">
                                                    {comment.author?.name}
                                                </span>
                                                {comment.isStudioReply && (
                                                    <span className="inline-flex items-center gap-1 rounded-full bg-studio-ink px-2.5 py-0.5 text-[10px] font-medium tracking-wide text-studio-gold">
                                                        <ShieldCheck className="h-3 w-3" />
                                                        The Wedding Vachan Team
                                                    </span>
                                                )}
                                            </div>
                                            <span className="text-xs text-studio-inkMuted">
                                                {formatRelativeTime(comment.createdAt)}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Report Button */}
                                    <button
                                        onClick={() => handleReport(comment._id)}
                                        title="Report comment"
                                        className="text-studio-inkMuted/40 hover:text-accent transition-colors p-1"
                                    >
                                        <Flag className="h-3.5 w-3.5" />
                                    </button>
                                </div>

                                {/* Body */}
                                <div className="mt-4 text-sm leading-relaxed text-studio-inkSecondary whitespace-pre-wrap">
                                    {comment.body}
                                </div>

                                {/* Action Buttons */}
                                <div className="mt-4 flex items-center gap-6 pt-3 border-t border-studio-border/50 text-xs text-studio-inkMuted">
                                    {/* Like Button */}
                                    <button
                                        onClick={() => handleLike(comment._id)}
                                        className={`flex items-center gap-1.5 font-medium transition-colors ${
                                            likedIds.has(comment._id)
                                                ? 'text-accent'
                                                : 'hover:text-accent'
                                        }`}
                                    >
                                        <Heart
                                            className={`h-4 w-4 ${
                                                likedIds.has(comment._id) ? 'fill-accent text-accent' : ''
                                            }`}
                                        />
                                        <span>{comment.likes || 0}</span>
                                    </button>

                                    {/* Reply Toggle */}
                                    <button
                                        onClick={() => setActiveReplyId(activeReplyId === comment._id ? null : comment._id)}
                                        className="font-medium hover:text-studio-terracotta transition-colors"
                                    >
                                        Reply
                                    </button>
                                </div>

                                {/* Inline Reply Form */}
                                {activeReplyId === comment._id && (
                                    <div className="mt-4 rounded-xl border border-studio-border bg-studio-canvas p-4">
                                        <p className="text-xs font-semibold text-studio-ink mb-2">
                                            Replying to {comment.author?.name}:
                                        </p>
                                        <textarea
                                            rows={3}
                                            value={replyBody}
                                            onChange={(e) => setReplyBody(e.target.value)}
                                            placeholder="Write your reply..."
                                            className="w-full rounded-lg border border-studio-border bg-white p-3 text-xs text-studio-ink focus:border-studio-terracotta focus:outline-none"
                                        />
                                        <div className="mt-2 flex justify-end gap-2">
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setActiveReplyId(null);
                                                    setReplyBody('');
                                                }}
                                                className="rounded-lg px-3 py-1.5 text-xs text-studio-inkMuted hover:text-studio-ink"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                type="button"
                                                disabled={replySubmitting || !replyBody.trim()}
                                                onClick={() => handleSubmitReply(comment)}
                                                className="rounded-lg bg-studio-ink px-4 py-1.5 text-xs font-semibold text-studio-canvas hover:bg-studio-terracotta disabled:opacity-50"
                                            >
                                                {replySubmitting ? 'Posting...' : 'Post Reply'}
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* 1-Level Indented Child Replies */}
                            {comment.replies && comment.replies.length > 0 && (
                                <div className="mt-3 ml-4 sm:ml-8 space-y-3 border-l-2 border-studio-border/70 pl-4 sm:pl-6">
                                    {comment.replies.map((reply) => (
                                        <div
                                            key={reply._id}
                                            id={`comment-${reply._id}`}
                                            className={`rounded-2xl border ${
                                                reply.isStudioReply
                                                    ? 'border-studio-gold/40 bg-amber-50/20'
                                                    : 'border-studio-border/70 bg-white'
                                            } p-5`}
                                        >
                                            <div className="flex items-center justify-between gap-4">
                                                <div className="flex items-center gap-3">
                                                    <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                                                        reply.isStudioReply
                                                            ? 'bg-studio-ink text-studio-gold border border-studio-gold'
                                                            : 'bg-studio-canvas text-studio-ink border border-studio-border'
                                                    }`}>
                                                        {getAvatarInitials(reply.author?.name)}
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-semibold text-xs text-studio-ink">
                                                                {reply.author?.name}
                                                            </span>
                                                            {reply.isStudioReply && (
                                                                <span className="inline-flex items-center gap-1 rounded-full bg-studio-ink px-2 py-0.5 text-[9px] font-medium tracking-wide text-studio-gold">
                                                                    <ShieldCheck className="h-2.5 w-2.5" />
                                                                    The Wedding Vachan Team
                                                                </span>
                                                            )}
                                                        </div>
                                                        <span className="text-[11px] text-studio-inkMuted">
                                                            {formatRelativeTime(reply.createdAt)}
                                                        </span>
                                                    </div>
                                                </div>

                                                <button
                                                    onClick={() => handleReport(reply._id)}
                                                    title="Report reply"
                                                    className="text-studio-inkMuted/40 hover:text-accent transition-colors p-1"
                                                >
                                                    <Flag className="h-3 w-3" />
                                                </button>
                                            </div>

                                            <div className="mt-3 text-xs leading-relaxed text-studio-inkSecondary whitespace-pre-wrap">
                                                {reply.body}
                                            </div>

                                            <div className="mt-3 flex items-center gap-4 text-xs text-studio-inkMuted">
                                                <button
                                                    onClick={() => handleLike(reply._id)}
                                                    className={`flex items-center gap-1 font-medium transition-colors ${
                                                        likedIds.has(reply._id) ? 'text-accent' : 'hover:text-accent'
                                                    }`}
                                                >
                                                    <Heart
                                                        className={`h-3.5 w-3.5 ${
                                                            likedIds.has(reply._id) ? 'fill-accent text-accent' : ''
                                                        }`}
                                                    />
                                                    <span>{reply.likes || 0}</span>
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>
        </section>
    );
}
