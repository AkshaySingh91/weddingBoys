# The Wedding Boys — Design System

**Status:** Stage 0 approved. Direction revised 2026-09-19 after the first
attempt (a dark ground) was built and rejected — see §1. Stage 1 built on this.
**Scope:** public site only. Blog/editorial and admin are explicitly out of scope.
**Evidence base:** `audit/` (70 defects; IDs referenced as `R-xx`).

---

## 1. Design direction — revised 2026-09-19

> **This replaces a first direction ("lights down", a near-black ground) that was
> built, reviewed and rejected.** The rejection was right and the reasoning is
> worth keeping: a restrained dark frame reads as Western editorial minimalism.
> It made the site look calm and professional and *plain* — and plainness is a
> poor description of an Indian wedding. The structural work from that pass
> survives untouched; only the surface changed.

**The idea: under the arch.**

Indian weddings are maximal on purpose. Marigold by the kilo, gold thread, red
silk, a mandap built for one day and dismantled the next. A site that presents
that work through a neutral grid is describing a different wedding — a Western
one. So the ornament is part of the system rather than something applied on top
of it, and it comes from the architecture the work is shot in.

Three devices carry it, all built in CSS so there is no asset to go missing:

- **The arch.** Imagery sits in a dome-topped mehrab frame, not a rounded
  rectangle. This is the one memorable move — recognisably Indo-Islamic palace
  architecture, and impossible to mistake for a template.
- **Jaali.** The pierced lattice screen, drawn as two crossed hairline grids.
  Used behind sections at low opacity, never under text.
- **Gold thread.** Hairlines with diamond terminals, corner brackets. Metal as a
  line, never as a fill — a gold *fill* is where luxury turns into a wedding
  invitation.

The ground is warm ivory, the colour of raw silk and heavy card stock. Never a
cool white: it turns every gold grey and does no favours to Indian skin tones.

The register is **rich but ordered**. The ornament is systematic — three devices,
tokenised, used consistently — which is what separates decoration from mess. The
failure mode to avoid is not "too much"; it is "arbitrary".

---

## 2. Resolving the brand conflict

The audit found two competing systems — a hot pink/coral one (`#FF6969` ×125,
`#FF5353` ×24, plus four more reds) and a brown-gold serif editorial one — plus a
third on `/varanasi` in Cormorant and Cinzel.

**The pink goes, on arithmetic rather than taste.** White on `#FF5353` is
**3.17:1** and `#FF6969` on white is **2.81:1**; every CTA on the site inherits a
pairing that cannot reach AA at body size. That is not a preference.

**The warm editorial direction is kept and made specific.** The concern that sent
the first attempt dark was real — warm cream plus terracotta plus Playfair is the
most common output of generated design work, and the old footer already sat
there. But the answer to "this looks generated" is not to remove colour. It is to
add ornament that no generator reaches for: the arch, the jaali, the gold
terminal. Cream is generic *undecorated*. Decorated, it is the room.

**The accent is sindoor** — `#A83824`, a deep vermilion. Culturally exact rather
than decorative, and deep enough to read as expensive where `#FF6969` reads
cheerful. **Marigold** joins it as ornament, and **gold** as the metal.

One practical dividend of the light ground: at 6.45:1 for white-on-accent and
5.99:1 for accent-on-ground, **a single accent value does both jobs**. The dark
ground needed two separate reds to reach AA.

---

## 3. Colour

Named by role. Components consume tokens only.

### 3.0 The hierarchy — stated, because it drifts

**Red is the primary brand colour.** Gold and cream are ornament and ground.
They are not substitutes for red and must not quietly take its place.

Client, verbatim, 2026-09-19: *"Our primary color is red dont forget this, gold
& cream is just we can use for decorative or bg."*

This was written down because the drift had already started: a headline on the
home page was offered a gold treatment where the brand's own red belonged. When
red fails contrast in a given position, the answer is **the red token that
passes**, never a different hue:

