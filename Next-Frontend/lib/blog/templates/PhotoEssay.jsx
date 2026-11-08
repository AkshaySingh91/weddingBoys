/**
 * PhotoEssay template — minimal text, edge-to-edge visuals.
 *
 * Layout: Edge-to-edge hero → minimal header → large galleries with caption overlays → CTA
 */
import Image from 'next/image';
import { Clock } from '@phosphor-icons/react';
import { renderDocument } from '../renderAst';
import EnquiryCtaBlock from '../blocks/EnquiryCtaBlock';
import ArticleRail from '@/app/(journal)/blogs/_components/ArticleRail.jsx';

const coverOf = (post) =>
  typeof post?.coverImage === 'string'
    ? post.coverImage
    : post?.coverImage?.cdnUrl || post?.coverImage?.publicUrl || post?.coverImage?.url || null;

export default function PhotoEssay({ post, contentJson, toc, related }) {
  const cover = coverOf(post);
  const publishedDate = post.publishedAt ? new Date(post.publishedAt) : new Date(post.createdAt);

  return (
    <>
      {/* Edge-to-edge hero */}
      {cover && (
        <div className="relative -mx-4 mb-12 sm:-mx-6 lg:-mx-8">
          <div className="relative aspect-[16/9] w-full overflow-hidden sm:aspect-[21/9] bg-stone-100">
            <Image
              src={cover}
              alt={post.coverImage?.altText || post.title}
              fill
              priority
              unoptimized
              sizes="100vw"
              className="object-cover"
            />
          </div>
        </div>
      )}

      {/* Minimal header */}
      <header className="mb-12 text-center">
        <span className="text-xs font-medium uppercase tracking-widest text-studio-inkMuted">
          {post.category}
        </span>
        <h1 className="mx-auto mt-3 max-w-3xl font-playfair text-3xl font-light leading-tight text-studio-ink sm:text-4xl lg:text-5xl">
          {post.title}
        </h1>
        <div className="mt-4 flex items-center justify-center gap-3 text-sm text-studio-inkMuted">
          <span>{post.author?.name || 'The Wedding Vachan'}</span>
          <span>·</span>
          <span className="flex items-center gap-1">
            <Clock size={13} />
            {post.readingTime || 1} min
          </span>
        </div>
      </header>

      {/* Content — the rail goes under it, not beside it (see ArticleRail). */}
      <article className="mx-auto max-w-4xl">
        <div className="blog-content">
          {renderDocument(contentJson, 'photo-essay', post)}
        </div>

        {/* CTA */}
        <EnquiryCtaBlock
          node={{ attrs: { text: 'Let\'s Create Something Beautiful' } }}
          post={post}
        />

      </article>

      <ArticleRail
        layout="stacked"
        toc={toc}
        related={related}
        post={post}
        shareUrl={post._shareUrl}
        className="mx-auto mt-14 max-w-5xl border-t border-studio-border pt-10"
      />
    </>
  );
}
