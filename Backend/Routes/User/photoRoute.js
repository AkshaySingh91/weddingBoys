import express from "express"
import ClientSchema from '../../Models/ClientSchema.js'
import { getObjectUrl } from '../../Controllers/awsController.js'

const Route = express.Router();

async function getAllPhotos(req, res, next) {
    try {
        const { page = 1, limit = 10 } = req.query;
        const skip = (page - 1) * limit;
        const pipeline = [
            { $unwind: "$photos" },
            { $sort: { "photos.generalPriority": -1 } },
            { $skip: parseInt(skip) },
            { $limit: parseInt(limit) },
            {
                $project: {
                    _id: "$photos._id",
                    photoMetaData: "$photos.photoMetaData",
                    tags: "$photos.tags",
                    photoShootDate: "$photos.photoShootDate",
                    photoLocation: "$photos.photoLocation",
                    generalPriority: "$photos.generalPriority",
                }
            }
        ];

        let photos = await ClientSchema.aggregate(pipeline);
        // Generate signed URLs for images
        for (const photo of photos) {
            if (photo.photoMetaData && photo.photoMetaData.key) {
                photo.url = await getObjectUrl(photo.photoMetaData.key);
            }
        }
        res.status(200).json({ photos });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error fetching photos" });
    }
}

Route.get("/api/photos", getAllPhotos)
async function getSpecificPhoto(req, res, next) {
    try {
        const { id = null } = req.params
        if (id) {
            // get client name & that photo
            const clientData = await ClientSchema.findOne({ "photos._id": id }, {
                "clientName": 1,
                "photos.$": 1,
            }).lean();

            if (!clientData || !(clientData.photos[0].photoMetaData && clientData.photos[0].photoMetaData.key)) return res.status(404).json({ message: "Photo not found" });
            // change date format & id of photo
            const selectedPhoto = clientData.photos[0]
            const months = [
                "January", "February",
                "March", "April", "May",
                "June", "July", "August",
                "September", "October",
                "November", "December"
            ];
            let date = `${months[new Date(selectedPhoto.photoShootDate).getMonth()]} ${new Date(selectedPhoto.photoShootDate).getFullYear()}`
            selectedPhoto.photoShootDate = date;
            selectedPhoto._id = selectedPhoto._id.toString();
            // get url for selected photo
            selectedPhoto.url = await getObjectUrl(selectedPhoto.photoMetaData.key);

            // Fetch remaining photos of the same client
            const remainingPhotos = await ClientSchema.findOne(
                { _id: clientData._id },
                { photos: 1 }
            ).lean();
            // Filter out the selected photo
            let otherPhotos = remainingPhotos.photos.filter(photo => photo._id.toString() !== id);
            // change format of _id
            otherPhotos = otherPhotos.map(photo => ({ ...photo, _id: photo._id.toString() })); //very imp
            // get url for other photo
            for (const otherPhoto of otherPhotos) {
                const url = await getObjectUrl(otherPhoto.photoMetaData.key)
                otherPhoto.url = url
            }
            res.status(200).json({
                clientName: clientData.clientName,
                selectedPhoto,
                remainingPhotos: otherPhotos
            });
        } else {
            res.status(400).json({ message: "Invalid photo Id" })
        }
    } catch (error) {
        console.log(error)
        res.status(500).json({ message: error.message })
    }
}

Route.get("/api/photos/:id", getSpecificPhoto)
Route.get("/api/photos/:id/recommended", getRecommendedPhotos);

async function getRecommendedPhotos(req, res, next) {
    try {
        const { id } = req.params;
        const { page = 1, limit = 10 } = req.query; // Infinite scrolling support
        // Fetch the selected photo to get its tags
        const clientData = await ClientSchema.findOne({ "photos._id": id }, { "photos.$": 1 });
        if (!clientData) return res.status(404).json({ message: "Photo not found" });

        const selectedPhoto = clientData.photos[0];
        const tags = selectedPhoto.tags;

        // Find photos from other clients with similar tags for RECOMMENDATION 
        let recommendedPhotos = await ClientSchema.aggregate([
            { $unwind: "$photos" },
            {
                $match: {
                    "photos.tags": { $in: tags },
                    "photos._id": { $ne: selectedPhoto._id }
                }
            },
            {
                $sort: { "photos.generalPriority": -1 }
            },
            {
                $skip: (page - 1) * limit
            },
            {
                $limit: parseInt(limit)
            },
            {
                $project: {
                    _id: "$photos._id", //very imp
                    photoMetaData: "$photos.photoMetaData",
                    tags: "$photos.tags",
                    photoShootDate: "$photos.photoShootDate",
                    generalPriority: "$photos.generalPriority",
                    clientName: "$clientName"
                }
            }
        ]);
        recommendedPhotos = recommendedPhotos.map(photo => {
            const months = [
                "January", "February",
                "March", "April", "May",
                "June", "July", "August",
                "September", "October",
                "November", "December"
            ];
            let date = `${months[new Date(photo.photoShootDate).getMonth()]} ${new Date(photo.photoShootDate).getFullYear()}`
            return {
                ...photo,
                _id: photo._id.toString(),  //very imp
                photoShootDate: date
            }
        }); //very imp
        // get url for other photo
        for (const photo of recommendedPhotos) {
            const url = await getObjectUrl(photo.photoMetaData.key)
            photo.url = url
        }
        res.status(200).json({ recommendedPhotos });
    } catch (error) {
        console.log(error)
        res.status(500).json({ message: error.message });
    }
}
export default Route;


