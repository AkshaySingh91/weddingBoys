'use client';

import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer, NodeViewWrapper, NodeViewContent } from '@tiptap/react';
import { Note, Trophy, Quotes, Trash, Lightbulb, Warning } from '@phosphor-icons/react';
import { useNodeActive } from './useNodeActive.js';

// Styled callout with editable inner content. Variants map to a colour + icon
// for vendor credits, photographer notes, and couple testimonials.
const VARIANTS = {
    note: { label: 'Note', icon: Note, cls: 'rounded-r-xl border-l-4 border-amber-600 bg-amber-50/60 text-amber-950' },
    vendor: { label: 'Vendor Credit', icon: Trophy, cls: 'rounded-r-xl border-l-4 border-accent bg-ground-sunk/80 text-ink' },
    testimonial: { label: 'Testimonial', icon: Quotes, cls: 'rounded-r-xl border-l-4 border-ink bg-ground text-ink italic' },
    // A full panel rather than a left bar — see lib/blog/blocks/CalloutBlock.jsx.
    protip: { label: 'Pro Tip', icon: Lightbulb, cls: 'rounded-xl border border-gold/50 bg-ground text-ink' },
    warning: { label: 'Watch Out', icon: Warning, cls: 'rounded-xl border border-accent bg-accent-wash/60 text-ink' },
};

function CalloutView({ node, updateAttributes, deleteNode, selected, editor, getPos }) {
    // See useNodeActive: a callout holds paragraphs, so clicking it gives a
    // TextSelection and `selected` stays false — which left the variant picker
    // (Note / Pro Tip / Vendor / Testimonial / Watch Out) permanently hidden.
    const active = useNodeActive({ editor, getPos, node, selected });
    const variant = node.attrs.variant || 'note';
    const cfg = VARIANTS[variant] || VARIANTS.note;
    const Icon = cfg.icon;

    return (
        <NodeViewWrapper className={`my-5 p-4 transition-all font-sans ${cfg.cls} ${active ? 'ring-2 ring-accent' : ''}`}>
            <div className="flex items-center gap-2 mb-2 select-none" contentEditable={false}>
                <Icon size={16} className="text-accent-ink shrink-0" weight="bold" />
                {active ? (
                    <select
                        value={variant}
                        onChange={(e) => updateAttributes({ variant: e.target.value })}
                        className="rounded-lg border border-edge-subtle bg-white px-2 py-0.5 text-xs text-ink font-medium focus:outline-none focus:border-accent"
                    >
                        {Object.entries(VARIANTS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                    </select>
                ) : (
                    <span className="text-[11px] font-bold uppercase tracking-wider text-ink-secondary">{cfg.label}</span>
                )}
                {active && (
                    <button
                        type="button"
                        onClick={() => deleteNode()}
                        className="ml-auto rounded-lg p-1 text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                        title="Remove callout"
                    >
                        <Trash size={14} />
                    </button>
                )}
            </div>
            <NodeViewContent className="text-sm leading-relaxed text-ink" />
        </NodeViewWrapper>
    );
}

export const Callout = Node.create({
    name: 'callout',
    group: 'block',
    content: 'block+',
    defining: true,

    addAttributes() {
        return {
            variant: {
                default: 'note',
                parseHTML: (el) => el.getAttribute('data-variant') || 'note',
                renderHTML: (attrs) => ({ 'data-variant': attrs.variant }),
            },
        };
    },

    parseHTML() {
        return [{ tag: 'div[data-callout]' }];
    },

    renderHTML({ HTMLAttributes }) {
        const variant = HTMLAttributes['data-variant'] || 'note';
        const cfg = VARIANTS[variant] || VARIANTS.note;
        return [
            'div',
            mergeAttributes(HTMLAttributes, { 'data-callout': '', class: `callout ${cfg.cls}` }),
            0,
        ];
    },

    addNodeView() {
        return ReactNodeViewRenderer(CalloutView);
    },

    addCommands() {
        return {
            setCallout: (variant = 'note') => ({ commands }) => commands.wrapIn(this.name, { variant }),
        };
    },
});

export default Callout;
