# Varanasi scroll media: delivery and publishing plan

## Decision

Build a **managed, adaptive frame sequence** for each of the two Varanasi scroll scenes. Keep one uploaded source per scene, derive the frame renditions in the existing media worker, store them under one immutable, versioned R2 prefix, and expose a small manifest. The browser requests only frames near the current scroll position and keeps a bounded decoded cache. Run a short-GOP video-scrubbing prototype on the same source before committing to image-only delivery; switch if it gives equally responsive reverse/jump seeking at materially lower bytes on target phones.

This is demand-driven delivery, not a continuous video stream. R2/CDN solves serving and organization; **request scheduling and smaller renditions** solve visitor bandwidth. Even after optimization, a visitor who deliberately scrubs every frame may download many objects. The objective is to avoid downloading all of them on page entry, provide useful motion at a bounded cost, and degrade gracefully when the network cannot keep up.

## Current state and measured baseline

| Item | Current behavior / size |
| --- | --- |
| Hero scene | `HeroSection.jsx` references 150 WebPs at 1364 × 768, 4.79 MB total on disk. |
| Director scene | `DirectorSection.jsx` references 146 WebPs at 1600 × 900, 21.24 MB total on disk. |
| Both scenes | 296 referenced frames, 26.03 MB of local files. Both components set all `Image.src` values immediately on mount. Each is pinned for `+=400%` scroll. |
| Data model | `Backend/Models/Sequence.js` already describes a frame sequence and tiers, but has no controller, route, worker integration, or admin workflow. |
| Media platform | Direct resumable browser → R2 upload, `Media` records, Mongo-backed `MediaJob` queue, separate ffmpeg/sharp worker, and immutable files on the R2 custom domain are already present. |

The 26.03 MB is **file size, not a measured page transfer**. Browser caching and early exits change actual transferred bytes; capture a network trace before setting a final comparison. The hero is relatively small per frame (~34 KB median), while the director is the largest opportunity (~152 KB median).

Two performance defects are adjacent to the media change: both sections destroy *all* GSAP ScrollTriggers on cleanup, and `VaranasiClient.jsx` adds an anonymous ticker callback but removes a different function. Fix ownership/cleanup in the same frontend phase so repeated navigation does not accumulate animation work or disrupt other sections. Canvas sizing should also account for viewport changes and a capped device pixel ratio.

## 1. Asset structure and data contract

### Storage

Use **one `Media` record for each uploaded source**, `ownerType: Website`, with a slot such as `varanasi-hero-source` or `varanasi-director-source`. The existing direct-upload API handles the large source file. Do not upload 296 individual frames through the media library and do not create one Mongo document per frame.

Create **one `Sequence` record per generated release**. It references the source `Media.mediaId`, identifies `pageKey: varanasi` and `slot: hero|director`, and records release ID, state, poster, manifest key, dimensions, source timing, tier definitions, total bytes, and job/error information. Keep metadata compact: frame addressing lives in the manifest; R2 stores binary objects. The current unique `slug` can be versioned (`varanasi-hero-<releaseId>`), while a separate logical key identifies the scene. Add a query/index for that logical key and release state. Do not reuse a release ID or overwrite an object.

Example keys, with the existing storage guard prepending `dev/` outside production:

```text
website/varanasi-hero-source/<mediaId>/orig.mp4
website/varanasi-sequences/hero/<releaseId>/manifest.json
website/varanasi-sequences/hero/<releaseId>/poster.webp
website/varanasi-sequences/hero/<releaseId>/mobile/frame_0000.webp
website/varanasi-sequences/hero/<releaseId>/desktop/frame_0000.webp
website/varanasi-sequences/director/<releaseId>/...
```

`manifest.json` should include a schema version, source dimensions/duration, total timeline frame count, poster/blur URL, each tier's width/height/format/stride, exact key pattern and valid indexes, per-tier byte totals, and optional chapters/focal points. Store the manifest under the release prefix, set the correct `Content-Type`, and use the existing one-year immutable cache header. A short-lived published pointer lives in `PageContent(pageKey='varanasi')` or a dedicated page configuration record; it refers to the two ready release IDs. Never use a mutable `latest/manifest.json` behind immutable caching. The server renders the two **published** manifests/posters into the page response; a draft is available only in authenticated preview.

