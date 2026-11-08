# UI/UX consistency analysis — public site

**Date:** 2026-11-08 · **Scope:** the 14 public pages (admin out of scope) ·
**Brand:** The Wedding Boys → **WeddingVachan** (rename pending) · **Primary colour:** red

## 1. Verdict

The site does not have a design problem so much as a **completion** problem. A good
system already exists — `DESIGN-SYSTEM.md`, tokens in `globals.css`, a red accent
`#D9342A`, Bodoni Moda + Inter, a 4-value radius scale, `Button`/`Section`/`Chip`
primitives — and the header, footer and most of Home use it. The redesign stopped
at Stage 2 of 8 (`REDESIGN-PROGRESS.md`). Every page after Home was built or
rebuilt on its own, so a visitor moving through the site crosses **four different
visual languages**:

| Language | Where | Signature |
|---|---|---|
| **A. The system** (target) | Header, footer, Home, Films, All films, Photos | ivory `#FBF6EE`, red `#D9342A`, Bodoni Moda headings, pill buttons |
| **B. Old pink** | About, Dharaa, parts of Home, CMS blocks | `#FF6969` / `#FF4D4D`, pure yellow `#FFD700`, bold Inter headings, 12–24px radii |
| **C. Brown editorial** | Weddings, `/weddings/[city]`, Blog | brown `#8C532B` buttons, Playfair Display, coral `#FF5353`, script font |
| **D. One-off themes** | Varanasi, Dharaa, Search | Varanasi: black + saffron `#E8600A` + Cormorant; Dharaa: orange `#EA580C`; Search: cool slate greys |

The header promises language A; the body of 8 of 14 pages breaks that promise.

## 2. Evidence (measured)

Rendered at 1440px in the running dev site; colours read from computed styles, not
source. Raw data: `.playwright-mcp/ui-audit-1440.json`.

### 2.1 Ten different primary-button colours

| Button fill | Pages | Radius |
|---|---|---|
| `#D9342A` (token ✓) | Home, Films, All films, Photos, Weddings, header | pill |
| `#FF4D4D` | Home (×2) | pill |
| `#EF4444` (Tailwind red-500) | Home | 8px |
| `#D97706` (amber) | Home | 12px |
| `#FF5353` | Blog | pill |
| `#EB4B55` | Varanasi | pill |
| `#EA580C` (orange) | Dharaa | 12px |
| `#8C532B` (brown, UPPERCASE) | Udaipur and every city page | 12px |
| `#B91C1C` | Contact "Send enquiry" | 6px |
| `#166534` (green) | Contact WhatsApp | pill |

Six radii (0, 6, 8, 12, 999 and 20 on media) against a scale that defines four.
Only **5 files** import the shared `Button`; `Chip` is imported by **none**.

### 2.2 Seven reds in source

`#D9342A` (token) · `#FF6969` ×80+ · `#FF5353` ×66 · `#FF4D4D` · `#C1271E` /
`#C93026` (films) · `#EB4B55` (Varanasi) · `#D33` (team). Plus saffron `#E8600A`
and orange `#EA580C` used *as* the accent on two pages, and three golds (`#FFD700`,
`#C29555`, `#C9973A`) beside the token `#C9A227`.

`#FF6969` and `#FF5353` fail contrast: white on `#FF5353` is 3.17:1 and `#FF6969`
on white is 2.81:1 (DESIGN-SYSTEM.md §2). Every button in those colours is below
WCAG AA.

### 2.3 Five heading typefaces

| Heading face | Pages |
|---|---|
| Bodoni Moda (token `font-display`) | Home, Films, All films, Photos, Weddings, Contact |
| **Inter bold** | About, Team, Dharaa, 404, and 29 Home H3s |
| Playfair Display | `/weddings/[city]`, Blog |
| Cormorant Garamond | Varanasi — **never loaded**, so it renders in a fallback serif |
| Great Vibes script | Blog masthead |

