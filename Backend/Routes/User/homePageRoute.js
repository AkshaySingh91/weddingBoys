import express from 'express'
const Route = express.Router();
import websiteSettingSchema from '../../Models/WebsiteSettingSchema.js';
import ClientReview from '../../Models/ReviewSchema.js';
import ClientSchema from '../../Models/ClientSchema.js';
import { getObjectUrl } from '../../Controllers/awsController.js';

import { mediaUrlForKey, resolveNode } from '../../Utils/mediaUrl.js';
import Media from '../../Models/Media.js';
import * as portfolio from '../../Services/portfolioService.js';
// Prefer the immutable R2 CDN URL for any asset already migrated; fall back to a
// signed S3 URL while the migration is in flight. Lookups are batched, so a page
// of assets costs one query, not one per asset.
const mediaUrl = (key) => mediaUrlForKey(key, getObjectUrl);

const MONTHS = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
];

const shootDateLabel = (value) => {
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? null : `${d.getDate()} ${MONTHS[d.getMonth()]}`;
};

/**
 * Hero carousel payload.
 *
 * Every slide MUST carry a `posterUrl`. The homepage paints the poster first and
 * only mounts a <video> for the slide that is actually on screen — previously
 * this route returned no poster at all, so the client had nothing to show and
 * autoplayed every full-resolution master at once (~79 MB on first load) just to
 * get a first frame. The poster comes from `thumbnailMetaData`, which the client
 * schema has stored alongside every video all along.
 */
