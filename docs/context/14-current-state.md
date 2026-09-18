# 14 — Current State

**Snapshot date: 6 September 2026.** This document is the answer to *"what has
actually been completed, what is live, and what is still outstanding?"* — read it
before starting work, and update it when you finish any.

---

## 1. Status at a glance

| Phase | Scope | State |
|---|---|---|
| — | React + Vite → Next.js 16 migration | ✅ Complete, `Frontend/` deleted |
| — | SEO foundations (metadata, sitemap, JSON-LD, canonical) | ✅ Partial — see [09](./09-seo.md) |
| — | Media pipeline: R2, CDN, sharp ladder, ffmpeg worker, resumable upload | ✅ Complete |
| A | Hotfix the client write path (3 silent live bugs) | ✅ Shipped |
| B | Repair the migration's broken Media↔owner links | ✅ Shipped |
| C | `PortfolioItem` collection + backfill | ✅ Shipped |
| D | Read paths behind `PORTFOLIO_READS=v2` | ✅ **Flag ON** (6 Sep 2026) |
| E | Assign-to-client API + `/admin/portfolio` screen | ✅ Shipped |
| F | Curation plumbing (films/gallery tag rows) | ✅ Shipped |

**`PORTFOLIO_READS=v2` is now on** (`Backend/.env`, with a `.env.bak.*`
alongside it). Verified at flip time by walking every page of both paths:

```
/api/photos   legacy  20 fetched · 17 distinct · 3 duplicates   ✖
              v2      20 fetched · 20 distinct · 0 duplicates   ✔
/api/videos   legacy and v2 identical
```

Legacy was losing 3 of every 20 photos to duplicate page boundaries. Rollback is
still one line — remove `PORTFOLIO_READS` from `.env` and restart.

---

## 2. Data snapshot

```
clients          10      embedded subdocs   33
portfolioitems   33      (video 6 · photo 27 · hero 4)
media            54      (image 48 · video 6)

integrity:  embedded subdocs 33 == portfolioitems 33   ✔
            items with no linked asset                 0
            published items with no URL                0
            websitesettings documents                  1  (not forked)
```

Delivery: `/api/photos` across all 3 pages returns **27 rows · CDN 27 ·
signed-S3 0 · no-url 0**. Every asset serves from
`media.theweddingboys.in` with `Cache-Control: public, max-age=31536000,
immutable`.

---

## 3. Bugs found and fixed

Recorded because each was silent — none produced an error anyone would have seen.

