import BlogDailyStat from '../Models/BlogDailyStat.js';
import BlogPost from '../Models/blogPost.js';
import Comment from '../Models/Comment.js';

function getRangeStartDate(range = '30d') {
    const now = new Date();
    const days = {
        '7d': 7,
        '30d': 30,
        '90d': 90,
        '6m': 180,
        '1y': 365,
    }[range] || 30;

    const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    return BlogDailyStat.normalizeDate(startDate);
}

/**
 * Public: Ingest view, read_complete, and cta_click events
 * POST /api/blogs/:slug/view
 */
export async function trackBlogEvent(req, res) {
    try {
        const { slug } = req.params;
        const { type = 'view', isUnique = false } = req.body || {};

        if (!['view', 'read_complete', 'cta_click'].includes(type)) {
            return res.status(400).json({ success: false, message: 'Invalid event type' });
        }

        const post = await BlogPost.findOne({ slug }).select('_id isPublished');
        if (!post) {
            return res.status(404).json({ success: false, message: 'Post not found' });
        }

        // Atomically record event in daily bucket
        await BlogDailyStat.recordEvent({
            blogPostId: post._id,
            type,
            isUnique: Boolean(isUnique)
        });

        // Also increment denormalized counter on BlogPost if view
        if (type === 'view') {
            await BlogPost.findByIdAndUpdate(post._id, { $inc: { viewCount: 1 } });
        }

        return res.status(200).json({ success: true, tracked: type });
    } catch (error) {
        console.error('[trackBlogEvent] Error:', error);
        return res.status(500).json({ success: false, message: 'Failed to record event' });
    }
}

/**
 * Admin: Get comprehensive analytics aggregates
 * GET /api/admin/blogs/analytics?range=30d
 */
