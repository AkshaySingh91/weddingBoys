# 07 — Severity Register

The consolidated backlog. Every defect found across all documents, with a stable
ID. **Severity is judged by damage to an ultra-luxury buyer's trust**, not by
engineering effort.

- **Critical** — actively loses enquiries, or makes the studio look incompetent
- **High** — visibly cheapens the brand or blocks a user
- **Medium** — noticeable, erodes quality
- **Low** — polish

Effort: **S** ≤ half a day · **M** ≤ 3 days · **L** > 3 days

---

## Critical

| ID | Page(s) | Category | Description | Evidence | Sev | Eff | Stage |
|---|---|---|---|---|---|---|---|
| **R-01** | `/contact` | UX / conversion | Invalid submission fails **silently** — the guard has no `else`, so Submit appears inert | `ContactClient.jsx:189` | Critical | S | 1 |
| **R-02** | `/contact` | Accessibility | Form **cannot be submitted by keyboard** — `type="button"`, no `onSubmit` | `ContactClient.jsx:327` | Critical | S | 1 |
| **R-03** | `/contact` | UX / commercial | `/^[0-9]{10}$/` rejects **every international number** on a site advertising worldwide destinations | `ContactClient.jsx:186` | Critical | S | 1 |
| **R-04** | `/contact` | UX | Three mandatory fields carry **no asterisk**; no field has `required` | `ContactClient.jsx:251-320` | Critical | S | 1 |
| **R-05** | all 11 | Accessibility | Both global CTAs fail contrast — `#FFF` on `#FF5353` = **3.17:1** | `Footer.jsx`; computed | Critical | S | 2 |
| **R-06** | `/team`, `/about-us`, `/` | Accessibility | White text over photos with **no scrim** — measured **1.0:1** (incl. `/team`'s `<h1>`) | computed, 5 elements | Critical | M | 2 |
| **R-07** | all pages | IA | **3 of 4 primary nav items are inert on 13 of 14 pages** (`#pricing`/`#process`/`#services` exist only on `/`) | `Navbar.jsx:26-29` | Critical | M | 1 |
| **R-08** | all pages | Positioning | Header says Mumbai, footer says India/worldwide, pricing says **destination surcharge** | `Footer.jsx:105` vs `OfferPackages.jsx:119` | Critical | S | 1 |
| **R-09** | `/varanasi` | Performance | **24.3 MB** page (23.5 MB images, 250 requests) | `_perf-production.json` | Critical | L | 3 |
| **R-10** | `/team` | Performance | **CLS 1.5944** on mobile, traced to the global footer | `_perf-production.json` | Critical | M | 3 |
| **R-11** | 404 | Accessibility | "404" at 128px renders `#000000` on `#111827` = **1.18:1** | computed | Critical | S | 2 |
| **R-12** | `/films` | Content / trust | **"Beach" contains Varanasi and Solapur** — 0 of 2 correct; "North India" 2 of 4 | rendered taxonomy | Critical | S | 1 |
| **R-13** | `/photos` | Content / trust | Page's only content heading is **"YOU HAVE REACH THE END !"**; page has no `<h1>` | `PhotosClient.jsx:86` | Critical | S | 1 |
| **R-14** | all pages | Performance | Custom loader **disables image optimisation** for every local asset | `cloudflareLoader.js:30` | Critical | M | 3 |

## High

| ID | Page(s) | Category | Description | Evidence | Sev | Eff | Stage |
|---|---|---|---|---|---|---|---|
| **R-15** | all pages | Design system | **176 colour values, 37 font sizes, 132 line-heights, 41 spacings, 25 max-widths** | `_tokens.json` | High | L | 2 |
| **R-16** | all pages | Design system | Config's `studio.*` palette used for **5.4%** of colour decisions (29 vs 511 hex) | source count | High | L | 2 |
| **R-17** | all pages | Design system | **Six brand reds, nine golds**; `#FF6969` (125) vs `#FF5353` (24) differ by 22 green | source count | High | S | 2 |
| **R-18** | all pages | Design system | Neutrals are Tailwind's **cool `slate`/`gray`** on a warm cream brand | `#94A3B8`, `#E5E7EB` | High | M | 2 |
| **R-19** | all pages | Design system | **136 buttons → 35 treatments**; 123 cards → 24; chips → 4 | `_components.json` | High | L | 2 |
| **R-20** | `/photos` | Design system | Two chip treatments **inside one row** (`#FEF4EE` tags beside a `#CBD5E1` "+5 more") | computed | High | S | 2 |
| **R-21** | `/about-us` | Design | Hero scrim **authored then commented out**, replaced by a gradient fading the wrong way | `AboutClient.jsx:105` | High | S | 2 |
| **R-22** | all pages | Dev artefact | Truncated base64 placeholder ships to production: `url('data:image/png;base64,iVBORw0KGgo...')` → `ERR_INVALID_URL` | `Background.jsx:46` | High | S | 1 |
| **R-23** | `/`, `/films` | Content | **"Ahemdabad"** misspelling | rendered | High | S | 1 |
| **R-24** | `/team`, `/films/[id]` | Content / trust | Names inconsistently cased; **one person listed twice** ("Swapnil Hatkar"/"Swapnil"; "Suraj Singh"/"suraj singh") | rendered headings | High | S | 1 |
| **R-25** | `/team` | Design | Portraits cropped from **four aspect ratios** into one 294×256 box | computed | High | M | 2 |
| **R-26** | `/films`, `/` | Design | Category rows leave **55.6%** of the viewport empty (fixed 288×256 cards) | measured @1425px | High | M | 2 |
| **R-27** | `/films` | Content | Same two films rendered **four times** across two categories | rendered | High | S | 1 |
| **R-28** | `/films/[id]` | Accessibility | `<h1>` "Khusboo & Vedant" `#FF6969` on white = **2.81:1**; 24 failures on the page | computed | High | S | 2 |
| **R-29** | `/dharaa-…` | Accessibility | `#EA580C` ↔ white = **3.56:1** in both directions; an **8th** brand accent | computed | High | S | 2 |
| **R-30** | all pages | Accessibility | **No `<header>` landmark** (10 of 11) and **no skip link**, with ~45 tab stops before content | `layout.jsx:13` | High | S | 2 |
| **R-31** | all pages | Accessibility | **No designed focus state** — all 460 rings are browser defaults; 4 elements have none | computed | High | M | 2 |
| **R-32** | all pages | Motion / a11y | **46 infinite animations**; reduced motion honoured in **2 of 31** motion files; 18 loops in the global `<Background />` | source count | High | M | 3 |
| **R-33** | `/contact` | Design | Primary CTA is `#5E6572` slate — the weakest button on the site | `tailwind.config.js:54` | High | S | 2 |
| **R-34** | `/contact` | Responsive | WhatsApp button **does not pin below 640px** (no base `bottom`/`right`) | `ContactClient.jsx:34` | High | S | 1 |
| **R-35** | `/search-result` | IA / SEO | **No headings of its own** — every heading belongs to the footer; no `<h1>` | rendered | High | S | 1 |
| **R-36** | `/weddings/[city]` | Performance | Mobile LCP **6,576 ms** (dev), LCP element is text | dev sweep | High | M | 3 |
| **R-37** | `/about-us` | Performance | 4.1 MB page; a single **1,881 KB** JPEG; 400 ms TBT | `_perf-production.json` | High | M | 3 |
| **R-38** | `/photos` | Performance | Infinite-scroll CLS **1.70** (dev, with scroll); needs field data | dev sweep | High | M | 3 |
| **R-39** | all pages | IA | Header and footer navigation list **different destinations**; hamburger beside a visible nav | `Navbar.jsx` / `Footer.jsx` | High | M | 1 |
| **R-40** | all pages | UX | **Zero error boundaries** (`error.jsx` × 0) and **zero route loading UI** (`loading.jsx` × 0) | route scan | High | M | 3 |
| **R-41** | `/varanasi` | Brand | A **third design system** (Cormorant + Cinzel), used on no other page | computed, 10 files | High | L | 2 |

## Medium

| ID | Page(s) | Category | Description | Evidence | Sev | Eff | Stage |
|---|---|---|---|---|---|---|---|
| **R-42** | `/` | IA / SEO | **Four `<h1>`**; first heading on the page is an `<h2>`; the `<h1>` is "Our Films" | rendered | Medium | S | 2 |
| **R-43** | `/photos/[id]`, `/search` | IA / SEO | **No `<h1>`** | rendered | Medium | S | 2 |
| **R-44** | 5 pages | IA | Heading levels skip (h1→h3, h2→h4) | rendered | Medium | S | 2 |
| **R-45** | all pages | Accessibility | **13–25 touch targets < 24px** per page (floor of 13 comes from the footer) | computed | Medium | M | 2 |
| **R-46** | all pages | Design system | **18 box-shadows** for ~6 visual elevations; **9 z-index values** with no scale (incl. `z-1000`) | `_tokens.json` | Medium | M | 2 |
| **R-47** | all pages | Design system | **9 transition durations**, 3 easings — no motion language | `_tokens.json` | Medium | S | 2 |
| **R-48** | `/` | Perceived perf | Image pop-in with **no placeholder** (0 `placeholder="blur"` site-wide) | source count | Medium | M | 3 |
| **R-49** | `/` | Content | Page is **20,199 px on mobile — 24 viewport heights** | measured | Medium | L | 2 |
| **R-50** | `/about-us` | Design | Timeline leaves **half of every row blank** by design (working as built) | measured | Medium | M | 2 |
| **R-51** | `/about-us` | Trust | Two different statistics both read **"1000+"** | rendered | Medium | S | 1 |
| **R-52** | `/contact` | UX | Error modal auto-dismisses after **1,000 ms**; success copy says "**revived**" | `ContactClient.jsx` | Medium | S | 1 |
| **R-53** | `/contact` | UX | "Where did you find us?" is **free text** yet mandatory | `ContactClient.jsx:314` | Medium | S | 1 |
| **R-54** | `/contact` | Design | Native `type="date"` controls, unstyled, `dd/mm/yyyy` | `ContactClient.jsx:293,303` | Medium | S | 2 |
| **R-55** | `/contact` | Design | Feedback uses **SweetAlert2**, a third-party visual language | `ContactClient.jsx` | Medium | M | 2 |
| **R-56** | `/varanasi` | Performance | Layout shift from `<canvas>` at **4,662 ms** | dev sweep | Medium | M | 3 |
| **R-57** | `/weddings/[city]` | Semantics | **Two `<main>` elements** | computed | Medium | S | 2 |
| **R-58** | `/photos` | Design | Skeletons are real but drawn in `slate-400` — off-palette | computed | Medium | S | 2 |
| **R-59** | `/photos` | UX | Repeated tag chips add noise; `+5 more` is not expandable | rendered | Medium | M | 2 |
| **R-60** | `/dharaa-…` | Brand | Sub-brand relationship unresolved — orange palette inside TWB chrome | rendered | Medium | M | 2 |
| **R-61** | `/about-us` | Performance | Hero is a CSS `background-image`, outside `next/image` entirely | computed | Medium | S | 3 |
| **R-62** | 404 | UX | No recovery path — no search, no suggested films or destinations | rendered | Medium | S | 2 |
| **R-63** | all pages | Design system | **25 container max-widths**; 5 competing "page container" values | `_tokens.json` | Medium | M | 2 |
| **R-64** | `/weddings/[city]` | Process | 7 live indexed pages **omitted from the audit brief's scope** | route scan | Medium | S | 1 |
| **R-65** | all pages | Accessibility | Footer social buttons are **unlabelled icon circles** (44 of 136 buttons) | computed | Medium | S | 2 |

## Low

| ID | Page(s) | Category | Description | Evidence | Sev | Eff | Stage |
|---|---|---|---|---|---|---|---|
| **R-66** | all pages | Design system | Three different **Inter** fallback stacks for one typeface | computed | Low | S | 2 |
| **R-67** | all pages | Design system | 70 fractional font sizes from **randomised decorative glyphs** | computed | Low | S | 2 |
| **R-68** | `/team` | Design | Portrait cards `radius 0` against 16px hero imagery | computed | Low | S | 2 |
| **R-69** | `/team` | Design | Orphaned final row (7 members → 4 + 3) | rendered | Low | S | 2 |
| **R-70** | `/allfilms` | Responsive | 5,046 px on mobile vs 1,866 px desktop (2.7×) | measured | Low | M | 2 |

---

## Flags for the client — not design defects

| ID | Item | Why it is here |
|---|---|---|
| **F-01** | "Join **12,000** discerning couples" (`Footer.jsx:45`, every page) | If the list is not ~12,000, this is a substantiation problem, not a styling one. Confirm before Phase 2 reproduces it. |
| **F-02** | "**1000+** Happy Couples" **and** "**1000+** Moments Captured" (`/about-us`) | The two figures cannot both be right. |
| **F-03** | "Decade of Expertise" beside "**5+ years**" (`/`) | Adjacent claims disagree. |

## Resolved — investigated, not defects

| ID | Item | Finding |
|---|---|---|
| **X-01** | Floating "N" badge | `<nextjs-portal>` — the Next.js **dev-tools** indicator. Present in `next dev`, **absent in production**. Not a leak. (`next.config.mjs:34` sets `devIndicators: false` and no longer suppresses it.) |
| **X-02** | "Broken images on every page" | **False positive** in the first harness run — an SVG logo measured before decode. Verified: **0 broken images** site-wide. |
| **X-03** | Grey blocks on `/` "Our Magical Offerings" | **Lazy-load pop-in**, not broken images and not skeletons. All six load. My first screenshot captured the loading state. |
| **X-04** | `/about-us` "failed timeline component" | The timeline **renders correctly** — 5 cards, 59 laid-out elements. The perceived void is its alternating layout. |
| **X-05** | Floating WhatsApp button as global shell | **Not global** — defined and rendered only on `/contact` (`ContactClient.jsx:18,337`). |

---

## Counts

| Severity | Count |
|---|---:|
| Critical | **14** |
| High | **27** |
| Medium | **24** |
| Low | **5** |
| **Total defects** | **70** |
| Client flags | 3 |
| Resolved / not defects | 5 |
