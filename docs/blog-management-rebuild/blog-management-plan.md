# WeddingBoys — Blog Management System: Research-Backed Implementation Plan

> Goal: build the best editorial blog platform in the wedding & events niche — a
> publishing engine + editor + reader experience + comments + analytics that out-ranks
> and out-engages competitors like Junebug Weddings, Green Wedding Shoes, and The Knot.
>
> Stack (existing): Next.js 16 (App Router) · React 19 · Tailwind · Tiptap v2 (JSON AST)
> · Express · MongoDB/Mongoose · Cloudflare R2 + Stream. This plan builds **on top** of
> what you already have — it does not restart it.

---

## 0. Key decisions at a glance

| Question | Decision | Why |
| :-- | :-- | :-- |
| Switch editors (Lexical/Editor.js)? | **No — keep Tiptap** | Best-in-class for CMS/publishing; migrate editors only when one *blocks* a feature, not on principle. Your JSON AST already enables everything below. |
| How to get many beautiful layouts? | **Story Templates + constrained block palette**, rendered by your design system | Admins pick a curated layout and fill structured blocks; they never write CSS, so it *can't* look ugly. |
| Rich embeds? | **Unified Embed block + oEmbed + click-to-load facades** | One safe, fast path for YouTube/Vimeo/Stream/Instagram/Spotify/Maps/Pinterest, without tanking performance. |
| Comments: build or buy? | **Build native in your stack** | Full control, first-party data, SEO benefit from indexed user content, and a lightweight footprint vs Disqus (>1MB embed). Matches your moderation-queue vision. |
| Analytics? | **Two layers**: editorial dashboard (your DB) + Plausible/Umami (audience) | Dashboard = post/comment trends & top stories. Plausible = auto scroll-depth, read-completion, cookieless, no consent banner. |
| SEO edge? | **Real-wedding storytelling + FAQ/HowTo schema (AEO) + vendor-credit backlinks + programmatic location pages** | This is what actually ranks and converts in the wedding niche in 2026. |

---

## 1. Where you are today (honest baseline)

**Already solid** (keep and extend):
- Tiptap editor with custom nodes (`InlineMedia`, `PhotoGallery`, `WeddingVideoEmbed`, `Callout`) and JSON AST persistence (`contentJson`).
- `BlogPost` schema with SEO fields, wedding metadata (mood/season/budget/venue/style/testimonial), auto TOC, reading time.
- Public rendering with ISR (`revalidate = 3600`), `generateMetadata`, `BlogPosting`/`Article` JSON-LD, desktop TOC.
- Admin dashboard KPIs (Total / Published / Drafts / Reading time), search + status pills, article row cards.
- Media centralized on R2/Stream with presigned uploads, `blurDataURL`, `dominantColor` (good — kills layout shift).

**Gaps this plan fills:**
1. Only one implicit layout — no way to produce visually distinct, always-beautiful article formats.
2. Embeds limited to a few providers; no unified, performance-safe embed path.
3. No reader comments / engagement loop → nothing to "hook" visitors or keep them on page.
4. Dashboard is static counts — no growth/trend charts, top-post analytics, or comment moderation queue.
5. No audience analytics (scroll depth, read completion, traffic sources, conversions to enquiry).
6. SEO is per-post basics; missing FAQ/HowTo schema (AEO), vendor-credit backlink loop, and location landing pages.
7. Missing editorial safety nets: autosave, revision history, roles/approval workflow.

---

## 2. Niche research — what actually wins in wedding blogging (2026)

These findings shape the whole build:

- **Real wedding feature stories are the flagship content type.** They carry long-term SEO
  value and keep couples emotionally engaged; quality beats quantity (one strong story every
  few weeks). → Your "Cinematic Real Wedding" template is the hero format.
- **Engagement signals are ranking signals.** Google increasingly weighs reviews, social
  signals, and how people interact with your site. → Comments, time-on-page, scroll depth,
  and returning readers are not vanity metrics; they feed rankings.
