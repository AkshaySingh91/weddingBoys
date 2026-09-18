/**
 * Seed the layout regression suite (temporary script — safe to delete).
 *
 * Ten published posts, each stressing a layout that was reported broken or that
 * the reference design needs. They go through the real pipeline — sanitiser,
 * TOC extraction, the lot — so they exercise what ships rather than a fixture
 * that skips half of it. Existing posts are never touched.
 */
import dotenv from 'dotenv';
dotenv.config({ path: new URL('../.env', import.meta.url).pathname });
import mongoose from 'mongoose';
import BlogPost from '../Models/blogPost.js';
import Admin from '../Models/adminSchema.js';
import Media from '../Models/Media.js';
import { sanitizeBlogHtml } from '../Utils/sanitizeHtml.js';
import { extractTableOfContents } from '../Utils/tocExtractor.js';

/* ── node builders ──────────────────────────────────────────────────────── */
const text = (t) => ({ type: 'text', text: t });
const p = (t, attrs) => ({ type: 'paragraph', ...(attrs ? { attrs } : {}), content: t ? [text(t)] : [] });
const h = (level, t) => ({ type: 'heading', attrs: { level }, content: [text(t)] });
const cell = (content, attrs = {}) => ({
  type: 'layoutCell', attrs: { span: 1, rowSpan: 1, ...attrs }, content,
});
const row = (cells, attrs = {}) => ({ type: 'layoutRow', attrs, content: cells });
const grid = (cols, rows, attrs = {}) => ({
  type: 'layoutGrid',
  attrs: { cols, gap: 'md', align: 'stretch', borders: 'none', mobile: 'stack', ...attrs },
  content: rows,
});
const container = (content, attrs = {}) => ({
  type: 'container',
  attrs: {
    variant: 'card', padding: 'md', radius: 'md', shadow: 'none',
    background: 'none', border: 'none', ...attrs,
  },
  content,
});
const img = (src, mediaId) => ({
  type: 'inlineMedia',
  attrs: { mediaId, src, alt: 'Test image', size: 'full', align: 'center' },
});
const callout = (variant, t) => ({
  type: 'callout', attrs: { variant }, content: [p(t)],
});

/** Minimal HTML mirror of the AST — enough for the TOC pass and the fallback. */
function toHtml(nodes) {
  const walk = (n) => {
    if (!n) return '';
    const inner = (n.content || []).map(walk).join('');
    switch (n.type) {
      case 'text': return n.text || '';
      case 'heading': return `<h${n.attrs.level}>${inner}</h${n.attrs.level}>`;
      case 'paragraph': return `<p>${inner}</p>`;
      case 'layoutGrid': return `<div class="layout-grid">${inner}</div>`;
      case 'layoutRow': return `<div class="layout-row">${inner}</div>`;
      case 'layoutCell': return `<div class="layout-cell">${inner}</div>`;
      case 'container': return `<div class="blog-container">${inner}</div>`;
      case 'callout': return `<div class="callout">${inner}</div>`;
      case 'inlineMedia': return `<figure class="inline-media"><img src="${n.attrs.src}" alt=""></figure>`;
      default: return inner;
    }
  };
  return nodes.map(walk).join('');
}

/* ── the suite ──────────────────────────────────────────────────────────── */
const CAT = 'Planning Guides';

