/**
 * Bulk capture: every public page at four viewports.
 *
 * Writes a full-page screenshot and a computed-style corpus per page/viewport,
 * plus keyboard-traversal and reduced-motion probes once per page. Everything
 * downstream in the audit is derived from these artefacts.
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import { launch, openPage } from './cdp.mjs';
import { probe } from './probe.mjs';

const BASE = 'http://localhost:3000';
const OUT_DATA = new URL('../_data/', import.meta.url).pathname;
const OUT_SHOTS = new URL('../screenshots/', import.meta.url).pathname;
mkdirSync(OUT_DATA, { recursive: true });
mkdirSync(OUT_SHOTS, { recursive: true });

const VIEWPORTS = [
  { name: 'mobile', w: 390, h: 844 },
  { name: 'tablet', w: 768, h: 1024 },
  { name: 'laptop', w: 1440, h: 900 },
  { name: 'desktop', w: 1920, h: 1080 },
];

const args = process.argv.slice(2);
const onlyPages = args.filter((a) => !a.startsWith('-'));
const portArg = args.find((a) => a.startsWith('--port='));
const PORT = portArg ? Number(portArg.split('=')[1]) : 9444;

const browser = await launch({ port: PORT });
const page = await openPage(browser);

/* Discover real detail-page ids rather than hard-coding them. */
const filmArg = args.find((a) => a.startsWith('--film='));
const photoArg = args.find((a) => a.startsWith('--photo='));
let filmHref = filmArg ? filmArg.split('=')[1] : null;
let photoHref = photoArg ? photoArg.split('=')[1] : null;
if (!filmHref || !photoHref) {
  await page.setViewport(1440, 900);
  await page.goto(`${BASE}/allfilms`, { waitMs: 5000 });
  filmHref = filmHref || await page.eval(() => {
    const a = document.querySelector('a[href^="/films/"]');
    return a ? a.getAttribute('href') : null;
  });
  await page.goto(`${BASE}/photos`, { waitMs: 5000 });
  photoHref = photoHref || await page.eval(() => {
    const a = document.querySelector('a[href^="/photos/"]');
    return a ? a.getAttribute('href') : null;
  });
}
console.log(`discovered detail routes: film=${filmHref} photo=${photoHref}`);

const PAGES = [
  { id: 'home', path: '/' },
  { id: 'films', path: '/films' },
  { id: 'allfilms', path: '/allfilms' },
  { id: 'film-detail', path: filmHref },
  { id: 'photos', path: '/photos' },
  { id: 'photo-detail', path: photoHref },
  { id: 'team', path: '/team' },
  { id: 'about', path: '/about-us' },
  { id: 'contact', path: '/contact' },
  { id: 'varanasi', path: '/varanasi' },
  { id: 'dharaa', path: '/dharaa-event-management' },
  { id: 'search', path: '/search-result' },
  { id: 'weddings-city', path: '/weddings/udaipur' },
  { id: 'not-found', path: '/audit-probe-nonexistent-route' },
].filter((p) => p.path && (!onlyPages.length || onlyPages.includes(p.id)));

const summary = [];

