import mongoose from 'mongoose';

const ceremonySchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
            unique: true,
        },
        slug: {
            type: String,
            required: true,
            trim: true,
            unique: true,
            lowercase: true,
        },
        order: {
            type: Number,
            default: 0,
        },
        color: {
            type: String,
            default: 'amber', // 'amber' | 'emerald' | 'purple' | 'rose' | 'indigo' | 'gold' | 'sky' | 'neutral'
        },
        isActive: {
            type: Boolean,
            default: true,
        },
        description: {
            type: String,
            default: '',
        },
    },
    { timestamps: true }
);

ceremonySchema.index({ order: 1, name: 1 });

const Ceremony = mongoose.models.Ceremony || mongoose.model('Ceremony', ceremonySchema);
export default Ceremony;
