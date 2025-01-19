import mongoose from "mongoose";

const Client = new mongoose.Schema({
    clientName: {
        Bride: {
            type: String, require: true
        },
        Groom: {
            type: String, require: true
        },
    },
    videos: [
        {
            _id: {
                type: mongoose.Schema.Types.ObjectId,
                default: new mongoose.Types.ObjectId()
            },
            videoMetaData: {
                type: Object, required: true
            },
            thumbnailMetaData: {
                type: Object, required: true
            },
            tags: [{ type: String, required: true }],
            videoShootDate: {
                type: Date, required: true
            },
            isHeroVideo: { type: Boolean, default: false, index: true },
            heroPriority: { type: Number, default: 0 },
            generalPriority: { type: Number, default: Math.floor((Math.random() * 100)), index: true },
            videoLocation: { type: Object, required: true },
            bts: [{
                type: Object, required: true
            }],
        }
    ],
    photos: [
        {
            _id: {
                type: mongoose.Schema.Types.ObjectId,
                default: new mongoose.Types.ObjectId()
            },
            photoMetaData: {
                type: Object, required: true
            },
            tags: [{ type: String, required: true }],
            photoShootDate: {
                type: Date, required: true
            },
            generalPriority: { type: Number, default: Math.floor((Math.random() * 100)), index: true },
            photoLocation: { type: Object, required: true }, 
        }
    ]
}, { timestamp: true })

export default mongoose.model('Client', Client);