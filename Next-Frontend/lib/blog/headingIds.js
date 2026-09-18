/**
 * Anchor ids for headings, computed once per document.
 *
 * These ids must match the ones the backend injects into the HTML cache
 * (Backend/Utils/tocExtractor.js), because `post.tableOfContents` is built there
 * and the sticky TOC scroll-spies against it.
 *
 * Two things previously diverged: the frontend omitted the backend's `remove`
 * option, so any heading with punctuation got a different id; and the frontend
 * did not de-duplicate, so two identically-titled headings produced two
 * identical DOM ids and the TOC link for the second one went to the first.
 *
 * De-duplication needs to see the whole document, which a per-node component
 * cannot. So it happens here, in one pass, and the result is threaded down.
 */
import slugify from 'slugify';

/** Must stay identical to `toId` in Backend/Utils/tocExtractor.js. */
export const toHeadingId = (text) =>
    slugify(String(text || ''), { lower: true, strict: true, remove: /[*+~.()'"!:@]/g }) || 'section';

const textOf = (node) => {
    if (!node) return '';
    if (node.type === 'text') return node.text || '';
    if (node.content) return node.content.map(textOf).join('');
    return '';
};

/**
 * Walk a Tiptap doc and assign every heading a unique id, in document order.
 *
 * Keyed by node identity, so two headings with the same text still resolve to
 * their own entry.
 *
 * @returns {WeakMap<object, string>}
 */
export function buildHeadingIds(doc) {
    const ids = new WeakMap();
    const used = new Set();
    if (!doc?.content) return ids;

    const visit = (node) => {
        if (!node || typeof node !== 'object') return;
        if (node.type === 'heading') {
            const text = textOf(node);
            if (text) {
                const base = toHeadingId(text);
                let unique = base;
                let n = 2;
                while (used.has(unique)) { unique = `${base}-${n}`; n += 1; }
                used.add(unique);
                ids.set(node, unique);
            }
        }
        // Headings can live inside containers, grid cells and list items, so the
        // walk cannot stop at the top level.
        (node.content || []).forEach(visit);
    };
    doc.content.forEach(visit);
    return ids;
}
