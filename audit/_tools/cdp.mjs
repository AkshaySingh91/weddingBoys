/**
 * Chrome DevTools Protocol driver for the Phase 1 audit.
 *
 * Drives the Chrome already installed on the machine over a WebSocket Node
 * provides natively — no package install, and nothing added to the product's
 * dependency tree. The audit must be reproducible by anyone with Chrome, so the
 * harness deliberately has no dependencies of its own.
 */
import { spawn } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

export async function launch({ port = 9444 } = {}) {
  const dir = mkdtempSync(join(tmpdir(), 'wb-audit-'));
  const proc = spawn(CHROME, [
    '--headless=new',
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${dir}`,
    '--no-first-run', '--no-default-browser-check',
    '--disable-extensions', '--disable-gpu',
    '--hide-scrollbars',              // scrollbar width would skew every measurement
    '--force-device-scale-factor=1',
    '--font-render-hinting=none',
    '--allow-running-insecure-content',
  ], { stdio: 'ignore' });

  let version;
  for (let i = 0; i < 120; i += 1) {
    try { version = await (await fetch(`http://127.0.0.1:${port}/json/version`)).json(); break; }
    catch { await new Promise((r) => setTimeout(r, 250)); }
  }
  if (!version) throw new Error('Chrome did not start');
  return { port, close() { try { proc.kill(); } catch {} try { rmSync(dir, { recursive: true, force: true }); } catch {} } };
}

export async function openPage(browser) {
  const res = await (await fetch(`http://127.0.0.1:${browser.port}/json/new?about:blank`, { method: 'PUT' })).json();
  const ws = new WebSocket(res.webSocketDebuggerUrl);
  await new Promise((r, j) => { ws.onopen = r; ws.onerror = j; });

  let id = 0;
  const pending = new Map();
  const events = [];
  ws.onmessage = (m) => {
    const msg = JSON.parse(m.data);
    if (msg.id && pending.has(msg.id)) {
      const { resolve, reject } = pending.get(msg.id);
      pending.delete(msg.id);
      msg.error ? reject(new Error(msg.error.message)) : resolve(msg.result);
    } else if (msg.method) events.push(msg);
  };
  const send = (method, params = {}) => new Promise((resolve, reject) => {
    id += 1; pending.set(id, { resolve, reject });
    ws.send(JSON.stringify({ id, method, params }));
  });

  await send('Page.enable');
  await send('Runtime.enable');
  await send('Network.enable');
  await send('Log.enable');

  /*
    Core Web Vitals must be observed from the first byte.
    `performance.getEntriesByType('largest-contentful-paint')` returns nothing
    unless a PerformanceObserver is registered — LCP and layout-shift entries are
    not retained in the default timeline buffer. Installing the observer via
    addScriptToEvaluateOnNewDocument means it runs before any page script on
    every navigation, so the numbers cover the whole load rather than whatever
    happened to survive until the probe ran.
  */
  await send('Page.addScriptToEvaluateOnNewDocument', {
    source: `
      window.__wbVitals = { lcp: null, cls: 0, shifts: [], longTasks: [] };
      try {
        new PerformanceObserver((l) => {
          const e = l.getEntries();
          const last = e[e.length - 1];
          if (last) window.__wbVitals.lcp = {
            ms: Math.round(last.startTime),
            url: String(last.url || ''),
            tag: last.element ? last.element.tagName.toLowerCase() : null,
            cls: last.element && typeof last.element.className === 'string'
              ? last.element.className.split(/\\s+/).slice(0, 3).join('.') : null,
            size: last.size || null,
          };
        }).observe({ type: 'largest-contentful-paint', buffered: true });
      } catch (e) {}
      try {
        new PerformanceObserver((l) => {
          for (const s of l.getEntries()) {
            if (s.hadRecentInput) continue;
            window.__wbVitals.cls += s.value;
            if (window.__wbVitals.shifts.length < 20) {
              window.__wbVitals.shifts.push({
                value: +s.value.toFixed(4),
                at: Math.round(s.startTime),
                sources: (s.sources || []).slice(0, 3).map((x) => x.node
                  ? x.node.nodeName.toLowerCase() + (typeof x.node.className === 'string'
                    ? '.' + x.node.className.split(/\\s+/).slice(0, 2).join('.') : '')
                  : '?'),
              });
            }
          }
        }).observe({ type: 'layout-shift', buffered: true });
      } catch (e) {}
      try {
        new PerformanceObserver((l) => {
          for (const t of l.getEntries()) window.__wbVitals.longTasks.push(Math.round(t.duration));
        }).observe({ type: 'longtask', buffered: true });
      } catch (e) {}
    `,
  });

  return {
    send, events,
    consoleErrors: () => events
      .filter((e) => e.method === 'Log.entryAdded' && ['error', 'warning'].includes(e.params.entry.level))
      .map((e) => ({ level: e.params.entry.level, text: e.params.entry.text, url: e.params.entry.url })),
    requests: () => events.filter((e) => e.method === 'Network.responseReceived').map((e) => ({
      url: e.params.response.url,
      status: e.params.response.status,
      type: e.params.type,
      bytes: e.params.response.encodedDataLength,
      mime: e.params.response.mimeType,
    })),
    async setViewport(width, height) {
      await send('Emulation.setDeviceMetricsOverride', {
        width, height, deviceScaleFactor: 1, mobile: width < 700,
      });
    },
    async emulateMedia(features = []) {
      await send('Emulation.setEmulatedMedia', { features });
    },
    async throttle({ downloadKbps = 400, uploadKbps = 400, latencyMs = 400 } = {}) {
      await send('Network.emulateNetworkConditions', {
        offline: false, latency: latencyMs,
        downloadThroughput: (downloadKbps * 1024) / 8,
        uploadThroughput: (uploadKbps * 1024) / 8,
      });
    },
    async unthrottle() {
      await send('Network.emulateNetworkConditions', {
        offline: false, latency: 0, downloadThroughput: -1, uploadThroughput: -1,
      });
    },
    async goto(url, { waitMs = 3500 } = {}) {
      events.length = 0;
      await send('Page.navigate', { url });
      await new Promise((r) => setTimeout(r, waitMs));
    },
    async eval(fn, ...args) {
      const expr = `(${fn.toString()})(${args.map((a) => JSON.stringify(a)).join(',')})`;
      const r = await send('Runtime.evaluate', {
        expression: expr, returnByValue: true, awaitPromise: true,
      });
      if (r.exceptionDetails) {
        throw new Error(r.exceptionDetails.exception?.description || r.exceptionDetails.text || 'eval failed');
      }
      return r.result.value;
    },
    /**
     * Full-page screenshot.
     *
     * `captureBeyondViewport` hangs on very tall pages — the home page at 390px
     * is ~15,000px tall and the call never returned. Resizing the emulated
     * viewport to the document height and capturing normally is reliable, and
     * the height is capped at 8000px so one runaway page cannot stall the run.
     * Where a page is taller than the cap the screenshot is the first 8000px and
     * the JSON corpus still covers the whole document.
     */
    async screenshot(path, { width, height, cap = 8000 } = {}) {
      mkdirSync(dirname(path), { recursive: true });
      const full = await this.eval(() => Math.max(
        document.body.scrollHeight, document.documentElement.scrollHeight,
      ));
      const shotHeight = Math.min(full, cap);
      await send('Emulation.setDeviceMetricsOverride', {
        width, height: shotHeight, deviceScaleFactor: 1, mobile: width < 700,
      });
      /*
        Wait for images to actually decode after the resize.

        Resizing to the document height brings the whole page into the viewport
        at once, which re-triggers every lazy image. Capturing immediately
        photographs the loading state and reports it as the design — the first
        run of this harness produced screenshots showing grey blocks where the
        home page's offering cards are, and those images in fact load fine.
      */
      await this.eval(async () => {
        const imgs = [...document.querySelectorAll('img')];
        await Promise.all(imgs.map((i) => {
          if (i.complete && i.naturalWidth > 0) return i.decode().catch(() => {});
          return new Promise((res) => {
            const done = () => res();
            i.addEventListener('load', done, { once: true });
            i.addEventListener('error', done, { once: true });
            setTimeout(done, 6000);
          });
        }));
        await new Promise((r) => setTimeout(r, 600));
      });
      await new Promise((r) => setTimeout(r, 450));
      let data;
      try {
        ({ data } = await send('Page.captureScreenshot', { format: 'png' }));
        writeFileSync(path, Buffer.from(data, 'base64'));
      } finally {
        await send('Emulation.setDeviceMetricsOverride', {
          width, height, deviceScaleFactor: 1, mobile: width < 700,
        });
      }
      return { path, fullHeight: full, captured: shotHeight, truncated: full > cap };
    },
    async pressTab() {
      for (const type of ['rawKeyDown', 'keyUp']) {
        await send('Input.dispatchKeyEvent', {
          type, key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9, nativeVirtualKeyCode: 9,
        });
      }
      await new Promise((r) => setTimeout(r, 60));
    },
    close() { try { ws.close(); } catch {} },
  };
}
