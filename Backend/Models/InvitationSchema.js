import mongoose from 'mongoose';

/**
 * An invitation a couple sent from /contact, as their partner opens it at
 * /invite/<code>: their sentence (names, what, when, where) in the "light" they
 * chose, and a fixed set of the studio's photographs picked when it was made.
 * Never holds the couple's contact details or note. Expires on its own.
 */
export const INVITE_GRADES = ['ivory', 'haldi', 'mehendi', 'sangeet', 'pheras', 'reception'];

const Invitation = new mongoose.Schema({
    code: { type: String, required: true, unique: true },
    enquiry: { type: mongoose.Schema.Types.ObjectId, ref: 'Enquiry', default: null },
    names: { a: { type: String, default: '' }, b: { type: String, default: '' } },
    kind: { type: String, default: '' },
    when: { type: String, default: '' },
    city: { type: String, default: '' },
    grade: { type: String, enum: INVITE_GRADES, default: 'ivory' },
    photoIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'PortfolioItem' }],
    views: { count: { type: Number, default: 0 }, firstAt: { type: Date, default: null } },
    reply: { circled: [{ type: mongoose.Schema.Types.ObjectId }], at: { type: Date, default: null }, edits: { type: Number, default: 0 } },
    status: { type: String, enum: ['active', 'revoked'], default: 'active' },
    expiresAt: { type: Date, required: true },
}, { timestamps: true });

Invitation.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.models.Invitation || mongoose.model('Invitation', Invitation);
