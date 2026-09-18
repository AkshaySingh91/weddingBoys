/** Re-capture screenshots only, with image decoding awaited. */
import { launch, openPage } from './cdp.mjs';
const BASE = 'http://localhost:3000';
const OUT = new URL('../screenshots/', import.meta.url).pathname;
const VIEWPORTS = [
  { name: 'mobile', w: 390, h: 844 }, { name: 'tablet', w: 768, h: 1024 },
  { name: 'laptop', w: 1440, h: 900 }, { name: 'desktop', w: 1920, h: 1080 },
];
const args = process.argv.slice(2);
const portArg = args.find((a) => a.startsWith('--port='));
const PORT = portArg ? Number(portArg.split('=')[1]) : 9700;
const PAGES = {
  home: '/', films: '/films', allfilms: '/allfilms',
  'film-detail': '/films/6806935a162b3828a2e67e85',
  photos: '/photos', 'photo-detail': '/photos/6804a822f012e5e291abebe2',
  team: '/team', about: '/about-us', contact: '/contact', varanasi: '/varanasi',
  dharaa: '/dharaa-event-management', search: '/search-result',
  'weddings-city': '/weddings/udaipur', 'not-found': '/audit-probe-nonexistent-route',
};
const wanted = args.filter((a) => !a.startsWith('--'));
const browser = await launch({ port: PORT });
const page = await openPage(browser);
for (const id of (wanted.length ? wanted : Object.keys(PAGES))) {
  for (const vp of VIEWPORTS) {
    await page.setViewport(vp.w, vp.h);
    await page.goto(`${BASE}${PAGES[id]}`, { waitMs: 4000 });
    await page.eval(async () => {
      /*
        Capped at 14 steps. /photos is an infinite-scroll masonry: an uncapped
        pass keeps loading rows for as long as it is scrolled, the document never
        stops growing, and the screenshot never completes. The cap is itself a
        record of that behaviour.
      */
      const step = window.innerHeight;
      for (let i = 0, y = 0; i < 14 && y < document.body.scrollHeight; i += 1, y += step) {
        window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 90));
      }
      window.scrollTo(0, 0); await new Promise((r) => setTimeout(r, 400));
    });
    const s = await page.screenshot(`${OUT}${id}-${vp.w}x${vp.h}.png`, { width: vp.w, height: vp.h, cap: 4000 });
    console.log(`${id} @${vp.name}: ${s.captured}px${s.truncated ? ` (of ${s.fullHeight})` : ''}`);
  }
}
page.close(); browser.close();
