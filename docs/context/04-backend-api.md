# 04 — Backend API Reference

The Express app is `Backend/app.js`. It mounts every router at the root and each
router declares its own absolute paths (e.g. `/api/admin/blogs`), so there is no
prefix indirection to trace — the path in the route file is the real URL.

## Conventions

- **Auth**: protected routes use `verifyToken` (validates the signed HttpOnly
  access-token cookie and populates `req.user`). Some add `requireRole` /
  `requireSuperAdmin`.
- **Cookies**: `credentials: 'include'` is mandatory on every authenticated
  call from the browser.
- **CORS**: origins are pinned — `https://theweddingboys.in` and
  `https://www.theweddingboys.in` in production; `http://localhost:5173`,
  `http://localhost:3000` and `http://admin.localhost:3000` in development.
  (`5173` is a leftover from the removed Vite app and can be dropped.)
- **Errors**: handlers respond `{ message }` on failure. The frontend helper
  `apiJson` throws with that message.

---

## Public endpoints (no auth)

### Studio & config
| Method | Path | Returns |
|---|---|---|
| GET | `/api/studio/details` | Studio name, logo, address, contact, email, socials |
| GET | `/api/config` | Public site configuration |
| GET | `/api/pricing` | Published pricing packages |

### Films & photos
| Method | Path | Notes |
|---|---|---|
| GET | `/api/videos` | Supports `?tag=`, `?page=`, `?limit=` |
| GET | `/api/videos/:id` | One film |
| GET | `/api/videos/:id/recommended` | Related films |
| GET | `/api/photos` | Supports `?page=`, `?limit=` |
| GET | `/api/photos/:id` | One photo |
| GET | `/api/photos/:id/recommended` | Related photos |
| GET | `/api/hero-videos` | Home hero carousel |
| GET | `/api/home/sample-photos` | Home portfolio strip |
| GET | `/api/homepage/tags` | Tags used on the home film strip |
| GET | `/api/homepage/bts-image` | Behind-the-scenes images |
| GET | `/api/filmpage/tags` | Tags pinned to the public `/films` page |
| GET | `/api/get-all-tags` | Full tag taxonomy |
| GET | `/api/map-clients` | Client locations for the map |

### Content, blog, team, search
| Method | Path | Notes |
|---|---|---|
| GET | `/api/content` | Published page keys only (no block content, no drafts) — consumed by the Next.js sitemap |
| GET | `/api/content/:pageKey` | A published CMS page (blocks) |
| GET | `/api/blogs` | Published post list |
| GET | `/api/blogs/slug/:slug` | One post by slug |
| GET | `/api/blogs/related/:slug` | Related posts |
| GET | `/api/team` | Team members + banner images |
| GET | `/api/reviews` | Testimonials |
| GET | `/api/search` | Site search (photos + videos) |
| POST | `/api/enquiry` | Contact-form submission |

---

## Authentication

| Method | Path | Purpose |
|---|---|---|
| POST | `/api/admin/auth/login` | Password login; returns an MFA challenge if enabled |
| POST | `/api/admin/auth/mfa/login-verify` | Submit the TOTP code |
| POST | `/api/admin/auth/mfa/recovery-verify` | Submit a recovery code instead |
| POST | `/api/admin/auth/refresh` | Rotate the access token from the refresh cookie |
| POST | `/api/admin/auth/logout` | Clear cookies, revoke the session |
| GET | `/api/admin/auth/me` | Current user (used by `AdminAuthProvider`) |
| GET | `/api/admin/auth/sessions` | List own active sessions |
| POST | `/api/admin/auth/forgot-password` | Send a reset email |
| POST | `/api/admin/auth/reset-password` | Consume the reset token |
| POST | `/api/admin/auth/mfa/setup` | Begin TOTP enrolment (returns QR) |
| POST | `/api/admin/auth/mfa/verify-setup` | Confirm enrolment |
| POST | `/api/admin/auth/mfa/disable` | Turn MFA off |
| POST | `/api/admin/auth/mfa/regenerate-codes` | New recovery codes |

## Users (SuperAdmin for mutations)

| Method | Path | Guard |
|---|---|---|
| GET | `/api/admin/users` | `verifyToken` |
| POST | `/api/admin/users/invite` | + `requireSuperAdmin` |
| POST | `/api/admin/users/accept-invite` | public (token-bearing) |
| PUT | `/api/admin/users/:id/role` | + `requireSuperAdmin` |
| PUT | `/api/admin/users/:id/status` | + `requireSuperAdmin` |
| DELETE | `/api/admin/users/:id/sessions` | + `requireSuperAdmin` |

> **Route ordering matters.** `adminOpsRoute` calls `Route.use(verifyToken)`,
> which applies to every request that reaches that router — so any *public*
> route must be mounted before it in `app.js`, or it answers `401` instead of
> resolving. `publicContentRoute` is already mounted earlier, which is why
> `GET /api/content` works without auth.

## Content CMS

| Method | Path | Guard |
|---|---|---|
| GET | `/api/admin/content` | `verifyToken` |
| GET | `/api/admin/content/:pageKey` | `verifyToken` |
| PUT | `/api/admin/content/:pageKey` | `verifyToken` |
| DELETE | `/api/admin/content/:pageKey` | + `requireSuperAdmin` |

## Blog

| Method | Path |
|---|---|
| GET | `/api/admin/blogs` |
| GET | `/api/admin/blogs/:id` |
| POST | `/api/admin/blogs` |
| PUT | `/api/admin/blogs/:id` |
| PUT | `/api/admin/blogs/:id/publish` |
| DELETE | `/api/admin/blogs/:id` |
| POST | `/api/admin/blogs/presigned-urls` | *legacy presign, kept for back-compat* |