- **AEO (Answer Engine Optimization) is the 2026 differentiator.** Direct factual answers +
  FAQ/HowTo structured data help you appear in AI-powered/LLM search. → Add an FAQ block and
  FAQ schema to planning/guide posts.
- **Vendor credits = a backlink engine.** Featuring venues, planners, florists, etc. earns
  reciprocal follow-links from authoritative wedding sites. → First-class "Vendor Credits"
  block that outputs clean links.
- **Hyper-local landing pages convert.** "[City] destination wedding" / "wedding
  cinematography in [City]" pages target how couples actually search. → Programmatic location
  pages (you already have the `indianLocations` dataset).
- **Every post needs a clear next step** → an enquiry CTA block, tracked as a conversion.

Sources are listed in §13.

---

## 3. The four pillars

```
Pillar A — Layout & Editor      (beautiful, flexible, simple to author)
Pillar B — Embedding            (rich media, fast, safe)
Pillar C — Comments & Engagement (hook readers, keep them on page)
Pillar D — Analytics            (editorial dashboard + audience insight)
        ↳ cross-cutting: SEO / AEO layer (§8)
```

---

## 4. Pillar A — Beautiful, flexible layouts with a simple workflow

### 4.1 The core principle: constrained structured content

The reason most CMS blogs look ugly is that they let authors control raw HTML/CSS. You avoid
this entirely:

- **Content is structured** (Tiptap JSON blocks) — you already do this.
- **Design is owned by code** — every block type maps to a polished React component using your
  studio design tokens (porcelain `#F7F4EF`, charcoal `#1C1917`, terracotta/gold `#8C532B`,
  Inter + serif accents). The author chooses *content and a few constrained variants*, never
  fonts/colors/spacing.
- Result: it is structurally **impossible** to produce an ugly post.

### 4.2 Story Templates (the "different layouts" the admin picks)

A **template** is a render composition applied to the same structured content — it changes the
masthead, typography rhythm, TOC placement, gallery treatment, and footer. Add a
`template` field to `BlogPost` and offer a small, curated set:

| Template | Best for | Signature treatment |
| :-- | :-- | :-- |
| `cinematic-real-wedding` | Real wedding features | Full-bleed hero + couple names overlay, "At a Glance" stats strip (venue/season/budget), film embed hero, closing testimonial |
| `editorial-guide` | Planning / destination guides | Prominent TOC rail, FAQ block, pull-quotes, How-To steps — AEO-optimized |
| `photo-essay` | Galleries / BTS | Minimal text, edge-to-edge masonry, captions as overlays |
| `minimal-journal` | Short studio notes | Narrow measure, generous whitespace, no hero |

Authoring stays simple: it's **one dropdown**. The live preview + mobile/desktop toggle shows
exactly what publishes.

### 4.3 The block palette (curated, with limited variants)

Extend your Tiptap nodes into a full wedding-tuned palette. Each block has 2–3 *constrained*
style variants only:

- Hero / cover (variants: overlay-title, below-title, split)
- Rich text (H2–H4, lists, blockquote, link)
- **Photo gallery** (masonry / grid-2 / grid-3 / carousel / full-bleed) — extend existing
- **Inline figure** (full / center / left / right, LCP priority) — existing
- **Video** (Cloudflare Stream / YouTube / Vimeo / MP4) — existing
- **Pull-quote** (large editorial quote)
- **Callout** (note / vendor / testimonial) — existing
- **"At a Glance" stats** (auto-built from wedding metadata: venue, season, budget, style)
- **Vendor Credits** (role → name → link/IG) → backlink engine
- **FAQ** (Q/A pairs) → drives FAQ schema (AEO)
- **How-To steps** (numbered) → HowTo schema for planning guides
- **Client showcase** (embed a film/gallery from your own portfolio — 1-click picker)
- **Enquiry CTA** (tracked conversion button)
- **Newsletter capture** (email opt-in)
- **Related stories** (auto or manual)

