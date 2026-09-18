# 13 — Portfolio Domain Model

> This document answers the question that drove the whole refactor:
> *"In the media library we upload media and it is isolated. But what visitors
> see is client data. How do the two connect? Is this architecture correct? And
> if I want to change the films or gallery page, do I expand add-client?"*

The short answers, in order: **through a `mediaId` reference**; **the intent was
correct but two layers had been conflated into one**; and **no — you change
curation, not intake.**

---

## 1. The two layers

The single most important idea in this codebase is that a wedding film is
**two different things** that were previously stored as one:

| Layer | Answers | Collection | Owned by |
|---|---|---|---|
| **Asset** | "What file is this, and how do I serve it fast?" | `Media` | The media pipeline — R2 keys, variants, renditions, poster, blur hash |
| **Editorial placement** | "What does this mean, and where should it appear?" | `PortfolioItem` | The studio — tags, shoot date, location, priority, hero flag, credits |

Both are legitimate. The bug was never that one of them was wrong; it was that
`Client.videos[]` tried to be both, and so the media library — which only ever
produced the *asset* half — had no way to reach a public page.

```
   ┌──────────────────────────┐        ┌────────────────────────────────┐
   │         Media            │        │        PortfolioItem           │
   │  (the asset layer)       │        │   (the editorial layer)        │
   ├──────────────────────────┤        ├────────────────────────────────┤
   │ mediaId    "V7kQm2xR8bLp"│◄───────│ media    ObjectId              │
   │ cdnUrl                   │  ref   │ mediaId  "V7kQm2xR8bLp"        │
   │ imageVariants[]          │        │ kind     Video | Photo         │
   │ video.posterUrl          │        │ client   → Client              │
   │ video.webUrl / loopUrl   │        │ tags[]   shootDate  location   │
   │ blurDataURL              │        │ isHero   heroPriority          │
   │ ownerType / ownerId      │        │ generalPriority   status       │
   │ status Processing→Ready  │        │ render{} ← cached from Media   │
   └──────────────────────────┘        └────────────────────────────────┘
            ▲                                        │
            │ bytes, derivatives                     │ what the public site queries
            │                                        ▼
      worker.js (ffmpeg/sharp)          /films  /photos  /  /search-result
```

### Why `render{}` is denormalised, not joined

`PortfolioItem.render` caches the delivery URLs from `Media`. That is a
deliberate duplication. A films page is roughly 8 rows × 10 items, so a
per-row `$lookup` is 8 extra collection hits on every page load. R2 keys are
**immutable by construction**, so these cached URLs cannot silently rot — they
change only when the worker finishes or an asset is replaced, and both are
single write points that re-sync.

---

## 2. Why the old model had to change

`Client.videos[]` and `Client.photos[]` were embedded subdocuments holding raw
S3 keys. Three consequences, all measured rather than assumed:

**It could not be indexed.** Every films, gallery and search request was an
`$unwind` over the entire `clients` collection. An index on `videos.generalPriority`
cannot serve a sort applied *after* `$unwind`:

```
/api/videos?tag=Haldi  →  winning plan: COLLSCAN, keys examined: 0
```

At the target scale of ~5,200 videos that is a full collection scan per page view.

**The sort was not even guaranteed to survive.** `videoRoute.js` sorted, then
`$group`ed, then `$unwind`ed. `$group` output order is undefined in MongoDB, so
the priority ordering could be discarded before the response was built.

**Pagination was silently lossy.** The gallery sorted on `generalPriority` alone
with no tiebreaker, and 8 photos shared priority 40. Walking pages 1–3 measured:

```
legacy : 24 fetched, 20 distinct, 4 duplicates   ✖  4 photos never shown
v2     : 24 fetched, 24 distinct, 0 duplicates   ✔
```

The `_id: -1` at the end of the feed sort is what fixes this. A sort must be
**total** or pagination cannot be stable.

---

## 3. `PortfolioItem` — the schema

`Backend/Models/PortfolioItem.js`. One document per film or photograph.

```js
{
  kind:   'Video' | 'Photo',      // one collection, discriminated
  client: ObjectId → Client,

  // the asset
  media:   ObjectId → Media,      // authoritative reference
  mediaId: String,                // mirrors Media.mediaId (nanoid)
  poster / posterMediaId,         // OVERRIDE only — default is the worker's frame

  // editorial
  title, caption, tags: [String],
  shootDate: Date,                // unified videoShootDate / photoShootDate
  location: { country, state, city, venue },
  isHero: Boolean, heroPriority: Number, generalPriority: Number,
  status: 'Draft' | 'Published' | 'Archived',
  credits: [{ name, role }],      // behind-the-scenes crew

  clientNameText: String,         // denormalised so search matches couple names

  render: { posterUrl, blurDataURL, dominantColor, aspectRatio, width, height,
            imageUrl,                          // Photo
            loopUrl, webUrl, sourceUrl, durationSec,   // Video
            syncedAt },

  legacy: { subdocId, source, s3Key, thumbnailS3Key },   // the cut-over bridge
}
```

