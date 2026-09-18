'use client';

import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer, NodeViewWrapper } from '@tiptap/react';
import { MapPin, Sun, CurrencyInr, Palette, Heart, Trash } from '@phosphor-icons/react';

const STAT_ICONS = {
    venue: MapPin,
    season: Sun,
    budget: CurrencyInr,
    style: Palette,
    mood: Heart,
};

/**
 * AtAGlance editor view — displays a read-only preview of the wedding metadata
 * that will populate the At-a-Glance stats strip on the public page.
 * The actual data comes from the post sidebar fields (not editable inline).
 */
function AtAGlanceView({ node, deleteNode, selected, editor }) {
    // Try to read the current form data from editor storage
    // The actual stats come from the blog form sidebar, not inline editing
    const stats = [
        { key: 'venue', label: 'Venue', value: node.attrs.venue },
        { key: 'season', label: 'Season', value: node.attrs.season },
        { key: 'budget', label: 'Budget', value: node.attrs.budget },
        { key: 'style', label: 'Style', value: node.attrs.style },
        { key: 'mood', label: 'Mood', value: node.attrs.mood },
    ].filter(s => s.value);

    return (
        <NodeViewWrapper className={`my-6 rounded-2xl border border-[#E5DCD3] bg-[#F7F4EF]/60 transition-all ${selected ? 'ring-2 ring-[#8C532B]' : ''}`}>
            <div className="flex items-center justify-between border-b border-[#E5DCD3]/60 px-5 py-2.5" contentEditable={false}>
                <span className="text-[11px] font-bold uppercase tracking-widest text-[#78716C]">
                    At a Glance
                </span>
                <div className="flex items-center gap-2">
                    <span className="text-[10px] text-[#78716C]">
                        Auto-populated from sidebar
                    </span>
                    {selected && (
                        <button
                            type="button"
                            onClick={() => deleteNode()}
                            className="rounded-lg p-1 text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                        >
                            <Trash size={14} />
                        </button>
                    )}
                </div>
            </div>
            <div className="grid grid-cols-2 gap-0 divide-x divide-[#E5DCD3]/40 sm:grid-cols-3 lg:grid-cols-5" contentEditable={false}>
                {stats.length > 0 ? stats.map((stat) => {
                    const Icon = STAT_ICONS[stat.key] || Heart;
                    return (
                        <div key={stat.key} className="flex flex-col items-center gap-1 px-3 py-4 text-center">
                            <Icon size={18} weight="duotone" className="text-[#8C532B]" />
                            <span className="text-[10px] font-medium uppercase tracking-wider text-[#78716C]">{stat.label}</span>
                            <span className="text-sm font-semibold capitalize text-[#1C1917]">{stat.value}</span>
                        </div>
                    );
                }) : (
                    <div className="col-span-full px-5 py-6 text-center text-sm text-[#78716C]">
                        Fill in venue, season, budget, style, or mood in the sidebar to populate this block.
                    </div>
                )}
            </div>
        </NodeViewWrapper>
    );
}

export const AtAGlance = Node.create({
    name: 'atAGlance',
    group: 'block',
    atom: true,  // Non-editable content — data comes from sidebar

    addAttributes() {
        return {
            venue: { default: '' },
            season: { default: '' },
            budget: { default: '' },
            style: { default: '' },
            mood: { default: '' },
        };
    },

    parseHTML() {
        return [{ tag: 'div[data-at-a-glance]' }];
    },

    renderHTML({ HTMLAttributes }) {
        return ['div', mergeAttributes(HTMLAttributes, { 'data-at-a-glance': '' })];
    },

    addNodeView() {
        return ReactNodeViewRenderer(AtAGlanceView);
    },

    addCommands() {
        return {
            setAtAGlance: (attrs = {}) => ({ commands }) =>
                commands.insertContent({ type: this.name, attrs }),
        };
    },
});

export default AtAGlance;
