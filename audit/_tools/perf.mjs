/**
 * Performance pass against the PRODUCTION build (next build && next start).
 *
 * The design/layout sweep ran against `next dev`, which is correct for computed
 * styles (identical CSS and DOM) but useless for performance: dev serves
 * unminified bundles, no static optimisation, and a development React. Every
 * number in 06-PERFORMANCE.md comes from here instead.
 */
import { writeFileSync } from 'node:fs';
import { launch, openPage } from './cdp.mjs';

const BASE = 'http://localhost:3100';
const PAGES = {
  home: '/', films: '/films', allfilms: '/allfilms',
  'film-detail': '/films/6806935a162b3828a2e67e85',
  photos: '/photos', team: '/team', about: '/about-us', contact: '/contact',
  varanasi: '/varanasi', dharaa: '/dharaa-event-management',
  search: '/search-result', 'weddings-city': '/weddings/udaipur',
};
// Mobile is throttled to a realistic 4G-ish profile; laptop runs unthrottled.
const PROFILES = [
  { name: 'mobile-4g', w: 390, h: 844, throttle: { downloadKbps: 9000, uploadKbps: 3000, latencyMs: 150 } },
  { name: 'laptop', w: 1440, h: 900, throttle: null },
];

const browser = await launch({ port: 9801 });
const page = await openPage(browser);
/*
  Cold load, every time. A warm cache made the first pass report 0KB of images
  and CLS 0 on /photos — the gallery does not shift when its images are already
  decoded, which tells us nothing about a first visit.
*/
await page.setCacheDisabled(true);
const results = {};

for (const [id, path] of Object.entries(PAGES)) {
  results[id] = {};
  for (const p of PROFILES) {
    await page.setViewport(p.w, p.h);
    if (p.throttle) await page.throttle(p.throttle); else await page.unthrottle();
    await page.clearBrowserCache();
    await page.goto(`${BASE}${path}`, { waitMs: 7000 });
    const r = await page.eval(() => {
      const V = window.__wbVitals || {};
      const nav = performance.getEntriesByType('navigation')[0];
      const paints = Object.fromEntries(performance.getEntriesByType('paint').map((x) => [x.name, Math.round(x.startTime)]));
      const res = performance.getEntriesByType('resource');
      const by = (t) => res.filter((x) => x.initiatorType === t);
      const kb = (arr) => Math.round(arr.reduce((a, x) => a + (x.transferSize || 0), 0) / 1024);
      return {
        lcpMs: V.lcp ? V.lcp.ms : null,
        lcpElement: V.lcp ? `${V.lcp.tag || '?'}${V.lcp.cls ? '.' + V.lcp.cls : ''}` : null,
        lcpUrl: V.lcp ? String(V.lcp.url || '').slice(-60) : null,
        cls: +Number(V.cls || 0).toFixed(4),
        clsSources: (V.shifts || []).slice(0, 4),
        tbtMs: (V.longTasks || []).reduce((a, d) => a + Math.max(0, d - 50), 0),
        longTasks: (V.longTasks || []).length,
        fcpMs: paints['first-contentful-paint'] ?? null,
        ttfbMs: nav ? Math.round(nav.responseStart) : null,
        loadMs: nav ? Math.round(nav.loadEventEnd) : null,
        totalKb: Math.round(res.reduce((a, x) => a + (x.transferSize || 0), 0) / 1024),
        imgKb: kb(by('img')), scriptKb: kb(by('script')), cssKb: kb(by('link')),
        requests: res.length,
        imgCount: by('img').length,
        heaviest: res.filter((x) => (x.transferSize || 0) > 150000)
          .sort((a, b) => b.transferSize - a.transferSize).slice(0, 6)
          .map((x) => ({ url: x.name.slice(-62), kb: Math.round(x.transferSize / 1024) })),
        devOverlayPresent: !!document.querySelector('nextjs-portal'),
      };
    });
    results[id][p.name] = r;
    console.log(`${id.padEnd(14)} ${p.name.padEnd(10)} LCP=${String(r.lcpMs).padStart(5)}ms CLS=${String(r.cls).padStart(7)} TBT=${String(r.tbtMs).padStart(4)}ms  ${String(r.totalKb).padStart(5)}KB (${r.requests} req, img ${r.imgKb}KB)`);
  }
}
writeFileSync(new URL('../_data/_perf-production.json', import.meta.url).pathname, JSON.stringify(results, null, 1));
page.close(); browser.close();
console.log('\nproduction performance pass complete');
