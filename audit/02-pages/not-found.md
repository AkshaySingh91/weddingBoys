# Page audit — 404 (`not-found`)

Captured via `/audit-probe-nonexistent-route`.

| | mobile | tablet | laptop | desktop |
|---|---:|---:|---:|---:|
| LCP | 380ms | 280ms | 460ms | 692ms |
| CLS | 0 | 0 | 0 | 0 |
| Low-contrast text | 4 | 4 | 4 | 4 |

## D-404-01 — The "404" headline renders black on near-black: 1.18:1 — **Critical**

| Text | Size | Colour | Background | Ratio |
|---|---|---|---|---:|
| **"404"** | **128px** | `#000000` | `#111827` | **1.18** |

A 128px headline at 1.18:1 is effectively invisible — the largest text on the
page cannot be read. `#111827` is Tailwind `gray-900`; the text colour was never
set, so it inherited `#000000`.

A visitor who hits a broken link sees a dark panel with no discernible message.

## D-404-02 — Heading level skips h1 → h3 — **Low**

`h1 "404"` → `h3` (footer newsletter). No `<h2>`, and no human-readable
explanation carrying heading semantics.

## D-404-03 — No recovery path beyond the global nav — **Medium**

The page offers no search, no popular destinations, and no suggested films —
only the standard navbar and footer. For a site with seven city landing pages and
a film archive, a 404 is a missed opportunity to recover the visit.
