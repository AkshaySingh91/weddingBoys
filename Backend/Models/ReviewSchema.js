import mongoose from "mongoose";

const ClientReviewSchema = new mongoose.Schema({
    photo: {
        // `key` is the legacy S3 object key. `mediaId` points at the R2-backed
        // Media document and is what Utils/mediaUrl.js resolveNode() prefers.
        //
        // mediaId was undeclared, so Mongoose strict mode silently discarded
        // every write the S3→R2 migration attempted here — which is why
        // homePageRoute.js's `review.photo?.mediaId` branch was dead code.
        key: { type: String },
        mediaId: { type: String },
    },
    reviewText: { type: String, trim: true, required: true },
    person: {
        name: { type: String, trim: true, required: true },
        gender: { type: String, trim: true, required: true, enum: ["Bride", "Groom", "Couple", "Family"] },
    },
    // Optional: the wedding this couple's review belongs to. Its story page
    // (/weddings/story/<slug>) shows the review (plan phase 7).
    client: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', default: null, index: true },
}, { timestamps: true });


export default mongoose.model('ClientReview', ClientReviewSchema);