import express from 'express'
const Route = express.Router();
import websiteSettingSchema from '../../Models/WebsiteSettingSchema.js';
import ClientReview from '../../Models/ReviewSchema.js';
import ClientSchema from '../../Models/ClientSchema.js';
import { getObjectUrl } from '../../Controllers/awsController.js';

Route.get("/api/hero-videos", async (req, res) => {
    try {
        const { heroVideos } = await websiteSettingSchema.findOne().select('heroVideos').sort({ 'heroVideos.priority': -1 }).lean()
        const clientDetails = []
        // get all herovideo
        for (const heroVideo of heroVideos) {
            clientDetails.push(await ClientSchema.findById(heroVideo.clientId.toString()))
        }

        for (let i = 0; i < heroVideos.length; i++) {
            // add clientname to each video & update date
            heroVideos[i].clientName = clientDetails[i].clientName;
            heroVideos[i].clientId = heroVideos[i].clientId.toString();

            for (const clientVideo of clientDetails[i].videos) {
                if (clientVideo.videoMetaData.key === heroVideos[i].videoKey) {
                    // videoId will use to append in link
                    heroVideos[i].videoId = clientVideo._id.toString();
                    const months = [
                        "January", "February",
                        "March", "April", "May",
                        "June", "July", "August",
                        "September", "October",
                        "November", "December"
                    ];
                    let date = `${new Date(clientVideo.videoShootDate).getDate()} ${months[new Date(clientVideo.videoShootDate).getMonth()]}`
                    heroVideos[i].videoShootDate = date
                    heroVideos[i].videoLocation = clientVideo.videoLocation
                }
            }
        }
        // get url to see video
        const videoUrlObj = []
        for (const h of heroVideos) {
            const url = await getObjectUrl(h.videoKey)
            videoUrlObj.push({ videoKey: h.videoKey, videoUrl: url })
        }
        for (let i = 0; i < heroVideos.length; i++) {
            const url = videoUrlObj.find((v) => v.videoKey === heroVideos[i].videoKey)
            if (url) {
                heroVideos[i].videoUrl = url.videoUrl
            }
        }
        res.status(200).json({ heroVideos })
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
            const url = await getObjectUrl(key.photoMetaData.key);
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
            if (review.photo && review.photo.key) {
                const url = await getObjectUrl(review.photo.key)
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
            const coordinate = clientOnMap.mapDisplayClient.find((c) => (c.clientId.toString() === _id.toString()))?.coordinate;
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
            if (client.video.thumbnailMetaData.key) {
                client.video._id = client.video._id.toString()
                const thumbUrl = await getObjectUrl(client.video.thumbnailMetaData.key);
                c.push({ ...client, url: thumbUrl })
            }
        }
        return res.status(200).json({ clients: c });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal server error", error: error.message });
    }
});

export default Route;