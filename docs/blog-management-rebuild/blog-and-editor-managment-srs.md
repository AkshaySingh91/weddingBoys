# Software Requirements Specification (SRS)
## The Wedding Boys — Blog & Editorial Management System

| | |
| :-- | :-- |
| **Document** | Software Requirements Specification |
| **System** | Blog & Editorial Management Subsystem (BMS) |
| **Product** | The Wedding Boys — theweddingboys.in |
| **Version** | 1.0 |
| **Status** | Baselined for implementation |
| **Author** | Akshay Singh |
| **Standard** | Structured after ISO/IEC/IEEE 29148 (adapted) |

---

## Table of Contents

1. Introduction
2. Overall Description
3. System Architecture
4. Data Model
5. External Interface Requirements
6. Functional Requirements
7. Non-Functional Requirements
8. Workflows, Use Cases & State Machines
9. Analytics, Metrics & KPIs
10. Release Plan / Phasing
11. Risks & Mitigations
12. Acceptance Criteria & Definition of Done
13. Appendices (Glossary, Traceability, API Summary)

---

## 1. Introduction

### 1.1 Purpose
This SRS specifies the requirements for the **Blog & Editorial Management System (BMS)** of The
Wedding Boys — an ultra-luxury cinematic wedding film and photography studio operating across
India (Varanasi, Delhi, Udaipur, and destination locations). The BMS is the content engine that
publishes real-wedding features, planning/destination guides, and cinematography journals with
the explicit business goal of **ranking in organic and AI-powered search, maximizing reader
engagement, and converting readers into enquiries**.

The document is the single source of truth for engineers (including AI coding agents such as
Claude Code), reviewers, and the studio product owner.

### 1.2 Scope
The BMS covers the full editorial lifecycle: authoring, layout/templating, media, embedding,
SEO/AEO, publishing workflow, public rendering, reader comments and engagement, moderation,
notifications, and analytics.

**In scope:** admin editorial cockpit, public article experience, comment subsystem, moderation,
editorial + audience analytics, SEO/AEO tooling, media library integration, role-based access.

**Out of scope (handled by other WeddingBoys subsystems):** client/portfolio CRM, enquiry forms,
studio-settings CMS, admin identity onboarding (invite/OTP) — the BMS consumes these but does not
own them.

### 1.3 Definitions, Acronyms, Abbreviations
| Term | Meaning |
| :-- | :-- |
| **BMS** | Blog & Editorial Management System (this product) |
| **AST** | Abstract Syntax Tree — canonical Tiptap JSON representation of article content |
| **Block** | A structural content unit (paragraph, gallery, callout, FAQ, etc.) |
| **Template / Story Format** | A curated render composition applied to structured content |
| **AEO** | Answer Engine Optimization — optimizing for AI/LLM search answers |
| **ISR** | Incremental Static Regeneration (Next.js) |
| **RBAC** | Role-Based Access Control |
| **UGC** | User-Generated Content (reader comments) |
| **CWV** | Core Web Vitals (LCP, INP, CLS) |
| **BFF** | Backend-for-Frontend (Next.js route handlers serving the app) |
| **TOC** | Table of Contents |

### 1.4 References
- Existing "Blog Management System Architecture & Reference" (README, Sept 2026).
- WeddingBoys Project Analysis (MERN → Next.js migration, July 2026).
- WeddingBoys Blog Management Research-Backed Plan (this project).
- Web standards: schema.org, WCAG 2.2 AA, Core Web Vitals.

### 1.5 Requirement conventions
- Each requirement has a unique ID: **`FR-<MODULE>-<NN>`** (functional) or **`NFR-<AREA>-<NN>`**.
- Priority: **P0** (must, launch-blocking) · **P1** (should) · **P2** (nice-to-have).
- Keywords **MUST / SHOULD / MAY** follow RFC-2119 intent.

### 1.6 Intended audience
Engineering (human + AI agents), QA, the studio product owner, and future integrators.

---

## 2. Overall Description

### 2.1 Product perspective
The BMS is a subsystem of the WeddingBoys web platform. It reuses platform infrastructure:
authentication (JWT httpOnly signed cookies), the Media Library (R2/Stream), Nodemailer email,
and the studio design system. It exposes a public reading experience and a protected admin
cockpit.

```
                     ┌──────────────────────────────────────────┐
                     │                Readers (public)           │
                     └───────────────┬──────────────────────────┘
                                     │ HTTPS
     ┌───────────────────────────────▼───────────────────────────────┐
     │        Next.js 16 (App Router, RSC)  —  Rendering + BFF        │
     │  Public: SSG/ISR article pages, category & city hubs, comments │
     │  Admin : client-rendered editorial cockpit (noindex)          │
     └───────────────┬───────────────────────────────┬──────────────┘
                     │ REST (JSON)                    │ CDN / ISR cache
     ┌───────────────▼───────────────┐   ┌────────────▼──────────────┐
     │   Express Domain API (Node)   │   │  Edge CDN (Vercel/CF)     │
     │   Blogs · Comments · Analytics│   └───────────────────────────┘
     │   Moderation · Media proxy    │
     └───────┬───────────────┬───────┘
             │               │
     ┌───────▼──────┐ ┌──────▼────────┐ ┌───────────────┐ ┌──────────────┐
     │ MongoDB Atlas │ │ Cloudflare R2 │ │ CF Stream     │ │ 3rd-party    │
     │ (domain data) │ │ (images/files)│ │ (HLS video)   │ │ Akismet/Plaus│
     └──────────────┘ └───────────────┘ └───────────────┘ └──────────────┘
```

