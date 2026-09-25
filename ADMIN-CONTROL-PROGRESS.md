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
