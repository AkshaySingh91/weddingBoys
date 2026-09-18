# 10 — Migration History: React/Vite → Next.js

This document is the record of how the site moved from a React + Vite SPA to
Next.js, what maps to what, and which differences are deliberate. Read it before
concluding that something is "missing" — several absences are intentional.

## What happened

The old app was `Frontend/` — React 18 + Vite, `react-router-dom` doing all
routing client-side, `import.meta.env.VITE_API_URL` for the API base.

It has been **deleted**. The Next.js app in `Next-Frontend/` reached and then
exceeded parity, and keeping a dead 600 MB tree beside it invited confusion
about which was live.

The deletion is fully recoverable: all 601 tracked files remain in git history.
To inspect an old file:

```bash
git show HEAD:Frontend/src/Pages/User/Home/Index.jsx
```

The only untracked files removed were `Frontend/.env` and
`Frontend/.env.production`, which together contained one non-secret variable —
recorded in [12 — Environment & deployment](./12-environment-and-deployment.md).

## Route mapping

### Public routes — complete parity

| React (`react-router-dom`) | Next.js (App Router) |
|---|---|
| `/` | `app/(site)/page.jsx` |
| `/varanasi` | `app/(site)/varanasi/page.jsx` |
| `/films/*` → `FilmsRoute` | `app/(site)/films/page.jsx` |
| `/films/:videoId` | `app/(site)/films/[videoId]/page.jsx` |
| `/allfilms` | `app/(site)/allfilms/page.jsx` |
| `/photos/*` → `PhotoRoute` | `app/(site)/photos/page.jsx` |
| `/photos/:photoId` | `app/(site)/photos/[photoId]/page.jsx` |
| `/search-result` | `app/(site)/search-result/page.jsx` |
| `/contact` | `app/(site)/contact/page.jsx` |
| `/team` | `app/(site)/team/page.jsx` |
| `/about-us` | `app/(site)/about-us/page.jsx` |
| `/dharaa-event-management` | `app/(site)/dharaa-event-management/page.jsx` |
| `*` → `NotFound` | `app/(site)/not-found.jsx` |

The nested router components (`FilmsRoute.jsx`, `PhotoRoute.jsx`) have no
equivalent and need none — file-based routing replaces them.

**Added in Next.js, with no React predecessor:** `/blogs`, `/blogs/[slug]`, and
the CMS catch-all `/[slug]`.

### Admin routes — complete parity

| React | Next.js |
|---|---|
| `/admin/login` | `app/admin/(auth)/login/page.jsx` |
| `/admin/forgot-password` | `app/admin/(auth)/forgot-password/page.jsx` |
| `/admin/signup` | **Deliberately removed** — see below |
| `/admin/dashboard` | `(dashboard)/dashboard/page.jsx` |
| `/admin/blogs` | `(dashboard)/blogs/page.jsx` |
| `/admin/studio-setting` | `(dashboard)/studio-setting/page.jsx` |
| `/admin/user` | `(dashboard)/user/page.jsx` *(empty stub in both)* |
| `/admin/profile` | `(dashboard)/profile/page.jsx` |
| `/admin/total-Enquires` | `(dashboard)/total-Enquires/page.jsx` |
| `/admin/website-setting/home` | `…/website-setting/home/page.jsx` |
| `/admin/website-setting/films` | `…/website-setting/films/page.jsx` |
| `/admin/website-setting/teams` | `…/website-setting/teams/page.jsx` |
| `/admin/website-setting/add-tags` | `…/website-setting/add-tags/page.jsx` |
| `/admin/website-setting/bts-schema-manager` | `…/website-setting/bts-schema-manager/page.jsx` |
| `/admin/website-setting/add-client` | `…/website-setting/add-client/page.jsx` |
| `/admin/website-setting/clients` | `…/website-setting/clients/page.jsx` |
| `/admin/website-setting/clients/:id` | `…/website-setting/clients/[id]/page.jsx` |

**Added in Next.js:** `/admin/content`, `/admin/content/[pageKey]`,
`/admin/media`, `/admin/users`, `/admin/security`, `/admin/blogs/create`,
`/admin/blogs/edit/[id]`, `/admin/reset-password/[token]`,
`/admin/accept-invite/[token]`.

## Gaps found and closed on 5 September 2026

An audit against the React tree found that four admin routes were **linked in
`AdminSidebar` but had empty directories** — staff clicking those menu items got
a 404. They were ported from their React originals and are now live:

| Route | Ported from | What it does |
|---|---|---|
| `/admin/website-setting/films` | `Pages/Admin/Pages/Films/Index.jsx` | Curates which tags appear as rows on the public `/films` page |
| `/admin/website-setting/teams` | `Pages/Admin/Pages/Teams/{Team,BannerImage,TeamImage}.jsx` | Team banner images + member cards |
| `/admin/website-setting/add-tags` | `Pages/Admin/Pages/NewTags.jsx` | The tag taxonomy manager |
| `/admin/website-setting/bts-schema-manager` | `Pages/Admin/Pages/BtsSchemaManager.jsx` | BTS crew-role schema |

A fifth gap was in the blog editor: the backend accepts and the public post page
renders **wedding storytelling metadata** (`mood`, `season`, `budget`, `venue`,
`style`, `testimonial` — the old `WeddingTab.jsx`), but the Next editor had no
inputs for them, so they could never be populated. A "Wedding details" panel was
added to `BlogForm.jsx` covering all six fields.

### Corrections made while porting

These are behaviour changes, made knowingly:

- **State mutation → immutable updates.** The React tag manager mutated state
  arrays in place (`updatedTags[index].tagType = …`), which React 19 does not
  tolerate reliably. Rewritten as immutable updates.
- **`TeamImage` cancel-edit was broken.** The original looked up
  `teamImages.find(img => img.id === id)` — the field is `_id`, so the lookup
  never matched and cancelling never restored the original values. Fixed.
- **Silent validation failure.** `saveImageEdit` previously did nothing at all
  if name or designation was blank. It now reports the error and closes edit
  mode on success.
- **`collapsed` initial state.** Was initialised to `false` and then spread as
  an object; now initialised to `{}`.
- **Inert "view all" button** on the films curator is now a real link to
  `/allfilms`. (`/allfilms` has its own filter UI and does not accept a tag
  query parameter, so it links there plainly rather than pretending to filter.)

## Deliberate differences — do not "restore" these

### Self-service signup is gone
The React app had a 532-line `Signup.jsx` gated behind a shared studio invite
code. It was **intentionally not migrated**. Onboarding is now per-email,
single-use, expiring `InviteToken`s issued by a SuperAdmin. `proxy.js` documents
this in `PUBLIC_ADMIN_PATHS`. See [06 — Auth & security](./06-auth-and-security.md).

### Dead React code that was correctly not carried over
- `Component/Sidebar.jsx` — never imported anywhere.
- `Pages/User/Home/BtsTape.jsx` — already commented out of the home page;
  its function is now the CMS `home-bts` block.
- `Pages/User/Dharaa/Packages.jsx` — never imported by the Dharaa page.
- `public/filmgrain.png` — unreferenced in both apps (still present in
  `Next-Frontend/public/`).

### Reorganisations, not losses
- The seven-tab blog editor (`AdvanceTab`, `BlogPreview`, `ContentTab`,
  `MediaTab`, `SeoTab`, `WeddingTab`, `Index`) became a single `BlogForm.jsx`
  with a TipTap `Editor.jsx` and custom node extensions.
- `fireMessage` moved from being an export of `Signup.jsx` (which several
  unrelated pages imported it from) to `Utils/fireMessage.js`.
- `allPhotoMasonry.css` and `Masonry.css`, near-identical, were consolidated
  into a shared utility in `app/globals.css`.
- Social logo SVGs moved from `src/Asset/` to `public/icons/`.
- `Pages/Admin/Pages/HomePage/DharaService.jsx` — an admin-tree file the public
  home page imported across the boundary — now lives at
  `Component/DharaService.jsx`.

### Technical translations
| React/Vite | Next.js |
|---|---|
| `import.meta.env.VITE_API_URL` | `process.env.NEXT_PUBLIC_API_URL` |
| `<img src={imported} />` | `next/image` (public site) |
| `<a href>` / `<Link to>` | `next/link` `href` |
| `useNavigate` | `useRouter` from `next/navigation` |
| `useLocation` | `usePathname` / `useSearchParams` |
| Font `<link>` tags | `next/font` with CSS variables (`app/fonts.js`) |
| Relative `/api/...` via dev proxy | Explicit API host on every call |

Tailwind config was carried over essentially unchanged (same breakpoints,
colours and type scale); only the font families were rewritten to reference
`next/font` CSS variables, and `@tailwindcss/typography` was added for blog
prose.

## Verification performed

At the time of the 5 September 2026 audit:

- Every React route was mapped to a Next.js route (table above).
- `Next-Frontend/Asset/` and `public/` were diffed against the React originals —
  every file is accounted for.
- `npm run build` succeeds; all 41 routes generate, including the four newly
  ported ones.
- `npx eslint` passes clean on every newly added file.

One pre-existing lint error remains in
`website-setting/home/_components/BtsTape.jsx`
(`react-hooks/set-state-in-effect`). It predates this work and is unrelated to
the migration.
