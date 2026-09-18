/**
 * Seed the reference article — the design the public blog is being matched to.
 *
 * It exists so the two can be put side by side at the same width and compared
 * directly, rather than judged from memory. Every element of the reference is
 * represented: cover legends, the Pro Tip callout, the badged comparison pair
 * with caption and sub-caption, three step cards, FAQs, and the rail's quote.
 */
import dotenv from 'dotenv';
dotenv.config({ path: new URL('../.env', import.meta.url).pathname });

import mongoose from 'mongoose';
import BlogPost from '../Models/blogPost.js';
import Admin from '../Models/adminSchema.js';
import Media from '../Models/Media.js';
import { sanitizeBlogHtml } from '../Utils/sanitizeHtml.js';
import { extractTableOfContents } from '../Utils/tocExtractor.js';

const text = (t) => ({ type: 'text', text: t });
const p = (t, attrs) => ({ type: 'paragraph', ...(attrs ? { attrs } : {}), content: t ? [text(t)] : [] });
const h = (level, t) => ({ type: 'heading', attrs: { level }, content: [text(t)] });
const cell = (content, attrs = {}) => ({ type: 'layoutCell', attrs: { span: 1, rowSpan: 1, ...attrs }, content });
const row = (cells, attrs = {}) => ({ type: 'layoutRow', attrs, content: cells });
const grid = (cols, rows, attrs = {}) => ({
  type: 'layoutGrid',
  attrs: { cols, gap: 'md', align: 'stretch', borders: 'none', mobile: 'stack', ...attrs },
  content: rows,
});
const container = (content, attrs = {}) => ({
  type: 'container',
  attrs: { variant: 'card', padding: 'md', radius: 'md', shadow: 'none', background: 'none', border: 'none', ...attrs },
  content,
});
const callout = (variant, content) => ({ type: 'callout', attrs: { variant }, content });
const figure = (src, mediaId, caption, subCaption, badge, badgeTone) => ({
  type: 'inlineMedia',
  attrs: {
    mediaId, src, alt: caption, size: 'full', align: 'center',
    caption, subCaption, badge, badgeTone, frame: '4-3',
  },
});

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
      case 'callout': return `<div data-callout data-variant="${n.attrs.variant}" class="callout">${inner}</div>`;
      case 'inlineMedia': return `<figure class="inline-media"><img src="${n.attrs.src}" alt=""><figcaption>${n.attrs.caption || ''}</figcaption></figure>`;
      default: return inner;
    }
  };
  return nodes.map(walk).join('');
}

const mark = (t, marks) => ({ type: 'text', text: t, marks });
const styled = (t, attrs) => mark(t, [{ type: 'textStyle', attrs }]);
const para = (content, attrs) => ({ type: 'paragraph', ...(attrs ? { attrs } : {}), content });

/**
 * One step card, built from the primitives an author has: a container with its
 * own background, border, radius and padding, holding a stack of paragraphs
 * whose type is set with the marks the toolbar offers.
 *
 * Stacked, not a two-column grid. As a grid the number took a column of its own
 * and squeezed the copy into roughly twelve characters a line, which made the
 * card three times taller than the reference's.
 */
const stepCard = (no, title, time, body) => cell([
  container([
    para([styled(no, { color: '#A3603A', fontSize: '13px' })]),
    para([mark(title, [{ type: 'bold' }])]),
    para([styled(time, { color: '#FF5353', fontSize: '13px' })]),
    para([styled(body, { fontSize: '13px' })]),
  ], {
    bgColor: '#FFFFFF', borderColor: '#EFE2D6', borderWidth: '1px',
    radiusValue: '14px', padValue: '18px',
  }),
]);

await mongoose.connect(process.env.MONGO_URI);

const seedPost = await BlogPost.findOne({ slug: 'container-test-blog' }).lean();
const author = seedPost?.author || (await Admin.findOne().lean())?._id;
const media = await Media.find({ _id: { $in: seedPost?.inlineMedia || [] } }).limit(2).lean();
const urlOf = (m) => m?.cdnUrl || m?.publicUrl || m?.url || '';
const [mA, mB] = [media[0], media[1] || media[0]];