### 4.4 Editor UX upgrades (keep the "simple workflow" promise)

- **Slash command / block inserter** (`/gallery`, `/vendor`, `/faq`) — Notion-style, fast.
- **Drag-to-reorder blocks.**
- **Autosave** to a `BlogPostRevision` collection + local draft, so nothing is lost on a
  network drop. (You listed this as a next-phase item — do it early; authors will trust the tool.)
- **Revision history** with restore.
- **Live preview modal** with **mobile ⇄ desktop toggle** rendering the *exact* production
  template. Your readers are majority mobile — authors must see mobile first.
- **Inline SEO/readability meter** (title/description length, keyword presence, heading order,
  alt-text coverage, reading ease) — a real, rules-based score (not the current opaque
  `seoScore`).
- **Roles & approval workflow**: `Editor` writes drafts → `SuperAdmin` approves & publishes.

### 4.5 Rendering architecture

- One `<BlogRenderer template=… blocks=… />` server component.
- A **block registry**: `{ [blockType]: Component }`. Rendering iterates the JSON AST and maps
  each node to its component. New block = new entry in the registry + a Tiptap node. Clean and
  extensible.
- Render **from `contentJson`** (authoritative) and keep the HTML string only as a cache — this
  is the recommended pattern and lets you restyle every past post by changing components, no
  re-authoring needed.

---

## 5. Pillar B — Embedding architecture ("all types", but fast & safe)

**Problem:** embeds (Instagram, YouTube, TikTok, Twitter) are heavy third-party scripts that
wreck Core Web Vitals if injected naively.

**Solution — unified Embed block with facades:**

- One `Embed` node: `{ provider, url, embedId, aspectRatio, caption, thumbnail }`.
- **Server-side resolution** via **oEmbed** where available; store the resolved id/thumbnail so
  the page never blocks on a third-party call at render time.
- **Click-to-load facade pattern**: render a lightweight thumbnail + play button; load the real
  iframe/script only on interaction (use `lite-youtube-embed` / equivalent facades). Massive
  LCP/TBT win.
- **Domain allowlist + sanitization** — never inject arbitrary HTML.
- Wedding-relevant providers to support: **Cloudflare Stream** (your films), YouTube, Vimeo,
  **Instagram** (reels/posts), **Spotify** (first-dance / playlist), **Google Maps** (venue
  location — also reinforces local SEO), **Pinterest**, TikTok, X/Twitter, and native
  **client film/gallery** embeds from your own portfolio.
- Each embed gets an optional caption and lazy-loads below the fold.

---

## 6. Pillar C — Comments & engagement (the "hook")

Native, in your Express/Mongo stack. Frictionless to post, controlled to moderate, indexable
for SEO.

### 6.1 Data model — `Comment`

```javascript
const commentSchema = new mongoose.Schema({
  blogPost:  { type: ObjectId, ref: 'BlogPost', required: true, index: true },
  parent:    { type: ObjectId, ref: 'Comment', default: null, index: true }, // null = top-level
  threadRoot:{ type: ObjectId, ref: 'Comment', default: null, index: true }, // fast thread fetch
  author: {
    name:    { type: String, required: true, trim: true, maxlength: 80 },
    email:   { type: String, required: true, lowercase: true, trim: true }, // never shown publicly
    website: { type: String, trim: true },
  },
  body:      { type: String, required: true, maxlength: 3000 }, // sanitized on save
  status:    { type: String, enum: ['pending','approved','spam','rejected'],
               default: 'pending', index: true },
  likes:       { type: Number, default: 0 },
  isStudioReply:{ type: Boolean, default: false }, // "The Wedding Boys" badge
  isPinned:    { type: Boolean, default: false },
  edited:      { type: Boolean, default: false },
  reportsCount:{ type: Number, default: 0 },
  meta:      { ipHash: String, userAgent: String, country: String },
}, { timestamps: true });
```

