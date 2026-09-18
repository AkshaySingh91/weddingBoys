# Page audit — All Films (`/allfilms`)

| | mobile | tablet | laptop | desktop |
|---|---:|---:|---:|---:|
| Page height | 5,046px | 2,596px | 2,286px | 1,866px |
| LCP | 388ms | 240ms | 284ms | 324ms |
| CLS | 0 | 0 | 0 | 0.017 |
| Low-contrast | 3 | 3 | 3 | 3 |
| Oversized images | 4 | 4 | 4 | 4 |

## D-ALLF-01 — Heading level skips h1 → h3 — **Medium**

The only headings on the page are `h1 "Search Films"` and then the footer's
`h3 "Cinematic Love Stories, Delivered to Your Inbox"`. **There is no `<h2>`.**
The film results themselves carry no headings at all, so the result set is
structurally invisible to assistive technology and to search engines.

## D-ALLF-02 — Tag chips use a third chip system — **High** (consistency)

`#F3F4F6` background, `1px #64748B` border, **16px** type. The same concept on
`/photos` is `#FEF4EE` with a `#D1D5DB` border at **14px**; on `/film-detail` it
is coral-tinted at 12px. See `03-INCONSISTENCY-MATRIX.md` §2.

## D-ALLF-03 — The filter `<select>` is a fourth input treatment — **Medium**

`radius 4px`, `border 1px #E5E7EB` (Tailwind default cool grey), `16px/normal`
type — against `/contact`'s `6px` radius, `#D1D5DB` border, 14px. Two form
controls one click apart, neither matching.

## D-ALLF-04 — Page is 5,046px on mobile vs 1,866px on desktop — **Low**

A 2.7× length multiplier on the viewport that can least afford it, from
single-column stacking with unchanged section padding.
