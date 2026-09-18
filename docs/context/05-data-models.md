# 05 — Data Models

All models live in `Backend/Models/` and use Mongoose 8. They fall into four
groups.

---

## Group 1 — Identity & access

### `adminSchema.js` → `Admin`
The staff account. Beyond name/email/password hash it carries:

- `role` — one of `SuperAdmin` / `Editor` / `PortfolioManager`
- `status` — account state (active/suspended)
- `mfaEnabled`, `mfaSecret` (`select: false`), `mfaRecoveryCodes`

`mfaSecret` is excluded from queries by default — never remove that `select`
flag, and never return it to the client.

### `Session.js` → `Session`
One document per signed-in device.

`userId` · `refreshTokenHash` · `deviceFingerprint` (User-Agent) · `ipAddress` ·
`expiresAt` · `isValid` · `lastUsedAt`

Refresh tokens are stored **hashed**. Revoking a session flips `isValid`, which
is how "sign out everywhere" works without touching the access token.

### `InviteToken.js` → `InviteToken`
`email` · `role` · `tokenHash` · `invitedBy` · `expiresAt` · `acceptedAt`

Single-use, hashed, expiring invites — the only way a new admin account is
created.

### `inviteCodeSchema.js` → legacy shared invite code
`code` · `createdBy` · `expiresAt`. Surfaced in Studio Settings. Superseded by
per-email `InviteToken`; retained for back-compat.

---

## Group 2 — Portfolio & client work

### `ClientSchema.js` → `Client`
The central portfolio record — one document per wedding.

```
clientName: { Bride, Groom }
videos: [ { _id, videoMetaData, thumbnailMetaData, tags,
            videoShootDate, videoLocation, btsInfo, … } ]
photos: [ … ]
```

Films and photos are **embedded subdocuments**. A film URL like `/films/:videoId`
refers to a subdocument `_id` inside a `Client`.

> **This is now the legacy half of a migration in progress.** Every film and
> photo also exists as a `PortfolioItem` document (below), written by
> `syncClientPortfolio()` on every client add/edit. The embedded arrays are still
> the read source by default; `PORTFOLIO_READS=v2` switches reads to
> `PortfolioItem`. Do not build anything new against these arrays — see
> [13 — Portfolio domain](./13-portfolio-domain.md).

### `PortfolioItem.js` → `PortfolioItem`

One document per film or photograph — the **editorial** layer, separate from the
`Media` **asset** layer it references by `mediaId`.

```
kind: 'Video' | 'Photo'
client: → Client        media: → Media        mediaId: String
title  caption  tags[]  shootDate  location{country,state,city,venue}
isHero  heroPriority  generalPriority  status: Draft|Published|Archived
credits: [{ name, role }]        clientNameText   (denormalised for search)
render: { posterUrl, imageUrl, webUrl, loopUrl, blurDataURL, … }  (cached from Media)
legacy: { subdocId, source, s3Key, thumbnailS3Key }               (cut-over bridge)
```

Eight declared indexes (plus `_id`), led by `feed`
(`kind, status, isHero, heroPriority, generalPriority, _id, tags`) — `tags` is
**last** because in a compound multikey index the sort keys must precede the
array field. There is deliberately **no text index**: the connection uses Stable
API `strict: true`, which rejects `$text` outright.

The backfill reuses each subdocument's `_id` as the `PortfolioItem._id`, so every
`/films/:id` and `/photos/:id` URL already in the sitemap keeps resolving.

### `TagsSchema.js` → `Tags`
`tagType` (unique, e.g. `Category`, `WeddingType`, `Religion`) · `tags: [String]`

The taxonomy behind every filter on the site. Because films and photos store
tags as plain strings, **renaming a tag can orphan media** — which is exactly
why `PUT /api/admin/tags` has the two-phase confirm handshake described in
[04 — Backend API](./04-backend-api.md).

### `btsRoleSchema.js` → BTS roles
`title` (e.g. "Drone Pilot") · `key` (unique). The crew-role checklist offered
when tagging a shoot.

### `TeamSchema.js` → `Team`
`imageMetaData` · `isHero` · `about` (`{ name, designation }`)

