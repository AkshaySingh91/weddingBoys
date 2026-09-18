import { SITE_URL } from '@/lib/siteConfig.js';

// Served at /robots.txt.
export default function robots() {
    return {
        rules: [
            {
                userAgent: '*',
                allow: '/',
                disallow: [
                    '/admin',        // the admin panel — never index
                    '/search-result', // thin, parameterised results pages
                ],
            },
        ],
        sitemap: `${SITE_URL}/sitemap.xml`,
        host: SITE_URL,
    };
}
