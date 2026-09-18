/**
 * Sanitiser for the derived HTML cache.
 *
 * `blogPost.content` is documented as a "Sanitized HTML cache" and is rendered
 * through `dangerouslySetInnerHTML` whenever a post has no `contentJson`
 * (BlogRenderer.jsx). Nothing actually sanitised it, and no sanitiser was
 * installed — the requirement existed on paper only (SRS NFR-SEC-01).
 *
 * The allowlist mirrors what the editor's nodes can legitimately produce, so
 * sanitising is lossless for real content while dropping anything scriptable.
 */
import sanitizeHtmlLib from 'sanitize-html';

const OPTIONS = {
    allowedTags: [
        'p', 'br', 'hr', 'span', 'div',
        'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
        'strong', 'b', 'em', 'i', 'u', 's', 'mark', 'code', 'pre', 'blockquote',
        'ul', 'ol', 'li',
        'a', 'img', 'figure', 'figcaption',
        'table', 'thead', 'tbody', 'tr', 'th', 'td',
        'sub', 'sup',
    ],
    allowedAttributes: {
        a: ['href', 'title', 'target', 'rel'],
        img: ['src', 'alt', 'title', 'width', 'height', 'loading', 'fetchpriority', 'style', 'class'],
        // The editor encodes block config as data-* on the wrapper; keeping it
        // means the HTML cache stays a faithful mirror of the JSON.
        '*': ['class', 'id', 'style', 'data-*'],
    },
    allowedSchemes: ['http', 'https', 'mailto', 'tel'],
    allowedSchemesByTag: { img: ['http', 'https', 'data'] },
    // Inline styles are how alignment/aspect-ratio/LQIP reach the cache; allow
    // only presentational properties, never behaviour.
    allowedStyles: {
        '*': {
            // Named colours are included so legacy content is not silently
            // stripped; the editor itself only ever emits hex from the palette.
            'color': [/^#[0-9a-f]{3,8}$/i, /^rgba?\(/i, /^var\(--/, /^[a-z]+$/i],
            'background-color': [/^#[0-9a-f]{3,8}$/i, /^rgba?\(/i, /^var\(--/, /^[a-z]+$/i],
            'background-image': [/^url\(data:image\//i],
            'background-size': [/^(cover|contain|auto)$/],
            'background-position': [/^[\w\s%-]+$/],
            'text-align': [/^(left|right|center|justify)$/],
            // Families arrive as CSS custom properties (var(--font-playfair)), so
            // parentheses are needed — but ONLY for var(). Allowing parentheses
            // generally would also permit expression(...), a CSS injection
            // vector. Each comma-separated item must be a var() or a bare name.
            'font-family': [
                /^\s*(var\(\s*--[\w-]+\s*\)|['"]?[\w\s-]+['"]?)(\s*,\s*(var\(\s*--[\w-]+\s*\)|['"]?[\w\s-]+['"]?))*\s*$/,
            ],
            'font-size': [/^\d+(\.\d+)?(px|rem|em|%)$/],
            'line-height': [/^\d+(\.\d+)?(px|rem|em|%)?$/],
            'letter-spacing': [/^-?\d+(\.\d+)?(px|rem|em)$/],
            'aspect-ratio': [/^[\d./\s]+$/],
            'max-width': [/^\d+(\.\d+)?(px|rem|em|%)$/],
            // The layout grid's whole template travels as these three custom
            // properties: a row cannot be given a column template directly,
            // because renderHTML only ever sees its own node and so cannot know
            // its parent's ratio. Each value is shape-locked to a literal —
            // a list of fr units, one length, one keyword, one integer — so none
            // of them can carry anything but the geometry they exist for.
            '--wb-cols': [/^\d+(\.\d+)?fr(\s+\d+(\.\d+)?fr)*$/],
            '--wb-gap': [/^\d+(\.\d+)?(px|rem|em)$/],
            '--wb-align': [/^(start|center|stretch|end)$/],
            '--wb-row-h': [/^\d+(\.\d+)?(px|rem|em)$/],
            // Row track sizes, and each cell's placement in the grid. Integers
            // and lengths only — geometry, with nowhere to hide a payload.
            // Row tracks: `auto`, a length, or `minmax(<length>, auto)` — a row
            // height is a floor rather than a fixed size, so text is never cut
            // off. Still only geometry; `minmax` is spelled out rather than
            // allowing arbitrary functions.
            '--wb-rows': [/^(auto|\d+(\.\d+)?(px|rem|em)|minmax\(\d+(\.\d+)?(px|rem|em), ?auto\))( (auto|\d+(\.\d+)?(px|rem|em)|minmax\(\d+(\.\d+)?(px|rem|em), ?auto\)))*$/],
            '--wb-col': [/^\d{1,2}$/],
            '--wb-colspan': [/^\d{1,2}$/],
            '--wb-row': [/^\d{1,3}$/],
            '--wb-rowspan': [/^\d{1,3}$/],
            // Exactly two percentages: where a cropped photo sits in its frame.
            // The author drags to set it, so it cannot be an enumerated class.
            'object-position': [/^\d{1,3}% \d{1,3}%$/],
            'border-radius': [/^\d+(\.\d+)?(px|rem|em|%)$/],
            // A container's free-value overrides. Lengths and a border style
            // keyword only — the author types a number, never a declaration.
            'width': [/^\d+(\.\d+)?(px|rem|em|%|vw)$/],
            'min-height': [/^\d+(\.\d+)?(px|rem|em|%|vh)$/],
            'padding': [/^\d+(\.\d+)?(px|rem|em)$/],
            'border-width': [/^\d+(\.\d+)?(px|rem|em)$/],
            'border-style': [/^(solid|dashed|dotted|none)$/],
            'border-color': [/^#[0-9a-f]{3,8}$/i, /^rgba?\(/i],
            '--span': [/^\d{1,2}$/],
        },
    },
    // A link the author did not write should not be able to reach window.opener.
    transformTags: {
        a: sanitizeHtmlLib.simpleTransform('a', { rel: 'noopener noreferrer' }, true),
    },
    disallowedTagsMode: 'discard',
};

/** @returns {string} HTML safe to inject. Never throws on malformed input. */
export function sanitizeBlogHtml(html) {
    if (!html || typeof html !== 'string') return '';
    return sanitizeHtmlLib(html, OPTIONS);
}

export default sanitizeBlogHtml;
