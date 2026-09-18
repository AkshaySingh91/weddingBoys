import mongoose from 'mongoose';
import slugify from 'slugify';

// A metric tile shown at the top of a package card (e.g. "8 Hours", "4 Members").
// Kept generic so admins can add any metric without a schema change.
const metricSchema = new mongoose.Schema({
    label: { type: String, required: true, trim: true },   // "Duration"
    value: { type: String, required: true, trim: true },   // "8 Hours"
    icon: { type: String, trim: true },                    // optional lucide/icon key
}, { _id: false });

// A titled group of feature bullets (e.g. "Your Dedicated Team" → [...]).
const featureCategorySchema = new mongoose.Schema({
    title: { type: String, required: true, trim: true },
    icon: { type: String, trim: true },
    items: [{ type: String, trim: true }],
}, { _id: false });

// A ribbon/badge (e.g. "Popular Choice", "Save 20%") with an optional tone
// so the frontend can colour it without hardcoding text matching.
const badgeSchema = new mongoose.Schema({
    label: { type: String, required: true, trim: true },
    tone: { type: String, enum: ['popular', 'discount', 'new', 'custom'], default: 'custom' },
}, { _id: false });

const pricingPackageSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    slug: { type: String, unique: true, index: true },
    // Optional grouping so one collection can power multiple pricing pages
    // (e.g. 'wedding', 'pre-wedding', 'events').
    category: { type: String, trim: true, default: 'general', index: true },
    tagline: { type: String, trim: true },
    description: { type: String, trim: true },

    // ---- Pricing ----
    currency: { type: String, default: 'INR' },
    originalPrice: { type: Number, required: true },
    discountedPrice: { type: Number },                     // null/omitted = no discount
    priceSuffix: { type: String, trim: true },             // e.g. "onwards", "/ day"

    // ---- Presentation ----
    badges: [badgeSchema],
    metrics: [metricSchema],
    featureCategories: [featureCategorySchema],

    // Call-to-action
    ctaLabel: { type: String, default: 'Enquire Now' },
    ctaLink: { type: String, default: '/contact' },

    // ---- Admin controls (scale / toggle / reorder without code) ----
    isActive: { type: Boolean, default: true, index: true },
    isFeatured: { type: Boolean, default: false },          // visually emphasised tier
    order: { type: Number, default: 0, index: true },
}, { timestamps: true });

// Derived helpers the frontend can use directly.
pricingPackageSchema.virtual('effectivePrice').get(function () {
    return this.discountedPrice ?? this.originalPrice;
});
pricingPackageSchema.virtual('discountPercent').get(function () {
    if (!this.discountedPrice || this.discountedPrice >= this.originalPrice) return 0;
    return Math.round(((this.originalPrice - this.discountedPrice) / this.originalPrice) * 100);
});
pricingPackageSchema.set('toJSON', { virtuals: true });
pricingPackageSchema.set('toObject', { virtuals: true });

// Auto-slug (collision-tolerant enough for an admin-curated list).
pricingPackageSchema.pre('validate', function (next) {
    if (!this.slug && this.name) {
        this.slug = `${slugify(this.name, { lower: true, strict: true })}-${Date.now().toString(36)}`;
    }
    next();
});

const PricingPackage = mongoose.models.PricingPackage || mongoose.model('PricingPackage', pricingPackageSchema);
export default PricingPackage;
