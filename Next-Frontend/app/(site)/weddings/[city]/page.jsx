import { serializeJsonLd } from '@/lib/jsonLd.mjs';
import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import {
    getLocationBySlug,
    getAllDestinationSlugs,
} from '@/lib/weddingLocations.js';
import { getPublishedPosts, SITE_URL } from '@/lib/blogApi.js';
import {
    MapPin,
    Sparkle,
    CalendarBlank,
    Camera,
    VideoCamera,
    ArrowRight,
    Building,
    CheckCircle,
    Question,
} from '@phosphor-icons/react/dist/ssr';
import { contactHref } from '@/lib/contact.js';

export const revalidate = 3600;

export async function generateStaticParams() {
    return getAllDestinationSlugs();
}

export async function generateMetadata({ params }) {
    const { city } = await params;
    const loc = getLocationBySlug(city);
    if (!loc) return { title: 'Destination Weddings | The Wedding Vachan' };

    const title = `${loc.title} | The Wedding Vachan`;
    const description = loc.metaDescription;
    const url = `${SITE_URL}/weddings/${loc.slug}`;

    const ogParams = new URLSearchParams({
        title: loc.title,
        category: 'Destination Weddings',
        city: loc.name,
        venue: loc.state,
    });
    const ogImage = `${SITE_URL}/api/og/blog?${ogParams.toString()}`;

    return {
        title,
        description,
        alternates: { canonical: url },
        openGraph: {
            title,
            description,
            url,
            type: 'website',
            images: [
                {
                    url: ogImage,
                    width: 1200,
                    height: 630,
                    alt: title,
                },
            ],
        },
        twitter: {
            card: 'summary_large_image',
            title,
            description,
            images: [ogImage],
        },
    };
}

