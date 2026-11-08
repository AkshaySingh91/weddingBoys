# Varanasi scroll sequences: implementation notes

The implementation uses the existing direct-to-R2 uploader, `MediaJob` worker,
`Sequence` model, and CDN. The public page renders a poster first and requests
only a small, scroll-prioritized frame window. It keeps a bounded decoded cache
and chooses the mobile tier on narrow or constrained connections.

## Current dev releases

The existing checked-in WebPs were imported into the guarded `dev/` R2 prefix
and `weddingboys_dev` database on 2026-11-06. Both releases were verified and
published to the dev page pointer:

| Slot | Release | Frames | Desktop rendition | Mobile rendition |
| --- | --- | ---: | ---: | ---: |
| Hero | `5xS7ZdknQS5Q` | 150 | 4.54 MB / 150 frames | 0.84 MB / 75 frames |
| Director | `3JpSjU-Th6rF` | 146 | 21.00 MB / 146 frames | 2.89 MB / 73 frames |

Mobile rendition bytes total **3.73 MB** for a full traversal of both scenes.
This excludes posters and HTTP overhead; a visitor who skips a scene downloads
less. The previous checked-in frames total 26.03 MB on disk. A repeat GET to the
R2 custom domain returned `CF-Cache-Status: HIT` for a frame. The generated
releases are public CDN objects under `dev/`; no production sequence pointer was
changed.

## Editor workflow

1. Open `/admin/varanasi-sequences` and select Hero or Director.
2. Upload one source video. Set optional start/length and focal-point sliders.
   The browser sends bytes directly to R2. The existing media worker makes a
   poster; the sequence job extracts and encodes desktop and mobile frames.
3. Wait for Ready, scrub the preview slider, then publish. Publishing an older
   Ready release rolls that scene back. The published page resolves both slots
   through `/api/sequences/varanasi`.

The worker must be deployed and running for new source uploads. `MediaJob`
claims `sequence` jobs alongside the existing media jobs. Source videos marked
`sequenceSource` skip an unnecessary web playback rendition.

For a dev-only repeat import from the old folders, run from `Backend/`:

```bash
npm run varanasi:import
npm run varanasi:import -- --execute
npm run varanasi:import -- --execute --publish
```

The first command only inventories. `--execute` requires
`STORAGE_KEY_PREFIX=dev`, reuses an interrupted release, and never publishes.
The publish flag also requires the `weddingboys_dev` database. Normal updates
should use the admin video upload rather than this one-time import.

## Runtime and fallback

- The page's server component reads the published sequence API with a 5-minute
  Next cache tag. Publishing invalidates `page:varanasi` and `/varanasi`.
- The local frame paths remain as a migration fallback if the API is unavailable
  or a slot has not been published. They now use the same lazy player, so page
  entry does not initiate all 296 requests.
- The first decoded frame is drawn over the poster. Frame errors retain the
  poster or previous good frame. Reduced-motion users get static sections and
  no pinned animation. A skip button jumps past both cinematic scenes.
- A continuous-scrub fix keeps the small in-flight request window alive as the
  target moves and paints the closest decoded frame while the exact frame is
  loading. The loader also accepts a successful image `load` event if a browser
  rejects `decode()` during loading.
- Release objects use immutable keys and one-year cache headers. Old releases
  remain in R2 for rollback; delete them only after an explicit retention and
  cleanup policy is in place. The checked-in local frame folders can be removed
  after a production release is published and rollback has been observed.

## Validation performed

- Backend test suite: 61 passing.
- Frontend test suite: 5 passing, including bounded-request, jump-priority, and
  delayed-decode continuous-scroll tests.
- Changed frontend files: ESLint clean. Next production build: successful.
- Dev API returned both published releases; dev `/varanasi` HTML contained both
  R2 release IDs and no old local frame paths.
- R2 HEAD for poster, first/last sample frames, and manifest returned 200 and
  correct content types. The worker verified every frame object before marking
  each release Ready.

For the video comparison, a 720p short-GOP MP4 made from the existing frames
was about 2.4 MB across both scenes, while an all-keyframe MP4 was about
4.8 MB. The mobile WebP tiers total 3.73 MB. These are file sizes, not browser
scrub-latency results. The image player remains the release path because its
scroll position is deterministic; test seeking on iOS Safari and Android before
replacing it with video.
