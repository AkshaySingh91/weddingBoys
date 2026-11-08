import { serializeJsonLd } from '@/lib/jsonLd.mjs';
import Link from 'next/link';
import Image from 'next/image';
import { notFound, permanentRedirect } from 'next/navigation';
import { getPostBySlug, getRelatedPosts, getBlogComments, SITE_URL } from '@/lib/blogApi.js';
import TableOfContents from '../_components/TableOfContents.jsx';
import ShareLinks from '../_components/ShareLinks.jsx';
import BlogRenderer from '@/lib/blog/BlogRenderer.jsx';
import NextPrevStories from '../_components/NextPrevStories.jsx';
import ReadingProgressBar from '../_components/ReadingProgressBar.jsx';
import CommentsSection from '../_components/CommentsSection.jsx';

export const revalidate = 3600;

const coverOf = (post) =>
  typeof post?.coverImage === 'string'
    ? post.coverImage
    : post?.coverImage?.cdnUrl || post?.coverImage?.publicUrl || post?.coverImage?.url || null;

function extractVideoEmbeds(node, acc = []) {
  if (!node) return acc;
  if (node.type === 'embed' && ['youtube', 'vimeo', 'cloudflare'].includes(node.attrs?.provider)) {
    acc.push(node.attrs);
  }
  if (Array.isArray(node.content)) {
    for (const child of node.content) {
      extractVideoEmbeds(child, acc);
    }
  }
  return acc;
}

