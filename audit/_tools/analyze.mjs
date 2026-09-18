/**
 * Aggregate the per-page corpora into the cross-site evidence the audit needs.
 *
 * Counts are occurrences of a COMPUTED value across every page and viewport
 * captured — so "31 distinct font sizes" means the browser resolved 31 different
 * pixel values across the public site, whatever the source classes said.
 */
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';

const DATA = new URL('../_data/', import.meta.url).pathname;
const files = readdirSync(DATA).filter((f) => f.endsWith('.json')
  && !f.startsWith('_') && !f.includes('-interaction'));

const tokens = {};       // prop -> value -> { n, pages:Set, where:[] }
const perPage = {};      // pageId -> { vitals, defects, counts }
const components = {};   // kind -> [instances with page]

for (const f of files) {
  const [pageId, viewport] = f.replace('.json', '').split(/-(?=mobile|tablet|laptop|desktop$)/);
  let d;
  try { d = JSON.parse(readFileSync(DATA + f, 'utf8')); } catch { continue; }
  if (!d.tokens) continue;

  for (const [prop, values] of Object.entries(d.tokens)) {
    tokens[prop] = tokens[prop] || {};
    for (const [val, info] of Object.entries(values)) {
      const slot = tokens[prop][val] || (tokens[prop][val] = { n: 0, pages: new Set(), where: [] });
      slot.n += info.n;
      slot.pages.add(pageId);
      for (const w of info.where || []) if (slot.where.length < 3) slot.where.push(`${pageId}:${w}`);
    }
  }

  perPage[pageId] = perPage[pageId] || { viewports: {}, defects: {} };
  perPage[pageId].viewports[viewport] = {
    scanned: d.scanned, overflowX: d.overflowX,
    lcpMs: d.vitals?.lcpMs, cls: d.vitals?.cls, fcpMs: d.vitals?.fcpMs,
    tbtMs: d.vitals?.totalBlockingMs, lcpElement: d.vitals?.lcpElement,
    clsSources: d.vitals?.clsSources,
    h1Count: d.h1Count, headingJumps: d.headingJumps?.length,
    landmarks: d.landmarks,
    lowContrast: d.defects?.lowContrastCount, overImage: d.defects?.overImageCount,
    tinyTarget: d.defects?.tinyTargetCount, oversizedImage: d.defects?.oversizedImageCount,
    brokenImage: d.defects?.brokenImage?.length, noAlt: d.defects?.noAltImageCount,
    title: d.title,
  };
  // Keep the worst-case defect samples per page for citation.
  for (const key of ['lowContrast', 'overImage', 'tinyTarget', 'oversizedImage', 'brokenImage']) {
    const arr = d.defects?.[key] || [];
    if (arr.length) {
      perPage[pageId].defects[key] = perPage[pageId].defects[key] || [];
      for (const item of arr.slice(0, 6)) {
        if (perPage[pageId].defects[key].length < 10) {
          perPage[pageId].defects[key].push({ ...item, viewport });
        }
      }
    }
  }

  if (viewport === 'laptop') {
    for (const [kind, list] of Object.entries(d.components || {})) {
      components[kind] = components[kind] || [];
      for (const inst of list) components[kind].push({ page: pageId, ...inst });
    }
  }
}

const out = {};
for (const [prop, values] of Object.entries(tokens)) {
  const rows = Object.entries(values)
    .map(([value, info]) => ({ value, n: info.n, pages: [...info.pages].length, where: info.where }))
    .sort((a, b) => b.n - a.n);
  out[prop] = { distinct: rows.length, total: rows.reduce((a, r) => a + r.n, 0), rows };
}

writeFileSync(new URL('../_data/_tokens.json', import.meta.url).pathname, JSON.stringify(out, null, 1));
writeFileSync(new URL('../_data/_perpage.json', import.meta.url).pathname, JSON.stringify(perPage, null, 1));
writeFileSync(new URL('../_data/_components.json', import.meta.url).pathname, JSON.stringify(components, null, 1));

console.log(`files aggregated: ${files.length}`);
console.log('\nDISTINCT COMPUTED VALUES ACROSS THE PUBLIC SITE');
for (const [prop, v] of Object.entries(out).sort((a, b) => b[1].distinct - a[1].distinct)) {
  console.log(`  ${prop.padEnd(26)} ${String(v.distinct).padStart(4)} distinct   (${v.total} occurrences)`);
}
console.log('\nCOMPONENT INSTANCES (laptop viewport)');
for (const [k, v] of Object.entries(components)) console.log(`  ${k.padEnd(10)} ${v.length}`);
