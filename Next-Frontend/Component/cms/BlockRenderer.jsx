// Server Component. Maps a block array (from the CMS payload) onto the correct
// renderer by `block.type`. Because this and the block components are RSCs, the
// static blocks emit pure HTML with no client JS; only a block that opts into
// interactivity (via its own 'use client') would ship a bundle, and only when
// actually present on the page. This is the "map by type, don't bloat the
// bundle" strategy realised through the server/client boundary rather than
// manual next/dynamic wiring.
import { BLOCK_RENDERERS } from './blocks.jsx';

export default function BlockRenderer({ blocks = [] }) {
    return (
        <>
            {blocks
                .filter((b) => b && b.visible !== false)
                .sort((a, b) => (a.order || 0) - (b.order || 0))
                .map((block, i) => {
                    const Renderer = BLOCK_RENDERERS[block.type];
                    if (!Renderer) return null; // unknown type → skip, never crash
                    return <Renderer key={block._id || i} block={block} />;
                })}
        </>
    );
}