Videos and photos share **one** collection because search, the map's
representative-media pick, and the cross-client admin view all read them
together. Splitting them would mean duplicate indexes and a `$unionWith`.

### Two field notes that will bite you if missed

- **`poster` is an override, not the poster.** The normal poster is the frame
  the ffmpeg worker extracted (`Media.video.posterUrl`). This field exists only
  because the studio hand-picked thumbnails historically and discarding them
  would visibly change every film card.
- **`generalPriority` defaults to `0`, not a random number.** The old schema
  used `Math.floor(Math.random() * 100)` as a default, which Mongoose evaluates
  **once at module load** — so every document created in a single process run
  shared one priority value.

---

## 4. Indexes — and the evidence for them

```js
feed         { kind, status, isHero:-1, heroPriority:-1, generalPriority:-1, _id:-1, tags }
byClient     { client, kind, isHero:-1, heroPriority:-1, generalPriority:-1 }
hero         { isHero, heroPriority:-1 }         partial: { isHero: true }
byMedia      { media }                            sparse
legacySubdoc { legacy.subdocId }                  unique, sparse
legacyKey    { legacy.s3Key }                     sparse
tagOverlap   { tags, kind, status }
adminList    { status, updatedAt:-1 }
```

**`tags` comes last in `feed` on purpose.** In a compound multikey index the
sort keys must precede the array field, or the index cannot serve the sort.

**The benchmark that justifies the refactor.** At 30 documents the planner picks
`tagOverlap` and adds a blocking SORT — which is fine and proves nothing. Seeded
to the real target scale of 24,000 items / 4,800 videos:

| | Old (embedded) | New (`PortfolioItem`) |
|---|---|---|
| Plan | `COLLSCAN` | `IXSCAN` on `feed` |
| Index keys examined | 0 | matches returned |
| Blocking sort | yes | **none** |
| Docs examined for a 10-item page | whole collection | **10** |
| Time | grows linearly | **0–3 ms** |

Test at scale, not at seed size — a 30-document collection will happily hide a
collection scan.

### There is deliberately no text index

The app connects with `serverApi: { version: '1', strict: true }`
(`Config/DBconnection.js`). **`$text` is not part of MongoDB's Stable API and is
rejected under `apiStrict` no matter what indexes exist.** Search is therefore an
escaped-regex `$or` over `tags`, `clientNameText`, `title`, `caption`,
`location.city`, `location.state` — which is exactly why those fields are
denormalised onto the item.

The pattern is escaped (`q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')`) so a visitor
cannot inject a catastrophic-backtracking expression, as they could against the
old `new RegExp(query, 'i')`.

> This is not a downgrade. The legacy search matched **tags only**, so a couple's
> name or a city returned nothing at all. `Shreyas`, `Bhavika` and `Jammu` now
> return results; before, they returned zero.

---

## 5. How content gets in — three doors

```
 ┌── A. add-client ─────────────┐   intake: create client + upload + place,
 │   /admin/website-setting/    │   all in one flow. Still the fastest path
 │        add-client            │   for a new wedding.
 └──────────────┬───────────────┘
                │
 ┌── B. media library + assign ─┐   upload now, decide later. THIS IS THE DOOR
 │   /admin/media  →            │   THAT DID NOT EXIST — a library upload used
 │   /admin/portfolio "Add from │   to set ownerType with ownerId: null, an
 │    library"                  │   orphan no public page could ever reach.
 └──────────────┬───────────────┘
                │
 ┌── C. backfill ───────────────┐   one-time: existing embedded subdocs →
 │   scripts/backfill           │   PortfolioItems. Idempotent.
 │        PortfolioItems.js     │
 └──────────────┬───────────────┘
                ▼
          PortfolioItem  ──►  public pages
```

**Door B in detail** (`POST /api/admin/portfolio`): creates the `PortfolioItem`
*and* sets `Media.ownerType = 'Client'`, `ownerId = clientId` in the same
operation. That ownership move deliberately does **not** go through the generic
media `PATCH` whitelist — if it did, an admin editing alt text could silently
orphan a live item off the films page.

An asset still transcoding is saved as `status: 'Draft'` and publishes itself
when the worker produces its renditions. One asset gets one placement; a second
attempt returns **409** with the existing item's id.

---

## 6. The cut-over: dual-write, then flip reads

