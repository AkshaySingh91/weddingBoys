# 03 — Inconsistency Matrix

**Method.** Every row is one **rendered instance** at 1440×900, classified by
role and fingerprinted by its visual contract (background, foreground, radius,
padding, type, border). Two instances of the same component with different
fingerprints are two different components as far as a visitor's eye is concerned.
Source: `audit/_data/_components.json`.

## Same component, N different treatments

| Component | Instances | Distinct treatments | Ratio |
|---|---:|---:|---:|
| **Button** | 136 | **35** | 1 treatment per 3.9 buttons |
| **Card** | 123 | **24** | 1 per 5.1 cards |
| **Chip / tag** | 126 | **9** | 1 per 14 chips |
| **Input** | 28 | **4** | 1 per 7 inputs |

---

## 1. Buttons — 35 treatments for 136 buttons

### 1.1 The two primary CTAs in the *global footer* disagree with each other

Both appear on all 11 pages, both coral, both pill, both 12px/600 — and their
padding differs:

| Label | Background | Padding | Where |
|---|---|---|---|
| **Subscribe** | `#FF5353` | `8px 24px` | `Component/Footer.jsx` newsletter |
| **Inquire for Your Date** | `#FF5353` | `10px 20px` | `Component/Footer.jsx` CTA |

Same file, same visual language, two different box models. Rendered 11 times
each across the site.

### 1.2 Three corals across three button roles

| Role | Colour | Treatment | Page |
|---|---|---|---|
| Footer primary CTA | `#FF5353` | filled pill, white text | all |
| "View Complete Package" | `#FF6969` | **text-only, no background**, 500 weight | home |
| Film-detail tag pill | `#FF6969` @10% | tinted pill | film-detail |

A luxury buyer reads `#FF5353` and `#FF6969` as the same intent rendered
inconsistently, because that is exactly what it is.

### 1.3 The most common "button" is not a button

44 of 136 instances share `bg #4E2818 / fg #D6D3D1 / radius 9999px / padding 8px`
with **empty text** — these are the footer's social icon circles. They are the
single largest button cohort on the site and carry no label (see
`05-ACCESSIBILITY.md`).

### 1.4 The Contact page's Submit is the weakest CTA on the site

| | Contact "Submit" | Footer "Inquire for Your Date" |
|---|---|---|
| Background | `#5E6572` (slate grey) | `#FF5353` (coral) |
| Source | `ContactClient.jsx:329` (`bg-tertiary`) | `Footer.jsx` |

The primary conversion action on the primary conversion page is rendered in a
grey that appears nowhere else in the brand. Every decorative "View All" outranks
it visually.

---

## 2. Chips / tags — one concept, four visual systems

The "tag" concept renders four different ways, and **two of them appear in the
same row**:

| # | Background | Border | Type | Page | Instances |
|---|---|---|---|---|---:|
| 1 | `#FEF4EE` (warm cream) | `1px #D1D5DB` (cool grey) | 14px/20px 400 | `/photos` | 45 |
| 2 | `#CBD5E1` (slate) | `1px #9CA3AF` | 14px/20px 400 | `/photos` — the **"+5 more"** chip | 15 |
| 3 | `#F3F4F6` (grey) | `1px #64748B` | **16px**/24px 400 | `/allfilms` | 39 |
| 4 | `#FF6969` @10% | none | 12px/16px 400 | `/film-detail` | 9 |

**Row 1 vs row 2 is the sharpest single finding in this document.** On `/photos`,
a tag row renders `Tilak` `West India` `Outdoor` in warm cream — and the `+5 more`
chip immediately beside them in slate grey with a different border. Same row,
same component, different design system. Evidence:
`photos: div.tags.flex.flex-wrap > div.bg-slate-300.border.rounded-full`.

Rows 1 and 3 are the same component (a taxonomy tag on a listing card) rendered
2px apart in type size and in two unrelated greys on two pages a click apart.

---

## 3. Inputs — 4 treatments, no shared control language

| Page | Background | Radius | Border | Type | Padding |
|---|---|---:|---|---|---|
| `/contact` | `#FFFFFF` | `6px` | `1px #D1D5DB` | 14px/20px | `12px` |
| `/allfilms` | `#FFFFFF` | `4px` | `1px #E5E7EB` | **16px**/normal | `8px` |
| `/varanasi` | transparent | `0px` | **none** | 18px/28px **300** | `16px 0` |
| footer newsletter | transparent | `0px` | none | 12px/16px | `6px 8px` |

Four radii (0/4/6px), three border colours, four type sizes. A form control
should be the most standardised element in a system; here it is among the least.

Note `/varanasi` again asserting its own language: a borderless 300-weight
18px field belongs to a different product.

---

## 4. Cards — 24 treatments for 123 cards

Radius alone takes **six values** across cards: `6, 8, 12, 16, 24px` plus `0`.
Padding takes `0, 8, 24, 32, 40px`. Borders are variously `none`, `1px #E5DCD3`
(warm, the token), `1px #F3F4F6` (cool), `1px #CBD5E1` (slate).

| Page | bg | radius | padding | border |
|---|---|---:|---|---|
| `/photos` gallery card | `#E9E9E4` | 6px | 8px | `1px #CBD5E1` |
| footer newsletter (all pages) | transparent | 16px | `32px 40px` | `1px #E5DCD3` |
| `/dharaa` menu card | `#FFFFFF` | 16px | 0 | `1px #F3F4F6` |
| `/home` stat card | `#FDFAF6` | 16px | 32px | none |
| `/home` feature card | `#FFFFFF` | **8px** | 24px | none |
| `/home` package card | transparent | **24px** | 32px | none |
| `/weddings/[city]` venue card | `#FFFFFF` | 16px | 24px | `1px #E5DCD3` |

Three different card radii **on the home page alone** (8, 16, 24px).

The only cards using the config's warm `studio.border #E5DCD3` are the footer
newsletter and `/weddings/[city]` — the two most recently built surfaces. Every
older card uses a cool grey.

---

## 5. Headings

186 heading instances at 1440. The heading system splits by *page*, not by level:
`/varanasi` sets headings in Cormorant Garamond, the footer in Playfair Display,
every other page in Inter. An `<h2>` therefore has no consistent appearance —
its typeface depends on which page it is on.

---

## 6. What this means

A design system's job is to make "the same thing" look the same. Measured
against that single criterion:

- a button has **35** appearances
- a card has **24**
- a tag has **4**, two of which sit side by side in one row
- a text input has **4**
- an `<h2>` has **3** typefaces

None of this is the result of deliberate variation. The consistent pattern is
that each page was built as its own artefact, and the config's `studio.*` palette
— which would have prevented most of it — arrived after these pages were written
and was never retrofitted.