### 2.4 Source drift by area

| Area | Token uses | Raw hex | Notes |
|---|---|---|---|
| Home (`_home`) | 127 | 92 | mostly on-system; `#FF6969` washes on 46 elements |
| Films / Photos | 10 | 187 | right colours, but as **literals** (`#D9342A` ×27) — cannot be rebranded |
| Varanasi | 0 | 163 | its own palette |
| About | 0 | 64 | entirely old pink |
| Blog | 1 | 182 | legacy `studio.*` palette |
| Dharaa | 0 | 19 + 31 Tailwind palette | orange theme |
| Search | 0 | 4 + 22 Tailwind palette | slate greys |
| `Component/` root | 56 | 71 + 155 Tailwind palette | `PackageModal`, `Footer`, `Navbar` legacy |

## 3. Page by page

**Home** — closest to the system. Fix: no `<h1>` at all (0 measured); service-card
H3s in Inter while section H2s are Bodoni; pink `#FF6969` section washes and two
`#FF4D4D` buttons; package cards use a third button style.

**Films / All films / Photos** — visually on-system. Fix: two `<h1>`s on /films and
/photos; colours are hard-coded hex, so a rebrand or a red adjustment misses them.

**Weddings (hub)** — hero on near-black `#080808` with greys (`#D8C8C8`) that are
not in the palette; H3s in Inter.

**Weddings / [city]** — the most complete page outside the system, but it is the
brown editorial language: Playfair, brown uppercase buttons, 12px radius. It reads
as a different studio's site.

**About** — old pink system end to end. H1 in bold Inter; a pink underline rule;
body copy at ~40% opacity over a bright beach photo is **unreadable** (no scrim);
pure-yellow `#FFD700` accents.

**Team** — hero renders as a flat grey panel and the H1 "Meet Our Visionaries" is
near-invisible (grey on grey); "Our Expert Team" also faint on load. Inter headings.
Cause of the grey hero: the hero carousel shows members with `isHero: true`, and
none of the 7 members in `/api/team` has it set — the page has no empty state.

**Contact** — Bodoni H1 (good) but three button languages on one screen: green
WhatsApp pill, dark-red 6px "Send enquiry", red pill in the header. The form panel
is peach `#FFEFE4`, not a token surface.

**Blog / Journal** — its own masthead: Playfair, coral `#FF5353` pills, a script
"Stories That Feel Like You" flourish, monospace eyebrows. Well made, different brand.

**Varanasi** — deliberately cinematic and dark; that is a legitimate *campaign*
treatment, but it should be dark **within** the brand: same red, same display face.
Today it uses saffron, `#EB4B55`, and an unloaded Cormorant.

**Dharaa** — orange `#EA580C` CTAs and headline, Inter bold, 12px buttons. As a
sub-brand it can have its own mark, but buttons and type should still be ours.

**Search** — Tailwind slate greys (cool) on a warm site; no heading; result cards
unrelated to film/photo cards elsewhere.

**404** — Inter heading, background `#FFF7EE` (an old token, not `--ground`).

## 4. Cross-cutting UX issues

1. **One primary action, one look.** Visitors learn "red pill = enquire" from the
   header; the same action is brown on city pages, green on Contact, orange on Dharaa.
2. **Section anatomy varies per page** — eyebrow + rule + H2 + lede exists on Home,
   but About/Team/Dharaa centre a bold Inter H2 with no eyebrow; city pages use an
   icon eyebrow; blog uses monospace. One `SectionHeader` component should own this.
3. **Text over imagery without scrims** (About hero, Team hero) — the scrim tokens
   exist (`--scrim-*`) and are not applied.
4. **Heading structure** — Home 0 `<h1>`, Films and Photos 2. Affects SEO and screen readers.
5. **Cards** — film, photo, service, package, team, blog and search cards are seven
   separate designs with different radii, shadows and title faces.
