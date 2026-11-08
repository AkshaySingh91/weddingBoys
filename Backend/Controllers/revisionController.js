import { revalidateBlogs } from '../Services/revalidate.js';
import { ROLES } from '../constants.js';
// controllers/revisionController.js
import BlogPost from '../Models/blogPost.js';
import BlogPostRevision from '../Models/BlogPostRevision.js';
import Admin from '../Models/adminSchema.js';

/**
 * Resolve the admin _id from the authenticated request.
 */
const resolveAdminId = async (req) => {
    if (!req.admin?.email) return null;
    const admin = await Admin.findOne({ email: req.admin.email }).select('_id');
    return admin?._id || null;
};

// POST /api/admin/blogs/:id/revisions  — save a revision (autosave or manual)
export const createRevision = async (req, res) => {
    try {
        if (![ROLES.EDITOR, ROLES.SUPER_ADMIN].includes(req.user?.role)) return res.status(403).json({ error: 'Only Editors and SuperAdmins may change stories' });
        const { id } = req.params;
        const post = await BlogPost.findById(id).select('_id');
        if (!post) return res.status(404).json({ error: 'Blog post not found' });

        const adminId = await resolveAdminId(req);
        const { title, contentJson, excerpt, template, reason } = req.body;

        const revision = new BlogPostRevision({
            blogPost: post._id,
            title: title || undefined,
            contentJson: contentJson || undefined,
            excerpt: excerpt || undefined,
            template: template || undefined,
            editedBy: adminId || undefined,
            reason: reason || 'autosave',
        });
        await revision.save();

        // Auto-prune old autosaves to keep storage bounded.
        if (revision.reason === 'autosave') {
            await BlogPostRevision.pruneAutosaves(post._id, 50);
        }

        res.status(201).json(revision);
    } catch (err) {
        console.error('createRevision error:', err);
        res.status(400).json({ error: err.message });
    }
};

// GET /api/admin/blogs/:id/revisions  — list revisions, newest first
export const getRevisions = async (req, res) => {
    try {
        const { id } = req.params;
        const page = Math.max(parseInt(req.query.page) || 1, 1);
        const limit = Math.min(Math.max(parseInt(req.query.limit) || 20, 1), 100);

        const query = { blogPost: id };
        const total = await BlogPostRevision.countDocuments(query);
        const revisions = await BlogPostRevision.find(query)
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .populate('editedBy', 'name avatar')
            .select('-contentJson');   // Omit heavy AST in list view

        res.json({ revisions, page, limit, total, hasMore: page * limit < total });
    } catch (err) {
        console.error('getRevisions error:', err);
        res.status(500).json({ error: 'Server error' });
    }
};

// GET /api/admin/blogs/:id/revisions/:revId  — get a single revision (full, with contentJson)
export const getRevisionById = async (req, res) => {
    try {
        const revision = await BlogPostRevision.findById(req.params.revId)
            .populate('editedBy', 'name avatar');
        if (!revision) return res.status(404).json({ error: 'Revision not found' });
        res.json(revision);
    } catch (err) {
        console.error('getRevisionById error:', err);
        res.status(500).json({ error: 'Server error' });
    }
};

// POST /api/admin/blogs/:id/revisions/:revId/restore  — restore post to a revision snapshot
export const restoreRevision = async (req, res) => {
    try {
        if (![ROLES.EDITOR, ROLES.SUPER_ADMIN].includes(req.user?.role)) return res.status(403).json({ error: 'Only Editors and SuperAdmins may change stories' });
        const { id, revId } = req.params;
        const post = await BlogPost.findById(id);
        if (!post) return res.status(404).json({ error: 'Blog post not found' });

        const revision = await BlogPostRevision.findById(revId);
        if (!revision) return res.status(404).json({ error: 'Revision not found' });
        if (revision.blogPost.toString() !== id) {
            return res.status(400).json({ error: 'Revision does not belong to this post' });
        }

        // Take a snapshot of the current state before restoring (safety net).
        const adminId = await resolveAdminId(req);
        await new BlogPostRevision({
            blogPost: post._id,
            title: post.title,
            contentJson: post.contentJson,
            excerpt: post.excerpt,
            template: post.template,
            editedBy: adminId,
            reason: 'manual',
        }).save();

        // Restore the post from the revision.
        if (revision.title) post.title = revision.title;
        if (revision.contentJson) post.contentJson = revision.contentJson;
        if (revision.excerpt) post.excerpt = revision.excerpt;
        if (revision.template) post.template = revision.template;

        await post.save();
        revalidateBlogs(post.slug);

        const updated = await BlogPost.findById(id)
            .populate('author', 'name avatar')
            .populate('coverImage');

        res.json({ message: 'Revision restored successfully', post: updated });
    } catch (err) {
        console.error('restoreRevision error:', err);
        res.status(400).json({ error: err.message });
    }
};
