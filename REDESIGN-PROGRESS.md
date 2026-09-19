# Redesign Progress

Running state across sessions. **A new session should read `DESIGN-SYSTEM.md`
first, then this file.** Neither this file nor the design system may be assumed —
re-read both before touching code.

- **Audit:** `audit/` — 70 defects, IDs `R-01`–`R-70`, plus `F-01`–`F-03` (client
  flags) and `X-01`–`X-05` (investigated, not defects).
- **Out of scope, do not touch:** blog / editorial system, admin panel.
- **Rule:** every commit references the register IDs it closes.

---

## Stage status

| Stage | Scope | Status | Closes |
|---|---|---|---|
| **0** | Design direction + tokens + `DESIGN-SYSTEM.md` | **✅ Approved 2026-09-19** | defines R-15 R-16 R-17 R-18 R-46 R-47 R-63 R-66 R-67 |
| **1** | Primitives & global shell | **✅ Built & verified 2026-09-19 — awaiting gate** | R-05 R-07 R-08 R-14 R-19 R-22 R-30 R-31 R-32 R-34 R-39 R-40 R-45 R-58 R-65 + lands Stage 0 tokens |
| **2** | Home | Not started | R-06¹ R-23 R-26¹ R-42 R-48 R-49 |
| **3** | Films (listing, rows, detail) | Not started | R-12² R-24² R-26 R-27² R-28 |
| **4** | Gallery / Photos | Not started | R-13 R-20 R-38 R-43 R-58 R-59 |
| **5** | Our Team | Not started | R-06 R-10 R-24² R-25 R-68 R-69 |
| **6** | About Us | Not started | R-06 R-21 R-37 R-44 R-50 R-51² R-61 |
| **7** | Contact + enquiry flow | Not started | R-01 R-02 R-03 R-04 R-33 R-34 R-52 R-53 R-54 R-55 |
| **8** | Varanasi, Dharaa, Search, 404, polish | Not started | R-11 R-29 R-35 R-36 R-41 R-56 R-57 R-60 R-62 R-64 |

¹ partially — the shared primitive lands in Stage 1, the page application here.
² requires a **content/data decision from the client**; presentation only until then.

**Not assigned to a stage:** `X-01`–`X-05` need no work (investigated, not
defects). `F-01`–`F-03` are client decisions, not code.

---

## Quality floor — every stage must pass before its gate

Visual · responsive at 390/768/1440/1920 · hover + focus-visible + active +
disabled + loading + empty + error · WCAG 2.2 AA measured · LCP ≤ 2.5s,
CLS ≤ 0.1, INP ≤ 200ms p75 mobile · Lighthouse perf & a11y ≥ 95 · shared
primitives only · no dev artefacts.

---

## Baseline to beat

From `audit/06-PERFORMANCE.md` — production build, cold cache. **A redesign that
regresses any of these is a failed redesign.**

| Page | LCP mobile-4g | CLS worst | Page weight (laptop) |
|---|---:|---:|---:|
| `/` | 892ms | 0.078 | 2,389 KB |
| `/films` | 1,540ms | 0.026 | 715 KB |
| `/photos` | 724ms | **1.70** (dev, w/ scroll) | 668 KB |
| `/team` | 2,908ms | **1.594** | 667 KB |
| `/about-us` | 1,284ms | 0.000 | **4,096 KB** |
| `/contact` | 660ms | 0.000 | 1,065 KB |
| `/varanasi` | 712ms | 0.000 | 24,295 KB ⚠ |
| `/dharaa-event-management` | 1,476ms | 0.000 | 1,960 KB |
| `/weddings/udaipur` | 672ms | 0.000 | 682 KB |

Other baselines: **48 `@font-face` rules / 12 files / 352 KB** of fonts on `/`;
**176 colour values, 37 font sizes, 132 line-heights, 41 spacings, 25
max-widths** site-wide; **136 buttons in 35 treatments**; **29 token references
vs 511 arbitrary hex**.

⚠ `/varanasi`'s weight is **`X-06`, out of scope** — unmigrated assets owned by
the admin media backlog, not this redesign. Stage 8 restyles the page and leaves
its assets alone. See `DESIGN-SYSTEM.md` §12.

Lighthouse is **not installed** — install before Stage 1 if scores are required
as a gate, or keep using the direct Core Web Vitals harness
(`audit/_tools/perf.mjs`), which is what produced the table above.

