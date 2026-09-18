// controllers/blogController.js
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import BlogPost from '../Models/blogPost.js';
import BlogPostRevision from '../Models/BlogPostRevision.js';
import Admin from '../Models/adminSchema.js';
import Media from '../Models/Media.js';
import { putObjectUrl, generatePublicUrl } from './awsController.js';
import { makeUniqueSlug } from '../Utils/slugMaker.js';
import { extractTableOfContents } from '../Utils/tocExtractor.js';
import { sanitizeBlogHtml } from '../Utils/sanitizeHtml.js';
import { ROLES } from '../constants.js';

const calculateReadingTime = (content = '') => {
    const plain = content.replace(/<[^>]*>/g, ' ');
    const wordCount = plain.split(/\s+/).filter(Boolean).length;
    return Math.max(1, Math.ceil(wordCount / 200));
};

const isEditorOrSuperAdmin = (req) => {
    const role = req.user?.role || req.admin?.appRole;
    return role === ROLES.SUPER_ADMIN || role === ROLES.EDITOR;
};

// Fields the client is allowed to set/update on a post.
const EDITABLE_FIELDS = [
    'title', 'excerpt', 'contentJson', 'category', 'tags', 'keywords',
    'metaTitle', 'metaDescription', 'canonicalUrl', 'socialTitle', 'socialDescription',
    'status', 'coverImage', 'gallery', 'inlineMedia', 'seoScore',
    'mood', 'season', 'budget', 'venue', 'style', 'testimonial', 'tips', 'callToAction',
    'publishedAt',
    // Phase 1 additions
    'template', 'faq', 'vendorCredits', 'howToSteps', 'focusKeyword',
    'allowComments', 'scheduledFor', 'contributors',
    // Phase 2 additions
    'weddingDetails', 'featuredVideo', 'testimonialAuthor',
];

const pickEditable = (body) => {
    const out = {};
    for (const key of EDITABLE_FIELDS) {
        if (body[key] !== undefined) out[key] = body[key];
    }
    return out;
};

const resolveAuthor = async (req) => {
    if (!req.admin?.email) return null;
    const admin = await Admin.findOne({ email: req.admin.email }).select('_id');
    return admin?._id || null;
};

// Legacy blog-specific presign kept for back-compat; new editor uses /api/admin/media.
// POST /api/admin/blogs/presigned-urls
const getBlogUploadUrl = async (req, res) => {
    try {
        const { files } = req.body;
        if (!files || !Array.isArray(files)) {
            return res.status(400).json({ error: 'Invalid files data' });
        }
        const uploadData = await Promise.all(files.map(async file => {
            const { fileName, fileType, folder } = file;
            const key = `blogs/${folder}/${Date.now()}-${fileName.replace(/\s+/g, '-')}`;
            const presignedUrl = await putObjectUrl(key, fileType);
            const publicUrl = generatePublicUrl(key);
            return { key, presignedUrl, publicUrl };
        }));
        res.json(uploadData);
    } catch (error) {
        console.error('Presigned URL Error:', error);
        res.status(500).json({ error: 'Failed to generate upload URLs' });
    }
};

// POST /api/admin/blogs
const createPost = async (req, res) => {
    try {
        const author = await resolveAuthor(req);
        if (!author) return res.status(401).json({ error: 'Author (admin) could not be resolved' });

        const data = pickEditable(req.body);

        // Role guard: Only Editor or SuperAdmin may create a post directly as Published or Scheduled (FR-PUB-01, FR-PUB-02)
        if (data.status === 'Published' || data.status === 'Scheduled') {
            if (!isEditorOrSuperAdmin(req)) {
                return res.status(403).json({ error: 'Forbidden: Only Editors or SuperAdmins may publish or schedule stories.' });
            }
        }

        // Normalize the rendered HTML: inject heading anchor ids + build the TOC.
        // Sanitise BEFORE the TOC pass, so ids are only ever extracted from
        // markup that survives sanitisation.
        const rawHtml = sanitizeBlogHtml(req.body.content || '');
        const { html, toc } = extractTableOfContents(rawHtml);
        data.content = html;
        data.tableOfContents = toc;
        data.readingTime = calculateReadingTime(html);
        data.author = author;
        data.slug = await makeUniqueSlug(BlogPost, req.body.slug || data.title);

        const blog = new BlogPost(data);
        await blog.save();

        res.status(201).json(blog);
    } catch (err) {
        console.error('createPost error:', err);
        res.status(400).json({ error: err.message });
    }
};

