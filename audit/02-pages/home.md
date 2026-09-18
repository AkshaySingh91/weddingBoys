# Page audit — Home (`/`)

Screenshots: `audit/screenshots/home-390x844.png`, `-768x1024`, `-1440x900`,
`-1920x1080`. Data: `audit/_data/home-{mobile,tablet,laptop,desktop}.json`.

| | mobile 390 | tablet 768 | laptop 1440 | desktop 1920 |
|---|---:|---:|---:|---:|
| Page height | **20,199px** | 16,044px | **12,413px** | 12,386px |
| Elements rendered | 928 | 955 | 955 | 955 |
| LCP | 412ms | 212ms | 240ms | 424ms |
| CLS | 0.056 | **0.105** | 0.039 | 0.059 |
| Total blocking | 19ms | 24ms | 47ms | 57ms |
| Horizontal overflow | 0 | 0 | 0 | 0 |
| Low-contrast text | 37 | 37 | 37 | 37 |
| Text over imagery | **106** | 107 | 107 | 107 |
| Touch targets < 24px | 25 | 20 | 20 | 20 |
| Oversized images | 20 | 10 | 16 | 15 |

## D-HOME-01 — The page is 24 phone screens long — **High**

20,199px at 390px wide. A visitor on a phone scrolls roughly **24 viewport
heights** to reach the footer. Fourteen distinct sections render before the
footer (`app/(site)/page.jsx:43-56`). Nothing is broken; the page is simply
asked to do the work of a whole site.

This is the honest answer to the brief's "very large blank region below the
Varanasi banner": there is no single broken void. There is a very long page with
generous section padding, and at laptop width the gap between
`VaranasiLaunchCard` and `DharaService` reads as emptiness because both sections
are internally left-weighted with large right-hand voids.

## D-HOME-02 — Film-card text is white on white: contrast ratio **1.0** — **Critical**

The film cards under "Our Films" set their overlay text in `#FFFFFF` with **no
scrim and no background colour**. Measured effective background: `#FFFFFF`.
Ratio **1.0:1** against a 4.5 requirement.

| Text | Size | Ratio |
|---|---|---:|
| "20 December" | 22px | **1.0** |
| "Daman" | 22px | **1.0** |
| "Anshu" / "&" / "Abhishek" | 24px | **1.0** |
| "14 October" / "Ahemdabad" | 22px | **1.0** |

The text is legible today only because a photograph happens to paint behind it.
Legibility is therefore a function of whether the image loads and how dark that
particular photograph is — not a design decision. On a slow connection, during
the lazy-load window, or if the asset 404s, the card is blank white.

## D-HOME-03 — The brand tagline fails contrast — **High**

"MUMBAI'S PREMIER WEDDING FILMMAKERS", `rgba(244,63,94,0.8)` on `#FFFFFF` at
12px = **3.67:1**, against the 4.5 minimum for text under 18.66px. The studio's
positioning line is the least legible text in the masthead.

`#F43F5E` is Tailwind `rose-500` — a **seventh** red, belonging to none of the
six brand reds catalogued in `01-DESIGN-TOKEN-INVENTORY.md`.

## D-HOME-04 — Four `<h1>` elements, and the first heading on the page is an `<h2>` — **High**

Document order: `h2 Shreyas & Bhavika` → `h2 Nipa & Brijesh` → `h2 Khusboo &
Vedant` → `h2 Anshu & Abhishek` → **`h1 Our Films`** → `h2 Our Magical
Offerings` → …

Four `<h1>` elements on one page. The one that appears is "Our Films" — a section
label, not a description of the business. A screen-reader user tabbing by heading
meets four couple names before learning what the page is, and search engines are
given "Our Films" as the page's primary heading.

## D-HOME-05 — Images served at up to 15× the pixels displayed — **High**

