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
| **2** | Home | **⏸ Proposed, awaiting approval** | R-06¹ R-23 R-26¹ R-42 R-48 R-49 |
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


---

### Stage 2 — proposed 2026-09-19, awaiting approval

**Measured first.** The home page renders **15 sections**, **12,354px** at laptop
and **19,823px** on a phone — 23.5 viewport-heights. Four `<h1>`. 103
text-over-image instances. CLS 0.107.

| # | Section | laptop | mobile | Heading |
|---:|---|---:|---:|---|
| 1 | hero carousel | 528 | 528 | Shreyas & Bhavika |
| 2 | category pills | 33 | 39 | — |
| 3 | film row | 416 | 423 | — |
| 4 | `#services` | 1465 | **3172** | Our Magical Offerings |
| 5 | Varanasi card | 648 | 664 | Mumbai's Premier Storytellers… |
| 6 | Dharaa | 620 | 956 | Dharaa |
| 7 | studio pitch | 526 | 996 | Professional Wedding Storytellers |
| 8 | `#ourPortfolio` | 1164 | **4258** | Moments We've Captured |
| 9 | `#whyToChooseUs` | 970 | 1562 | Why Choose The Wedding Boys? |
| 10 | `#pricing` | 1310 | 1818 | Perfect Plans for Your Perfect Day |
| 11 | custom package | 589 | 886 | Need a Custom Package? |
| 12 | since-2020 | 754 | 765 | Crafting Timeless Memories Since 2020 |
| 13 | assistance CTA | 294 | 350 | Need Personal Assistance? |
| 14 | `#process` | 1580 | 1688 | How We Craft Your Dream Wedding Story |
| 15 | track record | 224 | 308 | Our Track Record |

**The page says the same things three times.** That, not styling, is why it is 24
screens long:

- **Three "why us" blocks** — §4 *Our Magical Offerings*, §7 *Professional
  Wedding Storytellers*, §9 *Why Choose The Wedding Boys?*
- **Two pricing blocks** — §10 *Perfect Plans*, §11 *Need a Custom Package?*
- **Two portfolio surfaces** — §3 film row, §8 *Moments We've Captured*
- **Three contact CTAs** — §11, §13, and the footer's

### Proposed structure — 15 sections to 8

| # | Section | From | Purpose |
|---:|---|---|---|
| 1 | **Hero** | §1 | One full-bleed still, the page's **only `<h1>`**, arch-framed |
| 2 | **Selected films** | §2 + §3 | Portfolio row that fills its width |
| 3 | **What we film** | §4 | Services, tightened — 3172px on mobile is a page of its own |
| 4 | **Why this studio** | §7 + §9 + §15 | One credibility block: proposition, reasons, the numbers |
| 5 | **Destinations** | §5 | Varanasi + the city pages, which currently have no route in from home |
| 6 | **Investment** | §10 + §11 | Packages and the custom route, one block |
| 7 | **How we work** | §14 | Process — good content, kept |
| 8 | **Dharaa** | §6 | Demoted to a slim band; it is a sub-brand, not a peer |

§12 (*Since 2020*) folds into §4 as a line, not a section. §13's CTA is the
footer's job — it already carries one.

**Target: under 9,000px on mobile** (from 19,823) and ~6,500px at laptop.

### Defects this closes

- **R-42** — 4 `<h1>` → 1. The current set is *Our Films*, *Crafting Your Perfect
  Event*, *Professional Wedding Storytellers*, *How We Craft…*; none describes
  the business.
- **R-49** — 19,823px mobile.
- **R-26** — film rows leaving **55.6%** of the viewport empty at 1425px
  (fixed 288×256 cards). Arch-framed cards that fill the row.
- **R-06** — 103 text-over-image instances get scrim tokens. `<Media>` refuses an
  overlay without one.
- **R-48** — image pop-in; `<Media>` blur-up using the stored `blurDataURL` /
  `dominantColor`.
- **Horizontal overflow** — traced to the hero carousel track
  (`flex-shrink-0 w-full h-full` reaching x=780 at a 390px viewport, i.e. two
  slides wide, unclipped). Currently contained by `overflow-x-clip` on `main`;
  this fixes the cause.
- **`HeroCarousel` missing-key React error** — the one console error on the page.
- **CLS 0.107** → target ≤ 0.05.

### Content issues raised, not silently changed

- **"Ahemdabad"** (R-23) is in the **film records**, not the markup — a data fix
  the studio should make in admin. I will not mutate records.
