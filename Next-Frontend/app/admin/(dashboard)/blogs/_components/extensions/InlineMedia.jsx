'use client';

import { useRef, useState } from 'react';
import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer, NodeViewWrapper } from '@tiptap/react';
import {
    ArrowsOutSimple,
    TextAlignLeft,
    TextAlignCenter,
    TextAlignRight,
    Lightning,
    Trash,
    CheckCircle,
    XCircle,
} from '@phosphor-icons/react';
import FloatingToolbar from '../FloatingToolbar.jsx';
import {
    MEDIA_FRAMES, DEFAULT_FRAME, DEFAULT_FOCUS, frameById,
    MEDIA_RADII, DEFAULT_MEDIA_RADIUS, FOCUS_KEYWORD_XY, clampPercent, focusPosition,
} from '../layoutTokens.js';

// Alignment → wrapper classes shared by the editor node view and the public HTML.
const ALIGN_CLASS = {
    full: 'inline-media-full',
    center: 'inline-media-center',
    left: 'inline-media-left',
    right: 'inline-media-right',
};

function AlignBtn({ icon: Icon, active, onClick, title }) {
    return (
        <button
            type="button"
            onClick={onClick}
            title={title}
            className={`rounded-lg p-1.5 transition-colors cursor-pointer ${
                active ? 'bg-ink text-white shadow-sm' : 'text-ink-secondary hover:bg-ground-sunk'
            }`}
        >
            <Icon size={14} />
        </button>
    );
}

/** Tone and glyph move together, so a badge can never say "no" with a tick. */
function BadgeMark({ tone }) {
    if (tone === 'positive') return <CheckCircle size={12} weight="fill" />;
    if (tone === 'negative') return <XCircle size={12} weight="fill" />;
    return null;
}

