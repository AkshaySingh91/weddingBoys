# 05 — Accessibility (WCAG 2.2 AA)

Measured in headless Chrome across 11 pages × 4 viewports. Contrast ratios are
computed from rendered `color` against the first opaque ancestor background
(relative luminance, WCAG formula). Keyboard traversal is 45 real Tab presses per
page with the focus indicator read from the focused element's computed style.

## Summary

| Criterion | Result |
|---|---|
| 1.4.3 Contrast (minimum) | **Fail** — 122 measured failures, 5 at 1.0:1 |
| 1.4.11 Non-text contrast | **Fail** — primary CTAs at 3.17:1 |
| 1.3.1 Info & relationships | **Fail** — 3 pages with no `<h1>`, 1 page with 4 |
| 2.4.1 Bypass blocks | **Fail** — no skip link; no `<header>` landmark on 10 of 11 pages |
| 2.1.1 Keyboard | **Fail** — contact form cannot be submitted by keyboard |
| 2.4.7 Focus visible | **Partial** — browser default only, nowhere designed |
| 2.5.8 Target size (min) | **Fail** — 13–25 targets under 24px on every page |
| 2.2.2 Pause, stop, hide | **Fail** — 46 infinite animations, no control |
| 2.3.3 Animation from interactions | **Fail** — reduced motion ungated for 31 of 33 motion files |
| 1.1.1 Non-text content | **Pass** — 0 images missing `alt` across the site |

---

## 1. Contrast — the defining accessibility problem

### 1.1 Five text elements measure 1.0:1 — the theoretical minimum

`#FFFFFF` text on an effective background of `#FFFFFF`:

| Page | Text | Size |
|---|---|---|
| `/team` | **"Meet Our Visionaries"** (h1) | 48px |
| `/team` | "Yogesh Dubey", "Founder", "Aman Singh" | 14–18px |
| `/about-us` | "Yogesh Dubey", "Aman Singh", "Founder" ×2 | 18–30px |
| `/` | "20 December", "Daman", "Anshu & Abhishek", "Ahemdabad" | 22–24px |

These are white captions placed over photographs with **no scrim, no gradient and
no background colour**. They are readable only where the photograph beneath
happens to be dark. Legibility is delegated to the image.

`/team` is the clearest case: **19 low-contrast instances**, and its page heading
is one of them.

### 1.2 The two site-wide CTAs fail on all 11 pages

| Text | Colour | On | Size | Ratio | Needs |
|---|---|---|---|---:|---:|
| **"Subscribe"** | `#FFFFFF` | `#FF5353` | 12px | **3.17** | 4.5 |
| **"Inquire for Your Date"** | `#FFFFFF` | `#FF5353` | 12px | **3.17** | 4.5 |

Both live in the global footer, so both fail on every page of the site. White on
`#FF5353` maxes out at 3.17:1 — it cannot pass at this size by any adjustment
short of changing one of the two colours.

### 1.3 The brand tagline fails on all 11 pages

"MUMBAI'S PREMIER WEDDING FILMMAKERS" — `rgba(244,63,94,0.8)` on `#FFFFFF`,
12px — **3.67:1**.

### 1.4 Other notable failures

| Page | Text | Ratio | Needs |
|---|---|---:|---:|
| `/audit-probe-nonexistent-route` | **"404"** at 128px, `#000000` on `#111827` | **1.18** | 3.0 |
| `/films/[id]` | **"Khusboo & Vedant"** (h1) `#FF6969` on white, 36px | **2.81** | 3.0 |
| `/about-us` | timeline years `#FFFFFF` on `#FF6969`, 20px | **2.81** | 4.5 |
| `/contact` | intro copy `#9CA3AF` on white, 16px | **2.54** | 4.5 |
| `/dharaa-…` | "Explore Packages" / "Contact Us", `#EA580C` ↔ white | **3.56** | 4.5 |
| `/varanasi` | "Claim 20% Off & Send Story" on `#EB4B55` | **3.70** | 4.5 |
| `/weddings/udaipur` | venue meta `#78716C` on `#F7F4EF`, **10px** | 4.37 | 4.5 |

**The pattern:** `#FF6969` on white is 2.81:1 and white on `#FF5353` is 3.17:1.
Neither brand red can carry white text at body size, and neither can sit on white
at body size. Every CTA on the site inherits one of these two impossible pairings.

### 1.5 Text over imagery — 296 instances, contrast unmeasurable by definition

