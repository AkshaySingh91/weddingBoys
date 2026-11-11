import { itemStatus } from '../../Services/portfolioStatus.js';
import { pagination } from '../../Utils/pagination.js';
import express from "express"
import ClientSchema from '../../Models/ClientSchema.js'
import { getObjectUrl } from '../../Controllers/awsController.js'
import { mediaUrlForKey } from '../../Utils/mediaUrl.js';
import * as portfolio from '../../Services/portfolioService.js';
// Prefer the immutable R2 CDN URL for any asset already migrated; fall back to a
// signed S3 URL while the migration is in flight. Lookups are batched, so a page
// of assets costs one query, not one per asset.
const mediaUrl = (key) => mediaUrlForKey(key, getObjectUrl);

import { getAllTags } from "../../Controllers/TagsController.js"
import { publicTaxonomy } from '../../Services/taxonomy.js';
import { getFilmDiscovery } from '../../Services/filmDiscovery.js';
const Route = express.Router();
Route.get('/api/films/discovery', async (_req, res) => {
    try { res.json(await getFilmDiscovery()); }
    catch (error) {
        console.error('Film discovery failed:', error.message);
        res.status(503).json({ message: 'Films could not be loaded. Please try again.' });
    }
});
Route.get('/api/videos/:id/status', itemStatus('Video'));

// it will get all videos with inc order of priority for given tags
Route.get("/api/videos", async (req, res) => {
    try {
        const { page, limit } = pagination(req.query, 12);
        const { sort } = req.query;
        const tag = portfolio.parseTags(req.query.tag);

        // PortfolioItem path: a plain indexed find instead of $unwind over every
        // client document. Same response shape, so the frontend is unaffected.
        if (portfolio.portfolioReadsEnabled()) {
            const { items, total } = await portfolio.findFeedWithTotal({ kind: 'Video', tags: tag, page, limit, sort });
            const totalPages = Math.ceil(total / limit) || 1;
            return res.status(200).json({
                client: items.map(portfolio.toLegacyVideoRow),
                pagination: {
                    total,
                    totalPages,
                    currentPage: page,
                    limit,
                    hasNextPage: page < totalPages,
                    hasPrevPage: page > 1,
                },
                total,
                totalPages,
                page,
                limit,
                hasMore: page < totalPages,
            });
        }

        const skipCount = (page - 1) * limit;
        const matchStage = tag.length > 0
            ? [{ $match: { "videos.tags": { $in: tag } } }]
            : [];

        const pipeline = [
            { $unwind: "$videos" },
            ...matchStage,
            { $sort: { "videos.isHeroVideo": -1, "videos.heroPriority": -1, "videos.generalPriority": -1 } },
            { $skip: skipCount },
            { $limit: limit },
            {
                $group: {
                    _id: "$_id",
                    clientName: { $first: "$clientName" },
                    videos: { $push: "$videos" },
                },
            },
            { $unwind: "$videos" },
        ];

        const countPipeline = [
            { $unwind: "$videos" },
            ...matchStage,
            { $count: "total" },
        ];

        const [clientDocs, countResult] = await Promise.all([
            ClientSchema.aggregate(pipeline),
            ClientSchema.aggregate(countPipeline),
        ]);

        const total = countResult[0]?.total || 0;
        const totalPages = Math.ceil(total / limit) || 1;
        let client = clientDocs;

        if (client.length) {
            // format date
            client = client.map((v) => {
                const months = [
                    "January", "February",
                    "March", "April", "May",
                    "June", "July", "August",
                    "September", "October",
                    "November", "December"
                ];
                let date = `${new Date(v.videos.videoShootDate).getDate()} ${months[new Date(v.videos.videoShootDate).getMonth()]}`
                v.videos.videoShootDate = date;
                v.videos._id = v.videos._id.toString();
                return v;
            })
            // get video thumb url 
            for (const c of client) {
                if (c.videos.thumbnailMetaData && c.videos.thumbnailMetaData.key) {
                    const thumbnailKey = c.videos.thumbnailMetaData.key;
                    const url = await mediaUrl(thumbnailKey);
                    c.thumbnailUrl = url;
                }
            }
        } 
        res.status(200).json({
            client,
            pagination: {
                total,
                totalPages,
                currentPage: page,
                limit,
                hasNextPage: page < totalPages,
                hasPrevPage: page > 1,
            },
            total,
            totalPages,
            page,
            limit,
            hasMore: page < totalPages,
        });

    } catch (error) {
        console.error("Error fetching videos:", error);
        res.status(500).json({ message: "Failed to fetch videos", error });
    }
});
// it will give specific video details 
// Neither path could answer a malformed id: the lookup threw a CastError, and with
// no try/catch (Express 4 does not catch async errors) the request simply hung.
async function getSpecificVideo(req, res, next) {
    try {
        if (!portfolio.isItemId(req.params.id)) return res.status(404).json({ message: 'Video not found' });
        return await getSpecificVideoById(req, res);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message });
    }
}

