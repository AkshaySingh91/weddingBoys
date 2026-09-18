import slugify from 'slugify';

const toId = (text) => slugify(text, { lower: true, strict: true, remove: /[*+~.()'"!:@]/g }) || 'section';

// Strip inner HTML tags and decode a couple of common entities to get plain heading text.
const stripTags = (html) => html
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&nbsp;/g, ' ')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .trim();

// Walk the Tiptap-rendered HTML, build a table of contents for H2/H3/H4, and
// inject stable, unique anchor ids onto each heading so the public page can
// deep-link and the sticky TOC can scroll-spy. Returns { html, toc }.
export function extractTableOfContents(html = '') {
    if (!html || typeof html !== 'string') return { html: html || '', toc: [] };

    const toc = [];
    const usedIds = new Set();

    const newHtml = html.replace(/<h([2-4])([^>]*)>([\s\S]*?)<\/h\1>/gi, (match, level, attrs, inner) => {
        const text = stripTags(inner);
        if (!text) return match;

        // Reuse an existing id if the heading already has one, else derive from text.
        const existing = /id\s*=\s*["']([^"']+)["']/i.exec(attrs);
        let id = existing ? existing[1] : toId(text);

        // Ensure uniqueness across the document.
        let unique = id;
        let n = 2;
        while (usedIds.has(unique)) {
            unique = `${id}-${n}`;
            n += 1;
        }
        usedIds.add(unique);

        toc.push({ id: unique, text, level: Number(level) });

        const attrsWithoutId = attrs.replace(/\s*id\s*=\s*["'][^"']*["']/i, '');
        return `<h${level}${attrsWithoutId} id="${unique}">${inner}</h${level}>`;
    });

    return { html: newHtml, toc };
}

export default extractTableOfContents;