// PUT /api/admin/blogs/:id
const updatePost = async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(404).json({ error: 'Blog not found' });
        }
        const existing = await BlogPost.findById(id);
        if (!existing) return res.status(404).json({ error: 'Blog not found' });

        const data = pickEditable(req.body);

        // Role guard: Only Editor or SuperAdmin may change status to Published or Scheduled (FR-PUB-01, FR-PUB-02)
        if ((data.status === 'Published' || data.status === 'Scheduled') && existing.status !== data.status) {
            if (!isEditorOrSuperAdmin(req)) {
                return res.status(403).json({ error: 'Forbidden: Only Editors or SuperAdmins may publish or schedule stories.' });
            }
        }

        // Recompute TOC / reading time only when content actually changes.
        if (req.body.content !== undefined) {
            const { html, toc } = extractTableOfContents(sanitizeBlogHtml(req.body.content || ''));
            data.content = html;
            data.tableOfContents = toc;
            data.readingTime = calculateReadingTime(html);
        }

        // Re-slug if caller sent a new slug; store legacy slug for 301 redirects (FR-PUB-03)
        if (req.body.slug && req.body.slug !== existing.slug) {
            const oldSlug = existing.slug;
            data.slug = await makeUniqueSlug(BlogPost, req.body.slug, id);
            if (existing.status === 'Published' || (existing.previousSlugs && existing.previousSlugs.length > 0)) {
                existing.previousSlugs = existing.previousSlugs || [];
                if (!existing.previousSlugs.includes(oldSlug)) {
                    existing.previousSlugs.push(oldSlug);
                }
            }
        }

        Object.assign(existing, data);
        await existing.save(); // save() so the status/publishedAt/readingTime hooks run

        res.json(existing);
    } catch (err) {
        console.error('updatePost error:', err);
        res.status(400).json({ error: err.message });
    }
};

// GET /api/admin/blogs  (all statuses)
const getAdminPosts = async (req, res) => {
    try {
        const posts = await BlogPost.find()
            .sort('-createdAt')
            // avatarMedia carries the author's photo for the article rail; the
            // legacy `avatar` object is kept for posts written before it existed.
            .populate({ path: 'author', select: 'name avatar avatarMedia', populate: { path: 'avatarMedia' } })
            .populate('coverImage');
        res.json(posts);
    } catch (err) {
        console.error('getAdminPosts error:', err);
        res.status(500).json({ error: 'Server error' });
    }
};

// GET /api/admin/blogs/:id  (single post, any status, full document)
const getAdminPostById = async (req, res, next) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            if (typeof next === 'function') return next();
            return res.status(404).json({ error: 'Blog not found' });
        }
        const post = await BlogPost.findById(req.params.id)
            // avatarMedia carries the author's photo for the article rail; the
            // legacy `avatar` object is kept for posts written before it existed.
            .populate({ path: 'author', select: 'name avatar avatarMedia', populate: { path: 'avatarMedia' } })
            .populate('coverImage')
            .populate('gallery')
            .populate('inlineMedia');
        if (!post) return res.status(404).json({ error: 'Blog not found' });
        res.json(post);
    } catch (err) {
        console.error('getAdminPostById error:', err);
        res.status(500).json({ error: 'Server error' });
    }
};

