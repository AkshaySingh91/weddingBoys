# 15 — Grid and media audit

*Written 12 September 2026, from ten layouts actually built and measured in a
browser at 1440 / 768 / 375 — not from reading the code.*

The grid engine (rows, columns, spans, ratio widths) was finished and the
verdict was *"10% implementation"*. That was right, and this document says why,
what was fixed in response, and what is still missing.

The headline: **the grid governed cells, and nothing governed what was inside
them.** A layout could be assembled but not composed.

---

## 1. What the system can do now

**Grid** — `layoutGrid ▸ layoutRow ▸ layoutCell`, any blocks in a cell.

| Capability | Control | Stored as |
|---|---|---|
| Columns | rail chips, `⊕`, divider drag | `cols: [2,4,3]` — integer ratio units |
| Rows | row rail menu, `⊕`, Tab at the end | `layoutRow` nodes |
| Cell spanning | span handles on the focused cell | `span` |
| **Row height** | row menu → Auto / Short / Medium / Tall / Custom | `height`, `customHeight` |
| Gutter | Options → Gap | `gap` |
| Vertical alignment | Options → Align (**default `stretch`**) | `align` |
| Published borders | Options → Borders (None / Lines / Boxed) | `borders` |
| Phone behaviour | Options → On mobile (Stack / Keep columns) | `mobile` |

**Media** — `inlineMedia`, controls on the selected image.

| Capability | Control | Stored as |
|---|---|---|
| **Shape** | Natural / 1:1 / 4:3 / 3:2 / 16:9 / 3:4 / 2:3 / Fill cell | `frame` |
| **Crop anchor** | Keep centre / top / bottom / left / right | `focus` |
| Alignment | full / center / float left / float right | `align` |
| **Badge** | text + tone (neutral / positive / negative) | `badge`, `badgeTone` |
| LCP hint | priority toggle | `priority` |

**Container** — a styled box that nests inside a cell.

| Capability | Control | Stored as |
|---|---|---|
| Look | Plain / Card / Outlined / Tinted / Elevated, or Custom | `variant` + knobs |
| **Head** | a number, an icon from a curated set, a label | `marker`, `icon`, `label` |

Ratios and heights travel to every render path as inherited custom properties
(`--wb-cols`, `--wb-gap`, `--wb-align`, `--wb-row-h`) plus `data-*`, all
allowlisted in the sanitiser and shape-locked so none can carry a payload.

---

## 2. Results, layout by layout

Ten fixtures, `zz-01` … `zz-10`, each targeting one capability. Measured at
1440 and 375. ✅ built as intended · ⚠️ built but needed a workaround.

| # | Layout | Result | Measurement |
|---|---|---|---|
| 01 | Photo essay: 2-up, full-bleed, 1 tall + 2 stacked | ✅ | 436/436 equal, span row 896, stacks in order at 375 |
| 02 | Comparison pair from unequal sources | ✅ | **401/401** — identical from a portrait and a landscape |
| 03 | Three step cards, container per cell | ✅ *(after fix)* | 238/238/238 cells **and** cards |
| 04 | Pricing table 4×4, borders, mobile scroll | ✅ *(after fix)* | 149/149/224/149 = 2:2:3:2; keeps columns at 375 |
| 05 | Indented text left, image + 2 below right | ⚠️ | works, but 116 vs 1271 tall — see gap G1 |
| 06 | Full-width hero then 4-cell info row | ✅ | span 1090 then 255×4 |
| 07 | 1:2 text/image at fixed row height | ✅ *(after fix)* | 352px row, cells 352/352, image fills 624×352 |
| 08 | Portrait beside landscape, both framed | ✅ | **436×327 and 436×327** from a 0.665 and a 2.071 |
| 09 | Tinted containers inside cells | ✅ *(after fix)* | 194/194 equal |
| 10 | Image + gallery + text in one row | ✅ *(after fix)* | 424/212/212 = 2:1:1 |

Layout 08 is the clearest evidence the core complaint is addressed: the tallest
portrait in the library (aspect 0.665) and the widest panorama (2.071), both
framed 4:3, render at exactly the same pixel size. The control row beneath, both
set to `natural`, renders 436×655 against 436×211 — the old behaviour.

---

## 3. Bugs found and fixed

### B1 — "The left image randomly doesn't fill its cell" *(reported)*

Not random, and not a grid bug. Read out of the author's own `zz-probe`:

```
layoutCell span=1 → photoGallery  items=1  columns=2   ← the "small" image
layoutCell span=1 → inlineMedia   1440x1800            ← the "full" image
```

A **Photo Gallery holding one image with `columns: 2`** renders that image at
half the cell width. The author reached for Photo Gallery instead of Studio
Image and got a quarter-width picture with nothing explaining why.

*Fix:* `PhotoGalleryBlock` clamps `columns` to the number of images and a
single image uses a new `grid-1` variant. Verified: that cell went from ~230px
to filling its 468px cell.

### B2 — Media had no size control at all *(reported)*

The image toolbar offered alignment, priority and delete. Nothing else.
`InlineFigureBlock` rendered `h-auto w-full`, so **the file's own pixels decided
the height, always** — and 30 of the 54 usable images are portrait.

*Fix:* the `frame` + `focus` model above, and row height.

### B3 — `fill` collapsed to zero height *(introduced during this work, caught by measuring)*

`fill` was implemented as `height: 100%`. A cell only has a definite height when
its row does, so on a stacked phone layout it resolved to **328×0 — the image
vanished entirely**.

*Fix:* `fill` falls back to a 4:3 shape and becomes a true fill only inside a
fixed-height row. Verified 328×246 at 375px, 624×352 at 1440px.

### B4 — Galleries split a cell that was already a column

The first gallery fix kept two columns on wide viewports. The viewport is the
wrong thing to measure: a **212px cell on a 1440px screen still got two
columns**, rendering images at 100×75.

*Fix:* a gallery inside a cell is always one column. An author who wants two
images side by side adds a column to the row — which is what the grid is for.
Verified 100×75 → 212×159.

### B5 — Ragged cells: cards, containers and bordered tables

`align` defaulted to `start`, so each cell was only as tall as its own content:
step cards measured **214/238/238**, and bordered table cells stopped short of
their row so the rules between them broke.

*Fix:* default `align` is now `stretch` (invisible for plain text or an image —
content still sits at the top — and only visible where a cell has a border or
background), bordered cells force stretch, and a container fills a stretched
cell. Verified 238/238/238.

### B6 — Float alignment inside a cell

`align: left|right` applied `float-left w-1/2 max-w-sm` — a floated half-width
image inside something that is already a column. Existing content escaped only
because every image happened to be `center`.

*Fix:* alignment moved out of Tailwind strings into `.inline-media-*` classes
shared by all three render paths, and one rule neutralises float inside a cell.

### B7 — Tailwind v4 class names on a v3 install

`shadow-xs`, `scale-103`, `scale-104`, `duration-600` — and **19 more found once
a guard was written**, across the media admin, journal components and blocks.
None of them are errors; they simply match nothing and compile to no CSS, so a
shadow or a hover zoom silently never appeared.

