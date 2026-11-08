'use client';

import { useEffect, useRef, useState } from 'react';
import { CaretDown, Check, Sliders } from '@phosphor-icons/react';
import {
    FONT_FAMILIES, FONT_SIZES, LINE_HEIGHTS, LETTER_SPACINGS, cleanLineHeight,
    TEXT_COLORS, HIGHLIGHT_COLORS, isCustom,
} from './typographyTokens.js';

/**
 * Curated typography pickers.
 *
 * Each control offers only values that exist in the theme, so a post cannot
 * drift off-brand by accident, with an Advanced field for the occasional exact
 * value. Token values (CSS vars, scale steps) still respond to a later theme
 * change; an Advanced literal does not, which is the trade the author is making
 * when they open it.
 */

function Popover({ label, value, width = 'w-52', children, title }) {
    const [open, setOpen] = useState(false);
    const ref = useRef(null);

    useEffect(() => {
        if (!open) return undefined;
        const onDown = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
        const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
        document.addEventListener('mousedown', onDown);
        document.addEventListener('keydown', onKey);
        return () => {
            document.removeEventListener('mousedown', onDown);
            document.removeEventListener('keydown', onKey);
        };
    }, [open]);

    return (
        <div className="relative" ref={ref}>
            <button
                type="button"
                title={title}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => setOpen((v) => !v)}
                className="flex h-8 items-center gap-1 rounded-lg px-2 text-xs text-ink-secondary transition-colors hover:bg-ground-sunk/80 hover:text-ink"
            >
                <span className="max-w-[7.5rem] truncate">{value || label}</span>
                <CaretDown size={10} className="shrink-0 opacity-60" />
            </button>
            {/* z-[60] puts this above the selection bubble menu (z-50): selecting
                text opens that menu, and it was floating over these options and
                swallowing the clicks. */}
            {open && (
                <div className={`absolute left-0 top-full z-[60] mt-1 ${width} overflow-hidden rounded-xl border border-edge-subtle bg-white py-1 shadow-lg`}>
                    {typeof children === 'function' ? children(() => setOpen(false)) : children}
                </div>
            )}
        </div>
    );
}

function Option({ active, onClick, children, style }) {
    return (
        <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={onClick}
            className="flex w-full items-center justify-between gap-2 px-3 py-1.5 text-left text-xs text-ink-secondary hover:bg-ground"
        >
            <span style={style} className="truncate">{children}</span>
            {active && <Check size={11} className="shrink-0 text-accent-ink" />}
        </button>
    );
}

/** The Advanced escape hatch — one exact value, applied on Enter. */
function Advanced({ placeholder, current, onApply, onClear, close }) {
    const [raw, setRaw] = useState(current || '');
    return (
        <div className="mt-1 border-t border-edge-subtle px-3 pb-2 pt-2">
            <p className="mb-1 flex items-center gap-1 text-[10px] font-medium uppercase tracking-wide text-ink-muted">
                <Sliders size={9} /> Custom value
            </p>
            <div className="flex gap-1">
                {/*
                  Commits on blur as well as Enter.

                  Enter-only meant typing an exact size and then clicking
                  anywhere threw it away without a word — which reads as the
                  field not working at all, rather than as a shortcut missed.
                */}
                <input
                    value={raw}
                    onChange={(e) => setRaw(e.target.value)}
                    onBlur={() => { const v = raw.trim(); if (v && v !== current) onApply(v); }}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') { e.preventDefault(); onApply(raw.trim()); close(); }
                        if (e.key === 'Escape') { e.preventDefault(); setRaw(current || ''); close(); }
                    }}
                    placeholder={placeholder}
                    className="h-7 w-full rounded-lg border border-edge-subtle px-2 text-[11px] outline-none focus:border-accent"
                />
                <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => { onClear(); close(); }}
                    className="shrink-0 rounded-lg px-1.5 text-[10px] text-ink-muted hover:bg-ground-sunk"
                >
                    Clear
                </button>
            </div>
        </div>
    );
}

