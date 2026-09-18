# 03 — The Admin Panel

Everything here lives under `Next-Frontend/app/admin/`. In production it is
reached at **`admin.theweddingboys.in`**, where `proxy.js` strips the `/admin`
prefix from the visible URL (so the login page is `admin.theweddingboys.in/login`
even though the file is `app/admin/(auth)/login/page.jsx`).

## Two layouts

- **`(auth)/layout.jsx`** — a bare centred card. No sidebar, no session
  required. Covers login, forgot/reset password and invite acceptance.
- **`(dashboard)/layout.jsx`** — the real panel:
  `QueryProvider` → `AdminAuthProvider` → `AdminSidebar` + `Header` + `Footer`.
  `AdminAuthProvider` calls `/api/admin/auth/me` on mount and redirects to
  `/admin/login` if that fails, so every dashboard screen can assume a
  signed-in user.

## Route map

### Authentication — `(auth)/`

| URL | Purpose | Endpoints |
|---|---|---|
| `/admin/login` | Password login, then TOTP or recovery-code step if MFA is on | `POST /api/admin/auth/login`, `…/mfa/login-verify`, `…/mfa/recovery-verify` |
| `/admin/forgot-password` | Request a reset email | `POST /api/admin/auth/forgot-password` |
| `/admin/reset-password/[token]` | Set a new password from the emailed link | `POST /api/admin/auth/reset-password` |
| `/admin/accept-invite/[token]` | New user completes their invited account | `POST /api/admin/users/accept-invite` |

There is **no signup page**. This is deliberate — see
[10 — Migration history](./10-migration-history.md).

### Dashboard — `(dashboard)/`

| URL | Screen | Notes |
|---|---|---|
| `/admin/dashboard` | Landing dashboard | |
| `/admin/blogs` | Post list — publish/unpublish, delete | `GET/DELETE /api/admin/blogs`, `PUT …/:id/publish` |
| `/admin/blogs/create` | New post | Wraps `BlogForm` |
| `/admin/blogs/edit/[id]` | Edit post | Wraps `BlogForm` with fetched initial data |
| `/admin/content` | List of CMS pages | `GET /api/admin/content` |
| `/admin/content/[pageKey]` | Block editor for one page | `GET/PUT /api/admin/content/:pageKey` |
| `/admin/media` | Media library browser | TanStack Query + `useMediaLibrary` |
| `/admin/portfolio` | **Portfolio curation** — every film and photo across all clients: filter, bulk-tag, re-prioritise, publish/hide, assign library assets to a client, and order the homepage hero carousel | `/api/admin/portfolio*` |
| `/admin/studio-setting` | Studio contact details, logo, socials, invite code | `PUT /api/admin/studio-setting/contact/save` |
| `/admin/total-Enquires` | Incoming contact-form enquiries | `GET /api/admin/get-clients-enquiry` |
| `/admin/users` | Team management — roles, status, invites | `GET /api/admin/users`, SuperAdmin-only mutations |
| `/admin/profile` | Own profile | `GET /api/admin/profile` |
| `/admin/security` | MFA setup, TOTP QR, recovery codes | `POST /api/admin/auth/mfa/*` |
| `/admin/user` | **Empty placeholder** — see below | — |

### Website settings — `(dashboard)/website-setting/`

This is the portfolio and site-content area, mirroring the sub-menu in
`AdminSidebar`:

| URL | Screen | What it controls |
|---|---|---|
| `/website-setting/home` | Home page editor | Hero banner videos, film thumbnails, BTS tape, reviews, map of client locations |
| `/website-setting/films` | Films page curator | Which tags appear as rows on the public `/films`, with a live preview of each row. (There is no `/photos` equivalent screen yet, though the API exists) |
| `/website-setting/teams` | Team page manager | Banner images + team member cards (portrait, name, designation) |
| `/website-setting/add-client` | New client intake | Upload a wedding's videos and photos with full metadata. **Intake only** — it no longer owns curation; use `/admin/portfolio` for that |
| `/website-setting/clients` | All clients | List of every client project |
| `/website-setting/clients/[id]` | One client | Edit individual photo and video records |
| `/website-setting/add-tags` | Tag manager | The taxonomy behind all film/photo filtering |
| `/website-setting/bts-schema-manager` | BTS role schema | The crew-role checklist offered when tagging a shoot |

## Role-based access

Roles are `SuperAdmin`, `Editor`, `PortfolioManager` (`Backend/constants.js`).
The UI is **not** role-gated screen by screen — enforcement is server-side, per
endpoint, via `requireRole` / `requireSuperAdmin` after `verifyToken`.

SuperAdmin-only operations currently include:

- Inviting a user (`POST /api/admin/users/invite`)
- Changing a user's role or status (`PUT /api/admin/users/:id/role|status`)
- Revoking another user's sessions (`DELETE /api/admin/users/:id/sessions`)
- Deleting a CMS page (`DELETE /api/admin/content/:pageKey`)

`requireRole` treats **SuperAdmin as implicitly passing every check**, so it
never needs listing in an allowed-roles array.

Everything else behind `verifyToken` is available to any authenticated role. If
you need finer-grained control, add `requireRole([...])` to the route — do not
rely on hiding a button in the UI.

## Key admin components

| Component | Role |
|---|---|
| `Component/AdminSidebar.jsx` | The navigation source of truth. Every link here must resolve to a real route — an entry without a page is a 404 for staff. |
| `app/admin/components/MediaPickerModal.jsx` | Shared modal for choosing an asset from the media library |
| `blogs/_components/BlogForm.jsx` | The whole blog editor: content, SEO panel, wedding details panel, cover image, tags, keywords, live outline |
| `blogs/_components/Editor.jsx` | TipTap rich-text editor |
| `blogs/_components/extensions/` | Custom TipTap nodes: `Callout`, `InlineMedia`, `PhotoGallery`, `WeddingVideoEmbed` |
| `content/_components/BlockCard.jsx` | Generic per-block editor, driven entirely by `config.js` |
| `content/_components/config.js` | Declarative description of every block type and its fields |
| `Component/VideoDetailsForm.jsx` / `PhotoDetailsForm.jsx` | Per-asset metadata capture during client intake |

## Known dead route

`/admin/user` renders an empty `<div>`. It was an empty stub in the old React
app too and was ported faithfully rather than dropped. The sidebar's "Team" item
points at `/admin/users` (the real screen), so nothing links to `/admin/user`.
It is safe to delete whenever someone is doing cleanup.
