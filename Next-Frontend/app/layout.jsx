import './globals.css';
import { fontVariables } from './fonts';
import StudioDetailsContext from '@/Context/StudioDetailsContext.jsx';
import { SITE_URL as siteUrl, SITE_NAME } from '@/lib/siteConfig.js';
const title =
  'Capturing Your Love Story: Cinematic Wedding Videography in India | The Wedding Boys';
const description =
  "Experience India's finest wedding cinematography. The Wedding Boys captures your special day with cinematic films, pre-wedding shoots, and premium videography services.";

export const metadata = {
  metadataBase: new URL(siteUrl),
  title,
  description,
  keywords: [
    'wedding cinematography India',
    'cinematic wedding films',
    'pre-wedding shoots',
    'Indian wedding videographers',
  ],
  alternates: {
    canonical: '/',
  },
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title,
    description,
    url: '/',
    siteName: SITE_NAME,
    type: 'website',
    images: [{ url: '/og-image.jpg' }],
  },
  twitter: {
    card: 'summary_large_image',
    title,
    description,
    images: ['/twitter-image.jpg'],
  },
  icons: {
    icon: [{ url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' }],
  },
  manifest: '/site.webmanifest',
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#ffffff',
};

// Site-wide structured data.
//
// NOTE: a `VideoObject` used to live here describing a "Cinematic Wedding
// Highlight Film" whose thumbnailUrl (/video-thumb.jpg), contentUrl
// (/videos/highlight.mp4) and embedUrl (/embed/highlight) did not exist, with a
// placeholder uploadDate — emitted on every page, including pages with no video
// at all. Structured data that does not describe real, present content violates
// Google's structured-data policies and risks a manual action, so it was
// removed. A VideoObject belongs on individual film pages, built from that
// film's real asset. Everything below describes content that genuinely exists.
const organizationJsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      '@id': `${siteUrl}/#organization`,
      name: SITE_NAME,
      url: siteUrl,
      logo: `${siteUrl}/companyLogo.png`,
      contactPoint: [
        {
          '@type': 'ContactPoint',
          telephone: '+91-7666016904',
          contactType: 'Customer Service',
        },
      ],
    },
    {
      '@type': 'WebSite',
      '@id': `${siteUrl}/#website`,
      url: siteUrl,
      name: SITE_NAME,
      publisher: { '@id': `${siteUrl}/#organization` },
    },
  ],
};

const videoProductionServiceJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'VideoProductionService',
  name: SITE_NAME,
  url: siteUrl,
  serviceType: 'Wedding videography',
  provider: { '@id': `${siteUrl}/#organization` },
  areaServed: 'IN',
  offers: {
    '@type': 'Offer',
    category: 'Cinematic wedding films',
    description: 'Professional wedding cinematography package',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" dir="ltr" className={fontVariables} suppressHydrationWarning>
      <body className="antialiased" suppressHydrationWarning>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(videoProductionServiceJsonLd) }}
        />
        {/* StudioDetailsContext wraps everything (site + admin) — the
            original App.jsx wrapped both route trees in this provider. */}
        <StudioDetailsContext>{children}</StudioDetailsContext>
      </body>
    </html>
  );
}
