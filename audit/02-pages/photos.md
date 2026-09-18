# Page audit — Gallery (`/photos`)

| | mobile | tablet | laptop |
|---|---:|---:|---:|
| LCP | 1,424ms | 428ms | 720ms |
| **CLS** | **0.729** | **1.701** | **1.381** |
| Total blocking | 135ms | 115ms | **180ms** |
| Oversized images | 7 | 21 | **25** |
| `<h1>` count | **0** | **0** | **0** |

## D-PHOT-01 — CLS 1.70 — the worst measurement on the site — **Critical**

Google's threshold for "poor" is 0.25. This page measures **1.701** at tablet and
**1.381** at laptop — **6.8×** and **5.5×** poor.

The recorded shift sources are the gallery's own skeleton and caption layers:

```
0.0099 @462ms   div.relative.animate-pulse, div.absolute.bottom-6
0.8482 @51xx    (single shift — 3.4× the entire "poor" budget on its own)
```

The masonry grid reserves no space for images before they arrive, so every
loaded row displaces the rows beneath it. Combined with infinite scroll, the
displacement repeats for as long as the visitor keeps scrolling. This page never
settles.

**Corroborating observation:** the capture harness could not complete a full-page
screenshot at laptop width — the document kept growing while being measured. That
is the same defect seen from the outside.

## D-PHOT-02 — The page has no `<h1>`; its only `<h2>` is a grammatical error — **Critical** (trust)

The complete heading structure of the gallery page:

```
h2  YOU HAVE REACH THE END !
h3  Cinematic Love Stories, Delivered to Your Inbox   (footer newsletter)
h4  Explore / Editorial Journal / Royal Destinations / Studio Inquiries  (footer)
```

There is **no page heading at all**. The first and only content heading is the
infinite-scroll terminator — `PhotosClient.jsx:86`:

```jsx
endMessage={<h2 className="text-center font-bold text-xl tracking-widest my-4 mx-auto">YOU HAVE REACH THE END !</h2>}
```

Three defects in one string: "REACH" should be "REACHED", the all-caps shouting
is off-brand for a luxury studio, and the space before "!" is a typesetting
error. It is also marked up as an `<h2>`, so it is what a screen reader and a
search engine are told the gallery page is about.

## D-PHOT-03 — Images at 18.3× the displayed size — **Critical** (performance)

| Natural | Displayed | Waste |
|---|---|---:|
| 6048×4032 | 331×658 | **18.3×** |
| 6048×4032 | 331×296 | **18.3×** |

25 oversized images at laptop. A 6048×4032 JPEG is roughly a 24-megapixel
original being sent to fill a 331px column. On the page a visitor is most likely
to browse on a phone, on hotel wifi, while comparing vendors.

## D-PHOT-04 — Two chip treatments inside one row — **High** (consistency)

The tag row renders `Tilak` `West India` `Outdoor` at `#FEF4EE` with a
`1px #D1D5DB` border, and the adjacent `+5 more` chip at `#CBD5E1` with a
`1px #9CA3AF` border — different background, different border, same row.
Evidence: `div.tags.flex.flex-wrap > div.bg-slate-300.border.rounded-full`.

45 chips of the first kind, 15 of the second.

## D-PHOT-05 — Skeletons are real, but off-brand — **Medium**

Answering the brief directly: the grey blocks **are** genuine skeletons
(`div.relative.animate-pulse.rounded-3xl`), not broken images. They are drawn in
Tailwind `slate-400` `#94A3B8` — a cool blue-grey — on a warm cream page. They
read as broken because the colour does not belong to the palette, not because
anything failed.

`#94A3B8` is the single most-used background colour on the public site (308
occurrences), and it exists only to represent absence.

## D-PHOT-06 — Tag chips add noise without function — **Medium**

Every card repeats the same taxonomy (`Tilak / West India / Outdoor / +5 more`).
With `+5 more` unexpandable, the row communicates that five facts are being
withheld while showing three that rarely differentiate one photograph from
another.