async function getSpecificVideoById(req, res) {
    const { id = null } = req.params

    // PortfolioItem path. Resolves by either the new _id or the old subdoc id,
    // so every /films/:videoId URL already published in the sitemap keeps working.
    if (id && portfolio.portfolioReadsEnabled()) {
        const item = await portfolio.findById(id);
        if (!item || item.kind !== 'Video') return res.status(404).json({ message: 'Video not found' });

        const [siblings, photos] = await Promise.all([
            portfolio.findSiblings({ clientId: item.client?._id || item.client, kind: 'Video', excludeId: item._id }),
            portfolio.findSiblings({ clientId: item.client?._id || item.client, kind: 'Photo' }),
        ]);
        const row = portfolio.toLegacyVideoRow(item);
        return res.status(200).json({
            clientName: item.client?.clientName,
            selectedVideo: {
                ...row.videos,
                publishedAt: item.publishedAt || null,
                durationSec: item.render?.durationSec || null,
                videoShootDate: portfolio.monthYear(item.shootDate),
                url: row.url, loopUrl: row.loopUrl, thumbnailUrl: row.thumbnailUrl,
                embedUrl: row.embedUrl, external: row.external,
            },
            wedding: await portfolio.storyLinkFor(item.client?._id || item.client),
            remainingVideos: siblings.map((s2) => {
                const r = portfolio.toLegacyVideoRow(s2);
                return { ...r.videos, thumbnailMetaData: { ...r.videos.thumbnailMetaData, url: r.thumbnailUrl } };
            }),
            photos: photos.map(portfolio.toLegacyPhotoRow),
        });
    }

    if (id) {
        // get client name & that photo
        const clientData = await ClientSchema.findOne({ "videos._id": id }, {
            "clientName": 1,
            "videos.$": 1,
        }).lean();

        if (!clientData || !(clientData.videos[0].videoMetaData && clientData.videos[0].videoMetaData.key)) return res.status(404).json({ message: "Video not found" });
        // change date format & id of photo
        const selectedVideo = clientData.videos[0]
        const months = [
            "January", "February",
            "March", "April", "May",
            "June", "July", "August",
            "September", "October",
            "November", "December"
        ];
        let date = `${months[new Date(selectedVideo.videoShootDate).getMonth()]} ${new Date(selectedVideo.videoShootDate).getFullYear()}`
        selectedVideo.videoShootDate = date;
        selectedVideo._id = selectedVideo._id.toString();
        // get url for selected video
        selectedVideo.url = await mediaUrl(selectedVideo.videoMetaData.key);

        // Fetch remaining videos of the same client
        const remainingPhotoAndVideo = await ClientSchema.findOne({ _id: clientData._id }).lean();
        // Filter out the selected video
        let otherVideos = remainingPhotoAndVideo.videos.filter(video => video._id.toString() !== id);
        // change format of _id
        otherVideos = otherVideos.map(video => ({ ...video, _id: video._id.toString() })); //very imp
        // get url for other video
        for (const otherVideo of otherVideos) {
            if (otherVideo.videoMetaData && otherVideo.videoMetaData.key)
                otherVideo.thumbnailMetaData.url = await mediaUrl(otherVideo.thumbnailMetaData.key)
            let date = `${months[new Date(otherVideo.videoShootDate).getMonth()]} ${new Date(otherVideo.videoShootDate).getFullYear()}`
            // Was `selectedVideo.videoShootDate = date`, so a film page showed the
            // shoot date of the wedding's last other film instead of its own.
            otherVideo.videoShootDate = date;
        }
        // get all photo of client
        const allPhotos = remainingPhotoAndVideo.photos.map((p) => ({ ...p, _id: p._id.toString() }))
        for (const p of allPhotos) {
            if (p.photoMetaData && p.photoMetaData.key)
                p.photoMetaData.url = await mediaUrl(p.photoMetaData.key)
        } 
        res.status(200).json({
            clientName: clientData.clientName,
            wedding: await portfolio.storyLinkFor(clientData._id),
            selectedVideo,
            remainingVideos: otherVideos,
            photos: allPhotos
        });
    } else {
        res.status(400).json({ message: "Invalid Video Id" })
    }
}

