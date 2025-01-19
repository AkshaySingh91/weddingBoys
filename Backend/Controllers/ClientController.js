import * as uuid from 'uuid';
import mongoose from 'mongoose';
import { deleteObject, getObjectUrl, putObjectUrl } from './awsController.js';
import ClientSchema from '../Models/ClientSchema.js';
import WebsiteSettingSchema from '../Models/WebsiteSettingSchema.js';

/*  /admin/client  */
async function getAllClients(req, res, next) {
    try {
        const clients = await ClientSchema.aggregate([
            {
                $project: {
                    clientId: '$_id',
                    clientName: '$clientName',
                    timestamp: { $ifNull: ['$createdAt', new Date()] }, // Ensure a timestamp field is present
                    highestPhoto: {
                        $arrayElemAt: [
                            {
                                $sortArray: {
                                    input: { $ifNull: ['$photos', []] }, // Handle missing photos array
                                    sortBy: { generalPriority: -1 },
                                },
                            },
                            0,
                        ],
                    },
                    highestVideo: {
                        $arrayElemAt: [
                            {
                                $sortArray: {
                                    input: { $ifNull: ['$videos', []] }, // Handle missing videos array
                                    sortBy: { generalPriority: -1 },
                                },
                            },
                            0,
                        ],
                    },
                },
            },
            {
                $addFields: {
                    media: {
                        $cond: [
                            { $gt: [{ $size: { $ifNull: ['$photos', []] } }, 0] },
                            '$highestPhoto',
                            '$highestVideo',
                        ],
                    },
                },
            },
            {
                $project: {
                    clientId: 1,
                    clientName: 1,
                    timestamp: 1,
                    media: 1,
                },
            },
        ]);
        const clientDetails = [];
        for (const c of clients) {
            clientDetails.push({
                ...c,
                clientId: c.clientId.toString(),
            })
        }
        // get all thumbnail url from s3 & avoid sending video which is costly
        const updatedClientDetails = [];
        for (const client of clientDetails) {
            const thumbnailUrl = await getObjectUrl(client.media.thumbnailMetaData.key);
            updatedClientDetails.push({ ...client, media: { ...client.media, thumbnailUrl } })
        }
        res.status(200).json({ clientDetails: updatedClientDetails })
    } catch (error) {
        console.log(error)
        res.status(500).json({ message: 'SERVER ERROR' })
    }
}

