/**
 * Ten grid layouts, built to break things.
 *
 * Regenerates the fixtures behind docs/context/15-grid-and-media-audit.md. Each
 * layout targets one capability the reference designs need, using real images
 * from the media library so the aspect-ratio spread is the real one.
 *
 *   node scripts/build-grid-fixtures.js            # create / replace
 *   node scripts/build-grid-fixtures.js --clean    # remove them again
 *
 * They are saved as Draft and never published — this points at the production
 * database, so they are viewed through a preview token instead. Re-running is
 * idempotent: existing zz-NN-* posts are replaced.
 */
import 'dotenv/config';
import mongoose from 'mongoose';

// Filled from the media collection in main(); deliberately mixed aspects,
// because a 0.665 portrait beside a 2.071 panorama is the worst case a frame
// has to reconcile.
let P = [];
let L = [];
let AUTHOR = null;
let COVER = null;
const pick = (arr, i) => arr[i % arr.length];

/* ------------------------------------------------------------- node helpers */
const text = (t) => ({ type: 'text', text: t });
const p = (t, attrs = {}) => ({ type: 'paragraph', attrs: { textAlign: null, ...attrs }, content: t ? [text(t)] : [] });
const h = (level, t) => ({ type: 'heading', attrs: { level, textAlign: null }, content: [text(t)] });

const img = (m, { frame = 'natural', focus = 'center', caption = '', align = 'center', badge = '', badgeTone = 'neutral', focusX = null, focusY = null, radius = 'md' } = {}) => ({
    type: 'inlineMedia',
    attrs: {
        mediaId: m.id, src: m.src, alt: '', caption, align, priority: false,
        width: m.width, height: m.height, aspectRatio: m.ar,
        dominantColor: null, blurDataURL: null, frame, focus, badge, badgeTone, focusX, focusY, radius,
    },
});

const cell = (content, span = 1, rowSpan = 1) => ({ type: 'layoutCell', attrs: { span, rowSpan }, content: content.length ? content : [p('')] });
const row = (cells, attrs = {}) => ({ type: 'layoutRow', attrs: { height: 'auto', customHeight: null, ...attrs }, content: cells });
const grid = (rows, attrs = {}) => ({
    type: 'layoutGrid',
    attrs: { cols: [1, 1], gap: 'md', align: 'stretch', borders: 'none', mobile: 'stack', ...attrs },
    content: rows,
});
const container = (content, variant = 'card', head = {}) => ({
    type: 'container',
    attrs: {
        variant, padding: 'md', radius: 'md', border: 'none', shadow: 'none', background: 'none',
        marker: head.marker || '', icon: head.icon || '', label: head.label || '',
    },
    content,
});
const gallery = (items, columns) => ({
    type: 'photoGallery',
    attrs: { items: items.map((m) => ({ src: m.src, alt: '', caption: '', blurDataURL: null, dominantColor: null })), columns },
});

