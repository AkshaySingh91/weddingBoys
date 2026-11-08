#!/usr/bin/env node
/**
 * Admin design-token guard (runs in `prebuild`).
 *
 * The admin drifted into 46 hand-picked hex colours, three palettes and a
 * component kit that was optional. It now draws from the same tokens as the
 * public site (tailwind.config.js `ground` / `ink` / `accent` / `gold` / `edge`).
 * This keeps it that way:
 *
 *   1. No raw hex colours in class names under app/admin (or the admin shell).
 *   2. No serif display faces in the admin — it is a working tool; headings are
 *      sans. The blog editor is exempt: it previews published article type.
 *   3. Tailwind stone/gray classes may only go down. They are the old neutral
 *      system; the remaining ones are light-on-dark or disabled text that needs
 *      a per-screen decision. Lower STONE_BASELINE as they are migrated.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const TARGETS = ['app/admin', 'Component/AdminSidebar.jsx', 'Component/Header.jsx'];
const FONT_EXEMPT = /app\/admin\/\(dashboard\)\/blogs\/_components\/(Editor|extensions\/)/;
const STONE_BASELINE = 74;

const files = [];
const walk = (p) => {
    if (!fs.existsSync(p)) return;
    const s = fs.statSync(p);
    if (s.isDirectory()) for (const e of fs.readdirSync(p)) walk(path.join(p, e));
    else if (/\.(jsx?|mjs|tsx?)$/.test(p)) files.push(p);
};
for (const t of TARGETS) walk(path.join(root, t));

const problems = [];
let stone = 0;
for (const file of files) {
    const rel = path.relative(root, file);
    const lines = fs.readFileSync(file, 'utf8').split('\n');
    lines.forEach((line, i) => {
        if (/^\s*(\*|\/\/)/.test(line)) return;
        const hex = line.match(/\b[a-z-]+-\[#[0-9a-fA-F]{3,8}\]/g);
        if (hex) problems.push(`${rel}:${i + 1}  raw colour ${hex.join(', ')} — use a token (ground / ink / accent / gold / edge)`);
        if (!FONT_EXEMPT.test(rel)) {
            const serif = line.match(/\bfont-(serif|playfair|lora|dmserif|cinzel)\b/g);
            if (serif) problems.push(`${rel}:${i + 1}  ${serif.join(', ')} — admin headings are font-sans`);
        }
        stone += (line.match(/\b[a-z-]+-(?:stone|gray)-\d{2,3}\b/g) || []).length;
    });
}
if (stone > STONE_BASELINE) {
    problems.push(`stone/gray classes rose to ${stone} (baseline ${STONE_BASELINE}) — use ink / ground / edge tokens`);
}

if (problems.length) {
    console.error(`✗ admin tokens: ${problems.length} problem(s)\n  ${problems.join('\n  ')}`);
    process.exit(1);
}
console.log(`✓ admin tokens: no raw colours, no serif headings, stone/gray ${stone}/${STONE_BASELINE}`);
