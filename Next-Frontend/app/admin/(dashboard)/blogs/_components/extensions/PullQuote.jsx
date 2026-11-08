'use client';

import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer, NodeViewWrapper, NodeViewContent } from '@tiptap/react';
import { Quotes, Trash } from '@phosphor-icons/react';

function PullQuoteView({ node, updateAttributes, deleteNode, selected }) {
    const variant = node.attrs.variant || 'default';
    const attribution = node.attrs.attribution || '';

    return (
        <NodeViewWrapper className={`my-8 px-6 sm:px-12 text-center transition-all ${selected ? 'ring-2 ring-accent rounded-xl' : ''}`}>
            <div className="relative" contentEditable={false}>
                <span className="font-playfair text-6xl text-accent-ink/15 select-none" aria-hidden="true">&quot;</span>
            </div>
            <NodeViewContent className="-mt-6 font-playfair text-xl sm:text-2xl italic leading-relaxed text-ink" />
            {selected && (
                <div className="mt-4 flex flex-col items-center gap-3" contentEditable={false}>
                    <div className="flex items-center gap-2">
                        <select
                            value={variant}
                            onChange={(e) => updateAttributes({ variant: e.target.value })}
                            className="rounded-lg border border-edge-subtle bg-white px-2 py-1 text-xs text-ink font-medium focus:outline-none focus:border-accent"
                        >
                            <option value="default">Default</option>
                            <option value="with-attribution">With Attribution</option>
                        </select>
                        <button
                            type="button"
                            onClick={() => deleteNode()}
                            className="rounded-lg p-1 text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                            title="Remove pull quote"
                        >
                            <Trash size={14} />
                        </button>
                    </div>
                    {variant === 'with-attribution' && (
                        <input
                            type="text"
                            value={attribution}
                            onChange={(e) => updateAttributes({ attribution: e.target.value })}
                            placeholder="Attribution (e.g. couple name)"
                            className="w-full max-w-xs rounded-lg border border-edge-subtle bg-white px-3 py-1.5 text-center text-sm text-ink focus:outline-none focus:border-accent"
                        />
                    )}
                </div>
            )}
        </NodeViewWrapper>
    );
}

export const PullQuote = Node.create({
    name: 'pullQuote',
    group: 'block',
    content: 'inline*',
    defining: true,

    addAttributes() {
        return {
            variant: {
                default: 'default',
                parseHTML: (el) => el.getAttribute('data-variant') || 'default',
                renderHTML: (attrs) => ({ 'data-variant': attrs.variant }),
            },
            attribution: {
                default: '',
                parseHTML: (el) => el.getAttribute('data-attribution') || '',
                renderHTML: (attrs) => ({ 'data-attribution': attrs.attribution }),
            },
        };
    },

    parseHTML() {
        return [{ tag: 'div[data-pull-quote]' }];
    },

    renderHTML({ HTMLAttributes }) {
        return [
            'div',
            mergeAttributes(HTMLAttributes, { 'data-pull-quote': '', class: 'pull-quote' }),
            0,
        ];
    },

    addNodeView() {
        return ReactNodeViewRenderer(PullQuoteView);
    },

    addCommands() {
        return {
            setPullQuote: (attrs = {}) => ({ commands }) =>
                commands.insertContent({
                    type: this.name,
                    attrs: { variant: 'default', ...attrs },
                    content: [{ type: 'text', text: 'Enter your pull quote here...' }],
                }),
        };
    },
});

export default PullQuote;