function suite(imgA, imgB, mediaA, mediaB) {
  return [
    {
      slug: 'zz-test-01-three-step-cards',
      title: 'Test 01 — Three Step Cards (nested grid in container)',
      why: 'The layout the author could not build: 3-col grid, a container in each cell, and another grid inside that container.',
      body: [
        h(2, 'Three Step Cards'),
        p('Each card is a container inside a grid cell, holding a grid of its own. This is the nesting that used to be refused outright.'),
        grid([1, 1, 1], [row([
          cell([container([grid([1, 4], [row([
            cell([p('01')]),
            cell([p('Scout the venue at the hour you will shoot.')]),
          ])])], { bgColor: '#FAF1E6', radiusValue: '16px', padValue: '18px', borderColor: '#E5DCD3' })]),
          cell([container([grid([1, 4], [row([
            cell([p('02')]),
            cell([p('Meter the ambient light before any fixture is placed.')]),
          ])])], { bgColor: '#FAF1E6', radiusValue: '16px', padValue: '18px', borderColor: '#E5DCD3' })]),
          cell([container([grid([1, 4], [row([
            cell([p('03')]),
            cell([p('Lock white balance so the edit starts from one truth.')]),
          ])])], { bgColor: '#FAF1E6', radiusValue: '16px', padValue: '18px', borderColor: '#E5DCD3' })]),
        ])]),
        h(2, 'Why It Failed Before'),
        p('A grid inside a container inside a grid cell is three levels of structure, and the editor refused the second one.'),
      ],
    },
    {
      slug: 'zz-test-02-pro-tip-panel',
      title: 'Test 02 — Pro Tip Panel (custom container)',
      why: 'Container with a custom width, radius, border and background — the Pro Tip panel from the reference.',
      body: [
        h(2, 'Pro Tip Panel'),
        p('The container below sets its own background, radius, border and padding rather than picking from a preset scale.'),
        container([
          grid([1, 9], [row([
            cell([p('*')]),
            cell([p('Pro Tip'), p('Avoid direct overhead magenta or neon blue LED lights on the couple. Request warm tungsten (3200K) or neutral daylight (5600K) spots.')]),
          ])]),
        ], { bgColor: '#FDF7EE', borderColor: '#C29555', borderWidth: '1px', radiusValue: '18px', padValue: '20px' }),
        h(2, 'A Second Panel, Wider Radius'),
        container([p('This one is a plain panel with a large radius and a terracotta edge.')],
          { bgColor: '#FFFFFF', borderColor: '#A3603A', borderWidth: '2px', radiusValue: '28px', padValue: '24px' }),
      ],
    },
    {
      slug: 'zz-test-03-tiny-row-heights',
      title: 'Test 03 — Tiny Row Heights (20px)',
      why: 'A 20px row holding a full paragraph. The height must be a floor, not a guillotine.',
      body: [
        h(2, 'Twenty Pixel Rows'),
        p('Each row below asks for 20px and contains far more than 20px of text.'),
        grid([1, 1], [
          row([
            cell([p('This paragraph is considerably longer than twenty pixels and must not be clipped, trailed or overlapped by whatever follows it in the document.')]),
            cell([p('Second cell, also long, also in a twenty pixel row, also expected to be fully readable from first word to last.')]),
          ], { height: 'custom', customHeight: 20 }),
          row([
            cell([p('A second twenty pixel row, to be sure the first was not a fluke of being first.')]),
            cell([p('And its neighbour.')]),
          ], { height: 'custom', customHeight: 20 }),
        ]),
      ],
    },
    {
      slug: 'zz-test-04-row-spans',
      title: 'Test 04 — Row Spans (tall image beside two stacked)',
      why: 'One cell spanning two rows next to two single-row cells — the case a per-row grid could not express.',
      body: [
        h(2, 'Row Spans'),
        p('The left image spans both rows; the right column holds two separate cells.'),
        grid([1, 1], [
          row([
            cell([img(imgA, mediaA)], { rowSpan: 2 }),
            cell([img(imgB, mediaB)]),
          ], { height: 'custom', customHeight: 180 }),
          row([
            cell([p('The cell under the span still belongs to its own row.')]),
          ], { height: 'custom', customHeight: 180 }),
        ]),
      ],
    },
    {
      slug: 'zz-test-05-flow-rhythm',
      title: 'Test 05 — Flow Rhythm (every adjacency)',
      why: 'Every pair of adjacent block types, to measure the spacing scale end to end.',
      body: [
        h(2, 'Paragraph After Heading'),
        p('This should hug the heading above it.'),
        p('This should sit a full flow step below its neighbour.'),
        callout('info', 'A callout, which should get the wider block gap on both sides.'),
        p('A paragraph after the callout.'),
        container([p('A container, likewise.')]),
        p('A paragraph after the container.'),
        grid([1, 1], [row([cell([p('Grid left')]), cell([p('Grid right')])])]),
        p('A paragraph after the grid.'),
        h(3, 'A Subheading'),
        p('Which should also hug its heading.'),
        h(2, 'A New Section'),
        p('Preceded by the widest gap in the scale.'),
      ],
    },
    {
      slug: 'zz-test-06-no-headings',
      title: 'Test 06 — No Headings (rail without a contents card)',
      why: 'An article with no headings at all: the contents card must be absent, the rest of the rail present.',
      body: [
        p('This post has no headings whatsoever.'),
        p('So there is nothing to list, and the On This Page card should not render.'),
        grid([1, 1], [row([cell([img(imgA, mediaA)]), cell([img(imgB, mediaB)])])]),
        p('The CTA, related, share and author cards should still be there.'),
      ],
    },
    {
      slug: 'zz-test-07-many-headings',
      title: 'Test 07 — Many Headings (numbering and scroll-spy)',
      why: 'Eight sections with subsections, to check marker numbering, rail numbering and scroll-spy.',
      body: [1, 2, 3, 4, 5, 6, 7, 8].flatMap((i) => [
        h(2, `Section Number ${i}`),
        p(`Body copy for section ${i}, long enough to give the scroll-spy something to travel through before the next heading arrives.`),
        h(3, `Subsection ${i}a`),
        p('A subsection, which is numbered as part of its parent rather than on its own.'),
      ]),
    },
    {
      slug: 'zz-test-08-custom-type',
      title: 'Test 08 — Custom Type Sizes and Leading',
      why: 'Custom px font sizes and custom leading, including the value that used to overlap lines.',
      body: [
        h(2, 'Custom Type'),
        p('Default paragraph for comparison.'),
        p('Leading set to 1.0 — the floor. Lines must not overlap.', { lineHeight: '1' }),
        p('Leading set to 2.2, which is above the preset scale and legal.', { lineHeight: '2.2' }),
        p('Leading saved as 0.5, the value that overlapped. It must be clamped at render.', { lineHeight: '0.5' }),
        p('Leading saved as 0, likewise.', { lineHeight: '0' }),
      ],
    },
    {
      slug: 'zz-test-09-deep-nesting',
      title: 'Test 09 — Deep Nesting (grid in container in grid in container)',
      why: 'Four levels of structure, past the editor depth limit, to confirm the page still renders sanely.',
      body: [
        h(2, 'Deep Nesting'),
        container([
          grid([1, 1], [row([
            cell([container([
              grid([1, 1], [row([
                cell([p('Level four, left.')]),
                cell([p('Level four, right.')]),
              ])]),
            ], { bgColor: '#F7F4EF', radiusValue: '12px', padValue: '12px' })]),
            cell([p('Level two, right.')]),
          ])]),
        ], { bgColor: '#FFFFFF', borderColor: '#E5DCD3', radiusValue: '20px', padValue: '20px' }),
      ],
    },
    {
      slug: 'zz-test-10-mixed-media',
      title: 'Test 10 — Mixed Media and Captions',
      why: 'Images with captions in grid cells, the arrangement whose captions overlapped.',
      body: [
        h(2, 'Captions In Cells'),
        grid([1, 1], [
          row([cell([img(imgA, mediaA)]), cell([img(imgB, mediaB)])], { height: 'custom', customHeight: 200 }),
          row([
            cell([p('Warm, flattering light with natural skin tones'), p('Golden hour warm mandap lighting')]),
            cell([p('Overpowering coloured lights ruin skin tones'), p('Direct LED spots and uncalibrated stage lights')]),
          ]),
        ]),
        h(2, 'A Second Pair'),
        p('To confirm the first pair was not special.'),
        grid([1, 1], [row([cell([img(imgB, mediaB)]), cell([img(imgA, mediaA)])], { height: 'custom', customHeight: 140 })]),
      ],
    },
  ];
}

