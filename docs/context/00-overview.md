# 00 — Product Overview

## What this is

**WeddingBoys** (`theweddingboys.in`) is the website and business platform for an
Indian wedding cinematography and photography studio. It is two things at once:

1. **A public marketing site** — the studio's shop window. It shows films,
   photo galleries, the team, packages, and a blog, and converts visitors into
   enquiries.
2. **A private admin panel** — a full CMS the studio staff use to run the site
   themselves: upload client work, edit page content, write blog posts, manage
   team members and tags, and read incoming enquiries.

There are also two sub-brands presented within the same site:

- **Varanasi** (`/varanasi`) — a launch/landing page for the studio's Varanasi
  operation, with its own cinematic scroll-driven design.
- **Dharaa Event Management** (`/dharaa-event-management`) — a catering and
  event-management arm operating under the WeddingBoys parent brand.

## The commercial goal driving the current work

The site was originally a **React + Vite single-page application**. An SPA
serves one nearly-empty HTML shell for every URL and paints content with
JavaScript afterwards, which is a poor foundation for Google: page-specific
titles, descriptions and content are not present in the initial HTML response.

The site was therefore **migrated to Next.js (App Router)** so that pages can be
server-rendered and statically generated, giving each URL real HTML with real
metadata. The business objective is straightforward: **rank on Google and win
real clients from organic search.** Every architectural decision in this
codebase should be read against that goal — see
[09 — SEO](./09-seo.md) for what has been achieved so far and what is still
outstanding.

## Repository layout

```
weddingBoys/
├── Backend/          Express + MongoDB API (the only source of data)
├── Next-Frontend/    Next.js 16 App Router app — public site AND admin panel
├── docs/             This documentation
│   └── context/
├── package.json      Incidental root manifest (see note below)
└── readme.md         Legacy deep-dive doc describing the OLD React app
```

Two notes so you are not misled:

- **`Frontend/` no longer exists.** It was the React + Vite SPA. It was removed
  once the Next.js app reached feature parity. See
  [10 — Migration history](./10-migration-history.md). Its contents remain in
  git history if you ever need to compare.
- **`readme.md` at the repo root is stale.** It documents the deleted React app
  in detail (file paths under `Frontend/src/...` that no longer resolve). Treat
  it as a historical artefact, not as guidance. This `docs/` folder supersedes
  it.
- The root `package.json` contains a handful of TipTap dependencies and no
  scripts. It is not the build entry point for anything; each of `Backend/` and
  `Next-Frontend/` has its own manifest.

## The three moving parts

| Part | Stack | Runs on | Talks to |
|---|---|---|---|
| `Next-Frontend` | Next.js 16, React 19, Tailwind 3 | Node (`next start`) | The Express API over HTTP |
| `Backend` | Express 4, Mongoose 8 | Node | MongoDB, AWS S3 / Cloudflare R2, Cloudflare Stream, SMTP |
| Database | MongoDB | Managed cluster | — |

There is **no Next.js API layer**. The Next app has no `app/api/` routes; every
piece of data comes from the Express backend. Server Components fetch from it
directly during rendering; Client Components fetch from it in the browser with
`credentials: 'include'`.

## Running it locally

Two terminals.

```bash
# 1. API — http://localhost:8080
cd Backend
npm install
npm start            # and, in a third terminal, `npm run worker`

# 2. Web — http://localhost:3000
cd Next-Frontend
npm install
npm run dev
```

Media uploads also need the **worker** (`npm run worker`) and ffmpeg on PATH —
without it, uploaded assets stay at `status: 'Processing'`. See
[08 — Media pipeline](./08-media-pipeline.md).

The backend needs `Backend/.env` (Mongo URI, JWT and cookie secrets, S3/R2
credentials, SMTP). The frontend needs `Next-Frontend/.env.local`, which locally
contains only:

```
NEXT_PUBLIC_API_URL=http://localhost:8080
```

In production that value is `https://theweddingboys.in`. Full variable reference:
[12 — Environment & deployment](./12-environment-and-deployment.md).

## Who uses the admin panel

Three roles, enforced server-side (see [06 — Auth & security](./06-auth-and-security.md)):

- **SuperAdmin** — full control, including inviting and managing other users.
- **Editor** — content and blog work.
- **PortfolioManager** — client media and portfolio work.

Onboarding is **invite-only**. There is deliberately no public signup form.