**Architectural decision (exercised authority):** content is authored and stored as **Tiptap
JSON AST as the canonical source**, with rendered HTML kept only as a derived cache. All visual
presentation is owned by code (a block-registry renderer + templates); authors never write CSS or
raw HTML. This guarantees design consistency and lets every historical post be restyled by
changing components.

### 2.2 Product functions (high level)
- Compose, edit, autosave, and version rich editorial content via a block editor.
- Apply curated **story templates** and constrained **blocks** for varied but always-beautiful layouts.
- Insert rich, performance-safe **embeds** (video, social, audio, maps).
- Manage taxonomy, SEO/AEO metadata, and wedding storytelling metadata.
- Enforce a **publishing workflow** with roles and approvals; schedule publication.
- Render public articles with **SSG/ISR**, structured data, TOC, and reading progress.
- Accept, moderate, and display **threaded reader comments** with anti-spam.
- Drive **engagement** (likes, related stories, notifications, CTAs, newsletter).
- Provide **editorial analytics** (dashboard) and **audience analytics** (traffic/scroll/conversion).

### 2.3 User classes and characteristics (RBAC)
| Role | Description | Key permissions |
| :-- | :-- | :-- |
| **Super Admin** | Studio owner/lead | Everything: publish, schedule, manage users/roles, settings, delete, moderate |
| **Editor** | Senior editorial staff | Create/edit any draft, submit & **publish**, manage taxonomy, moderate comments |
| **Author** | Contributor | Create/edit **own** drafts, submit for review; **cannot** publish |
| **Moderator** | Community manager | Comment moderation + studio replies only |
| **Reader (public)** | Unauthenticated visitor | Read, comment (name+email), like, report, share |

### 2.4 Operating environment
- **Clients:** modern evergreen browsers; **mobile-first** (majority audience on phones).
- **Server:** Node.js LTS; MongoDB Atlas; Cloudflare R2/Stream; deployment on Vercel (Next) +
  managed Node host (Express) or consolidated hosting.
- **Locale:** primary `en-IN`; content India-centric with destination coverage.

### 2.5 Design & implementation constraints
- Must integrate with the existing Next.js 16 App Router + Express/Mongo + R2/Stream stack.
- **Keep Tiptap** as the editor engine (no editor migration).
- TypeScript (strict) for all new frontend code.
- Tailwind only, using studio design tokens (porcelain `#F7F4EF`, charcoal `#1C1917`,
  terracotta/gold `#8C532B`, borders `#E5DCD3`); Inter for UI, serif for mastheads; Phosphor icons.
- No third-party comment platform (Disqus etc.) — native subsystem for control, privacy, SEO, perf.
- Admin routes are `noindex`; public routes are SEO-critical.

### 2.6 Assumptions & dependencies
- Platform auth (JWT cookie) and Media Library APIs are available and stable.
- Email delivery (Nodemailer/SMTP) is configured.
- A CDN/edge cache fronts public routes.
- Akismet (or equivalent) key available for spam classification; Plausible/Umami available for
  audience analytics.

### 2.7 User documentation
An in-app authoring guide, a moderation guide, and an editorial style guide SHOULD be provided.

---

## 3. System Architecture

### 3.1 Layered view
1. **Presentation** — Next.js RSC pages (public) + client cockpit (admin).
2. **BFF** — Next route handlers for auth-aware fetching, ISR/revalidation, OG image generation.
3. **Domain API** — Express REST controllers (Blogs, Comments, Moderation, Analytics, Media proxy).
4. **Persistence** — MongoDB (domain data); R2/Stream (media binaries).
5. **Integration** — Akismet, Plausible/Umami, Nodemailer, oEmbed providers.

### 3.2 Component breakdown
| Component | Responsibility |
| :-- | :-- |
| **Editor Core** | Tiptap instance, nodes/extensions, toolbar, slash inserter, autosave |
| **Block Registry & Renderer** | Maps AST node → React component; renders public article by template |
| **Template Engine** | 4 story formats (composition of masthead/TOC/gallery/footer treatments) |
| **Media Adapter** | Presigned R2 uploads, Stream ingest, `blurDataURL`/`dominantColor` generation |
| **Embed Resolver** | oEmbed resolution, provider allowlist, facade metadata |
| **Publishing Service** | Lifecycle transitions, scheduling, slug uniqueness, revalidation triggers |
| **SEO/AEO Service** | Metadata, JSON-LD (Article/FAQ/HowTo/Video), OG image, sitemap |
| **Comment Service** | Create/thread/like/report, spam pipeline, notification hooks |
| **Moderation Service** | Queue, status transitions, studio replies, bulk actions |
| **Analytics Service** | View/read event ingestion, daily aggregation, dashboard aggregates |
| **Notification Service** | Email to studio and commenters (reply loop) |
| **Search & Taxonomy** | Text search, category/tag/city indexing |

### 3.3 Technology stack (baselined)
Next.js 16 (App Router, RSC, TypeScript) · React 19 · Tailwind · Tiptap v2 (ProseMirror) ·
Radix UI · Phosphor Icons · Node.js/Express · MongoDB/Mongoose 8 · Cloudflare R2 + Stream ·
Recharts (dashboard) · sanitize-html/DOMPurify · express-rate-limit · Akismet · Plausible/Umami ·
Nodemailer · Next `ImageResponse` for OG.

