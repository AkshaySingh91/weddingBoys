'use client';

import { useEffect, useState } from 'react';
import { getPageContent, findBlock } from '@/lib/contentApi.js';
import { BLOCK_RENDERERS } from './blocks.jsx';

function renderBlock(block, key) {
    if (!block || block.visible === false) return null;
    const Renderer = BLOCK_RENDERERS[block.type];
    if (!Renderer) return null;
    return <Renderer key={key} block={block} />;
}

/**
 * Render a single named block from a page (for interleaving CMS content into an
 * otherwise hand-built page). `block` matches a block's `key` or its `type`.
 */
export function CmsSection({ pageKey, block: blockKey }) {
    const [page, setPage] = useState(null);

    useEffect(() => {
        let alive = true;
        getPageContent(pageKey).then((p) => { if (alive) setPage(p); });
        return () => { alive = false; };
    }, [pageKey]);

    if (!page) return null;
    return renderBlock(findBlock(page, blockKey), blockKey);
}

/** Render an entire page's visible blocks in order (fully CMS-driven page). */
export default function CmsSections({ pageKey }) {
    const [page, setPage] = useState(null);

    useEffect(() => {
        let alive = true;
        getPageContent(pageKey).then((p) => { if (alive) setPage(p); });
        return () => { alive = false; };
    }, [pageKey]);

    if (!page) return null;
    return (
        <>
            {(page.blocks || [])
                .filter((b) => b.visible !== false)
                .map((b, i) => renderBlock(b, b._id || i))}
        </>
    );
}
