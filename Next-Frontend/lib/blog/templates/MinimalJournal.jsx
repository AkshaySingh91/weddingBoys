/**
 * MinimalJournal template — short studio notes with narrow measure.
 *
 * Layout: Narrow measure (max-w-2xl), generous whitespace, no hero, simple typography.
 */
import { Clock, CalendarDot } from '@phosphor-icons/react';
import { renderDocument } from '../renderAst';
import ArticleRail from '@/app/(journal)/blogs/_components/ArticleRail.jsx';

export default function MinimalJournal({ post, contentJson, toc, related }) {
  const publishedDate = post.publishedAt ? new Date(post.publishedAt) : new Date(post.createdAt);

  /*
    A journal note keeps its narrow measure — that is the whole point of the
    template — so the rail sits beside the measure rather than eating into it.
    The pair is centred as a unit, which is why the article is no longer
    `mx-auto` itself.
  */
  return (
    <div className="mx-auto max-w-5xl py-8 lg:grid lg:grid-cols-[minmax(0,42rem)_300px] lg:justify-center lg:gap-10">
      <article className="mx-auto w-full max-w-2xl lg:mx-0">
      {/* Simple header */}
      <header className="mb-12">
        <span className="text-xs font-medium uppercase tracking-widest text-studio-terracotta">
          {post.category}
        </span>
        <h1 className="mt-3 font-playfair text-3xl font-bold leading-tight text-studio-ink sm:text-4xl">
          {post.title}
        </h1>
        <div className="mt-5 flex items-center gap-4 text-sm text-studio-inkMuted">
          <span className="font-medium text-studio-ink">{post.author?.name || 'The Wedding Vachan'}</span>
          <span className="flex items-center gap-1" suppressHydrationWarning>
            <CalendarDot size={14} />
            {publishedDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          </span>
          <span className="flex items-center gap-1">
            <Clock size={14} />
            {post.readingTime || 1} min read
          </span>
        </div>
        <div className="mt-8 h-px bg-studio-border" />
      </header>

      {/* Content — no TOC, generous line height */}
      <div className="blog-content blog-content--journal">
        {renderDocument(contentJson, 'minimal-journal', post)}
      </div>

      </article>

      {/* Share and author live in the rail — the reader meets each once. */}
      <ArticleRail
        toc={toc}
        related={related}
        post={post}
        shareUrl={post._shareUrl}
        className="mx-auto mt-12 w-full max-w-2xl lg:mx-0 lg:mt-0 lg:max-w-none"
      />
    </div>
  );
}
