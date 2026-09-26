# Admin control over the public site — progress

Plan: `~/.claude/plans/1-i-have-to-smooth-meerkat.md` (approved). Phases 0–7.

## Environments

| | Database (cluster0) | `STORAGE_KEY_PREFIX` | Storage behaviour |
|---|---|---|---|
| **Production** | `test` | unset | normal |
| **Local development** | `weddingboys_dev` (copy of production) | `dev` | new files under `dev/`; production files can never be written or deleted |

Every process prints its database and storage mode on start:
`[env] database "weddingboys_dev" · storage guarded (dev/)`.

**Point local back at production** (only if ever needed, and never with the guard off):
remove `/weddingboys_dev` from `MONGO_URI` in `Backend/.env`. The startup banner warns
about inconsistent combinations.

**Fresh rehearsal copy** for any migration:
`node scripts/cloneDatabase.js --from=test --to=rehearsal_<n> [--dry-run]`.
Work queues (`mediajobs`, `uploadsessions`) are not copied, so a worker attached to a copy
can never pick up production's pending jobs.

## Log

### Phase 0.1 — development separated from production
- Found: local `Backend/.env` had no database name, so it used cluster0's default `test` —
  the production database. Every local admin action had been a production write.
- Production is small: 4 MB, 11 weddings, 36 portfolio items, 59 media records.
- `weddingboys_dev` created with `scripts/cloneDatabase.js` (verified: every copied
  collection's count matches production). A second run correctly refuses a non-empty target.
- The one R2 bucket is shared, and the dev copy's Media records point at production objects,
  so a dev "purge" would have deleted real photographs. `Services/storageGuard.js` now
  prefixes every new key with `dev/`, **throws** on any write outside it, and **refuses** any
  delete outside it (R2 and legacy S3). Production leaves the variable unset — unchanged.
- The guard reads the environment on every call, not at import: ES module imports are
  hoisted, and a value captured before `dotenv` runs would disarm it silently.

### Phase 0.2 — data-loss paths closed
- **Legacy client editor retired.** The four routes in `Routes/Admin/clientQueryRoute.js`
  that ran `syncClientPortfolio` — which deletes every wizard upload for that wedding —
  now answer `410 Gone` and log each hit. No frontend called them. Done at the router,
  so `ClientController.js` (which holds uncommitted work) was not touched; the dead
  controllers go in the Phase 1 clean-up.
- **Bulk tag save retired** (`PUT /api/admin/tags` → 410). New additive
  `POST /api/admin/tags/:tagType/terms {label}`: normalises spacing, rejects commas,
  and refuses a case-insensitive duplicate in ANY category (409 names where it lives).
  Tested on dev: new term 200, case variant 409, cross-category duplicate 409, unknown
  category 404, empty/comma 400.
- **Backfill is create-only.** Editorial fields are `$setOnInsert`; link fields refresh
  only with `--refresh-links`; `timestamps:false`. Proven on dev: an admin edit to tags,
  status, hero and priority survives both a re-run and `--refresh-links`, and a plain
  re-run changes 0 documents and 0 `updatedAt` values. (Two test runs before the
  timestamp fix bumped `updatedAt` on 33 legacy items — dev copy only.)
- **`--verify` by id:** dev shows 33 embedded subdocs → 33 items, missing 0, plus
  **3 wizard-created items** that the old count check would have called "drift".

### "Caste" category — corrected and renamed
- First reported as a caste filter. **Wrong:** the category is *named* "Caste" but holds
  religions — Hindu, Muslim, Sikh, Christian, Jain, Buddhist, Parsi — carried by 31 of 36
  published items. Couples legitimately search for a filmmaker who knows their tradition,
  so the owner chose to **rename it "Tradition" and keep it public**.
- `scripts/renameTagCategory.js --from=Caste --to=Tradition [--dry-run]`: one document
  (items store the tag strings, never the category name), idempotent, refuses to merge
  into an existing category. Done on dev. **Production: run by the owner** with
  `MONGO_URI=<production uri> node scripts/renameTagCategory.js --from=Caste --to=Tradition`
  (dotenv does not override a variable already set on the command line).

### Owner WIP committed (`748b637`)
The owner's ~1,220 lines of in-progress admin work, committed unmodified at their request.
It compiled; it carried 4 new `react-hooks/set-state-in-effect` lint errors and the Draft
cascade below.

### Phase 0.3 — hand-picked posters can no longer be overwritten
- New `Services/portfolioRender.js`: one `renderFromMedia` builder and one writer,
  `syncRenderForMedia`, used by the worker, the controller, the backfill (its private
  duplicate removed) and `scripts/syncPortfolioRenders.js` (now with `--dry-run`).
- The worker had done `$set: { render }` on every item using a file, replacing a
  hand-picked poster with the auto frame. The writer now refreshes everything except
  `posterUrl` on items that have their own `poster`.
- Measured on the production snapshot: 6 films have a hand-picked poster, all 6 intact
  (the risk was latent). After a full `syncPortfolioRenders` run on dev: still 6/6.

### Phase 0.4 — the Draft cascade removed
- `clientProfileController.js` no longer sets every item to Draft when a wedding is
  unpublished (that erased which items were hidden on purpose, and the next publish
  exposed them). Proven on dev: PATCH a published wedding to Draft → its 3 items stay
  Published.
- The two "Unpublish" buttons are withheld until Phase 2: the wedding's own status is not
  a public gate yet, so they would have said "unpublished" while everything stayed live.
  Meanwhile work is hidden per item (workspace › select › Hide).

### Phase 0.5 — Add Wedding and the wedding workspace tell the truth
Wizard (`clients/new`):
- **No duplicate weddings.** Once the client exists, Back → Continue sends a PATCH (button
  reads "Save & Continue"); a 404 there means the draft was deleted elsewhere and the next
  press creates it afresh.
- **Detail edits are debounced** (600 ms after the last keystroke, latest edit per item) and
  flushed when the panel closes, before Save-as-draft / Publish, and on leaving the page.
  Measured: 14 keystrokes → 1 PATCH.
- **Every save checks the response and stops at the first failure.** Offline Publish now
  shows an error, sends one request, and stays on the page (it used to toast success and
  navigate away). A failed detail save keeps the edit queued for the next flush.
- **Discard honours "purge files"** (`?purge=true`).
- **Map pin: both coordinates numeric and in range, or no pin** — in the browser
  (`clients/_lib/mapPin.js`) and in the API (400). Blank fields used to pin at (0, 0).
- Priority / hero-priority inputs removed from the details panel: they were never sent.
  Films are no longer hero by default (the first film of every upload batch used to join
  the home hero).

Workspace (`clients/[id]`):
- **Its header buttons were invisible** — Add media, Edit couple & map pin, Publish
  showcase, Delete. `PageHeader` rendered only an `actions` prop and four pages passed
  `children` (also: clients list, users, films settings). It now renders either.
- New `GET /api/admin/clients/:id` returns the profile **with its map pin**; the edit form
  starts from it, and a save sends pin fields only if the admin touched them, so a rename
  can no longer drop the pin. PATCH returns the pin too. The hook no longer uses the legacy
  `GET /api/admin/client/:id` (now unused; deleted with the legacy code in Phase 1).
- Polling only while something is Processing (it polled forever whenever a Draft existed),
  8 s easing to 60 s, stopping after 15 minutes.
- Publish stops if the bulk update or the wedding update fails.
- **Delete never forces itself.** When published work would be pulled, the server's 409
  turns the modal into "type the couple's names" (clients list and workspace alike).
  Verified in the browser: button disabled until the names match; case and spacing ignored.

Lint: the owner-WIP `set-state-in-effect` errors are fixed (wizard, VideoUploadModal ×2,
EditDrawer, DeleteClientModal). Dead `Component/VideoDetailsForm.jsx` and
`PhotoDetailsForm.jsx` deleted (no importers).

Found, not fixed here: 2 of dev's 3 map pins belong to clients that no longer exist —
added to the Phase 1 cutover report; the map itself is retired in Phase 7.

### Phase 1 (preparation) — the v2 read path made complete; cut-over tooling
Flag still off in production: no visible change until `PORTFOLIO_READS=v2` is set.
Runbook and rehearsal results: `PORTFOLIO-CUTOVER-RUNBOOK.md`.

- **v2 responses carry what the pages read.** `photos[].photoMetaData.url` (film page
  gallery) and `thumbnailMetaData.url` (recommended strip, map) were missing, so v2 would
  have shown broken images. Detail and recommended dates use the legacy "September 2024".
- **v2 branches for `/api/home/sample-photos` and `/api/map-clients`**, which had none,
  so wizard weddings could never reach the home grid or the map. The home grid keeps the
  legacy pick (lowest `generalPriority` first, 8).
- **Malformed ids → 404 on both paths.** The film detail route had no try/catch, so a bad
  id hung the request (Express 4 does not catch async errors).
- **Legacy bug fixed:** a film page showed the date of its wedding's last other film
  (`selectedVideo.videoShootDate` was overwritten inside the siblings loop). Found by parity.
- Hero ties are broken by `_id`, so equal priorities keep one order.
- `scripts/lib/runLog.js`: the shared `--dry-run | --apply | --verify | --rollback=<runId>`
  contract. The backfill now follows it — **a bare run is a dry run** (it used to write) —
  and records what it creates or re-links. Rollback deletes created items unless their
  editorial fields changed since (then kept and listed), and restores replaced links.
  Tested on a production copy: create 2 → edit 1 → rollback deleted 1, kept 1; a second
  rollback is refused; re-link rollback restored the prior poster.
- `scripts/cutoverReport.js` (read-only, exit 1 on blockers), `scripts/parityCheck.js`
  (two servers, every endpoint and media URL), `Next-Frontend/scripts/checkSitemapUrls.mjs`
  (checks the API behind client-rendered film/photo pages).
- Rehearsal on a fresh production copy: **0 blockers; parity nothing broken** (80 checks,
  6 film pages, 27 photo pages, all media URLs load); differences are only tie orders.
  The copy was dropped afterwards.
- Acceptance on dev (v2): the wizard film appears in `/allfilms` and its "Beach" row; its
  page has the video, date and 2 gallery photos with URLs; its photos reach the home grid.
  Browser: a legacy film page (Anshu & Abhishek) rendered from v2 with no broken content.

Found:
- **Production is served by the older SPA**, whose admin uses the legacy client and tag
  editors retired in 0.2 → deploying this backend removes wedding/tag editing from the old
  admin. Deploy the Next frontend with it (runbook §0).
- Company logo points at a deleted media record (file 404) — owner re-uploads.
- 20 published photos have Archived media records; files still served.

### Phase 2 — publishing lifecycle and instant refresh
One public rule (`Services/portfolioVisibility.js`): an item is public when its own
`status` is Published (admin intent), its wedding is Published (`clientStatus`, copied)
and its file is ready (`mediaReady`). Every public finder uses `PUBLIC_GATE`; a new
`publicFeed` index serves it. The module is the only writer of the two copies:
`setClientStatus`, `markMediaReady` (called by the render sync, so by the worker),
`markMediaGone`.

- **Wedding status is a gate, not a cascade.** Unpublish → republish brings back exactly the
  previous set; an item hidden on purpose stays hidden. The old "publish sets every Draft item
  to Published" (and the `publishAllItems` flag) is gone.
- **Uploads (D7):** no status sent → into a draft wedding Published intent (live with the
  wedding); into a live wedding Draft (hidden until reviewed). Processing no longer forces
  Draft: the item goes live by itself when the worker finishes. The upload modals and the
  workspace stopped forcing a status.
- **Deleting a file in use** → `409` listing the placements (wedding, file or poster, live);
  `?force` / `{force:true}` deletes and takes those items off the site (poster placements fall
  back to the film's own frame) instead of leaving broken tiles. Media page shows the list and
  asks again; the picker refuses and points to the Media page.
- **Bulk filter whitelist:** the free-form `filter` reached Mongo as sent (`$where`, `$regex`…);
  now only whitelisted fields with plain values or `$in`. Bulk answers `nowPublic` / `waiting`.
- **Instant refresh:** `Services/revalidate.js` (2 s coalescing) → the Next route's new tag
  branch, `revalidateTag(tag, { expire: 0 })`, with **no fallback secret**. Tags: hero and
  sitemap `portfolio`, CMS pages `page:<key>` (triggered on CMS save/delete too).
- **Admin:** card chips (Live / Hidden / Processing / Processing failed / File missing /
  Wedding is draft / Wedding archived, tooltip lists every reason); header Publish wedding,
  Unpublish…, Archive… (confirm dialog with the live count); "N items hidden → Publish all N".
- `scripts/migrateVisibility.js` (contract modes; shared rules in
  `scripts/lib/visibilityBaseline.js`, also used by the backfill): weddings with no status →
  Published if they have embedded work; items copy it; readiness from render + Media;
  Add Wedding drafts in draft weddings → Published intent. Refuses if anything would become
  newly public. The cut-over report now blocks until it has run.

Verified:
- `npm test` (new `Backend/tests`, `node --test`): 9/9.
- Production copy: dry-run newly public 0, no longer public 0; apply → verify → rollback →
  re-apply; 33 public = exactly the 33 production shows; "test & test" drafts → Published
  intent, still hidden (wedding Draft). Backfill re-create gets the same fields. Copy dropped.
- Dev: migration applied (36/36 public). Acceptance script against the dev API with the
  worker running, **21/21**: draft-wedding upload reasons `wedding-draft` / `+processing` →
  worker finishes → `wedding-draft`; publish → 2 live; hide one, unpublish → gone, item status
  untouched; republish → exactly the previous set; upload into live wedding → hidden; delete
  placed file → 409 (single and batch) → forced → off the site, reason `asset-missing`;
  `$where` / `$regex` bulk filters → 400; invalid wedding status → 400. Test data removed.
- Production build on :3001: after a hero change the cached home page still showed the old
  film; after the `portfolio` revalidate the next request did not. Hero restored.
- Browser: workspace chips, menu (Unpublish/Archive) and the dialog ("5 items are live").
- Dev env: `FRONTEND_URL` + a dev-only `REVALIDATION_SECRET` added to the gitignored
  `Backend/.env` and `Next-Frontend/.env.local`.

### Phase 3 — one tag system
Three loose-string systems (the `Tags` categories, the `Ceremony` list, the hardcoded lists
in the upload modals) become one: `TagGroup` → `Tag` (collection `taxonomytags`; the default
name would have been `tags`, the old category collection), with a `TagOperation` log.
Items store `tagIds`; `tags` / `eventGroup` are label copies the server writes
(`Services/taxonomy.js`), kept one release for search and anything still reading strings.

- **Groups:** Ceremony (one per item, from the Ceremony collection), Film type (one per film,
  films only — D6), the seven old categories (same names and order), Unsorted (hidden, holds
  strings that matched nothing so no tag is lost).
- **Rules** enforced on every item write: the tag exists, fits the item's kind, and at most
  one per one-per-item group. Item writes take `tagIds` only; strings get a 400 naming the
  fix. Bulk add into a one-per-item group replaces the item's current tag; misfits are skipped
  and reported.
- **Public reads resolve `?tag=` by label, slug or old name, case-insensitively**, to ids:
  `?tag=classic`, `?tag=Cassic` and `?tag=Classic` return the same films. Search also
  matches tags by old names. New index `publicFeedByTag` (the Phase 2 `publicFeed`, keyed on
  the strings, was dropped on dev; production never had it).
- **Admin API** `/api/admin/taxonomy/*` (verifyToken scoped to that prefix): groups
  create/edit/reorder/delete-when-empty; tags create/rename/move/merge (with dry-run
  preview)/delete-when-unused/reorder; usage per tag; changes log with **Undo** (newest per tag
  first). Rename keeps the old name as an alias and rewrites the home / films row lists; merge
  folds the source's names into the target.
- **Guard while production reads legacy:** renaming, merging or deleting a tag that is in use
  answers 409 — production matches films by the tag's text, so those rows would empty.
  Creating, moving, reordering and hiding work.
- **Compatibility:** `/api/get-all-tags` answers from the taxonomy in the old shape (same
  content — /allfilms filters unchanged); `/api/ceremonies` answers from the Ceremony group and
  no longer writes on GET; the old category/term/ceremony writes answer 410 once the taxonomy
  exists; page-row setters refuse a row naming no tag. New public `GET /api/tags`.
- **Admin UI:** Settings › Portfolio Tags (`TagsSettingsTab`) replaces the category editor and
  the Ceremonies tab (old URLs redirect); shared `TagPicker` + `Hooks/useTaxonomy.jsx` in the
  edit drawer, the wizard's details panel and the workspace bulk bar (tag / ceremony by id,
  "No ceremony"). Upload modals keep their UX but take their lists from the taxonomy and send
  ids; the video modal splits Film type from Ceremony; typed new tags land in Unsorted.
  Removed hardcoded lists: `CEREMONY_PRESETS`, `DEFAULT_VIDEO_CEREMONIES`, `TAG_PRESETS`,
  `DEFAULT_CEREMONIES`, the details-panel fallback. The Settings tab state now comes from the
  URL (fixes a set-state-in-effect lint error there).
- **Migration** `scripts/migrateTagsToTaxonomy.js` + `tag-migration-map.json` (typo merges,
  where each old ceremony/film value goes, the film types): reports near-duplicates, Unsorted
  strings, page rows; refuses if a row would match no tag. Backfill tags new items by id
  (category before a same-named ceremony). Cut-over report blocks until it has run.

Verified:
- `npm test`: 13/13 (new taxonomy tests found a real bug: a leading `#` survived when the label
  started with spaces).
- Dev: dry-run → apply → verify → rollback → apply (10 groups, 68 tags, 36 items; "Cassic" →
  Classic kept as an alias; Bride/Portraits/Baraat/Rituals from wizard tests → Unsorted).
- Dev API acceptance, **33/33**: usage counts equal `countDocuments({tagIds})`; shims identical
  to the old data; `?tag=Cassic|classic` = the Classic set; two ceremonies → 400; film type on
  a photo → 400; tag strings → 400; bulk ceremony replaces; rename "Garden" → home row title
  follows, same films, old name resolves, copies rewritten; duplicate / comma → 409 / 400;
  merge preview + merge + undo restores exactly the source's items and the target's aliases;
  undo rename; used tag and row tag cannot be deleted; unknown row → 400; old ceremony write →
  410; on a legacy-mode server a used tag's rename → 409, an unused one works.
- Browser: the tag manager (usage, row badges, merge preview, changes with Undo); the drawer's
  picker shows the item's tags in every group it can use. `next build` passes.

Found, not fixed: the edit drawer requests `GET /api/admin/media/:mediaId`, a route that does
not exist (404 each time; it falls back to the item's populated media).

### Phase 4 — Add Wedding finished, story pages, films by link
**Model.** `Client`: `slug` (unique, sparse) + `slugHistory`, `location` {city, citySlug, state,
country, venue}, `cover`, `featured`, `story` {intro, enabled}, `createRequestId` (idempotent
create); `require` → `required` on the names (0 weddings lacked one, prod and dev).
`PortfolioItem`: `order`, `pendingMedia`, `location.citySlug`, `external` {provider, url,
videoId, title, posterUrl, durationSec}, `render.embedUrl`.

**Backend.**
- Create saves city / venue / state, makes a "bride-groom" slug (then -year, -2…; reserved words
  refused) and returns the same wedding for a repeated `createRequestId`. Edit changes slug
  (old one kept as a redirect; taken → 409, malformed or reserved → 400), location, story,
  cover (must be its own item), featured.
- `GET /api/admin/clients/:id/readiness` — the Review & publish checklist: what goes live now,
  what follows when processed, blockers vs warnings. `POST …/order` — the drag order.
- `POST /api/admin/portfolio/external` — YouTube / Vimeo by link (D8): parsed on the hostname
  (look-alikes refused), oEmbed for title / poster / duration, youtube-nocookie and Vimeo `dnt`
  embeds; ready at once; same video twice → 409.
- Poster from one of the wedding's photos (`POST|DELETE …/:id/poster`, a ~1280px variant with
  its own immutable key); replace file (`POST …/:id/replace`) — a still-processing file waits in
  `pendingMedia` and the render sync swaps it in when ready.
- New items append to the wedding's order and carry `citySlug`. `hasRender` accepts embeds.
- Public `Routes/User/weddingRoute.js` (mounted above `clientEnquiryRoute`):
  `GET /api/weddings[?city]`, `GET /api/weddings/:slug` (ceremony groups in tag-manager order,
  items in admin order, "More moments" last; crew; related — same city first; old slug →
  `redirectTo`), `GET /api/weddings/:slug/status` (for the proxy). Shared shapes in
  `Services/cards.js`. Film and photo detail responses carry `wedding` {href} when the story is
  public. Wedding cards fall back to the first shoot's month when the wedding has no date.
- `scripts/backfillClientProfiles.js` (contract modes): slugs, city/venue/state from items,
  cover, story on, today's feed order for never-ordered weddings; syncs the unique index.

**Admin.** Wizard: city/venue saved, slug shown, create-request id, "Add by YouTube / Vimeo
link", Review & publish checklist before Publish; "Reset & Start Fresh" now also forgets the
wedding it was editing (it used to rename that draft on the next Continue). Modals: prefilled
with the wedding's date, city, venue (and the ceremony being viewed); "Retry N failed", results
accumulate across retries; the video modal's Film type and Ceremony are separate choices.
Workspace: profile gains city/venue/state, story address, intro, story on/off; Publish through
the checklist; Add film by link; View story page; Set as cover (+ Cover badge); **Arrange**
(framer-motion Reorder per ceremony, in tag-manager order); the grid lists in story order; the
ceremony filter no longer shows four hardcoded empty ceremonies. Drawer: "On the site" —
every reason an item is not shown, poster from the wedding's photos or back to the film's own
frame, replace file, YouTube / Vimeo preview.

**Public.** `/weddings/story/[slug]` (server-rendered, cached with the `portfolio` tag; the
owner chose **Editorial chapters**): full-bleed cover with the couple, place and dates on a hero
scrim; intro and gold rule; the films (lead film plays in place, YouTube / Vimeo load only on
press, others open in the lightbox); one chapter per ceremony, numbered because the ceremonies
are a real sequence, opening photograph in the arch; crew; more weddings; enquiry panel.
JSON-LD `ImageGallery` with `VideoObject`s (`<` escaped). `/weddings` index with city filter.
Sitemap lists `/weddings` and every story. `story` reserved in `getLocationBySlug`. The film
lightbox and hero play embeds; the film page plays embeds, links "See the full wedding" and
shows "More from this wedding"; the photo page links the story too.
**Status codes:** the (site) loading UI makes pages stream with 200 before they run, so
`notFound()` / `permanentRedirect()` could not set a status (Next docs, loading.md). The proxy
now asks `/status` first (30 s memo, 1.5 s timeout, falls through on error): missing → real
404 with the not-found page, old slug → real 308.

**Verified.**
- `npm test`: 20/20 (video-link parsing and look-alike refusal, embeds, slugs, locations, crew,
  card date fallback).
- Dev: profile backfill dry-run → apply → verify → rollback → apply (11 slugs, cities, covers).
  Found and fixed on the way: the story endpoint's filter spread overwrote the requested slug
  (any story matched), and rollback could not read dotted fields.
- Dev API acceptance, **33/33**: idempotent create, slug and location, append order, link film
  (look-alike 400, duplicate 409, ready at once), readiness, order and cover (foreign items
  400), poster set / reset, replace (and refused on a link film), draft → no story, publish →
  groups Haldi, Mehendi, More moments in order, embed, cover, city listing, film → story link,
  slug change with redirect, taken / malformed / reserved slugs, story off → 404 and no link.
- Plan acceptance (dev, browser + API): **Aisha & Rahul**, Udaipur, The Leela — 6 photos
  (Haldi ×2, Mehendi ×2, Wedding / Pheras ×2), an uploaded film and a YouTube link; cover and
  Haldi reordered; the checklist said "processing: 1" (7 of 8 live now); published from the
  dialog; the worker finished and the film went live by itself; `/weddings/story/aisha-rahul`
  shows both films and three ceremony groups in the arranged order, server-rendered (the HTML
  carries the names and chapter headings); old slug `aisha-rahul-2025` → 308; unknown → 404;
  story off → 404; film page links to the story. Desktop and 390 px: no horizontal overflow,
  no broken images except the already-known deleted company logo. `next build` passes.
- "Aisha & Rahul" is left on dev (placeholder photos, a 4 s test film, a YouTube link) to look at.

Not done from the plan, noted: the film page is still one client component (it was to be split
into a server page for SEO); its new parts use design tokens but the page itself is the old style.

### Phase 5 — rows: rule + pins (collections)
**Model** `Collection` {key (immutable), title, subtitle, kind, rule {enabled, tagIds, match
any|all, excludeTagIds, clientIds, citySlugs, shootDateFrom/To, maxPerWedding}, sort
newestShoot|newestPublished|featured, limit 1–60, pinned (ordered), hidden, dedupe, status,
system}. `PortfolioItem.spotlight` (0–100) drives the "featured" sort.

**Resolver** `Services/collectionResolver.js` — the admin preview and the public site use the
same code: pins in order (non-public pins skipped with their reasons) → rule over the public
gate, excluding hidden, pins and (dedupe) what earlier rows on the page showed → sort with
fixed tie-breakers ending in `_id` → per-wedding cap (pins count) → limit. Candidates are read a
page at a time, so a full row stops reading. `explain` lists what is not shown and why
(hidden in row, wedding cap, pinned beyond limit, shown earlier, not public + the item's
reasons, wrong kind, deleted). Hero status plays no part in any row's order.

**API.** Admin `/api/admin/collections` (list with thumbnails and counts; get with preview;
live preview of an unsaved draft; create; edit; delete — system rows refused; pin at index /
unpin / hide / unhide; reorder pins) and `/api/admin/portfolio/:id/placements`. Public
`/api/collections/:key` and `/api/collections?keys=a,b,c` (a page's rows in order, dedupe
across them). Both mounted above the auth-applying router.

**Hero** is the `home-hero` collection (system, pins only): the v2 hero reads it (flag-based
until it exists); Home › Hero keeps its contract and writes the pins; editing the hero row
keeps the items' isHero / heroPriority flags in step (dropped in phase 7).
**Integrity:** deleting an item or a wedding pulls it from every row's pins / hidden; a tag
merge rewrites the rules using it (undo restores them); a tag used by a rule cannot be
deleted, and the tag manager lists those rows next to the tag.

**Admin UI.** Rows (sidebar) — list with thumbnails and "showing N of limit"; editor with
settings, the rule builder (TagPicker in a new `free` mode — a rule may ask for "Haldi or
Mehendi" —, excluded tags, cities, weddings, dates, per-wedding cap), pinned list (drag
order), search to pin, the live preview (400 ms, Pin / Unpin / Hide on each card, position
numbers) and "Not shown" with reasons; everything stays a draft until Save. The edit
drawer gains "Appears in" (rows, positions, pinned / hidden) and Spotlight.

**Migration** `scripts/migrateRowsToCollections.js`: `home-hero` (today's hero pinned in
order), one row per Home "Our films" tag and per /films tag, one per home "Our portfolio"
category; newest shoot first; create-only. Verify: hero identical; every row shows the same
items as today where today's list fits the limit, and only today's matches where it does not.

**Verified.**
- `npm test`: 29/29 (the plan's own example: limit 4 with V4 pinned → V4, V1, V2, V3; the cap
  counting pins; the limit; pins over the limit reported; paged candidates; the rule filter;
  tie-breakers).
- Dev: dry-run → apply → verify (hero 5 films same order; 8 film rows identical; photo rows
  within today's matches) → rollback (hero falls back to flags, same 5) → re-apply → verify.
- Dev API acceptance, **20/20**: draft preview; row = public API; pin to front, hide (listed
  as hidden), reorder, wrong set 400, film on a photo row 400; cap 1 per wedding; dedupe across
  two rows (and not alone); placements; a hidden item explained; hero row = /api/hero-videos;
  the old Home › Hero call reorders the row; editing the row syncs the flags; system row not
  deletable; a rule's tag not deletable; merge rewrites the rule and undo restores it. Hero
  unchanged afterwards; test rows and tags removed.
- Browser: Rows list; editor — limit 4, pinned an item from the preview (it leads,
  "4 of 4 shown · 1 pinned · 15 match the rule"), saved, public row matched; reverted after.
  A duplicate-key warning from the new sidebar entry fixed. `next build` passes.

Pages still read their tag lists; phase 6 composes them from these rows.

### Phase 6 — page composition: the customisation surface
**Drafts that cannot break the live page.** `PageContent.draft` {blocks, title, description,
savedAt/By} + `publishedAt/By`. Save Draft writes only the draft (it used to set the live page
to Draft — hiding the whole home page); Publish copies it live and clears it; Discard; Restore
defaults (adds missing default sections to the draft — defaults are no longer re-appended on
every open, so a deleted default block stays deleted). A drag in the editor no longer
auto-saves (it used to publish on every drop). The public payload never carries the draft.

**Section settings** (`Backend/Utils/sectionSettings.js`, zod): heroVideos {collectionKey},
ourFilms {heading, tabs, defaultTab}, portfolio {heading, tabs}, filmRows {rows, dedupe},
browseFilms {facetGroups, sort, pageSize}, photoGallery {facetGroups, sort, pageSize}. Every
row named must exist and be the right kind (a photo row in a film section → 400).

**Resolved pages.** `GET /api/content/:page?resolve=1` returns each section with its data
(`Services/pageComposer.js`, the same resolver as Admin › Rows), in the shapes the components
already render. `POST /api/admin/content/:page/preview` resolves unsaved settings (draft rows
included). New public `GET /api/browse` — OR within a category, AND across categories, with
per-option counts given the other selections. `/api/videos` / `/api/photos` tag filters follow
the same rule now (each added /allfilms filter used to WIDEN the results); `/api/photos` and
`findFeed` take an optional row sort.

**Public.** Home: one request (`?resolve=1`, tagged `page:home` + `portfolio`); the hero,
"Our films" tabs (switch with no request) and "Our portfolio" tabs (the hardcoded categories
are now only the offline fallback) come from the composition; `PageSections` passes
`settings` + `data`; every component keeps its self-fetch fallback. /films, /allfilms, /photos:
server pages resolve their section (`lib/pageComposition.js`) and pass it in — /films rows are in
the server HTML. With the owner's permission the three client components (their uncommitted
redesign) changed **data loading only**: FilmsClient starts from the composed rows;
AllFilmsClient takes its filter groups and page size (and sends the sort); PhotosClient takes
its chips (when groups are chosen), page size and sort. Those three files are left uncommitted
in the owner's working tree, as agreed.

**Admin.** Content editor: Live / Hidden badge, "Unpublished changes", Save Draft (safe),
Discard draft, Restore defaults; per-section settings (`SectionSettings.jsx`): row pickers in
order with Edit / New row links and live counts, default tab, dedupe, filter groups in click
order, sort, page size, "Preview what this shows". New section options for the three pages.
Home › Showcase now points to the composition and Rows; Films Page settings forwards to
`/admin/content/films`. `allfilms` reserved from the `/[slug]` CMS route.

**Migration** `scripts/migratePagesToComposition.js`: home settings from today's lists; films
rows from today's /films list; allfilms and photos created / given their section; a hidden home
page would have its blocks moved to the draft and today's fallback layout published.

**Verified.**
- Dev: dry-run → apply → verify ("every page composed, and shows today's rows in today's
  order": home tabs Classic, North India, Garden, Mangalsutra; /films the same four rows).
- Dev API acceptance, **21/21**: resolved home tabs; no draft in the public payload; draft
  never touches live; reopen shows the draft; discard; publish changes the live order; dedupe
  across /films rows (11 → 7 films, none twice); unknown row / wrong kind / malformed
  setting → 400; a removed default stays removed; restore adds it to the draft only; /allfilms
  offers every category; `?tag=North India,Classic` narrows (4 → 1), `North India,South India`
  widens. Pages restored afterwards.
- SSR: /films HTML contains the row titles and couples; `/`, `/films`, `/allfilms`, `/photos`
  200. Browser: no console errors on home, /allfilms, /photos; home tab switch makes no
  request. /films logs duplicate-key warnings from its own markup when one film is in two rows
  (as before); the new "Never show a film twice" setting removes that. `next build` passes.

Found: the dev hero row was emptied from the admin at 11:06:35 (before this phase's work);
left as is pending the owner. Owner's uncommitted `findFeedWithTotal` / paginated
`/api/videos` does not pass `sort` yet — a two-line change for the /allfilms sort setting.