*Fix:* the values are now defined in `theme.extend` (keeping the intent — a 2%
hover zoom is deliberately subtler than v3's nearest option of 5%), and
`scripts/check-tailwind-classes.mjs` runs in `prebuild`. It reads the config, so
anything the theme defines is accepted and anything new that isn't fails the
build.

### B8 — `lib/` was never scanned by Tailwind ⚠️ *the biggest find*

```js
content: ['./app/**', './Component/**', './Context/**']   // ./lib is absent
```

`lib/` holds **the entire blog render layer** — all 23 block components and all
four story templates, 29 files. Every Tailwind class used only there generated
no CSS. Those files were styled purely by coincidence, wherever a class also
happened to appear somewhere under `app/`.

Measured consequence: the Editorial Guide cover uses `aspect-[16/8]`, that rule
was absent from the stylesheet, and **the cover rendered 960×0 — invisible on a
live published post.** After adding `./lib/**` and `./Hooks/**`: 960×480.

This one is worth re-reading the whole render layer for. Any block that looks
subtly wrong on the site may simply never have had its styles generated.

### B9 — A preview token unlocked every unpublished post 🔒

```js
if (decoded.role === 'preview' && (decoded.slug === slug || decoded.postId))
```

Every minted token carries a `postId`, so the second clause was **always true**
and any preview link was a master key to every draft in the collection.
Verified: a token minted for one draft rendered two others.

*Fix:* the token must name the post being requested; its `postId` is still
honoured, but only when it identifies that exact document, so a link survives a
rename without becoming a master key. Verified: other posts now 404.

---

## 3b. Round two — row spanning, cropping, and the editor

*12 September 2026. Five problems reported from real use; each reproduced before
being planned, and every fix measured in a browser.*

### B10 — A 240px empty strip beside every article

`EditorialGuide.jsx` reserved a fixed contents column whether or not there was a
contents list — and a grid-led photo post usually has no headings. Measured: the
article began at x=513 with 240px of nothing to its left. The column is now
conditional; the same post begins at x=233 and uses the full 960px measure, and a
post with headings still gets its rail (240px, 8 entries).

### B11 — A fixed row height cropped the image, uncontrollably and with square corners

Two faults behind one symptom. A `natural` image in a fixed-height row simply
**overflowed and the cell clipped it**, so the crop was whatever happened to fall
inside — and because the clip happened at the cell, which has no radius, the
picture came out square-cornered while every other image on the page was
rounded.

*Fix:* media in a fixed row cover-fits instead of overflowing, the radius is a
per-image control (Square / Soft / Rounded / Large), and the crop is positioned
by **dragging the image itself** — stored as exact percentages rather than one of
five keyword presets. Verified: `50% 50%` → drag → `50% 80%`, previewed live and
committed once on release so one gesture is one undo step.

### B12 — Height did not reach the image through the node-view wrappers

`height: 100%` only resolves against a parent with a definite height, and the
editor inserts two wrappers between the cell and the figure. Measured: the cell
was a definite 300px, every wrapper below it `auto`, and the image sat at its
natural 245px inside a 300px row while a 524px one overflowed a 200px row.
Carrying the height with flex instead works through any number of wrappers —
and splits the row correctly when a cell holds two images.

### B13 — The image toolbar was clipped by its own cell

A cell in a fixed row sets `overflow: hidden`, so the toolbar was cut off
mid-control. It now renders through a portal (`FloatingToolbar.jsx`): measured
525px wide inside a 224px cell, whole and on screen. The same component is the
answer to any menu a panel can clip.

Selecting an image also used to shrink it — the toolbar sat in the flow and took
height from the picture (220px against its neighbour's 272px). It floats now.

### B14 — Cells could only expand one way ⚠️ *the rebuild*

`growCell` merged rightward and nothing else: no merge-left, and no vertical
expansion at all, because the layout was built as separate rows — each
`layoutRow` its own CSS grid. That was a deliberate trade in the last round, and
the cost came due: a tall image beside two stacked ones is a row span, and the
model could not express it.

*Fix:* one grid, rows as `display: contents`, and placement computed by the same
occupancy algorithm a table uses for `rowspan` — walk the rows, drop each cell in
the first free slot, mark what it covers. `placeCells` is shared by the editor
and the published page, so the two cannot disagree about where a cell sits.
Cells now expand up, down, left and right, absorbing the neighbour's content
rather than discarding it.

Verified in the browser, both paths: a cell measured 228×**500** spanning a 300px
and a 200px row beside neighbours at 228×300 and 228×200; published, the same
layout renders `span 2/span 1` for the hero and `span 1/span 2` for the tall
right-hand image, and a three-row span in layout 05.

Three bugs surfaced during the rebuild and were fixed:

- **`addColumn` left a hole.** A row *under* a spanning cell still needs its own
  new cell; skipping it widened the grid to three columns while the row beneath
  still covered two.
- **A row must be allowed to be empty.** After deleting a column, a row entirely
  covered by a span from above legitimately has no cells — `layoutCell+` forced
  one in with nowhere to go and it landed outside the grid. The schema is now
  `layoutCell*`, which is the rule a table already follows.
- **`fill` collapsed to nothing at 375px, twice.** First because `height: 100%`
  of an auto cell is zero; then again after the rebuild, because the cover-fit
  rules were not gated to rows that actually have a fixed height. Both measured
  as `328x0`, both now `328x246`.

The headless suite grew to **116 assertions**, and its central check is that
every slot is covered exactly once — no gaps, no overlaps — after every
operation, against grids that already contain row spans.

### B15 — The editor got in the way

- **The canvas never widened.** Zen Focus hid the inspector but both states were
  `max-w-4xl`, so it only re-centred the same column. Measured before: 549px in
  both. Now 549px with the panel open, **991px** closed.
- **The slash menu jumped to the top.** It was pinned `absolute left-6 top-16`;
  pressing `/` halfway down a post threw the reader back up. It now opens at the
  caret, clamped to stay on screen.
- **Five embed commands, one behaviour.** `embed`, `instagram`, `spotify`, `map`
  and `pinterest` all opened the identical modal. One command now.

### B16 — The editor read as a form, not a tool

*"Feels too light", "scroll is not that good", "layout is very ugly".* Four
concrete causes, all measurable.

**Thirty-five controls in a bar that wrapped.** `flex-wrap` meant the toolbar's
height changed with the window, moving the canvas under the cursor mid-edit. It
is now one row that scrolls rather than wraps, and the control count is down to
**20** by three consolidations:

- *Insert.* Five media buttons plus an "Insert Block" dropdown that **hardcoded
  eight entries already present in `slashCommands`** — the same two-lists-drift
  that once left the Layout menu offering blocks the palette had dropped. All of
  it is now one **Insert** button that opens the slash palette at the caret:
  ~210 lines of duplicated menu deleted, one list, and content lands where the
  cursor is. All 23 blocks remain reachable, media included.
- *Block style.* Heading 2/3/4 and Quote were four toggles that showed what they
  DO and never what the current block IS. One select now names it.
- *Typography.* Font, Size, Leading, Tracking and Colour are five labelled
  dropdowns which, measured, took more of the bar than everything else combined
  and forced it to scroll. They sit behind one `Aa` control that reveals them in
  a strip. The bar now overflows by **8px** where it previously could not fit at
  all.

**`* { scroll-behavior: smooth }`** — applied to *every element*, not just
`html`. Every scroll container on the site animated, including the editor canvas,
where ProseMirror scrolls the caret into view on almost every keystroke near an
edge; typing felt like it was dragging behind the cursor. Scoped to `html` for
anchor navigation, explicitly `auto` on the editing surfaces, and honouring
`prefers-reduced-motion`. Next.js warns about the `*` form for this reason.

**The canvas never widened** — see B15.

Still open on the visual side: the surrounding shell is a stack of large rounded
cards rather than an application frame, and the canvas and inspector still share
the page's scroll rather than each owning their own.

---

## 4. What is still missing

Ordered by how often it blocked a reference design. Nothing here is guessed —
each item is something a fixture could not express.

**G1 — No way to balance a column against its neighbour.**
Layout 05 (text left, image stack right) measured 116px against 1271px. Row
height crops the whole row; what is wanted is "make this stack fit beside that
text". *Candidate: a per-cell max height with scroll or crop, or an explicit
"match neighbour" option.*

**G2 — Row-level media cannot share one height budget.**
Layout 01's third row put one tall portrait beside two stacked landscapes:
605 vs 539. Each image is framed correctly on its own; nothing coordinates a
stack against a single image. *Candidate: `fill` distributing the row height
across several images in one cell.*

**G3 — The component blocks the reference designs are made of do not exist.**
The block inventory across the 11 real posts:

```
paragraph 56 · heading 19 · photoGallery 6 · blockquote 4 · inlineMedia 2
embed 1 · pullQuote 1 · atAGlance 1 · faq 1 · enquiryCta 1
layoutGrid 0    ← not one real post uses the grid
```

The designs in the brief — the Varanasi photo essay, the lighting guide's step
cards, the Lake Pichola info card — **do not exist anywhere in the system.**

This is worth stating precisely, because a first pass of this audit wrongly said
they were hardcoded in `lib/blog/templates/`. They are not: the four templates
are 300 lines in total and are layout shells, no more. Checked against the live
article the reference design is drawn from:

```
mastering-wedding-ceremony-lighting-golden-hour-to-sangeet
  content HTML : plain <h2> and <p>, 571 characters
  rendered     : 2 × h2, 2 × h3, 4 × p
  callouts 0 · grids 0 · cards 0 · badges 0 · FAQ 0 · pull quotes 0
```

The reference screenshots are **aspirational designs, not shipped pages**. The
shipped page is unstyled prose. So the gap is not "the editor cannot reach the
templates" — it is that neither the editor nor the templates can produce any of
it, and the distance between what was designed and what ships is the whole of
the design.

**Since this audit was first written, three of those pieces were built** — as
attributes on primitives that already existed, not as new rigid block types,
because three rigid layout presets is exactly what went wrong the first time:

- **Image badge** (`badge` + `badgeTone`) — the pill on a photo. Verified: a
  green tick "GOOD LIGHTING" and a red cross "HARSH LIGHTING" over two 4:3
  frames, which is the lighting guide's comparison section.
- **Container head** (`marker` + `icon` + `label`) — one change that yields both
  a numbered step card (`01 · sun · SUNSET VARMALA`, three cards at 223px each)
  and an info-strip cell (`place · DESTINATION → Udaipur, Rajasthan`).
- **A curated icon set** (`lib/blog/blockIcons.jsx`, 20 wedding-shaped icons)
  shared by the editor's pickers and the renderer, so what is chosen is what
  ships. Deliberately closed: an open library means hunting through a thousand
  glyphs and a post drifting off-brand one icon at a time.

Still missing for a full reproduction: **numbered section markers** above
headings (`01 ———`, "PRO TIP", "REAL WEDDING FEATURE" — this wants an `eyebrow`
attribute on `heading`, which means extending StarterKit's node), a **tip
variant with an icon** on `callout`, **sub-captions** under images, and the
**drop cap**.

**G4 — No caption styling or numbering.** The photo essay numbers its captions
(`01 — 5:18 AM…`). Captions are plain centred text with no variants.

**G5 — Studio Image and Photo Gallery are too easy to confuse.** This caused B1.
The gallery picker should offer "insert as a single image" when exactly one
image is chosen.

**G6 — No presets or reuse.** Every layout is built from scratch each time.
Nothing lets an author save "my comparison pair" and use it again.

**G7 — The editor shows desktop only.** It never stacks, so the author cannot
see what a phone reader gets without publishing and resizing.

---

## 5. Known, unfixed, pre-existing

- **375px horizontal overflow of 77px on every journal page** — the site navbar
  (`md:hidden` menu button reaching 437px), not the grid. Zero grid elements
  overflow at any width.
- `photoGallery` stores `items` in new content and `images` in some older posts;
  the renderer falls back across both, but the editor should normalise on load.
- Admin pages still have no metadata of their own — the login tab shows a blog
  post's title.

---

## 6. How to re-run this

Fixtures are generated, not hand-built, so the whole audit is repeatable:

```bash
node Backend/scripts/build-grid-fixtures.js            # create / replace them
node Backend/scripts/build-grid-fixtures.js --clean    # remove them again
```

1. The script pulls real images straight from the media collection (54 usable,
   aspects 0.665 → 2.071) and borrows an author and cover from an existing post,
   so there are no hard-coded ids to rot.
2. Fixtures are written as **Draft** and viewed through a minted preview token.
   This points at the production database, so nothing is ever published just to
   look at it.
3. Measurement runs in one pass: an iframe resized to each width, reading
   `getBoundingClientRect` per row, cell and image, and checking cell equality,
   stacking, and whether anything spills outside its cell.
4. `--clean` removes them; the 11 real posts are never touched.

---

# Round three — the published article against the reference design

The brief this round was not a capability gap. Put the reference beside what
shipped and the same content, in the same system, read as a draft: the spacing
had no rhythm, the contents rail was on the wrong side and carried nothing else,
and two things the author tried to build (a Pro Tip panel, three step cards) were
impossible or came out broken.

Verification ran in a real Chrome over the DevTools Protocol
(`scratchpad/cdp.mjs`) because the Playwright MCP server would not connect
(`CONNECT_TIMEOUT`). Eleven posts — ten seeded by
`Backend/scripts/seed-layout-suite.mjs`, plus the author's own
`container-test-blog` — at 1440, 768 and 375.

## What was actually wrong

### 1. `line-height: 0.5` — the captions that overlapped

Reported as *"text got trailed & overlap"*. It was blamed on the 20px row
height, and that was wrong. The row was `auto`; the captions carried
`lineHeight: "0.5"` from the editor's custom leading field.

Measured on the live page: `font-size: 17px`, `line-height: 8.5px`. Two
paragraphs of 17px glyphs drawn into 8.5px boxes, so the second printed over the
first. The paragraph boxes measured 17px and 9px tall against `scrollHeight` of
23 and 14.

The field accepted it because it validated nothing. A unitless line height is a
multiple of the font size, so **anything below 1 guarantees overlap** — it is not
a preference to honour, it is an impossible box. `cleanLineHeight` in
`typographyTokens.js` clamps unitless values to [1, 4] and floors lengths, and it
is used in **three** places: the editor control (so it cannot be saved), and
`ParagraphBlock` / `HeadingBlock` (so the posts already carrying `0.5` render
correctly without a migration). 16 unit cases pass.

After: `line-height: 17px`, a 16px gap between the captions, nothing clipped.

### 2. The caption field did not exist

The `caption` attribute was defined on `inlineMedia`, was parsed, was rendered to
HTML, and appeared on the public page — but **the media toolbar had no input for
it**. There was no way to write a caption.

This is the actual reason comparison figures were being built as two paragraphs
stacked in a grid cell beside the image: not a stylistic choice, a workaround for
a missing field. Which in turn is how those paragraphs came to carry a hand-set
line height of 0.5.

Added: `Caption…` and `Sub-caption…` inputs, and a `subCaption` attribute for the
quieter second line the reference uses for credits.

### 3. No vertical rhythm — and the same block disagreed with itself

Block margins ran 20 / 24 / 32 / 40 / 48 / 96px with no scale behind them, and a
gallery was 40px from React but 24px from the HTML cache, because the margin was
written twice in two languages.

Deleted from all eleven block components and from the component CSS. Replaced
with one scale on `.blog-content`, expressed as the gap *between* two things:

```
tight   0.75rem   heading → its first paragraph
flow    1.5rem    paragraph → paragraph
block   2.5rem    around a figure, grid, callout, container, quote
section 4rem      before an H2
```

**A bug this introduced, and how it showed up:** the nested-flow-root override
(`.blog-container`, `.layout-cell`, `.callout` run a tighter rhythm inside) was
first written onto the box itself. A container's own `margin-top` then resolved
`var(--wb-flow-block)` against the value it had just set for its own children, so
it sat 20px below the preceding paragraph instead of 40px — using its inner
rhythm for its outer gap. Measured, not spotted by reading. The override moved to
`> *`: a flow root belongs to its parent's rhythm on the outside and runs its own
on the inside.

Measured after: every gap on every post lands on 0 / 12 / 24 / 40 / 64px. Zero
off-scale gaps across 11 posts × 3 widths, on both render paths.

### 4. The rail was on the left, 240px, and held only a contents list

Now `ArticleRail.jsx`, on the **right**, 300px, with five cards: On This Page →
CTA → Related Guides → Share → Author. Share and author were **removed from the
article body**, where they had been repeated.

- The contents card renders only when the article has headings; the rail itself
  still renders, because the other four cards do not depend on them. Verified on
  `zz-test-06-no-headings`: 4 cards, no contents card.
- Related Guides comes from the existing `getRelatedPosts` (category **or** tag
  match), which needed no change.
- Photo Essay and Real Wedding take the rail **stacked beneath** the article
  (`layout="stacked"`) rather than losing 300px from a deliberately wide layout.
  Real Wedding takes it without the share and author cards, because its
  engagement bar already carries both — the same no-duplication rule.
- Sticky is on an inner box, not the `<aside>`: the aside is a grid item
  stretched to the article's height and has nowhere to travel.

### 5. The numbered section marker existed — for one template

`01 ———` above each H2 was already built, gated to `cinematic-real-wedding`. It
is what makes a long article scan as a sequence, so it now covers Editorial Guide
and Minimal Journal too, numbering derived from each H2's position among the H2s.
The rail's contents list numbers to match.

### 6. Two navbar overflows — found by measuring the article, not the navbar

Not in scope for this round, but every article page scrolled sideways:

| Width | Overflow | Cause |
|---|---|---|
| 768 | **388px** | The desktop nav switched on at `md` (768) but its link row is 572px between a logo and an action group that were both `shrink-0` — it needs ~1156px |
| 375 | **62px** | The masthead wanted ~208px beside a 176px action group inside 343px, neither able to shrink |

Fixed by raising the nav breakpoint to `xl` and letting the masthead flex and
shrink on phones. Worth stating plainly: **zero** of the overflow came from the
article or the rail at any width — `inArticle: []`.

## The regression suite

`Backend/scripts/seed-layout-suite.mjs` creates ten published posts, each
stressing one reported failure. Re-running updates them in place and touches no
other post.

| Slug | What it pins down |
|---|---|
| `zz-test-01-three-step-cards` | grid → container → grid, the nesting that was refused |
| `zz-test-02-pro-tip-panel` | container with custom bg, border, radius, padding |
| `zz-test-03-tiny-row-heights` | 20px rows holding full paragraphs |
| `zz-test-04-row-spans` | a cell spanning two rows beside two single cells |
| `zz-test-05-flow-rhythm` | every adjacency in the spacing scale |
| `zz-test-06-no-headings` | rail present, contents card absent |
| `zz-test-07-many-headings` | 8 sections: marker numbering and scroll-spy |
| `zz-test-08-custom-type` | custom leading, including the 0.5 that overlapped |
| `zz-test-09-deep-nesting` | four levels, past the editor's depth limit |
| `zz-test-10-mixed-media` | captioned images in cells — the overlap case |

---

# Round four — matching the reference design

Round three fixed what was *broken*. This round is about what the page *looks
like*, against the supplied reference. The gap was real: the structure was right
and almost none of the styling was.

`Backend/scripts/seed-reference-post.mjs` builds the reference article inside our
own system — same headings, Pro Tip, badged comparison pair, three step cards,
FAQs, cover legends, rail quote — so the two can be put side by side at the same
width instead of judged from memory. That comparison is what drove everything
below.

## Two bugs the comparison exposed

### An unrecognised frame id rendered the photograph invisible

The reference post was seeded with `frame: '4:3'`. The valid id is `4-3`.
`frameById` falls back to `natural` for an unknown id — whose ratio is `null` —
but the old code asked `frame !== 'natural'` *first*, so an unknown id counted as
**cropped**, took the null ratio, and was therefore also excluded from the
intrinsic-dimensions path. The result: no `aspect-ratio`, `fill` positioning, and
a frame box measured at **362 × 0**. The image had loaded — `naturalWidth > 0` —
and was drawn into a box with no height.

Fixed so the frame's *ratio* decides whether something is a crop, not the
spelling of its id, and with a height of last resort: frame ratio → the shape the
file actually is → 3:2. A photograph can no longer reach the page at zero height
whatever an id says. `fill` is the deliberate exception (it means "take the
cell's height") and gets a CSS floor instead, which also fixes a latent case —
"Fill cell" chosen in an auto-height row had nothing to fill and disappeared the
same way.

After: 362 × **380**.

### The FAQ and CTA had no gap above them at all

Both sit *outside* `.blog-content`, so round three's flow scale never reached
them — the FAQ heading butted directly against the step cards above it.

## What was restyled to match

| Element | Before | Now |
|---|---|---|
| Rail cards | 5, generic | 6, in the reference's order, with the quote card |
| Contents | numbered chips with a filled active bar | flat `1.` list, coral text and a dot in the gutter |
| Consultation CTA | black panel, gold button | blush panel, botanical watermark, coral button, label and footnote |
| Share | outlined circles reading "WA / Pin / Fb" | brand-coloured circular icons |
| Author | "WRITTEN BY" label | "Author" card with avatar, title and Follow |
| Pro Tip | left bar, label stacked above the copy | full panel, circled icon in its own column |
| Comparison badge | top-left, fully coloured pill | bottom-left, white pill with a coloured icon |
| FAQ | uniform closed bars, `max-h-96` | first open, coral edge, +/− , `grid-rows` so long answers cannot clip |
| Prev / next | two cards | one bar: previous, back to the index, next |
| Header | plain pill, black title | icon pill, cocoa title, avatar byline, comment count |
| Cover | bare image | optional corner legends, gradient only when there is text |
| Progress bar | 3px strip | strip plus percentage readout and status line |
| Breadcrumb | stopped at the category | ends on the article |

Two removals, both the same rule as round three's share and author: the page's
bottom **"Related Stories" grid** was fed by the same `getRelatedPosts` call as
the rail's Related Guides card, so the reader was offered identical
recommendations twice a screen apart.

`#FF5353` had been copy-pasted across a dozen files as the brand accent with no
name. It is now `studio.coral`, with `coralDark`, `blush` and `cocoa`.

## Known remaining differences from the reference

Stated plainly rather than claimed as done:

- **Step-card number badges.** The reference sets each step's number in a filled
  circle with a subject icon above the title. Built from the primitives an author
  actually has — a container plus styled paragraphs — the number is coloured text,
  not a badge. Closing this properly means a step-card block; it is not something
  container and grid can express.
- **The decorative "Better Stories / Brighter Memories" script**, excluded by the
  brief as ornament.
- **The dark "Ready to Start Planning?" CTA** is ours, not the reference's. It
  is existing product behaviour and removing it is a content decision.
- **The cover legends and the rail quote need their fields populated**
  (`weddingDetails.tagline`, `.subtitle`, `.flourishQuote`). They render nothing
  when empty rather than inventing a caption for every cover on the site, and the
  quote is never defaulted because attributing invented words to a real person is
  not something a template should do.

---

# Round five — verification in a real browser

Playwright MCP reconnected, so this round is verification rather than building:
the public pages driven and measured directly, and — the part that had been
outstanding since round three — **the editor itself**.

Four defects came out of it, and two of them mattered a great deal.

## 1. The container's whole customisation UI was unreachable

The headline finding. Everything built in round three for the container — free
width, min-height, padding, corner, border width, border colour, background,
brand swatches, custom hex — rendered correctly on the published page and
**could not be opened by an author at all**.

`ContainerView` gated its toolbar on Tiptap's `selected` prop. That prop means a
ProseMirror **NodeSelection** — the node picked up as a single unit. A container
holds blocks, so clicking it lands the caret in a paragraph *inside* it and
creates a TextSelection instead. `selected` stays false. Clicking the box,
clicking its chrome and pressing Escape were all tried in the browser: the
toolbar never appeared.

The same gate hid the **callout's variant picker**, which is why Note → Vendor →
Testimonial had presumably never been changed either — and why the new Pro Tip
and Watch Out variants were equally invisible.

Fixed with one shared hook, `extensions/useNodeActive.js`: a node view is active
when it is selected as a node **or** the selection sits anywhere inside its
range. Wired into both node views.

Verified afterwards in the editor: the callout picker lists all five variants and
switching to Pro Tip applies it; the container toolbar opens with five size
fields and two hex fields, and typing `320px` and `#FDEEE9` produces
`width: 320px; background-color: rgb(253, 238, 233)` on the node.

This is the same failure as round four's missing caption input, twice more: an
attribute that exists, validates, persists and renders, with no way to set it.
Worth a standing check — **a new attribute is not done until something in the UI
can reach it.**

## 2. `max-w-6xl` had gone missing from the article container

The article was rendering 1021px wide at a 1425px viewport with a 32px left
margin. The wrapper's class read `mx-auto px-4 sm:px-6 lg:px-8` — the width
constraint was gone while the comment explaining it survived directly above.

Restored: container 1152px, content 748px, rail 300px — the rail is 27.6% of the
article row, which matches the reference's proportion.

## 3. Cinematic's engagement bar overflowed a phone

Only exposed because the suite now covers all four templates (test 09 moved to
Cinematic for exactly this reason). The loves button plus six share targets came
to 382px on one unwrapping line inside a 360px viewport. It wraps now.

## 4. The Pro Tip callout had lopsided corners in the editor

16px on the left, 12px on the right: the node view hardcoded `rounded-r-xl` on
its wrapper while the panel variants add `rounded-2xl`. Radius moved into each
variant, so margin-note variants round their right edge and panel variants round
all four.

## What was verified clean

- **Geometry** at 1440: container 1152, content 748, rail 300, rail 27.6% of the row.
- **Styling against the reference**: cocoa title, blush/coral category pill with
  icon, Pro Tip panel `#FDEEE9` with a coral border and circled icon, comparison
  badge bottom-left as a white pill with a green/red icon, all five share icons
  in brand colours, blush CTA with a coral button, FAQ first item open with a
  coral edge, `01`/`02` section markers, breadcrumb ending on the article.
- **Scroll behaviour**: rail sticks at 96px, progress reads "38% · A BEAUTIFUL
  STORY AHEAD…" then "94% · THANK YOU FOR READING", scroll-spy marks the current
  section coral with a coral dot in the gutter.
- **All four templates.** Editorial Guide and Minimal Journal take the rail
  beside the content; Photo Essay and Cinematic stack it beneath. Cinematic gets
  three cards only — no share, no author — because its engagement bar carries
  both. Row spans resolve exactly: a rowSpan-2 cell measures 384px against two
  180px cells plus a 24px gap.
- **Responsive**: rail beside content at 1440, stacked below at 768, zero
  horizontal overflow at 1440 / 768 / 375 on every post.
- **The leading clamp at source**: typing `0.5` into the custom leading field in
  the real editor stores `line-height: 1`. The bug that overlapped the captions
  can no longer be created.
- Build, both prebuild guards, eslint on every touched file.

Remaining sweep output is one line — `container-test-blog` has no related-guides
card — which is correct: it is the only post in its category and carries no tags,
so there is nothing to relate and the card hides, exactly as the contents card
does without headings.
