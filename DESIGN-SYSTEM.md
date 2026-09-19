# The Wedding Boys — Design System

**Status:** Stage 0 proposal, awaiting approval. No component code written yet.
**Scope:** public site only. Blog/editorial and admin are explicitly out of scope.
**Evidence base:** `audit/` (70 defects; IDs referenced as `R-xx`).

---

## 1. Design direction

**The idea: lights down.**

This is a cinematography studio. Its product is light — what it does with a
mandap at 8pm, with a havan fire, with the last twenty minutes before the sun
drops behind a Udaipur palace. The current site presents that work on a bright
cream page, which is the visual equivalent of screening a film with the house
lights up.

So the interface goes dark and the work becomes the only lit thing on the page.
Near-black ground, images full-bleed and unframed, type set quietly around them.
Every surface that isn't a photograph recedes.

This is not a stylistic preference; it is true to the subject three times over.
**Indian weddings are substantially night events** — the pheras, the aarti, the
sangeet, the baraat under floodlights. **Their colour is riotous** — marigold,
sindoor, gold thread, jewel silks — and those colours detonate against black and
turn muddy against cream. And **a colourist grades in a darkened room** with
neutral walls, precisely so the image can be judged truthfully; presenting on
near-black is a professional signal that the secondary audience — planners,
editors, rival cinematographers — will read instantly and correctly.

The emotional register is *restraint around abundance*. The weddings are
maximal. The studio presenting them should not compete: it should be the calm,
confident frame that lets a 400-person baraat look like cinema. Luxury here is
not ornament, it is **editing** — the discipline to leave things out.

The one memorable thing a visitor should take away: **the photographs looked like
they were lit from behind the screen.**

Two guards against the obvious failure modes. Dark plus gold tips very easily
into wedding-invitation gaudiness, so metallics appear only as hairlines and
small marks, never as fills. And dark plus serif tips into funeral, so the type
must stay warm and the imagery must carry colour.

---

## 2. Resolving the brand conflict

The audit found two competing systems: a hot pink/coral one (`#FF6969` ×125,
`#FF5353` ×24, plus four more reds) and a brown-gold serif editorial one (footer,
newsletter). There is in fact a third — `/varanasi`, in Cormorant Garamond and
Cinzel, used on no other page (`R-41`).

**Decision: adopt neither wholesale.**

You are right that the pink undercuts the position — it reads consumer-friendly
and it is mathematically broken besides: white on `#FF5353` is **3.17:1** and
`#FF6969` on white is **2.81:1**, so *every* CTA on the site inherits a pairing
that cannot pass AA at body size (`R-05`, `R-28`). That is not a taste argument,
it is arithmetic. The pink goes.

But I want to argue against simply promoting the editorial cream-and-brown
system, because doing so walks straight into the anti-pattern list you gave me.
Warm cream + terracotta + Playfair Display is the single most common output of
generated design work right now, and the current footer is already most of the
way there. Shipping it would make the site look *tasteful and machine-made* — the
exact failure this brief is trying to avoid, and a failure that the target
audience, who look at a hundred wedding sites, will clock immediately.

So: **keep the editorial system's discipline — one serif, generous measure,
restraint — and move the ground from cream to near-black.** That is the real
choice. It inverts the site, differentiates it from every competitor in the
category, makes the imagery the brightest thing on screen, and — usefully —
makes the audit's single largest accessibility class (white text at 1.0:1 over
photographs, `R-06`) structurally much easier to fix, because a dark scrim on a
dark page is no longer a visual intrusion.

**The accent becomes sindoor**, a deep vermilion. It is culturally exact rather
than decorative — sindoor, the red of the lehenga, the tilak — and being deep
rather than bright it reads expensive where `#FF6969` reads cheerful. It also
resolves the six-reds problem by choosing one that is emphatically not a tint of
the old one.

**Brass** is the only metallic, and it is a hairline colour: rules, small marks,
focus rings. Never a fill, never a gradient.

---

## 3. Colour

Named by role, never by appearance. Every value below is a token; components
consume tokens only.

### 3.1 Core

| Token | Value | Role | Verified |
|---|---|---|---|
| `--ink-void` | `#0B0A09` | the page ground — warm near-black, not pure black | — |
| `--ink-raised` | `#141210` | raised surface (cards, menus) | — |
| `--ink-hairline` | `#241F1B` | borders, rules | — |
| `--bone` | `#F2EDE6` | primary light text, rare light surfaces | **16.99:1** on void |
| `--accent-fill` | `#A83824` | sindoor, as a **fill** | bone on it = **5.54:1** |
| `--accent-text` | `#D9614A` | sindoor, as **text/icon on the ground** | **5.42:1** on void |
| `--brass` | `#B08D57` | metallic hairline, focus ring | **6.40:1** on void |

