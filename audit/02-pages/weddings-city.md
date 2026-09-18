# Page audit — City landing (`/weddings/[city]`)

Captured: `/weddings/udaipur`. **This page is not in the brief's stated scope** —
recorded here because it is public, indexed, statically generated for at least
7 cities (udaipur, jaipur, goa, varanasi, …) and linked from the footer.

| | mobile | tablet | laptop | desktop |
|---|---:|---:|---:|---:|
| LCP | **6,576ms** | 300ms | 764ms | 376ms |
| CLS | 0 | 0 | 0 | 0 |
| Low-contrast text | 8 | 8 | 8 | 8 |

## D-CITY-01 — Mobile LCP 6,576ms — the worst measurement on the site — **Critical**

Against 376ms at desktop — a **17×** divergence. The LCP element is
`h1.mt-5.font-serif.text-4xl`: **text**, not an image. A text LCP of 6.5 seconds
means the heading itself is blocked — on a statically-generated page, which
should be the fastest category on the site.

## D-CITY-02 — The only page with a `<header>` landmark — and it has two `<main>` — **Medium**

Landmarks here: `header: 1, nav: 2, main: 2, footer: 1`. Every other page has
`header: 0`.

Two observations:

1. This page is built to a **higher** standard than the rest — it is the only one
   with a banner landmark, and the only one using the config's warm
   `studio.border #E5DCD3` on its cards. It is the newest surface and shows what
   the site's baseline could be.
2. **Two `<main>` elements is invalid** — there must be at most one per document.
   The page's own `<main>` is nesting inside the layout's.

## D-CITY-03 — Venue meta text at 4.37:1 — **Medium**

`#78716C` on `#F7F4EF` at **10px** = 4.37:1, marginally under the 4.5 threshold —
and 10px is below any reasonable minimum for body text regardless of contrast.
Affects the venue descriptor chips ("Island Heritage Palace", "Modern Luxury
Palace").

## D-CITY-04 — Scope gap — **Medium** (process)

Seven city pages are live, indexed and linked from the footer's "Royal
Destinations" column, yet the page type was omitted from the audit brief. Any
Phase 2 design system must cover it or it will drift immediately.
