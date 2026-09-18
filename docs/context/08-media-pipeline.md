# 08 — Media Pipeline

Wedding work means large files: 50–200 MB masters and tens of thousands of
stills, heading for ~5,200 videos. The pipeline is built so that **bytes never
pass through the Node process**, every object is **immutable and CDN-cached**,
and heavy encoding happens **off the request path**.

> Superseded design: an earlier version of this document described Cloudflare
> Stream and HLS. That path was dropped — delivery is now **progressive MP4 from
> R2**, with renditions produced by our own ffmpeg worker.

## The shape of it

```
browser ──multipart PUT (bytes, direct)───────────────► R2  <mediaId>/orig.mp4
   └──► Node control plane only: create / sign / complete
                    │ enqueue MediaJob
                    ▼
            worker.js  (separate process, ffmpeg + sharp)
                    │
   video ──► web.mp4 (720p) · loop.mp4 (~8s silent) · poster.jpg + poster-{640,1280}.webp
   image ──► 640/1024/1600/2400.webp · blurDataURL · dominantColor
                    │
                    ▼  Media.status: Processing → Ready

delivery: https://media.theweddingboys.in/<key>
          public · unsigned · Cache-Control: public, max-age=31536000, immutable
```

## Storage: Cloudflare R2

Bucket `weddingboys-media`, served through the custom domain
**`media.theweddingboys.in`**. Environment (`Backend/.env`):

| Variable | Notes |
|---|---|
| `CLOUDFLARE_ACCOUNT_ID` | Doubles as the R2 account id; `R2_ACCOUNT_ID` also accepted |
| `R2_ACCESS_KEY_ID` / `R2_SECRET_ACCESS_KEY` | R2 API token |
| `R2_BUCKET_NAME` | `weddingboys-media` |
| `R2_PUBLIC_URL` | `https://media.theweddingboys.in` (`NEXT_PUBLIC_CDN_URL` is an alias) |
| `MEDIA_EMIT_AVIF` | `1` to add AVIF to the ladder. Off by default — ~4× the CPU of WebP |

> **The one non-obvious requirement.** The S3 client in
> `Services/r2UploadService.js` sets `requestChecksumCalculation: 'WHEN_REQUIRED'`
> and `responseChecksumValidation: 'WHEN_REQUIRED'`. From `@aws-sdk/client-s3`
> v3.729 the default is `WHEN_SUPPORTED`, which signs a crc32 checksum header
> that R2 does not implement — every PutObject and presigned UploadPart then
> fails, and it looks like a signing bug. Do not remove those two lines.

## Key structure

```
<domain>/<scope>/<mediaId>/<rendition>.<ext>
```

| Owner | Prefix | Example |
|---|---|---|
| Client media | `client/<clientId>/` | `client/67e0529e/V7kQm2xR8bLp/orig.mp4` |
| Website | `website/<slot>/` | `website/hero/HLm37tzz/poster-1280.webp` |
| Blog / SEO | `marketing/blog/`, `marketing/seo/` | `marketing/blog/Xy7pQ2/1024.webp` |
| Review / Team / Brand / System | `review/`, `team/`, `brand/`, `system/` | `team/Nn8vLm/640.webp` |

`mediaId` is a `nanoid(12)` minted at create-upload time. **Keys are never
rewritten** — that is exactly what makes the immutable cache header safe.
"Replacing" an asset mints a new `mediaId`, repoints the referrer, and marks the
old doc `Archived` with `supersededBy` + `deleteAfter`.

Renditions of one asset share its folder, so everything for a video can be
reaped together: `orig.mp4`, `web.mp4`, `loop.mp4`, `poster.jpg`,
`poster-640.webp`, `poster-1280.webp`.

> Deleting an object from R2 does **not** purge the Cloudflare edge cache. That
> is harmless because keys are immutable and never reused — nothing links to a
> superseded key — but a "deleted" URL can still serve from cache for a while.

## Upload: resumable multipart, browser → R2