Denormalize `commentCount` onto `BlogPost` (update via hooks) for fast dashboard reads.

### 6.2 Threading & engagement features (YouTube-inspired, lighter)

- **Shallow threading**: top-level comments + **one level** of replies. (Infinite nesting
  ruins mobile UX; one level is the sweet spot.)
- **Likes/hearts** on comments; sort by **Top** or **Newest**.
- **Studio replies** get a verified badge; **pin** your best reply/comment to the top.
- **Reply, report, edit-window** (few minutes).
- **Frictionless posting**: name + email, **no account required** (email is for reply
  notifications only, never public). Optional social login later.

### 6.3 Anti-spam & moderation (matches your MESQUITE reference queue)

- **Honeypot field** + **time-to-submit** check (bots fill instantly).
- **Rate limiting** per IP (you flagged this gap site-wide — add `express-rate-limit`).
- **Spam classification**: Akismet (drop-in) or a self-hosted keyword/link heuristic; auto-file
  to `spam`.
- **Link caps** (N links → auto-pending).
- **Moderation dashboard** with `Approved / Pending / Spam / Rejected` tabs and bulk actions —
  mirror the reference UI's Comments module.
- **New comments default to `pending`** (or auto-approve returning approved emails).

### 6.4 SEO & engagement wins

- **Server-render approved comments in the page HTML** so Google indexes the fresh
  user-generated content (a real ranking asset). Lazy-load/paginate older threads.
- **Notification loop = the hook**: email the studio on every new comment; email a commenter
  when someone (especially the studio) replies → brings them **back to the page**. This is the
  single highest-leverage retention mechanic.

### 6.5 Other on-page retention mechanics

- **Related stories** block (same category / overlapping tags) — you already have the API.
- **Sticky reading progress bar** + **TOC** (desktop rail, mobile collapsible).
- **Next / previous story** at the end.
- **"Save/like this story"** (lightweight, localStorage or email).
- **Newsletter capture** mid-article and at end.
- **Enquiry CTA** contextual to the post (real-wedding post → "Plan your [venue] wedding").

---

## 7. Pillar D — Analytics (two layers)

### 7.1 Layer 1 — Editorial dashboard (from your own DB)

Match and exceed the MESQUITE reference. Build these from your data:

- **KPI cards** (extend current): Total, Published, Drafts, **Total Views**, **Total
  Comments**, **Avg. Read Completion %**.
- **Post Growth chart** (posts published per month, 6-month range).
- **Comments Trend chart** (Approved / Pending / Spam over last 15–30 days) — exactly the
  reference's second chart.
- **Top Stories table** (by views, avg time, comments, enquiry-CTA clicks).
- **Category distribution** (which topics perform).
- **Recent comments** queue with quick approve/reply.
- **Top commenters / returning readers.**

**View tracking:** add a `BlogDailyStat` time-series collection so the charts are cheap:

```javascript
const blogDailyStatSchema = new mongoose.Schema({
  date:          { type: Date, index: true },       // day granularity
  blogPost:      { type: ObjectId, ref: 'BlogPost', index: true },
  views:         { type: Number, default: 0 },
  uniqueViews:   { type: Number, default: 0 },
  readCompletes: { type: Number, default: 0 },      // scrolled ≥ 90%
  ctaClicks:     { type: Number, default: 0 },
});
```

Increment via a lightweight `POST /api/blogs/:slug/view` (dedupe per session with a cookie/
localStorage key). Denormalize `viewCount` onto `BlogPost`.

### 7.2 Layer 2 — Audience analytics (dedicated tool)

Don't rebuild traffic analytics. Add **Plausible** (recommended) — cookieless, no consent
banner, lightweight, and it **auto-tracks scroll depth**. Free self-hosted alternative:
**Umami** (MIT, ~2GB VPS). Consider **PostHog** later only if you want session replay + funnels.

