# Portfolio cut-over runbook (Phase 1)

Switches the public site from the arrays embedded in each wedding (`Client.videos/photos`)
to `PortfolioItem`, the store the admin writes. Until this is done, **any wedding added
through Add Wedding is invisible on the live site.**

The switch is one environment variable, `PORTFOLIO_READS=v2`, on the backend. It is
reversible by unsetting it **only until the first admin edit made after the switch**
(from then on the embedded arrays go stale). Write down when that first edit happens.

All commands run from `Backend/`. Production steps are for the owner.

---

## 0. Decide first: which admin will you use after the deploy?

`theweddingboys.in` is still served by the **older single-page frontend**, not the Next
app (`/sitemap.xml` returns the home page HTML). Its public pages read the same API fields
the Next pages read, so the parity check below covers them.

**Its admin panel is the problem.** Its client editor calls
`PUT /api/admin/client/:id/save-details` and `…/validate-details`, and its tag screen calls
`PUT /api/admin/tags`. Phase 0.2 retired those routes (`410 Gone`) because they deleted
every wizard upload and overwrote tags. Once this backend is deployed, the old admin
**can no longer edit weddings or tags.** Everything else in it keeps working.

Choose one:

- **Deploy the Next frontend with the backend** (recommended). The new admin replaces the old
  one and the public site picks up the redesign at the same time.
- **Deploy the backend alone**, and make wedding and tag edits only from a locally run Next
  admin until the frontend ships.

## 1. Before the day

1. Deploy the backend **without** setting `PORTFOLIO_READS`. Nothing changes for visitors:
   the new code only adds fields, fixes two bugs on the old path (below) and adds v2 branches
   that stay off.
2. Back up: `mongodump --uri="<production uri>" --db=test --out=backup-1-$(date +%F)`.
   Keep it for 90 days.
3. Rehearse on a fresh copy (reads production, writes only the copy):
   ```sh
   node scripts/cloneDatabase.js --from=test --to=rehearsal_1 --verify
   export MONGO_URI="<cluster uri>/rehearsal_1?…"
   node scripts/backfillPortfolioItems.js --dry-run
   node scripts/backfillPortfolioItems.js --apply          # prints a run id
   node scripts/backfillPortfolioItems.js --verify         # must say "missing 0"
   node scripts/cutoverReport.js                           # must say "no blockers"
   ```
4. Run two backends on the copy and compare them (both read-only, no worker needed):
   ```sh
   PORT=8081 PORTFOLIO_READS=legacy node app.js &
   PORT=8082 PORTFOLIO_READS=v2     node app.js &
   node scripts/parityCheck.js --legacy=http://localhost:8081 --v2=http://localhost:8082
   ```
   It must say **nothing broken**. It also requests every image and video URL.
5. Act on the report's **REVIEW** list in the production admin (see "Rehearsal results").
6. Drop the copy when done.

## 2. The switch

1. `node scripts/backfillPortfolioItems.js --apply` against production. Note the run id.
   `--verify` must say `missing 0`.
2. `node scripts/cutoverReport.js` against production: **no blockers**.
3. Set `PORTFOLIO_READS=v2` on the backend and restart it.
4. Smoke test: `/`, `/films`, `/allfilms`, `/photos`, five film pages and five photo pages.
   On a film page, check the gallery and "recommended" thumbnails load.
5. Once the Next frontend is live, check the sitemap (from `Next-Frontend/`):
   `node scripts/checkSitemapUrls.mjs --site=https://theweddingboys.in --api=<api origin>`.
   It checks each film and photo through the API, because those pages always answer 200.

**Rollback** (only before the first admin edit): unset `PORTFOLIO_READS`, restart. The backfill
run can also be undone with `--rollback=<run id>`; it keeps any item edited since.

**After 7 quiet days:** delete the legacy branches (`videoRoute`, `photoRoute`,
`homePageRoute`, `searchRoute`), the retired write controllers, `portfolioSync.js`,
`GET /api/admin/client/:id` and the flag itself.

---

## Rehearsal results (production copy, 26 Sep 2026)

Production: 11 weddings, 33 embedded films/photos, 36 items (3 from Add Wedding), 59 media.

**Blockers: none.** `--verify`: missing 0. Parity: nothing broken, 80 checks identical,
6 film pages, 27 photo pages, every media URL loads.

What visitors will notice:

| Change | Why | Action |
|---|---|---|
| Hero: same 4 films, different order | all four have priority 6, a tie | set the order in Admin › Hero before switching |
| "North India" row and home grid (All Work, Wedding): same items, different order | ties; the old film rows also regrouped by wedding after sorting, so their order was effectively random | none, or set priorities |
| Film pages show their **own** shoot date | the old route overwrote it with the wedding's last other film's date (fixed on both paths) | none |
| Malformed film/photo ids return 404 | they used to hang (no error handling) | none |

Found along the way (not caused by the switch):

- **"test & test"** (wedding `6ab68fad00c41bc2943cf459`, created 25 Sep before dev was separated):
  Draft, 3 draft items, one film flagged hero. It stays hidden, but **delete it** in the admin.
- **20 published photos** (Amit & Komal, Hritik & Sonam, Nehal & Rani, Aadarsh & Geet, Anshu &
  Abhishek) have their media record marked *Archived*, meaning deleted in the media library. The files
  still load and the site shows them today. Hide any that were meant to go.
- **The company logo is gone.** `companyDetails.companyLogo` points at a media record deleted in the
  media library; its file returns 404. Re-upload the logo in the admin.
- **2 of 3 map pins** point at deleted weddings (`6803e1ebc0a4da33e96554ec`, `6803e286c0a4da33e9655508`).
  They are never drawn. The map is retired in Phase 7.

## Scripts

| Script | Writes? | Purpose |
|---|---|---|
| `scripts/cloneDatabase.js` | only the target copy | fresh rehearsal copy |
| `scripts/backfillPortfolioItems.js` | with `--apply` / `--rollback` | create missing items; create-only, recorded, undoable |
| `scripts/cutoverReport.js` | no | blockers and visible changes, from the database |
| `scripts/parityCheck.js` | no | same API on both read paths, plus every media URL |
| `Next-Frontend/scripts/checkSitemapUrls.mjs` | no | every sitemap URL, film and photo lookups through the API |
| `scripts/lib/runLog.js` | `scriptruns`, `scriptrunchanges` | shared `--dry-run / --apply / --verify / --rollback` contract |