---

## Session log

### Stage 0 — 2026-09-18 — proposal delivered, awaiting approval

**Direction:** *lights down* — near-black ground, work is the only lit thing.
Argued from the subject (night ritual, riotous colour, the colourist's darkened
room) rather than from taste.

**Brand conflict resolved by rejecting both existing systems.** The pink goes on
arithmetic, not opinion (white on `#FF5353` = 3.17:1). But promoting the
cream-and-brown editorial system would land on warm-cream-plus-terracotta —
named in the brief's own anti-pattern list, and where the current footer already
sits. Kept its discipline, inverted the ground.

**Two corrections made to my own proposal before delivery**, both caught by
computing ratios instead of asserting them:

1. A single `#C2412C` accent failed AA in **both** directions (4.41:1 as a fill
   with bone text, 3.85:1 as text on the ground) — the identical defect the audit
   found in the existing brand. Split into `--accent-fill #A83824` (5.54:1) and
   `--accent-text #D9614A` (5.42:1).
2. `--scrim-base` at `0.45` computes to **2.71:1** over a white image — it would
   have reproduced `R-06`. Raised to `0.66` (5.64:1 worst case).

**Open at the gate** (see `DESIGN-SYSTEM.md` §11): Bodoni Moda vs Cormorant for
display; dark ground on every page or a light variant for `/contact`; whether
`/varanasi` folds into the system; three content issues needing client input.

**No code written.** Stage 0 is documentation only, per the staged process.


### Stage 0 — approved 2026-09-19

All four gate questions delegated back and decided (`DESIGN-SYSTEM.md` §11):
Bodoni Moda · dark ground everywhere including `/contact` · `/varanasi` folds in
· 8 font families → 2.

**`R-09` reclassified to `X-06` and removed from the register** on the client's
account, which the captured data confirms: every heavy asset on `/varanasi` is a
local import or a raw file in `public/director-frames/` (146 files, 21 MB
in-repo), none served from `media.theweddingboys.in`. Register is now **69
defects, 13 Critical**.

---

### Stage 1 — proposed 2026-09-19, awaiting approval

**Scope:** primitives (button, input, card, chip, heading, section, image,
skeleton) and the global shell (header/nav/mobile menu, footer, newsletter,
floating action). No page-level work — pages consume these in Stages 2–8.

**Information architecture — the single structure, applied everywhere.**
Built only from routes that already exist; no new pages, no redirects.

| Primary nav | Route |
|---|---|
| Films | `/films` |
| Photographs | `/photos` |
| Destinations | panel → `/varanasi`, `/weddings/udaipur`, `/weddings/jaipur`, `/weddings/goa` |
| Studio | panel → `/about-us`, `/team` |
| Journal | `/blogs` *(out of scope — linked, not restyled)* |
| **Enquire** (CTA) | `/contact` |

`Pricing`, `Process` and `Services` leave the global nav entirely — they are home
page sections and were fragment links that did nothing on 13 of 14 pages
(`R-07`). They stay reachable on the home page and from the footer. `Dharaa
Events` moves to the footer: it is a sub-brand, not a peer of Films.

Footer mirrors this exactly — the current mismatch (`R-39`) is resolved by
deriving both surfaces from one `nav.ts` config, so they cannot drift again.

**Nav collapses at a single breakpoint — below 1024px.** Today a hamburger
renders beside a visible desktop nav between `md` and `xl`; there will be one
pattern above and one below, nothing in between.

**Positioning copy (`R-08`).** One line, everywhere: the studio is an Indian
destination practice. The masthead's "Mumbai's premier wedding filmmakers" and
the footer's "India's premier … worldwide destinations" are reconciled; the
pricing line promising "all locations in Mumbai at no extra cost … additional
charges apply for destination weddings" is raised to the client as a **commercial
decision**, not edited unilaterally.

**Global background (`R-22`, `R-32`).** `Component/Background.jsx` is removed.
It ships a truncated base64 placeholder that throws `ERR_INVALID_URL` on every
page, and runs 18 infinite Framer Motion loops site-wide for a texture that has
never rendered. Nothing replaces it: on a near-black ground the imagery is the
texture.