Route.get("/api/videos/:id", getSpecificVideo)
//TODO:  filmpage video route , in this route we filter common video eg if filmpage have tag1 tag2 than 1 video can have both tags thus it will show twice on page thus we need to remove common video from 2 tags
Route.get("/api/videos/:id/recommended", getRecommendedVideos);

async function getRecommendedVideos(req, res, next) {
    try {
        const { id } = req.params;
        const { page, limit } = pagination(req.query, 10); // Infinite scrolling support
        if (!portfolio.isItemId(id)) return res.status(404).json({ message: 'videos not found' });

        if (portfolio.portfolioReadsEnabled()) {
            const item = await portfolio.findById(id);
            if (!item || item.kind !== 'Video') return res.status(404).json({ message: 'videos not found' });
            const recs = await portfolio.findRecommended({ item, page: parseInt(page), limit: parseInt(limit) });
            return res.status(200).json({
                recommendedVideos: recs.map((r) => {
                    const row = portfolio.toLegacyVideoRow(r);
                    return {
                        ...row.videos,
                        videoShootDate: portfolio.monthYear(r.shootDate),
                        clientName: row.clientName, url: row.thumbnailUrl, thumbnailUrl: row.thumbnailUrl,
                    };
                }),
            });
        }

        // Fetch the selected photo to get its tags
        const clientData = await ClientSchema.findOne({ "videos._id": id }, { "videos.$": 1 });
        if (!clientData) return res.status(404).json({ message: "videos not found" });

        const selectedVideos = clientData.videos[0];
        const tags = selectedVideos.tags;

        // Find videos from other clients with similar tags for RECOMMENDATION 
        let recommendedVideos = await ClientSchema.aggregate([
            { $unwind: "$videos" },
            {
                $match: {
                    "videos.tags": { $in: tags },
                    "videos._id": { $ne: selectedVideos._id }
                }
            },
            {
                $sort: { "videos.heroPriority": -1, "videos.generalPriority": -1 }
            },
            {
                $skip: (page - 1) * limit
            },
            // This was commented out, so /recommended returned EVERY video sharing
            // a tag and then signed a URL for each one in a serial loop below. With
            // a common tag across a large library that is thousands of signature
            // round-trips on a public endpoint, per request.
            {
                $limit: parseInt(limit)
            },
            {
                $project: {
                    _id: "$videos._id", //very imp
                    videoMetaData: "$videos.videoMetaData",
                    thumbnailMetaData: "$videos.thumbnailMetaData",
                    tags: "$videos.tags",
                    videoShootDate: "$videos.videoShootDate",
                    generalPriority: "$videos.generalPriority",
                    clientName: "$clientName"
                }
            }
        ]);
        recommendedVideos = recommendedVideos.map(video => {
            const months = [
                "January", "February",
                "March", "April", "May",
                "June", "July", "August",
                "September", "October",
                "November", "December"
            ];
            let date = `${months[new Date(video.videoShootDate).getMonth()]} ${new Date(video.videoShootDate).getFullYear()}`
            return {
                ...video,
                _id: video._id.toString(),  //very imp
                videoShootDate: date
            }
        }); //very imp
        // get url for other recommendedVideos
        for (const video of recommendedVideos) { 
            video.thumbnailMetaData.url = await mediaUrl(video.thumbnailMetaData.key)
        } 
        res.status(200).json({ recommendedVideos });
    } catch (error) {
        console.log(error)
        res.status(500).json({ message: error.message });
    }
}

Route.get("/api/get-all-tags", getAllTags);

// The tag system, public: every visible group (Ceremony, Film type, the
// categories) with its visible tags, in the order the admin set.
Route.get("/api/tags", async (req, res) => {
    try {
        res.status(200).json({ groups: await publicTaxonomy() });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

export default Route;
