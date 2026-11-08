# WeddingBoys remediation — 31 October 2026

This is the implementation record for the [original analysis](./2026-10-31-weddingboys-analysis.md). Changes are local and uncommitted. Existing redesign changes were preserved. No production deployment, account mutation, live media reprocessing, or test enquiry/email submission was performed. Local startup connected to the guarded `weddingboys_dev` database and created required indexes.

## Implemented

| Finding | Result |
|---|---|
| F01, F12 | Profile reads, saves, and password changes use the authenticated account ID. Cross-account IDs are rejected before DB access. Optional phone/avatar handling and current cookie helpers replace the obsolete profile/session assumptions. Email changes require the current password. Credential changes revoke sessions. |
| F02 | Preview JWTs use a private, purpose-specific signing key with issuer/audience checks. The public fallback is removed. Preview metadata is noindex. |
| F03, F08, F26 | Enquiries validate and normalize contact/date fields, accept optional referral/end date, persist idempotently, and return an acceptance receipt independently of SMTP. Recipients come from server configuration. Notifications use durable state, leases, retry/backoff, and escaped email content. The form supports keyboard submission, inline errors/focus, preserved values on failure, and idempotent retries. |
| F04, F22 | Both MFA branches enforce lockouts and single-use challenges. Failure increments and successful challenge/recovery-code consumption are atomic. Remember-me survives MFA/refresh. Tampered signed cookies return 401. Every authenticated request checks current status/role/auth version; DB outages return 503. Login/reset endpoints have bounded per-IP limits. |
| F05 | Legacy stored CMS rich text is sanitized on serialization and new writes. JSON-LD escapes HTML-significant characters. |
| F06 | A central `/api/admin` policy applies current account roles and denies unknown writes. Blog/revision mutations also enforce editorial roles. BTS writes require PortfolioManager/SuperAdmin. |
| F09 | Upload completion has a leased Completing stage, stored object size/type verification, an idempotent Media upsert, and a unique per-upload job key. Completed requests return their asset. Retries recover from object-store completion followed by DB/queue failure. Browser resume recognizes a committed upload and finishes the same session instead of uploading bytes again. |
| F10 | Processing stores separate file-generation and placement-synchronization checkpoints. Sync errors propagate to the durable job retry. Retrying that job resumes synchronization without encoding again. Ready assets can be repaired with the authenticated media reconciliation endpoint. |
| F11 | Film/photo archives derive requests from filter state in one effect, cancel/ignore stale responses, and expose request errors/retry. |
| F13 | Production CORS includes the admin origin. Development permits localhost/admin.localhost on ports 3000/3001. Trusted proxy defaults to loopback. |
| F14 | Media status endpoints let the Next proxy decide missing status before streaming. Missing film/photo detail URLs return real HTTP 404. Backend outages remain distinct from absence. |
| F15 | Sitemap iterates blog, film, and photo pagination instead of taking only page one. |
| F16, F24 | Media tag URLs initialize filters. Journal category/search/page state goes to the server and queries the full published archive, with global category counts. Planning Guides includes the legacy Wedding Planning category. Journal pagination/canonical URLs preserve category/page; internal search is noindex. |
| F17 | Photo navigation uses Next routing and keyed server data, updating content and canonical metadata together. Lightbox navigation remains available. |
| F18 | All discovered simulated newsletter forms, including the journal footer and unused capture component, are replaced with honest journal links. No subscriber collection is claimed. |
| F19 | Period views and read-completion rates use period measurements. Lifetime views are a separate field. Empty measured periods produce no invented top-story completions. Category share uses period views across every article. UI labels distinguish lifetime comments and CTA clicks. |
| F20, F21 | Pagination uses bounded positive integers; `limit=0` cannot return all photos. Named CMS film sorting reaches the portfolio query. |
| F23 | Blog mutations, scheduling, and revision restores request cache invalidation from the trusted backend. Client-shipped fallback secrets are removed. The Next endpoint requires the configured private secret. |
| F25, partial | Added the film-archive H1, removed nested main landmarks, labeled contact controls, added Space-key activation, removed the contact hydration mismatch, corrected mobile WhatsApp overlap, and added a failed-logo fallback. A complete accessibility audit remains outstanding. |
| F27, partial | Removed the hard-coded Decade/5+ years contradiction and numeric stats fallbacks. Varanasi offers require a configured absolute deadline and verified label; absent configuration shows availability copy. Existing About-page/CMS numeric claims still need the owner's verified facts. |
| F28, partial | API waits for DB/required indexes, fails startup on errors, and exposes database readiness. Added a CI test/build workflow, optional PM2 configuration, and rollout/restore guidance. Remote CI, staging rollout, backup restoration, and worker/SMTP monitoring have not been exercised. |