// GET /api/blogs  (public list — Published only)
const getPublishedPosts = async (req, res) => {
    try {
        const page = Math.max(parseInt(req.query.page) || 1, 1);
        const limit = Math.min(Math.max(parseInt(req.query.limit) || 12, 1), 50);
        const { category, tag, search } = req.query;

        const query = { status: 'Published' };
        if (category) query.category = category;
        if (tag) query.tags = tag;
        if (search) {
            const rx = new RegExp(search.trim(), 'i');
            query.$or = [{ title: rx }, { excerpt: rx }, { tags: rx }, { keywords: rx }];
        }

        const total = await BlogPost.countDocuments(query);
        const posts = await BlogPost.find(query)
            .sort('-publishedAt')
            .skip((page - 1) * limit)
            .limit(limit)
            // avatarMedia carries the author's photo for the article rail; the
            // legacy `avatar` object is kept for posts written before it existed.
            .populate({ path: 'author', select: 'name avatar avatarMedia', populate: { path: 'avatarMedia' } })
            .populate('coverImage')
            .select('-contentJson');

        res.json({ posts, page, limit, total, hasMore: page * limit < total });
    } catch (err) {
        console.error('getPublishedPosts error:', err);
        res.status(500).json({ error: 'Server error' });
    }
};

// GET /api/blogs/slug/:slug  (public single post + preview support + 301 redirect lookup)
const getPostBySlug = async (req, res) => {
    try {
        const { slug } = req.params;
        const { previewToken } = req.query;

        /**
         * A preview token authorises ONE post.
         *
         * It used to read `decoded.slug === slug || decoded.postId` — and every
         * token carries a postId, so the second clause was always true and any
         * preview link unlocked every unpublished post in the collection.
         * Verified: a token minted for one draft rendered two others.
         *
         * The postId is still accepted, but only when it identifies the post
         * actually being requested, so a link survives its post being renamed
         * without becoming a master key.
         */
        let previewClaim = null;
        if (previewToken) {
            try {
                const secret = process.env.JWT_SECRET || 'wb_editorial_secret_2026';
                const decoded = jwt.verify(previewToken, secret);
                if (decoded.role === 'preview') previewClaim = decoded;
            } catch {
                previewClaim = null;
            }
        }
        let isAuthorizedPreview = Boolean(previewClaim && previewClaim.slug === slug);

        let post = await BlogPost.findOne({ slug })
            // avatarMedia carries the author's photo for the article rail; the
            // legacy `avatar` object is kept for posts written before it existed.
            .populate({ path: 'author', select: 'name avatar avatarMedia', populate: { path: 'avatarMedia' } })
            .populate('coverImage')
            .populate('gallery')
            .populate('inlineMedia');

        // If post not found by slug, check previousSlugs for a 301 redirect (FR-PUB-03)
        if (!post) {
            const redirectedPost = await BlogPost.findOne({
                previousSlugs: slug,
                status: 'Published'
            }).select('slug');

            if (redirectedPost) {
                return res.json({ redirect: redirectedPost.slug, permanent: true });
            }
            return res.status(404).json({ error: 'Post not found' });
        }

        // A renamed post: the token's slug is stale but its postId still names
        // this exact document.
        if (!isAuthorizedPreview && previewClaim?.postId && String(post._id) === String(previewClaim.postId)) {
            isAuthorizedPreview = true;
        }

        if (post.status !== 'Published' && !isAuthorizedPreview) {
            return res.status(404).json({ error: 'Post not found' });
        }

        const responseData = post.toObject ? post.toObject() : post;
        if (isAuthorizedPreview && post.status !== 'Published') {
            responseData.isPreview = true;
        }

        res.json(responseData);
    } catch (err) {
        console.error('getPostBySlug error:', err);
        res.status(500).json({ error: 'Server error' });
    }
};

// GET /api/blogs/related/:slug  (same category, excludes current)
const getRelatedPosts = async (req, res) => {
    try {
        const current = await BlogPost.findOne({ slug: req.params.slug }).select('category tags _id');
        if (!current) return res.json({ posts: [] });

        const posts = await BlogPost.find({
            status: 'Published',
            _id: { $ne: current._id },
            $or: [{ category: current.category }, { tags: { $in: current.tags || [] } }]
        })
            .sort('-publishedAt')
            .limit(3)
            .populate('author', 'name')
            .populate('coverImage')
            .select('-contentJson -content');

        res.json({ posts });
    } catch (err) {
        console.error('getRelatedPosts error:', err);
        res.status(500).json({ error: 'Server error' });
    }
};