6. **Brand name is hard-coded** — "The Wedding Boys" appears as literal text across
   pages and metadata; the WeddingVachan rename should be one change, not a sweep.

## 5. The target — one brand

Keep what was approved; finish applying it. Nothing below is new except the last row.

| Element | Rule |
|---|---|
| **Primary / CTA** | `accent` `#D9342A` fill, white text, `rounded-pill`, via `<Button variant="primary">` only |
| Red as text / links | `accent-ink` `#A83824` (5.99:1) |
| Secondary button | outline in `ink`, pill; tertiary = text link with arrow |
| WhatsApp | secondary style with WhatsApp icon — not a green fill |
| Ground / surfaces | `ground` `#FBF6EE`, `ground-raised` white, `ground-sunk` `#F4EBDD`; dark sections use `ground-deep` `#2A1B12` |
| Ornament | gold `#C9A227` as hairline only — never yellow, never a fill |
| Display type | Bodoni Moda for H1/H2 (and card titles ≥ 20px) |
| Text type | Inter for everything else, including H3 below 20px |
| Radius | `control` 2px · `panel` 4px · `media` 20px · `pill` — nothing else |
| Section header | one component: eyebrow (Inter caps, `accent-ink`) · H2 Bodoni · gold rule · lede |
| Campaign pages (Varanasi) | may invert to `ground-deep`; keep red, Bodoni, pill buttons |
| Sub-brands (Dharaa) | own logo lock-up only; system type, buttons and colour |
| **Brand name** | one constant (`lib/siteConfig.js`) used by header, footer, metadata, copy |

## 6. Plan

Ordered so each step removes the most inconsistency per change, and so the
WeddingVachan rename lands once.

| # | Work | Pages | Size |
|---|---|---|---|
| 0 | **Penpot first**: align the WeddingVachan file with §5 — tokens, button set, section header, 7 card types → 3 | — | design |
| 1 | Primitives: `Button` (primary/secondary/text/WhatsApp), `SectionHeader`, `Card` (media/info/price); brand-name constant | shared | S |
| 2 | Lint guard: extend `check-tailwind-classes.mjs` to fail on raw hex / Tailwind palette colours in `app/(site)` and `Component/` | shared | S |
| 3 | Red unification: replace `#FF6969`/`#FF5353`/`#FF4D4D`/`#EB4B55`/`#C1271E` and literal `#D9342A` with tokens | all | M |
| 4 | Type unification: Bodoni for H1/H2, remove Playfair/Cormorant/Great Vibes from public pages, fix h1 counts | all | M |
| 5 | Page passes: About, Team, Contact, Search, 404 (fully legacy) | 5 | M |
| 6 | Page passes: Weddings hub + city pages (brown → system) | 2 templates | M |
| 7 | Varanasi in-brand dark, Dharaa sub-brand rules | 2 | M |
| 8 | Blog masthead + cards onto system (blog content templates untouched) | 2 | M |
| 9 | Rename to WeddingVachan (logo, name constant, metadata) | all | S |

## 7. Penpot — `weddingvachan` file

| Page | Contents |
|---|---|
| `00 · Design system` | **Foundations** board (20 colours, type scale, 4 radii) and **Components** board |
| `01 · Studio pages` | **About**, **Team**, **Contact** at 1440, built only from library components |

Library: 20 colours, 10 typographies, 34 tokens (set `WeddingVachan`), components
`Button` (variants Primary / Secondary / Text / WhatsApp), `Section header`
(Left / Center), `Chip` (Selected / Default), `Form field`, `Card / Media`,
`Card / Info`, `Card / Price`, `Site header`, `Site footer`.

Photographs are placeholders (`Photo` boards naming the intended image). Copy is
the site's real copy; team names and roles are from `/api/team`; contact details
are left as "from studio settings".

**Not covered here:** mobile widths (only 1440 measured), admin, blog article
templates, and the Penpot WeddingVachan page — it has not been compared yet; §5
should be checked against it before step 1.
