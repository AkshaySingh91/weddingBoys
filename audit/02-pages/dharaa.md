# Page audit — Dharaa Event Management (`/dharaa-event-management`)

| | mobile | tablet | laptop | desktop |
|---|---:|---:|---:|---:|
| Page height | 4,897px | 4,146px | 2,963px | 2,939px |
| LCP | **1,872ms** | 328ms | 328ms | 192ms |
| CLS | 0 | 0 | 0 | 0 |
| Low-contrast text | **15** | 15 | **15** | 15 |
| Text over imagery | 27 | 28 | **28** | 28 |
| Oversized images | 1 | 6 | 8 | 9 |

## D-DHAR-01 — An eighth brand accent, failing contrast in both directions — **High**

`#EA580C` (Tailwind `orange-600`) is this page's accent, and it appears nowhere
else on the site:

| Text | Colour | On | Size | Ratio | Needs |
|---|---|---|---|---:|---:|
| "Explore Packages" | `#FFFFFF` | `#EA580C` | 18px | **3.56** | 4.5 |
| "Contact Us" | `#EA580C` | `#FFFFFF` | 18px | **3.56** | 4.5 |

Both directions of the same pairing fail. The page's two primary CTAs are its
two least legible elements.

Running total of distinct brand accents: `#FF6969`, `#FF5353`, `#EB4B55`,
`#E8600A`, `#FF4D4D`, `#FF8800`, `#F43F5E`, `#EA580C` — **eight**.

## D-DHAR-02 — 15 low-contrast and 28 over-image text instances — **High**

Second only to home and Varanasi for text placed over photography without a
scrim.

## D-DHAR-03 — Mobile LCP 5.7× desktop — **Medium**

1,872ms on mobile against 328ms at laptop. The page is also 4,897px tall on
mobile versus 2,963px at laptop — a 1.65× length multiplier.

## D-DHAR-04 — Sub-brand relationship is asserted, not designed — **Medium**

Dharaa is introduced as "our trusted parent company" in
`Component/DharaService.jsx`, and the page adopts an orange palette while
retaining The Wedding Boys' navbar, footer and newsletter. A visitor cannot tell
whether they are on a partner's site, a sub-brand, or a service page — the
navigation says one company and the palette says another.

Classification: **working as built, unresolved brand architecture** rather than a
rendering defect.