Writable fields are whitelisted by `EDITABLE_FIELDS` in
`Controllers/blogController.js`. Anything not in that list is silently dropped —
if you add a field to the schema **and** to the editor, add it there too or it
will never persist.

## Media library

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/admin/media` | Browse/filter the library |
| POST | `/api/admin/media/upload` | Direct server-side upload |
| POST | `/api/admin/media/presign` | Presigned PUT for browser→bucket upload |
| POST | `/api/admin/media/confirm` | Persist metadata after a presigned upload |
| POST | `/api/admin/media/stream-upload-url` | Cloudflare Stream direct-creator-upload URL |
| POST | `/api/admin/media/stream-complete` | Persist Stream metadata after upload |
| PATCH | `/api/admin/media/:id` | Update alt text, title, status… |
| DELETE | `/api/admin/media/:id` | Remove an asset |

## Clients / portfolio

| Method | Path |
|---|---|
| GET | `/api/admin/clients` |
| GET | `/api/admin/client/:id` |
| POST | `/api/admin/add-client/validate-details` |
| POST | `/api/admin/add-client/save-details` |
| PUT | `/api/admin/client/:id/validate-details` |
| PUT | `/api/admin/client/:id/save-details` |
| DELETE | `/api/admin/map-clients` |

The two-step **validate → save** pattern is intentional: the client validates
metadata and obtains presigned URLs first, uploads the media to the bucket, then
persists. Keep that ordering when touching intake code.

Both write paths also call `syncClientPortfolio()`, which mirrors the client's
embedded films and photos into the `PortfolioItem` collection.

## Portfolio curation

`Routes/Admin/portfolioRoute.js`. The cross-client editorial layer — see
[13 — Portfolio domain](./13-portfolio-domain.md).

| Method | Path | Notes |
|---|---|---|
| GET | `/api/admin/portfolio` | `kind` · `client` · `tag` · `isHero` · `status` · `q` · `untagged` · `missingMedia` · `page` · `limit` · `sort` |
| POST | `/api/admin/portfolio` | Assign a Media asset to a client; also moves `Media.ownerType/ownerId`. `409` if already placed |
| PATCH | `/api/admin/portfolio/bulk` | `{ ids[], set{}, tags:{add,remove,replace}, shiftPriority }` — max 500 ids |
| POST | `/api/admin/portfolio/hero` | `{ ids[] }` replaces the entire hero carousel, in order |
| PATCH | `/api/admin/portfolio/:id` | Whitelisted fields only |
| DELETE | `/api/admin/portfolio/:id` | `?releaseMedia=true` returns the asset to the library. Never deletes bytes |

`/bulk` and `/hero` are registered **before** `/:id`, or Express matches them as
an id. A filter-wide bulk write requires a matching `expectedCount`.

> **Eight public read endpoints are dual-pathed** behind `PORTFOLIO_READS=v2`:
> `/api/videos`, `/api/videos/:id`, `/api/videos/:id/recommended`, `/api/photos`,
> `/api/photos/:id`, `/api/photos/:id/recommended`, `/api/hero-videos`,
> `/api/search`. Response shapes are identical either way — the adapters in
> `Services/portfolioService.js` reproduce the legacy shape field for field.
> `/api/map-clients` is **not** yet migrated.

## Home page, tags, reviews, team, BTS

| Method | Path |
|---|---|
| POST | `/api/admin/homepage/tags` |
| PUT | `/api/admin/homepage/bts-image/get-url` |
| PUT | `/api/admin/homepage/bts-image/save-details` |
| DELETE | `/api/admin/homepage/bts-image` |
| POST | `/api/admin/filmpage/tags` |
| POST / PUT | `/api/admin/tags` |
| POST / PUT | `/api/admin/review/get-put-url` |
| POST / PUT | `/api/admin/review/save-details` |
| DELETE | `/api/admin/reviews` |
| POST | `/api/admin/team` · `/api/admin/team/get-put-url` |
| POST | `/api/admin/team/banner-image` · `/api/admin/team/banner-image/get-put-url` |
| PUT | `/api/admin/team/` |
| DELETE | `/api/admin/team` · `/api/admin/team/banner-image` |
| GET/POST | `/api/bts-schema` |
| PUT/DELETE | `/api/bts-schema/:roleId` |

`PUT /api/admin/tags` is **two-phase**. The first call sends
`isConfirmed: false`; if the change would orphan tags still attached to media,
the API responds `200` with a `{ confirm: "<question>" }` body instead of
applying it. The client shows that question and, on confirmation, repeats the
call with `isConfirmed: true`. Preserve this handshake in any rewrite.

## Enquiries, profile, studio settings, ops

| Method | Path |
|---|---|
| GET | `/api/admin/get-clients-enquiry` |
| PATCH | `/api/admin/enquires/mark-viewed/:id` |
| DELETE | `/api/admin/enquires/:id` |
| GET | `/api/admin/profile` |
| PUT | `/api/admin/profile/save` · `/api/admin/profile/verify` |
| POST | `/api/admin/profile/change-password` |
| GET | `/api/admin/studio-setting/invite-code` · `…/regenerate` |
| PUT | `/api/admin/studio-setting/contact/save` · `…/contact/get-logo-put-url` |
| GET | `/api/admin/analytics/dashboard` |
| GET/POST | `/api/admin/pricing` |
| PUT | `/api/admin/pricing/:id` · `/api/admin/pricing/reorder` |
| DELETE | `/api/admin/pricing/:id` |
| PUT | `/api/admin/config` |
