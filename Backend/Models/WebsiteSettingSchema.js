import mongoose from "mongoose";

const websiteSettingsSchema = new mongoose.Schema({
    heroVideos: [
        {
            videoKey: { type: String, required: true },
            priority: { type: Number, default: 0 }, // Higher priority videos displayed first
            clientId: { type: mongoose.Schema.Types.ObjectId }
        },
    ],
    mapDisplayClient: [{
        clientId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Client'
        },
        coordinate: {
            type: Object,
        }
    }],
    homepageVideosTags: [
        { type: String }
    ],
    filmsPageVideoTags: [
        { type: String }
    ],
    photoPagePhotoTags: [
        { type: String }
    ],
    BtsPhotos: [{
        photoMetaData: {
            type: Object
        }
    }],
    companyDetails: {
        companyName: { type: String },
        companyLogo: {
            type: Object
        },
        companySocial: {
            type: Object,
            default: {
                instagram: "",
                youtube: "",
                x: "",
                facebook: ""
            }
        },
        address: { type: String },
        email: { type: String },
        phone: [{ type: String }]
    },
});

export default mongoose.model('WebsiteSettings', websiteSettingsSchema);
