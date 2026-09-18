/**
 * HeadingBlock — H2–H4 with Playfair accents, anchor IDs for the contents rail,
 * and the numbered section marker.
 *
 * Vertical spacing is NOT set here. Every block used to choose its own margin
 * and they disagreed — headings alone carried four different top margins
 * (mt-8 / mt-10 / mt-12 / mt-24) while paragraphs used mb-5 and galleries
 * my-10 — so the article had six different gaps and no rhythm. The flow scale
 * in globals.css decides, in one place, for everything.
 */
import { toHeadingId } from '../headingIds.js';
import { cleanLineHeight } from '@/app/admin/(dashboard)/blogs/_components/typographyTokens.js';

function getTextContent(node) {
  if (!node) return '';
  if (node.type === 'text') return node.text || '';
  if (node.content) return node.content.map(getTextContent).join('');
  return '';
}

/** Templates that number their sections. A photo essay deliberately does not. */
const NUMBERED = new Set(['editorial-guide', 'cinematic-real-wedding', 'minimal-journal']);

export default function HeadingBlock({ node, children, template, post, headingId }) {
  const level = node.attrs?.level || 2;
  // Clamped for the same reason paragraphs are: a sub-1 multiple overlaps lines.
  const lineHeight = cleanLineHeight(node.attrs?.lineHeight) || undefined;
  const text = getTextContent(node);
  // `headingId` is de-duplicated across the document by renderAst and matches
  // the ids the backend put in post.tableOfContents. The local fallback only
  // applies when a heading is rendered outside renderDocument.
  const id = headingId || toHeadingId(text) || undefined;

  /*
    The numbered marker — `01 ———` above the heading.

    It already existed, but only on the Cinematic template. The reference design
    uses it on guides too, and it is the thing that makes a long article read as
    a sequence of sections rather than a wall. The number comes from the
    heading's position among the H2s, so inserting a section renumbers the rest
    without anyone maintaining a list.
  */
  if (level === 2 && NUMBERED.has(template)) {
    const h2Items = (post?.tableOfContents || []).filter((item) => item.level === 2);
    const h2Index = h2Items.findIndex((item) => item.id === id || item.text?.trim() === text?.trim());
    const chapterNumber = String((h2Index >= 0 ? h2Index : 0) + 1).padStart(2, '0');
    const cinematic = template === 'cinematic-real-wedding';

    return (
      <div
        className={`section-heading scroll-mt-28 ${cinematic ? 'chapter-heading' : ''}`}
        id={id}
        style={lineHeight ? { lineHeight } : undefined}
      >
        <span className="section-heading-marker">
          <span className={cinematic ? 'text-[#FF5353]' : 'text-studio-terracotta'}>{chapterNumber}</span>
          <span className={`section-heading-rule ${cinematic ? 'bg-[#FF5353]/50' : 'bg-studio-terracotta/40'}`} />
        </span>
        <h2 className={`section-heading-text font-playfair ${cinematic ? 'text-[#5E2B17]' : 'text-studio-ink'}`}>
          {children}
        </h2>
      </div>
    );
  }

  const baseClasses = {
    2: 'text-2xl sm:text-3xl font-bold font-playfair text-studio-ink',
    3: 'text-xl sm:text-2xl font-semibold font-sans text-studio-ink',
    4: 'text-lg sm:text-xl font-semibold font-sans text-studio-inkSecondary',
  };

  const classes = template === 'photo-essay'
    ? `${baseClasses[level] || baseClasses[2]} font-light`
    : baseClasses[level] || baseClasses[2];

  const Tag = `h${level}`;

  return (
    <Tag id={id} style={lineHeight ? { lineHeight } : undefined} className={`${classes} scroll-mt-28`}>
      {children}
    </Tag>
  );
}
