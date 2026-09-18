# Page audit — Varanasi landing (`/varanasi`)

| | mobile | tablet | laptop | desktop |
|---|---:|---:|---:|---:|
| LCP | 356ms | 776ms | 360ms | 596ms |
| CLS | 0.114 | 0.092 | 0.066 | **0.195** |
| Total blocking | 0ms | **113ms** | 88ms | 88ms |
| Text over imagery | **48** | 49 | **49** | 49 |
| Low-contrast text | 4 | 4 | 4 | 4 |

## D-VARA-01 — This page is a third design system — **High** (brand coherence)

It is the only page on the site using **Cormorant Garamond** (156 computed
occurrences) and **Cinzel** (12) — across ten section components in
`app/(site)/varanasi/_sections/`. Neither typeface appears anywhere else.

The site therefore runs three unrelated visual languages:

| System | Typeface | Where |
|---|---|---|
| Coral / sans | Inter | home, films, contact, gallery |
| Editorial brown-gold | Playfair Display | footer, newsletter (all pages) |
| **Luxury serif** | **Cormorant Garamond + Cinzel** | **`/varanasi` only** |

Its inputs are equally separate: borderless, `0px` radius, 18px/300 — against
`/contact`'s 6px radius, bordered, 14px.

Read generously, `/varanasi` is a prototype of where the brand wants to go — it
is the most confidently art-directed page on the site. Read strictly, it is a
fourth-wall break: a visitor arriving from the home page's Varanasi card crosses
into what looks like a different company.

## D-VARA-02 — 49 text-over-image instances — **High**

The highest on the site after the home page. The LCP element is itself
white text over photography:
`h2.font-['Cormorant_Garamond'].text-[clamp(36px,7vw,84px)].text-white`.

Because contrast over a photograph cannot be guaranteed, each of these 49 is a
legibility risk dependent on the individual image. See `05-ACCESSIBILITY.md`.

## D-VARA-03 — Late layout shift from a `<canvas>` — **Medium**

CLS 0.195 at desktop, with the recorded source
`canvas.absolute.inset-0` firing at **4,662ms** — over four and a half seconds
after navigation. A shift that late is past the point where a visitor has begun
reading, so it displaces content under the eye rather than during load.

## D-VARA-04 — Heading level skips h2 → h4 — **Medium**

`h2` → `h4 "Priya & Arjun"` in the testimonials block. No `h3` between.

## D-VARA-05 — CTA at 3.70:1 — **Medium**

"Claim 20% Off & Send Story" renders `#FFFFFF` on `#EB4B55` at 12px = **3.70:1**
(needs 4.5). `#EB4B55` is a **third** brand red, distinct from `#FF5353` and
`#FF6969`.

## D-VARA-06 — Heaviest scripting cost on the site — **Medium**

113ms total blocking at tablet, 88ms at laptop/desktop, driven by the pinned
horizontal-scroll sections (`div.pin-spacer`, `div.horizontal-panel`) and the
canvas. The page is the most animation-dependent on the site and the most
expensive to run.