Example public payload shape:

```json
{
  "schemaVersion": 1,
  "releaseId": "2026-11-hero-a7f2",
  "frameCount": 150,
  "poster": "https://media.theweddingboys.in/.../poster.webp",
  "tiers": {
    "mobile": { "width": 720, "everyNth": 2, "keyPattern": ".../mobile/frame_{index}.webp", "padTo": 4 },
    "desktop": { "width": 1364, "everyNth": 1, "keyPattern": ".../desktop/frame_{index}.webp", "padTo": 4 }
  }
}
```

The existing `Sequence.tiers` has width/quality/stride but only one `keyPattern`. Extend it so each tier names an **actual emitted object pattern**. The site's Cloudflare image-resizing path is currently disabled, and the `next/image` loader does not transform canvas frame URLs. Do not publish a manifest that points to widths that do not exist.

The object count is still in the hundreds: with the current frame counts, full desktop plus every-other mobile would generate **296 + 148 = 444 frame objects**, plus posters/manifests/source files. That is acceptable when produced automatically under two release prefixes. It avoids hundreds of manual uploads, hundreds of database rows, and one untraceable directory. Storage scales with generated bytes; visitor transfer scales with the subset and tier actually requested. Estimate monthly delivery as `visits × average sequence bytes per visit`, then use measured cache-hit rate and request counts to estimate R2 origin operations. Keep those numbers visible in admin and monitoring instead of assuming that moving files to R2 saves transfer.

### Renditions

Generate from the clean source with ffmpeg extraction and sharp encoding. Start with two concrete frame sets: mobile ~640–800 px wide at every second source frame, and desktop ~1280–1600 px wide at every source frame; include a lightweight poster. Treat these as pilot settings, not fixed quality guarantees. For the director scene, test WebP quality, crop, and frame sampling against a visible-motion test; its current frames dominate bytes. AVIF is an experiment only if decode time and worker cost are acceptable. Preserve aspect ratio; consider a separate portrait composition if the crop removes the subject on phones. Record `object-fit: cover` focal point in the manifest rather than baking one crop for every viewport.

Retain a sparse set of cheap seek anchors (for example every 10th timeline frame) only if tests show it improves fast jumps; they can be the same mobile files, not an extra full rendition. Do not make the initial request fan out to all anchors. An ordinary video fallback poster should be available even if frame generation fails.

## 2. Generation and publishing workflow

1. Admin selects Hero or Director, uploads one source video using the existing multipart flow, and supplies title, focal point, optional trim, and timing/overlay markers. If the source videos are unavailable, use a **one-time batch import** of the existing ordered WebPs as generation input; validate all 150/146 indexes first. Keep this import out of the day-to-day editorial workflow.
2. Create a Draft `Sequence` release and enqueue a new idempotent `sequence` job type in `MediaJob`. Extend the existing worker claim/processor switch rather than adding an always-on service. Validate MIME, dimensions, duration, frame timestamps, and limits before encoding.
3. Worker extracts frames to temporary local storage with deterministic numbering, encodes each tier, uploads to the guarded R2 prefix with bounded concurrency, writes poster/blur/manifest, and records bytes/checksums. Keep the original source under its `Media` key. Streaming frames directly through Node request handlers is unnecessary and would load the API process.
4. Verify expected frame count, first/last frame, tier stride, URLs/keys, content types, and representative R2 HEAD/GETs. If any object is missing, leave the release in Processing/Failed; retain the currently published version. Retry safely using the same job identity but **new immutable release keys** where replacement is needed.
5. Admin previews the sequence on desktop and phone, then publishes both scene references atomically as one page configuration update. Revalidate `/varanasi`. The old release stays available for rollback and cached visitors; archive and collect it after a retention period. Show storage size, transfer estimates, processing errors, and a rollback control in admin.

Because R2 objects are behind a custom domain, configure and verify CDN caching for WebP/manifest responses; do not assume the object header alone makes every file type cache at the edge. Release-specific immutable URLs also avoid stale-cache problems on overwrite.

