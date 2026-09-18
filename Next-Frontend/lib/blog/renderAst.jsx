/**
 * AST Node Renderer — recursively walks the Tiptap JSON AST and maps
 * each node to a React component via the block registry.
 */
import { getBlockComponent } from './blockRegistry';
import { buildHeadingIds } from './headingIds.js';
import { placeFromJson } from '@/app/admin/(dashboard)/blogs/_components/extensions/layout/gridOps.js';

/**
 * Where every grid cell sits, keyed by the cell's own JSON object.
 *
 * A cell renderer receives only its own node, so it cannot work out its column
 * and row — those depend on every cell before it, including ones that span down
 * from earlier rows. Resolving it once for the whole document and handing each
 * cell its answer is the same approach heading ids already use.
 */
function buildGridPlacements(doc) {
    const map = new Map();
    const walk = (node) => {
        if (!node) return;
        if (node.type === 'layoutGrid') {
            for (const [cell, place] of placeFromJson(node)) map.set(cell, place);
        }
        (node.content || []).forEach(walk);
    };
    (doc.content || []).forEach(walk);
    return map;
}

/**
 * Render inline marks (bold, italic, underline, strike, link, code, etc.)
 */
function renderMarks(text, marks) {
  if (!marks || marks.length === 0) return text;

  return marks.reduce((acc, mark) => {
    switch (mark.type) {
      case 'bold':
        return <strong>{acc}</strong>;
      case 'italic':
        return <em>{acc}</em>;
      case 'underline':
        return <u>{acc}</u>;
      case 'strike':
        return <s>{acc}</s>;
      case 'code':
        return (
          <code className="rounded bg-studio-canvas px-1.5 py-0.5 font-mono text-sm text-studio-terracotta">
            {acc}
          </code>
        );
      case 'link':
        return (
          <a
            href={mark.attrs?.href}
            target={mark.attrs?.target || '_blank'}
            rel="noopener noreferrer"
            className="text-studio-terracotta underline decoration-studio-terracotta/30 underline-offset-2 transition-colors hover:text-studio-terracottaDark hover:decoration-studio-terracottaDark/50"
          >
            {acc}
          </a>
        );
      case 'textStyle': {
        // textStyle carries every curated typography attribute, not just colour.
        // Reading only `color` silently dropped font, size and tracking between
        // the editor and the page — the same failure mode as the block-name
        // mismatches. Undefined values are omitted so React writes no style.
        const a = mark.attrs || {};
        const style = {};
        if (a.color) style.color = a.color;
        if (a.fontFamily) style.fontFamily = a.fontFamily;
        if (a.fontSize) style.fontSize = a.fontSize;
        if (a.letterSpacing) style.letterSpacing = a.letterSpacing;
        return Object.keys(style).length ? <span style={style}>{acc}</span> : acc;
      }
      case 'highlight':
        return (
          <mark
            className="rounded px-0.5"
            style={{ backgroundColor: mark.attrs?.color || '#FAF1E6', color: 'inherit' }}
          >
            {acc}
          </mark>
        );
      default:
        return acc;
    }
  }, text);
}

/**
 * Render children of a node (inline text or nested blocks).
 */
export function renderContent(content, template, post, ctx) {
  if (!content || !Array.isArray(content)) return null;

  return content.map((node, idx) => {
    // Text nodes (leaf)
    if (node.type === 'text') {
      return (
        <span key={idx}>
          {renderMarks(node.text, node.marks)}
        </span>
      );
    }

    // Block nodes — look up in registry
    return renderNode(node, idx, template, post, ctx);
  });
}

/**
 * Render a single AST node. Recursively renders children.
 */
export function renderNode(node, key, template, post, ctx) {
  const Component = getBlockComponent(node.type);

  if (!Component) {
    // Unknown block type — render children as plain content (graceful degradation)
    if (node.content) {
      return <div key={key}>{renderContent(node.content, template, post, ctx)}</div>;
    }
    return null;
  }

  // Render the component, passing children as rendered content
  const children = node.content ? renderContent(node.content, template, post, ctx) : null;

  return (
    <Component
      key={key}
      node={node}
      template={template}
      post={post}
      headingId={ctx?.headingIds?.get(node)}
      placement={ctx?.gridPlacements?.get(node)}
    >
      {children}
    </Component>
  );
}

/**
 * Render an entire Tiptap JSON document.
 * @param {Object} doc - The full Tiptap JSON document ({ type: 'doc', content: [...] })
 * @param {string} template - The active story template name
 * @param {Object} post - The full blog post data (for blocks that need metadata)
 */
export function renderDocument(doc, template, post) {
  if (!doc || !doc.content) return null;
  // Heading ids are de-duplicated across the whole document, which only this
  // level can see; each HeadingBlock receives its own id via `headingId`.
  const ctx = { headingIds: buildHeadingIds(doc), gridPlacements: buildGridPlacements(doc) };
  return renderContent(doc.content, template, post, ctx);
}
