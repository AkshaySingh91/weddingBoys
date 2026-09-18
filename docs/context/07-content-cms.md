# 07 — The Content CMS

The CMS lets studio staff reorder, hide, edit and add page sections without a
developer. It is a **block system**: one `PageContent` document per page,
holding an ordered array of typed blocks.

## The data shape

`Backend/Models/PageContent.js`:

```
PageContent
├── pageKey     'home' | 'about' | 'films' | 'photos' | 'contact' | …  (unique)
├── title
├── description       internal note / meta description
├── status            'Draft' | 'Published'
└── blocks[]
    ├── _id           nanoid(10)
    ├── key           stable slug, e.g. 'home-bts'  ← how code targets one block
    ├── type          one of BLOCK_TYPES
    ├── title / subtitle / body / link
    ├── media[]       → Media refs
    ├── items[]       repeatable entries (reviews, team, cards…)
    ├── settings      per-type options (columns, variant, component…)
    ├── order
    └── visible
```

Every block shares this one flexible shape, which is why adding a block type
needs **no schema migration**.

## The eleven block types

| Type | Renders |
|---|---|
| `heading` | Title + subtitle |
| `richText` | Title + HTML body |
| `mediaSingle` | One image/video with caption |
| `mediaGallery` | Ordered grid/strip (e.g. behind-the-scenes) |
| `heroVideo` | Full-bleed video showcase |
| `reviews` | Testimonials (body + person + photo) |
| `team` | Team members (portrait + name + role + about) |
| `featureCards` | Cards (media + title + body + link) |
| `cta` | Call-to-action banner |
| `stats` | Metric tiles (value + label) |
| `section` | **Binding to a rich client component** — see below |

## `section` blocks: the important idea

Most of the home page is not simple content — `Herobanner` fetches hero videos,
`OfferPackages` fetches pricing, `OurPortfolio` fetches sample photos. Rewriting
those as generic data blocks would have meant losing their behaviour.

So a `section` block stores no content at all. It stores
`settings.component`, a key into a registry:

`Component/cms/sectionRegistry.js`
```js
export const SECTION_COMPONENTS = {
    heroVideos:            Herobanner,
    ourFilms:              VideoThumbnail,
    service:               OurServices,
    announcementVaranasi:  VaranasiLaunchCard,
    announcementDharaa:    DharaService,
    ourStory:              OurStory,
    portfolio:             OurPortfolio,
    whyChooseUs:           WhyChooseUs,
    packages:              OfferPackages,
    ourApproach:           OurApproach,
};
```

The CMS controls **whether and where** the component appears. The component
still owns its own data fetching. That split is the design's key trade-off and
it keeps rich sections rich.

## Rendering path

| File | Role |
|---|---|
| `Component/cms/blocks.jsx` | The block renderers, keyed by type in `BLOCK_RENDERERS` |
| `Component/cms/BlockRenderer.jsx` | Server-side renderer for a whole page |
| `Component/cms/PageSections.jsx` | Renders an ordered `blocks[]` array |
| `Component/cms/CmsRender.jsx` | Client-side variants: `CmsSection` (one named block) and `CmsSections` (a whole page) |
| `Component/cms/sectionRegistry.js` | `section` → component map |

`blocks.jsx` deliberately has **no `'use client'`**. Its renderers are pure
presentational (only `next/image` and `next/link`, no hooks or browser APIs), so
when imported by the server `BlockRenderer` they ship zero JavaScript, and when
imported by the client `CmsRender` they render client-side. One source, both
contexts — preserve that property when editing it.

Blocks with `visible === false` are skipped in both paths.

## Interleaving CMS blocks into a hand-built page

`CmsSection` renders a single named block, which is how the home page mixes
CMS-managed content into an otherwise coded layout:

```jsx
<CmsSection pageKey="home" block="home-team" />
<CmsSection pageKey="home" block="home-bts" />
<CmsSection pageKey="home" block="home-reviews" />
```

The `block` prop matches a block's `key` **or** its `type`.

## The admin editor

- `/admin/content` — page list, from `DEFAULT_PAGES`
  (`home`, `about`, `films`, `photos`, `contact`) merged with whatever the API
  returns, so a page appears even before its document exists.
- `/admin/content/[pageKey]` — the block editor. Uses TanStack Query for
  fetch + mutation.
- `content/_components/config.js` — **`BLOCK_CONFIG` is the single declarative
  source** describing, per block type: its label, icon, which top-level fields
  it shows, whether it carries single or gallery media, and (for list blocks)
  the per-item fields and their labels.
- `content/_components/BlockCard.jsx` — one generic editor driven entirely by
  that config. There is no per-type editor component.
- `content/_components/MediaField.jsx` — media slot, opens `MediaPickerModal`.

## Default layouts

`Backend/Utils/pageLayouts.js` holds `DEFAULT_LAYOUTS` and `ensureDefaultBlocks`,
which seed a page with sensible starting blocks (e.g. `home-team`, `home-bts`,
`home-reviews`, and a stats block reading *1000+ weddings, 25+ awards, 1500+
happy clients, 5+ years*). A page therefore never opens completely empty.

## Adding a new block type — the checklist

1. Add the type name to `BLOCK_TYPES` in `Backend/Models/PageContent.js`.
2. Add a renderer to `BLOCK_RENDERERS` in `Component/cms/blocks.jsx` — keep it
   free of hooks and browser APIs so it stays server-renderable.
3. Add an entry to `BLOCK_CONFIG` in `content/_components/config.js`
   (label, icon, fields, media, item fields).

That's all — no migration, no new editor component.

## Adding a new rich `section`

1. Build the component (it fetches its own data).
2. Import it and add an entry to `SECTION_COMPONENTS` in `sectionRegistry.js`.
3. Add a matching option to `SECTION_OPTIONS` in `config.js`.

## Fail-soft

Every CMS fetch is wrapped so a failure returns `null` rather than throwing, and
consuming pages fall back to a hardcoded layout. The home page is the reference
implementation. Follow it: the public site must never blank out because the CMS
is unreachable.