### 3.4 Caching & rendering strategy
- Public article, category, and city pages: **SSG + ISR** (revalidate, default 1h) with
  **on-demand revalidation** on publish/update/comment-approval.
- Comments hydrated server-side (approved subset) for SEO; further pages lazy-loaded client-side.
- Edge CDN caches HTML/ISR output; media served from R2/Stream CDN.

---

## 4. Data Model

Canonical content = `contentJson` (Tiptap AST). `contentHtml` is a derived cache.

### 4.1 `BlogPost`
```
BlogPost {
  title            String  required
  slug             String  required unique lowercase index
  excerpt          String  required max 200
  contentJson      Mixed   required           // canonical AST
  contentHtml      String                      // derived cache (sanitized)
  template         Enum ['cinematic-real-wedding','editorial-guide','photo-essay','minimal-journal']
                          default 'editorial-guide'

  coverImage       Ref<Media>
  gallery          [Ref<Media>]
  inlineMedia      [Ref<Media>]

  category         Enum [8 wedding categories] index
  tags             [String lowercase]
  keywords         [String]

  status           Enum ['Draft','InReview','Scheduled','Published','Archived'] default 'Draft' index
  publishedAt      Date index
  scheduledFor     Date

  author           Ref<Admin> index
  contributors     [Ref<Admin>]

  // SEO / AEO
  metaTitle        String max 70
  metaDescription  String max 160
  canonicalUrl     String
  socialTitle      String
  socialDescription String
  focusKeyword     String
  seoScore         Number 0..100              // computed, rules-based
  faq              [{ question, answer }]      // → FAQPage schema
  howToSteps       [{ name, text, image }]     // → HowTo schema (guides)

  // Wedding storytelling
  mood             Enum   season Enum   budget String
  venue            String   style String   testimonial String
  vendorCredits    [{ role, name, url, instagram }]   // backlink engine

  // Engagement / relations
  allowComments    Boolean default true
  relatedPosts     [Ref<BlogPost>]            // manual override; else auto
  readingTime      Number
  tableOfContents  [{ level, text, id }]

  // Denormalized counters
  viewCount        Number default 0
  likeCount        Number default 0
  commentCount     Number default 0

  timestamps
}
```
Indexes: `slug`(unique), `status+publishedAt`, `category`, `tags`, text index on
`title/excerpt/tags`.

### 4.2 `Comment`
```
Comment {
  blogPost     Ref<BlogPost> required index
  parent       Ref<Comment> default null index      // null = top-level
  threadRoot   Ref<Comment> default null index      // fast thread fetch
  author       { name(≤80,req), email(req,private), website? }
  body         String required max 3000              // sanitized
  status       Enum ['pending','approved','spam','rejected'] default 'pending' index
  likes        Number default 0
  isStudioReply Boolean default false
  isPinned     Boolean default false
  edited       Boolean default false
  reportsCount Number default 0
  meta         { ipHash, userAgent, country }
  timestamps
}
```

### 4.3 `BlogDailyStat` (time-series for dashboard charts)
```
BlogDailyStat {
  date         Date index      // day granularity
  blogPost     Ref<BlogPost> index
  views        Number default 0
  uniqueViews  Number default 0
  readCompletes Number default 0   // scroll ≥ 90%
  ctaClicks    Number default 0
}
```

### 4.4 `BlogPostRevision` (autosave / history)
```
BlogPostRevision {
  blogPost   Ref<BlogPost> index
  title      String
  contentJson Mixed
  editedBy   Ref<Admin>
  reason     Enum ['autosave','manual','publish-snapshot']
  createdAt  Date
}
```

### 4.5 Relationships
- `BlogPost 1─N Comment`; `Comment 0..1 parent` (self-ref, 1-level threading enforced in service).
- `BlogPost N─N Media` (cover/gallery/inline).
- `BlogPost N─1 Admin` (author) and `N─N Admin` (contributors).
- `BlogPost 1─N BlogDailyStat`, `1─N BlogPostRevision`.

---

## 5. External Interface Requirements

### 5.1 User interfaces
**Admin cockpit** (client-rendered, `noindex`): Dashboard, Articles list, Composer (2-column:
canvas + editorial sidebar), Media picker modal, Comment moderation queue, Analytics views,
Settings. Must meet WCAG 2.2 AA and be fully usable on tablet/desktop; composer optimized for
laptop with mobile-preview.

**Public experience** (SSG/ISR): article page (hero, TOC, progress bar, blocks, comments,
related/next-prev, CTA), category hubs, city hubs, blog index with filters/search.

### 5.2 API interfaces (REST/JSON) — summary (full list §13.3)
Public: list/read articles, related, comments CRUD-subset, like/report, view/read events.
Admin: article CRUD + lifecycle, revisions, comment moderation, analytics aggregates, media proxy.

### 5.3 Software / third-party interfaces
R2 (S3-compatible presigned PUT), Cloudflare Stream (video ingest + HLS delivery), Akismet
(spam check), Plausible/Umami (events + stats API), Nodemailer (SMTP), oEmbed provider endpoints.

### 5.4 Communication interfaces
HTTPS only; JSON payloads; JWT httpOnly signed cookie for admin auth; CORS restricted to studio
origins; rate-limited public write endpoints.

---

