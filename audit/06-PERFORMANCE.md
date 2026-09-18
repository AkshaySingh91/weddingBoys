# 06 — Performance

## Method, and an important caveat

Lighthouse is not installed in this environment, so there are no Lighthouse
*scores*. Instead the Core Web Vitals were measured directly, which is closer to
the truth anyway: a `PerformanceObserver` for `largest-contentful-paint`,
`layout-shift` and `longtask` is injected **before any page script** via
`Page.addScriptToEvaluateOnNewDocument`, so it covers the entire load.

**All numbers below come from a production build** (`next build && next start`,
port 3100) with the **HTTP and memory caches disabled and the browser cache
cleared before every navigation**. The design sweep in the other documents ran
against `next dev`, which is valid for computed styles (identical CSS and DOM)
and worthless for performance.

Two measurement corrections were needed to get here, both recorded so the numbers
can be trusted:

1. A first pass reported `img 0KB` and `/photos` CLS 0 — a **warm cache**. The
   gallery does not shift when its images are already decoded.
2. `getEntriesByType('largest-contentful-paint')` returns nothing without a
   registered observer, so an earlier run reported LCP `null` everywhere.

Profiles: **mobile-4g** = 390×844 throttled to 9 Mbps / 150ms RTT;
**laptop** = 1440×900 unthrottled. Neither runs the scroll pass, so these are
**initial-load** weights.

Raw data: `audit/_data/_perf-production.json`.

---

## 1. Page weight — the headline

| Page | laptop total | of which images | requests | images |
|---|---:|---:|---:|---:|
| **`/varanasi`** | **24,295 KB** | **23,497 KB** | **250** | **217** |
| `/about-us` | 4,096 KB | 3,168 KB | 51 | 8 |
| `/` | 2,389 KB | 1,535 KB | 59 | — |
| `/dharaa-event-management` | 1,960 KB | 1,284 KB | 56 | — |
| `/contact` | 1,065 KB | 401 KB | 41 | — |
| `/films/[id]` | 880 KB | — | 98 | — |
| `/allfilms` | 717 KB | 42 KB | 44 | — |
| `/films` | 715 KB | 42 KB | 44 | — |
| `/weddings/udaipur` | 682 KB | — | 47 | — |

### P-01 — `/varanasi` ships 24 MB on a single page view — **Critical**

**23.5 MB of images across 217 image requests.** Two mechanisms:

**a) A scroll-driven frame sequence.** ~214 files under `/director-frames/`
(`Timeline_1_001.webp` … `Timeline_1_010.webp` …) at roughly **230 KB each**,
fetched on page view. This is `Component/media/SequenceAnimator.jsx` — a video
implemented as several hundred individual stills.

**b) Multi-megabyte PNGs used for artwork:**

| Asset | Size | Format |
|---|---:|---|
| `culture-rituals.png` | **2,368 KB** | PNG |
| `culture-aarti.png` | **1,978 KB** | PNG |
| `fragmentLight.png` | **1,745 KB** | PNG |

**6 MB in three files**, in a format chosen for lossless line art being used for
painted/photographic artwork. As WebP or AVIF these would be a small fraction of
the size.

A prospective client on a hotel connection, or on mobile data, will not finish
loading this page. It is also the page the home page pushes hardest.

### P-02 — `/about-us` ships a single 1.9 MB JPEG — **High**

`aboutPageImg7.jpg` at **1,881 KB**, inside a 4.1 MB page with 400ms of total
blocking time — the highest TBT measured in production.

---

## 2. Cumulative Layout Shift

Google: good ≤ 0.1, poor > 0.25.

| Page | Profile | CLS | Verdict |
|---|---|---:|---|
| **`/team`** | mobile-4g | **1.5944** | **6.4× poor** |
| `/` | laptop | 0.0775 | good |
| `/photos` | mobile-4g | 0.0555 | good |
| `/` | mobile-4g | 0.0348 | good |
| `/films` | laptop | 0.0258 | good |
| everything else | — | < 0.01 | good |

### P-03 — `/team` CLS 1.59 on mobile, caused by the footer — **Critical**

Two shifts account for nearly all of it:

```
0.8294 @1573ms   sources: section.team-members.max-w-7xl, footer.relative.w-full
0.7646 @1739ms   sources: footer.relative.w-full, section.team-members, button.absolute.left-4
```

The footer appears in **both** shift records, and the same signature drives
`/films/[videoId]` (CLS **0.85** at tablet, **0.68** at laptop, measured in dev).

**The global footer is a repeat layout-shift offender.** It renders, then
reflows — most likely as its multi-column grid and social row resolve — and
displaces everything above it. Because it is global, every page is exposed; it
surfaces worst where the content above it is short enough for the shift to
dominate the viewport.

### P-04 — `/photos` CLS 1.70 in development, 0.06 in production — **High, needs field data**

The development sweep measured **1.7011** (tablet) and **1.3814** (laptop) on the
gallery. The production cold-cache run measured **0.0555** / **0.0021**.

