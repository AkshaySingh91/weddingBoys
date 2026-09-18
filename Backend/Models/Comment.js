import mongoose from 'mongoose';
import BlogPost from './blogPost.js';

const commentSchema = new mongoose.Schema({
    blogPost: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'BlogPost',
        required: true,
        index: true
    },
    // Shallow 1-level threading: null = top-level comment.
    parent: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Comment',
        default: null,
        index: true
    },
    // Top-level thread anchor for fast hierarchical lookups.
    threadRoot: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Comment',
        default: null,
        index: true
    },
    author: {
        name: {
            type: String,
            required: true,
            trim: true,
            maxlength: 80
        },
        email: {
            type: String,
            required: true,
            lowercase: true,
            trim: true
        },
        website: {
            type: String,
            trim: true,
            default: ''
        }
    },
    body: {
        type: String,
        required: true,
        maxlength: 3000,
        trim: true
    },
    status: {
        type: String,
        enum: ['pending', 'approved', 'spam', 'rejected'],
        default: 'pending',
        index: true
    },
    likes: {
        type: Number,
        default: 0
    },
    isStudioReply: {
        type: Boolean,
        default: false
    },
    isPinned: {
        type: Boolean,
        default: false
    },
    edited: {
        type: Boolean,
        default: false
    },
    reportsCount: {
        type: Number,
        default: 0
    },
    meta: {
        ipHash: { type: String, select: false },
        userAgent: { type: String, select: false },
        country: { type: String, default: '' }
    }
}, {
    timestamps: true
});

// Helper static method to recalculate and sync BlogPost.commentCount
commentSchema.statics.syncCommentCount = async function (blogPostId) {
    if (!blogPostId) return;
    try {
        const approvedCount = await this.countDocuments({
            blogPost: blogPostId,
            status: 'approved'
        });
        await BlogPost.findByIdAndUpdate(blogPostId, {
            commentCount: approvedCount
        });
    } catch (err) {
        console.error('[Comment] syncCommentCount error:', err.message);
    }
};

// Post-save hook to refresh counter when status changes
commentSchema.post('save', async function () {
    await this.constructor.syncCommentCount(this.blogPost);
});

// Post-delete hook
commentSchema.post('findOneAndDelete', async function (doc) {
    if (doc?.blogPost) {
        await mongoose.model('Comment').syncCommentCount(doc.blogPost);
    }
});

const Comment = mongoose.model('Comment', commentSchema);
export default Comment;