## 3. Scroll player behavior

### First paint

- Server renders the hero poster and readable title/CTA in HTML. Prioritize that poster as the likely LCP element. Mounting the page should not issue 296 image requests.
- Initialize animation only after hydration and when allowed by reduced-motion/data preferences. A missing manifest, JS error, or network failure leaves a complete poster/text experience.
- Fetch the first hero frame and a small nearby window only when the scene is visible. Warm the next scene shortly before it enters view; do not preload its whole sequence at page entry.

### During a scrub

- Map `ScrollTrigger.progress` to a *timeline index*; map that index to the selected tier's nearest valid frame. Use the same mapping for both scenes so animation timing and overlay text remain aligned after frame sampling.
- Maintain a priority queue: current target first, then 2–4 frames ahead in scroll direction, then 1–2 behind. Reprioritize on direction change; drop queued stale requests after a large jump. Bound in-flight downloads (initial trial: 3–4) and decoded frames (initial trial: 8–16, adjusted by actual memory). A fast jump gets the nearest already decoded frame while the new target/nearby anchor is fetched; never clear the canvas to black because a frame is pending.
- Decode before drawing (`createImageBitmap` when supported, `HTMLImageElement.decode()` fallback). Paint at most once per `requestAnimationFrame` using the most recent target; do no DOM work per source-frame tick. Close evicted `ImageBitmap`s and release object URLs. Keep only the active scene's near window; retain a small recent cache for reverse movement.
- The proposed `fetch → Blob → createImageBitmap` path needs the media custom domain to allow the site origin with CORS headers. Verify that configuration before using it. If it is unavailable, use image elements with `decode()` and a bounded queue. Add `Timing-Allow-Origin` only if Resource Timing byte metrics are needed from the client; CDN/server analytics can provide a cross-check.
- Use a `ResizeObserver` and capped DPR to size the canvas, then redraw the nearest cached frame after orientation changes. Use an explicit focal point for cover cropping. Keep the poster underneath until the first decoded frame is ready.
- Stop requesting frames for offscreen scenes. On slower networks, hold the nearest good frame and reduce rendition/stride; do not pin the user behind a loading state. Avoid an eager switch to a higher tier in mid-scene if it causes repeat downloads; use a lower tier until the next scene or a clear quality boundary.

The existing `useNetworkStatus` hook can seed tier selection, but its default is `high` when Network Information is unavailable. For this sequence, choose conservatively by viewport and observed load/decode time too. `saveData` is useful when present but not cross-browser. Offer a visible “Pause motion” or equivalent bypass if the long pinned animation impedes reading or navigation.

Decoded memory matters more than compressed file size: one 1600 × 900 RGBA frame is about **5.8 MB** before canvas and browser overhead, so 16 such frames can occupy about **92 MB**. The loader must budget by decoded pixels/bytes, not merely by frame count, and use a smaller cache on low-memory phones. A 720 × 405 frame is about 1.2 MB decoded.

### Accessibility and cleanup

For `prefers-reduced-motion: reduce`, show an editorial still with all essential text and CTAs in normal scroll flow; skip the pinned canvas and Lenis motion. Canvas is decorative (`aria-hidden`), while the meaningful text remains semantic HTML. Preserve keyboard scrolling and focus access to the CTA. GSAP triggers and ticker callbacks must be owned and removed by the component that created them, instead of calling global `killAll()`.

## 4. Why not simply scrub an MP4?

An MP4 generally compresses temporal motion far better than 296 independent WebPs and might win for a visitor who traverses the entire sequence. But mapping every scroll movement to `video.currentTime` is repeated seeking: rapid reverse, jumps, and mobile decoders can present frames late. `requestVideoFrameCallback()` tells us when a video frame is presented; it does not make seeking instantaneous. The present platform serves progressive MP4 over HTTP ranges and has no HLS/DASH adaptive system. A short-GOP/short-segment encode can improve seek responsiveness at the cost of bitrate and extra engineering.