## 6. Functional Requirements

> Priority key: **P0** launch-blocking · **P1** should · **P2** later.

### 6.1 Authentication & Authorization (AUTH)
| ID | Pri | Requirement |
| :-- | :-- | :-- |
| FR-AUTH-01 | P0 | The system MUST authenticate admin users via the platform JWT httpOnly signed cookie and reject unauthenticated access to `/admin/**` and admin APIs. |
| FR-AUTH-02 | P0 | The system MUST enforce RBAC per §2.3; every admin API MUST verify role permission server-side, not only in UI. |
| FR-AUTH-03 | P0 | Authors MUST be restricted to their own drafts for edit/delete; Editors/Super Admins MAY act on any post. |
| FR-AUTH-04 | P1 | The system MUST log security-relevant actions (publish, delete, role change, bulk moderation) with actor, timestamp, and target. |

### 6.2 Content Authoring — Editor (EDIT)
| ID | Pri | Requirement |
| :-- | :-- | :-- |
| FR-EDIT-01 | P0 | The editor MUST persist content as Tiptap JSON AST (`contentJson`) as the canonical source and derive sanitized `contentHtml` as cache. |
| FR-EDIT-02 | P0 | The editor MUST support: paragraphs, H2–H4, bold/italic/underline/strike, ordered/unordered lists, blockquote, divider, hyperlink (via accessible dialog, no `window.prompt`), and text alignment. |
| FR-EDIT-03 | P0 | The editor MUST provide a **slash command / block inserter** to add any palette block by name. |
| FR-EDIT-04 | P0 | The editor MUST support **drag-to-reorder** of blocks. |
| FR-EDIT-05 | P0 | The system MUST **autosave** drafts (debounced, e.g. ≤5s idle) to a local buffer and to `BlogPostRevision`, surviving navigation/network loss. |
| FR-EDIT-06 | P1 | The system MUST maintain **revision history** with author, timestamp, and one-click **restore**; a snapshot MUST be taken on each publish. |
| FR-EDIT-07 | P0 | The editor MUST display live word count, character count, and estimated reading time. |
| FR-EDIT-08 | P0 | The system MUST auto-generate the TOC (H2–H4) with slugified anchor ids and reflect it live. |
| FR-EDIT-09 | P0 | The editor MUST provide a **live preview** with a **mobile ⇄ desktop toggle** rendering the exact production template. |
| FR-EDIT-10 | P1 | The editor MUST warn on unsaved changes and on navigating away mid-edit. |

### 6.3 Layout & Templating (LAYOUT)
| ID | Pri | Requirement |
| :-- | :-- | :-- |
| FR-LAYOUT-01 | P0 | The system MUST provide a **block-registry renderer** mapping each AST node type to a design-system React component; adding a block MUST require only a registry entry + a Tiptap node. |
| FR-LAYOUT-02 | P0 | The system MUST provide 4 **story templates** (`cinematic-real-wedding`, `editorial-guide`, `photo-essay`, `minimal-journal`), selectable per post via a single control. |
| FR-LAYOUT-03 | P0 | Authors MUST NOT be able to set raw CSS, fonts, or colors; blocks MUST expose only 2–3 pre-designed variants each. |
| FR-LAYOUT-04 | P0 | The palette MUST include: hero/cover, rich text, photo gallery (masonry/grid-2/grid-3/carousel/full-bleed), inline figure (full/center/left/right, LCP priority), video, pull-quote, callout (note/vendor/testimonial), **At-a-Glance stats** (from wedding metadata), **Vendor Credits**, **FAQ**, **How-To steps**, **Client Showcase** (embed own film/gallery), **Enquiry CTA**, **Newsletter capture**, **Related stories**. |
| FR-LAYOUT-05 | P0 | Public rendering MUST render from `contentJson` (not the HTML cache) so components can be restyled without re-authoring. |
| FR-LAYOUT-06 | P1 | The **Client Showcase** block MUST offer a 1-click picker to embed a film/gallery from the studio portfolio. |

### 6.4 Media (MEDIA)
| ID | Pri | Requirement |
| :-- | :-- | :-- |
| FR-MEDIA-01 | P0 | The system MUST integrate the platform Media Library (R2/Stream) with presigned uploads, drag-drop, and progress. |
| FR-MEDIA-02 | P0 | Every image MUST carry `blurDataURL` + `dominantColor` for zero CLS, and MUST require **alt text** before use (accessibility + SEO). |
| FR-MEDIA-03 | P0 | Images MUST be served responsively (Next Image) with correct sizes; the hero/LCP image MUST use `fetchpriority=high`. |
| FR-MEDIA-04 | P0 | Video MUST support Cloudflare Stream (adaptive HLS) as the primary path, plus YouTube/Vimeo/MP4 fallbacks. |
| FR-MEDIA-05 | P1 | Deleting a post MUST archive (not hard-delete) referenced media. |

### 6.5 Embedding (EMBED)
| ID | Pri | Requirement |
| :-- | :-- | :-- |
| FR-EMBED-01 | P0 | The system MUST provide a unified Embed block resolving providers via **oEmbed** where available, storing provider/id/aspect/caption/thumbnail. |
| FR-EMBED-02 | P0 | Embeds MUST use a **click-to-load facade** (thumbnail + play/open) and load third-party scripts/iframes only on interaction. |
| FR-EMBED-03 | P0 | The system MUST enforce a **provider allowlist** and sanitize all embed input; arbitrary HTML MUST be rejected. |
| FR-EMBED-04 | P0 | Supported providers MUST include: Cloudflare Stream, YouTube, Vimeo, Instagram, Spotify, Google Maps, Pinterest, TikTok, X/Twitter, and native client film/gallery. |
| FR-EMBED-05 | P1 | Each embed MUST support an optional caption and lazy-load below the fold. |

