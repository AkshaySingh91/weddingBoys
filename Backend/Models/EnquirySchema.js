import mongoose from "mongoose";

const Enquiry = new mongoose.Schema({
    Bride: { type: String, required: true },
    Groom: { type: String, required: true },
    Contact: { type: String, required: true },
    Date: {
        type: Object, required: true
    },
    Reach: { type: String, required: true },
    SubmittedTime: { type: String, required: true, default: new Date(Date.now()).toLocaleDateString() },
    isViewed: { type: Boolean, default: false, required: true }
}, { timestamp: true })

export default mongoose.model('Enquiry', Enquiry);