The migration runs on a **dual-write** model, not dual-read.

> **Why not dual-read** (this was corrected mid-flight): dual-read was first
> chosen by analogy with the S3→R2 cut-over. That analogy was wrong. S3→R2 was a
> *point lookup* — one key, one URL — which composes fine. These are
> **globally-sorted paginated feeds**. Serving page 3 from two sources means
> reading `skip+limit` from both and merging with dedup *before* the skip, and
> anything present in both duplicates or drops. That is precisely the bug class
> this refactor exists to remove.

**Writes** go to both models today. `syncClientPortfolio(clientId)`
(`Services/portfolioSync.js`) is called after every client write —
`ClientController.js:413` (add) and `:717` (update) — and reconciles that
client's PortfolioItems, including deleting items whose subdocument disappeared.

**Reads** are switched by one environment variable:

```bash
PORTFOLIO_READS=v2      # anything else = legacy embedded reads
```

Eight endpoints honour it:

| Endpoint | File |
|---|---|
| `GET /api/videos` | `Routes/User/videoRoute.js` |
| `GET /api/videos/:id` | " |
| `GET /api/videos/:id/recommended` | " |
| `GET /api/photos` | `Routes/User/photoRoute.js` |
| `GET /api/photos/:id` | " |
| `GET /api/photos/:id/recommended` | " |
| `GET /api/hero-videos` | `Routes/User/homePageRoute.js` |
| `GET /api/search` | `Routes/User/searchRoute.js` |

`Services/portfolioService.js` holds the read layer plus **legacy adapters**
(`toLegacyVideoRow`, `toLegacyPhotoRow`, `toLegacyHeroSlide`) which reproduce the
old response shapes field for field. That is why the flag needs no frontend
change and why rollback is one variable. Those adapters are the **only** code
that knows the old field names, and they are what should be deleted once the
frontend consumes `PortfolioItem` directly.

### Existing URLs are preserved

`/films/:videoId` and `/photos/:photoId` use the **subdocument `_id`**, and those
URLs are already in the sitemap. A pre-flight check confirmed **zero duplicate
subdocument ids**, so the backfill reuses the subdoc `_id` as the
`PortfolioItem._id`. Every published URL keeps resolving with no redirect table.
`findById` also matches `legacy.subdocId` as a safety net.

Breaking those URLs would forfeit the SEO this entire migration exists for.

---

## 7. How to change what the public pages show

**This is the part that replaces "expand add-client".** The films and gallery
pages are *queries*, not hand-built lists:

```
public /films row  =  WebsiteSetting.filmsPageVideoTags   (which rows exist)
                   ×  PortfolioItem.tags                  (what lands in a row)
                   ×  generalPriority                     (order within the row)
```

So there are exactly two knobs, and neither is in add-client:

| I want to… | Where | Endpoint |
|---|---|---|
| Add/remove a **row** on `/films` | `/admin/website-setting/films` | `POST /api/admin/filmpage/tags` |
| Add/remove a **row** on `/photos` | *(no screen yet — API exists)* | `POST /api/admin/photopage/tags` |
| Change **which items** are in a row | `/admin/portfolio` — filter, select, add/remove tag | `PATCH /api/admin/portfolio/bulk` |
| Change **order** within a row | `/admin/portfolio` — priority ±10, or edit one item | `PATCH /api/admin/portfolio/bulk` |
| Change the **homepage hero** | `/admin/portfolio` → *Hero carousel* | `POST /api/admin/portfolio/hero` |
| Hide something without deleting it | `/admin/portfolio` — set status `Draft` | `PATCH /api/admin/portfolio/bulk` |

**add-client keeps its job** — intake for a new wedding. It is no longer the only
door, and it no longer owns curation.

---

## 8. Admin API reference

All under `Routes/Admin/portfolioRoute.js`, all behind `verifyToken`.

| Method | Path | Notes |
|---|---|---|
| GET | `/api/admin/portfolio` | Filters: `kind`, `client`, `tag`, `isHero`, `status`, `q`, `untagged`, `missingMedia`, `page`, `limit`, `sort` (`priority`\|`recent`\|`shootDate`). **No status filter by default** — an admin list that hides Drafts is how you fail to notice an item stuck mid-transcode. |
| POST | `/api/admin/portfolio` | Assign a Media asset to a client. `409` if that asset already has a placement. |
| PATCH | `/api/admin/portfolio/bulk` | `{ ids[], set{}, tags:{add,remove,replace}, shiftPriority }`. Max 500 ids. |
| POST | `/api/admin/portfolio/hero` | `{ ids[] }` — replaces the **whole** hero set, in order. |
| PATCH | `/api/admin/portfolio/:id` | Whitelisted fields only. |
| DELETE | `/api/admin/portfolio/:id` | `?releaseMedia=true` returns the asset to the library. **Never deletes bytes.** |

