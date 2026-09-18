# 04 — UX and Interaction Gaps

Everything beyond static styling: what the site does while it is waiting, when it
has nothing to show, when something fails, and when a visitor tries to use it.

---

## 1. Loading states

| Treatment | Count |
|---|---:|
| Components with `animate-pulse` skeletons | **12** |
| Route-level `loading.jsx` segments | **0** |
| Images with `placeholder="blur"` | **0** |
| Spinners | **0** |

**What works.** Skeleton coverage is broader than expected — 12 components render
pulse placeholders while their data loads, including the home page's four data-fed
sections, films, allfilms, team, photos and both search result lists.

**What does not.**

1. **The skeletons are off-brand.** They are drawn in Tailwind `slate-400`
   `#94A3B8` and `slate-200`, cool blue-greys, on a warm cream page. `#94A3B8` is
   the **single most-used background colour on the public site** (308
   occurrences) and its only job is to represent absence. This is why they read
   as "broken grey boxes" rather than as loading — the colour does not belong to
   the palette.

2. **No route-level loading UI.** With zero `loading.jsx` segments, navigating
   between pages shows the *old* page until the new one is ready. On a slow
   connection a visitor who taps "Films" sees the home page continue to sit there
   with no acknowledgement.

3. **No image placeholders.** Zero `placeholder="blur"` anywhere. Every image
   pops from empty background to full photograph. On the home page's "Our Magical
   Offerings" cards this produces the grey rectangles that prompted this audit —
   the images are fine; they simply arrive without any transition. Combined with
   images up to **18.9× oversized** (`06-PERFORMANCE.md`), the pop-in window is
   far longer than it needs to be.

---

## 2. Error states

**There is no error boundary anywhere on the public site.** Zero `error.jsx`
route segments. Any thrown render error produces Next's default error screen
— unbranded, untranslated, and with no route back into the site.

Per-feature error handling is similarly thin:

- `/contact` — a failed API call surfaces a SweetAlert2 modal that
  **auto-dismisses after 1,000ms** (`ContactClient.jsx`, `timer: 1000`).
- `/search-result` — renders nothing distinguishable for "no results", "still
  loading" and "request failed" (see `02-pages/search.md` D-SRCH-03).
- Image failures — no `onError` fallback on any `next/image` in the public site.

---

## 3. Empty states

| Surface | Empty state |
|---|---|
| `/search-result` | **none** — indistinguishable from loading or failure |
| `/photos` end of feed | "YOU HAVE REACH THE END !" — grammatically wrong, all-caps, marked up as the page's only `<h2>` |
| `/films` category with few items | no empty state; the row simply leaves **55.6% of the viewport blank** |
| Newsletter after submit | not verifiable without submitting |

---

## 4. Interactive feedback

### Focus
No focus state has been **designed** anywhere on the site. All 460 focusable
elements that show a ring show the **browser default** — measured values include
`outline: auto 1px rgb(0, 95, 204)` and `auto 2px rgb(122, 59, 132)`. A blue
default ring on a warm cream and coral palette is both visually foreign and, over
photography, close to invisible. Four elements show no ring at all.

### Pressed / active
**No `:active` treatment observed on any button across 11 pages.** A visitor
taps a CTA and receives no acknowledgement until the next page paints — which,
with no route-level loading UI (§1), may be seconds.

### Hover
Present and generally the one healthy interaction axis — but its timing is not
coordinated: **9 distinct transition durations** site-wide (0.075s → 1s) with
3 easings, mostly Tailwind defaults left in place.

---

## 5. Forms — `/contact`, the conversion path

The detail is in `02-pages/contact.md`. The interaction summary:

| Question | Answer |
|---|---|
| Does an invalid submission tell the user anything? | **No.** The guard has no `else`; the button appears inert. |
| Are required fields marked? | **Inverted.** 3 mandatory fields carry no asterisk; no field has `required`. |
| Can the form be submitted by keyboard? | **No.** `type="button"`, no `onSubmit` — Enter does nothing. |
| Do mobile keyboards adapt? | **No.** Phone/email share one `type="text"` field. |
| Can an international client enquire? | **No.** `/^[0-9]{10}$/` rejects every country code. |
| Is there field-level validation? | **No.** |
| Is the success message correct? | **No** — "Your message has been **revived**". |

For a studio whose entire funnel ends here, this is the highest-value repair on
the site.

---

## 6. Navigation and wayfinding

- **3 of 4 primary nav items are inert on 13 of 14 pages** — `#pricing`,
  `#process`, `#services` resolve only on `/`. (`global-shell.md` D-SHELL-01.)
- **Header and footer navigation list different destinations**; the footer's
  "Dharaa Events" appears in neither navbar list.
- **A hamburger renders beside a visible desktop nav** between `md` and `xl`.
- **No breadcrumbs** on any page, including the seven `/weddings/[city]` pages
  and both detail routes.
- **No skip link**, with ~45 tab stops before content.
- **No active-state indication** in the footer nav.

---

## 7. Scroll behaviour

Motion is scattered rather than composed:

- `Component/Background.jsx` — 18 infinite Framer Motion loops on **every page**
- `/varanasi` — GSAP pinned horizontal panels plus a `<canvas>`, the heaviest
  scripting on the site (113ms TBT) and a layout shift at **4.6s**
- `/photos` — infinite scroll that never settles (CLS **1.70** in development)
- 46 `repeat: Infinity` animations across the public site
- 25 files import `framer-motion`, 6 import `gsap`

Only **2 of 31** motion-using files consult `prefers-reduced-motion`.

---

## 8. Perceived performance

| Symptom | Evidence |
|---|---|
| Image pop-in | 0 blur placeholders; images up to 18.9× oversized |
| Layout shift | `/photos` CLS **1.70**, `/films/[id]` **0.85** (dev); home **0.078** (production, cold) |
| Font swap | 5 typefaces; Playfair's fallback chain names *DM Serif Display*, a 4th serif, so the swap is between two unlike serifs |
| Dead navigation | no route-level loading UI |

---

## 9. Mobile-specific breakdowns

This audience arrives on a phone.

| Finding | Value |
|---|---|
| Home page length at 390px | **20,199px — 24 viewport heights** |
| `/allfilms` length at 390px | 5,046px vs 1,866px at desktop (**2.7×**) |
| `/dharaa` length at 390px | 4,897px vs 2,939px (1.7×) |
| Touch targets < 24px, home mobile | **25** |
| WhatsApp button below 640px | **does not pin** — no base `bottom`/`right` |
| Mobile LCP outliers (dev) | `/weddings/udaipur` **6,576ms**, `/search-result` 2,804ms, `/films` 2,396ms |
| Oversized images, home mobile | **20** |

The pattern: layouts stack correctly — **no horizontal overflow at any viewport
on any page** — but section padding and image budgets are never adjusted, so
mobile inherits desktop's weight at a fraction of the bandwidth.