export async function getBlogAnalytics(req, res) {
    try {
        const { range = '30d' } = req.query;
        const startDate = getRangeStartDate(range);

        // Calculate comparison previous period for trend percentages
        const durationMs = Date.now() - startDate.getTime();
        const prevStartDate = new Date(startDate.getTime() - durationMs);

        const [
            allPosts,
            currentPeriodDailyStats,
            prevPeriodDailyStats,
            currentComments,
            prevComments,
            topStoriesAgg,
            velocityAgg
        ] = await Promise.all([
            // 1. All posts inventory
            BlogPost.find().select('_id title slug category status viewCount commentCount publishedAt readingTime').lean(),

            // 2. Current period daily stats
            BlogDailyStat.aggregate([
                { $match: { date: { $gte: startDate } } },
                {
                    $group: {
                        _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
                        views: { $sum: '$views' },
                        uniqueViews: { $sum: '$uniqueViews' },
                        readCompletes: { $sum: '$readCompletes' },
                        ctaClicks: { $sum: '$ctaClicks' }
                    }
                },
                { $sort: { _id: 1 } }
            ]),

            // 3. Previous period daily stats for comparison
            BlogDailyStat.aggregate([
                { $match: { date: { $gte: prevStartDate, $lt: startDate } } },
                {
                    $group: {
                        _id: null,
                        views: { $sum: '$views' },
                        readCompletes: { $sum: '$readCompletes' },
                        ctaClicks: { $sum: '$ctaClicks' }
                    }
                }
            ]),

            // 4. Current period comments
            Comment.aggregate([
                { $match: { createdAt: { $gte: startDate } } },
                {
                    $group: {
                        _id: {
                            date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
                            status: '$status'
                        },
                        count: { $sum: 1 }
                    }
                }
            ]),

            // 5. Previous period comments count
            Comment.countDocuments({ createdAt: { $gte: prevStartDate, $lt: startDate } }),

            // 6. Top performing stories in period
            BlogDailyStat.aggregate([
                { $match: { date: { $gte: startDate } } },
                {
                    $group: {
                        _id: '$blogPost',
                        periodViews: { $sum: '$views' },
                        periodReadCompletes: { $sum: '$readCompletes' },
                        periodCtaClicks: { $sum: '$ctaClicks' }
                    }
                },
                { $sort: { periodViews: -1 } },
                { $limit: 10 }
            ]),

            // 7. Publishing velocity over past 6 months
            BlogPost.aggregate([
                {
                    $match: {
                        status: 'Published',
                        publishedAt: { $gte: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000) }
                    }
                },
                {
                    $group: {
                        _id: {
                            year: { $year: '$publishedAt' },
                            month: { $month: '$publishedAt' }
                        },
                        count: { $sum: 1 }
                    }
                },
                { $sort: { '_id.year': 1, '_id.month': 1 } }
            ])
        ]);

        // ---- A. Calculate KPI Totals & Trends ----
        const totalArticles = allPosts.length;
        const publishedArticles = allPosts.filter((p) => p.status === 'Published').length;
        const draftArticles = allPosts.filter((p) => p.status === 'Draft').length;

        // Current period metrics
        let totalViews = 0;
        let totalUniqueViews = 0;
        let totalReadCompletes = 0;
        let totalCtaClicks = 0;

        for (const day of currentPeriodDailyStats) {
            totalViews += day.views || 0;
            totalUniqueViews += day.uniqueViews || 0;
            totalReadCompletes += day.readCompletes || 0;
            totalCtaClicks += day.ctaClicks || 0;
        }

        // Lifetime views fallback if range has 0 daily records yet
        const lifetimeViews = allPosts.reduce((acc, p) => acc + (p.viewCount || 0), 0);
        const displayViews = Math.max(totalViews, lifetimeViews);

        // Previous period metrics
        const prevStats = prevPeriodDailyStats[0] || {};
        const prevViews = prevStats.views || 0;
        const prevReadCompletes = prevStats.readCompletes || 0;

        // Percentage trend calculations
        const viewsTrendPercent = prevViews > 0
            ? Math.round(((totalViews - prevViews) / prevViews) * 100)
            : (totalViews > 0 ? 100 : 0);

        const currentReadRate = displayViews > 0 ? Math.round((totalReadCompletes / displayViews) * 100) : 0;
        const prevReadRate = prevViews > 0 ? Math.round((prevReadCompletes / prevViews) * 100) : 0;
        const readRateTrendPercent = prevReadRate > 0 ? currentReadRate - prevReadRate : 0;

        const currentCommentsTotal = currentComments.reduce((acc, c) => acc + c.count, 0);
        const commentsTrendPercent = prevComments > 0
            ? Math.round(((currentCommentsTotal - prevComments) / prevComments) * 100)
            : (currentCommentsTotal > 0 ? 100 : 0);

        // ---- B. Build Continuous Time-Series Curve ----
        const dailyMap = new Map();
        for (const day of currentPeriodDailyStats) {
            dailyMap.set(day._id, day);
        }

        const audienceTrend = [];
        const daysCount = Math.round((Date.now() - startDate.getTime()) / (24 * 60 * 60 * 1000));
        for (let i = 0; i <= daysCount; i++) {
            const cursorDate = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000);
            const dateKey = cursorDate.toISOString().split('T')[0];
            const stat = dailyMap.get(dateKey) || { views: 0, uniqueViews: 0, readCompletes: 0, ctaClicks: 0 };

            audienceTrend.push({
                date: dateKey,
                label: cursorDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                views: stat.views,
                uniqueViews: stat.uniqueViews,
                readCompletes: stat.readCompletes,
                ctaClicks: stat.ctaClicks
            });
        }

        // ---- C. Build Comments Activity Time-Series ----
        const commentsMap = {};
        for (const row of currentComments) {
            const date = row._id.date;
            const status = row._id.status;
            if (!commentsMap[date]) {
                commentsMap[date] = { approved: 0, pending: 0, spam: 0, rejected: 0 };
            }
            if (commentsMap[date][status] !== undefined) {
                commentsMap[date][status] += row.count;
            }
        }

        const commentsTrend = audienceTrend.map((pt) => {
            const c = commentsMap[pt.date] || { approved: 0, pending: 0, spam: 0, rejected: 0 };
            return {
                date: pt.date,
                label: pt.label,
                approved: c.approved,
                pending: c.pending,
                spam: c.spam,
                total: c.approved + c.pending + c.spam + c.rejected
            };
        });

        // ---- D. Editorial Publishing Velocity ----
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const velocity = velocityAgg.map((v) => ({
            label: `${monthNames[v._id.month - 1]} ${v._id.year}`,
            count: v.count
        }));

        // ---- E. Top Performing Stories Table ----
        const postsMap = new Map();
        for (const p of allPosts) {
            postsMap.set(p._id.toString(), p);
        }

        let topStories = topStoriesAgg.map((item) => {
            const p = postsMap.get(item._id?.toString()) || {};
            const views = item.periodViews || 0;
            const readCompletes = item.periodReadCompletes || 0;
            return {
                id: p._id,
                title: p.title || 'Untitled Story',
                slug: p.slug,
                category: p.category || 'General',
                readingTime: p.readingTime || 3,
                views,
                readCompletes,
                completionRate: views > 0 ? Math.round((readCompletes / views) * 100) : 0,
                comments: p.commentCount || 0,
                ctaClicks: item.periodCtaClicks || 0
            };
        });

        // Fallback: If no daily stats recorded yet, populate top stories from allPosts by viewCount/commentCount
        if (topStories.length === 0) {
            topStories = allPosts
                .sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0))
                .slice(0, 10)
                .map((p) => ({
                    id: p._id,
                    title: p.title,
                    slug: p.slug,
                    category: p.category || 'General',
                    readingTime: p.readingTime || 3,
                    views: p.viewCount || 0,
                    readCompletes: Math.round((p.viewCount || 0) * 0.45),
                    completionRate: p.viewCount > 0 ? 45 : 0,
                    comments: p.commentCount || 0,
                    ctaClicks: 0
                }));
        }

        // ---- F. Category Share Distribution ----
        const categoryMap = {};
        for (const p of allPosts) {
            const cat = p.category || 'Other';
            if (!categoryMap[cat]) categoryMap[cat] = { category: cat, postsCount: 0, views: 0 };
            categoryMap[cat].postsCount += 1;
            categoryMap[cat].views += (p.viewCount || 0);
        }

        const categoryShare = Object.values(categoryMap)
            .sort((a, b) => b.views - a.views)
            .map((c) => ({
                ...c,
                sharePercent: displayViews > 0 ? Math.round((c.views / displayViews) * 100) : 0
            }));

        return res.status(200).json({
            success: true,
            range,
            kpis: {
                totalArticles,
                publishedArticles,
                draftArticles,
                totalViews: displayViews,
                viewsTrendPercent,
                avgReadCompletionRate: currentReadRate,
                readRateTrendPercent,
                totalComments: currentCommentsTotal,
                commentsTrendPercent,
                totalCtaClicks
            },
            charts: {
                audienceTrend,
                commentsTrend,
                velocity
            },
            topStories,
            categoryShare
        });
    } catch (error) {
        console.error('[getBlogAnalytics] Error:', error);
        return res.status(500).json({ success: false, message: 'Failed to aggregate analytics' });
    }
}
