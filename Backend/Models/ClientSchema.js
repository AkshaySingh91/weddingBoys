import mongoose from "mongoose";

const Client = new mongoose.Schema({
    clientName: {
        // `required` (it said `require`, which Mongoose ignores, so a wedding
        // could be saved with no names).
        Bride: {
            type: String, required: true, trim: true
        },
        Groom: {
            type: String, required: true, trim: true
        },
    },
    celebrationDates: {
        startDate: { type: Date },
        endDate: { type: Date },
        season: { type: String, trim: true },
        spanDisplay: { type: String, trim: true },
    },
    weddingDate: { type: Date },
    // Authoritative for the wedding; copied onto its items by
    // Services/portfolioVisibility.js setClientStatus(), never written directly.
    status: { type: String, enum: ['Draft', 'Published', 'Archived'], default: 'Draft', index: true },
    publishedAt: { type: Date },
    archivedAt: { type: Date },

    // ---- the public story page: /weddings/story/<slug> -------------------
    // `slug` is unique; earlier slugs stay in `slugHistory` so old links 301 to
    // the current one. Sparse: weddings get one on create or from
    // scripts/backfillClientProfiles.js.
    slug: { type: String, trim: true, lowercase: true, index: { unique: true, sparse: true } },
    slugHistory: { type: [{ type: String, lowercase: true }], index: true },
    location: {
        city: { type: String, trim: true },
        citySlug: { type: String, trim: true, lowercase: true, index: true },
        state: { type: String, trim: true },
        country: { type: String, trim: true },
        venue: { type: String, trim: true },
    },
    // The portfolio item whose poster or photo represents the wedding.
    cover: { type: mongoose.Schema.Types.ObjectId, ref: 'PortfolioItem' },
    featured: { type: Boolean, default: false },
    story: {
        intro: { type: String, trim: true },
        enabled: { type: Boolean, default: true },
    },
    // Idempotent create: a retried POST with the same id returns the same wedding
    // instead of a second one.
    createRequestId: { type: String, index: { unique: true, sparse: true } },
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
// `timestamp` (singular) is not an option Mongoose recognises — it was silently
// ignored, so createdAt/updatedAt were never written. getAllClients'
// `$ifNull: ["$createdAt", new Date()]` therefore always fell through, and every
// client card's "Modified" date rendered as today.
}, { timestamps: true })

export default mongoose.model('Client', Client);