**Why the accent is two tokens.** My first draft used a single `#C2412C` for
both jobs and I computed the ratios before writing this line: bone on it is
**4.41:1** and it is **3.85:1** as text on the ground — so it fails AA at body
size in *both* directions. That is precisely the defect the audit found in the
existing brand, where `#FF5353` and `#FF6969` are each stuck at 3.17 and 2.81
(`R-05`, `R-28`). One red genuinely cannot do both jobs at AA. Splitting the
role into a deep fill and a lighter text tint is the fix, and it is the single
most important lesson the audit teaches about colour.

`#0B0A09` rather than `#000000` deliberately: pure black crushes on OLED, kills
shadow detail in photographs, and reads cheap. The slight warmth flatters Indian
skin tones and gold thread.

### 3.2 Derived

| Token | Value | Role |
|---|---|---|
| `--text-primary` | `#F2EDE6` | body and headings on ground |
| `--text-secondary` | `rgba(242,237,230,0.72)` | supporting copy |
| `--text-muted` | `rgba(242,237,230,0.52)` | meta, captions |
| `--text-on-accent` | `#F2EDE6` | text on accent fills — **bone, not black** (5.54:1) |
| `--border-subtle` | `rgba(242,237,230,0.10)` | default hairline |
| `--border-strong` | `rgba(242,237,230,0.22)` | emphasised edge |
| `--accent-hover` | `#B33A26` | brightens on hover (bone 5.08:1) |
| `--accent-press` | `#96301F` | darkens on press (bone 6.58:1) |
| `--focus-ring` | `#B08D57` | brass, 2px, 2px offset (6.40:1) |

Measured: `--text-secondary` **8.87:1**, `--text-muted` **5.03:1** on void;
`--text-primary` **16.05:1** and `--text-muted` **4.76:1** on `--ink-raised`.

**Rule:** `--accent-fill` is never used as text and `--accent-text` is never used
as a fill. They are not interchangeable shades of one colour; they are two roles.

### 3.3 Scrims — a named requirement, not an afterthought

The audit found **296 text-over-image instances** and five at exactly **1.0:1**
(`R-06`). Text is never placed on an image without one of these:

Every value below was solved against the **worst case — a pure white image** —
so the guarantee holds on a blown-out beach frame, not just on a dark mandap.

| Token | Value | Use | Bone text, worst case |
|---|---|---|---|
| `--scrim-base` | `rgba(11,10,9,0.66)` flat | small labels and captions on arbitrary imagery | **5.64:1** ✅ |
| `--scrim-strong` | `rgba(11,10,9,0.74)` flat | body copy over imagery | **7.62:1** ✅ |
| `--scrim-gradient-bottom` | `linear-gradient(to top, rgba(11,10,9,0.88) 0%, rgba(11,10,9,0.66) 30%, transparent 70%)` | captions anchored bottom | **5.64:1** at the 30% stop, 12.79:1 at the base ✅ |
| `--scrim-gradient-hero` | `linear-gradient(to top, rgba(11,10,9,0.92) 0%, rgba(11,10,9,0.62) 55%, rgba(11,10,9,0.35) 100%)` | display copy over full-bleed stills | **4.85:1** at the 55% stop ✅ (display text needs 3.0) |

**Text must sit within the band where the scrim is at or above its stated stop.**
A caption placed at 60% height over `--scrim-gradient-bottom` is outside its
guarantee and is a defect.

My first draft specified `--scrim-base` at `0.45`, which computes to **2.71:1**
over white — it would have shipped the exact illegibility the audit documents
(`R-06`, `R-21`). 0.66 is the minimum that holds.

**Rule:** any component rendering text over an image must apply a scrim token.
This is enforceable in review — a text node over an `<img>` with no scrim class
is a defect regardless of how it looks in one photograph.

### 3.4 Status

`--status-success #4E8C6A`, `--status-error #D0523C`, `--status-warning #C08A3E`.
Muted deliberately: a saturated system-red next to sindoor would compete.

### 3.5 What we are *not* doing

No cool greys. The audit found Tailwind's `slate`/`gray` defaults used throughout
(`#94A3B8` as the most-used background on the site, `#E5E7EB` as the global
border colour) sitting inside a warm palette (`R-18`). Every neutral here is
derived from `--ink-void` or `--bone`, so it is warm by construction.

---

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

1. **Warm cream + terracotta as an unexamined default.** Explicitly rejected in
   §2 — this is why the ground is near-black rather than the easier cream.
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
