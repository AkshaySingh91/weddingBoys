/** Stage 1 verification: shell + primitives across viewports and states. */
import { writeFileSync } from 'node:fs';
import { launch, openPage } from './cdp.mjs';

const BASE = 'http://localhost:3000';
const OUT = new URL('../../redesign/screenshots/stage-1/', import.meta.url).pathname;
const VPS = [
    { n: 'mobile', w: 390, h: 844 },
    { n: 'tablet', w: 768, h: 1024 },
    { n: 'laptop', w: 1440, h: 900 },
    { n: 'desktop', w: 1920, h: 1080 },
];

const browser = await launch({ port: 9810 });
const page = await openPage(browser);
const report = {};

for (const vp of VPS) {
    await page.setViewport(vp.w, vp.h);
    await page.goto(`${BASE}/`, { waitMs: 4000 });

    // Header at rest
    await page.screenshot(`${OUT}header-rest-${vp.w}.png`, { width: vp.w, height: Math.min(vp.h, 700), cap: 700 });

    const rest = await page.eval(() => {
        const h = document.querySelector('header');
        const cs = getComputedStyle(h);
        return { height: Math.round(h.getBoundingClientRect().height), bg: cs.backgroundColor, blur: cs.backdropFilter };
    });

    // Header condensed
    await page.eval(async () => { window.scrollTo(0, 400); await new Promise(r => setTimeout(r, 600)); });
    await page.screenshot(`${OUT}header-condensed-${vp.w}.png`, { width: vp.w, height: Math.min(vp.h, 700), cap: 700 });
    const condensed = await page.eval(() => {
        const h = document.querySelector('header');
        const cs = getComputedStyle(h);
        return { height: Math.round(h.getBoundingClientRect().height), bg: cs.backgroundColor, blur: cs.backdropFilter };
    });
    await page.eval(() => window.scrollTo(0, 0));

    // Footer
    await page.eval(async () => { window.scrollTo(0, document.body.scrollHeight); await new Promise(r => setTimeout(r, 900)); });
    await page.screenshot(`${OUT}footer-${vp.w}.png`, { width: vp.w, height: Math.min(vp.h, 900), cap: 900 });

    // Overflow + landmarks + targets
    const checks = await page.eval(() => {
        const vw = document.documentElement.clientWidth;
        const shell = [...document.querySelectorAll('header *, footer *')];
        const small = shell.filter((e) => {
            const t = e.tagName.toLowerCase();
            if (!['a', 'button', 'input'].includes(t)) return false;
            const r = e.getBoundingClientRect();
            return r.width > 0 && Math.min(r.width, r.height) < 44;
        }).map((e) => ({ tag: e.tagName.toLowerCase(), label: (e.getAttribute('aria-label') || e.textContent || '').trim().slice(0, 28), size: `${Math.round(e.getBoundingClientRect().width)}x${Math.round(e.getBoundingClientRect().height)}` }));
        return {
            overflowX: document.documentElement.scrollWidth - vw,
            landmarks: { header: document.querySelectorAll('header').length, main: document.querySelectorAll('main').length, footer: document.querySelectorAll('footer').length, nav: document.querySelectorAll('nav').length },
            skipLink: !!document.querySelector('.skip-link'),
            shellTargetsUnder44: small,
            unlabelledShellLinks: [...document.querySelectorAll('header a, footer a, header button, footer button')]
                .filter((e) => !(e.getAttribute('aria-label') || e.textContent || '').trim()).length,
        };
    });

    report[vp.n] = { rest, condensed, ...checks };
    console.log(`${vp.n.padEnd(8)} header ${rest.height}->${condensed.height}px  overflowX=${checks.overflowX}  small targets=${checks.shellTargetsUnder44.length}  unlabelled=${checks.unlabelledShellLinks}`);
}

/* Mobile menu, open state */
await page.setViewport(390, 844);
await page.goto(`${BASE}/`, { waitMs: 3500 });
await page.eval(() => document.querySelector('header button[aria-label="Open menu"]')?.click());
await new Promise((r) => setTimeout(r, 500));
await page.screenshot(`${OUT}mobile-menu-open-390.png`, { width: 390, height: 844, cap: 844 });
const menu = await page.eval(() => {
    const d = document.querySelector('[role="dialog"]');
    return { open: !!d, focusInside: d?.contains(document.activeElement), label: d?.getAttribute('aria-label') };
});
console.log('mobile menu:', JSON.stringify(menu));

/* Desktop nav panel */
await page.setViewport(1440, 900);
await page.goto(`${BASE}/`, { waitMs: 3500 });
await page.eval(() => {
    const t = [...document.querySelectorAll('header nav a')].find((a) => a.textContent.trim() === 'Destinations');
    t?.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
    t?.parentElement?.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
});
await new Promise((r) => setTimeout(r, 400));
await page.screenshot(`${OUT}nav-panel-open-1440.png`, { width: 1440, height: 520, cap: 520 });

/* Keyboard pass */
await page.goto(`${BASE}/`, { waitMs: 3500 });
const trail = [];
for (let i = 0; i < 14; i += 1) {
    await page.pressTab();
    const s = await page.eval(() => {
        const el = document.activeElement;
        if (!el || el === document.body) return { end: true };
        const cs = getComputedStyle(el);
        return {
            tag: el.tagName.toLowerCase(),
            label: (el.getAttribute('aria-label') || el.textContent || '').trim().slice(0, 34),
            outline: `${cs.outlineStyle} ${cs.outlineWidth} ${cs.outlineColor}`,
            visible: cs.outlineStyle !== 'none' && parseFloat(cs.outlineWidth) > 0,
        };
    });
    if (s.end) break;
    trail.push(s);
}
await page.screenshot(`${OUT}focus-state-1440.png`, { width: 1440, height: 400, cap: 400 });
console.log(`keyboard: ${trail.length} stops, first="${trail[0]?.label}", none-visible=${trail.filter(t => !t.visible).length}`);
report.keyboard = trail;

/* Reduced motion */
await page.emulateMedia([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
await page.goto(`${BASE}/`, { waitMs: 3500 });
const rm = await page.eval(() => {
    let anim = 0;
    for (const el of document.querySelectorAll('body *')) {
        const s = getComputedStyle(el);
        if (s.animationName !== 'none' && parseFloat(s.animationDuration) > 0.05) anim += 1;
    }
    return { stillAnimating: anim };
});
console.log('reduced motion, still animating:', rm.stillAnimating);
report.reducedMotion = rm;
await page.emulateMedia([]);

/* Font payload */
await page.goto(`${BASE}/`, { waitMs: 4500 });
const fonts = await page.eval(() => {
    const f = performance.getEntriesByType('resource').filter((r) => /\.(woff2?|ttf)(\?|$)/.test(r.name));
    return {
        files: f.length,
        kb: Math.round(f.reduce((a, r) => a + (r.transferSize || r.encodedBodySize || 0), 0) / 1024),
        faces: document.fonts.size,
        loaded: [...new Set([...document.fonts].filter((x) => x.status === 'loaded').map((x) => x.family))],
    };
});
console.log('fonts:', JSON.stringify(fonts));
report.fonts = fonts;

writeFileSync(new URL('../_data/_stage1-verify.json', import.meta.url).pathname, JSON.stringify(report, null, 1));
page.close(); browser.close();