Route.get("/api/hero-videos", async (req, res) => {
    try {
        // PortfolioItem path. This also retires WebsiteSetting.heroVideos[]
        // entirely: hero membership becomes a flag on the item, so there is no
        // shared mutable array for a client edit to overwrite.
        if (portfolio.portfolioReadsEnabled()) {
            const items = await portfolio.findHeroVideos();
            return res.status(200).json({ heroVideos: items.map(portfolio.toLegacyHeroSlide) });
        }

        const settings = await websiteSettingSchema.findOne().select('heroVideos').lean();
        const heroVideos = (settings?.heroVideos || [])
            // `priority` is documented as "higher priority displayed first"; the old
            // .sort() was applied to findOne() and therefore did nothing.
            .slice()
            .sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));

        if (!heroVideos.length) return res.status(200).json({ heroVideos: [] });

        // One query for every client instead of a findById per hero video.
        const clientIds = [...new Set(heroVideos.map((h) => String(h.clientId)))];
        const clients = await ClientSchema.find({ _id: { $in: clientIds } }).lean();
        const clientById = new Map(clients.map((c) => [String(c._id), c]));

        // One query for every migrated hero asset, rather than a lookup per slide.
        const migratedDocs = await Media.find({
            'legacy.s3Key': { $in: heroVideos.map((h) => h.videoKey) },
        }).select('legacy.s3Key video blurDataURL dominantColor aspectRatio duration').lean();
        const migrated = new Map(migratedDocs.map((m) => [m.legacy.s3Key, m]));

        // Resolve each slide, then sign poster + video URLs in one parallel pass.
        const slides = await Promise.all(heroVideos.map(async (hero) => {
            const client = clientById.get(String(hero.clientId));
            if (!client) return null;

            const video = (client.videos || []).find(
                (v) => v?.videoMetaData?.key === hero.videoKey
            );
            if (!video) return null;

            const posterKey = video.thumbnailMetaData?.key || null;

            // Prefer the migrated asset: it carries the transcoded renditions and
            // a poster derived from the video itself.
            const asset = migrated.get(hero.videoKey);

            const [fallbackVideoUrl, fallbackPosterUrl] = await Promise.all([
                asset ? Promise.resolve(null) : mediaUrl(hero.videoKey),
                asset?.video?.posterUrl || !posterKey ? Promise.resolve(null) : mediaUrl(posterKey),
            ]);

            return {
                videoKey: hero.videoKey,
                priority: hero.priority,
                clientId: String(hero.clientId),
                clientName: client.clientName,
                videoId: String(video._id),
                videoShootDate: shootDateLabel(video.videoShootDate),
                videoLocation: video.videoLocation,

                posterKey,
                posterUrl: asset?.video?.posterUrl || fallbackPosterUrl,
                posterVariants: asset?.video?.posterVariants || [],
                blurDataURL: asset?.blurDataURL || null,
                dominantColor: asset?.dominantColor || null,
                aspectRatio: asset?.aspectRatio || null,
                duration: asset?.duration || null,

                // The carousel picks by connection tier: loop first (~1 MB),
                // then the 720p web rendition, and only ever the master behind a
                // deliberate click.
                loopUrl: asset?.video?.loopUrl || null,
                webUrl: asset?.video?.webUrl || null,
                sourceUrl: asset?.video?.sourceUrl || fallbackVideoUrl,

                // Back-compat for any client still reading `videoUrl`.
                videoUrl: asset?.video?.loopUrl || asset?.video?.webUrl
                    || asset?.video?.sourceUrl || fallbackVideoUrl,
            };
        }));

        res.status(200).json({ heroVideos: slides.filter(Boolean) });
    } catch (error) {
        console.log(error)
        res.status(500).json({ message: error.message })
    }
})
Route.get("/api/homepage/tags", async (req, res) => {
    try {
        const homepageTags = await websiteSettingSchema.findOne().select('homepageVideosTags');
        res.status(200).json({ tags: homepageTags.homepageVideosTags })
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
})
Route.get("/api/filmpage/tags", async (req, res, next) => {
    try {
        const filmsPageVideoTags = await websiteSettingSchema.findOne().select('filmsPageVideoTags');
        res.status(200).json({ tags: filmsPageVideoTags.filmsPageVideoTags })
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
})

// Gallery tag rows — the counterpart to /api/filmpage/tags. Until now
// photoPagePhotoTags had no reader at all, which is why the gallery could never
// be curated the way the films page can.
Route.get("/api/photopage/tags", async (req, res) => {
    try {
        const settings = await websiteSettingSchema.findOne().select('photoPagePhotoTags').lean();
        res.status(200).json({ tags: settings?.photoPagePhotoTags || [] })
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
})
// bts image of homepage
Route.get("/api/homepage/bts-image", async (req, res) => {
    try {
        const { BtsPhotos } = await websiteSettingSchema.findOne().select('BtsPhotos').lean()
        if (!BtsPhotos.length) {
            return res.status(400).json({ message: "No Bts Image. " })
        }
        // generate image for each key
        const btsUrls = []
        for (const key of BtsPhotos) {
            const url = await resolveNode(key.photoMetaData, getObjectUrl);
            btsUrls.push({
                key: key.photoMetaData.key, url
            })
        }
        res.status(200).json({ btsUrls })
    } catch (error) {
        console.log(error)
        res.status(500).json({ message: error.message })
    }
})
Route.get("/api/reviews", getAllClientReviews)
async function getAllClientReviews(req, res, next) {
    try {
        const reviews = await ClientReview.find().lean();
        if (!reviews.length) {
            return res.status(400).json({ message: 'No Reviews Found' });
        }
        // get url for each image
        for (const review of reviews) {
            // mediaId-only (new upload) or key (legacy/migrated) both count.
            if (review.photo?.mediaId || review.photo?.key) {
                const url = await resolveNode(review.photo, getObjectUrl)
                review.url = url
            }
        }
        res.status(200).json({ reviews })
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}

Route.get("/api/map-clients", async (req, res) => {
    try {
        const clientOnMap = await websiteSettingSchema.findOne().select("mapDisplayClient").lean();
        if (!clientOnMap) {
            return res.status(404).json({ message: "Settings not found" });
        }
        const clientIds = clientOnMap.mapDisplayClient.map((client) => client.clientId);
        const coordinateOf = (id) => clientOnMap.mapDisplayClient.find((c) => String(c.clientId) === String(id))?.coordinate;

        // PortfolioItem path. Without it, a wedding added through Add Wedding
        // (which leaves the embedded arrays empty) could be pinned but never shown.
        if (portfolio.portfolioReadsEnabled()) {
            const [clients, features] = await Promise.all([
                ClientSchema.find({ _id: { $in: clientIds } }).select('clientName').lean(),
                portfolio.findMapFeatures(clientIds),
            ]);
            const pins = clients.flatMap((client) => {
                const { video, photo } = features.get(String(client._id)) || {};
                const row = video && portfolio.toLegacyVideoRow(video);
                // Same rule as below: a pin is only drawn with a film poster to show.
                if (!row?.thumbnailUrl) return [];
                return [{
                    coordinate: coordinateOf(client._id),
                    clientId: String(client._id),
                    clientName: client.clientName,
                    photo: photo ? portfolio.toLegacyPhotoRow(photo) : null,
                    video: row.videos,
                    url: row.thumbnailUrl,
                }];
            });
            return res.status(200).json({ clients: pins });
        }

        const clients = await ClientSchema.find({ _id: { $in: clientIds } });

        let result = clients.map((client) => {
            const { _id, clientName, photos, videos } = client;

            // Find the highest priority photo
            const highestPriorityPhoto = photos.length
                ? photos.sort((a, b) => b.generalPriority - a.generalPriority)[0].toObject()
                : null;

            // Find the highest priority video
            let highestPriorityVideo = null;

            // Filter hero videos and find the highest heroPriority
            const heroVideos = videos.filter((v) => v.isHeroVideo);
            if (heroVideos.length) {
                highestPriorityVideo = heroVideos.sort((a, b) => b.heroPriority - a.heroPriority)[0];
            } else if (videos.length) {
                // Fallback to generalPriority if no hero videos exist
                highestPriorityVideo = videos.sort((a, b) => b.generalPriority - a.generalPriority)[0];
            }

            if (highestPriorityVideo) {
                highestPriorityVideo = highestPriorityVideo.toObject();
                const months = [
                    "January", "February", "March", "April", "May",
                    "June", "July", "August", "September", "October",
                    "November", "December"
                ];
                const videoDate = new Date(highestPriorityVideo.videoShootDate);
                const formattedDate = `${videoDate.getDate()} ${months[videoDate.getMonth()]}`;
                highestPriorityVideo.videoShootDate = formattedDate;
            }
            // Add coordinates for each client
            const coordinate = coordinateOf(_id);
            // Return the final client object
            return {
                coordinate,
                clientId: _id.toString(),
                clientName,
                photo: highestPriorityPhoto
                    ? { ...highestPriorityPhoto }
                    : null,
                video: highestPriorityVideo
                    ? { ...highestPriorityVideo }
                    : null,
            };
        });
        // get the url of thumbanil of video
        const c = []
        for (const client of result) {
            // `client.video` is null when a mapped client has no videos, and the
            // unguarded `.thumbnailMetaData.key` threw — taking down the whole map
            // for every visitor, not just that one pin.
            if (client.video?.thumbnailMetaData?.key) {
                client.video._id = client.video._id.toString()
                const thumbUrl = await mediaUrl(client.video.thumbnailMetaData.key);
                c.push({ ...client, url: thumbUrl })
            }
        }
        return res.status(200).json({ clients: c });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal server error", error: error.message });
    }
});

// Route: GET /api/home/sample-photos - Returns 8 sample photos sorted by ascending generalPriority
async function getHomePhotos(req, res, next) {
    try {
        // Read category from query string; default to "All Work" (which means no filtering)
        const category = req.query.category || "All Work";

        // PortfolioItem path — the home grid never showed wizard-added photos.
        if (portfolio.portfolioReadsEnabled()) {
            const items = await portfolio.findHomePhotos({ category });
            return res.status(200).json({
                photos: items.map((i) => ({ ...portfolio.toLegacyPhotoRow(i), client: i.client?.clientName })),
            });
        }

        const matchStage = category === "All Work" ? [] : [category];
        const pipeline = [
            // Unwind photos array so each photo becomes a document
            { $unwind: "$photos" },
            // Filter by category if specified
            {
                $match: {
                    $or: [
                        { "photos.tags": { $in: matchStage } }, // Match tags if matchStage is not empty
                        { $expr: { $eq: [matchStage.length, 0] } } // If matchStage is empty, return all
                    ]
                }
            },
            // Sort photos by generalPriority (ascending)
            { $sort: { "photos.generalPriority": 1 } },
            // Limit the number of returned photos
            // The route comment promises 8; this said 2. Left the ascending sort
            // alone deliberately — flipping it would change which photos appear on
            // the homepage, which is an editorial call, not a bug fix.
            { $limit: 8 },
            // Project the necessary fields
            {
                $project: {
                    _id: "$photos._id",
                    photoMetaData: "$photos.photoMetaData",
                    tags: "$photos.tags",
                    photoShootDate: "$photos.photoShootDate",
                    photoLocation: "$photos.photoLocation",
                    generalPriority: "$photos.generalPriority",
                    category: "$photos.category",
                    client: "$clientName"
                }
            }
        ];

        let photos = await ClientSchema.aggregate(pipeline); 
        // Generate signed URLs for each photo
        for (const photo of photos) {
            if (photo.photoMetaData && photo.photoMetaData.key) {
                photo.url = await mediaUrl(photo.photoMetaData.key);
            }
        }
        res.status(200).json({ photos });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error fetching photos" });
    }
}

// Bind route to Express router
Route.get("/api/home/sample-photos", getHomePhotos);

export default Route;