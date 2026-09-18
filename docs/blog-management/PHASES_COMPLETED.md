# The Wedding Boys — Subsystem Rebuild: Completed Phases Breakdown

> **Authoritative Log of Implemented Features Across All 6 Engineering Phases**  
> **Status**: 100% Completed, Verified & In Production  
> **Target Systems**: `Next-Frontend/` (Next.js 16 App Router) & `Backend/` (Express, Mongoose, Node.js)

---

## Executive Summary: Before vs. After

| Feature Area | Legacy Blog Subsystem | Rebuilt Luxury Editorial Platform |
|---|---|---|
| **Content Storage** | Unstructured raw HTML string (`post.content`) | Canonical JSON Abstract Syntax Tree (`post.contentJson`) + Sanitized HTML cache |
| **Editor** | Standard generic WYSIWYG editor | **Tiptap v2** with 10 custom studio block extensions & slash commands |
| **Autosave & Backup** | None; data lost on page refresh | **Dual Autosave**: 1s local `sessionStorage` + 5s debounced database revisions |
| **Revision History** | No history or undo capability | Snapshot revision timeline (`BlogPostRevision`) with 1-click rollback |
| **Public Presentation** | Single generic one-column layout | **4 Bespoke Templates** (*Cinematic Real Wedding*, *Editorial Guide*, *Photo Essay*, *Minimal Journal*) |
| **Reader Experience** | Static text with no interaction | Sticky reading progress, viewport-aware TOC, social share, adjacent recommendations |
| **Comment Engine** | Unmoderated or missing | Protected reader comments (honeypot + IP hash) + 4-queue admin moderation dashboard |
| **Analytics** | None | Real-time scroll/exit beacon telemetry, daily stats (`BlogDailyStat`), admin leaderboard |
| **OpenGraph Social** | Static fallback image | Dynamic 1200×630 Edge OpenGraph card generator via `@vercel/og` with studio branding |
| **SEO & AEO** | Basic meta tags | Full Google Schema suite (`BlogPosting`, `BreadcrumbList`, `FAQPage`, `HowTo`, `VideoObject`) + Live 11-rule auditor |
| **Destination Hubs** | Non-existent | Programmatic SEO landing pages for 7 luxury wedding destinations (`/weddings/[city]`) |
| **Governance** | Any admin could publish directly | Role-based gatekeeping (`isEditorOrSuperAdmin`), slug history with 301 redirects |
| **Publishing Queue** | Immediate publish only | 60s background cron service for scheduled releases with instant ISR revalidation |
| **Review & Sharing** | Unpublished drafts inaccessible externally | 24-hour HMAC-SHA256 signed preview tokens (`?previewToken=...`) with editor return banner |
| **Editorial Assistance** | Manual copywriting | In-editor AI Editorial Co-Pilot for SERP meta, teasers, and FAQs |
| **Portfolio Cinema** | Manual copy-pasting of URLs | Searchable client portfolio modal and `/client` slash command integration |

---

## Detailed Phase Breakdown

### Phase 1: Content Architecture & Editor Rebuild

#### Objective
Transform the content foundation from fragile raw HTML into a robust, structured JSON Abstract Syntax Tree (AST) while introducing studio-grade rich media blocks, reliable autosaving, and snapshot history.

#### Implemented Features
1. **JSON AST Canonicalization**:
   - Stored in `BlogPost.contentJson`.
   - Content parsed and validated by Tiptap v2 instead of directly trusting user-input HTML.
   - HTML string (`BlogPost.content`) is automatically generated and sanitized as a read-model cache for SSR fallbacks.
