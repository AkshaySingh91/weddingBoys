# Page audit — About Us (`/about-us`)

| | mobile | tablet | laptop |
|---|---:|---:|---:|
| LCP | 436ms | 280ms | 316ms |
| CLS | 0 | 0 | 0 |
| Low-contrast text | 13 | 13 | 13 |
| Text over imagery | 15 | 15 | 15 |
| Page height (laptop) | | | 4,086px |

## D-ABOU-01 — The hero scrim exists in the source and is commented out — **Critical**

`app/(site)/about-us/_components/AboutClient.jsx:105`:

```jsx
{/* <div className="absolute inset-0 bg-black bg-opacity-30 backdrop-blur-sm"></div> */}
<div className="absolute inset-0 bg-gradient-to-b from-[#ffdccc7b] to-transparent" />
```

The layer that made the copy legible was written, then disabled, and replaced by
a gradient that runs in the **wrong direction for the problem**:

- computed: `linear-gradient(rgba(255, 220, 204, 0.482), rgba(0, 0, 0, 0))`
- it is a **peach tint at 48% opacity at the top**, fading to **fully transparent
  at the bottom**
- it therefore *lightens* the upper region, where there is no text, and offers
  **zero** protection to the lower region, where the heading and body copy sit

Body copy is `#74583E` (mid brown) and the heading `#54382E` — both dark-ish
warm browns — set over a **bright, high-key beach photograph** (pale sand, white
shirt, blown highlights). The paragraph crosses the subject's white shirt.

This is not a near-miss. A dark scrim was authored, removed, and replaced with a
light one.

## D-ABOU-02 — Founder names measure 1:1 — **Critical**

| Text | Size | Ratio |
|---|---|---:|
| "Yogesh Dubey" | 30px | **1.0** |
| "Founder" | 18px | **1.0** |
| "Aman Singh" | 30px | **1.0** |
| "Founder" | 18px | **1.0** |

`#FFFFFF` on an effective background of `#FFFFFF`. Identical pattern to `/team`
and the home film cards.

## D-ABOU-03 — Timeline and stat badges at 2.81:1 — **High**

`#FFFFFF` on `#FF6969` at 20px measures **2.81:1** against a 4.5 requirement.
Affects the year badges (`2015`, `2018`, `2020`, `2022`, `Present`) and the stat
figures (`1000+`, `10+`).

`#FFFFFF` on `#FF6969` cannot pass at any text size — the pair tops out at 2.81.
Every use of white-on-`#FF6969` across the site inherits this.

## D-ABOU-04 — The perceived "empty region" is the timeline working as designed — **Medium**

*Correcting the brief's hypothesis.* The timeline is **not** a failed component.
It renders 5 entries (2015, 2018, 2020, 2022, Present) as white cards with
shadows, alternating left and right of a 2px vertical gradient spine
(`div.absolute.left-1/2.w-0.5.h-full.bg-gradient-to-*`), across 59 laid-out
elements in a 1,022px section.

What reads as emptiness is structural: each row is `flex items-center` with a
`w-1/2` card, so **half of every row is intentionally blank**, and the only thing
occupying the centre is the 2px line. At 1440px that is ~440px of white space
beside each card, five times over.

Classification: **working as built, poor decision** — not a defect to repair but
a layout to reconsider.

## D-ABOU-05 — Heading level skips h1 → h3 — **Medium**

`h1 "Crafting Timeless Love Stories"` → `h3 "Yogesh Dubey"`. No `<h2>` until
"Our Journey Through Time", well down the page.

## D-ABOU-06 — Two different statistics both read "1000+" — **Medium** (trust)

The stat band claims **1000+ Happy Couples** and **1000+ Moments Captured**,
alongside "Trusted by 1000+ Couples". A studio that has filmed 1,000 weddings has
captured vastly more than 1,000 moments; the two figures cannot both be right.
Flag for the client alongside the newsletter's "12,000 discerning couples"
(see `07-SEVERITY-REGISTER.md`, unverified claims).

## D-ABOU-07 — Hero background is a CSS `background-image`, not `next/image` — **Medium**

LCP element: `div.absolute.inset-0.bg-cover`, source
`/_next/static/media/aboutPageImg1.jpg`. As a CSS background it is outside
`next/image` entirely: no responsive `srcset`, no format negotiation, no
priority hint, and it cannot be lazy-loaded or optimised by the pipeline.