- **"1000+ Weddings Captured" beside "1500+ Happy Clients"** implies 1.5 clients
  per wedding; and `/about-us` separately claims 1000+ for *both* couples and
  moments captured (F-02). The Track Record numbers move into §4 — confirm them
  before they are re-published.
- **`OfferPackages.jsx:119`** still promises "all locations in Mumbai at no extra
  cost. Additional charges apply for destination weddings" — unchanged, still a
  commercial decision.

### Deliberately not in this stage

Films listing and detail (Stage 3), gallery (Stage 4), the `/weddings/[city]`
pages themselves (Stage 8). Home will link to them; it will not restyle them.


---

### Stage 2 (part 1) — navbar, hero and film player — 2026-09-19

**Scope changed on instruction: improve every component in place, do not merge
or remove any.** The 15→8 consolidation proposed above is withdrawn. The page
stays long (19,823px on mobile); that trade-off is the client's call and is
recorded rather than quietly worked around.

#### Navbar
- **Legibility bug fixed.** The bar was transparent until 72px of scroll and sits
  over the hero video, so dark ink on transparent left the navigation invisible.
  Both states are now **fully opaque**.
- **Root cause was systemic.** Tailwind's alpha modifier compiles to nothing
  against a hex custom property — 13 shell classes were silently dead, including
  the header's own background. Token colours now carry channel forms.
  A second trap found the same day: an alpha value **off Tailwind's 5-step
  scale** (`/94`, `/78`) also compiles to nothing *even with channels*. Both are
  documented in `globals.css` beside the tokens.
- 96px → **72px** (58px condensed); blush-cream ground, gold hairline; wordmark
  in the studio red.
- **"Enquire" → "Get Quote"**, and the CTA red restored: `#FF5353` carries white
  at 3.17:1 and cannot reach AA, so **`#D9342A`** — the brightest red that does,
  at **4.69:1**. Fills use it; accent text uses `#A83824` (5.99:1) because the
  fill red is 4.36:1 on ivory.
- CTA now visible at **every** width; it had been hidden behind the menu on phones.
- Wordmark scaled on phones, where it wrapped to two lines and burst the bar.

#### Hero
- Fixed `h-[33rem]` → viewport-relative (`58svh` → `74svh`, clamped 400–820px).
  `svh` so collapsing mobile browser chrome does not resize it mid-scroll.
- **The arch appears** — this is the design system's framing device in its
  primary position.
- Caption uses the **scrim token** (guaranteed 5.6:1) instead of a hand-rolled
  `from-black/60`; name set in Bodoni.
- Play control: labelled, 56–64px, gold-ringed — was an unlabelled 48px
  `bg-white/10` circle.
- Slide indicators added as **real controls** that select their slide.
- Prev/next hidden with a single slide, and revealed on hover at desktop.
- **React duplicate-key warning fixed** — `videoKey` is not unique across slides.
  The home page now reports **0 console errors**.
- Removed a `FEATURED FILM` eyebrow I had added by reflex — a tracked-out
  uppercase kicker is on this system's own anti-pattern list.

#### Film player experience
- New `Component/FilmLightbox.jsx` replaces a bare `bg-black/90` div: entrance
  (fade + rise + scale from 96%, instant under reduced motion), **warm
  `--ground-deep` ground with a jaali screen** rather than black, focus trap,
  focus restore, scroll lock, Escape and click-outside to close, 48px close
  target, and the film title kept visible.
- `Component/Videoplayer.jsx` **themed**: its grey/blue glassmorphism — including
  a literal **blue** shadow `rgba(31,38,135,0.37)` — replaced with warm ground,
  gold hairlines and a **studio-red progress fill**. Off-theme classes: 0.
- Player no longer carries its own `max-w` ladder, which had produced a small
  player floating inside a large panel.
- Mobile: full-bleed film (a 16:9 frame in 390px is only ~200px tall, so width is
  height), roomier control bar, scrub tooltip kept inside the frame.

**Verified:** header 72→58px at all four widths · overflow **0** · shell targets
under 44px **0** · unlabelled controls **0** · skip link first in tab order ·
**0** elements animating under reduced motion · fonts **3 files / 176 KB / 2
families** · build and both guards green · home page console errors **0**.

**Note on the dev server.** It served stale output three times during this stage,
including once from an orphaned `next-server` process holding port 3000 while the
new server silently started on 3001. Every visual check here was re-taken after a
hard restart (`kill -9` by port, `rm -rf .next`).


---

### Stage 2 (part 2) — brand identity restored — 2026-09-19

Client review of part 1 was blunt and correct: the navbar was *"soulless… like a
first-year student building a plain navbar"*, the hero's dome arch read like an
*"entrance room"*, and the caption and play control sat *"lifted too upward"*.

