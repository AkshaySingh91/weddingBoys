// controllers/blogController.js
import BlogPost from '../Models/blogPost.js';
import { putObjectUrl, generatePublicUrl } from './awsController.js'

const calculateReadingTime = (content) => {
    const wordsPerMinute = 200;
    const wordCount = content.split(/\s+/).length;
    return Math.ceil(wordCount / wordsPerMinute);
};

// /api/admin/blog/
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
// /api/admin/blog/
const createPost = async (req, res) => {
    try {
        const { featuredImage, gallery, ...rest } = req.body;
        const blogData = {
            ...rest,
            ...(featuredImage && {
                featuredImage: {
                    key: featuredImage.key,
                    url: featuredImage.publicUrl
                }
            }),
            gallery: gallery.map(img => ({
                key: img.key,
                url: img.publicUrl,
                caption: img.caption || ''
            })),
            author: req.user._id,
            readingTime: calculateReadingTime(req.body.content)
        };
        const blog = new BlogPost(blogData);
        await blog.save();

        res.status(201).json(blog);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};
// /api/admin/blog/
const updatePost = async (req, res) => {
    try {
        const { id } = req.params;
        const blogData = {
            ...req.body,
            readingTime: calculateReadingTime(req.body.content)
        };

        const blog = await BlogPost.findByIdAndUpdate(
            id,
            blogData,
            { new: true, runValidators: true }
        );

        if (!blog) return res.status(404).json({ error: 'Blog not found' });
        res.json(blog);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};
// /api/admin/blog/
const getAdminPosts = async (req, res) => {
    try {
        const posts = await BlogPost.find().sort('-createdAt');
        res.json(posts);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
};

const getPostBySlug = async (req, res) => {
    try {
        const post = await BlogPost.findOne({ slug: req.params.slug })
            .populate('author', 'name');

        if (!post || !post.isPublished) {
            return res.status(404).json({ error: 'Post not found' });
        }

        res.json(post);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
};

const deletePost = async (req, res) => {
    try {
        const blog = await BlogPost.findById(req.params.id);
        if (!blog) return res.status(404).json({ error: 'Blog not found' });

        // Delete featured image
        if (blog.featuredImage && blog.featuredImage.key) {
            await deleteObject(blog.featuredImage.key);
        }

        // Delete gallery images
        await Promise.all(blog.gallery.map(async image => {
            if (image.key) {
                await deleteObject(image.key);
            }
        }));

        await blog.remove();
        res.json({ message: 'Blog deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};


export {
    createPost,
    updatePost,
    getAdminPosts,
    getPostBySlug,
    deletePost,
    getBlogUploadUrl
}