/* ------------------------------------------------------------- the layouts */
// A function, not a constant: the image pools are filled from the database in
// main(), so building the tree at module load would pick from empty arrays.
const buildLayouts = () => [
    {
        slug: 'zz-01-hero-and-row-span',
        title: 'zz 01 — Hero, two stacked left, one tall right',
        probe: 'THE layout that prompted the rebuild — a cell spanning two rows',
        template: 'photo-essay',
        body: [
            h(2, 'A cell that spans two rows'),
            grid([
                // Full-width hero.
                row([cell([img(pick(L, 0), { frame: '16-9' })], 2)]),
                // Two stacked on the left, one tall on the right.
                row([
                    cell([img(pick(P, 0), { frame: '4-3', focusY: 20 })]),
                    cell([img(pick(P, 1), { frame: 'fill', focusY: 25 })], 1, 2),
                ]),
                row([cell([img(pick(P, 2), { frame: '4-3', focusY: 20 })])]),
            ], { cols: [1, 1] }),
            p('The right-hand image spans both rows beside the two stacked on the left.'),
        ],
    },
    {
        slug: 'zz-02-comparison-pair',
        title: 'zz 02 — Comparison pair from unequal sources',
        probe: 'two images the same size when the originals are not',
        template: 'editorial-guide',
        body: [
            h(2, 'Good light versus harsh light'),
            grid([
                row([
                    cell([img(pick(P, 1), { frame: '4-3', focus: 'top', caption: 'Warm, flattering light', badge: 'Good lighting', badgeTone: 'positive' })]),
                    cell([img(pick(L, 5), { frame: '4-3', focus: 'top', caption: 'Overpowering colour', badge: 'Harsh lighting', badgeTone: 'negative' })]),
                ]),
            ]),
        ],
    },
    {
        slug: 'zz-03-step-cards',
        title: 'zz 03 — Three step cards, container per cell',
        probe: 'a container nested inside a cell',
        template: 'editorial-guide',
        body: [
            h(2, 'Lighting timeline'),
            grid([
                row([
                    cell([container([p('5:15 PM – 5:45 PM'), p('Use natural golden hour light.')], 'card', { marker: '01', icon: 'sun', label: 'Sunset varmala' })]),
                    cell([container([p('6:30 PM'), p('Coordinate warm white floodlights.')], 'card', { marker: '02', icon: 'fire', label: 'Baraat floodlights' })]),
                    cell([container([p('8:00 PM'), p('Balance the havan fire with fill light.')], 'card', { marker: '03', icon: 'lotus', label: 'Mandap fire' })]),
                ]),
            ], { cols: [1, 1, 1] }),
        ],
    },
    {
        slug: 'zz-04-pricing-table',
        title: 'zz 04 — Pricing table, 4 x 4, borders, mobile scroll',
        probe: 'borders and the keep-columns mobile mode',
        template: 'minimal-journal',
        body: [
            h(2, 'Collections'),
            grid([
                row([cell([p('Package')]), cell([p('Coverage')]), cell([p('Team')]), cell([p('Price')])]),
                row([cell([p('Classic')]), cell([p('1 day')]), cell([p('2 cinematographers')]), cell([p('Rs 1,20,000')])]),
                row([cell([p('Signature')]), cell([p('2 days')]), cell([p('4 + drone')]), cell([p('Rs 2,40,000')])]),
                row([cell([p('Heirloom')]), cell([p('3 days')]), cell([p('6 + drone')]), cell([p('Rs 3,80,000')])]),
            ], { cols: [2, 2, 3, 2], borders: 'lines', mobile: 'scroll', gap: 'none' }),
        ],
    },
    {
        slug: 'zz-05-magazine-spread',
        title: 'zz 05 — One image spanning three rows beside text',
        probe: 'a tall span against several short rows',
        template: 'cinematic-real-wedding',
        body: [
            h(2, 'A tall span beside stacked text'),
            grid([
                row([
                    cell([img(pick(P, 3), { frame: 'fill', focusY: 20 })], 1, 3),
                    cell([h(4, 'The serenade'), p('Udaipur, with its timeless palaces and shimmering waters.')]),
                ], { height: 'sm' }),
                row([cell([h(4, 'The varmala'), p('As the sun melted into the horizon.')])], { height: 'sm' }),
                row([cell([h(4, 'The pheras'), p('Sacred fire, with the Aravallis as witness.')])], { height: 'sm' }),
            ], { cols: [2, 3] }),
        ],
    },
    {
        slug: 'zz-05b-text-beside-stack',
        title: 'zz 05b — Indented text left, image plus two below right',
        probe: "the original brief's hardest case",
        template: 'editorial-guide',
        body: [
            h(2, 'The serenade of Lake Pichola'),
            grid([
                row([
                    cell([
                        p('There are some places that do not just host weddings, they become part of the story.'),
                        p('Udaipur, with its timeless palaces and shimmering waters, set the stage for a union that felt like poetry in motion.'),
                    ]),
                    cell([
                        img(pick(L, 6), { frame: '16-9' }),
                        img(pick(P, 2), { frame: '1-1', focus: 'top' }),
                        img(pick(P, 3), { frame: '1-1', focus: 'top' }),
                    ]),
                ]),
            ], { cols: [1, 1] }),
        ],
    },
    {
        slug: 'zz-06-hero-info-row',
        title: 'zz 06 — Full-width hero then a four-cell info row',
        probe: 'a full span above very narrow cells',
        template: 'cinematic-real-wedding',
        body: [
            grid([
                row([cell([img(pick(L, 7), { frame: '16-9' })], 4)]),
                row([
                    cell([container([p('Udaipur, Rajasthan')], 'plain', { icon: 'place', label: 'Destination' })]),
                    cell([container([p('The Leela Palace')], 'plain', { icon: 'sparkle', label: 'Venue' })]),
                    cell([container([p('Winter, royal traditional')], 'plain', { icon: 'sun', label: 'Season & mood' })]),
                    cell([container([p('6-camera team + 4K drone')], 'plain', { icon: 'film', label: 'Cinema crew' })]),
                ]),
            ], { cols: [1, 1, 1, 1], borders: 'boxed' }),
        ],
    },
    {
        slug: 'zz-07-fixed-row-height',
        title: 'zz 07 — 1:2 text and image at a fixed row height',
        probe: 'the new row-height lever, and what follows staying on screen',
        template: 'editorial-guide',
        body: [
            h(2, 'A fixed-height band'),
            grid([
                row([
                    cell([p('This column is one part wide. The row is pinned to a fixed height so the paragraph underneath the grid is still on screen.')]),
                    cell([img(pick(P, 4), { frame: 'fill', focus: 'top' })]),
                ], { height: 'md' }),
            ], { cols: [1, 2] }),
            p('This paragraph must be visible without scrolling past a full-height portrait.'),
        ],
    },
    {
        slug: 'zz-08-mixed-aspect-frames',
        title: 'zz 08 — Portrait beside landscape, both framed',
        probe: 'the frame lever and the focal point on a 0.665 next to a 2.071',
        template: 'photo-essay',
        body: [
            h(2, 'Same frame, very different originals'),
            p('Left is the tallest portrait in the library; right is the widest panorama. Both are framed 4:3.'),
            grid([
                row([
                    cell([img(P.find((m) => m.ar < 0.7) || pick(P, 5), { frame: '4-3', focus: 'top' })]),
                    cell([img(L.find((m) => m.ar > 2) || pick(L, 8), { frame: '4-3' })]),
                ]),
                row([
                    cell([img(P.find((m) => m.ar < 0.7) || pick(P, 5), { frame: 'natural' })]),
                    cell([img(L.find((m) => m.ar > 2) || pick(L, 8), { frame: 'natural' })]),
                ]),
            ]),
        ],
    },
    {
        slug: 'zz-09-containers-in-cells',
        title: 'zz 09 — Tinted containers inside cells',
        probe: 'nesting, padding and background interaction',
        template: 'editorial-guide',
        body: [
            h(2, 'Nested boxes'),
            grid([
                row([
                    cell([container([h(4, 'Pro tip'), p('Avoid direct overhead magenta or neon blue LED on the couple during pheras.')], 'tinted')]),
                    cell([container([h(4, 'Watch out'), p('Request warm tungsten (3200K) or neutral daylight (5600K) spots.')], 'outlined')]),
                ]),
                row([cell([container([p('An elevated box spanning the whole grid.')], 'elevated')], 2)]),
            ]),
        ],
    },
    {
        slug: 'zz-10-mixed-media-row',
        title: 'zz 10 — Image, gallery and text in one row',
        probe: 'mixed media sizing inside a single row',
        template: 'photo-essay',
        body: [
            h(2, 'Mixed media'),
            grid([
                row([
                    cell([img(pick(L, 9), { frame: '4-3' })]),
                    cell([gallery([pick(P, 6)], 2)]),
                    cell([gallery([pick(P, 7), pick(P, 8)], 2)]),
                ]),
            ], { cols: [2, 1, 1] }),
            p('The middle cell is a one-image gallery — the exact shape that used to render at a quarter width.'),
        ],
    },
    {
        slug: 'zz-11-edge-cases',
        title: 'zz 11 — Edge cases: a span at every edge',
        probe: 'off-by-one errors at the first and last row and column',
        template: 'minimal-journal',
        body: [
            h(2, 'Spans at the edges'),
            grid([
                row([cell([p('top-left spans down')], 1, 2), cell([p('b')]), cell([p('top-right spans down')], 1, 2)]),
                row([cell([p('middle')])]),
                row([cell([p('d')]), cell([p('e')]), cell([p('f')])]),
            ], { cols: [1, 1, 1], borders: 'lines' }),
            p('A single cell grid follows.'),
            grid([row([cell([p('alone')])])], { cols: [1] }),
        ],
    },
    {
        slug: 'zz-12-mixed-heights-crops',
        title: 'zz 12 — Fixed rows with hand-positioned crops',
        probe: 'the masonry goal: a whole section on one screen',
        template: 'photo-essay',
        body: [
            h(2, 'Three images, one screen'),
            grid([
                row([
                    cell([img(pick(P, 4), { frame: 'fill', focusY: 15 })]),
                    cell([img(pick(P, 5), { frame: 'fill', focusY: 30 })]),
                ], { height: 'custom', customHeight: 300 }),
                row([cell([img(pick(L, 2), { frame: 'fill', focusY: 45 })], 2)], { height: 'custom', customHeight: 200 }),
            ], { cols: [1, 1] }),
            p('This paragraph should still be on screen under the images.'),
        ],
    },
];