**The worst of it was a regression I introduced: I deleted the logo.** The
original masthead carried the studio's monogram, a name, a tagline, an icon
against every nav item and a pill CTA. I replaced all of it with a text wordmark
on a flat bar and called it restraint. Removing a brand's only piece of visual
identity is not restraint.

| | Before this pass | After |
|---|---|---|
| Logo | **removed** | monogram in a gold ring, beside the name |
| Tagline | none | `MUMBAI · INDIA · BEYOND` |
| Nav items | plain text | icon + label, accent-wash hover |
| CTA | square button | pill with a mail mark |
| Hero frame | dome arch | `rounded-panel` with a gold hairline |
| Hero caption | floating mid-frame | anchored to the floor |

**The tagline does real work.** `MUMBAI · INDIA · BEYOND` settles the
contradiction the audit logged as R-08 by stating the truth rather than picking a
side — the studio is based in Mumbai, works across India, and travels. "Mumbai's
premier" alone contradicted the footer; "India's premier" alone erased where they
are.

**The arch is not deleted, it is scoped.** A dome on a 1400×740 landscape frame
reads as a doorway — the picture looks viewed-through rather than presented.
`globals.css` now states it is for portrait and square media: portrait cards,
team photographs, destination tiles.

**Mobile menu rebuilt** to the reference the client supplied: brand lockup in a
blush header rather than the word "MENU", an icon against every item, chevrons,
sub-destinations hanging off a **gold thread with a diamond node at each stop**,
a full-width pill CTA, gold-ringed social buttons, an ornamental rule and a
`REAL PEOPLE · EXTRAORDINARY STORIES` sign-off.

**Verified after the change:** overflow **0** at four widths · shell targets under
44px **0** (one regression caught and fixed — the lockup squeezed the menu button
to 27px at 390px, fixed with `shrink-0`) · unlabelled controls **0** · skip link
first in tab order · **0** animating under reduced motion · fonts **3 files /
176 KB** · console errors **0** · build and both guards green.

### Film row — corrected after review (commit `64c02a6`)

The portrait-4:5-under-the-arch treatment was rejected on review against the
previous UI. Four things were wrong and all four are fixed:

| Raised | Was | Now |
|---|---|---|
| "make it square only" | `aspect-[4/5]` + `.arch` | `aspect-square`, `rounded-media` (20px) |
| "left side align" | `lg:justify-center` when ≤3 films | always left; first card shares the heading's x |
| "spacing is too much" | `mt-8` rail, `mt-6` filters, 838px section | `mt-5` / `mt-4`, 692px section at 1440 |
| "previous look more good" | 300px cards | 420px at lg, 78vw on phones |

New token: `borderRadius.media = 20px`. The scale held 0 / 2 / 4 / 999 and none
of them suit a photograph — the previous UI was right to round its film cards
generously.

Bug found while verifying: `snap-mandatory` parked the first card flush against
the scrollport and swallowed the rail's own `px-5`, measured `scrollLeft: 20` at
390px. `scroll-pl-*` mirroring `px-*` fixes it. **This is a class of bug, not an
instance** — any snapped rail with padding has it. Checked: this is the only
snap rail on the site so far; the pattern is noted here for the ones to come.

Measured at 390 / 768 / 1440 / 1920: first card x = heading x at every width,
`railScrollLeft` 0, `docOverflowX` 0, frame square at 304 / 338 / 420 / 420.
Caption contrast over the scrim ≈ 10.6:1. Build green.

The arch is **not** removed from the system — it stays for portrait media
composed for it. It is removed from film stills, where it crops the top of the
frame.

### Our Magical Offerings — rebuilt (`OurService.jsx`)

Chosen at the gate: re-skinned 3×2 grid · each card to its real destination ·
four on mobile with the rest one tap away.

Six services kept — same count, same titles, same descriptions. Nothing removed.

**Defects fixed**

| | Was | Now |
|---|---|---|
| Card ground | `#9a724e51` / `#e4b88f67` alternating raw hex | one `bg-ground-raised` card; the photographs differentiate |
| Border | `border-2 border-slate-300` = `rgb(203,213,225)` | `border-gold/35` = `rgba(201,162,39,0.35)` |
| Corner ornament | `bg-pink-200/50` | same shape, `bg-marigold/30` |
| Icon puck | `bg-primary`, no ring | ivory `bg-ground/90`, gold ring, `accent-ink` glyph |
| Heading face | Inter | Bodoni Moda + `.rule-ornament`, matching the film row |
| Links | **all six → `/photos`**, "Explore Gallery" ×6 | `/films` · `/photos`×3 · `/contact`×2, each labelled with its destination |
| Closing CTA | `<button onClick={window.open(url,'_blank')}>` | `<a>` with `rel="noopener noreferrer"` |
| Background | SVG grid stroked `#fff` @ 0.2 on cream — drew nothing | the site's `.jaali` |
| Skeleton | `bg-gray-200 animate-pulse` | the warm `.skeleton` |
| Text align | centred in all six | left, matching the rest of the page |

