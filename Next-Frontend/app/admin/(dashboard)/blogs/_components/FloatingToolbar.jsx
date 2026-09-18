'use client';

import { useLayoutEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

/**
 * A toolbar that floats beside an element without being clipped by it.
 *
 * Anything rendered inside the editor is at the mercy of its ancestors: a cell
 * in a fixed-height row sets `overflow: hidden`, and the image toolbar was cut
 * off mid-control — the same failure as the dropdowns that disappeared behind
 * their panels. A portal to `document.body` escapes every ancestor's clipping
 * and stacking context at once, which is the only fix that does not depend on
 * auditing each ancestor.
 *
 * Position is written straight to the DOM rather than held in state. Measuring
 * into state would mean a setState inside a layout effect on every scroll frame
 * — a re-render per frame, and the pattern React's compiler rejects outright.
 */
export default function FloatingToolbar({ anchorRef, open, offset = 10, children }) {
    const selfRef = useRef(null);

    // Layout effect, not effect: positioning after paint shows the toolbar in
    // the wrong place for a frame first.
    useLayoutEffect(() => {
        if (!open) return undefined;

        const place = () => {
            const anchor = anchorRef?.current;
            const el = selfRef.current;
            if (!anchor || !el) return;

            const r = anchor.getBoundingClientRect();
            const w = el.offsetWidth;

            // Centred on the anchor, but kept inside the viewport: a toolbar
            // wider than a narrow cell would otherwise sit half off-screen.
            const left = Math.min(Math.max(r.left + r.width / 2 - w / 2, 8), window.innerWidth - w - 8);
            el.style.left = `${Math.round(left)}px`;
            el.style.top = `${Math.round(r.bottom - offset)}px`;
            el.style.visibility = 'visible';
        };

        place();
        // `true` captures scrolls on any ancestor, not just the window — the
        // editor canvas is its own scroll container.
        window.addEventListener('scroll', place, true);
        window.addEventListener('resize', place);
        return () => {
            window.removeEventListener('scroll', place, true);
            window.removeEventListener('resize', place);
        };
    }, [open, anchorRef, offset, children]);

    if (!open || typeof document === 'undefined') return null;

    return createPortal(
        <div
            ref={selfRef}
            contentEditable={false}
            data-floating-toolbar
            // Hidden until placed, so it never flashes at the top-left corner.
            style={{ position: 'fixed', top: 0, left: 0, transform: 'translateY(-100%)', zIndex: 80, visibility: 'hidden' }}
            className="flex items-center gap-1 rounded-xl border border-[#E5DCD3] bg-white/95 p-1 shadow-lg backdrop-blur-sm"
            /*
              Keep the editor's selection when a button is used — but NOT for a
              field. preventDefault on mousedown also blocks focus, so a blanket
              call here would make the badge input and the frame selects
              unusable, which is the same trap that once killed block dragging.
            */
            onMouseDown={(e) => {
                if (!e.target.closest('input, select, textarea')) e.preventDefault();
            }}
        >
            {children}
        </div>,
        document.body,
    );
}
