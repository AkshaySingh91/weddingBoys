const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

export function frameUrl(tier, index) {
  const number = String(index + (tier.indexOffset || 0)).padStart(tier.padTo || 4, '0');
  return tier.keyPattern.replace('{index}', number);
}

function connectionInfo() {
  const connection = navigator.connection || navigator.webkitConnection;
  const constrained = !!connection?.saveData || ['slow-2g', '2g', '3g'].includes(connection?.effectiveType);
  return { constrained };
}

export function chooseTier(sequence) {
  const tiers = sequence.tiers || [];
  const mobile = tiers.find((tier) => tier.label === 'mobile');
  const desktop = tiers.find((tier) => tier.label === 'desktop');
  const lowMemory = (navigator.deviceMemory || 8) <= 2;
  const { constrained } = connectionInfo();
  return (constrained || lowMemory || window.innerWidth < 850 ? mobile : desktop) || tiers[0];
}

/**
 * Scroll-scrubbed image sequence, built the way Apple's product pages do it:
 *
 * 1. Every frame of the sequence is downloaded up front (as soon as the section is
 *    within a couple of screens), coarse-to-fine: every 16th frame first, then
 *    every 8th, 4th, 2nd, 1st. A fast scroll during loading still shows motion —
 *    just at a lower frame rate — instead of freezing on one frame.
 * 2. Compressed frames stay in memory (a few MB per sequence); the network is never
 *    on the scroll path once loaded.
 * 3. Only a window of frames around the playhead is kept *decoded* (ImageBitmap),
 *    sized from a memory budget, and decoded ahead in the scroll direction off the
 *    main thread. drawImage() on a bitmap never triggers a synchronous decode, which
 *    is what made frames stutter on older phones.
 * 4. The canvas backing store is never larger than the source frame, so the GPU is
 *    not upscaling 1600px frames into a 2880px canvas on every paint.
 */
