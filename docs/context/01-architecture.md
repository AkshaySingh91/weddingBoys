# 01 — Architecture

## The shape of the system

```
                    theweddingboys.in            admin.theweddingboys.in
                            │                              │
                            └──────────────┬───────────────┘
                                           │
                                   ┌───────▼────────┐
                                   │   Next.js 16   │   ONE instance serves
                                   │  (App Router)  │   both hostnames
                                   │                │
                                   │   proxy.js     │ ← edge: subdomain routing
                                   │  (middleware)  │   + auth gate
                                   └───────┬────────┘
                                           │  fetch() — server & client
                                   ┌───────▼────────┐
                                   │  Express API   │
                                   │  (Backend/)    │
                                   └───┬────────┬───┘
                                       │        │
                              ┌────────▼──┐  ┌──▼──────────────────┐
                              │  MongoDB  │  │ S3 / Cloudflare R2  │
                              └───────────┘  │ Cloudflare Stream   │
                                             └─────────────────────┘
```

The important structural fact: **one Next.js deployment serves both the public
site and the admin panel**, separated at the edge by hostname rather than by
being two applications.

## Route groups

The App Router uses two route groups, which affect layout inheritance but not
the URL:

```
app/
├── layout.jsx              Root layout — fonts, global metadata, JSON-LD,
│                           StudioDetailsContext (wraps BOTH trees)
├── (site)/                 Public marketing site
│   ├── layout.jsx          Navbar + Footer + Background + ScrollOnTop
│   └── …                   /, /films, /photos, /blogs, /varanasi, …
└── admin/                  Admin panel
    ├── (auth)/             Login, forgot/reset password, accept invite
    │   └── layout.jsx      Bare centred card — no sidebar
    └── (dashboard)/        Everything behind a session
        └── layout.jsx      QueryProvider → AdminAuthProvider → Sidebar+Header
```

`(site)` and `(dashboard)` are parenthesised, so they are organisational only —
`app/(site)/films/page.jsx` serves `/films`, not `/site/films`.

## Subdomain routing and the edge auth gate — `proxy.js`

In Next.js 16 the `middleware` file convention was renamed to **`proxy`**, which
is why the file is `proxy.js` exporting `proxy()` rather than `middleware.js`.
This single file does three jobs:

1. **Hostname split.** If the request host is not an `admin.` host, it passes
   straight through to the public site.
2. **Path rewriting.** On the admin host, `admin.theweddingboys.in/blogs` is
   *rewritten* (URL unchanged in the browser) onto the `/admin/blogs` route
   tree. The admin subdomain therefore never shows `/admin/` in its URLs.
3. **Auth gating.** Any admin path that is not one of the public auth paths
   (`/login`, `/forgot-password`, `/reset-password`, `/accept-invite`) requires
   an auth cookie to be *present*, or the request is redirected to
   `/admin/login?next=…`. Conversely, an already-signed-in visitor hitting
   `/login` is bounced to `/admin/dashboard`.

The edge check is **presence-only** — it looks for `__Secure-admin-token` (prod)
or `admin-token` (dev) and does not verify the JWT. That is deliberate: it is a
cheap UX gate that avoids rendering an admin shell for signed-out visitors. The
real authorisation happens on every API call in the Express backend. Never treat
the edge gate as a security boundary on its own.

The matcher deliberately excludes `api`, `_next/static`, `_next/image`,
`favicon.ico`, and anything containing a dot, so static assets are never caught
by the gate.

## Rendering strategy

This is the part that matters most for the SEO goal.

| Route | Strategy | Why |
|---|---|---|
| `/` | **ISR, 60s** | Server-fetches the CMS `home` layout so content is in the HTML; revalidates every minute so admin edits appear quickly |
| `/blogs` | **ISR, 1h** | Blog index — the primary organic-search surface |
| `/blogs/[slug]` | **ISR, 1h** + `generateMetadata` | Per-post title, description, canonical, OG tags |
| `/[slug]` | **ISR, 1h** + `generateMetadata` | Catch-all for admin-built CMS pages |
| `/dharaa-event-management`, `/search-result` | Static (server) | Export their own `metadata`; `/search-result` is `noindex` |
| `/films`, `/photos`, `/team`, `/about-us`, `/contact`, `/varanasi`, `/allfilms` | **Server shell + client body** | A thin server `page.jsx` exports `metadata`, then renders the interactive component from `_components/*Client.jsx` |
| `/sitemap.xml`, `/robots.txt` | Generated | `app/sitemap.js` (ISR 1h) and `app/robots.js` |
| `/films/[videoId]`, `/photos/[photoId]` | Dynamic | Per-item pages |
| All `/admin/*` | Client-rendered behind auth | No SEO value; correctly excluded from indexing concerns |

A `'use client'` page **cannot export `metadata` or `generateMetadata`**. Seven
public pages were pure client components and therefore all inherited the root
layout's homepage title; each is now split into a server shell that owns the
metadata plus a client body that owns the interactivity. Use that same split for
any new interactive public route — see [11 — Conventions](./11-conventions.md).

## Data flow

There are exactly two patterns.

**Server Components** fetch during rendering, with Next's fetch cache doing the
ISR work:

```jsx
const res = await fetch(`${api_url}/api/content/home`, { next: { revalidate: 60 } });
```

**Client Components** fetch in the browser. Anything authenticated goes through
`lib/apiClient.js`, which always sends cookies and — critically — transparently
retries once after refreshing an expired access token, coalescing concurrent
refreshes so a burst of 401s triggers exactly one refresh call:

```jsx
import { apiFetch, apiJson } from '@/lib/apiClient.js';
const data = await apiJson('/api/admin/users');
```

Older admin screens still call bare `fetch(..., { credentials: 'include' })`.
Both work, but `apiClient` is the pattern to follow for new code because it
handles token refresh.

## Resilience: the CMS fails soft

Every CMS fetch is wrapped so that an unreachable or unpublished page does not
take the site down. The home page is the reference implementation: if
`/api/content/home` fails, `page?.blocks?.length` is falsy and the page renders
a **hardcoded fallback layout** of the same sections instead. The site always
renders something.

Apply that principle to any new CMS-driven page.

## Global providers

- **`StudioDetailsContext`** (root layout, wraps everything) — fetches
  `/api/studio/details` once and exposes studio name, logo, address, contact,
  email and social links to the whole app, public and admin alike.
- **`AdminAuthProvider`** (admin dashboard layout only) — calls
  `/api/admin/auth/me`, exposes the signed-in user including their RBAC role,
  and redirects to `/admin/login` when that call fails.
- **`QueryProvider`** (admin dashboard layout) — TanStack Query client, used by
  the media library and other data-heavy admin screens.