Fire **custom events** for the metrics that prove engagement/conversion:
`read_complete` (scroll ≥90%), `comment_posted`, `embed_played`, `gallery_opened`,
`cta_enquiry_click`, `newsletter_signup`. Pull key numbers back into the editorial dashboard
via the Plausible/Umami stats API.

GA4 only if you run Google Ads.

---

## 8. Cross-cutting SEO / AEO layer

- **Per-post schema by template**: `Article`/`BlogPosting` everywhere; add **`FAQPage`** when
  an FAQ block exists and **`HowTo`** for step guides (AEO); `VideoObject` for film embeds;
  `ImageObject` for hero. Add `BreadcrumbList`.
- **Dynamic OG images** with `@vercel/og` / Next `ImageResponse`: couple names + venue +
  studio badge → better social CTR (you flagged this).
- **Vendor-credit backlinks**: clean follow-links out; a "featured on" ask-back workflow.
- **Programmatic location pages** from `indianLocations`: `/weddings/[city]` aggregating real
  weddings + a guide + local schema. High-intent, hyper-local organic.
- **Internal linking**: related stories, category hubs, city hubs → distributes authority and
  raises time-on-site.
- **Sitemap**: include every published post, category, and location page; ping on publish
  (on-demand revalidation).
- **Freshness**: `dateModified` updates; "updated for 2026" passes.

---

## 9. Data model additions (summary)

**New collections:** `Comment` (§6.1), `BlogDailyStat` (§7.1), `BlogPostRevision`
(autosave/history).

**`BlogPost` new fields:**
`template` (enum), `faq: [{question, answer}]`, `vendorCredits: [{role, name, url, instagram}]`,
`allowComments: Boolean`, denormalized `viewCount / likeCount / commentCount`,
optional `relatedPosts: [ObjectId]`.

---

## 10. API endpoints to add

Public:
- `GET  /api/blogs/:slug/comments` — approved, threaded, paginated
- `POST /api/blogs/:slug/comments` — create (honeypot + rate-limit + spam check → pending)
- `POST /api/comments/:id/like`
- `POST /api/comments/:id/report`
- `POST /api/blogs/:slug/view` — increment view / read-complete

Admin:
- `GET  /api/admin/comments?status=pending|spam|…` — moderation queue
- `PUT  /api/admin/comments/:id/status` — approve/spam/reject
- `POST /api/admin/comments/:id/reply` — studio reply (badge)
- `PUT  /api/admin/comments/:id/pin`
- `GET  /api/admin/blogs/analytics` — dashboard aggregates (growth, comment trend, top posts)
- `POST /api/admin/blogs/:id/revisions` + `GET …/revisions` + restore

---

## 11. Phased roadmap

**Phase 1 — Editor & layout core (highest craft leverage)**
Story Templates + `template` field + block registry renderer; expand block palette (pull-quote,
at-a-glance, vendor credits, FAQ, CTA); slash inserter; autosave + revisions; mobile/desktop
live preview.

**Phase 2 — Embedding**
Unified Embed node, oEmbed resolution, click-to-load facades, provider allowlist, wedding
providers (Stream/IG/Spotify/Maps).

**Phase 3 — Comments & engagement**
`Comment` model + public threaded UI + likes/sort; anti-spam (honeypot, rate limit, Akismet);
moderation dashboard; notification loop; related/next-prev/newsletter/CTA retention blocks.

**Phase 4 — Analytics**
`BlogDailyStat` + view/read tracking; editorial dashboard charts (growth, comment trend, top
posts); Plausible/Umami + custom events; pull audience stats into dashboard.

**Phase 5 — SEO / AEO / scale**
FAQ/HowTo schema, dynamic OG images, vendor backlink workflow, programmatic city pages,
internal-linking + category/city hubs, sitemap-on-publish.