## Authorization policy

SuperAdmin retains all admin permissions. Editor can mutate editorial/blog/comment/CMS/homepage/review/team content. PortfolioManager can mutate weddings/portfolio/collections/taxonomy/ceremonies/map/media tags. Both can use shared media/upload/embed operations and their own account settings. General workspace reads are available to staff; private business settings, pricing, and enquiry data remain SuperAdmin-only. Test this matrix against real staging workflows before deployment.

## Dependencies (F07, partial)

Next and eslint-config-next are 16.4.3; direct TipTap packages are aligned at 3.32.2. Backend bcrypt moved from 5 to 6 and Nodemailer from 6 to 10; unused aws-sdk v2 and body-parser were removed. Compatible transitive updates are in both lockfiles. bcrypt/session and SMTP error handling have automated coverage; actual staging mail delivery still needs verification.

The approved frontend advisory scan reports **18 moderate, zero high, zero critical** advisories. Moderate advisories remain. See the saved audit JSON for exact package chains.

The separately approved backend advisory scan is complete: **2 moderate, zero high, zero critical** entries. Both entries belong to one dependency chain, `nodemon → minimatch`, for minimatch globparts amplification denial of service ([GHSA-g3hv-75wg-m249](https://github.com/advisories/GHSA-g3hv-75wg-m249)). Nodemon is currently declared in production dependencies despite being used for development scripts. The scanner's automatic fix proposes downgrading Nodemon to 1.0.2; it was not applied. Review development-tool placement and an upstream-compatible minimatch fix separately. The saved backend audit JSON contains exact installed ranges. No forced upgrades or certificate-validation bypasses were used.

## Verification

- Backend: **61 tests passed**, including cross-account profile rejection, current role/status/version enforcement, MFA lock/replay, preview forgery, CMS XSS, enquiry idempotency/SMTP retry, pagination/sort, upload recovery/size mismatch/lease exclusion, placement retry, period analytics, and archive queries beyond record 48.
- Frontend: **2 tests passed**: JSON-LD breakout safety and committed-upload resume without re-uploading bytes.
- Production build and its block-registry/Tailwind checks: passed on the upgraded dependency stack.
- Changed backend JavaScript: syntax checks passed. `git diff --check`: passed.
- Targeted frontend lint: no errors in repaired files. The login page retains a warning for its full-page post-login navigation.
- Full frontend lint remains **13 errors and 15 warnings**, down from the original 28 errors/15 warnings. These are recorded, not suppressed. Remaining errors cover legacy effect/state patterns in engagement/comments/player/admin settings, modals, and media infinite-scroll declaration ordering.
- Read-only local API: health 200; journal 12 total/9 per page/hasMore true; Planning Guides 11 total; photos limit=0 returns limit 10, not all 27.
- Browser production preview: Garden film tag selects its matching film; empty enquiry submitted by Return displays/focuses field errors; mobile controls do not overlap; photo next updates URL/canonical from c6 to c5 with one main landmark; journal category deep links select the category, page two loads different articles with the matching canonical, and keyboard search submits the query with noindex metadata.
- Missing film/photo URLs returned HTTP 404, admin login emitted noindex, and sitemap returned 79 URLs in the local production checks.

Tests use stubs and synthetic data. They do not prove real storage, SMTP, authenticated staging UI, or concurrent Mongo behavior end to end. A local Mongo startup did verify creation of the critical indexes. Mongo's strict Stable API setting rejects creation of the legacy Media text index; startup therefore waits for the required media-ID unique index, enquiry indexes, and job indexes rather than all Media indexes. The existing media search uses escaped regex queries.

## Remaining work

1. Review the remaining frontend moderate chains and the backend Nodemon/minimatch moderate chain. Both scans are complete; neither reports high or critical advisories.
2. Resolve the 13 remaining full-repository lint errors and finish keyboard/screen-reader coverage. Avoid hiding them behind rule disables.
3. Verify uploads and interrupted completion, placement reconciliation, account self-service/MFA/roles, real enquiry receipt, and cache invalidation in staging. Critical auth and dependency upgrades need this before rollout.
4. Confirm studio totals and replace inconsistent About/CMS claims with one verified source. Configure only a real offer deadline. Existing production content was not changed.
5. Run the new CI remotely, configure process supervision/secrets/proxy routing, monitor worker/enquiry backlog, and demonstrate a restore into an isolated database before deployment.

Configuration and rollout details: [Environment & Deployment](../context/12-environment-and-deployment.md). The optional process config has not been executed. Nothing was committed, pushed, or deployed.