**Image primitive (`R-14`).** One component, mandatory for all imagery: aspect
ratio locked per context, `blurDataURL`/`dominantColor` blur-up (both already
stored), scrim token required whenever text sits over it, `priority` on the LCP
image, lazy below the fold. The loader question — `cloudflareLoader.js:30`
returns local `/`-prefixed paths unoptimised — will be investigated in build, not
promised here: routing them through `/_next/image` may or may not be available
while a custom loader is configured. If it is not, the fallback is to reduce the
offending source assets rather than claim a fix.

**Floating action (`R-34`).** The WhatsApp button is currently defined inside
`/contact` and does not pin below 640px. It becomes a single global enquire
affordance, present on the portfolio pages where a visitor actually wants it.

**Closes:** R-05 R-07 R-08 R-14 R-19 R-22 R-30 R-31 R-32 R-34 R-39 R-40 R-45
R-58 R-65, and lands R-15 R-16 R-17 R-18 R-46 R-47 R-63 R-66 R-67.

**Deliberately left for later:** every page body (Stages 2–8); the films taxonomy
and duplicate-record content issues (client decisions); `/varanasi` assets
(`X-06`).


---

### Stage 1 — built and verified 2026-09-19

**Shipped.** Tokens (`app/globals.css` + `tailwind.config.js`), 11 type-role
classes, primitives (`Button`, `Chip`, `Section`, `Skeleton`, `Media`), shell
(`SiteHeader`, `MobileMenu`, `SiteFooter`, `NewsletterForm`), one IA source
(`lib/navigation.js`), route `error.jsx` and `loading.jsx`.

**Verified across 390 / 768 / 1440 / 1920:**

| Check | Result |
|---|---|
| Horizontal overflow | **0** at all four widths |
| Header condense | 96 → 64px at 72px scroll, all widths |
| Shell targets < 44px | **0** (was 13–25 per page) |
| Unlabelled shell controls | **0** (was 44 icon buttons) |
| Keyboard | 14 stops, first is **Skip to content**, **0** without a visible focus ring |
| Reduced motion | **0** elements still animating (was 46 infinite loops) |
| Fonts on `/` | **4 files / 203 KB / 2 families** (was 12 / 352 KB / 8) |
| `<header>` landmark | present on every page (was 0 of 11) |
| Build + guards | green |

**Side effect worth noting:** `/team`'s low-contrast count fell **19 → 2** before
the page was touched. The dark ground gives white-on-photograph text a dark
effective background, which was the Stage 0 argument and is now measured.

**Four defects found in my own work, all by measuring:**

1. **Duplicate `boxShadow` key** in `tailwind.config.js` silently overrode the
   existing `xs`/`2xs` definitions, breaking 53 admin class names. The build
   guard caught it. Merged.
2. **Duplicate `transitionDuration` key**, same mistake, broke `duration-600` in
   a blog file. Merged.
3. **`calc(100svh-var(--header-height))`** is invalid CSS without spaces around
   the minus — the browser dropped it silently and the rule never applied.
   Tailwind needs `calc(100svh_-_var(--header-height))`.
4. **A tracked-out uppercase descriptor under the wordmark** — the eyebrow-label
   anti-pattern this system bans, self-inflicted. Removed; the positioning line
   lives in the footer where it can be a sentence.

**Layout-shift class fixed at the shell level.** `main` now reserves
`100svh - header`. Without it a client-fetched page renders an empty main, the
footer sits inside the viewport at y=96, and arriving content shoves it down.
Measured on `/films`: footer top 96 → 1097px at ~330ms. The audit blamed the
footer (R-10); the footer was only the largest thing that moved.

| Page | CLS before | after |
|---|---:|---:|
| `/team` mobile | 1.594 | **0.016** |
| `/weddings/udaipur` laptop | 0.708 | **0.000** |
| `/` laptop | 0.078 | 0.107 ⚠ |

**Measurement correction — the Phase 1 production numbers were partly invalid.**
The build was served on :3100, which the backend's CORS allowlist rejects, so
client-fetched pages were measured with **no data**. Re-measured on a valid
origin the real figures are far worse: `/films` mobile LCP **5,636ms**, `/team`
**4,428ms**, `/photos` **4,128ms** with CLS **1.678**. That last number
independently confirms the 1.70 measured in development and settles P-04.
`audit/06-PERFORMANCE.md` is corrected.

**Page weight, on pages that were validly comparable:**