| Need | Token | Ratio |
|---|---|---|
| Red as a fill (buttons, chips, indicators) | `--accent` `#D9342A` | white on it **4.69:1** |
| Red **as text** on ivory | `--accent-ink` `#A83824` | **5.99:1** |
| Red as a tint or wash behind content | `--accent-wash` / `--accent-tint` | ground only |

`--accent` used *as text* measures 4.36:1 and does not pass — that is the whole
reason `--accent-ink` exists. Reach for it rather than reaching for gold.

### 3.1 Core

| Token | Value | Role | Verified |
|---|---|---|---|
| `--ground` | `#FBF6EE` | the page — warm ivory | — |
| `--ground-raised` | `#FFFFFF` | cards, panels | — |
| `--ground-sunk` | `#F4EBDD` | wells, skeletons | — |
| `--ground-deep` | `#2A1B12` | inverted sections | — |
| `--ink-primary` | `#2A1B12` | headings, body | **15.44:1** |
| `--ink-secondary` | `#5E4636` | supporting copy | **8.12:1** |
| `--ink-muted` | `#7A6355` | meta, captions | **5.21:1** |
| `--accent` | `#A83824` | sindoor — fill **and** text | white on it **6.45:1**; on ground **5.99:1** |
| `--marigold` | `#E08B2C` | **ornament only** — 2.47:1 | never carries text |
| `--marigold-ink` | `#A85B12` | saffron that must read | **4.68:1** |
| `--gold` | `#C9A227` | ornament, arch edges — 2.25:1 | decorative only |
| `--gold-strong` | `#A8862E` | rules that carry meaning | **3.19:1** |
| `--focus-ring` | `#A83824` | 2px, 2px offset | **5.99:1** |

Marigold and gold are deliberately below text thresholds and are **constrained to
ornament** by the token names. A decorative colour that is allowed to become text
is how the audit's 122 contrast failures happened.

### 3.2 Scrims — still mandatory

A light page does **not** make white text on a photograph legible. Every value is
solved against a pure-white image, so the guarantee holds on a blown-out frame.

| Token | Value | Use | Worst case |
|---|---|---|---|
| `--scrim-base` | `rgba(28,17,10,0.66)` | labels and captions on imagery | **5.6:1** |
| `--scrim-strong` | `rgba(28,17,10,0.74)` | body copy on imagery | **7.6:1** |
| `--scrim-gradient-bottom` | 0.88 → 0.66 → transparent | bottom-anchored captions | 5.6:1 at the 30% stop |
| `--scrim-gradient-hero` | 0.92 → 0.62 → 0.35 | display copy over full-bleed | 4.85:1 at the 55% stop |

**This is now the load-bearing fix for the audit's largest defect class.** On the
dark ground, white-on-photograph text was masked — `/team` measured 2 low-contrast
instances instead of 19 without anything being repaired. On ivory the problem is
visible again and has to be solved properly: `<Media>` refuses to render an
overlay without a scrim token.

### 3.3 Ornament tokens

| Class | What it is |
|---|---|
| `.arch` / `.arch-soft` | dome-topped mehrab frame for imagery |
| `.jaali` / `.jaali-dense` | pierced lattice, two crossed hairline grids |
| `.rule-ornament` | gold rule with diamond terminals |
| `.corners` | gold corner brackets for emphasised panels |

All CSS-only. The ornament this replaces was a truncated base64 data URI that
threw `ERR_INVALID_URL` on every page and never rendered once — ornament that
depends on a file is ornament that can silently disappear.

## 4. Typography

### 4.1 The current state

`app/fonts.js` declares **eight** Google families. Measured on the home page:
**48 `@font-face` rules, 12 files, 352 KB downloaded** — to render **two**
families (`R-66`). Six families are paid for and unused.

### 4.2 The decision

**Two families. From 352 KB to roughly 90 KB.**