Two safety properties worth keeping if you extend this:

- `/bulk` and `/hero` are routed **before** `/:id`, or Express matches them as an id.
- A filter-wide bulk write (`all: true`) requires a matching `expectedCount` and
  returns `409` if reality disagrees — so a mistyped filter cannot silently
  rewrite the collection.

### Why the hero set is a whole-set replacement

The old model appended per client into `WebsiteSetting.heroVideos[]`. Editing one
client did `$set: { heroVideos: [...] }` with only *that* client's entries,
**wiping every other client's slides** — and with `upsert: true` on a filter that
matched nothing, it could create a *second* `WebsiteSettings` document while
every reader used `findOne()`, silently forking site config.

Expressing the carousel as one ordered set removes that entire bug class instead
of patching it.

---

## 9. Client identity and rollups

`Client` holds identity only — the two names. Everything else about a wedding is
its `PortfolioItem`s.

| Method | Path | Notes |
|---|---|---|
| POST | `/api/admin/clients` | Create the entity alone, no media. The wizard's step 1 |
| PATCH | `/api/admin/clients/:id` | Rename, and set/move/clear the map pin |
| GET | `/api/admin/clients/:id/stats` | One client's rollup |
| GET | `/api/admin/clients` | The list, each row carrying the same rollup |

`Services/clientStats.js` backs both the list and the single-client view, so a
card and the workspace it opens can never disagree. Counts come from one `$group`
on `PortfolioItem`; **storage has to come from `Media`**, because `PortfolioItem`
carries no size field at all — read off the existing `{ownerType, ownerId}`
index, matching `ownerId` as a **string** (that is how it is written).

A rename also rewrites `clientNameText` on every one of that client's
placements, since it is denormalised there for search.

### The map pin

`mapDisplayClient` is written with a scoped `$pull` then `$push`, never a
read-modify-write, and never with `upsert`. The previous helper appended
unconditionally, so re-saving a client added a **second** pin for the same
couple, and no client screen could move or remove one. Verified: three re-saves
leave exactly one pin, and `websitesettings` stays a single document.

---

## 10. The `/admin/portfolio` screen

`Next-Frontend/app/admin/(dashboard)/portfolio/` — sidebar: **Asset Studio →
Portfolio Curation**.

```
page.jsx                    filters, grid, bulk toolbar, load-more
Hooks/usePortfolio.jsx      data layer (fetch / patch / bulk / hero / assign / remove)
_components/
  PortfolioCard.jsx         thumbnail, hero + status badges, tag chips, select
  EditDrawer.jsx            one item: tags, date, location, priority, credits
  AssignModal.jsx           library assets → client, reports per-file results
  HeroManager.jsx           ordered carousel list, reorder, save as a set
```

Cross-client by design: filter by kind / client / tag / status / hero, select
many, then add or remove a tag, shift priority, publish or hide — one call
instead of opening each client in turn.

Two filters exist because the data showed they were needed: **Untagged —
invisible on the site** (an item with no tags matches no row and is unreachable),
and a card badge for a placement whose asset row is missing.

Two implementation notes for whoever edits this next:

- `EditDrawer` is mounted with `key={item._id}`. That remount is what resets the
  form. Copying props into state from an effect would render one frame of the
  *previous* item's values.
- Clearing the selection lives in the filter **event handlers**, not an effect on
  the query object — a bulk edit must never target rows the current filter no
  longer shows.

---

## 11. Where each screen fits


| Screen | Question it answers |
|---|---|
| `/admin/website-setting/clients` | *Which weddings do we have, and how much work is in each?* |
| `/admin/website-setting/clients/[id]` | *Everything for this one wedding* — profile, stats, its grid, uploads |
| `/admin/portfolio` | *What appears on the films and gallery pages?* — cross-client curation |
| `/admin/website-setting/add-client` | Intake for a new wedding |

The workspace grid is `GET /api/admin/portfolio?client=<id>` — literally the
curation screen filtered — so the two cannot drift.

---

## 12. What is deliberately not in this model

- **Per-page hand-picked ordering.** Rows are tag queries. If you need a
  hand-ordered row, add a tag for it rather than a new ordering mechanism.
- **Replacing the `Tags` string vocabulary** with referenced documents. The
  string arrays are adequate; see the known issue in
  [12 — Environment & deployment](./12-environment-and-deployment.md).
- **Media lifecycle.** Deleting a placement never deletes bytes. Asset retention
  stays with the media library (`Archived` + `deleteAfter`).
