'use client';

import { useEffect, useRef, useState } from 'react';
import {
    DotsSixVertical, Plus, Copy, Trash, ArrowUp, ArrowDown,
    TextT, TextH, Quotes, ListBullets, ListNumbers, CheckSquare, Check,
} from '@phosphor-icons/react';

/**
 * The block gutter: a grip to drag the current block, and a menu to act on it.
 *
 * Anchored to the block holding the caret rather than to hover. The gutter sits
 * outside the editor's content box, so a hover-driven handle vanishes the moment
 * you move toward it. Measurement happens in the BlockHandle plugin, not here,
 * because reading a ref during render is not allowed.
 */

/** Turn-into targets. Only offered for text blocks — an image has no text to convert. */
const CONVERSIONS = [
    { id: 'paragraph', label: 'Text', icon: TextT, run: (c) => c.setParagraph() },
    { id: 'h2', label: 'Heading 2', icon: TextH, run: (c) => c.setHeading({ level: 2 }) },
    { id: 'h3', label: 'Heading 3', icon: TextH, run: (c) => c.setHeading({ level: 3 }) },
    { id: 'h4', label: 'Heading 4', icon: TextH, run: (c) => c.setHeading({ level: 4 }) },
    { id: 'quote', label: 'Quote', icon: Quotes, run: (c) => c.toggleBlockquote() },
    { id: 'bullet', label: 'Bullet list', icon: ListBullets, run: (c) => c.toggleBulletList() },
    { id: 'ordered', label: 'Numbered list', icon: ListNumbers, run: (c) => c.toggleOrderedList() },
    { id: 'task', label: 'Checklist', icon: CheckSquare, run: (c) => c.toggleTaskList() },
];

export default function BlockGutter({ editor, active: activeBlock }) {
    const [pinned, setPinned] = useState(null);
    const [turnInto, setTurnInto] = useState(false);
    const menuRef = useRef(null);

    useEffect(() => {
        if (!pinned) return undefined;
        const close = () => { setPinned(null); setTurnInto(false); };
        const onDown = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) close(); };
        const onKey = (e) => { if (e.key === 'Escape') close(); };
        document.addEventListener('mousedown', onDown);
        document.addEventListener('keydown', onKey);
        return () => {
            document.removeEventListener('mousedown', onDown);
            document.removeEventListener('keydown', onKey);
        };
    }, [pinned]);

    // `pinned` freezes the target while the menu is open, so moving the caret
    // cannot retarget an action mid-click.
    const active = pinned || activeBlock;
    if (!editor || !active) return null;

    const isTextBlock = Boolean(active.isTextblock);

    const act = (fn) => (e) => {
        e.preventDefault();
        e.stopPropagation();
        fn();
        setPinned(null);
        setTurnInto(false);
    };

    return (
        <div
            className="absolute z-30 flex items-start gap-0.5"
            style={{ top: active.top, left: Math.max(0, active.left - 46) }}
            contentEditable={false}
        >
            <button
                type="button"
                aria-label="Insert a block below"
                onClick={act(() => editor.chain().focus().insertParagraphAfter(active.pos).run())}
                className="flex h-6 w-6 items-center justify-center rounded-md text-stone-400 transition-colors hover:bg-stone-200/80 hover:text-stone-700"
            >
                <Plus size={13} />
            </button>

            <div className="relative" ref={menuRef}>
                <button
                    type="button"
                    aria-label="Drag to move, or click for actions"
                    draggable
                    /**
                     * NO preventDefault on mousedown here.
                     *
                     * Calling it stops the browser starting a native drag, so the
                     * element was `draggable` but could never actually be dragged.
                     * The menu therefore opens on CLICK, which fires only when no
                     * drag took place.
                     */
                    onClick={() => { setTurnInto(false); setPinned((p) => (p ? null : activeBlock)); }}
                    onDragStart={(event) => {
                        // The grip is outside the ProseMirror DOM, so PM never sees
                        // a dragstart on its own content. Handing it the slice via
                        // `view.dragging` is what makes this a real block move.
                        const { view } = editor;
                        setPinned(null);
                        editor.commands.selectBlockAt(active.pos);

                        const { selection } = view.state;
                        // eslint-disable-next-line react-hooks/immutability
                        view.dragging = { slice: selection.content(), move: true };

                        event.dataTransfer.effectAllowed = 'move';
                        event.dataTransfer.setData('text/plain', '');

                        const dom = view.nodeDOM(active.pos);
                        const el = dom?.nodeType === 1 ? dom : dom?.parentElement;
                        if (el) event.dataTransfer.setDragImage(el, 12, 12);
                    }}
                    onDragEnd={() => {
                        // eslint-disable-next-line react-hooks/immutability
                        editor.view.dragging = null;
                    }}
                    className="flex h-6 w-5 cursor-grab items-center justify-center rounded-md text-stone-400 transition-colors hover:bg-stone-200/80 hover:text-stone-700 active:cursor-grabbing"
                >
                    <DotsSixVertical size={14} weight="bold" />
                </button>

                {pinned && (
                    <div className="absolute left-0 top-7 z-[60] w-48 overflow-hidden rounded-xl border border-[#E5DCD3] bg-white py-1 shadow-xl">
                        {turnInto ? (
                            <>
                                <button
                                    type="button"
                                    onClick={(e) => { e.preventDefault(); setTurnInto(false); }}
                                    className="mb-1 flex w-full items-center gap-1.5 border-b border-[#E5DCD3] px-3 pb-1.5 text-left text-[10px] font-semibold uppercase tracking-wide text-stone-400"
                                >
                                    ← Turn into
                                </button>
                                {CONVERSIONS.map((c) => (
                                    <Item
                                        key={c.id}
                                        icon={c.icon}
                                        label={c.label}
                                        onClick={act(() => {
                                            const chain = editor.chain().focus().setTextSelection(active.pos + 1);
                                            c.run(chain).run();
                                        })}
                                    />
                                ))}
                            </>
                        ) : (
                            <>
                                {isTextBlock && (
                                    <Item
                                        icon={Check}
                                        label="Turn into…"
                                        onClick={(e) => { e.preventDefault(); setTurnInto(true); }}
                                    />
                                )}
                                <Item icon={ArrowUp} label="Move up"
                                    onClick={act(() => editor.chain().focus().moveBlockAt(active.pos, -1).run())} />
                                <Item icon={ArrowDown} label="Move down"
                                    onClick={act(() => editor.chain().focus().moveBlockAt(active.pos, 1).run())} />
                                <Item icon={Copy} label="Duplicate"
                                    onClick={act(() => editor.chain().focus().duplicateBlockAt(active.pos).run())} />
                                <div className="my-1 h-px bg-[#E5DCD3]" />
                                <Item icon={Trash} label="Delete" danger
                                    onClick={act(() => editor.chain().focus().deleteBlockAt(active.pos).run())} />
                            </>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

function Item({ icon: Icon, label, onClick, danger }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs transition-colors ${
                danger ? 'text-rose-700 hover:bg-rose-50' : 'text-stone-700 hover:bg-stone-50'
            }`}
        >
            <Icon size={13} /> {label}
        </button>
    );
}
