'use client';

/**
 * BlogRenderer — the main component that renders a blog post.
 *
 * Selects the appropriate template based on post.template and passes
 * the contentJson AST through the block registry renderer.
 *
 * Falls back to dangerouslySetInnerHTML if contentJson is not available
 * (backward compatibility for legacy posts).
 */
import CinematicRealWedding from './templates/CinematicRealWedding';
import EditorialGuide from './templates/EditorialGuide';
import PhotoEssay from './templates/PhotoEssay';
import MinimalJournal from './templates/MinimalJournal';

const TEMPLATE_MAP = {
  'cinematic-real-wedding': CinematicRealWedding,
  'editorial-guide':        EditorialGuide,
  'photo-essay':            PhotoEssay,
  'minimal-journal':        MinimalJournal,
};

/**
 * @param {Object} props
 * @param {Object} props.post - Full blog post document (with populated fields)
 * @param {string} [props.template] - Override template (defaults to post.template)
 * @param {Object} [props.contentJson] - Override contentJson (defaults to post.contentJson)
 * @param {React.ComponentType} [props.TocComponent] - Table of Contents component
 * @param {React.ComponentType} [props.ShareComponent] - Share links component
 * @param {string} [props.shareUrl] - Shareable URL for the post
 * @param {Array} [props.related] - Category/tag-matched posts for the rail
 */
export default function BlogRenderer({
  post,
  template,
  contentJson,
  TocComponent,
  ShareComponent,
  shareUrl,
  related,
}) {
  const resolvedTemplate = template || post?.template || 'editorial-guide';
  const resolvedContentJson = contentJson || post?.contentJson;
  const toc = post?.tableOfContents || [];

  // Inject share URL into post for template access
  const postWithMeta = { ...post, _shareUrl: shareUrl };

  // ── Fallback: render from HTML cache if no contentJson ──
  if (!resolvedContentJson) {
    const htmlContent = post?.content || post?.contentHtml;
    if (!htmlContent) return null;

    return (
      <div
        className="blog-content prose prose-lg max-w-none prose-headings:scroll-mt-24 prose-a:text-studio-terracotta"
        dangerouslySetInnerHTML={{ __html: htmlContent }}
      />
    );
  }

  // ── Template rendering ──
  const TemplateComponent = TEMPLATE_MAP[resolvedTemplate] || EditorialGuide;

  return (
    <TemplateComponent
      post={postWithMeta}
      contentJson={resolvedContentJson}
      toc={toc}
      related={related}
      TocComponent={TocComponent}
      ShareComponent={ShareComponent}
    />
  );
}