### 6.6 Taxonomy, SEO & AEO (SEO)
| ID | Pri | Requirement |
| :-- | :-- | :-- |
| FR-SEO-01 | P0 | Each post MUST expose editable metaTitle (≤70), metaDescription (≤160), canonical URL, social title/description, and focus keyword, with live length validation. |
| FR-SEO-02 | P0 | Public pages MUST emit `generateMetadata` (title, description, canonical, OpenGraph, Twitter) sourced from post fields with sensible fallbacks. |
| FR-SEO-03 | P0 | Public pages MUST emit JSON-LD: `Article`/`BlogPosting` always; `FAQPage` when FAQ present; `HowTo` when steps present; `VideoObject` for film embeds; `BreadcrumbList`. |
| FR-SEO-04 | P0 | The system MUST generate a dynamic **sitemap** including all published posts, category hubs, and city hubs, and MUST ping/revalidate on publish. |
| FR-SEO-05 | P1 | The system MUST generate a **dynamic OG image** per post (couple/venue/studio badge) via Next `ImageResponse`. |
| FR-SEO-06 | P0 | The system MUST compute a **rules-based SEO/readability score** (title/description length, focus-keyword presence, heading order, alt-text coverage, reading ease) shown to the author with actionable hints. |
| FR-SEO-07 | P1 | The system MUST support **city/location landing pages** generated from the studio location dataset, aggregating relevant real weddings + guide content with local schema. |
| FR-SEO-08 | P1 | Vendor Credits MUST render as clean follow-links to support reciprocal backlinks. |

### 6.7 Publishing Workflow (PUB)
| ID | Pri | Requirement |
| :-- | :-- | :-- |
| FR-PUB-01 | P0 | The post lifecycle MUST be `Draft → InReview → Scheduled → Published → Archived` (see §8.2), with permitted transitions enforced by role. |
| FR-PUB-02 | P0 | Authors MAY submit to `InReview`; only Editor/Super Admin MAY move to `Published`/`Scheduled`. |
| FR-PUB-03 | P0 | Slugs MUST be unique; changing a slug on a published post MUST create a 301 redirect from the old slug. |
| FR-PUB-04 | P0 | Publishing/updating/unpublishing MUST trigger **on-demand ISR revalidation** of the article, its category hub, relevant city hubs, and the blog index. |
| FR-PUB-05 | P1 | The system MUST support **scheduled publishing** at `scheduledFor` via a reliable job (cron/queue), flipping status and revalidating automatically. |
| FR-PUB-06 | P0 | Unpublished/draft posts MUST return 404 on public routes and MUST be previewable by authorized users via a signed preview link. |

### 6.8 Comments (COMM)
| ID | Pri | Requirement |
| :-- | :-- | :-- |
| FR-COMM-01 | P0 | Readers MUST be able to post comments with name + email (email private, used only for reply notifications); no account required. |
| FR-COMM-02 | P0 | Comments MUST support **one level of threaded replies** (top-level + replies); deeper nesting MUST be flattened to that reply's root. |
| FR-COMM-03 | P0 | New comments MUST default to `pending` (auto-approve MAY apply to previously-approved emails). |
| FR-COMM-04 | P0 | Approved comments MUST be **server-rendered** into the article HTML for SEO; additional pages MAY lazy-load. |
| FR-COMM-05 | P0 | Readers MUST be able to **like** and **report** comments; sort by **Top** or **Newest**. |
| FR-COMM-06 | P1 | Comment bodies MUST support a safe minimal formatting subset (links auto-linked, no raw HTML). |
| FR-COMM-07 | P1 | A reader MUST be able to edit their comment within a short window (e.g., 5 min) from the same session. |
| FR-COMM-08 | P0 | Comment input MUST be sanitized server-side against XSS. |

### 6.9 Moderation & Anti-Spam (MOD)
| ID | Pri | Requirement |
| :-- | :-- | :-- |
| FR-MOD-01 | P0 | Public comment submission MUST enforce a **honeypot** field and a minimum time-to-submit heuristic, and MUST be **rate-limited per IP**. |
| FR-MOD-02 | P0 | Submissions MUST be checked by a **spam classifier** (Akismet or heuristic) and auto-filed to `spam` when flagged; excessive links MUST auto-set `pending`. |
| FR-MOD-03 | P0 | Moderators MUST have a queue with tabs `Pending / Approved / Spam / Rejected`, single and **bulk** actions, and search. |
| FR-MOD-04 | P0 | Moderators/Studio MUST be able to **reply** (with a verified "The Wedding Boys" badge) and **pin** a comment. |
| FR-MOD-05 | P1 | Approving/removing a comment MUST update `commentCount` and revalidate the article page. |

