// Default block layouts for known pages. They are added once, when a page is
// first created in the CMS, and again only when the admin asks for "Restore
// defaults" (contentController.js) — never on every open, so a default block the
// admin deleted stays deleted.
const section = (key, component, extra = {}, settings = {}) => ({
    key,
    type: 'section',
    settings: { component, ...settings },
    visible: true,
    ...extra,
});

export const DEFAULT_LAYOUTS = {
    home: [
        section('home-hero', 'heroVideos'),
        section('home-films', 'ourFilms'),
        section('home-service', 'service'),
        section('home-varanasi', 'announcementVaranasi'),
        section('home-dharaa', 'announcementDharaa'),
        section('home-story', 'ourStory'),
        { key: 'home-team', type: 'team', title: 'Meet the Team', visible: true, items: [] },
        section('home-portfolio', 'portfolio'),
        section('home-why', 'whyChooseUs'),
        section('home-packages', 'packages'),
        section('home-approach', 'ourApproach'),
        { key: 'home-bts', type: 'mediaGallery', title: 'Behind the Scenes', visible: true, media: [] },
        { key: 'home-reviews', type: 'reviews', title: 'Love Notes from Our Couples', visible: true, items: [] },
        {
            key: 'home-stats',
            type: 'stats',
            title: 'Our Track Record',
            visible: true,
            items: [
                { title: '1000+', subtitle: 'Weddings Captured' },
                { title: '25+', subtitle: 'Awards Won' },
                { title: '1500+', subtitle: 'Happy Clients' },
                { title: '5+', subtitle: 'Years Experience' },
            ],
        },
    ],
    // The portfolio pages (plan phase 6): one composable section each, whose
    // settings choose the rows / filters (Utils/sectionSettings.js).
    films: [section('films-rows', 'filmRows', {}, { rows: [], dedupe: false })],
    allfilms: [section('allfilms-browse', 'browseFilms', {}, { facetGroups: [], sort: 'newestShoot', pageSize: 12 })],
    photos: [section('photos-gallery', 'photoGallery', {}, { facetGroups: [], sort: 'newestShoot', pageSize: 24 })],
};

// Non-destructively append any default blocks missing from the page (matched by
// `key`). Returns true if the page was modified.
export function ensureDefaultBlocks(page, pageKey) {
    const defaults = DEFAULT_LAYOUTS[pageKey];
    if (!defaults) return false;

    const existingKeys = new Set((page.blocks || []).map((b) => b.key).filter(Boolean));
    const missing = defaults.filter((b) => !existingKeys.has(b.key));
    if (missing.length === 0) return false;

    const startOrder = (page.blocks || []).length;
    missing.forEach((b, i) => page.blocks.push({ ...b, order: startOrder + i }));
    return true;
}