2. **10 Custom Studio Block Extensions**:
   - `InlineMedia.jsx`: Full, center, left, and right aligned image figures with blur placeholders, captions, and LCP priority tags.
   - `PhotoGallery.jsx`: Masonry photo grids (2-column and 3-column) supporting high-res wedding photography.
   - `WeddingVideoEmbed.jsx`: 16:9 responsive cinema video player supporting Cloudflare Stream (`streamUid`), Vimeo, YouTube, and direct MP4s.
   - `Embed.jsx`: Multi-provider interactive cards for Spotify ceremony playlists, Google Maps venue pins, Instagram reels, and Pinterest moodboards.
   - `Callout.jsx`: Editorial accent boxes with 3 aesthetic modes (`note`, `vendor`, `testimonial`).
   - `PullQuote.jsx`: Luxury serif drop-quote with Playfair Display typography and terracotta quotation marks.
   - `AtAGlance.jsx`: Structured wedding metadata strip (Venue, Season, Budget, Style, Mood).
   - `VendorCredits.jsx`: Curated vendor partner credits with clean outbound links.
   - `FAQ.jsx`: Interactive accordion questions with automatic `FAQPage` schema markup.
   - `EnquiryCTA.jsx`: High-converting lead-capture call-to-action block.
3. **Dual Autosave Engine**:
   - *Tier 1 (Browser)*: 1-second debounced local backup in `sessionStorage` (`wb_blog_draft_[id]`). If browser crashes or disconnects, an alert prompts the user to restore unsaved changes.
   - *Tier 2 (Database)*: 5-second idle debounce in edit mode saving background `autosave` snapshots to `BlogPostRevision`.
4. **Snapshot Revision History**:
   - Model `BlogPostRevision` storing complete AST snapshots, author attribution, timestamp, and edit reason (`autosave`, `manual-save`, `publish-snapshot`, `restore-backup`).
   - Admin modal displaying timeline of revisions with diff viewer and 1-click restoration.
   - Automated pruning (`BlogPostRevision.pruneAutosaves`) keeping revision count bounded to 50 per post.