export function createSequencePlayer({ canvas, container, sequence }) {
  if (!canvas || !container || !sequence?.tiers?.length) return { setProgress() {}, destroy() {} };
  const context = canvas.getContext('2d', { alpha: true });
  const tier = chooseTier(sequence);
  const stride = Math.max(1, tier.everyNth || 1);
  const frameCount = sequence.frameCount;
  const lastIndex = Math.floor((frameCount - 1) / stride) * stride;
  const { constrained } = connectionInfo();
  const smallScreen = window.innerWidth < 850;

  const sources = new Map(); // index -> loaded HTMLImageElement (compressed, cheap)
  const bitmaps = new Map(); // index -> ImageBitmap (decoded, budgeted)
  // Small decoded copies of the coarse pass (every 16th frame). A fast fling shows
  // the nearest one, softly, until the full frame is decoded. ~0.5 MB each.
  const keyframes = new Map();
  const decoding = new Set();
  const decodingKeys = new Set();
  const failed = new Set();
  let destroyed = false;
  let near = false; // within a few screens: keep decoded frames
  let started = false;
  let target = 0;
  let direction = 1;
  let lastPainted = -1;
  let raf = 0;
  let inflight = 0;

  const frameWidth = tier.width || sequence.width || 1280;
  const frameHeight = tier.height || sequence.height || 720;
  const decodedBytes = frameWidth * frameHeight * 4;
  const deviceMemory = navigator.deviceMemory || (smallScreen ? 4 : 8);
  const memoryBudget = (smallScreen ? 32 : 96) * 1024 * 1024 * clamp(deviceMemory / 8, 0.35, 1);
  const decodeWindow = clamp(Math.floor(memoryBudget / decodedBytes), 6, 40);
  const maxInflight = constrained ? 3 : 6;
  const canBitmap = typeof createImageBitmap === 'function';

  const snap = (index) => clamp(Math.round(index / stride) * stride, 0, lastIndex);

  // Coarse-to-fine download order. On a constrained connection stop one level early
  // (half the frames) — motion stays continuous, the page costs half as much.
  const order = [];
  {
    const seen = new Set();
    const finest = constrained ? 2 : 1;
    for (const step of [16, 8, 4, 2, 1]) {
      if (step < finest) break;
      for (let i = 0; i <= lastIndex; i += step * stride) {
        if (!seen.has(i)) { seen.add(i); order.push(i); }
      }
    }
    if (!seen.has(lastIndex)) order.push(lastIndex);
  }
  const allowed = new Set(order);
  const requested = new Set();
  let cursor = 0;

  function resize() {
    const rect = container.getBoundingClientRect();
    // Device pixels per CSS pixel, capped so the canvas never exceeds the frame's
    // own resolution (upscaling beyond that adds GPU cost and no detail).
    const coverScale = Math.max(rect.width / frameWidth, rect.height / frameHeight) || 1;
    const dpr = clamp(Math.min(window.devicePixelRatio || 1, 1 / coverScale), 1, 2);
    const width = Math.max(1, Math.round(rect.width * dpr));
    const height = Math.max(1, Math.round(rect.height * dpr));
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
      const painted = lastPainted;
      lastPainted = -1;
      if (painted >= 0) paint(painted);
    }
  }

  /*
    Paint ONLY decoded bitmaps — never the raw <img>. Drawing an HTMLImageElement
    makes the browser decode it synchronously and keep that full-size decode
    cached; a fast fling up and down did that dozens of times a second and
    crashed the tab ("Aw, Snap!", reproduced 2026-11-09). Bitmaps are budgeted
    and closed, so memory stays flat however the page is scrolled.
  */
  function paint(index) {
    const full = bitmaps.get(index);
    const image = full || keyframes.get(index);
    if (!image || !context) return false;
    const imageWidth = image.width || image.naturalWidth;
    const imageHeight = image.height || image.naturalHeight;
    if (!imageWidth) return false;
    const scale = Math.max(canvas.width / imageWidth, canvas.height / imageHeight);
    const width = imageWidth * scale;
    const height = imageHeight * scale;
    context.drawImage(image,
      (canvas.width - width) * clamp(sequence.focalX ?? 0.5, 0, 1),
      (canvas.height - height) * clamp(sequence.focalY ?? 0.5, 0, 1), width, height);
    lastPainted = index;
    lastPaintedSharp = Boolean(full);
    return true;
  }

  const closest = (map, desired) => {
    let best = -1;
    let bestDistance = Infinity;
    for (const index of map.keys()) {
      const distance = Math.abs(index - desired);
      if (distance < bestDistance) { best = index; bestDistance = distance; }
    }
    return [best, bestDistance];
  };

  // Closest frame we can paint without waiting: a full bitmap if one is close,
  // otherwise the nearest keyframe if that is closer (soft for a moment, but in
  // the right place), otherwise whatever full bitmap is nearest.
  function nearestPaintable(desired) {
    if (bitmaps.has(desired)) return desired;
    const [full, fullDistance] = closest(bitmaps, desired);
    if (full >= 0 && fullDistance <= 2 * stride) return full;
    const [key, keyDistance] = closest(keyframes, desired);
    if (key >= 0 && keyDistance < fullDistance) return key;
    return full;
  }

  let lastPaintedSharp = false;
  function requestPaint() {
    if (raf || destroyed) return;
    raf = requestAnimationFrame(() => {
      raf = 0;
      const index = nearestPaintable(snap(target));
      // Repaint the same index when its sharp version has just arrived.
      if (index >= 0 && (index !== lastPainted || (!lastPaintedSharp && bitmaps.has(index)))) paint(index);
    });
  }

  function decodeKeyframe(index) {
    if (!canBitmap || destroyed || index % (16 * stride) !== 0 || keyframes.has(index) || decodingKeys.has(index)) return;
    const source = sources.get(index);
    if (!source) return;
    decodingKeys.add(index);
    const width = Math.min(480, source.naturalWidth || 480);
    createImageBitmap(source, { resizeWidth: width, resizeQuality: 'low' }).then((bitmap) => {
      if (destroyed) { bitmap.close?.(); return; }
      keyframes.set(index, bitmap);
      if (lastPainted < 0) requestPaint();
    }).catch(() => {}).finally(() => decodingKeys.delete(index));
  }

  // Nearest downloaded frame to the playhead, so a fling into frames that have not
  // arrived yet still decodes something close first.
  function nearestSource(desired) {
    if (sources.has(desired)) return desired;
    for (let d = stride; d <= lastIndex; d += stride) {
      if (sources.has(desired - d)) return desired - d;
      if (sources.has(desired + d)) return desired + d;
    }
    return -1;
  }

  function decodeAround() {
    if (!canBitmap || destroyed || !near) return;
    const current = snap(target);
    const ahead = Math.ceil(decodeWindow * 0.7);
    const behind = decodeWindow - ahead;
    const wanted = [];
    const fallback = nearestSource(current);
    if (fallback >= 0 && fallback !== current) wanted.push(fallback);
    for (let n = 0; n <= ahead; n += 1) wanted.push(snap(current + direction * n * stride));
    for (let n = 1; n <= behind; n += 1) wanted.push(snap(current - direction * n * stride));
    const keep = new Set(wanted);
    for (const [index, bitmap] of bitmaps) {
      if (!keep.has(index) && index !== lastPainted) { bitmap.close?.(); bitmaps.delete(index); }
    }
    // Decode a couple at a time, nearest first; each decode runs off the main thread.
    for (const index of wanted) {
      if (decoding.size >= 2) break;
      if (bitmaps.has(index) || decoding.has(index) || !sources.has(index)) continue;
      decoding.add(index);
      createImageBitmap(sources.get(index)).then((bitmap) => {
        if (destroyed || !near) { bitmap.close?.(); return; }
        bitmaps.set(index, bitmap);
        if (Math.abs(index - snap(target)) <= Math.abs(lastPainted - snap(target))) requestPaint();
      }).catch(() => {}).finally(() => {
        decoding.delete(index);
        if (!destroyed) decodeAround();
      });
    }
  }

  // The frame under the playhead (and the next couple in the scroll direction) jumps
  // the coarse-to-fine queue, so a deep link or fast fling lands on a sharp frame.
  function nextIndex() {
    const current = snap(target);
    for (let n = 0; n <= 2; n += 1) {
      const index = snap(current + direction * n * stride);
      if (allowed.has(index) && !requested.has(index)) return index;
    }
    while (cursor < order.length) {
      const index = order[cursor++];
      if (!requested.has(index)) return index;
    }
    return -1;
  }

  function download() {
    while (!destroyed && inflight < maxInflight) {
      const index = nextIndex();
      if (index < 0) return;
      requested.add(index);
      inflight += 1;
      const image = new Image();
      image.decoding = 'async';
      // First pass is what the viewer sees first; let it jump the queue.
      if ('fetchPriority' in image) image.fetchPriority = cursor <= order.length / 8 ? 'high' : 'low';
      image.onload = () => {
        inflight -= 1;
        if (destroyed) return;
        sources.set(index, image);
        decodeKeyframe(index);
        decodeAround();
        download();
      };
      image.onerror = () => {
        inflight -= 1;
        failed.add(index);
        if (!destroyed) download();
      };
      image.src = frameUrl(tier, index);
    }
  }

  function start() {
    if (started || destroyed) return;
    started = true;
    download();
  }

  // Start downloading while the section is still a couple of screens away, so the
  // sequence is (mostly) in memory before the user reaches it.
  const prefetchObserver = new IntersectionObserver(([entry]) => {
    if (entry.isIntersecting) start();
  }, { rootMargin: '200% 0px' });
  prefetchObserver.observe(container);

  // Decoded bitmaps are large: only hold them while the section is close.
  const nearObserver = new IntersectionObserver(([entry]) => {
    near = entry.isIntersecting;
    if (near) { decodeAround(); requestPaint(); }
    else {
      for (const [index, bitmap] of bitmaps) {
        if (index !== lastPainted) { bitmap.close?.(); bitmaps.delete(index); }
      }
    }
  }, { rootMargin: '50% 0px' });
  nearObserver.observe(container);

  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(container);
  resize();

  return {
    setProgress(progress) {
      const next = clamp(Math.round(clamp(progress, 0, 1) * (frameCount - 1)), 0, frameCount - 1);
      if (next === target) return;
      direction = next > target ? 1 : -1;
      target = next;
      start();
      requestPaint();
      decodeAround();
    },
    destroy() {
      destroyed = true;
      prefetchObserver.disconnect();
      nearObserver.disconnect();
      resizeObserver.disconnect();
      cancelAnimationFrame(raf);
      for (const bitmap of bitmaps.values()) bitmap.close?.();
      for (const bitmap of keyframes.values()) bitmap.close?.();
      bitmaps.clear();
      keyframes.clear();
      sources.clear();
    },
  };
}
