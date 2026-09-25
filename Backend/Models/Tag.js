import mongoose from 'mongoose';

/**
 * One tag. Portfolio items store its `_id` (PortfolioItem.tagIds), never its
 * label, so a rename touches this one document and a merge is one update.
 *
 * `slug` is unique within the group and is what URLs use. `aliases` hold old
 * labels and slugs (added on rename and merge), so a link or row that still
 * says "Cassic" resolves to Classic. Matching is case-insensitive
 * (Services/taxonomy.js resolveTagParam).
 */
const tagSchema = new mongoose.Schema({
    group: { type: mongoose.Schema.Types.ObjectId, ref: 'TagGroup', required: true, index: true },
    label: { type: String, required: true, trim: true },
    slug: { type: String, required: true, lowercase: true, trim: true },
    aliases: [{ type: String, lowercase: true, trim: true }],
    color: { type: String, trim: true },
    order: { type: Number, default: 0 },
    hidden: { type: Boolean, default: false },
    description: { type: String, trim: true },
}, { timestamps: true });

tagSchema.index({ group: 1, slug: 1 }, { unique: true });
tagSchema.index({ aliases: 1 });

// Explicit collection: the default for "Tag" would be `tags`, which is the old
// category collection (Models/TagsSchema.js) that this replaces.
export default mongoose.models.Tag || mongoose.model('Tag', tagSchema, 'taxonomytags');
