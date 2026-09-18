import crypto from 'crypto';
import Comment from '../Models/Comment.js';
import BlogPost from '../Models/blogPost.js';
import { notifyStudioNewComment, notifyCommenterReply } from '../Utils/commentMailer.js';

// Helper: Hash IP for privacy-preserving spam detection
function getIpHash(req) {
    const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket?.remoteAddress || '127.0.0.1';
    const salt = process.env.COOKIE_SECRET_KEY || 'theweddingboys-salt';
    return crypto.createHash('sha256').update(`${ip}-${salt}`).digest('hex');
}

// Helper: Basic sanitization of plain text to prevent HTML/script injection
function sanitizeText(str = '') {
    return str
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/<[^>]+>/g, '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;')
        .trim();
}

/**
 * Public: Get approved comments for a blog post (threaded 1-level)
 * GET /api/blogs/:slug/comments
 */
export async function getBlogComments(req, res) {
    try {
        const { slug } = req.params;
        const sort = req.query.sort === 'top' ? 'top' : 'newest';
        const page = Math.max(1, parseInt(req.query.page, 10) || 1);
        const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 20));

        const post = await BlogPost.findOne({ slug }).select('_id allowComments commentCount');
        if (!post) {
            return res.status(404).json({ success: false, message: 'Story not found' });
        }

        if (post.allowComments === false) {
            return res.status(200).json({
                success: true,
                commentsAllowed: false,
                total: 0,
                comments: []
            });
        }

        const sortCriteria = sort === 'top'
            ? { isPinned: -1, likes: -1, createdAt: -1 }
            : { isPinned: -1, createdAt: -1 };

        // Fetch top-level approved comments
        const topLevelQuery = {
            blogPost: post._id,
            parent: null,
            status: 'approved'
        };

        const totalTopLevel = await Comment.countDocuments(topLevelQuery);
        const topComments = await Comment.find(topLevelQuery)
            .select('_id parent threadRoot author.name author.website body likes isStudioReply isPinned createdAt')
            .sort(sortCriteria)
            .skip((page - 1) * limit)
            .limit(limit)
            .lean();

        // Fetch 1-level replies for the selected top-level comments
        const topLevelIds = topComments.map((c) => c._id);
        const replies = await Comment.find({
            blogPost: post._id,
            parent: { $in: topLevelIds },
            status: 'approved'
        })
            .select('_id parent threadRoot author.name author.website body likes isStudioReply isPinned createdAt')
            .sort({ createdAt: 1 })
            .lean();

        // Nest replies into parent topComments
        const repliesByParent = {};
        for (const reply of replies) {
            const pid = reply.parent.toString();
            if (!repliesByParent[pid]) repliesByParent[pid] = [];
            repliesByParent[pid].push(reply);
        }

        const threadedComments = topComments.map((comment) => ({
            ...comment,
            replies: repliesByParent[comment._id.toString()] || []
        }));

        const totalApprovedComments = await Comment.countDocuments({
            blogPost: post._id,
            status: 'approved'
        });

        return res.status(200).json({
            success: true,
            commentsAllowed: true,
            total: totalApprovedComments,
            topLevelTotal: totalTopLevel,
            page,
            totalPages: Math.ceil(totalTopLevel / limit) || 1,
            comments: threadedComments
        });
    } catch (error) {
        console.error('[getBlogComments] Error:', error);
        return res.status(500).json({ success: false, message: 'Failed to load comments' });
    }
}

/**
 * Public: Post a new comment or reply with multi-layer anti-spam shield
 * POST /api/blogs/:slug/comments
 */
