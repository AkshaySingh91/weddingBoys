/**
 * The site's information architecture — one definition, two surfaces.
 *
 * The audit found the header and footer listing different destinations (R-39),
 * and three of the four primary nav items pointing at `#fragment` targets that
 * exist only on the home page, so they did nothing on 13 of 14 pages (R-07).
 * Both surfaces now derive from this file, so they cannot drift again.
 *
 * Every entry is a real route. `Pricing`, `Process` and `Services` are gone from
 * the global nav: they are home-page sections, reachable on the home page and
 * from the footer, not peers of the portfolio.
 */

/** Primary navigation. Panels open on hover/focus at desktop, accordion on mobile. */
export const PRIMARY_NAV = [
    { label: 'Films', href: '/films' },
    { label: 'Photographs', href: '/photos' },
    {
        label: 'Destinations',
        href: '/varanasi',
        panel: [
            { label: 'Varanasi', href: '/varanasi', note: 'The sacred city' },
            { label: 'Udaipur', href: '/weddings/udaipur', note: 'Lake palaces' },
            { label: 'Jaipur', href: '/weddings/jaipur', note: 'Royal Rajasthan' },
            { label: 'Goa', href: '/weddings/goa', note: 'Coastal' },
        ],
    },
    {
        label: 'Studio',
        href: '/about-us',
        panel: [
            { label: 'About us', href: '/about-us', note: 'How we work' },
            { label: 'The team', href: '/team', note: 'Who shoots your day' },
        ],
    },
    // Out of scope for this redesign — linked, never restyled.
    { label: 'Journal', href: '/blogs' },
];

/** The one call to action. */
export const PRIMARY_CTA = { label: 'Enquire', href: '/contact' };

/**
 * Footer columns. Mirrors the primary nav and adds what belongs only here —
 * Dharaa Events is a sub-brand, not a peer of Films.
 */
export const FOOTER_NAV = [
    {
        title: 'Work',
        links: [
            { label: 'Films', href: '/films' },
            { label: 'All films', href: '/allfilms' },
            { label: 'Photographs', href: '/photos' },
        ],
    },
    {
        title: 'Destinations',
        links: [
            { label: 'Varanasi', href: '/varanasi' },
            { label: 'Udaipur', href: '/weddings/udaipur' },
            { label: 'Jaipur', href: '/weddings/jaipur' },
            { label: 'Goa', href: '/weddings/goa' },
        ],
    },
    {
        title: 'Studio',
        links: [
            { label: 'About us', href: '/about-us' },
            { label: 'The team', href: '/team' },
            { label: 'Journal', href: '/blogs' },
            { label: 'Dharaa Events', href: '/dharaa-event-management' },
        ],
    },
];

/**
 * Brand descriptor — one line, used everywhere.
 *
 * The audit found the masthead claiming "Mumbai's premier wedding filmmakers"
 * and the footer claiming "India's premier … worldwide destinations" on the same
 * page (R-08). This is the reconciled line: the practice is Indian and travels.
 *
 * NOT reconciled here, because it is a commercial decision and not a copy fix:
 * `app/(site)/_home/OfferPackages.jsx:119` still promises "all locations in
 * Mumbai at no extra cost. Additional charges apply for destination weddings."
 * Raised to the client in REDESIGN-PROGRESS.md.
 */
export const BRAND_TAGLINE = 'Wedding cinematography across India';
export const BRAND_DESCRIPTION =
    'A cinematography studio filming Indian weddings — palace, coast and sacred city — for couples who want the day back as a film, not a recap.';