| Role | Family | Why |
|---|---|---|
| **Display** | **Bodoni Moda** (variable, `opsz` axis) | A true didone. Fashion-editorial rather than wedding-industry; high stroke contrast that glitters on a dark ground. Deliberately *not* Playfair Display, which is the category default and appears on roughly every competitor. |
| **Text** | **Inter** (variable) | Already in the bundle. Excellent at small sizes on dark, where a high-contrast serif would fall apart. The distinctiveness should come from the display face and the composition, not from a quirky body face. |

**Risk, stated honestly:** Bodoni's hairlines can disappear at small sizes and
light weights on dark. Mitigations are binding: display face is used at **≥28px
only**, minimum weight **500** (never 300), and the `opsz` axis is set so small
optical sizes thicken the hairlines.

**Named alternative, if you find Bodoni too cold:** Cormorant Garamond — softer,
more romantic, already loaded, and already carrying `/varanasi`, the site's
best-art-directed page. It is the safer and slightly more expected choice. I
recommend Bodoni; the decision is yours at this gate.

Dropped: Oxygen, Lato, Cinzel, Great Vibes, DM Serif Display, Lora.

### 4.3 Scale

Named by role. The mobile column is a **separate decision**, not a scale-down —
display sizes compress much harder than body sizes because line count matters
more than drama on a phone.

| Role | Desktop | Mobile | Weight | Line-height | Tracking | Measure |
|---|---|---|---|---|---|---|
| `display-hero` | 76px | **40px** | 500 | 1.02 | −0.02em | 14ch |
| `display-1` | 56px | 32px | 500 | 1.08 | −0.015em | 18ch |
| `display-2` | 40px | 27px | 500 | 1.12 | −0.01em | 22ch |
| `heading-1` | 30px | 24px | 600 | 1.22 | −0.005em | 30ch |
| `heading-2` | 24px | 20px | 600 | 1.30 | 0 | 34ch |
| `heading-3` | 19px | 17px | 600 | 1.38 | 0 | 40ch |
| `body-lead` | 19px | 17px | 400 | 1.62 | 0 | **66ch** |
| `body` | 16px | 16px | 400 | 1.68 | 0 | **68ch** |
| `body-sm` | 14px | 14px | 400 | 1.60 | 0 | 62ch |
| `caption` | 13px | 13px | 400 | 1.45 | 0.01em | 48ch |
| `label` | 12px | 12px | 600 | 1.30 | 0.06em | — |

Display roles use Bodoni Moda; everything from `heading-1` down uses Inter.
**11 roles replacing 37 rendered sizes** (`R-15`).

Body never goes below 16px. The audit found 10px venue meta on
`/weddings/[city]` (`R-03` family) — that size does not exist in this system.

---

## 5. Spacing, radius, borders, elevation, layout

### 5.1 Spacing — base 4, one scale

`0 · 4 · 8 · 12 · 16 · 24 · 32 · 48 · 64 · 96 · 128 · 160`

Twelve steps replacing 41 rendered values (`R-15`). Section rhythm is a separate,
smaller set so page cadence is a deliberate choice rather than an accident:

| Token | Desktop | Mobile |
|---|---|---|
| `--section-tight` | 64px | 48px |
| `--section` | 96px | 64px |
| `--section-loose` | 160px | 96px |

### 5.2 Radius — small set, mapped to type

`0 · 2px · 4px · 999px`

Deliberately austere. Sharp corners read more expensive than soft ones, and it
directly counters the "identical rounded cards everywhere" tell.

| Component | Radius |
|---|---|
| Image cards, media frames, sections | **0** |
| Inputs, small controls | 2px |
| Chips, avatars, icon buttons | 999px |
| Buttons | 2px (not pills — pills read consumer) |

### 5.3 Elevation — by light, not by shadow

**On a near-black ground, drop shadows are close to invisible.** Chasing them
produces the "same soft grey shadow everywhere" tell while achieving nothing.
Elevation is expressed as **surface lightening plus a hairline**:

