# 02 — The Public Site

Everything here lives under `Next-Frontend/app/(site)/`. The shared shell is
`app/(site)/layout.jsx`: `ScrollOnTop` → `Background` → `Navbar` → `main` →
`Footer`.

## Route map

| URL | File | Rendering | Data source |
|---|---|---|---|
| `/` | `page.jsx` | ISR 60s (server) | `GET /api/content/home` (CMS) + per-section self-fetches |
| `/films` | `films/page.jsx` + `_components/FilmsClient.jsx` | Server shell + client body | `GET /api/filmpage/tags`, `GET /api/videos?tag=…` |
| `/films/[videoId]` | `films/[videoId]/page.jsx` | Dynamic | `GET /api/videos/:id`, `/api/videos/:id/recommended` |
| `/allfilms` | `allfilms/page.jsx` + `_components/AllFilmsClient.jsx` | Server shell + client body | `GET /api/get-all-tags`, `GET /api/videos` (filtered) |
| `/photos` | `photos/page.jsx` + `_components/PhotosClient.jsx` | Server shell + client body | `GET /api/photos?page=&limit=` (infinite scroll) |
| `/photos/[photoId]` | `photos/[photoId]/page.jsx` | Dynamic | `GET /api/photos/:id`, `/api/photos/:id/recommended` |
| `/blogs` | `blogs/page.jsx` | ISR 1h + metadata | `GET /api/blogs` |
| `/blogs/[slug]` | `blogs/[slug]/page.jsx` | ISR 1h + `generateMetadata` | `GET /api/blogs/slug/:slug`, `/api/blogs/related/:slug` |
| `/team` | `team/page.jsx` + `_components/TeamClient.jsx` | Server shell + client body | `GET /api/team` |
| `/about-us` | `about-us/page.jsx` + `_components/AboutClient.jsx` | Server shell + client body | Local assets + `StudioDetailsContext` |
| `/contact` | `contact/page.jsx` + `_components/ContactClient.jsx` | Server shell + client body | `POST /api/enquiry`, `StudioDetailsContext` |
| `/search-result` | `search-result/page.jsx` | Server shell + client body | `GET /api/search` |
| `/varanasi` | `varanasi/page.jsx` + `_components/VaranasiClient.jsx` | Server shell + client body | Local assets, GSAP/Lenis animation |
| `/dharaa-event-management` | `dharaa-event-management/page.jsx` | Static (server) | Local assets |
| `/[slug]` | `[slug]/page.jsx` | ISR 1h + `generateMetadata` | `GET /api/content/:slug` (CMS-built pages) |
| `/robots.txt` | `app/robots.js` | Static | — |
| `/sitemap.xml` | `app/sitemap.js` | ISR 1h | `/api/blogs`, `/api/videos`, `/api/photos`, `/api/content` |
| 404 | `not-found.jsx` | — | — |

## Home — `/`

The home page is **CMS-driven with a hardcoded fallback**. It server-fetches the
`home` page document; if blocks exist it renders `<PageSections blocks={…} />`,
otherwise it renders a fixed default arrangement. Both paths draw from the same
component set in `app/(site)/_home/`:

| Component | What it shows | Fetches |
|---|---|---|
| `Herobanner` | Full-bleed hero video carousel, swipeable | `GET /api/hero-videos` |
| `VideoThumbnail` | "Our Films" strip | `GET /api/homepage/tags`, `/api/videos` |
| `OurService` | Service offerings | Static content |
| `VaranasiLaunchCard` | Announcement card → `/varanasi` | Static |
| `DharaService` (`Component/`) | Announcement card → Dharaa | Static |
| `OurShortStory` | Studio story | Static |
| `OurTeams` | Team grid | `GET /api/team` |
| `OurPortfolio` | Portfolio showcase | `GET /api/home/sample-photos` |
| `WhyChooseUs` | Differentiators | Static |
| `OfferPackages` | Pricing packages | `GET /api/pricing` |
| `OurApproach` | Process explainer | Static |
| `Review` | Testimonials | `GET /api/reviews` |

In the CMS path, `home-team`, `home-bts` and `home-reviews` are rendered as
**CMS blocks** (data edited in the admin) while the rest are rendered as
**`section` blocks** that bind to the rich components above via
`Component/cms/sectionRegistry.js`. The distinction matters: a `section` block
controls only *whether and where* a component appears — the component still
fetches its own data. See [07 — Content CMS](./07-content-cms.md).

## Films

`/films` is the curated view: it reads the tag list an admin pinned at
`/admin/website-setting/films`, then renders one horizontally-scrolling row of
films per tag. `/allfilms` is the exhaustive, user-filterable view — it loads
every tag category and lets the visitor filter by them.

`/films/[videoId]` is the individual film page, with recommendations pulled from
`/api/videos/:id/recommended`.

## Photos

`/photos` is a masonry gallery with infinite scroll
(`react-infinite-scroll-component`), paging through `/api/photos`. The masonry
CSS is a shared utility in `app/globals.css` (consolidated from what used to be
two near-identical stylesheets in the React app).

## Blog

The blog is the **primary organic-search asset** and is consequently the
best-optimised part of the site: statically generated with hourly revalidation,
per-post `generateMetadata` (title, description, canonical, OpenGraph), a table
of contents, share links, and related posts.

Blog posts also carry **wedding storytelling metadata** — mood, season, budget,
venue, style and a client testimonial — which is rendered as a detail panel and
pull-quote beneath the article body. These are authored in the admin blog
editor's "Wedding details" panel.

The `Navbar` links to `/`, `/films`, `/photos`, `/blogs`, `/varanasi`, `/team`,
`/about-us` and `/contact`; the footer's "Explore" block links all ten public
routes, including `/allfilms` and `/dharaa-event-management`. Every public page
is reachable from the global chrome — keep it that way when adding a route.

## Varanasi

A standalone cinematic landing page with its own section components in
`varanasi/_sections/`: `HeroSection`, `HeroSection2`, `StorySection`,
`CultureSection`, `WhyVaranasiSection`, `HorizontalShowcase`, `GallerySection`,
`DirectorSection`, `TestimonialsSection`, `FinalCTASection`. It uses GSAP and
Lenis for scroll-driven animation, and `Component/media/SequenceAnimator.jsx`
plays the `public/director-frames/` image sequence as a scrubbed animation.

## Dharaa Event Management

A catering landing page: hero, then `Process`, `EventTypes` and `FoodItems`
sections. The "Contact Us" action opens WhatsApp directly.

> Note for anyone comparing against the old React app: it contained a
> `Packages.jsx` section for this page that was **never imported or rendered**.
> It was dead code and was intentionally not carried over.

## Contact

A form posting to `POST /api/enquiry`, alongside studio details from
`StudioDetailsContext` and an office image carousel. Submitted enquiries land in
the admin at `/admin/total-Enquires`.

## Shared components

Living in `Next-Frontend/Component/`:

`Navbar`, `Footer`, `Background`, `ScrollOnTop`, `Loader`, `NotFound`,
`Videoplayer`, `Map`, `Header` (admin), `AdminSidebar`, `DharaService`,
`PhotoDetailsForm`, `VideoDetailsForm`, plus the `cms/`, `media/` and
`providers/` subfolders.