**R2 presigned URLs cover only `GET/HEAD/PUT/DELETE`.** `CreateMultipartUpload`
and `CompleteMultipartUpload` are POSTs and cannot be presigned, so they are
orchestrated server-side. Only `UploadPart` (a PUT) is handed to the browser.

`Routes/Admin/uploadRoute.js` → `Controllers/uploadController.js`:

```
POST /api/admin/uploads/create       → { sessionId, mediaId, key, mode, uploadId, partSize, partCount }
POST /api/admin/uploads/:id/sign     → { urls: [{ partNumber, url }] }   re-callable for expired parts
GET  /api/admin/uploads/:id/parts    → ListParts — the resume primitive
POST /api/admin/uploads/:id/complete → { media }
POST /api/admin/uploads/:id/abort
GET  /api/admin/uploads/resumable    → this admin's in-flight sessions
```

- **Part size 16 MiB, fixed.** R2 requires uniform parts (min 5 MiB). 50 MB → 4
  parts, 200 MB → 13.
- Files ≤ 8 MiB skip multipart entirely and use one presigned PUT.
- **`complete` rebuilds the part list from R2's own `ListParts`, never from the
  request body** — a client cannot assemble a corrupt object. A gap returns
  `409` naming the missing part numbers.
- `UploadSession` (`Models/UploadSession.js`) holds the server-side state, keyed
  by a `name:size:lastModified` fingerprint so a re-picked file resumes. It TTLs
  after 7 days, matching R2's own abort window.

## Processing: the worker

```bash
npm run worker        # node worker.js — run under pm2/systemd
npm run worker:dev    # nodemon
```

A **separate process** from the API: ffmpeg pegs a core for minutes, which
inside Express would stall requests and lose in-flight work on deploy.

`Models/MediaJob.js` + `Services/mediaJobQueue.js` are a MongoDB-backed queue —
no Redis, no BullMQ, deliberately. Claiming is a single atomic
`findOneAndUpdate`, so two workers can never take the same job. `lockedAt`
doubles as a heartbeat: a job whose lock goes stale is reclaimed, which is what
makes a `kill -9` recoverable instead of a permanent stall. Failures back off
exponentially over 3 attempts, then land in `failed` with `lastError` surfaced
on the Media doc.

`Services/transcodeService.js` (measured on a 48 MB, 20 Mbps, 1080p master):

| Output | Result | Command shape |
|---|---|---|
| `poster.jpg` | 116 KB, 0.1 s | `-ss <10% of duration> -frames:v 1 -q:v 2` |
| `web.mp4` | 4.08 MB, 1.8 s | `-vf scale=-2:720 -c:v libx264 -crf 23 -preset medium -c:a aac -b:a 128k` |
| `loop.mp4` | **0.66 MB**, 1.0 s | `-ss <start> -t 8 -vf scale=-2:720 -crf 28 -preset slow -an` |

The poster is taken ~10% in, not at t=0 — wedding films almost always open on a
black fade-in, and a black poster is worse than none.

**`-movflags +faststart` on every generated file.** It moves the `moov` atom
ahead of `mdat`; without it a player cannot start until it has located the moov,
which defeats progressive delivery entirely. `hasFaststart()` checks the first
64 KB of uploaded masters (which usually lack it) so the admin can be warned.

The hero loop is **re-encoded, not stream-copied**. A stream copy cannot cut
mid-GOP and would still carry the master's bitrate — roughly 19 MB for 8 seconds
of a 20 Mbps source, versus 0.66 MB re-encoded.

## Images

`ingestImage` (server-side) and `processImage` (worker) both emit the ladder
**640 / 1024 / 1600 / 2400** as WebP, plus a 16px blur placeholder and the
dominant colour.

Two defects worth knowing about, both now fixed:

- **EXIF/GPS was being published.** The master was uploaded verbatim, shipping
  the couple's location to the CDN. `.rotate()` now bakes in orientation and
  drops all metadata.
- **The ladder skipped wide variants for small sources**, so the frontend loader
  could request a variant that was never written. Every rung is now always
  emitted, capped by `withoutEnlargement`.