**Whole card is clickable** via `after:absolute after:inset-0` on the single
anchor — one interactive element per card, no nested `<a>`.

**Mobile** 3,172px → **2,304px** collapsed (4 of 6), 3,154px expanded.
`aria-expanded` / `aria-controls` wired; the control stays mounted through the
toggle so a keyboard user does not lose focus.

### The section axis — established (R-63 on the home page)

Measuring the home page's 22 `<h1>`/`<h2>` elements at 1440 found them at **16
different x positions** (16, 32, 57, 64, 72, 73, 89, 112, 137, 161, 215, 265,
612, 616, 795). No two sections agreed, so there was no consensus to match.

The axis is now **the `Section` gutter** — `max-w-wide` + `px-5 md:px-8
lg:px-12`, landing at x=64 at 1440. The film row had been double-padding
(Section gutter *plus* another `px-12`) to let its rail bleed, which put it at
112 — 48px off every other section. Fixed by bleeding **right only**
(`-mr-* pr-*`) instead of padding symmetrically, so the rail still runs past the
gutter while its left edge stays on the axis. This also removed the need for
`scroll-pl-*`.

Verified: films heading, first film card, services heading and first service
card all at **x=64** at 1440 and **x=20** at 390. `docOverflowX` 0.

Every remaining home section gets brought onto this axis as it is reworked.

### Varanasi launch card — restyled (`VaranasiLaunchCard.jsx`)

Chosen at the gate: countdown kept as-is · display face with **Varanasi in red** ·
badge kept with its faults fixed.

**Colour hierarchy corrected.** Client, verbatim: *"Our primary color is red
dont forget this, gold & cream is just we can use for decorative or bg."* I had
offered a gold treatment for the headline word where the brand's own red
belonged. Recorded as DESIGN-SYSTEM.md §3.0 so it cannot drift again. When red
fails contrast the answer is the red token that passes, never another hue.

| | Was | Now |
|---|---|---|
| CTA fill | `#eb4b55`, white on it **3.70:1** | `--accent`, white **4.69:1** |
| "Varanasi" | `#eb4b55` as text, **3.43:1** | `--accent-ink`, **5.71:1** — still red |
| Heading | Inter 800 | Bodoni + `.rule-ornament` |
| CTA element | `<button onClick={router.push}>` | `<a href="/varanasi">` |
| Badge | `NEW BRANCH ALERT`, pulse always on | sentence case, accent token, `motion-safe:animate-ping` |
| Container | bare `<div>`, heading at x=72 | `<Section>`, card at **x=64**, on the axis |
| Countdown | re-rendered the whole card incl. `next/image` every second | isolated component; the tick touches four digits |

**The countdown behaviour is unchanged by decision.** It remains hardcoded to
10d 14h 59m 59s and restarts on every page load; the "20% off" has no real end
date. I raised that this is false urgency and a listed dark pattern under the
CCPA's *Guidelines for Prevention and Regulation of Dark Patterns, 2023*, and
the client chose to keep it. Recorded here, not re-litigated. Reversing it later
is small: give `START` a real end date and hide the block once it passes.

**Three self-inflicted bugs, found by looking at my own screenshots**

1. `via-accent-wash/90` with the falloff at the card edge washed the ghats out
   to a ghost. The illustration is the best asset on the page.
2. Retuning to `from-42% / to-78%` **compiled to nothing** — gradient stop
   positions ship on Tailwind's 5-step scale, the same trap as `/94` and `/78`
   on opacity. Computed style was a bare two-stop gradient with no percentages.
3. The real cause was neither: `bg-accent-wash/90` sets background-**color**
   while `md:bg-gradient-to-r` sets background-**image**. Different properties,
   so the phone wash never switched off and flooded the card at every width.
   The original code avoided this with a separate `md:hidden` element; merging
   them lost it. `md:bg-transparent` is load-bearing.

**Build guard extended** (`scripts/check-tailwind-classes.mjs`) to catch the
class, not the instance: any `from-/via-/to-N%` or any opacity modifier `/N`
off the 5-step scale now fails the build. Verified the rules fire on a planted
case and that the repo is otherwise clean.