export default async function DestinationCityPage({ params }) {
    const { city } = await params;
    const loc = getLocationBySlug(city);
    if (!loc) notFound();

    // Fetch matching blog stories and guides for this destination
    const storiesData = await getPublishedPosts({ search: loc.name, limit: 6 });
    const stories = storiesData?.posts || [];

    const url = `${SITE_URL}/weddings/${loc.slug}`;

    // ---- Structured Data (JSON-LD) ----
    const destinationLd = {
        '@context': 'https://schema.org',
        '@type': 'TouristDestination',
        name: `${loc.name} Destination Weddings`,
        description: loc.metaDescription,
        url,
        geo: {
            '@type': 'GeoCoordinates',
            latitude: loc.coordinates?.latitude || '20.5937',
            longitude: loc.coordinates?.longitude || '78.9629',
        },
        containedInPlace: {
            '@type': 'AdministrativeArea',
            name: `${loc.state}, India`,
        },
    };

    const businessLd = {
        '@context': 'https://schema.org',
        '@type': 'ProfessionalService',
        name: `The Wedding Vachan - ${loc.name} Wedding Cinematography`,
        image: `${SITE_URL}/companyLogo.png`,
        url,
        telephone: '+91-9876543210',
        priceRange: '₹₹₹₹',
        address: {
            '@type': 'PostalAddress',
            addressLocality: loc.name,
            addressRegion: loc.state,
            addressCountry: 'IN',
        },
        areaServed: [loc.name, loc.state, 'India'],
        description: loc.metaDescription,
    };

    const breadcrumbLd = {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
            { '@type': 'ListItem', position: 2, name: 'Destinations', item: `${SITE_URL}/weddings/udaipur` },
            { '@type': 'ListItem', position: 3, name: loc.name, item: url },
        ],
    };

    const faqLd = loc.faqs?.length
        ? {
              '@context': 'https://schema.org',
              '@type': 'FAQPage',
              mainEntity: loc.faqs.map((f) => ({
                  '@type': 'Question',
                  name: f.question,
                  acceptedAnswer: {
                      '@type': 'Answer',
                      text: f.answer,
                  },
              })),
          }
        : null;

    return (
        <main className="min-h-screen bg-studio-canvas text-studio-ink">
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(destinationLd) }} />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(businessLd) }} />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(breadcrumbLd) }} />
            {faqLd && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(faqLd) }} />}

            {/* 1. Destination Editorial Hero */}
            <header className="relative border-b border-studio-border bg-stone-900 px-4 py-20 text-white sm:px-6 lg:px-8 overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(194,149,85,0.22),transparent_60%)]" />
                <div className="absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-accent/20 blur-3xl" />

                <div className="relative mx-auto max-w-5xl">
                    {/* Breadcrumbs */}
                    <nav aria-label="Breadcrumb" className="mb-6 text-xs text-stone-400">
                        <Link href="/" className="hover:text-white transition-colors">Home</Link>
                        <span className="mx-2">/</span>
                        <span className="text-stone-300">Destination Hubs</span>
                        <span className="mx-2">/</span>
                        <span className="text-gold font-semibold">{loc.name}</span>
                    </nav>

                    <div className="inline-flex items-center gap-2 rounded-full border border-gold/40 bg-gold/10 px-3.5 py-1 text-xs font-semibold uppercase tracking-widest text-[#E5DCD3]">
                        <MapPin size={13} className="text-gold" />
                        <span>{loc.name}, {loc.state}</span>
                    </div>

                    <h1 className="mt-5 font-display text-4xl font-bold tracking-tight text-[#FDFBF7] sm:text-5xl lg:text-6xl leading-[1.12]">
                        {loc.title}
                    </h1>

                    <p className="mt-4 text-base font-display italic text-stone-300 sm:text-lg max-w-3xl">
                        &ldquo;{loc.heroSubtitle}&rdquo;
                    </p>

                    {/* Highlights Strip */}
                    <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3 border-t border-white/10 pt-6 text-xs">
                        <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-gold">
                                <CalendarBlank size={18} />
                            </div>
                            <div>
                                <span className="block font-medium text-stone-400">Best Season</span>
                                <span className="font-semibold text-white">{loc.bestSeason}</span>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-gold">
                                <Camera size={18} />
                            </div>
                            <div>
                                <span className="block font-medium text-stone-400">Filming Style</span>
                                <span className="font-semibold text-white">Fine Art Cinema &amp; 35mm Tone</span>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-gold">
                                <VideoCamera size={18} />
                            </div>
                            <div>
                                <span className="block font-medium text-stone-400">Coverage Team</span>
                                <span className="font-semibold text-white">Our own crew, travelling with you</span>
                            </div>
                        </div>
                    </div>

                    <div className="mt-8 flex flex-wrap items-center gap-4">
                        <Link
                            href={contactHref({ from: 'city', city: loc.name })}
                            className="inline-flex items-center gap-2 rounded-xl bg-accent px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-white shadow-md hover:bg-[#724222] transition-colors"
                        >
                            <Sparkle size={14} weight="bold" />
                            Inquire for {loc.name} Dates
                        </Link>
                        <Link
                            href="/films"
                            className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/5 px-5 py-2.5 text-xs font-semibold text-white hover:bg-white/10 transition-colors"
                        >
                            View Destination Films
                            <ArrowRight size={13} />
                        </Link>
                    </div>
                </div>
            </header>

            <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8 space-y-16">
                {/* 2. Destination Cinematography Guide */}
                <section>
                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-accent-ink">
                        <Sparkle size={14} weight="bold" />
                        <span>Visual Landscape</span>
                    </div>
                    <h2 className="mt-1 font-display text-2xl font-bold text-studio-ink sm:text-3xl">
                        Filming in {loc.name}: The Studio Perspective
                    </h2>
                    <p className="mt-3 text-sm leading-relaxed text-studio-inkSecondary max-w-3xl">
                        Every wedding in {loc.name} unfolds against a unique cultural canvas. Our approach blends candid intimacy with sweeping architectural perspectives, capturing how ambient desert dusk, river mist, or coastal sunsets illuminate your celebrations.
                    </p>

                    <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
                        {loc.filmingHighlights?.map((highlight, idx) => (
                            <div
                                key={idx}
                                className="rounded-2xl border border-studio-border bg-white p-5 shadow-sm flex items-start gap-3"
                            >
                                <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-studio-terracottaLight text-studio-terracotta">
                                    <CheckCircle size={15} weight="bold" />
                                </div>
                                <p className="text-xs font-medium text-studio-ink leading-relaxed">
                                    {highlight}
                                </p>
                            </div>
                        ))}
                    </div>
                </section>

                {/* 3. Iconic Venues & Palaces in this City */}
                {loc.venues?.length > 0 && (
                    <section>
                        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-accent-ink">
                            <Building size={14} weight="bold" />
                            <span>Signature Locations</span>
                        </div>
                        <h2 className="mt-1 font-display text-2xl font-bold text-studio-ink sm:text-3xl">
                            Iconic Wedding Palaces &amp; Venues in {loc.name}
                        </h2>
                        <p className="mt-2 text-sm text-studio-inkSecondary">
                            Venues we know intimately for camera angles, acoustic acoustics, and sunset lighting.
                        </p>

                        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
                            {loc.venues.map((venue, idx) => (
                                <div
                                    key={idx}
                                    className="rounded-2xl border border-studio-border bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
                                >
                                    <div className="flex items-center justify-between">
                                        <h3 className="font-display text-base font-bold text-studio-ink">
                                            {venue.name}
                                        </h3>
                                        <span className="rounded-full bg-studio-canvas px-2.5 py-0.5 text-[10px] font-semibold text-studio-inkMuted uppercase tracking-wider">
                                            {venue.type}
                                        </span>
                                    </div>
                                    <p className="mt-2 text-xs leading-relaxed text-studio-inkSecondary">
                                        {venue.desc}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* 4. Real Wedding Stories & Guides in this Destination */}
                {stories.length > 0 && (
                    <section>
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-accent-ink">
                                    <VideoCamera size={14} weight="bold" />
                                    <span>Real Celebrations</span>
                                </div>
                                <h2 className="mt-1 font-display text-2xl font-bold text-studio-ink sm:text-3xl">
                                    Wedding Stories from {loc.name}
                                </h2>
                            </div>
                            <Link
                                href={`/blogs?search=${encodeURIComponent(loc.name)}`}
                                className="hidden sm:inline-flex items-center gap-1.5 text-xs font-bold text-studio-terracotta hover:underline"
                            >
                                Browse All {loc.name} Stories
                                <ArrowRight size={13} />
                            </Link>
                        </div>

                        <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                            {stories.map((post) => {
                                const cover = post.coverImage?.cdnUrl || post.coverImage?.publicUrl || null;
                                return (
                                    <article
                                        key={post._id}
                                        className="group flex flex-col overflow-hidden rounded-2xl border border-studio-border bg-white shadow-sm transition-shadow hover:shadow-md"
                                    >
                                        <Link href={`/blogs/${post.slug}`} className="relative aspect-video w-full overflow-hidden bg-stone-100">
                                            {cover ? (
                                                <Image
                                                    src={cover}
                                                    alt={post.title}
                                                    fill
                                                    sizes="(max-width: 768px) 100vw, 33vw"
                                                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                                                />
                                            ) : (
                                                <div className="flex h-full w-full items-center justify-center text-xs text-stone-400">
                                                    The Wedding Vachan
                                                </div>
                                            )}
                                        </Link>
                                        <div className="flex flex-1 flex-col p-5">
                                            <div className="mb-2 flex items-center gap-2 text-[11px] font-semibold text-studio-terracotta uppercase tracking-wider">
                                                <span>{post.category}</span>
                                                {post.readingTime && (
                                                    <>
                                                        <span>•</span>
                                                        <span className="text-studio-inkMuted">{post.readingTime} min read</span>
                                                    </>
                                                )}
                                            </div>
                                            <h3 className="font-display text-base font-bold text-studio-ink line-clamp-2 group-hover:text-studio-terracotta transition-colors">
                                                <Link href={`/blogs/${post.slug}`}>{post.title}</Link>
                                            </h3>
                                            <p className="mt-2 text-xs text-studio-inkSecondary line-clamp-2 leading-relaxed flex-1">
                                                {post.excerpt}
                                            </p>
                                            <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between text-xs font-semibold text-studio-terracotta">
                                                <span>Read Story</span>
                                                <ArrowRight size={13} className="transition-transform group-hover:translate-x-1" />
                                            </div>
                                        </div>
                                    </article>
                                );
                            })}
                        </div>
                    </section>
                )}

                {/* 5. Destination Wedding FAQs */}
                {loc.faqs?.length > 0 && (
                    <section className="rounded-3xl border border-studio-border bg-white p-8 shadow-sm">
                        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-accent-ink">
                            <Question size={15} weight="bold" />
                            <span>Planning Advisory</span>
                        </div>
                        <h2 className="mt-1 font-display text-2xl font-bold text-studio-ink">
                            Frequently Asked Questions: Destination Weddings in {loc.name}
                        </h2>

                        <div className="mt-6 divide-y divide-stone-100">
                            {loc.faqs.map((f, idx) => (
                                <div key={idx} className="py-4 first:pt-0 last:pb-0">
                                    <h3 className="text-sm font-bold text-studio-ink">
                                        {f.question}
                                    </h3>
                                    <p className="mt-1.5 text-xs leading-relaxed text-studio-inkSecondary">
                                        {f.answer}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* 6. Studio Luxury CTA Banner */}
                <section className="rounded-3xl border border-gold/30 bg-gradient-to-br from-stone-900 via-stone-800 to-stone-900 p-8 text-center text-white shadow-xl sm:p-12 relative overflow-hidden">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(194,149,85,0.18),transparent_70%)]" />
                    <div className="relative mx-auto max-w-2xl">
                        <span className="text-[11px] font-bold uppercase tracking-widest text-gold">
                            Wedding films and photographs
                        </span>
                        <h2 className="mt-2 font-display text-3xl font-bold text-[#FDFBF7] sm:text-4xl">
                            Planning a Destination Wedding in {loc.name}?
                        </h2>
                        <p className="mt-3 text-xs leading-relaxed text-stone-300 sm:text-sm">
                            We take on a limited number of destination weddings each season to guarantee uncompromising artisanal quality and fine-art color grading for every couple.
                        </p>
                        <div className="mt-6 flex flex-wrap justify-center gap-3">
                            <Link
                                href={contactHref({ from: 'city', city: loc.name })}
                                className="rounded-xl bg-accent px-6 py-3 text-xs font-bold uppercase tracking-wider text-white shadow-md hover:bg-[#724222] transition-colors"
                            >
                                Check Crew Availability
                            </Link>
                            <Link
                                href="/blogs"
                                className="rounded-xl border border-white/20 bg-white/10 px-6 py-3 text-xs font-semibold text-white hover:bg-white/20 transition-colors"
                            >
                                Explore Journal
                            </Link>
                        </div>
                    </div>
                </section>
            </div>
        </main>
    );
}
