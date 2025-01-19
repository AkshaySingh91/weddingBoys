import express from "express"
import ClientSchema from '../../Models/ClientSchema.js'
import { getObjectUrl } from '../../Controllers/awsController.js'
import { getAllTags } from "../../Controllers/TagsController.js"
const Route = express.Router();

// it will get all videos with inc order of priority for given tags
Route.get("/api/videos", async (req, res) => {
    try {
        let { tag = "", page = 1, limit = 10 } = req.query 
        limit = parseInt(limit);
        page = parseInt(page);
        tag = tag.split(",").filter(t => t.trim() !== "");

        const skipCount = (page - 1) * limit;
        const pipeline = [
            { $unwind: "$videos" },
            ...(tag.length > 0
                ? [{
                    $match: {
                        "videos.tags": { $in: tag },
                    }
                }]
                : []
            ),
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
        let client = await ClientSchema.aggregate(pipeline);
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
                    const url = await getObjectUrl(thumbnailKey);
                    c.thumbnailUrl = url;
                }
            }
        } 
        res.status(200).json({ client });

    } catch (error) {
        console.error("Error fetching videos:", error);
        res.status(500).json({ message: "Failed to fetch videos", error });
    }
});
// it will give specific video details 
async function getSpecificVideo(req, res, next) {
    const { id = null } = req.params
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
        selectedVideo.url = await getObjectUrl(selectedVideo.videoMetaData.key);

        // Fetch remaining videos of the same client
        const remainingPhotoAndVideo = await ClientSchema.findOne({ _id: clientData._id }).lean();
        // Filter out the selected video
        let otherVideos = remainingPhotoAndVideo.videos.filter(video => video._id.toString() !== id);
        // change format of _id
        otherVideos = otherVideos.map(video => ({ ...video, _id: video._id.toString() })); //very imp
        // get url for other video
        for (const otherVideo of otherVideos) {
            if (otherVideo.videoMetaData && otherVideo.videoMetaData.key)
                otherVideo.thumbnailMetaData.url = await getObjectUrl(otherVideo.thumbnailMetaData.key)
            let date = `${months[new Date(otherVideo.videoShootDate).getMonth()]} ${new Date(otherVideo.videoShootDate).getFullYear()}`
            selectedVideo.videoShootDate = date;
        }
        // get all photo of client
        const allPhotos = remainingPhotoAndVideo.photos.map((p) => ({ ...p, _id: p._id.toString() }))
        for (const p of allPhotos) {
            if (p.photoMetaData && p.photoMetaData.key)
                p.photoMetaData.url = await getObjectUrl(p.photoMetaData.key)
        } 
        res.status(200).json({
            clientName: clientData.clientName,
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
        const { page = 1, limit = 10 } = req.query; // Infinite scrolling support

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
            // {
            //     $limit: parseInt(limit)
            // },
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
            video.thumbnailMetaData.url = await getObjectUrl(video.thumbnailMetaData.key)
        } 
        res.status(200).json({ recommendedVideos });
    } catch (error) {
        console.log(error)
        res.status(500).json({ message: error.message });
    }
}

Route.get("/api/get-all-tags", getAllTags);

export default Route;
