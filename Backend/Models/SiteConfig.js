import mongoose from 'mongoose';

// GLOBALS — single-document configuration that is true site-wide, kept
// deliberately separate from relational collections (Clients, Blogs, Pricing…).
// One document identified by a fixed key so it's always a predictable read.
const linkSchema = new mongoose.Schema({
    label: { type: String, trim: true },
    href: { type: String, trim: true },
}, { _id: false });

const siteConfigSchema = new mongoose.Schema({
    key: { type: String, default: 'global', unique: true, index: true },

    studio: {
        name: { type: String, default: 'The Wedding Boys' },
        tagline: { type: String },
        logo: { type: mongoose.Schema.Types.ObjectId, ref: 'Media' },
        email: { type: String },
        phones: [{ type: String }],
        address: { type: String },
        whatsapp: { type: String },
    },

    socials: {
        instagram: { type: String, default: '' },
        youtube: { type: String, default: '' },
        facebook: { type: String, default: '' },
        x: { type: String, default: '' },
        pinterest: { type: String, default: '' },
    },

    header: {
        navLinks: [linkSchema],
        ctaLabel: { type: String },
        ctaHref: { type: String },
        announcement: { type: String },     // optional top banner text
        announcementActive: { type: Boolean, default: false },
    },

    footer: {
        blurb: { type: String },
        columns: [{
            title: { type: String },
            links: [linkSchema],
        }],
        copyright: { type: String },
    },

    seo: {
        defaultTitle: { type: String },
        defaultDescription: { type: String },
        ogImage: { type: mongoose.Schema.Types.ObjectId, ref: 'Media' },
    },
}, { timestamps: true });

// Convenience accessor so callers never worry about whether the doc exists yet.
siteConfigSchema.statics.getSingleton = async function getSingleton() {
    return (await this.findOne({ key: 'global' }))
        || this.create({ key: 'global' });
};

const SiteConfig = mongoose.models.SiteConfig || mongoose.model('SiteConfig', siteConfigSchema);
export default SiteConfig;