export async function generateMetadata({ params, searchParams }) {
  const { slug } = await params;
  const { previewToken } = (await searchParams) || {};
  const post = await getPostBySlug(slug, { previewToken });
  if (!post || post.redirect) return { title: 'The Wedding Vachan | Journal' };

  const title = post.metaTitle || post.title;
  const description = post.metaDescription || post.excerpt;
  const url = post.canonicalUrl || `${SITE_URL}/blogs/${post.slug}`;
  const cover = coverOf(post);

  const ogParams = new URLSearchParams({
    title,
    category: post.category || '',
    readingTime: post.readingTime ? String(post.readingTime) : '',
  });
  const dynamicOgUrl = `${SITE_URL}/api/og/blog?${ogParams.toString()}`;

  return {
    title: `${title} | The Wedding Vachan Journal`,
    description,
    alternates: { canonical: url },
    keywords: post.keywords?.length ? post.keywords : undefined,
    robots: previewToken ? { index: false, follow: false } : undefined,
    openGraph: {
      title,
      description,
      url,
      type: 'article',
      publishedTime: post.publishedAt || undefined,
      modifiedTime: post.updatedAt || undefined,
      authors: [post.author?.name || 'The Wedding Vachan'],
      images: [
        {
          url: dynamicOgUrl,
          width: 1200,
          height: 630,
          alt: title,
        },
        ...(cover ? [{ url: cover, alt: post.coverImage?.altText || post.title }] : []),
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [dynamicOgUrl],
    },
  };
}

export default async function BlogPostPage({ params, searchParams }) {
  const { slug } = await params;
  const { previewToken } = (await searchParams) || {};
  const post = await getPostBySlug(slug, { previewToken });

  // 301 Permanent Redirect on renamed slugs
  if (post?.redirect) {
    permanentRedirect(`/blogs/${post.redirect}`);
  }

  if (!post) notFound();

  const [related, commentsData] = await Promise.all([
    getRelatedPosts(slug),
    getBlogComments(slug),
  ]);

  const url = post.canonicalUrl || `${SITE_URL}/blogs/${post.slug}`;
  const publishedDate = post.publishedAt ? new Date(post.publishedAt) : new Date(post.createdAt);

  // ---- Structured data (JSON-LD) ----
  const articleLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.metaDescription || post.excerpt,
    image: coverOf(post) ? [coverOf(post)] : undefined,
    datePublished: post.publishedAt || post.createdAt,
    dateModified: post.updatedAt || post.publishedAt || post.createdAt,
    author: { '@type': 'Person', name: post.author?.name || 'The Wedding Vachan' },
    publisher: {
      '@type': 'Organization',
      name: 'The Wedding Vachan',
      logo: { '@type': 'ImageObject', url: `${SITE_URL}/companyLogo.png` },
    },
    mainEntityOfPage: { '@type': 'WebPage', '@id': url },
    keywords: (post.keywords || post.tags || []).join(', '),
    commentCount: commentsData?.total || 0,
  };

  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: 'Journal', item: `${SITE_URL}/blogs` },
      {
        '@type': 'ListItem',
        position: 3,
        name: post.category,
        item: `${SITE_URL}/blogs?category=${encodeURIComponent(post.category)}`,
      },
      { '@type': 'ListItem', position: 4, name: post.title, item: url },
    ],
  };

  const faqLd = post.faq?.length
    ? {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: post.faq.map((item) => ({
          '@type': 'Question',
          name: item.question,
          acceptedAnswer: {
            '@type': 'Answer',
            text: item.answer,
          },
        })),
      }
    : null;

  const previousStory = related[0] || null;
  const nextStory = related[1] || null;

  const isRealWedding = post.template === 'cinematic-real-wedding';

  // ── Cinematic Real Wedding Full-Bleed Experience (prompt-2.png) ──
  if (isRealWedding) {
    return (
      <div className="pb-12 sm:pb-16 font-sans">
        {/* Sticky Preview Mode Banner */}
        {post.isPreview && (
          <aside
            aria-label="Editorial Preview Banner"
            className="sticky top-18 z-40 flex items-center justify-between border-b border-amber-500 bg-amber-400/95 backdrop-blur-md px-4 py-2 text-xs font-bold uppercase tracking-wider text-black shadow-md"
          >
            <div className="flex items-center gap-2">
              <span className="flex h-2 w-2 rounded-full bg-stone-950 animate-ping" />
              <span>Editorial Preview Mode — Status: {post.status}</span>
            </div>
            <Link
              href={`/admin/blogs/edit/${post._id || post.id}`}
              className="rounded-lg bg-stone-950 px-3 py-1 text-[11px] font-semibold text-white hover:bg-stone-800 transition-colors"
            >
              Return to Editor
            </Link>
          </aside>
        )}

        {/* JSON-LD Schemas */}
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(articleLd) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(breadcrumbLd) }} />
        {faqLd && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(faqLd) }} />}

        {/* Template-Driven Article Canvas */}
        <BlogRenderer
          post={{ ...post, commentsData }}
          related={related}
          TocComponent={TableOfContents}
          ShareComponent={ShareLinks}
          shareUrl={url}
        />
      </div>
    );
  }

  return (
    <div className="py-8 sm:py-12">
      <ReadingProgressBar postSlug={slug} />

      {/* Sticky Preview Mode Banner */}
      {post.isPreview && (
        <aside
          aria-label="Editorial Preview Banner"
          className="sticky top-18 z-40 flex items-center justify-between border-b border-amber-500 bg-amber-400/95 backdrop-blur-md px-4 py-2 text-xs font-bold uppercase tracking-wider text-black shadow-md"
        >
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-stone-950 animate-ping" />
            <span>Editorial Preview Mode — Status: {post.status}</span>
          </div>
          <Link
            href={`/admin/blogs/edit/${post._id || post.id}`}
            className="rounded-lg bg-stone-950 px-3 py-1 text-[11px] font-semibold text-white hover:bg-stone-800 transition-colors"
          >
            Return to Editor
          </Link>
        </aside>
      )}

      {/* JSON-LD Schemas */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(articleLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(breadcrumbLd) }} />
      {faqLd && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(faqLd) }} />}

      {/*
        max-w-6xl, not 5xl. The article now shares its row with a 300px rail, and
        at 5xl that left the text 684px wide with the rail pressed against it.
      */}
      <div className="mx-auto px-4 sm:px-6 lg:px-8">
        {/* Editorial Breadcrumbs */}
        <nav aria-label="Breadcrumb" className="mb-8 flex items-center gap-2 text-xs font-medium text-stone-500">
          <Link href="/" className="hover:text-[#1C1917] transition-colors">
            Home
          </Link>
          <span>/</span>
          <Link href="/blogs" className="hover:text-[#1C1917] transition-colors">
            Journal
          </Link>
          <span>/</span>
          <Link
            href={`/blogs?category=${encodeURIComponent(post.category)}`}
            className="hover:underline"
          >
            {post.category}
          </Link>
          <span>/</span>
          {/* The trail ends where the reader is, not one level short of it. */}
          <span className="truncate font-semibold text-studio-cocoa" aria-current="page">
            {post.title}
          </span>
        </nav>

        {/* Template-Driven Article Canvas */}
        <div className="bg-transparent">
          <BlogRenderer
            post={{ ...post, commentsData }}
            related={related}
            TocComponent={TableOfContents}
            ShareComponent={ShareLinks}
            shareUrl={url}
          />
        </div>

        {/* Next / Previous Chronological Stories */}
        <div className="mt-12">
          <NextPrevStories previous={previousStory} next={nextStory} />
        </div>

        {/* Public Comments & Reader Reflections */}
        <div className="mt-16">
          <CommentsSection
            postSlug={slug}
            initialComments={commentsData.comments || []}
            initialTotal={commentsData.total || 0}
            commentsAllowed={post.allowComments !== false}
          />
        </div>

        {/*
          The bottom "Related Stories" grid is gone: the rail's Related Guides
          card is fed by the same `getRelatedPosts` call, so the page was showing
          the reader the same recommendations twice, a screen apart.
        */}
      </div>
    </div>
  );
}
