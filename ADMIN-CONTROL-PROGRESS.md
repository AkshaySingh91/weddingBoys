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
