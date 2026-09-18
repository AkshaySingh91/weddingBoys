import mongoose from 'mongoose';

// A scroll-driven frame sequence (Apple-style canvas animation). Frames are not
// stored as individual documents — that's wasteful for 100-300 frames. Instead a
// key *pattern* + count describes the set, and per-network TIERS declare a
// frame-skip factor and a resolution so weak devices fetch a smaller, sparser
// set of the SAME frames.
const tierSchema = new mongoose.Schema({
    label: { type: String, required: true },      // 'high' | 'medium' | 'low'
    everyNth: { type: Number, default: 1 },        // 1 = all frames, 2 = every other, 3 = every third
    width: { type: Number },                       // frame width to request from the CDN
    quality: { type: Number, default: 75 },
}, { _id: false });

const sequenceSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    slug: { type: String, unique: true, index: true, trim: true },

    // Optional association (e.g. the Varanasi landing page).
    ownerType: { type: String, default: 'Website' },
    ownerId: { type: mongoose.Schema.Types.Mixed, default: null },

    // ---- Frame addressing ----
    // Full frame URL is built as: `${cdnBase}/${keyPattern}` with {index}
    // substituted and zero-padded to `padTo`. e.g.
    //   keyPattern: 'sequences/varanasi/frame_{index}.jpg', padTo: 4
    //   -> sequences/varanasi/frame_0007.jpg
    keyPattern: { type: String, required: true },
    padTo: { type: Number, default: 4 },
    startIndex: { type: Number, default: 0 },
    frameCount: { type: Number, required: true },
    frameRate: { type: Number, default: 30 },      // source fps (informational)

    // ---- Geometry ----
    width: { type: Number },
    height: { type: Number },
    aspectRatio: { type: Number },

    // ---- Adaptive placeholder + tiers ----
    blurDataURL: { type: String },                 // first-frame blur, shown before frames load
    posterUrl: { type: String },                   // sharp poster of frame 0
    tiers: {
        type: [tierSchema],
        default: [
            { label: 'high', everyNth: 1, width: 1920, quality: 80 },
            { label: 'medium', everyNth: 2, width: 1280, quality: 70 },
            { label: 'low', everyNth: 3, width: 720, quality: 60 },
        ],
    },

    provider: { type: String, enum: ['S3', 'R2'], default: 'R2' },
    bucket: { type: String },
    status: { type: String, enum: ['Draft', 'Ready', 'Archived'], default: 'Draft' },
}, { timestamps: true });

// Build the ordered list of frame keys for a given tier (applies frame-skip).
sequenceSchema.methods.frameKeys = function frameKeys(everyNth = 1) {
    const keys = [];
    for (let i = 0; i < this.frameCount; i += everyNth) {
        const idx = String(this.startIndex + i).padStart(this.padTo, '0');
        keys.push(this.keyPattern.replace('{index}', idx));
    }
    return keys;
};

const Sequence = mongoose.models.Sequence || mongoose.model('Sequence', sequenceSchema);
export default Sequence;
