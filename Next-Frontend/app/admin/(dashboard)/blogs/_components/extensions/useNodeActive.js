'use client';

/**
 * Is this node view the one the author is working in?
 *
 * Tiptap's `selected` prop means a ProseMirror **NodeSelection** — the whole
 * node picked up as a single unit. For a leaf like an image that is what a click
 * produces, so `selected` works. For a node that CONTAINS blocks — a container,
 * a callout — clicking lands the caret in a paragraph inside it and creates a
 * TextSelection instead, and `selected` stays false forever.
 *
 * Both of those node views gated their controls on `selected`, so in practice
 * the controls never appeared: the callout's variant picker (Note → Pro Tip,
 * Vendor, Testimonial) and the container's whole colour/size toolbar could not
 * be opened by any normal click. The attributes existed and rendered correctly
 * on the published page; there was simply no way to reach them.
 *
 * So "active" means selected as a node, OR the selection sits anywhere inside
 * this node's range.
 */
import { useEffect, useState } from 'react';

export function useNodeActive({ editor, getPos, node, selected }) {
    const [inside, setInside] = useState(false);

    useEffect(() => {
        if (!editor) return undefined;

        const update = () => {
            let pos = null;
            // getPos throws if the node has been removed from the document.
            try {
                pos = typeof getPos === 'function' ? getPos() : null;
            } catch {
                pos = null;
            }
            if (pos === null || pos === undefined || Number.isNaN(pos)) {
                setInside(false);
                return;
            }
            const { from, to } = editor.state.selection;
            const end = pos + node.nodeSize;
            setInside(from >= pos && to <= end);
        };

        update();
        editor.on('selectionUpdate', update);
        editor.on('transaction', update);
        return () => {
            editor.off('selectionUpdate', update);
            editor.off('transaction', update);
        };
    }, [editor, getPos, node]);

    return Boolean(selected) || inside;
}

export default useNodeActive;
