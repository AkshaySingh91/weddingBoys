import mongoose from "mongoose";

const Enquiry = new mongoose.Schema({
    requestId: { type: String },
    requestHash: { type: String },
    notification: {
        status: { type: String, enum: ['Pending', 'Sending', 'Sent'], default: 'Pending' },
        attempts: { type: Number, default: 0 },
        nextAttemptAt: { type: Date, default: Date.now },
        lockedAt: { type: Date, default: null },
        sentAt: { type: Date },
    },
    Bride: { type: String, required: true },
    Groom: { type: String, required: true },
    Contact: { type: String, required: true },
    Date: {
        type: Object, required: true
    },
    Reach: { type: String, default: '' },
    SubmittedTime: { type: String, required: true, default: () => new Date().toISOString() },
    isViewed: { type: Boolean, default: false, required: true }
}, { timestamps: true })

Enquiry.index({ requestId: 1 }, { unique: true, partialFilterExpression: { requestId: { $type: 'string' } } });
Enquiry.index({ 'notification.status': 1, 'notification.nextAttemptAt': 1 });
export default mongoose.models.Enquiry || mongoose.model('Enquiry', Enquiry);