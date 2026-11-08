'use client';

/**
 * CinematicRealWedding template — the flagship format for real wedding features.
 * Pixel-perfect implementation matching prompt-2.png:
 * 1. Full-bleed panoramic hero visual with dark vignette, breadcrumb overlay, and floating 4-card stats strip
 * 2. 4K Wedding Trailer cinema player block with play overlay and lightbox
 * 3. Story Chapter 01 (The Serenade of Lake Pichola) with drop-cap & dual vertical portraits
 * 4. Story Chapter 02 (The Varmala at Twilight) with wide cinematic ceremony photo
 * 5. Peach couple testimonial card with quotation icon and botanical watermark
 * 6. The Curated Wedding Directory (6-card interactive vendor grid)
 * 7. Article engagement bar (148 Loves + social share + author follow)
 * 8. Native threaded comments section with sorting and reflection form
 */

import RealWeddingHero from '@/app/(journal)/blogs/_components/RealWeddingHero';
import VideoTrailerPlayer from '@/app/(journal)/blogs/_components/VideoTrailerPlayer';
import CoupleTestimonialCard from '@/app/(journal)/blogs/_components/CoupleTestimonialCard';
import WeddingDirectoryGrid from '@/app/(journal)/blogs/_components/WeddingDirectoryGrid';
import ArticleEngagementBar from '@/app/(journal)/blogs/_components/ArticleEngagementBar';
import CommentsSection from '@/app/(journal)/blogs/_components/CommentsSection';
import { renderDocument } from '../renderAst';
import ArticleRail from '@/app/(journal)/blogs/_components/ArticleRail.jsx';

export default function CinematicRealWedding({
  post,
  contentJson,
  toc,
  related,
}) {
  return (
    <article className="w-full font-sans">
      {/* 1. Full-Bleed Panoramic Hero Visual & Floating 4-Card Stats Strip (prompt-2.png) */}
      <RealWeddingHero post={post} />

      {/* Main Reading & Media Canvas */}
      <div className="mx-auto max-w-[1140px] px-4 sm:px-6 space-y-4">
        {/* 2. Official 4K Wedding Trailer Film Player (prompt-2.png) — Collapses if no video */}
        <VideoTrailerPlayer
          video={post?.featuredVideo}
          thumbnail={post?.featuredVideo?.thumbnail}
        />

        {/* 3. Dynamic Story Chapters from Editor AST (prompt-2.png) */}
        <div className="blog-content [&_.chapter-heading+p]:first-letter:float-left [&_.chapter-heading+p]:first-letter:text-5xl [&_.chapter-heading+p]:first-letter:sm:text-6xl [&_.chapter-heading+p]:first-letter:font-serif [&_.chapter-heading+p]:first-letter:font-bold [&_.chapter-heading+p]:first-letter:text-[#FF5353] [&_.chapter-heading+p]:first-letter:pr-3 [&_.chapter-heading+p]:first-letter:leading-none">
          {renderDocument(contentJson, 'cinematic-real-wedding', post)}
        </div>

        {/* 4. Couple Testimonial Card with Peach Gradient & Botanical Watermark (prompt-2.png) — Collapses if empty */}
        <CoupleTestimonialCard
          quote={post?.testimonial}
          byline={post?.testimonialAuthor}
        />

        {/* 5. The Curated Wedding Directory 6-Card Interactive Grid (prompt-2.png) — Collapses if empty */}
        <WeddingDirectoryGrid vendorCredits={post?.vendorCredits} />

        {/*
          Contents, CTA and related — share and the author are deliberately left
          out, because the engagement bar directly below already carries both.
        */}
        <ArticleRail
          layout="stacked"
          cards={['contents', 'cta', 'related']}
          toc={toc}
          related={related}
          post={post}
          shareUrl={post?._shareUrl}
          className="pt-6"
        />

        {/* 6. Loves Counter, Social Share Strip & Author Profile Card (prompt-2.png) */}
        <ArticleEngagementBar
          postSlug={post?.slug}
          initialLoves={post?.likeCount || 0}
          authorName={post?.author?.name || 'The Wedding Vachan'}
          authorRole={post?.author?.role || 'Lead Cinematographer'}
          shareUrl={post?._shareUrl}
        />

        {/* 7. Native Threaded Comments Section connected to MongoDB API (prompt-2.png) */}
        <CommentsSection
          postSlug={post?.slug}
          initialComments={post?.commentsData?.comments || []}
          initialTotal={post?.commentsData?.total || 0}
          commentsAllowed={post?.allowComments !== false}
        />
      </div>
    </article>
  );
}