for (const spec of PAGES) {
  const pageOut = { id: spec.id, path: spec.path, viewports: {} };

  for (const vp of VIEWPORTS) {
    await page.setViewport(vp.w, vp.h);
    await page.goto(`${BASE}${spec.path}`, { waitMs: 4200 });
    // Scroll the page to force lazy content and settle layout, then return.
    await page.eval(async () => {
      const step = window.innerHeight;
      for (let y = 0; y < document.body.scrollHeight; y += step) {
        window.scrollTo(0, y);
        await new Promise((r) => setTimeout(r, 110));
      }
      window.scrollTo(0, 0);
      await new Promise((r) => setTimeout(r, 450));
    });

    let data;
    try {
      data = await page.eval(probe);
    } catch (e) {
      data = { error: String(e).slice(0, 300) };
    }
    data.consoleErrors = page.consoleErrors().slice(0, 30);
    const reqs = page.requests();
    data.network = {
      total: reqs.length,
      failed: reqs.filter((r) => r.status >= 400).map((r) => ({ url: r.url.slice(-80), status: r.status })),
      totalBytes: reqs.reduce((a, r) => a + (r.bytes || 0), 0),
      heaviest: reqs.filter((r) => r.bytes > 120000)
        .sort((a, b) => b.bytes - a.bytes).slice(0, 12)
        .map((r) => ({ url: r.url.slice(-80), kb: Math.round(r.bytes / 1024), mime: r.mime })),
    };

    writeFileSync(`${OUT_DATA}${spec.id}-${vp.name}.json`, JSON.stringify(data, null, 1));
    const shot = await page.screenshot(`${OUT_SHOTS}${spec.id}-${vp.w}x${vp.h}.png`, { width: vp.w, height: vp.h, cap: 4000 });

    pageOut.viewports[vp.name] = {
      overflowX: data.overflowX,
      records: data.records?.length,
      lcpMs: data.vitals?.lcpMs,
      cls: data.vitals?.cls,
      errors: data.consoleErrors?.length,
      failedReq: data.network.failed.length,
      pageHeight: shot.fullHeight,
      shotTruncated: shot.truncated,
    };
    console.log(`  ${spec.id} @${vp.name}: ${data.records?.length ?? '?'} el, overflowX=${data.overflowX}, LCP=${data.vitals?.lcpMs}ms, CLS=${data.vitals?.cls}`);
  }

  /* ---- keyboard traversal + focus visibility, once, at laptop width ---- */
  await page.setViewport(1440, 900);
  await page.goto(`${BASE}${spec.path}`, { waitMs: 4200 });
  const focusTrail = [];
  for (let i = 0; i < 45; i += 1) {
    await page.pressTab();
    const step = await page.eval(() => {
      const el = document.activeElement;
      if (!el || el === document.body) return { tag: 'BODY', end: true };
      const s = getComputedStyle(el);
      const r = el.getBoundingClientRect();
      const outlineVisible = s.outlineStyle !== 'none' && parseFloat(s.outlineWidth) > 0;
      const shadowVisible = s.boxShadow && s.boxShadow !== 'none';
      return {
        tag: el.tagName.toLowerCase(),
        label: (el.getAttribute('aria-label') || el.textContent || '').trim().slice(0, 44),
        href: el.getAttribute('href') || undefined,
        outline: `${s.outlineStyle} ${s.outlineWidth} ${s.outlineColor}`,
        boxShadow: (s.boxShadow || 'none').slice(0, 50),
        visibleFocus: outlineVisible || shadowVisible,
        offscreen: r.width === 0 && r.height === 0,
      };
    });
    if (step.end) break;
    focusTrail.push(step);
  }

  /* ---- reduced motion ---- */
  await page.emulateMedia([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
  await page.goto(`${BASE}${spec.path}`, { waitMs: 4200 });
  const motion = await page.eval(() => {
    const moving = [];
    for (const el of document.querySelectorAll('body *')) {
      const s = getComputedStyle(el);
      const hasAnim = s.animationName && s.animationName !== 'none'
        && parseFloat(s.animationDuration) > 0.01;
      const hasTrans = s.transitionDuration && parseFloat(s.transitionDuration) > 0.01;
      if (hasAnim || hasTrans) {
        moving.push({
          tag: el.tagName.toLowerCase(),
          cls: (typeof el.className === 'string' ? el.className : '').slice(0, 48),
          animation: hasAnim ? `${s.animationName} ${s.animationDuration}` : undefined,
          transition: hasTrans ? s.transition.slice(0, 60) : undefined,
        });
      }
    }
    return { count: moving.length, sample: moving.slice(0, 20) };
  });
  await page.emulateMedia([]);

  writeFileSync(`${OUT_DATA}${spec.id}-interaction.json`,
    JSON.stringify({ focusTrail, reducedMotion: motion }, null, 1));

  const noFocus = focusTrail.filter((f) => !f.visibleFocus).length;
  console.log(`  ${spec.id}: ${focusTrail.length} tab stops, ${noFocus} with NO visible focus; ${motion.count} still animating under reduce`);
  pageOut.tabStops = focusTrail.length;
  pageOut.noVisibleFocus = noFocus;
  pageOut.movingUnderReduce = motion.count;
  summary.push(pageOut);
}

writeFileSync(`${OUT_DATA}_summary-${PORT}.json`, JSON.stringify(summary, null, 1));
page.close(); browser.close();
console.log('\ncapture complete');
