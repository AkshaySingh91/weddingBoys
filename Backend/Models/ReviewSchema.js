import mongoose from "mongoose";

const ClientReviewSchema = new mongoose.Schema({
    photo: {
        key: { type: String, required: true }, 
    },
    reviewText: { type: String, trim: true, required: true },
    person: {
        name: { type: String, trim: true, required: true },
        gender: { type: String, trim: true, required: true, enum: ["Bride", "Groom"] },
    },
}, { timestamps: true });


export default mongoose.model('ClientReview', ClientReviewSchema);