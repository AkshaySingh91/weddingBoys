import mongoose from 'mongoose';

const blogDailyStatSchema = new mongoose.Schema({
    // Normalized to midnight UTC (YYYY-MM-DDT00:00:00.000Z)
    date: {
        type: Date,
        required: true,
        index: true
    },
    blogPost: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'BlogPost',
        required: true,
        index: true
    },
    // Total raw impressions / hits
    views: {
        type: Number,
        default: 0,
        min: 0
    },
    // Session-deduplicated impressions
    uniqueViews: {
        type: Number,
        default: 0,
        min: 0
    },
    // Readers who reached scroll depth >= 90%
    readCompletes: {
        type: Number,
        default: 0,
        min: 0
    },
    // Readers who clicked an enquiry CTA inside the story
    ctaClicks: {
        type: Number,
        default: 0,
        min: 0
    }
}, {
    timestamps: true
});

// Compound unique index ensuring 1 document per blog post per day for O(1) atomic increments
blogDailyStatSchema.index({ date: 1, blogPost: 1 }, { unique: true });

// Static helper to normalize any date to midnight UTC
blogDailyStatSchema.statics.normalizeDate = function (d = new Date()) {
    const date = new Date(d);
    return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
};

// Static helper to atomically increment counters
blogDailyStatSchema.statics.recordEvent = async function ({ blogPostId, type = 'view', isUnique = false }) {
    if (!blogPostId) return null;
    const todayMidnight = this.normalizeDate();

    const inc = {};
    if (type === 'view') {
        inc.views = 1;
        if (isUnique) inc.uniqueViews = 1;
    } else if (type === 'read_complete') {
        inc.readCompletes = 1;
    } else if (type === 'cta_click') {
        inc.ctaClicks = 1;
    }

    return this.findOneAndUpdate(
        { date: todayMidnight, blogPost: blogPostId },
        { $inc: inc },
        { upsert: true, new: true, setDefaultsOnInsert: true }
    );
};

const BlogDailyStat = mongoose.model('BlogDailyStat', blogDailyStatSchema);
export default BlogDailyStat;
