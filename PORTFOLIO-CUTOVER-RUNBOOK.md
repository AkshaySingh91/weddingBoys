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
   node scripts/migrateVisibility.js --dry-run             # NEWLY PUBLIC must be 0
   node scripts/migrateVisibility.js --apply               # prints a run id
   node scripts/migrateVisibility.js --verify
   node scripts/migrateTagsToTaxonomy.js --dry-run         # review Unsorted and the map
   node scripts/migrateTagsToTaxonomy.js --apply
   node scripts/migrateTagsToTaxonomy.js --verify
   node scripts/backfillClientProfiles.js --dry-run         # slugs, cities, covers
   node scripts/backfillClientProfiles.js --apply
   node scripts/backfillClientProfiles.js --verify
   node scripts/migrateRowsToCollections.js --dry-run       # the rows it will create
   node scripts/migrateRowsToCollections.js --apply
   node scripts/migrateRowsToCollections.js --verify        # hero identical, rows = today's
   node scripts/migratePagesToComposition.js --dry-run
   node scripts/migratePagesToComposition.js --apply
   node scripts/migratePagesToComposition.js --verify       # pages show today's rows, in order
   node scripts/consolidateHomeSources.js --dry-run         # stats once; team/reviews/BTS from their screens
   node scripts/consolidateHomeSources.js --apply
   node scripts/consolidateHomeSources.js --verify
   node scripts/seedPricingPackages.js --dry-run            # the four packages into Admin › Pricing
   node scripts/seedPricingPackages.js --apply
   node scripts/seedPricingPackages.js --verify
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
2. `node scripts/migrateVisibility.js --apply`, then `--verify`. Note the run id. **Required
   since Phase 2:** public reads need each item's `clientStatus` and `mediaReady`, so without
   this the v2 site shows nothing (the cut-over report blocks on it).
3. `node scripts/migrateTagsToTaxonomy.js --apply`, then `--verify`. **Required since Phase 3:**
   v2 rows match films by tag id. Safe to run before the switch at any time: production's
   legacy reads never look at it. (Edit `scripts/tag-migration-map.json` first if the dry run
   shows tags in Unsorted that belong somewhere.)
4. `node scripts/backfillClientProfiles.js --apply`, then `--verify` (Phase 4): gives every
   wedding a story-page slug, a city from its items and a cover; creates the unique slug index.
5. `node scripts/migrateRowsToCollections.js --apply`, then `--verify` (Phase 5): today's hero
   and rows become collections (Admin › Rows). The v2 hero reads `home-hero`, pinned in today's
   exact order; the legacy path never reads it.
6. `node scripts/migratePagesToComposition.js --apply`, then `--verify` (Phase 6): home, /films,
   /allfilms and /photos become compositions of those rows (Admin › Content), showing today's
   rows in today's order.
