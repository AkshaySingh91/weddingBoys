# Grid test blogs

Thirteen layouts built to stress the grid, each targeting something that can
break. They are **Drafts** — nothing here is on the public journal — and they are
kept rather than deleted so the layouts can be reviewed.

Open any of them in the editor from the links below. That link is permanent; no
token, no expiry.

| Layout | Slug | What it is meant to break |
|---|---|---|
| [zz 01 — Hero, two stacked left, one tall right](http://localhost:3000/admin/blogs/edit/6aa5801cc467ab097714a631) | `zz-01-hero-and-row-span` | THE layout that prompted the rebuild — a cell spanning two rows |
| [zz 02 — Comparison pair from unequal sources](http://localhost:3000/admin/blogs/edit/6aa5801cc467ab097714a632) | `zz-02-comparison-pair` | two images the same size when the originals are not |
| [zz 03 — Three step cards, container per cell](http://localhost:3000/admin/blogs/edit/6aa5801cc467ab097714a633) | `zz-03-step-cards` | a container nested inside a cell |
| [zz 04 — Pricing table, 4 x 4, borders, mobile scroll](http://localhost:3000/admin/blogs/edit/6aa5801cc467ab097714a634) | `zz-04-pricing-table` | borders and the keep-columns mobile mode |
| [zz 05 — One image spanning three rows beside text](http://localhost:3000/admin/blogs/edit/6aa5801cc467ab097714a635) | `zz-05-magazine-spread` | a tall span against several short rows |
| [zz 05b — Indented text left, image plus two below right](http://localhost:3000/admin/blogs/edit/6aa5801cc467ab097714a636) | `zz-05b-text-beside-stack` | the original brief's hardest case |
| [zz 06 — Full-width hero then a four-cell info row](http://localhost:3000/admin/blogs/edit/6aa5801cc467ab097714a637) | `zz-06-hero-info-row` | a full span above very narrow cells |
| [zz 07 — 1:2 text and image at a fixed row height](http://localhost:3000/admin/blogs/edit/6aa5801cc467ab097714a638) | `zz-07-fixed-row-height` | the new row-height lever, and what follows staying on screen |
| [zz 08 — Portrait beside landscape, both framed](http://localhost:3000/admin/blogs/edit/6aa5801cc467ab097714a639) | `zz-08-mixed-aspect-frames` | the frame lever and the focal point on a 0.665 next to a 2.071 |
| [zz 09 — Tinted containers inside cells](http://localhost:3000/admin/blogs/edit/6aa5801cc467ab097714a63a) | `zz-09-containers-in-cells` | nesting, padding and background interaction |
| [zz 10 — Image, gallery and text in one row](http://localhost:3000/admin/blogs/edit/6aa5801cc467ab097714a63b) | `zz-10-mixed-media-row` | mixed media sizing inside a single row |
| [zz 11 — Edge cases: a span at every edge](http://localhost:3000/admin/blogs/edit/6aa5801cc467ab097714a63c) | `zz-11-edge-cases` | off-by-one errors at the first and last row and column |
| [zz 12 — Fixed rows with hand-positioned crops](http://localhost:3000/admin/blogs/edit/6aa5801cc467ab097714a63d) | `zz-12-mixed-heights-crops` | the masonry goal: a whole section on one screen |
| [zz probe](http://localhost:3000/admin/blogs/edit/6aa52a4e5f5db5373b3129f6) | `zz-probe` | test |

## Seeing them as a reader

They are Drafts, so the public route needs a preview token. Mint a fresh set
(they last seven days) with:

```bash
cd Backend && node -e "
require('dotenv').config(); const mongoose=require('mongoose'); const jwt=require('jsonwebtoken');
(async()=>{ await mongoose.connect(process.env.MONGO_URI);
  const ps=await mongoose.connection.db.collection('blogposts').find({slug:/^zz-/}).project({slug:1}).toArray();
  const s=process.env.JWT_SECRET||'wb_editorial_secret_2026';
  ps.forEach(p=>console.log('http://localhost:3000/blogs/'+p.slug+'?previewToken='+jwt.sign({postId:String(p._id),slug:p.slug,role:'preview'},s,{expiresIn:'7d'})));
  await mongoose.disconnect(); })();"
```

A preview token now unlocks **only its own post** — it used to open every
unpublished draft in the collection (see the audit, B9).

## Rebuilding them

```bash
node Backend/scripts/build-grid-fixtures.js            # create / replace
node Backend/scripts/build-grid-fixtures.js --clean    # remove them
```

The script pulls real images straight from the media library, so the mix of
aspect ratios is the real one — 0.665 portraits through to a 2.071 panorama,
which is what makes the framing and cropping worth testing at all.

## Why they are not published

This points at the production database. A `zz-*` post set to Published would
appear on theweddingboys.in immediately, which is worse than needing a preview
link. Change `status` on any of them yourself if you want one public.