### 6.10 Engagement & Retention (ENGAGE)
| ID | Pri | Requirement |
| :-- | :-- | :-- |
| FR-ENGAGE-01 | P0 | Each article MUST show **related stories** (same category / overlapping tags) and **next/previous** navigation. |
| FR-ENGAGE-02 | P0 | Each article MUST render a **sticky reading-progress bar** and a TOC (desktop rail, mobile collapsible). |
| FR-ENGAGE-03 | P0 | Each article MUST include a contextual **Enquiry CTA** whose clicks are tracked as conversions. |
| FR-ENGAGE-04 | P1 | Articles MUST offer **newsletter capture** (mid + end) integrating with the studio email list. |
| FR-ENGAGE-05 | P1 | Readers MAY like/save a story (lightweight). |

### 6.11 Notifications (NOTIF)
| ID | Pri | Requirement |
| :-- | :-- | :-- |
| FR-NOTIF-01 | P0 | The studio MUST be emailed on each new comment (with moderation link). |
| FR-NOTIF-02 | P0 | A commenter MUST be emailed when someone (especially the studio) replies to them — the core re-engagement loop. |
| FR-NOTIF-03 | P1 | Notification emails MUST include an unsubscribe/opt-out for reply notifications. |

### 6.12 Analytics — Editorial Dashboard (ANLYT)
| ID | Pri | Requirement |
| :-- | :-- | :-- |
| FR-ANLYT-01 | P0 | The dashboard MUST show KPI cards: Total, Published, Drafts, Total Views, Total Comments, Avg Read-Completion %. |
| FR-ANLYT-02 | P0 | The dashboard MUST show a **Post Growth** chart (posts published per month) and a **Comments Trend** chart (Approved/Pending/Spam over time). |
| FR-ANLYT-03 | P0 | The dashboard MUST show a **Top Stories** table (views, avg time, comments, CTA clicks) and category distribution. |
| FR-ANLYT-04 | P0 | The system MUST ingest **view** and **read-complete** events via `POST /api/blogs/:slug/view`, dedupe per session, and aggregate into `BlogDailyStat`. |
| FR-ANLYT-05 | P1 | The dashboard MUST show a recent-comments queue and top commenters. |

### 6.13 Analytics — Audience (AUD)
| ID | Pri | Requirement |
| :-- | :-- | :-- |
| FR-AUD-01 | P0 | Public pages MUST integrate a privacy-friendly audience analytics tool (Plausible or self-hosted Umami), cookieless, with automatic scroll-depth. |
| FR-AUD-02 | P0 | The system MUST fire custom events: `read_complete`, `comment_posted`, `embed_played`, `gallery_opened`, `cta_enquiry_click`, `newsletter_signup`. |
| FR-AUD-03 | P2 | Key audience metrics MAY be pulled back into the editorial dashboard via the analytics stats API. |

### 6.14 Search & Discovery (SEARCH)
| ID | Pri | Requirement |
| :-- | :-- | :-- |
| FR-SEARCH-01 | P0 | Public blog index MUST support pagination and filtering by category, tag, and free-text search. |
| FR-SEARCH-02 | P1 | Admin article list MUST support live search by title/category and status filters. |
| FR-SEARCH-03 | P2 | Search MAY be upgraded to Atlas Search/Meilisearch as volume grows (initial: Mongo text index). |

---

## 7. Non-Functional Requirements

### 7.1 Performance (PERF)
| ID | Pri | Requirement |
| :-- | :-- | :-- |
| NFR-PERF-01 | P0 | Public article pages MUST meet Core Web Vitals "good": **LCP ≤ 2.5s**, **INP ≤ 200ms**, **CLS ≤ 0.1** at p75 on 4G mobile. |
| NFR-PERF-02 | P0 | Lighthouse Performance & SEO ≥ **95** on public article template. |
| NFR-PERF-03 | P0 | Third-party embeds MUST NOT block rendering (facade pattern); no single blocking third-party script > 50KB before interaction. |
| NFR-PERF-04 | P0 | Public content MUST be served from ISR/CDN cache; cache-hit TTFB SHOULD be < 200ms. |
| NFR-PERF-05 | P1 | Admin composer MUST remain responsive with articles up to ~10k words / 100 media references. |

### 7.2 Scalability (SCAL)
| ID | Pri | Requirement |
| :-- | :-- | :-- |
| NFR-SCAL-01 | P1 | The system MUST handle ≥ 100k monthly readers and ≥ 10k comments without redesign; hot paths (article read, comment list) MUST be indexed and cacheable. |
| NFR-SCAL-02 | P1 | Analytics ingestion MUST aggregate to daily buckets to bound growth; raw per-hit rows MUST NOT be required for dashboards. |

### 7.3 Security (SEC)
| ID | Pri | Requirement |
| :-- | :-- | :-- |
| NFR-SEC-01 | P0 | All input (article HTML cache, comments, embeds) MUST be sanitized against XSS; output MUST be safely rendered. |
| NFR-SEC-02 | P0 | All public write endpoints (comment, like, report, view) MUST be rate-limited and protected by honeypot/heuristics. |
| NFR-SEC-03 | P0 | Admin APIs MUST enforce RBAC server-side; no privileged action MAY rely on client checks alone. |
| NFR-SEC-04 | P0 | Secrets MUST be server-only; presigned URLs MUST be time-limited; no credentials in client bundles. |
| NFR-SEC-05 | P0 | State-changing admin requests MUST be protected against CSRF (same-site cookie + token where applicable). |
| NFR-SEC-06 | P1 | Commenter emails and IPs MUST be stored privately (IP hashed) and never exposed via public API. |

