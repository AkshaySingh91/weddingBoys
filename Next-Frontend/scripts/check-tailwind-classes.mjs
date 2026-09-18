#!/usr/bin/env node
/**
 * Build guard: Tailwind v4 class names against a Tailwind v3 install.
 *
 * This project pins Tailwind 3.4.x. A v4-only utility is not an error anywhere
 * — PostCSS simply does not match it, emits nothing, and the element renders
 * unstyled. That is the same failure mode as the arbitrary variant
 * `md:[grid-template-columns:var(--cols)]`, which generated zero CSS and made
 * every grid render as a single column until it was measured in a browser.
 *
 * Five of these were sitting in lib/blog/blocks when the grid audit started
 * (`shadow-xs` twice, `scale-103`, `scale-104`, `duration-600`), each silently
 * dropping a shadow or an animation on the published page. Grepping for the
 * class is cheap; noticing a missing shadow by eye is not.
 *
 * Run as part of `prebuild`, beside check-block-registry.mjs.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';
import { createRequire } from 'node:module';

// Read the project's own config so a utility the theme defines is not reported.
// Without this the guard would demand that deliberately-subtle values like
// `scale-102` be rewritten to Tailwind's nearest default (5%), changing the
// design rather than fixing the bug.
const require = createRequire(import.meta.url);
let extend = {};
try {
    extend = require(join(process.cwd(), 'tailwind.config.js'))?.theme?.extend ?? {};
} catch (error) {
    // Say so. Falling back silently means every theme-defined utility gets
    // reported as broken, and the resulting wall of false positives looks
    // exactly like a real regression.
    console.warn(`! could not read tailwind.config.js (${error.message}) — theme-defined utilities will be reported`);
}
const defined = (key, value) => Object.keys(extend[key] ?? {}).includes(String(value));

const ROOTS = ['app', 'lib', 'components', 'Components'];
const EXTS = new Set(['.js', '.jsx', '.ts', '.tsx']);
const SKIP = new Set(['node_modules', '.next', '.git', 'dist', 'build']);

/**
 * Each entry is a v4-only spelling plus the v3 equivalent. Kept explicit rather
 * than pattern-matched: a scale of `scale-105` is valid v3 and must not trip.
 */
const V4_ONLY = [
    [/\bshadow-(xs|2xs)\b/g, 'shadow-sm', (m) => defined('boxShadow', m.slice(7))],
    [/\boutline-hidden\b/g, 'outline-none'],
    [/\b(?:backdrop-)?blur-xs\b/g, 'blur-sm', () => defined('blur', 'xs')],
    [/\brounded-4xl\b/g, 'rounded-[2rem]', () => defined('borderRadius', '4xl')],
    // v3 ships a fixed scale; anything off it, and not added to the theme,
    // produces no CSS.
    [
        /\bscale-(?!0\b|50\b|75\b|90\b|95\b|100\b|105\b|110\b|125\b|150\b)(\d+)\b/g,
        'the nearest of scale-95/100/105/110/125/150, or add it to theme.extend.scale',
        (m) => defined('scale', m.replace('scale-', '')),
    ],
    [
        /\bduration-(?!0\b|75\b|100\b|150\b|200\b|300\b|500\b|700\b|1000\b)(\d+)\b/g,
        'the nearest of duration-300/500/700, or add it to theme.extend.transitionDuration',
        (m) => defined('transitionDuration', m.replace('duration-', '')),
    ],
    [
        /\baspect-(\d+\/\d+)\b/g,
        'an arbitrary value like aspect-[4/3], or add it to theme.extend.aspectRatio',
        (m) => defined('aspectRatio', m.replace('aspect-', '')),
    ],
];

function* walk(dir) {
    let entries;
    try { entries = readdirSync(dir); } catch { return; }
    for (const name of entries) {
        if (SKIP.has(name)) continue;
        const full = join(dir, name);
        let st;
        try { st = statSync(full); } catch { continue; }
        if (st.isDirectory()) yield* walk(full);
        else if (EXTS.has(extname(name))) yield full;
    }
}

const findings = [];
for (const root of ROOTS) {
    for (const file of walk(root)) {
        const src = readFileSync(file, 'utf8');
        const lines = src.split('\n');
        for (const [pattern, fix, isDefined] of V4_ONLY) {
            lines.forEach((line, i) => {
                // Only look inside class strings; prose and comments are noise.
                if (!/class(Name)?\s*[=:]|cls|['"`][^'"`]*\b(flex|grid|text-|bg-|p-|m-)/.test(line)) return;
                for (const m of line.matchAll(pattern)) {
                    if (isDefined?.(m[0])) continue;   // the theme defines it
                    findings.push({ file, line: i + 1, cls: m[0], fix });
                }
            });
        }
    }
}

if (findings.length) {
    console.error(`\n✗ Tailwind v4 class names found (this project is on v3 — these generate NO CSS):\n`);
    for (const f of findings) {
        console.error(`  ${f.file}:${f.line}  ${f.cls}  →  use ${f.fix}`);
    }
    console.error('');
    process.exit(1);
}

console.log('✓ tailwind classes: no v4-only utilities');