#### Files Created / Modified
- [`Backend/Models/blogPost.js`](file:///Users/akshaysingh/Documents/WebDev/web/weddingBoys/Backend/Models/blogPost.js)
- [`Backend/Models/BlogPostRevision.js`](file:///Users/akshaysingh/Documents/WebDev/web/weddingBoys/Backend/Models/BlogPostRevision.js)
- [`Backend/Controllers/revisionController.js`](file:///Users/akshaysingh/Documents/WebDev/web/weddingBoys/Backend/Controllers/revisionController.js)
- [`Next-Frontend/app/admin/(dashboard)/blogs/_components/Editor.jsx`](file:///Users/akshaysingh/Documents/WebDev/web/weddingBoys/Next-Frontend/app/admin/(dashboard)/blogs/_components/Editor.jsx)
- [`Next-Frontend/app/admin/(dashboard)/blogs/_components/BlogForm.jsx`](file:///Users/akshaysingh/Documents/WebDev/web/weddingBoys/Next-Frontend/app/admin/(dashboard)/blogs/_components/BlogForm.jsx)
- All 10 Tiptap extensions in [`Next-Frontend/app/admin/(dashboard)/blogs/_components/extensions/`](file:///Users/akshaysingh/Documents/WebDev/web/weddingBoys/Next-Frontend/app/admin/(dashboard)/blogs/_components/extensions/)

---

### Phase 2: Luxury Editorial Presentation & Templating System

#### Objective
Elevate public article reading into an editorial luxury publication experience tailored to different wedding narratives.

#### Implemented Features
1. **4 Bespoke Templates**:
   - *Cinematic Real Wedding* ([`CinematicRealWedding.jsx`](file:///Users/akshaysingh/Documents/WebDev/web/weddingBoys/Next-Frontend/lib/blog/templates/CinematicRealWedding.jsx)): Full-bleed cinematic hero, couple metadata overlay, At-A-Glance strip, couple quote, vendor credits footer.
   - *Editorial Guide* ([`EditorialGuide.jsx`](file:///Users/akshaysingh/Documents/WebDev/web/weddingBoys/Next-Frontend/lib/blog/templates/EditorialGuide.jsx)): Center-column reading measure, sticky table of contents rail, structured advice, FAQ accordions.
   - *Photo Essay* ([`PhotoEssay.jsx`](file:///Users/akshaysingh/Documents/WebDev/web/weddingBoys/Next-Frontend/lib/blog/templates/PhotoEssay.jsx)): Edge-to-edge visual masonry, minimal prose, large format gallery emphasis.
   - *Minimal Journal* ([`MinimalJournal.jsx`](file:///Users/akshaysingh/Documents/WebDev/web/weddingBoys/Next-Frontend/lib/blog/templates/MinimalJournal.jsx)): Refined editorial typography, generous whitespace, focus on intimate storytelling.
2. **Block Registry Renderer** ([`BlogRenderer.jsx`](file:///Users/akshaysingh/Documents/WebDev/web/weddingBoys/Next-Frontend/lib/blog/BlogRenderer.jsx)):
   - Replaces unsafe `dangerouslySetInnerHTML` with an AST-driven block renderer recursively mapping node types to React components.
   - Supports video facades, galleries, embeds, callouts, and formatted text.
3. **Interactive Reader Features**:
   - Sticky top reading progress bar ([`ReadingProgressBar.jsx`](file:///Users/akshaysingh/Documents/WebDev/web/weddingBoys/Next-Frontend/app/(site)/blogs/_components/ReadingProgressBar.jsx)) with scroll percentage.
   - Dynamic Table of Contents ([`TableOfContents.jsx`](file:///Users/akshaysingh/Documents/WebDev/web/weddingBoys/Next-Frontend/app/(site)/blogs/_components/TableOfContents.jsx)) tracking active section in viewport via `IntersectionObserver`.
   - Social share links ([`ShareLinks.jsx`](file:///Users/akshaysingh/Documents/WebDev/web/weddingBoys/Next-Frontend/app/(site)/blogs/_components/ShareLinks.jsx)) for WhatsApp, Pinterest, X/Twitter, and clipboard copy.
   - Adjacent story recommendation cards ([`NextPrevStories.jsx`](file:///Users/akshaysingh/Documents/WebDev/web/weddingBoys/Next-Frontend/app/(site)/blogs/_components/NextPrevStories.jsx)).
   - Studio newsletter subscription capture box ([`NewsletterCapture.jsx`](file:///Users/akshaysingh/Documents/WebDev/web/weddingBoys/Next-Frontend/app/(site)/blogs/_components/NewsletterCapture.jsx)).

#### Files Created / Modified
- [`Next-Frontend/lib/blog/BlogRenderer.jsx`](file:///Users/akshaysingh/Documents/WebDev/web/weddingBoys/Next-Frontend/lib/blog/BlogRenderer.jsx)
- [`Next-Frontend/lib/blog/templates/CinematicRealWedding.jsx`](file:///Users/akshaysingh/Documents/WebDev/web/weddingBoys/Next-Frontend/lib/blog/templates/CinematicRealWedding.jsx)
- [`Next-Frontend/lib/blog/templates/EditorialGuide.jsx`](file:///Users/akshaysingh/Documents/WebDev/web/weddingBoys/Next-Frontend/lib/blog/templates/EditorialGuide.jsx)
- [`Next-Frontend/lib/blog/templates/PhotoEssay.jsx`](file:///Users/akshaysingh/Documents/WebDev/web/weddingBoys/Next-Frontend/lib/blog/templates/PhotoEssay.jsx)
- [`Next-Frontend/lib/blog/templates/MinimalJournal.jsx`](file:///Users/akshaysingh/Documents/WebDev/web/weddingBoys/Next-Frontend/lib/blog/templates/MinimalJournal.jsx)
- Reader components in [`Next-Frontend/app/(site)/blogs/_components/`](file:///Users/akshaysingh/Documents/WebDev/web/weddingBoys/Next-Frontend/app/(site)/blogs/_components/)

---

### Phase 3: Interactive Engagement & Community Moderation Engine

#### Objective
Allow wedding guests, prospective couples, and industry peers to engage with articles while ensuring high standards of brand safety and spam prevention.

#### Implemented Features
1. **Public Comment Submission**:
   - `POST /api/blogs/:slug/comments`.
   - Rate limited to maximum 5 comments per hour per client IP hash.
   - Invisible honeypot field (`website_url_hp`) silently rejecting automated spam bots.
   - Strict HTML sanitization stripping malicious script tags and XSS payloads.
   - Client IP hashed with SHA-256 for GDPR/privacy compliance.
2. **Admin Moderation Dashboard** ([`/admin/blogs/comments`](file:///Users/akshaysingh/Documents/WebDev/web/weddingBoys/Next-Frontend/app/admin/(dashboard)/blogs/comments/page.jsx)):
   - 4 segmented moderation queues: *Pending Approval*, *Approved*, *Spam*, and *Rejected*.
   - Single and bulk actions: Batch Approve, Batch Reject, Batch Spam, and Permanent Delete.
   - Pinned comments: Highlight meaningful testimonials or feedback to display at the top of the comment section.
   - Verified Studio Reply: Studio team can reply directly to reader comments with an official studio badge.
3. **Public Discussion Component** ([`CommentsSection.jsx`](file:///Users/akshaysingh/Documents/WebDev/web/weddingBoys/Next-Frontend/app/(site)/blogs/_components/CommentsSection.jsx)):
   - Responsive, accessible thread display under articles.
   - Real-time client-side form validation and optimistic submission feedback.

#### Files Created / Modified
- [`Backend/Models/Comment.js`](file:///Users/akshaysingh/Documents/WebDev/web/weddingBoys/Backend/Models/Comment.js)
- [`Backend/Controllers/commentAdminController.js`](file:///Users/akshaysingh/Documents/WebDev/web/weddingBoys/Backend/Controllers/commentAdminController.js)
- [`Backend/Routes/Admin/blogsRoute.js`](file:///Users/akshaysingh/Documents/WebDev/web/weddingBoys/Backend/Routes/Admin/blogsRoute.js)
- [`Next-Frontend/app/admin/(dashboard)/blogs/comments/page.jsx`](file:///Users/akshaysingh/Documents/WebDev/web/weddingBoys/Next-Frontend/app/admin/(dashboard)/blogs/comments/page.jsx)
- [`Next-Frontend/app/(site)/blogs/_components/CommentsSection.jsx`](file:///Users/akshaysingh/Documents/WebDev/web/weddingBoys/Next-Frontend/app/(site)/blogs/_components/CommentsSection.jsx)

---

### Phase 4: Editorial Intelligence & Real-Time Performance Analytics

#### Objective
Provide editors and studio owners with actionable insights into which wedding stories, venues, and templates drive the highest engagement and conversions.

#### Implemented Features
1. **Client Telemetry Beacon**:
   - Lightweight browser beacon tracking user scroll depth and active viewport time.
   - Dispatches heartbeat data on page exit (`navigator.sendBeacon` or `fetch` with `keepalive`) to `POST /api/blogs/:slug/track`.
2. **Aggregated Daily Telemetry** (`BlogDailyStat`):
   - Daily records indexed by `{ blogPost: 1, date: -1 }`.
   - Tracks unique visitors, total reads, completed reads ($\ge 90\%$ scroll depth), average read duration, shares, and comments.
3. **Admin Analytics Dashboard** ([`/admin/blogs/analytics`](file:///Users/akshaysingh/Documents/WebDev/web/weddingBoys/Next-Frontend/app/admin/(dashboard)/blogs/analytics/page.jsx)):
   - Top-line KPI summary cards: Total Impressions, Average Active Read Time, Read Completion Rate, and Total Shares.
   - Story Leaderboard ranking articles by readership, time-on-page, and engagement score.
   - Template and category performance distribution breakdown.

#### Files Created / Modified
- [`Backend/Models/BlogDailyStat.js`](file:///Users/akshaysingh/Documents/WebDev/web/weddingBoys/Backend/Models/BlogDailyStat.js)
- [`Backend/Controllers/blogAnalyticsController.js`](file:///Users/akshaysingh/Documents/WebDev/web/weddingBoys/Backend/Controllers/blogAnalyticsController.js)
- [`Backend/Routes/Admin/blogAnalyticsRoute.js`](file:///Users/akshaysingh/Documents/WebDev/web/weddingBoys/Backend/Routes/Admin/blogAnalyticsRoute.js)
- [`Next-Frontend/app/admin/(dashboard)/blogs/analytics/page.jsx`](file:///Users/akshaysingh/Documents/WebDev/web/weddingBoys/Next-Frontend/app/admin/(dashboard)/blogs/analytics/page.jsx)

---

### Phase 5: SEO, AEO & Scale Engine

#### Objective
Maximize organic search discovery and prepare for Answer Engine Optimization (AI search models like Perplexity, ChatGPT Search, and Google AI Overviews) through structured entity markup and programmatic regional hubs.

#### Implemented Features
1. **Edge Dynamic OpenGraph Generator** ([`/api/og/blog`](file:///Users/akshaysingh/Documents/WebDev/web/weddingBoys/Next-Frontend/app/api/og/blog/route.jsx)):
   - Runs on the Next.js Edge runtime via `@vercel/og` (`ImageResponse`).
   - Synthesizes 1200×630 luxury social cards in real time with dark charcoal background (`#12100E`), radial gold glow, terracotta studio badge, responsive title, and venue/reading time tags.
2. **Full Google Rich Results Schema Suite**:
   - `BlogPosting`: Full metadata, publisher, author, datePublished, dateModified, and comment indexation.
   - `BreadcrumbList`: Complete hierarchical breadcrumbs (`Home` > `Blog` > `Category` > `Story`).
   - `FAQPage`: Automatically injected when structured FAQ items are present.
   - `HowTo`: Emitted when structured planning guide steps are defined.
   - `VideoObject`: Automatically scans AST for embedded films (YouTube, Vimeo, Cloudflare Stream) and emits compliant schema metadata.
3. **Live 11-Rule In-Editor SEO & Readability Auditor** ([`SeoAuditor.jsx`](file:///Users/akshaysingh/Documents/WebDev/web/weddingBoys/Next-Frontend/app/admin/(dashboard)/blogs/_components/SeoAuditor.jsx)):
   - Computes live score (0–100%) against 11 algorithmic criteria (keyword density, title length, snippet length, paragraph breaks, heading hierarchy, image alt coverage, etc.).
4. **Programmatic Destination Hubs** ([`/weddings/[city]`](file:///Users/akshaysingh/Documents/WebDev/web/weddingBoys/Next-Frontend/app/(site)/weddings/[city]/page.jsx)):
   - Pre-rendered static pages for 7 luxury wedding destinations: Udaipur, Jaipur, Goa, Jodhpur, Varanasi, Mumbai, and Kerala.
   - Features destination filming guides, venue recommendations, photography tips, and matching real wedding stories.
5. **Dynamic XML Sitemap & ISR Webhooks**:
   - [`app/sitemap.js`](file:///Users/akshaysingh/Documents/WebDev/web/weddingBoys/Next-Frontend/app/sitemap.js): Generates XML sitemap including all published articles and destination hubs.
   - [`app/api/revalidate/route.js`](file:///Users/akshaysingh/Documents/WebDev/web/weddingBoys/Next-Frontend/app/api/revalidate/route.js): Secret-protected webhook for instant Next.js App Router cache invalidation.

#### Files Created / Modified
- [`Next-Frontend/app/api/og/blog/route.jsx`](file:///Users/akshaysingh/Documents/WebDev/web/weddingBoys/Next-Frontend/app/api/og/blog/route.jsx)
- [`Next-Frontend/app/sitemap.js`](file:///Users/akshaysingh/Documents/WebDev/web/weddingBoys/Next-Frontend/app/sitemap.js)
- [`Next-Frontend/app/api/revalidate/route.js`](file:///Users/akshaysingh/Documents/WebDev/web/weddingBoys/Next-Frontend/app/api/revalidate/route.js)
- [`Next-Frontend/app/(site)/weddings/[city]/page.jsx`](file:///Users/akshaysingh/Documents/WebDev/web/weddingBoys/Next-Frontend/app/(site)/weddings/[city]/page.jsx)
- [`Next-Frontend/lib/weddingLocations.js`](file:///Users/akshaysingh/Documents/WebDev/web/weddingBoys/Next-Frontend/lib/weddingLocations.js)
- [`Next-Frontend/app/admin/(dashboard)/blogs/_components/SeoAuditor.jsx`](file:///Users/akshaysingh/Documents/WebDev/web/weddingBoys/Next-Frontend/app/admin/(dashboard)/blogs/_components/SeoAuditor.jsx)

---

### Phase 6: Editorial Governance & Publishing Workflow

#### Objective
Establish enterprise editorial controls, safe publishing pipelines, URL preservation, collaborative previewing, and AI-assisted workflows.

#### Implemented Features
1. **Role-Based Access Control**:
   - Middleware and controller guards enforcing that only `SuperAdmin` and `Editor` roles can publish or schedule stories.
   - `Author` role can only draft and submit stories for review (`InReview`).
2. **Slug Immutability & 301 Permanent Redirects**:
   - Changing the slug of an existing story automatically pushes the old slug into `previousSlugs`.
   - `getPostBySlug` checks `slug` first, then falls back to `previousSlugs`.
   - Next.js App Router intercepts `{ redirect: newSlug }` and performs an HTTP 301 redirect (`redirect('/blogs/' + post.redirect, 'replace')`), preserving Google search ranking and backlinks.
3. **Background Scheduled Publishing Service** ([`blogPublishScheduler.js`](file:///Users/akshaysingh/Documents/WebDev/web/weddingBoys/Backend/Services/blogPublishScheduler.js)):
   - Self-healing 60-second background cron polling for `Scheduled` posts where `scheduledFor <= now`.
   - Flips status to `Published`, sets `publishedAt`, creates an automated revision snapshot, and triggers Next.js ISR revalidation.
4. **Cryptographically Signed 24-Hour Preview Links**:
   - Endpoint `GET /api/admin/blogs/:id/preview-token` issues HMAC-SHA256 JWT tokens.
   - Allows external clients and proofreaders to view unpublished drafts at `/blogs/[slug]?previewToken=...`.
   - Shows sticky top preview banner with story status and quick link back to the editor.
5. **In-Editor AI Editorial Co-Pilot** ([`EditorialAiCopilot.jsx`](file:///Users/akshaysingh/Documents/WebDev/web/weddingBoys/Next-Frontend/app/admin/(dashboard)/blogs/_components/EditorialAiCopilot.jsx)):
   - Slide-out assistant drawer providing:
     - SERP Title & Meta Description optimization.
     - Mood-based wedding story teaser generator.
     - SEO Focus Keyword expansion.
     - Venue & Destination FAQ drafting with 1-click injection into the form.
6. **Studio Portfolio Cinema Cross-Linking**:
   - Client film picker modal ([`ClientShowcasePickerModal.jsx`](file:///Users/akshaysingh/Documents/WebDev/web/weddingBoys/Next-Frontend/app/admin/(dashboard)/blogs/_components/ClientShowcasePickerModal.jsx)) fetching studio films from `/api/admin/embed/clients`.
   - Direct insertion into Tiptap AST via toolbar button or slash command `/client`.
7. **5-Stage Dashboard Filter Tabs**:
   - Stories dashboard (`/admin/blogs`) features segmented status tabs: *All*, *Published*, *Draft*, *In Review*, and *Scheduled*.

#### Files Created / Modified
- [`Backend/Services/blogPublishScheduler.js`](file:///Users/akshaysingh/Documents/WebDev/web/weddingBoys/Backend/Services/blogPublishScheduler.js)
- [`Backend/Controllers/blogController.js`](file:///Users/akshaysingh/Documents/WebDev/web/weddingBoys/Backend/Controllers/blogController.js)
- [`Backend/Routes/Admin/blogsRoute.js`](file:///Users/akshaysingh/Documents/WebDev/web/weddingBoys/Backend/Routes/Admin/blogsRoute.js)
- [`Next-Frontend/app/admin/(dashboard)/blogs/page.jsx`](file:///Users/akshaysingh/Documents/WebDev/web/weddingBoys/Next-Frontend/app/admin/(dashboard)/blogs/page.jsx)
- [`Next-Frontend/app/admin/(dashboard)/blogs/_components/EditorialAiCopilot.jsx`](file:///Users/akshaysingh/Documents/WebDev/web/weddingBoys/Next-Frontend/app/admin/(dashboard)/blogs/_components/EditorialAiCopilot.jsx)
- [`Next-Frontend/app/admin/(dashboard)/blogs/_components/ClientShowcasePickerModal.jsx`](file:///Users/akshaysingh/Documents/WebDev/web/weddingBoys/Next-Frontend/app/admin/(dashboard)/blogs/_components/ClientShowcasePickerModal.jsx)
- [`Next-Frontend/app/(site)/blogs/[slug]/page.jsx`](file:///Users/akshaysingh/Documents/WebDev/web/weddingBoys/Next-Frontend/app/(site)/blogs/[slug]/page.jsx)