One collection holds both team-member portraits and page banner images; `isHero`
distinguishes them. The public `/team` page and the admin manager both filter on
it.

---

## Group 3 — Site content

### `PageContent.js` → `PageContent`
The CMS. One document per page, keyed by `pageKey` (`home`, `about`, `films`,
`photos`, `contact`, …), containing an ordered array of blocks. Fully documented
in [07 — Content CMS](./07-content-cms.md).

### `blogPost.js` → `BlogPost`
`title` · `slug` (unique) · `content` (HTML) · `contentJson` (TipTap doc) ·
`excerpt` · `coverImage` / `gallery` / `inlineMedia` (Media refs) · `author` ·
`tags` · `keywords` · `category` · `metaTitle` · `metaDescription` ·
`canonicalUrl` · `socialTitle` · `socialDescription` · `status` · `seoScore` ·
plus the wedding storytelling fields: `mood` (enum) · `season` · `budget` ·
`venue` · `style` · `testimonial` · `tips` · `callToAction`.

Both `content` (HTML, for rendering and search) and `contentJson` (TipTap JSON,
for editing) are stored. Keep them in sync — the editor writes both on save.

### `Media.js` → `Media`
The single source of truth for every asset. Polymorphic:

- `ownerType` — `Client` / `Website` / `Blog` / `Review` / `Team` / `Brand` / `System`
- `ownerId` — `Mixed`, because owners span ObjectId collections and string ids
- `mediaType` — `Image` / `Video` / `Document` / `Animation`
- `visibility` — `Public` / `Private`
- `status` — `Draft` → `Uploading` → `Uploaded` → `SavedToStorage` → `Ready` → `Published` → `Archived`
- plus `mediaId` (nanoid), `fileName`, `originalFileName`, `mimeType`,
  `fileSize`, `checksum`, `featured`

See [08 — Media pipeline](./08-media-pipeline.md).

### `Sequence.js` → `Sequence`
Metadata for scrubbed image-sequence animations (the Varanasi director
sequence): `keyPattern`, `padTo`, `startIndex`, `frameCount`, `frameRate`,
`width`, plus quality tiers (`high`/`medium`/`low` with `everyNth`, `width`,
`quality`) so the client can drop frames on slow connections.

### `WebsiteSettingSchema.js` → `WebsiteSetting`
The pre-CMS site configuration, still in active use:
`heroVideos` (with `priority`) · `mapDisplayClient` (client + coordinates) ·
`homepageVideosTags` · `filmsPageVideoTags` · `photoPagePhotoTags` · `BtsPhotos`

`filmsPageVideoTags` is what `/admin/website-setting/films` edits.

### `SiteConfig.js` → `SiteConfig`
Global singleton (`key: 'global'`): `studio` (name, tagline, logo, email,
phones, address, whatsapp) and `socials`. This backs `StudioDetailsContext`.

### `PricingPackage.js` → `PricingPackage`
`name` · `slug` · `category` · `tagline` · `description` · `currency` (INR) ·
specs (`label`/`value`/`icon`) · feature groups (`title`/`icon`/`items`) ·
badges (`label`/`tone`: popular | discount | new | custom).

### `ReviewSchema.js` → `Review`
`photo` · `reviewText` · `person` (`name`, `gender` ∈ Bride | Groom).

---

## Group 4 — Business

### `EnquirySchema.js` → `Enquiry`
`Bride` · `Groom` · `Contact` · `Date` · `Reach` · `SubmittedTime` · `isViewed`

Note the capitalised field names — they predate the current conventions and are
consumed as-is by `/admin/total-Enquires`. Renaming them is a breaking change
across the contact form, the controller and the admin screen.

---

## Two overlapping content systems

Both `WebsiteSetting` (older, purpose-built fields) and `PageContent` (newer,
generic blocks) are live at the same time. The home page reads `PageContent`
first and falls back to the hardcoded layout, while sections like the hero
carousel still read `WebsiteSetting`.

`Backend/scripts/migrateContentToCms.js` exists to move the older data into the
block CMS. Until that migration is completed and the legacy fields retired,
**expect to touch both systems** when changing home-page content behaviour.
