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

### Content finding to raise
- The live taxonomy has a **"Caste"** category (7 tags). `/allfilms` renders one public
  filter per category, so visitors can filter weddings by caste. Needs a decision before
  Phase 3 migrates categories into tag groups.