/*  /admin/client/:id    */
// see specific client detial like videos & photos posted
async function getSingleClientDetails(req, res, next) {
    const { id } = req.params
    try {
        const client = await ClientSchema.findById(id).lean()
        if (!client) {
            return res.status(400).json({ message: 'No such client' })
        }
        const clientDetails = { ...client, _id: client._id.toString() };
        // convert id in string format
        for (const v of clientDetails.videos) {
            v._id = v._id.toString()
        }
        for (const p of clientDetails.photos) {
            p._id = p._id.toString()
        }
        // get all files url to view in update client page
        const videos = []
        const photos = []
        for (const v of clientDetails.videos) {
            const videoUrl = await getObjectUrl(v.videoMetaData.key)
            const thumbnailUrl = await getObjectUrl(v.thumbnailMetaData.key)
            videos.push({ ...v, videoUrl, thumbnailUrl })
        }
        for (const p of clientDetails.photos) {
            const photoUrl = await getObjectUrl(p.photoMetaData.key)
            photos.push({ ...p, photoUrl })
        }
        res.status(200).json({ clientDetails: { ...clientDetails, videos, photos } })
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}
/***************************************************/

// this fx validating client videos & photos like type, metadata eg tags, bts, etc 
function validateClientDetails(details, type) {
    // details can be photo or video
    for (const d of details) {
        const allowedFileTypes = ['image/jpeg', 'image/jpg', 'image/png', 'video/mp4'];
        if (type === 'videos') {
            if (!d.thumbnail) {
                return { valid: false, message: "Thumbnail REQUIRED" };
            } else {
                if (!allowedFileTypes.includes(d.thumbnail.type)) {
                    return { valid: false, message: "Thumbnail type should png, jpeg, jpg" };
                }
            }
            if (!d.video) {
                return { valid: false, message: "video REQUIRED" };
            } else {
                const allowedFileTypes = ['image/jpeg', 'image/jpg', 'image/png', 'video/mp4'];
                if (!allowedFileTypes.includes(d.thumbnail.type)) {
                    return { valid: false, message: "video type should mp4" };
                }
            }
        } else if (type === 'photos') {
            if (!d.photo) {
                return { valid: false, message: "photo REQUIRED" };
            } else {
                if (!allowedFileTypes.includes(d.photo.type)) {
                    return { valid: false, message: "photo type should png, jpeg, jpg" };
                }
            }
        }
        if (d.isHeroVideo && !d.heroPriority) {
            return { valid: false, message: "hero priority required" };
        }
        if (!d.shootDate) {
            return { valid: false, message: "DATE REQUIRED" };
        }
        if (!d.tags || !d.tags.length) {
            return { valid: false, message: "TAGS REQUIRED" };
        }
        if (!d.location) {
            return { valid: false, message: "LOCATION REQUIRED" };
        }
        for (const [key, value] of Object.entries(d.location)) {
            if (!value.trim()) {
                return { valid: false, message: `LOCATION ${key.toUpperCase()} IS REQUIRED` };
            }
        }
        if (type === 'videos') {
            for (const { key, value } of d.btsInfo) {
                if (!key.trim() || !value.trim()) {
                    return { valid: false, message: "BTS INFO REQUIRED" };
                }
            }
        }
        if (!d.generalPriority) {
            return { valid: false, message: "GENERAL PRIORITY REQUIRED" };
        }
    }
    return { valid: true, message: 'Good' };
};
/*  /admin/api/add-client/validate-details  */
//  this fx check client all details 
async function checkClientDetails(req, res, next) {
    try {
        let videoDetails = req.body.videoDetails;
        let photosDetails = req.body.photosDetails;
        const coordinate = req.body.coordinate
        const bride = req.body.bride
        const groom = req.body.groom
        const isInMap = req.body.isInMap
        if (!videoDetails || !photosDetails || !coordinate || !bride || !groom || !isInMap) {
            return res.status(400).json({ message: "FIELD NOT POPULATED" })
        }
        if (req.body.isInMap === 'true' && req.body.coordinate) {
            if (Number.isInteger(req.body.coordinate.latitude) || Number.isInteger(req.body.coordinate.longitute)) {
                return res.status(400).json({ message: "COORDINATE REQUIRED" });
            }
        }
        if (!bride.trim() || !groom.trim()) {
            return res.status(400).json({ message: "CLIENT NAME REQUIRED" });
        }
        let obj = validateClientDetails(videoDetails, 'videos')
        if (!obj.valid) {
            return res.status(400).json({ message: obj.message });
        }
        obj = validateClientDetails(photosDetails, 'photos')
        if (!obj.valid) {
            return res.status(400).json({ message: obj.message });
        }
        // from here every thing is validate & all good including file type & metadata 
        res.locals.clientDetails = { videoDetails, photosDetails }
        next();
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}
// this fx generate put url for every video & photo for adding new client
async function sendPutUrlsForNewClient(req, res, next) {
    const { videoDetails, photosDetails } = res.locals.clientDetails
    // Generate URLs for videos and their thumbnails
    const urls = { videosUrl: [], photosUrl: [] };
    for (const videoObj of videoDetails) {
        const videoKey = `user/videos/${uuid.v4()}.${videoObj.video.type.split('/')[1]}`;
        const thumbnailKey = `user/photos/${uuid.v4()}.${videoObj.thumbnail.type.split('/')[1]}`;
        const videoPutUrl = await putObjectUrl(videoKey, videoObj.video.type);
        const thumbnailPutUrl = await putObjectUrl(thumbnailKey, videoObj.thumbnail.type);
        urls.videosUrl.push({ videoPutUrl, thumbnailPutUrl, videoKey, thumbnailKey });
    }

    // Generate URLs for photos
    for (const photoObj of photosDetails) {
        const photoKey = `user/photos/${uuid.v4()}.${photoObj.photo.type.split('/')[1]}`;
        const photoPutUrl = await putObjectUrl(photoKey, photoObj.photo.type);
        urls.photosUrl.push({ photoPutUrl, photoKey });
    }
    res.status(200).json({ urls })
}
// after validating new client details & sending puturls user media will upload on s3 & we have to save keys & other meta

async function updateHeroVideos(client) {
    const heroVideos = client.videos.filter((video) => video.isHeroVideo);
    try {
        const settings = await WebsiteSettingSchema.findOne();
        if (!settings) {
            await WebsiteSettingSchema.create({
                heroVideos: heroVideos.map((video) => ({
                    videoKey: video.videoMetaData.key,
                    priority: video.heroPriority || 0,
                    clientId: client._id,
                })),
            })
            return { isValid: true, message: 'CLIENT ADDED SUCCESSFULLY' }
        }
        const updatedHeroVideos = [
            ...settings.heroVideos,
            ...heroVideos.map((video) => ({
                videoKey: video.videoMetaData.key,
                priority: video.heroPriority || 0,
                clientId: client._id,
            })),
        ];
        settings.heroVideos = updatedHeroVideos;
        await settings.save();
        return { isValid: true, message: 'CLIENT ADDED SUCCESSFULLY' }
    } catch (error) {
        console.log(error)
        return { isValid: false, message: error.message }
    }
}
async function addClientInMap(id, clientDetails) {
    try {
        if (!id || !clientDetails.coordinate) {
            return {
                isValid: false, message: 'ID REQUIRED'
            };
        }
        const settings = await WebsiteSettingSchema.findOne();
        if (!settings) {
            await WebsiteSettingSchema.create({
                mapDisplayClient: [{
                    clientId: id,
                    coordinate: clientDetails.coordinate
                }]
            })
            return { isValid: true, message: 'CLIENT ADDED SUCCESSFULLY' }
        }
        const updatedMap = [
            ...settings.mapDisplayClient,
            {
                clientId: id,
                coordinate: clientDetails.coordinate
            }
        ];
        settings.mapDisplayClient = updatedMap;
        await settings.save();
        return { isValid: true, message: 'CLIENT ADDED SUCCESSFULLY' }
    } catch (error) {
        return {
            isValid: false, message: error.message
        };
    }
}
async function AddNewClient(req, res, next) {
    const { clientDetails } = req.body;
    try {
        const uploadedVideos = [];
        const uploadedPhotos = [];
        // todo= the upload part we will do earlier 
        for (const video of clientDetails.videoDetails) {
            uploadedVideos.push({
                videoMetaData: { key: video.video.key },
                tags: video.tags,
                isHeroVideo: video.isHeroVideo,
                heroPriority: video.heroPriority,
                generalPriority: video.generalPriority,
                videoLocation: video.location,
                bts: video.btsInfo,
                thumbnailMetaData: { key: video.thumbnail.key },
                videoShootDate: video.shootDate,
                _id: new mongoose.Types.ObjectId()
            })
        }
        for (const photo of clientDetails.photosDetails) {
            uploadedPhotos.push({
                photoMetaData: { key: photo.photo.key },
                tags: photo.tags,
                generalPriority: photo.generalPriority,
                photoLocation: photo.location,
                bts: photo.btsInfo,
                photoShootDate: photo.shootDate,
                _id: new mongoose.Types.ObjectId()
            })
        }
        const newClient = await ClientSchema.create({
            clientName: {
                Bride: clientDetails.bride,
                Groom: clientDetails.groom,
            },
            videos: uploadedVideos,
            photos: uploadedPhotos,
        })
        // save herovideo in its schema 
        if (newClient.videos.filter((video) => video.isHeroVideo).length > 0) {
            const { isValid, message } = await updateHeroVideos(newClient);
            if (!isValid) {
                return res.status(500).json({ message })
            }
        }
        // add client id to map
        if (clientDetails.isInMap === 'true' && clientDetails.coordinate) {
            const { isValid, message } = await addClientInMap(newClient._id, clientDetails)
            if (isValid) {
                return res.status(200).json({ message })
            } else {
                return res.status(500).json({ message })
            }
        }
        return res.status(200).json({ message: "Client added" })
    } catch (error) {
        console.log('Error while saving file', error)
        res.status(500).json({ message: error.message })
    }
}
/***************************************************/

/*  /admin/api/add-client/validate-details  */
// for existing client when details are updated like new media added validate it 
async function validateClientUpdatedDetails(req, res, next) {
    const { id } = req.params
    try {
        const client = await ClientSchema.findById(id).lean()
        if (!client) {
            return res.status(400).json({ message: 'No such client, invalid client id' })
        }
        const bride = req.body.bride
        const groom = req.body.groom
        if (!bride || !groom) {
            return res.status(400).json({ message: "CLIENT NAME REQUIRED" });
        }
        else if (!bride.trim() || !groom.trim()) {
            return res.status(400).json({ message: "CLIENT NAME REQUIRED" });
        }
        let newVideosDetails = req.body.newVideosDetails;
        let newPhotosDetails = req.body.newPhotosDetails;
        let oldVideosDetails = req.body.oldVideosDetails;
        let oldPhotosDetails = req.body.oldPhotosDetails;
        let obj = validateClientDetails(newVideosDetails, 'videos')
        if (!obj.valid) {
            return res.status(400).json({ message: obj.message });
        }
        obj = validateClientDetails(newPhotosDetails, 'photos')
        if (!obj.valid) {
            return res.status(400).json({ message: obj.message });
        }
        // validating old files
        const validatingOldFiles = (details, type) => {
            for (const d of details) {
                const allowedFileTypes = ['image/jpeg', 'image/jpg', 'image/png', 'video/mp4'];
                if (type === 'videos') {
                    if (!d.thumbnailMetaData) {
                        return { valid: false, message: "Thumbnail REQUIRED" };
                    } else if (d.thumbnailMetaData.type) {
                        if (!allowedFileTypes.includes(d.thumbnailMetaData.type)) {
                            return { valid: false, message: "Thumbnail type should png, jpeg, jpg" };
                        }
                    }
                }
                if (d.isHeroVideo && !d.heroPriority) {
                    return { valid: false, message: "hero priority required" };
                }
                if (!d.shootDate) {
                    return { valid: false, message: "DATE REQUIRED" };
                }
                if (!d.tags || !d.tags.length) {
                    return { valid: false, message: "TAGS REQUIRED" };
                }
                if (!d.location) {
                    return { valid: false, message: "LOCATION REQUIRED" };
                }
                for (const [key, value] of Object.entries(d.location)) {
                    if (!value.trim()) {
                        return { valid: false, message: `LOCATION ${key.toUpperCase()} IS REQUIRED` };
                    }
                }
                if (type === 'videos') {
                    for (const { key, value } of d.btsInfo) {
                        if (!key.trim() || !value.trim()) {
                            return { valid: false, message: "BTS INFO REQUIRED" };
                        }
                    }
                }
                if (!d.generalPriority) {
                    return { valid: false, message: "GENERAL PRIORITY REQUIRED" };
                }
            }
        }
        validatingOldFiles(oldPhotosDetails, 'photos')
        validatingOldFiles(oldVideosDetails, 'videos')
        // from here every thing is validated 
        // we have to send put url for newly added video , photo or thumbnail if there

        const oldVideoWithUpdatedThumbnail = oldVideosDetails.filter((v) => typeof v.newThumbnailDetail === 'object')
        res.locals.clientDetails = { oldVideoWithUpdatedThumbnail, newPhotosDetails, newVideosDetails }
        res.locals.id = id;
        next();

    } catch (error) {
        console.log(error)
        res.status(500).json({ message: error.message })
    }
}
// send put url for newly added media
async function sendPutUrlsForNewMedia(req, res, next) {
    try {
        const { oldVideoWithUpdatedThumbnail, newPhotosDetails, newVideosDetails } = res.locals.clientDetails
        // Generate URLs for videos and their thumbnails
        const urls = { oldVideoThumbnailUrl: [], newVideosUrl: [], newPhotosUrl: [] };

        for (const videoObj of newVideosDetails) {
            const videoKey = `user/videos/${uuid.v4()}.${videoObj.video.type.split('/')[1]}`;
            const thumbnailKey = `user/photos/${uuid.v4()}.${videoObj.thumbnail.type.split('/')[1]}`;
            const videoPutUrl = await putObjectUrl(videoKey, videoObj.video.type);
            const thumbnailPutUrl = await putObjectUrl(thumbnailKey, videoObj.thumbnail.type);
            urls.newVideosUrl.push({ videoPutUrl, thumbnailPutUrl, videoKey, thumbnailKey, videoName: videoObj.video.name });
        }

        for (const videoObj of oldVideoWithUpdatedThumbnail) {
            const thumbnailKey = `user/photos/${uuid.v4()}.${videoObj.newThumbnailDetail.type.split('/')[1]}`;
            const thumbnailPutUrl = await putObjectUrl(thumbnailKey, videoObj.newThumbnailDetail.type);
            urls.oldVideoThumbnailUrl.push({ thumbnailPutUrl, thumbnailKey, videoId: videoObj._id });
        }
        // Generate URLs for photos
        for (const photoObj of newPhotosDetails) {
            const photoKey = `user/photos/${uuid.v4()}.${photoObj.photo.type.split('/')[1]}`;
            const photoPutUrl = await putObjectUrl(photoKey, photoObj.photo.type);
            urls.newPhotosUrl.push({ photoPutUrl, photoKey, photoName: photoObj.photo.name });
        }

        res.status(200).json({ urls })
    } catch (error) {
        console.log(error)
        res.status(500).json({ message: error.message })
    }
}
/*  /admin/api/add-client/validate-details  */
// update client details
async function updateClientDetails(req, res, next) {
    try {
        const { id } = req.params
        const { bride, groom, videoDetails, photosDetails } = req.body;
        // difference btw old & new file is _id   
        const client = await ClientSchema.findById(id).select('videos photos').lean();
        if (!client) {
            return res.status(404).json({ message: 'Client not found' });
        }
        let updatedVideos = [];
        let updatedPhotos = [];
        const heroVideoIds = [];
        const videosToDelete = [];
        const thumbnailsToDelete = [];
        // check if some video or photo has deleted if yes than add its id to delete from s3

        // we are finding if any video is deleted by checking all videos from client.videos in videoDetails
        client.videos.forEach((v) => {
            const isInVideoDetails = videoDetails.find(vd => {
                if (vd._id) {
                    return vd._id === v._id.toString()
                }
            })
            if (!isInVideoDetails) {
                videosToDelete.push(v.videoMetaData.key)
                thumbnailsToDelete.push(v.thumbnailMetaData.key)
            }
        })
        // check if some thumbnail is deleted from old video
        videoDetails.forEach((v) => {
            if (v._id && v.newThumbnailDetail) {
                const findOldThumbId = client.videos.find((vd) => vd._id.toString() === v._id)
                if (findOldThumbId) {
                    thumbnailsToDelete.push(findOldThumbId.thumbnailMetaData.key)
                }
            }
        })
        client.photos.forEach((v) => {
            const isInPhotoetails = photosDetails.find(vd => {
                if (vd._id) {
                    return vd._id === v._id.toString()
                }
            })
            if (!isInPhotoetails) {
                thumbnailsToDelete.push(v.photoMetaData.key)
            }
        })
        if (videosToDelete.length === client.videos.length) {
            return res.status(400).json({ message: 'Video cant be empty' })
        }
        // Synchronize Videos
        // we have just add _id to new video & catch all hero video _id
        for (const video of videoDetails) {
            if (video._id) {
                // Existing video: Update metadata or mark for deletion
                const existingVideo = client.videos.find(v => v._id.toString() === video._id);
                if (!existingVideo) {
                    thumbnailsToDelete.push(video.thumbnailMetaData.key);
                } else {
                    if (video.isHeroVideo && video.heroPriority)
                        heroVideoIds.push({ videoKey: video.videoMetaData.key, priority: video.heroPriority, clientId: client._id });
                    updatedVideos.push(video);
                }
            } else {
                // New video: Add to updatedVideos 
                if (video.isHeroVideo && video.heroPriority)
                    heroVideoIds.push({ videoKey: video.videoMetaData.key, priority: video.heroPriority, clientId: client._id });
                updatedVideos.push({
                    ...video,
                    _id: new mongoose.Types.ObjectId()    // Assign new ObjectId for new videos
                });
            }
        }
        for (const photo of photosDetails) {
            if (photo._id) {
                const existingPhoto = client.photos.find(p => p._id.toString() === photo._id);
                if (existingPhoto) {
                    updatedPhotos.push(photo);
                }
            } else {
                updatedPhotos.push({
                    ...photo,
                    _id: new mongoose.Types.ObjectId()
                });
            }
        }
        // we r removing extra keys from video & phtos
        updatedPhotos = updatedPhotos.map((p) => {
            return {
                _id: p._id,
                photoMetaData: p.photoMetaData,
                tags: p.tags,
                photoShootDate: p.photoShootDate,
                generalPriority: p.generalPriority,
                photoLocation: p.photoLocation,
            }
        })
        updatedVideos = updatedVideos.map((v) => {
            return {
                _id: v._id,
                tags: v.tags,
                videoMetaData: v.videoMetaData,
                thumbnailMetaData: v.thumbnailMetaData,
                videoShootDate: v.videoShootDate,
                videoLocation: v.videoLocation,
                isHeroVideo: v.isHeroVideo,
                heroPriority: v.heroPriority,
                generalPriority: v.generalPriority,
                bts: v.bts,
            }
        })
        // Update Client Schema
        await ClientSchema.findByIdAndUpdate(id, {
            clientName: { Bride: bride, Groom: groom },
            videos: updatedVideos,
            photos: updatedPhotos,
        });

        // Update Hero Videos in Website Schema
        const settings = await WebsiteSettingSchema.findOne();
        if (!settings) {
            await WebsiteSettingSchema.create({
                heroVideos: heroVideoIds
            })
        } else {
            await WebsiteSettingSchema.updateOne(
                { 'heroVideos.clientId': id, },
                {
                    $set: {
                        heroVideos: heroVideoIds,
                    },
                },
                { upsert: true }
            );
        }
        // delete files from s3
        for (const key of videosToDelete) {
            await deleteObject(key)
        }
        for (const key of thumbnailsToDelete) {
            await deleteObject(key)
        }
    } catch (error) {
        console.log('Error while saving file', error)
        res.status(500).json({ message: error.message })
    }
}


export { getAllClients, getSingleClientDetails, checkClientDetails, sendPutUrlsForNewClient, AddNewClient, validateClientUpdatedDetails, sendPutUrlsForNewMedia, updateClientDetails }