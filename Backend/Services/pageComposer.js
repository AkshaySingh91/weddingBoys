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
};

/**
 * Blocks with `data` added to every composable section. A section that fails
 * to resolve gets `data: null` and the page still renders (its component falls
 * back to fetching for itself). `includeDrafts` is for the admin preview.
 */
export async function resolveBlocks(blocks = [], { includeDrafts = false } = {}) {
    return Promise.all(blocks.map(async (b) => {
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
