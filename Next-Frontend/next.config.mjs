import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// When a Cloudflare CDN is configured, route every next/image through the
// custom loader (Cloudflare Image Resizing). Otherwise keep the built-in
// optimizer + S3 remotePatterns — so nothing regresses before R2/CDN is live.
const useCloudflare = !!process.env.NEXT_PUBLIC_CDN_URL;

const images = useCloudflare
  ? {
      loader: 'custom',
      loaderFile: './cloudflareLoader.js',
    }
  : {
      remotePatterns: [
        // Virtual-hosted-style S3 URLs, e.g. bucket.s3.amazonaws.com
        { protocol: 'https', hostname: '*.s3.amazonaws.com', pathname: '/**' },
        // Region-specific, e.g. bucket.s3.ap-south-1.amazonaws.com
        { protocol: 'https', hostname: '*.s3.*.amazonaws.com', pathname: '/**' },
      ],
    };

// Next 16 requires every `quality` value used anywhere to be declared here —
// `images.qualities` now defaults to [75] and any other value is rejected.
// These mirror TIER_PROFILE.imageQuality in Hooks/useNetworkStatus.jsx (55/68/82)
// plus Next's own default, so tier-aware image quality works once media is on
// immutable CDN URLs.
images.qualities = [55, 68, 75, 82];

/** @type {import('next').NextConfig} */
const nextConfig = {
  devIndicators: false,
  turbopack: {
    root: __dirname,
  },
  images,
  // Client work moved out of `website-setting/` — it is the studio's product,
  // not a website setting. Portfolio Curation was retired; a client's own page
  // does that job now. Permanent so bookmarks and history follow.
  async redirects() {
    return [
      { source: '/admin/website-setting/clients', destination: '/admin/clients', permanent: true },
      { source: '/admin/website-setting/clients/:id', destination: '/admin/clients/:id', permanent: true },
      { source: '/admin/website-setting/add-client', destination: '/admin/clients/new', permanent: true },
      { source: '/admin/portfolio', destination: '/admin/clients', permanent: true },
    ];
  },
};

export default nextConfig;
