import Enquiry from '../Models/EnquirySchema.js';
import ClientSchema from '../Models/ClientSchema.js';
import BlogPost from '../Models/blogPost.js';
import Media from '../Models/Media.js';
import PricingPackage from '../Models/PricingPackage.js';

const DAY = 24 * 60 * 60 * 1000;
const pctGrowth = (curr, prev) => {
    if (!prev) return curr ? 100 : 0;
    return Math.round(((curr - prev) / prev) * 100);
};

/**
 * GET /api/admin/analytics/dashboard  — Command Center payload.
 *
 * NOTE on time: EnquirySchema was created with `{ timestamp: true }` (a typo for
 * `timestamps: true`), so there is no reliable createdAt. We derive creation
 * time from the ObjectId via `$toDate: '$_id'`, which works with zero data
 * backfill. Fixing the schema to `timestamps: true` is recommended but optional.
 */
export async function getDashboard(_req, res) {
    try {
        const now = new Date();
        const weekAgo = new Date(now - 7 * DAY);
        const twoWeeksAgo = new Date(now - 14 * DAY);

        // ---- 1) Enquiry KPIs + funnel, in a single pipeline via $facet ----
        const [enquiryStats] = await Enquiry.aggregate([
            { $addFields: { createdAt: { $toDate: '$_id' } } },
            {
                $facet: {
                    total: [{ $count: 'n' }],
                    thisWeek: [{ $match: { createdAt: { $gte: weekAgo } } }, { $count: 'n' }],
                    lastWeek: [{ $match: { createdAt: { $gte: twoWeeksAgo, $lt: weekAgo } } }, { $count: 'n' }],
                    // Funnel: submitted -> viewed (add a `status`/`booked` field to extend).
                    viewed: [{ $match: { isViewed: true } }, { $count: 'n' }],
                    // Where leads come from (Reach = "how did you hear about us").
                    bySource: [
                        { $group: { _id: '$Reach', count: { $sum: 1 } } },
                        { $sort: { count: -1 } },
                    ],
                    // 8-week trend for a sparkline.
                    trend: [
                        { $match: { createdAt: { $gte: new Date(now - 56 * DAY) } } },
                        { $group: { _id: { $dateTrunc: { date: '$createdAt', unit: 'week' } }, count: { $sum: 1 } } },
                        { $sort: { _id: 1 } },
                    ],
                    recent: [
                        { $sort: { createdAt: -1 } },
                        { $limit: 6 },
                        { $project: { Bride: 1, Groom: 1, Contact: 1, Reach: 1, isViewed: 1, createdAt: 1, Date: 1 } },
                    ],
                },
            },
        ]);

        const num = (facet) => facet?.[0]?.n || 0;
        const total = num(enquiryStats.total);
        const thisWeek = num(enquiryStats.thisWeek);
        const lastWeek = num(enquiryStats.lastWeek);
        const viewed = num(enquiryStats.viewed);

        // ---- 2) Upcoming shoots (from embedded client videos/photos) ----
        const upcomingShoots = await ClientSchema.aggregate([
            { $project: { clientName: 1, shoots: { $concatArrays: ['$videos', '$photos'] } } },
            { $unwind: '$shoots' },
            {
                $project: {
                    clientName: 1,
                    shootDate: { $ifNull: ['$shoots.videoShootDate', '$shoots.photoShootDate'] },
                    location: { $ifNull: ['$shoots.videoLocation', '$shoots.photoLocation'] },
                },
            },
            { $match: { shootDate: { $gte: now } } },
            { $sort: { shootDate: 1 } },
            { $limit: 8 },
        ]);

        // ---- 3) "Popular" films — proxied by hero films + priority ----
        // (No view tracking exists yet; add `viewCount` to a Film/video to make
        //  this a true popularity ranking. Flagged in the design notes.)
        const popularFilms = await ClientSchema.aggregate([
            { $unwind: '$videos' },
            { $match: { 'videos.isHeroVideo': true } },
            {
                $project: {
                    clientName: 1,
                    videoId: '$videos._id',
                    heroPriority: '$videos.heroPriority',
                    generalPriority: '$videos.generalPriority',
                    location: '$videos.videoLocation',
                },
            },
            { $sort: { heroPriority: -1, generalPriority: -1 } },
            { $limit: 5 },
        ]);

        // ---- 4) Content inventory (cheap counts) ----
        const [publishedBlogs, mediaAssets, activePackages, totalClients] = await Promise.all([
            BlogPost.countDocuments({ status: 'Published' }),
            Media.countDocuments({ status: { $ne: 'Archived' } }),
            PricingPackage.countDocuments({ isActive: true }),
            ClientSchema.estimatedDocumentCount(),
        ]);

        return res.status(200).json({
            kpis: {
                totalInquiries: total,
                inquiriesThisWeek: thisWeek,
                weekOverWeekGrowth: pctGrowth(thisWeek, lastWeek),
                unviewed: total - viewed,
                totalClients,
                publishedBlogs,
                mediaAssets,
                activePackages,
            },
            funnel: {
                submitted: total,
                viewed,
                // Conversion = viewed / submitted until a `booked` status is added.
                viewRate: total ? Math.round((viewed / total) * 100) : 0,
            },
            leadSources: enquiryStats.bySource,
            trend: enquiryStats.trend,
            recentInquiries: enquiryStats.recent,
            upcomingShoots,
            popularFilms,
        });
    } catch (error) {
        console.error('getDashboard error:', error);
        return res.status(500).json({ message: 'Server error', error: error.message });
    }
}
