import mongoose from 'mongoose';

/**
 * Every change to the taxonomy that touches items or page settings, with what
 * it was before — so the admin can see what happened and undo it.
 *
 *   before / after   the tag (and, for merge, the source tag) as it was / became
 *   items            items the operation changed (merge: those that had the source)
 *   itemsHadTarget   merge only: items that already carried the target, which an
 *                    undo must leave with it
 *   pageLists        WebsiteSettings row lists before the operation, if it changed them
 */
const tagOperationSchema = new mongoose.Schema({
    type: { type: String, enum: ['create', 'rename', 'merge', 'delete', 'move'], required: true },
    tag: { type: mongoose.Schema.Types.ObjectId, ref: 'Tag' },
    summary: { type: String },
    before: { type: mongoose.Schema.Types.Mixed },
    after: { type: mongoose.Schema.Types.Mixed },
    items: [{ type: mongoose.Schema.Types.ObjectId }],
    itemsHadTarget: [{ type: mongoose.Schema.Types.ObjectId }],
    pageLists: { type: mongoose.Schema.Types.Mixed },
    by: { type: String },
    undoneAt: { type: Date },
    undoneBy: { type: String },
}, { timestamps: true });

tagOperationSchema.index({ createdAt: -1 });
tagOperationSchema.index({ tag: 1, createdAt: -1 });

export default mongoose.models.TagOperation || mongoose.model('TagOperation', tagOperationSchema);