| Asset | Natural | Displayed | Waste |
|---|---|---|---:|
| `homeImage1.jpg` | 6048×4032 | 401×256 | **15.1×** |
| `homeImage3.jpg` | 5504×8256 | 401×256 | **13.7×** |
| `homeImage6.jpg` | 3914×5883 | 9.8× | **9.8×** |
| `homeImage4.jpg` | 2160×2700 | 401×256 | 5.4× |
| hero (CDN) | 3984×2656 | 1392×528 | 2.9× |

**Mechanism:** `cloudflareLoader.js:30` returns `src` unchanged for any path
starting with `/` — which is every local `@/Asset/*` import. Because a custom
loader is configured (`NEXT_PUBLIC_CDN_URL` is set), Next's built-in optimiser is
disabled globally, so these assets have **no responsive variants at all**. The
three `next/image` console warnings on this page ("loader property that does not
implement width") are this mechanism announcing itself.

16 oversized images at laptop, 20 on mobile — where it costs the most.

## D-HOME-06 — "Our Magical Offerings" cards show grey blocks during load — **Medium**

*Corrected finding.* These are **not** broken images and **not** skeletons. All
six load successfully (`complete: true`, real intrinsic dimensions; the page has
**zero** broken images). The grey is the card's own background showing through
while a lazy image decodes — unstyled pop-in with no placeholder, blur-up or
reserved tone.

My own first capture photographed this state and I initially recorded it as
broken; re-verified live at 1440×900 in `home-1440x900-viewport-verified.png`,
where all six images render. The defect is real but it is a
**perceived-performance** defect, not a broken asset.

## D-HOME-07 — Film category rows leave 55% of the viewport empty — **High**

Cards are fixed at 288×256 regardless of available width. Measured at 1425px:

| Row | Cards | Width used | Empty to the right |
|---|---:|---:|---:|
| Classic | 2 | 592px | **793px (55.6%)** |
| Beach | 2 | 592px | **793px (55.6%)** |
| North India | 4 | 1200px | 185px (13%) |

Rows with fewer than four films leave over half the screen blank. The same
component is the `/films` page's primary layout (see `films.md`).

## D-HOME-08 — Content defects — **High** (trust damage)

- **"AHEMDABAD"** — misspelling of Ahmedabad, rendered in a film card.
- **Positioning contradiction.** Masthead: "Mumbai's premier wedding filmmakers".
  `VaranasiLaunchCard.jsx:83`: "Mumbai's Premier Storytellers". Footer
  (`Footer.jsx:105`): "**India's** premier wedding cinematography studio …
  across royal palaces, coastal sanctuaries, and **worldwide destinations**".
  And `OfferPackages.jsx:119`: "We cover all locations in **Mumbai at no extra
  cost. Additional charges apply for destination weddings.**"

  A destination-wedding buyer reads, on one page, that the studio is worldwide
  and that leaving Mumbai costs extra.

## D-HOME-09 — 20–25 touch targets below 24px — **Medium**

`Our Films` (1392×**20**), six × `Explore Gallery` (353×**21**), nav `Home`
(34×**15**). WCAG 2.2 §2.5.8 requires 24×24 minimum. Worst on mobile (25
instances) where it matters most.

## D-HOME-10 — No `<header>` landmark — **Medium**

Landmarks present: `nav` ×1, `main` ×1, `footer` ×1. `header` ×**0**. The masthead
is a `<div>`, so assistive technology has no banner landmark to jump to. Applies
site-wide (`app/(site)/layout.jsx:13`).

## Interaction-state coverage

| State | Present |
|---|---|
| Hover | ✅ on CTAs and cards |
| Focus-visible | ⚠️ see `05-ACCESSIBILITY.md` — inherited Tailwind ring only |
| Active / pressed | ❌ none observed |
| Loading | ❌ no placeholder treatment (D-HOME-06) |
| Empty | n/a — content is hard-coded |
| Error | ❌ none |

## Responsive behaviour

No horizontal overflow at any of the four widths (0px). Layout degrades by
**length** rather than by breakage: mobile is 20,199px. Tablet carries the worst
CLS (0.105).
