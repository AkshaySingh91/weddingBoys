import mongoose from 'mongoose';
import { nanoid } from 'nanoid';

// The block types the CMS knows how to render. Adding a new experience is a
// matter of adding a type here + a renderer/editor on the frontend — no schema
// change, because every block shares the same flexible shape below.
export const BLOCK_TYPES = [
    'heading',       // title + subtitle
    'richText',      // title + body (HTML)
    'mediaSingle',   // one image/video with caption
    'mediaGallery',  // ordered grid/strip of media (e.g. BTS)
    'heroVideo',     // full-bleed video showcase (items -> client films)
    'reviews',       // testimonials (items: body + person + photo)
    'team',          // team members (items: portrait + name + role + about)
    'featureCards',  // cards (items: media + title + body + link)
    'cta',           // call-to-action banner
    'stats',         // metric tiles (items: value + label)
    'section',       // binding to a rich client component via settings.component
];

// A single media slot inside a block or item — a reference into the polymorphic
// Media collection, so every asset is managed from one library.
const mediaRef = { type: mongoose.Schema.Types.ObjectId, ref: 'Media' };

// Repeatable entry used by list-style blocks (reviews, team, cards, hero films…).
const itemSchema = new mongoose.Schema({
    _id: { type: String, default: () => nanoid(8) },
    title: { type: String, trim: true },
    subtitle: { type: String, trim: true },
    body: { type: String },
    link: { type: String, trim: true },
    media: [mediaRef],
    // Free-form per-item extras (socials, priority, coordinates, videoId, …).
    meta: { type: mongoose.Schema.Types.Mixed, default: {} },
}, { _id: false });

const blockSchema = new mongoose.Schema({
    _id: { type: String, default: () => nanoid(10) },
    // Stable slug used by code that wants a specific block (e.g. 'home-bts').
    key: { type: String, trim: true },
    type: { type: String, enum: BLOCK_TYPES, required: true },

    title: { type: String, trim: true },
    subtitle: { type: String, trim: true },
    body: { type: String },
    link: { type: String, trim: true },

    media: [mediaRef],
    items: [itemSchema],

    // Per-type layout options (columns, variant, autoplay, alignment, …).
    settings: { type: mongoose.Schema.Types.Mixed, default: {} },

    order: { type: Number, default: 0 },
    visible: { type: Boolean, default: true },
}, { _id: false });

// One document per page (home, about, films, …). Blocks are ordered content.
const pageContentSchema = new mongoose.Schema({
    pageKey: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    title: { type: String, trim: true },
    description: { type: String, trim: true },   // internal note / meta description
    status: { type: String, enum: ['Draft', 'Published'], default: 'Published' },
    // What visitors see. Changed only by Publish.
    blocks: [blockSchema],
    // The admin's working copy (plan phase 6). "Save draft" writes here and
    // never touches `blocks`, so a half-finished edit cannot reach — or blank —
    // the live page. Publish copies it over and clears it; Discard clears it.
    draft: {
        title: { type: String, trim: true },
        description: { type: String, trim: true },
        blocks: { type: [blockSchema], default: undefined },
        savedAt: { type: Date },
        savedBy: { type: String },
    },
    publishedAt: { type: Date },
    publishedBy: { type: String },
    updatedBy: { type: String },
}, { timestamps: true });

const PageContent = mongoose.models.PageContent || mongoose.model('PageContent', pageContentSchema);
export default PageContent;