| Level | Surface | Border | Use |
|---|---|---|---|
| `flat` | `--ink-void` | none | page |
| `raised` | `--ink-raised` | `--border-subtle` | cards, panels |
| `overlay` | `#1A1714` | `--border-strong` | menus, dialogs, lightbox chrome |

One real shadow exists, for genuinely floating chrome only:
`--shadow-overlay: 0 24px 64px -12px rgba(0,0,0,0.7)`. Four values replace 18
(`R-46`).

### 5.4 Layout

| Token | Value |
|---|---|
| `--container-prose` | 720px |
| `--container-content` | 1180px |
| `--container-wide` | 1440px |
| `--container-bleed` | 100vw |
| Gutter | 20px mobile / 32px tablet / 48px desktop |

Four containers replace 25 rendered `max-width` values (`R-63`). Breakpoints
actually used: **640 / 1024 / 1440**. Three, not five — `md` was barely used and
its absence is why the hamburger currently sits beside a visible nav (`R-39`).

### 5.5 z-index — a named scale

`base 0 · raised 10 · sticky 100 · header 200 · overlay 300 · modal 400 · toast 500`

Replaces nine ad-hoc values including a `z-1000` escape hatch (`R-46`).

---

## 6. Motion

**Philosophy: motion confirms, it does not perform.** Its job is to tell you
something changed, or to let one image arrive with weight. Everything else stays
still. The site currently runs **46 infinite animations**, 18 of them in a global
background component on every page (`R-32`) — that is motion as decoration, and
it goes.

### 6.1 Tokens

| Token | Duration | Easing | Role |
|---|---|---|---|
| `--motion-micro` | 120ms | `cubic-bezier(0.2,0,0.38,0.9)` | hover, focus, press |
| `--motion-ui` | 220ms | `cubic-bezier(0.2,0,0.38,0.9)` | menus, accordions, tabs |
| `--motion-entrance` | 520ms | `cubic-bezier(0.16,1,0.3,1)` | one orchestrated reveal per view |
| `--motion-media` | 900ms | `cubic-bezier(0.16,1,0.3,1)` | image/scale reveals |
| `--motion-page` | 320ms | `cubic-bezier(0.4,0,0.2,1)` | route transitions |

Nine durations and three easings collapse to five and three (`R-47`).

### 6.2 Rules

- **One orchestrated reveal per viewport.** Not a fade-up on every section — that
  is the generic default and the brief names it. Choose the moment that deserves
  it; leave the rest still.
- **Reveals are masked or scaled, not slid.** A still emerging from a mask reads
  cinematic; a card sliding up reads templated.
- **Parallax only on full-bleed film stills**, maximum 8% travel.
- **The header** condenses once, at scroll-Y **> 72px**: height 96px → 64px,
  background `transparent` → `rgba(11,10,9,0.86)` + `backdrop-blur(12px)`, over
  `--motion-ui`. It does **not** hide on scroll-down — hiding navigation to
  reclaim 64px is a mobile-app pattern and it costs more than it returns here.
- **`prefers-reduced-motion: reduce`** removes transforms, parallax and autoplay,
  and keeps opacity changes at `--motion-micro`. Nothing is left broken or
  invisible. This is a build requirement, not a nicety: only **2 of 31**
  motion-using files currently consult it.

---

## 7. Loading, empty, and error patterns

The canonical treatments. Every async region picks one **deliberately** and says
why; there is no single pattern applied everywhere.

### 7.1 Loading

| Pattern | Use | Rule |
|---|---|---|
| **Content-shaped skeleton** | lists and grids with known geometry (films, gallery, team) | Must match the final layout's exact dimensions → **CLS 0**. Built from `--ink-raised`, never grey. |
| **Blur-up** | every photograph | Uses the `blurDataURL` and `dominantColor` the project **already stores**. No image resolves from an empty box (`R-48`). |
| **Inline progress** | form submit, long operations | Button becomes disabled-with-spinner and states what is happening. |
| **Optimistic render** | filter/sort on already-loaded data | No skeleton at all — re-render immediately. |

