import mongoose from 'mongoose';
import slugify from 'slugify';

const blogPostSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    slug: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    previousSlugs: [{
        type: String,
        trim: true,
    }],

    // ---- Content ----
    // Sanitized HTML cache (derived from contentJson; kept for backward compat / SSR fallback).
    content: {
        type: String,
        required: true
    },
    // Canonical Tiptap JSON AST — the authoritative source of truth.
    contentJson: {
        type: mongoose.Schema.Types.Mixed
    },
    excerpt: {
        type: String,
        maxlength: 200,
        required: true
    },

    // ---- Layout & templating ----
    template: {
        type: String,
        enum: ['cinematic-real-wedding', 'editorial-guide', 'photo-essay', 'minimal-journal'],
        default: 'editorial-guide'
    },

    // ---- Media (references into the polymorphic Media collection) ----
    coverImage: { type: mongoose.Schema.Types.ObjectId, ref: 'Media' },
    gallery: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Media' }],
    inlineMedia: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Media' }],
    // Legacy embedded cover kept for back-compat with any pre-existing rows.
    featuredImage: {
        key: String,
        url: String
    },

    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Admin',
        required: true
    },
    contributors: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Admin' }],

    // ---- SEO & taxonomy ----
    tags: [{ type: String, trim: true }],
    keywords: [{ type: String, trim: true }],
    category: {
        type: String,
        required: true,
        trim: true
    },
    metaTitle: String,
    metaDescription: String,
    canonicalUrl: String,
    socialTitle: String,
    socialDescription: String,
    focusKeyword: { type: String, trim: true },

    // ---- Structured content blocks (stored at document level for schema/SEO use) ----
    faq: [{
        question: { type: String, required: true, trim: true },
        answer: { type: String, required: true, trim: true }
    }],
    vendorCredits: [{
        role: { type: String, trim: true },       // e.g. "Venue", "Florist", "Planner"
        name: { type: String, trim: true },
        url: { type: String, trim: true },
        instagram: { type: String, trim: true }
    }],
    howToSteps: [{
        name: { type: String, trim: true },
        text: { type: String, trim: true },
        image: { type: String, trim: true }        // URL reference
    }],

    // ---- Lifecycle ----
    status: {
        type: String,
        enum: ['Draft', 'InReview', 'Scheduled', 'Published', 'Archived'],
        default: 'Draft',
        index: true
    },
    // Mirror of status for any legacy consumers; kept in sync by the pre-save hook.
    isPublished: {
        type: Boolean,
        default: false
    },
    publishedAt: Date,
    scheduledFor: Date,

    // ---- Engagement settings ----
    allowComments: { type: Boolean, default: true },

    // ---- Derived / metrics ----
    readingTime: Number,
    tableOfContents: [{
        id: String,
        text: String,
        level: Number
    }],
    seoScore: Number,

    // ---- Denormalized counters (updated by hooks/services, not directly by authors) ----
    viewCount: { type: Number, default: 0 },
    likeCount: { type: Number, default: 0 },
    commentCount: { type: Number, default: 0 },

    // ---- Wedding storytelling fields (used by the public article body) ----
    mood: {
        type: String,
        enum: ['romantic', 'elegant', 'rustic', 'modern', 'vintage', 'bohemian', 'fun', 'intimate', ''],
    },
    season: String,
    budget: String,
    venue: String,
    style: String,
    testimonial: String,
    testimonialAuthor: { type: String, trim: true },
    weddingDetails: {
        destination: { type: String, trim: true },
        venue: { type: String, trim: true },
        seasonMood: { type: String, trim: true },
        cinemaCrew: { type: String, trim: true },
        subtitle: { type: String, trim: true },
        flourishQuote: { type: String, trim: true },
        tagline: { type: String, trim: true },
        coupleNames: { type: String, trim: true },
    },
    featuredVideo: {
        url: { type: String, trim: true },
        title: { type: String, trim: true },
        duration: { type: String, trim: true },
        thumbnail: { type: String, trim: true },
    },
    tips: [String],
    callToAction: String
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

blogPostSchema.index({ status: 1, publishedAt: -1 });
blogPostSchema.index({ previousSlugs: 1 });

// Fallback slug (controller normally sets a collision-checked slug before save).
blogPostSchema.pre('validate', function (next) {
    if (!this.slug && this.title) {
        this.slug = slugify(this.title, {
            lower: true,
            strict: true,
            remove: /[*+~.()'"!:@]/g
        });
    }
    next();
});

// Keep isPublished/publishedAt consistent with status, and recompute reading time.
blogPostSchema.pre('save', function (next) {
    this.isPublished = this.status === 'Published';
    if (this.status === 'Published' && !this.publishedAt) {
        this.publishedAt = new Date();
    }
    if (this.status !== 'Published') {
        this.publishedAt = null;
    }
    if (this.isModified('content') && this.content) {
        const wordsPerMinute = 200;
        const plain = this.content.replace(/<[^>]*>/g, ' ');
        const wordCount = plain.split(/\s+/).filter(Boolean).length;
        this.readingTime = Math.max(1, Math.ceil(wordCount / wordsPerMinute));
    }
    next();
});

const BlogPost = mongoose.models.BlogPost || mongoose.model('BlogPost', blogPostSchema);
export default BlogPost;
