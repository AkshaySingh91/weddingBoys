'use client';

import { Node, mergeAttributes } from '@tiptap/core';
import { useRef } from 'react';
import { ReactNodeViewRenderer, NodeViewWrapper, NodeViewContent } from '@tiptap/react';
import FloatingToolbar from '../FloatingToolbar.jsx';
import { BlockIcon, ICON_OPTIONS } from '@/lib/blog/blockIcons.jsx';
import { Square, Trash, CaretDown } from '@phosphor-icons/react';
import {
    CONTAINER_VARIANTS, PADDINGS, RADII, SHADOWS, BACKGROUNDS, containerClasses,
    containerStyle, containerStyleString, STUDIO_SWATCHES, cleanHex,
} from '../layoutTokens.js';
import { useNodeActive } from './useNodeActive.js';

/**
 * A styled box that can hold any blocks.
 *
 * Nested editable content is native ProseMirror content (`content: 'block+'`
 * plus NodeViewContent), NOT a nested editor instance — that keeps one document,
 * one undo stack and one selection model, which is where nested editors usually
 * come apart. Follows the shape already proven by Callout.jsx.
 */
function Picker({ label, scale, value, onChange }) {
    return (
        <label className="flex items-center gap-1 text-[10px] text-stone-600">
            <span className="uppercase tracking-wide">{label}</span>
            <span className="relative">
                <select
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    className="appearance-none rounded-md border border-studio-border bg-white py-0.5 pl-1.5 pr-5 text-[11px] text-studio-ink outline-none focus:border-studio-terracotta"
                >
                    {scale.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
                </select>
                <CaretDown size={8} className="pointer-events-none absolute right-1 top-1/2 -translate-y-1/2 opacity-50" />
            </span>
        </label>
    );
}

/**
 * A colour control: the studio palette, then a hex field.
 *
 * The palette is offered first so the quick choice is the on-brand one, and the
 * hex box is there for the design that genuinely needs something else. Clearing
 * it returns the box to whatever its preset variant says.
 */
function ColourField({ label, value, onChange }) {
    return (
        <span className="flex items-center gap-1" title={label}>
            <span className="text-[9px] uppercase tracking-wide text-studio-inkMuted">{label}</span>
            {STUDIO_SWATCHES.slice(0, 6).map((sw) => (
                <button
                    key={sw.id}
                    type="button"
                    title={sw.label}
                    onClick={() => onChange(sw.hex)}
                    style={{ backgroundColor: sw.hex }}
                    className={`h-3.5 w-3.5 rounded-full border transition-transform hover:scale-110 ${
                        value?.toLowerCase() === sw.hex.toLowerCase()
                            ? 'border-studio-terracotta ring-1 ring-studio-terracotta'
                            : 'border-studio-border'
                    }`}
                />
            ))}
            <input
                type="text"
                value={value || ''}
                placeholder="#hex"
                onChange={(e) => onChange(cleanHex(e.target.value) || e.target.value)}
                onBlur={(e) => onChange(cleanHex(e.target.value))}
                className="w-14 rounded-md border border-studio-border px-1 py-0.5 font-mono text-[10px] outline-none"
            />
        </span>
    );
}

/** A free length: a number the author types, px unless they say otherwise. */
function SizeField({ label, value, onChange, placeholder = 'auto', width = 'w-12' }) {
    return (
        <label className="flex items-center gap-1 text-[9px] uppercase tracking-wide text-studio-inkMuted">
            {label}
            <input
                type="text"
                value={value || ''}
                placeholder={placeholder}
                onChange={(e) => onChange(e.target.value)}
                className={`${width} rounded-md border border-studio-border px-1 py-0.5 text-[10px] normal-case tabular-nums outline-none`}
            />
        </label>
    );
}

function ContainerView({ node, updateAttributes, deleteNode, selected, editor, getPos }) {
    // `selected` alone is a NodeSelection, which clicking into a container never
    // produces — see useNodeActive. Without this the toolbar never opened.
    const active = useNodeActive({ editor, getPos, node, selected });
    const { variant, marker = '', icon = '', label = '' } = node.attrs;
    const isCustom = variant === 'custom';
    const boxRef = useRef(null);

    return (
        <NodeViewWrapper
            className={`blog-container relative my-5 ${containerClasses(node.attrs)} ${
                active ? 'ring-2 ring-studio-terracotta' : ''
            }`}
            data-variant={variant}
            style={containerStyle(node.attrs)}
            ref={boxRef}
        >
            {/*
              Through the portal, not pinned inside the box.

              With the size and colour controls added the bar is wider than most
              containers and far wider than a grid cell, which clips its
              overflow — the same way the image toolbar was cut in half before.
            */}
            <FloatingToolbar anchorRef={boxRef} open={active}>
                <>
                    <Square size={12} className="text-studio-terracotta" weight="bold" />
                    <Picker
                        label="Style"
                        scale={[...CONTAINER_VARIANTS, { id: 'custom', label: 'Custom…' }]}
                        value={variant}
                        onChange={(v) => updateAttributes({ variant: v })}
                    />
                    {isCustom && (
                        <>
                            <Picker label="Pad" scale={PADDINGS} value={node.attrs.padding} onChange={(v) => updateAttributes({ padding: v })} />
                            <Picker label="Corner" scale={RADII} value={node.attrs.radius} onChange={(v) => updateAttributes({ radius: v })} />
                            <Picker label="Shadow" scale={SHADOWS} value={node.attrs.shadow} onChange={(v) => updateAttributes({ shadow: v })} />
                            <Picker label="Fill" scale={BACKGROUNDS} value={node.attrs.background} onChange={(v) => updateAttributes({ background: v })} />
                            <label className="flex items-center gap-1 text-[10px] text-stone-600">
                                <input
                                    type="checkbox"
                                    checked={node.attrs.border === 'thin'}
                                    onChange={(e) => updateAttributes({ border: e.target.checked ? 'thin' : 'none' })}
                                    className="h-3 w-3 accent-studio-terracotta"
                                />
                                Border
                            </label>
                        </>
                    )}
                    <span className="h-3 w-px bg-studio-border" />

                    {/*
                      Free values, beside the presets rather than instead of
                      them. A Pro Tip panel has to be built to a size and a
                      colour; with preset scales alone it could not be.
                    */}
                    <SizeField label="W" value={node.attrs.width} onChange={(v) => updateAttributes({ width: v })} />
                    <SizeField label="Min h" value={node.attrs.minHeight} onChange={(v) => updateAttributes({ minHeight: v })} />
                    <SizeField label="Pad" value={node.attrs.padValue} onChange={(v) => updateAttributes({ padValue: v })} />
                    <SizeField label="Corner" value={node.attrs.radiusValue} onChange={(v) => updateAttributes({ radiusValue: v })} />
                    <SizeField label="Border" value={node.attrs.borderWidth} onChange={(v) => updateAttributes({ borderWidth: v })} width="w-10" />
                    <ColourField label="Line" value={node.attrs.borderColor} onChange={(v) => updateAttributes({ borderColor: v })} />
                    <ColourField label="Fill" value={node.attrs.bgColor} onChange={(v) => updateAttributes({ bgColor: v })} />

                    <span className="h-3 w-px bg-studio-border" />

                    {/* Number, icon and label: what turns this box into a step
                        card or an info-strip cell without a new block type. */}
                    <input
                        type="text"
                        value={marker}
                        placeholder="01"
                        onChange={(e) => updateAttributes({ marker: e.target.value })}
                        title="A number or short marker"
                        className="w-9 rounded-md border border-studio-border px-1 py-0.5 text-[10px] tabular-nums outline-none"
                    />
                    <select
                        value={icon}
                        onChange={(e) => updateAttributes({ icon: e.target.value })}
                        title="Icon"
                        className="cursor-pointer rounded-md border border-studio-border bg-white px-1 py-0.5 text-[10px] outline-none"
                    >
                        {ICON_OPTIONS.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
                    </select>
                    <input
                        type="text"
                        value={label}
                        placeholder="Label…"
                        onChange={(e) => updateAttributes({ label: e.target.value })}
                        title="A short heading for this box"
                        className="w-24 rounded-md border border-studio-border px-1 py-0.5 text-[10px] outline-none"
                    />

                    <button
                        type="button"
                        onClick={() => deleteNode()}
                        title="Remove container"
                        className="rounded p-0.5 text-rose-600 transition-colors hover:bg-rose-50"
                    >
                        <Trash size={12} />
                    </button>
                </>
            </FloatingToolbar>
            {(marker || label || icon) && (
                <span className="blog-container-head" contentEditable={false}>
                    {marker ? <span className="blog-container-marker">{marker}</span> : null}
                    <BlockIcon name={icon} size={15} weight="bold" className="blog-container-icon" />
                    {label ? <span className="blog-container-label">{label}</span> : null}
                </span>
            )}
            <NodeViewContent />
        </NodeViewWrapper>
    );
}

export const Container = Node.create({
    name: 'container',
    group: 'block',
    content: 'block+',
    defining: true,
    // Stops Backspace at the start of the first child from dissolving the box.
    isolating: true,

    addAttributes() {
        const attr = (name, def) => ({
            default: def,
            parseHTML: (el) => el.getAttribute(`data-${name.toLowerCase()}`) || def,
            renderHTML: (a) => ({ [`data-${name.toLowerCase()}`]: a[name] }),
        });
        return {
            variant: attr('variant', 'card'),
            padding: attr('padding', 'md'),
            radius: attr('radius', 'md'),
            shadow: attr('shadow', 'none'),
            background: attr('background', 'none'),
            border: attr('border', 'none'),
            /**
             * A heading strip: a number, an icon and a label.
             *
             * These three turn the same box into both of the things the
             * reference designs are built from — a numbered step card
             * ("01 · sun · Sunset varmala") and an info-strip cell
             * ("place · DESTINATION"). Attributes on the box we already have,
             * rather than two new rigid block types that would each do one job.
             */
            marker: attr('marker', ''),
            icon: attr('icon', ''),
            label: attr('label', ''),
            /*
              Free-value overrides.

              The preset variants stay the fast path, but a Pro Tip panel needs
              to be built to a size and a colour the presets never anticipated —
              and with only preset scales it could not be. Empty means "use the
              preset", so nothing already saved moves.
            */
            width: attr('width', ''),
            minHeight: attr('minheight', ''),
            radiusValue: attr('radiusvalue', ''),
            padValue: attr('padvalue', ''),
            borderWidth: attr('borderwidth', ''),
            borderColor: attr('bordercolor', ''),
            bgColor: attr('bgcolor', ''),
        };
    },

    parseHTML() {
        return [{ tag: 'div[data-container]' }];
    },

    renderHTML({ HTMLAttributes, node }) {
        // Classes, not inline style: the sanitiser strips any style property not
        // on its allowlist, so the HTML cache has to carry layout as classes.
        return [
            'div',
            mergeAttributes(HTMLAttributes, {
                'data-container': '',
                class: `blog-container ${containerClasses(node.attrs)}`,
                ...(containerStyleString(node.attrs) ? { style: containerStyleString(node.attrs) } : {}),
            }),
            // The head is markup, not content, so it survives to the HTML cache
            // without becoming editable text inside the box.
            ...(node.attrs.marker || node.attrs.label
                ? [['span', { class: 'blog-container-head' },
                    ...(node.attrs.marker ? [['span', { class: 'blog-container-marker' }, node.attrs.marker]] : []),
                    ...(node.attrs.label ? [['span', { class: 'blog-container-label' }, node.attrs.label]] : []),
                ]]
                : []),
            0,
        ];
    },

    addNodeView() {
        return ReactNodeViewRenderer(ContainerView);
    },

    addCommands() {
        return {
            setContainer: (variant = 'card') => ({ commands }) =>
                commands.wrapIn(this.name, { variant }),
            unsetContainer: () => ({ commands }) => commands.lift(this.name),
        };
    },
});

export default Container;
