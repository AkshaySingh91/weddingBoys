'use client';

// Custom next/image loader.
//
// Next 16 serialises the loader into client components, so this file must be a
// Client Component ('use client' above) or the build fails.
//
// Two modes, chosen by env:
//
//  1. DEFAULT — variant snapping. Media ingested into R2 already carries a fixed
//     ladder of pre-rendered widths (see VARIANT_WIDTHS in
//     Backend/Services/r2UploadService.js). Rather than resizing on the fly, we
//     rewrite the master URL to the nearest rung at or above the requested
//     width. Those are real immutable objects on the CDN, so they cache at the
//     edge essentially forever and cost nothing to serve.
//
//  2. NEXT_PUBLIC_CF_IMAGE_RESIZING=1 — Cloudflare Image Resizing. Requires the
//     zone to have it enabled (it is NOT on the current plan; /cdn-cgi/image/
//     404s today). Kept wired so switching is one environment variable.
//
// LADDER must stay in sync with VARIANT_WIDTHS on the backend. A width listed
// here that the backend does not emit is a 404 for every visitor.
const CDN = (process.env.NEXT_PUBLIC_CDN_URL || '').replace(/\/$/, '');
const USE_CF_RESIZE = process.env.NEXT_PUBLIC_CF_IMAGE_RESIZING === '1';

const LADDER = [640, 1024, 1600, 2400];

export default function mediaLoader({ src, width, quality }) {
    // Local imports, blur placeholders, blob previews and explicitly un-snapped orig passes through untouched.
    if (!CDN || src.startsWith('data:') || src.startsWith('blob:') || src.startsWith('/') || src.includes('orig=1') || src.includes('no-snap=1')) {
        return src;
    }

    if (USE_CF_RESIZE) {
        if (src.includes('/cdn-cgi/image/')) return src;
        const params = [
            `width=${width}`,
            `quality=${quality || 75}`,
            'format=auto',    // AVIF -> WebP -> JPEG by Accept header
            'fit=scale-down', // never upscale past the source
        ].join(',');
        const source = src.startsWith('http') ? src : `${CDN}/${src.replace(/^\//, '')}`;
        return `${CDN}/cdn-cgi/image/${params}/${source}`;
    }

    // Snap to the smallest rung that covers the requested width.
    //   .../<mediaId>/orig.jpg  ->  .../<mediaId>/1024.webp
    const snapped = LADDER.find((w) => w >= width) ?? LADDER[LADDER.length - 1];
    const rewritten = src.replace(/\/orig\.[a-z0-9]+$/i, `/${snapped}.webp`);

    // Not one of our ingested assets (no /orig.<ext> tail) — serve it as-is
    // rather than inventing a variant URL that was never written.
    return rewritten;
}