7. `node scripts/consolidateHomeSources.js --apply`, then `--verify` (Phase 7): the track record
   renders once (the CMS stats block, moved to just after "Our packages", in the packages' design);
   "Meet the team" and the reviews always show Team and Couple reviews; BTS photos move into the
   home "Behind the scenes" gallery. Then `node scripts/seedPricingPackages.js --apply` and `--verify`:
   the four built-in packages become editable in Admin › Pricing (skip it if someone already used
   Pricing's "Copy the site's packages"). Both only affect the Next site, so they can run any time.
8. `node scripts/cutoverReport.js` against production: **no blockers**.
9. Set `PORTFOLIO_READS=v2` on the backend and restart it.
10. Smoke test: `/`, `/films`, `/allfilms`, `/photos`, five film pages and five photo pages.
   On a film page, check the gallery and "recommended" thumbnails load.
11. Once the Next frontend is live, check the sitemap (from `Next-Frontend/`):
   `node scripts/checkSitemapUrls.mjs --site=https://theweddingboys.in --api=<api origin>`.
   It checks each film and photo through the API, because those pages always answer 200.

**Rollback** (only before the first admin edit): unset `PORTFOLIO_READS`, restart. The backfill
and visibility runs can also be undone with `--rollback=<run id>`; both keep anything edited since.

**Story pages (Phase 4)** — `/weddings` and `/weddings/story/<couple>` — read the new store
directly, whatever `PORTFOLIO_READS` says. They appear as soon as the Next frontend is deployed
and steps 2–4 have run; each needs the wedding Published, its story on, and one public item.

**Instant refresh (Phase 2).** Set on the backend `FRONTEND_URL=<the Next site's origin>` and
`REVALIDATION_SECRET=<a new random value>`, and the same `REVALIDATION_SECRET` on the Next
server. Without them, publishes still appear, just after the cache windows (hero 5 min,
home 1 min, sitemap 1 h). Note: once `REVALIDATION_SECRET` is set, the blog editor's
browser-side refresh stops working, because it sends the old public fallback secret. Blog pages
then refresh within the hour until the blog fix, which should also rotate that secret.

**After 7 quiet days (Phase 7): remove the old data.**

```sh
mongodump --uri="<production uri>" --db=test --out=backup-2-$(date +%F)
PORTFOLIO_READS=v2 node scripts/contractLegacy.js --switched-on=<YYYY-MM-DD> --dry-run
PORTFOLIO_READS=v2 node scripts/contractLegacy.js --switched-on=<YYYY-MM-DD> --apply --dump-dir=<safe folder>
node scripts/contractLegacy.js --verify
```

It removes the films and photos embedded in each wedding, `WebsiteSettings.heroVideos` and
`BtsPhotos`, and the `tags`, `ceremonies` and `sequences` collections. It refuses unless the
switch date is 7+ days ago, every embedded item has its PortfolioItem, the tag manager exists
and the BTS photos have moved. It writes everything it removes to `<dump-dir>/<run id>.json`
first; `--rollback=<run id>` restores from that file. **From then on, unsetting
`PORTFOLIO_READS` shows an empty site**, so the rollback window above is closed for good.

It keeps, on purpose: item `tags` / `eventGroup` and hero flags (read by cards and the admin, and
kept in step by the tag manager and Rows); the page tag lists (read only by the site's fallbacks
when the CMS is unreachable); the map pins (the wizard still records one); the old indexes (their
schema declarations would recreate them).

Then, in a code change rather than a script: delete the legacy branches (`videoRoute`,
`photoRoute`, `homePageRoute`, `searchRoute`), the retired write controllers, `portfolioSync.js`,
`GET /api/admin/client/:id`, the old models and indexes, and the flag itself. That is left for
after the soak because until then the branches are the rollback.

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
| One film joins the Classic rows | it was tagged "Cassic"; the tag migration merges the typo into Classic (the old spelling still resolves) | none |
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
| `scripts/migrateVisibility.js` | with `--apply` / `--rollback` | fills `clientStatus`, `mediaReady`, `publishedAt`; never makes anything newly public |
| `scripts/migrateTagsToTaxonomy.js` | with `--apply` / `--rollback` | builds the tag system from the old categories, ceremonies and item strings (`tag-migration-map.json`) |
| `scripts/backfillClientProfiles.js` | with `--apply` / `--rollback` | story-page slugs, city, cover, item order for existing weddings |
| `scripts/migrateRowsToCollections.js` | with `--apply` / `--rollback` | hero + home / films / portfolio rows as collections |
| `scripts/migratePagesToComposition.js` | with `--apply` / `--rollback` | pages composed from rows: home tabs, /films rows, /allfilms and /photos filters |
| `scripts/consolidateHomeSources.js` | with `--apply` / `--rollback` | stats once, after the packages; team, reviews and BTS read from their own screens |
| `scripts/seedPricingPackages.js` | with `--apply` / `--rollback` | the four built-in packages into Admin › Pricing (only when it is empty) |
| `scripts/contractLegacy.js` | with `--apply` / `--rollback` | after the soak: removes the old embedded data and collections, dump first |
| `scripts/lib/runLog.js` | `scriptruns`, `scriptrunchanges` | shared `--dry-run / --apply / --verify / --rollback` contract |
