/**
 * Turns a page's section blocks into the data they show (plan phase 6).
 *
 * Each composable section (Utils/sectionSettings.js) names collections or tag
 * groups; this resolves them with the same resolver the admin preview uses, so
 * the page shows exactly what the preview showed. Items come in the shapes the
 * site's components already render (the legacy row / photo / hero shapes), so a
 * component switches from fetching to reading `data` without other changes.
 */
import { resolveCollection, resolveMany } from './collectionResolver.js';
import Collection from '../Models/Collection.js';
import { toLegacyVideoRow, toLegacyPhotoRow, toLegacyHeroSlide } from './portfolioService.js';
import { loadTaxonomy } from './taxonomy.js';
import TeamSchema from '../Models/TeamSchema.js';
import ClientReview from '../Models/ReviewSchema.js';
import PricingPackage from '../Models/PricingPackage.js';
import { resolveNode } from '../Utils/mediaUrl.js';
import { getObjectUrl } from '../Controllers/awsController.js';

const photoRow = (i) => ({ ...toLegacyPhotoRow(i), client: i.client?.clientName });
const head = (c) => ({ key: c.key, title: c.title, subtitle: c.subtitle || null });

async function rowsOf(keys, kind, { dedupeAll = false, includeDrafts = false } = {}) {
    const rows = await resolveMany(keys || [], { dedupeAll, includeDrafts });
    return rows.filter((r) => r.collection.kind === kind).map((r) => ({
        ...head(r.collection),
        items: r.items.map(kind === 'Video' ? toLegacyVideoRow : photoRow),
        hasMore: r.hasMore,
    }));
}

/** Facet groups for a browse page: the ones chosen, or every visible category. */
async function facetsOf(groupKeys, kind) {
    const tax = await loadTaxonomy();
    const usable = tax.groups.filter((g) => !g.hidden && (g.appliesTo || []).includes(kind));
    const chosen = groupKeys?.length
        ? groupKeys.map((k) => usable.find((g) => g.key === k)).filter(Boolean)
        : usable.filter((g) => g.legacyTagType);
    return chosen.map((g) => ({
        key: g.key,
        label: g.label,
        cardinality: g.cardinality,
        tags: tax.tags.filter((t) => String(t.group) === String(g._id) && !t.hidden).map((t) => ({ label: t.label, slug: t.slug })),
    }));
}

const RESOLVERS = {
    async heroVideos(s, opts) {
        const c = await Collection.findOne({ key: s.collectionKey || 'home-hero', ...(opts.includeDrafts ? {} : { status: 'Published' }) }).lean();
        if (!c) return { slides: [] };
        const { items } = await resolveCollection(c);
        return { slides: items.map(toLegacyHeroSlide) };
    },
    async ourFilms(s, opts) {
        return { heading: s.heading || null, defaultTab: s.defaultTab || null, tabs: await rowsOf(s.tabs, 'Video', opts) };
    },
    async portfolio(s, opts) {
        return { heading: s.heading || null, tabs: await rowsOf(s.tabs, 'Photo', opts) };
    },
    async filmRows(s, opts) {
        return { rows: await rowsOf(s.rows, 'Video', { ...opts, dedupeAll: Boolean(s.dedupe) }) };
    },
    async browseFilms(s) {
        return { facets: await facetsOf(s.facetGroups, 'Video'), sort: s.sort, pageSize: s.pageSize };
    },
    async photoGallery(s) {
        return { facets: await facetsOf(s.facetGroups, 'Photo'), sort: s.sort, pageSize: s.pageSize };
    },
    // Admin › Pricing. `null` when no package was ever created: the section
    // keeps its built-in packages until the first one is (scripts/seedPricingPackages.js).
    async packages() {
        const any = await PricingPackage.exists({});
        if (!any) return { packages: null };
        const list = await PricingPackage.find({ isActive: true }).sort({ order: 1, createdAt: 1 }).lean();
        return {
            packages: list.map((p) => ({
                _id: String(p._id),
                name: p.name,
                tagline: p.tagline || '',
                description: p.description || '',
                originalPrice: p.originalPrice,
                discountedPrice: p.discountedPrice ?? null,
                isFeatured: Boolean(p.isFeatured),
                team: p.team || [],
                includes: (p.includes || []).map((i) => ({ text: i.text, included: i.included !== false })),
                recommendedFor: p.recommendedFor || '',
            })),
        };
    },
};

const photoOf = async (node, alt) => {
    if (!node?.mediaId && !node?.key?.trim()) return [];
    const url = await resolveNode(node, getObjectUrl).catch(() => null);
    return url ? [{ url, altText: alt }] : [];
};

/**
 * Content blocks whose items live in their own admin screen (plan phase 7: one
 * truth per thing). The block keeps its title and place on the page; its
 * items always come from the source, so the CMS never holds a second copy.
 */
const BLOCK_SOURCES = {
    // Website › Team (also /team and the film pages).
    async team() {
        const people = await TeamSchema.find({ isHero: { $ne: true }, 'about.name': { $exists: true } }).sort({ _id: 1 }).lean();
        return Promise.all(people.map(async (p) => ({
            _id: String(p._id),
            title: p.about?.name?.trim() || '',
            subtitle: p.about?.designation || '',
            media: await photoOf(p.imageMetaData, p.about?.name || ''),
        })));
    },
    // Website › Home › Couple reviews.
    async reviews() {
        const reviews = await ClientReview.find().sort({ createdAt: 1, _id: 1 }).lean();
        return Promise.all(reviews.map(async (r) => ({
            _id: String(r._id),
            title: r.person?.name || '',
            subtitle: r.person?.gender || '',
            // Some reviews were saved inside their own quote marks; the block adds its own.
            body: String(r.reviewText || '').trim().replace(/^["“]+|["”]+$/g, ''),
            media: await photoOf(r.photo, r.person?.name || ''),
        })));
    },
};
export const SOURCED_BLOCK_TYPES = Object.keys(BLOCK_SOURCES);

/**
 * Blocks with `data` added to every composable section, and the items of
 * team / reviews blocks read from their source. A section that fails
 * to resolve gets `data: null` and the page still renders (its component falls
 * back to fetching for itself). `includeDrafts` is for the admin preview.
 */
export async function resolveBlocks(blocks = [], { includeDrafts = false } = {}) {
    return Promise.all(blocks.map(async (b) => {
        if (BLOCK_SOURCES[b.type]) {
            try {
                return { ...b, items: await BLOCK_SOURCES[b.type]() };
            } catch (error) {
                console.error(`resolve ${b.type} block failed:`, error.message);
                return b;
            }
        }
        const resolve = b.type === 'section' ? RESOLVERS[b.settings?.component] : null;
        if (!resolve) return b;
        try {
            return { ...b, data: await resolve(b.settings || {}, { includeDrafts }) };
        } catch (error) {
            console.error(`resolve ${b.settings?.component} failed:`, error.message);
            return { ...b, data: null };
        }
    }));
}
