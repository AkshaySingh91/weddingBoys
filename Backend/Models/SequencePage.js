import mongoose from 'mongoose';

// One atomic published pointer for all scroll scenes on a page.
const schema = new mongoose.Schema({
    pageKey: { type: String, required: true, unique: true, index: true },
    slots: {
        hero: { type: mongoose.Schema.Types.ObjectId, ref: 'Sequence' },
        director: { type: mongoose.Schema.Types.ObjectId, ref: 'Sequence' },
    },
    updatedBy: String,
}, { timestamps: true });

export default mongoose.models.SequencePage || mongoose.model('SequencePage', schema);
