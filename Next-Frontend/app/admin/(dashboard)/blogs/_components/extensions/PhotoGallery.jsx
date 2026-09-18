'use client';

import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer, NodeViewWrapper } from '@tiptap/react';
import { Trash, Columns, SquaresFour } from '@phosphor-icons/react';

function PhotoGalleryView({ node, updateAttributes, deleteNode, selected }) {
    const { items = [], columns = 3 } = node.attrs;

    return (
        <NodeViewWrapper className={`photo-gallery my-5 font-sans transition-all ${selected ? 'rounded-2xl ring-2 ring-[#8C532B]' : ''}`}>
            <div className={`grid gap-2.5 ${columns === 2 ? 'grid-cols-2' : 'grid-cols-2 sm:grid-cols-3'}`}>
                {items.map((it, i) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img key={it.src || i} src={it.src} alt={it.alt || ''} className="aspect-square w-full rounded-xl object-cover border border-[#E5DCD3] shadow-sm" />
                ))}
                {items.length === 0 && (
                    <div className="col-span-full flex h-28 items-center justify-center rounded-2xl border border-dashed border-[#E5DCD3] bg-stone-50 text-xs text-stone-400 font-medium">
                        Gallery is empty
                    </div>
                )}
            </div>
            {selected && (
                <div contentEditable={false} className="mt-2 flex items-center gap-1 rounded-xl border border-[#E5DCD3] bg-white p-1 shadow-sm">
                    <button
                        type="button"
                        onClick={() => updateAttributes({ columns: 2 })}
                        className={`rounded-lg p-1.5 transition-colors cursor-pointer ${
                            columns === 2 ? 'bg-[#1C1917] text-white shadow-sm' : 'text-stone-600 hover:bg-stone-100'
                        }`}
                        title="2 columns"
                    >
                        <Columns size={14} />
                    </button>
                    <button
                        type="button"
                        onClick={() => updateAttributes({ columns: 3 })}
                        className={`rounded-lg p-1.5 transition-colors cursor-pointer ${
                            columns === 3 ? 'bg-[#1C1917] text-white shadow-sm' : 'text-stone-600 hover:bg-stone-100'
                        }`}
                        title="3 columns"
                    >
                        <SquaresFour size={14} />
                    </button>
                    <span className="mx-1 h-4 w-px bg-stone-200" />
                    <button
                        type="button"
                        onClick={() => deleteNode()}
                        className="rounded-lg p-1.5 text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                        title="Remove gallery"
                    >
                        <Trash size={14} />
                    </button>
                </div>
            )}
        </NodeViewWrapper>
    );
}

export const PhotoGallery = Node.create({
    name: 'photoGallery',
    group: 'block',
    atom: true,
    draggable: true,

    addAttributes() {
        return {
            items: {
                default: [],
                parseHTML: (el) => {
                    try { return JSON.parse(el.getAttribute('data-items') || '[]'); } catch { return []; }
                },
                renderHTML: (attrs) => ({ 'data-items': JSON.stringify(attrs.items || []) }),
            },
            columns: { default: 3 },
        };
    },

    parseHTML() {
        return [{ tag: 'div[data-photo-gallery]' }];
    },

    renderHTML({ node }) {
        const { items = [], columns } = node.attrs;
        const imgs = items.map((it) => ['img', {
            src: it.src, alt: it.alt || '', loading: 'lazy', class: 'photo-gallery-item',
        }]);
        return [
            'div',
            mergeAttributes({
                'data-photo-gallery': '',
                'data-items': JSON.stringify(items),
                'data-columns': String(columns),
                class: `photo-gallery photo-gallery-cols-${columns}`,
            }),
            ...imgs,
        ];
    },

    addNodeView() {
        return ReactNodeViewRenderer(PhotoGalleryView);
    },

    addCommands() {
        return {
            setPhotoGallery: (attrs) => ({ commands }) => commands.insertContent({ type: this.name, attrs }),
        };
    },
});

export default PhotoGallery;