export default function TypographyControls({ editor }) {
    if (!editor) return null;

    const attrs = editor.getAttributes('textStyle');
    const blockAttrs = editor.isActive('heading')
        ? editor.getAttributes('heading')
        : editor.getAttributes('paragraph');

    const family = attrs.fontFamily || null;
    const size = attrs.fontSize || null;
    const spacing = attrs.letterSpacing || null;
    const height = blockAttrs.lineHeight || null;
    const colour = attrs.color || null;

    const labelFor = (scale, value, fallback) =>
        scale.find((o) => o.value === value)?.label || (value ? 'Custom' : fallback);

    return (
        <div className="flex items-center gap-0.5">
            {/* Font family */}
            <Popover title="Font" label="Font" value={labelFor(FONT_FAMILIES, family, 'Font')}>
                {(close) => (
                    <>
                        <Option active={!family} onClick={() => { editor.chain().focus().unsetFontFamily().run(); close(); }}>
                            Theme default
                        </Option>
                        {FONT_FAMILIES.map((f) => (
                            <Option key={f.value} active={family === f.value}
                                style={{ fontFamily: f.value }}
                                onClick={() => { editor.chain().focus().setFontFamily(f.value).run(); close(); }}>
                                {f.preview}
                            </Option>
                        ))}
                    </>
                )}
            </Popover>

            {/* Size */}
            <Popover title="Text size" label="Size" width="w-48"
                value={labelFor(FONT_SIZES, size, 'Size')}>
                {(close) => (
                    <>
                        <Option active={!size} onClick={() => { editor.chain().focus().unsetFontSize().run(); close(); }}>
                            Theme default
                        </Option>
                        {FONT_SIZES.map((o) => (
                            <Option key={o.value} active={size === o.value}
                                onClick={() => { editor.chain().focus().setFontSize(o.value).run(); close(); }}>
                                {o.label} <span className="text-ink-muted">{o.value}</span>
                            </Option>
                        ))}
                        <Advanced
                            placeholder="e.g. 26px" close={close}
                            current={isCustom(size, FONT_SIZES) ? size : ''}
                            onApply={(v) => v && editor.chain().focus().setFontSize(v).run()}
                            onClear={() => editor.chain().focus().unsetFontSize().run()}
                        />
                    </>
                )}
            </Popover>

            {/* Line height */}
            <Popover title="Line height" label="Leading" width="w-44"
                value={labelFor(LINE_HEIGHTS, height, 'Leading')}>
                {(close) => (
                    <>
                        <Option active={!height} onClick={() => { editor.chain().focus().unsetLineHeight().run(); close(); }}>
                            Theme default
                        </Option>
                        {LINE_HEIGHTS.map((o) => (
                            <Option key={o.value} active={height === o.value}
                                onClick={() => { editor.chain().focus().setLineHeight(o.value).run(); close(); }}>
                                {o.label} <span className="text-ink-muted">{o.value}</span>
                            </Option>
                        ))}
                        {/*
                          Clamped before it is applied. The field used to take
                          anything: a caption saved at `0.5` gave 17px text an
                          8.5px line and the captions overlapped on the live
                          page. Below 1 there is no arrangement of glyphs that
                          fits, so it is not a preference to honour.
                        */}
                        <Advanced
                            placeholder="e.g. 1.75" close={close}
                            current={isCustom(height, LINE_HEIGHTS) ? height : ''}
                            onApply={(v) => {
                                const safe = cleanLineHeight(v);
                                if (safe) editor.chain().focus().setLineHeight(safe).run();
                                else editor.chain().focus().unsetLineHeight().run();
                            }}
                            onClear={() => editor.chain().focus().unsetLineHeight().run()}
                        />
                    </>
                )}
            </Popover>

            {/* Letter spacing */}
            <Popover title="Letter spacing" label="Tracking" width="w-44"
                value={labelFor(LETTER_SPACINGS, spacing, 'Tracking')}>
                {(close) => (
                    <>
                        <Option active={!spacing} onClick={() => { editor.chain().focus().unsetLetterSpacing().run(); close(); }}>
                            Theme default
                        </Option>
                        {LETTER_SPACINGS.map((o) => (
                            <Option key={o.value} active={spacing === o.value}
                                onClick={() => { editor.chain().focus().setLetterSpacing(o.value).run(); close(); }}>
                                {o.label} <span className="text-ink-muted">{o.value}</span>
                            </Option>
                        ))}
                        <Advanced
                            placeholder="e.g. 0.06em" close={close}
                            current={isCustom(spacing, LETTER_SPACINGS) ? spacing : ''}
                            onApply={(v) => v && editor.chain().focus().setLetterSpacing(v).run()}
                            onClear={() => editor.chain().focus().unsetLetterSpacing().run()}
                        />
                    </>
                )}
            </Popover>

            {/* Colour + highlight */}
            <Popover title="Colour" label="Colour" width="w-56"
                value={labelFor(TEXT_COLORS, colour, 'Colour')}>
                {(close) => (
                    <>
                        <p className="px-3 pb-1 pt-1.5 text-[10px] font-medium uppercase tracking-wide text-ink-muted">Text</p>
                        <div className="flex flex-wrap gap-1 px-3 pb-2">
                            {TEXT_COLORS.map((c) => (
                                <button key={c.value} type="button" title={c.label}
                                    onMouseDown={(e) => e.preventDefault()}
                                    onClick={() => { editor.chain().focus().setColor(c.value).run(); close(); }}
                                    style={{ backgroundColor: c.value }}
                                    className={`h-5 w-5 rounded-lg border transition-transform hover:scale-110 ${colour === c.value ? 'border-ink ring-1 ring-ink' : 'border-black/10'}`}
                                />
                            ))}
                        </div>
                        <p className="px-3 pb-1 text-[10px] font-medium uppercase tracking-wide text-ink-muted">Highlight</p>
                        <div className="flex flex-wrap gap-1 px-3 pb-2">
                            {HIGHLIGHT_COLORS.map((c) => (
                                <button key={c.value} type="button" title={c.label}
                                    onMouseDown={(e) => e.preventDefault()}
                                    onClick={() => { editor.chain().focus().toggleHighlight({ color: c.value }).run(); close(); }}
                                    style={{ backgroundColor: c.value }}
                                    className="h-5 w-5 rounded-lg border border-black/10 transition-transform hover:scale-110"
                                />
                            ))}
                        </div>
                        <div className="border-t border-edge-subtle">
                            <Option onClick={() => { editor.chain().focus().unsetColor().unsetHighlight().run(); close(); }}>
                                Clear colour &amp; highlight
                            </Option>
                        </div>
                        <Advanced
                            placeholder="#A3603A" close={close}
                            current={isCustom(colour, TEXT_COLORS) ? colour : ''}
                            onApply={(v) => /^#[0-9a-f]{3,8}$/i.test(v) && editor.chain().focus().setColor(v).run()}
                            onClear={() => editor.chain().focus().unsetColor().run()}
                        />
                    </>
                )}
            </Popover>
        </div>
    );
}