/* ── run ────────────────────────────────────────────────────────────────── */
await mongoose.connect(process.env.MONGO_URI);

const seedPost = await BlogPost.findOne({ slug: 'container-test-blog' }).lean();
const author = seedPost?.author || (await Admin.findOne().lean())?._id;
if (!author) throw new Error('no author to attribute the test posts to');

const media = await Media.find({ _id: { $in: seedPost?.inlineMedia || [] } }).limit(2).lean();
const mediaA = media[0]?._id || null;
const mediaB = media[1]?._id || mediaA;
const urlOf = (m) => m?.cdnUrl || m?.publicUrl || m?.url || '';
const imgA = urlOf(media[0]);
const imgB = urlOf(media[1]) || imgA;

const posts = suite(imgA, imgB, mediaA, mediaB);
/*
  Spread across all four templates on purpose, so re-running the suite keeps
  covering every one of them. Test 09 is Cinematic because that is the template
  whose rail drops the share and author cards (its engagement bar already
  carries both) — a rule nothing else in the suite exercises.
*/
const templates = ['editorial-guide', 'editorial-guide', 'editorial-guide', 'minimal-journal',
  'editorial-guide', 'photo-essay', 'editorial-guide', 'editorial-guide',
  'cinematic-real-wedding', 'photo-essay'];

let created = 0; let skipped = 0;
for (const [i, spec] of posts.entries()) {
  const existing = await BlogPost.findOne({ slug: spec.slug });
  const doc = { type: 'doc', content: spec.body };
  const rawHtml = sanitizeBlogHtml(toHtml(spec.body));
  const { html, toc } = extractTableOfContents(rawHtml);

  const fields = {
    title: spec.title,
    slug: spec.slug,
    content: html,
    contentJson: doc,
    excerpt: spec.why.slice(0, 200),
    template: templates[i],
    author,
    category: CAT,
    tags: ['layout-test', 'regression'],
    status: 'Published',
    publishedAt: new Date(),
    tableOfContents: toc,
    coverImage: seedPost?.coverImage,
    allowComments: false,
  };

  if (existing) {
    Object.assign(existing, fields);
    await existing.save();
    skipped += 1;
    console.log(`updated  ${spec.slug}  (${toc.length} headings)`);
  } else {
    await BlogPost.create(fields);
    created += 1;
    console.log(`created  ${spec.slug}  (${toc.length} headings)`);
  }
}
console.log(`\n${created} created, ${skipped} updated. No existing posts were removed.`);
await mongoose.disconnect();
