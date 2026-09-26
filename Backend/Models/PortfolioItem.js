import mongoose from 'mongoose';

/**
 * One video or photo of a client, as presented on the public site.
 *
 * This is the EDITORIAL layer, distinct from the asset layer:
 *
 *   Media          — "what file is this and how do I serve it fast?"
 *                    bytes, variants, renditions, poster, blur
 *   PortfolioItem  — "what does this mean and where should it appear?"
 *                    tags, shoot date, location, priority, hero flag, credits
 *
 * It replaces the embedded `Client.videos[]` / `Client.photos[]` subdocuments,
 * which forced every films/gallery/search request to `$unwind` the whole clients
 * collection — measured as a COLLSCAN with zero index keys used, because an
 * index on `videos.*` cannot serve a sort applied after `$unwind`.
 *
 * Videos and photos share one collection, discriminated by `kind`. They are read
 * together by search, the map's representative-media pick, and the cross-client
 * admin view, so splitting them would mean duplicate indexes and a `$unionWith`.
 */

const CREDIT_SHAPE = { _id: false, };

const portfolioItemSchema = new mongoose.Schema({
    kind: { type: String, enum: ['Video', 'Photo'], required: true },
    client: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true },

    // ---- the asset ----
    // `media` is the authoritative reference. `mediaId` mirrors Media.mediaId
    // (the nanoid) so Utils/mediaUrl.js resolveNode({ mediaId, key }) works
    // against this document unchanged.
    media: { type: mongoose.Schema.Types.ObjectId, ref: 'Media' },
    mediaId: { type: String },

    // Poster OVERRIDE only. The default poster is the frame the ffmpeg worker
    // extracted (Media.video.posterUrl); this exists because the studio
    // hand-picked thumbnails historically and discarding them would visibly
    // change every film card.
    poster: { type: mongoose.Schema.Types.ObjectId, ref: 'Media' },
    posterMediaId: { type: String },

    // ---- editorial ----
    title: { type: String, trim: true },
    caption: { type: String, trim: true },
    // The taxonomy (Models/Tag.js). The source of truth for what an item is
    // tagged with; validated per group by Services/taxonomy.js.
    tagIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Tag' }],
    // Label copies of tagIds, written by the server on every change, kept for
    // one release for search and anything still reading strings:
    //   tags        every tag except the ceremony
    //   eventGroup  the ceremony
    tags: [{ type: String, trim: true }],
    eventGroup: { type: String, trim: true, default: '', index: true },

    // Unified from videoShootDate / photoShootDate and videoLocation /
    // photoLocation, which were the same thing under two names.
    shootDate: { type: Date },
    location: {
        country: { type: String, trim: true },
        state: { type: String, trim: true },
        city: { type: String, trim: true },
        citySlug: { type: String, trim: true, lowercase: true },
        venue: { type: String, trim: true },
    },
    // Position within its wedding (and ceremony) on the story page; set by the
    // admin's drag order. Lower first.
    order: { type: Number, default: 0 },
    // A replacement file still processing. The worker swaps it in as `media`
    // when it is ready, so the live item never shows a half-processed file.
    pendingMedia: { type: mongoose.Schema.Types.ObjectId, ref: 'Media' },
    // A film hosted on YouTube or Vimeo instead of our storage (plan D8). Such an
    // item has no `media`; it is ready as soon as it is added.
    external: {
        provider: { type: String, enum: ['youtube', 'vimeo'] },
        url: { type: String, trim: true },
        videoId: { type: String, trim: true },
        title: { type: String, trim: true },
        posterUrl: { type: String, trim: true },
        durationSec: { type: Number },
    },

    isHero: { type: Boolean, default: false },
    heroPriority: { type: Number, default: 0 },
    // NOT `Math.floor(Math.random()*100)` — the old schema evaluated that once at
    // module load, so every document created in a process run shared one value.
    generalPriority: { type: Number, default: 0 },

    // The admin's intent for THIS item. Publishing, unpublishing or archiving the
    // wedding never rewrites it, so what an admin hid stays hidden.
    status: { type: String, enum: ['Draft', 'Published', 'Archived'], default: 'Published' },
    // First time the item actually became visible to the public.
    publishedAt: { type: Date },

    // Server-maintained copies, so the public gate is one indexed equality match
    // (Services/portfolioVisibility.js is their only writer):
    //   clientStatus — the wedding's status, copied by setClientStatus();
    //   mediaReady   — the asset has finished processing and there is something
    //                  to show, maintained by markMediaReady() / markMediaGone().
    clientStatus: { type: String, enum: ['Draft', 'Published', 'Archived'], default: 'Draft' },
    mediaReady: { type: Boolean, default: false },

    /**
     * Behind-the-scenes credits, carried over from `Client.videos[].bts`.
     *
     * The source convention is `{ key: person, value: role }` (VideoDetailsForm
     * writes `{ key: role.key, value: role.title }`, and btsRoleSchema is
     * `{ title: role, key: name }`). A handful of hand-entered rows are reversed;
     * the backfill reports those rather than guessing, so they can be corrected
     * in the admin instead of being silently mangled here.
     */
    credits: [{ name: { type: String, trim: true }, role: { type: String, trim: true }, ...CREDIT_SHAPE }],

    // Denormalised so search can match couple names without a join. Search runs
    // as an escaped regex `$or`, not `$text`: the app connects with
    // `serverApi: { version: '1', strict: true }`, and `$text` is not part of
    // MongoDB's Stable API, so it is rejected whatever indexes exist.
    clientNameText: { type: String },

    /**
     * Delivery cache written from the Media document.
     *
     * Denormalised rather than `$lookup`-ed: a films page is ~8 rows x 10 items,
     * so a per-row join is 8 extra collection hits per page load. R2 URLs are
     * immutable by construction, so these cannot silently rot — they change only
     * when the worker finishes or the asset is replaced, both single write points.
     */
    render: {
        posterUrl: String,
        blurDataURL: String,
        dominantColor: String,
        aspectRatio: Number,
        width: Number,
        height: Number,
        imageUrl: String,                       // Photo
        loopUrl: String, webUrl: String, sourceUrl: String,   // Video
        embedUrl: String,                                     // Video hosted on YouTube / Vimeo
        durationSec: Number,
        syncedAt: Date,
    },

    // Bridge back to the embedded era. `subdocId` is reused as this document's
    // `_id` where possible (verified: zero duplicates), so existing
    // /films/:id and /photos/:id URLs — already in the sitemap — keep resolving.
    legacy: {
        subdocId: mongoose.Schema.Types.ObjectId,
        source: { type: String, enum: ['client.videos', 'client.photos'] },
        s3Key: String,
        thumbnailS3Key: String,
    },
}, { timestamps: true });

