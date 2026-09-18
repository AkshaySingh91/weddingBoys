import Comment from '../Models/Comment.js';
import BlogPost from '../Models/blogPost.js';
import { notifyCommenterReply } from '../Utils/commentMailer.js';

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
 * Admin: Get paginated comments with status filters, search, and KPI counts
 * GET /api/admin/comments
 */
export async function getAdminComments(req, res) {
    try {
        const {
            status = 'pending',
            search = '',
            blogPost = '',
            page = 1,
            limit = 20
        } = req.query;

        const currentPage = Math.max(1, parseInt(page, 10) || 1);
        const pageSize = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));

        // Build query
        const query = {};
        if (status && status !== 'all') {
            query.status = status;
        }

        if (blogPost) {
            query.blogPost = blogPost;
        }

        if (search && search.trim()) {
            const searchRegex = new RegExp(search.trim(), 'i');
            query.$or = [
                { 'author.name': searchRegex },
                { 'author.email': searchRegex },
                { body: searchRegex }
            ];
        }

        const [comments, totalMatching, pendingCount, approvedCount, spamCount, rejectedCount] = await Promise.all([
            Comment.find(query)
                .populate('blogPost', 'title slug')
                .populate('parent', 'author body')
                .sort({ createdAt: -1 })
                .skip((currentPage - 1) * pageSize)
                .limit(pageSize)
                .lean(),
            Comment.countDocuments(query),
            Comment.countDocuments({ status: 'pending' }),
            Comment.countDocuments({ status: 'approved' }),
            Comment.countDocuments({ status: 'spam' }),
            Comment.countDocuments({ status: 'rejected' })
        ]);

        return res.status(200).json({
            success: true,
            comments,
            pagination: {
                total: totalMatching,
                page: currentPage,
                pageSize,
                totalPages: Math.ceil(totalMatching / pageSize) || 1
            },
            counts: {
                pending: pendingCount,
                approved: approvedCount,
                spam: spamCount,
                rejected: rejectedCount,
                all: pendingCount + approvedCount + spamCount + rejectedCount
            }
        });
    } catch (error) {
        console.error('[getAdminComments] Error:', error);
        return res.status(500).json({ success: false, message: 'Failed to fetch comments' });
    }
}

/**
 * Admin: Update single comment status
 * PUT /api/admin/comments/:id/status
 */
export async function updateCommentStatus(req, res) {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!['pending', 'approved', 'spam', 'rejected'].includes(status)) {
            return res.status(400).json({ success: false, message: 'Invalid status' });
        }

        const comment = await Comment.findById(id);
        if (!comment) {
            return res.status(404).json({ success: false, message: 'Comment not found' });
        }

        comment.status = status;
        await comment.save();

        return res.status(200).json({
            success: true,
            message: `Comment status updated to ${status}`,
            comment
        });
    } catch (error) {
        console.error('[updateCommentStatus] Error:', error);
        return res.status(500).json({ success: false, message: 'Failed to update status' });
    }
}

/**
 * Admin: Bulk moderation actions
 * PUT /api/admin/comments/bulk
 */
export async function bulkUpdateCommentStatus(req, res) {
    try {
        const { ids, action } = req.body;

        if (!Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({ success: false, message: 'No comment IDs provided' });
        }

        if (!['approve', 'spam', 'reject', 'pending', 'delete'].includes(action)) {
            return res.status(400).json({ success: false, message: 'Invalid bulk action' });
        }

        // Collect distinct blogPost IDs to resync counters
        const commentsToUpdate = await Comment.find({ _id: { $in: ids } }).select('blogPost');
        const blogPostIds = [...new Set(commentsToUpdate.map((c) => c.blogPost?.toString()).filter(Boolean))];

        if (action === 'delete') {
            await Comment.deleteMany({
                $or: [
                    { _id: { $in: ids } },
                    { parent: { $in: ids } }
                ]
            });
        } else {
            const statusMap = {
                approve: 'approved',
                spam: 'spam',
                reject: 'rejected',
                pending: 'pending'
            };
            const targetStatus = statusMap[action];

            await Comment.updateMany(
                { _id: { $in: ids } },
                { $set: { status: targetStatus } }
            );
        }

        // Resync counters on all affected blog posts
        await Promise.all(blogPostIds.map((pid) => Comment.syncCommentCount(pid)));

        return res.status(200).json({
            success: true,
            message: `Bulk ${action} applied to ${ids.length} comments.`
        });
    } catch (error) {
        console.error('[bulkUpdateCommentStatus] Error:', error);
        return res.status(500).json({ success: false, message: 'Bulk action failed' });
    }
}

