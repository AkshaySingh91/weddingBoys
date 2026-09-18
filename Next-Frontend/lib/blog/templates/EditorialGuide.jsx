/**
 * EditorialGuide template — the AEO-optimized format for planning & destination guides.
 *
 * Layout: Standard header → prominent TOC sidebar rail → content with FAQ/How-To → CTA
 */
import Image from 'next/image';
import { Clock, CalendarDot, ChatCircle, Sparkle } from '@phosphor-icons/react';
import { renderDocument } from '../renderAst';
import FAQBlock from '../blocks/FAQBlock';
import EnquiryCtaBlock from '../blocks/EnquiryCtaBlock';
import ArticleRail from '@/app/(journal)/blogs/_components/ArticleRail.jsx';

const avatarOf = (author) =>
  author?.avatarMedia?.cdnUrl || author?.avatarMedia?.publicUrl || author?.avatarMedia?.url
  || author?.avatar?.url || null;

const coverOf = (post) =>
  typeof post?.coverImage === 'string'
    ? post.coverImage
    : post?.coverImage?.cdnUrl || post?.coverImage?.publicUrl || post?.coverImage?.url || null;

export default function EditorialGuide({ post, contentJson, toc, related }) {
  const cover = coverOf(post);
  const publishedDate = post.publishedAt ? new Date(post.publishedAt) : new Date(post.createdAt);
  const authorName = post.author?.name || 'The Wedding Boys';
  const authorAvatar = avatarOf(post.author);
  const commentCount = post.commentsData?.total || 0;
  // The cover's corner legends, both optional. See the figure below.
  const coverScript = post.weddingDetails?.tagline || '';
  const coverLegend = post.weddingDetails?.subtitle || '';

  return (
    <>
      {/*
        Header.

        The title is the studio's deep brown rather than near-black: against a
        cream page a pure-black headline reads as UI, not as print.
      */}
      <header className="mb-8 text-center">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-studio-blush px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-[0.12em] text-studio-coral">
          <Sparkle size={12} weight="fill" />
          {post.category}
        </span>
        <h1 className="mx-auto mt-5 max-w-3xl font-playfair text-[32px] font-bold leading-[1.18] text-studio-cocoa sm:text-[40px]">
          {post.title}
        </h1>
        {post.excerpt && (
          <p className="mx-auto mt-4 max-w-2xl text-[15px] leading-relaxed text-studio-inkMuted">
            {post.excerpt}
          </p>
        )}

        {/* Byline — the author's face, then the facts about the article. */}
        <div className="mt-5 flex flex-wrap items-center justify-center gap-x-3 gap-y-2 text-[13px] text-studio-inkMuted">
          <span className="flex items-center gap-2">
            <span className="relative h-7 w-7 overflow-hidden rounded-full bg-studio-obsidian">
              {authorAvatar ? (
                <Image src={authorAvatar} alt={authorName} fill unoptimized sizes="28px" className="object-cover" />
              ) : (
                <span className="flex h-full w-full items-center justify-center font-playfair text-[11px] font-bold text-studio-gold">
                  {authorName[0]}
                </span>
              )}
            </span>
            <span className="font-semibold text-studio-ink">{authorName}</span>
          </span>
          <span aria-hidden="true">·</span>
          <time dateTime={publishedDate.toISOString()} className="flex items-center gap-1.5" suppressHydrationWarning>
            <CalendarDot size={14} />
            {publishedDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          </time>
          <span aria-hidden="true">·</span>
          <span className="flex items-center gap-1.5">
            <Clock size={14} />
            {post.readingTime || 1} min read
          </span>
          {commentCount > 0 && (
            <>
              <span aria-hidden="true">·</span>
              <span className="flex items-center gap-1.5">
                <ChatCircle size={14} />
                {commentCount} {commentCount === 1 ? 'Comment' : 'Comments'}
              </span>
            </>
          )}
        </div>
      </header>

      {/*
        Cover, with the two corner legends from the reference.

        Both are optional and driven by the post, because they are editorial
        lines about this particular photograph — a default would caption every
        cover on the site identically. The gradient only appears when there is
        text to carry, so an uncaptioned cover is not dimmed for nothing.
      */}
      {cover && (
        <figure className="relative mb-10 aspect-[16/8] w-full overflow-hidden rounded-2xl bg-stone-100">
          <Image
            src={cover}
            alt={post.coverImage?.altText || post.title}
            fill
            priority
            unoptimized
            sizes="(max-width: 1024px) 100vw, 1024px"
            className="object-cover"
          />
          {(coverScript || coverLegend) && (
            <>
              <span aria-hidden="true" className="absolute inset-0 bg-gradient-to-r from-black/40 via-transparent to-black/40" />
              {coverScript && (
                <figcaption className="cover-legend absolute bottom-6 left-6 max-w-[38%] font-lora text-2xl italic leading-tight text-white drop-shadow sm:text-3xl">
                  {coverScript}
                  <span className="mt-3 block h-px w-10 bg-white/70" />
                </figcaption>
              )}
              {coverLegend && (
                <p className="absolute bottom-6 right-6 max-w-[34%] text-right text-[11px] font-semibold uppercase leading-[1.7] tracking-[0.14em] text-white/90 drop-shadow">
                  {coverLegend}
                </p>
              )}
            </>
          )}
        </figure>
      )}

      {/*
        Body: content + rail.

        The rail is on the right, and its column is always reserved, because the
        rail always has something in it — CTA, related, share, author — even when
        the article has no headings for a contents list. It is the CARD that is
        conditional now, not the column; an article without headings simply
        starts the rail at the CTA.

        Below `lg` the rail becomes a normal block under the article rather than
        a narrow column beside it.
      */}
      <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_300px] lg:gap-10">
        <article className="min-w-0">
          <div className="blog-content">
            {renderDocument(contentJson, 'editorial-guide', post)}
          </div>

          {/*
            The FAQ and the CTA sit outside `.blog-content`, so the article's
            flow scale does not reach them and they had no gap above at all.
            They take the scale's section step explicitly.
          */}
          <div className="mt-16">
            <FAQBlock post={post} />
          </div>

          {/* Enquiry CTA */}
          <div className="mt-16" />
          <EnquiryCtaBlock
            node={{ attrs: { text: 'Ready to Start Planning?' } }}
            post={post}
          />

        </article>

        {/* Share and author live in the rail — the reader meets each once. */}
        <ArticleRail
          toc={toc}
          related={related}
          post={post}
          shareUrl={post._shareUrl}
          className="mt-12 lg:mt-0"
        />
      </div>
    </>
  );
}