| Page (laptop) | Before | After |
|---|---:|---:|
| `/varanasi` | 24,295 KB | **18,841 KB** |
| `/dharaa-…` | 1,960 KB | **1,417 KB** |
| `/contact` | 1,065 KB | **976 KB** |
| `/about-us` | 4,096 KB | 3,996 KB |

**Closed:** R-05 R-07 R-08 R-19 R-22 R-30 R-31 R-32 R-34 R-39 R-40 R-45 R-58
R-65, and landed R-15 R-16 R-17 R-18 R-46 R-47 R-63 R-66 R-67.

**R-14 could not be closed and is reassigned.** `cloudflareLoader.js:30` passes
local `/`-prefixed sources through unresized, and with a custom loader
configured Next's built-in optimiser endpoint is **disabled** — verified,
`/_next/image` returns **404**. There is no component-level fix: local assets
have no variants at any size. This is the same root cause as `X-06` (assets that
never entered the media pipeline) and belongs with it in the admin media backlog.

**Carried to later stages:**
- `/` CLS 0.107 and 4 × `<h1>`, plus a `HeroCarousel` missing-key React error → **Stage 2**
- `/photos` CLS 1.678 → **Stage 4**
- Mobile LCP 4–5.6s on client-fetched list pages → **Stages 3, 4, 5**
- Home page overflows 16px at 390px; currently contained by `overflow-x-clip` → **Stage 2**
- `/team` CLS 0.379 mobile → **Stage 5**

**Raised to the client, not changed:** `OfferPackages.jsx:119` still promises
"all locations in Mumbai at no extra cost. Additional charges apply for
destination weddings", which contradicts the destination positioning. Commercial
decision, not a copy fix.

**Note on the blog.** `SiteFooter` replaces the old footer for the out-of-scope
blog layout too, since `app/(journal)/layout.jsx` imports the shared `Footer`.
The footer is global shell rather than blog content, and a dark footer beneath
the blog's light editorial page is a conventional pairing — but it is a visible
change to blog routes and is flagged here rather than buried.


---

### Direction revised 2026-09-19 — dark ground rejected

The client reviewed the built dark theme and rejected it. The reasoning, in their
words: it reads as a *"classical website look which is simple & professional"*
but it *"kills creativity"*; Indian weddings are not Western weddings and the
site should carry ornament, not strip it away.

**That is the correct call and it overrides my Stage 0 argument.** I optimised
for restraint on the theory that the weddings supply the abundance and the frame
should be calm. On the built result that theory produced a page which was
tasteful and characterless — and "characterless" is a worse failure for this
brand than "too much".

**What changed:** the surface only.

| | Before | After |
|---|---|---|
| Ground | `#0B0A09` near-black | `#FBF6EE` warm ivory |
| Ink | bone on dark | `#2A1B12` warm cocoa, 15.44:1 |
| Accent | two reds (fill + text) needed for AA | **one** — `#A83824` does both (6.45 / 5.99) |
| Ornament | none | arch · jaali · gold rule · corner brackets, all CSS-only |

**What did NOT change** — every structural fix from Stage 1 survives: the single
IA source, `<header>` landmark, skip link, designed focus ring, 44px targets,
labelled controls, reduced-motion handling, font consolidation, error/loading
boundaries, the `min-h` layout-shift fix, and all five primitives.

**Re-verified on the light ground:** overflow 0 at four widths · 0 shell targets
under 44px · 0 unlabelled controls · skip link first in tab order · 0 elements
animating under reduced motion · fonts 4 files / 203 KB / 2 families · **shell
contrast: 0 failures across 14 text nodes, 6.45–15.44:1** · build and guards green.

**An honest trade-off this re-exposes.** `/team`'s white-text-on-photograph count
goes **2 → 16**. The dark ground was *masking* that defect, not fixing it — white
text over a photograph had a dark effective background by accident. On ivory it is
visible again and must be repaired properly with the scrim tokens in Stage 5.
That is the right outcome: the scrim was always the real fix, and `<Media>` now
refuses to render an overlay without one.

**Also improved on the light ground:** `/films` low-contrast 3 → **0**,
`/contact` 4 → **1**.

**Commit hygiene note:** the Stage 1 code landed in commit `7f47cfd`, which is
labelled as the audit CORS correction — a `git add -A` from the repo root swept
it in. That commit also contains two files I never touched
(`Component/AdminSidebar.jsx`, `Hooks/useClients.jsx`) which were already
modified in the working tree before this phase began.