**Minimum display 400ms** once a skeleton appears, so fast connections don't
flash. Skeletons shimmer with a single 1.6s sweep, paused under reduced motion.

### 7.2 Empty

Every list, grid and search result gets a designed empty state: one line in the
brand's voice, and one action. End-of-list is a quiet brass rule and a line of
type — replacing "YOU HAVE REACH THE END !", which is currently the gallery's
only content heading (`R-13`).

### 7.3 Error

Every fetch failure gets a designed state: what happened, in plain language, and
a retry control. There are currently **zero `error.jsx` boundaries** on the
public site (`R-40`). Image failures fall back to `dominantColor` with the alt
text set quietly — never a broken-image glyph.

---

## 8. Anti-patterns — what we will deliberately not do

The ones you named, all of which this system actively avoids:

1. **Warm cream + terracotta as an *unexamined* default.** The palette is warm,
   deliberately — but it is not left bare. The guard against looking generated is
   the ornament system (§3.3): the arch, the jaali, the gold terminal. A cream
   page with no ornament is the anti-pattern; a cream page with a structured
   decorative language is the brief. Going dark to dodge this was the first
   attempt's mistake.
2. **Identical rounded cards, one radius, same soft grey shadow.** Radius is
   mostly `0`; elevation is surface lightening; there is exactly one shadow and
   it is for floating chrome.
3. **Tracked-out ALL-CAPS eyebrows above every heading.** The `label` role exists
   but is limited to genuine labels — form fields, nav, metadata. Never a
   decorative kicker above a headline.
4. **Meta strings joined with middle dots.** Use spacing and hierarchy.
5. **"→" appended to every link and button.** Arrows only where there is literal
   directional movement (carousel, prev/next).
6. **One word of a headline in the accent colour.** Headlines are one colour.
7. **Fade-and-slide-up on every section.** §6: one orchestrated reveal per view.
8. **01/02/03 markers on content that isn't a sequence.** Permitted only on the
   genuinely sequential (a shoot-day timeline). *Note: the blog uses numbered
   section markers, but the blog is out of scope and its content is sequential.*

And three of our own, from the audit:

9. **No text over an image without a scrim token** (§3.3).
10. **No component-local colour.** If a value isn't a token, it doesn't ship. The
    public site currently has 511 arbitrary hex classes against 29 token
    references (`R-16`).
11. **No decorative infinite animation.** If it loops forever and isn't
    communicating state, it goes.

---

## 9. Token implementation plan

**Source of truth:** CSS custom properties on `:root` in `app/globals.css`,
mapped into `tailwind.config.js` so utilities and raw CSS cannot diverge.

```js
// tailwind.config.js
colors: {
  ink:    { void:'var(--ink-void)', raised:'var(--ink-raised)', hairline:'var(--ink-hairline)' },
  bone:   'var(--bone)',
  accent: { fill:'var(--accent-fill)', text:'var(--accent-text)',
            hover:'var(--accent-hover)', press:'var(--accent-press)' },
  brass:  'var(--brass)',
  text:   { primary:'var(--text-primary)', secondary:'var(--text-secondary)', muted:'var(--text-muted)' },
}
```

Rules:

1. **Components consume tokens only.** No `bg-[#...]` in JSX. Enforced by a
   `prebuild` check in the same style as the repo's existing
   `check-tailwind-classes.mjs` — it fails the build on arbitrary hex in
   `app/(site)/**` and `Component/**`.
2. **The old `studio.*` palette stays** until Stage 8, so out-of-scope blog
   routes keep rendering. It is removed only when nothing public references it.
3. **Type roles ship as component classes** (`.t-display-1`, `.t-body`), not as
   loose utility stacks, so a heading cannot be assembled ad hoc.