const body = [
  h(2, 'Why Ambient Lighting Dictates Film Quality'),
  p('Lighting is the silent storyteller of your wedding film. It sets the mood, enhances emotions, and brings out the true colors of your celebration. The right lighting can make a simple moment look cinematic, while poor lighting can make even the most beautiful venue feel flat.'),
  p('Indian weddings are a mix of natural light, artificial light, fire rituals, and dynamic environments. Each of these presents unique challenges and opportunities for creating stunning, timeless visuals.'),

  callout('protip', [
    p('Avoid direct overhead magenta or neon blue LED lights on the bride and groom during pheras. Request warm tungsten (3200K) or neutral daylight (5600K) spots.'),
  ]),

  grid([1, 1], [
    row([
      cell([figure(urlOf(mA), mA?._id, 'Warm, flattering light with natural skin tones',
        'Golden hour + warm mandap lighting', 'Good lighting', 'positive')]),
      cell([figure(urlOf(mB), mB?._id, 'Overpowering colored lights ruin skin tones',
        'Direct LED spots and uncalibrated stage lights', 'Harsh lighting', 'negative')]),
    ]),
  ]),

  h(2, 'Step-by-Step Lighting Timeline for Indian Ceremonies'),
  p("Here's a practical timeline to help you plan the perfect lighting for each key moment:"),

  grid([1, 1, 1], [
    row([
      stepCard('01', 'Sunset Varmala Alignment', '5:15 PM – 5:45 PM',
        'Use natural golden hour light. Position the couple facing the sunset for dreamy, cinematic silhouettes and soft glow.'),
      stepCard('02', 'Baraat Floodlights & Torch Coordination', '6:30 PM',
        'Coordinate with the venue for warm white floodlights. Avoid harsh white or colored LEDs. Use practical torches and traditional lighting elements for authenticity.'),
      stepCard('03', 'Mandap Sacred Fire Exposure Calibration', '8:00 PM',
        'Balance the warm light from the havan fire with subtle fill lights. Ensure the sacred ritual is captured with clarity without overexposing the flames.'),
    ]),
  ]),
];

const rawHtml = sanitizeBlogHtml(toHtml(body));
const { html, toc } = extractTableOfContents(rawHtml);

const fields = {
  title: 'Mastering Wedding Ceremony Lighting: From Golden Hour Pheras to Low-Light Receptions',
  slug: 'zz-reference-lighting-guide',
  content: html,
  contentJson: { type: 'doc', content: body },
  excerpt: 'Lighting separates amateur video from timeless cinema. Here is exactly how to coordinate with your decorator and venue for flattering skin tones and magical mandap atmospheres.',
  template: 'editorial-guide',
  author,
  category: 'Planning Guides',
  tags: ['lighting', 'planning', 'reference'],
  status: 'Published',
  publishedAt: new Date(),
  tableOfContents: toc,
  coverImage: seedPost?.coverImage,
  allowComments: true,
  // The cover's two corner legends.
  weddingDetails: {
    tagline: 'Right Light\nReal Emotions',
    subtitle: "It's not just a wedding, it's a feeling in every frame.",
    flourishQuote: 'Great lighting doesn’t just illuminate people, it reveals their emotions.',
  },
  testimonialAuthor: 'Akshay Singh',
  faq: [
    { question: 'Will extra camera lights blind our wedding guests?',
      answer: 'No. We use diffused, soft, and well-placed lights that are designed for cinematic capture without causing discomfort. Our team ensures the lighting is subtle and blends naturally with the venue ambiance.' },
    { question: 'Can our videographer work with candlelight only?',
      answer: 'Yes, with fast lenses and the right sensor we can shoot in candlelight alone. We will usually add a very low fill so faces keep detail without losing the warmth of the flame.' },
    { question: 'What should we tell our wedding decorator about stage spotlights?',
      answer: 'Ask for warm white or neutral spots rather than saturated magenta or blue, and ask that they be aimed from the front rather than directly overhead.' },
  ],
};

const existing = await BlogPost.findOne({ slug: fields.slug });
if (existing) { Object.assign(existing, fields); await existing.save(); console.log('updated', fields.slug); }
else { await BlogPost.create(fields); console.log('created', fields.slug); }
console.log(`${toc.length} headings, ${fields.faq.length} FAQs`);
await mongoose.disconnect();