| # | Bug | Consequence | Fix |
|---|---|---|---|
| 1 | `sendPutUrlsForNewClient` returned no `videoName` | The frontend matched `f.video.name === videoObj.videoName`, got `undefined`, **skipped the upload and still reported success**. DB rows would point at objects that were never uploaded. | Return `videoName`/`photoName`; make the uploader throw on an unmatched file |
| 2 | Editing a client `$set` the whole `heroVideos` array | **Wiped every other client's hero slides**; `upsert: true` could fork `WebsiteSettings` while readers use `findOne()` | Scoped `$pull` + `$push`, no upsert. Superseded by `POST /portfolio/hero` |
| 3 | `updateClientDetails` had no success response | Client edit save hung forever | Added `res.status(200)` |
| 4 | `ingestImage()` did not return `ownerType`/`ownerId` | 44 migrated images filed as `System` instead of Client/Team/Review | Return them; `scripts/backfillMediaOwners.js` re-derived owners |
| 5 | Mongoose strict mode dropped `mediaId` writes | `ClientSchema` never declared those paths, so the S3→R2 migration's Media↔Client link **was never created** | Declared the paths that survive; `PortfolioItem` replaces the rest |
| 6 | Films curator PUT to a GET-only route | **Film row curation had never worked from the admin at all** | Point at `POST /api/admin/filmpage/tags` |
| 7 | `photoPagePhotoTags` was entirely dead | Declared in the schema, no reader, no writer, no UI, not pruned on tag delete | Added reader, writer, delete-cleanup |
| 8 | `shouldVideoUpdate && shouldPhotoUpdate` | A client with only photos (or only videos) was **skipped on tag rename/delete** | Changed to independent guards |
| 9 | `/recommended` had its `$limit` commented out | Returned *every* video sharing a tag, then signed a URL for each in a serial loop — thousands of round-trips per public request | Restored the limit |
| 10 | Gallery sorted on `generalPriority` with no tiebreaker | 8 photos shared priority 40 → **4 photos never shown, 4 shown twice** | Total sort ending in `_id: -1` |
| 11 | `$text` used under Stable API `strict: true` | `$text` is not in the Stable API — **every search would 500** | Escaped-regex `$or`; text index dropped |
| 12 | 3 photos never migrated to R2 | Client added after the migration ran. No `Media` row, no CDN URL → **blank on the gallery** under v2 | Re-ran the migration + backfill |
| 13 | `clients/[id]` swallowed failed uploads | Non-2xx logged to console and resolved, so keys were persisted for objects never written. The add-client fix never reached the edit path | Throws, like add-client |
| 14 | `useMediaLibrary` used `fireMessage` without importing it | Any list-fetch failure threw `ReferenceError` inside the `try`, and the `catch` threw again — a crash, not a toast | Added the import |
| 15 | `ClientSchema` had `{ timestamp: true }` | Singular; Mongoose ignored it, so `createdAt` was never written and every client card read "Modified: today" | Fixed the key, backfilled real dates from ObjectId timestamps |
| 16 | `deleteMedia` leaked video derivatives | Removed the master and image ladder but not `video.renditions[]` or posters — a deleted film left its largest objects in R2 forever | All derived keys, deduplicated |
| 17 | `addClientInMap` appended unconditionally | Re-saving a client added a SECOND map pin, and no client screen could move or remove one | Scoped `$pull`/`$push`, no upsert |
| 18 | Media inspector was `hidden … lg:block` | Below the `lg` breakpoint, clicking an asset **did nothing at all** | A dialog that works at every width |
| 19 | `listMedia` built `new RegExp(search)` unescaped | A `(` typed in the admin search box is an invalid regex — a typo became a 500 | Escaped, like the public search |
| 20 | Video posters had no recorded size | `posterVariants` carried `bytes`, the base `poster.jpg` did not, so every video's stored total under-reported | Added `video.posterBytes`, backfilled from R2 |

---

## 4. Running it locally

Three processes. The worker is **not optional** if you upload anything.

```bash
# Terminal 1 — API on :8080
cd Backend
npm run dev                       # nodemon app.js

# Terminal 2 — media worker (ffmpeg + sharp)
cd Backend
npm run worker                    # or worker:dev for reload
brew install ffmpeg               # once; the worker needs it on PATH

# Terminal 3 — web on :3000
cd Next-Frontend
npm run dev
```

To serve reads from `PortfolioItem` instead of the embedded arrays:

```bash
cd Backend && PORTFOLIO_READS=v2 npm run dev
```

### How the worker actually works

It is a **separate process**, not a thread of the API. Upload and encoding are
decoupled through a MongoDB-backed job queue (`Models/MediaJob.js`,
`Services/mediaJobQueue.js`):

```
API      → writes Media (status: Processing) + enqueues a MediaJob
worker   → claims a job with an atomic findOneAndUpdate
         → ffmpeg / sharp → uploads renditions to R2
         → Media.status: Ready, and re-syncs PortfolioItem.render
```

Claiming is atomic and heartbeated, so a crashed worker's job is reclaimed
rather than lost, and two workers cannot take the same job. You can run zero,
one, or several. With none running, uploads simply stay at `Processing` — which
is the usual reason a freshly uploaded video has no poster.

On the Hostinger VPS, run the worker under the same process manager as the API
(a second pm2/systemd unit) and install ffmpeg on the host.

---

## 5. Scripts

All in `Backend/scripts/`, all safe to re-run.

| Script | Purpose |
|---|---|
| `migrateS3ToR2.js` | Copy legacy S3 objects into R2 and create `Media` docs. `--dry-run`, `--limit=N`, `--only=clients\|website\|team\|reviews\|admins`. Skips anything already migrated. |
| `backfillPortfolioItems.js` | Embedded subdocs → `PortfolioItem`. Idempotent on `legacy.subdocId`. Reports anomalies rather than guessing. |
| `backfillMediaOwners.js` | Re-derive `ownerType`/`ownerId` by matching `Media.legacy.s3Key` to its holder. |
| `migrateMediaStatus.js` | Normalise legacy status values. |
| `seedSuperAdmin.js` | Create the first admin account. |

