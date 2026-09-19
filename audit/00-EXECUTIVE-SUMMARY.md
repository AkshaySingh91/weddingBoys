# 00 — Executive Summary

**The Wedding Boys · public site · Phase 1 forensic audit**

11 public pages swept at four viewports in a real browser. 14,838 element
observations of **computed** styles. Performance measured separately against a
production build with a cold cache. **70 defects: 14 Critical, 27 High, 24
Medium, 5 Low.**

---

## What the site intends to communicate, and what it currently communicates

**Intended:** an ultra-luxury destination-wedding studio — the kind of practice
a couple flies to Udaipur for, and a planner stakes their reputation on
recommending.

**Actual:** a capable Mumbai studio whose website was assembled page by page by
different hands over a long period, and never edited as a whole. The
photography is strong. Everything framing it disagrees with itself.

The evidence for that sentence is not impressionistic. A design system exists in
`tailwind.config.js` — a complete `studio.*` palette. The public site references
it **29 times** and hard-codes arbitrary hex **511 times**. Tokens govern
**5.4%** of colour decisions. The same config is used **286 times** by the blog
subsystem, which is out of scope here and was rebuilt recently. The gap between
those two numbers is the whole finding: this is not a site without a system, it
is a system that was never applied to the pages customers actually see.

---

## The ten that do the most damage

**1. The enquiry form silently discards invalid submissions.**
`ContactClient.jsx:189` — one `if` with no `else`. A missing field or a mistyped
email produces no message, no highlight, nothing. The button looks broken. The
entire funnel ends here. *(R-01)*

**2. The form also cannot be submitted by keyboard, and rejects every
international phone number.** `type="button"` with no `onSubmit`, so Enter does
nothing; `/^[0-9]{10}$/` rejects all country codes — on a site advertising
"worldwide destinations". *(R-02, R-03)*

**3. Three of the four primary navigation items are dead on 13 of 14 pages.**
`Pricing`, `Process` and `Services` are `#fragment` links whose targets exist
only on the home page. Everywhere else, clicking them does nothing. *(R-07)*

**4. The header and footer describe two different companies.** Masthead:
"Mumbai's premier wedding filmmakers." Footer, every page: "India's premier
wedding cinematography studio … worldwide destinations." Home pricing: "We cover
all locations in Mumbai at no extra cost. **Additional charges apply for
destination weddings.**" A destination client reads all three on one scroll.
*(R-08)*

**5. White text sits on photographs with no scrim — measured 1.0:1.** Five
elements, including `/team`'s own `<h1>` "Meet Our Visionaries" and both
founders' names on `/about-us`. On `/about-us` the scrim **was written and then
commented out** (`AboutClient.jsx:105`), replaced by a peach gradient that fades
*downward* and protects nothing where the text is. *(R-06, R-21)*

**6. Both site-wide CTAs fail contrast on all 11 pages.** "Subscribe" and
"Inquire for Your Date": white on `#FF5353` = **3.17:1**. The two brand reds are
mathematically incapable of carrying white text at this size — `#FF6969` on white
is 2.81:1 — so every CTA inherits an impossible pairing. *(R-05)*

**7. The films portfolio miscategorises its own work.** The "Beach" category
contains **Varanasi** and **Solapur** — both landlocked. Zero of two correct.
"North India" is two of four. The same two films appear four times. For a studio
whose product is *place*, this is the most quietly disqualifying content on the
site. *(R-12, R-27)*

**8. `/varanasi` ships 24.3 MB.** 23.5 MB of images across 250 requests — a
146-file scroll sequence at ~230 KB each, plus 6 MB in three PNGs. Measured on a
production build with a cold cache. *(Reclassified 2026-09-19 as `X-06`: these
assets were never migrated into the media pipeline — none is served from
`media.theweddingboys.in`. Owned by the admin media backlog, not this redesign.)*

**9. The gallery's only heading is "YOU HAVE REACH THE END !"** `/photos` has no
`<h1>`. Its single content heading is the infinite-scroll terminator — a
grammatical error, in caps, with a space before the exclamation mark, marked up
as an `<h2>`. `/photos/[id]` and `/search-result` also have no `<h1>`. *(R-13,
R-35, R-43)*

**10. Nothing looks like anything else.** 136 buttons render **35** distinct
treatments; 123 cards render **24**. The site draws **176 colour values, 37 font
sizes, 132 line-heights, 41 spacing values and 25 container widths**. On
`/photos`, a single tag row contains two different chip designs — warm cream tags
beside a slate-grey "+5 more". *(R-15 – R-20)*

