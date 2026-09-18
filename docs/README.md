# WeddingBoys — Documentation

This folder is the written context for the WeddingBoys product. It exists so
that a developer — or an AI agent — arriving with **zero prior knowledge** can
understand what this product is, how it is built, and why it is built that way,
without reverse-engineering the codebase first.

## Where to start

Everything lives in [`context/`](./context/). Read it in order the first time:

| # | Document | What it answers |
|---|---|---|
| 00 | [Overview](./context/00-overview.md) | What is this product, who runs it, what is in the repo, how do I run it |
| 01 | [Architecture](./context/01-architecture.md) | How the pieces fit together, request flow, rendering strategy |
| 02 | [Public site](./context/02-public-site.md) | Every public route, its sections and data sources |
| 03 | [Admin panel](./context/03-admin-panel.md) | Every admin route, what each screen does, who may use it |
| 04 | [Backend API](./context/04-backend-api.md) | Full endpoint reference |
| 05 | [Data models](./context/05-data-models.md) | Every MongoDB collection and its shape |
| 06 | [Auth & security](./context/06-auth-and-security.md) | Login, MFA, sessions, roles, invites, cookies, edge gate |
| 07 | [Content CMS](./context/07-content-cms.md) | The block system that makes pages editable |
| 08 | [Media pipeline](./context/08-media-pipeline.md) | Uploads, R2, Cloudflare Stream, image optimisation |
| 09 | [SEO](./context/09-seo.md) | What is in place, and the prioritised gaps |
| 10 | [Migration history](./context/10-migration-history.md) | The React → Next.js migration record |
| 11 | [Conventions](./context/11-conventions.md) | How to write code that fits this codebase |
| 12 | [Environment & deployment](./context/12-environment-and-deployment.md) | Env vars, commands, hosting, known issues |
| 13 | [Portfolio domain](./context/13-portfolio-domain.md) | How media, clients and the public pages connect; curation; the `PortfolioItem` model |
| 14 | [Current state](./context/14-current-state.md) | What is done, what is live, what is pending, how to run it, the cut-over runbook |
| — | [Blog Management](./blog-management/README.md) | Full architectural reference, Tiptap extensions, data models, and API for editorial system |

## If you only read two

Start with [14 — Current state](./context/14-current-state.md) to find out where
the work actually stands, then [13 — Portfolio domain](./context/13-portfolio-domain.md)
for the architecture that most of the recent work changed.

## Keeping this accurate

These documents describe the state of the repository as of **6 September 2026**.
They are prose, not generated output — when you change how something works,
update the document that covers it in the same change. A stale context document
is worse than none, because the next agent will trust it.