Make this an evidence-based choice: encode one representative 5-second hero/director segment as (a) the proposed adaptive WebPs and (b) a muted, short-GOP 720p/1080p MP4. Prototype the same scroll timeline on iOS Safari and mid-range Android. Compare transferred bytes for entry, slow scroll, full traversal, fast fling, reverse, and random jump; measure visible delay and frame mismatch. Keep frame sequences if deterministic scrubbing is visibly better within the byte budget; use video for a scene if it meets the interaction target with a clear transfer win. Avoid WebCodecs/MSE or sprite sheets until this simpler test proves a need.

## 5. Budgets, instrumentation, and rollout

These are **starting acceptance targets**, not measured promises:

| Metric | Initial target / test |
| --- | --- |
| Page entry | Poster plus only a handful of hero frames; zero director frames until approach. No 296-request burst. |
| Hero first paint | Poster visible before animation work; no blank canvas. Verify mobile LCP against current page, aiming for <2.5 s at p75 where network permits. |
| Full mobile traversal | Aim for ≤4–6 MB of sequence image transfer across both scenes after the first rendition pilot; revise using real encodes and UX tests. |
| Request count | Current code can initiate 296 frame requests at entry. A full every-other mobile traversal has up to 148 unique frame requests; a quick skip should request substantially fewer. Include poster and manifest requests separately. |
| Paint work | No avoidable long tasks; target canvas work comfortably below one 16.7 ms frame budget on 60 Hz phones. |
| Memory | Bound decoded frame cache and verify no growth across route revisits and scene transitions. |
| Failure | Missing frame, offline transition, manifest 404, or worker failure never leaves an empty hero or blocks page navigation. |

Instrument sampled real visits with sequence release/tier, frame request count and bytes (Resource Timing where CORS timing headers permit), cache hits, decode latency, target-to-painted delay, dropped/stale paints, and fallback rate. Do not log individual user scroll traces. Compare cold and warm cache on Chrome Android and iOS Safari at realistic 4G and constrained connections. Test scroll forward/backward, jump to deep link, wheel/trackpad/touch, resize/rotation, reduced motion, data saver, keyboard, and adjacent section transitions. Check Cloudflare cache hit rate and R2 operations as well as browser transfer.

Roll out behind a Varanasi-only feature flag: (1) measure existing page, (2) build/import and publish a staging release, (3) run the MP4 bake-off, (4) ship poster + demand loader to a small audience, (5) review RUM and CDN data, (6) move all traffic, (7) remove local public frame folders only after rollback is stable. If the new manifest/API is unavailable, the server-side poster remains and the old release pointer is untouched.

## Implementation order

1. Baseline network/performance trace and source inventory; confirm original videos exist.
2. Extend `Sequence`/`MediaJob` schemas and implement the versioned generation job, R2 manifest writer, verification, and cleanup policy.
3. Add admin scene upload/preview/publish/rollback and published page references.
4. Build one shared Varanasi sequence player and replace the two eager loops; fix GSAP/Lenis cleanup and reduced-motion flow.
5. Run video comparison, tune renditions/queue sizes, then perform device and CDN validation.
6. Release gradually and remove bundled frames after observing stable results.

## References

- Existing code: `Next-Frontend/app/(site)/varanasi/_sections/HeroSection.jsx`, `DirectorSection.jsx`, `_components/VaranasiClient.jsx`; `Backend/Models/Sequence.js`, `Media.js`, `MediaJob.js`; `Backend/Services/r2UploadService.js`, `mediaJobQueue.js`; `Backend/worker.js`; `docs/context/08-media-pipeline.md`.
- [Cloudflare R2 custom-domain caching](https://developers.cloudflare.com/cache/interaction-cloudflare-products/r2/) and [R2 cache consistency](https://developers.cloudflare.com/r2/reference/consistency/).
- [MDN: `createImageBitmap`](https://developer.mozilla.org/en-US/docs/Web/API/Window/createImageBitmap), [video seeking via `currentTime`](https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement/currentTime), and [`requestVideoFrameCallback`](https://developer.mozilla.org/en-US/docs/Web/API/HTMLVideoElement/requestVideoFrameCallback).
- [MDN: Network Information `saveData` support](https://developer.mozilla.org/en-US/docs/Web/API/NetworkInformation/saveData).
