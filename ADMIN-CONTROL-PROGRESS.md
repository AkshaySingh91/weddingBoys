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
