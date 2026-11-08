import assert from 'node:assert/strict';
import test from 'node:test';
import { createSequencePlayer, frameUrl } from '../lib/sequence/createSequencePlayer.js';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const GLOBALS = ['window', 'navigator', 'Image', 'IntersectionObserver', 'ResizeObserver',
  'requestAnimationFrame', 'cancelAnimationFrame', 'createImageBitmap'];

/** Installs a fake browser; frames "arrive" `latency` ms after their src is set. */
async function withBrowser({ latency = 1, connection, innerWidth = 1200 } = {}, run) {
  const saved = Object.fromEntries(GLOBALS.map((key) => [key, Object.getOwnPropertyDescriptor(globalThis, key)]));
  const requests = [];
  const paints = [];
  const observers = [];
  const players = [];
  try {
    Object.defineProperty(globalThis, 'window', { configurable: true, value: { innerWidth, devicePixelRatio: 1 } });
    Object.defineProperty(globalThis, 'navigator', { configurable: true, value: { connection } });
    globalThis.Image = class {
      naturalWidth = 640;
      naturalHeight = 360;
      set src(value) {
        this.url = value;
        requests.push(value);
        setTimeout(() => this.onload?.(), latency);
      }
    };
    globalThis.createImageBitmap = async (image) => ({ width: 640, height: 360, url: image.url, close() {} });
    globalThis.IntersectionObserver = class {
      constructor(callback, options) { observers.push({ callback, options }); }
      observe() {}
      disconnect() {}
    };
    globalThis.ResizeObserver = class { observe() {} disconnect() {} };
    globalThis.requestAnimationFrame = (callback) => setTimeout(callback, 0);
    globalThis.cancelAnimationFrame = clearTimeout;
    const rawPaints = [];
    const canvas = {
      width: 0, height: 0,
      getContext: () => ({
        drawImage(image) {
          paints.push(image.url);
          // A raw <img> (our fake Image) on the canvas forces a full synchronous decode.
          if (image instanceof globalThis.Image) rawPaints.push(image.url);
        },
      }),
    };
    const container = { getBoundingClientRect: () => ({ width: 640, height: 360 }) };
    const enter = () => { for (const { callback } of observers) callback([{ isIntersecting: true }]); };
    const create = (options) => { const player = createSequencePlayer(options); players.push(player); return player; };
    await run({ canvas, container, requests, paints, rawPaints, enter, create });
  } finally {
    for (const player of players) player.destroy();
    for (const [key, descriptor] of Object.entries(saved)) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor); else delete globalThis[key];
    }
  }
}

const sequence = (frameCount = 150) => ({
  frameCount, tiers: [{ label: 'desktop', keyPattern: '/frame_{index}.webp', everyNth: 1, padTo: 4, width: 640, height: 360 }],
});

test('frame URLs preserve a tier stride and index padding', () => {
  assert.equal(frameUrl({ keyPattern: '/frames/frame_{index}.webp', padTo: 4 }, 12), '/frames/frame_0012.webp');
  assert.equal(frameUrl({ keyPattern: '/legacy_{index}.webp', padTo: 3, indexOffset: 1 }, 0), '/legacy_001.webp');
});

test('nothing loads until near, then coarse frames load first and every frame once', async () => {
  await withBrowser({}, async ({ canvas, container, requests, enter, create }) => {
    const player = create({ canvas, container, sequence: sequence() });
    assert.equal(requests.length, 0, 'no frame requests before the section is near');
    enter();
    assert.deepEqual(requests.slice(0, 3), ['/frame_0000.webp', '/frame_0001.webp', '/frame_0002.webp'],
      'the frames under the playhead load first');
    assert.deepEqual(requests.slice(3, 6), ['/frame_0016.webp', '/frame_0032.webp', '/frame_0048.webp'],
      'then the coarse (every 16th frame) pass');
    await sleep(200);
    assert.equal(requests.length, 150, `requested ${requests.length} of 150 frames`);
    assert.equal(new Set(requests).size, 150, 'no frame requested twice');
    player.destroy();
  });
});

test('continuous scrolling keeps painting new frames while frames are still arriving', async () => {
  await withBrowser({ latency: 15 }, async ({ canvas, container, paints, enter, create }) => {
    const player = create({ canvas, container, sequence: sequence() });
    enter();
    for (let step = 1; step <= 20; step += 1) {
      player.setProgress(step / 20);
      await sleep(10);
    }
    await sleep(50);
    assert.ok(new Set(paints).size > 4, `painted ${new Set(paints).size} unique frames during the scrub`);
    assert.equal(paints.at(-1), '/frame_0149.webp', 'lands on the exact last frame (playhead is prioritized)');
    player.destroy();
  });
});

test('fast flings up and down only ever paint decoded bitmaps, never a raw image', async () => {
  // Regression: painting raw <img> frames during fast scrolling crashed the tab
  // ("Aw, Snap!") because each draw kept a full-size decode in memory.
  await withBrowser({ latency: 5 }, async ({ canvas, container, paints, rawPaints, enter, create }) => {
    const player = create({ canvas, container, sequence: sequence() });
    enter();
    for (let round = 0; round < 6; round += 1) {
      player.setProgress(round % 2 ? 0 : 1);
      await sleep(3);
      player.setProgress(0.5);
      await sleep(3);
    }
    await sleep(80);
    assert.ok(paints.length > 0, 'something was painted');
    assert.deepEqual(rawPaints, [], `painted raw images: ${rawPaints.slice(0, 3).join(', ')}`);
    player.destroy();
  });
});

test('a constrained connection downloads half the frames', async () => {
  await withBrowser({ connection: { effectiveType: '3g' } }, async ({ canvas, container, requests, enter, create }) => {
    const player = create({ canvas, container, sequence: sequence() });
    enter();
    await sleep(300);
    assert.ok(requests.length <= 76, `requested ${requests.length} frames on 3g`);
    assert.ok(requests.includes('/frame_0149.webp'), 'the final frame is always available');
    player.destroy();
  });
});
