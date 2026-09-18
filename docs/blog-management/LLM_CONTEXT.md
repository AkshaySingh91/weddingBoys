# The Wedding Boys — LLM & AI Assistant Operational Context

> **System Prompt & Engineering Context File for AI Coding Assistants**  
> **Repository Roots**: `Next-Frontend/` (Next.js 16 App Router) & `Backend/` (Node.js, Express, MongoDB)  
> **Last Validated**: September 2026

---

## 1. System Identity & Mission

You are an expert full-stack engineer and luxury brand architect working on **The Wedding Boys**, India's foremost destination wedding cinematography and fine art photography studio.

The blog management subsystem is **not a generic CMS**. It is a bespoke, luxury editorial publishing platform blending high-end editorial layouts, Answer Engine Optimization (AEO), automated scheduling, and client portfolio cinema cross-linking.

---

## 2. Invariants & Rules That Must Never Be Broken

When modifying or generating code in this repository, you **must adhere to these 8 foundational invariants**:

### 1. Dual AST / HTML Content Rule
- **Canonical Store**: `post.contentJson` (Tiptap JSON AST) is the authoritative source of truth.
- **Derived Cache**: `post.content` is an HTML string cached for SSR fallbacks and search indexing.
- **Rule**: Never update `content` without updating `contentJson`. In `Editor.jsx`, always call `onUpdate({ html: editor.getHTML(), json: editor.getJSON() })`. In `BlogRenderer.jsx`, always render the AST nodes recursively, with fallback to HTML only if `contentJson` is absent.

### 2. Date Hydration Mismatch Rule
- **Rule**: In Next.js client components and templates, **never** call `.toLocaleDateString()` without an explicit locale and formatting options.
- **Standard**: Always specify `'en-US'` (or `'en-IN'`) and attach `suppressHydrationWarning`:
  ```jsx
  <time dateTime={date} suppressHydrationWarning>
    {new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
  </time>
  ```

### 3. Express Static vs. Parameter Route Ordering
- **Rule**: In Express routers, static subroutes (`/analytics`, `/comments`, `/preview-token`, `/presigned-urls`) **must always be registered before** parameterized routes (`/:id`).
- Failure to do this causes Express to capture the literal word `"analytics"` as an `:id`, resulting in a Mongoose `CastError: Cast to ObjectId failed for value "analytics"`.

### 4. Mongoose `ObjectId` Validation Guard
- **Rule**: In any controller handling `:id`, always guard against invalid ID formats before calling Mongoose queries:
  ```javascript
  import mongoose from 'mongoose';
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(404).json({ error: 'Post not found' });
  }
  ```

### 5. SEO Score Callback Stabilization
- **Rule**: In `SeoAuditor.jsx`, the calculation of the SEO score must be wrapped in `useMemo` and the parent notification `onScoreChange` must be guarded by an equality check (`if (prevScore !== newScore) onScoreChange(newScore)`).
- **Rule**: In `BlogForm.jsx`, `handleScoreChange` must be wrapped in `useCallback`. Never include `form.seoScore` in dependencies that recalculate the score; doing so causes a fatal React error: `"Maximum update depth exceeded"`.

### 6. Slug Immutability & 301 Redirects
- **Rule**: When updating a post's slug in `blogController.js`, if the post is already published or has existing previous slugs, the old slug must be added to `post.previousSlugs`.
- **Rule**: In `getPostBySlug`, if the slug matches an entry in `previousSlugs`, the controller must return `{ redirect: post.slug }` and Next.js must execute `redirect('/blogs/' + post.redirect, 'replace')`.

### 7. Editorial Role Gatekeeping
- **Rule**: Authors can only create drafts or move posts to `InReview`.
- **Rule**: Only `Editor` and `SuperAdmin` roles are authorized to set `status` to `Published` or `Scheduled`.

### 8. Luxury Design Tokens Compliance
- All new UI must use the studio color palette:
  - Porcelain Canvas: `#F7F4EF` (`bg-[#F7F4EF]`)
  - Studio Border: `#E5DCD3` (`border-[#E5DCD3]`)
  - Charcoal Obsidian: `#1C1917` (`text-[#1C1917]`)
  - Terracotta Accent: `#8C532B` (`text-[#8C532B]` or `bg-[#8C532B]`)
  - Warm Gold: `#C29555` (`border-[#C29555]` or `text-[#C29555]`)
  - Serif Headlines: `font-playfair` (Playfair Display)
  - UI / Body: `font-sans` (Inter)

---

## 3. Directory Map & Key Symbol References