// ---- indexes ---------------------------------------------------------------
// Each public read must be an index-ordered scan with no blocking sort.
// `tags` comes LAST in the feed index: in a compound multikey index the sort
// keys must precede the array field for the index to serve the sort.
portfolioItemSchema.index(
    { kind: 1, status: 1, isHero: -1, heroPriority: -1, generalPriority: -1, _id: -1, tags: 1 },
    { name: 'feed' },
);
// The public gate (status, clientStatus, mediaReady) as equality prefixes,
// then the feed sort, then the tag ids rows filter on. Supersedes `feed`,
// which is dropped with the legacy data.
portfolioItemSchema.index(
    { kind: 1, status: 1, clientStatus: 1, mediaReady: 1, isHero: -1, heroPriority: -1, generalPriority: -1, _id: -1, tagIds: 1 },
    { name: 'publicFeedByTag' },
);
portfolioItemSchema.index(
    { client: 1, kind: 1, isHero: -1, heroPriority: -1, generalPriority: -1 },
    { name: 'byClient' },
);
portfolioItemSchema.index(
    { client: 1, eventGroup: 1, kind: 1 },
    { name: 'byClientEventGroup' },
);
portfolioItemSchema.index(
    { isHero: 1, heroPriority: -1 },
    { name: 'hero', partialFilterExpression: { isHero: true } },
);
portfolioItemSchema.index({ media: 1 }, { name: 'byMedia', sparse: true });
portfolioItemSchema.index({ 'legacy.subdocId': 1 }, { name: 'legacySubdoc', unique: true, sparse: true });
portfolioItemSchema.index({ 'legacy.s3Key': 1 }, { name: 'legacyKey', sparse: true });
portfolioItemSchema.index({ tags: 1, kind: 1, status: 1 }, { name: 'tagOverlap' });
portfolioItemSchema.index({ tagIds: 1, kind: 1, status: 1 }, { name: 'byTag' });
portfolioItemSchema.index({ status: 1, updatedAt: -1 }, { name: 'adminList' });
// No text index: the app connects with Stable API `strict: true`, under which
// `$text` is rejected outright. Search uses an escaped regex $or over
// clientNameText / tags / location instead (Services/portfolioService.js), which
// the `feed` index still narrows by kind+status first.

const PortfolioItem = mongoose.models.PortfolioItem
    || mongoose.model('PortfolioItem', portfolioItemSchema);
export default PortfolioItem;
