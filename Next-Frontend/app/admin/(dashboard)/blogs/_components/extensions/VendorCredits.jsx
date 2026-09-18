'use client';

import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer, NodeViewWrapper } from '@tiptap/react';
import { Trophy, Plus, Trash, LinkSimple, InstagramLogo } from '@phosphor-icons/react';

function VendorCreditsView({ node, updateAttributes, deleteNode, selected }) {
    const credits = Array.isArray(node.attrs.credits) ? node.attrs.credits : [];

    const handleAdd = () => {
        updateAttributes({
            credits: [...credits, { role: '', name: '', url: '', instagram: '' }],
        });
    };

    const handleRemove = (idx) => {
        updateAttributes({
            credits: credits.filter((_, i) => i !== idx),
        });
    };

    const handleChange = (idx, field, value) => {
        const next = [...credits];
        next[idx] = { ...next[idx], [field]: value };
        updateAttributes({ credits: next });
    };

    return (
        <NodeViewWrapper className={`my-8 rounded-2xl border border-[#E5DCD3] bg-[#F7F4EF]/50 p-6 transition-all ${selected ? 'ring-2 ring-[#8C532B]' : ''}`}>
            <div className="flex items-center justify-between pb-4 border-b border-[#E5DCD3]/60 mb-4" contentEditable={false}>
                <div className="flex items-center gap-2">
                    <Trophy size={18} weight="duotone" className="text-[#8C532B]" />
                    <span className="text-xs font-bold uppercase tracking-widest text-[#78716C]">
                        Vendor Credits
                    </span>
                    <span className="text-xs text-[#78716C]/70">({credits.length} vendors)</span>
                </div>
                {selected && (
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={handleAdd}
                            className="inline-flex items-center gap-1 rounded-lg border border-[#8C532B]/30 bg-white px-2.5 py-1 text-xs font-medium text-[#8C532B] hover:bg-[#8C532B]/5 transition-colors cursor-pointer"
                        >
                            <Plus size={12} weight="bold" />
                            Add Vendor
                        </button>
                        <button
                            type="button"
                            onClick={() => deleteNode()}
                            className="rounded-lg p-1 text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                            title="Remove credits block"
                        >
                            <Trash size={14} />
                        </button>
                    </div>
                )}
            </div>

            <div className="space-y-3" contentEditable={false}>
                {credits.length === 0 ? (
                    <div className="py-6 text-center text-sm text-[#78716C]">
                        No vendor credits yet. Select this block and click &quot;Add Vendor&quot; to list creative partners.
                    </div>
                ) : (
                    credits.map((item, idx) => (
                        <div
                            key={idx}
                            className="flex flex-col sm:flex-row sm:items-center gap-2 rounded-xl border border-[#E5DCD3]/70 bg-white p-3 shadow-sm"
                        >
                            <div className="w-full sm:w-1/4">
                                <input
                                    type="text"
                                    value={item.role || ''}
                                    onChange={(e) => handleChange(idx, 'role', e.target.value)}
                                    placeholder="Role (e.g. Venue, Florist)"
                                    className="w-full rounded-lg border border-[#E5DCD3] px-2.5 py-1.5 text-xs text-[#1C1917] font-medium focus:outline-none focus:border-[#8C532B]"
                                />
                            </div>
                            <div className="w-full sm:w-1/3">
                                <input
                                    type="text"
                                    value={item.name || ''}
                                    onChange={(e) => handleChange(idx, 'name', e.target.value)}
                                    placeholder="Vendor Name"
                                    className="w-full rounded-lg border border-[#E5DCD3] px-2.5 py-1.5 text-xs text-[#1C1917] font-semibold focus:outline-none focus:border-[#8C532B]"
                                />
                            </div>
                            <div className="w-full sm:w-1/4 flex items-center gap-1">
                                <LinkSimple size={14} className="text-[#78716C] shrink-0" />
                                <input
                                    type="url"
                                    value={item.url || ''}
                                    onChange={(e) => handleChange(idx, 'url', e.target.value)}
                                    placeholder="Website URL"
                                    className="w-full rounded-lg border border-[#E5DCD3] px-2 py-1.5 text-xs text-[#1C1917] focus:outline-none focus:border-[#8C532B]"
                                />
                            </div>
                            <div className="w-full sm:w-1/4 flex items-center gap-1">
                                <InstagramLogo size={14} className="text-[#78716C] shrink-0" />
                                <input
                                    type="text"
                                    value={item.instagram || ''}
                                    onChange={(e) => handleChange(idx, 'instagram', e.target.value)}
                                    placeholder="@handle"
                                    className="w-full rounded-lg border border-[#E5DCD3] px-2 py-1.5 text-xs text-[#1C1917] focus:outline-none focus:border-[#8C532B]"
                                />
                            </div>
                            {selected && (
                                <button
                                    type="button"
                                    onClick={() => handleRemove(idx)}
                                    className="self-end sm:self-center p-1 text-rose-500 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
                                    title="Remove item"
                                >
                                    <Trash size={14} />
                                </button>
                            )}
                        </div>
                    ))
                )}
            </div>
        </NodeViewWrapper>
    );
}

export const VendorCredits = Node.create({
    name: 'vendorCredits',
    group: 'block',
    atom: true,

    addAttributes() {
        return {
            credits: {
                default: [],
                parseHTML: (el) => {
                    try {
                        return JSON.parse(el.getAttribute('data-credits') || '[]');
                    } catch {
                        return [];
                    }
                },
                renderHTML: (attrs) => ({
                    'data-credits': JSON.stringify(attrs.credits || []),
                }),
            },
        };
    },

    parseHTML() {
        return [{ tag: 'div[data-vendor-credits]' }];
    },

    renderHTML({ HTMLAttributes }) {
        return ['div', mergeAttributes(HTMLAttributes, { 'data-vendor-credits': '' })];
    },

    addNodeView() {
        return ReactNodeViewRenderer(VendorCreditsView);
    },

    addCommands() {
        return {
            setVendorCredits: (attrs = {}) => ({ commands }) =>
                commands.insertContent({
                    type: this.name,
                    attrs: {
                        credits: [
                            { role: 'Photography', name: 'The Wedding Boys', url: 'https://theweddingboys.com', instagram: '@theweddingboys' },
                            { role: 'Venue', name: '', url: '', instagram: '' },
                        ],
                        ...attrs,
                    },
                }),
        };
    },
});

export default VendorCredits;