/* ------------------------------------------------------------------- write */
(async () => {
    await mongoose.connect(process.env.MONGO_URI);
    const db = mongoose.connection.db;

    const images = (await db.collection('media')
        .find({ mediaType: 'Image', status: 'Ready', width: { $gt: 0 }, publicUrl: { $ne: null } })
        .project({ publicUrl: 1, width: 1, height: 1 }).toArray())
        .map((m) => ({ id: String(m._id), src: m.publicUrl, width: m.width, height: m.height, ar: m.width / m.height }));
    P = images.filter((m) => m.ar < 0.95);
    L = images.filter((m) => m.ar > 1.05);
    if (!P.length || !L.length) throw new Error('need both portrait and landscape images in the media library');

    // Borrow identity from an existing post rather than hard-coding ids.
    const seed = await db.collection('blogposts').findOne({ slug: { $not: /^zz/ } }, { projection: { author: 1, coverImage: 1 } });
    if (!seed) throw new Error('no existing post to take an author and cover from');
    AUTHOR = seed.author;
    COVER = seed.coverImage;

    const col = db.collection('blogposts');
    const LAYOUTS = buildLayouts();
    const removed = await col.deleteMany({ slug: /^zz-\d\d-/ });
    if (process.argv.includes('--clean')) {
        console.log(`removed ${removed.deletedCount} fixtures`);
        await mongoose.disconnect();
        return;
    }

    const now = new Date();
    const docs = LAYOUTS.map((l) => ({
        title: l.title,
        slug: l.slug,
        content: `<p>${l.probe}</p>`,       // cache is a fallback; the React path reads contentJson
        contentJson: { type: 'doc', content: l.body },
        excerpt: `Grid fixture — probes ${l.probe}.`.slice(0, 200),
        template: l.template,
        author: AUTHOR,
        category: 'Planning Guides',
        coverImage: COVER,
        status: 'Draft',
        tags: ['zz-fixture'],
        createdAt: now,
        updatedAt: now,
        __v: 0,
    }));
    await col.insertMany(docs);
    console.log(`inserted ${docs.length} fixtures:`);
    LAYOUTS.forEach((l) => console.log(`  ${l.slug.padEnd(26)} ${l.probe}`));
    await mongoose.disconnect();
})();
