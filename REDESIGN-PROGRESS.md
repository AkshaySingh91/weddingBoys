# Redesign Progress

Running state across sessions. **A new session should read `DESIGN-SYSTEM.md`
first, then this file.** Neither this file nor the design system may be assumed —
re-read both before touching code.

- **Audit:** `audit/` — 70 defects, IDs `R-01`–`R-70`, plus `F-01`–`F-03` (client
  flags) and `X-01`–`X-05` (investigated, not defects).
- **Out of scope, do not touch:** blog / editorial system, admin panel.
- **Rule:** every commit references the register IDs it closes.

---

## Stage status

| Stage | Scope | Status | Closes |
|---|---|---|---|
| **0** | Design direction + tokens + `DESIGN-SYSTEM.md` | **⏸ Awaiting approval** | defines R-15 R-16 R-17 R-18 R-46 R-47 R-63 R-66 R-67 |
| **1** | Primitives & global shell | Not started | R-05 R-07 R-08 R-14 R-19 R-22 R-30 R-31 R-32 R-39 R-40 R-45 R-65 + lands Stage 0 tokens |
| **2** | Home | Not started | R-06¹ R-23 R-26¹ R-42 R-48 R-49 |
| **3** | Films (listing, rows, detail) | Not started | R-12² R-24² R-26 R-27² R-28 |
| **4** | Gallery / Photos | Not started | R-13 R-20 R-38 R-43 R-58 R-59 |
| **5** | Our Team | Not started | R-06 R-10 R-24² R-25 R-68 R-69 |
| **6** | About Us | Not started | R-06 R-21 R-37 R-44 R-50 R-51² R-61 |
| **7** | Contact + enquiry flow | Not started | R-01 R-02 R-03 R-04 R-33 R-34 R-52 R-53 R-54 R-55 |
| **8** | Varanasi, Dharaa, Search, 404, polish | Not started | R-09 R-11 R-29 R-35 R-36 R-41 R-56 R-57 R-60 R-62 R-64 |

¹ partially — the shared primitive lands in Stage 1, the page application here.
² requires a **content/data decision from the client**; presentation only until then.

**Not assigned to a stage:** `X-01`–`X-05` need no work (investigated, not
defects). `F-01`–`F-03` are client decisions, not code.

---

## Quality floor — every stage must pass before its gate

Visual · responsive at 390/768/1440/1920 · hover + focus-visible + active +
disabled + loading + empty + error · WCAG 2.2 AA measured · LCP ≤ 2.5s,
CLS ≤ 0.1, INP ≤ 200ms p75 mobile · Lighthouse perf & a11y ≥ 95 · shared
primitives only · no dev artefacts.

---

## Baseline to beat

From `audit/06-PERFORMANCE.md` — production build, cold cache. **A redesign that
regresses any of these is a failed redesign.**

| Page | LCP mobile-4g | CLS worst | Page weight (laptop) |
|---|---:|---:|---:|
| `/` | 892ms | 0.078 | 2,389 KB |
| `/films` | 1,540ms | 0.026 | 715 KB |
| `/photos` | 724ms | **1.70** (dev, w/ scroll) | 668 KB |
| `/team` | 2,908ms | **1.594** | 667 KB |
| `/about-us` | 1,284ms | 0.000 | **4,096 KB** |
| `/contact` | 660ms | 0.000 | 1,065 KB |
| `/varanasi` | 712ms | 0.000 | **24,295 KB** |
| `/dharaa-event-management` | 1,476ms | 0.000 | 1,960 KB |
| `/weddings/udaipur` | 672ms | 0.000 | 682 KB |

Other baselines: **48 `@font-face` rules / 12 files / 352 KB** of fonts on `/`;
**176 colour values, 37 font sizes, 132 line-heights, 41 spacings, 25
max-widths** site-wide; **136 buttons in 35 treatments**; **29 token references
vs 511 arbitrary hex**.

Lighthouse is **not installed** — install before Stage 1 if scores are required
as a gate, or keep using the direct Core Web Vitals harness
(`audit/_tools/perf.mjs`), which is what produced the table above.

---

## Session log

### Stage 0 — 2026-09-18 — proposal delivered, awaiting approval

**Direction:** *lights down* — near-black ground, work is the only lit thing.
Argued from the subject (night ritual, riotous colour, the colourist's darkened
room) rather than from taste.

**Brand conflict resolved by rejecting both existing systems.** The pink goes on
arithmetic, not opinion (white on `#FF5353` = 3.17:1). But promoting the
cream-and-brown editorial system would land on warm-cream-plus-terracotta —
named in the brief's own anti-pattern list, and where the current footer already
sits. Kept its discipline, inverted the ground.

**Two corrections made to my own proposal before delivery**, both caught by
computing ratios instead of asserting them:

1. A single `#C2412C` accent failed AA in **both** directions (4.41:1 as a fill
   with bone text, 3.85:1 as text on the ground) — the identical defect the audit
   found in the existing brand. Split into `--accent-fill #A83824` (5.54:1) and
   `--accent-text #D9614A` (5.42:1).
2. `--scrim-base` at `0.45` computes to **2.71:1** over a white image — it would
   have reproduced `R-06`. Raised to `0.66` (5.64:1 worst case).

**Open at the gate** (see `DESIGN-SYSTEM.md` §11): Bodoni Moda vs Cormorant for
display; dark ground on every page or a light variant for `/contact`; whether
`/varanasi` folds into the system; three content issues needing client input.

**No code written.** Stage 0 is documentation only, per the staged process.
