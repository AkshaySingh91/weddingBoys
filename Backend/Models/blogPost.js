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
    content: {
        type: String,
        required: true
    },
    excerpt: {
        type: String,
        maxlength: 160,
        required: true
    },
    featuredImage: {
        key: String,
        url: String
    },
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    tags: [{
        type: String,
        trim: true
    }],
    metaTitle: String,
    metaDescription: String,
    isPublished: {
        type: Boolean,
        default: false
    },
    publishedAt: Date,
    category: {
        type: String,
        enum: ['wedding-planning', 'photography', 'decor', 'vendors', 'stories'],
        required: true
    },
    readingTime: Number,
    seoScore: Number,
    mood: {
        type: String,
        enum: ['romantic', 'elegant', 'rustic', 'modern', 'vintage', '']
    },
    season: String,
    budget: String,
    venue: String,
    style: String,
    gallery: [{
        key: String,
        url: String,
        caption: String
    }],
    testimonial: String,
    tips: [String],
    callToAction: String,
    socialTitle: String,
    socialDescription: String
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Slug generation middleware
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

// Calculate reading time
blogPostSchema.pre('save', function (next) {
    if (this.isModified('content')) {
        const wordsPerMinute = 200;
        const wordCount = this.content.split(/\s+/).length;
        this.readingTime = Math.ceil(wordCount / wordsPerMinute);
    }
    next();
});

const BlogPost = mongoose.models.BlogPost || mongoose.model('BlogPost', blogPostSchema);
export default BlogPost