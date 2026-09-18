# 01 — Design Token Inventory

**Method.** Every value below is a **computed style**, read from the rendered DOM
in headless Chrome, not from a class name or a config file. 11 public pages were
swept at four viewports (390×844, 768×1024, 1440×900, 1920×1080); the corpus is
**14,838 element observations**. Raw data: `audit/_data/_tokens.json`,
regenerate with `node audit/_tools/analyze.mjs`.

**Headline.** A coherent design system *exists in the config* and the public site
does not use it. `tailwind.config.js` defines a `studio.*` palette (canvas,
surface, card, border, ink, terracotta, gold, coral, cocoa). Across
`app/(site)/` + `Component/` there are **29** references to those tokens and
**511** arbitrary `[#hex]` classes — tokens account for **5.4%** of colour
decisions. By contrast the blog subsystem (out of scope, recently rebuilt) uses
those tokens **286** times. The drift is not an absence of a system; it is a
system that was never adopted here.

---

## Verdict table

| Category | Distinct values rendered | A disciplined system | Excess |
|---|---:|---:|---:|
| Colour (text + background + border) | **176** | ~24 | 7.3× |
| Font size | **37** meaningful (107 incl. generated) | 8–10 | ~4× |
| Line height | **132** (30 as px) | 5–6 | 22× |
| Letter spacing | **52** | 4–5 | 10× |
| Spacing (margin/padding) | **41** | 8–10 | 4× |
| Container max-width | **25** | 2–3 | 8× |
| Border radius | **10** | 4–5 | 2× |
| Box shadow | **18** | 3–4 | 4.5× |
| Transition duration | **9** | 2–3 | 3× |
| z-index | **9**, unscaled | 4–5 named | — |
| Font family | **5 typefaces**, 3 Inter stacks | 2 | 2.5× |
| Font weight | 6 | 4–6 | ✅ within range |
| Border width | 6 | 3 | 2× |

---

## 1. Colour

**176 distinct colour values**: 58 text, 80 background, 38 border.

### 1.1 The brand is not one colour — it is six reds and nine golds

Counted from source literals in `app/(site)/` + `Component/` (95 distinct hex
literals in total):

| Red / coral | Uses | | Gold / amber | Uses |
|---|---:|---|---|---:|
| `#FF6969` | 125 | | `#FFD700` | 43 |
| `#FF5353` | 24 | | `#C9973A` | 14 |
| `#EB4B55` | 21 | | `#FCF6BA` | 11 |
| `#E8600A` | 14 | | `#C29555` | 9 |
| `#FF4D4D` | 8 | | `#E2BC6E` | 7 |
| `#FF8800` | 1 | | `#BF953F` | 7 |
| | | | `#FAD7A0` | 6 |
| | | | `#D4AF37` | 5 |
| | | | `#B38728` | 4 |

`#FF6969` is the de-facto primary by volume (125 uses) but `#FF5353` is the one
promoted into `tailwind.config.js` as `studio.coral`. The two differ by 22 points
of green — close enough to look like a rendering error side by side, far enough
to be visibly wrong.

**Suggested direction:** one coral, one gold, both tokenised.

### 1.2 The neutral palette is Tailwind's default cool grey inside a warm brand

This is the likeliest single cause of the "something feels off" complaint. The
page ground is warm cream (`#FAF6EE`, `#FEF4EE`, `#FFF0E6`); the greys sitting on
it are Tailwind's blue-tinted `slate-*` / `gray-*` defaults:

| Value | Tailwind name | Role | Occurrences |
|---|---|---|---:|
| `#E5E7EB` | `gray-200` | **default border colour for the whole site** | 13,489 |
| `#94A3B8` | `slate-400` | gallery skeleton blocks | 308 |
| `#374151` | `gray-700` | body text | 615 |
| `#4B5563` | `gray-600` | body text | 392 |
| `#1F2937` | `gray-800` | headings | 308 |
| `#CBD5E1` | `slate-300` | gallery tag chips | 171 |
| `#D1D5DB` | `gray-300` | borders | 306 |
| `#9CA3AF` | `gray-400` | muted text | 98 |
| `#F3F4F6` | `gray-100` | film tag chips | 168 |
| `#64748B` | `slate-500` | borders | 156 |

`#E5E7EB` at 13,489 occurrences is Tailwind Preflight's universal border colour —
it is *inherited* by every element and only paints where a border-width is set.
The finding is not "13,489 visible grey borders"; it is that **every element
given `border` without an explicit colour receives a cool grey** that does not
belong to this brand.

Warm equivalents already exist in the config (`studio.border #E5DCD3`,
`studio.inkMuted #78716C`) and are used 126 and ~0 times respectively on the
public site.

### 1.3 Near-duplicate darks

`#000000` (5,389 — the single most-used text colour), `#0A0705` (24 authored),
`#1C1410` (10), `#1C1917` (248 computed), `#2F2F2F` (430), `#2A160F` (43),
`#4E2818` (172). Seven near-black values; pure `#000000` is used more than all
the brand-considered darks combined.

---

## 2. Typography

### 2.1 Five typefaces, two of them on a single page each

