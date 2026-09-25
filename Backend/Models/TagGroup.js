import mongoose from 'mongoose';

/**
 * A family of tags, e.g. Ceremony, Film type, Region.
 *
 * `single` groups allow at most one tag per item (an item is ONE ceremony and
 * ONE film type); `multi` groups any number. `appliesTo` limits a group to films
 * or photos (Film type is films only). `system` groups (ceremony, film-type,
 * unsorted) are referenced by code and cannot be deleted or re-keyed.
 *
 * `legacyTagType` is the old `Tags.tagType` the group came from; the
 * compatibility endpoint /api/get-all-tags lists exactly those groups, in the
 * old shape, so the filters built on it keep working unchanged.
 */
const tagGroupSchema = new mongoose.Schema({
    key: { type: String, required: true, unique: true, immutable: true, lowercase: true, trim: true },
    label: { type: String, required: true, trim: true },
    cardinality: { type: String, enum: ['single', 'multi'], default: 'multi' },
    appliesTo: { type: [{ type: String, enum: ['Video', 'Photo'] }], default: ['Video', 'Photo'] },
    order: { type: Number, default: 0 },
    hidden: { type: Boolean, default: false },
    system: { type: Boolean, default: false },
    legacyTagType: { type: String, trim: true },
    description: { type: String, trim: true },
}, { timestamps: true });

export default mongoose.models.TagGroup || mongoose.model('TagGroup', tagGroupSchema);