// DELETE /api/admin/blogs/:id  (archive post + its media)
const deletePost = async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(404).json({ error: 'Blog not found' });
        }
        const blog = await BlogPost.findById(req.params.id);
        if (!blog) return res.status(404).json({ error: 'Blog not found' });

        // Archive linked media rather than hard-deleting from S3.
        const mediaIds = [blog.coverImage, ...(blog.gallery || []), ...(blog.inlineMedia || [])].filter(Boolean);
        if (mediaIds.length) {
            await Media.updateMany({ _id: { $in: mediaIds } }, { status: 'Archived' });
        }

        await BlogPost.deleteOne({ _id: blog._id }); // Mongoose 8: document.remove() is gone
        res.json({ message: 'Blog deleted successfully' });
    } catch (err) {
        console.error('deletePost error:', err);
        res.status(500).json({ error: err.message });
    }
};

// PUT /api/admin/blogs/:id/publish  (status toggle)
const togglePublish = async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(404).json({ error: 'Blog not found' });
        }
        if (!isEditorOrSuperAdmin(req)) {
            return res.status(403).json({ error: 'Forbidden: Only Editors or SuperAdmins may change publication status.' });
        }
        const blog = await BlogPost.findById(req.params.id);
        if (!blog) return res.status(404).json({ error: 'Blog not found' });

        const targetStatus = req.body.status || (req.body.isPublished ? 'Published' : 'Draft');
        blog.status = targetStatus;
        if (targetStatus === 'Scheduled' && req.body.scheduledFor) {
            blog.scheduledFor = new Date(req.body.scheduledFor);
        }
        await blog.save();

        // Create a publish-snapshot revision for history.
        if (targetStatus === 'Published' && blog.contentJson) {
            const adminId = await resolveAuthor(req);
            await new BlogPostRevision({
                blogPost: blog._id,
                title: blog.title,
                contentJson: blog.contentJson,
                excerpt: blog.excerpt,
                template: blog.template,
                editedBy: adminId,
                reason: 'publish-snapshot',
            }).save();
        }

        res.json(blog);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

// GET /api/admin/blogs/:id/preview-token (FR-PUB-06)
const getPreviewToken = async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(404).json({ error: 'Blog not found' });
        }
        const blog = await BlogPost.findById(req.params.id).select('slug title status');
        if (!blog) return res.status(404).json({ error: 'Blog not found' });

        const secret = process.env.JWT_SECRET || 'wb_editorial_secret_2026';
        const token = jwt.sign(
            { postId: String(blog._id), slug: blog.slug, role: 'preview' },
            secret,
            { expiresIn: '24h' }
        );

        res.json({
            token,
            previewUrl: `/blogs/${blog.slug}?previewToken=${token}`,
            expiresIn: '24h',
        });
    } catch (err) {
        console.error('getPreviewToken error:', err);
        res.status(500).json({ error: err.message });
    }
};

// POST /api/blogs/:slug/like (public)
const togglePostLike = async (req, res) => {
    try {
        const { slug } = req.params;
        const { decrement } = req.body || {};
        const incValue = decrement ? -1 : 1;

        const post = await BlogPost.findOneAndUpdate(
            { slug },
            { $inc: { likeCount: incValue } },
            { new: true }
        ).select('slug likeCount');

        if (!post) {
            return res.status(404).json({ error: 'Blog not found' });
        }

        if (post.likeCount < 0) {
            post.likeCount = 0;
            await post.save();
        }

        res.json({ success: true, likeCount: post.likeCount });
    } catch (err) {
        console.error('togglePostLike error:', err);
        res.status(500).json({ error: err.message });
    }
};

export {
    createPost,
    updatePost,
    getAdminPosts,
    getAdminPostById,
    getPublishedPosts,
    getPostBySlug,
    getRelatedPosts,
    deletePost,
    togglePublish,
    getBlogUploadUrl,
    getPreviewToken,
    togglePostLike,
};
