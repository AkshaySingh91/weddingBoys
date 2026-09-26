import mongoose from 'mongoose';

/**
 * A curated row of films or photos (plan phase 5, decision D2: rule + pins).
 *
 * What a row shows, in order (Services/collectionResolver.js):
 *   1. `pinned`, exactly in this order (a pin that is not public is skipped,
 *      and the preview says why);
 *   2. then items matching `rule`, sorted by `sort`, never repeating a pin,
 *      never showing one in `hidden`, and with `dedupe` never one already
 *      shown earlier on the same page;
 *   3. at most `rule.maxPerWedding` per wedding (pins count), cut at `limit`.
 *
 * `key` is how pages refer to a row ("home-hero", "films-beach") and never
 * changes; `system` rows (the hero) cannot be deleted.
 */
const collectionSchema = new mongoose.Schema({
    key: { type: String, required: true, unique: true, immutable: true, lowercase: true, trim: true },
    title: { type: String, required: true, trim: true },
    subtitle: { type: String, trim: true },
    kind: { type: String, enum: ['Video', 'Photo'], required: true },
    rule: {
        enabled: { type: Boolean, default: true },
        tagIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Tag' }],
        match: { type: String, enum: ['any', 'all'], default: 'any' },
        excludeTagIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Tag' }],
        clientIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Client' }],
        citySlugs: [{ type: String, lowercase: true, trim: true }],
        shootDateFrom: { type: Date },
        shootDateTo: { type: Date },
        maxPerWedding: { type: Number, min: 1, max: 60 },
    },
    sort: { type: String, enum: ['newestShoot', 'newestPublished', 'featured'], default: 'newestShoot' },
    limit: { type: Number, min: 1, max: 60, default: 12 },
    pinned: [{ type: mongoose.Schema.Types.ObjectId, ref: 'PortfolioItem' }],
    hidden: [{ type: mongoose.Schema.Types.ObjectId, ref: 'PortfolioItem' }],
    dedupe: { type: Boolean, default: false },
    status: { type: String, enum: ['Draft', 'Published'], default: 'Published' },
    system: { type: Boolean, default: false },
    description: { type: String, trim: true },
    updatedBy: { type: String },
}, { timestamps: true });

collectionSchema.index({ pinned: 1 });
collectionSchema.index({ hidden: 1 });
collectionSchema.index({ 'rule.tagIds': 1 });
collectionSchema.index({ 'rule.excludeTagIds': 1 });

export default mongoose.models.Collection || mongoose.model('Collection', collectionSchema);
