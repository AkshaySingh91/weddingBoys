'use client';

import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer, NodeViewWrapper } from '@tiptap/react';
import { ArrowRight, Trash, Sparkle } from '@phosphor-icons/react';

function EnquiryCTAView({ node, updateAttributes, deleteNode, selected }) {
    const text = node.attrs.text || 'Plan Your Dream Wedding';
    const subtitle = node.attrs.subtitle || "Let's bring your vision to life — reach out to our team.";
    const href = node.attrs.href || '/contact';

    return (
        <NodeViewWrapper className={`my-8 overflow-hidden rounded-2xl bg-gradient-to-br from-[#1C1917] via-[#292524] to-[#1C1917] p-6 sm:p-8 text-center text-white transition-all ${selected ? 'ring-2 ring-[#C29555]' : ''}`}>
            <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4" contentEditable={false}>
                <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-[#C29555]">
                    <Sparkle size={14} weight="fill" />
                    <span>Conversion CTA Block</span>
                </div>
                {selected && (
                    <button
                        type="button"
                        onClick={() => deleteNode()}
                        className="rounded-lg p-1 text-rose-400 hover:bg-white/10 transition-colors cursor-pointer"
                        title="Remove CTA block"
                    >
                        <Trash size={14} />
                    </button>
                )}
            </div>

            <div contentEditable={false} className="space-y-4 max-w-lg mx-auto">
                {selected ? (
                    <div className="space-y-3">
                        <div>
                            <label className="block text-[11px] font-medium uppercase tracking-wider text-white/60 mb-1 text-left">
                                Headline
                            </label>
                            <input
                                type="text"
                                value={text}
                                onChange={(e) => updateAttributes({ text: e.target.value })}
                                className="w-full rounded-lg border border-white/20 bg-white/10 px-3 py-1.5 text-sm font-semibold text-white focus:outline-none focus:border-[#C29555]"
                            />
                        </div>
                        <div>
                            <label className="block text-[11px] font-medium uppercase tracking-wider text-white/60 mb-1 text-left">
                                Subtitle
                            </label>
                            <input
                                type="text"
                                value={subtitle}
                                onChange={(e) => updateAttributes({ subtitle: e.target.value })}
                                className="w-full rounded-lg border border-white/20 bg-white/10 px-3 py-1.5 text-xs text-white/80 focus:outline-none focus:border-[#C29555]"
                            />
                        </div>
                        <div>
                            <label className="block text-[11px] font-medium uppercase tracking-wider text-white/60 mb-1 text-left">
                                Destination Link
                            </label>
                            <input
                                type="text"
                                value={href}
                                onChange={(e) => updateAttributes({ href: e.target.value })}
                                className="w-full rounded-lg border border-white/20 bg-white/10 px-3 py-1.5 text-xs text-white/80 focus:outline-none focus:border-[#C29555]"
                            />
                        </div>
                    </div>
                ) : (
                    <>
                        <h3 className="font-playfair text-xl sm:text-2xl font-bold text-white">
                            {text}
                        </h3>
                        <p className="text-xs sm:text-sm text-white/70">
                            {subtitle}
                        </p>
                    </>
                )}

                <div className="pt-2">
                    <span className="inline-flex items-center gap-2 rounded-full bg-[#C29555] px-6 py-2.5 text-xs font-semibold text-white shadow-md">
                        Get in Touch
                        <ArrowRight size={14} weight="bold" />
                    </span>
                </div>
            </div>
        </NodeViewWrapper>
    );
}

export const EnquiryCTA = Node.create({
    name: 'enquiryCta',
    group: 'block',
    atom: true,

    addAttributes() {
        return {
            text: {
                default: 'Plan Your Dream Wedding',
                parseHTML: (el) => el.getAttribute('data-text') || 'Plan Your Dream Wedding',
                renderHTML: (attrs) => ({ 'data-text': attrs.text }),
            },
            subtitle: {
                default: "Let's bring your vision to life — reach out to our team.",
                parseHTML: (el) => el.getAttribute('data-subtitle') || "Let's bring your vision to life — reach out to our team.",
                renderHTML: (attrs) => ({ 'data-subtitle': attrs.subtitle }),
            },
            href: {
                default: '/contact',
                parseHTML: (el) => el.getAttribute('data-href') || '/contact',
                renderHTML: (attrs) => ({ 'data-href': attrs.href }),
            },
        };
    },

    parseHTML() {
        return [{ tag: 'div[data-enquiry-cta]' }];
    },

    renderHTML({ HTMLAttributes }) {
        return ['div', mergeAttributes(HTMLAttributes, { 'data-enquiry-cta': '' })];
    },

    addNodeView() {
        return ReactNodeViewRenderer(EnquiryCTAView);
    },

    addCommands() {
        return {
            setEnquiryCta: (attrs = {}) => ({ commands }) =>
                commands.insertContent({
                    type: this.name,
                    attrs: {
                        text: 'Plan Your Dream Wedding',
                        subtitle: "Let's bring your vision to life — reach out to our team.",
                        href: '/contact',
                        ...attrs,
                    },
                }),
        };
    },
});

export default EnquiryCTA;