### 7.4 Reliability & Availability (REL)
| ID | Pri | Requirement |
| :-- | :-- | :-- |
| NFR-REL-01 | P1 | Public read availability target **99.9%**; CDN/ISR MUST serve last-good content if the origin API is briefly unavailable. |
| NFR-REL-02 | P0 | Autosave/revisions MUST prevent content loss on crashes or network drops. |
| NFR-REL-03 | P1 | Scheduled publishing MUST be idempotent and retried on failure. |

### 7.5 Usability & Accessibility (UX)
| ID | Pri | Requirement |
| :-- | :-- | :-- |
| NFR-UX-01 | P0 | Public and admin UIs MUST meet **WCAG 2.2 AA** (semantic HTML, keyboard nav, focus states, ARIA on dialogs, sufficient contrast). |
| NFR-UX-02 | P0 | The reading experience MUST be **mobile-first** and excellent on phones (typography, tap targets, media). |
| NFR-UX-03 | P0 | The composer workflow MUST be learnable in one session (slash inserter, preview, one-dropdown templates). |

### 7.6 SEO/AEO (as NFR)
| ID | Pri | Requirement |
| :-- | :-- | :-- |
| NFR-SEO-01 | P0 | 100% of published posts MUST ship server-rendered HTML with unique metadata + valid JSON-LD (validated in CI where feasible). |
| NFR-SEO-02 | P1 | Structured data MUST pass Google Rich Results validation for Article/FAQ/HowTo/Video. |

### 7.7 Privacy & Compliance (PRIV)
| ID | Pri | Requirement |
| :-- | :-- | :-- |
| NFR-PRIV-01 | P0 | Audience analytics MUST be cookieless/consent-light where possible; any personal data MUST have a stated retention policy. |
| NFR-PRIV-02 | P1 | Readers MUST be able to request deletion of their comment/email. |

### 7.8 Maintainability & Portability (MNT)
| ID | Pri | Requirement |
| :-- | :-- | :-- |
| NFR-MNT-01 | P0 | New code MUST be TypeScript (strict) with the block-registry pattern so new blocks/embeds are additive. |
| NFR-MNT-02 | P1 | Content MUST remain portable: canonical JSON AST + documented schema; export MUST be possible. |
| NFR-MNT-03 | P1 | Modules MUST be covered by tests for critical paths (render, lifecycle, comment pipeline, sanitization). |

---

## 8. Workflows, Use Cases & State Machines

### 8.1 Primary use cases
- **UC-1 Compose & publish a real wedding story:** Author creates post → picks `cinematic-real-wedding` template → adds hero, At-a-Glance, gallery, film embed, vendor credits, testimonial, CTA → autosaves → submits `InReview` → Editor reviews preview (mobile+desktop) → publishes → ISR revalidates → sitemap updates → OG image generated.
- **UC-2 Reader engages:** Reader lands via search → reads with progress bar/TOC → completes (read_complete event) → posts a comment (pending) → studio emailed → studio approves + replies → commenter emailed → returns to page (retention loop) → clicks Enquiry CTA (conversion event).
- **UC-3 Moderate:** Moderator opens queue → filters `Pending`/`Spam` → bulk-approves legitimate, rejects spam → pins best comment → counts + page revalidate.
- **UC-4 Analyze:** Editor opens dashboard → sees Post Growth + Comments Trend + Top Stories → identifies best-performing category → plans next content.
- **UC-5 Scheduled publish:** Editor sets `scheduledFor` → job flips to `Published` at time → revalidation runs.

### 8.2 BlogPost lifecycle (state machine)
```
Draft ──submit──▶ InReview ──approve──▶ Published
  ▲                  │                     │
  │◀──return─────────┘                     ├──schedule──▶ Scheduled ──(time)──▶ Published
  │                                        │
  └──────────────unpublish/archive◀────────┴──archive──▶ Archived
Archived ──restore──▶ Draft
```
Transition guards enforced by role (Authors cannot reach Published/Scheduled).

### 8.3 Comment lifecycle (state machine)
```
Submitted ──spam-check──▶ (flagged) ──▶ Spam
     │
     └──(clean)──▶ Pending ──approve──▶ Approved ──hide/delete──▶ Removed
                     │
                     └──reject──▶ Rejected
Spam ──restore──▶ Pending
```

---

## 9. Analytics, Metrics & KPIs

**Content health:** publish cadence, drafts aging, category coverage.
**Reach:** pageviews, unique readers, traffic sources, top landing posts, city-page performance.
**Engagement (the "hook"):** avg time on page, **read-completion rate**, scroll depth, comments
per post, comment approval ratio, returning-reader rate, related-post CTR.
**Conversion (business):** enquiry-CTA click rate, newsletter signups, assisted enquiries.
**SEO/AEO:** indexed posts, rich-result eligibility, keyword rankings (external, GSC), backlink
count from vendor credits/features.

**Success targets (first 6 months, indicative):** article LCP p75 ≤ 2.5s; read-completion ≥ 35%
on real-wedding stories; comment approval workflow < 24h; ≥ 1 flagship story every 2–3 weeks.

---

## 10. Release Plan / Phasing

