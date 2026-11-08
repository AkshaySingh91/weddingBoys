// Single source of truth for the site's absolute origin.
//
// This MUST match the host the site is actually served from and the host the
// web server 301-redirects everything else to. Declaring one canonical host in
// `<link rel="canonical">` while linking another in OpenGraph/JSON-LD splits
// Google's ranking signals across two origins, which is what happened before
// this constant existed (the root layout said the bare domain, the blog said
// the www one).
//
// Override with NEXT_PUBLIC_SITE_URL if the canonical host ever changes; the
// default is the bare domain, matching proxy.js, the CORS allowlist and the
// original production build config.
export const SITE_URL = (
    process.env.NEXT_PUBLIC_SITE_URL || 'https://theweddingvachan.com'
).replace(/\/$/, '');

/** Absolute URL for a site-relative path, for canonicals / OG / JSON-LD. */
export const absoluteUrl = (path = '/') =>
    `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`;

export const SITE_NAME = 'The Wedding Vachan';

/**
 * The studio's social accounts. Instagram is split by city: Mumbai is the main
 * studio account, Varanasi has its own. The YouTube channel has not been
 * renamed yet.
 */
export const SOCIAL_LINKS = {
    instagramMumbai: 'https://www.instagram.com/theweddingvachannn/',
    instagramVaranasi: 'https://www.instagram.com/theweddingvachan_varanasi/',
    facebook: 'https://www.facebook.com/people/The-Wedding-Vachan-Pan-India/61593606026297/',
    youtube: 'https://www.youtube.com/@The_wedding_boys_',
};

// CMS pageKeys that exist only to supply content blocks to a hand-built route —
// `home` feeds `/`, `about` feeds `/about-us`, and films/photos/contact feed
// their own routes. They are NOT standalone URLs.
//
// Without this guard the `/[slug]` catch-all happily serves /home and /about as
// second, near-duplicate copies of / and /about-us. Duplicate URLs split ranking
// signals and are exactly what a canonical strategy is meant to prevent, so the
// catch-all 404s on these keys and the sitemap omits them.
export const RESERVED_CMS_PAGE_KEYS = new Set([
    'home',
    'about',
    'films',
    'allfilms',
    'photos',
    'contact',
]);