The difference is that `perf.mjs` does **not scroll**, and `/photos` is an
infinite-scroll masonry — the shifts occur as the visitor scrolls and new rows
load, which the production pass never triggered. The development figure, captured
*with* a scroll pass, is the one that reflects real use.

The corroborating evidence is that the capture harness could not complete a
full-page screenshot of `/photos` at laptop width: the document kept growing
while being measured.

**This needs field data (real-user monitoring) to settle.** It is recorded as
High rather than Critical because the two measurements disagree and the
disagreement is explained.

---

## 3. Largest Contentful Paint

| Page | mobile-4g | laptop | LCP element |
|---|---:|---:|---|
| **`/team`** | **2,908 ms** | 164 ms | `p.text-gray-600` (**text**) |
| `/films` | 1,540 ms | 252 ms | image |
| `/dharaa-…` | 1,476 ms | 248 ms | image |
| `/about-us` | 1,284 ms | 664 ms | `div.absolute.inset-0.bg-cover` (CSS background) |
| `/` | 892 ms | 272 ms | hero image |
| `/allfilms` | 872 ms | 140 ms | image |
| `/varanasi` | 712 ms | 380 ms | Cormorant `h2`, white over photo |
| others | 560–724 ms | 76–304 ms | — |

All production LCP values are within Google's 2.5s "good" threshold except
`/team` on mobile at **2,908 ms** — and that LCP element is a **paragraph**, not
an image, meaning the text itself is blocked behind client-side data fetching.

### P-05 — Hero images that `next/image` cannot optimise — **Medium**

`/about-us`'s LCP element is `div.absolute.inset-0.bg-cover`, a CSS
`background-image`. As a CSS background it sits outside `next/image` entirely:
no `srcset`, no format negotiation, no priority hint, no lazy control.

---

## 4. Image optimisation — the root cause

### P-06 — The custom loader disables optimisation for every local asset — **Critical**

`Next-Frontend/cloudflareLoader.js:30`:

```js
if (!CDN || src.startsWith('data:') || src.startsWith('blob:')
    || src.startsWith('/') || src.includes('orig=1') || src.includes('no-snap=1')) {
    return src;
}
```

`NEXT_PUBLIC_CDN_URL` is set, so the custom loader is active — which **disables
Next's built-in optimiser globally**. The loader then returns `src` unchanged for
anything starting with `/`, i.e. **every locally imported `@/Asset/*` image**.

Result: local assets have **no responsive variants, no format negotiation and no
resizing**. They are served at full original resolution to every device. The
three `next/image` console warnings on the home page ("has a `loader` property
that does not implement width") are this mechanism reporting itself.

This single line explains the oversize measurements across the site:

| Page | Asset | Natural | Displayed | Waste |
|---|---|---|---|---:|
| `/photos` | CDN photo | 6048×4032 | 331×296 | **18.3×** |
| `/photos/[id]` | CDN photo | 6048×4032 | 320×320 | **18.9×** |
| `/` | `homeImage1.jpg` | 6048×4032 | 401×256 | **15.1×** |
| `/` | `homeImage3.jpg` | 5504×8256 | 401×256 | **13.7×** |
| `/team` | portrait | 3024×2968 | 294×256 | **10.3×** |
| `/dharaa-…` | — | 5260×3507 | 512×347 | **10.3×** |

Oversized-image counts per page (dev sweep, laptop): `/photos` **25**,
`/photos/[id]` **20**, `/` **16**, `/dharaa` **8**, `/team` **8**, `/films` **8**.

### P-07 — Zero blur placeholders — **Medium**

`placeholder="blur"` appears **0 times** in the public site. Combined with
oversized originals, every image transitions from empty background to full
photograph with a long window in between.

---

## 5. Scripting

| Page | TBT laptop | TBT mobile-4g |
|---|---:|---:|
| `/about-us` | **400 ms** | 0 ms |
| `/dharaa-…` | 110 ms | 133 ms |
| `/contact` | 130 ms | 0 ms |
| `/photos` | 65 ms | 0 ms |
| `/` | 6 ms | 16 ms |

Development figures were higher across the board (`/photos` 180ms, `/varanasi`
113ms), consistent with unminified bundles.

25 files import `framer-motion` and 6 import `gsap`; 46 animations run on
`repeat: Infinity`, including 18 in `Component/Background.jsx` on **every page**.

---

## 6. Summary of recommended investigation (not solutions — Phase 2)

| Finding | Page(s) | Measured |
|---|---|---|
| 24 MB page | `/varanasi` | 23.5 MB images, 217 requests |
| 214-frame image sequence | `/varanasi` | ~230 KB × ~214 |
| Multi-MB PNGs | `/varanasi` | 6 MB in 3 files |
| 1.9 MB single JPEG | `/about-us` | `aboutPageImg7.jpg` |
| Footer-driven CLS | `/team`, `/films/[id]` | 1.59 / 0.85 |
| Infinite-scroll CLS | `/photos` | 1.70 (dev, with scroll) |
| Loader bypasses optimisation | all | `cloudflareLoader.js:30` |
| Text LCP 2.9 s | `/team` | mobile-4g |
