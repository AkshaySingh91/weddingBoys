import express from "express"
const router = express.Router();
import ClientSchema from "../../Models/ClientSchema.js";
import { getObjectUrl } from "../../Controllers/awsController.js";

// Search Endpoint
router.get("/api/search", async (req, res) => {
    try {
        // we have to implement infinite scrolling for video & photo panel hence media query will tell which media will require for initial search it will null means both (video & photo) of limit 10 
        const { query = "", page = 1, limit = 10, media = null } = req.query;
        if (!query.trim()) {
            return res.status(400).json({ message: "Search query is required." });
        }
        const searchRegex = new RegExp(query, "i");
        let videos = [];
        let photos = [];
        const skipCount = (page - 1) * limit;
        //initial search     
        if (!media || media === "video") {
            const videoResults = await ClientSchema.aggregate([
                { $unwind: "$videos" },
                { $match: { "videos.tags": { $regex: searchRegex } } },
                { $sort: { "videos.isHeroVideo": -1, "videos.generalPriority": -1 } },
                { $skip: skipCount },
                { $limit: parseInt(limit) },
                {
                    $project: {
                        _id: "$videos._id",
                        videoMetaData: "$videos.videoMetaData",
                        thumbnailMetaData: "$videos.thumbnailMetaData",
                        videoLocation: "$videos.videoLocation",
                        tags: "$videos.tags",
                        videoShootDate: "$videos.videoShootDate",
                        isHeroVideo: "$videos.isHeroVideo",
                        generalPriority: "$videos.generalPriority",
                        clientName: "$clientName"
                    }
                }
            ]);
            console.log(videoResults)
            videos = videoResults.map(video => ({
                ...video,
                videoShootDate: formatDate(video.videoShootDate)
            }));
        }

        if (!media || media === "photo") {
            const photoResults = await ClientSchema.aggregate([
                { $unwind: "$photos" },
                { $match: { "photos.tags": { $regex: searchRegex } } },
                { $sort: { "photos.generalPriority": -1 } },
                { $skip: skipCount },
                { $limit: parseInt(limit) },
                {
                    $project: {
                        _id: "$photos._id",
                        photoMetaData: "$photos.photoMetaData",
                        photoLocation: "$photos.photoLocation",
                        tags: "$photos.tags",
                        photoShootDate: "$photos.photoShootDate",
                        generalPriority: "$photos.generalPriority",
                        clientName: "$clientName"
                    }
                }
            ]);
            console.log(photoResults)

            photos = photoResults.map(photo => ({
                ...photo,
                photoShootDate: formatDate(photo.photoShootDate)
            }));
        }
        // get url for video thumbnail & photos 
        for (const video of videos) {
            video.thumbnailMetaData.url = await getObjectUrl(video.thumbnailMetaData.key);
        }
        for (const photo of photos) {
            photo.photoMetaData.url = await getObjectUrl(photo.photoMetaData.key);
        }
        res.json({ videos, photos });
    } catch (error) {
        console.log(error)
        res.status(500).json({ message: error.message });
    }
});


const formatDate = (date) => {
    const months = ["January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"];
    return `${months[new Date(date).getMonth()]} ${new Date(date).getFullYear()}`;
};


export default router;
