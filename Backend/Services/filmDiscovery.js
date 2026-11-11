import PortfolioItem from '../Models/PortfolioItem.js';
import { PUBLIC_GATE } from './portfolioVisibility.js';
import { loadTaxonomy } from './taxonomy.js';
import { toLegacyVideoRow } from './portfolioService.js';

const score = (item) => Number(item.spotlight) || Number(item.generalPriority) || 0;
export const compareFilmPriority = (a, b) => score(b) - score(a)
    || Number(Boolean(b.isHero)) - Number(Boolean(a.isHero))
    || String(a._id).localeCompare(String(b._id));

/** Complete categories, with no cross-category dedupe or arbitrary row limit. */
export function buildFilmDiscovery(items, taxonomy) {
    const sorted = [...new Map(items.map(i => [String(i._id), i])).values()].sort(compareFilmPriority);
    const films = new Map(sorted.map(i => [String(i._id), {
        ...toLegacyVideoRow(i),
        event: i.eventGroup || '',
        title: i.title || '',
        priority: score(i),
        labels: taxonomy.tags.filter(t => !t.hidden && taxonomy.groups.some(g => !g.hidden && String(g._id) === String(t.group)) && (i.tagIds || []).some(id => String(id) === String(t._id)))
            .map(t => t.label),
    }]));
    const has = (item, tag) => (item.tagIds || []).some(id => String(id) === String(tag._id));
    const tagged = (keys, labels) => taxonomy.tags.filter(t => !t.hidden
        && taxonomy.groups.some(g => !g.hidden && keys.includes(g.key) && String(g._id) === String(t.group))
        && (!labels || labels.includes(t.label)));
    const rows = [];
    const add = (key, title, group, predicate, description = '') => {
        const matches = sorted.filter(predicate).map(i => films.get(String(i._id)));
        if (matches.length) rows.push({ key, title, group, description, items: matches });
    };
    add('best-films', 'Our strongest stories', 'featured', () => true, 'A selection led by our highest-rated visuals and storytelling.');
    const scenery = tagged(['region', 'pre-wedding-themes', 'event-type'], ['Destination Weddings', 'Mountains', 'Beach', 'Palace Wedding', 'Resort Wedding']);
    add('destination-inspiration', 'Destination inspiration', 'destinations', i => scenery.some(t => has(i, t)) || /jaipur|manali|goa/i.test([i.location?.city, i.location?.state].join(' ')), 'Coastlines, mountain escapes and heritage backdrops for your own celebration.');
    const definitions = [
        ['events', ['ceremony', 'category'], ['Pre-Wedding', 'Wedding / Pheras', 'Wedding', 'Haldi', 'Mehendi', 'Sangeet', 'Engagement', 'Reception', 'Cocktail', 'Tilak', 'Candid & Portraits']],
        ['themes', ['pre-wedding-themes', 'wedding-themes', 'event-type', 'category'], ['Beach', 'Mountains', 'Garden', 'Urban', 'Royal', 'Palace Wedding', 'Rustic', 'Modern', 'Classic', 'Floral', 'Grand', 'Minimalist', 'Fairytale', 'Cultural', 'Cinematic', 'Traditional', 'Aerial', 'Outdoor', 'Indoor', 'Day Wedding', 'Night Wedding', 'Temple Wedding', 'Resort Wedding']],
        ['formats', ['film-type'], ['Teaser / Trailer', 'Highlights', 'Full Wedding Film', 'Reel']],
        ['traditions', ['tradition'], null],
        ['regions', ['region'], null],
    ];
    for (const [group, keys, order] of definitions) {
        const tags = tagged(keys, order);
        const labels = [...new Set(tags.map(t => t.label === 'Wedding / Pheras' ? 'Wedding' : t.label))];
        labels.sort((a, b) => order ? order.indexOf(a) - order.indexOf(b) : a.localeCompare(b));
        for (const label of labels) {
            const matching = tags.filter(t => (t.label === 'Wedding / Pheras' ? 'Wedding' : t.label) === label);
            add(`${group}-${label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`, label, group, i => matching.some(t => has(i, t)));
        }
    }
    for (const label of ['Beach', 'Mountains']) {
        const tags = tagged(['pre-wedding-themes', 'region'], [label]);
        add(`destination-${label.toLowerCase()}`, label === 'Beach' ? 'Beach & coast' : 'Mountains', 'destinations', i => tags.some(t => has(i, t)));
    }
    // The first occurrence follows film priority, so the strongest locations lead.
    const places = [...new Set(sorted.flatMap(i => [i.location?.city || i.location?.state]).filter(Boolean))];
    for (const place of places) add(`place-${place.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`, place, 'destinations', i => (i.location?.city || i.location?.state) === place);
    const labels = { featured: 'Best films', destinations: 'Destinations', events: 'Events', themes: 'Themes & settings', formats: 'Film type', traditions: 'Traditions', regions: 'Regions' };
    const groups = Object.entries(labels).map(([key, label]) => ({ key, label, rows: rows.filter(r => r.group === key) })).filter(g => g.rows.length);
    return { total: sorted.length, films: [...films.values()], groups, rows };
}

export async function getFilmDiscovery() {
    const [items, taxonomy] = await Promise.all([
        PortfolioItem.find({ kind: 'Video', ...PUBLIC_GATE }).populate('client', 'clientName location celebrationDates weddingDate').lean(),
        loadTaxonomy(),
    ]);
    return buildFilmDiscovery(items, taxonomy);
}