**Run order after adding a client outside the app**, or if anything looks
unlinked:

```bash
node scripts/migrateS3ToR2.js --dry-run --only=clients   # inspect
node scripts/migrateS3ToR2.js --only=clients             # then commit
node scripts/backfillPortfolioItems.js                   # re-link
```

---

## 6. Cut-over runbook — flipping `PORTFOLIO_READS=v2`

The flag is off. Turning it on is the last step of Phase D.

1. **Let dual-write run.** Every client add/edit already syncs both models. Give
   it a period of real admin activity.
2. **Confirm zero drift.** `embedded subdocs == portfolioitems`, and no item has
   a null `media` or an empty `render`.
3. **Flip least-traffic-first**, one endpoint at a time if you split the flag:
   `/api/photos` → detail + recommended → `/api/hero-videos` → **`/api/videos`
   last** (it feeds the homepage, `/films`, `/allfilms` and two admin screens) →
   `/api/search`.
4. **Walk the pages**: `/`, `/films`, `/films/[id]`, `/photos`, `/photos/[id]`,
   `/search-result`. Confirm existing `/films/:videoId` URLs still resolve —
   those are in the sitemap.
5. **Rollback is one variable.** Unset it and reads return to the embedded arrays.

Expect **one intentional difference**: `/api/photos` returns *more distinct
photos* than legacy did. That is bug #10 being fixed, not a parity failure.

Afterwards (a later release, not the same one): make writes PortfolioItem-only,
freeze the embedded arrays read-only for one release, then `$unset` them and drop
`heroVideos` / `mapDisplayClient`. That last step is irreversible.

---

## 7. Known gaps and pending work

**Needs a decision or a person, not code:**

- ⚠️ **One BTS role definition is entered backwards** — `title="Ayush"`,
  `key="Video Editor"`. `title` is the role, `key` is the person. Fix it in
  `/admin/website-setting/bts-schema-manager`, then re-run
  `node scripts/backfillPortfolioItems.js`. Not auto-corrected: guessing whose
  name is whose is not the migration's call.
- **Flip `PORTFOLIO_READS=v2`** — §6.

**Built but unfinished:**

- `/api/map-clients` still reads embedded arrays and is **not** behind the flag.
  It must be migrated before the embedded arrays can be `$unset`. It also
  returns `photoMetaData` with no URL, so the map photo is currently unusable.
- **No admin screen for gallery tag rows.** `POST /api/admin/photopage/tags`
  exists and works; `/admin/website-setting/films` has no `/photos` equivalent.
- **Six legacy uploaders** still use the old presign path rather than the
  resumable uploader: `profile`, `StudioContact`, `Review`, `ReviewEdit`,
  `BtsTape`, `clients/[id]`, `add-client`.
- The `/admin/portfolio` UI has not been exercised **logged in** — its build,
  lint, routing, auth gate and every query it issues are verified, but the
  interaction layer has had no click-through.

**Efficiency, not correctness:**

- The image ladder is `640/1024/1600/2400`, but `withoutEnlargement` clamps both
  1600 and 2400 down to a 1440px source — so it writes **two byte-identical
  objects** under different keys. Currently 22 duplicates / 2.3 MB; it scales
  linearly with the library. The fix is to skip a variant whose emitted width
  matches one already written, but the key names are what
  `cloudflareLoader.js` snaps to, so the loader's `LADDER` must change with it.

**Deferred SEO** (see [09](./09-seo.md)): `BlogPosting` / `LocalBusiness`
JSON-LD · per-film `generateMetadata` with a real `VideoObject` · three public
pages still using `<img>` instead of `next/image` · Nginx 301 to the canonical
host.

**Known model issues:** `Tags` has `unique: true` on the array element, so one
tag string cannot exist under two `tagType`s · an existing video's file cannot be
replaced (only its thumbnail) · a photo's bytes cannot be replaced at all.