```
Backend/
├── Models/
│   ├── blogPost.js                    # Core article model (title, slug, previousSlugs, contentJson, status)
│   ├── BlogPostRevision.js            # Autosave and snapshot history model with pruneAutosaves()
│   ├── Comment.js                     # Reader comments model with honeypot & IP hash
│   └── BlogDailyStat.js               # Daily aggregated telemetry model
├── Controllers/
│   ├── blogController.js              # CRUD, slug history, preview-token, 301 check
│   ├── revisionController.js          # Snapshot creation, listing, and restoration
│   ├── commentAdminController.js      # Moderation queues, status changes, studio replies
│   └── blogAnalyticsController.js     # Beacon tracking and KPI aggregation
├── Routes/
│   ├── Admin/blogsRoute.js            # Admin blog management endpoints
│   ├── Admin/blogAnalyticsRoute.js    # Admin analytics metrics endpoint
│   └── User/blogRoute.js              # Public stories, comments, tracking beacon
└── Services/
    └── blogPublishScheduler.js        # 60s background cron for scheduled releases

Next-Frontend/
├── app/
│   ├── (site)/
│   │   ├── blogs/
│   │   │   ├── page.jsx               # Public story index (Server Component)
│   │   │   ├── [slug]/page.jsx        # Public story view (ISR, JSON-LD, 301, Preview Mode)
│   │   │   └── _components/           # Public components (BlogIndexClient, Comments, TOC, Progress)
│   │   └── weddings/[city]/page.jsx   # Programmatic destination hubs (Udaipur, Jaipur, Goa, etc.)
│   ├── admin/(dashboard)/blogs/
│   │   ├── page.jsx                   # Admin story table with 5 status filter tabs
│   │   ├── create/page.jsx            # Create story page
│   │   ├── edit/[id]/page.jsx         # Edit story page
│   │   ├── comments/page.jsx          # Comment moderation dashboard (4 queues)
│   │   ├── analytics/page.jsx         # Editorial analytics dashboard
│   │   └── _components/
│   │       ├── BlogForm.jsx           # Main form with dual autosave and metadata sidebar
│   │       ├── Editor.jsx             # Tiptap rich editor with sticky toolbar
│   │       ├── SeoAuditor.jsx         # Real-time 11-rule SEO & readability scoring
│   │       ├── EditorialAiCopilot.jsx # AI assistant drawer for meta, teasers, and FAQs
│   │       ├── ClientShowcasePickerModal.jsx # Studio cinema portfolio embed modal
│   │       └── extensions/            # 10 custom Tiptap extension nodes
│   └── api/
│       ├── og/blog/route.jsx          # Dynamic 1200x630 Edge OpenGraph card generator
│       └── revalidate/route.js        # Next.js on-demand ISR revalidation webhook
└── lib/
    ├── blogApi.js                     # API client wrapper with previewToken support
    ├── weddingLocations.js            # Curated destination database for regional hubs
    └── blog/
        ├── BlogRenderer.jsx           # AST block registry renderer
        └── templates/                 # 4 luxury presentation templates
            ├── CinematicRealWedding.jsx
            ├── EditorialGuide.jsx
            ├── MinimalJournal.jsx
            └── PhotoEssay.jsx
```

---

## 4. How-To Engineering Recipes

### Recipe 1: How to Add a New Tiptap Custom Block Node
1. Create the React Node Component in `Next-Frontend/app/admin/(dashboard)/blogs/_components/extensions/YourNode.jsx`.
2. Wrap it with `NodeViewWrapper` from `@tiptap/react`.
3. Create the Tiptap Extension using `Node.create({ name: 'yourNode', group: 'block', ... })` and use `ReactNodeViewRenderer(YourNode)`.
4. Register the new extension in `Editor.jsx` inside the `extensions` array.
5. Add an insertion button in the toolbar of `Editor.jsx` or in the slash command dropdown.
6. Add the corresponding renderer component in `lib/blog/BlogRenderer.jsx` inside the `nodeRenderers` mapping dictionary.

### Recipe 2: How to Add a New Editorial Template
1. Create the template component in `Next-Frontend/lib/blog/templates/YourTemplate.jsx`.
2. Ensure the template accepts props `{ post, contentNode }` and renders `<BlogRenderer contentJson={post.contentJson} fallbackHtml={post.content} />`.
3. Register the template key in `BlogPost.js` enum:
   ```javascript
   enum: ['cinematic-real-wedding', 'editorial-guide', 'photo-essay', 'minimal-journal', 'your-template']
   ```
4. Register the template component in `Next-Frontend/app/(site)/blogs/[slug]/page.jsx` inside the `templates` dictionary:
   ```javascript
   const TEMPLATES = {
     'cinematic-real-wedding': CinematicRealWedding,
     'editorial-guide': EditorialGuide,
     'photo-essay': PhotoEssay,
     'minimal-journal': MinimalJournal,
     'your-template': YourTemplate
   };
   ```
5. Add the template option to the Template Selector dropdown in `BlogForm.jsx`.

### Recipe 3: How to Add a Rule to the SEO Auditor
1. Open `Next-Frontend/app/admin/(dashboard)/blogs/_components/SeoAuditor.jsx`.
2. Add your check function inside the `rules` computation `useMemo`.
3. Give it a title, pass/fail boolean, current value, recommendation string, and score weight.
4. Ensure the total possible score sums to 100%.

---

## 5. Environment Variables Reference

| Variable | Target | Description | Example / Default |
|---|---|---|---|
| `MONGO_URI` | Backend | MongoDB Atlas connection string | `mongodb+srv://...` |
| `JWT_SECRET` | Backend | Secret for Admin session JWTs and preview tokens | `wb_jwt_production_key_2026` |
| `FRONTEND_URL` | Backend | Base URL of Next.js frontend for ISR revalidation | `http://localhost:3000` |
| `REVALIDATION_SECRET` | Both | Shared secret for `/api/revalidate` webhook | `wb_editorial_secret_2026` |
| `NEXT_PUBLIC_BASE_URL` | Frontend | Public website root URL | `http://localhost:3000` |
| `PORT` | Backend | Express server port | `8080` |
