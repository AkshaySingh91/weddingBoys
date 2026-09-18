'use client';

import { useState } from 'react';
import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer, NodeViewWrapper } from '@tiptap/react';
import { Question, Plus, Trash, CaretDown } from '@phosphor-icons/react';

function FAQView({ node, updateAttributes, deleteNode, selected }) {
    const items = Array.isArray(node.attrs.items) ? node.attrs.items : [];
    const [openIdx, setOpenIdx] = useState(0);

    const handleAdd = () => {
        const next = [...items, { question: 'New Question', answer: 'Provide the answer here.' }];
        updateAttributes({ items: next });
        setOpenIdx(next.length - 1);
    };

    const handleRemove = (idx) => {
        const next = items.filter((_, i) => i !== idx);
        updateAttributes({ items: next });
        if (openIdx >= next.length) setOpenIdx(Math.max(0, next.length - 1));
    };

    const handleChange = (idx, field, value) => {
        const next = [...items];
        next[idx] = { ...next[idx], [field]: value };
        updateAttributes({ items: next });
    };

    return (
        <NodeViewWrapper className={`my-8 rounded-2xl border border-[#E5DCD3] bg-white p-6 transition-all ${selected ? 'ring-2 ring-[#8C532B]' : ''}`}>
            <div className="flex items-center justify-between pb-4 border-b border-[#E5DCD3]/60 mb-4" contentEditable={false}>
                <div className="flex items-center gap-2">
                    <Question size={18} weight="duotone" className="text-[#8C532B]" />
                    <span className="text-xs font-bold uppercase tracking-widest text-[#78716C]">
                        FAQ Section
                    </span>
                    <span className="text-xs text-[#78716C]/70">({items.length} questions)</span>
                </div>
                {selected && (
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={handleAdd}
                            className="inline-flex items-center gap-1 rounded-lg border border-[#8C532B]/30 bg-[#8C532B]/5 px-2.5 py-1 text-xs font-medium text-[#8C532B] hover:bg-[#8C532B]/10 transition-colors cursor-pointer"
                        >
                            <Plus size={12} weight="bold" />
                            Add Q&A
                        </button>
                        <button
                            type="button"
                            onClick={() => deleteNode()}
                            className="rounded-lg p-1 text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                            title="Remove FAQ block"
                        >
                            <Trash size={14} />
                        </button>
                    </div>
                )}
            </div>

            <div className="space-y-3" contentEditable={false}>
                {items.length === 0 ? (
                    <div className="py-6 text-center text-sm text-[#78716C]">
                        No FAQ items. Select this block and click &quot;Add Q&A&quot; to add common questions.
                    </div>
                ) : (
                    items.map((item, idx) => {
                        const isOpen = openIdx === idx;
                        return (
                            <div
                                key={idx}
                                className="rounded-xl border border-[#E5DCD3] bg-[#F7F4EF]/30 overflow-hidden"
                            >
                                <div className="flex items-center justify-between px-4 py-2.5 bg-white border-b border-[#E5DCD3]/40">
                                    <button
                                        type="button"
                                        onClick={() => setOpenIdx(isOpen ? -1 : idx)}
                                        className="flex items-center gap-2 flex-1 text-left cursor-pointer"
                                    >
                                        <CaretDown
                                            size={14}
                                            weight="bold"
                                            className={`text-[#78716C] transition-transform ${isOpen ? 'rotate-180' : ''}`}
                                        />
                                        <span className="text-xs font-semibold text-[#1C1917]">
                                            {item.question || `Question ${idx + 1}`}
                                        </span>
                                    </button>
                                    {selected && (
                                        <button
                                            type="button"
                                            onClick={() => handleRemove(idx)}
                                            className="p-1 text-rose-500 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
                                            title="Delete question"
                                        >
                                            <Trash size={13} />
                                        </button>
                                    )}
                                </div>
                                {isOpen && (
                                    <div className="p-4 space-y-3 bg-[#F7F4EF]/20">
                                        <div>
                                            <label className="block text-[11px] font-medium uppercase tracking-wider text-[#78716C] mb-1">
                                                Question
                                            </label>
                                            <input
                                                type="text"
                                                value={item.question || ''}
                                                onChange={(e) => handleChange(idx, 'question', e.target.value)}
                                                placeholder="e.g. What is the best season for a Udaipur wedding?"
                                                className="w-full rounded-lg border border-[#E5DCD3] bg-white px-3 py-1.5 text-xs text-[#1C1917] font-medium focus:outline-none focus:border-[#8C532B]"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[11px] font-medium uppercase tracking-wider text-[#78716C] mb-1">
                                                Answer
                                            </label>
                                            <textarea
                                                rows={2}
                                                value={item.answer || ''}
                                                onChange={(e) => handleChange(idx, 'answer', e.target.value)}
                                                placeholder="Provide detailed answer..."
                                                className="w-full rounded-lg border border-[#E5DCD3] bg-white px-3 py-1.5 text-xs text-[#1C1917] focus:outline-none focus:border-[#8C532B] resize-y"
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })
                )}
            </div>
        </NodeViewWrapper>
    );
}

export const FAQ = Node.create({
    name: 'faq',
    group: 'block',
    atom: true,

    addAttributes() {
        return {
            items: {
                default: [],
                parseHTML: (el) => {
                    try {
                        return JSON.parse(el.getAttribute('data-items') || '[]');
                    } catch {
                        return [];
                    }
                },
                renderHTML: (attrs) => ({
                    'data-items': JSON.stringify(attrs.items || []),
                }),
            },
        };
    },

    parseHTML() {
        return [{ tag: 'div[data-faq]' }];
    },

    renderHTML({ HTMLAttributes }) {
        return ['div', mergeAttributes(HTMLAttributes, { 'data-faq': '' })];
    },

    addNodeView() {
        return ReactNodeViewRenderer(FAQView);
    },

    addCommands() {
        return {
            setFAQ: (attrs = {}) => ({ commands }) =>
                commands.insertContent({
                    type: this.name,
                    attrs: {
                        items: [
                            {
                                question: 'What is the best time of year for a wedding shoot here?',
                                answer: 'October to March offers pleasant weather, golden hour light, and clear skies in most Indian destination wedding hubs.',
                            },
                            {
                                question: 'How far in advance should we book our photography team?',
                                answer: 'We recommend booking 6 to 9 months ahead, especially for peak winter wedding dates between November and February.',
                            },
                        ],
                        ...attrs,
                    },
                }),
        };
    },
});

export default FAQ;