export async function createComment(req, res) {
    try {
        const { slug } = req.params;
        const {
            name,
            email,
            website,
            body,
            parentId,
            website_hp,
            _renderedAt
        } = req.body;

        // 1. Honeypot check (hidden input filled only by bots)
        if (website_hp) {
            // Silently pretend success without saving
            return res.status(201).json({
                success: true,
                message: 'Your comment has been submitted for moderation.',
                status: 'pending'
            });
        }

        // 2. Time-to-submit verification (submitting in under 2.5 seconds indicates a bot script)
        if (_renderedAt) {
            const timeElapsedMs = Date.now() - Number(_renderedAt);
            if (timeElapsedMs < 2500) {
                return res.status(201).json({
                    success: true,
                    message: 'Your comment has been submitted for moderation.',
                    status: 'pending'
                });
            }
        }

        // 3. Validation
        if (!name || !name.trim()) {
            return res.status(400).json({ success: false, message: 'Name is required' });
        }
        if (!email || !email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
            return res.status(400).json({ success: false, message: 'A valid email address is required' });
        }
        if (!body || !body.trim()) {
            return res.status(400).json({ success: false, message: 'Comment content cannot be empty' });
        }

        const cleanBody = sanitizeText(body);
        if (cleanBody.length > 3000) {
            return res.status(400).json({ success: false, message: 'Comment exceeds maximum 3,000 characters' });
        }

        // 4. IP Rate Limiting (max 5 comments per 15 mins per IP hash)
        const ipHash = getIpHash(req);
        const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
        const recentSubmissionsCount = await Comment.countDocuments({
            'meta.ipHash': ipHash,
            createdAt: { $gte: fifteenMinutesAgo }
        });

        if (recentSubmissionsCount >= 5) {
            return res.status(429).json({
                success: false,
                message: 'You have submitted several comments recently. Please wait a few minutes before posting again.'
            });
        }

        // 5. Look up blog post
        const post = await BlogPost.findOne({ slug }).select('_id title slug allowComments');
        if (!post) {
            return res.status(404).json({ success: false, message: 'Story not found' });
        }

        if (post.allowComments === false) {
            return res.status(403).json({ success: false, message: 'Comments are closed on this story.' });
        }

        // 6. Shallow threading hierarchy validation
        let parentComment = null;
        let threadRootId = null;
        let finalParentId = null;

        if (parentId) {
            parentComment = await Comment.findOne({ _id: parentId, blogPost: post._id });
            if (!parentComment) {
                return res.status(400).json({ success: false, message: 'Parent comment not found' });
            }

            // If the parent is already a reply, anchor to the top-level parent to keep UI strictly 1-level deep
            if (parentComment.parent) {
                finalParentId = parentComment.threadRoot || parentComment.parent;
                threadRootId = finalParentId;
            } else {
                finalParentId = parentComment._id;
                threadRootId = parentComment._id;
            }
        }

        // 7. Spam Heuristics (e.g. excessive URLs)
        const urlMatches = cleanBody.match(/https?:\/\/[^\s]+/gi) || [];
        const isExcessiveLinks = urlMatches.length > 2;

        // Auto-approve whitelist: check if this commenter email was previously approved by an admin
        const previouslyApproved = !isExcessiveLinks && await Comment.exists({
            'author.email': email.trim().toLowerCase(),
            status: 'approved'
        });

        const initialStatus = isExcessiveLinks ? 'spam' : (previouslyApproved ? 'approved' : 'pending');

        const newComment = new Comment({
            blogPost: post._id,
            parent: finalParentId,
            threadRoot: threadRootId,
            author: {
                name: sanitizeText(name).slice(0, 80),
                email: email.trim().toLowerCase(),
                website: website ? sanitizeText(website).slice(0, 200) : ''
            },
            body: cleanBody,
            status: initialStatus,
            meta: {
                ipHash,
                userAgent: req.headers['user-agent'] || '',
                country: req.headers['cf-ipcountry'] || ''
            }
        });

        await newComment.save();

        // Asynchronous email triggers (fire & forget, non-blocking)
        Promise.resolve().then(async () => {
            try {
                // Alert studio about new comment
                await notifyStudioNewComment({ blogPost: post, comment: newComment });

                // If this is a reply to another reader, notify them
                if (parentComment && parentComment.author?.email && parentComment.author.email !== newComment.author.email) {
                    await notifyCommenterReply({
                        blogPost: post,
                        parentComment,
                        replyComment: newComment
                    });
                }
            } catch (notifyErr) {
                console.error('[createComment notification error]:', notifyErr.message);
            }
        });

        return res.status(201).json({
            success: true,
            status: newComment.status,
            message: newComment.status === 'approved'
                ? 'Your comment has been published.'
                : 'Thank you! Your comment has been received and will appear once reviewed.',
            comment: {
                _id: newComment._id,
                parent: newComment.parent,
                threadRoot: newComment.threadRoot,
                author: {
                    name: newComment.author.name,
                    website: newComment.author.website
                },
                body: newComment.body,
                likes: 0,
                isStudioReply: false,
                isPinned: false,
                createdAt: newComment.createdAt
            }
        });
    } catch (error) {
        console.error('[createComment] Error:', error);
        return res.status(500).json({ success: false, message: 'Failed to submit comment' });
    }
}

/**
 * Public: Like a comment (deduplicated client-side via localStorage / cookie)
 * POST /api/comments/:id/like
 */
export async function likeComment(req, res) {
    try {
        const { id } = req.params;
        const comment = await Comment.findByIdAndUpdate(
            id,
            { $inc: { likes: 1 } },
            { new: true }
        ).select('_id likes');

        if (!comment) {
            return res.status(404).json({ success: false, message: 'Comment not found' });
        }

        return res.status(200).json({ success: true, likes: comment.likes });
    } catch (error) {
        console.error('[likeComment] Error:', error);
        return res.status(500).json({ success: false, message: 'Failed to update like' });
    }
}

/**
 * Public: Report an abusive or spam comment
 * POST /api/comments/:id/report
 */
export async function reportComment(req, res) {
    try {
        const { id } = req.params;
        const comment = await Comment.findByIdAndUpdate(
            id,
            { $inc: { reportsCount: 1 } },
            { new: true }
        ).select('_id reportsCount status');

        if (!comment) {
            return res.status(404).json({ success: false, message: 'Comment not found' });
        }

        // Auto-flag to pending if report threshold reached
        if (comment.reportsCount >= 3 && comment.status === 'approved') {
            comment.status = 'pending';
            await comment.save();
        }

        return res.status(200).json({
            success: true,
            message: 'Thank you. The comment has been flagged for editorial review.'
        });
    } catch (error) {
        console.error('[reportComment] Error:', error);
        return res.status(500).json({ success: false, message: 'Failed to report comment' });
    }
}
