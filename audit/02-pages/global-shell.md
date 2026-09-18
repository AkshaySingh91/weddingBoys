# Page audit — Global shell (navbar, mobile menu, footer, newsletter, floating widgets)

Rendered on all 11 public pages via `app/(site)/layout.jsx`. Every defect here is
multiplied by 11.

## D-SHELL-01 — Three of four primary nav items are dead links on 13 of 14 pages — **Critical**

`Component/Navbar.jsx:26-29`:

```js
{ name: 'Home',     path: '/' },
{ name: 'Pricing',  path: '#pricing'  },
{ name: 'Process',  path: '#process'  },
{ name: 'Services', path: '#services' },
```

The three fragment targets exist — but **only on the home page**:

| Anchor | Target | File |
|---|---|---|
| `#pricing` | 1 occurrence | `app/(site)/_home/OfferPackages.jsx:350` |
| `#process` | 1 occurrence | `app/(site)/_home/OurApproach.jsx:72` |
| `#services` | 1 occurrence | `app/(site)/_home/OurService.jsx:84` |

On `/films`, `/photos`, `/team`, `/about-us`, `/contact`, `/varanasi`,
`/dharaa-event-management`, `/search-result`, `/weddings/*`, `/allfilms`, both
detail routes and the 404, clicking **Pricing**, **Process** or **Services**
appends a fragment to the URL and does nothing else. The visitor is not taken to
pricing; the page does not move.

**Three quarters of the site's primary navigation is inert on 93% of its pages.**

## D-SHELL-02 — The header and footer describe two different companies — **Critical** (positioning)

| Surface | Claim | Source |
|---|---|---|
| Navbar (every page) | "MUMBAI'S PREMIER WEDDING FILMMAKERS" | `Navbar.jsx` |
| Home Varanasi card | "Mumbai's Premier Storytellers" | `VaranasiLaunchCard.jsx:83` |
| Home portfolio | "from across **Mumbai and beyond**" | `OurPortfolio.jsx:228` |
| Home reviews | "across **Mumbai and beyond**" | `Review.jsx:143` |
| About | "In the heart of **Mumbai**" | `AboutClient.jsx:126` |
| **Home pricing** | **"We cover all locations in Mumbai at no extra cost. Additional charges apply for destination weddings."** | `OfferPackages.jsx:119` |
| **Footer (every page)** | **"India's premier wedding cinematography studio … across royal palaces, coastal sanctuaries, and worldwide destinations."** | `Footer.jsx:105` |

A destination-wedding client is told on a single scroll that the studio is a
worldwide practice **and** a Mumbai practice that surcharges for travel. For a
business positioning at the ultra-luxury destination tier this is the most
commercially damaging inconsistency in the audit — it is not a design issue, it
is a statement of what the company is.

## D-SHELL-03 — Header and footer navigation do not agree — **High**

| Navbar primary | Navbar secondary | Footer "Explore" |
|---|---|---|
| Home | Films | Home |
| Pricing | Gallery | Films |
| Process | Blog | Gallery |
| Services | Varanasi | Our Team |
| | Team | About Us |
| | About | Dharaa Events |

The footer offers **Dharaa Events**, which appears in neither navbar list. The
navbar offers **Pricing / Process / Services**, which appear nowhere in the
footer. A visitor cannot build a mental model of the site because no two
navigation surfaces describe the same one.

A hamburger also renders **beside an already-visible nav** at desktop widths
(`Navbar.jsx:164`, `xl:hidden` — visible below 1280px alongside the `xl:flex`
list at ≥1280px), so between `md` and `xl` the page shows both a full nav and a
menu button.

## D-SHELL-04 — Both footer CTAs fail contrast, on every page — **Critical**

`#FFFFFF` on `#FF5353` at 12px = **3.17:1** (needs 4.5). Applies to
**"Subscribe"** and **"Inquire for Your Date"** — the site's two conversion
buttons — on all 11 pages. See `05-ACCESSIBILITY.md` §1.2.

They also disagree with each other: `padding 8px 24px` vs `10px 20px`, same
file, same visual language.

## D-SHELL-05 — A broken data URI ships on every page — **High**

`Component/Background.jsx:46`:

```jsx
<div className="absolute inset-0 bg-[url('data:image/png;base64,iVBORw0KGgo...')] opacity-10 mix-blend-overlay" />
```

The `...` is **literal source text** — a truncated base64 placeholder that was
never replaced. It produces `ERR_INVALID_URL` in the console on every page load,
and the intended noise/grain texture has never rendered.

This is a development artefact that reached production. It is also the clearest
single example of the audit's wider theme: the intent (a film-grain overlay) was
designed, and the implementation was left unfinished.

## D-SHELL-06 — `<Background />` runs 18 infinite animations on every page — **High**

`Component/Background.jsx:10-28` — 15 petals and 3 lens flares, each on a
`repeat: Infinity` Framer Motion loop, mounted globally at
`app/(site)/layout.jsx:11`.

No pause control (WCAG 2.2.2) and no `prefers-reduced-motion` gate (2.3.3). It
runs on the contact form, the gallery and the 404 alike.

## D-SHELL-07 — No `<header>` landmark and no skip link — **High**

The masthead is a `<div>` (`app/(site)/layout.jsx:13`). Measured landmark counts
are `header: 0` on 10 of 11 pages. There is no skip link anywhere, and most pages
present ~45 tab stops before main content.

## D-SHELL-08 — Unverified claim: "Join 12,000 discerning couples" — **Flag for client**

`Component/Footer.jsx:45`. Rendered on every page. **Not a design defect** — the
audit cannot determine whether the figure is accurate.

If the newsletter list does not hold ~12,000 subscribers this is a substantiation
problem (misleading advertising) rather than a styling one, and it sits beside
`/about-us`'s two separate "1000+" statistics. Recommend the client confirms all
three figures before Phase 2 reproduces them.

## D-SHELL-09 — The floating "N" badge is a dev-only artefact — **Resolved, not a defect**

Identified as `<nextjs-portal>` — the **Next.js dev-tools indicator**, injected
by `next dev`. Verified present at `localhost:3000` (dev) and **absent** from the
production build served from `next start` (`_perf-production.json`,
`devOverlayPresent: false`).

It does **not** ship to production. Worth noting only that
`next.config.mjs:34` sets `devIndicators: false` and the overlay appears anyway —
the option no longer suppresses it in this Next version.

## D-SHELL-10 — The WhatsApp button is not global — **Scope correction**

The brief lists it under the global shell. It is defined inline at
`app/(site)/contact/_components/ContactClient.jsx:18` and rendered **only on
`/contact`** (line 337). No floating WhatsApp affordance exists on any other
page — including `/films` and `/photos`, where a visitor is most likely to want
one. See `contact.md` D-CONT-09 for its mobile positioning bug.

## D-SHELL-11 — Footer social buttons are unlabelled icon circles — **Medium**

44 of the site's 136 measured "buttons" are the footer's social icons:
`bg #4E2818 / fg #D6D3D1 / radius 9999px / padding 8px`, **with empty text
content**. They are the largest single button cohort on the site and none carries
a visible label.
