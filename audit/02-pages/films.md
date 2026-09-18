# Page audit — Films (`/films`)

Screenshots: `audit/screenshots/films-{390x844,768x1024,1440x900,1920x1080}.png`.
Data: `audit/_data/films-*.json`.

| | mobile | tablet | laptop | desktop |
|---|---:|---:|---:|---:|
| Page height | 2,325px | 2,167px | 2,085px | 2,085px |
| LCP | **2,396ms** | 544ms | 512ms | 668ms |
| CLS | 0.011 | 0 | 0 | 0 |
| Low-contrast text | 3 | 3 | 3 | 3 |
| Oversized images | 8 | 8 | 8 | 8 |
| Horizontal overflow | 0 | 0 | 0 | 0 |

## D-FILM-01 — The taxonomy is wrong, and visibly so — **Critical** (trust)

Three categories render. Their contents:

| Category | Films | Correct? |
|---|---|---|
| **Classic** | Daman · **Ahemdabad** | — |
| **Beach** | **Varanasi** · **Solapur** | **0 of 2.** Varanasi is a landlocked city on the Ganges; Solapur is inland Maharashtra. Neither is a beach. |
| **North India** | Howrah · Jammu · Varanasi · Solapur | **2 of 4.** Howrah is West Bengal (east); Solapur is Maharashtra (west). |

A planner evaluating this studio for a destination wedding is being told the
studio does not know where its own films were shot. For a business whose product
is *place*, this is the most damaging content defect on the site.

## D-FILM-02 — The same two films appear twice — **High**

"Sakshi & Shubhankar" renders four times across the page: once each under
**Beach** and **North India**, for both the *15 March / Varanasi* and *17 October
/ Solapur* entries. 8 film cards represent 6 distinct films.

Cross-listing a film in two categories is legitimate; presenting it without any
indication that it is the same film is not. The visitor counts the portfolio as
smaller than it is *and* notices the repetition.

## D-FILM-03 — Category rows leave 55.6% of the viewport empty — **High**

Measured at 1425px wide. Cards are fixed at 288×256 and do not respond to
available width:

| Row | Cards | Used | Empty right | % empty |
|---|---:|---:|---:|---:|
| Classic | 2 | 592px | **793px** | 55.6% |
| Beach | 2 | 592px | **793px** | 55.6% |
| North India | 4 | 1200px | 185px | 13.0% |

The visual impression is of a portfolio that has run out of work.

## D-FILM-04 — "Ahemdabad" — **High** (trust)

Misspelling of **Ahmedabad**, rendered in the Classic row. Also appears on `/`.

## D-FILM-05 — Mobile LCP is 4.7× the desktop figure — **Medium**

2,396ms on mobile against 512ms at laptop. LCP element is
`img.object-cover.w-full.h-32`. Eight images on this page are oversized, worst
`1800×2700 → 288×192` (**6.3×**). See `06-PERFORMANCE.md` for the loader
mechanism.

## Global-shell defects visible here (see `global-shell.md`)

- "MUMBAI'S PREMIER WEDDING FILMMAKERS" at **3.67:1**
- "Subscribe" and "Inquire for Your Date" at **3.17:1**
- No `<header>` landmark
