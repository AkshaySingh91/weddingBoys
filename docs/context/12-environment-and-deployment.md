# 12 — Environment & Deployment

## Environment variables

### `Next-Frontend/.env.local`

| Variable | Required | Purpose |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | **yes** | Base URL of the Express API. Local: `http://localhost:8080`. Production: `https://theweddingboys.in` |
| `NEXT_PUBLIC_SITE_URL` | no | Canonical site origin for canonicals, OG tags, JSON-LD, sitemap and robots. Defaults to `https://theweddingboys.in`. Read it from `lib/siteConfig.js`, never hardcode it |
| `NEXT_PUBLIC_CDN_URL` | no | When set, switches `next/image` to the Cloudflare Image Resizing loader. When unset, Next's built-in optimiser is used with S3 `remotePatterns` |

All three are `NEXT_PUBLIC_`, so they are inlined into the client bundle. Never
put a secret behind that prefix.

The deleted React app's equivalents, for reference:
`Frontend/.env` → `VITE_API_URL = http://localhost:8080`;
`Frontend/.env.production` → `VITE_API_URL = https://theweddingboys.in`.

### `Backend/.env`

| Variable | Purpose |
|---|---|
| `PORT` | API port (8080 locally) |
| `NODE_ENV` | `production` switches cookie prefixes, `Secure`, `domain` and the CORS allowlist |
| `MONGO_URI` | **The authoritative Mongo connection string** — `Config/DBconnection.js` reads only this one |
| `MONGODB_URI`, `DB_URL` | Accepted as fallbacks by the *scripts* only. Set `MONGO_URI` |
| `JWT_SECRET_KEY` | Signs access and refresh tokens |
| `COOKIE_SECRET_KEY` | Signs cookies (`cookie-parser`) |
| `COOKIE_DOMAIN` | Optional override for the session-cookie `Domain`. Unset: `.theweddingboys.in` in production, none (host-only) in dev. Set to an empty string to force host-only anywhere. See [06 — Auth & security](./06-auth-and-security.md) |
| `ADMIN_URL` | Admin origin, used when building emailed links |
| `SITE_URL` | Public site origin, used in emails |
| `EMAIL_SERVICE`, `EMAIL_USERNAME`, `EMAIL_PASSWORD`, `EMAIL_FROM` | Nodemailer — invites and password resets |
| `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`, `S3_BUCKET_NAME` | S3 storage |
| `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME` | Cloudflare R2 storage (bucket `weddingboys-media`) |
| `R2_ACCOUNT_ID` | Optional — falls back to `CLOUDFLARE_ACCOUNT_ID`, the same account |
| `R2_PUBLIC_URL` | `https://media.theweddingboys.in` — the custom domain bound to the bucket. `NEXT_PUBLIC_CDN_URL` is accepted as an alias |
| `MEDIA_EMIT_AVIF` | `1` adds AVIF to the image ladder. Off by default (~4x the CPU of WebP) |
| `FFMPEG_PATH`, `FFPROBE_PATH` | Override binary locations if not on PATH |
| `FFMPEG_TIMEOUT_MS`, `HERO_LOOP_SECONDS`, `WORKER_IDLE_MS` | Worker tuning |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare Stream (falls back to `R2_ACCOUNT_ID` — same account) |
| `CLOUDFLARE_STREAM_API_TOKEN` | Token with `Stream:Edit` permission |
| `NEXT_PUBLIC_CDN_URL` | Also read backend-side when composing CDN URLs for stored media |
| `CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` | Cloudinary — legacy, being phased out |
| `SEED_ADMIN_NAME`, `SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD` | Used by `scripts/seedSuperAdmin.js` |

`Twilio` is a declared dependency but is not referenced in application code.

## Commands

### Frontend (`Next-Frontend/`)
```bash
npm run dev      # dev server on :3000 (Turbopack)
npm run build    # production build — run this before finishing any change
npm start        # serve the production build
npm run lint     # eslint
```

### Backend (`Backend/`)
```bash
npm start          # node app.js — the API
npm run dev        # nodemon app.js
npm run worker     # node worker.js — ffmpeg/sharp media worker
npm run worker:dev # nodemon worker.js
```

The worker is a **separate process** and must be running for uploads to finish
processing: without it, video and image assets stay at `status: 'Processing'`
and never become servable. Run it under pm2/systemd alongside the API.

It requires **ffmpeg on PATH** (`brew install ffmpeg`; currently 9.0.1 with
libx264 + aac) and refuses to start without it or without R2 configured.

### Maintenance scripts
```bash
node scripts/seedSuperAdmin.js       # create the first SuperAdmin from SEED_ADMIN_*
node scripts/migrateContentToCms.js  # move legacy WebsiteSetting content into PageContent
```

## Production topology

```
                      Nginx
        ┌───────────────┴───────────────┐
theweddingboys.in            admin.theweddingboys.in
        └───────────────┬───────────────┘
                        ▼
              ONE Next.js instance
              (proxy.js splits by hostname)
                        │
                        ▼
                 Express API
                        │
        ┌───────────────┼───────────────┐
     MongoDB        S3 / R2      Cloudflare Stream
```

Both hostnames point at the same Next.js instance; `proxy.js` distinguishes them
and rewrites admin paths onto the `/admin` route tree. See
[01 — Architecture](./01-architecture.md).

Because cookies are scoped to `.theweddingboys.in`, the API and the frontend
must remain on that domain (or subdomains of it) in production. Moving the API
to an unrelated origin would break the edge auth gate.

## Build characteristics

At the time of writing, `npm run build` produces **43 routes**: 34 statically
prerendered (`○`) — including `/sitemap.xml` and `/robots.txt` — and 9
dynamic/server-rendered on demand (`ƒ`), plus the proxy. Compilation takes
roughly 3 seconds with Turbopack.

Two harmless build warnings you can ignore:
- *"This version of Turbopack does not support AVIF images"* — for
  `Asset/Varanasi/graintexture.avif`, emitted without re-encoding.
- One pre-existing `react-hooks/set-state-in-effect` lint error in
  `website-setting/home/_components/BtsTape.jsx`.

## Known issues

1. **The web server must 301-redirect to the canonical host.** The app declares
   `https://theweddingboys.in` (via `lib/siteConfig.js`) in every canonical,
   OG tag, sitemap entry and `robots.txt` `Host` directive, but only Nginx can
   enforce it. Redirect `www.theweddingboys.in` → `theweddingboys.in` and
   `http` → `https`, or set `NEXT_PUBLIC_SITE_URL` to whichever host you
   actually serve.
2. **CORS still allows `http://localhost:5173`**, the Vite dev port from the
   deleted React app.
3. **`.DS_Store` files are committed** in several directories and should be
   gitignored.
4. **`/admin/user`** is an empty placeholder route (see
   [03 — Admin panel](./03-admin-panel.md)).
5. **Two overlapping content systems** — `WebsiteSetting` and `PageContent` —
   pending completion of `migrateContentToCms.js`.