/**
 * Admin: Reply to a reader comment as Studio (verified badge + auto-approved)
 * POST /api/admin/comments/:id/reply
 */
export async function replyToComment(req, res) {
    try {
        const { id } = req.params;
        const { body } = req.body;

        if (!body || !body.trim()) {
            return res.status(400).json({ success: false, message: 'Reply cannot be empty' });
        }

        const parent = await Comment.findById(id).populate('blogPost', 'title slug');
        if (!parent) {
            return res.status(404).json({ success: false, message: 'Parent comment not found' });
        }

        const adminUser = req.admin || {};
        const studioName = adminUser.name ? `${adminUser.name} (The Wedding Boys)` : 'The Wedding Boys Studio';
        const studioEmail = adminUser.email || 'editorial@theweddingboys.in';

        const reply = new Comment({
            blogPost: parent.blogPost._id,
            parent: parent.parent ? (parent.threadRoot || parent.parent) : parent._id,
            threadRoot: parent.threadRoot || parent._id,
            author: {
                name: studioName,
                email: studioEmail,
                website: 'https://theweddingboys.in'
            },
            body: sanitizeText(body),
            status: 'approved', // Studio reply is immediately approved
            isStudioReply: true, // Displays verified luxury gold badge
            isPinned: false
        });

        await reply.save();

        // Send re-engagement email to the parent commenter
        if (parent.author?.email) {
            Promise.resolve().then(() => {
                notifyCommenterReply({
                    blogPost: parent.blogPost,
                    parentComment: parent,
                    replyComment: reply
                }).catch((err) => console.error('[replyToComment mail error]:', err.message));
            });
        }

        return res.status(201).json({
            success: true,
            message: 'Studio reply published successfully',
            reply
        });
    } catch (error) {
        console.error('[replyToComment] Error:', error);
        return res.status(500).json({ success: false, message: 'Failed to post reply' });
    }
}

/**
 * Admin: Pin or unpin a comment to the top of an article
 * PUT /api/admin/comments/:id/pin
 */
export async function togglePinComment(req, res) {
    try {
        const { id } = req.params;
        const comment = await Comment.findById(id);
        if (!comment) {
            return res.status(404).json({ success: false, message: 'Comment not found' });
        }

        comment.isPinned = !comment.isPinned;
        await comment.save();

        return res.status(200).json({
            success: true,
            message: comment.isPinned ? 'Comment pinned to top' : 'Comment unpinned',
            isPinned: comment.isPinned
        });
    } catch (error) {
        console.error('[togglePinComment] Error:', error);
        return res.status(500).json({ success: false, message: 'Failed to toggle pin' });
    }
}

/**
 * Admin: Delete a comment and its child replies
 * DELETE /api/admin/comments/:id
 */
export async function deleteComment(req, res) {
    try {
        const { id } = req.params;
        const comment = await Comment.findById(id);
        if (!comment) {
            return res.status(404).json({ success: false, message: 'Comment not found' });
        }

        const blogPostId = comment.blogPost;

        // Delete the comment and any replies referencing it as parent or threadRoot
        await Comment.deleteMany({
            $or: [
                { _id: id },
                { parent: id },
                { threadRoot: id }
            ]
        });

        await Comment.syncCommentCount(blogPostId);

        return res.status(200).json({
            success: true,
            message: 'Comment and replies deleted successfully'
        });
    } catch (error) {
        console.error('[deleteComment] Error:', error);
        return res.status(500).json({ success: false, message: 'Failed to delete comment' });
    }
}