## Delivery

`Utils/mediaUrl.js` is the single place a public URL is built. R2 objects are
public and immutable, so the URL is just the CDN base plus the key — **no
signing**. `resolveLegacyKey()` provides the dual read during the S3 → R2
migration; finishing that migration means deleting one branch.

`Next-Frontend/cloudflareLoader.js` is a **variant-snapping** `next/image`
loader: it rewrites `.../<mediaId>/orig.jpg` to the smallest ladder rung at or
above the requested width (w=900 → `1024.webp`). URLs that are not ours pass
through untouched. Cloudflare Image Resizing is **not enabled** on the current
plan, so that branch stays behind `NEXT_PUBLIC_CF_IMAGE_RESIZING=1`.

`LADDER` in the loader must stay in sync with `VARIANT_WIDTHS_PUBLIC` in
`r2UploadService.js` — a width listed in one and not the other is a 404.

## Hero delivery

`app/(site)/_home/Herobanner.jsx` is a Server Component that fetches the slides
(ISR, 300 s) so posters are in the initial HTML;
`app/(site)/_home/HeroCarousel.jsx` handles interaction. The rules:

1. Every slide paints its **poster** — that is the LCP element.
2. Only the **active** slide mounts a `<video>`, at `preload="none"`.
3. Playback is gated on in-view + not `prefers-reduced-motion` + connection tier
   + online. On a `low` tier no video is requested at all.

Rendition choice reuses `Hooks/useNetworkStatus.jsx` (`TIER_PROFILE`), which
already existed and was imported by nothing.

**Measured effect:** the homepage hero went from **79.1 MB** (four masters, all
`preload="auto"` and autoplaying, no poster) to a **134 KB poster** on first
paint, with one slide's video streaming after it — and once masters are migrated
and looped, ~21 KB poster + 0.66 MB loop per slide.

## The library, as an admin sees it

`/admin/media` leads with **purpose, not file type** — "Images / Videos / Documents"
says nothing about what an asset is *for*. `ownerType` already encodes that and is
already indexed (`{ownerType, ownerId}`), so this is emphasis, not schema:

```
Client work   39   251.4 MB      ← films and photographs from weddings
Team          10    12.2 MB
Reviews        3     2.5 MB
Brand          1     0.0 MB
Unassigned     1     7.4 MB      ← was "System"
```

**`System` is displayed as Unassigned** because that is what it means: every
library upload lands there attached to nothing, so no public page can reach it
until it is assigned to a client. The library flags the count rather than leaving
it to be discovered.

`GET /api/admin/media/stats` returns those counts plus bytes per purpose, per
type and per status. **Bytes include every derivative**, so the figure matches
the bucket rather than the sum of the masters.

Clicking an asset opens a dialog showing the full derivative breakdown —
`AssetBreakdown` (`app/admin/components/AssetBreakdown.jsx`), which reads what is
already in the list payload and computes nothing server-side. Verified against
R2 itself: **53 of 53 assets reconcile exactly**.

> Getting to exact required one schema addition. The base `poster.jpg` had no
> size recorded anywhere — only the webp `posterVariants` carried `bytes` — so
> every video total under-reported by ~130 KB. `video.posterBytes` now records
> it, and existing videos were backfilled from R2.

## Rules of thumb

1. New asset → a `Media` document. Never store a bare URL on another model.
2. Anything CPU-heavy → a `MediaJob`, never the request path.
3. Public site images → `next/image` (the loader snaps to the ladder). Plain
   `<img>` remains acceptable in the **admin** for blob previews.
4. Never sign a media URL again. If you find yourself reaching for
   `getObjectUrl`, use `Utils/mediaUrl.js` instead.
5. **A `Media` document is not portfolio content.** This pipeline ends at the
   asset. Making an asset appear on the public site is a separate, editorial
   step — assigning it to a client as a `PortfolioItem`. See
   [13 — Portfolio domain](./13-portfolio-domain.md).
