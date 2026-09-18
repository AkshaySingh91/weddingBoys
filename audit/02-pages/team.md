# Page audit — Our Team (`/team`)

| | mobile | tablet | laptop | desktop |
|---|---:|---:|---:|---:|
| LCP | — | — | 328ms | — |
| CLS | 0 | 0 | 0 | 0 |
| Low-contrast text | 19 | 19 | **19** | 19 |
| Oversized images | 8 | 8 | 8 | 8 |

## D-TEAM-01 — Every name and role on the page measures 1:1 contrast — **Critical**

Nineteen low-contrast instances, and the majority are the worst possible value:

| Text | Size | Colour | Effective bg | Ratio |
|---|---|---|---|---:|
| **"Meet Our Visionaries"** (h1) | 48px | `#FFFFFF` | `#FFFFFF` | **1.0** |
| "Our strong team of creative professionals…" | 20px | `#FFFFFF` | `#FFFFFF` | **1.0** |
| "Yogesh Dubey" | 18px | `#FFFFFF` | `#FFFFFF` | **1.0** |
| "Founder" | 14px | `#FFFFFF` | `#FFFFFF` | **1.0** |
| "Aman Singh" | 18px | `#FFFFFF` | `#FFFFFF` | **1.0** |

White text is placed over photographs with **no scrim, no gradient and no
background colour**. Where the photograph happens to be dark the text is
readable; where it is bright — a white lehenga, a sunlit wall, a pale sky — the
name disappears. The page heading itself is in this state.

This is the same defect as the home page's film cards (D-HOME-02) and the About
hero (D-ABOU-01), which makes it a pattern rather than three accidents: the
studio's house style is white-on-photo, and the scrim that makes that style work
is missing everywhere.

## D-TEAM-02 — Names are inconsistently cased, and one person appears twice — **High** (trust)

The seven credited team members, verbatim:

```
Yogesh Dubey      ✅
Aman Singh        ✅
Suraj singh       ← lower-case surname
Karan             ← no surname
Swapnil Hatkar    ✅
Anand yadav       ← lower-case surname
Swapnil           ← no surname; almost certainly the same person as "Swapnil Hatkar"
```

Two of seven have lower-cased surnames, two have no surname, and one appears to
be duplicated. The same defect appears on `/films/[videoId]`, where the crew list
contains both "Suraj Singh" and "suraj singh".

These are the studio's own colleagues. A prospective client reading a team page
where half the names are inconsistently formatted draws a conclusion about how
the studio handles detail.

## D-TEAM-03 — Portraits are cropped from four different aspect ratios into one box — **High**

Every portrait renders at **294×256** (≈1.15:1). The sources:

| Source | Aspect | Cropped into 294×256 | Waste |
|---|---|---|---:|
| 1080×1350 | 4:5 portrait | severe vertical crop | 3.7× |
| 1485×2227 | 2:3 portrait | severe vertical crop | 5.1× |
| 3024×2968 | ~1:1 square | mild crop | **10.3×** |
| 3426×2268 | 3:2 landscape | mild crop | 2.4× |

Portraits shot in portrait orientation are being cropped to a near-square
landscape box, so heads sit at different heights and framing varies member to
member. The grid reads as unedited because it is.

## D-TEAM-04 — Orphaned final row — **Medium**

Seven members in a four-column grid produce **4 + 3**, leaving a gap the width of
one card at the end of the list. With no filler or centring rule the grid
terminates ragged.

## D-TEAM-05 — Portrait cards are square while hero images are 16px rounded — **Low**

`border-radius: 0px` on the portraits against `16px` on the page's hero imagery —
two card languages on one page.