**Phase 6 — Editorial governance**
Roles & approval workflow, AI co-pilot (meta/description drafting, SEO scoring), client-showcase
cross-linking picker.

---

## 12. Recommended libraries / tools

| Need | Pick | Note |
| :-- | :-- | :-- |
| Editor | **Tiptap v2** (keep) | Add slash-command + drag-handle extensions |
| Charts (dashboard) | **Recharts** or **Chart.js** | Matches the reference visuals |
| HTML sanitize | **sanitize-html** / DOMPurify | For comment bodies + any HTML cache |
| Spam | **Akismet** | Or self-hosted heuristic |
| Rate limiting | **express-rate-limit** (+ Redis store at scale) | Site-wide gap you already noted |
| Embeds | **oembed** resolver + **lite-youtube-embed**-style facades | Perf-safe |
| Audience analytics | **Plausible** (or self-hosted **Umami**) | Auto scroll depth, cookieless |
| Product analytics (later) | **PostHog** | Session replay + funnels |
| OG images | Next **ImageResponse** / `@vercel/og` | Dynamic social cards |
| Email (notifications) | your existing Nodemailer | Reuse |

---

## 13. Sources

- Tiptap vs Lexical vs Editor.js (2026): pkgpulse.com, nutrient.io, starterpick.com — Tiptap is the CMS default; migrate editors only when blocked; store canonical JSON.
- Comment systems: logora.com, privacytools.io, joey.team, bartowfirst.com, blogpros.com — native/self-hosted = SEO + control; Disqus embed >1MB, tracks users.
- Analytics: openpanel.dev, posthog.com, birjob.com, vemetric.com — Plausible auto scroll-depth, cookieless; Umami free MIT self-host; PostHog for product analytics.
- Wedding niche SEO/engagement: brianlawrence.com, storyvenuemarketing.com, dualsparkmarketing.com, everbridal.com, ofdconsulting.com — real weddings for long-term SEO, engagement/reviews as ranking signals, FAQ/HowTo for AEO, vendor credits for backlinks, hyper-local pages.

---

## 14. First Claude Code task (scoped — paste into Claude Code)

> Attach `README.md` (blog subsystem) and this plan. Use Opus 4.8 for this design pass if
> available, then Sonnet 5 for bulk implementation.

```
We are extending the existing Tiptap-based blog system (do NOT switch editors). Read the blog
README and the implementation plan. Implement PHASE 1 (Editor & Layout core) ONLY.

1. Produce a short design doc first (BLOG-PHASE-1.md): the block-registry render architecture,
   the `template` field + the 4 story templates, the expanded block palette, and the autosave/
   revision approach. Pause for my approval before coding.
2. Add a `template` enum field to the BlogPost model (default 'editorial-guide') + migration-safe
   default. Add faq[], vendorCredits[], allowComments, and denormalized viewCount/likeCount/
   commentCount fields.
3. Build a block registry renderer <BlogRenderer template blocks /> (server component) that maps
   Tiptap JSON node types → design-system React components using our studio tokens. Render from
   contentJson (HTML string stays as cache only).
4. Implement the 4 templates as render compositions (cinematic-real-wedding, editorial-guide,
   photo-essay, minimal-journal). Visual parity with our tokens; mobile-first.
5. Add these new Tiptap nodes + toolbar/slash inserters with 2–3 constrained variants each:
   PullQuote, AtAGlanceStats (from wedding metadata), VendorCredits, FAQ, EnquiryCTA.
6. Add a template selector to the editor sidebar and a live-preview modal with a MOBILE⇄DESKTOP
   toggle that renders the exact production template.
7. Add autosave to a new BlogPostRevision collection + local draft; add revision list + restore.

Constraints: TypeScript, App Router, keep admin client-side, do not touch comments/analytics in
this phase, small reviewable commits, do not push. State assumptions inline and proceed.
```