---

## The three that most damage luxury positioning specifically

1. **The positioning contradiction (R-08).** Luxury is a promise of certainty.
   A studio that cannot state which market it serves has already lost the
   destination client.
2. **White-on-white text (R-06).** Not a subtle contrast miss — the page heading
   of `/team` is invisible against a pale photograph. Nothing says "nobody
   checked" more loudly.
3. **The miscategorised portfolio (R-12).** Calling Varanasi a beach is the
   single detail most likely to be noticed by exactly the planner whose
   recommendation matters most.

---

## What is already good

Worth stating, because Phase 2 should not break it.

- **Alt text: 0 images missing `alt`** across all 11 pages.
- **Zero horizontal overflow** at 390 / 768 / 1440 / 1920 on every page. The
  responsive grid work is sound.
- **Skeleton coverage is broad** — 12 components. They are the wrong colour, not
  absent.
- **Font weights** are the one coherent token axis (6 values).
- **`/weddings/[city]`** is built to a visibly higher standard — the only page
  with a `<header>` landmark, and the only one using the warm `studio.border`
  token. It shows the baseline is achievable.
- **`/varanasi`**, despite weighing 24 MB, is the most confidently art-directed
  page on the site. It is a different design system, but it is *a* design system.

---

## Recommended stage ordering for Phase 2

**Stage 1 — Stop losing enquiries and stop lying (days, not weeks).**
R-01 R-02 R-03 R-04 R-07 R-08 R-12 R-13 R-22 R-23 R-24 R-27 R-34 R-35 R-39 R-51
R-52 R-53 R-64.
Almost all **S** effort. Fixing the form, the dead navigation, the positioning
copy and the taxonomy costs little and removes every defect that actively loses
business.

**Stage 2 — Establish the design system and fix accessibility (the main work).**
R-05 R-06 R-11 R-15 – R-21 R-25 R-26 R-28 – R-33 R-41 R-42 – R-47 R-49 R-50
R-54 R-55 R-57 R-58 R-59 R-62 R-63 R-65 – R-70.
One coral, one gold, a warm neutral ramp, a real type scale, a section-spacing
scale, a designed focus state, and one button / card / chip / input each. The
`studio.*` palette already exists — Stage 2 is largely *adoption*, not invention.

**Stage 3 — Performance and motion.**
R-09 R-10 R-14 R-36 R-37 R-38 R-40 R-48 R-56 R-61.
Led by `cloudflareLoader.js:30`, which disables optimisation for every local
asset and is the root cause of images served at up to **18.9×** their displayed
size. Then the 24 MB Varanasi page, the footer-driven CLS, and reduced-motion
gating for 46 infinite animations.

**Sequencing note.** Stage 1 is deliberately unglamorous and should not wait for
Stage 2. A visitor who cannot submit the form is not helped by a better colour
palette.

---

## Method, and its limits

- **Computed styles, not source.** Every value was read from the rendered DOM.
- **Performance from a production build only**, cold cache, observer installed
  pre-navigation. Dev-server numbers are not production-representative and are
  labelled where used.
- **No Lighthouse scores** — not installed. Core Web Vitals were measured
  directly instead, which is closer to the truth than a synthetic score.
- **Four findings in the brief were investigated and found not to be defects**
  — the "N" badge (dev-only), "broken images" (a harness false positive; the site
  has none), the home page's grey blocks (lazy-load pop-in), and the About
  timeline (renders correctly). Recorded as X-01 – X-05 in the register rather
  than quietly dropped.
- **Two measurement corrections** were made mid-audit and are documented in
  `06-PERFORMANCE.md`: a warm cache, and a missing LCP observer.
- **Three claims cannot be audited and are flagged for the client** (F-01 – F-03),
  including "Join 12,000 discerning couples".
- **One page type in scope was missing from the brief**: `/weddings/[city]`,
  seven live indexed pages linked from the footer.

- **Three pages could not be captured full-page** at every viewport
  (`/photos` at ≥1440, `/photos/[id]`, `/about-us` at 1920): the gallery's
  infinite scroll keeps the document growing while it is being measured, so the
  capture never completes. Those viewports are supplied as **viewport-height**
  screenshots instead, and the failure is recorded as corroborating evidence for
  R-38 rather than worked around silently.

Reproduce with `node audit/_tools/capture.mjs`, `analyze.mjs`, `perf.mjs`.
