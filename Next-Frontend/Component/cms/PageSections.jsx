// Server Component. Renders a CMS page's ordered, visible blocks. Two kinds:
//   - `section` blocks  → a rich component from the registry, given the block's
//     `settings` and — when the page was fetched with ?resolve=1 — the `data`
//     those settings resolve to (its rows). Without `data` it fetches for itself.
//   - content blocks     → the generic presentational renderers (blocks.jsx)
// Unknown types are skipped, never thrown, so a stray block can't break a page.
import { SECTION_COMPONENTS } from './sectionRegistry.js';
import { BLOCK_RENDERERS } from './blocks.jsx';

export default function PageSections({ blocks = [] }) {
    const ordered = [...blocks]
        .filter((b) => b && b.visible !== false)
        .sort((a, b) => (a.order || 0) - (b.order || 0));

    return (
        <>
            {ordered.map((block, i) => {
                if (block.type === 'section') {
                    const Section = SECTION_COMPONENTS[block.settings?.component];
                    return Section ? <Section key={block._id || block.key || i} settings={block.settings} data={block.data} /> : null;
                }
                const Renderer = BLOCK_RENDERERS[block.type];
                return Renderer ? <Renderer key={block._id || block.key || i} block={block} /> : null;
            })}
        </>
    );
}