4. **Tailwind 3.4.19** — the repo is on v3 and the existing `prebuild` guard
   rejects v4-only class names. No v4 syntax.

---

## 10. Accessibility floor — baked into the system, not checked afterwards

- **Every token pairing in §3 is computed, not estimated** — the table values are
  the output of a WCAG relative-luminance calculation, and two of my first-draft
  values failed it and were changed (§3.1, §3.3). No component can assemble a
  failing pair from these tokens, which is the point: the system makes the
  audit's largest defect class unreachable rather than merely discouraged.
- `--focus-ring` in brass at 2px with 2px offset, on `:focus-visible`, on every
  interactive element. The site currently has **no designed focus state at all** —
  all 460 measured rings are browser defaults (`R-31`).
- Minimum target **44×44px**, against 13–25 sub-24px targets per page today
  (`R-45`).
- One `<h1>` per page, ordered headings, `<header>`/`<main>`/`<footer>` landmarks,
  and a skip link — none of which exist today (`R-30`, `R-42`).

---

## 11. Gate decisions — resolved 2026-09-19

All four were delegated back to me. Recorded here as decisions, not options.

**1. Display face: Bodoni Moda.** The braver and more differentiated choice, and
the one that avoids the wedding-industry Playfair/Cormorant default. The obvious
objection is that a cold didone sits oddly on warm, emotional, family events —
and that objection is answered by where the warmth actually lives. The palette is
warm by construction (`#0B0A09` is a warm black, `#F2EDE6` a warm bone, the
accent is sindoor, the metallic is brass); the weddings themselves supply
abundance. The type's job is to be the disciplined, precise frame around that.
Warm ground, exact letterforms — the tension is the point.

Binding mitigations stand: display face at **≥28px only**, minimum weight
**500**, `opsz` axis set so small optical sizes thicken hairlines. Didone
hairlines on near-black are a real risk, not a theoretical one.

**2. Dark ground on every page, including `/contact`.** A light contact page
would read as a different website at the exact moment a visitor is deciding
whether to trust this one. Form legibility is solved with `--ink-raised` panels
and properly designed fields, not by changing the ground. The audit's contact
findings are behavioural anyway — silent failure, no keyboard submit — none of
them are luminance problems.

**3. `/varanasi` folds into the system.** One system, or it is not a system. Its
Cormorant/Cinzel styling is retired in Stage 8. Its *composition* — the pinned
horizontal panels, the full-bleed stills — is the best art direction on the site
and is kept; only the tokens change.

**4. Typography consolidates 8 declared families → 2.** Confirmed: 48
`@font-face` rules, 12 files, 352 KB on the home page today, to render two
families. Bodoni Moda + Inter, roughly 90 KB.

---

## 12. Out of scope, and why — `/varanasi` page weight (`R-09`)

`/varanasi` loads **24.3 MB**. Phase 1 recorded this as a Critical performance
defect. **That classification was wrong**, and the correction matters because it
changes who owns the fix.

The page's assets have never been migrated into the studio's media pipeline.
Verified: every heavy asset is either a local `@/Asset` import served from
`/_next/static/media/` or a raw file in `public/director-frames/` — **146 files,
21 MB, committed to the repository**. Not one of them is served from
`media.theweddingboys.in`, which carries the rest of the site's imagery and
applies the variant ladder, format negotiation and CDN caching.

The mechanism is therefore not a design decision to repair in this redesign. It
is an unmigrated asset set, and the migration is blocked on admin-panel work —
adding the ability to select a **group of images as a frame sequence**, which
would then be ingested, transcoded and served optimised like everything else.

**Consequence for Phase 2:** Stage 8 restyles `/varanasi` to these tokens and
does **not** attempt to hand-optimise its assets. R-09 is reassigned to the admin
media-pipeline backlog, outside this redesign. It remains the single largest
performance number on the site and should not be forgotten — but compressing 146
frames by hand would be throwaway work that the pipeline will redo properly.