| Family | Occurrences | Pages | Notes |
|---|---:|---:|---|
| Inter | 11,395 + 2,795 + 6 | 11 | **three different fallback stacks for one typeface** |
| Playfair Display | 173 | 11 | fallback chain also names *DM Serif Display* — a 4th serif |
| ui-monospace | 301 | 11 | |
| Cormorant Garamond | 156 | **1** | `/varanasi` only |
| Cinzel | 12 | **1** | `/varanasi` only |

**`/varanasi` is a third design language.** It is not a variation on the site's
type — it introduces two typefaces used nowhere else, across ten section
components (`app/(site)/varanasi/_sections/*.jsx`). The site therefore runs:
a coral/Inter system (home, films, contact), a brown-gold/Playfair editorial
system (footer, newsletter), and a Cormorant/Cinzel system (Varanasi).

### 2.2 The type scale is not a scale

37 distinct integer font sizes carrying 99.3% of all text:

```
8  9  10  11  12  14  16  17  18  20  22  24  26  28  30  32  36  40  42
44  48  50  56  60  64  65  70  72  84  100  120  128  160  180  260  300  400
```

No modular ratio survives contact with this list. The tells are the adjacent
near-duplicates that no scale generates: **42 and 44**, **48 and 50**, **64 and
65**, **28 and 30**. `64px` and `65px` are not a decision; they are two people.

A further **70 fractional sizes** (e.g. `35.5584px`, `27.7999px`, `53.198px`)
come from randomised decorative glyphs in `#whyToChooseUs` and `#pricing`
(`div.absolute.text-[#FF6969]/10`) — 105 occurrences. Excluded from the scale
count above; noted so the 107 raw figure is not mistaken for 107 deliberate sizes.

### 2.3 Line height and tracking are unmanaged

**132 distinct line-heights** and **52 distinct letter-spacings** against 37 font
sizes. There is no size→leading pairing; leading is set ad hoc per element.

### 2.4 Weights — the one healthy axis

400 (12,657), 700 (1,197), 600 (1,045), 500 (298), 300 (276), 800 (64). Six
weights is defensible. **This is the only token category already in good shape.**

---

## 3. Spacing

**41 distinct margin/padding values**, 13,734 occurrences. A 4px base unit is
*mostly* observed — the six most common values are 8, 12, 4, 16, 24, 32px
(11,757 of 13,734 occurrences = 86%).

**10 values break the 4px grid:** `2, 6, 10, 14, 151.92, 198, 225.28, 237.6,
2110, 2250`. **17 break an 8px grid.**

Twelve values exceed 700px (`780, 1536, 2110, 2250, 2560, 2700, 2880, 3376, 3600,
3840, 4096, 4320`) — section-scale offsets, largely the Varanasi
horizontal-scroll panels.

**Verdict:** the atom scale is healthier than it looks; the *section rhythm* is
ad hoc. The fix is a section-spacing scale, not a rebuild of the base unit.

---

## 4. Layout — no canonical container

**25 distinct `max-width` values.** The page-container candidates alone:

| Value | Occurrences | |
|---|---:|---|
| `1280px` | 97 | `max-w-7xl` |
| `1152px` | 55 | `max-w-6xl` |
| `1400px` | 49 | arbitrary |
| `1904px` | 4 | arbitrary |
| `1424px` | 4 | arbitrary |
| `100%` | 505 | unbounded |

Five different "full-width container" answers means the left edge of content
moves between pages. A visitor navigating Home → Films → Contact sees the text
column jump.

---

## 5. Radius, borders, shadows, motion, layering

**Radius — 10 values:** `0, 2, 4, 6, 8, 12, 16, 24, 32, 9999px`. `2px` and `6px`
are off any 4px progression.

**Border width — 6 values:** `0, 1, 2, 4, 6, 8px`. `6px` and `8px` are single-use
outliers.

**Box shadow — 18 distinct**, all Tailwind ring/shadow composites, many differing
only in the alpha of an invisible ring layer. Effectively ~6 visually distinct
elevations expressed 18 ways. No elevation scale.

**Motion — 9 durations** (`0.075, 0.1, 0.15, 0.2, 0.3, 0.5, 0.7, 1s`) and 3
easings. `0.15s` dominates (1,423) as Tailwind's default; the rest are per-component
choices. There is no motion language.

**z-index — 9 values, unscaled:** `auto, 0, 1, 10, 20, 30, 50, 1000, -10, -50`.
`z-1000` (45 occurrences) is an escape hatch; `-50`/`-10` push the global
`<Background />` behind content. No named layer scale exists, so every new
overlay is a guess.

---

## 6. Breakpoints — defined vs used

`tailwind.config.js` inherits Tailwind's defaults (`sm 640`, `md 768`, `lg 1024`,
`xl 1280`, `2xl 1536`). Usage is skewed: `sm:` and `lg:` dominate, `md:` is
sparse, and several components use `sm:` as though it meant "small screens"
rather than "≥640px" — for example the WhatsApp button
(`app/(site)/contact/_components/ContactClient.jsx:34`) is
`fixed lg:bottom-4 lg:right-4 sm:bottom-10 sm:right-4` with **no base value**, so
below 640px it is `position: fixed` with `bottom/right: auto` and does not pin at
all. This is a mobile-first inversion, and it recurs.
