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
    Groom: { type: String, default: '' },
    Contact: { type: String, required: true },
    // An exact day { start, end }, or null when they gave a month / not fixed (DateNote).
    Date: { type: Object, default: null },
    DateNote: { type: String, default: '' },
    Kind: { type: String, default: '' },
    City: { type: String, default: '' },
    Source: { type: String, default: '' },
    Context: { type: String, default: '' },
    Message: { type: String, default: '' },
    Channel: { type: String, enum: ['form', 'whatsapp'], default: 'form' },
    Grade: { type: String, default: '' },
    // the invitation made with it (/invite/<code>), for the partner
    Invite: { type: mongoose.Schema.Types.ObjectId, ref: 'Invitation', default: null },
    Reach: { type: String, default: '' },
    SubmittedTime: { type: String, required: true, default: () => new Date().toISOString() },
    isViewed: { type: Boolean, default: false, required: true }
}, { timestamps: true })

Enquiry.index({ requestId: 1 }, { unique: true, partialFilterExpression: { requestId: { $type: 'string' } } });
Enquiry.index({ 'notification.status': 1, 'notification.nextAttemptAt': 1 });
export default mongoose.models.Enquiry || mongoose.model('Enquiry', Enquiry);