import { Extension } from '@tiptap/core';
import { Plugin, PluginKey, NodeSelection, TextSelection } from '@tiptap/pm/state';

/**
 * Notion-style gutter handle: hover a block, get a grip to drag it and a
 * button to act on it.
 *
 * Implemented as a ProseMirror plugin rather than a React overlay so the handle
 * tracks the real document position — it survives re-renders, works inside
 * nested content (which Stage 2's grid and container will need), and lets
 * ProseMirror itself compute the drop position rather than reimplementing that.
 */
export const blockHandleKey = new PluginKey('blockHandle');

/** Nodes that hold blocks directly; a handle targets their immediate children. */
const CONTAINER_NODES = new Set(['doc', 'layoutCell', 'container']);

/** Measure a block against the positioned wrapper the gutter renders into. */
function measure(view, pos, node) {
    const dom = view.nodeDOM(pos);
    const el = dom?.nodeType === 1 ? dom : dom?.parentElement;
    if (!el) return null;
    const frame = view.dom.offsetParent || view.dom;
    const frameBox = frame.getBoundingClientRect();
    const blockBox = el.getBoundingClientRect();
    return {
        pos,
        nodeSize: node.nodeSize,
        // Drives whether "Turn into" is offered: an image or embed is an atom
        // with no text to convert.
        isTextblock: node.isTextblock || node.type.name === 'blockquote',
        typeName: node.type.name,
        top: blockBox.top - frameBox.top,
        left: blockBox.left - frameBox.left,
    };
}

export const BlockHandle = Extension.create({
    name: 'blockHandle',

    addOptions() {
        return {
            /** (info: {pos, nodeSize, top, left}) => void — the block holding the caret */
            onActiveBlock: null,
        };
    },

    addProseMirrorPlugins() {
        const { onActiveBlock } = this.options;
        let lastPos = null;

        /** Report a block, skipping redundant updates for the same one. */
        const report = (view, pos, node, force = false) => {
            if (!onActiveBlock) return;
            if (!force && lastPos === pos) return;
            const info = measure(view, pos, node);
            if (!info) return;
            lastPos = pos;
            onActiveBlock(info);
        };

        return [
            new Plugin({
                key: blockHandleKey,

                /**
                 * The handle follows the CARET, and stays put.
                 *
                 * It was previously hover-driven, which is unusable here: the
                 * gutter is rendered outside the editor's content box, so moving
                 * the pointer toward the grip fires `mouseleave` and removes the
                 * control you were reaching for. Anchoring to the selection means
                 * clicking a block gives it a handle that persists while you move
                 * the mouse, drag it, or use the keyboard.
                 */
                view: () => ({
                    update: (view, prevState) => {
                        if (!onActiveBlock) return;
                        const { state } = view;
                        const sameSelection = prevState
                            && prevState.selection.eq(state.selection)
                            && prevState.doc.eq(state.doc);
                        if (sameSelection) return;

                        const $pos = state.doc.resolve(state.selection.from);
                        if ($pos.depth === 0) {
                            // A node selection sitting directly in the doc.
                            const node = state.doc.nodeAt($pos.pos);
                            if (node) report(view, $pos.pos, node, true);
                            return;
                        }

                        /**
                         * Walk out to the block whose PARENT is a container —
                         * the doc, a layout cell, or a container box.
                         *
                         * Previously this always used depth 1, so a caret inside
                         * `doc > layoutGrid > layoutCell > paragraph` reported the
                         * whole grid: typing in one cell showed a handle that
                         * dragged the entire layout. Stopping at the nearest
                         * container gives each nested block its own handle, and
                         * the grid still gets one when it is selected as a node.
                         */
                        let depth = $pos.depth;
                        while (depth > 1 && !CONTAINER_NODES.has($pos.node(depth - 1).type.name)) {
                            depth -= 1;
                        }
                        report(view, $pos.before(depth), $pos.node(depth), true);
                    },
                }),
            }),
        ];
    },

    addCommands() {
        return {
            /** Select a whole block so it can be dragged, duplicated or deleted. */
            selectBlockAt: (pos) => ({ tr, dispatch }) => {
                if (dispatch) dispatch(tr.setSelection(NodeSelection.create(tr.doc, pos)));
                return true;
            },

            /**
             * Move a top-level block one slot up (-1) or down (+1).
             *
             * Delete-then-insert, with the target computed against the document
             * AFTER the delete: removing the node shifts everything below it
             * left by its own size, so a naive "insert at old sibling position"
             * lands one slot off.
             */
            moveBlockAt: (pos, dir) => ({ tr, state, dispatch }) => {
                const node = state.doc.nodeAt(pos);
                if (!node) return false;

                const $pos = state.doc.resolve(pos);
                const index = $pos.index();
                const parent = $pos.parent;
                const target = index + dir;
                if (target < 0 || target >= parent.childCount) return false;

                const sibling = parent.child(target);
                if (dispatch) {
                    tr.delete(pos, pos + node.nodeSize);
                    const insertAt = dir < 0 ? pos - sibling.nodeSize : pos + sibling.nodeSize;
                    tr.insert(insertAt, node);

                    // The caret MUST travel with the block. Without this it stays
                    // at the old document offset, which now holds a different
                    // block — so the gutter (which follows the caret) silently
                    // retargets, and the next action hits the wrong block.
                    tr.setSelection(
                        node.isTextblock
                            ? TextSelection.create(tr.doc, insertAt + 1)
                            : NodeSelection.create(tr.doc, insertAt),
                    );
                    dispatch(tr.scrollIntoView());
                }
                return true;
            },

            /** Insert an empty paragraph after a block and put the caret in it. */
            insertParagraphAfter: (pos) => ({ tr, state, dispatch }) => {
                const node = state.doc.nodeAt(pos);
                if (!node) return false;
                const at = pos + node.nodeSize;
                const para = state.schema.nodes.paragraph.create();
                if (dispatch) {
                    tr.insert(at, para);
                    // The caret MUST be set inside this transaction. Calling
                    // `editor.commands.focus(pos)` separately loses the race with
                    // the `.focus()` at the head of the caller's chain, which
                    // restores the previous selection after the command runs —
                    // so the new paragraph appeared but the caret never entered
                    // it, and an empty paragraph you cannot see looks like a
                    // button that did nothing.
                    tr.setSelection(TextSelection.create(tr.doc, at + 1));
                    dispatch(tr.scrollIntoView());
                }
                return true;
            },

            duplicateBlockAt: (pos) => ({ tr, state, dispatch }) => {
                const node = state.doc.nodeAt(pos);
                if (!node) return false;
                if (dispatch) dispatch(tr.insert(pos + node.nodeSize, node.copy(node.content)));
                return true;
            },

            deleteBlockAt: (pos) => ({ tr, state, dispatch }) => {
                const node = state.doc.nodeAt(pos);
                if (!node) return false;
                if (dispatch) dispatch(tr.delete(pos, pos + node.nodeSize));
                return true;
            },
        };
    },
});

export default BlockHandle;
