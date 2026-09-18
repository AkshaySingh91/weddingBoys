# Page audit — Film detail (`/films/[videoId]`)

Captured: `/films/6806935a162b3828a2e67e85` ("Khusboo & Vedant").

| | mobile | tablet | laptop | desktop |
|---|---:|---:|---:|---:|
| LCP | 1,592ms | 220ms | 276ms | 192ms |
| **CLS** | 0.002 | **0.849** | **0.681** | **0.426** |
| Low-contrast text | **24** | **24** | **24** | **24** |
| Touch targets < 24px | 16 | 16 | 16 | 16 |

## D-FDET-01 — CLS 0.85, caused by the footer — **Critical**

Cumulative Layout Shift of **0.849** at tablet, **0.681** at laptop, **0.426** at
desktop. Google's "poor" threshold is 0.25; this is up to **3.4× poor**.

A single shift accounts for all of it, and the recorded source is
`footer.relative.w-full` firing at 209ms. The footer renders, then resizes, and
pushes everything above it. On the page where a visitor is watching a film, the
content jumps under the cursor.

Mobile is unaffected (0.002), which points at a layout that only reflows once the
footer's multi-column grid engages at `md`/`lg`.

## D-FDET-02 — 24 low-contrast text instances, including the page title — **High**

| Text | Colour | On | Size | Ratio | Needs |
|---|---|---|---|---:|---:|
| **"Khusboo & Vedant"** (h1) | `#FF6969` | `#FFFFFF` | 36px | **2.81** | 3.0 |
| "Reception" | `#FF6969` | `#FFFFFF` | 16px | **2.81** | 4.5 |

The film's title — the single most important text on the page — fails even the
relaxed large-text threshold. `#FF6969` on white cannot pass at any size; it is
a 2.81:1 pairing.

This page carries 24 such instances, 8× the site median of 3.

## D-FDET-03 — The same crew member is listed twice, with different casing — **High** (trust)

Production Team headings, in document order:

```
h3  Suraj Singh
h3  suraj singh      ← same person, lower-cased, duplicate entry
h3  Deepak
h3  Swapnil Hatkar
```

Also "Deepak" carries no surname where colleagues do. A credits list is a public
statement about the people who made the film; duplicated and mis-cased entries
read as carelessness toward one's own team.

## D-FDET-04 — 16 touch targets below 24px — **Medium**

Highest count on the site alongside `/contact`.