| Page | Instances |
|---|---:|
| `/` | **107** |
| `/varanasi` | 49 |
| `/dharaa-event-management` | 28 |
| `/about-us` | 15 |
| `/weddings/udaipur` | 10 |
| others | 5–9 each |

Where text sits over a photograph, contrast is a property of the photograph, not
the CSS — so it cannot be guaranteed and cannot be tested statically. The site has
no scrim convention, which makes all 296 unverifiable.

---

## 2. Document structure

| Page | `<h1>` | Issue |
|---|---:|---|
| `/` | **4** | first heading on the page is an `<h2>`; the `<h1>` is "Our Films" |
| `/photos` | **0** | only content heading is "YOU HAVE REACH THE END !" |
| `/photos/[id]` | **0** | first heading is "More like this" |
| `/search-result` | **0** | every heading belongs to the footer |
| `/allfilms`, `/contact`, 404 | 1 | h1 → h3 skip (no `<h2>`) |
| `/about-us` | 1 | h1 → h3 skip |
| `/varanasi` | 1 | h2 → h4 skip |

### Landmarks

`header: 0` on **10 of 11 pages** — the masthead is a `<div>`
(`app/(site)/layout.jsx:13`), so there is no banner landmark to navigate to.
`/weddings/[city]` is the exception, and it has the opposite problem: **two
`<main>` elements**, which is invalid.

**No skip link exists on any page.** With 45 tab stops before content on most
pages, a keyboard user traverses the entire navigation and hero on every
navigation.

---

## 3. Keyboard

464 tab stops measured across 11 pages.

- **460 show a focus indicator; 4 show none** (2 on `/contact`, 2 on
  `/films/[id]`).
- Every one of the 460 is the **browser's default** ring — measured values
  include `outline: auto 1px rgb(0, 95, 204)` and `auto 2px rgb(122, 59, 132)`.

So the accurate finding is not "focus is missing" but: **no focus state has been
designed anywhere on the site.** Consequences: the indicator is a blue/purple
that belongs to no part of this warm palette, it differs between element types
(1px vs 2px, two colours), it varies by browser, and on coral or photographic
backgrounds a thin blue outline is close to invisible.

### Keyboard blocker

`/contact` — the enquiry form cannot be submitted with the keyboard. The button
is `type="button"` and the `<form>` has no `onSubmit`
(`ContactClient.jsx:327`), so **Enter does nothing in any field**. WCAG 2.1.1
failure on the site's conversion path.

---

## 4. Target size (2.5.8, 24×24 minimum)

Failures on **every page**, 13–25 per page, worst on mobile:

| Page | < 24px targets |
|---|---:|
| `/` (mobile) | **25** |
| `/` (desktop) | 20 |
| `/contact`, `/films/[id]` | 16 |
| `/weddings/[city]` | 14 |
| all others | 13 |

Examples: `Our Films` (1392×**20**), `Explore Gallery` (353×**21**, six
instances), nav `Home` (34×**15**).

The floor of 13 on every page comes from the global footer, so it is a
single shared defect repeated site-wide.

---

## 5. Motion

`prefers-reduced-motion` **is** honoured in three places:

- `app/globals.css:27` — but only `html { scroll-behavior: auto }`
- `app/(site)/_home/HeroCarousel.jsx:62-72` — gates hero video autoplay
- `Component/media/SequenceAnimator.jsx:149` — renders a static first frame

Against that:

- **25 files** import `framer-motion`, **6** import `gsap` — 31 motion-using
  files, of which **2** consult the preference
- **46 occurrences of `repeat: Infinity`** across the public site

Two run on every page or on the conversion page:

1. **`Component/Background.jsx`** — 15 petals and 3 flares on infinite loops,
   mounted in `app/(site)/layout.jsx:11`, i.e. **every public page**.
2. **`ContactClient.jsx:18`** — 12 firework particles, `repeat: Infinity`,
   `repeatDelay: 1.5`, in `#ff8800`.

Neither can be paused, stopped or hidden (WCAG 2.2.2), and neither stops under
reduced motion (2.3.3).

At the CSS level only Tailwind's `animate-pulse` skeletons continue under reduce
(15 sampled on `/search`, 1 on `/`) — minor next to the JS-driven loops above.

---

## 6. What passes

- **Alt text: 0 images missing `alt`** across all 11 pages. Genuinely good.
- **No horizontal overflow** at any of the four viewports on any page — the
  responsive grid work is sound.
- Font weights are a coherent set.
