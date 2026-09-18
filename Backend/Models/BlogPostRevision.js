import mongoose from 'mongoose';

const blogPostRevisionSchema = new mongoose.Schema({
    blogPost: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'BlogPost',
        required: true,
        index: true
    },
    title: {
        type: String,
        trim: true
    },
    contentJson: {
        type: mongoose.Schema.Types.Mixed
    },
    // Snapshot of key metadata at revision time (for diffing / context).
    excerpt: { type: String, trim: true },
    template: { type: String, trim: true },
    editedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Admin'
    },
    reason: {
        type: String,
        enum: ['autosave', 'manual', 'publish-snapshot'],
        default: 'autosave'
    }
}, {
    timestamps: true   // createdAt = revision timestamp
});

// Fast lookup: newest revisions for a post.
blogPostRevisionSchema.index({ blogPost: 1, createdAt: -1 });

// Auto-prune: keep at most 50 autosaves per post.
// This static is called after each new autosave insert.
blogPostRevisionSchema.statics.pruneAutosaves = async function (blogPostId, keepCount = 50) {
    const autosaves = await this.find({ blogPost: blogPostId, reason: 'autosave' })
        .sort({ createdAt: -1 })
        .select('_id')
        .lean();

    if (autosaves.length > keepCount) {
        const idsToDelete = autosaves.slice(keepCount).map(r => r._id);
        await this.deleteMany({ _id: { $in: idsToDelete } });
    }
};

const BlogPostRevision = mongoose.models.BlogPostRevision
    || mongoose.model('BlogPostRevision', blogPostRevisionSchema);

export default BlogPostRevision;