| Phase | Scope | Exit criteria |
| :-- | :-- | :-- |
| **P1 Editor & Layout core** | Block registry renderer, 4 templates, expanded palette, slash inserter, autosave + revisions, mobile/desktop preview | Author can produce all 4 layouts; nothing loses on refresh; renders from AST |
| **P2 Embedding** | Unified embed, oEmbed, facades, allowlist, wedding providers | All providers embed with facade; no CWV regression |
| **P3 Comments & engagement** | Comment model + threaded UI + likes/sort, anti-spam, moderation queue, notification loop, related/next/CTA/newsletter | Reader can comment; studio moderates + replies; emails fire; approved comments in HTML |
| **P4 Analytics** | View/read tracking + `BlogDailyStat`, dashboard charts, Plausible/Umami + events | Dashboard shows growth + comment-trend + top posts; scroll/read events flow |
| **P5 SEO/AEO/scale** | FAQ/HowTo schema, OG images, vendor backlinks, city pages, sitemap-on-publish, internal linking | Rich results valid; city pages live; sitemap auto-updates |
| **P6 Governance** | Roles/approval workflow, AI co-pilot (meta/SEO), client-showcase cross-linking | Approval gate enforced; co-pilot assists metadata |

---

## 11. Risks & Mitigations

| Risk | Impact | Mitigation |
| :-- | :-- | :-- |
| Embeds/third-party scripts harm CWV | Ranking + UX loss | Facade/click-to-load mandatory (FR-EMBED-02) |
| Comment spam floods moderation | Ops burden, trust | Honeypot + rate limit + Akismet + queue (FR-MOD-01/02) |
| XSS via comments/embeds/HTML cache | Security breach | Server-side sanitize everywhere (NFR-SEC-01) |
| Over-flexible layouts become ugly | Brand damage | Constrained blocks + templates; no raw CSS (FR-LAYOUT-03) |
| Content loss during editing | Author trust | Autosave + revisions (FR-EDIT-05/06) |
| Slug changes break links | SEO loss | 301 redirects on slug change (FR-PUB-03) |
| Analytics row explosion | Cost/perf | Daily aggregation (NFR-SCAL-02) |
| ISR staleness after publish | Wrong content live | On-demand revalidation on all mutations (FR-PUB-04) |

---

## 12. Acceptance Criteria & Definition of Done

A feature is **Done** when: requirements met with IDs referenced in the PR; TypeScript strict, no
type errors; unit/integration tests for critical paths pass; WCAG 2.2 AA checks pass on new UI;
public pages meet CWV/Lighthouse targets (NFR-PERF-01/02); security review for any new
input/output path (sanitization, RBAC, rate limit); JSON-LD validates where applicable; docs/authoring
notes updated. Launch gate = all **P0** requirements satisfied and verified.

---

## 13. Appendices

### 13.1 Glossary
See §1.3.

### 13.2 Requirements Traceability (representative)
| Requirement | Component | Test |
| :-- | :-- | :-- |
| FR-EDIT-01 | Editor Core, Renderer | Round-trip AST↔render snapshot test |
| FR-LAYOUT-02 | Template Engine | Visual regression per template (mobile+desktop) |
| FR-EMBED-02 | Embed Resolver | Facade renders; iframe loads only on click; CWV budget test |
| FR-PUB-03 | Publishing Service | Slug change creates 301; old URL redirects |
| FR-PUB-04 | Publishing Service | Mutation triggers revalidation of article/hubs/index |
| FR-COMM-04 | Comment Service | Approved comments present in server HTML |
| FR-MOD-01/02 | Moderation Service | Honeypot/rate-limit block bots; spam auto-filed |
| FR-ANLYT-02 | Analytics Service | Growth + comment-trend aggregates correct |
| NFR-SEC-01 | All input paths | XSS payloads neutralized in comments/embeds/HTML cache |
| NFR-PERF-01 | Public template | Lab + field CWV within thresholds |

### 13.3 API Summary (contract sketch)
**Public**
```
GET  /api/blogs                         ?page&limit&category&tag&search
GET  /api/blogs/slug/:slug              → 404 unless Published
GET  /api/blogs/related/:slug           → up to 3
GET  /api/blogs/:slug/comments          ?page  (approved, threaded)
POST /api/blogs/:slug/comments          {name,email,website?,body,parent?,honeypot}
POST /api/comments/:id/like
POST /api/comments/:id/report
POST /api/blogs/:slug/view              {readComplete?:bool}   (session-deduped)
```
**Admin (RBAC)**
```
GET  /api/admin/blogs                   (all statuses)
GET  /api/admin/blogs/:id
POST /api/admin/blogs                    (create; TOC + reading time + slug)
PUT  /api/admin/blogs/:id                (update; recompute if content changed)
PUT  /api/admin/blogs/:id/status         (lifecycle transition; role-guarded)
POST /api/admin/blogs/:id/revisions      | GET .../revisions | POST .../revisions/:rev/restore
GET  /api/admin/comments                 ?status
PUT  /api/admin/comments/:id/status
POST /api/admin/comments/:id/reply       (studio badge)
PUT  /api/admin/comments/:id/pin
GET  /api/admin/blogs/analytics          (growth, comment-trend, top posts)
POST /api/admin/media  (proxy)           (presigned R2 / Stream ingest)
```
**BFF / Next**
```
/api/og/[slug]        → dynamic OG image
/api/revalidate       → on-demand ISR (secured)
/sitemap.xml, /robots.txt
```

### 13.4 Non-goals
Full multi-tenant CMS, arbitrary page building with raw CSS, real-time collaborative editing
(single-author autosave is sufficient at this scale), and infinite comment nesting.

---

*End of SRS v1.0.*