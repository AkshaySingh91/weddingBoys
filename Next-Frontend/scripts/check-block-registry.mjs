#!/usr/bin/env node
/**
 * Guard: every Tiptap node the editor can emit must have a public renderer.
 *
 * Three blocks once wrote under one name and were read under another
 * (`inlineMedia` vs `image`, gallery `items` vs `images`, video `poster` vs
 * `thumbnail`). Nothing threw — `renderAst` degrades an unknown node to a bare
 * <div> — so inserted images, galleries and videos simply vanished between the
 * editor and the published page.
 *
 * This runs as `prebuild`, so the mismatch fails the build instead of shipping.
 */
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const EXT_DIR = join(root, 'app/admin/(dashboard)/blogs/_components/extensions');
const REGISTRY = join(root, 'lib/blog/blockRegistry.js');

// Nodes that are structural or handled by StarterKit, not by a custom renderer.
const EXEMPT = new Set(['doc', 'text']);

/**
 * Nodes that come from @tiptap packages rather than extensions/, so the scan
 * below cannot see them. Registering one in the editor without a renderer fails
 * exactly the same way, so they are listed explicitly.
 *
 * Keep in sync with the `extensions: [...]` array in Editor.jsx.
 */
const PACKAGE_NODES = [
    'paragraph', 'heading', 'text', 'bulletList', 'orderedList', 'listItem',
    'taskList', 'taskItem', 'blockquote', 'codeBlock', 'horizontalRule',
    'hardBreak', 'image',
    // Layout uses custom `container`/`layoutGrid`/`layoutCell` nodes, which this
    // script detects automatically from extensions/. @tiptap/extension-table is
    // installed but deliberately not registered — a table is a data structure,
    // not a layout primitive, and would emit <table> markup for a visual grid.
];

const registrySrc = readFileSync(REGISTRY, 'utf8');
const registered = new Set(
    [...registrySrc.matchAll(/^\s{2}([a-zA-Z][a-zA-Z0-9]*)\s*:/gm)].map((m) => m[1]),
);

/**
 * Only `Node.create` declarations need a renderer.
 *
 * `Extension.create` (typography attributes, keymaps) and `Mark.create` add
 * behaviour to existing nodes and never appear as a node type in the document,
 * so requiring a registry entry for them would be a false positive.
 */
const declared = [];
for (const file of readdirSync(EXT_DIR)) {
    if (!/\.(jsx?|tsx?)$/.test(file)) continue;
    const src = readFileSync(join(EXT_DIR, file), 'utf8');

    for (const m of src.matchAll(/\bname:\s*'([a-zA-Z][a-zA-Z0-9]*)'/g)) {
        // Walk back to the nearest `X.create(` and keep only Nodes.
        const before = src.slice(0, m.index);
        const kind = [...before.matchAll(/\b(Node|Mark|Extension)\.create\s*\(/g)].pop()?.[1];
        if (kind === 'Node') declared.push({ name: m[1], file });
    }
}

for (const name of PACKAGE_NODES) declared.push({ name, file: '@tiptap package' });

const missing = declared.filter(
    ({ name }) => !EXEMPT.has(name) && !registered.has(name),
);

if (missing.length) {
    console.error('\n✖ Blog block registry is out of sync.\n');
    console.error('  These editor nodes have no renderer, so their content would');
    console.error('  silently disappear on the published page:\n');
    for (const { name, file } of missing) {
        console.error(`    ${name.padEnd(22)} declared in extensions/${file}`);
    }
    console.error('\n  Fix: add an entry to lib/blog/blockRegistry.js.\n');
    process.exit(1);
}

console.log(`✓ blog blocks: ${declared.length} editor nodes, all registered`);