function InlineMediaView({ node, updateAttributes, deleteNode, selected }) {
    const {
        src, alt, caption, subCaption = '', align, priority, aspectRatio, dominantColor, blurDataURL,
        frame = DEFAULT_FRAME, focus = DEFAULT_FOCUS, badge = '', badgeTone = 'neutral',
        radius = DEFAULT_MEDIA_RADIUS,
    } = node.attrs;

    const setAlign = (value) => () => updateAttributes({ align: value });
    const cropped = frame !== 'natural';

    // Live position while dragging. Committing on every mousemove would put a
    // hundred entries in the undo stack for one gesture, so the drag previews
    // locally and writes once on release — the same shape as the column resize.
    const [drag, setDrag] = useState(null);
    const figureRef = useRef(null);
    const position = drag
        ? `${drag.x}% ${drag.y}%`
        : focusPosition(node.attrs);

    /**
     * Drag the image to choose what stays in frame.
     *
     * Only once the image is selected, because an unselected image is dragged to
     * MOVE the block — ProseMirror's own drag. Requiring a click first keeps
     * both gestures available on the same element.
     */
    const startReposition = (event) => {
        if (!selected || event.button !== 0) return;
        // An image is repositionable whenever it is actually being cropped —
        // which is true for any frame, and ALSO for a natural-frame image in a
        // fixed-height row, where the row does the cropping. Reading the
        // computed style at mousedown covers both without the node view having
        // to know what kind of row it is sitting in.
        if (getComputedStyle(event.currentTarget).objectFit !== 'cover') return;
        event.preventDefault();
        event.stopPropagation();

        const rect = event.currentTarget.getBoundingClientRect();
        const startX = event.clientX;
        const startY = event.clientY;
        const fallback = FOCUS_KEYWORD_XY[focus] || FOCUS_KEYWORD_XY.center;
        const from = {
            x: clampPercent(node.attrs.focusX ?? fallback.x),
            y: clampPercent(node.attrs.focusY ?? fallback.y),
        };
        let latest = from;

        const onMove = (e) => {
            // Direct manipulation: dragging the image right reveals more of its
            // LEFT edge, so the position decreases.
            latest = {
                x: clampPercent(from.x - ((e.clientX - startX) / rect.width) * 100),
                y: clampPercent(from.y - ((e.clientY - startY) / rect.height) * 100),
            };
            setDrag(latest);
        };
        const onUp = () => {
            document.removeEventListener('mousemove', onMove);
            document.removeEventListener('mouseup', onUp);
            setDrag(null);
            updateAttributes({ focusX: latest.x, focusY: latest.y });
        };

        setDrag(from);
        document.addEventListener('mousemove', onMove);
        document.addEventListener('mouseup', onUp);
    };

    /**
     * A frame overrides the image's own aspect; `natural` falls back to the
     * intrinsic ratio the worker recorded, which is what reserves the box before
     * the bytes arrive and stops the article reflowing.
     */
    const imgStyle = {
        borderRadius: MEDIA_RADII.find((r) => r.id === radius)?.len,
        // Always written, not only for an explicit frame: a natural image in a
        // fixed-height row is cover-fitted by the ROW, and without this the drag
        // updated the stored position while the picture stayed put.
        // It is inert when nothing is being cropped.
        objectPosition: position,
        ...(cropped
            ? { aspectRatio: frameById(frame).ratio || undefined }
            : (aspectRatio ? { aspectRatio: String(aspectRatio) } : {})),
        ...(dominantColor ? { backgroundColor: dominantColor } : {}),
        ...(blurDataURL ? { backgroundImage: `url(${blurDataURL})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}),
    };

    return (
        <NodeViewWrapper
            className={`inline-media relative clear-both my-5 font-sans ${ALIGN_CLASS[align] || ALIGN_CLASS.center} ${selected ? 'rounded-xl ring-2 ring-accent' : ''}`}
            data-align={align}
            data-frame={frame}
            data-focus={focus}
            data-badge-tone={badgeTone}
            data-radius={radius}
        >
            <figure ref={figureRef} className="relative m-0 overflow-hidden rounded-xl border border-edge-subtle bg-ground">
                {badge ? (
                    <span className="inline-media-badge" data-badge contentEditable={false}>
                        <BadgeMark tone={badgeTone} />
                        {badge}
                    </span>
                ) : null}
                {src ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                        src={src}
                        alt={alt || ''}
                        style={imgStyle}
                        onMouseDown={startReposition}
                        draggable={false}
                        className={[
                            cropped ? 'h-full w-full object-cover' : 'h-auto w-full object-cover',
                            selected ? (drag ? 'cursor-grabbing' : 'cursor-grab') : '',
                        ].filter(Boolean).join(' ')}
                    />
                ) : (
                    <div className="flex h-40 items-center justify-center text-xs text-ink-muted font-medium">No image loaded</div>
                )}
                {(caption || subCaption) ? (
                    <figcaption className="border-t border-edge-subtle bg-white p-2 text-center text-xs italic text-ink-muted">
                        {caption}
                        {subCaption ? <span className="mt-0.5 block text-[10px] not-italic text-ink-muted">{subCaption}</span> : null}
                    </figcaption>
                ) : null}
            </figure>

            {/*
              The toolbar floats over the image rather than stacking under it.

              In a fixed-height row the cell's height is shared out by flex, so a
              toolbar in the flow took space from the picture: the selected image
              measured 220px where its unselected neighbour was 272px, and the
              editor stopped matching the published page just by clicking on it.
            */}
            <FloatingToolbar anchorRef={figureRef} open={selected}>
                <>
                    <AlignBtn icon={ArrowsOutSimple} active={align === 'full'} onClick={setAlign('full')} title="Full width" />
                    <AlignBtn icon={TextAlignCenter} active={align === 'center'} onClick={setAlign('center')} title="Center" />
                    <AlignBtn icon={TextAlignLeft} active={align === 'left'} onClick={setAlign('left')} title="Float left" />
                    <AlignBtn icon={TextAlignRight} active={align === 'right'} onClick={setAlign('right')} title="Float right" />
                    <span className="mx-1 h-4 w-px bg-ground-sunk" />

                    {/*
                      Shape, not pixels. Two images side by side only come out the
                      same size if something other than their own dimensions
                      decides — which is the whole reason this control exists.
                    */}
                    <select
                        value={frame}
                        onChange={(e) => updateAttributes({ frame: e.target.value })}
                        title="Crop this image to a shape"
                        className="cursor-pointer rounded-lg border border-edge-subtle bg-white px-1.5 py-1 text-[11px] text-ink-secondary outline-none"
                    >
                        {MEDIA_FRAMES.map((f) => (
                            <option key={f.id} value={f.id}>{f.label}</option>
                        ))}
                    </select>

                    {/* Only meaningful once something is being cropped away. The
                        position itself is set by dragging the image, so this is
                        a readout and a way back to centre, not a picker. */}
                    <button
                        type="button"
                        onClick={() => updateAttributes({ focusX: 50, focusY: 50 })}
                        title="Drag the image to reposition it · click to recentre"
                        className="rounded-lg border border-edge-subtle px-1.5 py-1 font-mono text-[10px] tabular-nums text-ink-secondary transition-colors hover:bg-ground-sunk"
                    >
                        {position}
                    </button>

                    <select
                        value={radius}
                        onChange={(e) => updateAttributes({ radius: e.target.value })}
                        title="Corner radius"
                        className="cursor-pointer rounded-lg border border-edge-subtle bg-white px-1.5 py-1 text-[11px] text-ink-secondary outline-none"
                    >
                        {MEDIA_RADII.map((r) => (
                            <option key={r.id} value={r.id}>{r.label}</option>
                        ))}
                    </select>

                    <span className="mx-1 h-4 w-px bg-ground-sunk" />

                    {/*
                      Caption and sub-caption.

                      The `caption` attribute existed and rendered on the public
                      page, but the toolbar had no field for it — so there was no
                      way to write one. That is why comparison figures were built
                      as two paragraphs stacked in a grid cell beside the image:
                      not a preference, a workaround for a missing input. The
                      sub-caption is the second of those two lines.
                    */}
                    <input
                        type="text"
                        value={caption}
                        placeholder="Caption…"
                        onChange={(e) => updateAttributes({ caption: e.target.value })}
                        title="A line under the image explaining it"
                        className="w-32 rounded-lg border border-edge-subtle px-1.5 py-1 text-[11px] outline-none"
                    />
                    <input
                        type="text"
                        value={subCaption}
                        placeholder="Sub-caption…"
                        onChange={(e) => updateAttributes({ subCaption: e.target.value })}
                        title="A quieter second line — a credit, a location, a lens"
                        className="w-28 rounded-lg border border-edge-subtle px-1.5 py-1 text-[11px] outline-none"
                    />

                    <span className="mx-1 h-4 w-px bg-ground-sunk" />

                    {/* A caption explains the image; a badge sits on it and
                        labels it. The comparison layouts need both. */}
                    <input
                        type="text"
                        value={badge}
                        placeholder="Badge…"
                        onChange={(e) => updateAttributes({ badge: e.target.value })}
                        title="A short label shown on top of the image"
                        className="w-24 rounded-lg border border-edge-subtle px-1.5 py-1 text-[11px] outline-none"
                    />
                    {badge ? (
                        <select
                            value={badgeTone}
                            onChange={(e) => updateAttributes({ badgeTone: e.target.value })}
                            title="Badge tone"
                            className="cursor-pointer rounded-lg border border-edge-subtle bg-white px-1.5 py-1 text-[11px] text-ink-secondary outline-none"
                        >
                            <option value="neutral">Neutral</option>
                            <option value="positive">Positive</option>
                            <option value="negative">Negative</option>
                        </select>
                    ) : null}

                    <span className="mx-1 h-4 w-px bg-ground-sunk" />
                    <button
                        type="button"
                        onClick={() => updateAttributes({ priority: !priority })}
                        className={`rounded-lg p-1.5 transition-colors cursor-pointer ${
                            priority ? 'bg-amber-600 text-white shadow-sm' : 'text-ink-secondary hover:bg-ground-sunk'
                        }`}
                        title="Priority load (LCP)"
                    >
                        <Lightning size={14} />
                    </button>
                    <button
                        type="button"
                        onClick={() => deleteNode()}
                        className="rounded-lg p-1.5 text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                        title="Remove image"
                    >
                        <Trash size={14} />
                    </button>
                </>
            </FloatingToolbar>
        </NodeViewWrapper>
    );
}

export const InlineMedia = Node.create({
    name: 'inlineMedia',
    group: 'block',
    atom: true,
    draggable: true,

    addAttributes() {
        return {
            mediaId: { default: null },
            src: { default: null },
            alt: { default: '' },
            caption: { default: '' },
            /*
              A second, quieter line under the caption. Authors were building it
              by stacking two paragraphs in a grid cell beside the image, which
              is why those pairs drifted: each was spaced by hand and one of them
              was saved with a line height that made the two overlap.
            */
            subCaption: { default: '' },
            align: { default: 'center' },
            priority: { default: false },
            width: { default: null },
            height: { default: null },
            aspectRatio: { default: null },
            dominantColor: { default: null },
            blurDataURL: { default: null },
            // Shape the image is cropped to, and which part survives the crop.
            // `natural` is exactly the old behaviour, so every existing post
            // renders byte-identically until an author changes it.
            frame: { default: DEFAULT_FRAME },
            focus: { default: DEFAULT_FOCUS },
            // An overlay pill. Tone picks the colour and the icon together
            // rather than offering two controls that can disagree — a red tick
            // helps nobody.
            badge: { default: '' },
            badgeTone: { default: 'neutral' },
            // Where the visible part of a crop sits, as percentages set by
            // dragging the image. Null means "fall back to the legacy keyword",
            // so nothing already saved shifts.
            focusX: { default: null },
            focusY: { default: null },
            radius: { default: DEFAULT_MEDIA_RADIUS },
        };
    },

    parseHTML() {
        return [{
            tag: 'figure[data-inline-media]',
            getAttrs: (el) => {
                const img = el.querySelector('img');
                const cap = el.querySelector('figcaption');
                return {
                    src: img?.getAttribute('src') || null,
                    alt: img?.getAttribute('alt') || '',
                    caption: el.querySelector('figcaption > .inline-media-caption')?.textContent
                        || cap?.textContent || '',
                    subCaption: el.querySelector('figcaption > .inline-media-subcaption')?.textContent || '',
                    align: el.getAttribute('data-align') || 'center',
                    frame: el.getAttribute('data-frame') || DEFAULT_FRAME,
                    focus: el.getAttribute('data-focus') || DEFAULT_FOCUS,
                    badge: el.querySelector('[data-badge]')?.textContent || '',
                    badgeTone: el.getAttribute('data-badge-tone') || 'neutral',
                    focusX: el.hasAttribute('data-focus-x') ? Number(el.getAttribute('data-focus-x')) : null,
                    focusY: el.hasAttribute('data-focus-y') ? Number(el.getAttribute('data-focus-y')) : null,
                    radius: el.getAttribute('data-radius') || DEFAULT_MEDIA_RADIUS,
                };
            },
        }];
    },

    renderHTML({ node }) {
        const {
            src, alt, caption, subCaption, align, priority, width, height, aspectRatio,
            dominantColor, blurDataURL, frame = DEFAULT_FRAME, focus = DEFAULT_FOCUS, badge='', badgeTone=''
        } = node.attrs;
        const cropped = frame !== 'natural';
        const styleParts = [`border-radius:${MEDIA_RADII.find((r) => r.id === node.attrs.radius)?.len || '0.75rem'}`];
        styleParts.push(`object-position:${focusPosition(node.attrs)}`);
        // A frame replaces the intrinsic ratio rather than adding to it; both
        // properties are already on the sanitiser's allowlist.
        if (cropped && frameById(frame).ratio) styleParts.push(`aspect-ratio:${frameById(frame).ratio}`);
        else if (!cropped && aspectRatio) styleParts.push(`aspect-ratio:${aspectRatio}`);
        if (dominantColor) styleParts.push(`background-color:${dominantColor}`);
        if (blurDataURL) styleParts.push(`background-image:url(${blurDataURL})`, 'background-size:cover', 'background-position:center');
        const imgAttrs = {
            src,
            alt: alt || '',
            loading: priority ? 'eager' : 'lazy',
            ...(priority ? { fetchpriority: 'high' } : {}),
            // Intrinsic width/height reserve the box and stop the article
            // reflowing — but on a cropped frame they would fight the aspect
            // ratio, so the frame owns the shape instead.
            ...(width && !cropped ? { width } : {}),
            ...(height && !cropped ? { height } : {}),
            ...(styleParts.length ? { style: styleParts.join(';') } : {}),
        };
        const children = [['img', imgAttrs]];
        if (badge) children.unshift(['span', { 'data-badge': '', class: 'inline-media-badge' }, badge]);
        if (caption || subCaption) {
            const capKids = [];
            if (caption) capKids.push(['span', { class: 'inline-media-caption' }, caption]);
            if (subCaption) capKids.push(['span', { class: 'inline-media-subcaption' }, subCaption]);
            children.push(['figcaption', {}, ...capKids]);
        }
        return [
            'figure',
            mergeAttributes({
                'data-inline-media': '',
                'data-align': align,
                'data-frame': frame,
                'data-focus': focus,
                'data-badge-tone': badgeTone,
                'data-radius': node.attrs.radius || DEFAULT_MEDIA_RADIUS,
                ...(node.attrs.focusX != null ? { 'data-focus-x': node.attrs.focusX } : {}),
                ...(node.attrs.focusY != null ? { 'data-focus-y': node.attrs.focusY } : {}),
                class: `inline-media ${ALIGN_CLASS[align] || ALIGN_CLASS.center}`,
            }),
            ...children,
        ];
    },

    addNodeView() {
        return ReactNodeViewRenderer(InlineMediaView);
    },

    addCommands() {
        return {
            setInlineMedia: (attrs) => ({ commands }) => commands.insertContent({ type: this.name, attrs }),
        };
    },
});

export default InlineMedia;
